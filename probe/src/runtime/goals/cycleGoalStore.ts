/**
 * Persistence and compaction helpers for CycleGoal records.
 *
 * @remarks CycleGoals are compatibility focus records in Actor Turn mode. They
 * remain subordinate to runtime action contracts, action-surface gates, and
 * verifier evidence.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";

import type { ActorCycleGoal, ActorLifeGoal, ActorSoul, CycleGoalSource, StrategicGoal } from "./types.js";
import { listJsonFilesSorted, readJsonIfExists, writeActorGoalArtifact } from "./goalJsonStore.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";
import { soulRef } from "./actorSoulStore.js";

export async function readCycleGoal(
  rootDir: string,
  actorId: string,
  goalId: string
): Promise<ActorCycleGoal | null> {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  return readJsonIfExists<ActorCycleGoal>(
    path.join(paths.cycleGoalsDir, `${goalId}.json`)
  );
}

export async function listCycleGoals(rootDir: string, actorId: string) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const files = await listJsonFilesSorted(paths.cycleGoalsDir);
  const goals: ActorCycleGoal[] = [];
  for (const filePath of files) {
    const record = await readJsonIfExists<ActorCycleGoal>(filePath);
    if (record) {
      goals.push(record);
    }
  }
  return goals;
}

export async function writeCycleGoal(
  rootDir: string,
  actorId: string,
  goal: ActorCycleGoal,
  expectedGoalId?: string
) {
  if (expectedGoalId) {
    const existing = await readCycleGoal(rootDir, actorId, expectedGoalId);
    if (existing && existing.cycle_id === goal.cycle_id && existing.goal_id !== goal.goal_id) {
      throw new Error(
        `Stale cycle goal write rejected: expected ${expectedGoalId}, got ${goal.goal_id}`
      );
    }
  }

  return writeActorGoalArtifact(
    rootDir,
    actorId,
    path.join("goals", "cycle"),
    goal.goal_id,
    goal
  );
}

export function buildDeterministicCycleGoal(input: {
  soul: ActorSoul;
  lifeGoal: ActorLifeGoal;
  cycleId: string;
  strategicGoal?: StrategicGoal;
  observationRefs: string[];
  worldEventRefs: string[];
  memoryRefs: string[];
  relationshipRefs: string[];
  judgmentRefs: string[];
  allowedActionSkillIds: string[];
  allowedPrimitiveIds: string[];
  source?: CycleGoalSource;
}): ActorCycleGoal {
  const summary =
    input.judgmentRefs.length > 0
      ? "Follow up on the previous cycle judgment with bounded observation"
      : "Establish baseline observation for settlement contribution";

  return {
    schema: "actor-cycle-goal/v1",
    actor_id: input.soul.actor_id,
    goal_id: `cycle-goal-${randomUUID()}`,
    life_goal_id: input.lifeGoal.goal_id,
    cycle_id: input.cycleId,
    status: "active",
    source: input.source ?? "runtime_rule",
    summary,
    rationale: input.strategicGoal
      ? `Supports strategic goal: ${input.strategicGoal.summary}`
      : "Runtime rule cycle goal for deterministic-social baseline.",
    derived_from: {
      soul_ref: soulRef(input.soul.actor_id),
      observation_refs: [...input.observationRefs],
      world_event_refs: [...input.worldEventRefs],
      memory_refs: [...input.memoryRefs],
      relationship_refs: [...input.relationshipRefs],
      previous_cycle_judgment_refs: [...input.judgmentRefs]
    },
    success_condition: {
      verifier: "runtime_primitive_or_evidence",
      evidence_required: ["tool_attempt", "verifier_status"]
    },
    allowed_action_skill_ids: [...input.allowedActionSkillIds],
    allowed_primitive_ids: [...input.allowedPrimitiveIds],
    stop_conditions: ["verifier_passed", "max_actions_reached", "gate_blocked"]
  };
}
