type Positioned = { x: number; y: number; z: number };

type Recipe = unknown;

type CraftingTableBot = {
  registry: {
    itemsByName: Record<string, { id: number }>;
  };
  entity: {
    position: Positioned;
  };
  inventory?: {
    items(): Array<{ name: string; count: number }>;
  };
  findBlocks?(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
    count: number;
  }): Positioned[];
  findBlock?(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
  }): { name: string; position: Positioned } | null;
  blockAt?(position: Positioned): { name: string; position?: Positioned } | null;
  recipesFor(itemId: number, metadata: null, minResultCount: number, craftingTable: unknown): Recipe[];
  craft(recipe: Recipe, count: number, craftingTable: unknown): Promise<void>;
};

type CraftWithTableResult = {
  status: "crafted" | "blocked";
  itemName: string;
  tablePosition?: Positioned;
  beforeCount?: number;
  afterCount?: number;
  inventoryDelta?: number;
  reason: string;
};

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function countInventoryItem(bot: CraftingTableBot, itemName: string) {
  if (!bot.inventory) {
    return undefined;
  }

  return bot.inventory
    .items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

function isCraftingTable(block: { name: string }) {
  return block.name === "crafting_table";
}

function findNearbyCraftingTable(bot: CraftingTableBot) {
  const fromBlocks = bot.findBlocks?.({
    matching: isCraftingTable,
    maxDistance: 5,
    count: 8
  })
    .map((position) => {
      const block = bot.blockAt?.(position);
      return block && isCraftingTable(block) ? block : null;
    })
    .filter((entry): entry is { name: string; position: Positioned } =>
      entry !== null && entry.position !== undefined
    ) ?? [];
  const candidates = fromBlocks.length > 0
    ? fromBlocks
    : bot.findBlock
      ? [
          bot.findBlock({
            matching: isCraftingTable,
            maxDistance: 5
          })
        ].filter((entry): entry is { name: string; position: Positioned } => entry !== null)
      : [];

  return candidates.sort((left, right) =>
    distance(bot.entity.position, left.position) - distance(bot.entity.position, right.position)
  )[0] ?? null;
}

/**
 * Crafts a table-bound recipe against an observed nearby crafting table block.
 *
 * This primitive deliberately does not place tables yet. Placement needs its own
 * block-placement evidence boundary; here success means an existing table block
 * was bound into `bot.craft(...)` and the requested inventory item increased.
 */
export async function craftWithTable({
  bot,
  itemName
}: {
  bot: CraftingTableBot;
  itemName: string;
}): Promise<CraftWithTableResult> {
  const item = bot.registry.itemsByName[itemName];

  if (!item) {
    throw new Error(`Unknown table craft item: ${itemName}`);
  }

  const table = findNearbyCraftingTable(bot);

  if (!table) {
    return {
      status: "blocked",
      itemName,
      reason: "craft_with_table found no crafting_table block within 5 blocks"
    };
  }

  const beforeCount = countInventoryItem(bot, itemName);
  if (beforeCount === undefined) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      reason: `craft_with_table cannot verify ${itemName} without inventory evidence`
    };
  }

  const [recipe] = bot.recipesFor(item.id, null, 1, table);

  if (!recipe) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      beforeCount,
      reason: `craft_with_table found no table recipe for ${itemName}`
    };
  }

  await bot.craft(recipe, 1, table);

  const afterCount = countInventoryItem(bot, itemName);
  if (afterCount === undefined) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      beforeCount,
      reason: `craft_with_table lost ${itemName} inventory evidence after craft`
    };
  }

  const inventoryDelta = afterCount - beforeCount;

  if (inventoryDelta <= 0) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      beforeCount,
      afterCount,
      inventoryDelta,
      reason: `craft_with_table completed but ${itemName} inventory did not increase`
    };
  }

  return {
    status: "crafted",
    itemName,
    tablePosition: table.position,
    beforeCount,
    afterCount,
    inventoryDelta,
    reason: `craft_with_table increased ${itemName} inventory by ${inventoryDelta}`
  };
}
