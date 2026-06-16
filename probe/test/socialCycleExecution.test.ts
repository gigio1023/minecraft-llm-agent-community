/** Regression coverage for the Actor Turn social-cycle executor path. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { Bot } from "mineflayer";

import {
  compileSocialAllowedPrimitives,
  executeActorTurnAction,
  resolvePrimitivesForActorTurnAction
} from "../src/runtime/socialCycleExecution.js";
import { listActiveActorActionSkillRecords } from "../src/runtime/actorWorkspace.js";
import type { ActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import type { ActorCycleGoal } from "../src/runtime/goals/types.js";
import type { ActorTurnResolvedAction, JsonObject } from "../src/runtime/goals/actorEpisode/index.js";
import {
  buildRuntimeRetryAttempt,
  deriveRuntimeRetryConstraints,
  findMatchingRuntimeRetryConstraint
} from "../src/runtime/retryConstraints.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";

function fakeBot(username = "npc_b"): Bot {
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

function cycleGoal(overrides: Partial<ActorCycleGoal> = {}): ActorCycleGoal {
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: "npc_b",
    goal_id: "cycle-goal-1",
    life_goal_id: "life-goal-1",
    cycle_id: "cycle-0001",
    status: "active",
    source: "llm_planner",
    summary: "Exercise the Actor Turn executor.",
    rationale: "Executor behavior must be evidence-backed.",
    derived_from: {
      soul_ref: "soul.json",
      observation_refs: [],
      world_event_refs: [],
      memory_refs: [],
      relationship_refs: [],
      previous_cycle_judgment_refs: []
    },
    success_condition: {
      verifier: "runtime evidence",
      evidence_required: ["runtime evidence"]
    },
    allowed_action_skill_ids: [],
    allowed_primitive_ids: ["observe", "craft_item", "run_mineflayer_program"],
    stop_conditions: [],
    ...overrides
  };
}

function primitiveAction(input: {
  primitiveId: string;
  parameters?: JsonObject;
  expectedOutcome?: ActorTurnResolvedAction["expected_outcome"];
}): ActorTurnResolvedAction {
  return {
    schema: "actor-turn-resolved-action/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_primitive",
    action_card_id: `primitive:${input.primitiveId}`,
    primitive_id: input.primitiveId,
    parameters: input.parameters ?? {},
    expected_outcome: input.expectedOutcome ?? "record_blocker_or_done",
    why_this_action: "Test Actor Turn primitive execution.",
    expected_evidence: ["runtime evidence"],
    fallback_if_blocked: "record blocker"
  };
}

function actionSkillAction(input: {
  actionSkillId: string;
  parameters?: JsonObject;
  expectedOutcome?: ActorTurnResolvedAction["expected_outcome"];
}): ActorTurnResolvedAction {
  return {
    schema: "actor-turn-resolved-action/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_action_skill",
    action_card_id: `action-skill:${input.actionSkillId}`,
    action_skill_id: input.actionSkillId,
    parameters: input.parameters ?? {},
    expected_outcome: input.expectedOutcome ?? "record_blocker_or_done",
    why_this_action: "Test Actor Turn action-skill execution.",
    expected_evidence: ["runtime evidence"],
    fallback_if_blocked: "record blocker"
  };
}

test("role-safe social affordances expose the runtime body without a planner path", () => {
  const gatherer = compileSocialAllowedPrimitives("gatherer");
  assert.ok(gatherer.includes("collect_logs"));
  assert.ok(gatherer.includes("move_to"));
  assert.ok(gatherer.includes("run_mineflayer_program"));
  assert.ok(gatherer.includes("observe"));

  const crafter = compileSocialAllowedPrimitives("crafter");
  assert.ok(crafter.includes("craft_item"));
  assert.ok(crafter.includes("craft_with_table"));
  assert.ok(crafter.includes("say"));
});

test("use_action_skill resolves the owned primitive bundle directly", () => {
  const activeSkills: ActorActionSkillRecord[] = [
    testActionSkillRecord("collectLogs", ["observe", "collect_logs", "wait"], "npc_b")
  ];

  const resolved = resolvePrimitivesForActorTurnAction(
    actionSkillAction({ actionSkillId: "collectLogs" }),
    activeSkills
  );

  assert.equal(resolved.actionSkillExecutionUnit, true);
  assert.deepEqual(resolved.primitives, ["observe", "collect_logs", "wait"]);
});

test("executor records missing structured primitive args as contract evidence", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "actor-turn-contract-block-"));
  const result = await executeActorTurnAction({
    actorWorkspaceRootDir: workspaceRoot,
    actorId: "npc_b",
    cycleId: "cycle-0001",
    cycleGoal: cycleGoal({
      allowed_primitive_ids: ["place_block"],
      summary: "Record invalid place_block args."
    }),
    action: primitiveAction({ primitiveId: "place_block", expectedOutcome: "world_block_delta" }),
    activeActionSkills: [
      testActionSkillRecord("placeBlock", ["place_block"], "npc_b")
    ],
    bot: fakeBot()
  });

  assert.equal(result.verifierStatus, "failed");
  assert.equal(result.contractBlocked, true);
  assert.deepEqual(result.executedTools, ["place_block"]);
  assert.ok(
    result.evidenceRefs.some((ref) =>
      ref.includes("evidence/cycle-0001-place_block-args-contract-blocked.json")
    )
  );
});

test("Actor Turn generated Mineflayer action can promote and be reused as an owned action skill", async () => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "actor-turn-generated-"));
  const result = await executeActorTurnAction({
    actorWorkspaceRootDir: workspaceRoot,
    actorId: "npc_b",
    cycleId: "cycle-0001",
    cycleGoal: cycleGoal({
      allowed_primitive_ids: ["run_mineflayer_program"],
      success_condition: {
        verifier: "generated_action_skill_trial",
        evidence_required: ["action_skill_candidate_trial"]
      }
    }),
    action: {
      schema: "actor-turn-resolved-action/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "cycle-goal-1",
      kind: "author_mineflayer_action",
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
      expected_outcome: "social_delta",
      why_this_action: "A reusable generated candidate is more precise than another memory note.",
      expected_evidence: ["helper say delivered", "post observation"],
      fallback_if_blocked: "remember the candidate trial blocker"
    },
    activeActionSkills: [
      testActionSkillRecord("runBoundedMineflayerProgram", ["run_mineflayer_program"], "npc_b")
    ],
    bot: fakeBot(),
    targetBot: fakeBot("npc_a")
  });

  assert.equal(result.verifierStatus, "passed");
  assert.deepEqual(result.executedTools, ["run_mineflayer_program"]);

  const proposalRef = result.evidenceRefs.find((ref) =>
    ref.includes("action-skills/candidates/cycle-0001-author-saySharedChestNeed.json")
  );
  assert.ok(proposalRef);
  const proposal = JSON.parse(
    await fs.readFile(path.join(workspaceRoot, "npc_b", proposalRef), "utf8")
  );
  assert.equal(proposal.generated_lifecycle_status, "promotable");
  assert.match(proposal.generated_source, /ctx\.say/);

  const activeRecords = await listActiveActorActionSkillRecords(workspaceRoot, "npc_b");
  const activeGenerated = activeRecords.find((record) => record.skill_id === "saySharedChestNeed");
  assert.ok(activeGenerated);
  assert.equal(activeGenerated.status, "active");
  assert.match(activeGenerated.generated_source ?? "", /ctx\.say/);

  const reused = await executeActorTurnAction({
    actorWorkspaceRootDir: workspaceRoot,
    actorId: "npc_b",
    cycleId: "cycle-0002",
    cycleGoal: cycleGoal({
      cycle_id: "cycle-0002",
      goal_id: "cycle-goal-2",
      allowed_action_skill_ids: ["saySharedChestNeed"],
      allowed_primitive_ids: ["run_mineflayer_program"]
    }),
    action: {
      ...actionSkillAction({
        actionSkillId: "saySharedChestNeed",
        parameters: { text: "new shared chest message" },
        expectedOutcome: "social_delta"
      }),
      cycle_id: "cycle-0002",
      cycle_goal_id: "cycle-goal-2"
    },
    activeActionSkills: activeRecords,
    bot: fakeBot(),
    targetBot: fakeBot("npc_a")
  });

  assert.equal(reused.verifierStatus, "passed");
  assert.deepEqual(reused.executedTools, ["run_mineflayer_program"]);
});

test("runtime retry constraints canonicalize equivalent move_to target args", () => {
  const attempts = [
    primitiveAction({
      primitiveId: "move_to",
      parameters: { targetPosition: { x: -8, y: 99, z: 3 } },
      expectedOutcome: "position_delta"
    }),
    primitiveAction({
      primitiveId: "move_to",
      parameters: { position: { x: -8, y: 99, z: 3 } },
      expectedOutcome: "position_delta"
    }),
    primitiveAction({
      primitiveId: "move_to",
      parameters: { x: -8, y: 99, z: 3 },
      expectedOutcome: "position_delta"
    })
  ].map((action, index) =>
    buildRuntimeRetryAttempt({
      actorId: "npc_b",
      cycleId: `cycle-000${index + 1}`,
      turnId: `cycle-000${index + 1}-action-01`,
      actionIndex: 0,
      intent: action,
      execution: {
        runtimeResult: {
          status: "blocked",
          reason: "move_to failed: Path was stopped before it could be completed!"
        },
        evidenceRefs: [`evidence/cycle-000${index + 1}-move_to.json`],
        verifierStatus: "failed",
        toolStatuses: [{ tool: "move_to", status: "blocked" }]
      }
    })
  );

  assert.ok(attempts.every(Boolean));
  assert.equal(new Set(attempts.map((attempt) => attempt?.args_fingerprint)).size, 1);

  const constraints = deriveRuntimeRetryConstraints({
    actorId: "npc_b",
    attempts: attempts.filter((attempt): attempt is NonNullable<typeof attempt> => attempt !== null)
  });

  assert.equal(constraints.length, 1);
  assert.equal(constraints[0]?.repeat_count, 3);
  assert.ok(findMatchingRuntimeRetryConstraint(
    primitiveAction({
      primitiveId: "move_to",
      parameters: { targetPosition: { x: -8, y: 99, z: 3 } },
      expectedOutcome: "position_delta"
    }),
    constraints
  ));
  assert.equal(findMatchingRuntimeRetryConstraint(
    primitiveAction({
      primitiveId: "move_to",
      parameters: { targetPosition: { x: -2, y: 99, z: 3 } },
      expectedOutcome: "position_delta"
    }),
    constraints
  ), null);
});
