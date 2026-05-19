import type {
  DialogueObservation,
  DialoguePersona,
  DialogueTranscriptEntry
} from "./dialogueContext.js";
import type { ToolResult, MutualActorId, Proposal } from "./types.js";
import { selectMutualPair } from "../runtime/actorRoster.js";

export type ProviderInput = {
  actorId?: MutualActorId;
  persona?: DialoguePersona;
  observation?: DialogueObservation | Record<string, unknown>;
  memory?: string[];
  recentTranscript?: DialogueTranscriptEntry[];
  rules?: {
    oneToolPerTurn: true;
      allowedTools: string[];
      noInventedObservations: true;
      preferObserveWorldWhenUncertain: true;
  };
  lastResult?: ToolResult | null;
};

export type MutualProvider = {
  next(input: ProviderInput): Promise<Proposal> | Proposal;
};

function readVisibleTargetId(input: ProviderInput) {
  const observation =
    input.observation && typeof input.observation === "object" && !Array.isArray(input.observation)
      ? input.observation
      : undefined;
  const visibleActors = observation?.visibleActors;

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

function createSequenceProvider(sequence: Proposal[]): MutualProvider {
  let index = 0;

  return {
    next() {
      const proposal = sequence[Math.min(index, sequence.length - 1)];
      index += 1;
      return structuredClone(proposal);
    }
  };
}

function markerEntitySeen(observation: ProviderInput["observation"]) {
  return observation?.markerEntitySeen === true;
}

export function createDeterministicMutualProviders(): Record<MutualActorId, MutualProvider> {
  const [actorA, actorB] = selectMutualPair(["npc_a", "npc_b"]);
  return {
    [actorA]: createDeterministicMutualProvider(actorA),
    [actorB]: createDeterministicMutualProvider(actorB)
  };
}

export function createMutualProviders(actorIds: readonly string[] = ["npc_a", "npc_b"]): Record<MutualActorId, MutualProvider> {
  const [actorA, actorB] = selectMutualPair(actorIds);
  return {
    [actorA]: createSequenceProvider([
      { tool: "observe_world", args: {} },
      { tool: "move_to", args: { target: actorB } },
      { tool: "say", args: { target: actorB, text: `Hi ${actorB}, can you confirm the marker?` } },
      { tool: "wait", args: { ticks: 20, reason: `${actorB} was busy` } },
      { tool: "drop_item", args: { itemName: "paper", count: 1 } },
      { tool: "remember", args: { note: `${actorB} answered after the marker drop` } }
    ]),
    [actorB]: {
      next(input) {
        const lastResult = input.lastResult ?? null;

        if (lastResult === null) {
          return { tool: "reply_to", args: { source: actorA, text: "Busy. Give me a second." } };
        }

        if (lastResult.tool === "reply_to" && lastResult.status === "busy_reply") {
          return { tool: "look_at_actor", args: { target: actorA } };
        }

        if (lastResult.tool === "look_at_actor") {
          return { tool: "observe_world", args: {} };
        }

        if (lastResult.tool === "observe_world" && markerEntitySeen(input.observation)) {
          return { tool: "reply_to", args: { source: actorA, text: "I see the paper. Leave it with me." } };
        }

        return { tool: "reply_to", args: { source: "npc_a", text: "I still do not see the marker." } };
      }
    }
  };
}
