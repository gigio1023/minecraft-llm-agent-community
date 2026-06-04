/**
 * Internal full-context Mineflayer codegen provider.
 *
 * @remarks This stage runs only after the outer Actor Turn selected
 * `author_mineflayer_action`. It stores a request artifact that contains the
 * original ActorTurnInput, raw function call, parsed author args, and injected
 * Mineflayer codegen skill body.
 */
import path from "node:path";

import { writeActorGoalArtifact } from "../runtime/goals/goalJsonStore.js";
import {
  validateGeneratedActionSkillCandidate,
  validateJsonObjectAgainstSimpleSchema
} from "../skills/generated/authoringSchemas.js";
import { callGeminiJsonSchema, type GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import type { JsonValue } from "./inputSnapshot.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { callOpenAiJsonSchema, type OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { ProviderUsageRecord } from "./providerUsageTracker.js";
import {
  buildMineflayerCodegenProviderPayload,
  buildMineflayerCodegenRequest,
  type MineflayerCodegenOutput,
  type MineflayerCodegenRequest
} from "./socialActorTurnCodegenContract.js";
import type { ActorTurnAuthorMineflayerActionArgs } from "./socialActorTurnToolParser.js";
import type {
  ActorTurnInput,
  JsonObject
} from "../runtime/goals/actorEpisode/index.js";
import type { SocialCycleProviderId } from "../runtime/goals/types.js";

export type MineflayerCodegenProviderResult =
  | {
      ok: true;
      output: MineflayerCodegenOutput;
      request: MineflayerCodegenRequest;
      requestRef: string;
      inputRef: string;
      outputRef: string;
      rawText: string;
      model: string;
      usageRecord?: ProviderUsageRecord;
      intermediateInputRefs?: string[];
      intermediateOutputRefs?: string[];
    }
  | {
      ok: false;
      error: string;
      request: MineflayerCodegenRequest;
      requestRef: string;
      inputRef: string;
      outputRef: string;
      intermediateInputRefs?: string[];
      intermediateOutputRefs?: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonObject(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function assertOnlyAllowedFields(input: {
  record: Record<string, unknown>;
  allowed: readonly string[];
  path: string;
  errors: string[];
}) {
  const allowed = new Set(input.allowed);
  for (const field of Object.keys(input.record)) {
    if (!allowed.has(field)) {
      input.errors.push(`${input.path}.${field} is not allowed in Mineflayer codegen output`);
    }
  }
}

export function parseMineflayerCodegenProviderOutput(value: unknown):
  | { ok: true; output: MineflayerCodegenOutput }
  | { ok: false; errors: string[] } {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Mineflayer codegen provider output must be an object"] };
  }
  const wrapperErrors: string[] = [];
  if (value.mineflayer_codegen !== undefined) {
    assertOnlyAllowedFields({
      record: value,
      allowed: ["mineflayer_codegen"],
      path: "provider_output",
      errors: wrapperErrors
    });
  }
  const body = isRecord(value.mineflayer_codegen)
    ? value.mineflayer_codegen
    : value;
  const errors: string[] = [...wrapperErrors];
  assertOnlyAllowedFields({
    record: body,
    allowed: ["schema", "runtime_parameters", "candidate", "codegen_rationale"],
    path: "mineflayer_codegen",
    errors
  });
  if (isRecord(body.candidate)) {
    assertOnlyAllowedFields({
      record: body.candidate,
      allowed: [
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
      ],
      path: "mineflayer_codegen.candidate",
      errors
    });
  }
  if (body.schema !== "mineflayer-codegen-output/v1") {
    errors.push("mineflayer_codegen.schema must be mineflayer-codegen-output/v1");
  }
  if (!isRecord(body.runtime_parameters)) {
    errors.push("mineflayer_codegen.runtime_parameters must be an object");
  }
  if (typeof body.codegen_rationale !== "string" || body.codegen_rationale.trim().length === 0) {
    errors.push("mineflayer_codegen.codegen_rationale must be a non-empty string");
  }
  const candidateResult = validateGeneratedActionSkillCandidate(body.candidate);
  if (!candidateResult.ok) {
    errors.push(...candidateResult.errors);
  } else if (isRecord(body.runtime_parameters)) {
    const parametersResult = validateJsonObjectAgainstSimpleSchema({
      schema: candidateResult.candidate.input_schema,
      parameters: body.runtime_parameters
    });
    if (!parametersResult.ok) {
      errors.push(...parametersResult.errors);
    }
  }
  if (errors.length > 0 || !candidateResult.ok || !isRecord(body.runtime_parameters)) {
    return { ok: false, errors };
  }
  const codegenRationale = typeof body.codegen_rationale === "string"
    ? body.codegen_rationale
    : "";
  return {
    ok: true,
    output: {
      schema: "mineflayer-codegen-output/v1",
      runtime_parameters: toJsonObject(body.runtime_parameters),
      candidate: candidateResult.candidate,
      codegen_rationale: codegenRationale
    }
  };
}

async function writeFailureOutput(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  turnId: string;
  providerId: SocialCycleProviderId;
  model: string;
  snapshotId: string;
  rawText?: string;
  error: string;
  usageRecord?: ProviderUsageRecord;
}) {
  return writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${input.snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: input.providerId,
    model: input.model,
    created_at: new Date().toISOString(),
    raw_output_text: input.rawText ?? "",
    parsed_output: { error: input.error },
    proposal: {
      schema: "mineflayer-codegen-provider-failure/v1",
      error: input.error
    },
    usage: input.usageRecord
  });
}

export async function runMineflayerCodegenProvider(input: {
  providerId: Extract<SocialCycleProviderId, "openai-api" | "gemini-api">;
  actorWorkspaceRootDir: string;
  actorId: string;
  actorTurnInput: ActorTurnInput;
  rawOuterToolCall: JsonObject;
  parsedAuthorToolArgs: ActorTurnAuthorMineflayerActionArgs;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  runId?: string;
  snapshotId: string;
}): Promise<MineflayerCodegenProviderResult> {
  const intermediateInputRefs: string[] = [];
  const intermediateOutputRefs: string[] = [];
  let previousValidationError: string | undefined;
  let lastFailure: Extract<MineflayerCodegenProviderResult, { ok: false }> | undefined;

  for (let repairIndex = 0; repairIndex <= 1; repairIndex++) {
    const snapshotId = repairIndex === 0 ? input.snapshotId : `${input.snapshotId}-repair-1`;
    const request = buildMineflayerCodegenRequest({
      requestId: `${snapshotId}-request`,
      actorTurnInput: input.actorTurnInput,
      rawOuterToolCall: input.rawOuterToolCall,
      parsedAuthorToolArgs: input.parsedAuthorToolArgs,
      previousValidationError
    });
    const { ref: requestRef } = await writeActorGoalArtifact(
      input.actorWorkspaceRootDir,
      input.actorId,
      path.join("goals", "cycle", "mineflayer-codegen-requests"),
      request.request_id,
      request
    );
    const payload = buildMineflayerCodegenProviderPayload({
      request,
      runId: input.runId
    });
    const inputRef = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-input-snapshot/v1",
      snapshot_id: snapshotId,
      actor_id: input.actorId,
      turn_id: input.actorTurnInput.turn_id,
      provider_id: input.providerId,
      model: (input.providerId === "openai-api" ? input.openAi?.model : input.gemini?.model) ?? "unknown",
      created_at: new Date().toISOString(),
      input: request as unknown as JsonValue
    });
    const result = input.providerId === "openai-api"
      ? await callOpenAiJsonSchema<{ mineflayer_codegen: unknown }>({
          config: input.openAi!,
          ...payload
        })
      : await callGeminiJsonSchema<{ mineflayer_codegen: unknown }>({
          config: input.gemini!,
          ...payload
        });
    const rawText = result.rawText ?? "";
    if (!result.ok) {
      const outputRef = await writeFailureOutput({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        turnId: input.actorTurnInput.turn_id,
        providerId: input.providerId,
        model: result.model,
        snapshotId,
        rawText,
        error: result.message,
        usageRecord: result.usageRecord
      });
      return {
        ok: false,
        error: result.message,
        request,
        requestRef,
        inputRef,
        outputRef,
        intermediateInputRefs,
        intermediateOutputRefs
      };
    }

    const parsed = parseMineflayerCodegenProviderOutput(
      normalizeOpenAiJsonPayload(result.parsed as Record<string, unknown>)
    );
    if (!parsed.ok) {
      const error = parsed.errors.join("; ");
      const outputRef = await writeFailureOutput({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        turnId: input.actorTurnInput.turn_id,
        providerId: input.providerId,
        model: result.model,
        snapshotId,
        rawText,
        error,
        usageRecord: result.usageRecord
      });
      lastFailure = {
        ok: false,
        error,
        request,
        requestRef,
        inputRef,
        outputRef,
        intermediateInputRefs,
        intermediateOutputRefs
      };
      if (repairIndex === 0) {
        intermediateInputRefs.push(inputRef);
        intermediateOutputRefs.push(outputRef);
        previousValidationError = error;
        continue;
      }
      return lastFailure;
    }

    const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: input.actorTurnInput.turn_id,
      provider_id: input.providerId,
      model: result.model,
      created_at: new Date().toISOString(),
      raw_output_text: rawText,
      parsed_output: parsed.output as unknown as JsonValue,
      proposal: {
        schema: "mineflayer-codegen-provider-result/v1",
        request_ref: requestRef,
        mineflayer_codegen: parsed.output as unknown as JsonValue,
        repaired_from_previous_validation_error: previousValidationError ?? null
      },
      usage: result.usageRecord
    });

    return {
      ok: true,
      output: parsed.output,
      request,
      requestRef,
      inputRef,
      outputRef,
      rawText,
      model: result.model,
      usageRecord: result.usageRecord,
      intermediateInputRefs,
      intermediateOutputRefs
    };
  }

  return lastFailure ?? {
    ok: false,
    error: "Mineflayer codegen provider exhausted repair attempts without a terminal result",
    request: buildMineflayerCodegenRequest({
      requestId: `${input.snapshotId}-exhausted-request`,
      actorTurnInput: input.actorTurnInput,
      rawOuterToolCall: input.rawOuterToolCall,
      parsedAuthorToolArgs: input.parsedAuthorToolArgs,
      previousValidationError
    }),
    requestRef: "",
    inputRef: "",
    outputRef: "",
    intermediateInputRefs,
    intermediateOutputRefs
  };
}
