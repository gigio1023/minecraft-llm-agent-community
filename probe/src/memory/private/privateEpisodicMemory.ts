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
