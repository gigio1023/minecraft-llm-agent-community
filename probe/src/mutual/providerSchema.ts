const allowedMutualTools = [
  "converse",
  "observe_world",
  "move_to",
  "wait",
  "remember",
  "drop_item"
] as const;

type ProviderAction = {
  tool: (typeof allowedMutualTools)[number];
  args: Record<string, unknown>;
  why?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses live-provider output into the narrow mutual tool schema.
 *
 * This function is the first guardrail after model text: unsupported tools or
 * malformed metadata fail before any Mineflayer side effect can run.
 */
export function parseProviderAction(input: unknown): ProviderAction {
  if (!isRecord(input)) {
    throw new Error("Provider action must be an object");
  }

  const { tool, why } = input;

  if (typeof tool !== "string") {
    throw new Error("Provider action tool must be a string");
  }

  if (!allowedMutualTools.includes(tool as ProviderAction["tool"])) {
    throw new Error(`Unsupported mutual tool: ${tool}`);
  }

  const args = isRecord(input.args) ? input.args : {};

  if (why !== undefined && typeof why !== "string") {
    throw new Error("Provider action why must be a string");
  }

  return {
    tool: tool as ProviderAction["tool"],
    args,
    ...(why ? { why } : {})
  };
}
