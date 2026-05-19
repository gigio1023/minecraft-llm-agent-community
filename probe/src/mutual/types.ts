export type MutualActorId = "npc_a" | "npc_b";

export type InteractionCategory =
  | "conversationTurnState"
  | "spatialAttentionApproach"
  | "materialEnvironmentHandoff";

export type CategoryVerdict = "passed" | "failed";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type Proposal = {
  tool: string;
  args?: Record<string, unknown>;
};

export type LastResult = {
  tool: string;
  status: string;
};

export type MutualStepRecord = {
  category: InteractionCategory;
  actorAction: {
    actor: MutualActorId;
    tool: string;
    result: string;
  };
  targetObservation?: JsonObject;
  targetResponse?: {
    actor: MutualActorId;
    tool: string;
    result: string;
  };
  worldStateChange?: JsonObject;
  memoryNote?: {
    actor: MutualActorId;
    note: string;
  };
  causedNext?: {
    actor: MutualActorId;
    tool: string;
  };
};

export type TranscriptFinal = {
  status: "success" | "failed";
  why: string;
};

export type MutualCategories = Record<InteractionCategory, CategoryVerdict>;

export type CreateMutualTranscriptOptions = {
  evidenceDir: string;
  probeId: string;
  personas: Record<MutualActorId, string>;
};
