---
sidebar_position: 30
---

# Provider Free-Tier Reset Windows

Search token: `PROVIDER_FREE_TIER_RESET_WINDOWS`.

Status: active provider-budget operation reference.

Recorded: 2026-06-01.

This page records the reset windows that agents must check before long
provider-backed Minecraft runs. It is about API provider usage for this repo,
not ChatGPT/Codex desktop subscription usage.

## OpenAI API Data-Sharing Complimentary Tokens

Official source:

- OpenAI Help Center: "Sharing feedback, evaluation and fine-tuning data, and
  API inputs and outputs with OpenAI."

Reset rule:

- OpenAI states that the free-token counter resets daily at `00:00 UTC`.
- Korea Standard Time is UTC+9, so the reset is always `09:00 KST`.

Operational rule:

- For `openai-api` free-token runs, treat the quota day as UTC day.
- Do not use Korea calendar-day midnight as the reset boundary.
- Before long runs, check the provider dashboard when available and encode
  dashboard usage into `PROVIDER_USAGE_BUDGETS_JSON` or
  `build/provider-usage/free-tier-budgets.json` as `already_used`.
- The repo ledger uses `quota_day_utc` for `openai-api` daily budget decisions.

Examples:

| UTC reset | Korea time |
|-----------|------------|
| `2026-06-01 00:00 UTC` | `2026-06-01 09:00 KST` |
| `2026-06-02 00:00 UTC` | `2026-06-02 09:00 KST` |

## Gemini API Free-Tier RPD

Official source:

- Google AI for Developers: "Gemini API rate limits."

Reset rule:

- Google states that Gemini API Requests Per Day (`RPD`) quotas reset at
  midnight Pacific time.
- Pacific time changes with daylight saving time:
  - Pacific Daylight Time (`PDT`, UTC-7): `00:00 PT` = `16:00 KST`.
  - Pacific Standard Time (`PST`, UTC-8): `00:00 PT` = `17:00 KST`.

Operational rule:

- For Gemini API daily request budgets, convert from the
  `America/Los_Angeles` timezone rather than assuming a fixed UTC hour.
- The repo ledger uses `pacific_day` for `gemini-api` daily budget decisions.
- Check current model/project/tier limits in Google AI Studio before long runs.
- If the live API returns a `QuotaFailure` with `quotaValue`, treat that value
  as authoritative for the current project/model. On 2026-06-01, this repo's
  key observed `gemini-2.5-flash` returning
  `GenerateRequestsPerDayPerProjectPerModel-FreeTier` with `quotaValue: 20`;
  do not assume public model names are "roomy" without checking the active
  project quota.
- The repo's `gemma-4-31b-it` budget is an operator guardrail, not an official
  quota guarantee.
- RPM/TPM windows are minute-rate limits; this document only records daily RPD
  reset behavior.

Examples:

| Pacific reset | UTC equivalent | Korea time |
|---------------|----------------|------------|
| `00:00 PDT` | `07:00 UTC` | `16:00 KST` |
| `00:00 PST` | `08:00 UTC` | `17:00 KST` |

## Before Long Live Runs

1. Identify provider/model and the applicable pool.
2. Determine the current provider quota day:
   - OpenAI API complimentary-token pool: UTC day, reset `09:00 KST`.
   - Gemini API RPD: Pacific day, reset `16:00 KST` during PDT or `17:00 KST`
     during PST.
3. Check local ledger totals:

   ```bash
   tail -20 build/provider-usage/provider-usage-ledger.jsonl
   ```

4. If dashboard usage differs from the local ledger, encode the dashboard usage
   as `already_used`.
5. Run a short smoke/live cycle before a long cycle when input shape or provider
   usage has changed.

## Related Files

- `project-docs/Setup/Provider-Setup.md`
- `project-docs/Setup/OpenAI-Tier3-Free-Usage.md`
- `probe/src/provider/providerUsageTracker.ts`
- `build/provider-usage/free-tier-budgets.json` (ignored local state)
