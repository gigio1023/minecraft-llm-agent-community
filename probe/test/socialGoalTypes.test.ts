import assert from "node:assert/strict";
import test from "node:test";

import {
  goalMindInputIncludesSoulAndLifeGoal,
  validateActorCycleGoal,
  validateActorLifeGoal,
  validateActorSoul
} from "../src/runtime/goals/types.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";

test("ActorSoul and LifeGoal validators accept canonical records", () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const lifeGoal = {
    schema: "actor-life-goal/v1",
    actor_id: "npc_b",
    goal_id: "life-1",
    objective: soul.life_goal,
    status: "active",
    source: "actor_soul",
    created_at: "2026-05-23T00:00:00.000Z",
    updated_at: "2026-05-23T00:00:00.000Z",
    cycle_count: 0,
    action_count: 0,
    evidence_refs: [],
    memory_refs: [],
    relationship_refs: []
  };

  assert.equal(validateActorSoul(soul).ok, true);
  assert.equal(validateActorLifeGoal(lifeGoal).ok, true);
  assert.equal(
    goalMindInputIncludesSoulAndLifeGoal({ ActorSoul: soul, ActorLifeGoal: lifeGoal }),
    true
  );
});

test("WorldEvent pressure is not accepted as LifeGoal objective", () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const pressure = "The settlement needs diamond tools immediately";
  assert.notEqual(soul.life_goal, pressure);
});

test("validateActorCycleGoal rejects wrong schema", () => {
  const result = validateActorCycleGoal({ schema: "wrong", goal_id: "x", cycle_id: "c" });
  assert.equal(result.ok, false);
});
