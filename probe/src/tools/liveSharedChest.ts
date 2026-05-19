import type { Vec3 } from "vec3";
import type { ItemStack } from "../gameplay/storage/sharedStorageLedger.js";

type InventoryItem = {
  name: string;
  count: number;
  type?: number;
  metadata?: number | null;
};

type SharedChestWindow = {
  containerItems(): InventoryItem[];
  deposit(itemType: number, metadata: number | null, count: number | null): Promise<void>;
  withdraw(itemType: number, metadata: number | null, count: number | null): Promise<void>;
  close(): void;
};

type ChestBlock = {
  name: string;
};

type SharedChestBot = {
  findBlock?: (input: {
    matching: (block: ChestBlock) => boolean;
    maxDistance: number;
    count: number;
  }) => unknown;
  openChest?: (block: any, direction?: number, cursorPos?: Vec3) => Promise<SharedChestWindow>;
  inventory?: {
    items(): InventoryItem[];
  };
  registry?: {
    itemsByName?: Record<string, { id: number }>;
  };
};

type CreateMineflayerSharedChestAccessorOptions = {
  chestId?: string;
  maxDistance?: number;
};

function snapshotItems(items: InventoryItem[]): ItemStack[] {
  return items
    .filter((item) => item.count > 0)
    .map((item) => ({ name: item.name, count: item.count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function findSharedChestBlock(bot: SharedChestBot, maxDistance: number) {
  return bot.findBlock?.({
    matching(block) {
      return block.name === "chest" || block.name === "trapped_chest";
    },
    maxDistance,
    count: 1
  });
}

function readItemType(bot: SharedChestBot, item: InventoryItem) {
  if (typeof item.type === "number") {
    return item.type;
  }

  return bot.registry?.itemsByName?.[item.name]?.id;
}

export function createMineflayerSharedChestAccessor(
  bot: SharedChestBot,
  { chestId = "shared-chest-1", maxDistance = 12 }: CreateMineflayerSharedChestAccessorOptions = {}
) {
  return {
    chestId,
    async inspect() {
      const block = findSharedChestBlock(bot, maxDistance);

      if (!block || !bot.openChest) {
        return null;
      }

      const chest = await bot.openChest(block);

      try {
        return snapshotItems(chest.containerItems());
      } finally {
        chest.close();
      }
    },
    async open() {
      const block = findSharedChestBlock(bot, maxDistance);

      if (!block || !bot.openChest) {
        throw new Error("shared chest is not available nearby");
      }

      const chest = await bot.openChest(block);

      return {
        items() {
          return snapshotItems(chest.containerItems());
        },
        async deposit(itemName: string, count: number) {
          const inventoryItem = bot.inventory?.items().find((item) => item.name === itemName);
          const itemType = inventoryItem ? readItemType(bot, inventoryItem) : undefined;

          if (!inventoryItem || itemType === undefined) {
            return 0;
          }

          const movedCount = Math.min(count, inventoryItem.count);
          await chest.deposit(itemType, inventoryItem.metadata ?? null, movedCount);
          return movedCount;
        },
        async withdraw(itemName: string, count: number) {
          const chestItem = chest.containerItems().find((item) => item.name === itemName);
          const itemType = chestItem ? readItemType(bot, chestItem) : undefined;

          if (!chestItem || itemType === undefined) {
            return 0;
          }

          const movedCount = Math.min(count, chestItem.count);
          await chest.withdraw(itemType, chestItem.metadata ?? null, movedCount);
          return movedCount;
        },
        close() {
          chest.close();
        }
      };
    }
  };
}
