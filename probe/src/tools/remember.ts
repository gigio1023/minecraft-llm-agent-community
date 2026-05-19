import { createMemory } from "../runtime/memory.js";

type MemoryStore = ReturnType<typeof createMemory>;

export type RememberResult = {
  status: "remembered";
  note: string;
};

type RememberArgs = {
  memory: MemoryStore;
  note: string;
};

export function remember({ memory, note }: RememberArgs): RememberResult {
  memory.add(note);

  return {
    status: "remembered",
    note
  };
}
