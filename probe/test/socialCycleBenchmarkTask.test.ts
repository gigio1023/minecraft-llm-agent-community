import assert from "node:assert/strict";
import test from "node:test";

import { benchmarkTaskEvidenceRequirements } from "../src/runtime/socialCycleRunner.js";

test("benchmark task evidence requirements are target-generic", () => {
  const requirements = benchmarkTaskEvidenceRequirements();
  const text = requirements.join("\n");

  assert.ok(text.includes("benchmark target evidence"));
  assert.ok(text.includes("partial credit"));
  assert.equal(text.includes("wooden_pickaxe"), false);
  assert.equal(text.includes("crafting_table"), false);
});
