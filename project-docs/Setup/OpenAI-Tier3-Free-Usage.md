# OpenAI API — Tier 3 data-sharing free daily usage

Status: supporting reference. Active provider guard commands live in
`project-docs/Setup/Provider-Setup.md`. Daily reset windows and Korea-time
conversions live in `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`.

Recorded for this repo’s **`openai` provider** experiments (not `openai-codex` / ChatGPT Codex backend).

## Eligibility

When your organization is eligible to share evaluation/traffic with OpenAI, daily free token pools apply. See:

- [Sharing feedback, evaluation, and fine-tuning data (and API inputs/outputs) with OpenAI](https://help.openai.com/en/articles/10306912-sharing-feedback-evaluation-and-fine-tuning-data-and-api-inputs-and-outputs-with-openai)

## Free daily token pools (summary)

| Pool | Limit | Example models |
|------|--------|----------------|
| **Large** | Up to **1M tokens / day** | `gpt-5.4`, `gpt-5.2`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-5`, `gpt-5-codex`, `gpt-5-chat-latest`, `gpt-4.1`, `gpt-4o`, `o1`, `o3` |
| **Mini / nano** | Up to **10M tokens / day** | `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.1-codex-mini`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-4o-mini`, `o1-mini`, `o3-mini`, `o4-mini`, `codex-mini-latest` |

Usage beyond these pools, and usage on models outside the lists, is billed at standard rates. Some limitations apply (see OpenAI help article above).
OpenAI states that the complimentary-token counter refreshes daily at 00:00 UTC,
and that a request crossing the quota is billed in full. The repo usage guard
therefore tracks `quota_day_utc` for daily budget decisions.

## This repo

- **Auth:** `OPENAI_API_KEY` in repo-root `.env` (gitignored).
- **Prior experiment model:** `gpt-5.4-mini` (mini pool, 10M tokens/day).
- **Not the same as:** `openai-codex` gameplay provider (`chatgpt.com/backend-api/codex/responses`) or `build/provider-auth/openai-codex-auth.json`.
- **Structured output:** the active OpenAI path uses Responses API JSON schema
  output or Responses function calling. The social-cycle provider path does not
  expose an output-token cap; let provider output complete unless a separate
  throwaway smoke test is intentionally bounding output outside the runtime.
- **`.env` loading:** experiment scripts call `loadRepoDotEnv(repo, { overrideKeys: ["OPENAI_API_KEY"] })` so a stale shell `OPENAI_API_KEY` does not shadow repo `.env`.
- **Planner matrix script:** `probe/scripts/experimentPlannerProviderMatrix.ts` → `tmp/planner-provider-matrix-report.json`.

## Gemini contrast (operator free-tier reference)

| Model | RPM | TPM | RPD |
|-------|-----|-----|-----|
| Gemini 3.1 Flash Lite | 15 | 250k | 500 |
| Gemma 4 31B | 15 | unlimited | 1.5k |

Treat this table as operator-provided guardrail input, not as an official quota
guarantee. Google documents that Gemini API rate limits vary by project, model,
and tier, and that active limits should be checked in AI Studio. The repo's
usage guard can encode this table through
`PROVIDER_USAGE_BUDGETS_JSON` or `build/provider-usage/free-tier-budgets.json`
before a long run.

See `project-docs/Architecture/Gemini-Native-Audio-Codegen-Verdict.md` — Native Audio Dialog is not used for codegen.
