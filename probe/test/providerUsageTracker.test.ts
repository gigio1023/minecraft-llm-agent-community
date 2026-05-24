import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendProviderUsageRecord,
  guardProviderUsageRequest,
  normalizeGeminiUsage,
  ProviderUsageBudgetError,
  summarizeProviderUsage
} from "../src/provider/providerUsageTracker.js";

async function withUsageEnv<T>(
  values: Record<string, string | undefined>,
  run: () => Promise<T>
) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("provider usage guard blocks a request beyond the configured daily budget", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath,
        PROVIDER_USAGE_BUDGETS_JSON: JSON.stringify({
          budgets: [
            {
              provider_id: "gemini-api",
              model: "gemma-4-31b-it",
              request_limit_per_day: 1,
              mode: "enforce"
            }
          ]
        })
      },
      async () => {
        await appendProviderUsageRecord({
          providerId: "gemini-api",
          model: "gemma-4-31b-it",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 1,
            input_tokens: 10,
            output_tokens: 5,
            thinking_tokens: 0,
            total_tokens: 15
          },
          context: { ledgerPath }
        });

        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "gemini-api",
            model: "gemma-4-31b-it",
            estimatedUsage: {
              requests: 1,
              input_tokens: 1,
              output_tokens: 1,
              thinking_tokens: 0,
              total_tokens: 2
            },
            context: { ledgerPath },
            maxAutoDelayMs: 0
          }),
          (error) =>
            error instanceof ProviderUsageBudgetError &&
            /request_limit_per_day/.test(error.message)
        );
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Gemini usage normalization counts thinking tokens as output tokens", () => {
  const normalized = normalizeGeminiUsage(
    {
      promptTokenCount: 10,
      candidatesTokenCount: 3,
      thoughtsTokenCount: 2,
      totalTokenCount: 15
    },
    {
      requests: 1,
      input_tokens: 1,
      output_tokens: 1,
      thinking_tokens: 0,
      total_tokens: 2
    }
  );

  assert.equal(normalized.source, "provider_reported");
  assert.deepEqual(normalized.usage, {
    requests: 1,
    input_tokens: 10,
    output_tokens: 5,
    thinking_tokens: 2,
    total_tokens: 15
  });
});

test("provider usage summary aggregates records by provider and model", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-summary-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await appendProviderUsageRecord({
      providerId: "gemini-api",
      model: "gemma-4-31b-it",
      status: "succeeded",
      usageSource: "estimated",
      usage: {
        requests: 1,
        input_tokens: 12,
        output_tokens: 4,
        thinking_tokens: 0,
        total_tokens: 16
      },
      context: { ledgerPath, runId: "run-a" }
    });
    await appendProviderUsageRecord({
      providerId: "gemini-api",
      model: "gemma-4-31b-it",
      status: "succeeded",
      usageSource: "estimated",
      usage: {
        requests: 1,
        input_tokens: 8,
        output_tokens: 2,
        thinking_tokens: 0,
        total_tokens: 10
      },
      context: { ledgerPath, runId: "run-a" }
    });

    const summary = await summarizeProviderUsage({ ledgerPath, runId: "run-a" });
    assert.equal(summary.records, 2);
    assert.deepEqual(summary.totals[0]?.usage, {
      requests: 2,
      input_tokens: 20,
      output_tokens: 6,
      thinking_tokens: 0,
      total_tokens: 26
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
