/**
 * Small in-loop memory store used by deterministic probes.
 *
 * It preserves only a recent tail so memory cannot become an unbounded hidden
 * dependency or replace transcript evidence.
 */
export function createMemory(limit = 8) {
  const notes: string[] = [];

  return {
    add(note: string) {
      notes.push(note);

      if (notes.length > limit) {
        notes.splice(0, notes.length - limit);
      }
    },
    list() {
      return [...notes];
    }
  };
}
