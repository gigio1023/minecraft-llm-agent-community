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
      reason: "npc_b is closer than before.",
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
      reason: "npc_b did not get closer.",
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
      reason: "collect_4_logs reached the target inventory count.",
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
        targetCount: 4
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
