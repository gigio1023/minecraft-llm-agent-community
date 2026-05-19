export type DialogueJsonValue =
  | string
  | number
  | boolean
  | null
  | DialogueJsonValue[]
  | { [key: string]: DialogueJsonValue };

export type DialogueJsonObject = { [key: string]: DialogueJsonValue };

export type MutualActorId = "npc_a" | "npc_b";

export const mutualPersonas = {
  npc_a: {
    name: "Mara",
    role: "quartermaster",
    style: "brief but careful",
    objective: "coordinate the marker handoff"
  },
  npc_b: {
    name: "Jun",
    role: "runner",
    style: "quick and slightly distracted",
    objective: "confirm the marker location"
  }
} satisfies Record<
  MutualActorId,
  {
    name: string;
    role: string;
    style: string;
    objective: string;
  }
>;

export type DialoguePersona = (typeof mutualPersonas)[MutualActorId];
export type DialogueObservation = DialogueJsonObject;
export type DialogueTranscriptEntry = DialogueJsonObject;

export type DialogueContextInput = {
  actorId: MutualActorId;
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
