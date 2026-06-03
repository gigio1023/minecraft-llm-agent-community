import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { Bot } from "mineflayer";

import {
  compileSocialAllowedPrimitives,
  executeSocialActionIntent,
  filterExecutableSocialActionSkills,
  resolvePrimitivesForSocialIntent
} from "../src/runtime/socialCycleExecution.js";
import { listActiveActorActionSkillRecords } from "../src/runtime/actorWorkspace.js";
import type { ActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import {
  clampCycleJudgmentOutcome,
  deterministicJudgmentOutcome,
  deriveProgressVerifierStatus,
  hasPartialVerifiedProgress,
  isDurableProgressVerifier,
  isMovementOnlyVerifier,
  isMeaningfulGameplayPrimitive
} from "../src/runtime/socialCycleProgress.js";
import type { ActionIntent, CycleJudgment } from "../src/runtime/goals/types.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";
import {
  buildSettlementState,
  evaluateSocialActionSkillPostcondition
} from "../src/runtime/settlement/settlementState.js";
import {
  buildRuntimeRetryAttempt,
  deriveRuntimeRetryConstraints,
  findMatchingRuntimeRetryConstraint
} from "../src/runtime/retryConstraints.js";

function fakeObserveBot(username = "npc_b"): Bot {
  const position = {
    x: 0,
    y: 64,
    z: 0,
    distanceTo: () => 0
  };
  return {
    username,
    entity: { position },
    inventory: { items: () => [] },
    findBlocks: () => [],
    blockAt: (pos: { x: number; y: number; z: number }) => ({
      name: "air",
      position: pos
    }),
    setControlState: () => undefined,
    chat: () => undefined
  } as unknown as Bot;
}

test("gatherer social affordances expose the role-safe runtime body", () => {
  const allowed = compileSocialAllowedPrimitives("gatherer");
  assert.ok(allowed.includes("collect_logs"));
  assert.ok(allowed.includes("move_to"));
  assert.ok(allowed.includes("consume_item"));
  assert.ok(allowed.includes("run_mineflayer_program"));
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
    ["consume_item", "consumed"],
    ["run_mineflayer_program", "completed_with_evidence"],
    ["place_block", "placed"],
    ["place_block", "already_present"],
    ["build_pattern", "built"],
    ["deposit_shared", "deposited"]
  ];

  for (const [tool, status] of progressCases) {
    assert.equal(
      deriveProgressVerifierStatus({ toolAttempts: [{ tool, status }] }),
      "passed",
      `${tool}=${status} should count as verified progress`
    );
  }
});

test("move_to verifies movement but does not count as durable social-cycle progress by itself", () => {
  assert.equal(
    deriveProgressVerifierStatus({ toolAttempts: [{ tool: "move_to", status: "arrived" }] }),
    "passed"
  );
  assert.equal(isMovementOnlyVerifier("passed", ["move_to"]), true);
  assert.equal(isDurableProgressVerifier("passed", ["move_to"]), false);
  assert.equal(
    deterministicJudgmentOutcome({
      verifierStatus: "passed",
      executedTools: ["move_to"],
      toolStatuses: [{ tool: "move_to", status: "arrived" }]
    }),
    "no_progress"
  );
});

test("inspect_chest verifies container access without durable social-cycle progress", () => {
  assert.equal(
    deriveProgressVerifierStatus({ toolAttempts: [{ tool: "inspect_chest", status: "inspected" }] }),
    "passed"
  );
  assert.equal(isDurableProgressVerifier("passed", ["inspect_chest"]), false);
  assert.equal(
    deterministicJudgmentOutcome({
      verifierStatus: "passed",
      executedTools: ["inspect_chest"],
      toolStatuses: [{ tool: "inspect_chest", status: "inspected" }]
    }),
    "no_progress"
  );
});

test("run_mineflayer_program completion without helper evidence does not pass progress", () => {
  assert.equal(
    deriveProgressVerifierStatus({
      toolAttempts: [{ tool: "run_mineflayer_program", status: "completed" }]
    }),
    "failed"
  );
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

test("executor records missing direct primitive args as contract evidence", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "social-contract-block-"));
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
      summary: "record invalid direct primitive args",
      rationale: "The runtime should preserve contract failures as evidence.",
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
      allowed_primitive_ids: ["craft_item"],
      stop_conditions: ["gate_blocked"]
    },
    intent: {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "use_primitive",
      primitive_id: "craft_item",
      args: {},
      why_this_action: "Gemini forgot itemName",
      expected_evidence: ["action_intent_contract_failure"],
      fallback_if_blocked: "observe"
    },
    bot: fakeObserveBot(),
    activeActionSkills: [
      testActionSkillRecord("craftPlanksAndSticks", ["craft_item"], "npc_b")
    ]
  });

  assert.equal(result.contractBlocked, true);
  assert.equal(result.gateBlocked, true);
  assert.deepEqual(result.executedTools, ["craft_item"]);
  assert.match(JSON.stringify(result.runtimeResult), /craft_item requires itemName/);
  assert.match(result.evidenceRefs[0] ?? "", /args-contract-blocked/);
});

test("executor rejects direct primitive args actionSkillId fallback", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "social-direct-fallback-"));
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
      summary: "reject direct fallback smuggling",
      rationale: "Direct primitive authority is not actor-owned action skill authority.",
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
      allowed_primitive_ids: ["craft_item"],
      stop_conditions: ["gate_blocked"]
    },
    intent: {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "use_primitive",
      primitive_id: "craft_item",
      args: { actionSkillId: "craftPlanksAndSticks" },
      why_this_action: "try to borrow action skill fallback from direct primitive args",
      expected_evidence: ["action_intent_contract_failure"],
      fallback_if_blocked: "observe"
    },
    bot: fakeObserveBot(),
    activeActionSkills: [
      testActionSkillRecord("craftPlanksAndSticks", ["craft_item"], "npc_b")
    ]
  });

  assert.equal(result.contractBlocked, true);
  assert.deepEqual(result.executedTools, ["craft_item"]);
  assert.match(JSON.stringify(result.runtimeResult), /Direct primitive intents cannot carry args.actionSkillId/);
});

test("executor authors and trials a generated action skill candidate only through action selection", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "social-author-trial-"));
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
      summary: "author a reusable speech candidate",
      rationale: "Generated action skills must originate at action selection.",
      derived_from: {
        soul_ref: "soul.json",
        observation_refs: [],
        world_event_refs: [],
        memory_refs: [],
        relationship_refs: [],
        previous_cycle_judgment_refs: []
      },
      success_condition: {
        verifier: "generated_action_skill_trial",
        evidence_required: ["action_skill_candidate_trial"]
      },
      allowed_action_skill_ids: [],
      allowed_primitive_ids: ["run_mineflayer_program"],
      stop_conditions: ["trial_complete"]
    },
    intent: {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "author_and_trial_action_skill",
      args: {},
      parameters: { text: "bring logs to the shared chest" },
      candidate: {
        schema: "generated-action-skill-candidate/v1",
        proposed_skill_id: "saySharedChestNeed",
        purpose: "Say a concrete shared-storage need with helper evidence.",
        source_language: "typescript",
        source: "export async function run(ctx, params) { return ctx.say(params.text); }",
        input_schema: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: { text: { type: "string" } }
        },
        helper_api_version: "mineflayer-action-skill-helper/v1",
        helper_allowlist: ["say"],
        timeout_ms: 5_000,
        verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
        promotion_policy: "promote_after_passed_trial",
        known_failure_modes: ["target actor may be busy"]
      },
      why_this_action: "A reusable generated candidate is more precise than another memory note.",
      expected_evidence: ["helper say delivered", "post observation"],
      fallback_if_blocked: "remember the candidate trial blocker"
    },
    bot: fakeObserveBot(),
    targetBot: fakeObserveBot("npc_a"),
    activeActionSkills: [
      testActionSkillRecord("runBoundedMineflayerProgram", ["run_mineflayer_program"], "npc_b")
    ]
  });

  assert.equal(result.verifierStatus, "passed");
  assert.deepEqual(result.executedTools, ["run_mineflayer_program"]);
  assert.equal((result.runtimeResult as { status?: string }).status, "promotable");

  const proposalRef = result.evidenceRefs.find((ref) =>
    ref.includes("action-skills/candidates/cycle-0001-author-saySharedChestNeed.json")
  );
  assert.ok(proposalRef);
  const proposal = JSON.parse(
    await fs.readFile(path.join(workspaceRoot, "npc_b", proposalRef), "utf8")
  );
  assert.equal(proposal.generated_lifecycle_status, "promotable");
  assert.equal(proposal.generated_parameters.text, "bring logs to the shared chest");
  assert.equal(proposal.status, "draft");
  assert.match(proposal.legacy_generated_code, /ctx\.say/);

  const trialRef = result.evidenceRefs.find((ref) =>
    ref.includes("generated-action-skill-trial-saySharedChestNeed.json")
  );
  assert.ok(trialRef);
  const trialEvidence = JSON.parse(
    await fs.readFile(path.join(workspaceRoot, "npc_b", trialRef), "utf8")
  );
  assert.equal(trialEvidence.category, "action_skill_candidate_trial");
  assert.equal(trialEvidence.data.generated_lifecycle_status, "promotable");
  assert.equal(trialEvidence.data.verifier_status, "passed");

  const activeRecords = await listActiveActorActionSkillRecords(workspaceRoot, "npc_b");
  const activeGenerated = activeRecords.find(
    (record) => record.skill_id === "saySharedChestNeed"
  );
  assert.ok(activeGenerated);
  assert.equal(activeGenerated.status, "active");
  assert.equal(activeGenerated.source_kind, "learned");
  assert.deepEqual(activeGenerated.required_primitives, ["run_mineflayer_program"]);
  assert.match(activeGenerated.generated_source ?? "", /ctx\.say/);
  assert.deepEqual(activeGenerated.generated_helper_allowlist, ["say"]);

  const reused = await executeSocialActionIntent({
    actorWorkspaceRootDir: workspaceRoot,
    actorId: "npc_b",
    cycleId: "cycle-0002",
    cycleGoal: {
      schema: "actor-cycle-goal/v1",
      actor_id: "npc_b",
      goal_id: "cycle-goal-2",
      life_goal_id: "life-goal-1",
      cycle_id: "cycle-0002",
      status: "active",
      source: "llm_planner",
      summary: "Reuse generated speaking action",
      rationale: "Active generated action skills must execute stored source with new parameters.",
      derived_from: {
        soul_ref: "soul.json",
        observation_refs: [],
        world_event_refs: [],
        memory_refs: [],
        relationship_refs: [],
        previous_cycle_judgment_refs: []
      },
      success_condition: {
        verifier: "generated_action_skill_reuse",
        evidence_required: ["run_mineflayer_program"]
      },
      allowed_action_skill_ids: ["saySharedChestNeed"],
      allowed_primitive_ids: ["run_mineflayer_program"],
      stop_conditions: ["verifier_passed"]
    },
    intent: {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0002",
      cycle_goal_id: "cycle-goal-2",
      kind: "use_action_skill",
      action_skill_id: "saySharedChestNeed",
      args: {},
      parameters: { text: "new shared chest message" },
      why_this_action: "Reuse the generated speaking action with current text.",
      expected_evidence: ["helper say delivered"],
      fallback_if_blocked: "remember reuse blocker"
    },
    bot: fakeObserveBot(),
    targetBot: fakeObserveBot("npc_a"),
    activeActionSkills: activeRecords
  });

  assert.equal(reused.verifierStatus, "passed");
  assert.deepEqual(reused.executedTools, ["run_mineflayer_program"]);
  assert.match(JSON.stringify(reused.runtimeResult), /new shared chest message/);
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

test("executor treats CycleGoal primitive lists as advisory and keeps active action-skill gate authority", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "social-open-body-"));
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
      summary: "Do not narrow the runtime body",
      rationale: "CycleGoal allowed lists are compatibility fields.",
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
      allowed_primitive_ids: ["observe"],
      stop_conditions: ["gate_blocked"]
    },
    intent: {
      schema: "action-intent/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "wait",
      args: { ticks: 1 },
      why_this_action: "prove CycleGoal does not shrink the body",
      expected_evidence: ["tool_attempt"],
      fallback_if_blocked: "remember"
    },
    activeActionSkills: [
      testActionSkillRecord("runtimeObserveAndRemember", ["observe", "wait", "remember"], "npc_b")
    ]
  });

  assert.equal(result.gateBlocked, false);
  assert.deepEqual(result.executedTools, ["wait"]);
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

test("social action skill postcondition accepts verified consumption evidence", () => {
  const result = evaluateSocialActionSkillPostcondition({
    actionSkillId: "eatFoodWhenHungry",
    evidenceRefs: ["evidence/cycle-0001-consume_item.json"],
    toolResults: [
      {
        tool: "consume_item",
        status: "consumed",
        evidence_ref: "evidence/cycle-0001-consume_item.json",
        result: {
          status: "consumed",
          itemName: "bread"
        }
      }
    ]
  });

  assert.equal(result.status, "passed");
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

test("settlement state carries direct primitive crafting-table placement forward", () => {
  const state = buildSettlementState({
    actorId: "npc_b",
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [],
      memory: [],
      inventory: []
    },
    activeActionSkills: [],
    previousJudgments: [],
    recentToolResults: [
      {
        tool: "place_block",
        status: "placed",
        evidence_ref: "evidence/cycle-0001-place_block.json",
        result: {
          status: "placed",
          itemName: "crafting_table",
          targetPosition: { x: 1, y: 64, z: 0 }
        }
      }
    ],
    evidenceRefs: []
  });

  assert.equal(state.progress.has_crafting_table, true);
  assert.equal(state.known_positions.crafting_table?.status, "placed");
  assert.deepEqual(state.known_positions.crafting_table?.position, { x: 1, y: 64, z: 0 });
  assert.deepEqual(
    state.checklist.items.find((item) => item.id === "crafting_table_known_or_placed")?.evidence_refs,
    ["evidence/cycle-0001-place_block.json"]
  );
});
