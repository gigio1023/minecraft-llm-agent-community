import assert from "node:assert/strict";
import test from "node:test";

import { runAction } from "../src/runtime/actions/actionRunner.js";
import { withActionWrapper } from "../src/mutual/tools/wrapper.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("runAction returns an explicit timeout envelope and aborts the action signal", async () => {
  let actionSignal: AbortSignal | undefined;

  const result = await runAction({
    tool: "collect_logs",
    timeoutMs: 5,
    action: async (signal) => {
      actionSignal = signal;
      await sleep(50);
      return { status: "collected" };
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "timeout");
  assert.equal(result.timedOut, true);
  assert.equal(result.cancelled, true);
  assert.equal(result.timeoutMs, 5);
  assert.equal(actionSignal?.aborted, true);
});

test("runAction clears its timeout after a completed action", async () => {
  let actionSignal: AbortSignal | undefined;

  const result = await runAction({
    tool: "remember",
    timeoutMs: 5,
    action: (signal) => {
      actionSignal = signal;
      return { status: "remembered" };
    }
  });

  await sleep(15);

  assert.equal(result.ok, true);
  assert.equal(result.status, "completed");
  assert.equal(actionSignal?.aborted, false);
});

test("withActionWrapper exposes timeout fields as transcript-safe tool result data", async () => {
  const result = await withActionWrapper(
    async () => {
      await sleep(50);
      return { status: "done" };
    },
    { tool: "wait", timeoutMs: 5 }
  );

  assert.equal(result.tool, "wait");
  assert.equal(result.ok, false);
  assert.equal(result.status, "timeout");
  assert.equal(result.timedOut, true);
  assert.equal(result.cancelled, true);
  assert.equal(result.timeoutMs, 5);
  assert.match(String(result.message), /timed out/);
});
