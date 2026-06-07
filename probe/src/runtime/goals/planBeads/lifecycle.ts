import type { SocialPrimitiveAttemptStatus } from "../../socialCycleProgress.js";
import type { ActorPlanBead, PlanBeadOperation } from "./types.js";

type PlanBeadEvidenceAction = {
  kind: string;
  primitive_id?: string;
  action_skill_id?: string;
  parameters?: Record<string, unknown>;
  args?: Record<string, unknown>;
};

type EvidenceSignal =
  | {
      kind: "deposit_shared";
      itemName?: string;
    }
  | {
      kind: "inspect_chest";
    }
  | {
      kind: "crafted";
      itemName?: string;
    };

export type PlanBeadLifecycleDerivationInput = {
  actorId: string;
  cycleId: string;
  turnId: string;
  action: PlanBeadEvidenceAction;
  toolStatuses: readonly SocialPrimitiveAttemptStatus[];
  evidenceRefs: readonly string[];
  beads: readonly ActorPlanBead[];
};

export type PlanBeadCurrentStateLifecycleInput = {
  actorId: string;
  cycleId: string;
  turnId: string;
  currentState: {
    shared_storage?: {
      status?: string;
      items?: readonly { name: string; count: number }[];
      evidence_refs?: readonly string[];
    };
  };
  beads: readonly ActorPlanBead[];
};

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function actionItemName(action: PlanBeadEvidenceAction) {
  return readString(action.parameters?.itemName) ??
    readString(action.parameters?.targetItem) ??
    readString(action.parameters?.recipe) ??
    readString(action.args?.itemName) ??
    readString(action.args?.targetItem) ??
    readString(action.args?.recipe);
}

function successfulSignal(input: {
  action: PlanBeadEvidenceAction;
  toolStatus: SocialPrimitiveAttemptStatus;
}): EvidenceSignal | null {
  if (input.toolStatus.tool === "deposit_shared" && input.toolStatus.status === "deposited") {
    return { kind: "deposit_shared", itemName: actionItemName(input.action) };
  }
  if (input.toolStatus.tool === "inspect_chest" && input.toolStatus.status === "inspected") {
    return { kind: "inspect_chest" };
  }
  if (
    (input.toolStatus.tool === "craft_item" || input.toolStatus.tool === "craft_with_table") &&
    input.toolStatus.status === "crafted"
  ) {
    return { kind: "crafted", itemName: actionItemName(input.action) };
  }
  return null;
}

function runtimeEvidenceRefs(refs: readonly string[]) {
  return refs.filter((ref) => ref.startsWith("evidence/") || ref.startsWith("settlement/"));
}

function normalizeSignalKey(value: string) {
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function metadataStringList(bead: ActorPlanBead, key: string) {
  const value = bead.metadata[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }
  return [];
}

function signalKeys(signal: EvidenceSignal) {
  switch (signal.kind) {
    case "deposit_shared":
      return uniqueStrings([
        "deposit_shared",
        ...(signal.itemName ? [`deposit_shared:${signal.itemName}`] : [])
      ]).map(normalizeSignalKey);
    case "inspect_chest":
      return ["inspect_chest"].map(normalizeSignalKey);
    case "crafted":
      return uniqueStrings([
        "crafted",
        ...(signal.itemName ? [`crafted:${signal.itemName}`] : [])
      ]).map(normalizeSignalKey);
  }
}

function beadHasLifecycleSignal(bead: ActorPlanBead, metadataKey: string, signal: EvidenceSignal) {
  const configured = metadataStringList(bead, metadataKey).map(normalizeSignalKey);
  if (configured.length === 0) {
    return false;
  }
  const actual = signalKeys(signal);
  return actual.some((key) => configured.includes(key));
}

export function matchPlanBeadAcceptanceEvidence(input: {
  bead: ActorPlanBead;
  signal: EvidenceSignal;
}): "close_satisfied" | "update_incomplete" | "no_match" {
  // Lifecycle mutation must be opt-in structured metadata, not PlanBead prose
  // parsing. Use lifecycle_close_signals / lifecycle_incomplete_signals values
  // like "deposit_shared", "deposit_shared:oak_log", "inspect_chest", or
  // "crafted:crafting_table".
  if (beadHasLifecycleSignal(input.bead, "lifecycle_incomplete_signals", input.signal)) {
    return "update_incomplete";
  }
  if (beadHasLifecycleSignal(input.bead, "lifecycle_close_signals", input.signal)) {
    return "close_satisfied";
  }
  return "no_match";
}

function completedNote(signal: EvidenceSignal) {
  switch (signal.kind) {
    case "deposit_shared":
      return `Runtime evidence deposited${signal.itemName ? ` ${signal.itemName}` : ""} into shared storage.`;
    case "inspect_chest":
      return "Runtime evidence inspected shared chest access.";
    case "crafted":
      return `Runtime evidence crafted${signal.itemName ? ` ${signal.itemName}` : " an item"}.`;
  }
}

function incompleteNote(signal: EvidenceSignal) {
  switch (signal.kind) {
    case "inspect_chest":
      return "Runtime evidence verified chest inspection, but contribution/deposit evidence is still missing.";
    default:
      return completedNote(signal);
  }
}

function closeOperation(input: {
  actorId: string;
  bead: ActorPlanBead;
  signal: EvidenceSignal;
  evidenceRefs: readonly string[];
}): PlanBeadOperation {
  return {
    schema: "plan-bead-operation/v1",
    actor_id: input.actorId,
    op: "set_status",
    bead_id: input.bead.bead_id,
    rationale: `Runtime evidence matched PlanBead acceptance: ${completedNote(input.signal)}`,
    evidence_refs: [...input.evidenceRefs],
    confidence: "observed",
    expected_checkpoint_version: input.bead.checkpoint.version,
    patch: {
      status: "closed",
      close_kind: "satisfied",
      close_reason: completedNote(input.signal)
    }
  };
}

function updateOperation(input: {
  actorId: string;
  bead: ActorPlanBead;
  signal: EvidenceSignal;
  evidenceRefs: readonly string[];
}): PlanBeadOperation {
  return {
    schema: "plan-bead-operation/v1",
    actor_id: input.actorId,
    op: "update_notes",
    bead_id: input.bead.bead_id,
    rationale: `Runtime evidence partially matched PlanBead acceptance: ${incompleteNote(input.signal)}`,
    evidence_refs: [...input.evidenceRefs],
    confidence: "observed",
    expected_checkpoint_version: input.bead.checkpoint.version,
    patch: {
      in_progress: uniqueStrings([
        ...input.bead.notes.in_progress,
        incompleteNote(input.signal)
      ])
    }
  };
}

/**
 * Derives small PlanBead lifecycle operations from verified turn evidence.
 *
 * @remarks This turns runtime evidence into state-continuity updates only. The
 * returned operations still pass through the guarded PlanBead applier before
 * the actor workspace changes.
 */
export function derivePlanBeadLifecycleOperationsFromTurnEvidence(
  input: PlanBeadLifecycleDerivationInput
): PlanBeadOperation[] {
  const evidenceRefs = runtimeEvidenceRefs(input.evidenceRefs);
  if (evidenceRefs.length === 0) {
    return [];
  }
  const signals = input.toolStatuses
    .map((toolStatus) => successfulSignal({ action: input.action, toolStatus }))
    .filter((signal): signal is EvidenceSignal => signal !== null);
  if (signals.length === 0) {
    return [];
  }

  const operations: PlanBeadOperation[] = [];
  const touched = new Set<string>();
  for (const bead of input.beads) {
    if (bead.status === "closed" || touched.has(bead.bead_id)) {
      continue;
    }
    for (const signal of signals) {
      const match = matchPlanBeadAcceptanceEvidence({ bead, signal });
      if (match === "close_satisfied") {
        operations.push(closeOperation({
          actorId: input.actorId,
          bead,
          signal,
          evidenceRefs
        }));
        touched.add(bead.bead_id);
        break;
      }
      if (match === "update_incomplete") {
        operations.push(updateOperation({
          actorId: input.actorId,
          bead,
          signal,
          evidenceRefs
        }));
        touched.add(bead.bead_id);
        break;
      }
    }
  }
  return operations;
}

/**
 * Derives closure operations from consolidated current state, primarily for
 * shared-storage contribution evidence that may be recognized after the turn
 * artifact has been compacted.
 */
export function derivePlanBeadLifecycleOperationsFromCurrentState(
  input: PlanBeadCurrentStateLifecycleInput
): PlanBeadOperation[] {
  const sharedStorage = input.currentState.shared_storage;
  const evidenceRefs = runtimeEvidenceRefs(sharedStorage?.evidence_refs ?? []);
  if (
    sharedStorage?.status !== "contributed" ||
    evidenceRefs.length === 0
  ) {
    return [];
  }

  const depositedItems = (sharedStorage.items ?? [])
    .filter((item) => item.count > 0)
    .map((item) => item.name);
  const signals: EvidenceSignal[] = depositedItems.length > 0
    ? depositedItems.map((itemName) => ({ kind: "deposit_shared", itemName }))
    : [{ kind: "deposit_shared" }];
  const operations: PlanBeadOperation[] = [];
  const touched = new Set<string>();

  for (const bead of input.beads) {
    if (bead.status === "closed" || touched.has(bead.bead_id)) {
      continue;
    }
    for (const signal of signals) {
      const match = matchPlanBeadAcceptanceEvidence({ bead, signal });
      if (match === "close_satisfied") {
        operations.push(closeOperation({
          actorId: input.actorId,
          bead,
          signal,
          evidenceRefs
        }));
        touched.add(bead.bead_id);
        break;
      }
    }
  }

  return operations;
}
