/**
 * ModelScope API-Inference Chat Completions provider.
 *
 * @remarks ModelScope's private Qwen endpoint is OpenAI-compatible at the
 * Chat Completions transport layer, not at the OpenAI Responses API layer used
 * by `openai-api` in this repo. Keep the adapter explicit so ModelScope
 * request quirks, usage headers, and tool-call behavior do not leak into the
 * OpenAI provider path.
 */
import type {
  FunctionTool,
  ResponseFunctionToolCall
} from "openai/resources/responses/responses";

import type { JsonValue } from "./inputSnapshot.js";
import { parseOpenAiJsonText } from "./openaiApiJsonProvider.js";
import {
  appendProviderUsageRecord,
  buildEstimatedUsage,
  guardProviderUsageRequest,
  normalizeOpenAiUsage,
  ProviderUsageBudgetError,
  type ProviderUsageBudgetDecision,
  type ProviderUsageCallContext,
  type ProviderUsageRecord
} from "./providerUsageTracker.js";

export type ModelScopeApiProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
  repoRoot?: string;
  usageLedgerPath?: string;
};

type ModelScopeErrorKind =
  | "missing_api_key"
  | "usage_budget_exceeded"
  | "quota"
  | "rate_limit"
  | "timeout"
  | "server_error"
  | "tool_call_error"
  | "parse_error"
  | "empty_output"
  | "api_error";

export type ModelScopeJsonCallResult<T> =
  | {
      ok: true;
      parsed: T;
      rawText: string;
      elapsedMs: number;
      model: string;
      usageRecord?: ProviderUsageRecord;
      budgetDecision?: ProviderUsageBudgetDecision;
      rawOutput?: JsonValue;
    }
  | {
      ok: false;
      errorKind: ModelScopeErrorKind;
      message: string;
      elapsedMs: number;
      model: string;
      rawText?: string;
      rawOutput?: JsonValue;
      usageRecord?: ProviderUsageRecord;
      budgetDecision?: ProviderUsageBudgetDecision;
    };

export type ModelScopeFunctionToolCallResult =
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
      errorKind: ModelScopeErrorKind;
      message: string;
      elapsedMs: number;
      model: string;
      rawText?: string;
      rawOutput?: JsonValue;
      usageRecord?: ProviderUsageRecord;
      budgetDecision?: ProviderUsageBudgetDecision;
    };

type ChatCompletionMessage = {
  content?: unknown;
  reasoning_content?: unknown;
  tool_calls?: Array<{
    id?: unknown;
    type?: unknown;
    function?: {
      name?: unknown;
      arguments?: unknown;
    };
  }>;
};

type ChatCompletionResponse = {
  id?: unknown;
  object?: unknown;
  created?: unknown;
  model?: unknown;
  choices?: Array<{
    index?: unknown;
    finish_reason?: unknown;
    message?: ChatCompletionMessage;
  }> | null;
  usage?: unknown;
  error?: unknown;
};

function modelScopeBaseUrl(config: ModelScopeApiProviderConfig) {
  return (config.baseUrl?.trim() || "https://api-inference.modelscope.ai/v1").replace(/\/+$/, "");
}

function requestTimeoutMs(config: ModelScopeApiProviderConfig) {
  return config.requestTimeoutMs ?? Number(process.env.MODELSCOPE_REQUEST_TIMEOUT_MS ?? 180_000);
}

function maxRetries(config: ModelScopeApiProviderConfig) {
  return config.maxRetries ?? Number(process.env.MODELSCOPE_JSON_MAX_RETRIES ?? 1);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function classifyModelScopeError(error: unknown, status?: number): ModelScopeErrorKind {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("rate limit")) {
    return "rate_limit";
  }
  if (lower.includes("quota") || lower.includes("insufficient")) {
    return "quota";
  }
  if (lower.includes("abort") || lower.includes("timeout") || lower.includes("timed out")) {
    return "timeout";
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return "server_error";
  }
  return "api_error";
}

function shouldRetryModelScopeError(
  errorKind: ModelScopeErrorKind,
  attemptIndex: number,
  retries: number
) {
  if (attemptIndex >= retries) {
    return false;
  }
  return errorKind === "server_error" || errorKind === "timeout" || errorKind === "rate_limit";
}

function textFromMessage(message: ChatCompletionMessage | undefined) {
  const content = message?.content;
  if (typeof content === "string") {
    return content.trim();
  }
  return "";
}

function rawOutputFromResponse(input: {
  response: ChatCompletionResponse;
  headers: Headers;
}): JsonValue {
  return toJsonValue({
    response: input.response,
    rate_limit_headers: {
      requests_limit: input.headers.get("modelscope-ratelimit-requests-limit"),
      requests_remaining: input.headers.get("modelscope-ratelimit-requests-remaining"),
      model_requests_limit: input.headers.get("modelscope-ratelimit-model-requests-limit"),
      model_requests_remaining: input.headers.get("modelscope-ratelimit-model-requests-remaining"),
      retry_after: input.headers.get("retry-after")
    }
  });
}

async function postModelScopeChatCompletion(input: {
  config: ModelScopeApiProviderConfig;
  body: Record<string, unknown>;
}): Promise<{ response: ChatCompletionResponse; headers: Headers; rawText: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs(input.config));
  try {
    const response = await fetch(`${modelScopeBaseUrl(input.config)}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input.body),
      signal: controller.signal
    });
    const rawText = await response.text();
    let parsed: ChatCompletionResponse;
    try {
      parsed = JSON.parse(rawText) as ChatCompletionResponse;
    } catch {
      parsed = { error: rawText };
    }
    if (!response.ok) {
      throw Object.assign(new Error(rawText || `ModelScope HTTP ${response.status}`), {
        status: response.status,
        rawOutput: rawOutputFromResponse({ response: parsed, headers: response.headers }),
        rawText
      });
    }
    return { response: parsed, headers: response.headers, rawText };
  } finally {
    clearTimeout(timeout);
  }
}

function toolToChatCompletionTool(tool: FunctionTool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      ...(tool.description ? { description: tool.description } : {}),
      parameters: tool.parameters ?? {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  };
}

function normalizeModelScopeToolCalls(
  calls: ChatCompletionMessage["tool_calls"]
): ResponseFunctionToolCall[] {
  return (calls ?? []).map((call, index) => ({
    type: "function_call",
    name: typeof call.function?.name === "string" ? call.function.name : "",
    call_id: typeof call.id === "string" ? call.id : `modelscope-function-call-${index + 1}`,
    arguments: typeof call.function?.arguments === "string"
      ? call.function.arguments
      : JSON.stringify(call.function?.arguments ?? {})
  }));
}

function modelScopeUsage(raw: unknown, fallback: ReturnType<typeof buildEstimatedUsage>) {
  return normalizeOpenAiUsage(raw, fallback);
}

export async function callModelScopeJsonSchema<T>(input: {
  config: ModelScopeApiProviderConfig;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  usageContext?: ProviderUsageCallContext;
}): Promise<ModelScopeJsonCallResult<T>> {
  const started = Date.now();
  const model = input.config.model;
  const retries = maxRetries(input.config);
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const schemaInstruction = [
    input.system,
    "",
    `Return only a JSON object for schema ${input.schemaName}.`,
    `JSON Schema: ${JSON.stringify(input.schema)}`
  ].join("\n");
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${schemaInstruction}\n${input.user}`
  });

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: "MODELSCOPE_API_KEY is missing. Add it to the repo-local .env file.",
      elapsedMs: Date.now() - started,
      model
    };
  }

  let lastFailure: Extract<ModelScopeJsonCallResult<T>, { ok: false }> | undefined;
  for (let attemptIndex = 0; attemptIndex <= retries; attemptIndex++) {
    let budgetDecision: ProviderUsageBudgetDecision | undefined;
    try {
      budgetDecision = await guardProviderUsageRequest({
        providerId: "modelscope-api",
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
      const { response, headers } = await postModelScopeChatCompletion({
        config: input.config,
        body: {
          model,
          messages: [
            { role: "system", content: schemaInstruction },
            { role: "user", content: input.user }
          ],
          response_format: { type: "json_object" },
          chat_template_kwargs: { enable_thinking: false },
          stream: false
        }
      });
      const rawOutput = rawOutputFromResponse({ response, headers });
      const normalizedUsage = modelScopeUsage(response.usage, estimatedUsage);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "modelscope-api",
        model,
        status: Array.isArray(response.choices) ? "succeeded" : "failed",
        usage: normalizedUsage.usage,
        usageSource: normalizedUsage.source,
        context: usageContext,
        elapsedMs: Date.now() - started,
        rawUsage: normalizedUsage.rawUsage,
        budgetDecision
      });
      const rawText = textFromMessage(response.choices?.[0]?.message);
      if (!Array.isArray(response.choices)) {
        return {
          ok: false,
          errorKind: "api_error",
          message: "ModelScope returned no choices",
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
      }
      if (!rawText) {
        lastFailure = {
          ok: false,
          errorKind: "empty_output",
          message: "ModelScope returned empty completion content",
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < retries) {
          await delay(1_000 * 2 ** attemptIndex);
          continue;
        }
        break;
      }
      try {
        return {
          ok: true,
          parsed: parseOpenAiJsonText<T>(rawText),
          rawText,
          elapsedMs: Date.now() - started,
          model,
          usageRecord,
          budgetDecision,
          rawOutput
        };
      } catch {
        lastFailure = {
          ok: false,
          errorKind: "parse_error",
          message: "ModelScope output was not valid JSON",
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < retries) {
          await delay(1_000 * 2 ** attemptIndex);
          continue;
        }
        break;
      }
    } catch (error) {
      const status = typeof error === "object" && error !== null
        ? (error as { status?: unknown }).status
        : undefined;
      const errorKind = classifyModelScopeError(error, typeof status === "number" ? status : undefined);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "modelscope-api",
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
        rawText: typeof (error as { rawText?: unknown }).rawText === "string"
          ? (error as { rawText: string }).rawText
          : undefined,
        rawOutput: (error as { rawOutput?: JsonValue }).rawOutput,
        usageRecord,
        budgetDecision
      };
      if (shouldRetryModelScopeError(errorKind, attemptIndex, retries)) {
        await delay(1_000 * 2 ** attemptIndex);
        continue;
      }
      break;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: "ModelScope request failed without a captured error",
    elapsedMs: Date.now() - started,
    model
  };
}

export async function callModelScopeFunctionToolSelection(input: {
  config: ModelScopeApiProviderConfig;
  system: string;
  user: string;
  tools: FunctionTool[];
  usageContext?: ProviderUsageCallContext;
}): Promise<ModelScopeFunctionToolCallResult> {
  const started = Date.now();
  const model = input.config.model;
  const retries = maxRetries(input.config);
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const chatTools = input.tools.map(toolToChatCompletionTool);
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${input.system}\n${input.user}\n${JSON.stringify(chatTools)}`
  });

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: "MODELSCOPE_API_KEY is missing. Add it to the repo-local .env file.",
      elapsedMs: Date.now() - started,
      model
    };
  }

  let lastFailure: Extract<ModelScopeFunctionToolCallResult, { ok: false }> | undefined;
  for (let attemptIndex = 0; attemptIndex <= retries; attemptIndex++) {
    let budgetDecision: ProviderUsageBudgetDecision | undefined;
    try {
      budgetDecision = await guardProviderUsageRequest({
        providerId: "modelscope-api",
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
      const { response, headers } = await postModelScopeChatCompletion({
        config: input.config,
        body: {
          model,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user }
          ],
          tools: chatTools,
          tool_choice: "auto",
          parallel_tool_calls: false,
          chat_template_kwargs: { enable_thinking: false },
          stream: false
        }
      });
      const rawOutput = rawOutputFromResponse({ response, headers });
      const normalizedUsage = modelScopeUsage(response.usage, estimatedUsage);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "modelscope-api",
        model,
        status: Array.isArray(response.choices) ? "succeeded" : "failed",
        usage: normalizedUsage.usage,
        usageSource: normalizedUsage.source,
        context: usageContext,
        elapsedMs: Date.now() - started,
        rawUsage: normalizedUsage.rawUsage,
        budgetDecision
      });
      const message = response.choices?.[0]?.message;
      const functionCalls = normalizeModelScopeToolCalls(message?.tool_calls);
      const rawText = functionCalls.length > 0
        ? JSON.stringify(functionCalls)
        : textFromMessage(message);
      if (!Array.isArray(response.choices)) {
        return {
          ok: false,
          errorKind: "api_error",
          message: "ModelScope returned no choices",
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
          message: "ModelScope returned no tool_calls",
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < retries) {
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
      const status = typeof error === "object" && error !== null
        ? (error as { status?: unknown }).status
        : undefined;
      const errorKind = classifyModelScopeError(error, typeof status === "number" ? status : undefined);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "modelscope-api",
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
        rawText: typeof (error as { rawText?: unknown }).rawText === "string"
          ? (error as { rawText: string }).rawText
          : undefined,
        rawOutput: (error as { rawOutput?: JsonValue }).rawOutput,
        usageRecord,
        budgetDecision
      };
      if (shouldRetryModelScopeError(errorKind, attemptIndex, retries)) {
        await delay(1_000 * 2 ** attemptIndex);
        continue;
      }
      break;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: "ModelScope request failed without a captured error",
    elapsedMs: Date.now() - started,
    model
  };
}
