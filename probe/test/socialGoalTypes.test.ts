import assert from "node:assert/strict";
import test from "node:test";

import {
  cycleGoalProviderInputIncludesSoulAndLifeGoal,
  validateActorCycleGoal,
  validateActorLifeGoal,
  validateActorSoul,
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

test("validateCycleJudgment accepts typed PlanBead operation proposals", () => {
  const result = validateCycleJudgment({
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    outcome: "no_progress",
    what_happened: "Observed a blocker that should stay in work-state context.",
    why_it_mattered_for_life_goal: "The next cycle should not forget the blocker.",
    verifier_status: "not_applicable",
    evidence_refs: ["evidence/cycle-0001-observe.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    bead_op_proposals: [
      {
        schema: "plan-bead-operation/v1",
        actor_id: "npc_b",
        op: "create",
        rationale: "Track the blocker as context, not as executable authority.",
        evidence_refs: ["evidence/cycle-0001-observe.json"],
        confidence: "observed",
        patch: {
          kind: "blocker_repair",
          title: "Resolve unreachable log target",
          description: "The actor needs a different route or target before trying again.",
          acceptance_evidence_required: ["runtime evidence of a reachable target or successful collection"],
          notes_next: ["Choose a different visible log or inspect nearby terrain."],
          priority: 2
        }
      }
    ],
    next_goal_context: ["Pick an action that repairs or avoids the blocker."]
  });

  assert.equal(result.ok, true);
});

test("validateCycleJudgment lets guarded PlanBead applier reject malformed proposals", () => {
  const result = validateCycleJudgment({
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    outcome: "no_progress",
    what_happened: "The model proposed a malformed work-state update.",
    why_it_mattered_for_life_goal: "The judgment should survive so the applier can record a rejected operation artifact.",
    verifier_status: "not_applicable",
    evidence_refs: ["evidence/cycle-0001-observe.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    bead_op_proposals: [
      {
        schema: "plan-bead-operation/v1",
        actor_id: "npc_b",
        op: "set_status",
        patch: { status: "in_progress" }
      }
    ],
    next_goal_context: ["Continue without trusting the malformed proposal."]
  });

  assert.equal(result.ok, true);
});
