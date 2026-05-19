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
  recipesFor(itemId: number, metadata: null, minResultCount: number, craftingTable: unknown): Recipe[];
  craft(recipe: Recipe, count: number, craftingTable: unknown): Promise<void>;
};

type CraftResult = {
  status: "crafted";
  itemName: string;
};

function resolveCraftTarget(bot: CraftingBot, itemName: string) {
  if (itemName === "planks") {
    return [...PLANK_ITEM_NAMES].find((candidate) => bot.recipesFor(bot.registry.itemsByName[candidate]?.id ?? -1, null, 1, null).length > 0) ?? null;
  }

  return itemName;
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
    throw new Error(`No craftable recipe found for ${resolvedItemName}`);
  }

  await bot.craft(recipe, 1, null);

  return {
    status: "crafted",
    itemName: resolvedItemName
  };
}
