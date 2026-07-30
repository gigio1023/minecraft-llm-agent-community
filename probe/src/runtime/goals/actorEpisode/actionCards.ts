/**
 * Builds the Actor Turn Action Card surface from active action skills and
 * runtime context.
 *
 * @remarks Action Cards are provider-facing affordances, not direct execution.
 * Their mappings and parameter contracts must still resolve into validated
 * Actor Turn actions before Mineflayer work starts.
 */
import type {
  ActionSurfaceActionSkill,
  ActionSurfacePacket,
  ActionSurfacePrimitive
} from "../../actionSurface.js";
import type { ActionCard, ActionCardSharedGuidance } from "./types.js";

export type ActionCardRuntimeMapping =
  | {
      kind: "use_primitive";
      action_card_id: string;
      primitive_id: string;
    }
  | {
      kind: "use_action_skill";
      action_card_id: string;
      action_skill_id: string;
      input_schema?: Record<string, unknown>;
    };

export type ActionCardProjection = {
  schema: "action-card-projection/v1";
  actor_id: string;
  shared_guidance?: ActionCardSharedGuidance;
  action_cards: ActionCard[];
  runtime_mappings: ActionCardRuntimeMapping[];
  deferred_counts: {
    primitives: number;
    action_skills: number;
  };
  missing_affordances: string[];
};

function titleFromId(id: string) {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_:-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function primitiveReadiness(primitive: ActionSurfacePrimitive): ActionCard["readiness"] {
  switch (primitive.primitive_id) {
    case "observe":
    case "wait":
    case "remember":
      return "ready";
    default:
      return "requires_current_state_check";
  }
}

function primitiveLikelyBlockers(primitive: ActionSurfacePrimitive) {
  return primitive.args_contract.required_structured_args.map((arg) => `missing ${arg}`);
}

function primitiveCurrentStateHints(primitive: ActionSurfacePrimitive) {
  switch (primitive.primitive_id) {
    case "move_to":
      return ["choose movement only when it reaches a specific actionable target or enables a fresh observe after movement"];
    case "collect_logs":
      return ["check whether nearby loaded world evidence contains reachable log blocks"];
    case "craft_item":
      return ["check whether inventory has ingredients for the requested inventory-grid recipe"];
    case "craft_with_table":
      return [
        "check whether nearby loaded world evidence contains a reachable crafting_table block",
        "check whether inventory has ingredients for the requested table-bound recipe"
      ];
    case "consume_item":
      return ["check whether inventory has the requested edible item"];
    case "equip_item":
      return [
        "check whether inventory has the exact requested itemName",
        "held-item evidence may already satisfy the preparation step"
      ];
    case "deposit_shared":
      return ["check whether a shared chest is nearby", "check whether inventory has the requested depositable item"];
    case "inspect_chest":
      return ["check whether a shared chest is nearby"];
    case "mine_block":
      return ["check whether nearby loaded world evidence contains the requested block"];
    case "place_block":
      return [
        "check whether inventory has the requested block item",
        "supply an explicit target cell or support-surface coordinate in function parameters"
      ];
    case "build_pattern":
      return [
        "check whether inventory has solid build material",
        "supply an explicit build anchor or target coordinate in function parameters"
      ];
    case "say":
      return ["check whether communication context exists"];
    default:
      return [];
  }
}

function primitiveExpectedEvidence(primitive: ActionSurfacePrimitive) {
  if (primitive.primitive_id === "move_to") {
    return [
      "position_delta evidence only; the next turn must use the new position for world, inventory, container, chat, or relationship progress"
    ];
  }
  return primitive.args_contract.accepted_forms.length > 0
    ? [`runtime evidence from ${primitive.primitive_id}`]
    : ["runtime evidence"];
}

function primitiveActionCard(
  primitive: ActionSurfacePrimitive,
  index: number
): { card: ActionCard; mapping: ActionCardRuntimeMapping } {
  const actionCardId = `action-card-${String(index + 1).padStart(3, "0")}`;
  return {
    card: {
      schema: "action-card/v1",
      action_card_id: actionCardId,
      behavior_kind: "direct_primitive",
      title: titleFromId(primitive.primitive_id),
      description: primitive.description,
      shared_guidance_ref: "action-card-shared-guidance",
      parameters_schema_ref:
        `runtime-parameters/${primitive.args_contract.schema}/${primitive.primitive_id}.json`,
      parameter_hints: [],
      current_state_requirements: primitiveCurrentStateHints(primitive),
      expected_evidence: primitiveExpectedEvidence(primitive),
      likely_blockers: primitiveLikelyBlockers(primitive),
      readiness: primitiveReadiness(primitive),
      runtime_mapping_ref: `action-card-mappings/${actionCardId}.json`
    },
    mapping: {
      kind: "use_primitive",
      action_card_id: actionCardId,
      primitive_id: primitive.primitive_id
    }
  };
}

function actionSkillReadiness(skill: ActionSurfaceActionSkill): ActionCard["readiness"] {
  if (skill.preconditions.length > 0) {
    return "requires_current_state_check";
  }
  return skill.required_primitives.length > 1 ? "risky" : "ready";
}

function actionSkillActionCard(
  skill: ActionSurfaceActionSkill,
  index: number
): { card: ActionCard; mapping: ActionCardRuntimeMapping } {
  const actionCardId = `action-card-${String(index + 1).padStart(3, "0")}`;
  return {
    card: {
      schema: "action-card/v1",
      action_card_id: actionCardId,
      behavior_kind: "actor_owned_action_skill",
      title: titleFromId(skill.action_skill_id),
      description: `Performs the actor-owned ${titleFromId(skill.action_skill_id)} behavior.`,
      shared_guidance_ref: "action-card-shared-guidance",
      parameters_schema_ref: `actor-action-skills/${skill.action_skill_id}/parameters-schema.json`,
      parameter_hints: [],
      current_state_requirements: [...skill.preconditions],
      expected_evidence: [skill.success_verifier],
      likely_blockers: skill.missing_primitives.map((primitive) => `missing primitive ${primitive}`),
      readiness: actionSkillReadiness(skill),
      runtime_mapping_ref: `action-card-mappings/${actionCardId}.json`
    },
    mapping: {
      kind: "use_action_skill",
      action_card_id: actionCardId,
      action_skill_id: skill.action_skill_id,
      ...(skill.input_schema ? { input_schema: skill.input_schema } : {})
    }
  };
}

function buildSharedGuidance(input: {
  primitiveEntries: Array<{ card: ActionCard; mapping: ActionCardRuntimeMapping }>;
  actionSkillEntries: Array<{
    card: ActionCard;
    requiredPrimitives: string[];
  }>;
}): ActionCardSharedGuidance {
  const primitiveCardById = new Map<string, string>();
  for (const entry of input.primitiveEntries) {
    if (entry.mapping.kind === "use_primitive") {
      primitiveCardById.set(entry.mapping.primitive_id, entry.card.action_card_id);
    }
  }
  const actionSkillCardsByPrimitive = new Map<string, string[]>();
  for (const entry of input.actionSkillEntries) {
    for (const primitiveId of entry.requiredPrimitives) {
      if (!primitiveCardById.has(primitiveId)) {
        continue;
      }
      const cardIds = actionSkillCardsByPrimitive.get(primitiveId) ?? [];
      cardIds.push(entry.card.action_card_id);
      actionSkillCardsByPrimitive.set(primitiveId, cardIds);
    }
  }

  return {
    schema: "action-card-shared-guidance/v1",
    guidance_ref: "action-card-shared-guidance",
    applies_to: "all_action_cards",
    parameter_rules: [
      "Use the exact structured parameter names exposed by the selected function schema.",
      "Provide every required item name, count, position, or other argument explicitly; current state and prose never supply missing values.",
      "Actor-owned action skills may use empty parameters only when their strict function schema accepts an empty object."
    ],
    evidence_rules: [
      "Expected evidence describes what to inspect after execution; it does not prove success before runtime evidence exists.",
      "Runtime evidence, not the card title or provider explanation, decides the observed outcome."
    ],
    selection_rules: [
      "Choose by action_card_id and do not output hidden primitive or action-skill identifiers.",
      "Current-state requirements are advisory selection checks and never executable arguments.",
      "A direct primitive exposes one runtime operation; an overlapping actor-owned action skill remains separate only because it adds owned behavior, local verification, multiple operations, or bounded recovery."
    ],
    grouped_guidance: [],
    overlap_groups: [...actionSkillCardsByPrimitive.entries()].map(([primitiveId, cardIds]) => ({
      direct_primitive_action_card_id: primitiveCardById.get(primitiveId)!,
      actor_owned_action_skill_card_ids: cardIds
    }))
  };
}

function exposesGenericMineflayerProgramRunner(id: string) {
  return id === "run_mineflayer_program" || id === "runBoundedMineflayerProgram";
}

export function buildActionCardProjection(surface: ActionSurfacePacket): ActionCardProjection {
  const primitiveCards = surface.direct_primitives
    .filter((primitive) => primitive.executable)
    .filter((primitive) => !exposesGenericMineflayerProgramRunner(primitive.primitive_id))
    .map((primitive, index) => primitiveActionCard(primitive, index));
  const actionSkillCards = surface.direct_action_skills
    .filter((skill) => skill.executable)
    .filter((skill) => !exposesGenericMineflayerProgramRunner(skill.action_skill_id))
    .map((skill, index) => ({
      ...actionSkillActionCard(skill, primitiveCards.length + index),
      requiredPrimitives: [...skill.required_primitives]
    }));
  const actionCardEntries = [...primitiveCards, ...actionSkillCards];
  const hiddenGeneratedRunnerCount =
    surface.direct_primitives.filter((primitive) =>
      primitive.executable && exposesGenericMineflayerProgramRunner(primitive.primitive_id)
    ).length +
    surface.direct_action_skills.filter((skill) =>
      skill.executable && exposesGenericMineflayerProgramRunner(skill.action_skill_id)
    ).length;

  return {
    schema: "action-card-projection/v1",
    actor_id: surface.actor_id,
    shared_guidance: buildSharedGuidance({
      primitiveEntries: primitiveCards,
      actionSkillEntries: actionSkillCards
    }),
    action_cards: actionCardEntries.map((entry) => entry.card),
    runtime_mappings: actionCardEntries.map((entry) => entry.mapping),
    deferred_counts: {
      primitives: surface.deferred_primitives.length,
      action_skills: surface.deferred_action_skills.length
    },
    missing_affordances: [
      ...surface.missing_affordances,
      ...(hiddenGeneratedRunnerCount > 0
        ? ["generic Mineflayer program runner excluded from use_existing_action; choose author_mineflayer_action for new generated source"]
        : [])
    ]
  };
}

export function resolveActionCardMapping(
  projection: ActionCardProjection,
  actionCardId: string
) {
  return projection.runtime_mappings.find((mapping) => mapping.action_card_id === actionCardId) ?? null;
}
