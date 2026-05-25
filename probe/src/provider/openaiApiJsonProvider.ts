import OpenAI from "openai";

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
  maxCompletionTokens?: number;
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

function classifyOpenAiError(error: unknown): OpenAiErrorKind {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return "model_not_found";
  }
  if (lower.includes("rate limit")) {
    return "rate_limit";
  }
  if (lower.includes("quota") || lower.includes("insufficient")) {
    return "quota";
  }
  if (lower.includes("billing")) {
    return "billing";
  }
  return "api_error";
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

/**
 * Calls OpenAI Chat Completions with JSON schema response format.
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
  const maxCompletionTokens = input.config.maxCompletionTokens ?? 1600;
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${input.system}\n${input.user}`,
    maxOutputTokens: maxCompletionTokens
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

  const client = new OpenAI({ apiKey: input.config.apiKey });

  try {
    const response = await client.chat.completions.create({
      model,
      max_completion_tokens: maxCompletionTokens,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: input.schemaName,
          // Strict mode requires every object property in `required`; social
          // ActionIntent args vary by primitive and are validated after parse.
          strict: false,
          schema: input.schema
        }
      }
    });
    const normalizedUsage = normalizeOpenAiUsage(response.usage, estimatedUsage);
    const usageRecord = await appendProviderUsageRecord({
      providerId: "openai-api",
      model,
      status: "succeeded",
      usage: normalizedUsage.usage,
      usageSource: normalizedUsage.source,
      context: usageContext,
      elapsedMs: Date.now() - started,
      rawUsage: normalizedUsage.rawUsage,
      budgetDecision
    });

    const rawText = response.choices[0]?.message?.content ?? "";
    if (!rawText.trim()) {
      return {
        ok: false,
        errorKind: "empty_output",
        message: "OpenAI returned empty completion content",
        elapsedMs: Date.now() - started,
        model,
        rawText,
        usageRecord,
        budgetDecision
      };
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
      return {
        ok: false,
        errorKind: "parse_error",
        message: "OpenAI output was not valid JSON",
        elapsedMs: Date.now() - started,
        model,
        rawText,
        usageRecord,
        budgetDecision
      };
    }
  } catch (error) {
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
    return {
      ok: false,
      errorKind: classifyOpenAiError(error),
      message: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
      model,
      usageRecord,
      budgetDecision
    };
  }
}
