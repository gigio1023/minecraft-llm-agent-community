import type { ObserveResult } from "../tools/observe.js";

export type DialogueJsonValue =
  | string
  | number
  | boolean
  | null
  | DialogueJsonValue[]
  | { [key: string]: DialogueJsonValue };

export type DialogueActorId = "npc_a" | "npc_b";

export type DialoguePersona = {
  name: DialogueActorId;
  role: string;
  style: string;
  objective: string;
};

export type DialogueObservation = Pick<ObserveResult, "visibleActors"> & {
  lastActionResult?: {
    status: string;
    [key: string]: DialogueJsonValue;
  };
};

export type DialogueTranscriptEntry = {
  actor: DialogueActorId;
  tool: string;
  args: Record<string, DialogueJsonValue>;
};

export type DialogueContextInput = {
  actorId: DialogueActorId;
  allowedTools: string[];
  persona: DialoguePersona;
  observation: DialogueObservation;
  memory: string[];
  recentTranscript: DialogueTranscriptEntry[];
};

export type DialogueContextOutput = Omit<DialogueContextInput, "allowedTools"> & {
  rules: {
    oneToolPerTurn: true;
    allowedTools: string[];
    noInventedObservations: true;
    preferObserveWorldWhenUncertain: true;
  };
};

export function buildDialogueContext(input: DialogueContextInput): DialogueContextOutput {
  return structuredClone({
    actorId: input.actorId,
    persona: input.persona,
    observation: input.observation,
    memory: input.memory,
    recentTranscript: input.recentTranscript,
    rules: {
      oneToolPerTurn: true,
      allowedTools: input.allowedTools,
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  });
}
