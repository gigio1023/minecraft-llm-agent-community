import assert from "node:assert/strict";
import test from "node:test";

import { collectLogs } from "../src/tools/collectLogs.js";

function createBot(options: {
  blockAfterDig?: string;
  initialLogCount?: number;
  logCountAfterPickup?: number;
}) {
  const block = { name: "oak_log", position: { x: 2, y: 0, z: 0 } };
  let logCount = options.initialLogCount ?? 0;
  let gotoCalls = 0;

  return {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {
        gotoCalls += 1;
        if (gotoCalls >= 2 && options.logCountAfterPickup !== undefined) {
          logCount = options.logCountAfterPickup;
        }
      }
    },
    findBlock() {
      return block;
    },
    canDigBlock() {
      return true;
    },
    async dig() {},
    nearestEntity() {
      return { name: "item", position: { x: 2, y: 0, z: 0 } };
    },
    blockAt() {
      return { name: options.blockAfterDig ?? "air" };
    },
    async lookAt() {},
    setControlState() {}
  };
}

test("collectLogs reports collected only when log inventory increases", async () => {
  const result = await collectLogs({
    bot: createBot({ initialLogCount: 0, logCountAfterPickup: 1 })
  });

  assert.equal(result.status, "collected");
  assert.equal(result.inventoryDelta, 1);
  assert.equal(result.reason, "collect_logs increased log inventory by 1.");
});

test("collectLogs keeps mining until the requested target count is in inventory", async () => {
  const blocks = [
    { name: "oak_log", position: { x: 2, y: 0, z: 0 } },
    { name: "oak_log", position: { x: 3, y: 0, z: 0 } },
    { name: "oak_log", position: { x: 4, y: 0, z: 0 } }
  ];
  let logCount = 0;
  let digCount = 0;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlocks() {
      return blocks.map((block) => block.position);
    },
    blockAt(position: { x: number }) {
      return blocks.find((block) => block.position.x === position.x) ?? { name: "air" };
    },
    canDigBlock() {
      return true;
    },
    async dig() {
      digCount += 1;
      logCount += 1;
    },
    nearestEntity() {
      return null;
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot, targetCount: 3 });

  assert.equal(result.status, "collected");
  assert.equal(result.afterLogCount, 3);
  assert.equal(result.inventoryDelta, 3);
  assert.equal(digCount, 3);
});

test("collectLogs does not poll evidence while a block is still being dug", async () => {
  const block = { name: "oak_log", position: { x: 2, y: 0, z: 0 } };
  let logCount = 0;
  let digging = false;
  let checkedDuringDig = false;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        if (digging) {
          checkedDuringDig = true;
        }

        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlock() {
      return block;
    },
    canDigBlock() {
      return true;
    },
    async dig() {
      digging = true;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });
      logCount = 1;
      digging = false;
    },
    nearestEntity() {
      return null;
    },
    blockAt() {
      return { name: "air" };
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot });

  assert.equal(result.status, "collected");
  assert.equal(checkedDuringDig, false);
});

test("collectLogs blocks optimistic success when log inventory does not increase", async () => {
  const result = await collectLogs({
    bot: createBot({ blockAfterDig: "oak_log", initialLogCount: 0 }),
    pickupWaitMs: 10
  });

  assert.deepEqual({
    status: result.status,
    inventoryDelta: result.inventoryDelta,
    blockRemoved: result.blockRemoved,
    reason: result.reason
  }, {
    status: "blocked",
    inventoryDelta: 0,
    blockRemoved: false,
    reason: "collect_logs dug a log, but log inventory did not increase."
  });
});

test("collectLogs blocks when movement drifts away from the selected log", async () => {
  const block = { name: "oak_log", position: { x: 2, y: 0, z: 0 } };
  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: 0 }];
      }
    },
    pathfinder: {
      async goto() {
        bot.entity.position.x = -8;
      },
      stop() {}
    },
    findBlock() {
      return block;
    },
    async dig() {
      throw new Error("dig should not run after drift");
    },
    blockAt() {
      return { name: "oak_log" };
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /movement drifted away/);
});

test("collectLogs returns nearby log hints when no low log is immediately reachable", async () => {
  const highLog = { name: "oak_log", position: { x: 14, y: 8, z: 0 } };
  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: 0 }];
      }
    },
    findBlocks() {
      return [highLog.position];
    },
    blockAt(position: { x: number; y: number; z: number }) {
      return position.x === highLog.position.x &&
        position.y === highLog.position.y &&
        position.z === highLog.position.z
        ? highLog
        : { name: "air", position };
    },
    async dig() {
      throw new Error("dig should not run when no low log is reachable");
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot });

  assert.equal(result.status, "blocked");
  assert.equal(result.nearbyLogHints?.[0]?.block, "oak_log");
  assert.equal(result.nearbyLogHints?.[0]?.reachableLow, false);
  assert.equal(result.nearbyLogHints?.[0]?.direction, "east");
});

test("collectLogs stops pathfinder work when the action is aborted", async () => {
  const block = { name: "oak_log", position: { x: 2, y: 0, z: 0 } };
  const controller = new AbortController();
  let stopped = false;
  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: 0 }];
      }
    },
    pathfinder: {
      goto() {
        return new Promise<void>(() => {});
      },
      stop() {
        stopped = true;
      }
    },
    findBlock() {
      return block;
    },
    async dig() {},
    blockAt() {
      return { name: "oak_log" };
    },
    async lookAt() {},
    setControlState() {}
  };

  const run = collectLogs({ bot, signal: controller.signal });
  controller.abort();

  await assert.rejects(run, /cancelled/);
  assert.equal(stopped, true);
});

test("collectLogs skips an unreachable log candidate and tries the next one", async () => {
  const blocks = [
    { name: "oak_log", position: { x: 2, y: 0, z: 0 } },
    { name: "oak_log", position: { x: 4, y: 0, z: 0 } }
  ];
  let logCount = 0;
  let digCalls = 0;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlocks() {
      return blocks.map((block) => block.position);
    },
    blockAt(position: { x: number; y: number; z: number }) {
      return blocks.find((block) => block.position.x === position.x) ?? { name: "air" };
    },
    async dig(block: { position: { x: number } }) {
      digCalls += 1;
      if (block.position.x === 2) {
        throw new Error("cannot dig first log");
      }

      logCount = 1;
    },
    nearestEntity() {
      return null;
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot });

  assert.equal(result.status, "collected");
  assert.equal(digCalls, 2);
  assert.deepEqual(result.attemptedBlocks?.map((attempt) => attempt.outcome), [
    "dig_blocked",
    "dug"
  ]);
});

test("collectLogs keeps trying candidates after one dug log is not picked up", async () => {
  const blocks = [
    { name: "oak_log", position: { x: 2, y: 0, z: 0 } },
    { name: "oak_log", position: { x: 4, y: 0, z: 0 } }
  ];
  let logCount = 0;
  let digCalls = 0;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlocks() {
      return blocks.map((block) => block.position);
    },
    blockAt(position: { x: number; y: number; z: number }) {
      return blocks.find((block) => block.position.x === position.x) ?? { name: "air" };
    },
    async dig() {
      digCalls += 1;
      if (digCalls === 2) {
        logCount = 1;
      }
    },
    nearestEntity() {
      return null;
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot, pickupWaitMs: 10 });

  assert.equal(result.status, "collected");
  assert.equal(digCalls, 2);
  assert.deepEqual(result.attemptedBlocks?.map((attempt) => attempt.outcome), ["dug", "dug"]);
});

test("collectLogs preserves full Mineflayer block objects from findBlocks before dig", async () => {
  const fullBlock = {
    name: "oak_log",
    position: { x: 2, y: 0, z: 0 },
    digTime() {
      return 1;
    }
  };
  let logCount = 0;
  let receivedFullBlock = false;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlocks() {
      return [fullBlock.position];
    },
    blockAt(position: { x: number; y: number; z: number }) {
      if (position.x === fullBlock.position.x) {
        return fullBlock;
      }

      return { name: "air", position };
    },
    async dig(block: typeof fullBlock) {
      receivedFullBlock = typeof block.digTime === "function";
      logCount = 1;
    },
    nearestEntity() {
      return null;
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot });

  assert.equal(result.status, "collected");
  assert.equal(receivedFullBlock, true);
});

test("collectLogs walks back to the broken block when dropped item entity is not visible", async () => {
  const block = { name: "oak_log", position: { x: 2, y: 0, z: 0 } };
  let logCount = 0;
  let gotoCalls = 0;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {
        gotoCalls += 1;
        if (gotoCalls >= 2) {
          logCount = 1;
        }
      }
    },
    findBlock() {
      return block;
    },
    async dig() {},
    nearestEntity() {
      return null;
    },
    blockAt() {
      return { name: "air" };
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot, pickupWaitMs: 10 });

  assert.equal(result.status, "collected");
  assert.ok(gotoCalls >= 2);
});

test("collectLogs returns progressing when an early log is acquired before a later pickup miss", async () => {
  const blocks = [
    { name: "oak_log", position: { x: 2, y: 0, z: 0 } },
    { name: "oak_log", position: { x: 4, y: 0, z: 0 } }
  ];
  let logCount = 0;
  let digCalls = 0;

  const bot = {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlocks() {
      return blocks.map((block) => block.position);
    },
    blockAt(position: { x: number; y: number; z: number }) {
      return blocks.find((block) => block.position.x === position.x) ?? { name: "air" };
    },
    async dig() {
      digCalls += 1;
      if (digCalls === 1) {
        logCount = 1;
      }
    },
    nearestEntity() {
      return null;
    },
    async lookAt() {},
    setControlState() {}
  };

  const result = await collectLogs({ bot, targetCount: 2, pickupWaitMs: 10 });

  assert.equal(result.status, "progressing");
  assert.equal(result.inventoryDelta, 1);
  assert.match(result.reason, /exhausted reachable candidates/);
});
