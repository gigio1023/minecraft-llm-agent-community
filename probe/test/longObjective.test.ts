import { test } from "node:test";
import assert from "node:assert/strict";

import { getLongObjectivePhaseLadder } from "../src/objectives/longObjective/ladder.js";
import { buildLongObjectiveReviewerTasks } from "../src/objectives/longObjective/reviewer.js";
import { verifyInventoryPhase, verifyDiamondOreObservation } from "../src/objectives/longObjective/verifiers.js";
import { classifyGeminiError, GeminiPlannerError } from "../src/provider/gemini/errors.js";
import { getLongPhaseDefinition } from "../src/objectives/longObjective/ladder.js";

test("stone pickaxe ladder includes sanity and target phases", () => {
  const ladder = getLongObjectivePhaseLadder("craft_current_run_stone_pickaxe_1");
  assert.equal(ladder.length, 2);
  assert.equal(ladder[0]?.phaseId, "craft_current_run_stone_axe_1");
  assert.equal(ladder[1]?.phaseId, "craft_current_run_stone_pickaxe_1");
});

test("inventory verifier accepts current-run stone pickaxe", () => {
  const phase = getLongPhaseDefinition("craft_current_run_stone_pickaxe_1");
  const result = verifyInventoryPhase({
    phase,
    preInventory: [],
    postInventory: [{ name: "stone_pickaxe", count: 1 }]
  });
  assert.equal(result.verifierStatus, "passed");
});

test("diamond ore locator accepts nearby scan evidence", () => {
  const phase = getLongPhaseDefinition("locate_current_run_diamond_ore_1");
  const result = verifyDiamondOreObservation({
    phase,
    preInventory: [],
    postInventory: [],
    blockObservations: [{ name: "diamond_ore", distance: 3.2 }],
    helperEvents: []
  });
  assert.equal(result.verifierStatus, "passed");
});

test("reviewer tasks call out missing smelt helper", () => {
  const report = {
    schema: "long-objective-report/v1" as const,
    runId: "test",
    objectiveId: "obtain_current_run_iron_ingot_1" as const,
    actorId: "npc_b",
    providerId: "gemini-live-planner",
    evidenceScope: "current_run" as const,
    status: "failed" as const,
    stopReason: "missing_helper" as const,
    phases: [
      {
        phaseId: "obtain_current_run_iron_ingot_1",
        summary: "iron",
        status: "failed" as const,
        verifierStatus: "failed" as const,
        verifierReason: "no iron",
        generated: {
          providerId: "gemini-live-planner",
          model: "gemini-2.5-flash",
          execution: {
            status: "completed" as const,
            actorId: "npc_b",
            skillName: "obtain_current_run_iron_ingot_1",
            helperEvents: [
              {
                name: "smeltItem",
                args: ["raw_iron", "iron_ingot", 1],
                status: "completed",
                result: {
                  status: "blocked",
                  reason: "smeltItem runtime substrate is not wired to furnace interaction yet"
                }
              }
            ],
            durationMs: 1,
            timeoutMs: 1000
          }
        },
        evidence: {
          preInventory: [],
          postInventory: [],
          itemName: "iron_ingot",
          beforeCount: 0,
          afterCount: 0,
          delta: 0
        },
        helperEvents: [
          {
            name: "smeltItem",
            args: ["raw_iron", "iron_ingot", 1],
            status: "completed",
            result: {
              status: "blocked",
              reason: "smeltItem runtime substrate is not wired to furnace interaction yet"
            }
          }
        ]
      }
    ],
    artifactRefs: { actorWorkspaceTrialPath: "/tmp/report.json" },
    nextImplementationTasks: []
  };

  const tasks = buildLongObjectiveReviewerTasks(report as import("../src/objectives/longObjective/types.js").LongObjectiveReport);
  assert.ok(tasks.some((task) => /smeltItem|missing helper/i.test(task)));
});

test("gemini error classifier marks quota and rate limits retryable", () => {
  const error = classifyGeminiError(
    Object.assign(new Error("rate limit exceeded"), { status: 429 })
  );
  assert.equal(error.kind, "rate_limited");
  assert.equal(error.retryable, true);
});
