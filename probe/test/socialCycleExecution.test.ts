import assert from "node:assert/strict";
import test from "node:test";

import {
  compileSocialAllowedPrimitives,
  resolvePrimitivesForSocialIntent
} from "../src/runtime/socialCycleExecution.js";
import type { ActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import {
  clampCycleJudgmentOutcome,
  deriveProgressVerifierStatus,
  isMeaningfulGameplayPrimitive
} from "../src/runtime/socialCycleProgress.js";
import type { ActionIntent, CycleJudgment } from "../src/runtime/goals/types.js";

test("gatherer social allowlist includes collect_logs from resource pressure intents", () => {
  const allowed = compileSocialAllowedPrimitives("gatherer");
  assert.ok(allowed.includes("collect_logs"));
  assert.ok(allowed.includes("observe"));
});

test("deriveProgressVerifierStatus treats observe-only bundles as not applicable", () => {
  assert.equal(
    deriveProgressVerifierStatus({
      executedTools: ["observe", "wait"],
      lastToolStatus: "ok"
    }),
    "not_applicable"
  );
  assert.equal(
    deriveProgressVerifierStatus({
      executedTools: ["observe", "collect_logs", "wait"],
      lastToolStatus: "ok"
    }),
    "passed"
  );
});

test("clampCycleJudgmentOutcome rejects verified_progress without meaningful tools", () => {
  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    outcome: "verified_progress",
    what_happened: "Observed only",
    why_it_mattered_for_life_goal: "test",
    verifier_status: "passed",
    evidence_refs: [],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_pressure: []
  };
  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_action_skill",
    action_skill_id: "collectLogs",
    args: {},
    why_this_action: "gather",
    expected_evidence: [],
    fallback_if_blocked: "observe"
  };
  const clamped = clampCycleJudgmentOutcome({
    judgment,
    actionIntent: intent,
    executedTools: ["observe"]
  });
  assert.equal(clamped.outcome, "no_progress");
});

test("use_action_skill resolves full owned primitive bundle", () => {
  const actorId = "npc_b";
  const activeSkills: ActorActionSkillRecord[] = [
    {
      skill_id: "collectLogs",
      owner_actor_id: actorId,
      status: "active",
      required_primitives: ["observe", "collect_logs", "wait"],
      preconditions: [],
      success_verifier: "inventory logs increased",
      evidence_refs: []
    }
  ];
  const resolved = resolvePrimitivesForSocialIntent(
    {
      schema: "action-intent/v1",
      actor_id: actorId,
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "use_action_skill",
      action_skill_id: "collectLogs",
      args: {},
      why_this_action: "gather logs",
      expected_evidence: ["logs"],
      fallback_if_blocked: "remember"
    },
    activeSkills
  );

  assert.equal(resolved.actionSkillExecutionUnit, true);
  assert.deepEqual(resolved.primitives, ["observe", "collect_logs", "wait"]);
  assert.ok(isMeaningfulGameplayPrimitive("collect_logs"));
});
