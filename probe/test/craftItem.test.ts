import assert from "node:assert/strict";
import test from "node:test";

import { craftItem } from "../src/tools/craftItem.js";

function createCraftBot(options?: {
  recipeNames?: string[];
  initialCounts?: Record<string, number>;
  craftedCount?: number;
  includeInventory?: boolean;
}) {
  const recipeNames = new Set(options?.recipeNames ?? ["oak_planks", "stick", "crafting_table"]);
  const counts = new Map(Object.entries(options?.initialCounts ?? {}));
  const craftCalls: Array<{ recipe: string; count: number; table: unknown }> = [];

  return {
    craftCalls,
    registry: {
      itemsByName: {
        oak_planks: { id: 1 },
        birch_planks: { id: 2 },
        stick: { id: 3 },
        crafting_table: { id: 4 }
      }
    },
    ...(options?.includeInventory === false
      ? {}
      : {
          inventory: {
            items() {
              return [...counts.entries()].map(([name, count]) => ({ name, count }));
            }
          }
        }),
    recipesFor(itemId: number) {
      const itemName = Object.entries(this.registry.itemsByName).find(
        ([, item]) => item.id === itemId
      )?.[0];

      return itemName && recipeNames.has(itemName) ? [itemName] : [];
    },
    async craft(recipe: string, count: number, table: unknown) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });
      craftCalls.push({ recipe, count, table });
      counts.set(recipe, (counts.get(recipe) ?? 0) + (options?.craftedCount ?? 1));
    }
  };
}

test("craftItem resolves curriculum planks to a wood-specific Mineflayer recipe", async () => {
  const bot = createCraftBot({ initialCounts: { oak_planks: 0 } });

  const result = await craftItem({ bot, itemName: "planks" });

  assert.deepEqual(result, {
    status: "crafted",
    itemName: "oak_planks",
    beforeCount: 0,
    afterCount: 1,
    inventoryDelta: 1
  });
  assert.deepEqual(bot.craftCalls, [{ recipe: "oak_planks", count: 1, table: null }]);
});

test("craftItem awaits Mineflayer craft completion before returning inventory evidence", async () => {
  const bot = createCraftBot({ initialCounts: { stick: 0 }, craftedCount: 4 });

  const result = await craftItem({ bot, itemName: "stick" });

  assert.equal(result.status, "crafted");
  assert.equal(result.afterCount, 4);
  assert.equal(result.inventoryDelta, 4);
});

test("craftItem blocks optimistic craft completion without inventory increase", async () => {
  const bot = createCraftBot({ initialCounts: { stick: 0 }, craftedCount: 0 });

  const result = await craftItem({ bot, itemName: "stick" });

  assert.deepEqual(result, {
    status: "blocked",
    itemName: "stick",
    reason: "craft_item completed but stick inventory did not increase",
    beforeCount: 0,
    afterCount: 0,
    inventoryDelta: 0
  });
  assert.deepEqual(bot.craftCalls, [{ recipe: "stick", count: 1, table: null }]);
});

test("craftItem blocks when inventory evidence is unavailable", async () => {
  const bot = createCraftBot({ includeInventory: false });

  const result = await craftItem({ bot, itemName: "stick" });

  assert.deepEqual(result, {
    status: "blocked",
    itemName: "stick",
    reason: "craft_item cannot verify stick without inventory evidence"
  });
  assert.deepEqual(bot.craftCalls, []);
});

test("craftItem rejects unknown item names before calling Mineflayer craft", async () => {
  const bot = createCraftBot();

  await assert.rejects(() => craftItem({ bot, itemName: "diamond_saddle" }), /Unknown craft item/);
  assert.deepEqual(bot.craftCalls, []);
});

test("craftItem rejects known items without available recipes", async () => {
  const bot = createCraftBot({ recipeNames: [] });

  await assert.rejects(() => craftItem({ bot, itemName: "crafting_table" }), /No craftable recipe/);
  assert.deepEqual(bot.craftCalls, []);
});
