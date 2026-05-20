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

/**
 * Mailbox with a strict next-turn delivery boundary.
 *
 * Agents cannot react to messages enqueued during their own current turn. That
 * keeps multi-actor transcripts deterministic and prevents ordering artifacts
 * from masquerading as social awareness.
 */
export function createTurnPhasedMailbox() {
  const currentTurn = new Map<string, MailItem[]>();
  const nextTurn = new Map<string, MailItem[]>();

  return {
    beginTurn(actorId: string) {
      // Promote only this actor's queued mail; other actors' next-turn queues
      // stay isolated until their own beginTurn call.
      currentTurn.set(actorId, (nextTurn.get(actorId) ?? []).map((item) => snapshot(item)));
      nextTurn.set(actorId, []);
    },
    enqueue(item: MailItem) {
      const queue = nextTurn.get(item.to) ?? [];
      queue.push(snapshot(item));
      nextTurn.set(item.to, queue);
    },
    visible(actorId: string) {
      // Return snapshots so prompt/projector code cannot mutate mailbox state
      // while formatting context for the provider.
      return (currentTurn.get(actorId) ?? []).map((item) => snapshot(item));
    },
    consume(actorId: string) {
      const items = (currentTurn.get(actorId) ?? []).map((item) => snapshot(item));
      currentTurn.set(actorId, []);
      return items;
    }
  };
}
