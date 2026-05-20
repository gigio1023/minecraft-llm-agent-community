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
  findBlock?(options: { matching: (block: any) => boolean; maxDistance?: number }): any;
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

  // Auto-detect nearby crafting table blocks
  let craftingTableBlock: any = null;
  if (typeof bot.findBlock === "function") {
    try {
      craftingTableBlock = bot.findBlock({
        matching: (block: any) => block.name === "crafting_table",
        maxDistance: 8
      }) || null;
    } catch (e) {
      console.warn("Failed scanning for nearby crafting tables:", e);
    }
  }

  // Query recipe with or without crafting table block
  let recipes = bot.recipesFor(item.id, null, 1, null);
  if (recipes.length === 0 && craftingTableBlock) {
    recipes = bot.recipesFor(item.id, null, 1, craftingTableBlock);
  }

  const recipe = recipes[0];

  if (!recipe) {
    throw new Error(`No craftable recipe found for ${resolvedItemName} (crafting_table adjacent? ${!!craftingTableBlock})`);
  }

  const requiresTable = (recipe as any).requiresTable;
  if (requiresTable && !craftingTableBlock) {
    throw new Error(`Item ${resolvedItemName} requires a crafting_table, but none was found within 8 blocks.`);
  }

  await bot.craft(recipe, 1, requiresTable ? craftingTableBlock : null);

  return {
    status: "crafted",
    itemName: resolvedItemName
  };
}
