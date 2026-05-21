const PLANK_ITEM_NAMES = [
  "oak_planks",
  "birch_planks",
  "spruce_planks",
  "jungle_planks",
  "acacia_planks",
  "dark_oak_planks",
  "mangrove_planks",
  "cherry_planks"
] as const;

type Recipe = unknown;

type CraftingBot = {
  registry: {
    itemsByName: Record<string, { id: number }>;
  };
  inventory?: {
    items(): Array<{ name: string; count: number }>;
  };
  recipesFor(itemId: number, metadata: null, minResultCount: number, craftingTable: unknown): Recipe[];
  craft(recipe: Recipe, count: number, craftingTable: unknown): Promise<void>;
};

type CraftResult = {
  status: "crafted";
  itemName: string;
  beforeCount?: number;
  afterCount?: number;
  inventoryDelta?: number;
};

function resolveCraftTarget(bot: CraftingBot, itemName: string) {
  if (itemName === "planks") {
    // "planks" is a curriculum-level target, not a Minecraft item id. Resolve
    // it to the first wood-specific plank recipe currently craftable by this
    // bot so the primitive stays biome-agnostic.
    return [...PLANK_ITEM_NAMES].find((candidate) => bot.recipesFor(bot.registry.itemsByName[candidate]?.id ?? -1, null, 1, null).length > 0) ?? null;
  }

  return itemName;
}

function countInventoryItem(bot: CraftingBot, itemName: string) {
  if (!bot.inventory) {
    return undefined;
  }

  return bot.inventory
    .items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

export async function craftItem({ bot, itemName }: { bot: CraftingBot; itemName: string }): Promise<CraftResult> {
  const resolvedItemName = resolveCraftTarget(bot, itemName);

  if (!resolvedItemName) {
    throw new Error(`No craftable recipe found for ${itemName}`);
  }

  const item = bot.registry.itemsByName[resolvedItemName];

  if (!item) {
    throw new Error(`Unknown craft item: ${resolvedItemName}`);
  }

  const [recipe] = bot.recipesFor(item.id, null, 1, null);

  if (!recipe) {
    // Passing null for the crafting table deliberately limits this primitive to
    // inventory recipes. Table-bound recipes need a separate runtime boundary
    // that can find, place, and verify use of a crafting table.
    throw new Error(`No craftable recipe found for ${resolvedItemName}`);
  }

  const beforeCount = countInventoryItem(bot, resolvedItemName);
  await bot.craft(recipe, 1, null);
  const afterCount = countInventoryItem(bot, resolvedItemName);

  return {
    status: "crafted",
    itemName: resolvedItemName,
    beforeCount,
    afterCount,
    inventoryDelta:
      beforeCount !== undefined && afterCount !== undefined
        ? afterCount - beforeCount
        : undefined
  };
}
