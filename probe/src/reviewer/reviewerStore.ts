/**
 * Persistence helpers for async reviewer artifacts.
 *
 * @remarks Reviewer records are evidence and recommendations. Runtime action
 * skill authority still flows through actor workspace lifecycle records.
 */
import path from "node:path";

import type { RelationshipEventKind } from "../npc/relationships/relationshipLedger.js";
import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../runtime/actorWorkspacePaths.js";
import { writeJson } from "../runtime/actorWorkspaceStore.js";

export type ActorReviewFinding = {
  severity: "p0" | "p1" | "p2" | "p3";
  title: string;
  body: string;
};

export type ActorReviewOutput = {
  schema: "actor-review/v1";
  review_id: string;
  actor_id: string;
  created_at: string;
  input_refs: string[];
  findings: ActorReviewFinding[];
  candidate_proposals: string[];
  relationship_event_proposals?: Array<{
    kind: RelationshipEventKind;
    target_actor_id: string;
    summary: string;
    evidence_refs: string[];
  }>;
  active_mutation: "forbidden";
};

export async function writeReviewerOutput(
  actorWorkspaceRootDir: string,
  review: ActorReviewOutput
) {
  if (review.active_mutation !== "forbidden") {
    throw new Error("Reviewer output cannot mutate active action skills");
  }

  const paths = getActorWorkspacePaths(actorWorkspaceRootDir, review.actor_id);
  const filePath = path.join(paths.reviewsDir, `${sanitizeWorkspaceFileId(review.review_id)}.json`);
  await writeJson(filePath, review);
  return filePath;
}
