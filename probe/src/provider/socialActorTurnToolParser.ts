/**
 * Parser for Actor Turn Responses function-call output.
 *
 * @remarks The parser preserves the raw function call and validates only the
 * provider-facing selection contract. Executable parameters are still checked
 * by runtime Action Card and primitive/action-skill gates later.
 */
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";

import type { JsonObject } from "../runtime/goals/actorEpisode/index.js";
import {
  AUTHOR_MINEFLAYER_ACTION_TOOL_NAME,
  type ActorTurnActionCardToolMapping
} from "./socialActorTurnToolContract.js";

export type ActorTurnExistingActionToolArgs = {
  parameters: JsonObject;
  situation_assessment: string;
  why_this_tool: string;
  success_evidence: string[];
  failure_handling: string;
};

export type ActorTurnAuthorMineflayerActionArgs = {
  situation_assessment: string;
  why_codegen_is_needed: string;
  desired_minecraft_behavior: string;
  existing_tools_considered: Array<{
    action_card_id: string;
    title: string;
    why_not_enough: string;
  }>;
  success_evidence: string[];
  failure_handling: string;
};

export type ActorTurnToolSelection =
  | {
      schema: "actor-turn-tool-selection/v1";
      selection_kind: "use_existing_action";
      tool_name: string;
      call_id: string;
      raw_tool_call: JsonObject;
      action_card_id: string;
      action_card_title: string;
      runtime_mapping_ref: string;
      args: ActorTurnExistingActionToolArgs;
    }
  | {
      schema: "actor-turn-tool-selection/v1";
      selection_kind: "author_mineflayer_action";
      tool_name: typeof AUTHOR_MINEFLAYER_ACTION_TOOL_NAME;
      call_id: string;
      raw_tool_call: JsonObject;
      args: ActorTurnAuthorMineflayerActionArgs;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonObject(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : null;
}

function assertNoForbiddenFields(input: {
  args: Record<string, unknown>;
  fields: readonly string[];
  path: string;
  errors: string[];
}) {
  for (const field of input.fields) {
    if (input.args[field] !== undefined) {
      input.errors.push(`${input.path}.${field} is forbidden in Actor Turn tool selection`);
    }
  }
}

function assertOnlyAllowedFields(input: {
  args: Record<string, unknown>;
  fields: readonly string[];
  path: string;
  errors: string[];
}) {
  const allowed = new Set(input.fields);
  for (const field of Object.keys(input.args)) {
    if (!allowed.has(field)) {
      input.errors.push(`${input.path}.${field} is not allowed in Actor Turn tool selection`);
    }
  }
}

const authorMineflayerForbiddenFields = [
  "runtime_parameters",
  "parameters",
  "source",
  "source_language",
  "candidate",
  "input_schema",
  "helper_api_version",
  "helper_allowlist",
  "timeout_ms",
  "verifier",
  "known_failure_modes",
  "promotion_policy",
  "context_to_preserve",
  "selected_context",
  "relevant_context_refs"
] as const;

function assertNoNestedForbiddenAuthorFields(input: {
  value: unknown;
  path: string;
  errors: string[];
}) {
  if (Array.isArray(input.value)) {
    input.value.forEach((entry, index) => {
      assertNoNestedForbiddenAuthorFields({
        value: entry,
        path: `${input.path}.${index}`,
        errors: input.errors
      });
    });
    return;
  }
  if (!isRecord(input.value)) {
    return;
  }
  assertNoForbiddenFields({
    args: input.value,
    fields: authorMineflayerForbiddenFields,
    path: input.path,
    errors: input.errors
  });
  for (const [key, value] of Object.entries(input.value)) {
    assertNoNestedForbiddenAuthorFields({
      value,
      path: `${input.path}.${key}`,
      errors: input.errors
    });
  }
}

function parseArguments(call: ResponseFunctionToolCall): {
  ok: true;
  args: Record<string, unknown>;
} | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(call.arguments);
    if (!isRecord(parsed)) {
      return { ok: false, error: `Tool call ${call.name} arguments must be an object` };
    }
    return { ok: true, args: parsed };
  } catch (error) {
    return {
      ok: false,
      error: `Tool call ${call.name} arguments were not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function requireString(input: {
  record: Record<string, unknown>;
  key: string;
  path: string;
  errors: string[];
}) {
  const value = input.record[input.key];
  if (!nonEmptyString(value)) {
    input.errors.push(`${input.path}.${input.key} must be a non-empty string`);
    return "";
  }
  return value;
}

function requireStringArray(input: {
  record: Record<string, unknown>;
  key: string;
  path: string;
  errors: string[];
}) {
  const values = stringArray(input.record[input.key]);
  if (!values) {
    input.errors.push(`${input.path}.${input.key} must be a string array`);
    return [];
  }
  return values;
}

function parseExistingToolArgs(args: Record<string, unknown>): {
  ok: true;
  args: ActorTurnExistingActionToolArgs;
} | { ok: false; errors: string[] } {
  const errors: string[] = [];
  assertOnlyAllowedFields({
    args,
    fields: [
      "parameters",
      "situation_assessment",
      "why_this_tool",
      "success_evidence",
      "failure_handling"
    ],
    path: "tool_args",
    errors
  });
  assertNoForbiddenFields({
    args,
    fields: [
      "action_card_id",
      "primitive_id",
      "action_skill_id",
      "runtime_parameters",
      "source",
      "candidate",
      "input_schema",
      "context_to_preserve",
      "selected_context",
      "relevant_context_refs"
    ],
    path: "tool_args",
    errors
  });
  const parameters = args.parameters;
  if (!isRecord(parameters)) {
    errors.push("tool_args.parameters must be an object");
  }
  const parsed = {
    parameters: isRecord(parameters)
      ? toJsonObject(parameters)
      : {},
    situation_assessment: requireString({ record: args, key: "situation_assessment", path: "tool_args", errors }),
    why_this_tool: requireString({ record: args, key: "why_this_tool", path: "tool_args", errors }),
    success_evidence: requireStringArray({ record: args, key: "success_evidence", path: "tool_args", errors }),
    failure_handling: requireString({ record: args, key: "failure_handling", path: "tool_args", errors })
  };
  return errors.length === 0 ? { ok: true, args: parsed } : { ok: false, errors };
}

function parseExistingToolsConsidered(value: unknown, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push("tool_args.existing_tools_considered must be an array");
    return [];
  }
  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`tool_args.existing_tools_considered.${index} must be an object`);
      return { action_card_id: "", title: "", why_not_enough: "" };
    }
    assertOnlyAllowedFields({
      args: entry,
      fields: ["action_card_id", "title", "why_not_enough"],
      path: `tool_args.existing_tools_considered.${index}`,
      errors
    });
    return {
      action_card_id: requireString({
        record: entry,
        key: "action_card_id",
        path: `tool_args.existing_tools_considered.${index}`,
        errors
      }),
      title: requireString({
        record: entry,
        key: "title",
        path: `tool_args.existing_tools_considered.${index}`,
        errors
      }),
      why_not_enough: requireString({
        record: entry,
        key: "why_not_enough",
        path: `tool_args.existing_tools_considered.${index}`,
        errors
      })
    };
  });
}

function parseAuthorToolArgs(args: Record<string, unknown>): {
  ok: true;
  args: ActorTurnAuthorMineflayerActionArgs;
} | { ok: false; errors: string[] } {
  const errors: string[] = [];
  assertOnlyAllowedFields({
    args,
    fields: [
      "situation_assessment",
      "why_codegen_is_needed",
      "desired_minecraft_behavior",
      "existing_tools_considered",
      "success_evidence",
      "failure_handling"
    ],
    path: "tool_args",
    errors
  });
  assertNoForbiddenFields({
    args,
    fields: authorMineflayerForbiddenFields,
    path: "tool_args",
    errors
  });
  assertNoNestedForbiddenAuthorFields({
    value: args.existing_tools_considered,
    path: "tool_args.existing_tools_considered",
    errors
  });
  const parsed = {
    situation_assessment: requireString({ record: args, key: "situation_assessment", path: "tool_args", errors }),
    why_codegen_is_needed: requireString({ record: args, key: "why_codegen_is_needed", path: "tool_args", errors }),
    desired_minecraft_behavior: requireString({
      record: args,
      key: "desired_minecraft_behavior",
      path: "tool_args",
      errors
    }),
    existing_tools_considered: parseExistingToolsConsidered(args.existing_tools_considered, errors),
    success_evidence: requireStringArray({ record: args, key: "success_evidence", path: "tool_args", errors }),
    failure_handling: requireString({ record: args, key: "failure_handling", path: "tool_args", errors })
  };
  return errors.length === 0 ? { ok: true, args: parsed } : { ok: false, errors };
}

export function parseActorTurnToolSelection(input: {
  functionCalls: ResponseFunctionToolCall[];
  actionCardToolMappings: ActorTurnActionCardToolMapping[];
}): { ok: true; selection: ActorTurnToolSelection } | { ok: false; errors: string[] } {
  if (input.functionCalls.length !== 1) {
    return {
      ok: false,
      errors: [`Actor Turn provider must return exactly one function_call; received ${input.functionCalls.length}`]
    };
  }
  const call = input.functionCalls[0]!;
  const raw_tool_call = toJsonObject(call);
  const parsedArgs = parseArguments(call);
  if (!parsedArgs.ok) {
    return { ok: false, errors: [parsedArgs.error] };
  }

  if (call.name === AUTHOR_MINEFLAYER_ACTION_TOOL_NAME) {
    const authorArgs = parseAuthorToolArgs(parsedArgs.args);
    if (!authorArgs.ok) {
      return { ok: false, errors: authorArgs.errors };
    }
    return {
      ok: true,
      selection: {
        schema: "actor-turn-tool-selection/v1",
        selection_kind: "author_mineflayer_action",
        tool_name: AUTHOR_MINEFLAYER_ACTION_TOOL_NAME,
        call_id: call.call_id,
        raw_tool_call,
        args: authorArgs.args
      }
    };
  }

  const mapping = input.actionCardToolMappings.find((entry) => entry.tool_name === call.name);
  if (!mapping) {
    return {
      ok: false,
      errors: [`Actor Turn provider selected hidden or unknown tool ${call.name}`]
    };
  }
  const existingArgs = parseExistingToolArgs(parsedArgs.args);
  if (!existingArgs.ok) {
    return { ok: false, errors: existingArgs.errors };
  }
  return {
    ok: true,
    selection: {
      schema: "actor-turn-tool-selection/v1",
      selection_kind: "use_existing_action",
      tool_name: call.name,
      call_id: call.call_id,
      raw_tool_call,
      action_card_id: mapping.action_card_id,
      action_card_title: mapping.title,
      runtime_mapping_ref: mapping.runtime_mapping_ref,
      args: existingArgs.args
    }
  };
}
