/**
 * Full-context Mineflayer codegen contract for Actor Turn authoring.
 *
 * @remarks The request keeps the original ActorTurnInput and raw outer tool
 * call intact. The model must not receive a legacy planner summary as the
 * primary context for generated Mineflayer source.
 */
import type {
  ActorTurnInput,
  JsonObject,
  JsonValue
} from "../runtime/goals/actorEpisode/index.js";
import { mineflayerActionSkillHelperNames } from "../runtime/goals/actorEpisode/index.js";
import type { GeneratedActionSkillCandidate } from "../runtime/goals/types.js";
import type { ActorTurnAuthorMineflayerActionArgs } from "./socialActorTurnToolParser.js";

export type MineflayerCodegenRequest = {
  schema: "mineflayer-codegen-request/v1";
  request_id: string;
  actor_id: string;
  turn_id: string;
  created_at: string;
  actor_turn_input: ActorTurnInput;
  raw_outer_tool_call: JsonObject;
  parsed_author_tool_args: ActorTurnAuthorMineflayerActionArgs;
  mineflayer_codegen_skill_markdown: string;
  output_contract: {
    runtime_parameters: string;
    candidate: string;
    codegen_rationale: string;
    forbidden_context_boundary: string;
  };
  previous_validation_error?: string;
};

export type MineflayerCodegenOutput = {
  schema: "mineflayer-codegen-output/v1";
  runtime_parameters: JsonObject;
  candidate: GeneratedActionSkillCandidate;
  codegen_rationale: string;
};

export const mineflayerCodegenProviderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mineflayer_codegen: {
      type: "object",
      additionalProperties: false,
      properties: {
        schema: {
          type: "string",
          enum: ["mineflayer-codegen-output/v1"]
        },
        runtime_parameters: {
          type: "object",
          additionalProperties: true
        },
        candidate: {
          type: "object",
          additionalProperties: false,
          properties: {
            schema: {
              type: "string",
              enum: ["generated-action-skill-candidate/v1"]
            },
            proposed_skill_id: { type: "string" },
            purpose: { type: "string" },
            source_language: { type: "string", enum: ["typescript"] },
            source: { type: "string" },
            input_schema: {
              type: "object",
              additionalProperties: true,
              properties: {
                type: { type: "string", enum: ["object"] },
                properties: { type: "object" },
                required: { type: "array", items: { type: "string" } },
                additionalProperties: { type: "boolean", enum: [false] }
              },
              required: ["type", "properties", "required", "additionalProperties"]
            },
            helper_api_version: {
              type: "string",
              enum: ["mineflayer-action-skill-helper/v1"]
            },
            helper_allowlist: {
              type: "array",
              items: { type: "string", enum: mineflayerActionSkillHelperNames }
            },
            timeout_ms: { type: "number", minimum: 500, maximum: 120000 },
            verifier: { type: "object" },
            known_failure_modes: { type: "array", items: { type: "string" } },
            promotion_policy: {
              type: "string",
              enum: ["promote_after_passed_trial"]
            }
          },
          required: [
            "schema",
            "proposed_skill_id",
            "purpose",
            "source_language",
            "source",
            "input_schema",
            "helper_api_version",
            "helper_allowlist",
            "timeout_ms",
            "verifier",
            "known_failure_modes",
            "promotion_policy"
          ]
        },
        codegen_rationale: { type: "string" }
      },
      required: [
        "schema",
        "runtime_parameters",
        "candidate",
        "codegen_rationale"
      ]
    }
  },
  required: ["mineflayer_codegen"]
} as const;

export const mineflayerCodegenSystemPrompt = `You are the internal Mineflayer action skill codegen stage for Actor Turn author_mineflayer_action.
You receive the full original ActorTurnInput, the raw outer Responses function_call, the parsed author_mineflayer_action arguments, and the full injected mineflayer-code-generation SKILL.md body.

Do not operate from a legacy planner summary. Do not ask for context_to_preserve or choose which context survives; the runtime already supplied the full context.
Generate one bounded actor-owned Mineflayer TypeScript action skill candidate that can be trialed now.

Return JSON only with mineflayer_codegen:
- schema: mineflayer-codegen-output/v1
- runtime_parameters: exact current inputs, all declared by candidate.input_schema
- candidate: generated-action-skill-candidate/v1 with TypeScript source, JSON Schema input_schema, helper_api_version, helper_allowlist, timeout_ms, verifier, known_failure_modes, promotion_policy
- codegen_rationale: detailed explanation of how you used the full ActorTurnInput, outer tool-call rationale, current_state, Minecraft Basic Guide, and evidence trace.

Generated source must define export async function run(ctx, params), read runtime inputs from params, use only allowed ctx helpers from the injected skill body, await async work, and stop within timeout_ms.
Never use imports, require, process, filesystem, network, eval, Function, raw ctx.bot, unbounded loops, or hidden Mineflayer object access.`;

export type MineflayerCodegenProviderPayload = {
  schemaName: "mineflayer_codegen";
  schema: typeof mineflayerCodegenProviderSchema;
  system: string;
  user: string;
  usageContext: {
    runId?: string;
    actorId: string;
    turnId: string;
    stage: "mineflayer_codegen";
  };
};

export function buildMineflayerCodegenRequest(input: {
  requestId: string;
  actorTurnInput: ActorTurnInput;
  rawOuterToolCall: JsonObject;
  parsedAuthorToolArgs: ActorTurnAuthorMineflayerActionArgs;
  previousValidationError?: string;
}): MineflayerCodegenRequest {
  return {
    schema: "mineflayer-codegen-request/v1",
    request_id: input.requestId,
    actor_id: input.actorTurnInput.active_episode.actor_id,
    turn_id: input.actorTurnInput.turn_id,
    created_at: new Date().toISOString(),
    actor_turn_input: input.actorTurnInput,
    raw_outer_tool_call: input.rawOuterToolCall,
    parsed_author_tool_args: input.parsedAuthorToolArgs,
    mineflayer_codegen_skill_markdown:
      input.actorTurnInput.mineflayer_codegen_skill.skill_markdown,
    output_contract: {
      runtime_parameters:
        "Exact current runtime inputs for the generated action; every key must be declared by candidate.input_schema.",
      candidate:
        "A generated-action-skill-candidate/v1 object with TypeScript source, helper allowlist, timeout, verifier, failure modes, and promote_after_passed_trial policy.",
      codegen_rationale:
        "Detailed rationale preserving the outer Actor Turn judgment and full context usage.",
      forbidden_context_boundary:
        "Do not replace this request with a legacy planner summary, context_to_preserve, selected_context, or any other lossy summary."
    },
    ...(input.previousValidationError
      ? { previous_validation_error: input.previousValidationError }
      : {})
  };
}

export function buildMineflayerCodegenProviderPayload(input: {
  request: MineflayerCodegenRequest;
  runId?: string;
}): MineflayerCodegenProviderPayload {
  return {
    schemaName: "mineflayer_codegen",
    schema: mineflayerCodegenProviderSchema,
    system: mineflayerCodegenSystemPrompt,
    user: JSON.stringify(input.request satisfies JsonValue),
    usageContext: {
      runId: input.runId,
      actorId: input.request.actor_id,
      turnId: input.request.turn_id,
      stage: "mineflayer_codegen"
    }
  };
}
