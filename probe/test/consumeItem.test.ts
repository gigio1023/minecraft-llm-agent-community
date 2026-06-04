/** Regression coverage for consume-item primitive evidence. */
import assert from "node:assert/strict";
import test from "node:test";

import { consumeItem, listFoodCandidates } from "../src/tools/consumeItem.js";
import { observe } from "../src/tools/observe.js";
import { createDialogueState } from "../src/runtime/dialogueState.js";
import { createMemory } from "../src/runtime/memory.js";

function createBot(options: {
  food?: number;
  health?: number;
  items?: Array<{ name: string; count: number }>;
  consumeMutates?: boolean;
} = {}) {
  const items = options.items ?? [{ name: "bread", count: 2 }];
  const bot = {
    username: "npc_b",
    food: options.food ?? 12,
    health: options.health ?? 20,
    foodSaturation: 1,
    heldItem: null as { name: string; count: number } | null,
    registry: {
      foodsByName: {
        bread: { foodPoints: 5, saturation: 6 },
        apple: { foodPoints: 4, saturation: 2.4 }
      }
    },
    entity: {
      position: {
        x: 0,
        y: 64,
        z: 0,
        distanceTo() {
          return 0;
        }
      }
    },
    inventory: {
      items() {
        return items.filter((item) => item.count > 0);
      }
    },
    async equip(item: { name: string; count: number }) {
      bot.heldItem = item;
    },
    async consume() {
      if (!bot.heldItem) {
        throw new Error("nothing held");
      }
      if (options.consumeMutates === false) {
        return;
      }
      bot.heldItem.count -= 1;
      const foodsByName = bot.registry.foodsByName as Record<string, { foodPoints: number } | undefined>;
      bot.food = Math.min(20, bot.food + (foodsByName[bot.heldItem.name]?.foodPoints ?? 0));
    }
  };
  return bot;
}

test("consumeItem equips edible inventory and verifies inventory or vitals delta", async () => {
  const bot = createBot({ food: 10 });
  const result = await consumeItem({ bot, itemName: "bread" });

  assert.equal(result.status, "consumed");
  assert.equal(result.itemName, "bread");
  assert.equal(result.count_delta, -1);
  assert.equal(result.food_delta, 5);
});

test("consumeItem blocks when no edible inventory exists", async () => {
  const result = await consumeItem({
    bot: createBot({ items: [{ name: "cobblestone", count: 3 }] })
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /no edible inventory item/);
});

test("consumeItem blocks already-full food instead of fabricating success", async () => {
  const result = await consumeItem({ bot: createBot({ food: 20 }), itemName: "bread" });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /already full/);
});

test("consumeItem fails when Mineflayer reports completion without evidence delta", async () => {
  const result = await consumeItem({
    bot: createBot({ food: 10, consumeMutates: false }),
    itemName: "bread"
  });

  assert.equal(result.status, "failed");
  assert.match(result.reason, /did not change/);
});

test("observe exposes vitals and edible inventory as raw evidence", async () => {
  const bot = createBot({
    food: 9,
    health: 18,
    items: [
      { name: "bread", count: 1 },
      { name: "cobblestone", count: 4 }
    ]
  });
  const result = await observe({
    actor: bot,
    target: bot,
    dialogueState: createDialogueState({ busyRepliesBeforeAvailable: 0 }),
    memory: createMemory()
  });

  assert.equal(result.vitals?.food, 9);
  assert.equal(result.vitals?.health, 18);
  assert.deepEqual(result.vitals?.food_candidates, [
    { name: "bread", count: 1, food_points: 5, saturation: 6 }
  ]);
  assert.deepEqual(listFoodCandidates(bot), [
    { name: "bread", count: 1, food_points: 5, saturation: 6 }
  ]);
});
