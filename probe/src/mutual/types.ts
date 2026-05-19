export type MutualActorId = string;

export type InteractionCategory =
  | "conversationTurnState"
  | "spatialAttentionApproach"
  | "materialEnvironmentHandoff";

export type CategoryVerdict = "passed" | "failed";

export type MutualJsonValue =
  | string
  | number
  | boolean
  | null
  | MutualJsonValue[]
  | { [key: string]: MutualJsonValue };

export type JsonValue = MutualJsonValue;
export type JsonObject = { [key: string]: JsonValue };

export type Proposal = {
  tool: string;
  args?: Record<string, unknown>;
  why?: string;
};

export type ToolResultStatus = "done" | "blocked" | "invalid" | "unavailable" | "transient" | "failed" | string;

export type ToolResult = {
  tool: string;
  ok: boolean;
  status: ToolResultStatus;
  message?: string;
  observation?: unknown;
  durationMs?: number;
  [key: string]: unknown;
};

export type MutualStepRecord = {
  category?: InteractionCategory;
  actor?: string;
  observation?: MutualJsonValue;
  threadState?: JsonObject;
  sharedContext?: JsonObject;
  actorAction: {
    actor?: MutualActorId | string;
    tool: string;
    result?: string;
  };
  result?: MutualJsonValue;
  actorArgs?: Record<string, MutualJsonValue>;
  memoryNote?: {
    actor?: MutualActorId | string;
    note: string;
  };
  providerMeta?: {
    why: string;
  };
  failure?: {
    message: string;
    [key: string]: MutualJsonValue;
  };
  targetObservation?: JsonObject;
  targetResponse?: {
    actor: MutualActorId;
    tool: string;
    result: string;
  };
  worldStateChange?: JsonObject;
  causedNext?: {
    actor: MutualActorId;
    tool: string;
  };
};

export type TranscriptFinal = Record<string, MutualJsonValue> & {
  status: string;
  why: string;
};

export type MutualCategories = Record<InteractionCategory, CategoryVerdict>;

export type CreateMutualTranscriptOptions = {
  evidenceDir: string;
  probeId: string;
  bots?: string[];
  personas?: Record<MutualActorId, string>;
};
