import { GoogleGenAI } from "@google/genai";

import { parseOpenAiJsonText } from "./openaiApiJsonProvider.js";
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

export type GeminiJsonProviderConfig = {
  apiKey: string;
  model: string;
  maxOutputTokens?: number;
  requestTimeoutMs?: number;
  repoRoot?: string;
  usageLedgerPath?: string;
};

export type GeminiJsonCallResult<T> =
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
        | "quota"
        | "rate_limit"
        | "timeout"
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

function classifyGeminiJsonError(error: unknown): Extract<GeminiJsonCallResult<unknown>, { ok: false }>["errorKind"] {
  const message = error instanceof Error ? error.message : String(error);
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined;
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("rate limit")) {
    return "rate_limit";
  }
  if (lower.includes("quota") || lower.includes("resource exhausted")) {
    return "quota";
  }
  if (lower.includes("timeout") || lower.includes("deadline")) {
    return "timeout";
  }
  return "api_error";
}

/**
 * Calls Gemini API for JSON-schema output and records provider usage.
 *
 * @remarks This is the social-cycle provider path for Gemma/Gemini. It does
 * not use Gemini Native Audio Dialog and never reads or logs raw API keys.
 */
export async function callGeminiJsonSchema<T>(input: {
  config: GeminiJsonProviderConfig;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  usageContext?: ProviderUsageCallContext;
}): Promise<GeminiJsonCallResult<T>> {
  const started = Date.now();
  const model = input.config.model;
  const maxOutputTokens = input.config.maxOutputTokens ?? 1600;
  const usageContext = {
    repoRoot: input.config.repoRoot,
    ledgerPath: input.config.usageLedgerPath,
    ...input.usageContext
  };
  const estimatedUsage = buildEstimatedUsage({
    inputText: `${input.system}\n${input.user}`,
    maxOutputTokens
  });

  if (!input.config.apiKey.trim()) {
    return {
      ok: false,
      errorKind: "missing_api_key",
      message: "GEMINI_API_KEY is missing. Add it to the repo-local .env file.",
      elapsedMs: Date.now() - started,
      model
    };
  }

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

  const client = new GoogleGenAI({ apiKey: input.config.apiKey });

  try {
    const response = await client.models.generateContent({
      model,
      contents: input.user,
      config: {
        systemInstruction: input.system,
        maxOutputTokens,
        responseMimeType: "application/json",
        responseJsonSchema: input.schema,
        httpOptions: {
          timeout: input.config.requestTimeoutMs ?? 900_000
        }
      }
    });
    const normalizedUsage = normalizeGeminiUsage(response.usageMetadata, estimatedUsage);
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
    const rawText = response.text?.trim() ?? "";
    if (!rawText) {
      return {
        ok: false,
        errorKind: "empty_output",
        message: "Gemini returned empty completion content",
        elapsedMs: Date.now() - started,
        model,
        rawText,
        usageRecord,
        budgetDecision
      };
    }

    try {
      return {
        ok: true,
        parsed: parseOpenAiJsonText<T>(rawText),
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
        message: "Gemini output was not valid JSON",
        elapsedMs: Date.now() - started,
        model,
        rawText,
        usageRecord,
        budgetDecision
      };
    }
  } catch (error) {
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
    return {
      ok: false,
      errorKind: classifyGeminiJsonError(error),
      message: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
      model,
      usageRecord,
      budgetDecision
    };
  }
}
