import assert from "node:assert/strict";
import test from "node:test";

import { collectLogs } from "../src/tools/collectLogs.js";

function createBot(options: { blockAfterDig: string; logCount: number }) {
  const block = { name: "oak_log", position: { x: 2, y: 0, z: 0 } };

  return {
    entity: {
      position: { x: 0, y: 0, z: 0 }
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: options.logCount }];
      }
    },
    pathfinder: {
      async goto() {}
    },
    findBlock() {
      return block;
    },
    async dig() {},
    nearestEntity() {
      return { name: "item", position: { x: 2, y: 0, z: 0 } };
    },
    blockAt() {
      return { name: options.blockAfterDig };
    },
    async lookAt() {},
    setControlState() {}
  };
}

test("collectLogs reports collected only when block evidence changed", async () => {
  const result = await collectLogs({
    bot: createBot({ blockAfterDig: "air", logCount: 0 })
  });

  assert.equal(result.status, "collected");
  assert.equal(result.blockRemoved, true);
  assert.equal(result.reason, "collect_logs removed oak_log from the world.");
});

test("collectLogs blocks optimistic success when no inventory or block evidence changed", async () => {
  const result = await collectLogs({
    bot: createBot({ blockAfterDig: "oak_log", logCount: 0 })
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
    reason: "collect_logs dug a log, but neither inventory nor block-state evidence changed."
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
