import { GoogleGenAI } from "@google/genai";

import { classifyGeminiError, GeminiPlannerError } from "./errors.js";
import type { GeminiPlannerConfig } from "./config.js";
import {
  appendProviderUsageRecord,
  buildEstimatedUsage,
  guardProviderUsageRequest,
  normalizeGeminiUsage,
  ProviderUsageBudgetError,
  type ProviderUsageCallContext,
  type ProviderUsageRecord
} from "../providerUsageTracker.js";
import { parseOpenAiJsonText } from "../openaiApiJsonProvider.js";

export type GeminiTextCallResult = {
  path: "text-genai";
  model: string;
  text: string;
  usedFallbackModel: boolean;
  usageRecord?: ProviderUsageRecord;
  rawStructuredText?: string;
};

type GeminiGeneratedSourceEnvelope = {
  source: string;
  notes?: string;
};

const generatedSourceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    source: {
      type: "string",
      description: "Complete TypeScript source. Must include export async function run(ctx)."
    },
    notes: {
      type: "string",
      description: "Brief non-authoritative generation note."
    }
  },
  required: ["source"]
} as const;

function parseGeneratedSourceEnvelope(rawText: string): GeminiGeneratedSourceEnvelope {
  const parsed = parseOpenAiJsonText<Partial<GeminiGeneratedSourceEnvelope>>(rawText);
  if (typeof parsed.source !== "string" || parsed.source.trim().length === 0) {
    throw new GeminiPlannerError({
      kind: "parse",
      message: "Gemini structured planner response did not include non-empty source"
    });
  }
  return {
    source: parsed.source,
    ...(typeof parsed.notes === "string" ? { notes: parsed.notes } : {})
  };
}

export async function callGeminiTextGenai(input: {
  apiKey: string;
  config: GeminiPlannerConfig;
  prompt: string;
  usageContext?: ProviderUsageCallContext;
}): Promise<GeminiTextCallResult> {
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  const models = [input.config.textModel, input.config.textFallbackModel].filter(
    (model, index, list) => list.indexOf(model) === index
  );

  let lastError: GeminiPlannerError | undefined;

  for (const [index, model] of models.entries()) {
    const started = Date.now();
    const estimatedUsage = buildEstimatedUsage({
      inputText: input.prompt,
      maxOutputTokens: 0
    });
    let budgetDecision;
    try {
      budgetDecision = await guardProviderUsageRequest({
        providerId: "gemini-api",
        model,
        estimatedUsage,
        context: input.usageContext
      });
      const response = await client.models.generateContent({
        model,
        contents: input.prompt,
        config: {
          systemInstruction:
            "Return only JSON matching the provided schema. Put the complete generated TypeScript program in the source field. Do not wrap the source in Markdown fences.",
          responseMimeType: "application/json",
          responseJsonSchema: generatedSourceSchema,
          httpOptions: {
            timeout: input.config.textRequestTimeoutMs
          }
        }
      });
      const text = response.text?.trim() ?? "";
      if (!text) {
        throw new GeminiPlannerError({
          kind: "parse",
          message: "Gemini text response was empty"
        });
      }
      const envelope = parseGeneratedSourceEnvelope(text);
      const normalizedUsage = normalizeGeminiUsage(response.usageMetadata, estimatedUsage);
      const usageRecord = await appendProviderUsageRecord({
        providerId: "gemini-api",
        model,
        status: "succeeded",
        usage: normalizedUsage.usage,
        usageSource: normalizedUsage.source,
        context: input.usageContext,
        elapsedMs: Date.now() - started,
        rawUsage: normalizedUsage.rawUsage,
        budgetDecision
      });

      return {
        path: "text-genai",
        model,
        text: envelope.source.trim(),
        usedFallbackModel: index > 0,
        usageRecord,
        rawStructuredText: text
      };
    } catch (error) {
      if (error instanceof ProviderUsageBudgetError) {
        throw new GeminiPlannerError({
          kind: "quota_exceeded",
          message: error.message,
          retryable: false,
          cause: error
        });
      }
      lastError = classifyGeminiError(error);
      if (!lastError.retryable || index === models.length - 1) {
        await appendProviderUsageRecord({
          providerId: "gemini-api",
          model,
          status: "failed",
          usage: estimatedUsage,
          usageSource: "estimated",
          context: input.usageContext,
          elapsedMs: Date.now() - started,
          budgetDecision
        });
        throw lastError;
      }
    }
  }

  throw lastError ?? new GeminiPlannerError({ kind: "unknown", message: "Gemini text call failed" });
}
