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

const EXPECTED_CASE_IDS = [
  "delayed_progress_dependency_chain",
  "interrupt_and_resume_open_work",
  "restart_compaction_preserves_work"
] as const;

function readFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

test("checked-in goal-continuity suite loads", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  assert.equal(manifest.schema, "goal-continuity-manifest/v1");
  assert.equal(manifest.suite_id, "goal-continuity-v1");
  assert.equal(manifest.version, "1.1.0");
  assert.equal(manifest.cases.length, 3);
  assert.match(manifest.description, /LIVE EXECUTION BLOCKED/i);
  assert.deepEqual(
    manifest.cases.map((entry) => entry.case_id),
    [...EXPECTED_CASE_IDS]
  );

  const delayed = manifest.cases[0]!;
  assert.equal(delayed.open_work_expectation.kind, "dependency_chain");
  assert.equal(delayed.interruption?.kind, "evidence_change");
  assert.ok((delayed.physical_milestones?.length ?? 0) >= 3);
  assert.equal(delayed.physical_target?.op, "block_observed_at");

  const interrupt = manifest.cases[1]!;
  assert.equal(interrupt.case_id, "interrupt_and_resume_open_work");
  assert.equal(interrupt.interruption?.kind, "new_concern");
  assert.ok(interrupt.observable_lifecycle_events.includes("resume"));
  assert.ok(interrupt.observable_lifecycle_events.includes("supersede"));
  assert.equal(interrupt.physical_target?.op, "item_count_gte");

  const restart = manifest.cases[2]!;
  assert.equal(restart.interruption?.kind, "process_restart");
  assert.equal(restart.restart_checkpoint?.required, true);
  assert.match(restart.restart_checkpoint?.description ?? "", /LIVE EXECUTION BLOCKED/i);
  assert.ok(restart.observable_lifecycle_events.includes("reopen"));

  for (const continuityCase of manifest.cases) {
    assert.equal("expected_plan_bead_title" in continuityCase, false);
    assert.equal("correct_intermediate_goals" in continuityCase, false);
  }
});

test("valid suite round-trips without injecting evaluation defaults", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  const again = validateGoalContinuityManifest(manifest);
  assert.equal(again.ok, true);
  if (!again.ok) {
    return;
  }
  assert.equal(again.manifest.cases.length, 3);
  assert.equal(again.manifest.cases[0]?.open_work_expectation.kind, "dependency_chain");
  assert.equal(again.manifest.cases[1]?.open_work_expectation.kind, "any_open_work");
  assert.equal(again.manifest.cases[2]?.restart_checkpoint?.required, true);
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
