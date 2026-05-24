import assert from "node:assert/strict";
import test from "node:test";

import {
  cycleGoalProviderInputIncludesSoulAndLifeGoal,
  validateActorCycleGoal,
  validateActorLifeGoal,
  validateActorSoul,
  validateActionIntent,
  validateCycleJudgment
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
    cycleGoalProviderInputIncludesSoulAndLifeGoal({ ActorSoul: soul, ActorLifeGoal: lifeGoal }),
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

test("validateActionIntent rejects shallow or mismatched action plans", () => {
  assert.equal(
    validateActionIntent({
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "g1",
      kind: "use_primitive",
      args: {},
      why_this_action: "try work",
      expected_evidence: [],
      fallback_if_blocked: "remember"
    }).ok,
    false
  );

  assert.equal(
    validateActionIntent({
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "g1",
      kind: "remember",
      args: { note: "blocked on stone" },
      why_this_action: "preserve blocker",
      expected_evidence: ["memory"],
      fallback_if_blocked: "wait"
    }).ok,
    true
  );
});

test("validateCycleJudgment rejects invalid outcome and malformed memory writes", () => {
  const result = validateCycleJudgment({
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    outcome: "great_success",
    what_happened: "claimed progress",
    why_it_mattered_for_life_goal: "test",
    verifier_status: "passed",
    evidence_refs: [],
    memory_writes: [{ layer: "dream", summary: "", confidence: "certain" }],
    relationship_event_proposals: [],
    next_goal_pressure: []
  });

  assert.equal(result.ok, false);
});
