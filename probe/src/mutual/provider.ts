import type { LastResult, Proposal } from "./types.js";

type ProviderInput = {
  observation?: Record<string, unknown>;
  lastResult: LastResult | null;
};

type MutualProvider = {
  next(input: ProviderInput): Proposal;
};

function createSequenceProvider(sequence: Proposal[]): MutualProvider {
  let index = 0;

  return {
    next(_input: ProviderInput) {
      const proposal = sequence[Math.min(index, sequence.length - 1)];
      index += 1;
      return structuredClone(proposal);
    }
  };
}

function markerEntitySeen(observation: ProviderInput["observation"]) {
  return observation?.markerEntitySeen === true;
}

export function createMutualProviders(): Record<"npc_a" | "npc_b", MutualProvider> {
  return {
    npc_a: createSequenceProvider([
      { tool: "observe_world", args: {} },
      { tool: "move_to", args: { target: "npc_b" } },
      { tool: "say", args: { target: "npc_b", text: "Jun, can you confirm the marker?" } },
      { tool: "wait", args: { ticks: 20, reason: "npc_b was busy" } },
      { tool: "drop_item", args: { itemName: "paper", count: 1 } },
      { tool: "remember", args: { note: "Jun answered after the marker drop" } }
    ]),
    npc_b: {
      next(input: ProviderInput) {
        if (input.lastResult === null) {
          return { tool: "reply_to", args: { source: "npc_a", text: "Busy. Give me a second." } };
        }

        if (input.lastResult.tool === "reply_to" && input.lastResult.status === "busy_reply") {
          return { tool: "look_at_actor", args: { target: "npc_a" } };
        }

        if (input.lastResult.tool === "look_at_actor") {
          return { tool: "observe_world", args: {} };
        }

        if (input.lastResult.tool === "observe_world" && markerEntitySeen(input.observation)) {
          return { tool: "reply_to", args: { source: "npc_a", text: "I see the paper. Leave it with me." } };
        }

        return { tool: "reply_to", args: { source: "npc_a", text: "I still do not see the marker." } };
      }
    }
  };
}
