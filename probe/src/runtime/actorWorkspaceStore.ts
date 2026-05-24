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
  notes?: string;
};

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
    paths.worldEventsDir
  ];
}
