import { allowedTools, type ToolProposal } from "../tools/index.js";
import type { JsonValue } from "./inputSnapshot.js";

const RESPONSES_API_URL = "https://api.openai.com/v1/responses";

type ResponsesApiPayload = {
  output_text?: unknown;
};

export type GameplayProviderInput = {
  observation: unknown;
  lastResult: unknown;
  currentTask?: unknown;
  activeActionSkillContext?: unknown;
  actorProviderContext?: JsonValue;
};

type CreateOpenAICodexGameplayProviderArgs = {
  accessToken: string;
  model: string;
  reasoning: "low" | "medium" | "high";
  fetchImpl?: typeof fetch;
  maxRetries?: number;
};

function createPrompt(input: GameplayProviderInput) {
  return [
    "Return exactly one JSON object with keys tool, args, and optional why.",
    "Choose one tool from the allowed runtime primitives in activeActionSkillContext.",
    "Use actorProviderContext for active action skills, recent evidence, reviews, candidates, and memory.",
    "Do not claim success. The Minecraft runtime verifies success from evidence after the tool runs.",
    "Prefer observe or wait when the evidence is stale or the next safe action is unclear.",
    "Do not wrap the JSON in markdown fences.",
    JSON.stringify(input)
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGameplayProviderAction(input: unknown): ToolProposal {
  if (!isRecord(input)) {
    throw new Error("Gameplay provider action must be an object");
  }

  if (typeof input.tool !== "string") {
    throw new Error("Gameplay provider action tool must be a string");
  }

  if (!allowedTools.includes(input.tool as (typeof allowedTools)[number])) {
    throw new Error(`Unsupported gameplay tool: ${input.tool}`);
  }

  return {
    tool: input.tool,
    args: isRecord(input.args) ? input.args : {}
  };
}

function parseOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text !== "string") {
    throw new Error("OpenAI Codex gameplay provider response must include string output_text");
  }

  return JSON.parse(payload.output_text);
}

function isMalformedJsonError(error: unknown) {
  return error instanceof SyntaxError;
}

async function requestResponse(
  fetchImpl: typeof fetch,
  accessToken: string,
  input: GameplayProviderInput,
  model: string,
  reasoning: "low" | "medium" | "high"
): Promise<ResponsesApiPayload> {
  const response = await fetchImpl(RESPONSES_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      reasoning: {
        effort: reasoning
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
    throw new Error(`OpenAI Codex gameplay provider request failed with status ${response.status}`);
  }

  return (await response.json()) as ResponsesApiPayload;
}

export function createOpenAICodexGameplayProvider({
  accessToken,
  model,
  reasoning,
  fetchImpl = fetch,
  maxRetries = 0
}: CreateOpenAICodexGameplayProviderArgs) {
  if (accessToken.trim().length === 0) {
    throw new Error("OpenAI Codex gameplay provider accessToken must be a non-empty string");
  }

  return {
    async next(input: GameplayProviderInput): Promise<ToolProposal> {
      for (let attempt = 0; ; attempt += 1) {
        const payload = await requestResponse(
          fetchImpl,
          accessToken,
          input,
          model,
          reasoning
        );

        try {
          return parseGameplayProviderAction(parseOutputText(payload));
        } catch (error) {
          if (attempt < maxRetries && isMalformedJsonError(error)) {
            continue;
          }

          throw error;
        }
      }
    }
  };
}
