/** Contract tests for interdependent-social-scenario/v1 loader and example. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadIndividualCapabilityManifestFromFile } from "../src/benchmarks/capability/index.js";
import {
  hashInterdependentSocialScenario,
  loadInterdependentSocialScenarioFromFile,
  stableJsonStringify,
  validateInterdependentSocialScenario
} from "../src/benchmarks/social/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const scenarioPath = path.join(here, "../benchmarks/social/interdependent-social-v1.json");
const fixturesDir = path.join(here, "../benchmarks/social/fixtures");
const capabilitySuitePath = path.join(
  here,
  "../benchmarks/capability/individual-capability-v1.json"
);

function readFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

function knownCapabilityCaseIds(): string[] {
  const manifest = loadIndividualCapabilityManifestFromFile(capabilitySuitePath);
  return manifest.cases.map((capabilityCase) => capabilityCase.case_id);
}

test("checked-in minimal scenario loads with C1 declaration fields", () => {
  const scenario = loadInterdependentSocialScenarioFromFile(scenarioPath, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });

  assert.equal(scenario.schema, "interdependent-social-scenario/v1");
  assert.equal(scenario.scenario_id, "asymmetric-tool-access-minimal-v1");
  assert.equal(scenario.actor_count, 2);
  assert.equal(scenario.actor_profiles.length, 2);
  assert.equal(scenario.role_assignment_mode, "unassigned");
  assert.equal(scenario.fixture_class, "natural_world");
  assert.equal(scenario.fixture_progress_credited_to_actors, false);
  assert.equal(scenario.social_response_prescribed, false);
  assert.equal(scenario.model_assignment.comparable_capability, true);
  assert.ok(scenario.asymmetries.length >= 1);
  assert.ok(scenario.activity_graph.nodes.length >= 1);
  assert.ok(scenario.interaction_opportunities.length >= 1);
  assert.ok(scenario.material_stakes.length >= 1);
  assert.equal(scenario.response_window.require_subsequent_actor_turn, true);
  assert.equal(scenario.visual.pixels_are_review_only, true);
  assert.ok(scenario.provenance.source_ref.length > 0);

  const resolved = scenario.required_capabilities.find(
    (entry) => entry.evidence_status === "resolved"
  );
  const gap = scenario.required_capabilities.find(
    (entry) => entry.evidence_status === "declared_gap"
  );
  assert.ok(resolved);
  assert.ok(gap);
  assert.equal(
    "recommended_actions" in scenario,
    false,
    "scenario must not declare recommended_actions"
  );
  assert.equal("social_outcome" in scenario, false, "scenario must not declare social_outcome");
});

test("valid scenario round-trips without injecting defaults", () => {
  const scenario = loadInterdependentSocialScenarioFromFile(scenarioPath, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  const again = validateInterdependentSocialScenario(scenario, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(again.ok, true);
  if (!again.ok) {
    return;
  }
  assert.equal(again.scenario.scenario_id, scenario.scenario_id);
  assert.equal(again.scenario.budgets.max_cycles, scenario.budgets.max_cycles);
});

test("scenario hash is deterministic across key order", () => {
  const scenario = loadInterdependentSocialScenarioFromFile(scenarioPath, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  const first = hashInterdependentSocialScenario(scenario);
  const reordered = JSON.parse(stableJsonStringify(scenario)) as typeof scenario;
  const second = hashInterdependentSocialScenario(reordered);
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);

  const third = hashInterdependentSocialScenario(scenario);
  assert.equal(first, third);
});

test("prescribed social outcome fixture fails loader validation", () => {
  const result = validateInterdependentSocialScenario(readFixture("prescribed-social-outcome.json"), {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /expected_cooperation|forbidden/i.test(error)));
  assert.ok(result.errors.some((error) => /social_outcome|forbidden/i.test(error)));
});

test("hidden action plan fixture fails loader validation", () => {
  const result = validateInterdependentSocialScenario(readFixture("hidden-action-plan.json"), {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /recommended_actions|forbidden/i.test(error)));
  assert.ok(result.errors.some((error) => /parameter_suggestions|forbidden/i.test(error)));
});

test("relationship and promise fields fail loader validation", () => {
  const result = validateInterdependentSocialScenario(
    readFixture("relationship-promise-fields.json"),
    { knownCapabilityCaseIds: knownCapabilityCaseIds() }
  );
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /relationship_label|forbidden/i.test(error)));
  assert.ok(result.errors.some((error) => /prescribed_partner|forbidden/i.test(error)));
  assert.ok(result.errors.some((error) => /expected_promises|forbidden/i.test(error)));
});

test("unresolved capability ref fails when known cases are supplied", () => {
  const result = validateInterdependentSocialScenario(readFixture("unresolved-capability.json"), {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(
    result.errors.some((error) =>
      /does not resolve|declared_gap|not_a_real_capability_case/i.test(error)
    )
  );
});

test("missing capability evidence status fails loader validation", () => {
  const result = validateInterdependentSocialScenario(
    readFixture("missing-capability-status.json"),
    { knownCapabilityCaseIds: knownCapabilityCaseIds() }
  );
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(
    result.errors.some((error) => /evidence_status|resolved|declared_gap/i.test(error))
  );
});

test("fixture progress credited to actors fails loader validation", () => {
  const result = validateInterdependentSocialScenario(
    readFixture("fixture-credited-to-actors.json"),
    { knownCapabilityCaseIds: knownCapabilityCaseIds() }
  );
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(
    result.errors.some((error) =>
      error.includes("fixture_progress_credited_to_actors") && error.includes("must be false")
    )
  );
});

test("actor count mismatch fails loader validation", () => {
  const result = validateInterdependentSocialScenario(readFixture("actor-count-mismatch.json"), {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /actor_count.*actor_profiles\.length/i.test(error)));
});

test("assigned role mode without setup role fails loader validation", () => {
  const result = validateInterdependentSocialScenario(
    readFixture("assigned-role-missing-label.json"),
    { knownCapabilityCaseIds: knownCapabilityCaseIds() }
  );
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /assigned_setup_role/i.test(error)));
});

test("assigned, negotiable, and unassigned roles are distinct", () => {
  const base = loadInterdependentSocialScenarioFromFile(scenarioPath, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });

  const assigned = {
    ...base,
    role_assignment_mode: "assigned" as const,
    actor_profiles: base.actor_profiles.map((profile, index) => ({
      ...profile,
      assigned_setup_role: index === 0 ? "tool_holder_setup" : "gatherer_setup"
    }))
  };
  const assignedResult = validateInterdependentSocialScenario(assigned, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(assignedResult.ok, true);

  const negotiable = {
    ...base,
    role_assignment_mode: "negotiable" as const,
    actor_profiles: base.actor_profiles.map(({ actor_id, profile_ref }) => ({
      actor_id,
      profile_ref
    }))
  };
  const negotiableResult = validateInterdependentSocialScenario(negotiable, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(negotiableResult.ok, true);

  const unassignedWithRole = {
    ...base,
    role_assignment_mode: "unassigned" as const,
    actor_profiles: base.actor_profiles.map((profile) => ({
      ...profile,
      assigned_setup_role: "should_not_appear"
    }))
  };
  const unassignedResult = validateInterdependentSocialScenario(unassignedWithRole, {
    knownCapabilityCaseIds: knownCapabilityCaseIds()
  });
  assert.equal(unassignedResult.ok, false);
});
