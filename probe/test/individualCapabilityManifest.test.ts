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

test("checked-in suite loads with A4 individual capability cases", () => {
  const manifest = loadIndividualCapabilityManifestFromFile(suitePath);
  assert.equal(manifest.schema, "individual-capability-manifest/v1");
  assert.equal(manifest.suite_id, "individual-capability-v1");
  assert.equal(manifest.version, "1.1.0");
  assert.deepEqual(
    manifest.cases.map((capabilityCase) => capabilityCase.case_id),
    [
      "collect_logs",
      "craft_planks_sticks",
      "craft_table",
      "place_table",
      "craft_wooden_pickaxe",
      "mine_cobblestone",
      "contribute_shared_chest",
      "acquire_diamond_pickaxe_infeasible"
    ]
  );

  const collectLogs = manifest.cases.find((capabilityCase) => capabilityCase.case_id === "collect_logs");
  assert.ok(collectLogs);
  assert.equal(collectLogs.target.op, "any");
  if (collectLogs.target.op === "any") {
    const items = collectLogs.target.children
      .filter((child) => child.op === "item_count_gte")
      .map((child) => (child.op === "item_count_gte" ? child.item : ""));
    assert.ok(items.includes("pale_oak_log"));
  }

  for (const capabilityCase of manifest.cases) {
    assert.ok(Number.isInteger(capabilityCase.budgets.max_cycles));
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
  assert.equal(again.manifest.cases.length, 8);
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
  assert.ok(result.errors.some((error) => /recommended_actions|not an allowed key/i.test(error)));
  assert.ok(result.errors.some((error) => /action_order|not an allowed key/i.test(error)));
});

test("nested unknown keys and coordinates fail closed", () => {
  const result = validateIndividualCapabilityManifest(readFixture("nested-unknown-keys.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("actor_coordinates")));
  assert.ok(result.errors.some((error) => error.includes("strategy")));
});

test("fractional budgets fail loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("fractional-budgets.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("max_cycles") && error.includes("positive integer")));
  assert.ok(
    result.errors.some((error) => error.includes("max_runtime_actions") && error.includes("positive integer"))
  );
});

test("invalid evidence kinds including provider_rationale fail loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("invalid-evidence-kinds.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("provider_rationale")));
  assert.ok(result.errors.some((error) => error.includes("screenshot")));
});

test("inconsistent fresh seed policy fails loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("inconsistent-seed-policy.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /seeds must not be present when kind is 'fresh'/i.test(error)));
});

test("duplicate case and milestone ids fail loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("duplicate-ids.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /duplicate case_id/i.test(error)));
  assert.ok(result.errors.some((error) => /duplicate milestone_id/i.test(error)));
});

test("required_capabilities cycles fail loader validation", () => {
  const result = validateIndividualCapabilityManifest(readFixture("dependency-cycle.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /cycle/i.test(error)));
});

test("evidence_kind_seen predicate op is rejected by the loader", () => {
  const result = validateIndividualCapabilityManifest(readFixture("evidence-kind-seen-op.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /known capability predicate op/i.test(error)));
});

test("reviewed handoff counterexample fails closed end-to-end", () => {
  const counterexample = {
    schema: "individual-capability-manifest/v1",
    suite_id: "handoff-counterexample",
    version: "1.0.0",
    description: "Inline counterexample from A1R review findings.",
    cases: [
      {
        case_id: "bad",
        title: "Bad",
        top_level_goal: "Should never load.",
        world_scenario_id: "natural-safe-spawn-v1",
        fixture_class: "natural_world",
        required_capabilities: [],
        budgets: {
          max_cycles: 0.5,
          max_runtime_actions: 0.5,
          max_wall_time_ms: 1
        },
        target: {
          op: "item_count_gte",
          item: "oak_log",
          count: 1,
          owner: "actor",
          actor_coordinates: { x: 1, y: 2, z: 3 }
        },
        milestones: [],
        allowed_evidence_kinds: ["provider_rationale"],
        seed_policy: {
          kind: "fresh",
          seeds: ["hidden-seed"],
          repeats: 1
        },
        strategy: { action_order: ["mine", "craft"] },
        completion_policy: {
          require_target: true,
          partial_credit: "none"
        }
      }
    ]
  };

  const result = validateIndividualCapabilityManifest(counterexample);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => error.includes("max_cycles")));
  assert.ok(result.errors.some((error) => error.includes("actor_coordinates")));
  assert.ok(result.errors.some((error) => error.includes("provider_rationale")));
  assert.ok(result.errors.some((error) => /seeds must not be present when kind is 'fresh'/i.test(error)));
  assert.ok(result.errors.some((error) => error.includes("strategy")));
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
