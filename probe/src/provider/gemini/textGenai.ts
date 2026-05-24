import { GoogleGenAI } from "@google/genai";

import { classifyGeminiError, GeminiPlannerError } from "./errors.js";
import type { GeminiPlannerConfig } from "./config.js";

export type GeminiTextCallResult = {
  path: "text-genai";
  model: string;
  text: string;
  usedFallbackModel: boolean;
};

export async function callGeminiTextGenai(input: {
  apiKey: string;
  config: GeminiPlannerConfig;
  prompt: string;
}): Promise<GeminiTextCallResult> {
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  const models = [input.config.textModel, input.config.textFallbackModel].filter(
    (model, index, list) => list.indexOf(model) === index
  );

  let lastError: GeminiPlannerError | undefined;

  for (const [index, model] of models.entries()) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: input.prompt,
        config: {
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

      return {
        path: "text-genai",
        model,
        text,
        usedFallbackModel: index > 0
      };
    } catch (error) {
      lastError = classifyGeminiError(error);
      if (!lastError.retryable || index === models.length - 1) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new GeminiPlannerError({ kind: "unknown", message: "Gemini text call failed" });
}
