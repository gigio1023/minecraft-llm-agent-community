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

/**
 * Writes an explicit runtime note instead of treating memory as hidden success.
 *
 * In the probe loop, remember often acts as a terminal/status artifact that
 * explains why the actor stopped, stalled, or completed a bounded task.
 */
export function remember({ memory, note }: RememberArgs): RememberResult {
  memory.add(note);

  return {
    status: "remembered",
    note
  };
}
