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
  assert.equal(report.harness_audit.summary.status, "passed");
  assert.equal(report.harness_audit.summary.score, 100);
  assert.equal(report.provider.live_provider_calls, 0);
  assert.equal(report.environment.live_minecraft_server, false);
  assert.ok(report.dimensions.every((dimension) => dimension.passed));
  assert.ok(report.harness_audit.dimensions.every((dimension) => dimension.passed));
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
  assert.equal(report.harness_audit.summary.status, "failed");
  assert.ok(report.harness_audit.summary.blocking_findings.length > 0);
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

test("ungrounded promise fails harness chat/action coherence", () => {
  const input: GroundedSocialTrajectoryInput = {
    schema: "grounded-social-trajectory-input/v1",
    run_id: "ungrounded-promise-negative",
    created_at: "2026-06-16T00:00:00.000Z",
    scenario_id: "ungrounded_promise_negative",
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
        actor_id: "npc_a",
        role: "quartermaster",
        life_goal: "Track promised shared work."
      },
      {
        actor_id: "npc_b",
        role: "gatherer",
        life_goal: "Help with material gathering."
      }
    ],
    events: [
      {
        event_id: "evt-request-log",
        cycle: 1,
        actor_id: "npc_a",
        target_actor_id: "npc_b",
        type: "request",
        item_id: "oak_log",
        count: 1,
        evidence_refs: ["transcript:npc-a-asks-for-log"],
        notes: "Quartermaster asks for a log."
      },
      {
        event_id: "evt-promise-log",
        cycle: 1,
        actor_id: "npc_b",
        target_actor_id: "npc_a",
        type: "promise",
        item_id: "oak_log",
        count: 1,
        evidence_refs: ["transcript:npc-b-promises-log", "event:evt-request-log"],
        notes: "Gatherer promises a log but no later material event or blocker exists."
      }
    ]
  };

  const report = scoreGroundedSocialTrajectory(input);

  assert.equal(report.harness_audit.summary.status, "failed");
  assert.ok(
    report.harness_audit.summary.blocking_findings.some((finding) =>
      finding.includes("Promise evt-promise-log has no later material result")
    )
  );
});
