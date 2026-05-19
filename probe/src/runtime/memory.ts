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
