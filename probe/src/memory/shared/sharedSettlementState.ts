import type { ItemStack } from "../../gameplay/storage/sharedStorageLedger.js";

type HostileSighting = {
  actorId: string;
  note: string;
  updatedAt: number;
};

export function createSharedSettlementState() {
  const knownSharedChests = new Map<string, ItemStack[]>();
  const recentMajorEvents: string[] = [];
  let lastHostileSighting: HostileSighting | null = null;

  return {
    rememberSharedChest(chestId: string, items: ItemStack[]) {
      // Store copies so Mineflayer inventory objects cannot mutate shared memory
      // after a transcript or provider context has already referenced it.
      knownSharedChests.set(
        chestId,
        items.map((item) => ({ name: item.name, count: item.count }))
      );
    },
    recordMajorEvent(event: string) {
      recentMajorEvents.push(event);

      // Settlement context is a prompt/debug summary, not an unbounded event log.
      if (recentMajorEvents.length > 12) {
        recentMajorEvents.splice(0, recentMajorEvents.length - 12);
      }
    },
    recordHostileSighting(sighting: HostileSighting) {
      lastHostileSighting = { ...sighting };
    },
    snapshot() {
      // Snapshots are provider-facing and artifact-facing, so callers receive
      // detached data rather than handles to mutable settlement state.
      return {
        knownSharedChests: [...knownSharedChests.entries()].map(([chestId, items]) => ({
          chestId,
          items: items.map((item) => ({ name: item.name, count: item.count }))
        })),
        recentMajorEvents: [...recentMajorEvents],
        lastHostileSighting: lastHostileSighting ? { ...lastHostileSighting } : null
      };
    }
  };
}
