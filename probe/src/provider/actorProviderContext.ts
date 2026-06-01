import fs from "node:fs/promises";
import path from "node:path";

import { buildRelationshipGoalFrame, type GoalFrame } from "../npc/goals/goalStack.js";
import { getActorProfile } from "../npc/profiles.js";
import {
  deriveRelationshipActionContextSignal,
  deriveRelationshipActionContextSignals,
  selectDominantRelationshipActionContextSignal,
  type RelationshipActionContextSignal
} from "../npc/relationships/actionContextSignal.js";
import {
  listIncomingRelationshipEdges,
  listRelationshipEdges
} from "../npc/relationships/relationshipStore.js";
import {
  projectRelationshipScores,
  type RelationshipEdge
} from "../npc/relationships/relationshipLedger.js";
import type { ActorActionSkillRecord } from "../runtime/actorWorkspaceStore.js";
import { getActorWorkspacePaths } from "../runtime/actorWorkspacePaths.js";
import { retrieveActorMemoryForObjective } from "../memory/actorMemory.js";
import type { JsonValue } from "./inputSnapshot.js";

type JsonRecord = { [key: string]: JsonValue };

export type ActorProviderContextOptions = {
  actorWorkspaceRootDir: string;
  actorId: string;
  activeActionSkills: readonly ActorActionSkillRecord[];
  /** Social-cycle stages inject constitutional soul/life goal packets explicitly. */
  actorSoul?: JsonValue;
  actorLifeGoal?: JsonValue;
  memory?: readonly string[];
  currentObjective?: {
    objective_id?: string;
    objective_category?: string;
    item_names?: readonly string[];
    action_skill_ids?: readonly string[];
  };
  limits?: {
    evidence?: number;
    reviews?: number;
    candidates?: number;
    memory?: number;
    relationships?: number;
  };
  goalStack?: JsonValue;
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
  const generatedTrial =
    value.generated_trial &&
    typeof value.generated_trial === "object" &&
    !Array.isArray(value.generated_trial)
      ? (value.generated_trial as JsonRecord)
      : null;
  return {
    ref: relativeArtifactRef(actorDir, filePath),
    proposal_id: typeof value.proposal_id === "string" ? value.proposal_id : null,
    skill_id: typeof value.skill_id === "string" ? value.skill_id : null,
    status: typeof value.status === "string" ? value.status : null,
    generated_lifecycle_status:
      typeof value.generated_lifecycle_status === "string"
        ? value.generated_lifecycle_status
        : null,
    generated_trial_status:
      generatedTrial && typeof generatedTrial.status === "string" ? generatedTrial.status : null,
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
      : [],
    relationship_event_proposals: Array.isArray(value.relationship_event_proposals)
      ? value.relationship_event_proposals.map((proposal) =>
          compactRelationshipEventProposal(proposal)
        )
      : []
  };
}

function compactRelationshipEventProposal(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      status: "invalid_shape"
    };
  }

  const record = value as JsonRecord;
  return {
    status: "proposal_only_until_guarded_application",
    kind: typeof record.kind === "string" ? record.kind : null,
    target_actor_id:
      typeof record.target_actor_id === "string" ? record.target_actor_id : null,
    summary: typeof record.summary === "string" ? record.summary : null,
    evidence_refs: Array.isArray(record.evidence_refs) ? record.evidence_refs : []
  };
}

function compactRelationship(edge: RelationshipEdge): JsonRecord {
  const scores = projectRelationshipScores(edge);
  const actionContextSignal = deriveRelationshipActionContextSignal(edge);

  return {
    from_actor_id: edge.from_actor_id,
    to_actor_id: edge.to_actor_id,
    trust: edge.trust,
    trust_score: scores.trust_score,
    obligation: edge.obligation,
    obligation_score: scores.obligation_score,
    dependency: edge.dependency,
    dependency_score: scores.dependency_score,
    friction: edge.friction,
    friction_score: scores.friction_score,
    familiarity: edge.familiarity,
    familiarity_score: scores.familiarity_score,
    recent_events: edge.recent_events.slice(-4),
    action_context_signal: actionContextSignal
      ? compactRelationshipContextSignal(actionContextSignal)
      : null
  };
}

function compactRelationshipContextSignal(signal: RelationshipActionContextSignal): JsonRecord {
  return {
    actor_id: signal.actor_id,
    target_actor_id: signal.target_actor_id,
    kind: signal.kind,
    priority: signal.priority,
    summary: signal.summary,
    evidence_refs: [...signal.evidence_refs],
    derived_from: signal.derived_from,
    action_boundary: signal.action_boundary,
    active_action_skill_required: signal.active_action_skill_required,
    role_contract_boundary: signal.role_contract_boundary
  };
}

function compactGoalFrame(frame: GoalFrame): JsonRecord {
  return Object.fromEntries(
    Object.entries(frame).filter(([, value]) => value !== undefined)
  ) as JsonRecord;
}

function withRelationshipGoal(
  goalStack: JsonValue | undefined,
  signal: RelationshipActionContextSignal | null
): JsonValue | undefined {
  if (!signal) {
    return goalStack;
  }

  const relationshipGoal = compactGoalFrame(buildRelationshipGoalFrame(signal));

  if (!goalStack || typeof goalStack !== "object" || Array.isArray(goalStack)) {
    return { relationship_goal: relationshipGoal };
  }

  return {
    ...goalStack,
    relationship_goal: relationshipGoal
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
    memory: options.limits?.memory ?? 8,
    relationships: options.limits?.relationships ?? 6
  };
  const paths = getActorWorkspacePaths(options.actorWorkspaceRootDir, options.actorId);
  const actorRecord = await readJsonIfExists<JsonRecord>(paths.actorFile);
  const actorProfile =
    actorRecord && typeof actorRecord.actor_profile === "object" && actorRecord.actor_profile !== null
      ? actorRecord.actor_profile
      : getActorProfile(options.actorId);
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
  const relationshipEdges = tail(
    await listRelationshipEdges(options.actorWorkspaceRootDir, options.actorId),
    limits.relationships
  );
  const incomingRelationshipEdges = tail(
    await listIncomingRelationshipEdges(options.actorWorkspaceRootDir, options.actorId),
    limits.relationships
  );
  const relationships = relationshipEdges.map(compactRelationship);
  const incomingRelationships = incomingRelationshipEdges.map(compactRelationship);
  const relationshipContextSignalRecords =
    deriveRelationshipActionContextSignals(relationshipEdges);
  const incomingRelationshipContextSignalRecords =
    deriveRelationshipActionContextSignals(incomingRelationshipEdges);
  const relationshipContextSignals = relationshipContextSignalRecords.map(
    compactRelationshipContextSignal
  );
  const incomingRelationshipContextSignals = incomingRelationshipContextSignalRecords.map(
    compactRelationshipContextSignal
  );
  const goalStack = withRelationshipGoal(
    options.goalStack,
    selectDominantRelationshipActionContextSignal(relationshipContextSignalRecords)
  );
  const typedMemory = await retrieveActorMemoryForObjective(
    options.actorWorkspaceRootDir,
    options.actorId,
    {
      objectiveId: options.currentObjective?.objective_id,
      objectiveCategory: options.currentObjective?.objective_category,
      itemNames: options.currentObjective?.item_names,
      actionSkillIds: options.currentObjective?.action_skill_ids,
      limit: limits.memory
    }
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
    actor_profile: actorProfile,
    ...(options.actorSoul ? { actor_soul: options.actorSoul } : {}),
    ...(options.actorLifeGoal ? { actor_life_goal: options.actorLifeGoal } : {}),
    ...(goalStack ? { goal_stack: goalStack } : {}),
    relationships,
    incoming_relationships: incomingRelationships,
    relationship_context_signals: relationshipContextSignals,
    incoming_relationship_context_signals: incomingRelationshipContextSignals,
    active_action_skills: activeActionSkills,
    candidate_action_skills: candidates,
    recent_evidence: recentEvidence,
    recent_reviews: recentReviews,
    typed_memory: typedMemory as unknown as JsonValue,
    memory: tail(options.memory ?? [], limits.memory),
    rules: {
      providers_propose_only: true,
      runtime_verifies_success: true,
      active_action_skill_required: true,
      relationship_context_changes_intent_only: true,
      relationship_context_does_not_grant_tools: true,
      do_not_claim_progress_without_runtime_evidence: true
    }
  };
}
