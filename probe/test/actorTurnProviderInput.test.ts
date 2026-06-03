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
  buildActorTurnProviderPayload,
  parseActorTurnProviderOutput
} from "../src/provider/socialActorTurnProvider.js";
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
    schema: "action-intent-primitive-args/v1" as const,
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

test("Action Card projection hides primitive/action-skill choice behind cards", async () => {
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
  assert.match(placeBlockNearbyCard.description, /Preconditions that must be true/);
  assert.ok(
    placeBlockNearbyCard.parameter_hints.some((hint) =>
      hint.includes("Required current_state evidence: inventory contains the block item")
    )
  );
  assert.ok(
    placeBlockNearbyCard.current_state_requirements.includes("inventory contains the block item")
  );
  assert.ok(
    placeBlockNearbyCard.likely_blockers.some((blocker) =>
      blocker.includes("do not choose until current_state satisfies")
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
  const suppressedObserveTurn = buildActorTurnInput({
    turnId: "turn-002",
    context,
    activeEpisode,
    currentObservationRefs: ["observations/cycle-0002.json"],
    recentEvidenceTrace: [
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-001",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/intents/turn-001-intent.json",
        runtime_gate_ref: "runtime-gates/turn-001.json",
        outcome: "no_progress",
        compact_summary: "turn-001 observe -> completed"
      }
    ]
  });
  assert.equal(
    suppressedObserveTurn.actorTurnInput.action_cards.some((card) => card.title === "Observe"),
    false
  );
  assert.ok(
    suppressedObserveTurn.actorTurnInput.action_cards.some((card) => card.title === "Place Block")
  );

  assert.ok(actionCardProjection.action_cards.length <= projection.action_cards.length);
  assert.equal(validateActorTurnInput(actorTurnInput).ok, true);
  assert.deepEqual(actorTurnInput.current_state.inventory_counts, { crafting_table: 1 });
  assert.equal(actorTurnInput.current_state.position?.x, 0);
  assert.equal(actorTurnInput.current_state.visible_actors[0]?.id, "npc_a");
  assert.equal(actorTurnInput.current_state.nearby_block_hints[0]?.name, "grass_block");
  assert.equal(
    actorTurnInput.current_state.settlement_progress.checklist.some((item) =>
      item.id === "crafting_table_known_or_placed"
    ),
    true
  );
  const actorTurnPlaceBlockCard = actorTurnInput.action_cards.find((card) => card.title === "Place Block");
  assert.ok(actorTurnPlaceBlockCard);
  assert.ok(
    actorTurnPlaceBlockCard.current_state_requirements.includes("inventory has the requested block item")
  );
  assert.equal(actorTurnInput.runtime_retry_constraints.length, 1);
  assert.equal(actorTurnInput.compact_plan_bead_hints[0]?.bead_id, "bead-crafting-table-access");
  assert.deepEqual(actorTurnInput.active_episode.selected_plan_bead_refs, [
    "plan-beads/beads/bead-crafting-table-access.json"
  ]);
  assert.equal(actorTurnInput.compact_plan_bead_hints[0]?.priority, 0);
  assert.deepEqual(actorTurnInput.compact_plan_bead_hints[0]?.next_hints, [
    "Use current_state before choosing a place-block action."
  ]);
  assert.deepEqual(actorTurnInput.compact_plan_bead_hints[0]?.blockers, [
    "occupied target from prior placement attempt"
  ]);
  assert.equal(
    actorTurnInput.compact_plan_bead_hints[0]?.dependency_refs[0],
    "plan-bead-dependency:npc_b:bead-crafting-table-access:blocks:bead-toolmaking"
  );
  assert.equal(
    actorTurnInput.compact_plan_bead_hints[0]?.checkpoint_ref,
    "plan-beads/beads/bead-crafting-table-access.json"
  );
  assert.equal(actorTurnInput.relationship_context.visible_actor_ids[0], "npc_a");
  assert.match(actorTurnInput.minecraft_basic_guide.item_flows.join("\n"), /log -> matching planks/);

  const providerPayload = buildActorTurnProviderPayload({ actorTurnInput, runId: "run-1" });
  assert.equal(providerPayload.schemaName, "actor_turn");
  assert.equal(providerPayload.usageContext.stage, "actor_turn");
  assert.match(providerPayload.system, /do not output primitive_id or action_skill_id/);
  assert.match(providerPayload.system, /requires_current_state_check/);
  assert.match(providerPayload.system, /choose the nearest prerequisite action/);
  assert.match(providerPayload.system, /contract rejection/);
  assert.match(providerPayload.system, /Supported helper names are exactly/);
  assert.match(providerPayload.system, /export async function run\(ctx, params\)/);

  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "use_existing_action",
      action_card_id: placeBlockCard.action_card_id,
      parameters: { itemName: "crafting_table", targetPosition: { x: 0, y: 64, z: 1 } },
      why_this_action: "Place the table into a different explicit adjacent cell.",
      expected_evidence: ["block delta"],
      fallback_if_blocked: "choose another adjacent cell or branch to Deliberation"
    }
  });
  assert.equal(parsed.ok, true);
});

test("Actor Turn input hides exact empty-args Action Card blocked by runtime retry constraint", async () => {
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

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Collect Logs"), false);
  assert.ok(
    actorTurnInput.runtime_retry_constraints.some((constraint) =>
      constraint.target_summary === "use_action_skill:action_skill:collectLogs"
    )
  );
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Collect Logs hidden because runtime_retry_constraint already blocks")
    )
  );
  assert.equal(
    actorTurnInput.decision_frame.recommended_next_action_candidates.some((candidate) =>
      candidate.title === "Collect Logs"
    ),
    false
  );
});

test("Actor Turn input suppresses Remember after repeated no-progress memory turns", async () => {
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
        action_ref: "goals/cycle/intents/turn-012-intent.json",
        runtime_gate_ref: "runtime-gates/turn-012.json",
        outcome: "no_progress",
        compact_summary: "turn-012 remember -> wrote a status note without runtime progress"
      },
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-013",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/intents/turn-013-intent.json",
        runtime_gate_ref: "runtime-gates/turn-013.json",
        outcome: "no_progress",
        compact_summary: "turn-013 remember -> repeated the same blocker note"
      }
    ]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Remember"), false);
  assert.equal(
    actorTurnInput.decision_frame.top_eligible_action_cards.some((card) => card.title === "Remember"),
    false
  );
  assert.ok(
    actorTurnInput.action_cards.some((card) => card.title === "Collect Logs" || card.title === "Move To")
  );
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("remember suppressed after repeated no-progress")
    )
  );
});

test("Actor Turn input suppresses Move To after repeated movement without durable progress", async () => {
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
        action_ref: "goals/cycle/intents/turn-010-intent.json",
        runtime_gate_ref: "runtime-gates/turn-010.json",
        outcome: "position_delta",
        compact_summary: "turn-010 move_to -> completed"
      },
      {
        schema: "evidence-trace/v1",
        turn_id: "turn-011",
        episode_id: activeEpisode.episode_id,
        action_ref: "goals/cycle/intents/turn-011-intent.json",
        runtime_gate_ref: "runtime-gates/turn-011.json",
        outcome: "no_progress",
        compact_summary: "turn-011 move_to -> completed"
      }
    ]
  });

  assert.equal(actorTurnInput.action_cards.some((card) => card.title === "Move To"), false);
  assert.ok(actorTurnInput.action_cards.some((card) => card.title === "Collect Logs"));
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
  assert.equal(
    actorTurnInput.decision_frame.recommended_next_action_candidates.some((candidate) =>
      candidate.title === "Mine Block" && Object.keys(candidate.parameters).length === 0
    ),
    false
  );
  assert.equal(
    actorTurnInput.decision_frame.recommended_next_action_candidates[0]?.title,
    "Mine Cobblestone"
  );
});

test("Actor Turn input exposes shared-storage deposit candidates from inventory and social request", async () => {
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
  assert.equal(actorTurnInput.current_state.obligation_summaries?.length, 1);
  const oakLogCandidate = actorTurnInput.current_state.deposit_candidates.find((candidate) =>
    candidate.itemName === "oak_log"
  );
  assert.ok(oakLogCandidate);
  assert.equal(oakLogCandidate.inventoryCount, 4);
  assert.equal(oakLogCandidate.suggestedCount, 1);
  assert.equal(oakLogCandidate.socially_requested, true);
  assert.deepEqual(oakLogCandidate.requested_by_actor_ids, ["npc_a"]);
  assert.match(oakLogCandidate.request_summaries[0] ?? "", /deposit one oak_log/);
  const leafLitterCandidate = actorTurnInput.current_state.deposit_candidates.find((candidate) =>
    candidate.itemName === "leaf_litter"
  );
  assert.ok(leafLitterCandidate);
  assert.equal(leafLitterCandidate.socially_requested, false);
  assert.deepEqual(leafLitterCandidate.request_summaries, []);
  const depositCard = actorTurnInput.action_cards.find((card) => card.title === "Deposit Shared");
  const handoffCard = actorTurnInput.action_cards.find((card) => card.title === "Handoff Item At Chest");
  assert.ok(depositCard);
  assert.ok(handoffCard);
  assert.ok(
    depositCard.parameter_hints.some((hint) =>
      hint.includes("oak_log inventory=4 suggestedCount=1 socially_requested")
    )
  );
  assert.ok(
    handoffCard.parameter_hints.some((hint) =>
      hint.includes("parameters.itemName plus parameters.count")
    )
  );
  assert.equal(actorTurnInput.decision_frame.episode_focus_status.status, "open");
  assert.deepEqual(actorTurnInput.decision_frame.open_social_requests.map((request) => request.itemName), [
    "oak_log"
  ]);
  assert.deepEqual(actorTurnInput.decision_frame.parameter_candidates, [
    {
      action_card_title: "Deposit Shared",
      itemName: "oak_log",
      count: 1,
      reason: "structured parameters for the open shared-storage request",
      evidence_refs: ["world-events/evt-shared-storage-handoff.json"]
    }
  ]);
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
      hint.includes("bounded shared-chest container snapshot") &&
      hint.includes("do not author generated code")
    )
  );
  assert.ok(
    inspectCard.parameter_hints.some((hint) =>
      hint.includes("Current shared_storage status")
    )
  );
  assert.ok(
    inspectCard.likely_blockers.some((blocker) =>
      blocker.includes("use it before authoring a generated chest/openability probe")
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
  const oakLogCandidate = actorTurnInput.current_state.deposit_candidates.find((candidate) =>
    candidate.itemName === "oak_log"
  );
  assert.ok(oakLogCandidate);
  assert.equal(oakLogCandidate.socially_requested, false);
  assert.deepEqual(oakLogCandidate.request_summaries, []);
  const leafLitterCandidate = actorTurnInput.current_state.deposit_candidates.find((candidate) =>
    candidate.itemName === "leaf_litter"
  );
  assert.ok(leafLitterCandidate);
  assert.equal(leafLitterCandidate.socially_requested, false);
  assert.deepEqual(leafLitterCandidate.request_summaries, []);
  const depositCard = actorTurnInput.action_cards.find((card) => card.title === "Deposit Shared");
  assert.equal(depositCard, undefined);
  assert.equal(actorTurnInput.action_cards.find((card) => card.title === "Deposit Shared Items"), undefined);
  assert.equal(actorTurnInput.action_cards.find((card) => card.title === "Inspect Chest"), undefined);
  assert.equal(actorTurnInput.action_cards.find((card) => card.title === "Inspect Shared Chest"), undefined);
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Deposit Shared hidden because shared storage already has contribution evidence")
    )
  );
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Inspect Chest hidden because shared storage already has contribution evidence")
    )
  );
  assert.equal(actorTurnInput.decision_frame.episode_focus_status.status, "satisfied");
  assert.deepEqual(actorTurnInput.decision_frame.open_social_requests, []);
  assert.ok(
    actorTurnInput.decision_frame.completed_work.some((entry) =>
      entry.includes("evidence/cycle-0001-action-01-deposit_shared.json")
    )
  );
  assert.ok(
    actorTurnInput.decision_frame.do_not_repeat.some((entry) =>
      entry.includes("do not deposit again")
    )
  );
  assert.equal(
    actorTurnInput.decision_frame.recommended_next_action_candidates.some((candidate) =>
      candidate.title === "Deposit Shared" ||
        candidate.title === "Deposit Shared Items" ||
        candidate.title === "Inspect Chest" ||
        candidate.title === "Inspect Shared Chest"
    ),
    false
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
  assert.deepEqual(
    actorTurnInput.current_state.deposit_candidates.map((candidate) => ({
      itemName: candidate.itemName,
      socially_requested: candidate.socially_requested,
      request_summaries: candidate.request_summaries
    })),
    [
      { itemName: "dirt", socially_requested: false, request_summaries: [] },
      { itemName: "oak_planks", socially_requested: false, request_summaries: [] },
      { itemName: "stick", socially_requested: false, request_summaries: [] }
    ]
  );
  assert.deepEqual(actorTurnInput.decision_frame.open_social_requests, []);
  assert.deepEqual(actorTurnInput.decision_frame.parameter_candidates, []);
  assert.equal(
    actorTurnInput.decision_frame.recommended_next_action_candidates.some((candidate) =>
      candidate.title === "Deposit Shared" || candidate.title === "Deposit Shared Items"
    ),
    false
  );
});

test("Action Card projection hides generic Mineflayer runner from existing-action choices", () => {
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

test("Actor Turn input hides crafting-table placement after current_state already has a usable table", async () => {
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

  assert.equal(
    actorTurnInput.action_cards.some((card) => card.title === "Place Crafting Table"),
    false
  );
  assert.equal(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "placeCraftingTable"
    ),
    false
  );
  assert.ok(
    actorTurnInput.action_cards.some((card) => card.title === "Place Block")
  );
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("no usable crafting_table already known")
    )
  );
});

test("Actor Turn input hides crafting-table crafting after current_state already has a usable table", async () => {
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

  assert.equal(
    actorTurnInput.action_cards.some((card) => card.title === "Craft Crafting Table"),
    false
  );
  assert.equal(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "craftCraftingTable"
    ),
    false
  );
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Craft Crafting Table") && reason.includes("no usable crafting_table already known")
    )
  );
});

test("Actor Turn input hides broad planks-and-sticks crafting after basic materials are already sufficient", async () => {
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

  assert.equal(
    actorTurnInput.action_cards.some((card) => card.title === "Craft Planks And Sticks"),
    false
  );
  assert.equal(
    actionCardProjection.runtime_mappings.some((mapping) =>
      mapping.kind === "use_action_skill" && mapping.action_skill_id === "craftPlanksAndSticks"
    ),
    false
  );
  assert.ok(
    actorTurnInput.action_cards.some((card) => card.title === "Mine Cobblestone")
  );
  assert.equal(
    actorTurnInput.decision_frame.recommended_next_action_candidates.some((candidate) =>
      candidate.title === "Craft Planks And Sticks"
    ),
    false
  );
  assert.ok(
    actionCardProjection.missing_affordances.some((reason) =>
      reason.includes("Craft Planks And Sticks") &&
      reason.includes("basic planks/sticks need not already satisfied")
    )
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
    actorTurnInput.decision_frame.recommended_next_action_candidates.some((candidate) =>
      candidate.title === "Craft Planks And Sticks"
    )
  );
});

test("Actor Turn input hides current-state-impossible action cards but keeps reachable prerequisites", async () => {
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
  assert.equal(cardTitles.includes("Craft Planks And Sticks"), false);
  assert.ok(
    actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Craft Planks And Sticks") && entry.includes("inventory has logs")
    )
  );
});

test("Actor Turn input hides social action cards until social preconditions are evidence-backed", async () => {
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
  assert.equal(blockedTitles.includes("Announce Resource Discovery"), false);
  assert.equal(blockedTitles.includes("Handoff Item At Chest"), false);
  assert.equal(blockedTitles.includes("Say"), false);
  assert.ok(
    blockedInput.actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Announce Resource Discovery") && entry.includes("resource found")
    )
  );
  assert.ok(
    blockedInput.actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Handoff Item At Chest") && entry.includes("obligation pending")
    )
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
  assert.deepEqual(readyInput.actorTurnInput.current_state.obligation_summaries, [
    "npc_a requested help: deliver one spare crafting table to shared storage."
  ]);
  assert.equal(validateActorTurnInput(readyInput.actorTurnInput).ok, true);
});

test("Actor Turn input annotates table-bound recipe cards with current feasible recipes", async () => {
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
      hint.includes("Current feasible table-bound recipes from inventory: furnace")
    )
  );
  assert.ok(
    craftWithTable.parameter_hints.some((hint) =>
      hint.includes("wooden_pickaxe missing sticks 0/2")
    )
  );
});

test("Actor Turn input hides Craft Item when no inventory-grid recipe is currently feasible", async () => {
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
  assert.equal(titles.includes("Craft Item"), false);
  assert.ok(
    actionCardProjection.missing_affordances.some((entry) =>
      entry.includes("Craft Item") &&
        entry.includes("inventory has ingredients for the requested inventory-grid recipe")
    )
  );
});

test("Actor Turn parser strips non-authority card fields from authoring output", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "author_mineflayer_action",
      action_card_id: "action-card-022",
      proposed_action_skill_id: "trialCraftWoodenPickaxe",
      purpose: "Trial a bounded table craft helper.",
      input_schema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      parameters: {},
      source_language: "typescript",
      source: "export async function run(ctx) { return { ok: true }; }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["inventory"],
      timeout_ms: 1000,
      verifier: { kind: "inventory_delta", itemName: "wooden_pickaxe" },
      known_failure_modes: ["missing ingredients"],
      promotion_policy: "record_candidate_only",
      why_this_action: "No existing card covers this exact helper.",
      expected_evidence: ["candidate trial evidence"],
      fallback_if_blocked: "Use existing prerequisite Action Cards."
    }
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.output.choice, "author_mineflayer_action");
    assert.equal((parsed.output as Record<string, unknown>).action_card_id, undefined);
    assert.equal(parsed.output.promotion_policy, "promote_after_passed_trial");
  }
});

test("Actor Turn parser gives malformed authoring output a repairable candidate id", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "author_mineflayer_action",
      action_card_id: "",
      proposed_action_skill_id: "",
      purpose: "Check nearby crafting table reachability",
      input_schema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      parameters: {},
      source_language: "typescript",
      source: "async function run(ctx) { return {}; }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["runBoundedMineflayerProgram"],
      timeout_ms: 8000,
      verifier: { kind: "world_scan" },
      known_failure_modes: ["loaded cache misses the block"],
      promotion_policy: "record_candidate_only",
      why_this_action: "A bounded generated scan might answer a missing station question.",
      expected_evidence: ["candidate trial evidence"],
      fallback_if_blocked: "Use existing prerequisite Action Cards."
    }
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.output.choice, "author_mineflayer_action");
    assert.match(parsed.output.proposed_action_skill_id, /^trialCheckNearbyCrafting/);
    assert.equal(parsed.output.promotion_policy, "promote_after_passed_trial");
  }
});

test("Actor Turn parser hoists and strips generated metadata nested inside authoring parameters", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "trialChestProbe",
      purpose: "Probe a nearby chest with the bounded helper API.",
      input_schema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      parameters: {
        source_language: "typescript",
        source: "export async function run(ctx, params) { return await ctx.observe({ radius: 6 }); }",
        helper_api_version: "mineflayer-action-skill-helper/v1",
        helper_allowlist: ["observe"],
        timeout_ms: 1500,
        verifier: { kind: "world_scan" },
        known_failure_modes: ["no chest in scan"],
        promotion_policy: "record_candidate_only"
      },
      why_this_action: "No existing card can probe this container state.",
      expected_evidence: ["world scan"],
      fallback_if_blocked: "Move to a specific chest candidate."
    }
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok && parsed.output.choice === "author_mineflayer_action") {
    assert.equal(parsed.output.source_language, "typescript");
    assert.deepEqual(parsed.output.parameters, {});
    assert.deepEqual(parsed.output.helper_allowlist, ["observe"]);
    assert.equal(parsed.output.promotion_policy, "promote_after_passed_trial");
  }
});

test("Actor Turn parser normalizes sparse authoring input_schema from parameters", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "",
      purpose: "Trial a minimal chest interaction probe.",
      input_schema: {},
      parameters: { note: "probe nearby chest", timeoutMs: 2500 },
      source_language: "typescript",
      source: "export async function run(ctx, params) { await ctx.wait({ ms: params.timeoutMs }); return { note: params.note }; }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["wait"],
      timeout_ms: 3000,
      verifier: { kind: "helper_event_progress" },
      known_failure_modes: ["wait helper unavailable"],
      promotion_policy: "promote_after_passed_trial",
      why_this_action: "No existing card can probe this interaction.",
      expected_evidence: ["helper event"],
      fallback_if_blocked: "Choose a visible Action Card."
    }
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok && parsed.output.choice === "author_mineflayer_action") {
    assert.deepEqual(parsed.output.input_schema, {
      type: "object",
      properties: {
        note: { type: "string" },
        timeoutMs: { type: "integer" }
      },
      additionalProperties: false
    });
  }
});

test("Actor Turn parser recovers generated source fields split beside actor_turn wrapper", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "trialInspectContainer",
      purpose: "Open and inspect a nearby shared container.",
      input_schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          require_distance_max: { type: "number" }
        }
      },
      parameters: { require_distance_max: 3 }
    },
    source_language: "typescript",
    source: "export async function run(ctx) { return await ctx.inspectChest({ maxDistance: 3 }); }",
    helper_api_version: "mineflayer-action-skill-helper/v1",
    helper_allowlist: ["inspect_chest"],
    timeout_ms: 12000,
    verifier: { kind: "container_snapshot" },
    known_failure_modes: ["no chest in reach"],
    promotion_policy: "promote_after_passed_trial",
    why_this_action: "No existing card can inspect the target container this turn.",
    expected_evidence: ["container snapshot or denial evidence"],
    fallback_if_blocked: "Move closer to the chest and retry once."
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.output.choice, "author_mineflayer_action");
    assert.equal(parsed.output.source_language, "typescript");
    assert.match(parsed.output.source, /inspectChest/);
    assert.deepEqual(parsed.output.helper_allowlist, ["inspect_chest"]);
  }
});

test("Actor Turn parser strips generated fields from existing-action output", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "use_existing_action",
      action_card_id: "action-card-011",
      parameters: {},
      proposed_action_skill_id: "",
      source_language: "typescript",
      source: "",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["inventory"],
      timeout_ms: 1000,
      verifier: { kind: "container_snapshot" },
      known_failure_modes: ["blocked chest"],
      promotion_policy: "promote_after_passed_trial",
      why_this_action: "Inspect the nearby chest with an existing Action Card.",
      expected_evidence: ["runtime evidence from inspect_chest"],
      fallback_if_blocked: "Move closer or remember the blocker."
    }
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.output.choice, "use_existing_action");
    assert.equal((parsed.output as Record<string, unknown>).source, undefined);
  }
});

test("Actor Turn parser repairs non-authority explanation fields from nested parameters", () => {
  const parsed = parseActorTurnProviderOutput({
    actor_turn: {
      choice: "use_existing_action",
      action_card_id: "action-card-008",
      parameters: {
        source: "export async function run(ctx) { return { status: 'ok' }; }",
        purpose: "Check the current inventory counts with a bounded runtime program.",
        expectedObservation: "inventory count evidence"
      },
      proposed_action_skill_id: "ignoredForExistingAction",
      input_schema: { type: "object" }
    }
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.output.choice, "use_existing_action");
    assert.equal(
      parsed.output.why_this_action,
      "Check the current inventory counts with a bounded runtime program."
    );
    assert.deepEqual(parsed.output.expected_evidence, ["inventory count evidence"]);
    assert.match(parsed.output.fallback_if_blocked, /valid prerequisite/);
  }
});

test("Actor Turn parser accepts top-level actor turn output when provider omits wrapper", () => {
  const parsed = parseActorTurnProviderOutput({
    choice: "use_existing_action",
    action_card_id: "action-card-011",
    parameters: {},
    why_this_action: "Inspect the nearby shared chest.",
    expected_evidence: ["runtime evidence from inspect_chest"],
    fallback_if_blocked: "Refresh observation or choose a prerequisite action."
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.output.choice, "use_existing_action");
    assert.equal(parsed.output.action_card_id, "action-card-011");
  }
});
