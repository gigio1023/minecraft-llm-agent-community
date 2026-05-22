import assert from "node:assert/strict";
import test from "node:test";

import { mineBlock } from "../src/tools/mineBlock.js";

function createStoneBlocks(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    name: "stone",
    position: { x: 2 + index, y: 0, z: 0 }
  }));
}

test("mineBlock mines stone until cobblestone target is in inventory", async () => {
  const blocks = createStoneBlocks(3);
  const remainingBlocks = new Set(blocks.map((block) => block.position.x));
  let cobblestoneCount = 0;
  let digCount = 0;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [
          { name: "wooden_pickaxe", count: 1 },
          { name: "cobblestone", count: cobblestoneCount }
        ];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlocks() {
      return blocks.map((block) => block.position);
    },
    blockAt(position: { x: number; y: number; z: number }) {
      const block = blocks.find((candidate) => candidate.position.x === position.x);
      return block && remainingBlocks.has(position.x) ? block : { name: "air", position };
    },
    canDigBlock() {
      return true;
    },
    async dig(block: { position: { x: number } }) {
      digCount += 1;
      remainingBlocks.delete(block.position.x);
      cobblestoneCount += 1;
    },
    nearestEntity() {
      return null;
    },
    setControlState() {},
    async equip() {}
  };

  const result = await mineBlock({
    bot,
    blockName: "stone",
    itemName: "cobblestone",
    targetCount: 3
  });

  assert.equal(result.status, "mined");
  assert.equal(result.inventoryDelta, 3);
  assert.equal(result.afterCount, 3);
  assert.equal(result.equippedTool, "wooden_pickaxe");
  assert.equal(digCount, 3);
  assert.equal(result.attemptedBlocks.filter((attempt) => attempt.outcome === "dug").length, 3);
});

test("mineBlock blocks before digging when no pickaxe is available", async () => {
  let digCalled = false;
  const result = await mineBlock({
    bot: {
      entity: {
        position: { x: 0, y: 0, z: 0 }
      },
      inventory: {
        items() {
          return [];
        }
      },
      findBlock() {
        return { name: "stone", position: { x: 2, y: 0, z: 0 } };
      },
      async dig() {
        digCalled = true;
      },
      setControlState() {},
      async equip() {}
    },
    blockName: "stone",
    itemName: "cobblestone"
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /requires a pickaxe/);
  assert.equal(digCalled, false);
});

test("mineBlock blocks optimistic success without inventory increase", async () => {
  const block = { name: "stone", position: { x: 2, y: 0, z: 0 } };
  let blockRemoved = false;

  const result = await mineBlock({
    bot: {
      entity: {
        position: { x: 0, y: 0, z: 0 }
      },
      inventory: {
        items() {
          return [
            { name: "wooden_pickaxe", count: 1 },
            { name: "cobblestone", count: 0 }
          ];
        }
      },
      pathfinder: {
        async goto() {}
      },
      findBlock() {
        return block;
      },
      blockAt() {
        return blockRemoved ? { name: "air", position: block.position } : block;
      },
      canDigBlock() {
        return true;
      },
      async dig() {
        blockRemoved = true;
      },
      nearestEntity() {
        return null;
      },
      setControlState() {},
      async equip() {}
    },
    blockName: "stone",
    itemName: "cobblestone",
    pickupWaitMs: 10
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.inventoryDelta, 0);
  assert.equal(result.blockRemoved, true);
  assert.match(result.reason, /inventory did not increase/);
});

test("mineBlock walks to nearby mined drops before declaring no pickup", async () => {
  const block = { name: "stone", position: { x: 2, y: 0, z: 0 } };
  let blockRemoved = false;
  let cobblestoneCount = 0;
  let pickupMoves = 0;

  const result = await mineBlock({
    bot: {
      entity: {
        position: { x: 0, y: 0, z: 0 }
      },
      inventory: {
        items() {
          return [
            { name: "wooden_pickaxe", count: 1 },
            { name: "cobblestone", count: cobblestoneCount }
          ];
        }
      },
      pathfinder: {
        async goto() {
          pickupMoves += 1;
          cobblestoneCount = 1;
        }
      },
      findBlock() {
        return block;
      },
      blockAt() {
        return blockRemoved ? { name: "air", position: block.position } : block;
      },
      async dig() {
        blockRemoved = true;
      },
      nearestEntity() {
        return { name: "item", position: { x: 2.5, y: 0, z: 0.5 } };
      },
      setControlState() {},
      async equip() {}
    },
    blockName: "stone",
    itemName: "cobblestone",
    pickupWaitMs: 10
  });

  assert.equal(result.status, "mined");
  assert.equal(result.inventoryDelta, 1);
  assert.equal(pickupMoves, 1);
});

test("mineBlock bounds mined-drop pickup movement and preserves failure evidence", async () => {
  const block = { name: "stone", position: { x: 2, y: 0, z: 0 } };
  let blockRemoved = false;
  let stopped = false;

  const result = await mineBlock({
    bot: {
      entity: {
        position: { x: 0, y: 0, z: 0 }
      },
      inventory: {
        items() {
          return [
            { name: "wooden_pickaxe", count: 1 },
            { name: "cobblestone", count: 0 }
          ];
        }
      },
      pathfinder: {
        async goto() {
          await new Promise<void>(() => {});
        },
        stop() {
          stopped = true;
        }
      },
      findBlock() {
        return block;
      },
      blockAt() {
        return blockRemoved ? { name: "air", position: block.position } : block;
      },
      async dig() {
        blockRemoved = true;
      },
      nearestEntity() {
        return { name: "item", position: { x: 2.5, y: 0, z: 0.5 } };
      },
      setControlState() {},
      async equip() {}
    },
    blockName: "stone",
    itemName: "cobblestone",
    pickupWaitMs: 1,
    pickupMoveTimeoutMs: 5
  });

  assert.equal(result.status, "blocked");
  assert.equal(stopped, true);
  assert.match(result.attemptedBlocks[0]?.reason ?? "", /pathfinder timeout/);
});

test("mineBlock does not poll inventory while the block is still being dug", async () => {
  const block = { name: "stone", position: { x: 2, y: 0, z: 0 } };
  let cobblestoneCount = 0;
  let digging = false;
  let checkedDuringDig = false;

  const result = await mineBlock({
    bot: {
      entity: {
        position: { x: 0, y: 0, z: 0 }
      },
      inventory: {
        items() {
          if (digging) {
            checkedDuringDig = true;
          }

          return [
            { name: "wooden_pickaxe", count: 1 },
            { name: "cobblestone", count: cobblestoneCount }
          ];
        }
      },
      pathfinder: {
        async goto() {}
      },
      findBlock() {
        return block;
      },
      blockAt() {
        return cobblestoneCount > 0 ? { name: "air", position: block.position } : block;
      },
      canDigBlock() {
        return true;
      },
      async dig() {
        digging = true;
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 20);
        });
        cobblestoneCount = 1;
        digging = false;
      },
      nearestEntity() {
        return null;
      },
      setControlState() {},
      async equip() {}
    },
    blockName: "stone",
    itemName: "cobblestone"
  });

  assert.equal(result.status, "mined");
  assert.equal(checkedDuringDig, false);
});
