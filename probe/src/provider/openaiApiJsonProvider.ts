import OpenAI from "openai";

export type OpenAiJsonProviderConfig = {
  apiKey: string;
  model: string;
  reasoning?: string;
  maxCompletionTokens?: number;
};

export type OpenAiJsonCallResult<T> =
  | {
      ok: true;
      parsed: T;
      rawText: string;
      elapsedMs: number;
      model: string;
    }
  | {
      ok: false;
      errorKind:
        | "missing_api_key"
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
}): Promise<OpenAiJsonCallResult<T>> {
  const started = Date.now();
  const model = input.config.model;

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

  try {
    const response = await client.chat.completions.create({
      model,
      max_completion_tokens: input.config.maxCompletionTokens ?? 1600,
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

    const rawText = response.choices[0]?.message?.content ?? "";
    if (!rawText.trim()) {
      return {
        ok: false,
        errorKind: "empty_output",
        message: "OpenAI returned empty completion content",
        elapsedMs: Date.now() - started,
        model,
        rawText
      };
    }

    try {
      const parsed = JSON.parse(rawText) as T;
      return {
        ok: true,
        parsed,
        rawText,
        elapsedMs: Date.now() - started,
        model
      };
    } catch {
      return {
        ok: false,
        errorKind: "parse_error",
        message: "OpenAI output was not valid JSON",
        elapsedMs: Date.now() - started,
        model,
        rawText
      };
    }
  } catch (error) {
    return {
      ok: false,
      errorKind: classifyOpenAiError(error),
      message: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
      model
    };
  }
}
