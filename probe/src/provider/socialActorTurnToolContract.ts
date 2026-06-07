/**
 * Actor Turn function-tool contract.
 *
 * @remarks The outer Actor Turn provider chooses one visible Action Card tool
 * or `author_mineflayer_action`. This contract deliberately avoids
 * provider-facing compressed planner summaries and avoids generated source in
 * the outer call.
 */
import type { FunctionTool } from "openai/resources/responses/responses";

import {
  actorTurnExpectedOutcomes,
  type ActorTurnInput,
  type ActionCard
} from "../runtime/goals/actorEpisode/index.js";
import {
  resolveActionCardMapping,
  type ActionCardProjection,
  type ActionCardRuntimeMapping
} from "../runtime/goals/actorEpisode/actionCards.js";
import type { JsonValue } from "./inputSnapshot.js";

export const AUTHOR_MINEFLAYER_ACTION_TOOL_NAME = "author_mineflayer_action";

export type ActorTurnActionCardToolMapping = {
  tool_name: string;
  action_card_id: string;
  title: string;
  runtime_mapping_ref: string;
  card: ActionCard;
};

export type ActorTurnToolSelectionPayload = {
  system: string;
  user: string;
  tools: FunctionTool[];
  actionCardToolMappings: ActorTurnActionCardToolMapping[];
  usageContext: {
    runId?: string;
    actorId: string;
    turnId: string;
    stage: "actor_turn_tool_selection";
  };
};

const rationaleFieldSchemas = {
  expected_outcome: { type: "string", enum: actorTurnExpectedOutcomes },
  situation_assessment: { type: "string" },
  why_this_tool: { type: "string" },
  success_evidence: { type: "array", items: { type: "string" } },
  failure_handling: { type: "string" }
} as const;

type JsonSchemaObject = {
  type: "object";
  additionalProperties: false;
  properties: Record<string, unknown>;
  required: string[];
};

const positionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    x: { type: "number" },
    y: { type: "number" },
    z: { type: "number" }
  },
  required: ["x", "y", "z"]
} as const;

function strictObject(properties: Record<string, unknown>): JsonSchemaObject {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strictSchemaFromRecord(schema: Record<string, unknown> | undefined): JsonSchemaObject | null {
  if (!schema ||
    schema.type !== "object" ||
    schema.additionalProperties !== false ||
    !isRecord(schema.properties) ||
    !Array.isArray(schema.required) ||
    !schema.required.every((entry) => typeof entry === "string")
  ) {
    return null;
  }
  return {
    type: "object",
    additionalProperties: false,
    properties: schema.properties,
    required: [...schema.required]
  };
}

/**
 * Builds the provider-facing parameter contract for direct primitive Action Cards.
 *
 * @remarks This is intentionally a tool-calling schema, not Minecraft strategy.
 * It names the logical inputs a model must provide in the function call, such as
 * `itemName` or `targetPosition`, so the runtime can validate them before
 * Mineflayer execution. It must not infer those values from Action Card prose,
 * `current_state_requirements`, item-family heuristics, or survival priorities.
 * If the model cannot provide valid parameters, the turn should be rejected or
 * repaired, not silently filled by this module.
 */
function structuredParameterSchemaForPrimitive(primitiveId: string): JsonSchemaObject {
  switch (primitiveId) {
    case "move_to":
      return strictObject({
        direction: { type: "string", enum: ["north", "south", "east", "west"] },
        distance: { type: "number", minimum: 2, maximum: 12 }
      });
    case "place_block":
      return strictObject({
        itemName: { type: "string" },
        targetPosition: positionSchema
      });
    case "build_pattern":
      return strictObject({
        anchor: positionSchema,
        maxPlacements: { type: "number", minimum: 1, maximum: 64 }
      });
    case "mine_block":
      return strictObject({ blockName: { type: "string" } });
    case "craft_item":
    case "craft_with_table":
    case "consume_item":
    case "equip_item":
      return strictObject({ itemName: { type: "string" } });
    case "deposit_shared":
    case "withdraw_shared":
      return strictObject({
        itemName: { type: "string" },
        count: { type: "number", minimum: 1 }
      });
    case "say":
      return strictObject({ text: { type: "string" } });
    case "remember":
      return strictObject({ note: { type: "string" } });
    case "observe":
    case "inspect_chest":
    case "wait":
    case "collect_logs":
      return strictObject({});
    default:
      return strictObject({});
  }
}

/**
 * Returns the strict function-call schema for one visible Action Card.
 *
 * @remarks Primitive cards use local schemas because primitives are repo-owned
 * runtime contracts. Actor-owned action skills use their stored `input_schema`.
 * Both cases expose only logical parameters plus rationale fields to the LLM;
 * hidden runtime ids and executable mapping details stay outside the tool args.
 */
function structuredParameterSchemaForActionCard(mapping: ActionCardRuntimeMapping | null) {
  if (mapping?.kind === "use_primitive") {
    return structuredParameterSchemaForPrimitive(mapping.primitive_id);
  }
  if (mapping?.kind === "use_action_skill") {
    return strictSchemaFromRecord(mapping.input_schema) ?? strictObject({});
  }
  return strictObject({});
}

function existingActionCardToolParameters(mapping: ActionCardRuntimeMapping | null) {
  return strictObject({
    parameters: structuredParameterSchemaForActionCard(mapping),
    ...rationaleFieldSchemas
  });
}

/**
 * Outer authoring tool contract.
 *
 * @remarks This schema is deliberately rationale-only. It lets Actor Turn explain
 * why existing Action Cards are not enough and what bounded Minecraft behavior is
 * needed, but forbids source, params schema, helper settings, verifier config, and
 * context-selection summaries. The internal codegen stage receives the full
 * original ActorTurnInput automatically after this tool is selected.
 */
const authorMineflayerActionToolParameters = {
  type: "object",
  additionalProperties: false,
  properties: {
    situation_assessment: { type: "string" },
    why_codegen_is_needed: { type: "string" },
    desired_minecraft_behavior: { type: "string" },
    existing_tools_considered: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          action_card_id: { type: "string" },
          title: { type: "string" },
          why_not_enough: { type: "string" }
        },
        required: ["action_card_id", "title", "why_not_enough"]
      }
    },
    expected_outcome: { type: "string", enum: actorTurnExpectedOutcomes },
    success_evidence: { type: "array", items: { type: "string" } },
    failure_handling: { type: "string" }
  },
  required: [
    "situation_assessment",
    "why_codegen_is_needed",
    "desired_minecraft_behavior",
    "existing_tools_considered",
    "expected_outcome",
    "success_evidence",
    "failure_handling"
  ]
} as const;

export const actorTurnToolSelectionSystemPrompt = `You are choosing one Actor Turn inside an Active Episode through function calling.
Call exactly one function tool.

Use the full ActorTurnInput: decision_frame, current_state, source_evidence_bundle, action_cards, Minecraft Basic Guide, relationship context, and runtime retry constraints.
Do not produce a compressed planner action object or ordinary text.

For a visible Action Card tool:
- choose by title, description, strict function parameter schema, advisory current_state hints, and current evidence;
- use source_evidence_bundle raw cards/details beside summaries when interpreting world events, relationships, observations, recent action failures, or PlanBeads;
- put only the provider-supplied structured arguments in parameters;
- do not add actor ids, primitive ids, action skill ids, timeouts, evidence paths, verifier ids, generated source, or other hidden runtime fields;
- do not expect current_state, Action Card hints, or runtime code to synthesize safe target cells, item names, counts, or other defaults;
- set expected_outcome to the evidence delta that should prove this action worked: world_block_delta, inventory_delta, equipment_delta, position_delta, social_delta, diagnostic_unlock, or record_blocker_or_done;
- write detailed situation_assessment, why_this_tool, success_evidence, and failure_handling;
- do not rely on prose to supply missing coordinates, item names, counts, or permissions.

For author_mineflayer_action:
- choose it only when no visible Action Card can express the needed bounded Mineflayer behavior;
- do not include TypeScript source, input_schema, candidate, helper_allowlist, timeout_ms, verifier, promotion_policy, or parameters;
- set expected_outcome to the concrete delta the generated program should create; use diagnostic_unlock only for a short bounded probe that must unlock a later physical action, and not as a substitute for acting;
- write detailed rationale so the internal codegen stage can continue the same decision without losing context; the runtime will pass the full ActorTurnInput and raw outer tool call into codegen;
- never add context_to_preserve, selected_context, relevant_context_refs, or similar summary fields.

PlanBeads are passive work-state context only. They do not supply executable arguments, physical success, retry permission, generated source, or Minecraft strategy.
Runtime evidence decides what happened; do not claim physical success in the tool arguments.`;

function sanitizeToolNameSegment(title: string) {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 42);
  return normalized || "action";
}

export function actorTurnToolNameForActionCard(card: ActionCard, index: number) {
  return `action_card_${String(index + 1).padStart(3, "0")}_${sanitizeToolNameSegment(card.title)}`;
}

function actionCardDescription(card: ActionCard) {
  return [
    `Action Card ${card.action_card_id}: ${card.title}.`,
    card.description,
    `Parameter schema ref: ${card.parameters_schema_ref}.`,
    "The function schema exposes only provider-supplied structured parameters; executable authority comes from these strict function args plus runtime validators.",
    "Runtime mapping refs, primitive/action-skill ids, actor ids, timeouts, evidence paths, and verifier ids remain hidden from the provider-facing arguments.",
    "Current-state hints are advisory selection context only; they do not inject missing target cells, items, counts, permissions, or defaults.",
    `Parameter hints: ${card.parameter_hints.join(" | ") || "none"}.`,
    `Current-state advisory hints: ${card.current_state_requirements.join(" | ") || "none"}.`,
    `Expected evidence: ${card.expected_evidence.join(" | ") || "runtime evidence"}.`,
    `Likely blockers: ${card.likely_blockers.join(" | ") || "none"}.`,
    `Readiness: ${card.readiness}.`
  ].join(" ");
}

function actionCardTool(card: ActionCard, index: number, runtimeMapping: ActionCardRuntimeMapping | null): {
  tool: FunctionTool;
  mapping: ActorTurnActionCardToolMapping;
} {
  const toolName = actorTurnToolNameForActionCard(card, index);
  return {
    tool: {
      type: "function",
      name: toolName,
      description: actionCardDescription(card),
      parameters: existingActionCardToolParameters(runtimeMapping),
      strict: true
    },
    mapping: {
      tool_name: toolName,
      action_card_id: card.action_card_id,
      title: card.title,
      runtime_mapping_ref: card.runtime_mapping_ref,
      card
    }
  };
}

function authorMineflayerActionTool(): FunctionTool {
  return {
    type: "function",
    name: AUTHOR_MINEFLAYER_ACTION_TOOL_NAME,
    description:
      "Select this only when no visible Action Card can express the needed bounded Mineflayer behavior. This tool starts internal full-context codegen; it must not contain source code or context summary fields.",
    parameters: authorMineflayerActionToolParameters,
    strict: true
  };
}

export function buildActorTurnToolSelectionPayload(input: {
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  runId?: string;
}): ActorTurnToolSelectionPayload {
  const visibleIds = new Set(input.actorTurnInput.action_cards.map((card) => card.action_card_id));
  const visibleCards = input.actionCardProjection.action_cards.filter((card) =>
    visibleIds.has(card.action_card_id)
  );
  const cardEntries = visibleCards.map((card, index) =>
    actionCardTool(
      card,
      index,
      resolveActionCardMapping(input.actionCardProjection, card.action_card_id)
    )
  );
  return {
    system: actorTurnToolSelectionSystemPrompt,
    user: JSON.stringify(input.actorTurnInput satisfies JsonValue),
    tools: [
      ...cardEntries.map((entry) => entry.tool),
      authorMineflayerActionTool()
    ],
    actionCardToolMappings: cardEntries.map((entry) => entry.mapping),
    usageContext: {
      runId: input.runId,
      actorId: input.actorTurnInput.active_episode.actor_id,
      turnId: input.actorTurnInput.turn_id,
      stage: "actor_turn_tool_selection"
    }
  };
}
