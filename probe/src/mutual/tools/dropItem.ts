import minecraftData from "minecraft-data";
import prismarineItemLoader from "prismarine-item";
import type { Item as PrismarineItem } from "prismarine-item";

import type { MutualActorId } from "../types.js";

type DropItemArgs = {
  actor: {
    username: string;
    version: string;
    entities?: Record<string, { metadata?: unknown[] }>;
    creative: {
      setInventorySlot(slot: number, item: unknown): Promise<void>;
    };
    toss(itemId: number, metadata: unknown, count: number): Promise<void>;
  };
  runtimeState: {
    markDroppedItem(actor: MutualActorId, itemName: string): void;
  };
  itemName: string;
  count: number;
};

function hasDroppedItemEntity(
  entities: Record<string, { metadata?: unknown[] }> | undefined,
  itemId: number
) {
  // Dropped item visibility is checked from entity metadata because Mineflayer's
  // toss promise can resolve before the item is observable to another actor.
  return Object.values(entities ?? {}).some((entity) =>
    entity.metadata?.some(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "itemId" in entry &&
        entry.itemId === itemId
    )
  );
}

async function waitForDroppedItemEntity(
  entities: Record<string, { metadata?: unknown[] }> | undefined,
  itemId: number,
  timeoutMs = 250
) {
  const deadline = Date.now() + timeoutMs;

  // Keep the wait short: marker handoff evidence should appear quickly or the
  // transcript should record a real failure instead of hiding behind sleeps.
  while (Date.now() < deadline) {
    if (hasDroppedItemEntity(entities, itemId)) {
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 10);
    });
  }

  throw new Error(`Dropped item entity ${itemId} did not become visible within ${timeoutMs}ms`);
}

export async function dropItem({
  actor,
  runtimeState,
  itemName,
  count
}: DropItemArgs) {
  const itemData = minecraftData(actor.version).itemsByName[itemName];

  if (!itemData) {
    throw new Error(`Unsupported marker item: ${itemName}`);
  }

  const ItemCtor = prismarineItemLoader as unknown as (
    version: string
  ) => typeof PrismarineItem;
  const item = new (ItemCtor(actor.version))(itemData.id, count);

  // Creative slot seeding is a probe shortcut, not a survival mechanic. It lets
  // the mutual scenario test material observation without inventory setup.
  await actor.creative.setInventorySlot(36, item);
  await actor.toss(itemData.id, null, count);
  await waitForDroppedItemEntity(actor.entities, itemData.id);
  runtimeState.markDroppedItem(actor.username as MutualActorId, itemName);

  return {
    status: "dropped" as const,
    itemName,
    count
  };
}
