import fs from "node:fs/promises";
import path from "node:path";

import type { ActorActionSkillRecord } from "../runtime/actorWorkspaceStore.js";
import { getActorWorkspacePaths } from "../runtime/actorWorkspacePaths.js";
import type { JsonValue } from "./inputSnapshot.js";

type JsonRecord = { [key: string]: JsonValue };

export type ActorProviderContextOptions = {
  actorWorkspaceRootDir: string;
  actorId: string;
  activeActionSkills: readonly ActorActionSkillRecord[];
  memory?: readonly string[];
  limits?: {
    evidence?: number;
    reviews?: number;
    candidates?: number;
    memory?: number;
  };
};

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function listJsonFiles(dir: string) {
  let entries: string[];

  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return entries
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => path.join(dir, entry));
}

function relativeArtifactRef(actorDir: string, filePath: string) {
  return path.relative(actorDir, filePath);
}

function tail<T>(values: readonly T[], limit: number) {
  return values.slice(Math.max(0, values.length - limit));
}

function compactActiveActionSkill(record: ActorActionSkillRecord): JsonRecord {
  return {
    skill_id: record.skill_id,
    source_kind: record.source_kind,
    status: record.status,
    required_primitives: [...record.required_primitives],
    preconditions: [...record.preconditions],
    success_verifier: record.success_verifier,
    known_failure_modes: [...record.known_failure_modes],
    notes: record.notes ?? null
  };
}

function compactCandidate(actorDir: string, filePath: string, value: JsonRecord): JsonRecord {
  return {
    ref: relativeArtifactRef(actorDir, filePath),
    proposal_id: typeof value.proposal_id === "string" ? value.proposal_id : null,
    skill_id: typeof value.skill_id === "string" ? value.skill_id : null,
    status: typeof value.status === "string" ? value.status : null,
    task_intent: typeof value.task_intent === "string" ? value.task_intent : null,
    required_primitives: Array.isArray(value.required_primitives)
      ? value.required_primitives
      : [],
    known_failure_modes: Array.isArray(value.known_failure_modes)
      ? value.known_failure_modes
      : [],
    evidence_refs: Array.isArray(value.evidence_refs) ? value.evidence_refs : []
  };
}

function compactEvidence(actorDir: string, filePath: string, value: JsonRecord): JsonRecord {
  return {
    ref: relativeArtifactRef(actorDir, filePath),
    evidence_id: typeof value.evidence_id === "string" ? value.evidence_id : null,
    category: typeof value.category === "string" ? value.category : null,
    turn_id: typeof value.turn_id === "string" ? value.turn_id : null,
    target: typeof value.target === "string" ? value.target : null,
    verifier_reason:
      typeof value.verifier_reason === "string" ? value.verifier_reason : null,
    tool_attempt: value.tool_attempt ?? null,
    missing_delta: value.missing_delta ?? null
  };
}

function compactReview(actorDir: string, filePath: string, value: JsonRecord): JsonRecord {
  return {
    ref: relativeArtifactRef(actorDir, filePath),
    review_id: typeof value.review_id === "string" ? value.review_id : null,
    findings: Array.isArray(value.findings) ? value.findings : [],
    candidate_proposals: Array.isArray(value.candidate_proposals)
      ? value.candidate_proposals
      : []
  };
}

async function readCompactedRecords(
  actorDir: string,
  dir: string,
  limit: number,
  compact: (actorDir: string, filePath: string, value: JsonRecord) => JsonRecord,
  options: { excludeDirNames?: readonly string[] } = {}
) {
  const files = await listJsonFiles(dir);
  const filtered = files.filter((filePath) => {
    const segments = path.relative(dir, filePath).split(path.sep);
    return !segments.some((segment) => options.excludeDirNames?.includes(segment));
  });
  const selected = tail(filtered, limit);
  const records: JsonRecord[] = [];

  for (const filePath of selected) {
    const value = await readJsonIfExists<JsonRecord>(filePath);

    if (value) {
      records.push(compact(actorDir, filePath, value));
    }
  }

  return records;
}

export async function buildActorProviderContext(
  options: ActorProviderContextOptions
): Promise<JsonRecord> {
  const limits = {
    evidence: options.limits?.evidence ?? 6,
    reviews: options.limits?.reviews ?? 3,
    candidates: options.limits?.candidates ?? 5,
    memory: options.limits?.memory ?? 8
  };
  const paths = getActorWorkspacePaths(options.actorWorkspaceRootDir, options.actorId);
  const actorRecord = await readJsonIfExists<JsonRecord>(paths.actorFile);
  const activeActionSkills = options.activeActionSkills
    .filter((record) => record.owner_actor_id === options.actorId && record.status === "active")
    .map(compactActiveActionSkill)
    .sort((left, right) =>
      String(left.skill_id ?? "").localeCompare(String(right.skill_id ?? ""))
    );
  const candidates = await readCompactedRecords(
    paths.actorDir,
    paths.actionSkills.candidatesDir,
    limits.candidates,
    compactCandidate
  );
  const recentEvidence = await readCompactedRecords(
    paths.actorDir,
    paths.evidenceDir,
    limits.evidence,
    compactEvidence
  );
  const recentReviews = await readCompactedRecords(
    paths.actorDir,
    paths.reviewsDir,
    limits.reviews,
    compactReview,
    { excludeDirNames: ["queue"] }
  );

  return {
    schema: "actor-provider-context/v1",
    actor: {
      actor_id: options.actorId,
      role_id:
        actorRecord && typeof actorRecord.role_id === "string"
          ? actorRecord.role_id
          : null
    },
    active_action_skills: activeActionSkills,
    candidate_action_skills: candidates,
    recent_evidence: recentEvidence,
    recent_reviews: recentReviews,
    memory: tail(options.memory ?? [], limits.memory),
    rules: {
      providers_propose_only: true,
      runtime_verifies_success: true,
      active_action_skill_required: true,
      do_not_claim_progress_without_runtime_evidence: true
    }
  };
}
