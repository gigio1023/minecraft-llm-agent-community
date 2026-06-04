/**
 * OpenAI Responses function-call provider.
 *
 * @remarks This module is separate from the JSON-schema provider because Actor
 * Turn tool selection must not be forced through a provider-facing LegacyPlannerAction
 * JSON object. It returns raw function-call items and leaves runtime validation
 * to the caller.
 */
import OpenAI from "openai";
import type {
  FunctionTool,
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseFunctionToolCall,
  ResponseStatus
} from "openai/resources/responses/responses";

import type { JsonValue } from "./inputSnapshot.js";
import {
  buildEstimatedUsage,
  guardProviderUsageRequest,
  appendProviderUsageRecord,
  normalizeOpenAiUsage,
  ProviderUsageBudgetError,
  type ProviderUsageBudgetDecision,
  type ProviderUsageCallContext,
  type ProviderUsageRecord
} from "./providerUsageTracker.js";
import {
  normalizeOpenAiReasoningEffort,
  type OpenAiJsonProviderConfig
} from "./openaiApiJsonProvider.js";

export type OpenAiFunctionToolCallResult =
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
        | "model_not_found"
        | "quota"
        | "rate_limit"
        | "billing"
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

type OpenAiToolErrorKind =
  Extract<OpenAiFunctionToolCallResult, { ok: false }>["errorKind"];

function envFlag(name: string, defaultValue: boolean) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return defaultValue;
  }
  return /^(1|true|yes|on)$/i.test(raw);
}

function responsesBackgroundEnabled(config: OpenAiJsonProviderConfig) {
  return config.responsesBackground ?? envFlag("OPENAI_RESPONSES_BACKGROUND", true);
}

function buildOpenAiToolResponseRequest(input: {
  model: string;
  reasoning?: string;
  background?: boolean;
  system: string;
  user: string;
  tools: FunctionTool[];
}): ResponseCreateParamsNonStreaming {
  const reasoningEffort = normalizeOpenAiReasoningEffort(input.reasoning);
  const background = input.background === true;
  return {
    model: input.model,
    instructions: input.system,
    input: input.user,
    tools: input.tools,
    tool_choice: "required",
    parallel_tool_calls: false,
    ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
    ...(background ? { background: true, store: true } : { store: false })
  };
}

function isPendingResponseStatus(status: ResponseStatus | undefined) {
  return status === "queued" || status === "in_progress";
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function awaitOpenAiResponse(input: {
  client: OpenAI;
  response: Response;
  pollIntervalMs: number;
  timeoutMs: number;
}) {
  let response = input.response;
  const started = Date.now();
  while (isPendingResponseStatus(response.status)) {
    if (Date.now() - started > input.timeoutMs) {
      throw new Error(`OpenAI Responses API polling timed out for ${response.id}`);
    }
    await delay(input.pollIntervalMs);
    response = await input.client.responses.retrieve(response.id);
  }
  return response;
}

function collectResponseOutputText(response: Response) {
  const helperText = (response as { output_text?: unknown }).output_text;
  if (typeof helperText === "string" && helperText.trim()) {
    return helperText;
  }

  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message") {
      continue;
    }
    for (const part of item.content ?? []) {
      if (part.type === "output_text") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("");
}

function responseFailureMessage(response: Response) {
  const status = response.status ?? "unknown";
  const error = response.error
    ? `: ${response.error.code ?? "error"} ${response.error.message}`
    : "";
  const incomplete = response.incomplete_details
    ? `: incomplete reason ${response.incomplete_details.reason}`
    : "";
  return `OpenAI Responses API returned status ${status}${error}${incomplete}`;
}

function classifyOpenAiError(error: unknown): OpenAiToolErrorKind {
  const message = error instanceof Error ? error.message : String(error);
  const record = typeof error === "object" && error !== null
    ? error as { status?: unknown; code?: unknown }
    : {};
  const status = typeof record.status === "number" ? record.status : undefined;
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";
  const lower = message.toLowerCase();
  if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return "model_not_found";
  }
  if (status === 429 || lower.includes("rate limit")) {
    return "rate_limit";
  }
  if (lower.includes("quota") || lower.includes("insufficient")) {
    return "quota";
  }
  if (lower.includes("billing")) {
    return "billing";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || code === "etimedout") {
    return "timeout";
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return "server_error";
  }
  return "api_error";
}

function extractFunctionCalls(response: Response): ResponseFunctionToolCall[] {
  return (response.output ?? []).filter((item): item is ResponseFunctionToolCall =>
    item.type === "function_call"
  );
}

function shouldRetryOpenAiToolError(
  errorKind: OpenAiToolErrorKind,
  attemptIndex: number,
  maxRetries: number
) {
  if (attemptIndex >= maxRetries) {
    return false;
  }
  return errorKind === "server_error" || errorKind === "timeout" || errorKind === "rate_limit";
}

function responseRawOutput(response: Response): JsonValue {
  return JSON.parse(JSON.stringify({
    id: response.id,
    status: response.status,
    error: response.error ?? null,
    incomplete_details: response.incomplete_details ?? null,
    output: response.output ?? [],
    usage: response.usage ?? null
  })) as JsonValue;
}

/**
 * Calls OpenAI Responses with only repo-owned function tools.
 *
 * @remarks The function call is a model selection artifact. The caller still
 * decides whether the selected tool name is visible and whether arguments pass
 * runtime contracts.
 */
export async function callOpenAiFunctionToolSelection(input: {
  config: OpenAiJsonProviderConfig;
  system: string;
  user: string;
  tools: FunctionTool[];
  usageContext?: ProviderUsageCallContext;
}): Promise<OpenAiFunctionToolCallResult> {
  const started = Date.now();
  const model = input.config.model;
  const maxRetries = input.config.maxRetries ?? Number(process.env.OPENAI_JSON_MAX_RETRIES ?? 2);
  const useBackgroundResponses = responsesBackgroundEnabled(input.config);
  const responsePollIntervalMs =
    input.config.responsePollIntervalMs ?? Number(process.env.OPENAI_RESPONSES_POLL_INTERVAL_MS ?? 2_000);
  const responsePollTimeoutMs =
    input.config.responsePollTimeoutMs ?? Number(process.env.OPENAI_RESPONSES_POLL_TIMEOUT_MS ?? 300_000);
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${input.system}\n${input.user}\n${JSON.stringify(input.tools)}`
  });

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: "OPENAI_API_KEY is missing. Add it to the repo-local .env file.",
      elapsedMs: Date.now() - started,
      model
    };
  }

  const client = new OpenAI({ apiKey: input.config.apiKey });
  let lastFailure: Extract<OpenAiFunctionToolCallResult, { ok: false }> | undefined;

  for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex++) {
    let budgetDecision: ProviderUsageBudgetDecision | undefined;
    try {
      budgetDecision = await guardProviderUsageRequest({
        providerId: "openai-api",
        model,
        estimatedUsage,
        context: usageContext
      });
    } catch (error) {
      if (error instanceof ProviderUsageBudgetError) {
        return {
          ok: false,
          errorKind: "usage_budget_exceeded",
          message: error.message,
          elapsedMs: Date.now() - started,
          model,
          budgetDecision: error.decision
        };
      }
      throw error;
    }

    try {
      const initialResponse = await client.responses.create(buildOpenAiToolResponseRequest({
        model,
        reasoning: input.config.reasoning,
        background: useBackgroundResponses,
        system: input.system,
        user: input.user,
        tools: input.tools
      }));
      const response = await awaitOpenAiResponse({
        client,
        response: initialResponse,
        pollIntervalMs: responsePollIntervalMs,
        timeoutMs: responsePollTimeoutMs
      });
      const normalizedUsage = normalizeOpenAiUsage(response.usage, estimatedUsage);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "openai-api",
        model,
        status: response.status === "completed" ? "succeeded" : "failed",
        usage: normalizedUsage.usage,
        usageSource: normalizedUsage.source,
        context: usageContext,
        elapsedMs: Date.now() - started,
        rawUsage: normalizedUsage.rawUsage,
        budgetDecision
      });
      const rawOutput = responseRawOutput(response);
      const functionCalls = extractFunctionCalls(response);
      const rawText = functionCalls.length > 0
        ? JSON.stringify(functionCalls)
        : collectResponseOutputText(response);

      if (response.status !== "completed") {
        return {
          ok: false,
          errorKind: "api_error",
          message: responseFailureMessage(response),
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
      }

      if (functionCalls.length === 0) {
        lastFailure = {
          ok: false,
          errorKind: "tool_call_error",
          message: "OpenAI returned no function_call output item",
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
      const errorKind = classifyOpenAiError(error);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "openai-api",
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
      if (shouldRetryOpenAiToolError(errorKind, attemptIndex, maxRetries)) {
        await delay(1_000 * 2 ** attemptIndex);
        continue;
      }
      return lastFailure;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: "OpenAI function tool provider exhausted retries without a terminal result",
    elapsedMs: Date.now() - started,
    model
  };
}
