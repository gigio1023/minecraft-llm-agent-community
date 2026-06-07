import OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseStatus
} from "openai/resources/responses/responses";
import type { ReasoningEffort } from "openai/resources/shared";

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

export type OpenAiJsonProviderConfig = {
  apiKey: string;
  model: string;
  reasoning?: string;
  maxRetries?: number;
  responsesBackground?: boolean;
  responsePollIntervalMs?: number;
  responsePollTimeoutMs?: number;
  repoRoot?: string;
  usageLedgerPath?: string;
};

export type OpenAiJsonCallResult<T> =
  | {
      ok: true;
      parsed: T;
      rawText: string;
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
        | "parse_error"
        | "empty_output"
        | "api_error";
      message: string;
      elapsedMs: number;
      model: string;
      rawText?: string;
      usageRecord?: ProviderUsageRecord;
      budgetDecision?: ProviderUsageBudgetDecision;
    };

type OpenAiErrorKind = Extract<OpenAiJsonCallResult<unknown>, { ok: false }>["errorKind"];

const OPENAI_REASONING_EFFORTS: ReadonlySet<NonNullable<ReasoningEffort>> = new Set([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh"
]);

export function normalizeOpenAiReasoningEffort(
  value: string | undefined
): NonNullable<ReasoningEffort> | undefined {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }
  if (OPENAI_REASONING_EFFORTS.has(normalized as NonNullable<ReasoningEffort>)) {
    return normalized as NonNullable<ReasoningEffort>;
  }
  return undefined;
}

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

export function buildOpenAiJsonSchemaResponseRequest(input: {
  model: string;
  reasoning?: string;
  background?: boolean;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
}): ResponseCreateParamsNonStreaming {
  const reasoningEffort = normalizeOpenAiReasoningEffort(input.reasoning);
  const background = input.background === true;
  return {
    model: input.model,
    instructions: input.system,
    input: input.user,
    ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
    ...(background ? { background: true, store: true } : { store: false }),
    text: {
      format: {
        type: "json_schema",
        name: input.schemaName,
        // Strict mode requires every object property in `required`; some stage
        // schemas intentionally keep optional sections and validate after parse.
        strict: false,
        schema: input.schema
      }
    }
  };
}

function isPendingResponseStatus(status: ResponseStatus | undefined) {
  return status === "queued" || status === "in_progress";
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

function classifyOpenAiError(error: unknown): OpenAiErrorKind {
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

function shouldRetryOpenAiJsonError(
  errorKind: OpenAiErrorKind,
  attemptIndex: number,
  maxRetries: number
) {
  if (attemptIndex >= maxRetries) {
    return false;
  }
  return errorKind === "server_error" || errorKind === "timeout" || errorKind === "rate_limit";
}

function extractFirstJsonValue(text: string) {
  const start = text.search(/[\[{]/);
  if (start < 0) {
    return null;
  }

  const opening = text[start];
  const closing = opening === "{" ? "}" : "]";
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
      continue;
    }

    if (char === "}" || char === "]") {
      if (stack.pop() !== char) {
        return null;
      }
      if (stack.length === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function parseOpenAiJsonText<T>(rawText: string): T {
  try {
    return JSON.parse(rawText) as T;
  } catch (primaryError) {
    const firstJson = extractFirstJsonValue(rawText);
    if (!firstJson || firstJson.trim() === rawText.trim()) {
      throw primaryError;
    }
    return JSON.parse(firstJson) as T;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls OpenAI Responses with JSON schema output and optional background polling.
 * Never logs or returns the API key.
 */
export async function callOpenAiJsonSchema<T>(input: {
  config: OpenAiJsonProviderConfig;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  usageContext?: ProviderUsageCallContext;
}): Promise<OpenAiJsonCallResult<T>> {
  const started = Date.now();
  const model = input.config.model;
  const maxRetries = input.config.maxRetries ?? Number(process.env.OPENAI_JSON_MAX_RETRIES ?? 2);
  const useBackgroundResponses = responsesBackgroundEnabled(input.config);
  const responsePollIntervalMs =
    input.config.responsePollIntervalMs ?? Number(process.env.OPENAI_RESPONSES_POLL_INTERVAL_MS ?? 2_000);
  const responsePollTimeoutMs =
    input.config.responsePollTimeoutMs ?? Number(process.env.OPENAI_RESPONSES_POLL_TIMEOUT_MS ?? 900_000);
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${input.system}\n${input.user}`
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
  let lastFailure: Extract<OpenAiJsonCallResult<T>, { ok: false }> | undefined;

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
      const initialResponse = await client.responses.create(buildOpenAiJsonSchemaResponseRequest({
        model,
        reasoning: input.config.reasoning,
        background: useBackgroundResponses,
        schemaName: input.schemaName,
        schema: input.schema,
        system: input.system,
        user: input.user
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

      if (response.status !== "completed") {
        return {
          ok: false,
          errorKind: "api_error",
          message: responseFailureMessage(response),
          elapsedMs: Date.now() - started,
          model,
          rawText: collectResponseOutputText(response),
          usageRecord,
          budgetDecision
        };
      }

      const rawText = collectResponseOutputText(response);
      if (!rawText.trim()) {
        lastFailure = {
          ok: false,
          errorKind: "empty_output",
          message: "OpenAI returned empty completion content",
          elapsedMs: Date.now() - started,
          model,
          rawText,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < maxRetries) {
          await delay(1_000 * 2 ** attemptIndex);
          continue;
        }
        break;
      }

      try {
        const parsed = parseOpenAiJsonText<T>(rawText);
        return {
          ok: true,
          parsed,
          rawText,
          elapsedMs: Date.now() - started,
          model,
          usageRecord,
          budgetDecision
        };
      } catch {
        lastFailure = {
          ok: false,
          errorKind: "parse_error",
          message: "OpenAI output was not valid JSON",
          elapsedMs: Date.now() - started,
          model,
          rawText,
          usageRecord,
          budgetDecision
        };
        if (attemptIndex < maxRetries) {
          await delay(1_000 * 2 ** attemptIndex);
          continue;
        }
        break;
      }
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
      if (shouldRetryOpenAiJsonError(errorKind, attemptIndex, maxRetries)) {
        await delay(1_000 * 2 ** attemptIndex);
        continue;
      }
      return lastFailure;
    }
  }

  return lastFailure ?? {
    ok: false,
    errorKind: "api_error",
    message: "OpenAI JSON provider exhausted retries without a terminal result",
    elapsedMs: Date.now() - started,
    model
  };
}
