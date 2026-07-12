---
name: provider-quota-preflight
description: >
  Use before any live provider-backed Minecraft run, LLM/provider benchmark,
  model availability decision, quota reset check, model-comparison lane,
  report rerun, long social-cycle run, OpenAI/Gemini/ModelScope smoke, or
  provider budget/429/auth issue. Checks requested provider/model candidates
  across OpenAI, Gemini, and ModelScope using reset windows, local usage ledger,
  built-in policy matrix, local emergency brakes, dashboard approval state, and
  whole-run request/token estimates. Trigger for Korean/English prompts like
  "quota 확인", "초기화됐는지", "run gpt/qwen/gemini benchmark", "사용 가능한
  모델인지 체크", and "provider preflight".
---

# Provider Quota Preflight

Use this skill before any live provider-backed benchmark, smoke, rerun,
comparison, or model availability decision. The goal is to prevent paid or
quota-exhausting calls by checking the exact provider/model pair against the
current local usage ledger, provider reset window, default policy matrix, local
emergency brakes, and operator approval evidence.

## Quick Start

1. Identify every requested candidate as `(provider_id, model)`.
   - OpenAI API: `openai-api`, exact model from the command or current policy
     matrix.
   - Gemini API: `gemini-api`, exact model from the command or current policy
     matrix.
   - ModelScope: `modelscope-api`, exact model from the command or current
     policy matrix.
   Do not invent or refresh model names from memory. The exact run candidate and
   `probe/src/provider/providerQuotaPolicies.ts` decide which policy applies.
2. Estimate the whole planned run or lane set, not one request:
   - `requests`
   - `input_tokens`
   - `output_tokens`
   - `thinking_tokens`
   - `total_tokens`
   Also estimate peak one-minute usage separately. For a serial social-cycle
   benchmark this is usually far smaller than total run usage.
3. For social-cycle runs, optionally create a conservative estimate:

   ```bash
   bun run .agents/skills/provider-quota-preflight/scripts/estimate-social-cycle-usage.ts \
     --provider gemini-api \
     --model <exact-model-from-planned-run> \
     --cycles 30 \
     --lanes 1 \
     --max-actions-per-cycle 3
   ```

4. When dashboard usage is known, save one structured observation per provider.
   Only an exact current UTC-day observation can affect OpenAI daily usage:

   ```json
   {
     "schema": "provider-external-already-used/v1",
     "provider_id": "openai-api",
     "quota_day_utc": "2026-07-12",
     "observed_at": "2026-07-12T11:00:00.000Z",
     "period_certainty": "confirmed_exact_utc_day",
     "overlap_with_local_ledger": "unknown",
     "source_note": "Operator copied current UTC-day dashboard totals.",
     "usage": {
       "requests": 8,
       "input_tokens": 0,
       "output_tokens": 0,
       "thinking_tokens": 0,
       "total_tokens": 120000
     }
   }
   ```

   Use `overlap_with_local_ledger: "disjoint"` only when the dashboard count is
   known to exclude local-ledger calls. Otherwise use `unknown` or
   `includes_local`; the preflight uses the larger count instead of adding
   possibly overlapping totals.
5. Run the bundled preflight script from the repo root and write the JSON next
   to the experiment/report artifacts:

   ```bash
   bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
     --candidate openai-api:<exact-model-from-planned-run> \
     --estimate-requests 80 \
     --estimate-total-tokens 1700000 \
     --estimate-requests-per-minute 1 \
     --external-already-used project-docs/experiments/curated/<date>/<run>/preflight/dashboard-usage.json \
     --out project-docs/experiments/curated/<date>/<run>/preflight/openai.json
   ```

6. Treat `blocked`, `unbudgeted`, and `needs_dashboard_approval` as not runnable.
7. For `openai-api`, even an otherwise under-cap result still requires operator
   approval after dashboard/free-tier eligibility is checked. If the user has
   approved a dashboard-checked run, pass both:

   ```bash
   --operator-approved --approval-note "User checked dashboard at <time>; <brief ref>"
   ```

## Candidate Rules

- Always check the exact model string that the run will pass to the CLI. Do not
  rely on `OPENAI_MODEL`, `GEMINI_MODEL`, `MODELSCOPE_MODEL`, or social-cycle
  defaults.
- Check all requested model/provider candidates in the same preflight when the
  benchmark compares models. Quotas can be shared pools, so isolated checks are
  not enough.
- If a model has no matching built-in or local budget, the result is
  `unbudgeted`; do not run a benchmark with it.
- Require planned `requests`, `total_tokens`, and `requests_per_minute`. Missing
  estimates are a blocker, not permission to use defaults.

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
- The repo policy matrix, not this skill text, determines whether the model is
  in a small, large, shared, or unbudgeted pool.
- A local emergency brake with `request_limit_per_day: 0` must block execution
  until the operator explicitly changes local budget state after checking the
  billing dashboard.

## Script Output

The script prints JSON with:

- current UTC/Pacific/month window keys;
- matching policies/budgets;
- projected usage after the planned run;
- every `external_already_used` observation plus the per-policy local,
  external, and selected current-day calculation;
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
- Persist the preflight JSON beside the report artifacts and mention it in the
  report or final answer.
- An `ambiguous_period` observation or a confirmed observation from another UTC
  day is retained for audit but is not counted and cannot complete OpenAI
  dashboard approval.
- After provider-backed runs, compare report `provider_usage` totals and budget
  status against the preflight estimate.

## Reference Files

- `project-docs/operations/setup/provider-setup.md`
- `project-docs/operations/setup/provider-free-tier-reset-windows.md`
- `probe/src/provider/providerQuotaPolicies.ts`
- `probe/src/provider/providerUsageTracker.ts`
- `build/provider-usage/provider-usage-ledger.jsonl` local ignored ledger
- `build/provider-usage/free-tier-budgets.json` local ignored budget overrides
