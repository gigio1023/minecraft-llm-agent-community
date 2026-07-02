/** Regression coverage for the repo-local provider quota preflight skill script. */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const scriptPath = path.join(
  repoRoot,
  ".agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts"
);
const estimatorScriptPath = path.join(
  repoRoot,
  ".agents/skills/provider-quota-preflight/scripts/estimate-social-cycle-usage.ts"
);
type PreflightModule = {
  runProviderQuotaPreflight: (
    argv: string[],
    options?: { cwd?: string; now?: Date }
  ) => { output: { schema: string; final_status: string; results: unknown[] }; outputJson: string };
};

type EstimatorModule = {
  estimateSocialCycleUsage: (
    argv: string[],
    options?: { now?: Date }
  ) => { output: { schema: string }; outputJson: string };
};

async function loadPreflightModule() {
  return await import(pathToFileURL(scriptPath).href) as PreflightModule;
}

async function loadEstimatorModule() {
  return await import(pathToFileURL(estimatorScriptPath).href) as EstimatorModule;
}

async function runPreflight(args: string[]) {
  const module = await loadPreflightModule();
  return module.runProviderQuotaPreflight(args, { cwd: repoRoot });
}

async function runEstimator(args: string[]) {
  const module = await loadEstimatorModule();
  return module.estimateSocialCycleUsage(args);
}

test("provider quota preflight writes JSON output and allows grouped budgeted candidates", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-quota-preflight-"));
  const outPath = path.join(dir, "preflight.json");
  try {
    const { output, outputJson } = await runPreflight([
      "--candidate", "gemini-api:gemma-4-31b-it",
      "--candidate", "modelscope-api:Qwen-Ambassador/Qwen3.7-Plus",
      "--estimate-requests", "2",
      "--estimate-total-tokens", "10000",
      "--estimate-requests-per-minute", "1",
      "--out", outPath
    ]);
    const printed = JSON.parse(outputJson);
    const written = JSON.parse(await readFile(outPath, "utf8"));
    assert.equal(printed.schema, "provider-quota-preflight/v1");
    assert.equal(output.schema, "provider-quota-preflight/v1");
    assert.equal(written.schema, "provider-quota-preflight/v1");
    assert.equal(written.final_status, "allowed");
    assert.equal(written.results.length, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider quota preflight requires explicit OpenAI approval note", async () => {
  const { outputJson } = await runPreflight([
    "--candidate", "openai-api:gpt-5.4-mini",
    "--estimate-requests", "1",
    "--estimate-total-tokens", "1000",
    "--estimate-requests-per-minute", "1"
  ]);
  const result = JSON.parse(outputJson);
  assert.equal(result.final_status, "needs_dashboard_approval");

  const module = await loadPreflightModule();
  assert.throws(
    () => module.runProviderQuotaPreflight([
      "--candidate", "openai-api:gpt-5.4-mini",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--operator-approved"
    ], { cwd: repoRoot }),
    /--operator-approved requires --approval-note/
  );
});

test("provider quota preflight rejects missing whole-run estimates", async () => {
  const module = await loadPreflightModule();
  assert.throws(
    () => module.runProviderQuotaPreflight([
      "--candidate", "gemini-api:gemma-4-31b-it",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1"
    ], { cwd: repoRoot }),
    /--estimate-requests is required/
  );
});

test("provider quota scripts reject unknown options", async () => {
  const preflight = await loadPreflightModule();
  assert.throws(
    () => preflight.runProviderQuotaPreflight([
      "--candidate", "gemini-api:gemma-4-31b-it",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--typo"
    ], { cwd: repoRoot }),
    /Unknown or incomplete option --typo/
  );

  const estimator = await loadEstimatorModule();
  assert.throws(
    () => estimator.estimateSocialCycleUsage([
      "--provider", "gemini-api",
      "--model", "gemma-4-31b-it",
      "--cycles", "2",
      "--typo"
    ]),
    /Unknown or incomplete option --typo/
  );
});
