/**
 * Persistence for Actor LifeGoal records.
 *
 * @remarks LifeGoal is the long-lived frame for actor decisions, not a provider
 * shortcut for claiming progress without evidence.
 */
import { randomUUID } from "node:crypto";

import type { ActorLifeGoal, ActorSoul } from "./types.js";
import { readJsonIfExists, writeActorGoalArtifact } from "./goalJsonStore.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";
import path from "node:path";

export async function readActiveLifeGoal(
  rootDir: string,
  actorId: string
): Promise<ActorLifeGoal | null> {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  return readJsonIfExists<ActorLifeGoal>(paths.lifeGoalActiveFile);
}

export async function ensureActiveLifeGoal(
  rootDir: string,
  actorId: string,
  soul: ActorSoul
): Promise<ActorLifeGoal> {
  const existing = await readActiveLifeGoal(rootDir, actorId);
  if (existing && existing.status === "active") {
    return existing;
  }

  const now = new Date().toISOString();
  const lifeGoal: ActorLifeGoal = {
    schema: "actor-life-goal/v1",
    actor_id: actorId,
    goal_id: `life-${randomUUID()}`,
    objective: soul.life_goal,
    status: "active",
    source: "actor_soul",
    created_at: now,
    updated_at: now,
    cycle_count: 0,
    action_count: 0,
    evidence_refs: [],
    memory_refs: [],
    relationship_refs: []
  };

  const paths = getActorWorkspacePaths(rootDir, actorId);
  const { writeJson } = await import("../actorWorkspaceStore.js");
  await writeJson(paths.lifeGoalActiveFile, lifeGoal);
  return lifeGoal;
}

export async function bumpLifeGoalCounters(
  rootDir: string,
  actorId: string,
  input: { cycles?: number; actions?: number }
) {
  const lifeGoal = await readActiveLifeGoal(rootDir, actorId);
  if (!lifeGoal) {
    return null;
  }

  const updated: ActorLifeGoal = {
    ...lifeGoal,
    updated_at: new Date().toISOString(),
    cycle_count: lifeGoal.cycle_count + (input.cycles ?? 0),
    action_count: lifeGoal.action_count + (input.actions ?? 0)
  };
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const { writeJson } = await import("../actorWorkspaceStore.js");
  await writeJson(paths.lifeGoalActiveFile, updated);
  return updated;
}

export function lifeGoalRef() {
  return path.join("goals", "life", "active.json");
}
