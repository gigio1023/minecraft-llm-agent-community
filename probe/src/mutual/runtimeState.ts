type MutualRuntimeStateOptions = {
  busyRepliesBeforeAvailable: number;
  markerItemName: string;
};

export type HeardMessage = {
  from: string;
  text: string;
  targetId: string;
};

export type UtteranceEntry = {
  actorId: string;
  text: string;
  targetId?: string;
};

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
  const heardMessages = new Map<string, HeardMessage[]>();
  const utterances: UtteranceEntry[] = [];

  return {
    markerItemName,
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
    }
  };
}
