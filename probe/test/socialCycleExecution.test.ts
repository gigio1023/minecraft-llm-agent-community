import assert from "node:assert/strict";
import test from "node:test";

import {
  compileSocialAllowedPrimitives,
  filterExecutableSocialActionSkills,
  resolvePrimitivesForSocialIntent
} from "../src/runtime/socialCycleExecution.js";
import type { ActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import {
  clampCycleJudgmentOutcome,
  deriveProgressVerifierStatus,
  isMeaningfulGameplayPrimitive
} from "../src/runtime/socialCycleProgress.js";
import type { ActionIntent, CycleJudgment } from "../src/runtime/goals/types.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";

test("gatherer social affordances expose the role-safe runtime body", () => {
  const allowed = compileSocialAllowedPrimitives("gatherer");
  assert.ok(allowed.includes("collect_logs"));
  assert.ok(allowed.includes("move_to"));
  assert.ok(allowed.includes("say"));
  assert.ok(allowed.includes("observe"));
});

test("crafter social affordances are not forced through gatherer resource strategy", () => {
  const allowed = compileSocialAllowedPrimitives("crafter");
  assert.ok(allowed.includes("move_to"));
  assert.ok(allowed.includes("craft_item"));
  assert.ok(allowed.includes("craft_with_table"));
  assert.ok(allowed.includes("say"));
  assert.equal(allowed.includes("collect_logs"), false);
});

test("social executor allowlist includes storage primitives it can dispatch", () => {
  const allowed = compileSocialAllowedPrimitives("gatherer");
  assert.equal(allowed.includes("inspect_chest"), true);
  assert.equal(allowed.includes("deposit_shared"), true);
});

test("settler social affordances expose settlement survival body", () => {
  const allowed = compileSocialAllowedPrimitives("settler");
  assert.ok(allowed.includes("collect_logs"));
  assert.ok(allowed.includes("craft_item"));
  assert.ok(allowed.includes("craft_with_table"));
  assert.ok(allowed.includes("place_block"));
  assert.ok(allowed.includes("build_pattern"));
  assert.ok(allowed.includes("mine_block"));
  assert.ok(allowed.includes("inspect_chest"));
  assert.ok(allowed.includes("deposit_shared"));
});

test("deriveProgressVerifierStatus treats observe-only bundles as not applicable", () => {
  assert.equal(
    deriveProgressVerifierStatus({
      toolAttempts: [
        { tool: "observe", status: "ok" },
        { tool: "wait", status: "waited" }
      ]
    }),
    "not_applicable"
  );
  assert.equal(
    deriveProgressVerifierStatus({
      toolAttempts: [
        { tool: "observe", status: "ok" },
        { tool: "collect_logs", status: "collected" },
        { tool: "wait", status: "waited" }
      ]
    }),
    "passed"
  );
});

test("deriveProgressVerifierStatus uses the meaningful primitive status before wait", () => {
  assert.equal(
    deriveProgressVerifierStatus({
      toolAttempts: [
        { tool: "collect_logs", status: "blocked" },
        { tool: "wait", status: "waited" }
      ]
    }),
    "failed"
  );
  assert.equal(
    deriveProgressVerifierStatus({
      toolAttempts: [
        { tool: "mine_block", status: "mined" },
        { tool: "remember", status: "remembered" }
      ]
    }),
    "passed"
  );
});

test("deriveProgressVerifierStatus recognizes implemented progress statuses", () => {
  const progressCases = [
    ["collect_logs", "collected"],
    ["mine_block", "mined"],
    ["craft_item", "crafted"],
    ["craft_with_table", "crafted"],
    ["place_block", "placed"],
    ["build_pattern", "built"],
    ["deposit_shared", "deposited"],
    ["inspect_chest", "inspected"],
    ["move_to", "arrived"],
    ["move_to", "moved"]
  ];

  for (const [tool, status] of progressCases) {
    assert.equal(
      deriveProgressVerifierStatus({ toolAttempts: [{ tool, status }] }),
      "passed",
      `${tool}=${status} should count as verified progress`
    );
  }
});

test("deriveProgressVerifierStatus does not verify partial build patterns", () => {
  assert.equal(
    deriveProgressVerifierStatus({ toolAttempts: [{ tool: "build_pattern", status: "progressing" }] }),
    "failed"
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
    testActionSkillRecord("collectLogs", ["observe", "collect_logs", "wait"], actorId)
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

test("social action skill exposure keeps only executable primitive bundles", () => {
  const actorId = "npc_b";
  const activeSkills: ActorActionSkillRecord[] = [
    testActionSkillRecord("collectLogs", ["observe", "collect_logs", "wait"], actorId),
    testActionSkillRecord(
      "depositSharedItems",
      ["observe", "inspect_chest", "deposit_shared", "wait"],
      actorId
    )
  ];

  assert.deepEqual(
    filterExecutableSocialActionSkills(activeSkills).map((record) => record.skill_id),
    ["collectLogs", "depositSharedItems"]
  );
});
