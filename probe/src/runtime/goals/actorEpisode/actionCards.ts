/**
 * Builds the Actor Turn Action Card surface from active action skills and
 * runtime context.
 *
 * @remarks Action Cards are provider-facing affordances, not direct execution.
 * Their mappings and parameter contracts must still resolve into validated
 * `ActionIntent` records before Mineflayer work starts.
 */
import type {
  ActionSurfaceActionSkill,
  ActionSurfacePacket,
  ActionSurfacePrimitive
} from "../../actionSurface.js";
import type { ActionCard } from "./types.js";

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
    };

export type ActionCardProjection = {
  schema: "action-card-projection/v1";
  actor_id: string;
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
  return [
    ...primitive.args_contract.required_structured_args.map((arg) => `missing ${arg}`),
    ...(primitive.reason ? [primitive.reason] : [])
  ];
}

function primitiveParameterHints(primitive: ActionSurfacePrimitive) {
  return primitive.args_contract.accepted_forms.length > 0
    ? [
        "Use exact structured parameter names from these accepted forms; do not snake_case camelCase keys.",
        ...primitive.args_contract.accepted_forms
      ]
    : ["No structured parameters required."];
}

function primitiveCurrentStateRequirements(primitive: ActionSurfacePrimitive) {
  switch (primitive.primitive_id) {
    case "move_to":
      return ["movement reaches a specific actionable target or enables a fresh observe after movement"];
    case "collect_logs":
      return ["nearby loaded world evidence contains reachable log blocks"];
    case "craft_item":
      return ["inventory has ingredients for the requested inventory-grid recipe"];
    case "craft_with_table":
      return [
        "nearby loaded world evidence contains a reachable crafting_table block",
        "inventory has ingredients for the requested table-bound recipe"
      ];
    case "consume_item":
      return ["inventory has the requested edible item"];
    case "deposit_shared":
      return ["shared chest nearby", "inventory has requested depositable item"];
    case "inspect_chest":
      return ["shared chest nearby"];
    case "mine_block":
      return ["nearby loaded world evidence contains the requested block"];
    case "place_block":
      return [
        "inventory has the requested block item",
        "provider supplied an explicit target cell or support surface"
      ];
    case "build_pattern":
      return [
        "inventory has solid build material",
        "provider supplied an explicit build anchor, target cell, or support surface"
      ];
    case "say":
      return ["target actor visible"];
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
      title: titleFromId(primitive.primitive_id),
      description: primitive.description,
      parameters_schema_ref:
        `runtime-parameters/${primitive.args_contract.schema}/${primitive.primitive_id}.json`,
      parameter_hints: primitiveParameterHints(primitive),
      current_state_requirements: primitiveCurrentStateRequirements(primitive),
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
  const preconditionText = skill.preconditions.length > 0
    ? ` Preconditions that must be true in current_state or recent evidence: ${skill.preconditions.join("; ")}.`
    : " No additional preconditions beyond the mapped primitive contracts.";
  return {
    card: {
      schema: "action-card/v1",
      action_card_id: actionCardId,
      title: titleFromId(skill.action_skill_id),
      description:
        `Run the actor-owned action skill ${skill.action_skill_id}. ${skill.reason}.${preconditionText}`,
      parameters_schema_ref: `actor-action-skills/${skill.action_skill_id}/parameters-schema.json`,
      parameter_hints: [
        "Before choosing this actor-owned action skill, verify each listed precondition against current_state or recent runtime evidence.",
        ...skill.preconditions.map((precondition) => `Required current_state evidence: ${precondition}.`),
        "Empty parameters are allowed only after those preconditions are satisfied.",
        "Do not output primitive_id or action_skill_id; choose this Action Card by action_card_id."
      ],
      current_state_requirements: [...skill.preconditions],
      expected_evidence: [skill.success_verifier],
      likely_blockers: [
        ...(skill.preconditions.length > 0
          ? [`do not choose until current_state satisfies: ${skill.preconditions.join("; ")}`]
          : []),
        ...skill.preconditions,
        ...skill.missing_primitives.map((primitive) => `missing primitive ${primitive}`)
      ],
      readiness: actionSkillReadiness(skill),
      runtime_mapping_ref: `action-card-mappings/${actionCardId}.json`
    },
    mapping: {
      kind: "use_action_skill",
      action_card_id: actionCardId,
      action_skill_id: skill.action_skill_id
    }
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
    .map((skill, index) => actionSkillActionCard(skill, primitiveCards.length + index));
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
    action_cards: actionCardEntries.map((entry) => entry.card),
    runtime_mappings: actionCardEntries.map((entry) => entry.mapping),
    deferred_counts: {
      primitives: surface.deferred_primitives.length,
      action_skills: surface.deferred_action_skills.length
    },
    missing_affordances: [
      ...surface.missing_affordances,
      ...(hiddenGeneratedRunnerCount > 0
        ? ["generic Mineflayer program runner hidden from use_existing_action; choose author_mineflayer_action for new generated source"]
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
