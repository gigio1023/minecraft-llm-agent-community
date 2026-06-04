import path from "node:path";

import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../actorWorkspacePaths.js";
import { writeJson } from "../actorWorkspaceStore.js";
import type { JsonValue } from "../../provider/inputSnapshot.js";

export type ActorEvidenceCategory =
  | "turn"
  | "tool_attempt"
  | "recipe_trial"
  | "verification_failure"
  | "timeout"
  | "fake_progress_rejection"
  | "provider_snapshot"
  | "review_input"
  | "world_state_scan"
  | "action_parameter_contract_failure"
  | "action_skill_candidate_trial"
  | "retry_constraint_blocked"
  | "context_checkpoint";

/**
 * Actor workspace evidence record for facts that should survive transcript
 * compaction and post-run review.
 *
 * @remarks These records are diagnostic artifacts, not provider claims. Physical
 * progress still needs verifier-backed world, inventory, position, container, or
 * transcript evidence.
 */
export type ActorEvidenceRecord = {
  schema: "actor-evidence/v1";
  evidence_id: string;
  actor_id: string;
  category: ActorEvidenceCategory;
  created_at: string;
  turn_id?: string;
  target?: string;
  pre_position?: JsonValue;
  post_position?: JsonValue;
  tool_attempt?: JsonValue;
  verifier_reason?: string;
  missing_delta?: JsonValue;
  data?: JsonValue;
};

type FakeProgressEvidenceInput = {
  actor_id: string;
  turn_id: string;
  target: string;
  pre_position: JsonValue;
  post_position: JsonValue;
  tool_attempt: JsonValue;
  verifier_reason: string;
  missing_delta: JsonValue;
  created_at?: string;
};

/**
 * Creates the evidence artifact used when a tool looked successful in prose but
 * the verifier could not find the required state delta.
 */
export function buildFakeProgressRejectionEvidence(
  input: FakeProgressEvidenceInput
): ActorEvidenceRecord {
  const createdAt = input.created_at ?? new Date().toISOString();

  return {
    schema: "actor-evidence/v1",
    evidence_id: `fake-progress-${input.turn_id}`,
    actor_id: input.actor_id,
    category: "fake_progress_rejection",
    created_at: createdAt,
    turn_id: input.turn_id,
    target: input.target,
    pre_position: input.pre_position,
    post_position: input.post_position,
    tool_attempt: input.tool_attempt,
    verifier_reason: input.verifier_reason,
    missing_delta: input.missing_delta
  };
}

/**
 * Writes evidence under the owning actor workspace and returns the artifact path
 * that other records can cite.
 */
export async function writeActorEvidenceRecord(
  actorWorkspaceRootDir: string,
  evidence: ActorEvidenceRecord
) {
  const paths = getActorWorkspacePaths(actorWorkspaceRootDir, evidence.actor_id);
  const filePath = path.join(
    paths.evidenceDir,
    `${sanitizeWorkspaceFileId(evidence.evidence_id)}.json`
  );
  await writeJson(filePath, evidence);
  return filePath;
}
