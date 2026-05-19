import { parseProviderAction } from "./providerSchema.js";
import type { MutualProvider, ProviderInput } from "./provider.js";

const RESPONSES_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MAX_RETRIES = 0;

type ResponsesApiPayload = {
  output_text?: unknown;
};

type CreateOpenAICodexProviderArgs = {
  accessToken: string;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
};

function createPrompt(input: ProviderInput) {
  return [
    "Return exactly one JSON object with keys tool, args, and optional why.",
    "Choose exactly one allowed tool and keep args short.",
    "Do not wrap the JSON in markdown fences.",
    JSON.stringify(input)
  ].join("\n");
}

function isMalformedJsonError(error: unknown) {
  return error instanceof SyntaxError;
}

async function requestResponse(
  fetchImpl: typeof fetch,
  accessToken: string,
  input: ProviderInput
): Promise<ResponsesApiPayload> {
  const response = await fetchImpl(RESPONSES_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      reasoning: {
        effort: "low"
      },
      text: {
        format: {
          type: "json_object"
        }
      },
      input: createPrompt(input)
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI Codex provider request failed with status ${response.status}`);
  }

  return (await response.json()) as ResponsesApiPayload;
}

function parseOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text !== "string") {
    throw new Error("OpenAI Codex provider response must include string output_text");
  }

  return JSON.parse(payload.output_text);
}

export function createOpenAICodexProvider({
  accessToken,
  fetchImpl = fetch,
  maxRetries = DEFAULT_MAX_RETRIES
}: CreateOpenAICodexProviderArgs): MutualProvider {
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("OpenAI Codex provider accessToken must be a non-empty string");
  }

  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new Error("OpenAI Codex provider maxRetries must be a non-negative integer");
  }

  return {
    async next(input: ProviderInput) {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const payload = await requestResponse(fetchImpl, accessToken, input);

        try {
          return parseProviderAction(parseOutputText(payload));
        } catch (error) {
          if (attempt < maxRetries && isMalformedJsonError(error)) {
            continue;
          }

          throw error;
        }
      }

      throw new Error("OpenAI Codex provider exhausted retries");
    }
  };
}
