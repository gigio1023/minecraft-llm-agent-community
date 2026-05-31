import fs from "node:fs/promises";
import path from "node:path";

import {
  getActorPlanBeadEventLogPath,
  getActorPlanBeadHistorySnapshotPath,
  getActorPlanBeadRecordPath,
  getActorWorkspacePaths
} from "../../actorWorkspacePaths.js";
import { writeJson } from "../../actorWorkspaceStore.js";
import { listJsonFilesSorted, readJsonIfExists } from "../goalJsonStore.js";
import type {
  ActorPlanBead,
  PlanBeadDependency,
  PlanBeadMetadataValue
} from "./types.js";
import {
  assertValidActorPlanBead,
  assertValidPlanBeadDependency
} from "./validators.js";

export type PlanBeadEvent = {
  schema: "plan-bead-event/v1";
  actor_id: string;
  bead_id: string;
  event_id: string;
  event_type: string;
  summary: string;
  evidence_refs: string[];
  created_at: string;
  snapshot_ref?: string;
  metadata?: Record<string, PlanBeadMetadataValue>;
};

export type PlanBeadHistorySnapshot = {
  schema: "plan-bead-history/v1";
  actor_id: string;
  bead_id: string;
  sequence: number | string;
  kind: string;
  captured_at: string;
  bead: ActorPlanBead;
  evidence_refs: string[];
  event_id?: string;
};

export type PlanBeadGraphSnapshot = {
  schema: "actor-plan-bead-graph-snapshot/v1";
  actor_id: string;
  beads: ActorPlanBead[];
  dependencies: PlanBeadDependency[];
};

const authorityKeys = new Set([
  "args",
  "primitive_args",
  "primitive_id",
  "primitiveId",
  "allowed_primitive_ids",
  "allowedPrimitiveIds",
  "action_skill_id",
  "actionSkillId",
  "allowed_action_skill_ids",
  "allowedActionSkillIds",
  "actor_soul_patch",
  "life_goal_patch",
  "create_runtime_retry_constraint",
  "clear_runtime_retry_constraint",
  "retry_constraint_override",
  "runtime_retry_constraint",
  "physical_progress_claim"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertStringArray(value: unknown, pathLabel: string, errors: string[]) {
  if (!Array.isArray(value) || !value.every((entry) => nonEmptyString(entry))) {
    errors.push(`${pathLabel} must be a string array`);
  }
}

function assertMetadataValue(value: unknown, pathLabel: string, errors: string[]) {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (Array.isArray(value) && value.every((entry) => typeof entry === "string"))
  ) {
    return;
  }

  errors.push(`${pathLabel} must be a string, finite number, boolean, or string array`);
}

function collectAuthorityKeyErrors(value: unknown, pathLabel: string, errors: string[]) {
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      collectAuthorityKeyErrors(entry, `${pathLabel}[${index}]`, errors);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const childPath = `${pathLabel}.${key}`;
    if (authorityKeys.has(key)) {
      errors.push(`${childPath} must not appear in PlanBead store records`);
    }
    collectAuthorityKeyErrors(entry, childPath, errors);
  }
}

function assertActorScopedRecord(
  record: { actor_id: string },
  actorId: string,
  label: string
) {
  if (record.actor_id !== actorId) {
    throw new Error(`${label} actor_id mismatch: expected ${actorId}, got ${record.actor_id}`);
  }
}

function assertBeadScopedRecord(
  record: { actor_id: string; bead_id: string },
  actorId: string,
  beadId: string,
  label: string
) {
  assertActorScopedRecord(record, actorId, label);
  if (record.bead_id !== beadId) {
    throw new Error(`${label} bead_id mismatch: expected ${beadId}, got ${record.bead_id}`);
  }
}

function assertValidPlanBeadEvent(value: unknown): PlanBeadEvent {
  const errors: string[] = [];
  if (!isRecord(value)) {
    throw new Error("Invalid PlanBeadEvent: PlanBeadEvent must be an object");
  }

  collectAuthorityKeyErrors(value, "PlanBeadEvent", errors);

  if (value.schema !== "plan-bead-event/v1") {
    errors.push("PlanBeadEvent.schema must be plan-bead-event/v1");
  }
  for (const key of ["actor_id", "bead_id", "event_id", "event_type", "summary", "created_at"] as const) {
    if (!nonEmptyString(value[key])) {
      errors.push(`PlanBeadEvent.${key} must be a non-empty string`);
    }
  }
  assertStringArray(value.evidence_refs, "PlanBeadEvent.evidence_refs", errors);

  if (value.snapshot_ref !== undefined && !nonEmptyString(value.snapshot_ref)) {
    errors.push("PlanBeadEvent.snapshot_ref must be a non-empty string when present");
  }

  if (value.metadata !== undefined) {
    if (!isRecord(value.metadata)) {
      errors.push("PlanBeadEvent.metadata must be an object when present");
    } else {
      for (const [key, entry] of Object.entries(value.metadata)) {
        assertMetadataValue(entry, `PlanBeadEvent.metadata.${key}`, errors);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid PlanBeadEvent: ${errors.join("; ")}`);
  }

  return value as PlanBeadEvent;
}

function assertValidPlanBeadHistorySnapshot(value: unknown): PlanBeadHistorySnapshot {
  const errors: string[] = [];
  if (!isRecord(value)) {
    throw new Error("Invalid PlanBeadHistorySnapshot: snapshot must be an object");
  }

  collectAuthorityKeyErrors(value, "PlanBeadHistorySnapshot", errors);

  if (value.schema !== "plan-bead-history/v1") {
    errors.push("PlanBeadHistorySnapshot.schema must be plan-bead-history/v1");
  }
  for (const key of ["actor_id", "bead_id", "kind", "captured_at"] as const) {
    if (!nonEmptyString(value[key])) {
      errors.push(`PlanBeadHistorySnapshot.${key} must be a non-empty string`);
    }
  }
  if (
    !(
      (typeof value.sequence === "number" && Number.isInteger(value.sequence) && value.sequence >= 0) ||
      nonEmptyString(value.sequence)
    )
  ) {
    errors.push("PlanBeadHistorySnapshot.sequence must be a non-negative integer or non-empty string");
  }
  assertStringArray(value.evidence_refs, "PlanBeadHistorySnapshot.evidence_refs", errors);
  if (value.event_id !== undefined && !nonEmptyString(value.event_id)) {
    errors.push("PlanBeadHistorySnapshot.event_id must be a non-empty string when present");
  }

  let bead: ActorPlanBead | null = null;
  try {
    bead = assertValidActorPlanBead(value.bead);
  } catch (error) {
    errors.push((error as Error).message);
  }

  if (bead) {
    if (bead.actor_id !== value.actor_id) {
      errors.push("PlanBeadHistorySnapshot.bead.actor_id must match snapshot actor_id");
    }
    if (bead.bead_id !== value.bead_id) {
      errors.push("PlanBeadHistorySnapshot.bead.bead_id must match snapshot bead_id");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid PlanBeadHistorySnapshot: ${errors.join("; ")}`);
  }

  return value as PlanBeadHistorySnapshot;
}

async function appendJsonLine(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function readJsonLines<T>(
  filePath: string,
  validate: (value: unknown) => T
): Promise<T[]> {
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const records: T[] = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (line.trim().length === 0) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(
        `Invalid JSONL record in ${filePath}:${index + 1}: ${(error as Error).message}`
      );
    }
    records.push(validate(parsed));
  }

  return records;
}

function historySequenceFileId(sequence: number | string) {
  if (typeof sequence === "number") {
    return String(sequence).padStart(4, "0");
  }
  return sequence;
}

export async function writeActorPlanBead(rootDir: string, bead: ActorPlanBead) {
  const validBead = assertValidActorPlanBead(bead);
  const filePath = getActorPlanBeadRecordPath(
    rootDir,
    validBead.actor_id,
    validBead.bead_id
  );
  await writeJson(filePath, validBead);
  return filePath;
}

export async function readActorPlanBead(
  rootDir: string,
  actorId: string,
  beadId: string
) {
  const filePath = getActorPlanBeadRecordPath(rootDir, actorId, beadId);
  const record = await readJsonIfExists<unknown>(filePath);
  if (record === null) {
    return null;
  }

  const bead = assertValidActorPlanBead(record);
  assertBeadScopedRecord(bead, actorId, beadId, "ActorPlanBead");
  return bead;
}

export async function listActorPlanBeads(rootDir: string, actorId: string) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const files = await listJsonFilesSorted(paths.planBeads.beadsDir);
  const beads: ActorPlanBead[] = [];

  for (const filePath of files) {
    const record = await readJsonIfExists<unknown>(filePath);
    if (record === null) {
      continue;
    }
    const bead = assertValidActorPlanBead(record);
    assertActorScopedRecord(bead, actorId, "ActorPlanBead");
    beads.push(bead);
  }

  return beads;
}

export async function appendPlanBeadDependency(
  rootDir: string,
  dependency: PlanBeadDependency
) {
  const validDependency = assertValidPlanBeadDependency(dependency);
  const paths = getActorWorkspacePaths(rootDir, validDependency.actor_id);
  await appendJsonLine(paths.planBeads.dependenciesFile, validDependency);
  return paths.planBeads.dependenciesFile;
}

export async function listPlanBeadDependencies(rootDir: string, actorId: string) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const dependencies = await readJsonLines(
    paths.planBeads.dependenciesFile,
    assertValidPlanBeadDependency
  );

  for (const dependency of dependencies) {
    assertActorScopedRecord(dependency, actorId, "PlanBeadDependency");
  }

  return dependencies;
}

export async function appendPlanBeadEvent(rootDir: string, event: PlanBeadEvent) {
  const validEvent = assertValidPlanBeadEvent(event);
  const filePath = getActorPlanBeadEventLogPath(
    rootDir,
    validEvent.actor_id,
    validEvent.bead_id
  );
  await appendJsonLine(filePath, validEvent);
  return filePath;
}

export async function listPlanBeadEvents(
  rootDir: string,
  actorId: string,
  beadId: string
) {
  const filePath = getActorPlanBeadEventLogPath(rootDir, actorId, beadId);
  const events = await readJsonLines(filePath, assertValidPlanBeadEvent);

  for (const event of events) {
    assertBeadScopedRecord(event, actorId, beadId, "PlanBeadEvent");
  }

  return events;
}

export async function writePlanBeadHistorySnapshot(
  rootDir: string,
  snapshot: PlanBeadHistorySnapshot
) {
  const validSnapshot = assertValidPlanBeadHistorySnapshot(snapshot);
  const filePath = getActorPlanBeadHistorySnapshotPath(
    rootDir,
    validSnapshot.actor_id,
    validSnapshot.bead_id,
    historySequenceFileId(validSnapshot.sequence),
    validSnapshot.kind
  );
  await writeJson(filePath, validSnapshot);
  return filePath;
}

/**
 * Rebuilds graph state only from authoritative current records and append-only
 * dependency logs; ready-cache is an index and is intentionally ignored here.
 */
export async function loadPlanBeadGraphSnapshot(
  rootDir: string,
  actorId: string
): Promise<PlanBeadGraphSnapshot> {
  return {
    schema: "actor-plan-bead-graph-snapshot/v1",
    actor_id: actorId,
    beads: await listActorPlanBeads(rootDir, actorId),
    dependencies: await listPlanBeadDependencies(rootDir, actorId)
  };
}
