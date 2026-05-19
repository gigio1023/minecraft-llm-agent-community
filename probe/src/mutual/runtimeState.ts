import type { LastResult, MutualActorId } from "./types.js";

type HeardMessage = {
  from: MutualActorId;
  text: string;
};

type MutualRuntimeStateOptions = {
  busyRepliesBeforeAvailable: number;
  markerItemName: string;
};

type ReplyResult =
  | { status: "busy"; reason: string }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

export function createMutualRuntimeState({
  busyRepliesBeforeAvailable,
  markerItemName
}: MutualRuntimeStateOptions) {
  let remainingBusyReplies = busyRepliesBeforeAvailable;
  let markerDropped = false;
  const heard: Record<MutualActorId, HeardMessage[]> = {
    npc_a: [],
    npc_b: []
  };
  const lastResults: Record<MutualActorId, LastResult | null> = {
    npc_a: null,
    npc_b: null
  };

  return {
    recordHeardMessage(target: MutualActorId, message: HeardMessage) {
      heard[target].push(message);
    },
    consumeHeardMessages(target: MutualActorId) {
      const messages = [...heard[target]];
      heard[target] = [];
      return messages;
    },
    requestReply(actor: MutualActorId, target: MutualActorId): ReplyResult {
      if (actor !== "npc_b" || target !== "npc_a") {
        return {
          status: "unavailable",
          reason: `${target} is unavailable`
        };
      }

      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;
        return {
          status: "busy",
          reason: "npc_b is busy"
        };
      }

      return {
        status: "available"
      };
    },
    markDroppedItem(actor: MutualActorId, itemName: string) {
      markerDropped = actor === "npc_a" && itemName === markerItemName;
    },
    hasDroppedMarker() {
      return markerDropped;
    },
    markerItemName() {
      return markerItemName;
    },
    lastResult(actorId: MutualActorId) {
      return lastResults[actorId];
    },
    recordLastResult(actorId: MutualActorId, result: LastResult) {
      lastResults[actorId] = result;
    }
  };
}
