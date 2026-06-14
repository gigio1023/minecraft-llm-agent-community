---
name: provider-quota-preflight
description: >
  Use before any live LLM/provider benchmark or "can we run this model?" request.
  Checks requested model/provider candidates across OpenAI, Gemini, and
  ModelScope using provider-specific reset windows, local usage ledger, built-in
  quota policy matrix, local emergency brakes, and estimated request/token cost.
  Trigger for Korean/English prompts like "quota 확인", "초기화됐는지",
  "run gpt/qwen/gemini benchmark", "사용 가능한 모델인지 체크", and "provider
  preflight". Do not use for post-hoc chart scoring only.
---

# Provider Quota Preflight

Use this skill before any live provider-backed benchmark, smoke, or model
availability decision. The goal is to prevent paid or quota-exhausting calls by
checking the exact provider/model pair against the current local usage ledger,
provider reset window, default policy matrix, and local emergency brakes.

## Quick Start

1. Identify every requested candidate as `(provider_id, model)`.
   - OpenAI API: `openai-api`, exact model such as `gpt-5.5`.
   - Gemini API: `gemini-api`, exact model such as `gemini-3.1-flash-lite`.
   - ModelScope: `modelscope-api`, exact model such as
     `Qwen-Ambassador/Qwen3.7-Max`.
2. Estimate the whole planned run, not one request:
   - `requests`
   - `input_tokens`
   - `output_tokens`
   - `thinking_tokens`
   - `total_tokens`
   Also estimate peak one-minute usage separately. For a serial social-cycle
   benchmark this is usually far smaller than total run usage.
3. Run the bundled script from the repo root:

   ```bash
   .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
     --candidate openai-api:gpt-5.5 \
     --estimate-requests 80 \
     --estimate-total-tokens 1700000 \
     --estimate-requests-per-minute 1
   ```

4. Treat `blocked`, `unbudgeted`, and `needs_dashboard_approval` as not runnable.
5. For `openai-api`, even an otherwise under-cap result still requires operator
   approval after dashboard/free-tier eligibility is checked.

## Candidate Rules

- Always check the exact model string that the run will pass to the CLI. Do not
  rely on `OPENAI_MODEL`, `GEMINI_MODEL`, `MODELSCOPE_MODEL`, or social-cycle
  defaults.
- Check all requested model/provider candidates in the same preflight when the
  benchmark compares models. Quotas can be shared pools, so isolated checks are
  not enough.
- If a model has no matching built-in or local budget, the result is
  `unbudgeted`; do not run a benchmark with it.

## Reset Windows

- `openai-api`: UTC day. OpenAI complimentary-token counters reset at
  `00:00 UTC`, which is `09:00 KST`.
- `gemini-api`: Pacific day. Daily RPD resets at midnight Pacific time.
- `modelscope-api`: UTC calendar month for this repo's Qwen Ambassador monthly
  API-call guard.

The script reports the current window keys used by the local ledger. A reset
window being fresh does not by itself mean a run is safe; local brakes and
project/provider dashboard state still matter.

## OpenAI-Specific Guardrail

OpenAI API is the most sensitive case in this repo:

- The data-sharing complimentary pool applies only when the org/project/model is
  eligible and the account has positive balance.
- If one request crosses the free-token pool, that entire request can be billed.
- A local ledger under cap is not proof that the dashboard/free-tier pool is
  still available.
- `gpt-5.5` is in the large-model pool, which currently has a 1M token/day
  built-in guard in this repo.
- A local emergency brake with `request_limit_per_day: 0` must block execution
  until the operator explicitly changes local budget state after checking the
  billing dashboard.

## Script Output

The script prints JSON with:

- current UTC/Pacific/month window keys;
- matching policies/budgets;
- projected usage after the planned run;
- per-policy quota checks;
- final status:
  - `allowed`: local policy permits the planned usage;
  - `needs_dashboard_approval`: local policy is under cap, but OpenAI dashboard
    approval is still required;
  - `blocked`: at least one enforced budget/policy would be exceeded;
  - `unbudgeted`: no matching policy exists.

## Gotchas

- Do not use this skill to justify bypassing `ProviderUsageBudgetError`.
- Do not disable default budgets for a benchmark.
- Do not use `track` mode for long or comparison benchmarks.
- Do not turn a reset-time observation into a free-run decision.
- If the user asks to "just run it", still run this preflight first and report
  the exact blocking condition before any provider HTTP request.

## Reference Files

- `project-docs/Setup/Provider-Setup.md`
- `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`
- `probe/src/provider/providerQuotaPolicies.ts`
- `probe/src/provider/providerUsageTracker.ts`
- `build/provider-usage/provider-usage-ledger.jsonl` local ignored ledger
- `build/provider-usage/free-tier-budgets.json` local ignored budget overrides
