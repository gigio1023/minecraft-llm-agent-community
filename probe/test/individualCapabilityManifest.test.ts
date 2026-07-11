/** Contract tests for individual-capability-manifest/v1 loader and suite. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  loadIndividualCapabilityManifestFromFile,
  validateIndividualCapabilityManifest
} from "../src/benchmarks/capability/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "../benchmarks/capability/individual-capability-v1.json");
const fixturesDir = path.join(here, "../benchmarks/capability/fixtures");

function readFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

test("checked-in suite loads with collect_logs, craft_table, and place_table", () => {
  const manifest = loadIndividualCapabilityManifestFromFile(suitePath);
  assert.equal(manifest.schema, "individual-capability-manifest/v1");
  assert.equal(manifest.suite_id, "individual-capability-v1");
  assert.deepEqual(
    manifest.cases.map((capabilityCase) => capabilityCase.case_id),
    ["collect_logs", "craft_table", "place_table"]
  );

  for (const capabilityCase of manifest.cases) {
    assert.ok(capabilityCase.budgets.max_cycles > 0);
    assert.ok(capabilityCase.budgets.max_runtime_actions > 0);
    assert.ok(capabilityCase.budgets.max_wall_time_ms > 0);
    assert.ok(capabilityCase.target);
    assert.ok(Array.isArray(capabilityCase.milestones));
    assert.equal(
      "recommended_actions" in capabilityCase,
      false,
      `${capabilityCase.case_id} must not declare recommended_actions`
    );
    assert.equal(
      "action_order" in capabilityCase,
      false,
      `${capabilityCase.case_id} must not declare action_order`
    );
    assert.equal(
      "recipe_steps" in capabilityCase,
      false,
      `${capabilityCase.case_id} must not declare recipe_steps`
    );
  }
});

test("valid suite round-trips without injecting evaluation defaults", () => {
  const manifest = loadIndividualCapabilityManifestFromFile(suitePath);
  const again = validateIndividualCapabilityManifest(manifest);
  assert.equal(again.ok, true);
  if (!again.ok) {
    return;
  }
  assert.equal(again.manifest.cases.length, 3);
  assert.equal(again.manifest.cases[0]?.completion_policy.require_target, true);
});

test("invalid Minecraft id fixture fails before runtime work", () => {
  const result = validateIndividualCapabilityManifest(readFixture("invalid-minecraft-id.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("not_a_real_item_xyz")));
  assert.ok(result.errors.some((error) => /known Minecraft item or block/i.test(error)));
});

test("missing budget fixture fails loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("missing-budget.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("max_cycles")));
});

test("unknown predicate op fixture fails loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("unknown-predicate-op.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /known capability predicate op/i.test(error)));
});

test("strategy field fixture fails loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("strategy-fields.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("recommended_actions")));
  assert.ok(result.errors.some((error) => error.includes("action_order")));
});

test("loadIndividualCapabilityManifestFromFile throws on invalid fixture", () => {
  assert.throws(
    () =>
      loadIndividualCapabilityManifestFromFile(
        path.join(fixturesDir, "invalid-minecraft-id.json")
      ),
    /Invalid IndividualCapabilityManifest/
  );
});
