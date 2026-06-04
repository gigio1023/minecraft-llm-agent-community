/**
 * Persistence for strategic goal artifacts.
 *
 * @remarks Strategic goals provide durable actor context under LifeGoal framing;
 * they should not become fixed domain phases or primitive authority.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";

import type { ActorLifeGoal, ActorSoul, StrategicGoal } from "./types.js";
import { listJsonFilesSorted, readJsonIfExists, writeActorGoalArtifact } from "./goalJsonStore.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";
import { soulRef } from "./actorSoulStore.js";

export async function listStrategicGoals(rootDir: string, actorId: string) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const files = await listJsonFilesSorted(paths.strategicGoalsDir);
  const goals: StrategicGoal[] = [];
  for (const filePath of files) {
    const record = await readJsonIfExists<StrategicGoal>(filePath);
    if (record) {
      goals.push(record);
    }
  }
  return goals;
}

export async function writeStrategicGoal(
  rootDir: string,
  actorId: string,
  goal: StrategicGoal
) {
  return writeActorGoalArtifact(
    rootDir,
    actorId,
    path.join("goals", "strategic"),
    goal.strategic_goal_id,
    goal
  );
}

export function buildDeterministicStrategicGoal(input: {
  soul: ActorSoul;
  lifeGoal: ActorLifeGoal;
  worldEventRefs: string[];
  judgmentRefs: string[];
}): StrategicGoal {
  const now = new Date().toISOString();
  return {
    schema: "actor-strategic-goal/v1",
    actor_id: input.soul.actor_id,
    strategic_goal_id: `strategic-${randomUUID()}`,
    life_goal_id: input.lifeGoal.goal_id,
    status: "active",
    summary: "Contribute gathered materials to settlement trust",
    rationale:
      "Runtime rule baseline: align short-term contribution with gatherer LifeGoal without replacing it.",
    derived_from: {
      soul_ref: soulRef(input.soul.actor_id),
      world_event_refs: [...input.worldEventRefs],
      memory_refs: [],
      relationship_refs: [],
      previous_cycle_judgment_refs: [...input.judgmentRefs]
    },
    success_direction: "Leave evidence of useful collection or truthful blockage",
    current_blockers: [],
    updated_at: now
  };
}
