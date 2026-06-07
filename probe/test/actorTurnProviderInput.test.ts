/** Regression coverage for Actor Turn provider packet and decision-frame policy. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assembleSocialCycleContext } from "../src/runtime/goals/cycleContextAssembler.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import {
  buildActionCardProjection,
  buildActiveEpisodeFromCycleGoal,
  buildActorTurnInput,
  resolveActionCardMapping,
  validateActorTurnInput
} from "../src/runtime/goals/actorEpisode/index.js";
import type { ActorCycleGoal, CycleJudgment } from "../src/runtime/goals/types.js";
import { buildNpcBActionSkillRecord } from "./helpers/socialCycleTestHelpers.js";
import {
  buildGeminiFunctionDeclarationsFromTools,
  normalizeGeminiFunctionCalls
} from "../src/provider/geminiApiToolProvider.js";
import {
  buildRepairActorTurnInput,
  buildMineflayerCodegenRequest,
  buildActorTurnToolSelectionPayload,
  parseMineflayerCodegenProviderOutput,
  parseActorTurnToolSelection
} from "../src/provider/socialActorTurnProvider.js";
import type { ActorTurnAuthorMineflayerActionArgs } from "../src/provider/socialActorTurnToolParser.js";
import type { ActorTurnInput } from "../src/runtime/goals/actorEpisode/index.js";
import type { PlanBeadPacket } from "../src/runtime/goals/planBeads/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `actor-turn-input-${process.pid}`);

function lifeGoal() {
  const soul = compileActorSoulFromProfile("npc_b");
  return {
    schema: "actor-life-goal/v1" as const,
    actor_id: "npc_b",
    goal_id: "life-1",
    objective: soul.life_goal,
    status: "active" as const,
    source: "actor_soul" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    cycle_count: 0,
    action_count: 0,
    evidence_refs: [],
    memory_refs: [],
    relationship_refs: []
  };
}

function cycleGoal(): ActorCycleGoal {
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: "npc_b",
    goal_id: "cycle-goal-1",
    life_goal_id: "life-1",
    cycle_id: "cycle-0001",
    status: "active",
    source: "llm_planner",
    summary: "Repair crafting-table access and continue visible settlement work.",
    rationale: "The actor needs concrete toolmaking progress without forgetting the shared obligation.",
    derived_from: {
      soul_ref: "goals/soul/soul-npc_b.json",
      observation_refs: ["observations/cycle-0001.json"],
      world_event_refs: ["events/shared-tool-request.json"],
      memory_refs: [],
      relationship_refs: [],
      previous_cycle_judgment_refs: ["judgments/cycle-0000.json"],
      plan_bead_refs: ["plan-beads/beads/bead-crafting-table-access.json"]
    },
    success_condition: {
      verifier: "runtime evidence",
      evidence_required: ["block, inventory, container, or chat evidence"]
    },
    allowed_action_skill_ids: [],
    allowed_primitive_ids: ["observe", "move_to", "place_block", "say", "remember"],
    stop_conditions: ["same blocker repeats twice", "new social request appears"]
  };
}

function planBeadPacket(): PlanBeadPacket {
  return {
    schema: "plan-bead-packet/v1",
    physical_progress_claim: false,
    ready_beads: [
      {
        bead_id: "bead-crafting-table-access",
        kind: "blocker_repair",
        status: "open",
        priority: 0,
        title: "Repair crafting table placement",
        description_summary: "The prior placement target was occupied; choose a valid adjacent target before table-sized crafting.",
        acceptance_evidence_required: ["placed crafting_table block evidence or inventory evidence explaining why placement is deferred"],
        notes_next: ["Use current_state before choosing a place-block action."],
        blockers: ["occupied target from prior placement attempt"],
        labels: ["toolmaking"],
        evidence_refs: ["evidence/cycle-0000-place-failed.json"],
        dependency_refs: ["plan-bead-dependency:npc_b:bead-crafting-table-access:blocks:bead-toolmaking"],
        checkpoint_version: 2,
        checkpoint_ref: "plan-beads/beads/bead-crafting-table-access.json"
      }
    ],
    in_progress_beads: [],
    blocked_beads: [],
    recently_closed_beads: [],
    graph_summary: {
      open_count: 1,
      ready_count: 1,
      blocked_count: 0,
      deferred_count: 0,
      closed_recent_count: 0
    },
    rules: {
      beads_are_context_not_authority: true,
      ready_front_guides_goal_selection: true,
      action_surface_controls_execution: true,
      runtime_verifies_physical_progress: true
    }
  };
}

function primitiveContract(primitiveId: string) {
  return {
    schema: "actor-turn-action-parameters/v1" as const,
    primitive_id: primitiveId,
    required_structured_args: [],
    accepted_forms: [],
    hidden_defaults_allowed: false as const,
    prose_fields_are_authority: false as const
  };
}

function buildPlaceCraftingTableRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "placeCraftingTable",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "place_block", "wait"],
    preconditions: ["inventory has crafting_table", "no usable crafting_table already known"],
    success_verifier: "placed or confirmed reachable crafting_table",
    known_failure_modes: ["target cell occupied", "crafting_table already usable"],
    evidence_refs: [],
    review_refs: []
  };
}

function buildCraftCraftingTableRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "craftCraftingTable",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "craft_item", "wait"],
    preconditions: [
      "inventory has planks >= 4",
      "no usable crafting_table already known",
      "no crafting_table item already carried"
    ],
    success_verifier: "crafted crafting_table inventory delta",
    known_failure_modes: ["not enough planks", "crafting_table already usable"],
    evidence_refs: [],
    review_refs: []
  };
}

function buildCraftPlanksAndSticksRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "craftPlanksAndSticks",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "craft_item", "wait"],
    preconditions: [
      "inventory has logs",
      "basic planks/sticks need not already satisfied"
    ],
    success_verifier: "planks or sticks added to inventory",
    known_failure_modes: ["missing logs", "basic planks and sticks already sufficient"],
    evidence_refs: [],
    review_refs: []
  };
}

function buildCraftWoodenPickaxeRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "craftWoodenPickaxe",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "craft_with_table", "wait"],
    preconditions: [
      "inventory has planks >= 3",
      "inventory has sticks >= 2",
      "crafting_table nearby",
      "no wooden_pickaxe already carried"
    ],
    success_verifier: "wooden_pickaxe inventory increase",
    known_failure_modes: ["missing ingredients", "already carrying wooden_pickaxe"],
    evidence_refs: [],
    review_refs: []
  };
}

function buildMineCobblestoneRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "mineCobblestone",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "mine_block", "wait"],
    preconditions: ["inventory has wooden_pickaxe or stone_pickaxe"],
    success_verifier: "cobblestone inventory increase",
    known_failure_modes: ["no reachable stone", "missing pickaxe"],
    evidence_refs: [],
    review_refs: []
  };
}

function buildDepositSharedItemsRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "depositSharedItems",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "inspect_chest", "deposit_shared", "wait"],
    preconditions: ["shared chest nearby", "inventory has depositable items"],
    success_verifier: "shared chest contents increased",
    known_failure_modes: ["shared chest unavailable", "nothing depositable"],
    evidence_refs: [],
    review_refs: []
  };
}

function buildHandoffItemAtChestRecord() {
  return {
    schema: "actor-action-skill/v1" as const,
    skill_id: "handoffItemAtChest",
    owner_actor_id: "npc_b",
    source_kind: "seed" as const,
    status: "active" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    required_primitives: ["observe", "inspect_chest", "deposit_shared", "say", "wait"],
    preconditions: [
      "shared chest nearby",
      "obligation pending",
      "inventory has depositable items",
      "target actor visible"
    ],
    success_verifier: "deposit operation moves a positive item count into shared storage",
    known_failure_modes: ["shared chest unavailable", "requesting actor not visible"],
    evidence_refs: [],
    review_refs: []
  };
}

test("Action Card projection exposes primitive/action-skill choice through cards", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0000",
    cycle_goal_id: "cycle-goal-0",
    outcome: "blocked",
    what_happened: "Crafting table placement target was occupied.",
    why_it_mattered_for_life_goal: "The actor must repair parameters instead of observing forever.",
    verifier_status: "failed",
    evidence_refs: ["evidence/cycle-0000-place-failed.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: ["choose a different explicit placement target"]
  };
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-shared-tools",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requested visible shared toolmaking progress.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["events/shared-tool-request.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [{ ref: "judgments/cycle-0000.json", judgment }],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      {
        schema: "actor-action-skill/v1",
        skill_id: "placeBlockNearby",
        owner_actor_id: "npc_b",
        source_kind: "seed",
        status: "active",
        created_at: "2026-06-03T00:00:00.000Z",
        updated_at: "2026-06-03T00:00:00.000Z",
        required_primitives: ["place_block", "observe"],
        preconditions: ["inventory contains the block item"],
        success_verifier: "placed block is visible in post-observation",
        known_failure_modes: ["target cell occupied"],
        evidence_refs: [],
        review_refs: []
      }
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [{ actor_id: "npc_a" }],
      inventory: [{ name: "crafting_table", count: 1 }],
      nearbyBlocks: [{ name: "grass_block", position: { x: 1, y: 63, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "move_to", "place_block", "say", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [
      {
        schema: "runtime-retry-constraint/v1",
        constraint_id: "retry-place-table-occupied-cell",
        actor_id: "npc_b",
        action_kind: "use_primitive",
        target: { kind: "primitive", id: "place_block", primitive_id: "place_block" },
        args_fingerprint: "occupied-cell",
        args_normalized: { itemName: "crafting_table", targetPosition: { x: 1, y: 64, z: 0 } },
        blocker_key: "occupied_cell",
        blocker_status: "blocked",
        blocker_reason: "target cell was occupied",
        repeat_count: 2,
        attempt_refs: ["turn-000"],
        evidence_refs: ["evidence/cycle-0000-place-failed.json"],
        rule: {
          same_target_and_args_blocked: true,
          provider_must_pivot_or_repair_args: true,
          runtime_blocks_before_mineflayer: true
        }
      }
    ]
  });

  const projection = buildActionCardProjection(context.action_surface);
  assert.equal(projection.schema, "action-card-projection/v1");
  assert.equal(projection.actor_id, "npc_b");
  assert.ok(projection.action_cards.some((card) => card.title === "Place Block"));
  assert.equal(
    (projection.action_cards[0] as Record<string, unknown>).primitive_id,
    undefined
  );
  assert.equal(
    (projection.action_cards[0] as Record<string, unknown>).action_skill_id,
    undefined
  );
  const placeBlockNearbyCard = projection.action_cards.find((card) => card.title === "Place Block Nearby");
  assert.ok(placeBlockNearbyCard);
  assert.match(placeBlockNearbyCard.description, /Advisory current-state hints/);
  assert.ok(
    placeBlockNearbyCard.parameter_hints.some((hint) =>
      hint.includes("Advisory current_state hint: inventory contains the block item")
    )
  );
  assert.ok(
    placeBlockNearbyCard.current_state_requirements.includes("inventory contains the block item")
  );
  assert.ok(
    placeBlockNearbyCard.likely_blockers.some((blocker) =>
      blocker.includes("risky if current_state lacks support")
    )
  );
  const placeBlockCard = projection.action_cards.find((card) => card.title === "Place Block");
  assert.ok(placeBlockCard);
  const mapping = resolveActionCardMapping(projection, placeBlockCard.action_card_id);
  assert.deepEqual(mapping, {
    kind: "use_primitive",
    action_card_id: placeBlockCard.action_card_id,
    primitive_id: "place_block"
  });

  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0001",
    context,
    cycleGoal: cycleGoal(),
    selectedPlanBeadRefs: ["plan-beads/beads/bead-crafting-table-access.json"],
    startedAtTurnRef: "turns/turn-001.json"
  });
  const activeEpisodeWithoutExplicitSelection = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0001-auto-anchor",
    context,
    cycleGoal: {
      ...cycleGoal(),
      derived_from: {
        ...cycleGoal().derived_from,
        plan_bead_refs: []
      }
    },
    startedAtTurnRef: "turns/turn-001.json"
  });
  assert.deepEqual(activeEpisodeWithoutExplicitSelection.selected_plan_bead_refs, [
    "bead-crafting-table-access"
  ]);

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-001",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0001.json"],
    providerBudgetHint: {
      provider_id: "gemini-api",
      model: "gemma-4-31b-it",
      status: "ok",
      remaining_turns_hint: 30
    }
  });
  const repeatedObserveTurn = buildActorTurnInput({
    turnId: "turn-002",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0002.json"],
    recentEvidenceTrace: [
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-001",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/actor-turn-actions/turn-001-actor-turn-action.json",
        runtime_gate_ref: "runtime-gates/turn-001.json",
        outcome: "no_progress",
        compact_summary: "turn-001 observe -> completed"
      }
    ]
  });
  assert.equal(
    repeatedObserveTurn.actorTurnInput.action_cards.some((card) => card.title === "Observe"),
    true
  );
  assert.ok(
    repeatedObserveTurn.actorTurnInput.action_cards.some((card) => card.title === "Place Block")
  );
  assert.equal(
    repeatedObserveTurn.actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("observe suppressed")
    ),
    false
  );

  assert.ok(actionCardProjection.action_cards.length <= projection.action_cards.length);
  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
  assert.deepEqual(actorTurnInput.current_state.inventory_counts, { crafting_table: 1 });
  assert.equal(actorTurnInput.current_state.position?.x, 0);
  assert.equal(actorTurnInput.current_state.visible_actors[0]?.id, "npc_a");
  assert.equal(actorTurnInput.current_state.nearby_block_observations[0]?.name, "grass_block");
  assert.equal(actorTurnInput.source_evidence_bundle.observation.nearby_blocks[0]?.name, "grass_block");
  assert.deepEqual(actorTurnInput.source_evidence_bundle.observation.nearby_blocks[0]?.evidence_refs, [
    "observations/cycle-0001.json"
  ]);
  assert.equal(
    actorTurnInput.current_state.settlement_progress.checklist.some((item) =>
      item.id === "crafting_table_known_or_placed"
    ),
    true
  );
  const actorTurnPlaceBlockCard = actorTurnInput.action_cards.find((card) => card.title === "Place Block");
  assert.ok(actorTurnPlaceBlockCard);
  assert.ok(
    actorTurnPlaceBlockCard.current_state_requirements.includes("check whether inventory has the requested block item")
  );
  assert.equal(actorTurnInput.runtime_retry_constraints.length, 1);
  const planBeadCard = actorTurnInput.source_evidence_bundle.plan_bead_cards[0];
  assert.equal(planBeadCard?.bead_id, "bead-crafting-table-access");
  assert.deepEqual(actorTurnInput.active_episode.selected_plan_bead_refs, [
    "plan-beads/beads/bead-crafting-table-access.json"
  ]);
  assert.equal(planBeadCard?.priority, 0);
  assert.deepEqual(planBeadCard?.next_hints, [
    "Use current_state before choosing a place-block action."
  ]);
  assert.deepEqual(planBeadCard?.blockers, [
    "occupied target from prior placement attempt"
  ]);
  assert.equal(
    planBeadCard?.dependency_refs[0],
    "plan-bead-dependency:npc_b:bead-crafting-table-access:blocks:bead-toolmaking"
  );
  assert.equal(
    planBeadCard?.checkpoint_ref,
    "plan-beads/beads/bead-crafting-table-access.json"
  );
  assert.equal(actorTurnInput.relationship_context.visible_actor_ids[0], "npc_a");
  assert.match(actorTurnInput.minecraft_basic_guide.item_flows.join("\n"), /log -> matching planks/);

  const toolPayload = buildActorTurnToolSelectionPayload({
    actorTurnInput,
    actionCardProjection,
    runId: "run-1"
  });
  assert.doesNotMatch(toolPayload.user, /# Mineflayer Code Generation/);
  assert.doesNotMatch(toolPayload.user, /Required Output Shape/);
  assert.equal(toolPayload.usageContext.stage, "actor_turn_tool_selection");
  assert.match(toolPayload.system, /Call exactly one function tool/);
  assert.match(toolPayload.system, /current_state, Action Card hints, or runtime code/);
  assert.match(toolPayload.system, /do not include TypeScript source/);
  assert.match(toolPayload.system, /never add context_to_preserve/);
  const placeBlockTool = toolPayload.tools.find((tool) =>
    toolPayload.actionCardToolMappings.some((mapping) =>
      mapping.action_card_id === placeBlockCard.action_card_id && mapping.tool_name === tool.name
    )
  );
  assert.ok(placeBlockTool);
  assert.equal(placeBlockTool.strict, true);
  assert.equal(
    (placeBlockTool.parameters as { additionalProperties?: unknown }).additionalProperties,
    false
  );
  assert.equal(
    toolPayload.tools.some((tool) => tool.name === "author_mineflayer_action" && tool.strict === true),
    true
  );
});

test("Actor Turn input keeps retry-constrained Action Cards visible while exposing structured retry args", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildNpcBActionSkillRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [],
      nearbyBlocks: [{ name: "oak_log", position: { x: 2, y: 64, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "collect_logs", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 9,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [
      {
        schema: "runtime-retry-constraint/v1",
        constraint_id: "retry-collectlogs-empty-args",
        actor_id: "npc_b",
        action_kind: "use_action_skill",
        target: { kind: "action_skill", id: "collectLogs", action_skill_id: "collectLogs" },
        args_fingerprint: "44136fa355b3678a",
        args_normalized: {},
        blocker_key: "blocked:no_reachable_logs",
        blocker_status: "blocked",
        blocker_reason: "collect_logs found no reachable low log block within 24 blocks.",
        repeat_count: 3,
        attempt_refs: ["cycle-0007-action-01", "cycle-0008-action-01"],
        evidence_refs: ["evidence/cycle-0008-action-01-collect_logs.json"],
        rule: {
          same_target_and_args_blocked: true,
          provider_must_pivot_or_repair_args: true,
          runtime_blocks_before_mineflayer: true
        }
      }
    ]
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-retry-collectlogs",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-retry-collectlogs.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-retry-collectlogs",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/retry-collectlogs.json"]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Collect Logs"), true);
  assert.ok(
    actorTurnInput.runtime_retry_constraints.some((constraint) =>
      constraint.target_summary === "use_action_skill:action_skill:collectLogs"
    )
  );
  assert.deepEqual(actorTurnInput.runtime_retry_constraints[0]?.args_normalized, {});
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Collect Logs hidden because runtime_retry_constraint already blocks")
    ),
    false
  );
});

test("Actor Turn input exposes normalized retry args for blocked move_to targets", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildNpcBActionSkillRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [],
      nearbyBlocks: [{ name: "crafting_table", position: { x: -8, y: 99, z: 3 } }]
    },
    allowedPrimitiveIds: ["observe", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 15,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [
      {
        schema: "runtime-retry-constraint/v1",
        constraint_id: "retry-move-to-known-table",
        actor_id: "npc_b",
        action_kind: "use_primitive",
        target: { kind: "primitive", id: "move_to", primitive_id: "move_to" },
        args_fingerprint: "same-target",
        args_normalized: { targetPosition: { x: -8, y: 99, z: 3 } },
        blocker_key: "blocked:path_stopped",
        blocker_status: "blocked",
        blocker_reason: "move_to scout failed: Path was stopped before it could be completed.",
        repeat_count: 3,
        attempt_refs: ["cycle-0011-action-01", "cycle-0015-action-01"],
        evidence_refs: ["evidence/cycle-0015-action-01-move_to.json"],
        rule: {
          same_target_and_args_blocked: true,
          provider_must_pivot_or_repair_args: true,
          runtime_blocks_before_mineflayer: true
        }
      }
    ]
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-move-to-retry-args-visible",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-move-to-retry-args-visible.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-move-to-retry-args-visible",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/move-to-retry-args-visible.json"]
  });

  assert.deepEqual(actorTurnInput.runtime_retry_constraints[0]?.args_normalized, {
    targetPosition: { x: -8, y: 99, z: 3 }
  });
});

test("Actor Turn input keeps Remember visible after repeated no-progress memory turns", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildNpcBActionSkillRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [],
      nearbyBlocks: [{ name: "oak_log", position: { x: 2, y: 64, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "collect_logs", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 14,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-remember-suppressed",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-remember-suppressed.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-remember-suppressed",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/remember-suppressed.json"],
    recentEvidenceTrace: [
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-012",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/actor-turn-actions/turn-012-actor-turn-action.json",
        runtime_gate_ref: "runtime-gates/turn-012.json",
        outcome: "no_progress",
        compact_summary: "turn-012 remember -> wrote a status note without runtime progress"
      },
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-013",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/actor-turn-actions/turn-013-actor-turn-action.json",
        runtime_gate_ref: "runtime-gates/turn-013.json",
        outcome: "no_progress",
        compact_summary: "turn-013 remember -> repeated the same blocker note"
      }
    ]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Remember"), true);
  assert.ok(
    actorTurnInput.action_cards.some((card) => card.title === "Collect Logs" || card.title === "Move To")
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("remember suppressed after repeated no-progress")
    ),
    false
  );
});

test("Actor Turn input keeps Move To visible after repeated movement without durable progress", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildNpcBActionSkillRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [],
      nearbyBlocks: [{ name: "oak_log", position: { x: 2, y: 64, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "collect_logs", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 12,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-move-to-suppressed",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-move-to-suppressed.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-move-to-suppressed",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/move-to-suppressed.json"],
    recentEvidenceTrace: [
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-010",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/actor-turn-actions/turn-010-actor-turn-action.json",
        runtime_gate_ref: "runtime-gates/turn-010.json",
        outcome: "position_delta",
        compact_summary: "turn-010 move_to -> completed"
      },
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-011",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/actor-turn-actions/turn-011-actor-turn-action.json",
        runtime_gate_ref: "runtime-gates/turn-011.json",
        outcome: "no_progress",
        compact_summary: "turn-011 move_to -> completed"
      }
    ]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Move To"), true);
  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Collect Logs"));
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("move_to suppressed")
    ),
    false
  );
});

test("Actor Turn input does not recommend empty parameters for target-required primitives", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildMineCobblestoneRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [{ name: "wooden_pickaxe", count: 1 }],
      nearbyBlocks: [{ name: "stone", position: { x: 2, y: 63, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "mine_block", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 16,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-mine-cobblestone-preferred",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Collect stone using the existing pickaxe.",
      allowed_primitive_ids: ["observe", "mine_block", "move_to", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-mine-cobblestone-preferred.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-mine-cobblestone-preferred",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/mine-cobblestone-preferred.json"]
  });

  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Mine Block"));
  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Mine Cobblestone"));
  assert.ok(
    actorTurnInput.current_state.nearby_block_observations.some((block) => block.name === "stone")
  );
});

test("Actor Turn input keeps cobblestone mining available after repeated successful mining", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildMineCobblestoneRecord(), buildNpcBActionSkillRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [
        { name: "wooden_pickaxe", count: 1 },
        { name: "cobblestone", count: 18 }
      ],
      nearbyBlocks: [{ name: "stone", position: { x: 2, y: 63, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "mine_block", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 19,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-repeated-mine-cobblestone",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Continue useful settlement work after collecting stone.",
      allowed_primitive_ids: ["observe", "mine_block", "move_to", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-repeated-mine-cobblestone.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-repeated-mine-cobblestone",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/repeated-mine-cobblestone.json"],
    recentEvidenceTrace: [1, 2].map((index) => ({
      schema: "evidence-trace/v1" as const,
      turn_id: `turn-mine-${index}`,
      episode_id: activeEpisode.episode_id,
      action_ref: `goals/cycle/actor-turn-actions/turn-mine-${index}-actor-turn-action.json`,
      runtime_gate_ref: `runtime-gates/turn-mine-${index}.json`,
      outcome: "verified_mutation" as const,
      compact_summary: `turn-mine-${index} observe,mine_block,wait -> completed`
    }))
  });

  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Mine Cobblestone"));
  assert.equal(
    actorTurnInput.action_cards.some((card) =>
      card.title === "Mine Cobblestone"
    ),
    true
  );
  assert.equal(
    actorTurnInput.action_cards.some((candidate) =>
      candidate.title === "Mine Cobblestone"
    ),
    true
  );
});

test("Actor Turn input keeps cobblestone mining visible for an explicit shortage", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildMineCobblestoneRecord(), buildNpcBActionSkillRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [
        { name: "wooden_pickaxe", count: 1 },
        { name: "cobblestone", count: 18 }
      ],
      nearbyBlocks: [{ name: "stone", position: { x: 2, y: 63, z: 0 } }]
    },
    allowedPrimitiveIds: ["observe", "mine_block", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 20,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-explicit-cobblestone-shortage",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Need more cobblestone before continuing a stone-heavy repair.",
      allowed_primitive_ids: ["observe", "mine_block", "move_to", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-explicit-cobblestone-shortage.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-explicit-cobblestone-shortage",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/explicit-cobblestone-shortage.json"],
    recentEvidenceTrace: [1, 2].map((index) => ({
      schema: "evidence-trace/v1" as const,
      turn_id: `turn-mine-shortage-${index}`,
      episode_id: activeEpisode.episode_id,
      action_ref: `goals/cycle/actor-turn-actions/turn-mine-shortage-${index}-actor-turn-action.json`,
      runtime_gate_ref: `runtime-gates/turn-mine-shortage-${index}.json`,
      outcome: "verified_mutation" as const,
      compact_summary: `turn-mine-shortage-${index} observe,mine_block,wait -> completed`
    }))
  });

  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Mine Cobblestone"));
  assert.ok(
    actorTurnInput.action_cards.some((card) =>
      card.title === "Mine Cobblestone"
    )
  );
  assert.ok(
    actorTurnInput.action_cards.some((candidate) =>
      candidate.title === "Mine Cobblestone"
    )
  );
  assert.equal(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("cobblestone_stockpile=sufficient")
    ),
    false
  );
});

test("Actor Turn repair input keeps a rejected Action Card visible with contract evidence", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildCraftWoodenPickaxeRecord(), buildMineCobblestoneRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: [
        { name: "wooden_pickaxe", count: 1 },
        { name: "stick", count: 2 }
      ],
      nearbyBlocks: [
        { name: "crafting_table", position: { x: 1, y: 64, z: 0 }, distance: 1 },
        { name: "stone", position: { x: 2, y: 63, z: 0 }, distance: 2 }
      ]
    },
    allowedPrimitiveIds: ["observe", "craft_with_table", "mine_block", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 19,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-repair-visible-cards",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Repair the next useful action after a table-bound contract rejection.",
      allowed_primitive_ids: ["observe", "craft_with_table", "mine_block", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-repair-visible-cards.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-repair-visible-cards",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/repair-visible-cards.json"]
  });
  const rejectedCard = actorTurnInput.action_cards.find((card) => card.title === "Mine Cobblestone");
  assert.ok(rejectedCard);

  const repairInput = buildRepairActorTurnInput({
    actorTurnInput,
    rejectedOutput: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: rejectedCard.action_card_id,
      parameters: {},
      expected_outcome: "record_blocker_or_done",
      why_this_action: "Try the rejected mining card.",
      expected_evidence: ["mine_block evidence"],
      fallback_if_blocked: "choose another visible card"
    },
    errors: [`${rejectedCard.action_card_id} parameters.blockName is required by input_schema`],
    rawRejectedToolCall: {
      type: "function_call",
      name: "action_card_mine_cobblestone",
      call_id: "call-rejected-mine",
      arguments: JSON.stringify({
        parameters: {},
        situation_assessment: "The actor should mine now.",
        why_this_tool: "Mine Cobblestone looked useful.",
        expected_outcome: "inventory_delta",
        success_evidence: ["cobblestone inventory delta"],
        failure_handling: "Try a prerequisite."
      })
    }
  });

  assert.equal(
    repairInput.action_cards.some((card) => card.action_card_id === rejectedCard.action_card_id),
    true
  );
  assert.equal(
    repairInput.action_cards.some((card) =>
      card.action_card_id === rejectedCard.action_card_id
    ),
    true
  );
  assert.ok(
    repairInput.decision_frame.do_not_repeat.some((entry) =>
      entry.includes(`previous Action Card ${rejectedCard.action_card_id} failed contract validation`)
    )
  );
  assert.ok(
    repairInput.decision_frame.next_action_guidance.some((entry) =>
      entry.includes("no Action Card is removed merely because the previous arguments were invalid")
    )
  );
  assert.deepEqual(
    repairInput.runtime_retry_constraints[0]?.args_normalized,
    {
      raw_rejected_function_call: {
        type: "function_call",
        name: "action_card_mine_cobblestone",
        call_id: "call-rejected-mine",
        arguments: JSON.stringify({
          parameters: {},
          situation_assessment: "The actor should mine now.",
          why_this_tool: "Mine Cobblestone looked useful.",
          expected_outcome: "inventory_delta",
          success_evidence: ["cobblestone inventory delta"],
          failure_handling: "Try a prerequisite."
        })
      }
    }
  );
});

test("Actor Turn input exposes shared-storage source evidence without preselecting deposit candidates", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-shared-storage-handoff",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requests that npc_b deposit one oak_log into shared storage before trusting npc_b's next progress claim.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["world-events/evt-shared-storage-handoff.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildDepositSharedItemsRecord(),
      buildHandoffItemAtChestRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [{ actor_id: "npc_a", distance: 2, busy: false }],
      inventory: [{ name: "oak_log", count: 4 }, { name: "leaf_litter", count: 9 }],
      nearbyBlocks: [{ name: "chest", position: { x: 2, y: 64, z: 0 }, distance: 2 }],
      sharedChest: {
        chestId: "shared-chest-spawn",
        items: [{ name: "stick", count: 2 }]
      }
    },
    allowedPrimitiveIds: ["observe", "inspect_chest", "deposit_shared", "say", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-shared-storage-handoff",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Respond to npc_a's shared-storage request with a concrete handoff if possible.",
      rationale: "The actor has useful material and npc_a is visible near a shared chest.",
      allowed_primitive_ids: ["observe", "inspect_chest", "deposit_shared", "say", "wait"]
    },
    startedAtTurnRef: "turns/turn-shared-storage-handoff.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-shared-storage-handoff",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/shared-storage-handoff.json"]
  });

  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
  assert.deepEqual(actorTurnInput.current_state.shared_storage, {
    status: "known",
    chest_id: "shared-chest-spawn",
    items: [{ name: "stick", count: 2 }],
    evidence_refs: []
  });
  assert.equal(actorTurnInput.current_state.inventory_counts.oak_log, 4);
  assert.equal(actorTurnInput.current_state.inventory_counts.leaf_litter, 9);
  assert.ok(
    actorTurnInput.source_evidence_bundle.world_event_cards.some((card) =>
      card.summary.includes("deposit one oak_log")
    )
  );
  assert.ok(
    actorTurnInput.source_evidence_bundle.observation.inventory_items.some((item) =>
      item.name === "oak_log" && item.count === 4
    )
  );
  const depositCard = actorTurnInput.action_cards.find((card) => card.title === "Deposit Shared");
  const handoffCard = actorTurnInput.action_cards.find((card) => card.title === "Handoff Item At Chest");
  assert.ok(depositCard);
  assert.ok(handoffCard);
  assert.ok(
    depositCard.parameter_hints.some((hint) =>
      hint.includes("source_evidence_bundle.world_event_cards")
    )
  );
  assert.ok(
    handoffCard.parameter_hints.some((hint) =>
      hint.includes("provide explicit itemName and count")
    )
  );
  assert.equal(actorTurnInput.decision_frame.episode_focus_status.status, "open");
  assert.ok(
    actorTurnInput.decision_frame.priority_order.some((entry) =>
      entry.includes("source_evidence_bundle")
    )
  );
});

test("Actor Turn input marks Inspect Chest as the bounded container openability check", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [buildNpcBActionSkillRecord(), buildDepositSharedItemsRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [],
      inventory: [],
      nearbyBlocks: [{ name: "chest", position: { x: 2, y: 64, z: 0 }, distance: 2 }],
      sharedChest: {
        chestId: "shared-chest-spawn",
        items: [{ name: "oak_log", count: 1 }]
      }
    },
    allowedPrimitiveIds: ["observe", "inspect_chest", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-inspect-chest",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Check the known shared chest before choosing a storage action.",
      allowed_primitive_ids: ["observe", "inspect_chest", "wait"]
    },
    startedAtTurnRef: "turns/turn-inspect-chest.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-inspect-chest",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/inspect-chest.json"]
  });

  const inspectCard = actorTurnInput.action_cards.find((card) => card.title === "Inspect Chest");
  assert.ok(inspectCard);
  assert.ok(
    inspectCard.parameter_hints.some((hint) =>
      hint.includes("bounded shared-chest container snapshot")
    )
  );
  assert.ok(
    inspectCard.parameter_hints.some((hint) =>
      hint.includes("Current shared_storage status")
    )
  );
});

test("Actor Turn input does not keep a completed one-item shared-storage request socially requested", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-shared-storage-satisfied",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requests that npc_b deposit one oak_log into shared storage before trusting npc_b's next progress claim.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["world-events/evt-shared-storage-satisfied.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildDepositSharedItemsRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [{ actor_id: "npc_a", distance: 2, busy: false }],
      inventory: [{ name: "oak_log", count: 3 }, { name: "leaf_litter", count: 9 }],
      nearbyBlocks: [{ name: "chest", position: { x: 2, y: 64, z: 0 }, distance: 2 }]
    },
    allowedPrimitiveIds: ["observe", "inspect_chest", "deposit_shared", "say", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 2,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [],
    recentToolResults: [
      {
        tool: "deposit_shared",
        status: "deposited",
        evidence_ref: "evidence/cycle-0001-action-01-deposit_shared.json",
        result: {
          status: "deposited",
          chestId: "shared-chest-1",
          itemName: "oak_log",
          movedCount: 1,
          items: [{ name: "oak_log", count: 1 }]
        }
      }
    ]
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-shared-storage-satisfied",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Respond to npc_a's shared-storage request with a concrete handoff if possible.",
      rationale: "The actor already deposited the requested oak_log.",
      allowed_primitive_ids: ["observe", "inspect_chest", "deposit_shared", "say", "wait"]
    },
    startedAtTurnRef: "turns/turn-shared-storage-satisfied.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-shared-storage-satisfied",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/shared-storage-satisfied.json"]
  });

  assert.equal(actorTurnInput.current_state.shared_storage.status, "contributed");
  assert.deepEqual(actorTurnInput.current_state.shared_storage.items, [
    { name: "oak_log", count: 1 }
  ]);
  assert.equal(actorTurnInput.current_state.inventory_counts.oak_log, 3);
  assert.equal(actorTurnInput.current_state.inventory_counts.leaf_litter, 9);
  assert.ok(
    actorTurnInput.source_evidence_bundle.world_event_cards.some((card) =>
      card.summary.includes("deposit one oak_log")
    )
  );
  const depositCard = actorTurnInput.action_cards.find((card) => card.title === "Deposit Shared");
  assert.ok(depositCard);
  assert.ok(actorTurnInput.action_cards.find((card) => card.title === "Inspect Chest"));
  assert.ok(
    depositCard.parameter_hints.some((hint) =>
      hint.includes("source_evidence_bundle.world_event_cards")
    )
  );
  assert.ok(
    depositCard.parameter_hints.some((hint) =>
      hint.includes("provide explicit itemName and count")
    )
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Deposit Shared hidden because shared storage already has contribution evidence")
    ),
    false
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Inspect Chest hidden because shared storage already has contribution evidence")
    ),
    false
  );
  assert.equal(actorTurnInput.decision_frame.episode_focus_status.status, "open");
  assert.ok(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("shared_storage=contributed")
    )
  );
});

test("Actor Turn input keeps blocker-classification focus open after unrelated shared-storage contribution", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-shared-storage-earlier",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requests that npc_b deposit one oak_log into shared storage before trusting npc_b's next progress claim.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["world-events/evt-shared-storage-earlier.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills: [buildDepositSharedItemsRecord()],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [],
      inventory: [{ name: "oak_log", count: 3 }],
      nearbyBlocks: [{ name: "chest", position: { x: 2, y: 64, z: 0 }, distance: 2 }]
    },
    allowedPrimitiveIds: ["observe", "inspect_chest", "deposit_shared", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 30,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [],
    recentToolResults: [
      {
        tool: "deposit_shared",
        status: "deposited",
        evidence_ref: "evidence/cycle-0001-action-01-deposit_shared.json",
        result: {
          status: "deposited",
          chestId: "shared-chest-1",
          itemName: "oak_log",
          movedCount: 1,
          items: [{ name: "oak_log", count: 1 }]
        }
      }
    ]
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-classify-chest-blocker",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Move to an interactable chest-facing position and attempt one chest open/inspection to capture the pre-deposit snapshot; if it fails, store a single non-distance reason judgment and stop.",
      rationale: "The actor needs to explain a container-access blocker instead of claiming the earlier deposit solved it.",
      allowed_primitive_ids: ["observe", "inspect_chest", "deposit_shared", "move_to", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-classify-chest-blocker.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-classify-chest-blocker",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/classify-chest-blocker.json"]
  });

  assert.equal(actorTurnInput.current_state.shared_storage.status, "contributed");
  assert.equal(actorTurnInput.decision_frame.episode_focus_status.status, "open");
  assert.match(actorTurnInput.decision_frame.episode_focus_status.next, /advance_the_focus/);
});

test("Actor Turn input does not retarget a specific missing item request onto unrelated inventory", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-specific-oak-log-absent",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requests that npc_b deposit one oak_log into shared storage before trusting npc_b's next progress claim.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["world-events/evt-specific-oak-log-absent.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildDepositSharedItemsRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [{ actor_id: "npc_a", distance: 2, busy: false }],
      inventory: [
        { name: "oak_planks", count: 4 },
        { name: "stick", count: 2 },
        { name: "dirt", count: 1 }
      ],
      nearbyBlocks: [{ name: "chest", position: { x: 2, y: 64, z: 0 }, distance: 2 }]
    },
    allowedPrimitiveIds: ["observe", "inspect_chest", "deposit_shared", "say", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 3,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-specific-oak-log-absent",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Respond to npc_a's specific oak_log request if possible.",
      rationale: "The requested item is absent; do not substitute unrelated inventory.",
      allowed_primitive_ids: ["observe", "inspect_chest", "deposit_shared", "say", "wait"]
    },
    startedAtTurnRef: "turns/turn-specific-oak-log-absent.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-specific-oak-log-absent",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/specific-oak-log-absent.json"]
  });

  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
  assert.deepEqual(actorTurnInput.current_state.inventory_counts, {
    dirt: 1,
    oak_planks: 4,
    stick: 2
  });
  assert.equal((actorTurnInput.current_state.inventory_counts as Record<string, number>).oak_log, undefined);
  assert.ok(
    actorTurnInput.source_evidence_bundle.world_event_cards.some((card) =>
      card.summary.includes("deposit one oak_log")
    )
  );
});

test("Action Card projection excludes generic Mineflayer runner from existing-action choices", () => {
  const projection = buildActionCardProjection({
    schema: "action-surface/v1",
    actor_id: "npc_b",
    direct_primitives: [
      {
        primitive_id: "observe",
        category: "sense",
        exposure: "direct",
        executable: true,
        reason: "available",
        description: "Observe current state.",
        args_contract: primitiveContract("observe")
      },
      {
        primitive_id: "run_mineflayer_program",
        category: "generated",
        exposure: "direct",
        executable: true,
        reason: "available",
        description: "Run generated source.",
        args_contract: primitiveContract("run_mineflayer_program")
      }
    ],
    deferred_primitives: [],
    direct_action_skills: [
      {
        action_skill_id: "runBoundedMineflayerProgram",
        exposure: "direct",
        executable: true,
        required_primitives: ["run_mineflayer_program"],
        missing_primitives: [],
        preconditions: [],
        success_verifier: "runtime helper evidence",
        reason: "generic runner"
      },
      {
        action_skill_id: "checkNearbyCraftingTable",
        exposure: "direct",
        executable: true,
        required_primitives: ["run_mineflayer_program"],
        missing_primitives: [],
        preconditions: [],
        success_verifier: "known crafting table state",
        reason: "already promoted actor-owned behavior"
      }
    ],
    deferred_action_skills: [],
    recent_blockers: [],
    missing_affordances: [],
    mineflayer_expansion_opportunities: [],
    rules: {
      exposes_actor_body_not_strategy: true,
      domain_goals_are_context_not_core_architecture: true,
      runtime_verification_required: true,
      mineflayer_is_capability_substrate: true,
      raw_mineflayer_api_not_provider_authority: true,
      generated_programs_require_helper_evidence: true
    }
  });

  const titles = projection.action_cards.map((card) => card.title);
  assert.ok(titles.includes("Observe"));
  assert.ok(titles.includes("Check Nearby Crafting Table"));
  assert.equal(titles.includes("Run Mineflayer Program"), false);
  assert.equal(titles.includes("Run Bounded Mineflayer Program"), false);
  assert.ok(
    projection.missing_affordances.some((entry) =>
      entry.includes("author_mineflayer_action")
    )
  );
});

test("Action Card tool schema exposes generated action-skill input schema", () => {
  const generatedInputSchema = {
    type: "object",
    additionalProperties: false,
    required: ["text"],
    properties: {
      text: { type: "string" }
    }
  };
  const projection = buildActionCardProjection({
    schema: "action-surface/v1",
    actor_id: "npc_b",
    direct_primitives: [],
    deferred_primitives: [],
    direct_action_skills: [
      {
        action_skill_id: "saySharedChestNeed",
        exposure: "direct",
        executable: true,
        input_schema: generatedInputSchema,
        required_primitives: ["run_mineflayer_program"],
        missing_primitives: [],
        preconditions: [],
        success_verifier: "helper say delivered",
        reason: "promoted generated action skill"
      }
    ],
    deferred_action_skills: [],
    recent_blockers: [],
    missing_affordances: [],
    mineflayer_expansion_opportunities: [],
    rules: {
      exposes_actor_body_not_strategy: true,
      domain_goals_are_context_not_core_architecture: true,
      runtime_verification_required: true,
      mineflayer_is_capability_substrate: true,
      raw_mineflayer_api_not_provider_authority: true,
      generated_programs_require_helper_evidence: true
    }
  });
  const payload = buildActorTurnToolSelectionPayload({
    actorTurnInput: {
      schema: "actor-turn-input/v1",
      turn_id: "turn-generated-schema",
      active_episode: { actor_id: "npc_b" },
      action_cards: projection.action_cards
    } as unknown as ActorTurnInput,
    actionCardProjection: projection
  });
  const actionTool = payload.tools.find((tool) =>
    tool.name.includes("say_shared_chest_need")
  );
  assert.ok(actionTool);
  const schema = actionTool.parameters as Record<string, unknown>;
  const properties = schema.properties as Record<string, unknown>;
  const parameters = properties.parameters as Record<string, unknown>;
  assert.deepEqual(parameters, generatedInputSchema);
});

test("Actor Turn input keeps crafting-table placement visible with advisory current-state requirements", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildPlaceCraftingTableRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 37, y: 71, z: -13 },
      visibleActors: [],
      inventory: [{ name: "crafting_table", count: 1 }, { name: "oak_planks", count: 3 }, { name: "stick", count: 2 }],
      nearbyBlocks: [{ name: "crafting_table", position: { x: 37, y: 71, z: -13 }, distance: 1 }]
    },
    allowedPrimitiveIds: ["observe", "place_block", "wait", "collect_logs", "craft_with_table"],
    maxActionsPerCycle: 1,
    cycleIndex: 3,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0003",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-003.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-003",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0003.json"]
  });

  const placeCraftingTableCard = actorTurnInput.action_cards.find((card) =>
    card.title === "Place Crafting Table"
  );
  assert.ok(placeCraftingTableCard);
  assert.ok(
    placeCraftingTableCard.current_state_requirements.includes("no usable crafting_table already known")
  );
  assert.equal(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "placeCraftingTable"
    ),
    true
  );
  assert.ok(
    actorTurnInput.action_cards.some((card) => card.title === "Place Block")
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("no usable crafting_table already known")
    ),
    false
  );
});

test("Actor Turn input keeps crafting-table crafting visible with advisory current-state requirements", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildCraftCraftingTableRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 37, y: 71, z: -13 },
      visibleActors: [],
      inventory: [{ name: "oak_planks", count: 4 }],
      nearbyBlocks: [{ name: "crafting_table", position: { x: 37, y: 71, z: -13 }, distance: 1 }]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "wait", "collect_logs"],
    maxActionsPerCycle: 1,
    cycleIndex: 3,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0003-craft-table",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-003-craft-table.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-003-craft-table",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0003-craft-table.json"]
  });

  const craftCraftingTableCard = actorTurnInput.action_cards.find((card) =>
    card.title === "Craft Crafting Table"
  );
  assert.ok(craftCraftingTableCard);
  assert.ok(
    craftCraftingTableCard.current_state_requirements.includes("no usable crafting_table already known")
  );
  assert.equal(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "craftCraftingTable"
    ),
    true
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Craft Crafting Table") && reason.includes("no usable crafting_table already known")
    ),
    false
  );
});

test("Actor Turn input keeps broad planks-and-sticks crafting available after basic materials are sufficient", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildCraftPlanksAndSticksRecord(),
      buildMineCobblestoneRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 37, y: 71, z: -13 },
      visibleActors: [],
      inventory: [
        { name: "spruce_log", count: 1 },
        { name: "spruce_planks", count: 24 },
        { name: "stick", count: 4 },
        { name: "wooden_pickaxe", count: 1 }
      ],
      nearbyBlocks: [
        { name: "stone", position: { x: 38, y: 70, z: -13 }, distance: 2 }
      ]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "mine_block", "collect_logs", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 8,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0008-materials",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-008-materials.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-008-materials",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0008-materials.json"]
  });

  const craftPlanksAndSticksCard = actorTurnInput.action_cards.find((card) =>
    card.title === "Craft Planks And Sticks"
  );
  assert.ok(craftPlanksAndSticksCard);
  assert.ok(
    craftPlanksAndSticksCard.current_state_requirements.includes("basic planks/sticks need not already satisfied")
  );
  assert.equal(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "craftPlanksAndSticks"
    ),
    true
  );
  assert.ok(
    actorTurnInput.action_cards.some((card) => card.title === "Mine Cobblestone")
  );
  assert.equal(
    actorTurnInput.action_cards.some((candidate) =>
      candidate.title === "Craft Planks And Sticks"
    ),
    true
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Craft Planks And Sticks") &&
      reason.includes("basic planks/sticks need not already satisfied")
    ),
    false
  );
});

test("Actor Turn input keeps planks-and-sticks crafting visible when sticks are still missing", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildCraftPlanksAndSticksRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 37, y: 71, z: -13 },
      visibleActors: [],
      inventory: [
        { name: "spruce_log", count: 1 },
        { name: "spruce_planks", count: 24 }
      ],
      nearbyBlocks: [
        { name: "spruce_log", position: { x: 39, y: 70, z: -13 }, distance: 3 }
      ]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "collect_logs", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 8,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0008-sticks",
    context,
    cycleGoal: cycleGoal(),
    startedAtTurnRef: "turns/turn-008-sticks.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-008-sticks",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0008-sticks.json"]
  });

  assert.equal(
    actorTurnInput.action_cards.some((card) => card.title === "Craft Planks And Sticks"),
    true
  );
  assert.ok(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "craftPlanksAndSticks"
    )
  );
  assert.ok(
    actorTurnInput.action_cards.some((candidate) =>
      candidate.title === "Craft Planks And Sticks"
    )
  );
});

test("Actor Turn input keeps generic wood collection available after starter stockpile is present", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildCraftPlanksAndSticksRecord(),
      buildPlaceCraftingTableRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 37, y: 71, z: -13 },
      visibleActors: [],
      inventory: [
        { name: "birch_log", count: 8 },
        { name: "birch_planks", count: 4 },
        { name: "stick", count: 4 },
        { name: "crafting_table", count: 1 }
      ],
      nearbyBlocks: [
        { name: "birch_log", position: { x: 39, y: 70, z: -13 }, distance: 3 }
      ]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "collect_logs", "place_block", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 30,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0030-wood-stockpile",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Continue useful settlement work after basic wood materials are prepared."
    },
    startedAtTurnRef: "turns/turn-0030-wood-stockpile.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-0030-wood-stockpile",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0030-wood-stockpile.json"]
  });

  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Collect Logs"));
  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Craft Planks And Sticks"));
  assert.equal(
    actorTurnInput.action_cards.some((card) =>
      card.title === "Collect Logs" || card.title === "Craft Planks And Sticks"
    ),
    true
  );
  assert.equal(
    actorTurnInput.action_cards.some((candidate) =>
      candidate.title === "Collect Logs" || candidate.title === "Craft Planks And Sticks"
    ),
    true
  );
});

test("Actor Turn input keeps wood collection visible for an explicit shortage", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildCraftPlanksAndSticksRecord(),
      buildPlaceCraftingTableRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 37, y: 71, z: -13 },
      visibleActors: [],
      inventory: [
        { name: "birch_log", count: 8 },
        { name: "birch_planks", count: 4 },
        { name: "stick", count: 4 },
        { name: "crafting_table", count: 1 }
      ],
      nearbyBlocks: [
        { name: "birch_log", position: { x: 39, y: 70, z: -13 }, distance: 3 }
      ]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "collect_logs", "place_block", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 31,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0031-wood-shortage",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Need more logs before continuing a wood-heavy repair."
    },
    startedAtTurnRef: "turns/turn-0031-wood-shortage.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-0031-wood-shortage",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0031-wood-shortage.json"]
  });

  assert.ok(
    actorTurnInput.action_cards.some((card) =>
      card.title === "Collect Logs" || card.title === "Craft Planks And Sticks"
    )
  );
  assert.equal(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("wood_material_stockpile=sufficient")
    ),
    false
  );
});

test("Actor Turn input keeps building, placement, and generic mining cards visible when only sticks are carried", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 8, y: 71, z: -84 },
      visibleActors: [],
      inventory: [{ name: "stick", count: 4 }],
      nearbyBlocks: [
        { name: "grass_block", position: { x: 8, y: 70, z: -84 }, distance: 1 },
        { name: "crafting_table", position: { x: 7, y: 71, z: -84 }, distance: 2 }
      ]
    },
    allowedPrimitiveIds: ["observe", "mine_block", "place_block", "build_pattern", "move_to", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 32,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-cycle-0032-stick-only",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Continue useful settlement work after local wood collection failed."
    },
    startedAtTurnRef: "turns/turn-0032-stick-only.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-0032-stick-only",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0032-stick-only.json"]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Place Block"), true);
  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Build Pattern"), true);
  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Mine Block"), true);
  assert.equal(
    actorTurnInput.action_cards.some((card) =>
      card.title === "Mine Block" || card.title === "Place Block" || card.title === "Build Pattern"
    ),
    true
  );
  assert.equal(
    actorTurnInput.action_cards.some((candidate) =>
      candidate.title === "Mine Block" || candidate.title === "Place Block" || candidate.title === "Build Pattern"
    ),
    true
  );
  assert.equal(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("solid_build_material=none")
    ),
    false
  );
  assert.equal(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("placeable_block_item=none")
    ),
    false
  );
  assert.equal(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("generic_mine_block_demoted")
    ),
    false
  );
  assert.equal(
    actorTurnInput.decision_frame.do_not_repeat.some((entry) =>
      entry.includes("stick is not a place_block item")
    ),
    false
  );
});

test("Actor Turn input keeps current-state requirement cards visible while exposing reachable prerequisites", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildNpcBActionSkillRecord(),
      buildCraftPlanksAndSticksRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 24.54, y: 77, z: -38.65 },
      visibleActors: [],
      inventory: [{ name: "leaf_litter", count: 5 }],
      nearbyBlocks: [
        { name: "oak_leaves", position: { x: 25, y: 77, z: -38 } },
        { name: "oak_log", position: { x: 26, y: 76, z: -38 } }
      ],
      worldStateSummary: {
        schema: "world-state-summary/v1",
        scan_id: "scan-logs-nearby",
        center: { x: 24.54, y: 77, z: -38.65 },
        radius: 32,
        vertical_range: { min_y: 61, max_y: 93 },
        dimension: "overworld",
        loaded_chunk_limit: "mineflayer_client_cache",
        coverage_scope: "sampled_columns_only",
        absence_claims_exhaustive: false,
        total_verified_blocks: 2,
        truncated: false,
        retained_block_counts: [
          { name: "oak_leaves", count: 1 },
          { name: "oak_log", count: 1 }
        ],
        nearest_examples: [
          { name: "oak_log", position: { x: 26, y: 76, z: -38 }, distance: 1.8 }
        ],
        raw_observed_block_names: ["oak_leaves", "oak_log"],
        raw_observed_entity_names: [],
        raw_observed_item_names: ["leaf_litter"],
        limitations: ["sampled fixture summary"],
        evidence_ref: "observations/scan-logs-nearby.json"
      }
    },
    allowedPrimitiveIds: ["observe", "move_to", "collect_logs", "craft_item", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-collect-before-craft",
    context,
    cycleGoal: {
      ...cycleGoal(),
      allowed_primitive_ids: ["observe", "move_to", "collect_logs", "craft_item", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-collect-before-craft.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-collect-before-craft",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/scan-logs-nearby.json"]
  });
  const cardTitles = actorTurnInput.action_cards.map((card) => card.title);
  assert.ok(cardTitles.includes("Collect Logs"));
  assert.equal(cardTitles.includes("Craft Planks And Sticks"), true);
  const craftPlanksAndSticksCard = actorTurnInput.action_cards.find((card) =>
    card.title === "Craft Planks And Sticks"
  );
  assert.ok(craftPlanksAndSticksCard);
  assert.ok(craftPlanksAndSticksCard.current_state_requirements.includes("inventory has logs"));
  assert.equal(
    actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Craft Planks And Sticks") && entry.includes("inventory has logs")
    ),
    false
  );
});

test("Actor Turn input keeps social action cards visible with advisory preconditions", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const activeActionSkills = [
    {
      schema: "actor-action-skill/v1" as const,
      skill_id: "announceResourceDiscovery",
      owner_actor_id: "npc_b",
      source_kind: "seed" as const,
      status: "active" as const,
      created_at: "2026-06-03T00:00:00.000Z",
      updated_at: "2026-06-03T00:00:00.000Z",
      required_primitives: ["observe", "say", "remember"],
      preconditions: ["resource found"],
      success_verifier: "delivered chat evidence",
      known_failure_modes: ["no concrete resource evidence", "no social recipient"],
      evidence_refs: [],
      review_refs: []
    },
    {
      schema: "actor-action-skill/v1" as const,
      skill_id: "handoffItemAtChest",
      owner_actor_id: "npc_b",
      source_kind: "seed" as const,
      status: "active" as const,
      created_at: "2026-06-03T00:00:00.000Z",
      updated_at: "2026-06-03T00:00:00.000Z",
      required_primitives: ["observe", "inspect_chest", "deposit_shared", "say", "wait"],
      preconditions: ["shared chest nearby", "obligation pending", "inventory has depositable items"],
      success_verifier: "shared storage contribution and delivered handoff chat",
      known_failure_modes: ["no pending obligation", "no depositable item"],
      evidence_refs: [],
      review_refs: []
    }
  ];
  const baseObservation = {
    status: "ok",
    observerId: "npc_b",
    position: { x: 0, y: 64, z: 0 },
    visibleActors: [],
    inventory: [],
    nearbyBlocks: [
      { name: "oak_log", position: { x: 2, y: 64, z: 0 } },
      { name: "chest", position: { x: 1, y: 64, z: 1 } }
    ],
    worldStateSummary: {
      schema: "world-state-summary/v1",
      scan_id: "scan-social-preconditions",
      radius: 16,
      loaded_coverage: { scope: "sampled_columns_only", absence_claims_exhaustive: false },
      block_observations: {
        total_verified: 2,
        truncated: false,
        by_name: [
          { name: "oak_log", count: 1 },
          { name: "chest", count: 1 }
        ]
      },
      limitations: ["sampled fixture summary"]
    }
  };
  const blockedContext = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills,
    observation: baseObservation,
    allowedPrimitiveIds: ["observe", "say", "remember", "inspect_chest", "deposit_shared", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const blockedEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-social-preconditions-blocked",
    context: blockedContext,
    cycleGoal: {
      ...cycleGoal(),
      allowed_primitive_ids: ["observe", "say", "remember", "inspect_chest", "deposit_shared", "wait"]
    },
    startedAtTurnRef: "turns/turn-social-blocked.json"
  });
  const blockedInput = buildActorTurnInput({
    turnId: "turn-social-blocked",
    context: blockedContext,
    activeEpisode: blockedEpisode,
    currentObservationRefs: ["observations/social-blocked.json"]
  });
  const blockedTitles = blockedInput.actorTurnInput.action_cards.map((card) => card.title);
  assert.equal(blockedTitles.includes("Announce Resource Discovery"), true);
  assert.equal(blockedTitles.includes("Handoff Item At Chest"), true);
  assert.equal(blockedTitles.includes("Say"), true);
  assert.ok(
    blockedInput.actorTurnInput.action_cards
      .find((card) => card.title === "Announce Resource Discovery")
      ?.current_state_requirements.includes("resource found")
  );
  assert.ok(
    blockedInput.actorTurnInput.action_cards
      .find((card) => card.title === "Handoff Item At Chest")
      ?.current_state_requirements.includes("obligation pending")
  );
  assert.equal(
    blockedInput.actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Announce Resource Discovery") && entry.includes("resource found")
    ),
    false
  );
  assert.equal(
    blockedInput.actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Handoff Item At Chest") && entry.includes("obligation pending")
    ),
    false
  );

  const readyContext = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-npc-a-request",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requested help: deliver one spare crafting table to shared storage.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["events/npc-a-request.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills,
    observation: {
      ...baseObservation,
      visibleActors: [{ actor_id: "npc_a", distance: 4, busy: false }],
      inventory: [{ name: "crafting_table", count: 1 }]
    },
    allowedPrimitiveIds: ["observe", "say", "remember", "inspect_chest", "deposit_shared", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 2,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const readyEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-social-preconditions-ready",
    context: readyContext,
    cycleGoal: {
      ...cycleGoal(),
      allowed_primitive_ids: ["observe", "say", "remember", "inspect_chest", "deposit_shared", "wait"]
    },
    startedAtTurnRef: "turns/turn-social-ready.json"
  });
  const readyInput = buildActorTurnInput({
    turnId: "turn-social-ready",
    context: readyContext,
    activeEpisode: readyEpisode,
    currentObservationRefs: ["observations/social-ready.json"]
  });
  const readyTitles = readyInput.actorTurnInput.action_cards.map((card) => card.title);
  assert.ok(readyTitles.includes("Announce Resource Discovery"));
  assert.ok(readyTitles.includes("Handoff Item At Chest"));
  assert.ok(readyTitles.includes("Say"));
  assert.ok(
    readyInput.actorTurnInput.source_evidence_bundle.world_event_cards.some((card) =>
      card.summary.includes("deliver one spare crafting table")
    )
  );
  assert.equal(validateActorTurnInput(readyInput.actorTurnInput).ok, true);
});

test("Actor Turn input keeps Say visible with social follow-up context after shared-storage contribution", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-npc-a-oak-log-request",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requested npc_b deposit one oak_log into shared storage.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["events/npc-a-oak-log-request.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [],
      inventory: [{ name: "stick", count: 2 }],
      nearbyBlocks: [{ name: "chest", position: { x: 1, y: 64, z: 1 } }]
    },
    allowedPrimitiveIds: ["observe", "say", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 2,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [],
    recentToolResults: [
      {
        tool: "deposit_shared",
        status: "deposited",
        evidence_ref: "evidence/cycle-0001-action-01-deposit_shared.json",
        result: {
          status: "deposited",
          chestId: "shared-chest-1",
          itemName: "oak_log",
          movedCount: 1,
          items: [{ name: "oak_log", count: 1 }]
        }
      }
    ]
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-social-followup",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Follow up after completing npc_a's shared-storage request.",
      allowed_primitive_ids: ["observe", "say", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-social-followup.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-social-followup",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/social-followup.json"]
  });

  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Say"));
  assert.equal(actorTurnInput.current_state.shared_storage.status, "contributed");
  assert.ok(
    actorTurnInput.decision_frame.current_truths.some((entry) =>
      entry.includes("shared_storage=contributed")
    )
  );
  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
});

test("Actor Turn input keeps Say visible after recent no-progress chat follow-up", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-npc-a-oak-log-request-repeat",
        kind: "scenario_event",
        authority: "context_only",
        summary: "npc_a requested npc_b deposit one oak_log into shared storage.",
        actor_refs: ["npc_a", "npc_b"],
        evidence_refs: ["events/npc-a-oak-log-request-repeat.json"],
        created_at: "2026-06-03T00:00:00.000Z"
      }
    ],
    previousJudgments: [],
    activeActionSkills: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      visibleActors: [],
      inventory: [{ name: "dirt", count: 1 }],
      nearbyBlocks: [{ name: "chest", position: { x: 1, y: 64, z: 1 } }]
    },
    allowedPrimitiveIds: ["observe", "say", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 3,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: [],
    recentToolResults: [
      {
        tool: "deposit_shared",
        status: "deposited",
        evidence_ref: "evidence/cycle-0001-action-01-deposit_shared.json",
        result: {
          status: "deposited",
          chestId: "shared-chest-1",
          itemName: "oak_log",
          movedCount: 1,
          items: [{ name: "oak_log", count: 1 }]
        }
      }
    ]
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-social-followup-no-repeat",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Follow up after completing npc_a's shared-storage request.",
      allowed_primitive_ids: ["observe", "say", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-social-followup-no-repeat.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-social-followup-no-repeat",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/social-followup-no-repeat.json"],
    recentEvidenceTrace: [
      {
        schema: "evidence-trace/v1",
        turn_id: "cycle-0002-action-01",
        episode_id: "episode-social-followup-no-repeat",
        action_ref: "goals/cycle/actor-turn-actions/cycle-0002-action-01-actor-turn-action.json",
        runtime_gate_ref: "runtime-gates/cycle-0002-action-01.json",
        execution_ref: "evidence/cycle-0002-action-01-say.json",
        verifier_ref: "judgments/cycle-0002-action-01-judgment.json",
        outcome: "no_progress",
        compact_summary: "cycle-0002-action-01 say -> completed"
      }
    ]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Say"), true);
  assert.equal(actionCardProjection.runtime_mappings.some((mapping) =>
    actorTurnInput.action_cards.some((card) =>
      card.action_card_id === mapping.action_card_id && card.title === "Say"
    )
  ), true);
  assert.equal(
    actionCardProjection.missing_affordances.some((entry) => entry.includes("say suppressed")),
    false
  );
  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
});

test("Actor Turn input keeps table-bound tool crafting visible when table is usable", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildCraftPlanksAndSticksRecord(),
      buildCraftWoodenPickaxeRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 10, y: 71, z: -20 },
      visibleActors: [],
      inventory: [
        { name: "oak_log", count: 1 },
        { name: "oak_planks", count: 3 },
        { name: "stick", count: 2 }
      ],
      nearbyBlocks: [{ name: "crafting_table", position: { x: 11, y: 71, z: -21 }, distance: 2 }]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "craft_with_table", "wait", "remember"],
    maxActionsPerCycle: 1,
    cycleIndex: 5,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-table-tool-before-more-planks",
    context,
    cycleGoal: {
      ...cycleGoal(),
      summary: "Use the known crafting table and existing materials before making more generic wood supplies.",
      allowed_primitive_ids: ["observe", "craft_item", "craft_with_table", "wait", "remember"]
    },
    startedAtTurnRef: "turns/turn-table-tool-before-more-planks.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-table-tool-before-more-planks",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/table-tool-before-more-planks.json"]
  });
  const actionTitles = actorTurnInput.action_cards.map((card) => card.title);

  assert.ok(actionTitles.includes("Craft Wooden Pickaxe"));
  assert.ok(actionTitles.includes("Craft Planks And Sticks"));
  assert.ok(
    actorTurnInput.current_state.nearby_block_observations.some((block) => block.name === "crafting_table")
  );
  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
});

test("Actor Turn input gives table-bound recipe cards context without computing recipe eligibility", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      {
        schema: "actor-action-skill/v1",
        skill_id: "craftWoodenPickaxe",
        owner_actor_id: "npc_b",
        source_kind: "seed",
        status: "active",
        created_at: "2026-06-03T00:00:00.000Z",
        updated_at: "2026-06-03T00:00:00.000Z",
        required_primitives: ["observe", "craft_with_table", "wait"],
        preconditions: ["inventory has planks >= 3", "inventory has sticks >= 2", "crafting_table nearby"],
        success_verifier: "wooden_pickaxe inventory increase",
        known_failure_modes: ["missing sticks"],
        evidence_refs: [],
        review_refs: []
      }
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 10.48, y: 71, z: -20.47 },
      visibleActors: [],
      inventory: [
        { name: "cobblestone", count: 33 },
        { name: "oak_planks", count: 3 },
        { name: "wooden_pickaxe", count: 1 }
      ],
      nearbyBlocks: [{ name: "crafting_table", position: { x: 11, y: 71, z: -21 } }]
    },
    allowedPrimitiveIds: ["observe", "craft_with_table", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-table-recipe-hints",
    context,
    cycleGoal: {
      ...cycleGoal(),
      allowed_primitive_ids: ["observe", "craft_with_table", "wait"]
    },
    startedAtTurnRef: "turns/turn-table-recipe-hints.json"
  });

  const { actorTurnInput } = buildActorTurnInput({
    turnId: "turn-table-recipe-hints",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/table-recipe-hints.json"]
  });
  const craftWithTable = actorTurnInput.action_cards.find((card) => card.title === "Craft With Table");
  assert.ok(craftWithTable);
  assert.ok(
    craftWithTable.parameter_hints.some((hint) =>
      hint.includes("Use current_state.inventory_counts plus minecraft_basic_guide")
    )
  );
});

test("Actor Turn input keeps Craft Item visible and leaves inventory-grid recipe choice to the LLM", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: [
      buildCraftPlanksAndSticksRecord()
    ],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 10.48, y: 71, z: -20.47 },
      visibleActors: [],
      inventory: [
        { name: "oak_planks", count: 1 },
        { name: "stick", count: 4 },
        { name: "wooden_pickaxe", count: 1 },
        { name: "cobblestone", count: 33 }
      ],
      nearbyBlocks: [{ name: "crafting_table", position: { x: 11, y: 71, z: -21 } }]
    },
    allowedPrimitiveIds: ["observe", "craft_item", "wait"],
    maxActionsPerCycle: 1,
    cycleIndex: 1,
    planBeadPacket: planBeadPacket(),
    runtimeRetryConstraints: []
  });
  const activeEpisode = buildActiveEpisodeFromCycleGoal({
    episodeId: "episode-no-inventory-grid-recipe",
    context,
    cycleGoal: {
      ...cycleGoal(),
      allowed_primitive_ids: ["observe", "craft_item", "wait"]
    },
    startedAtTurnRef: "turns/turn-no-inventory-grid-recipe.json"
  });

  const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
    turnId: "turn-no-inventory-grid-recipe",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/no-inventory-grid-recipe.json"]
  });
  const titles = actorTurnInput.action_cards.map((card) => card.title);
  assert.equal(titles.includes("Craft Item"), true);
  const craftItemCard = actorTurnInput.action_cards.find((card) => card.title === "Craft Item");
  assert.ok(craftItemCard);
  assert.ok(
    craftItemCard.parameter_hints.some((hint) =>
      hint.includes("Use current_state.inventory_counts plus minecraft_basic_guide")
    )
  );
  assert.equal(
    actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Craft Item") &&
        entry.includes("inventory has ingredients for the requested inventory-grid recipe")
    ),
    false
  );
});

test("Actor Turn tool parser maps a visible Action Card function call to runtime parameters", () => {
  const parsed = parseActorTurnToolSelection({
    functionCalls: [
      {
        type: "function_call",
        name: "action_card_001_craft_item",
        call_id: "call-1",
        arguments: JSON.stringify({
          parameters: { itemName: "oak_planks" },
          situation_assessment: "Current inventory has oak_log and planks are the next inventory-grid prerequisite.",
          why_this_tool: "Craft Item is the visible Action Card for inventory-grid recipes.",
          expected_outcome: "inventory_delta",
          success_evidence: ["inventory_delta for oak_planks"],
          failure_handling: "Record the missing ingredient blocker and choose resource collection."
        })
      }
    ],
    actionCardToolMappings: [
      {
        tool_name: "action_card_001_craft_item",
        action_card_id: "action-card-001",
        title: "Craft Item",
        runtime_mapping_ref: "action-card-mappings/action-card-001.json",
        card: {
          schema: "action-card/v1",
          action_card_id: "action-card-001",
          title: "Craft Item",
          description: "Craft an inventory-grid recipe.",
          parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/craft_item.json",
          parameter_hints: ["itemName is required."],
          current_state_requirements: ["inventory has ingredients for the requested inventory-grid recipe"],
          expected_evidence: ["inventory delta"],
          likely_blockers: ["missing itemName"],
          readiness: "requires_current_state_check",
          runtime_mapping_ref: "action-card-mappings/action-card-001.json"
        }
      }
    ]
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.selection.selection_kind, "use_existing_action");
    assert.equal(parsed.selection.action_card_id, "action-card-001");
    assert.deepEqual(parsed.selection.args.parameters, { itemName: "oak_planks" });
    assert.match(parsed.selection.args.why_this_tool, /Craft Item/);
  }
});

test("Actor Turn tool parser rejects visible Action Card extra context fields", () => {
  const parsed = parseActorTurnToolSelection({
    functionCalls: [
      {
        type: "function_call",
        name: "action_card_001_craft_item",
        call_id: "call-extra",
        arguments: JSON.stringify({
          parameters: { itemName: "oak_planks" },
          situation_assessment: "Current inventory has oak_log.",
          why_this_tool: "Craft Item handles inventory-grid recipes.",
          expected_outcome: "inventory_delta",
          success_evidence: ["inventory_delta for oak_planks"],
          failure_handling: "Record blocker.",
          context_summary: "Do not let model-selected summaries enter the tool boundary."
        })
      }
    ],
    actionCardToolMappings: [
      {
        tool_name: "action_card_001_craft_item",
        action_card_id: "action-card-001",
        title: "Craft Item",
        runtime_mapping_ref: "action-card-mappings/action-card-001.json",
        card: {
          schema: "action-card/v1",
          action_card_id: "action-card-001",
          title: "Craft Item",
          description: "Craft an inventory-grid recipe.",
          parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/craft_item.json",
          parameter_hints: ["itemName is required."],
          current_state_requirements: ["inventory has ingredients for the requested inventory-grid recipe"],
          expected_evidence: ["inventory delta"],
          likely_blockers: ["missing itemName"],
          readiness: "requires_current_state_check",
          runtime_mapping_ref: "action-card-mappings/action-card-001.json"
        }
      }
    ]
  });

  assert.equal(parsed.ok, false);
  assert.ok(!parsed.ok && parsed.errors.some((error) => error.includes("context_summary")));
});

test("Actor Turn author_mineflayer_action parser rejects source and context-preserve bottlenecks", () => {
  const parsed = parseActorTurnToolSelection({
    functionCalls: [
      {
        type: "function_call",
        name: "author_mineflayer_action",
        call_id: "call-author-1",
        arguments: JSON.stringify({
          situation_assessment: "Repeated observation is no longer useful.",
          why_codegen_is_needed: "A bounded placement-cell scan is missing from visible Action Cards.",
          desired_minecraft_behavior: "Find a valid adjacent support cell and place a crafting table.",
          expected_outcome: "world_block_delta",
          existing_tools_considered: [
            {
              action_card_id: "action-card-007",
              title: "Place Block",
              why_not_enough: "It needs a known target cell before execution."
            }
          ],
          success_evidence: ["post-observation sees crafting_table"],
          failure_handling: "Return blocker evidence without claiming placement.",
          source: "export async function run(ctx, params) { return {}; }",
          context_to_preserve: ["inventory"]
        })
      }
    ],
    actionCardToolMappings: []
  });

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.ok(parsed.errors.some((error) => error.includes("source is forbidden")));
    assert.ok(parsed.errors.some((error) => error.includes("context_to_preserve is forbidden")));
  }
});

test("Actor Turn author_mineflayer_action parser rejects nested forbidden context fields", () => {
  const parsed = parseActorTurnToolSelection({
    functionCalls: [
      {
        type: "function_call",
        name: "author_mineflayer_action",
        call_id: "call-author-nested",
        arguments: JSON.stringify({
          situation_assessment: "The visible Action Cards cannot express a bounded target search.",
          why_codegen_is_needed: "The actor needs a generated helper-limited placement search.",
          desired_minecraft_behavior: "Find a valid support cell and place a crafting table.",
          expected_outcome: "world_block_delta",
          existing_tools_considered: [
            {
              action_card_id: "action-card-007",
              title: "Place Block",
              why_not_enough: "It requires a known target cell.",
              source: "export async function run(ctx, params) { return {}; }",
              context_to_preserve: ["inventory", "nearby blocks"]
            }
          ],
          success_evidence: ["nearby crafting_table block evidence"],
          failure_handling: "Return explicit blocker evidence."
        })
      }
    ],
    actionCardToolMappings: []
  });

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.ok(parsed.errors.some((error) => error.includes("existing_tools_considered.0.source is forbidden")));
    assert.ok(
      parsed.errors.some((error) => error.includes("existing_tools_considered.0.context_to_preserve is forbidden"))
    );
  }
});

test("Mineflayer codegen request preserves full ActorTurnInput and raw outer function call", () => {
  const actorTurnInput = {
    schema: "actor-turn-input/v1",
    turn_id: "turn-codegen-preserve",
    active_episode: {
      actor_id: "npc_b"
    },
    current_state: {
      inventory_counts: { crafting_table: 1 }
    }
  } as unknown as ActorTurnInput;
  const rawOuterToolCall = {
    type: "function_call",
    name: "author_mineflayer_action",
    call_id: "call-author-2",
    arguments: JSON.stringify({
      desired_minecraft_behavior: "Place a crafting table."
    })
  };
  const parsedAuthorToolArgs: ActorTurnAuthorMineflayerActionArgs = {
    situation_assessment: "The actor has a crafting_table item and needs a placed station.",
    why_codegen_is_needed: "Visible Place Block lacks a known valid target cell.",
    desired_minecraft_behavior: "Scan for a valid support cell and place a crafting table.",
    expected_outcome: "world_block_delta",
    existing_tools_considered: [
      {
        action_card_id: "action-card-007",
        title: "Place Block",
        why_not_enough: "No target cell is known yet."
      }
    ],
    success_evidence: ["nearby crafting_table block evidence"],
    failure_handling: "Return explicit blocker evidence."
  };

  const request = buildMineflayerCodegenRequest({
    requestId: "request-preserve",
    actorTurnInput,
    rawOuterToolCall,
    parsedAuthorToolArgs
  });

  assert.equal(request.actor_turn_input, actorTurnInput);
  assert.deepEqual(request.raw_outer_tool_call, rawOuterToolCall);
  assert.deepEqual(request.parsed_author_tool_args, parsedAuthorToolArgs);
  assert.match(request.mineflayer_codegen_skill_markdown, /Mineflayer Code Generation/);
  assert.match(request.output_contract.forbidden_context_boundary, /compressed planner|context_to_preserve/i);
});

test("Mineflayer codegen parser rejects extra candidate context fields", () => {
  const parsed = parseMineflayerCodegenProviderOutput({
    mineflayer_codegen: {
      schema: "mineflayer-codegen-output/v1",
      runtime_parameters: { text: "Need logs in shared storage." },
      candidate: {
        schema: "generated-action-skill-candidate/v1",
        proposed_skill_id: "saySharedChestNeed",
        purpose: "Say a concrete shared-storage need with helper evidence.",
        source_language: "typescript",
        source: "export async function run(ctx, params) { await ctx.say(params.text); return { status: 'ok' }; }",
        input_schema: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: { text: { type: "string" } }
        },
        helper_api_version: "mineflayer-action-skill-helper/v1",
        helper_allowlist: ["say"],
        timeout_ms: 5000,
        verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
        known_failure_modes: ["chat helper unavailable"],
        promotion_policy: "promote_after_passed_trial",
        context_to_preserve: ["inventory"]
      },
      codegen_rationale: "Use the full actor turn context and generate a bounded say helper."
    }
  });

  assert.equal(parsed.ok, false);
  assert.ok(
    !parsed.ok &&
      parsed.errors.some((error) => error.includes("candidate.context_to_preserve"))
  );
});

test("Gemini GenAI function declarations reuse Actor Turn tool schemas", () => {
  const actorTurnInput = {
    schema: "actor-turn-input/v1",
    turn_id: "turn-gemini-tools",
    active_episode: {
      actor_id: "npc_b"
    },
    action_cards: [
      {
        schema: "action-card/v1",
        action_card_id: "action-card-001",
        title: "Craft Item",
        description: "Craft an inventory-grid recipe.",
        parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/craft_item.json",
        parameter_hints: ["itemName is required."],
        current_state_requirements: ["inventory has ingredients for the requested inventory-grid recipe"],
        expected_evidence: ["inventory delta"],
        likely_blockers: ["missing itemName"],
        readiness: "requires_current_state_check",
        runtime_mapping_ref: "action-card-mappings/action-card-001.json"
      }
    ]
  } as unknown as ActorTurnInput;
  const payload = buildActorTurnToolSelectionPayload({
    actorTurnInput,
    actionCardProjection: {
      schema: "action-card-projection/v1",
      actor_id: "npc_b",
      action_cards: actorTurnInput.action_cards,
      runtime_mappings: [
        {
          kind: "use_primitive",
          action_card_id: "action-card-001",
          primitive_id: "craft_item"
        }
      ],
      deferred_counts: {
        primitives: 0,
        action_skills: 0
      },
      missing_affordances: []
    }
  });

  const declarations = buildGeminiFunctionDeclarationsFromTools(payload.tools);

  assert.deepEqual(
    declarations.map((declaration) => declaration.name),
    ["action_card_001_craft_item", "author_mineflayer_action"]
  );
  assert.deepEqual(declarations[0]?.parametersJsonSchema, payload.tools[0]?.parameters);
  assert.match(declarations[1]?.description ?? "", /full-context codegen|internal full-context/i);
});

test("Gemini GenAI function calls parse through the Actor Turn tool-selection contract", () => {
  const calls = normalizeGeminiFunctionCalls([
    {
      id: "gemini-call-1",
      name: "author_mineflayer_action",
      args: {
        situation_assessment: "The actor has a crafting table item and repeated observe would not help.",
        why_codegen_is_needed: "A valid placement-cell search is missing from visible Action Cards.",
        desired_minecraft_behavior: "Find a valid adjacent support cell and place a crafting table.",
        expected_outcome: "world_block_delta",
        existing_tools_considered: [
          {
            action_card_id: "action-card-007",
            title: "Place Block",
            why_not_enough: "It requires a known target cell."
          }
        ],
        success_evidence: ["nearby crafting_table block evidence"],
        failure_handling: "Return explicit blocker evidence."
      }
    }
  ]);

  const parsed = parseActorTurnToolSelection({
    functionCalls: calls,
    actionCardToolMappings: []
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.selection.selection_kind, "author_mineflayer_action");
    assert.equal(parsed.selection.call_id, "gemini-call-1");
    assert.match(parsed.selection.args.why_codegen_is_needed, /placement-cell/);
  }
});
