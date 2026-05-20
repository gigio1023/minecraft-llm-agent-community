export type MailItem = {
  id: string;
  from: string;
  to: string;
  turnSent: number;
  kind: "social" | "warning" | "task_handoff";
  payload: Record<string, unknown>;
};

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createTurnPhasedMailbox() {
  const currentTurn = new Map<string, MailItem[]>();
  const nextTurn = new Map<string, MailItem[]>();

  return {
    beginTurn(actorId: string) {
      currentTurn.set(actorId, (nextTurn.get(actorId) ?? []).map((item) => snapshot(item)));
      nextTurn.set(actorId, []);
    },
    enqueue(item: MailItem) {
      const queue = nextTurn.get(item.to) ?? [];
      queue.push(snapshot(item));
      if (queue.length > 10) {
        queue.splice(0, queue.length - 10);
      }
      nextTurn.set(item.to, queue);
    },
    visible(actorId: string) {
      return (currentTurn.get(actorId) ?? []).map((item) => snapshot(item));
    },
    consume(actorId: string) {
      const items = (currentTurn.get(actorId) ?? []).map((item) => snapshot(item));
      currentTurn.set(actorId, []);
      return items;
    }
  };
}
