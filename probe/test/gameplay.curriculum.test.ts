/** Regression coverage for bounded gameplay curriculum helpers. */
import assert from "node:assert/strict";
import test from "node:test";

import { selectDeterministicTask } from "../src/gameplay/curriculum/deterministicCurriculum.js";

test("deterministic curriculum selects approach_visible_target for the nearest unmet visible actor", () => {
  assert.deepEqual(
    selectDeterministicTask({
      visibleActors: [
        { id: "npc_b", distance: 3 },
        { id: "npc_c", distance: 6 }
      ]
    }),
    {
      id: "approach_visible_target",
      reason: "Need to close distance to npc_b before the next interaction.",
      blockers: [],
      preferredActorRoles: ["runner"],
      primitiveIds: ["observe", "move_to", "wait"],
      targetId: "npc_b",
      success: {
        kind: "distance_at_most",
        targetId: "npc_b",
        maxDistance: 1.5
      }
    }
  );

  assert.equal(
    selectDeterministicTask({
      visibleActors: [{ id: "npc_b", distance: 1.25 }]
    }),
    null
  );
});

test("deterministic curriculum selects the next unmet early-game milestone from inventory facts", () => {
  assert.equal(
    selectDeterministicTask({
      visibleActors: [],
      inventory: [{ name: "oak_log", count: 3 }]
    })?.id,
    "collect_4_logs"
  );

  assert.equal(
    selectDeterministicTask({
      visibleActors: [],
      inventory: [{ name: "oak_log", count: 4 }]
    })?.id,
    "craft_planks_and_sticks"
  );

  assert.equal(
    selectDeterministicTask({
      visibleActors: [],
      inventory: [{ name: "oak_log", count: 3 }],
      sharedChest: {
        chestId: "shared-chest-1",
        items: [{ name: "oak_log", count: 1 }]
      }
    })?.id,
    "craft_planks_and_sticks"
  );

  assert.equal(
    selectDeterministicTask({
      visibleActors: [],
      inventory: [
        { name: "oak_log", count: 2 },
        { name: "oak_planks", count: 6 },
        { name: "stick", count: 4 }
      ]
    })?.id,
    "craft_crafting_table"
  );

  assert.equal(
    selectDeterministicTask({
      visibleActors: [],
      inventory: [
        { name: "oak_log", count: 2 },
        { name: "oak_planks", count: 2 },
        { name: "stick", count: 4 },
        { name: "crafting_table", count: 1 }
      ]
    }),
    null
  );

  assert.equal(
    selectDeterministicTask({
      visibleActors: [],
      inventory: [
        { name: "wooden_pickaxe", count: 1 },
        { name: "cobblestone", count: 0 }
      ]
    })?.id,
    "mine_cobblestone"
  );
});
