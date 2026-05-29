/**
 * Records bounded hostile context as reviewable state.
 *
 * The ledger is deliberately append-only for now; callers read copies so later
 * hostile decisions cannot rewrite earlier tension evidence.
 */
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
