/** Regression coverage for the repo-local report readiness skill script. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
    await writeJson(path.join(actorDir, "reviews/experiment-declaration.json"), {
      schema_version: "experiment-declaration/v1"
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
      experiment_declaration_ref: "reviews/experiment-declaration.json",
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
      provider: { provider_id: "openai-api", model: "fixture-openai-model" },
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

test("archived report sidecar resolves workspace and approved preflight from a fresh repository copy", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "report-readiness-portable-repo-"));
  try {
    await writeFile(path.join(root, "SPEC.md"), "# Test repository\n", "utf8");
    const reportRef = "project-docs/experiments/raw/portable-run/raw-report.json";
    const actorRootRef = "project-docs/experiments/raw/portable-run/actor-workspace";
    const preflightRef = "project-docs/experiments/curated/portable-run/preflight/approved.json";
    const reportPath = path.join(root, reportRef);
    const actorRoot = path.join(root, actorRootRef);
    const actorDir = path.join(actorRoot, "npc_b");
    const preflightPath = path.join(root, preflightRef);
    const originalActorRoot = "/original/machine/tmp/portable-run/actor-workspace";
    await writeJson(path.join(actorDir, "evidence/action.json"), { status: "completed" });
    await writeJson(path.join(actorDir, "provider-inputs/turn.json"), { schema: "provider-input-snapshot/v1" });
    await writeJson(path.join(actorDir, "provider-outputs/turn.json"), { schema: "provider-output-snapshot/v1" });
    await writeJson(preflightPath, {
      schema: "provider-quota-preflight/v1",
      final_status: "allowed",
      approval: { operator_approved: true, approval_note: "Test approval" }
    });
    await writeJson(reportPath, {
      schema: "custom-run-report/v1",
      run_id: "portable-run",
      actor_id: "npc_b",
      actor_workspace_root_dir: originalActorRoot,
      provider: { provider_id: "openai-api", model: "gpt-5.4-mini" },
      provider_usage: { budget_status: [{ status: "allowed" }] },
      cycles: [{
        cycle_id: "cycle-0001",
        evidence_refs: ["evidence/action.json"],
        provider_input_refs: ["provider-inputs/turn.json"],
        provider_output_refs: ["provider-outputs/turn.json"]
      }]
    });
    const rawBefore = await readFile(reportPath);
    const reportSha256 = createHash("sha256").update(rawBefore).digest("hex");
    await writeJson(path.join(path.dirname(reportPath), "report-archive-relocation.json"), {
      schema: "report-archive-relocation/v1",
      created_at: "2026-07-12T00:00:00.000Z",
      report_ref: reportRef,
      report_sha256: reportSha256,
      original_actor_workspace_root: originalActorRoot,
      archived_actor_workspace_root_ref: actorRootRef,
      approved_preflight_ref: preflightRef
    });

    const module = await loadReadinessModule();
    const checked = module.checkReportReadiness(
      [reportPath, "--json", "--publishable"],
      { cwd: os.tmpdir(), now: new Date("2026-07-12T01:00:00.000Z") }
    );
    const result = JSON.parse(checked.outputText);
    assert.equal(checked.exitCode, 0);
    assert.equal(result.final_status, "passed");
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "archive_relocation_valid")?.status,
      "passed"
    );
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "actor_workspace_root")?.status,
      "passed"
    );
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "approved_preflight_valid")?.status,
      "passed"
    );
    assert.deepEqual(await readFile(reportPath), rawBefore);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legibility session readiness checks label locks, public history, and score bundle", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "legibility-readiness-"));
  try {
    const sessionPath = path.join(dir, "session.json");
    const row = {
      schema_version: "transition-row/v1",
      row_id: "row-1",
      session_id: "session-1",
      timestamps: {
        action_started_at: "2026-07-06T00:00:01.000Z",
        label_locked_at: "2026-07-06T00:00:03.000Z"
      },
      observed_delta: {
        physical: { classes: ["no_physical_delta"], evidence_refs: [] },
        material: { classes: ["possession_or_access_granted"], evidence_refs: ["evidence/material.json"] },
        social_response: {
          classes: ["reply_accept_or_acknowledge"],
          evidence_refs: ["evidence/chat.json"],
          response_window: {
            schema: "response-window/v1",
            status: "closed"
          }
        }
      }
    };
    await writeJson(sessionPath, {
      schema: "legibility-session/v1",
      session_id: "session-1",
      actor_routes: [
        { actor_id: "npc_a", provider_id: "deterministic-social", model: "deterministic-social" },
        { actor_id: "npc_b", provider_id: "scripted-social", model: "scripted-social" }
      ],
      transition_rows: [row]
    });
    await writeJson(path.join(dir, "public-history.json"), {
      schema: "public-history/v1",
      leakage_checks: {
        identity_permutation: { status: "passed" },
        prompt_shape: { status: "passed" },
        private_field_scan: { status: "passed" }
      }
    });
    await writeJson(path.join(dir, "experiment-declaration.json"), {
      schema_version: "experiment-declaration/v1"
    });
    await writeJson(path.join(dir, "predictions.json"), []);
    await writeJson(path.join(dir, "score-report.json"), {
      schema: "legibility-score-report/v1",
      row_count: 1,
      joined_prediction_count: 1
    });

    const { exitCode, outputText } = await runReadiness(sessionPath, ["--publishable"]);
    assert.equal(exitCode, 0);
    const result = JSON.parse(outputText);
    assert.equal(result.final_status, "passed");
    assert.equal(
      result.checks.find((check: { name: string }) => check.name === "transition_rows_no_predicted_delta")?.status,
      "passed"
    );

    await writeJson(sessionPath, {
      schema: "legibility-session/v1",
      transition_rows: [{ ...row, predicted_delta: { social_response: "leaked" } }]
    });
    const failed = await runReadiness(sessionPath, ["--publishable"]);
    assert.equal(failed.exitCode, 1);
    assert.equal(JSON.parse(failed.outputText).final_status, "failed");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
