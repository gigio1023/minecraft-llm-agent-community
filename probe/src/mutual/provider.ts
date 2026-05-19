import type {
  DialogueObservation,
  DialoguePersona,
  DialogueTranscriptEntry,
  MutualActorId
} from "./dialogueContext.js";
import type { Proposal } from "./types.js";

export type ProviderInput = {
  actorId: MutualActorId;
  persona: DialoguePersona;
  observation: DialogueObservation;
  memory: string[];
  recentTranscript: DialogueTranscriptEntry[];
  rules: {
    oneToolPerTurn: true;
    allowedTools: string[];
    noInventedObservations: true;
    preferObserveWorldWhenUncertain: true;
  };
};

export type MutualProvider = {
  next(input: ProviderInput): Promise<Proposal> | Proposal;
};

function readVisibleTargetId(input: ProviderInput) {
  const visibleActors = input.observation.visibleActors;

  if (!Array.isArray(visibleActors)) {
    return undefined;
  }

  for (const actor of visibleActors) {
    if (
      typeof actor === "object" &&
      actor !== null &&
      !Array.isArray(actor) &&
      typeof (actor as Record<string, unknown>).id === "string" &&
      (actor as Record<string, unknown>).id !== input.actorId
    ) {
      return (actor as Record<string, string>).id;
    }
  }

  return undefined;
}

function createDeterministicMutualProvider(actorId: MutualActorId): MutualProvider {
  return {
    next(input) {
      const targetId = readVisibleTargetId(input);

      if (!targetId) {
        return {
          tool: "wait",
          args: {
            ticks: 1,
            reason: `${actorId} has no visible target`
          }
        };
      }

      return {
        tool: "converse",
        args: {
          target: targetId,
          utterance:
            actorId === "npc_a"
              ? "Jun, check the marker."
              : "Mara, I can check the marker."
        }
      };
    }
  };
}

export function createDeterministicMutualProviders(): Record<MutualActorId, MutualProvider> {
  return {
    npc_a: createDeterministicMutualProvider("npc_a"),
    npc_b: createDeterministicMutualProvider("npc_b")
  };
}
