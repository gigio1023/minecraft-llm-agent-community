/** Contract tests for goal-continuity-manifest/v1 loader. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  loadGoalContinuityManifestFromFile,
  validateGoalContinuityManifest
} from "../src/benchmarks/continuity/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "../benchmarks/continuity/goal-continuity-v1.json");
const fixturesDir = path.join(here, "../benchmarks/continuity/fixtures");

function readFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

test("checked-in goal-continuity suite loads", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  assert.equal(manifest.schema, "goal-continuity-manifest/v1");
  assert.equal(manifest.suite_id, "goal-continuity-v1");
  assert.equal(manifest.version, "1.0.0");
  assert.equal(manifest.cases.length, 1);
  const only = manifest.cases[0];
  assert.ok(only);
  assert.equal(only.case_id, "interrupt_and_resume_open_work");
  assert.ok(only.observable_lifecycle_events.includes("resume"));
  assert.equal(only.physical_target?.op, "item_count_gte");
  assert.equal("expected_plan_bead_title" in only, false);
  assert.equal("correct_intermediate_goals" in only, false);
});

test("valid suite round-trips without injecting evaluation defaults", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  const again = validateGoalContinuityManifest(manifest);
  assert.equal(again.ok, true);
  if (!again.ok) {
    return;
  }
  assert.equal(again.manifest.cases[0]?.open_work_expectation.kind, "any_open_work");
});

test("prescribed PlanBead title fixture fails loader validation", () => {
  const result = validateGoalContinuityManifest(readFixture("prescribed-planbead-title.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(
    result.errors.some((error) =>
      /expected_plan_bead_title.*forbidden|prescribed PlanBead/i.test(error)
    )
  );
});

test("unknown keys are rejected recursively", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  const mutated = structuredClone(manifest) as Record<string, unknown>;
  const cases = mutated.cases as Array<Record<string, unknown>>;
  cases[0]!.strategy_hint = "gather oak first";
  const result = validateGoalContinuityManifest(mutated);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("strategy_hint")));
});

test("memory evidence kind is rejected for physical side", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  const mutated = structuredClone(manifest) as {
    cases: Array<{ allowed_physical_evidence_kinds: string[] }>;
  };
  mutated.cases[0]!.allowed_physical_evidence_kinds = ["memory", "inventory"];
  const result = validateGoalContinuityManifest(mutated);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /memory.*cannot decide physical/i.test(error)));
});
