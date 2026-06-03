import { runtimePrimitives } from "../gameplay/primitives/registry.js";
import {
  primitiveArgsContractSummary,
  type PrimitiveArgsContractSummary
} from "./goals/actionIntentContracts.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";

export type ActionSurfaceExposure = "direct" | "deferred";

export type ActionSurfacePrimitive = {
  primitive_id: string;
  category: string;
  exposure: ActionSurfaceExposure;
  executable: boolean;
  reason: string;
  description: string;
  args_contract: PrimitiveArgsContractSummary;
};

export type ActionSurfaceActionSkill = {
  action_skill_id: string;
  exposure: ActionSurfaceExposure;
  executable: boolean;
  required_primitives: string[];
  missing_primitives: string[];
  preconditions: string[];
  success_verifier: string;
  reason: string;
};

export type MineflayerExpansionOpportunity = {
  capability_id: string;
  category: string;
  status: "unadapted_mineflayer_capability" | "missing_runtime_adapter";
  opens_affordance: string;
  required_boundary: "bounded_runtime_adapter" | "actor_action_skill_candidate";
  reason: string;
};

export type ActionSurfacePacket = {
  schema: "action-surface/v1";
  actor_id: string;
  direct_primitives: ActionSurfacePrimitive[];
  deferred_primitives: ActionSurfacePrimitive[];
  direct_action_skills: ActionSurfaceActionSkill[];
  deferred_action_skills: ActionSurfaceActionSkill[];
  recent_blockers: Array<{ key: string; count: number; example: string }>;
  missing_affordances: string[];
  mineflayer_expansion_opportunities: MineflayerExpansionOpportunity[];
  rules: {
    exposes_actor_body_not_strategy: true;
    domain_goals_are_context_not_core_architecture: true;
    runtime_verification_required: true;
    mineflayer_is_capability_substrate: true;
    raw_mineflayer_api_not_provider_authority: true;
    generated_programs_require_helper_evidence: true;
  };
};

const primitiveDescriptions: Record<string, string> = {
  observe: "Refresh live inventory, nearby blocks, actors, and memory-facing state.",
  move_to: "Move to an explicit position or bounded scout waypoint.",
  collect_logs: "Gather reachable low log blocks; success requires inventory evidence.",
  mine_block: "Mine an explicitly requested block when tool, reachability, and expected-drop evidence allow it.",
  craft_item: "Craft an inventory-grid recipe such as planks, sticks, or crafting_table when exact ingredients exist.",
  craft_with_table: "Craft a table-bound recipe such as wooden_pickaxe against a placed crafting table, placing a carried table locally when possible. Do not use for planks, sticks, or crafting_table.",
  consume_item: "Consume an explicit edible inventory item and verify inventory or vitals changed.",
  run_mineflayer_program: "Run a bounded generated Mineflayer helper program and record source, helper calls, result, and post-observation evidence.",
  place_block: "Place one explicit inventory block into an empty/replaceable target cell, or onto a named support surface, and verify the world block afterward.",
  build_pattern: "Run one bounded block-pattern executor only when current context makes building relevant.",
  inspect_chest: "Inspect a nearby shared chest and record a container snapshot.",
  deposit_shared: "Deposit role-allowed useful inventory into shared storage.",
  withdraw_shared: "Withdraw a specific item from shared storage when it enables the current goal.",
  say: "Speak when communication matters for the current relationship or role context.",
  wait: "Wait briefly when the world needs time or no better physical action is justified.",
  remember: "Record a blocker, observation, or decision to avoid blind repetition."
};

const mineflayerExpansionCatalog: MineflayerExpansionOpportunity[] = [
  {
    capability_id: "inventory_equipment_management",
    category: "inventory",
    status: "unadapted_mineflayer_capability",
    opens_affordance: "equip, unequip, and prepare tools or armor before a physical action",
    required_boundary: "bounded_runtime_adapter",
    reason: "Mineflayer exposes inventory and equipment control, but this runtime has no verified equipment primitive yet."
  },
  {
    capability_id: "item_use_beyond_food_consumption",
    category: "survival",
    status: "unadapted_mineflayer_capability",
    opens_affordance: "use selected non-food items or interact with usable inventory items",
    required_boundary: "bounded_runtime_adapter",
    reason: "Food consumption is now a bounded primitive; broader item use still needs typed args, timeout, and verifier evidence before providers may choose it."
  },
  {
    capability_id: "entity_interaction",
    category: "entity",
    status: "unadapted_mineflayer_capability",
    opens_affordance: "interact with villagers, animals, dropped items, or other loaded entities",
    required_boundary: "actor_action_skill_candidate",
    reason: "Entity interaction is part of the Mineflayer body, but this repo needs actor-owned contracts before exposing it as direct action."
  },
  {
    capability_id: "container_interaction",
    category: "storage",
    status: "unadapted_mineflayer_capability",
    opens_affordance: "open, inspect, withdraw from, and deposit into containers beyond the current shared-chest helpers",
    required_boundary: "actor_action_skill_candidate",
    reason: "The runtime has shared storage helpers, but broader Mineflayer container behavior should become bounded action-skill candidates."
  },
  {
    capability_id: "defense_and_combat",
    category: "survival",
    status: "unadapted_mineflayer_capability",
    opens_affordance: "avoid, face, attack, or disengage from loaded hostile entities",
    required_boundary: "actor_action_skill_candidate",
    reason: "Combat and defense affect safety and social state, so they need explicit policy, evidence, and promotion before direct exposure."
  }
];

function primitiveDescription(primitiveId: string) {
  return primitiveDescriptions[primitiveId] ?? "Runtime primitive exposed by the current actor body.";
}

function primitiveReason(input: {
  primitiveId: string;
  roleAllowedPrimitiveIds: Set<string>;
  activePrimitiveIds: Set<string>;
}) {
  if (!input.roleAllowedPrimitiveIds.has(input.primitiveId)) {
    return "not role-allowed in the current actor contract";
  }
  if (!input.activePrimitiveIds.has(input.primitiveId)) {
    return "not backed by an active actor-owned action skill";
  }
  return "role-allowed and backed by active actor-owned action skills";
}

function actionSkillExposure(input: {
  record: ActorActionSkillRecord;
  executablePrimitiveIds: Set<string>;
}): ActionSurfaceActionSkill {
  const missing = input.record.required_primitives.filter(
    (primitive) => !input.executablePrimitiveIds.has(primitive)
  );
  const executable = input.record.status === "active" && missing.length === 0;
  return {
    action_skill_id: input.record.skill_id,
    exposure: executable ? "direct" : "deferred",
    executable,
    required_primitives: [...input.record.required_primitives],
    missing_primitives: missing,
    preconditions: [...input.record.preconditions],
    success_verifier: input.record.success_verifier,
    reason: executable
      ? "all required primitives are executable in the current actor body"
      : missing.length > 0
        ? `missing executable primitives: ${missing.join(", ")}`
        : `action skill status is ${input.record.status}`
  };
}

function buildMineflayerExpansionOpportunities(input: {
  missingAffordances: readonly string[];
}): MineflayerExpansionOpportunity[] {
  const missingRuntimeAdapters = input.missingAffordances.map((primitiveId) => ({
    capability_id: `runtime_adapter_for_${primitiveId}`,
    category: "runtime_adapter",
    status: "missing_runtime_adapter" as const,
    opens_affordance: primitiveId,
    required_boundary: "bounded_runtime_adapter" as const,
    reason: `Actor-owned action skills reference ${primitiveId}, but it is not executable in the current actor body.`
  }));

  return [...missingRuntimeAdapters, ...mineflayerExpansionCatalog].sort((left, right) =>
    left.capability_id.localeCompare(right.capability_id)
  );
}

/**
 * Builds the model-visible action surface without turning any domain objective
 * into a core strategy. Physical and social primitives are all just affordances
 * until Soul/LifeGoal context and runtime evidence make one useful.
 */
export function buildActionSurfacePacket(input: {
  actorId: string;
  activeActionSkills: readonly ActorActionSkillRecord[];
  allowedPrimitiveIds: readonly string[];
  recentBlockers?: Array<{ key: string; count: number; example: string }>;
}): ActionSurfacePacket {
  const roleAllowedPrimitiveIds = new Set(input.allowedPrimitiveIds);
  const activePrimitiveIds = new Set(
    input.activeActionSkills.flatMap((record) =>
      record.status === "active" ? record.required_primitives : []
    )
  );
  const executablePrimitiveIds = new Set(
    [...roleAllowedPrimitiveIds].filter((primitiveId) => activePrimitiveIds.has(primitiveId))
  );

  const primitiveRows = runtimePrimitives.map((primitive) => {
    const executable = executablePrimitiveIds.has(primitive.id);
    return {
      primitive_id: primitive.id,
      category: primitive.category,
      exposure: executable ? "direct" as const : "deferred" as const,
      executable,
      reason: primitiveReason({
        primitiveId: primitive.id,
        roleAllowedPrimitiveIds,
        activePrimitiveIds
      }),
      description: primitiveDescription(primitive.id),
      args_contract: primitiveArgsContractSummary(primitive.id)
    };
  });

  const actionSkillRows = input.activeActionSkills.map((record) =>
    actionSkillExposure({ record, executablePrimitiveIds })
  );
  const missingAffordances = actionSkillRows
    .flatMap((row) => row.missing_primitives)
    .filter((primitiveId, index, all) => all.indexOf(primitiveId) === index)
    .sort();

  return {
    schema: "action-surface/v1",
    actor_id: input.actorId,
    direct_primitives: primitiveRows.filter((row) => row.exposure === "direct"),
    deferred_primitives: primitiveRows.filter((row) => row.exposure === "deferred"),
    direct_action_skills: actionSkillRows.filter((row) => row.exposure === "direct"),
    deferred_action_skills: actionSkillRows.filter((row) => row.exposure === "deferred"),
    recent_blockers: [...(input.recentBlockers ?? [])],
    missing_affordances: missingAffordances,
    mineflayer_expansion_opportunities: buildMineflayerExpansionOpportunities({
      missingAffordances
    }),
    rules: {
      exposes_actor_body_not_strategy: true,
      domain_goals_are_context_not_core_architecture: true,
      runtime_verification_required: true,
      mineflayer_is_capability_substrate: true,
      raw_mineflayer_api_not_provider_authority: true,
      generated_programs_require_helper_evidence: true
    }
  };
}
