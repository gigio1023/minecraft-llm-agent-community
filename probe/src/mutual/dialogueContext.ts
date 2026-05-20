export type DialogueJsonValue =
  | string
  | number
  | boolean
  | null
  | DialogueJsonValue[]
  | { [key: string]: DialogueJsonValue };

export type DialogueJsonObject = { [key: string]: DialogueJsonValue };

export type MutualActorId = string;

// Personas shape utterance style only; observations and validated tools remain
// the source of truth for whether social/world progress happened.
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
} as const satisfies Record<
  string,
  {
    name: string;
    role: string;
    style: string;
    objective: string;
  }
>;

export type DialoguePersona = {
  name: string;
  role: string;
  style: string;
  objective: string;
};
export type DialogueObservation = DialogueJsonObject;
export type DialogueTranscriptEntry = DialogueJsonObject;

const fallbackRoles = ["quartermaster", "gatherer", "crafter", "runner"] as const;
const fallbackNames = ["Mara", "Jun", "Iris", "Noah"] as const;

/**
 * Resolves known actor personas and deterministic fallbacks for extra bots.
 *
 * Fallbacks keep smoke runs stable when the actor roster changes without making
 * persona richness a Phase 1 delivery target.
 */
export function getDialoguePersona(actorId: string, index = 0): DialoguePersona {
  const knownPersona = mutualPersonas[actorId as keyof typeof mutualPersonas];

  if (knownPersona) {
    return knownPersona;
  }

  return {
    name: fallbackNames[index] ?? `NPC ${index + 1}`,
    role: fallbackRoles[index] ?? "gatherer",
    style: index % 2 === 0 ? "brief and practical" : "responsive and concise",
    objective: `coordinate the next validated tool step for ${actorId}`
  };
}

export function buildDialoguePersonas(actorIds: readonly string[]) {
  return Object.fromEntries(
    actorIds.map((actorId, index) => [actorId, getDialoguePersona(actorId, index)])
  ) as Record<string, DialoguePersona>;
}

export type DialogueContextInput = {
  actorId: MutualActorId;
  allowedTools: string[];
  persona: DialoguePersona;
  observation: DialogueObservation;
  memory: string[];
  recentTranscript: DialogueTranscriptEntry[];
  actorProviderContext?: DialogueJsonObject;
};

export type DialogueContextOutput = Omit<DialogueContextInput, "allowedTools"> & {
  rules: {
    oneToolPerTurn: true;
    allowedTools: string[];
    noInventedObservations: true;
    preferObserveWorldWhenUncertain: true;
  };
};

/**
 * Builds the provider-facing dialogue packet.
 *
 * The context is cloned so provider code cannot mutate runtime observations,
 * memory, or transcript tails after they have been recorded.
 */
export function buildDialogueContext(input: DialogueContextInput): DialogueContextOutput {
  return structuredClone({
    actorId: input.actorId,
    persona: input.persona,
    observation: input.observation,
    memory: input.memory,
    recentTranscript: input.recentTranscript,
    ...(input.actorProviderContext
      ? { actorProviderContext: input.actorProviderContext }
      : {}),
    rules: {
      oneToolPerTurn: true,
      allowedTools: input.allowedTools,
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  });
}
