import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildCapabilityCliSummary } from "../src/benchmarks/capability/cli.js";
import type {
  CapabilityBudgetStatusV1,
  CapabilityCaseDeclarationV1,
  CapabilitySuiteIndexV1,
  RunCapabilityCaseResult
} from "../src/benchmarks/capability/runner.js";
import type { IndividualCapabilityReportV1 } from "../src/benchmarks/capability/reportTypes.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const probeRoot = path.resolve(here, "..");
const manifestPath = path.join(
  probeRoot,
  "benchmarks/capability/individual-capability-v1.json"
);

test("capability CLI records tighter wall, request, and token limits", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-cli-"));

  try {
    const child = spawnSync(
      "bun",
      [
        "run",
        "src/benchmarks/capability/cli.ts",
        "--manifest",
        manifestPath,
        "--case",
        "collect_logs",
        "--offline",
        "--cycles",
        "1",
        "--max-actions-per-cycle",
        "1",
        "--max-wall-time-ms",
        "30000",
        "--max-provider-requests",
        "2",
        "--max-total-tokens",
        "1000",
        "--out",
        outDir
      ],
      {
        cwd: probeRoot,
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8",
        env: Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) => key !== "NODE_TEST_CONTEXT" && !key.startsWith("BUN_TEST")
          )
        )
      }
    );
    const exitCode = child.status;
    const stdout = child.stdout;
    const stderr = child.stderr;

    assert.equal(exitCode, 0, `stdout:\n${stdout}\nstderr:\n${stderr}`);

    const suiteIndex = JSON.parse(
      await fs.readFile(path.join(outDir, "suite-index.json"), "utf8")
    ) as CapabilitySuiteIndexV1;
    assert.equal(suiteIndex.runs.length, 1);
    const suiteRun = suiteIndex.runs[0]!;

    const budgetStatus = JSON.parse(
      await fs.readFile(path.join(outDir, suiteRun.budget_status_ref), "utf8")
    ) as CapabilityBudgetStatusV1;
    assert.equal(budgetStatus.declared.max_wall_time_ms, 30_000);
    assert.equal(budgetStatus.declared.max_provider_requests, 2);
    assert.equal(budgetStatus.declared.max_total_tokens, 1_000);

    const declarationPath = path.join(outDir, suiteRun.declaration_ref);
    const rawReportPath = path.join(outDir, suiteRun.raw_report_ref);
    const normalizedReportPath = path.join(outDir, suiteRun.normalized_report_ref);
    const budgetStatusPath = path.join(outDir, suiteRun.budget_status_ref);
    const result: RunCapabilityCaseResult = {
      declaration: JSON.parse(
        await fs.readFile(declarationPath, "utf8")
      ) as CapabilityCaseDeclarationV1,
      budget_status: budgetStatus,
      normalized_report: JSON.parse(
        await fs.readFile(normalizedReportPath, "utf8")
      ) as IndividualCapabilityReportV1,
      suite_index: suiteIndex,
      declaration_path: declarationPath,
      raw_report_path: rawReportPath,
      normalized_report_path: normalizedReportPath,
      budget_status_path: budgetStatusPath,
      suite_index_path: path.join(outDir, "suite-index.json"),
      social_cycle_run_id: suiteRun.social_cycle_run_id
    };
    const summaryRun = buildCapabilityCliSummary([result]).runs[0]!;
    assert.equal(summaryRun.target_status, "unknown");
    assert.deepEqual(summaryRun.milestone_progress.passed_milestone_ids, []);
    assert.equal(summaryRun.milestone_progress.passed_count, 0);
    assert.equal(summaryRun.milestone_progress.total_count, 1);
    assert.equal(summaryRun.interpretation.status, "blocked");
    assert.equal(summaryRun.stop_reason, "runtime_blocked");
    const orderedKeys = Object.keys(summaryRun);
    assert.ok(orderedKeys.indexOf("target_status") < orderedKeys.indexOf("runtime_status"));
    assert.ok(orderedKeys.indexOf("milestone_progress") < orderedKeys.indexOf("runtime_status"));
    assert.ok(orderedKeys.indexOf("interpretation") < orderedKeys.indexOf("runtime_status"));
    assert.ok(orderedKeys.indexOf("stop_reason") < orderedKeys.indexOf("runtime_status"));
  } finally {
    await fs.rm(outDir, { recursive: true, force: true });
  }
});
