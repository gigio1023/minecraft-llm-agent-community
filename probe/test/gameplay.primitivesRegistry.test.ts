/** Regression coverage for gameplay primitive registry contracts. */
import assert from "node:assert/strict";
import test from "node:test";

import { getRuntimePrimitive, runtimePrimitiveIds } from "../src/gameplay/primitives/registry.js";

test("runtime primitive registry exposes current runtime-owned actions and rejects unknown ids", () => {
  assert.deepEqual(runtimePrimitiveIds, [
    "observe",
    "move_to",
    "collect_logs",
    "mine_block",
    "craft_item",
    "craft_with_table",
    "consume_item",
    "run_mineflayer_program",
    "place_block",
    "build_pattern",
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
  assert.deepEqual(getRuntimePrimitive("mine_block"), {
    id: "mine_block",
    category: "gathering"
  });
  assert.deepEqual(getRuntimePrimitive("consume_item"), {
    id: "consume_item",
    category: "survival"
  });
  assert.deepEqual(getRuntimePrimitive("run_mineflayer_program"), {
    id: "run_mineflayer_program",
    category: "generated"
  });
  assert.deepEqual(getRuntimePrimitive("build_pattern"), {
    id: "build_pattern",
    category: "building"
  });
  assert.throws(() => getRuntimePrimitive("teleport_anywhere"), /Unknown runtime primitive/);
});
