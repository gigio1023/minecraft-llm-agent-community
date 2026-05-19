type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

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
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  throw new Error(`Checkpoint summary values must be JSON-safe, received ${typeof value}`);
}

export function buildCheckpointSummary(input: {
  agentId: string;
  roleId: string;
  currentTask: string | null;
  workingMemory: Record<string, unknown>;
  sharedSettlement: Record<string, unknown>;
}) {
  return {
    agentId: input.agentId,
    roleId: input.roleId,
    currentTask: input.currentTask,
    workingMemory: toJsonValue(input.workingMemory),
    sharedSettlement: toJsonValue(input.sharedSettlement)
  };
}
