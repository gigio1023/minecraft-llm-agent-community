/**
 * OpenAI-compatible Qwen Chat Completions transport.
 *
 * @remarks The default configuration remains ModelScope API-Inference. The
 * explicit Alibaba Model Studio wrapper supplies a separate endpoint,
 * provider identity, credentials label, thinking behavior, and usage policy.
 * Neither path shares the OpenAI Responses API adapter used by `openai-api`.
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
  providerId?: "modelscope-api" | "alibaba-model-studio-api";
  providerLabel?: string;
  apiKeyEnvName?: string;
  disableThinking?: boolean;
  requestTimeoutMs?: number;
  maxRetries?: number;
  repoRoot?: string;
  usageLedgerPath?: string;
  fetchImpl?: typeof fetch;
};

export type ModelScopeErrorKind =
  | "missing_api_key"
  | "invalid_config"
  | "usage_budget_exceeded"
  | "quota"
  | "rate_limit"
  | "timeout"
  | "aborted"
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

type AbortSource = "external" | "timeout";

function modelScopeBaseUrl(config: ModelScopeApiProviderConfig) {
  return (config.baseUrl?.trim() || "https://api-inference.modelscope.ai/v1").replace(/\/+$/, "");
}

function providerId(config: ModelScopeApiProviderConfig) {
  return config.providerId ?? "modelscope-api";
}

function providerLabel(config: ModelScopeApiProviderConfig) {
  return config.providerLabel?.trim() || "ModelScope";
}

function apiKeyEnvName(config: ModelScopeApiProviderConfig) {
  return config.apiKeyEnvName?.trim() || "MODELSCOPE_API_KEY";
}

function isModelStudioProvider(config: ModelScopeApiProviderConfig) {
  return providerId(config) === "alibaba-model-studio-api";
}

function thinkingRequestFields(config: ModelScopeApiProviderConfig) {
  return config.disableThinking === false
    ? {}
    : { chat_template_kwargs: { enable_thinking: false } };
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

function abortSourceOf(error: unknown): AbortSource | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  const source = (error as { abortSource?: unknown }).abortSource;
  return source === "external" || source === "timeout" ? source : undefined;
}

function classifyModelScopeError(error: unknown, status?: number): ModelScopeErrorKind {
  const abortSource = abortSourceOf(error);
  if (abortSource === "external") {
    return "aborted";
  }
  if (abortSource === "timeout") {
    return "timeout";
  }
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
  if (errorKind === "aborted") {
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
      standard_requests_limit: input.headers.get("x-ratelimit-limit-requests"),
      standard_requests_remaining: input.headers.get("x-ratelimit-remaining-requests"),
      standard_tokens_limit: input.headers.get("x-ratelimit-limit-tokens"),
      standard_tokens_remaining: input.headers.get("x-ratelimit-remaining-tokens"),
      retry_after: input.headers.get("retry-after")
    }
  });
}

function abortedBeforeTransportResult(input: {
  config: ModelScopeApiProviderConfig;
  model: string;
  started: number;
}): Extract<ModelScopeFunctionToolCallResult, { ok: false }> {
  return {
    ok: false,
    errorKind: "aborted",
    message: `${providerLabel(input.config)} request aborted before transport`,
    elapsedMs: Date.now() - input.started,
    model: input.model
  };
}

async function postModelScopeChatCompletion(input: {
  config: ModelScopeApiProviderConfig;
  body: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<{ response: ChatCompletionResponse; headers: Headers; rawText: string }> {
  const controller = new AbortController();
  let abortSource: AbortSource | undefined;
  const onExternalAbort = () => {
    if (abortSource === undefined) {
      abortSource = "external";
    }
    controller.abort();
  };
  const timeout = setTimeout(() => {
    if (abortSource === undefined) {
      abortSource = "timeout";
    }
    controller.abort();
  }, requestTimeoutMs(input.config));

  try {
    if (input.signal?.aborted) {
      throw Object.assign(new Error(`${providerLabel(input.config)} request aborted`), {
        abortSource: "external" as const
      });
    }
    if (input.signal) {
      input.signal.addEventListener("abort", onExternalAbort);
    }

    const fetchImpl = input.config.fetchImpl ?? fetch;
    try {
      const response = await fetchImpl(`${modelScopeBaseUrl(input.config)}/chat/completions`, {
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
        throw Object.assign(new Error(rawText || `${providerLabel(input.config)} HTTP ${response.status}`), {
          status: response.status,
          rawOutput: rawOutputFromResponse({ response: parsed, headers: response.headers }),
          rawText
        });
      }
      return { response: parsed, headers: response.headers, rawText };
    } catch (error) {
      if (abortSource !== undefined || controller.signal.aborted) {
        const source = abortSource ?? "timeout";
        throw Object.assign(
          new Error(
            source === "external"
              ? `${providerLabel(input.config)} request aborted`
              : `${providerLabel(input.config)} request timed out`
          ),
          { abortSource: source }
        );
      }
      throw error;
    }
  } finally {
    clearTimeout(timeout);
    if (input.signal) {
      input.signal.removeEventListener("abort", onExternalAbort);
    }
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
    call_id: typeof call.id === "string" ? call.id : `compatible-function-call-${index + 1}`,
    arguments: typeof call.function?.arguments === "string"
      ? call.function.arguments
      : JSON.stringify(call.function?.arguments ?? {})
  }));
}

function modelScopeUsage(raw: unknown, fallback: ReturnType<typeof buildEstimatedUsage>) {
  return normalizeOpenAiUsage(raw, fallback);
}

async function guardUsage(input: {
  config: ModelScopeApiProviderConfig;
  model: string;
  estimatedUsage: ReturnType<typeof buildEstimatedUsage>;
  usageContext: ProviderUsageCallContext & { repoRoot?: string; ledgerPath?: string };
}): Promise<ProviderUsageBudgetDecision> {
  return guardProviderUsageRequest({
    providerId: providerId(input.config),
    model: input.model,
    estimatedUsage: input.estimatedUsage,
    context: input.usageContext,
    ...(isModelStudioProvider(input.config) ? { maxAutoDelayMs: 0 } : {})
  });
}

export async function callModelScopeJsonSchema<T>(input: {
  config: ModelScopeApiProviderConfig;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  usageContext?: ProviderUsageCallContext;
  signal?: AbortSignal;
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

  if (input.signal?.aborted) {
    return abortedBeforeTransportResult({ config: input.config, model, started });
  }

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: `${apiKeyEnvName(input.config)} is missing. Add it to the repo-local .env file.`,
      elapsedMs: Date.now() - started,
      model
    };
  }

  let lastFailure: Extract<ModelScopeJsonCallResult<T>, { ok: false }> | undefined;
  for (let attemptIndex = 0; attemptIndex <= retries; attemptIndex++) {
    if (input.signal?.aborted) {
      return lastFailure ?? abortedBeforeTransportResult({ config: input.config, model, started });
    }

    let budgetDecision: ProviderUsageBudgetDecision | undefined;
    try {
      budgetDecision = await guardUsage({
        config: input.config,
        model,
        estimatedUsage,
        usageContext
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
        signal: input.signal,
        body: {
          model,
          messages: [
            { role: "system", content: schemaInstruction },
            { role: "user", content: input.user }
          ],
          response_format: { type: "json_object" },
          ...thinkingRequestFields(input.config),
          stream: false
        }
      });
      const rawOutput = rawOutputFromResponse({ response, headers });
      const normalizedUsage = modelScopeUsage(response.usage, estimatedUsage);
      const usageRecord = await appendProviderUsageRecord({
        providerId: providerId(input.config),
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
          message: `${providerLabel(input.config)} returned no choices`,
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
          message: `${providerLabel(input.config)} returned empty completion content`,
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < retries && !input.signal?.aborted) {
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
          message: `${providerLabel(input.config)} output was not valid JSON`,
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < retries && !input.signal?.aborted) {
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
        providerId: providerId(input.config),
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
      if (
        shouldRetryModelScopeError(errorKind, attemptIndex, retries) &&
        !input.signal?.aborted
      ) {
        await delay(1_000 * 2 ** attemptIndex);
        continue;
      }
      break;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: `${providerLabel(input.config)} request failed without a captured error`,
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
  signal?: AbortSignal;
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

  if (input.signal?.aborted) {
    return abortedBeforeTransportResult({ config: input.config, model, started });
  }

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: `${apiKeyEnvName(input.config)} is missing. Add it to the repo-local .env file.`,
      elapsedMs: Date.now() - started,
      model
    };
  }

  let lastFailure: Extract<ModelScopeFunctionToolCallResult, { ok: false }> | undefined;
  for (let attemptIndex = 0; attemptIndex <= retries; attemptIndex++) {
    if (input.signal?.aborted) {
      return lastFailure ?? abortedBeforeTransportResult({ config: input.config, model, started });
    }

    let budgetDecision: ProviderUsageBudgetDecision | undefined;
    try {
      budgetDecision = await guardUsage({
        config: input.config,
        model,
        estimatedUsage,
        usageContext
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
        signal: input.signal,
        body: {
          model,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user }
          ],
          tools: chatTools,
          tool_choice: "auto",
          parallel_tool_calls: false,
          ...thinkingRequestFields(input.config),
          stream: false
        }
      });
      const rawOutput = rawOutputFromResponse({ response, headers });
      const normalizedUsage = modelScopeUsage(response.usage, estimatedUsage);
      const usageRecord = await appendProviderUsageRecord({
        providerId: providerId(input.config),
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
          message: `${providerLabel(input.config)} returned no choices`,
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
          message: `${providerLabel(input.config)} returned no tool_calls`,
          elapsedMs: Date.now() - started,
          model,
          rawText,
          rawOutput,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < retries && !input.signal?.aborted) {
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
        providerId: providerId(input.config),
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
      if (
        shouldRetryModelScopeError(errorKind, attemptIndex, retries) &&
        !input.signal?.aborted
      ) {
        await delay(1_000 * 2 ** attemptIndex);
        continue;
      }
      break;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: `${providerLabel(input.config)} request failed without a captured error`,
    elapsedMs: Date.now() - started,
    model
  };
}
