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

test("WorldEvent context is not accepted as LifeGoal objective", () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const worldEventContext = "The settlement needs diamond tools immediately";
  assert.notEqual(soul.life_goal, worldEventContext);
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
    next_goal_context: []
  });

  assert.equal(result.ok, false);
});

test("validateCycleJudgment accepts partial verified progress as a bounded evidence outcome", () => {
  // The schema accepts partial progress so reports can preserve mutation evidence without claiming completion.
  const result = validateCycleJudgment({
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    outcome: "partial_verified_progress",
    what_happened: "Placed some blocks but the final structure verifier did not pass.",
    why_it_mattered_for_life_goal: "The actor made real progress without claiming completion.",
    verifier_status: "failed",
    evidence_refs: ["evidence/cycle-0001-build_pattern.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: ["Continue from verified partial evidence or pivot if blocked."]
  });

  assert.equal(result.ok, true);
});
