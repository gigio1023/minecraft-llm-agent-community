import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal, StrategicGoal } from "../runtime/goals/types.js";
import { buildActionCardProjection } from "../runtime/goals/actorEpisode/index.js";
import type { JsonValue } from "./inputSnapshot.js";

const GOAL_MIND_STRATEGIC_GOAL_LIMIT = 6;

const minecraftBasicGuide = {
  schema: "minecraft-basic-guide/v1",
  scope:
    "These are Minecraft mechanics for interpreting observations and structured action args. They are not a fixed survival strategy or required goal order.",
  known_item_flows: [
    {
      output: "matching_planks",
      example_outputs: ["oak_planks", "spruce_planks", "birch_planks"],
      station: "inventory_2x2",
      inputs: [{ item_family: "log_or_wood", count: 1 }],
      output_count: 4,
      executable_recovery_when_missing: "collect_logs or mine an observed nearby log, then craft_item for the matching planks",
      note: "Use the exact wood type present in inventory or evidence; do not invent oak_planks when only spruce_log is known."
    },
    {
      output: "stick",
      station: "inventory_2x2",
      inputs: [{ item_family: "planks", count: 2 }],
      output_count: 4,
      executable_recovery_when_missing: "craft planks from an inventory log, or collect logs first"
    },
    {
      output: "crafting_table",
      station: "inventory_2x2",
      inputs: [{ item_family: "planks", count: 4 }],
      output_count: 1,
      executable_recovery_when_missing:
        "craft planks if a log is available; otherwise collect logs. After crafting the item, place it before using it as a station."
    },
    {
      output: "wooden_pickaxe",
      station: "placed_crafting_table_3x3",
      inputs: [
        { item_family: "planks", count: 3 },
        { item: "stick", count: 2 }
      ],
      output_count: 1,
      executable_recovery_when_missing:
        "if no reachable placed crafting_table exists, craft/place one or move to an observed reachable table; if sticks or planks are missing, craft those prerequisites first"
    },
    {
      output: "cobblestone",
      station: "world_mining",
      inputs: [
        { block_family: "stone_like", count: 1 },
        { tool_family: "pickaxe", minimum_tier: "wooden" }
      ],
      output_count: 1,
      executable_recovery_when_missing:
        "craft or equip a pickaxe before mining stone-like blocks for cobblestone"
    },
    {
      output: "stone_pickaxe",
      station: "placed_crafting_table_3x3",
      inputs: [
        { item: "cobblestone", count: 3 },
        { item: "stick", count: 2 }
      ],
      output_count: 1,
      executable_recovery_when_missing:
        "mine cobblestone with at least a wooden_pickaxe, then craft at a reachable placed crafting_table"
    },
    {
      output: "furnace",
      station: "placed_crafting_table_3x3",
      inputs: [{ item: "cobblestone", count: 8 }],
      output_count: 1,
      executable_recovery_when_missing:
        "mine cobblestone with a pickaxe; after crafting, place the furnace before smelting"
    },
    {
      output: "chest",
      station: "placed_crafting_table_3x3",
      inputs: [{ item_family: "planks", count: 8 }],
      output_count: 1,
      executable_recovery_when_missing:
        "craft enough planks and use a reachable placed crafting_table; after crafting, place it before storing items"
    }
  ],
  station_requirements: {
    inventory_2x2:
      "Can craft small recipes such as planks, sticks, and crafting_table directly from inventory.",
    placed_crafting_table_3x3:
      "Required for table-sized recipes such as wooden_pickaxe, stone_pickaxe, furnace, chest, axe, shovel, and sword. The station must be a reachable world block, not merely an inventory item.",
    placed_furnace:
      "Required for smelting. Needs a reachable furnace world block, fuel, and smeltable input.",
    placed_chest:
      "Required for storage. Needs a reachable chest world block; a chest item in inventory is not storage."
  },
  blocked_recovery_guides: [
    {
      blocked_reason_contains: "requires crafting_table in inventory",
      next_action_rule:
        "Do not observe for the inventory item again. If inventory has at least four planks, craft_item crafting_table. If not, craft planks from logs or collect_logs first."
    },
    {
      blocked_reason_contains: "No craftable inventory recipe found for crafting_table",
      next_action_rule:
        "Check exact plank count. If fewer than four planks, craft planks from logs or collect_logs; if four or more planks exist, retry craft_item crafting_table with itemName explicitly set."
    },
    {
      blocked_reason_contains: "craft_with_table found a table but remained",
      next_action_rule:
        "Repair reachability. Move toward the reported tablePosition if still useful, or place/craft a nearer crafting_table. Do not repeatedly observe the same station absence."
    },
    {
      blocked_reason_contains: "no local crafting_table could be placed",
      next_action_rule:
        "If holding a crafting_table item, choose place_block with an explicit empty or support target. If not holding one, craft it from planks before table-sized crafting."
    },
    {
      blocked_reason_contains: "Path was stopped",
      next_action_rule:
        "Choose a different nearby reachable target or a shorter bounded scout move. Do not retry the same exact coordinates."
    }
  ],
  observe_stop_guides: {
    same_missing_prerequisite_limit:
      "If two recent observations show the same inventory counts and the same missing prerequisite, observe has stopped being useful for that prerequisite.",
    known_absence_to_action:
      "If evidence already says the missing thing is an inventory item or a required placed station, choose the prerequisite action rather than asking observation to rediscover it.",
    station_search_limit:
      "Searching for a placed crafting_table is useful only when a prior observation actually saw one or the actor intends to move to a new scan area. If not, craft/place a table from materials instead."
  },
  coordinates_and_visibility: {
    block_positions:
      "Minecraft block positions are integer cells. A target coordinate names one block cell, not a vague nearby area.",
    loaded_world_limit:
      "Observation and block searches only cover loaded, bounded nearby world state. If a block is not observed in that scan, treat it as unknown outside the scan, not globally absent.",
    exact_names_and_counts:
      "Use exact Minecraft item/block names and inventory counts from observation or runtime evidence. Do not assume a generic material exists unless evidence names a matching item."
  },
  movement_and_reach: {
    interact_nearby:
      "Mining, placing, crafting at a station, opening a container, and pickup require the actor to be close enough to the target. Prefer nearby observed targets or move first.",
    avoid_body_space_targets:
      "Do not choose the actor's feet/head cells or an occupied actor/entity space as the destination for a placed block or movement target."
  },
  block_placement: {
    target_position_meaning:
      "For place_block, targetPosition/position is the empty or replaceable block cell the new block should occupy.",
    support_surface_form:
      "If you know the solid floor/support block instead, use surfacePosition/supportPosition; the runtime places into the block above that support.",
    invalid_targets:
      "Do not target occupied solid floor blocks such as grass_block or dirt as the placement cell. Those are support blocks, not empty cells.",
    adjacent_support:
      "A placed block needs a valid adjacent reference/support block. Floating placement into empty space should be expected to fail unless a helper explicitly builds support first.",
    replaceable_vs_protected:
      "Air, short grass, ferns, snow, and similar replaceable cells can usually be occupied by a placed block. Existing solid/interactive blocks such as chests, crafting tables, doors, or furnaces should not be overwritten."
  },
  crafting_and_stations: {
    recipe_and_supplies:
      "Crafting requires a known recipe and sufficient exact ingredients in inventory. Natural-language intent is not a substitute for item counts.",
    inventory_grid_vs_table:
      "Simple 2x2 recipes can use inventory crafting; table-sized recipes require a nearby placed crafting_table world block.",
    early_inventory_recipes:
      "Common early inventory recipes: one log crafts into planks of the matching wood type; two planks craft sticks; four planks craft one crafting_table. These are mechanics hints, not mandatory goals.",
    wooden_pickaxe_preconditions:
      "A wooden_pickaxe needs three planks and two sticks, and it must be crafted at a reachable placed crafting_table world block. If no reachable table exists, first craft or place a crafting_table instead of trying craft_with_table.",
    crafting_table_recovery:
      "If a later action needs a crafting_table and inventory has no crafting_table item, do not keep observing for the item. Either craft one from four planks if available, gather/craft planks if not, or move to a currently observed reachable placed crafting_table.",
    crafting_table_item_vs_world_block:
      "A crafting_table item in inventory is not a usable crafting station until place_block verifies a crafting_table block in the world.",
    table_recipes:
      "craft_with_table requires a nearby world crafting_table block; holding a crafting_table item is not enough.",
    furnace_like_stations:
      "Furnace-style work requires a placed station block plus fuel and input items. An inventory furnace item is not an active station."
  },
  basic_progression_dependencies: {
    stone_requires_pickaxe:
      "Cobblestone and stone progression require a pickaxe. Mining stone without an appropriate pickaxe can remove time without producing useful cobblestone evidence.",
    table_before_table_recipes:
      "Do not attempt table-sized recipes such as pickaxes, axes, shovels, furnaces, or chests unless a reachable placed crafting_table is known or the selected action will create/place one first.",
    recover_from_missing_prerequisite:
      "When a prerequisite is missing, choose the nearest executable prerequisite action. Examples: missing logs -> collect_logs; missing planks -> craft planks from logs; missing sticks -> craft sticks from planks; missing crafting_table item -> craft it from planks; missing placed table -> place a table item or move to an observed table.",
    observation_is_not_progress:
      "Repeated observe is only useful when it can reveal new reachable evidence. If inventory and nearby scan keep showing the same missing prerequisite, pivot to a prerequisite action or record a truthful blocker."
  },
  breaking_and_drops: {
    right_tool_matters:
      "Some blocks need a suitable tool to drop useful items. Stone and ores should be mined with a pickaxe; logs can be collected by hand or axe.",
    block_removed_is_not_pickup:
      "A block disappearing is not the same as the item entering inventory. Treat collection as real only after inventory or pickup evidence.",
    finish_atomic_dig:
      "Do not interrupt a dig mid-action to re-check progress; Minecraft block breaking progress resets when digging stops."
  },
  containers_and_shared_storage: {
    world_block_vs_inventory_item:
      "A chest or other container item in inventory is not usable storage until placed as a world block and opened.",
    container_contents:
      "Container contents are separate from actor inventory. Deposit/withdraw claims require container evidence and inventory delta evidence."
  },
  evidence: {
    claim_rule:
      "Treat a station, placed block, mined drop, container transfer, or crafted item as real only after runtime evidence or observation shows the matching world block, inventory delta, pickup, or container state.",
    failure_rule:
      "When an action is blocked, use the structured failure reason and evidence refs to repair the next structured args instead of repeating the same target blindly."
  }
};

function strategicGoalRank(goal: StrategicGoal) {
  switch (goal.status) {
    case "active":
      return 0;
    case "blocked":
      return 1;
    case "paused":
      return 2;
    case "satisfied":
      return 3;
    case "retired":
      return 4;
  }
}

function selectStrategicGoalsForGoalMind(goals: readonly StrategicGoal[]) {
  return [...goals]
    .sort((left, right) => {
      const statusRank = strategicGoalRank(left) - strategicGoalRank(right);
      if (statusRank !== 0) {
        return statusRank;
      }
      return right.updated_at.localeCompare(left.updated_at);
    })
    .slice(0, GOAL_MIND_STRATEGIC_GOAL_LIMIT);
}

function buildActionSurfaceSummary(
  context: SocialCycleContextPacket,
  options: { includeDirectActionSkills: boolean }
) {
  const surface = context.action_surface;
  return {
    schema: "action-surface-summary/v1",
    actor_id: surface.actor_id,
    direct_primitives: surface.direct_primitives.map((primitive) => ({
      primitive_id: primitive.primitive_id,
      category: primitive.category,
      description: primitive.description
    })),
    ...(options.includeDirectActionSkills
      ? {
          direct_action_skills: surface.direct_action_skills.map((skill) => ({
            action_skill_id: skill.action_skill_id,
            required_primitives: [...skill.required_primitives],
            success_verifier: skill.success_verifier
          }))
        }
      : {
          direct_action_skill_count: surface.direct_action_skills.length,
          deferred_action_skill_count: surface.deferred_action_skills.length,
          action_skill_details_visible_in_stage: "action_planner"
        }),
    deferred_counts: {
      primitives: surface.deferred_primitives.length,
      action_skills: surface.deferred_action_skills.length
    },
    recent_blockers: [...surface.recent_blockers],
    missing_affordances: [...surface.missing_affordances],
    rules: surface.rules
  };
}

function buildActionSelectionModes(context: SocialCycleContextPacket) {
  const canRunGeneratedProgram = context.action_surface.direct_primitives.some(
    (primitive) => primitive.primitive_id === "run_mineflayer_program"
  );
  return {
    schema: "action-selection-modes/v1",
    modes: [
      {
        kind: "use_primitive",
        origin_authority: "select_existing_runtime_affordance",
        parameters_field: "parameters"
      },
      {
        kind: "use_action_skill",
        origin_authority: "select_existing_actor_owned_action_skill",
        parameters_field: "parameters"
      },
      {
        kind: "author_and_trial_action_skill",
        enabled: canRunGeneratedProgram,
        origin_authority: "create_new_actor_owned_candidate_only_here",
        parameters_field: "parameters",
        candidate_contract: {
          schema: "generated-action-skill-candidate/v1",
          source_language: "typescript",
          helper_api_version: "mineflayer-action-skill-helper/v1",
          source_signature: "export async function run(ctx, params)",
          required_candidate_fields: [
            "proposed_skill_id",
            "purpose",
            "input_schema",
            "source",
            "helper_allowlist",
            "timeout_ms",
            "verifier",
            "promotion_policy",
            "known_failure_modes"
          ],
          lifecycle:
            "passed trial writes an active actor-owned action skill; failed trial remains candidate evidence"
        }
      }
    ],
    rules: {
      action_selection_is_only_candidate_origin: true,
      parameters_are_executable_authority: true,
      prose_is_not_executable_authority: true,
      generated_source_requires_helper_evidence: true
    }
  };
}

function buildActorTurnContract() {
  return {
    schema: "actor-turn-contract/v1",
    target_output_schema: "actor-turn-output/v1",
    choices: [
      {
        choice: "use_existing_action",
        provider_selects: "action_card_id plus schema-valid parameters",
        provider_must_not_select: ["primitive_id", "action_skill_id"],
        runtime_resolves_to: "primitive or actor-owned action skill"
      },
      {
        choice: "author_mineflayer_action",
        provider_selects:
          "schema-bound generated TypeScript candidate with parameters, helper allowlist, timeout, and verifier",
        runtime_resolves_to: "action-selection-gated generated action skill trial"
      }
    ],
    rules: {
      action_cards_hide_primitive_vs_action_skill_taxonomy: true,
      parameters_are_executable_authority: true,
      prose_is_not_executable_authority: true,
      runtime_verifies_success: true
    }
  };
}

export function buildGoalMindProviderInput(context: SocialCycleContextPacket): JsonValue {
  const strategicGoals = selectStrategicGoalsForGoalMind(context.strategic_goals);
  return {
    stage: "goal_mind",
    schema: "social-goal-mind-input/v1",
    ActorSoul: context.ActorSoul,
    ActorLifeGoal: context.ActorLifeGoal,
    strategic_goals: strategicGoals,
    strategic_goal_window: {
      visible_count: strategicGoals.length,
      total_count: context.strategic_goals.length,
      omitted_count: Math.max(0, context.strategic_goals.length - strategicGoals.length),
      selection_rule: "active_or_blocked_first_then_recent_updated_at"
    },
    world_events: context.world_events,
    previous_cycle_judgments: context.previous_cycle_judgments,
    observation: context.observation,
    minecraft_basic_guide: minecraftBasicGuide,
    action_surface_summary: buildActionSurfaceSummary(context, {
      includeDirectActionSkills: false
    }),
    allowed_primitive_ids: context.allowed_primitive_ids,
    runtime_retry_constraints: context.runtime_retry_constraints,
    relationship_context: context.relationship_context,
    memory_packet: context.memory_packet,
    plan_bead_packet: context.plan_bead_packet ?? null,
    settlement_state: context.settlement_state,
    limits: context.limits,
    rules: context.rules
  } as JsonValue;
}

export function buildActionPlannerProviderInput(input: {
  context: SocialCycleContextPacket;
  turnId: string;
  actionIndex?: number;
  cycleGoal: ActorCycleGoal;
  plannerCycleGoal: ActorCycleGoal;
  directActionSkills: JsonValue;
  runtimeAffordances: JsonValue;
  recentActionAttempts?: JsonValue;
}): JsonValue {
  const actionCardProjection = buildActionCardProjection(input.context.action_surface);
  return {
    stage: "action_planner",
    schema: "social-action-planner-input/v1",
    turn_id: input.turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: input.plannerCycleGoal,
    observation: input.context.observation,
    minecraft_basic_guide: minecraftBasicGuide,
    action_surface_summary: buildActionSurfaceSummary(input.context, {
      includeDirectActionSkills: true
    }),
    actor_turn_contract: buildActorTurnContract(),
    action_cards: actionCardProjection.action_cards as unknown as JsonValue,
    action_selection_modes: buildActionSelectionModes(input.context),
    direct_action_skills: input.directActionSkills,
    candidate_action_skill_search: input.context.candidate_action_skill_search,
    allowed_primitive_ids: input.plannerCycleGoal.allowed_primitive_ids,
    cycle_goal_allowed_primitive_ids_as_advisory: input.cycleGoal.allowed_primitive_ids,
    cycle_goal_allowed_action_skill_ids_as_advisory: input.cycleGoal.allowed_action_skill_ids,
    runtime_affordances: input.runtimeAffordances,
    world_events: input.context.world_events,
    relationship_context: input.context.relationship_context,
    memory_packet: input.context.memory_packet,
    plan_bead_packet: input.context.plan_bead_packet ?? null,
    settlement_state: input.context.settlement_state,
    blocker_histogram: input.context.settlement_state.blocker_histogram,
    runtime_retry_constraints: input.context.runtime_retry_constraints,
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    recent_action_attempts: input.recentActionAttempts ?? []
  } as JsonValue;
}

export function buildCycleJudgmentProviderInput(input: {
  context: SocialCycleContextPacket;
  turnId: string;
  actionIndex?: number;
  cycleGoal: ActorCycleGoal;
  actionIntent: ActionIntent;
  runtimeResult: JsonValue;
  evidenceRefs: string[];
  executedTools: string[];
  toolStatuses?: Array<{ tool: string; status: string }>;
  verifierStatus: string;
  planBeadOperationGuidance: JsonValue;
  actionSkillFeedbackGuidance: JsonValue;
}): JsonValue {
  return {
    stage: "cycle_judgment",
    schema: "social-cycle-judgment-input/v1",
    turn_id: input.turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: input.cycleGoal,
    action_intent: input.actionIntent,
    runtime_result: input.runtimeResult,
    evidence_refs: input.evidenceRefs,
    executed_tools: input.executedTools,
    tool_statuses: input.toolStatuses ?? [],
    verifier_status: input.verifierStatus,
    minecraft_basic_guide: minecraftBasicGuide,
    world_events: input.context.world_events,
    relationship_context: input.context.relationship_context,
    memory_packet: input.context.memory_packet,
    plan_bead_packet: input.context.plan_bead_packet ?? null,
    plan_bead_operation_guidance: input.planBeadOperationGuidance,
    action_skill_feedback_guidance: input.actionSkillFeedbackGuidance,
    action_surface_summary: buildActionSurfaceSummary(input.context, {
      includeDirectActionSkills: false
    }),
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    settlement_state: input.context.settlement_state
  } as JsonValue;
}
