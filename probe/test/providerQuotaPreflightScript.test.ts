/** Regression coverage for the repo-local provider quota preflight skill script. */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
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

async function runPreflight(args: string[]) {
  return execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    maxBuffer: 10 * 1024 * 1024
  });
}

async function runEstimator(args: string[]) {
  return execFileAsync(process.execPath, [estimatorScriptPath, ...args], {
    cwd: repoRoot,
    maxBuffer: 10 * 1024 * 1024
  });
}

test("provider quota preflight writes JSON output and allows grouped budgeted candidates", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-quota-preflight-"));
  const outPath = path.join(dir, "preflight.json");
  try {
    const { stdout } = await runPreflight([
      "--candidate", "gemini-api:gemma-4-31b-it",
      "--candidate", "modelscope-api:Qwen-Ambassador/Qwen3.7-Plus",
      "--estimate-requests", "2",
      "--estimate-total-tokens", "10000",
      "--estimate-requests-per-minute", "1",
      "--out", outPath
    ]);
    const printed = JSON.parse(stdout);
    const written = JSON.parse(await readFile(outPath, "utf8"));
    assert.equal(printed.schema, "provider-quota-preflight/v1");
    assert.equal(written.schema, "provider-quota-preflight/v1");
    assert.equal(written.final_status, "allowed");
    assert.equal(written.results.length, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider quota preflight requires explicit OpenAI approval note", async () => {
  const { stdout } = await runPreflight([
    "--candidate", "openai-api:gpt-5.4-mini",
    "--estimate-requests", "1",
    "--estimate-total-tokens", "1000",
    "--estimate-requests-per-minute", "1"
  ]);
  const result = JSON.parse(stdout);
  assert.equal(result.final_status, "needs_dashboard_approval");

  await assert.rejects(
    runPreflight([
      "--candidate", "openai-api:gpt-5.4-mini",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--operator-approved"
    ]),
    /--operator-approved requires --approval-note/
  );
});

test("provider quota preflight rejects missing whole-run estimates", async () => {
  await assert.rejects(
    runPreflight([
      "--candidate", "gemini-api:gemma-4-31b-it",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1"
    ]),
    /--estimate-requests is required/
  );
});

test("provider quota scripts reject unknown options", async () => {
  await assert.rejects(
    runPreflight([
      "--candidate", "gemini-api:gemma-4-31b-it",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--typo"
    ]),
    /Unknown or incomplete option --typo/
  );

  await assert.rejects(
    runEstimator([
      "--provider", "gemini-api",
      "--model", "gemma-4-31b-it",
      "--cycles", "2",
      "--typo"
    ]),
    /Unknown or incomplete option --typo/
  );
});
