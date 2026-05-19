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
      knownSharedChests.set(
        chestId,
        items.map((item) => ({ name: item.name, count: item.count }))
      );
    },
    recordMajorEvent(event: string) {
      recentMajorEvents.push(event);

      if (recentMajorEvents.length > 12) {
        recentMajorEvents.splice(0, recentMajorEvents.length - 12);
      }
    },
    recordHostileSighting(sighting: HostileSighting) {
      lastHostileSighting = { ...sighting };
    },
    snapshot() {
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
