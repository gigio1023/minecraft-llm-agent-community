import { test } from "node:test";
import assert from "node:assert/strict";

import { verifyStoneAxe } from "../src/objectives/directGeneratedRunner.js";

test("stone axe verifier accepts current-run inventory delta", () => {
  const result = verifyStoneAxe({
    objectiveId: "craft_current_run_stone_axe_1",
    preInventory: [],
    postInventory: [{ name: "stone_axe", count: 1 }]
  });

  assert.equal(result.verifierStatus, "passed");
  assert.equal(result.beforeCount, 0);
  assert.equal(result.afterCount, 1);
  assert.equal(result.delta, 1);
});

test("stone axe verifier rejects return-only success without inventory evidence", () => {
  const result = verifyStoneAxe({
    objectiveId: "craft_current_run_stone_axe_1",
    preInventory: [],
    postInventory: []
  });

  assert.equal(result.verifierStatus, "failed");
  assert.match(result.verifierReason, /stone_axe did not reach 1/);
});
