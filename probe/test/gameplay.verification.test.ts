/** Regression coverage for gameplay verification rejecting fake progress. */
import assert from "node:assert/strict";
import test from "node:test";

import { selectDeterministicTask } from "../src/gameplay/curriculum/deterministicCurriculum.js";
import { verifyTask } from "../src/gameplay/verification/verifyTask.js";

test("task verification distinguishes progress from no progress using real before and after facts", () => {
  const task = selectDeterministicTask({
    visibleActors: [{ id: "npc_b", distance: 4 }]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: { visibleActors: [{ id: "npc_b", distance: 4 }] },
      after: { visibleActors: [{ id: "npc_b", distance: 2.5 }] },
      result: { tool: "move_to", ok: true, status: "progress" }
    }),
    {
      status: "progressing",
      reason: "npc_b is closer than before (4 -> 2.5) but not within 1.5.",
      progress: {
        targetId: "npc_b",
        beforeDistance: 4,
        afterDistance: 2.5
      }
    }
  );

  assert.deepEqual(
    verifyTask(task, {
      before: { visibleActors: [{ id: "npc_b", distance: 4 }] },
      after: { visibleActors: [{ id: "npc_b", distance: 4 }] },
      result: { tool: "move_to", ok: false, status: "blocked" }
    }),
    {
      status: "failed",
      reason: "npc_b did not get closer (4 -> 4).",
      progress: {
        targetId: "npc_b",
        beforeDistance: 4,
        afterDistance: 4
      }
    }
  );
});

test("collect_4_logs verification uses inventory deltas instead of claimed tool success", () => {
  const task = selectDeterministicTask({
    visibleActors: [],
    inventory: [{ name: "oak_log", count: 3 }]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: { inventory: [{ name: "oak_log", count: 3 }] },
      after: { inventory: [{ name: "oak_log", count: 4 }] },
      result: { tool: "collect_logs", ok: true, status: "collected" }
    }),
    {
      status: "passed",
      reason: "collect_4_logs reached 4/4 relevant inventory items.",
      progress: {
        itemNames: [
          "oak_log",
          "birch_log",
          "spruce_log",
          "jungle_log",
          "acacia_log",
          "dark_oak_log",
          "mangrove_log",
          "cherry_log"
        ],
        beforeCount: 3,
        afterCount: 4,
        targetCount: 4,
        beforeNearbyBlockCount: null,
        afterNearbyBlockCount: null
      }
    }
  );
});

test("collect_4_logs verification rejects claimed success without inventory pickup", () => {
  const task = selectDeterministicTask({
    visibleActors: [],
    inventory: [{ name: "oak_log", count: 0 }]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: {
        inventory: [{ name: "oak_log", count: 0 }],
        nearbyBlocks: [{ name: "oak_log", distance: 3 }]
      },
      after: {
        inventory: [{ name: "oak_log", count: 0 }],
        nearbyBlocks: [{ name: "oak_log", distance: 3 }]
      },
      result: { tool: "collect_logs", ok: true, status: "collected" }
    }),
    {
      status: "failed",
      reason: "collect_4_logs saw no relevant inventory increase (0 -> 0).",
      progress: {
        itemNames: [
          "oak_log",
          "birch_log",
          "spruce_log",
          "jungle_log",
          "acacia_log",
          "dark_oak_log",
          "mangrove_log",
          "cherry_log"
        ],
        beforeCount: 0,
        afterCount: 0,
        targetCount: 4,
        beforeNearbyBlockCount: 1,
        afterNearbyBlockCount: 1
      }
    }
  );
});

test("collect_4_logs verification rejects nearby block removal without inventory pickup", () => {
  const task = selectDeterministicTask({
    visibleActors: [],
    inventory: [{ name: "oak_log", count: 0 }]
  });

  assert.ok(task);
  assert.equal(
    verifyTask(task, {
      before: {
        inventory: [{ name: "oak_log", count: 0 }],
        nearbyBlocks: [{ name: "oak_log", distance: 3 }]
      },
      after: {
        inventory: [{ name: "oak_log", count: 0 }],
        nearbyBlocks: []
      },
      result: { tool: "collect_logs", ok: true, status: "collected" }
    }).status,
    "failed"
  );
});

test("collect_4_logs verification rejects tool-local block removal without inventory pickup", () => {
  const task = selectDeterministicTask({
    visibleActors: [],
    inventory: [{ name: "oak_log", count: 0 }]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: {
        inventory: [{ name: "oak_log", count: 0 }],
        nearbyBlocks: []
      },
      after: {
        inventory: [{ name: "oak_log", count: 0 }],
        nearbyBlocks: []
      },
      result: {
        tool: "collect_logs",
        ok: true,
        status: "collected",
        blockRemoved: true,
        inventoryDelta: 0
      }
    }),
    {
      status: "failed",
      reason: "collect_4_logs saw no relevant inventory increase (0 -> 0).",
      progress: {
        itemNames: [
          "oak_log",
          "birch_log",
          "spruce_log",
          "jungle_log",
          "acacia_log",
          "dark_oak_log",
          "mangrove_log",
          "cherry_log"
        ],
        beforeCount: 0,
        afterCount: 0,
        targetCount: 4,
        beforeNearbyBlockCount: 0,
        afterNearbyBlockCount: 0,
        toolInventoryDelta: 0,
        toolBlockRemoved: true
      }
    }
  );
});

test("mine_cobblestone verification requires cobblestone inventory pickup", () => {
  const task = selectDeterministicTask({
    visibleActors: [],
      inventory: [
        { name: "wooden_pickaxe", count: 1 },
        { name: "cobblestone", count: 0 }
    ]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: {
        inventory: [
          { name: "wooden_pickaxe", count: 1 },
          { name: "cobblestone", count: 0 }
        ]
      },
      after: {
        inventory: [
          { name: "wooden_pickaxe", count: 1 },
          { name: "cobblestone", count: 1 }
        ]
      },
      result: {
        tool: "mine_block",
        ok: true,
        status: "mined",
        inventoryDelta: 1,
        blockRemoved: true
      }
    }),
    {
      status: "passed",
      reason: "mine_cobblestone reached 1/1 relevant inventory items.",
      progress: {
        itemNames: ["cobblestone"],
        beforeCount: 0,
        afterCount: 1,
        targetCount: 1,
        beforeNearbyBlockCount: null,
        afterNearbyBlockCount: null,
        toolInventoryDelta: 1,
        toolBlockRemoved: true
      }
    }
  );

  assert.equal(
    verifyTask(task, {
      before: { inventory: [{ name: "cobblestone", count: 0 }] },
      after: { inventory: [{ name: "cobblestone", count: 0 }] },
      result: {
        tool: "mine_block",
        ok: true,
        status: "mined",
        inventoryDelta: 0,
        blockRemoved: true
      }
    }).status,
    "failed"
  );

  assert.deepEqual(
    verifyTask(task, {
      before: { inventory: [{ name: "cobblestone", count: 0 }] },
      after: { inventory: [{ name: "cobblestone", count: 1 }] },
      result: {
        tool: "mine_block",
        ok: false,
        status: "blocked",
        inventoryDelta: 0,
        blockRemoved: false
      }
    }),
    {
      status: "failed",
      reason: "mine_cobblestone inventory reached target without a mined block result and positive tool-local delta.",
      progress: {
        itemNames: ["cobblestone"],
        beforeCount: 0,
        afterCount: 1,
        targetCount: 1,
        beforeNearbyBlockCount: null,
        afterNearbyBlockCount: null,
        toolInventoryDelta: 0,
        toolBlockRemoved: false
      }
    }
  );
});

test("move_to verification rejects arrived status without post-action distance evidence", () => {
  const task = selectDeterministicTask({
    visibleActors: [{ id: "npc_b", distance: 4 }]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: { visibleActors: [{ id: "npc_b", distance: 4 }] },
      after: { visibleActors: [] },
      result: { tool: "move_to", ok: true, status: "arrived" }
    }),
    {
      status: "failed",
      reason: "npc_b had no post-action distance observation, so move_to cannot be verified from the action status alone.",
      progress: {
        targetId: "npc_b",
        beforeDistance: 4,
        afterDistance: null
      }
    }
  );
});

test("craft_planks_and_sticks verification requires real output items in inventory", () => {
  const task = selectDeterministicTask({
    visibleActors: [],
    inventory: [{ name: "oak_log", count: 4 }]
  });

  assert.ok(task);
  assert.deepEqual(
    verifyTask(task, {
      before: { inventory: [{ name: "oak_log", count: 4 }] },
      after: {
        inventory: [
          { name: "oak_log", count: 2 },
          { name: "oak_planks", count: 6 },
          { name: "stick", count: 4 }
        ]
      },
      result: { tool: "craft_item", ok: true, status: "crafted" }
    }),
    {
      status: "passed",
      reason: "craft_planks_and_sticks produced both planks and sticks.",
      progress: {
        outputs: [
          {
            itemNames: [
              "oak_planks",
              "birch_planks",
              "spruce_planks",
              "jungle_planks",
              "acacia_planks",
              "dark_oak_planks",
              "mangrove_planks",
              "cherry_planks"
            ],
            beforeCount: 0,
            afterCount: 6,
            targetCount: 4
          },
          {
            itemNames: ["stick"],
            beforeCount: 0,
            afterCount: 4,
            targetCount: 2
          }
        ]
      }
    }
  );
});
