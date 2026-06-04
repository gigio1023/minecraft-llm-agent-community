/**
 * Gemini GenAI function-call provider.
 *
 * @remarks Actor Turn uses Gemini function declarations as a tool-selection
 * surface. The returned function calls are normalized into the same local shape
 * used by the OpenAI Responses tool parser, but Gemini remains responsible only
 * for selection and structured arguments, not execution.
 */
import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  type FunctionCall,
  type FunctionDeclaration
} from "@google/genai";
import type { FunctionTool, ResponseFunctionToolCall } from "openai/resources/responses/responses";

import type { JsonValue } from "./inputSnapshot.js";
import {
  appendProviderUsageRecord,
  buildEstimatedUsage,
  guardProviderUsageRequest,
  normalizeGeminiUsage,
  ProviderUsageBudgetError,
  type ProviderUsageBudgetDecision,
  type ProviderUsageCallContext,
  type ProviderUsageRecord
} from "./providerUsageTracker.js";
import type { GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";

export type GeminiFunctionToolCallResult =
  | {
      ok: true;
      functionCalls: ResponseFunctionToolCall[];
      rawText: string;
      rawOutput: JsonValue;
      elapsedMs: number;
      model: string;
      usageRecord?: ProviderUsageRecord;
      budgetDecision?: ProviderUsageBudgetDecision;
    }
  | {
      ok: false;
      errorKind:
        | "missing_api_key"
        | "usage_budget_exceeded"
        | "quota"
        | "rate_limit"
        | "timeout"
        | "server_error"
        | "tool_call_error"
        | "api_error";
      message: string;
      elapsedMs: number;
      model: string;
      rawText?: string;
      rawOutput?: JsonValue;
      usageRecord?: ProviderUsageRecord;
      budgetDecision?: ProviderUsageBudgetDecision;
    };

type GeminiToolErrorKind = Extract<GeminiFunctionToolCallResult, { ok: false }>["errorKind"];

function classifyGeminiToolError(error: unknown): GeminiToolErrorKind {
  const message = error instanceof Error ? error.message : String(error);
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined;
  const lower = message.toLowerCase();
  if (lower.includes("quota") || lower.includes("resource exhausted")) {
    return "quota";
  }
  if (status === 429 || lower.includes("rate limit")) {
    return "rate_limit";
  }
  if (lower.includes("timeout") || lower.includes("deadline")) {
    return "timeout";
  }
  if (
    status === 500 ||
    status === 503 ||
    lower.includes("\"code\":503") ||
    lower.includes("\"code\":500") ||
    lower.includes("internal error") ||
    lower.includes("high demand") ||
    lower.includes("\"status\":\"internal\"") ||
    lower.includes("\"status\":\"unavailable\"")
  ) {
    return "server_error";
  }
  return "api_error";
}

function shouldRetryGeminiToolError(
  errorKind: GeminiToolErrorKind,
  attemptIndex: number,
  maxRetries: number
) {
  if (attemptIndex >= maxRetries) {
    return false;
  }
  return errorKind === "server_error" || errorKind === "timeout" || errorKind === "rate_limit";
}

function shouldTryNextGeminiToolModel(errorKind: GeminiToolErrorKind) {
  return (
    errorKind === "quota" ||
    errorKind === "server_error" ||
    errorKind === "timeout" ||
    errorKind === "rate_limit"
  );
}

function optionalNumber(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function safeGeminiText(response: unknown) {
  try {
    const value = response && typeof response === "object"
      ? (response as { text?: unknown }).text
      : undefined;
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

function geminiResponseRawOutput(response: unknown, text: string): JsonValue {
  const record = response && typeof response === "object"
    ? response as {
        candidates?: unknown;
        functionCalls?: unknown;
        promptFeedback?: unknown;
        text?: unknown;
        usageMetadata?: unknown;
      }
    : {};
  return toJsonValue({
    candidates: record.candidates ?? [],
    functionCalls: record.functionCalls ?? [],
    promptFeedback: record.promptFeedback ?? null,
    text,
    usageMetadata: record.usageMetadata ?? null
  });
}

export function buildGeminiFunctionDeclarationsFromTools(
  tools: readonly FunctionTool[]
): FunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    ...(tool.description ? { description: tool.description } : {}),
    parametersJsonSchema: tool.parameters ?? {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }));
}

export function normalizeGeminiFunctionCalls(
  calls: readonly FunctionCall[] | undefined
): ResponseFunctionToolCall[] {
  return (calls ?? []).map((call, index) => ({
    type: "function_call",
    name: call.name ?? "",
    call_id: call.id ?? `gemini-function-call-${index + 1}`,
    arguments: JSON.stringify(call.args ?? {})
  }));
}

export async function callGeminiFunctionToolSelection(input: {
  config: GeminiJsonProviderConfig;
  system: string;
  user: string;
  tools: FunctionTool[];
  usageContext?: ProviderUsageCallContext;
}): Promise<GeminiFunctionToolCallResult> {
  const started = Date.now();
  const models = [input.config.model, ...(input.config.fallbackModels ?? [])]
    .map((candidate) => candidate.trim())
    .filter((candidate, index, list) => candidate.length > 0 && list.indexOf(candidate) === index);
  const primaryModel = models[0] ?? input.config.model;
  const maxOutputTokens = input.config.maxOutputTokens ?? 1600;
  const maxRetries = input.config.maxRetries ?? Number(process.env.GEMINI_JSON_MAX_RETRIES ?? 2);
  const thinkingBudget = input.config.thinkingBudget ?? optionalNumber(process.env.GEMINI_THINKING_BUDGET);
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const functionDeclarations = buildGeminiFunctionDeclarationsFromTools(input.tools);
  const allowedFunctionNames = functionDeclarations
    .map((declaration) => declaration.name)
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0);
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${input.system}\n${input.user}\n${JSON.stringify(functionDeclarations)}`,
    maxOutputTokens
  });

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: "GEMINI_API_KEY is missing. Add it to the repo-local .env file.",
      elapsedMs: Date.now() - started,
      model: primaryModel
    };
  }

  const client = new GoogleGenAI({ apiKey: input.config.apiKey });
  let lastFailure: Extract<GeminiFunctionToolCallResult, { ok: false }> | undefined;

  for (const [modelIndex, model] of models.entries()) {
    for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex++) {
      let budgetDecision: ProviderUsageBudgetDecision | undefined;
      try {
        budgetDecision = await guardProviderUsageRequest({
          providerId: "gemini-api",
          model,
          estimatedUsage,
          context: usageContext
        });
      } catch (error) {
        if (error instanceof ProviderUsageBudgetError) {
          lastFailure = {
            ok: false,
            errorKind: "usage_budget_exceeded",
            message: error.message,
            elapsedMs: Date.now() - started,
            model,
            budgetDecision: error.decision
          };
          break;
        }
        throw error;
      }

      try {
        const response = await client.models.generateContent({
          model,
          contents: input.user,
          config: {
            systemInstruction: input.system,
            maxOutputTokens,
            tools: [{ functionDeclarations }],
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.ANY,
                allowedFunctionNames
              }
            },
            ...(thinkingBudget !== undefined
              ? { thinkingConfig: { thinkingBudget, includeThoughts: false } }
              : {}),
            httpOptions: {
              timeout: input.config.requestTimeoutMs ?? 900_000
            }
          }
        });
        const normalizedUsage = normalizeGeminiUsage(response.usageMetadata, estimatedUsage);
        const functionCalls = normalizeGeminiFunctionCalls(response.functionCalls);
        const rawText = functionCalls.length > 0
          ? JSON.stringify(functionCalls)
          : safeGeminiText(response).trim();
        const rawOutput = geminiResponseRawOutput(response, functionCalls.length > 0 ? "" : rawText);
        const usageRecord = await appendProviderUsageRecord({
          providerId: "gemini-api",
          model,
          status: "succeeded",
          usage: normalizedUsage.usage,
          usageSource: normalizedUsage.source,
          context: usageContext,
          elapsedMs: Date.now() - started,
          rawUsage: normalizedUsage.rawUsage,
          budgetDecision
        });
        if (functionCalls.length === 0) {
          lastFailure = {
            ok: false,
            errorKind: "tool_call_error",
            message: "Gemini returned no function_call output item",
            elapsedMs: Date.now() - started,
            model,
            rawText,
            rawOutput,
            usageRecord,
            budgetDecision
          };
          if (attemptIndex < maxRetries) {
            await delay(1_000 * 2 ** attemptIndex);
            continue;
          }
          break;
        }

        return {
          ok: true,
          functionCalls,
          rawText,
          rawOutput,
          elapsedMs: Date.now() - started,
          model,
          usageRecord,
          budgetDecision
        };
      } catch (error) {
        const errorKind = classifyGeminiToolError(error);
        const usageRecord = await appendProviderUsageRecord({
          providerId: "gemini-api",
          model,
          status: "failed",
          usage: estimatedUsage,
          usageSource: "estimated",
          context: usageContext,
          elapsedMs: Date.now() - started,
          budgetDecision
        });
        lastFailure = {
          ok: false,
          errorKind,
          message: error instanceof Error ? error.message : String(error),
          elapsedMs: Date.now() - started,
          model,
          usageRecord,
          budgetDecision
        };

        if (shouldRetryGeminiToolError(errorKind, attemptIndex, maxRetries)) {
          await delay(1_000 * 2 ** attemptIndex);
          continue;
        }
        if (modelIndex < models.length - 1 && shouldTryNextGeminiToolModel(errorKind)) {
          break;
        }
        return lastFailure;
      }
    }

    if (modelIndex < models.length - 1) {
      continue;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: "Gemini function tool provider exhausted retries without a terminal result",
    elapsedMs: Date.now() - started,
    model: primaryModel
  };
}
