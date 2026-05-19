export function createTensionLedger() {
  const entries: Array<{ actorId: string; note: string; value: number }> = [];

  return {
    record(actorId: string, note: string, value: number) {
      entries.push({ actorId, note, value });
    },
    list() {
      return entries.map((entry) => ({ ...entry }));
    }
  };
}
