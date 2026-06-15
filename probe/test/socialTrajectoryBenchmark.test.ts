import assert from "node:assert/strict";
import test from "node:test";

import { buildGroundedSocialSticksFixture } from "../src/objectives/socialTrajectory/fixtures.js";
import { scoreGroundedSocialTrajectory } from "../src/objectives/socialTrajectory/scorer.js";
import type { GroundedSocialTrajectoryInput } from "../src/objectives/socialTrajectory/types.js";

test("grounded social trajectory fixture passes with evidence-backed social chain", () => {
  const input = buildGroundedSocialSticksFixture("2026-06-15T00:00:00.000Z");
  const report = scoreGroundedSocialTrajectory(input);

  assert.equal(report.summary.status, "passed");
  assert.equal(report.summary.score, 100);
  assert.equal(report.provider.live_provider_calls, 0);
  assert.equal(report.environment.live_minecraft_server, false);
  assert.ok(report.dimensions.every((dimension) => dimension.passed));
});

test("private craft without shared contribution does not pass as social simulation", () => {
  const input: GroundedSocialTrajectoryInput = {
    schema: "grounded-social-trajectory-input/v1",
    run_id: "private-craft-negative",
    created_at: "2026-06-15T00:00:00.000Z",
    scenario_id: "private_craft_negative",
    provider: {
      id: "deterministic",
      model: "provider-free-fixture",
      live_provider_calls: 0
    },
    environment: {
      live_minecraft_server: false
    },
    actors: [
      {
        actor_id: "npc_c",
        role: "crafter",
        life_goal: "Craft useful items."
      }
    ],
    events: [
      {
        event_id: "evt-private-craft",
        cycle: 1,
        actor_id: "npc_c",
        type: "craft",
        item_id: "stick",
        count: 4,
        evidence_refs: ["inventory:npc-c-plus-stick-4"],
        notes: "A private craft is physical progress but not a grounded social trajectory."
      }
    ]
  };

  const report = scoreGroundedSocialTrajectory(input);

  assert.notEqual(report.summary.status, "passed");
  assert.ok(report.summary.score < 80);
  assert.equal(
    report.dimensions.find((dimension) => dimension.id === "physical_contribution")?.score,
    0
  );
  assert.equal(
    report.dimensions.find((dimension) => dimension.id === "cross_actor_consumption")?.score,
    0
  );
});
