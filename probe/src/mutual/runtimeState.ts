import type { LastResult, MutualActorId } from "./types.js";

type MutualRuntimeStateOptions = {
  busyRepliesBeforeAvailable: number;
  markerItemName: string;
};

export type HeardMessage = {
  from: string;
  text: string;
  targetId?: string;
};

export type UtteranceEntry = {
  actorId: string;
  text: string;
  targetId?: string;
};

type ReplyResult =
  | { status: "busy"; reason: string }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

const MAX_HEARD_MESSAGES = 4;
const MAX_UTTERANCES = 6;

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createMutualRuntimeState({
  busyRepliesBeforeAvailable,
  markerItemName
}: MutualRuntimeStateOptions) {
  let remainingBusyReplies = busyRepliesBeforeAvailable;
  let markerDropped = false;
  const heardMessages = new Map<string, HeardMessage[]>();
  const utterances: UtteranceEntry[] = [];
  const lastResults: Record<MutualActorId, LastResult | null> = {
    npc_a: null,
    npc_b: null
  };

  return {
    requestTalk(actorId: string, targetId: string) {
      if (actorId === targetId) {
        return {
          status: "available" as const
        };
      }

      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;

        return {
          status: "busy" as const,
          reason: `${targetId} is busy`
        };
      }

      return {
        status: "available" as const
      };
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
    recordHeardMessage(actorId: string, entry: HeardMessage) {
      const queue = heardMessages.get(actorId) ?? [];
      queue.push(snapshot(entry));

      if (queue.length > MAX_HEARD_MESSAGES) {
        queue.splice(0, queue.length - MAX_HEARD_MESSAGES);
      }

      heardMessages.set(actorId, queue);
    },
    consumeHeardMessages(actorId: string) {
      const queue = heardMessages.get(actorId) ?? [];
      heardMessages.delete(actorId);
      return snapshot(queue);
    },
    recordUtterance(entry: UtteranceEntry) {
      utterances.push(snapshot(entry));

      if (utterances.length > MAX_UTTERANCES) {
        utterances.splice(0, utterances.length - MAX_UTTERANCES);
      }
    },
    recentUtterances() {
      return snapshot(utterances);
    },
    markDroppedItem(actor: string, itemName: string) {
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
      lastResults[actorId] = snapshot(result);
    }
  };
}

export type MutualRuntimeState = ReturnType<typeof createMutualRuntimeState>;
