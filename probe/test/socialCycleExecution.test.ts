import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compileSocialAllowedPrimitives,
  executeSocialActionIntent,
  filterExecutableSocialActionSkills,
  resolvePrimitivesForSocialIntent
} from "../src/runtime/socialCycleExecution.js";
import type { ActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import {
  clampCycleJudgmentOutcome,
  deriveProgressVerifierStatus,
  hasPartialVerifiedProgress,
  isMeaningfulGameplayPrimitive
} from "../src/runtime/socialCycleProgress.js";
import type { ActionIntent, CycleJudgment } from "../src/runtime/goals/types.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";
import { evaluateSocialActionSkillPostcondition } from "../src/runtime/settlement/settlementState.js";
import {
  buildRuntimeRetryAttempt,
  deriveRuntimeRetryConstraints,
  findMatchingRuntimeRetryConstraint
} from "../src/runtime/retryConstraints.js";

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
    ["place_block", "already_present"],
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

test("deriveProgressVerifierStatus keeps partial build patterns below full verifier success", () => {
  // Partial block placement is real evidence, but it must not pass the final verifier.
  assert.equal(
    deriveProgressVerifierStatus({ toolAttempts: [{ tool: "build_pattern", status: "progressing" }] }),
    "failed"
  );
  assert.equal(
    hasPartialVerifiedProgress({ toolAttempts: [{ tool: "build_pattern", status: "progressing" }] }),
    true
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
    next_goal_context: []
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

test("clampCycleJudgmentOutcome downgrades unpassed verified progress to partial when evidence mutated world", () => {
  // This guards against a provider turning useful block mutation into a completed home claim.
  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    outcome: "verified_progress",
    what_happened: "Placed some shelter shell blocks",
    why_it_mattered_for_life_goal: "Partial safety work matters but is not a completed shelter.",
    verifier_status: "failed",
    evidence_refs: [],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: []
  };
  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_primitive",
    primitive_id: "build_pattern",
    args: {},
    why_this_action: "respond to shelter context",
    expected_evidence: [],
    fallback_if_blocked: "remember"
  };

  const clamped = clampCycleJudgmentOutcome({
    judgment,
    actionIntent: intent,
    executedTools: ["build_pattern"],
    toolStatuses: [{ tool: "build_pattern", status: "progressing" }]
  });
  assert.equal(clamped.outcome, "partial_verified_progress");
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

test("direct primitive intent cannot smuggle action-skill fallback authority", () => {
  const resolved = resolvePrimitivesForSocialIntent(
    {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "use_primitive",
      primitive_id: "place_block",
      action_skill_id: "placeCraftingTable",
      args: {},
      why_this_action: "try to call a primitive with action-skill fallback authority",
      expected_evidence: [],
      fallback_if_blocked: "remember"
    },
    [testActionSkillRecord("placeCraftingTable", ["observe", "place_block"], "npc_b")]
  );

  assert.deepEqual(resolved.primitives, []);
  assert.equal(resolved.actionSkillExecutionUnit, false);
  assert.match(resolved.blockedReason ?? "", /Direct primitive intents cannot carry action_skill_id/);
});

test("wait and remember still pass through CycleGoal and active action-skill gates", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "social-control-gate-"));
  const result = await executeSocialActionIntent({
    actorWorkspaceRootDir: workspaceRoot,
    actorId: "npc_b",
    cycleId: "cycle-0001",
    cycleGoal: {
      schema: "actor-cycle-goal/v1",
      actor_id: "npc_b",
      goal_id: "cycle-goal-1",
      life_goal_id: "life-goal-1",
      cycle_id: "cycle-0001",
      status: "active",
      source: "llm_planner",
      summary: "Test control primitive gating",
      rationale: "The executor must not bypass gates for safe-looking control actions.",
      derived_from: {
        soul_ref: "soul.json",
        observation_refs: [],
        world_event_refs: [],
        memory_refs: [],
        relationship_refs: [],
        previous_cycle_judgment_refs: []
      },
      success_condition: {
        verifier: "runtime_primitive_or_evidence",
        evidence_required: ["tool_attempt"]
      },
      allowed_action_skill_ids: ["observeOnly"],
      allowed_primitive_ids: ["wait"],
      stop_conditions: ["gate_blocked"]
    },
    intent: {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "wait",
      args: { ticks: 1 },
      why_this_action: "test wait gate",
      expected_evidence: ["tool_attempt"],
      fallback_if_blocked: "remember"
    },
    activeActionSkills: [
      testActionSkillRecord("observeOnly", ["observe"], "npc_b")
    ]
  });

  assert.equal(result.gateBlocked, true);
  assert.equal(result.contractBlocked, false);
  assert.deepEqual(result.executedTools, ["wait"]);
  assert.match(JSON.stringify(result.runtimeResult), /not backed by active action skills/);
});

test("runtime retry constraints group exact repeated blocker target and args", () => {
  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_primitive",
    primitive_id: "move_to",
    args: { direction: "east", distance: 8 },
    why_this_action: "scout",
    expected_evidence: ["tool_attempt"],
    fallback_if_blocked: "observe"
  };
  const first = buildRuntimeRetryAttempt({
    actorId: "npc_b",
    cycleId: "cycle-0001",
    turnId: "cycle-0001-action-01",
    actionIndex: 0,
    intent,
    execution: {
      runtimeResult: { status: "blocked", reason: "pathfinder failed near target" },
      evidenceRefs: ["evidence/cycle-0001-move_to.json"],
      verifierStatus: "failed",
      toolStatuses: [{ tool: "move_to", status: "blocked" }]
    }
  });
  const second = buildRuntimeRetryAttempt({
    actorId: "npc_b",
    cycleId: "cycle-0002",
    turnId: "cycle-0002-action-01",
    actionIndex: 0,
    intent: { ...intent, cycle_id: "cycle-0002" },
    execution: {
      runtimeResult: { status: "blocked", reason: "pathfinder failed near target" },
      evidenceRefs: ["evidence/cycle-0002-move_to.json"],
      verifierStatus: "failed",
      toolStatuses: [{ tool: "move_to", status: "blocked" }]
    }
  });

  assert.ok(first);
  assert.ok(second);
  const constraints = deriveRuntimeRetryConstraints({
    actorId: "npc_b",
    attempts: [first, second]
  });

  assert.equal(constraints.length, 1);
  assert.equal(constraints[0]?.target.id, "move_to");
  assert.equal(constraints[0]?.repeat_count, 2);
  assert.ok(findMatchingRuntimeRetryConstraint(intent, constraints));
  assert.equal(
    findMatchingRuntimeRetryConstraint(
      { ...intent, args: { direction: "west", distance: 8 } },
      constraints
    ),
    null
  );
});

test("social executor blocks an exact retry constraint before Mineflayer execution", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "social-retry-constraint-"));
  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0003",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_primitive",
    primitive_id: "move_to",
    args: { direction: "east", distance: 8 },
    why_this_action: "repeat blocked movement",
    expected_evidence: ["tool_attempt"],
    fallback_if_blocked: "observe"
  };
  const attempts = ["cycle-0001-action-01", "cycle-0002-action-01"].map((turnId) =>
    buildRuntimeRetryAttempt({
      actorId: "npc_b",
      cycleId: turnId.slice(0, 10),
      turnId,
      intent,
      execution: {
        runtimeResult: { status: "blocked", reason: "pathfinder failed near target" },
        evidenceRefs: [`evidence/${turnId}-move_to.json`],
        verifierStatus: "failed",
        toolStatuses: [{ tool: "move_to", status: "blocked" }]
      }
    })
  );
  const constraints = deriveRuntimeRetryConstraints({
    actorId: "npc_b",
    attempts: attempts.filter((attempt): attempt is NonNullable<typeof attempt> => attempt !== null)
  });

  const result = await executeSocialActionIntent({
    actorWorkspaceRootDir: workspaceRoot,
    actorId: "npc_b",
    cycleId: "cycle-0003",
    turnId: "cycle-0003-action-01",
    cycleGoal: {
      schema: "actor-cycle-goal/v1",
      actor_id: "npc_b",
      goal_id: "cycle-goal-1",
      life_goal_id: "life-goal-1",
      cycle_id: "cycle-0003",
      status: "active",
      source: "llm_planner",
      summary: "Do not blindly retry a blocked exact action",
      rationale: "The runtime should force a pivot or argument repair.",
      derived_from: {
        soul_ref: "soul.json",
        observation_refs: [],
        world_event_refs: [],
        memory_refs: [],
        relationship_refs: [],
        previous_cycle_judgment_refs: []
      },
      success_condition: {
        verifier: "runtime_primitive_or_evidence",
        evidence_required: ["tool_attempt"]
      },
      allowed_action_skill_ids: [],
      allowed_primitive_ids: ["move_to", "observe"],
      stop_conditions: ["retry_constraint_blocked"]
    },
    intent,
    activeActionSkills: [],
    runtimeRetryConstraints: constraints
  });

  assert.equal(result.retryConstraintBlocked, true);
  assert.equal(result.gateBlocked, true);
  assert.equal(result.executedTools.length, 0);
  assert.equal(result.evidenceRefs.length, 1);
  assert.match(JSON.stringify(result.runtimeResult), /runtime_retry_constraint/);

  const evidencePath = path.join(workspaceRoot, "npc_b", result.evidenceRefs[0]!);
  const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));
  assert.equal(evidence.category, "retry_constraint_blocked");
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

test("social action skill postcondition accepts verified shelter evidence", () => {
  const result = evaluateSocialActionSkillPostcondition({
    actionSkillId: "buildBasicShelter",
    evidenceRefs: ["evidence/cycle-0001-build_pattern.json"],
    toolResults: [
      {
        tool: "build_pattern",
        status: "built",
        evidence_ref: "evidence/cycle-0001-build_pattern.json",
        result: {
          status: "built",
          verification: {
            status: "passed"
          }
        }
      }
    ]
  });

  assert.equal(result.status, "passed");
  assert.deepEqual(result.checklist_item_ids, ["starter_shelter_verified"]);
});

test("social action skill postcondition rejects table placement without placed table evidence", () => {
  const result = evaluateSocialActionSkillPostcondition({
    actionSkillId: "placeCraftingTable",
    evidenceRefs: ["evidence/cycle-0001-place_block.json"],
    toolResults: [
      {
        tool: "place_block",
        status: "blocked",
        evidence_ref: "evidence/cycle-0001-place_block.json",
        result: {
          status: "blocked",
          itemName: "crafting_table",
          reason: "no adjacent support"
        }
      }
    ]
  });

  assert.equal(result.status, "failed");
  assert.deepEqual(result.checklist_item_ids, ["crafting_table_known_or_placed"]);
});
