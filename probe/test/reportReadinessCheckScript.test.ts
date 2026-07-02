/** Regression coverage for the repo-local report readiness skill script. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const scriptPath = path.join(
  repoRoot,
  ".agents/skills/minecraft-run-report-author/scripts/report-readiness-check.ts"
);

type ReadinessModule = {
  checkReportReadiness: (
    argv: string[],
    options?: { cwd?: string; now?: Date }
  ) => { result: { final_status: string; checks: Array<{ name: string; status: string }> }; outputText: string; exitCode: number };
};

async function loadReadinessModule() {
  return await import(pathToFileURL(scriptPath).href) as ReadinessModule;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runReadiness(reportPath: string, args: string[] = []) {
  const module = await loadReadinessModule();
  return module.checkReportReadiness([reportPath, "--json", ...args], { cwd: os.tmpdir() });
}

test("report readiness resolves helper scripts independently of cwd and checks transition row refs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "report-readiness-"));
  try {
    const actorRoot = path.join(dir, "actors");
    const actorDir = path.join(actorRoot, "npc_b");
    const reportPath = path.join(dir, "report.json");
    await writeJson(path.join(actorDir, "transition-rows/row-1.json"), {
      schema_version: "transition-row/v1",
      row_id: "row-1"
    });
    await writeJson(path.join(actorDir, "reviews/batch-audit.json"), {
      schema_version: "transition-row-batch-audit/v1",
      verdict: "core-inconclusive"
    });
    await writeJson(path.join(actorDir, "reviews/no-regret-declaration.json"), {
      schema_version: "no-regret-run-declaration/v1"
    });
    await writeJson(path.join(actorDir, "reviews/seed-reset.json"), {
      schema_version: "seed-reset-record/v1"
    });
    await writeJson(reportPath, {
      schema: "custom-run-report/v1",
      run_id: "run-1",
      actor_id: "npc_b",
      actor_workspace_root_dir: actorRoot,
      provider: { provider_id: "deterministic-social", model: "fixture" },
      cycles: [{
        cycle_id: "cycle-0001",
        evidence_refs: [],
        provider_input_refs: [],
        provider_output_refs: [],
        action_attempts: [{
          transition_row_ref: "transition-rows/row-1.json"
        }]
      }],
      transition_row_batch_audit_ref: "reviews/batch-audit.json",
      no_regret_run_declaration_ref: "reviews/no-regret-declaration.json",
      seed_reset_record_ref: "reviews/seed-reset.json"
    });

    const { exitCode, outputText } = await runReadiness(reportPath);
    assert.equal(exitCode, 0);
    const result = JSON.parse(outputText);
    assert.equal(result.final_status, "passed");
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "transition_row_refs_exist")?.status,
      "passed"
    );
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "transition_row_batch_audit_ref_present")?.status,
      "passed"
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("publishable provider-backed reports fail when preflight evidence is missing", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "report-readiness-publishable-"));
  try {
    const actorRoot = path.join(dir, "actors");
    const reportPath = path.join(dir, "report.json");
    await mkdir(path.join(actorRoot, "npc_b"), { recursive: true });
    await writeJson(reportPath, {
      schema: "custom-run-report/v1",
      run_id: "run-2",
      actor_id: "npc_b",
      actor_workspace_root_dir: actorRoot,
      provider: { provider_id: "openai-api", model: "gpt-5.5" },
      provider_usage: { budget_status: [{ status: "allowed" }] },
      cycles: []
    });

    const { exitCode, outputText } = await runReadiness(reportPath, ["--publishable"]);
    assert.equal(exitCode, 1);
    const result = JSON.parse(outputText);
    assert.equal(result.final_status, "failed");
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "preflight_ref_present")?.status,
      "failed"
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
