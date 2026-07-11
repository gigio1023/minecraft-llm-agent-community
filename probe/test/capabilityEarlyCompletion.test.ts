/**
 * Provider-free early completion: target evidence stops before the next action
 * (and therefore before the next cycle) and records first progress /
 * target-completion usage. No live provider calls.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateCapabilityCaseProgress,
  runCapabilityCase,
  type IndividualCapabilityCaseV1,
  type IndividualCapabilityReportV1
} from "../src/benchmarks/capability/index.js";
import type {
  CapabilityProgressSummary,
  SocialCycleRunReport
} from "../src/runtime/goals/types.js";
import { runSocialCycle } from "../src/runtime/socialCycleRunner.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const probeRoot = path.resolve(here, "..");
const repoRoot = path.resolve(probeRoot, "..");
const actorId = "npc_b";
const manifestPath = path.join(
  probeRoot,
  "benchmarks/capability/individual-capability-v1.json"
);

function baseCase(partial: Partial<IndividualCapabilityCaseV1> = {}): IndividualCapabilityCaseV1 {
  return {
    case_id: "collect_logs",
    title: "Collect logs",
    top_level_goal: "Gather at least one oak log.",
    world_scenario_id: "natural-safe-spawn-v1",
    fixture_class: "natural_world",
    required_capabilities: [],
    budgets: {
      max_cycles: 20,
      max_runtime_actions: 40,
      max_wall_time_ms: 600000
    },
    target: { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    milestones: [
      {
        milestone_id: "any_log_inventory",
        title: "Any oak log present",
        predicate: { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
        order: 1,
        weight: 1
      },
      {
        milestone_id: "two_logs",
        title: "Two oak logs",
        predicate: { op: "item_count_gte", item: "oak_log", count: 2, owner: "actor" },
        order: 2,
        weight: 1
      }
    ],
    allowed_evidence_kinds: ["inventory", "tool_attempt", "settlement"],
    seed_policy: { kind: "fixed", seeds: ["natural-safe-spawn-v1"], repeats: 1 },
    completion_policy: { require_target: true, partial_credit: "milestones" },
    ...partial
  };
}

function baseReport(partial: Partial<SocialCycleRunReport> = {}): SocialCycleRunReport {
  return {
    schema: "social-cycle-run-report/v1",
    run_id: "capability-early-completion-fixture",
    actor_id: actorId,
    provider: {
      provider_id: "deterministic-social",
      model: "deterministic-social",
      reasoning: "low"
    },
    runtime_status: "passed",
    agency_status: {
      life_goal_source: "actor_soul",
      strategic_goal_source: "llm_planner",
      cycle_goal_source: "llm_planner",
      used_soul: true,
      used_life_goal: true,
      used_previous_judgment: false,
      used_memory_refs: 0,
      used_relationship_refs: 0,
      used_world_event_refs: 0,
      builtin_goal_authority: false,
      builtin_execution_source: true,
      fixture_dependency: false,
      helper_expansion_count: 0,
      gameplay_progress_verified: false
    },
    cycles: [
      {
        cycle_id: "cycle-0001",
        cycle_goal_ref: "goals/cycle/cycle-0001-goal.json",
        action_ref: "goals/cycle/actor-turn-actions/cycle-0001-actor-turn-action.json",
        provider_input_refs: [],
        provider_output_refs: [],
        evidence_refs: ["evidence/cycle-0001-collect.json"],
        judgment_ref: "judgments/cycle-0001-judgment.json",
        verifier_status: "passed"
      }
    ],
    ...partial
  };
}

test("evaluateCapabilityCaseProgress passes inventory target from run evidence refs", () => {
  const socialReport = baseReport();
  const observation = evaluateCapabilityCaseProgress({
    capabilityCase: baseCase(),
    report: socialReport,
    actorDir: "/tmp/unused-actor-dir",
    artifactsByRef: {
      "evidence/cycle-0001-collect.json": {
        schema: "actor-evidence/v1",
        evidence_id: "cycle-0001-collect",
        actor_id: actorId,
        category: "tool_attempt",
        created_at: "2026-07-11T00:00:00.000Z",
        tool_attempt: {
          tool: "collect_logs",
          args: {},
          result: {
            status: "collected",
            block: "oak_log",
            afterLogCount: 1,
            inventoryDelta: 1
          }
        }
      }
    }
  });

  assert.equal(observation.targetStatus, "passed");
  assert.deepEqual(observation.passedMilestoneIds, ["any_log_inventory"]);
  assert.ok(observation.evidenceRefs.includes("evidence/cycle-0001-collect.json"));
  assert.deepEqual(observation.evidenceRefs, [...observation.evidenceRefs].sort());
});

test("passed target after first cycle stops without budget stop and records both measurements", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-pass-"));
  const reportPath = path.join(outDir, "social-cycle-report.json");
  let observeCalls = 0;

  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 4,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    isolateWorkspace: true,
    actorWorkspaceRootDir: outDir,
    repoRoot,
    observeCaseUsage: async () => ({ requests: 2, total_tokens: 40 }),
    observeCapabilityProgress: async () => {
      observeCalls += 1;
      return {
        targetStatus: "passed",
        passedMilestoneIds: ["any_log_inventory"],
        evidenceRefs: ["evidence/cycle-0001-collect.json"]
      };
    }
  });

  assert.equal(observeCalls, 1);
  assert.equal(result.report.cycles.length, 1);
  assert.equal(result.caseBudgetStop, undefined);
  assert.equal(result.report.runtime_status, "passed");
  assert.equal(result.report.capability_progress?.schema, "capability-progress-summary/v1");
  assert.equal(result.report.capability_progress?.latest_target_status, "passed");
  assert.ok(result.report.capability_progress?.first_measurable_progress);
  assert.ok(result.report.capability_progress?.target_completion);
  assert.equal(result.report.capability_progress?.first_measurable_progress?.cycle_count, 1);
  assert.equal(result.report.capability_progress?.target_completion?.cycle_count, 1);
  assert.equal(result.report.capability_progress?.first_measurable_progress?.provider_requests, 2);
  assert.equal(result.report.capability_progress?.first_measurable_progress?.total_tokens, 40);
  assert.ok((result.report.capability_progress?.first_measurable_progress?.wall_time_ms ?? -1) >= 0);
  assert.deepEqual(result.report.capability_progress?.first_measurable_progress?.passed_milestone_ids, [
    "any_log_inventory"
  ]);
  assert.deepEqual(result.report.capability_progress?.first_measurable_progress?.evidence_refs, [
    "evidence/cycle-0001-collect.json"
  ]);
});

test("passed target after first action stops second action in the same cycle", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-action-"));
  const reportPath = path.join(outDir, "social-cycle-report.json");
  let observeCalls = 0;
  let actionStarts = 0;

  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 3,
    maxActionsPerCycle: 2,
    reportPath,
    connectToWorld: false,
    isolateWorkspace: true,
    actorWorkspaceRootDir: outDir,
    repoRoot,
    observeCaseUsage: async () => ({ requests: 3, total_tokens: 30 }),
    beforeProviderOrRuntimeAction: async ({ phase }) => {
      if (phase === "action") {
        actionStarts += 1;
      }
    },
    observeCapabilityProgress: async () => {
      observeCalls += 1;
      return {
        targetStatus: "passed",
        passedMilestoneIds: ["any_log_inventory"],
        evidenceRefs: ["evidence/action-01-collect.json"]
      };
    }
  });

  assert.equal(actionStarts, 1);
  assert.equal(observeCalls, 1);
  assert.equal(result.report.cycles.length, 1);
  assert.equal(result.report.cycles[0]?.action_attempts?.length, 1);
  assert.equal(result.caseBudgetStop, undefined);
  assert.equal(result.report.runtime_status, "passed");
  assert.equal(result.report.capability_progress?.target_completion?.runtime_action_count, 1);
  assert.equal(result.report.capability_progress?.first_measurable_progress?.runtime_action_count, 1);
});

test("passed milestone with failed target records first progress and continues", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-partial-"));
  const reportPath = path.join(outDir, "social-cycle-report.json");
  let observeCalls = 0;

  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 3,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    isolateWorkspace: true,
    actorWorkspaceRootDir: outDir,
    repoRoot,
    observeCaseUsage: async () => ({ requests: 7, total_tokens: 10 }),
    observeCapabilityProgress: async () => {
      observeCalls += 1;
      return {
        targetStatus: "failed",
        passedMilestoneIds: ["any_log_inventory"],
        evidenceRefs: ["evidence/milestone-only.json"]
      };
    }
  });

  assert.equal(observeCalls, 3);
  assert.equal(result.report.cycles.length, 3);
  assert.equal(result.caseBudgetStop, undefined);
  assert.ok(result.report.capability_progress?.first_measurable_progress);
  assert.equal(result.report.capability_progress?.target_completion, undefined);
  assert.equal(result.report.capability_progress?.latest_target_status, "failed");
  assert.deepEqual(result.report.capability_progress?.latest_passed_milestone_ids, [
    "any_log_inventory"
  ]);
  assert.equal(result.report.capability_progress?.first_measurable_progress?.cycle_count, 1);
  assert.equal(
    result.report.capability_progress?.first_measurable_progress?.provider_requests,
    7
  );
});

test("milestone after first action continues to second action in the same cycle", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-milestone-action-"));
  const reportPath = path.join(outDir, "social-cycle-report.json");
  let observeCalls = 0;
  let actionStarts = 0;

  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 1,
    maxActionsPerCycle: 2,
    reportPath,
    connectToWorld: false,
    isolateWorkspace: true,
    actorWorkspaceRootDir: outDir,
    repoRoot,
    observeCaseUsage: async () => ({ requests: 4, total_tokens: 20 }),
    beforeProviderOrRuntimeAction: async ({ phase }) => {
      if (phase === "action") {
        actionStarts += 1;
      }
    },
    observeCapabilityProgress: async () => {
      observeCalls += 1;
      return {
        targetStatus: "failed",
        passedMilestoneIds: ["any_log_inventory"],
        evidenceRefs: ["evidence/milestone-only.json"]
      };
    }
  });

  assert.equal(actionStarts, 2);
  assert.equal(observeCalls, 2);
  assert.equal(result.report.cycles.length, 1);
  assert.equal(result.report.cycles[0]?.action_attempts?.length, 2);
  assert.ok(result.report.capability_progress?.first_measurable_progress);
  assert.equal(result.report.capability_progress?.target_completion, undefined);
  assert.equal(result.report.capability_progress?.first_measurable_progress?.runtime_action_count, 1);
});

test("no progress omits measurement points and retains existing stop behavior", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-none-"));
  const reportPath = path.join(outDir, "social-cycle-report.json");
  let observeCalls = 0;

  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 2,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    isolateWorkspace: true,
    actorWorkspaceRootDir: outDir,
    repoRoot,
    observeCaseUsage: async () => ({ requests: 0, total_tokens: 0 }),
    observeCapabilityProgress: async () => {
      observeCalls += 1;
      return {
        targetStatus: "unknown",
        passedMilestoneIds: [],
        evidenceRefs: []
      };
    }
  });

  assert.equal(observeCalls, 2);
  assert.equal(result.report.cycles.length, 2);
  assert.equal(result.caseBudgetStop, undefined);
  assert.equal(result.report.capability_progress?.latest_target_status, "unknown");
  assert.deepEqual(result.report.capability_progress?.latest_passed_milestone_ids, []);
  assert.equal(result.report.capability_progress?.first_measurable_progress, undefined);
  assert.equal(result.report.capability_progress?.target_completion, undefined);
  assert.ok(
    result.report.runtime_status === "passed" ||
      result.report.runtime_status === "blocked" ||
      result.report.runtime_status === "failed"
  );
  assert.notEqual(result.report.runtime_status, "timeout");
  assert.ok(result.observedWallTimeMs >= 0);
});

test("runCapabilityCase persists matching capability_progress on disk raw and normalized reports", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-disk-"));
  let observeCalls = 0;
  let actionStarts = 0;

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 2,
    maxActionsPerCycle: 2,
    actorId,
    repoRoot,
    implementationRevision: null,
    testHooks: {
      observeCaseUsage: async () => ({ requests: 5, total_tokens: 50 }),
      beforeProviderOrRuntimeAction: async ({ phase }) => {
        if (phase === "action") {
          actionStarts += 1;
        }
      },
      observeCapabilityProgress: async () => {
        observeCalls += 1;
        return {
          targetStatus: "passed",
          passedMilestoneIds: ["any_log_inventory"],
          evidenceRefs: ["evidence/disk-progress.json"]
        };
      }
    }
  });

  assert.equal(actionStarts, 1);
  assert.equal(observeCalls, 1);

  const rawReport = JSON.parse(
    await fs.readFile(result.raw_report_path, "utf8")
  ) as SocialCycleRunReport;
  const normalized = JSON.parse(
    await fs.readFile(result.normalized_report_path, "utf8")
  ) as IndividualCapabilityReportV1;

  assert.equal(rawReport.runtime_status, "passed");
  assert.equal(rawReport.cycles.length, 1);
  assert.equal(rawReport.cycles[0]?.action_attempts?.length, 1);
  assert.ok(rawReport.capability_progress);
  assert.ok(normalized.capability_progress);
  assert.deepEqual(
    normalized.capability_progress as CapabilityProgressSummary,
    rawReport.capability_progress as CapabilityProgressSummary
  );
  assert.equal(normalized.capability_progress?.target_completion?.runtime_action_count, 1);
  assert.equal(normalized.capability_progress?.latest_target_status, "passed");
});

test("budget stop retains priority when target also passes at the same boundary", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-early-budget-"));
  let observeCalls = 0;
  let atTargetObservation = false;

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 2,
    maxActionsPerCycle: 2,
    actorId,
    repoRoot,
    implementationRevision: null,
    budgetOverrides: {
      max_provider_requests: 1,
      max_total_tokens: 10
    },
    testHooks: {
      // Usage reaches the ceiling only during the post-action progress observation,
      // the same boundary where the target also passes.
      observeCaseUsage: async () => {
        if (!atTargetObservation) {
          return { requests: 0, total_tokens: 0 };
        }
        return { requests: 1, total_tokens: 10 };
      },
      observeCapabilityProgress: async () => {
        atTargetObservation = true;
        observeCalls += 1;
        return {
          targetStatus: "passed",
          passedMilestoneIds: ["any_log_inventory"],
          evidenceRefs: ["evidence/budget-boundary.json"]
        };
      }
    }
  });

  assert.equal(observeCalls, 1);

  const rawReport = JSON.parse(
    await fs.readFile(result.raw_report_path, "utf8")
  ) as SocialCycleRunReport;
  const normalized = JSON.parse(
    await fs.readFile(result.normalized_report_path, "utf8")
  ) as IndividualCapabilityReportV1;

  assert.equal(rawReport.runtime_status, "timeout");
  assert.equal(normalized.runtime_status, "timeout");
  assert.equal(result.budget_status.budget_stopped, true);
  assert.ok(
    result.budget_status.exhausted_dimensions.includes("provider_requests") ||
      result.budget_status.exhausted_dimensions.includes("total_tokens")
  );
  // Progress may still be recorded; it must not override budget timeout attribution.
  assert.equal(rawReport.capability_progress?.latest_target_status, "passed");
  assert.notEqual(rawReport.runtime_status, "passed");
});
