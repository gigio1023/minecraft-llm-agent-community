/**
 * Maintains a bounded private memory tail for one actor.
 *
 * This is intentionally append-only and shallow: richer summarization belongs in
 * checkpoint/memory extraction paths, not in the hot gameplay loop.
 */
export function createPrivateEpisodicMemory(limit = 8) {
  const events: string[] = [];

  return {
    add(event: string) {
      events.push(event);

      if (events.length > limit) {
        events.splice(0, events.length - limit);
      }
    },
    list() {
      return [...events];
    }
  };
}
