/** Regression coverage for provider usage tracking and budget context. */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendProviderUsageRecord,
  guardProviderUsageRequest,
  normalizeGeminiUsage,
  normalizeOpenAiUsage,
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

test("provider usage guard blocks unbudgeted provider/model calls by default", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-unbudgeted-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_ALLOW_UNBUDGETED: undefined,
        PROVIDER_USAGE_BUDGETS_JSON: undefined,
        PROVIDER_USAGE_BUDGETS_PATH: path.join(dir, "missing-budgets.json"),
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_ENFORCEMENT: undefined,
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath
      },
      async () => {
        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "openai-api",
            model: "gpt-5.5",
            estimatedUsage: {
              requests: 1,
              input_tokens: 100,
              output_tokens: 100,
              thinking_tokens: 0,
              total_tokens: 200
            },
            context: { ledgerPath },
            maxAutoDelayMs: 0
          }),
          (error) =>
            error instanceof ProviderUsageBudgetError &&
            error.decision.status === "blocked" &&
            /without a local budget/.test(error.message)
        );
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider usage guard can explicitly track unbudgeted calls without allowing them silently", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-unbudgeted-track-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_ALLOW_UNBUDGETED: "1",
        PROVIDER_USAGE_BUDGETS_JSON: undefined,
        PROVIDER_USAGE_BUDGETS_PATH: path.join(dir, "missing-budgets.json"),
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_ENFORCEMENT: "track",
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath
      },
      async () => {
        const decision = await guardProviderUsageRequest({
          providerId: "openai-api",
          model: "gpt-5.5",
          estimatedUsage: {
            requests: 1,
            input_tokens: 100,
            output_tokens: 100,
            thinking_tokens: 0,
            total_tokens: 200
          },
          context: { ledgerPath },
          maxAutoDelayMs: 0
        });

        assert.equal(decision.status, "unbudgeted");
        assert.match(decision.reason ?? "", /No provider usage budget/);
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider usage guard treats enforcement=off as enforce", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-off-is-enforce-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_ENFORCEMENT: "off",
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath,
        PROVIDER_USAGE_BUDGETS_JSON: JSON.stringify({
          budgets: [
            {
              provider_id: "openai-api",
              model: "gpt-5.5",
              request_limit_per_day: 0,
              mode: "enforce"
            }
          ]
        })
      },
      async () => {
        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "openai-api",
            model: "gpt-5.5",
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

test("provider usage guard resets daily budget on UTC day boundary", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-utc-day-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath,
        PROVIDER_USAGE_BUDGETS_JSON: JSON.stringify({
          budgets: [
            {
              provider_id: "openai-api",
              model: "gpt-5.4-mini",
              total_token_limit_per_day: 100,
              mode: "enforce"
            }
          ]
        })
      },
      async () => {
        await appendProviderUsageRecord({
          providerId: "openai-api",
          model: "gpt-5.4-mini",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 1,
            input_tokens: 70,
            output_tokens: 20,
            thinking_tokens: 0,
            total_tokens: 90
          },
          context: { ledgerPath },
          now: new Date("2026-06-01T23:59:00.000Z")
        });

        const decision = await guardProviderUsageRequest({
          providerId: "openai-api",
          model: "gpt-5.4-mini",
          estimatedUsage: {
            requests: 1,
            input_tokens: 50,
            output_tokens: 1,
            thinking_tokens: 0,
            total_tokens: 51
          },
          context: { ledgerPath },
          now: new Date("2026-06-02T00:01:00.000Z"),
          maxAutoDelayMs: 0
        });

        assert.equal(decision.status, "allowed");
        assert.equal(decision.projected?.day.total_tokens, 51);
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider usage guard enforces monthly request budgets", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-month-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath,
        PROVIDER_USAGE_BUDGETS_JSON: JSON.stringify({
          budgets: [
            {
              provider_id: "modelscope-api",
              model: "Qwen-Ambassador/Qwen3.7-Max",
              request_limit_per_month: 2,
              mode: "enforce"
            }
          ]
        })
      },
      async () => {
        for (const createdAt of [
          "2026-06-01T00:01:00.000Z",
          "2026-06-12T00:01:00.000Z"
        ]) {
          await appendProviderUsageRecord({
            providerId: "modelscope-api",
            model: "Qwen-Ambassador/Qwen3.7-Max",
            status: "succeeded",
            usageSource: "estimated",
            usage: {
              requests: 1,
              input_tokens: 1,
              output_tokens: 1,
              thinking_tokens: 0,
              total_tokens: 2
            },
            context: { ledgerPath },
            now: new Date(createdAt)
          });
        }

        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "modelscope-api",
            model: "Qwen-Ambassador/Qwen3.7-Max",
            estimatedUsage: {
              requests: 1,
              input_tokens: 1,
              output_tokens: 1,
              thinking_tokens: 0,
              total_tokens: 2
            },
            context: { ledgerPath },
            now: new Date("2026-06-13T00:01:00.000Z"),
            maxAutoDelayMs: 0
          }),
          (error) =>
            error instanceof ProviderUsageBudgetError &&
            /request_limit_per_month/.test(error.message)
        );

        const nextMonthDecision = await guardProviderUsageRequest({
          providerId: "modelscope-api",
          model: "Qwen-Ambassador/Qwen3.7-Max",
          estimatedUsage: {
            requests: 1,
            input_tokens: 1,
            output_tokens: 1,
            thinking_tokens: 0,
            total_tokens: 2
          },
          context: { ledgerPath },
          now: new Date("2026-07-01T00:01:00.000Z"),
          maxAutoDelayMs: 0
        });

        assert.equal(nextMonthDecision.status, "allowed");
        assert.equal(nextMonthDecision.projected?.month.requests, 1);
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("default ModelScope Qwen policies enforce Ambassador monthly API-call quotas", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-qwen-default-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_BUDGETS_JSON: undefined,
        PROVIDER_USAGE_BUDGETS_PATH: path.join(dir, "missing-budgets.json"),
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: undefined,
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath
      },
      async () => {
        await appendProviderUsageRecord({
          providerId: "modelscope-api",
          model: "Qwen-Ambassador/Qwen3.7-Max",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 2500,
            input_tokens: 1,
            output_tokens: 1,
            thinking_tokens: 0,
            total_tokens: 2
          },
          context: { ledgerPath },
          now: new Date("2026-06-13T00:01:00.000Z")
        });
        await appendProviderUsageRecord({
          providerId: "modelscope-api",
          model: "Qwen-Ambassador/Qwen3.7-Plus",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 10000,
            input_tokens: 1,
            output_tokens: 1,
            thinking_tokens: 0,
            total_tokens: 2
          },
          context: { ledgerPath },
          now: new Date("2026-06-13T00:01:00.000Z")
        });

        for (const model of [
          "Qwen-Ambassador/Qwen3.7-Max",
          "Qwen-Ambassador/Qwen3.7-Plus"
        ]) {
          await assert.rejects(
            guardProviderUsageRequest({
              providerId: "modelscope-api",
              model,
              estimatedUsage: {
                requests: 1,
                input_tokens: 1,
                output_tokens: 1,
                thinking_tokens: 0,
                total_tokens: 2
              },
              context: { ledgerPath },
              now: new Date("2026-06-14T00:01:00.000Z"),
              maxAutoDelayMs: 0
            }),
            (error) =>
              error instanceof ProviderUsageBudgetError &&
              /request_limit_per_month/.test(error.message)
          );
        }
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("default OpenAI mini policy aggregates the shared complimentary token pool", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-openai-mini-pool-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_BUDGETS_JSON: undefined,
        PROVIDER_USAGE_BUDGETS_PATH: path.join(dir, "missing-budgets.json"),
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: undefined,
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath
      },
      async () => {
        await appendProviderUsageRecord({
          providerId: "openai-api",
          model: "gpt-5.4-mini",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 1,
            input_tokens: 9_999_990,
            output_tokens: 0,
            thinking_tokens: 0,
            total_tokens: 9_999_990
          },
          context: { ledgerPath },
          now: new Date("2026-06-14T00:01:00.000Z")
        });

        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "openai-api",
            model: "gpt-5.4-nano",
            estimatedUsage: {
              requests: 1,
              input_tokens: 11,
              output_tokens: 0,
              thinking_tokens: 0,
              total_tokens: 11
            },
            context: { ledgerPath },
            now: new Date("2026-06-14T00:02:00.000Z"),
            maxAutoDelayMs: 0
          }),
          (error) =>
            error instanceof ProviderUsageBudgetError &&
            /total_token_limit_per_day/.test(error.message)
        );
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("local emergency brakes are enforced in addition to default provider policies", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-local-brake-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_BUDGETS_JSON: JSON.stringify({
          budgets: [
            {
              provider_id: "openai-api",
              model: "gpt-5.5",
              request_limit_per_day: 0,
              mode: "enforce",
              source: "test emergency brake"
            }
          ]
        }),
        PROVIDER_USAGE_BUDGETS_PATH: path.join(dir, "missing-budgets.json"),
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: undefined,
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath
      },
      async () => {
        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "openai-api",
            model: "gpt-5.5",
            estimatedUsage: {
              requests: 1,
              input_tokens: 1,
              output_tokens: 0,
              thinking_tokens: 0,
              total_tokens: 1
            },
            context: { ledgerPath },
            now: new Date("2026-06-14T00:02:00.000Z"),
            maxAutoDelayMs: 0
          }),
          (error) =>
            error instanceof ProviderUsageBudgetError &&
            /request_limit_per_day/.test(error.message) &&
            (error.decision.quota_checks?.length ?? 0) >= 2
        );
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Gemini provider usage guard resets daily budget on Pacific day boundary", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-pacific-day-"));
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
              model: "gemini-2.5-flash",
              total_token_limit_per_day: 100,
              mode: "enforce"
            }
          ]
        })
      },
      async () => {
        await appendProviderUsageRecord({
          providerId: "gemini-api",
          model: "gemini-2.5-flash",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 1,
            input_tokens: 70,
            output_tokens: 20,
            thinking_tokens: 0,
            total_tokens: 90
          },
          context: { ledgerPath },
          now: new Date("2026-06-01T23:59:00.000Z")
        });

        await assert.rejects(
          guardProviderUsageRequest({
            providerId: "gemini-api",
            model: "gemini-2.5-flash",
            estimatedUsage: {
              requests: 1,
              input_tokens: 50,
              output_tokens: 1,
              thinking_tokens: 0,
              total_tokens: 51
            },
            context: { ledgerPath },
            now: new Date("2026-06-02T00:01:00.000Z"),
            maxAutoDelayMs: 0
          }),
          (error) =>
            error instanceof ProviderUsageBudgetError &&
            /total_token_limit_per_day/.test(error.message)
        );

        const decision = await guardProviderUsageRequest({
          providerId: "gemini-api",
          model: "gemini-2.5-flash",
          estimatedUsage: {
            requests: 1,
            input_tokens: 50,
            output_tokens: 1,
            thinking_tokens: 0,
            total_tokens: 51
          },
          context: { ledgerPath },
          now: new Date("2026-06-02T07:01:00.000Z"),
          maxAutoDelayMs: 0
        });

        assert.equal(decision.status, "allowed");
        assert.equal(decision.projected?.day.total_tokens, 51);
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider usage records include UTC quota day for OpenAI free-token auditing", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-record-day-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    const record = await appendProviderUsageRecord({
      providerId: "openai-api",
      model: "gpt-5.4-mini",
      status: "succeeded",
      usageSource: "estimated",
      usage: {
        requests: 1,
        input_tokens: 1,
        output_tokens: 1,
        thinking_tokens: 0,
        total_tokens: 2
      },
      context: { ledgerPath },
      now: new Date("2026-06-02T00:01:00.000Z")
    });

    assert.equal(record.quota_day_utc, "2026-06-02");
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

test("OpenAI usage normalization accepts Responses API token fields", () => {
  const normalized = normalizeOpenAiUsage(
    {
      input_tokens: 11,
      output_tokens: 7,
      output_tokens_details: {
        reasoning_tokens: 3
      },
      total_tokens: 18
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
    input_tokens: 11,
    output_tokens: 7,
    thinking_tokens: 3,
    total_tokens: 18
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

test("provider usage summary exposes missing budget status", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "provider-usage-summary-missing-budget-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    await withUsageEnv(
      {
        PROVIDER_USAGE_ALLOW_UNBUDGETED: undefined,
        PROVIDER_USAGE_BUDGETS_JSON: undefined,
        PROVIDER_USAGE_BUDGETS_PATH: path.join(dir, "missing-budgets.json"),
        PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS: "1",
        PROVIDER_USAGE_ENFORCEMENT: undefined,
        PROVIDER_USAGE_LEDGER_PATH: ledgerPath
      },
      async () => {
        await appendProviderUsageRecord({
          providerId: "openai-api",
          model: "gpt-5.5",
          status: "succeeded",
          usageSource: "estimated",
          usage: {
            requests: 1,
            input_tokens: 10,
            output_tokens: 5,
            thinking_tokens: 0,
            total_tokens: 15
          },
          context: { ledgerPath, runId: "run-unbudgeted" }
        });

        const summary = await summarizeProviderUsage({ ledgerPath, runId: "run-unbudgeted" });
        assert.equal(summary.records, 1);
        assert.equal(summary.budget_status[0]?.status, "blocked");
        assert.match(summary.budget_status[0]?.reason ?? "", /without a local budget/);
      }
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
