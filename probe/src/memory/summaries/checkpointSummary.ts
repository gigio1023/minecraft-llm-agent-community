import type { LifecycleMode, IntentRecord, ContextSignalRecord } from "../../runtime/contextIntent.js";

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

/**
 * Builds the compact actor state saved at checkpoint boundaries.
 *
 * The summary is JSON-safe by construction because it may be written to
 * transcript artifacts and later injected into provider context.
 */
export type CheckpointAgentSummary = {
  agentId: string;
  roleId: string;
  lifecycleMode: LifecycleMode;
  currentTask: string | null;
  currentIntent: IntentRecord | null;
  topContextSignals: ContextSignalRecord[];
  workingMemory: Record<string, unknown>;
  privateMemorySummary: string[];
};

export function buildCheckpointSummary(input: {
  agentId: string;
  roleId: string;
  lifecycleMode: LifecycleMode;
  currentTask: string | null;
  currentIntent: IntentRecord | null;
  topContextSignals: ContextSignalRecord[];
  workingMemory: Record<string, unknown>;
  privateMemorySummary: string[];
  sharedSettlement: Record<string, unknown>;
}) {
  // Keep only the strongest context signals so checkpoint context stays small and
  // does not crowd out recent raw transcript evidence.
  return {
    agentId: input.agentId,
    roleId: input.roleId,
    lifecycleMode: input.lifecycleMode,
    currentTask: input.currentTask,
    currentIntent: input.currentIntent ? toJsonValue(input.currentIntent) : null,
    topContextSignals: toJsonValue(input.topContextSignals.slice(0, 3)),
    workingMemory: toJsonValue(input.workingMemory),
    privateMemorySummary: [...input.privateMemorySummary],
    sharedSettlement: toJsonValue(input.sharedSettlement)
  };
}
