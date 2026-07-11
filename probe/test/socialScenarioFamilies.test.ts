/** Contract tests for Slice C2 interdependent scenario families. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadIndividualCapabilityManifestFromFile } from "../src/benchmarks/capability/index.js";
import {
  SOCIAL_INTERACTION_OPPORTUNITY_OBSERVATIONS,
  SOCIAL_SCENARIO_FAMILY_ENTRIES,
  hashSocialScenarioFamilies,
  loadAllSocialScenarioFamilies,
  validateInterdependentSocialScenario
} from "../src/benchmarks/social/index.js";
import type { SocialActivityKindV1 } from "../src/benchmarks/social/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const capabilitySuitePath = path.join(
  here,
  "../benchmarks/capability/individual-capability-v1.json"
);
const scenariosDir = path.join(here, "../benchmarks/social/scenarios");

const FORBIDDEN_PRESCRIPTION_KEYS = [
  "prescribed_trust",
  "expected_trust",
  "prescribed_cooperation",
  "expected_cooperation",
  "prescribed_refusal",
  "expected_refusal",
  "prescribed_specialization",
  "expected_specialization",
  "prescribed_partner",
  "expected_partner",
  "partner_choice",
  "prescribed_promises",
  "expected_promises",
  "relationship_label",
  "expected_relationship",
  "prescribed_relationship",
  "social_outcome",
  "expected_social_outcome",
  "prescribed_social_outcome",
  "recommended_actions",
  "action_order",
  "action_plan",
  "hidden_action_plan",
  "parameter_suggestions",
  "suggested_parameters",
  "division_of_labor",
  "required_response"
] as const;

function knownCapabilityCaseIds(): string[] {
  const manifest = loadIndividualCapabilityManifestFromFile(capabilitySuitePath);
  return manifest.cases.map((capabilityCase) => capabilityCase.case_id);
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectObjectKeys(entry, keys);
    }
    return keys;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      keys.add(key);
      collectObjectKeys(child, keys);
    }
  }
  return keys;
}

test("C2 family index lists economic, cooperative, and quest scenarios", () => {
  assert.equal(SOCIAL_SCENARIO_FAMILY_ENTRIES.length, 3);
  assert.deepEqual(
    SOCIAL_SCENARIO_FAMILY_ENTRIES.map((entry) => entry.family),
    ["economic", "cooperative", "quest"]
  );
  assert.deepEqual(
    SOCIAL_SCENARIO_FAMILY_ENTRIES.map((entry) => entry.scenario_id),
    [
      "economic-resource-asymmetry-v1",
      "cooperative-shared-construction-v1",
      "multi-activity-quest-v1"
    ]
  );
});

test("all three C2 family scenarios load through the C1 loader", () => {
  const known = knownCapabilityCaseIds();
  const loaded = loadAllSocialScenarioFamilies({ knownCapabilityCaseIds: known });
  assert.equal(loaded.length, 3);

  for (const entry of loaded) {
    assert.equal(entry.scenario.schema, "interdependent-social-scenario/v1");
    assert.equal(entry.scenario.scenario_id, entry.scenario_id);
    assert.equal(entry.scenario.social_response_prescribed, false);
    assert.equal(entry.scenario.fixture_progress_credited_to_actors, false);
    assert.ok(entry.scenario.actor_count >= 2 && entry.scenario.actor_count <= 3);
    assert.equal(entry.scenario.actor_profiles.length, entry.scenario.actor_count);
    assert.equal(entry.scenario.response_window.require_subsequent_actor_turn, true);
    assert.ok(entry.declaration_hash.match(/^[a-f0-9]{64}$/));

    const kinds = new Set(
      entry.scenario.activity_graph.nodes.map((node) => node.kind as SocialActivityKindV1)
    );
    assert.ok(
      kinds.has(entry.primary_activity_kind),
      `${entry.scenario_id} must include primary kind ${entry.primary_activity_kind}`
    );

    for (const capability of entry.scenario.required_capabilities) {
      assert.ok(
        capability.evidence_status === "resolved" || capability.evidence_status === "declared_gap"
      );
      if (capability.evidence_status === "resolved") {
        assert.ok(capability.evidence_ref.length > 0);
        assert.ok(known.includes(capability.capability_case_id));
      } else {
        assert.ok(capability.gap_reason.length > 0);
      }
    }
  }

  const actorCounts = Object.fromEntries(
    loaded.map((entry) => [entry.scenario_id, entry.scenario.actor_count])
  );
  assert.equal(actorCounts["economic-resource-asymmetry-v1"], 2);
  assert.equal(actorCounts["cooperative-shared-construction-v1"], 2);
  assert.equal(actorCounts["multi-activity-quest-v1"], 3);
});

test("C2 family JSON files contain no prescribed social fields", () => {
  for (const entry of SOCIAL_SCENARIO_FAMILY_ENTRIES) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(scenariosDir, path.basename(entry.relative_path)), "utf8")
    ) as unknown;
    const keys = collectObjectKeys(raw);
    for (const forbidden of FORBIDDEN_PRESCRIPTION_KEYS) {
      assert.equal(
        keys.has(forbidden),
        false,
        `${entry.scenario_id} must not contain forbidden key '${forbidden}'`
      );
    }
    assert.equal(
      (raw as { social_response_prescribed: unknown }).social_response_prescribed,
      false
    );
  }
});

test("injecting a prescribed social field into a C2 family fails validation", () => {
  const known = knownCapabilityCaseIds();
  const [economic] = loadAllSocialScenarioFamilies({ knownCapabilityCaseIds: known });
  const poisoned = {
    ...economic.scenario,
    expected_cooperation: true,
    social_outcome: "actors_must_partner",
    division_of_labor: { actor_a: "gather", actor_b: "craft" }
  };
  const result = validateInterdependentSocialScenario(poisoned, {
    knownCapabilityCaseIds: known
  });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.errors.some((error) => /expected_cooperation|forbidden/i.test(error)));
  assert.ok(result.errors.some((error) => /social_outcome|forbidden/i.test(error)));
  assert.ok(result.errors.some((error) => /division_of_labor|forbidden/i.test(error)));
});

test("family hash list is complete and deterministic", () => {
  const known = knownCapabilityCaseIds();
  const first = hashSocialScenarioFamilies({ knownCapabilityCaseIds: known });
  const second = hashSocialScenarioFamilies({ knownCapabilityCaseIds: known });
  assert.deepEqual(Object.keys(first).sort(), [
    "cooperative-shared-construction-v1",
    "economic-resource-asymmetry-v1",
    "multi-activity-quest-v1"
  ]);
  assert.deepEqual(first, second);
});

test("opportunity observation enum covers C2 report distinctions", () => {
  assert.deepEqual([...SOCIAL_INTERACTION_OPPORTUNITY_OBSERVATIONS], [
    "opportunity_absent",
    "opportunity_present_ignored",
    "refused",
    "attempted",
    "runtime_execution_failed",
    "material_handoff_verified",
    "no_subsequent_response"
  ]);
});
