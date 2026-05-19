import type { Proposal } from "../types.js";
import type { ProbeBots } from "../../runtime/createBots.js";
import { createMemory } from "../../runtime/memory.js";
import { moveTo } from "../../tools/moveTo.js";
import { remember } from "../../tools/remember.js";
import { wait } from "../../tools/wait.js";
import { createMutualRuntimeState } from "../runtimeState.js";
import type { JsonObject, MutualActorId, MutualStepRecord } from "../types.js";
import { dropItem } from "./dropItem.js";
import { lookAtActor } from "./lookAtActor.js";
import { observeWorld } from "./observeWorld.js";
import { replyTo } from "./replyTo.js";

const mutualAllowedTools = [
  "observe_world",
  "move_to",
  "say",
  "wait",
  "reply_to",
  "look_at_actor",
  "drop_item",
  "remember"
] as const;

export function validateMutualProposal(proposal: Proposal): Proposal {
  if (!mutualAllowedTools.includes(proposal.tool as (typeof mutualAllowedTools)[number])) {
    throw new Error(`Unsupported mutual tool: ${proposal.tool}`);
  }

  return {
    tool: proposal.tool,
    args: proposal.args ?? {}
  };
}

type CreateMutualToolsArgs = {
  runtimeState: ReturnType<typeof createMutualRuntimeState>;
  memories: Record<MutualActorId, ReturnType<typeof createMemory>>;
};

type ObserveWorldToolArgs = {
  actorId: MutualActorId;
  actor: ProbeBots[MutualActorId];
  targetId: MutualActorId;
  target: ProbeBots[MutualActorId];
};

type ExecuteMutualToolArgs = ObserveWorldToolArgs & {
  proposal: Proposal;
  observation: JsonObject;
};

async function executeMutualTool({
  actorId,
  actor,
  targetId,
  target,
  proposal,
  observation,
  runtimeState,
  memories
}: ExecuteMutualToolArgs & CreateMutualToolsArgs): Promise<MutualStepRecord> {
  switch (proposal.tool) {
    case "observe_world":
      return {
        category: "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: "observed" }
      };
    case "move_to": {
      const result = await moveTo({ actor, target, targetId });
      return {
        category: "spatialAttentionApproach",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "say": {
      const text = String(proposal.args?.text ?? "");
      actor.chat(text);
      runtimeState.recordHeardMessage(targetId, {
        from: actorId,
        text
      });
      return {
        category: "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: "said" },
        targetObservation: observation,
        causedNext: { actor: targetId, tool: "reply_to" }
      };
    }
    case "wait": {
      const result = await wait({
        ticks: typeof proposal.args?.ticks === "number" ? proposal.args.ticks : 20
      });
      return {
        category: "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "reply_to": {
      const result = await replyTo({
        actor,
        source: target,
        runtimeState,
        text: String(proposal.args?.text ?? "")
      });
      return {
        category: observation.markerEntitySeen === true
          ? "materialEnvironmentHandoff"
          : "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        targetObservation: observation,
        targetResponse: {
          actor: actorId,
          tool: proposal.tool,
          result: result.status
        },
        causedNext: { actor: actorId, tool: proposal.tool }
      };
    }
    case "look_at_actor": {
      const result = await lookAtActor({ actor, target });
      return {
        category: "spatialAttentionApproach",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "drop_item": {
      const result = await dropItem({
        actor,
        runtimeState,
        itemName: String(proposal.args?.itemName ?? "paper"),
        count: typeof proposal.args?.count === "number" ? proposal.args.count : 1
      });
      return {
        category: "materialEnvironmentHandoff",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "remember": {
      const note = String(proposal.args?.note ?? "");
      const result = remember({
        memory: memories[actorId],
        note
      });
      return {
        category: runtimeState.hasDroppedMarker()
          ? "materialEnvironmentHandoff"
          : "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        memoryNote: {
          actor: actorId,
          note
        }
      };
    }
    default:
      throw new Error(`Unsupported mutual tool: ${proposal.tool}`);
  }
}

export function createMutualTools({ runtimeState, memories }: CreateMutualToolsArgs) {
  return {
    lastResult(actorId: MutualActorId) {
      return runtimeState.lastResult(actorId);
    },
    validateProposal: validateMutualProposal,
    observe_world({ actor, target }: ObserveWorldToolArgs) {
      return observeWorld({
        actor,
        target,
        runtimeState,
        memory: memories[actor.username as MutualActorId]
      });
    },
    async execute(input: ExecuteMutualToolArgs) {
      const step = await executeMutualTool({
        ...input,
        runtimeState,
        memories
      });
      runtimeState.recordLastResult(input.actorId, {
        tool: input.proposal.tool,
        status: step.targetResponse?.result ?? step.actorAction.result
      });
      return step;
    }
  };
}
