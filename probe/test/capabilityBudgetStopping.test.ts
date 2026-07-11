/**
 * Provider-free A3 budget-stopping coverage.
 *
 * Covers wall-time, provider-request, token, and cost ceilings plus abort
 * cleanup. Does not make live provider HTTP requests.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateBudgetExhaustion,
  evaluateCaseBudgetCeilings,
  runCapabilityCase
} from "../src/benchmarks/capability/index.js";
import type { CapabilityBudgetStatusV1 } from "../src/benchmarks/capability/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const probeRoot = path.resolve(here, "..");
const repoRoot = path.resolve(probeRoot, "..");
const manifestPath = path.join(
  probeRoot,
  "benchmarks/capability/individual-capability-v1.json"
);

const baseDeclared = {
  max_cycles: 10,
  max_runtime_actions: 20,
  max_wall_time_ms: 60_000
} as const;

test("evaluateBudgetExhaustion reports wall_time, provider_requests, total_tokens", () => {
  const wall = evaluateBudgetExhaustion({
    declared: { ...baseDeclared, max_wall_time_ms: 100 },
    observed: { cycles: 1, runtime_actions: 1, wall_time_ms: 100 },
    targetPassed: false
  });
  assert.equal(wall.budget_exhausted, true);
  assert.ok(wall.exhausted_dimensions.includes("wall_time"));

  const requests = evaluateBudgetExhaustion({
    declared: { ...baseDeclared, max_provider_requests: 3 },
    observed: { cycles: 1, runtime_actions: 1, provider_requests: 3 },
    targetPassed: false
  });
  assert.equal(requests.budget_exhausted, true);
  assert.ok(requests.exhausted_dimensions.includes("provider_requests"));

  const tokens = evaluateBudgetExhaustion({
    declared: { ...baseDeclared, max_total_tokens: 50 },
    observed: { cycles: 1, runtime_actions: 1, total_tokens: 50 },
    targetPassed: false
  });
  assert.equal(tokens.budget_exhausted, true);
  assert.ok(tokens.exhausted_dimensions.includes("total_tokens"));
});

test("evaluateBudgetExhaustion marks estimated_cost unverifiable when cost cannot be computed", () => {
  const result = evaluateBudgetExhaustion({
    declared: { ...baseDeclared, max_estimated_cost: 0.01 },
    observed: { cycles: 0, runtime_actions: 0 },
    targetPassed: false,
    costUncomputable: true
  });
  assert.equal(result.budget_exhausted, true);
  assert.equal(result.cost_unverifiable, true);
  assert.ok(result.exhausted_dimensions.includes("estimated_cost"));
});

test("evaluateBudgetExhaustion stops on computed estimated_cost without inventing USD", () => {
  const result = evaluateBudgetExhaustion({
    declared: { ...baseDeclared, max_estimated_cost: 1.5 },
    observed: { cycles: 1, runtime_actions: 1, estimated_cost: 1.5 },
    targetPassed: false,
    costUncomputable: false
  });
  assert.equal(result.budget_exhausted, true);
  assert.equal(result.cost_unverifiable, false);
  assert.ok(result.exhausted_dimensions.includes("estimated_cost"));
});

test("evaluateCaseBudgetCeilings stops before next work when ceilings are already met", () => {
  const check = evaluateCaseBudgetCeilings({
    declared: { ...baseDeclared, max_provider_requests: 2, max_total_tokens: 10 },
    observed: {
      cycles: 0,
      runtime_actions: 0,
      provider_requests: 2,
      total_tokens: 10,
      wall_time_ms: 0
    }
  });
  assert.equal(check.shouldStop, true);
  assert.ok(check.exhausted_dimensions.includes("provider_requests"));
  assert.ok(check.exhausted_dimensions.includes("total_tokens"));
});

test("capability runner stops on wall-time with deterministic delayed fake", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-budget-wall-"));
  let delayEntered = 0;
  let continuedAfterAbort = false;

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 4,
    maxActionsPerCycle: 1,
    actorId: "npc_b",
    repoRoot,
    implementationRevision: null,
    budgetOverrides: {
      max_wall_time_ms: 40
    },
    testHooks: {
      beforeProviderOrRuntimeAction: async ({ signal }) => {
        delayEntered += 1;
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            if (!signal.aborted) {
              continuedAfterAbort = true;
            }
            resolve();
          }, 250);
          const onAbort = () => {
            clearTimeout(timer);
            resolve();
          };
          if (signal.aborted) {
            onAbort();
            return;
          }
          signal.addEventListener("abort", onAbort, { once: true });
        });
      }
    }
  });

  assert.ok(delayEntered >= 1);
  assert.equal(continuedAfterAbort, false);
  assert.equal(result.budget_status.budget_exhausted, true);
  assert.ok(result.budget_status.exhausted_dimensions.includes("wall_time"));
  assert.ok((result.budget_status.observed.wall_time_ms ?? 0) >= 40);
  assert.equal(result.normalized_report.runtime_status, "timeout");
  assert.ok(
    result.normalized_report.diagnostic_notes.some((note) => /budget exhausted/i.test(note))
  );

  const budgetStatus = JSON.parse(
    await fs.readFile(result.budget_status_path, "utf8")
  ) as CapabilityBudgetStatusV1;
  assert.equal(budgetStatus.budget_exhausted, true);
  assert.ok(budgetStatus.exhausted_dimensions.includes("wall_time"));
  assert.ok(await fs.stat(result.declaration_path));
  assert.ok(await fs.stat(result.raw_report_path));
  assert.ok(await fs.stat(result.normalized_report_path));
});

test("capability runner stops on provider-request ceiling before next request", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-budget-req-"));
  let actionsStarted = 0;

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 3,
    maxActionsPerCycle: 1,
    actorId: "npc_b",
    repoRoot,
    implementationRevision: null,
    budgetOverrides: {
      max_provider_requests: 2
    },
    testHooks: {
      observeCaseUsage: async () => ({
        requests: 2,
        total_tokens: 0
      }),
      beforeProviderOrRuntimeAction: async () => {
        actionsStarted += 1;
      }
    }
  });

  assert.equal(actionsStarted, 0);
  assert.equal(result.budget_status.budget_exhausted, true);
  assert.ok(result.budget_status.exhausted_dimensions.includes("provider_requests"));
  assert.equal(result.budget_status.observed.provider_requests, 2);
  assert.notEqual(result.normalized_report.failure_class, "provider_blocked");
});

test("capability runner stops on token ceiling from saved/normalized usage", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-budget-tok-"));

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 3,
    maxActionsPerCycle: 1,
    actorId: "npc_b",
    repoRoot,
    implementationRevision: null,
    budgetOverrides: {
      max_total_tokens: 100
    },
    testHooks: {
      observeCaseUsage: async () => ({
        requests: 0,
        total_tokens: 100
      })
    }
  });

  assert.equal(result.budget_status.budget_exhausted, true);
  assert.ok(result.budget_status.exhausted_dimensions.includes("total_tokens"));
  assert.equal(result.budget_status.observed.total_tokens, 100);
  assert.equal(result.normalized_report.budgets.observed.total_tokens, 100);
});

test("capability runner marks estimated_cost unverifiable when cost cannot be computed", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-budget-cost-"));

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 2,
    maxActionsPerCycle: 1,
    actorId: "npc_b",
    repoRoot,
    implementationRevision: null,
    budgetOverrides: {
      max_estimated_cost: 0.05
    },
    testHooks: {
      observeCaseUsage: async () => ({
        requests: 0,
        total_tokens: 0
        // intentionally omit estimated_cost — never invent USD
      })
    }
  });

  assert.equal(result.budget_status.budget_exhausted, true);
  assert.equal(result.budget_status.cost_unverifiable, true);
  assert.ok(result.budget_status.exhausted_dimensions.includes("estimated_cost"));
  assert.equal(result.normalized_report.interpretation_status, "unverifiable");
  assert.equal(result.normalized_report.failure_class, "unverifiable");
  assert.equal(result.normalized_report.budgets.observed.estimated_cost, undefined);
});

test("capability runner cancellation awaits in-flight work and leaves no background action", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-budget-cancel-"));
  let backgroundTickAfterReturn = false;
  let abortSeenDuringDelay = false;
  let delayStillRunning = false;

  const resultPromise = runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 3,
    maxActionsPerCycle: 1,
    actorId: "npc_b",
    repoRoot,
    implementationRevision: null,
    budgetOverrides: {
      max_wall_time_ms: 30
    },
    testHooks: {
      beforeProviderOrRuntimeAction: async ({ signal }) => {
        delayStillRunning = true;
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            backgroundTickAfterReturn = true;
            delayStillRunning = false;
            resolve();
          }, 500);
          const onAbort = () => {
            abortSeenDuringDelay = true;
            clearTimeout(timer);
            delayStillRunning = false;
            resolve();
          };
          if (signal.aborted) {
            onAbort();
            return;
          }
          signal.addEventListener("abort", onAbort, { once: true });
        });
      }
    }
  });

  const result = await resultPromise;
  assert.equal(delayStillRunning, false);
  assert.equal(abortSeenDuringDelay, true);
  assert.equal(backgroundTickAfterReturn, false);
  assert.ok(result.budget_status.exhausted_dimensions.includes("wall_time"));

  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(backgroundTickAfterReturn, false);
});
