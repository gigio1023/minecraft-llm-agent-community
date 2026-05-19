import assert from "node:assert/strict";
import test from "node:test";

import { getRuntimePrimitive, runtimePrimitiveIds } from "../src/gameplay/primitives/registry.js";

test("runtime primitive registry exposes current runtime-owned actions and rejects unknown ids", () => {
  assert.deepEqual(runtimePrimitiveIds, [
    "observe",
    "move_to",
    "collect_logs",
    "craft_item",
    "inspect_chest",
    "deposit_shared",
    "withdraw_shared",
    "say",
    "wait",
    "remember"
  ]);
  assert.deepEqual(getRuntimePrimitive("move_to"), {
    id: "move_to",
    category: "movement"
  });
  assert.throws(() => getRuntimePrimitive("mine_block"), /Unknown runtime primitive/);
});
