import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getSeedActionSkill } from "../gameplay/seedSkills/registry.js";
import type { SeedActionSkillOwnershipRecord } from "../skills/ownership.js";
import {
  getActorActionSkillRecordPath,
  getActorWorkspacePaths,
  type ActorActionSkillStatusPath
} from "./actorWorkspacePaths.js";

export type ActorActionSkillSourceKind = "seed" | "derived" | "manual" | "learned";

export type ActorActionSkillStatus =
  | "draft"
  | "candidate"
  | "active"
  | "superseded"
  | "retired"
  | "rejected";

/**
 * Actor-owned action skill authority as persisted in the actor workspace.
 *
 * @remarks Active records are runtime authority for primitive exposure. Candidate
 * and generated fields are evidence and review material until lifecycle
 * promotion writes an active record.
 */
export type ActorActionSkillRecord = {
  schema: "actor-action-skill/v1";
  skill_id: string;
  owner_actor_id: string;
  source_kind: ActorActionSkillSourceKind;
  status: ActorActionSkillStatus;
  created_at: string;
  updated_at: string;
  required_primitives: string[];
  preconditions: string[];
  success_verifier: string;
  known_failure_modes: string[];
  evidence_refs: string[];
  review_refs: string[];
  supersession?: {
    superseded_by_skill_id: string;
    reason: string;
    evidence_refs: string[];
  };
  legacy_source_ref?: string;
  generated_source?: string;
  generated_source_language?: "typescript";
  generated_source_ref?: string;
  generated_candidate_ref?: string;
  generated_input_schema?: Record<string, unknown>;
  generated_helper_allowlist?: string[];
  generated_timeout_ms?: number;
  generated_verifier?: Record<string, unknown>;
  notes?: string;
};

type ActionSkillLibraryIndex = {
  schema: "action-skill-library/v1";
  owner_actor_id: string;
  initialized_at: string;
  active: string[];
  candidates: string[];
  retired: string[];
  rejected: string[];
};

/**
 * Atomically writes JSON artifacts so runtime evidence and action skill records
 * are not left half-written when a probe exits or reconnect handling interrupts
 * the process.
 */
export async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`
  );
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function toStatusPath(status: ActorActionSkillStatus): ActorActionSkillStatusPath {
  return status;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

async function readActionSkillLibraryIndex(
  rootDir: string,
  actorId: string,
  initializedAt: string
): Promise<ActionSkillLibraryIndex> {
  const paths = getActorWorkspacePaths(rootDir, actorId);

  try {
    const index = JSON.parse(await fs.readFile(paths.actionSkills.indexFile, "utf8")) as Record<
      string,
      unknown
    >;
    return {
      schema: "action-skill-library/v1",
      owner_actor_id: actorId,
      initialized_at:
        typeof index.initialized_at === "string" ? index.initialized_at : initializedAt,
      active: stringArray(index.active),
      candidates: stringArray(index.candidates),
      retired: stringArray(index.retired),
      rejected: stringArray(index.rejected)
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        schema: "action-skill-library/v1",
        owner_actor_id: actorId,
        initialized_at: initializedAt,
        active: [],
        candidates: [],
        retired: [],
        rejected: []
      };
    }

    throw error;
  }
}

export function materializeSeedActionSkillRecord(
  seedRecord: SeedActionSkillOwnershipRecord,
  initializedAt: string
): ActorActionSkillRecord {
  const seedActionSkill = getSeedActionSkill(seedRecord.skill_id);
  const supersession = seedRecord.supersession
    ? {
        superseded_by_skill_id: seedRecord.supersession.supersededBySkillId,
        reason: seedRecord.supersession.reason,
        evidence_refs: []
      }
    : undefined;

  return {
    schema: "actor-action-skill/v1",
    skill_id: seedRecord.skill_id,
    owner_actor_id: seedRecord.owner_actor_id,
    source_kind: seedRecord.source_kind,
    status: seedRecord.status,
    created_at: initializedAt,
    updated_at: initializedAt,
    required_primitives: [...seedActionSkill.primitiveIds],
    preconditions: [...seedActionSkill.preconditions],
    success_verifier: `runtime verifier for ${seedRecord.skill_id}`,
    known_failure_modes: [],
    evidence_refs: [],
    review_refs: [],
    ...(supersession ? { supersession } : {}),
    notes: seedActionSkill.summary
  };
}

/**
 * Persists a single action skill record under the status-specific actor
 * workspace directory.
 */
export async function writeActorActionSkillRecord(
  rootDir: string,
  record: ActorActionSkillRecord
) {
  const filePath = getActorActionSkillRecordPath(
    rootDir,
    record.owner_actor_id,
    toStatusPath(record.status),
    record.skill_id
  );
  await writeJson(filePath, record);
  return filePath;
}

/**
 * Updates the lightweight library index used to present the actor's action
 * skill surface without scanning every status directory.
 */
export async function addActorActionSkillToLibraryIndex(input: {
  rootDir: string;
  actorId: string;
  status: ActorActionSkillStatusPath;
  skillId: string;
  updatedAt?: string;
}) {
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const paths = getActorWorkspacePaths(input.rootDir, input.actorId);
  const index = await readActionSkillLibraryIndex(input.rootDir, input.actorId, updatedAt);
  const key =
    input.status === "active"
      ? "active"
      : input.status === "rejected"
        ? "rejected"
        : input.status === "retired" || input.status === "superseded"
          ? "retired"
          : "candidates";

  await writeJson(paths.actionSkills.indexFile, {
    ...index,
    initialized_at: index.initialized_at,
    [key]: uniqueSorted([...index[key], input.skillId])
  });
}

/**
 * Lists actor action skill records for one lifecycle bucket.
 *
 * Missing directories are treated as an empty bucket because fresh workspaces are
 * initialized incrementally during probes.
 */
export async function listActorActionSkillRecords(
  rootDir: string,
  actorId: string,
  status: ActorActionSkillStatusPath
) {
  const dir = path.dirname(getActorActionSkillRecordPath(rootDir, actorId, status, "placeholder"));

  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const records = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .map((entry) => readJson<ActorActionSkillRecord>(path.join(dir, entry)))
  );

  return records;
}

/**
 * Declares the actor workspace directories that must exist before runtime
 * artifacts, memory, relationship state, PlanBeads, and action skill records are
 * written.
 */
export function getRequiredActorWorkspaceDirs(rootDir: string, actorId: string) {
  const paths = getActorWorkspacePaths(rootDir, actorId);

  return [
    paths.actorDir,
    paths.actionSkills.rootDir,
    paths.actionSkills.activeDir,
    paths.actionSkills.candidatesDir,
    paths.actionSkills.directTrialsDir,
    paths.actionSkills.retiredDir,
    paths.actionSkills.rejectedDir,
    paths.memoryDir,
    paths.memory.workingDir,
    paths.memory.episodicDir,
    paths.memory.semanticDir,
    paths.memory.proceduralDir,
    paths.memory.socialDir,
    paths.memory.beliefsDir,
    paths.memory.guardrailsDir,
    paths.memory.indexDir,
    paths.relationshipsDir,
    paths.settlementDir,
    paths.evidenceDir,
    paths.reviewsDir,
    paths.providerInputsDir,
    paths.providerOutputsDir,
    paths.goalsDir,
    path.join(paths.goalsDir, "life"),
    paths.strategicGoalsDir,
    paths.cycleGoalsDir,
    paths.judgmentsDir,
    paths.worldEventsDir,
    paths.planBeads.rootDir,
    paths.planBeads.beadsDir,
    paths.planBeads.dependenciesDir,
    paths.planBeads.eventsDir,
    paths.planBeads.historyDir,
    paths.planBeads.indexesDir
  ];
}
