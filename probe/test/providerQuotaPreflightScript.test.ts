/** Regression coverage for the repo-local provider quota preflight skill script. */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

function externalObservation(input: {
  quotaDay: string;
  observedAt: string;
  periodCertainty?: "confirmed_exact_utc_day" | "ambiguous_period";
  overlap?: "unknown" | "includes_local" | "disjoint";
  requests?: number;
  totalTokens: number;
}) {
  return {
    schema: "provider-external-already-used/v1",
    provider_id: "openai-api",
    quota_day_utc: input.quotaDay,
    observed_at: input.observedAt,
    period_certainty: input.periodCertainty ?? "confirmed_exact_utc_day",
    overlap_with_local_ledger: input.overlap ?? "unknown",
    source_note: "Operator copied the current usage dashboard totals.",
    usage: {
      requests: input.requests ?? 1,
      input_tokens: 0,
      output_tokens: 0,
      thinking_tokens: 0,
      total_tokens: input.totalTokens
    }
  };
}

function localUsageRecord(totalTokens: number) {
  return {
    schema: "provider-usage-record/v1",
    record_id: "local-usage-1",
    provider_id: "openai-api",
    model: "gpt-5.4-mini",
    created_at: "2026-07-12T10:00:00.000Z",
    quota_day_utc: "2026-07-12",
    pacific_day: "2026-07-12",
    utc_minute: "2026-07-12T10:00",
    status: "succeeded",
    usage_source: "provider_reported",
    usage: {
      requests: 2,
      input_tokens: 0,
      output_tokens: 0,
      thinking_tokens: 0,
      total_tokens: totalTokens
    }
  };
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

test("provider quota preflight allows only operator-provided OpenAI model candidates", async () => {
  const module = await loadPreflightModule();
  for (const model of ["gpt-5.4", "gpt-5.2", "o3-mini"]) {
    const { outputJson } = module.runProviderQuotaPreflight([
      "--candidate", `openai-api:${model}`,
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1"
    ], {
      cwd: repoRoot,
      now: new Date("2026-07-23T03:00:00.000Z")
    });
    const result = JSON.parse(outputJson);
    assert.equal(result.final_status, "needs_dashboard_approval");
    assert.equal(result.results[0]?.status, "needs_dashboard_approval");
    assert.equal(result.results[0]?.quota_checks?.length, 1);
  }

  for (const model of ["gpt-5.4-2026-03-05", "gpt-5.5", "gpt-5.6-sol"]) {
    const { outputJson } = module.runProviderQuotaPreflight([
      "--candidate", `openai-api:${model}`,
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1"
    ], {
      cwd: repoRoot,
      now: new Date("2026-07-24T03:00:00.000Z")
    });
    const excluded = JSON.parse(outputJson);
    assert.equal(excluded.final_status, "blocked");
    assert.equal(excluded.results[0]?.status, "unbudgeted");
    assert.match(
      String(excluded.results[0]?.reason ?? ""),
      /operator-provided complimentary-usage candidate list/
    );
  }
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

test("confirmed same-day dashboard usage conservatively replaces smaller overlapping local totals", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-quota-external-confirmed-"));
  try {
    const ledgerPath = path.join(dir, "ledger.jsonl");
    const externalPath = path.join(dir, "external.json");
    await writeFile(ledgerPath, `${JSON.stringify(localUsageRecord(1_000))}\n`, "utf8");
    await writeFile(externalPath, JSON.stringify(externalObservation({
      quotaDay: "2026-07-12",
      observedAt: "2026-07-12T11:00:00.000Z",
      totalTokens: 9_999_500
    })), "utf8");

    const module = await loadPreflightModule();
    const { outputJson } = module.runProviderQuotaPreflight([
      "--candidate", "openai-api:gpt-5.4-mini",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--ledger", ledgerPath,
      "--external-already-used", externalPath,
      "--operator-approved",
      "--approval-note", "Current dashboard checked for the exact UTC day."
    ], { cwd: repoRoot, now: new Date("2026-07-12T12:00:00.000Z") });
    const result = JSON.parse(outputJson);
    const check = result.results[0].quota_checks[0];
    assert.equal(result.final_status, "blocked");
    assert.equal(check.external_usage.status, "applied_conservative_max");
    assert.equal(check.external_usage.local_day.total_tokens, 1_000);
    assert.equal(check.current.day.total_tokens, 9_999_500);
    assert.equal(check.projected.day.total_tokens, 10_000_500);
    assert.equal(result.external_already_used[0].source_note, "Operator copied the current usage dashboard totals.");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("confirmed disjoint dashboard usage is added to local usage", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-quota-external-disjoint-"));
  try {
    const ledgerPath = path.join(dir, "ledger.jsonl");
    const externalPath = path.join(dir, "external.json");
    await writeFile(ledgerPath, `${JSON.stringify(localUsageRecord(1_000))}\n`, "utf8");
    await writeFile(externalPath, JSON.stringify(externalObservation({
      quotaDay: "2026-07-12",
      observedAt: "2026-07-12T11:00:00.000Z",
      overlap: "disjoint",
      totalTokens: 2_000
    })), "utf8");

    const module = await loadPreflightModule();
    const { outputJson } = module.runProviderQuotaPreflight([
      "--candidate", "openai-api:gpt-5.4-mini",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--ledger", ledgerPath,
      "--external-already-used", externalPath,
      "--operator-approved",
      "--approval-note", "Confirmed disjoint accounting source."
    ], { cwd: repoRoot, now: new Date("2026-07-12T12:00:00.000Z") });
    const result = JSON.parse(outputJson);
    const check = result.results[0].quota_checks[0];
    assert.equal(result.final_status, "allowed");
    assert.equal(check.external_usage.status, "applied_sum");
    assert.equal(check.current.day.total_tokens, 3_000);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("ambiguous or stale dashboard periods remain visible but do not authorize OpenAI", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-quota-external-unusable-"));
  try {
    const module = await loadPreflightModule();
    const ledgerPath = path.join(dir, "provider-usage-ledger.jsonl");
    await writeFile(ledgerPath, "", "utf8");
    const cases = [
      {
        name: "ambiguous",
        observation: externalObservation({
          quotaDay: "2026-07-12",
          observedAt: "2026-07-12T11:00:00.000Z",
          periodCertainty: "ambiguous_period",
          totalTokens: 9_999_500
        }),
        expectedStatus: "not_applied_ambiguous_period"
      },
      {
        name: "stale",
        observation: externalObservation({
          quotaDay: "2026-07-11",
          observedAt: "2026-07-11T11:00:00.000Z",
          totalTokens: 9_999_500
        }),
        expectedStatus: "not_applied_stale"
      }
    ];
    for (const entry of cases) {
      const externalPath = path.join(dir, `${entry.name}.json`);
      await writeFile(externalPath, JSON.stringify(entry.observation), "utf8");
      const { outputJson } = module.runProviderQuotaPreflight([
        "--candidate", "openai-api:gpt-5.4-mini",
        "--estimate-requests", "1",
        "--estimate-total-tokens", "1000",
        "--estimate-requests-per-minute", "1",
        "--ledger", ledgerPath,
        "--external-already-used", externalPath,
        "--operator-approved",
        "--approval-note", "Dashboard observation supplied for validation."
      ], { cwd: repoRoot, now: new Date("2026-07-12T12:00:00.000Z") });
      const result = JSON.parse(outputJson);
      assert.equal(result.final_status, "needs_dashboard_approval");
      assert.equal(result.results[0].quota_checks[0].external_usage.status, entry.expectedStatus);
      assert.equal(result.results[0].quota_checks[0].current.day.total_tokens, 0);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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

test("Model Studio preflight requires operator billing acknowledgement", async () => {
  const { outputJson } = await runPreflight([
    "--candidate", "alibaba-model-studio-api:qwen3.8-max-preview",
    "--estimate-requests", "1",
    "--estimate-total-tokens", "1000",
    "--estimate-requests-per-minute", "1",
    "--estimate-total-tokens-per-minute", "1000"
  ]);
  const result = JSON.parse(outputJson);
  assert.equal(result.final_status, "needs_dashboard_approval");
  assert.match(
    String(result.results[0]?.reason ?? ""),
    /Billing status for the Qwen 3\.8 Max preview allocation is not established/
  );
});

test("Model Studio preflight allows under-quota runs with approval and non-empty note", async () => {
  const { outputJson } = await runPreflight([
    "--candidate", "alibaba-model-studio-api:qwen3.8-max-preview",
    "--estimate-requests", "1",
    "--estimate-total-tokens", "1000",
    "--estimate-requests-per-minute", "1",
    "--estimate-total-tokens-per-minute", "1000",
    "--operator-approved",
    "--approval-note", "Operator acknowledges unestablished Model Studio preview billing."
  ]);
  const result = JSON.parse(outputJson);
  assert.equal(result.final_status, "allowed");
  assert.equal(
    result.approval.approval_note,
    "Operator acknowledges unestablished Model Studio preview billing."
  );
});

test("Model Studio preflight rejects whitespace-only approval notes", async () => {
  const module = await loadPreflightModule();
  assert.throws(
    () => module.runProviderQuotaPreflight([
      "--candidate", "alibaba-model-studio-api:qwen3.8-max-preview",
      "--estimate-requests", "1",
      "--estimate-total-tokens", "1000",
      "--estimate-requests-per-minute", "1",
      "--estimate-total-tokens-per-minute", "1000",
      "--operator-approved",
      "--approval-note", "   \t  "
    ], { cwd: repoRoot }),
    /--operator-approved requires --approval-note/
  );

  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-quota-model-studio-note-"));
  try {
    const notePath = path.join(dir, "note.txt");
    await writeFile(notePath, "  \n\t  \n", "utf8");
    assert.throws(
      () => module.runProviderQuotaPreflight([
        "--candidate", "alibaba-model-studio-api:qwen3.8-max-preview",
        "--estimate-requests", "1",
        "--estimate-total-tokens", "1000",
        "--estimate-requests-per-minute", "1",
        "--estimate-total-tokens-per-minute", "1000",
        "--operator-approved",
        "--approval-note-file", notePath
      ], { cwd: repoRoot }),
      /--operator-approved requires --approval-note/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio preflight keeps over-quota blocked even with approval", async () => {
  const { outputJson } = await runPreflight([
    "--candidate", "alibaba-model-studio-api:qwen3.8-max-preview",
    "--estimate-requests", "1",
    "--estimate-total-tokens", "1000",
    "--estimate-requests-per-minute", "1",
    "--estimate-total-tokens-per-minute", "500001",
    "--operator-approved",
    "--approval-note", "Operator acknowledges billing uncertainty."
  ]);
  const result = JSON.parse(outputJson);
  assert.equal(result.final_status, "blocked");
});
