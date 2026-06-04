import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../../actorWorkspacePaths.js";
import { writeJson } from "../../actorWorkspaceStore.js";
import type {
  ActorPlanBead,
  PlanBeadDependency,
  PlanBeadOperation
} from "./types.js";
import { planBeadKinds } from "./types.js";
import { assertValidPlanBeadOperation } from "./validators.js";
import {
  appendPlanBeadDependency,
  appendPlanBeadEvent,
  listActorPlanBeads,
  listPlanBeadDependencies,
  readActorPlanBead,
  writeActorPlanBead,
  writePlanBeadHistorySnapshot
} from "./store.js";

export type PlanBeadOperationResult = {
  schema: "plan-bead-operation-result/v1";
  operation_result_id: string;
  actor_id: string;
  cycle_id: string;
  turn_id: string;
  op: PlanBeadOperation["op"] | "invalid";
  status: "accepted" | "rejected";
  reason: string;
  bead_id?: string;
  dependency_ref?: string;
  evidence_refs: string[];
  operation?: PlanBeadOperation;
  created_at: string;
  before_checkpoint_version?: number;
  after_checkpoint_version?: number;
};

export type ApplyPlanBeadOperationsResult = {
  results: PlanBeadOperationResult[];
  result_refs: string[];
};

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalizes harmless provider transport noise before validation.
 *
 * @remarks The runtime, not the provider, assigns ids for create operations.
 * Dropping provider-supplied create.bead_id preserves the authority boundary
 * while keeping live LLM outputs usable when they include an empty placeholder.
 */
function normalizeRawPlanBeadOperation(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = { ...value };

  if (normalized.op === "create") {
    delete normalized.bead_id;
  }

  if (normalized.op === "create" && isRecord(normalized.patch)) {
    const patch = { ...normalized.patch };
    if (!(planBeadKinds as readonly unknown[]).includes(patch.kind)) {
      patch.kind = "concern";
    }
    normalized.patch = patch;
  }

  if (normalized.op === "update_notes" && isRecord(normalized.patch)) {
    const patch = { ...normalized.patch };
    if (Array.isArray(patch.blocked) && !Array.isArray(patch.blockers)) {
      patch.blockers = patch.blocked;
    }
    delete patch.blocked;
    normalized.patch = patch;
  }

  return normalized;
}

function withExpectedCheckpointVersion(
  operation: PlanBeadOperation,
  expectedCheckpointVersion: number
): PlanBeadOperation {
  return {
    ...operation,
    expected_checkpoint_version: expectedCheckpointVersion
  } as PlanBeadOperation;
}

function resultId(input: {
  cycleId: string;
  turnId: string;
  index: number;
}) {
  return `plan-bead-op-${input.turnId}-${String(input.index + 1).padStart(2, "0")}`;
}

function operationBeadId(operation: PlanBeadOperation) {
  if ("bead_id" in operation && typeof operation.bead_id === "string") {
    return operation.bead_id;
  }
  if (operation.op === "add_dependency") {
    return operation.patch.bead_id;
  }
  return undefined;
}

function dependencyRef(dependency: PlanBeadDependency) {
  return `plan-bead-dependency:${dependency.actor_id}:${dependency.bead_id}:${dependency.type}:${dependency.depends_on_bead_id}`;
}

function resolveActorRelativeRef(input: {
  rootDir: string;
  actorId: string;
  ref: string;
}) {
  if (input.ref.trim().length === 0) {
    throw new Error("PlanBead operation evidence ref cannot be empty");
  }
  if (path.isAbsolute(input.ref)) {
    throw new Error(`PlanBead operation evidence ref must be actor-relative: ${input.ref}`);
  }

  const paths = getActorWorkspacePaths(input.rootDir, input.actorId);
  const normalized = path.normalize(input.ref);
  if (normalized === "." || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`PlanBead operation evidence ref escapes actor workspace: ${input.ref}`);
  }

  const filePath = path.resolve(paths.actorDir, normalized);
  const relative = path.relative(paths.actorDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`PlanBead operation evidence ref escapes actor workspace: ${input.ref}`);
  }
  return filePath;
}

async function assertActorRelativeRefsExist(input: {
  rootDir: string;
  actorId: string;
  refs: readonly string[];
  label: string;
}) {
  if (input.refs.length === 0) {
    throw new Error(`${input.label} are required`);
  }

  for (const ref of input.refs) {
    const filePath = resolveActorRelativeRef({
      rootDir: input.rootDir,
      actorId: input.actorId,
      ref
    });
    try {
      await fs.access(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`${input.label} missing actor artifact: ${ref}`);
      }
      throw error;
    }
  }
}

function isStrongSatisfiedCloseEvidenceRef(ref: string) {
  return (
    ref.startsWith("evidence/") ||
    ref.startsWith("relationships/") ||
    ref.startsWith("reviews/applied-relationship-proposals/") ||
    ref.startsWith("settlement/")
  );
}

function assertSatisfiedCloseHasStrongEvidence(operation: PlanBeadOperation) {
  if (
    operation.op !== "set_status" ||
    operation.patch.status !== "closed" ||
    operation.patch.close_kind !== "satisfied"
  ) {
    return;
  }

  if (!operation.evidence_refs.some(isStrongSatisfiedCloseEvidenceRef)) {
    throw new Error(
      "closing a satisfied PlanBead requires runtime evidence, guarded relationship evidence, or settlement evidence refs"
    );
  }
}

async function writeOperationResult(input: {
  rootDir: string;
  actorId: string;
  result: PlanBeadOperationResult;
}) {
  const paths = getActorWorkspacePaths(input.rootDir, input.actorId);
  const filePath = path.join(
    paths.planBeads.eventsDir,
    "operation-results",
    `${sanitizeWorkspaceFileId(input.result.operation_result_id)}.json`
  );
  await writeJson(filePath, input.result);
  return path.relative(paths.actorDir, filePath);
}

function rejectResult(input: {
  operationResultId: string;
  actorId: string;
  cycleId: string;
  turnId: string;
  operation?: PlanBeadOperation;
  op?: PlanBeadOperation["op"] | "invalid";
  reason: string;
  createdAt: string;
  evidenceRefs?: readonly string[];
}): PlanBeadOperationResult {
  return {
    schema: "plan-bead-operation-result/v1",
    operation_result_id: input.operationResultId,
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    turn_id: input.turnId,
    op: input.op ?? input.operation?.op ?? "invalid",
    status: "rejected",
    reason: input.reason,
    ...(input.operation ? { operation: input.operation } : {}),
    bead_id: input.operation ? operationBeadId(input.operation) : undefined,
    evidence_refs: [...(input.evidenceRefs ?? input.operation?.evidence_refs ?? [])],
    created_at: input.createdAt
  };
}

function acceptedResult(input: {
  operationResultId: string;
  actorId: string;
  cycleId: string;
  turnId: string;
  operation: PlanBeadOperation;
  reason: string;
  createdAt: string;
  beadId?: string;
  dependencyRef?: string;
  beforeVersion?: number;
  afterVersion?: number;
}): PlanBeadOperationResult {
  return {
    schema: "plan-bead-operation-result/v1",
    operation_result_id: input.operationResultId,
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    turn_id: input.turnId,
    op: input.operation.op,
    status: "accepted",
    reason: input.reason,
    operation: input.operation,
    bead_id: input.beadId ?? operationBeadId(input.operation),
    dependency_ref: input.dependencyRef,
    evidence_refs: [...input.operation.evidence_refs],
    created_at: input.createdAt,
    before_checkpoint_version: input.beforeVersion,
    after_checkpoint_version: input.afterVersion
  };
}

function assertCheckpointVersion(operation: PlanBeadOperation, bead: ActorPlanBead) {
  if (
    operation.expected_checkpoint_version !== undefined &&
    operation.expected_checkpoint_version !== bead.checkpoint.version
  ) {
    throw new Error(
      `stale checkpoint: expected ${operation.expected_checkpoint_version}, current ${bead.checkpoint.version}`
    );
  }
}

function mergeEvidenceRefs(bead: ActorPlanBead, operation: PlanBeadOperation) {
  return uniqueStrings([
    ...bead.refs.evidence_refs,
    ...bead.checkpoint.evidence_refs,
    ...operation.evidence_refs
  ]);
}

function touchBead(input: {
  bead: ActorPlanBead;
  operation: PlanBeadOperation;
  cycleId: string;
  now: string;
  patch: Partial<ActorPlanBead>;
}): ActorPlanBead {
  const evidenceRefs = mergeEvidenceRefs(input.bead, input.operation);
  return {
    ...input.bead,
    ...input.patch,
    refs: {
      ...input.bead.refs,
      evidence_refs: evidenceRefs
    },
    checkpoint: {
      ...input.bead.checkpoint,
      version: input.bead.checkpoint.version + 1,
      updated_at: input.now,
      last_touched_cycle_id: input.cycleId,
      evidence_refs: evidenceRefs,
      ...(input.patch.status === "closed" && "patch" in input.operation && "close_kind" in input.operation.patch
        ? {
            close_kind: input.operation.patch.close_kind,
            close_reason: input.operation.patch.close_reason
          }
        : {})
    }
  };
}

function graphHasPath(input: {
  fromBeadId: string;
  toBeadId: string;
  dependencies: readonly PlanBeadDependency[];
}) {
  const edges = new Map<string, string[]>();
  for (const dependency of input.dependencies) {
    edges.set(dependency.bead_id, [
      ...(edges.get(dependency.bead_id) ?? []),
      dependency.depends_on_bead_id
    ]);
  }

  const visited = new Set<string>();
  const stack = [input.fromBeadId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === input.toBeadId) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    stack.push(...(edges.get(current) ?? []));
  }
  return false;
}

function normalizedComparableText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function createOperationDuplicatesOpenBead(input: {
  operation: Extract<PlanBeadOperation, { op: "create" }>;
  beads: readonly ActorPlanBead[];
}) {
  const title = normalizedComparableText(input.operation.patch.title);
  const description = normalizedComparableText(input.operation.patch.description);
  return input.beads.find((bead) =>
    bead.status !== "closed" &&
    normalizedComparableText(bead.title) === title &&
    normalizedComparableText(bead.description) === description
  );
}

async function writeAcceptedBeadArtifacts(input: {
  rootDir: string;
  bead: ActorPlanBead;
  operation: PlanBeadOperation;
  resultRef: string;
  resultId: string;
  now: string;
}) {
  await writeActorPlanBead(input.rootDir, input.bead);
  await appendPlanBeadEvent(input.rootDir, {
    schema: "plan-bead-event/v1",
    actor_id: input.bead.actor_id,
    bead_id: input.bead.bead_id,
    event_id: `${input.resultId}-event`,
    event_type: `operation_${input.operation.op}`,
    summary: `Accepted PlanBead operation ${input.operation.op}`,
    evidence_refs: [...input.operation.evidence_refs],
    created_at: input.now,
    snapshot_ref: input.resultRef,
    metadata: {
      operation_result_ref: input.resultRef,
      operation: input.operation.op,
      status: "accepted"
    }
  });
  await writePlanBeadHistorySnapshot(input.rootDir, {
    schema: "plan-bead-history/v1",
    actor_id: input.bead.actor_id,
    bead_id: input.bead.bead_id,
    sequence: input.bead.checkpoint.version,
    kind: `operation-${input.operation.op}`,
    captured_at: input.now,
    bead: input.bead,
    evidence_refs: [...input.operation.evidence_refs],
    event_id: `${input.resultId}-event`
  });
}

async function applyOneOperation(input: {
  rootDir: string;
  actorId: string;
  lifeGoalId: string;
  cycleId: string;
  turnId: string;
  operation: PlanBeadOperation;
  operationResultId: string;
  now: string;
}): Promise<PlanBeadOperationResult> {
  const operation = assertValidPlanBeadOperation(input.operation);
  if (operation.actor_id !== input.actorId) {
    throw new Error(`operation actor_id mismatch: expected ${input.actorId}, got ${operation.actor_id}`);
  }
  await assertActorRelativeRefsExist({
    rootDir: input.rootDir,
    actorId: input.actorId,
    refs: operation.evidence_refs,
    label: "operation evidence_refs"
  });

  if (operation.op === "create") {
    const duplicate = createOperationDuplicatesOpenBead({
      operation,
      beads: await listActorPlanBeads(input.rootDir, input.actorId)
    });
    if (duplicate) {
      throw new Error(`duplicate open PlanBead create rejected: ${duplicate.bead_id}`);
    }
    const beadId = `bead-${randomUUID()}`;
    const bead: ActorPlanBead = {
      schema: "actor-plan-bead/v1",
      bead_id: beadId,
      actor_id: input.actorId,
      life_goal_id: input.lifeGoalId,
      kind: operation.patch.kind,
      status: "open",
      priority: operation.patch.priority,
      title: operation.patch.title,
      description: operation.patch.description,
      design_notes: "Created by guarded PlanBead operation; context only, not executable authority.",
      acceptance_criteria: {
        evidence_required: [...operation.patch.acceptance_evidence_required],
        non_physical_resolution_allowed: true
      },
      notes: {
        completed: [],
        in_progress: [],
        blockers: [],
        next: [...operation.patch.notes_next],
        key_decisions: []
      },
      labels: [],
      metadata: {},
      refs: {
        evidence_refs: [...operation.evidence_refs],
        memory_refs: [],
        judgment_refs: [],
        cycle_goal_refs: [],
        relationship_refs: [],
        world_event_refs: [],
        action_skill_refs: []
      },
      checkpoint: {
        version: 1,
        created_at: input.now,
        updated_at: input.now,
        last_touched_cycle_id: input.cycleId,
        evidence_refs: [...operation.evidence_refs]
      },
      assertion_policy: {
        bead_is_context_not_authority: true,
        physical_success_requires_current_evidence: true
      }
    };
    const result = acceptedResult({
      operationResultId: input.operationResultId,
      actorId: input.actorId,
      cycleId: input.cycleId,
      turnId: input.turnId,
      operation,
      reason: "created actor-owned PlanBead from guarded operation",
      createdAt: input.now,
      beadId,
      afterVersion: bead.checkpoint.version
    });
    const resultRef = await writeOperationResult({
      rootDir: input.rootDir,
      actorId: input.actorId,
      result
    });
    await writeAcceptedBeadArtifacts({
      rootDir: input.rootDir,
      bead,
      operation,
      resultRef,
      resultId: input.operationResultId,
      now: input.now
    });
    return result;
  }

  if (operation.op === "update_notes") {
    const existing = await readActorPlanBead(input.rootDir, input.actorId, operation.bead_id);
    if (!existing) {
      throw new Error(`unknown bead ${operation.bead_id}`);
    }
    assertCheckpointVersion(operation, existing);
    const updated = touchBead({
      bead: existing,
      operation,
      cycleId: input.cycleId,
      now: input.now,
      patch: {
        notes: {
          ...existing.notes,
          ...operation.patch
        }
      }
    });
    const result = acceptedResult({
      operationResultId: input.operationResultId,
      actorId: input.actorId,
      cycleId: input.cycleId,
      turnId: input.turnId,
      operation,
      reason: "updated PlanBead notes with evidence-linked operation",
      createdAt: input.now,
      beforeVersion: existing.checkpoint.version,
      afterVersion: updated.checkpoint.version
    });
    const resultRef = await writeOperationResult({ rootDir: input.rootDir, actorId: input.actorId, result });
    await writeAcceptedBeadArtifacts({
      rootDir: input.rootDir,
      bead: updated,
      operation,
      resultRef,
      resultId: input.operationResultId,
      now: input.now
    });
    return result;
  }

  if (operation.op === "set_status") {
    const existing = await readActorPlanBead(input.rootDir, input.actorId, operation.bead_id);
    if (!existing) {
      throw new Error(`unknown bead ${operation.bead_id}`);
    }
    assertCheckpointVersion(operation, existing);
    assertSatisfiedCloseHasStrongEvidence(operation);
    const updated = touchBead({
      bead: existing,
      operation,
      cycleId: input.cycleId,
      now: input.now,
      patch: {
        status: operation.patch.status
      }
    });
    const result = acceptedResult({
      operationResultId: input.operationResultId,
      actorId: input.actorId,
      cycleId: input.cycleId,
      turnId: input.turnId,
      operation,
      reason: `set PlanBead status to ${operation.patch.status}`,
      createdAt: input.now,
      beforeVersion: existing.checkpoint.version,
      afterVersion: updated.checkpoint.version
    });
    const resultRef = await writeOperationResult({ rootDir: input.rootDir, actorId: input.actorId, result });
    await writeAcceptedBeadArtifacts({
      rootDir: input.rootDir,
      bead: updated,
      operation,
      resultRef,
      resultId: input.operationResultId,
      now: input.now
    });
    return result;
  }

  await assertActorRelativeRefsExist({
    rootDir: input.rootDir,
    actorId: input.actorId,
    refs: operation.patch.evidence_refs,
    label: "dependency evidence_refs"
  });
  const existingBeads = await listActorPlanBeads(input.rootDir, input.actorId);
  const beadIds = new Set(existingBeads.map((bead) => bead.bead_id));
  if (!beadIds.has(operation.patch.bead_id)) {
    throw new Error(`unknown dependency source bead ${operation.patch.bead_id}`);
  }
  if (!beadIds.has(operation.patch.depends_on_bead_id)) {
    throw new Error(`unknown dependency target bead ${operation.patch.depends_on_bead_id}`);
  }
  const existingDependencies = await listPlanBeadDependencies(input.rootDir, input.actorId);
  const dependency: PlanBeadDependency = {
    schema: "actor-plan-bead-dependency/v1",
    actor_id: input.actorId,
    bead_id: operation.patch.bead_id,
    depends_on_bead_id: operation.patch.depends_on_bead_id,
    type: operation.patch.type,
    rationale: operation.patch.rationale,
    evidence_refs: [...operation.patch.evidence_refs],
    created_at: input.now
  };
  if (
    graphHasPath({
      fromBeadId: dependency.depends_on_bead_id,
      toBeadId: dependency.bead_id,
      dependencies: [...existingDependencies, dependency]
    })
  ) {
    throw new Error("dependency cycle rejected");
  }
  await appendPlanBeadDependency(input.rootDir, dependency);
  const result = acceptedResult({
    operationResultId: input.operationResultId,
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    operation,
    reason: "added PlanBead dependency",
    createdAt: input.now,
    beadId: dependency.bead_id,
    dependencyRef: dependencyRef(dependency)
  });
  await writeOperationResult({ rootDir: input.rootDir, actorId: input.actorId, result });
  return result;
}

export async function applyPlanBeadOperations(input: {
  rootDir: string;
  actorId: string;
  lifeGoalId: string;
  cycleId: string;
  turnId: string;
  operations: readonly unknown[];
  now?: string;
}): Promise<ApplyPlanBeadOperationsResult> {
  const now = input.now ?? new Date().toISOString();
  const results: PlanBeadOperationResult[] = [];
  const resultRefs: string[] = [];
  const currentBatchCheckpointVersions = new Map<string, number>();

  for (const [index, rawOperation] of input.operations.entries()) {
    const normalizedRawOperation = normalizeRawPlanBeadOperation(rawOperation);
    const operationResultId = resultId({
      cycleId: input.cycleId,
      turnId: input.turnId,
      index
    });
    let result: PlanBeadOperationResult;
    try {
      const parsedOperation = assertValidPlanBeadOperation(normalizedRawOperation);
      const beadId = operationBeadId(parsedOperation);
      const batchCheckpointVersion = beadId
        ? currentBatchCheckpointVersions.get(beadId)
        : undefined;
      const operation =
        beadId &&
        batchCheckpointVersion !== undefined &&
        parsedOperation.expected_checkpoint_version !== undefined &&
        parsedOperation.expected_checkpoint_version < batchCheckpointVersion
          ? withExpectedCheckpointVersion(parsedOperation, batchCheckpointVersion)
          : parsedOperation;
      result = await applyOneOperation({
        rootDir: input.rootDir,
        actorId: input.actorId,
        lifeGoalId: input.lifeGoalId,
        cycleId: input.cycleId,
        turnId: input.turnId,
        operation,
        operationResultId,
        now
      });
      if (result.status === "accepted" && result.bead_id && result.after_checkpoint_version) {
        currentBatchCheckpointVersions.set(result.bead_id, result.after_checkpoint_version);
      }
    } catch (error) {
      const operation = (() => {
        try {
          return assertValidPlanBeadOperation(normalizedRawOperation);
        } catch {
          return undefined;
        }
      })();
      result = rejectResult({
        operationResultId,
        actorId: input.actorId,
        cycleId: input.cycleId,
        turnId: input.turnId,
        operation,
        op: operation?.op ?? "invalid",
        reason: error instanceof Error ? error.message : String(error),
        createdAt: now
      });
      const ref = await writeOperationResult({
        rootDir: input.rootDir,
        actorId: input.actorId,
        result
      });
      resultRefs.push(ref);
      results.push(result);
      continue;
    }

    const paths = getActorWorkspacePaths(input.rootDir, input.actorId);
    const ref = path.relative(
      paths.actorDir,
      path.join(
        paths.planBeads.eventsDir,
        "operation-results",
        `${sanitizeWorkspaceFileId(result.operation_result_id)}.json`
      )
    );
    resultRefs.push(ref);
    results.push(result);
  }

  return {
    results,
    result_refs: resultRefs
  };
}
