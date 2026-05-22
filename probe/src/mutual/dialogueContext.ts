import { canonicalActorProfiles, getActorProfile } from "../npc/profiles.js";

export type DialogueJsonValue =
  | string
  | number
  | boolean
  | null
  | DialogueJsonValue[]
  | { [key: string]: DialogueJsonValue };

export type DialogueJsonObject = { [key: string]: DialogueJsonValue };

export type MutualActorId = string;

function toDialoguePersona(profile: ReturnType<typeof getActorProfile>): DialoguePersona {
  return {
    name: profile.display_name,
    role: profile.gameplay_role,
    style: profile.speech_style,
    objective: profile.public_responsibility
  };
}

// Personas shape utterance style only; observations and validated tools remain
// the source of truth for whether social/world progress happened.
export const mutualPersonas = Object.fromEntries(
  Object.entries(canonicalActorProfiles).map(([actorId, profile]) => [
    actorId,
    toDialoguePersona(profile)
  ])
) as Record<keyof typeof canonicalActorProfiles, DialoguePersona>;

export type DialoguePersona = {
  name: string;
  role: string;
  style: string;
  objective: string;
};
export type DialogueObservation = DialogueJsonObject;
export type DialogueTranscriptEntry = DialogueJsonObject;

/**
 * Resolves known actor personas and deterministic fallbacks for extra bots.
 *
 * Fallbacks keep smoke runs stable when the actor roster changes without making
 * persona richness a Phase 1 delivery target.
 */
export function getDialoguePersona(actorId: string, index = 0): DialoguePersona {
  return toDialoguePersona(getActorProfile(actorId, index));
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
