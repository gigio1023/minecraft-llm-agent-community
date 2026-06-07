/** Focused tests for the strict hand-equipment primitive. */
import assert from "node:assert/strict";
import test from "node:test";

import { equipItem } from "../src/tools/equipItem.js";

type Item = { name: string; count: number };

function fakeBot(input: {
  items: Item[];
  heldItem?: Item | null;
  equipImpl?: (item: Item) => void | Promise<void>;
}) {
  return {
    heldItem: input.heldItem ?? null,
    inventory: {
      items() {
        return input.items;
      }
    },
    async equip(item: Item, _destination: "hand") {
      if (input.equipImpl) {
        await input.equipImpl(item);
        return;
      }
      this.heldItem = item;
    }
  };
}

test("equipItem equips an exact inventory item and records held item evidence", async () => {
  const bot = fakeBot({
    items: [{ name: "wooden_pickaxe", count: 1 }]
  });

  const result = await equipItem({ bot, itemName: "wooden_pickaxe" });

  assert.equal(result.status, "equipped");
  assert.equal(result.after.held_item?.name, "wooden_pickaxe");
  assert.equal(result.before.held_item, undefined);
});

test("equipItem treats already held exact item as verified state", async () => {
  const heldItem = { name: "wooden_pickaxe", count: 1 };
  const result = await equipItem({
    bot: fakeBot({
      items: [heldItem],
      heldItem
    }),
    itemName: "wooden_pickaxe"
  });

  assert.equal(result.status, "already_equipped");
  assert.equal(result.after.held_item?.name, "wooden_pickaxe");
});

test("equipItem does not fuzzy-match natural language item names", async () => {
  const result = await equipItem({
    bot: fakeBot({
      items: [{ name: "wooden_pickaxe", count: 1 }]
    }),
    itemName: "wooden pickaxe"
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /exact inventory item/);
});

test("equipItem fails when Mineflayer does not leave the requested item held", async () => {
  const result = await equipItem({
    bot: fakeBot({
      items: [{ name: "wooden_pickaxe", count: 1 }],
      equipImpl() {
        // Simulate a Mineflayer/plugin failure where the call resolves without
        // changing held-item state.
      }
    }),
    itemName: "wooden_pickaxe"
  });

  assert.equal(result.status, "failed");
  assert.match(result.reason, /held item is not wooden_pickaxe/);
});
