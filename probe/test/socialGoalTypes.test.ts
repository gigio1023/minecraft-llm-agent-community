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
import type { ActionIntent } from "../src/runtime/goals/types.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import {
  buildActionIntentRegenerationGuidance,
  shouldRegenerateActionIntent
} from "../src/provider/socialActionPlannerProvider.js";

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

test("validateActionIntent accepts action-selection generated candidate authoring shape", () => {
  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    kind: "author_and_trial_action_skill",
    args: {},
    parameters: { text: "bring logs to the shared chest" },
    candidate: {
      schema: "generated-action-skill-candidate/v1",
      proposed_skill_id: "saySettlementNeed",
      purpose: "Say a concrete settlement need with helper evidence.",
      source_language: "typescript",
      source: "export async function run(ctx, params) { return ctx.say(params.text); }",
      input_schema: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string" } }
      },
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["say"],
      timeout_ms: 5_000,
      verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
      promotion_policy: "promote_after_passed_trial",
      known_failure_modes: []
    },
    why_this_action: "create a reusable bounded speaking action",
    expected_evidence: ["helper say delivered"],
    fallback_if_blocked: "remember blocker"
  };
  const result = validateActionIntent(intent);

  assert.equal(result.ok, true);
});

test("generated candidate contract failures request one guided regeneration", () => {
  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    kind: "author_and_trial_action_skill",
    args: {},
    parameters: {},
    candidate: {
      schema: "generated-action-skill-candidate/v1",
      proposed_skill_id: "badLoop",
      purpose: "Bad candidate",
      source_language: "typescript",
      source: "export async function run(ctx) { while (true) {} }",
      input_schema: { type: "object" },
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["wait"],
      timeout_ms: 5_000,
      verifier: { kind: "helper_event_progress" },
      promotion_policy: "promote_after_passed_trial",
      known_failure_modes: []
    },
    why_this_action: "test regeneration",
    expected_evidence: ["corrected source"],
    fallback_if_blocked: "observe"
  };
  const error =
    "Generated action skill candidate contract failed: Generated action skill contains a blocked API or obvious unbounded loop";

  assert.equal(shouldRegenerateActionIntent(intent, error), true);
  const guidance = buildActionIntentRegenerationGuidance({ error, rejectedIntent: intent });
  assert.equal(guidance.schema, "action-planner-regeneration-guidance/v1");
  assert.equal(guidance.rejected_error, error);
  assert.equal(guidance.rules.do_not_repeat_blocked_source_or_helper_shape, true);
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
