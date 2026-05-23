import { allowedTools, type ToolProposal } from "../tools/index.js";
import type { JsonValue } from "./inputSnapshot.js";

const RESPONSES_API_URL = "https://chatgpt.com/backend-api/codex/responses";

type ResponsesApiPayload = {
  id?: unknown;
  output_text?: unknown;
  output?: unknown;
};

export type GameplayProviderInput = {
  observation: unknown;
  lastResult: unknown;
  currentTask?: unknown;
  goalStack?: unknown;
  activeActionSkillContext?: unknown;
  actorProviderContext?: JsonValue;
};

export type GameplayProviderTrace = {
  provider_id: "openai-codex";
  model: string;
  raw_output_text: string;
  parsed_output: JsonValue;
  proposal: JsonValue;
};

export type GameplayProviderProposal = ToolProposal & {
  providerTrace?: GameplayProviderTrace;
};

type CreateOpenAICodexGameplayProviderArgs = {
  accessToken: string;
  model: string;
  reasoning: "low" | "medium" | "high";
  fetchImpl?: typeof fetch;
  maxRetries?: number;
};

function createPrompt(input: GameplayProviderInput) {
  const allowedPrimitives = isRecord(input.activeActionSkillContext) && Array.isArray(input.activeActionSkillContext.allowedPrimitives)
    ? input.activeActionSkillContext.allowedPrimitives
    : [];

  return [
    "Return exactly one JSON object with keys tool, args, and optional why.",
    `Allowed runtime primitive tools for this actor: ${JSON.stringify(allowedPrimitives)}.`,
    "tool must be one of those primitive tool ids, not an action skill id.",
    "Action skill ids such as runtimeObserveAndRemember, collectLogs, or inspectSharedChest are library names, not valid tool values.",
    "Use exact primitive arg shapes:",
    "- observe: {}",
    "- wait: {\"ticks\": 20}",
    "- remember: {\"note\": \"short observed fact\"}",
    "- inspect_chest: {\"chestId\": \"shared-chest-1\"}",
    "- collect_logs: {\"targetCount\": 4}",
    "- mine_block: {\"targetBlock\": \"stone\", \"expectedItem\": \"cobblestone\", \"count\": 1}",
    "- craft_item: {\"itemName\": \"oak_planks\"}",
    "- craft_with_table: {\"itemName\": \"wooden_pickaxe\"}",
    "- deposit_shared: {\"chestId\": \"shared-chest-1\", \"itemName\": \"oak_log\", \"count\": 1}",
    "- say: {\"target\": \"npc_b\", \"text\": \"short message\"}",
    "If currentTask is present, prefer a primitive in currentTask.primitiveIds that can make direct task progress.",
    "Do not keep choosing observe when currentTask has a concrete action primitive such as collect_logs, craft_item, craft_with_table, mine_block, inspect_chest, or deposit_shared.",
    "For currentTask collect_4_logs, choose collect_logs with {\"targetCount\": 4}.",
    "For currentTask craft_planks_and_sticks, choose craft_item with the required itemName.",
    "For currentTask craft_crafting_table, choose craft_item with {\"itemName\": \"crafting_table\"}.",
    "For currentTask craft_wooden_pickaxe, choose craft_with_table with {\"itemName\": \"wooden_pickaxe\"}.",
    "For currentTask mine_cobblestone, choose mine_block with {\"targetBlock\": \"stone\", \"expectedItem\": \"cobblestone\", \"count\": 1}.",
    "Use goalStack and actorProviderContext for profile, relationships, active action skills, recent evidence, reviews, candidates, and memory.",
    "Do not claim success. The Minecraft runtime verifies success from evidence after the tool runs.",
    "Only return observe when there is no currentTask, the task primitive is not allowed, or the lastResult says the concrete action was blocked.",
    "Do not return wait unless you include ticks.",
    "Do not wrap the JSON in markdown fences.",
    JSON.stringify(input)
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  return null;
}

function normalizeWaitArgs(args: Record<string, unknown>) {
  const ticks = args.ticks;
  if (typeof ticks === "number" && Number.isInteger(ticks) && ticks >= 0) {
    return args;
  }

  const durationMs = args.durationMs;
  if (typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0) {
    return {
      ...args,
      ticks: Math.max(1, Math.ceil(durationMs / 50))
    };
  }

  const duration = args.duration;
  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
    return {
      ...args,
      ticks: Math.max(1, Math.ceil(duration * 20))
    };
  }

  return {
    ...args,
    ticks: 20
  };
}

function parseGameplayProviderAction(input: unknown, providerInput: GameplayProviderInput): ToolProposal {
  if (!isRecord(input)) {
    throw new Error("Gameplay provider action must be an object");
  }

  let tool = input.tool;
  if (tool === "runtimeObserveAndRemember") {
    tool = "observe";
  }

  if (typeof tool !== "string") {
    throw new Error("Gameplay provider action tool must be a string");
  }

  if (!allowedTools.includes(tool as (typeof allowedTools)[number])) {
    throw new Error(`Unsupported gameplay tool: ${tool}`);
  }

  const allowedPrimitives = isRecord(providerInput.activeActionSkillContext) &&
    Array.isArray(providerInput.activeActionSkillContext.allowedPrimitives)
    ? providerInput.activeActionSkillContext.allowedPrimitives
    : allowedTools;

  if (!allowedPrimitives.includes(tool)) {
    throw new Error(`Gameplay tool ${tool} is not in this actor's active primitive set`);
  }

  const args = isRecord(input.args) ? input.args : {};

  return {
    tool,
    args: tool === "wait" ? normalizeWaitArgs(args) : args
  };
}

function parseOutputText(payload: ResponsesApiPayload) {
  const outputText = extractOutputText(payload);
  return JSON.parse(outputText);
}

function isMalformedJsonError(error: unknown) {
  return error instanceof SyntaxError;
}

function extractOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload.output)) {
    for (const item of payload.output) {
      if (!isRecord(item) || !Array.isArray(item.content)) {
        continue;
      }

      for (const content of item.content) {
        if (!isRecord(content)) {
          continue;
        }

        if (typeof content.text === "string" && content.text.trim().length > 0) {
          return content.text.trim();
        }
      }
    }
  }

  throw new Error("OpenAI Codex gameplay provider response must include output text");
}

function readNestedString(value: unknown, keys: string[]): string | undefined {
  let cursor = value;
  for (const key of keys) {
    if (!isRecord(cursor)) {
      return undefined;
    }
    cursor = cursor[key];
  }

  return typeof cursor === "string" && cursor.trim().length > 0 ? cursor.trim() : undefined;
}

function parseCodexStreamPayload(payload: string): ResponsesApiPayload {
  let responseId = "";
  let outputText = "";
  let completedResponse: unknown;

  for (const rawLine of payload.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) {
      continue;
    }

    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") {
      continue;
    }

    let event: unknown;
    try {
      event = JSON.parse(data);
    } catch {
      continue;
    }

    if (!isRecord(event)) {
      continue;
    }

    const id = readNestedString(event, ["response", "id"]) ?? readNestedString(event, ["id"]);
    if (id) {
      responseId = id;
    }

    const delta = readNestedString(event, ["delta"]);
    if (delta) {
      outputText += delta;
    }

    if (readNestedString(event, ["type"]) === "response.completed" && event.response) {
      completedResponse = event.response;
    }

    const text = readNestedString(event, ["item", "content", "text"]) ?? readNestedString(event, ["content", "text"]);
    if (!outputText && text) {
      outputText = text;
    }
  }

  if (isRecord(completedResponse)) {
    try {
      return {
        ...completedResponse,
        id: completedResponse.id ?? responseId,
        output_text: extractOutputText(completedResponse)
      };
    } catch {
      // Codex stream completion can omit output text even when deltas carried it.
    }
  }

  if (!outputText.trim()) {
    throw new Error("OpenAI Codex gameplay provider stream response missing output text");
  }

  return {
    id: responseId || `openai-codex-stream-${Date.now()}`,
    output_text: outputText.trim()
  };
}

function parseCodexResponsePayload(payload: string): ResponsesApiPayload {
  const trimmed = payload.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as ResponsesApiPayload;
  }

  return parseCodexStreamPayload(payload);
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
      instructions: "You are a Minecraft gameplay proposal worker. Return only the requested JSON object; the runtime owns all Minecraft execution and verification.",
      reasoning: {
        effort: reasoning
      },
      text: {
        format: {
          type: "json_object"
        }
      },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: createPrompt(input)
            }
          ]
        }
      ],
      stream: true,
      store: false
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const suffix = detail.trim().length > 0 ? `: ${detail.trim().slice(0, 300)}` : "";
    throw new Error(`OpenAI Codex gameplay provider request failed with status ${response.status}${suffix}`);
  }

  return parseCodexResponsePayload(await response.text());
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
    async next(input: GameplayProviderInput): Promise<GameplayProviderProposal> {
      for (let attempt = 0; ; attempt += 1) {
        const payload = await requestResponse(
          fetchImpl,
          accessToken,
          input,
          model,
          reasoning
        );

        try {
          const rawOutputText = typeof payload.output_text === "string"
            ? payload.output_text
            : "";
          const parsedOutput = parseOutputText(payload);
          const proposal = parseGameplayProviderAction(parsedOutput, input);

          return {
            ...proposal,
            providerTrace: {
              provider_id: "openai-codex",
              model,
              raw_output_text: extractOutputText(payload),
              parsed_output: toJsonValue(parsedOutput),
              proposal: toJsonValue(proposal)
            }
          };
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
