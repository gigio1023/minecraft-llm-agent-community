/** Regression coverage for structured block-placement contracts. */
import assert from "node:assert/strict";
import test from "node:test";

import { placeBlock, type Positioned } from "../src/tools/placeBlock.js";

function key(position: Positioned) {
  return `${position.x}:${position.y}:${position.z}`;
}

function createPlacementBot(options: {
  itemName?: string;
  itemCount?: number;
  occupiedTarget?: { name: string; position: Positioned };
}) {
  const blocks = new Map<string, { name: string; position: Positioned; boundingBox?: string }>();
  let equippedItem: { name: string; count: number } | undefined;
  const item = { name: options.itemName ?? "dirt", count: options.itemCount ?? 4 };

  if (options.occupiedTarget) {
    blocks.set(key(options.occupiedTarget.position), {
      ...options.occupiedTarget,
      boundingBox: "block"
    });
  }

  return {
    entity: {
      position: { x: 0, y: 64, z: 0 }
    },
    inventory: {
      items() {
        return item.count > 0 ? [item] : [];
      }
    },
    blockAt(position: Positioned) {
      const normalized = {
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        z: Math.floor(position.z)
      };
      if (blocks.has(key(normalized))) {
        return blocks.get(key(normalized))!;
      }
      return normalized.y === 63
        ? { name: "grass_block", position: normalized, boundingBox: "block" }
        : { name: "air", position: normalized };
    },
    async equip(nextItem: { name: string; count: number }) {
      equippedItem = nextItem;
    },
    async placeBlock(referenceBlock: { position: Positioned }, faceVector: Positioned) {
      assert.ok(equippedItem, "placeBlock should equip an inventory item first");
      const target = {
        x: referenceBlock.position.x + faceVector.x,
        y: referenceBlock.position.y + faceVector.y,
        z: referenceBlock.position.z + faceVector.z
      };
      blocks.set(key(target), {
        name: equippedItem.name,
        position: target,
        boundingBox: "block"
      });
      equippedItem.count -= 1;
    },
    async lookAt() {},
    setControlState() {}
  };
}

test("placeBlock places an inventory block and verifies world state", async () => {
  const bot = createPlacementBot({ itemName: "dirt", itemCount: 2 });
  const result = await placeBlock({
    bot,
    itemName: "dirt",
    targetPosition: { x: 1, y: 64, z: 0 }
  });

  assert.equal(result.status, "placed");
  assert.equal(result.afterBlockName, "dirt");
  assert.equal(result.beforeCount, 2);
  assert.equal(result.afterCount, 1);
  assert.equal(result.inventoryDelta, -1);
  assert.deepEqual(result.targetPosition, { x: 1, y: 64, z: 0 });
});

test("placeBlock resolves a natural support surface to the replaceable block above it", async () => {
  const bot = createPlacementBot({ itemName: "crafting_table", itemCount: 1 });
  const result = await placeBlock({
    bot,
    itemName: "crafting_table",
    targetPosition: { x: 1, y: 63, z: 0 }
  });

  assert.equal(result.status, "placed");
  assert.equal(result.afterBlockName, "crafting_table");
  assert.equal(result.targetResolution, "surface_position_above_requested_target");
  assert.deepEqual(result.requestedTargetPosition, { x: 1, y: 63, z: 0 });
  assert.deepEqual(result.supportPosition, { x: 1, y: 63, z: 0 });
  assert.deepEqual(result.targetPosition, { x: 1, y: 64, z: 0 });
});

test("placeBlock resolves ordinary solid support surfaces without a fixed material list", async () => {
  const bot = createPlacementBot({
    itemName: "torch",
    itemCount: 1,
    occupiedTarget: {
      name: "oak_log",
      position: { x: 1, y: 63, z: 0 }
    }
  });
  const result = await placeBlock({
    bot,
    itemName: "torch",
    targetPosition: { x: 1, y: 63, z: 0 }
  });

  assert.equal(result.status, "placed");
  assert.equal(result.afterBlockName, "torch");
  assert.equal(result.targetResolution, "surface_position_above_requested_target");
  assert.deepEqual(result.targetPosition, { x: 1, y: 64, z: 0 });
});

test("placeBlock blocks when target contains a protected block", async () => {
  const result = await placeBlock({
    bot: createPlacementBot({
      occupiedTarget: {
        name: "chest",
        position: { x: 1, y: 64, z: 0 }
      }
    }),
    itemName: "dirt",
    targetPosition: { x: 1, y: 64, z: 0 }
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /non-replaceable/);
});

test("placeBlock reports already_present without consuming inventory", async () => {
  const result = await placeBlock({
    bot: createPlacementBot({
      occupiedTarget: {
        name: "dirt",
        position: { x: 1, y: 64, z: 0 }
      }
    }),
    itemName: "dirt",
    targetPosition: { x: 1, y: 64, z: 0 }
  });

  assert.equal(result.status, "already_present");
  assert.equal(result.inventoryDelta, 0);
});
