import assert from "node:assert/strict";
import test from "node:test";

import { craftWithTable } from "../src/tools/craftWithTable.js";

function createBot(options: {
  hasTable?: boolean;
  initialPickaxeCount?: number;
  afterPickaxeCount?: number;
  hasRecipe?: boolean;
  hasInventory?: boolean;
}) {
  const table = { name: "crafting_table", position: { x: 2, y: 64, z: 2 } };
  let pickaxeCount = options.initialPickaxeCount ?? 0;
  let craftTableArg: unknown = null;

  return {
    get craftTableArg() {
      return craftTableArg;
    },
    registry: {
      itemsByName: {
        wooden_pickaxe: { id: 100 }
      }
    },
    entity: {
      position: { x: 0, y: 64, z: 0 }
    },
    inventory: options.hasInventory === false
      ? undefined
      : {
          items() {
            return [{ name: "wooden_pickaxe", count: pickaxeCount }];
          }
        },
    findBlocks() {
      return options.hasTable === false ? [] : [table.position];
    },
    blockAt() {
      return options.hasTable === false ? { name: "air" } : table;
    },
    recipesFor(_itemId: number, _metadata: null, _count: number, craftingTable: unknown) {
      craftTableArg = craftingTable;
      return options.hasRecipe === false ? [] : [{ id: "wooden_pickaxe_recipe" }];
    },
    async craft(_recipe: unknown, _count: number, craftingTable: unknown) {
      craftTableArg = craftingTable;
      pickaxeCount = options.afterPickaxeCount ?? pickaxeCount + 1;
    }
  };
}

test("craftWithTable crafts only through a nearby crafting table block", async () => {
  const bot = createBot({ initialPickaxeCount: 0 });
  const result = await craftWithTable({ bot, itemName: "wooden_pickaxe" });

  assert.equal(result.status, "crafted");
  assert.equal(result.itemName, "wooden_pickaxe");
  assert.deepEqual(result.tablePosition, { x: 2, y: 64, z: 2 });
  assert.equal(result.beforeCount, 0);
  assert.equal(result.afterCount, 1);
  assert.equal(result.inventoryDelta, 1);
  assert.deepEqual(bot.craftTableArg, { name: "crafting_table", position: { x: 2, y: 64, z: 2 } });
});

test("craftWithTable blocks when no crafting table block is nearby", async () => {
  const result = await craftWithTable({
    bot: createBot({ hasTable: false }),
    itemName: "wooden_pickaxe"
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /no crafting_table block/);
});

test("craftWithTable blocks when the table recipe is unavailable", async () => {
  const result = await craftWithTable({
    bot: createBot({ hasRecipe: false }),
    itemName: "wooden_pickaxe"
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /no table recipe/);
});

test("craftWithTable blocks optimistic completion without inventory increase", async () => {
  const result = await craftWithTable({
    bot: createBot({ initialPickaxeCount: 0, afterPickaxeCount: 0 }),
    itemName: "wooden_pickaxe"
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.inventoryDelta, 0);
  assert.match(result.reason, /inventory did not increase/);
});
