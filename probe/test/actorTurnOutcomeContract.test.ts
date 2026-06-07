/** Outcome-contract regressions for Actor Turn evidence classification. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateExpectedOutcomeAgainstDeltas,
  observedDeltasFromHelperEvents,
  observedDeltasFromToolStatuses
} from "../src/runtime/goals/actorEpisode/index.js";

test("physical expected outcomes are not satisfied by diagnostic-only evidence", () => {
  const evaluation = evaluateExpectedOutcomeAgainstDeltas({
    expectedOutcome: "world_block_delta",
    verifierStatus: "passed",
    observedDeltas: ["diagnostic_delta"]
  });

  assert.equal(evaluation.status, "unsatisfied");
  assert.equal(evaluation.outcome_override, "no_progress");
  assert.equal(evaluation.branch_recommended, true);
});

test("diagnostic unlocks are useful evidence but not physical progress", () => {
  const evaluation = evaluateExpectedOutcomeAgainstDeltas({
    expectedOutcome: "diagnostic_unlock",
    verifierStatus: "passed",
    observedDeltas: ["diagnostic_delta"]
  });

  assert.equal(evaluation.status, "diagnostic_only");
  assert.equal(evaluation.outcome_override, "no_progress");
  assert.equal(evaluation.branch_recommended, true);
});

test("structured primitive status maps physical evidence without prose parsing", () => {
  const deltas = observedDeltasFromToolStatuses([
    {
      tool: "build_pattern",
      status: "built"
    }
  ]);

  assert.deepEqual(deltas, ["world_block_delta"]);
});

test("equipment outcome is satisfied only by structured equipment evidence", () => {
  assert.deepEqual(
    observedDeltasFromToolStatuses([
      {
        tool: "equip_item",
        status: "equipped"
      }
    ]),
    ["equipment_delta"]
  );

  const evaluation = evaluateExpectedOutcomeAgainstDeltas({
    expectedOutcome: "equipment_delta",
    verifierStatus: "passed",
    observedDeltas: ["equipment_delta"]
  });

  assert.equal(evaluation.status, "satisfied");
  assert.equal(evaluation.branch_recommended, false);
});

test("generated helper events distinguish observe-only trials from block mutation", () => {
  assert.deepEqual(
    observedDeltasFromHelperEvents([
      { name: "observe", status: "completed", result: { status: "ok" } }
    ]),
    ["diagnostic_delta"]
  );

  assert.deepEqual(
    observedDeltasFromHelperEvents([
      { name: "placeBlock", status: "completed", result: { status: "placed" } }
    ]),
    ["world_block_delta"]
  );
});
