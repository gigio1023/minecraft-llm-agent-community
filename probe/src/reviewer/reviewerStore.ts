import path from "node:path";

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
