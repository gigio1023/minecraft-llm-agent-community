import { writeActorGoalArtifact } from "../goalJsonStore.js";
import {
  validateActiveEpisode,
  validateDeliberationBranch
} from "./validators.js";
import type { ActiveEpisode, DeliberationBranch } from "./types.js";

export async function writeActiveEpisode(
  rootDir: string,
  actorId: string,
  episode: ActiveEpisode
) {
  const validated = validateActiveEpisode(episode);
  if (!validated.ok) {
    throw new Error(`Invalid ActiveEpisode: ${validated.errors.join("; ")}`);
  }
  return writeActorGoalArtifact(
    rootDir,
    actorId,
    "goals/episodes",
    episode.episode_id,
    validated.episode
  );
}

export async function writeDeliberationBranch(
  rootDir: string,
  actorId: string,
  branch: DeliberationBranch
) {
  const validated = validateDeliberationBranch(branch);
  if (!validated.ok) {
    throw new Error(`Invalid DeliberationBranch: ${validated.errors.join("; ")}`);
  }
  return writeActorGoalArtifact(
    rootDir,
    actorId,
    "goals/episodes/branches",
    branch.branch_id,
    validated.branch
  );
}
