# OpenAI API - Tier 3 data-sharing free daily usage

Status: billing-sensitive provider reference. Active runtime guard rules live in
`project-docs/Setup/Provider-Setup.md`. Daily reset windows and Korea-time
conversions live in `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`.

Recorded for this repo's `openai-api` experiments, not ChatGPT, Codex app
usage, or the old `openai-codex` gameplay auth path.

Source captured by the user:

```text
/Users/naem1023/.codex/attachments/5b64cf4f-829c-4f2f-87df-9252e6d27a73/pasted-text.txt
```

The source is the OpenAI help article "Sharing feedback, evaluation and
fine-tuning data, and API inputs and outputs with OpenAI", shown as updated
6 days before capture.

## Eligibility Is Required

Complimentary daily tokens are not automatic for every API request. The source
states that all of these must be true:

- the organization is eligible for the complimentary token offer;
- an organization owner has opted in to share API inputs and outputs with
  OpenAI, either for all projects or selected projects;
- the request is sent through an enabled project;
- the account has a positive account balance;
- the model is included in the offer;
- the usage is normal prompt/completion traffic. Fine-tuned models,
  fine-tuning training, evals, and tool use are not included by the article.

If the OpenAI dashboard does not show the free daily usage eligibility/enrollment
language, do not assume OpenAI API usage is free.

## Tier 3-5 Daily Pools

For usage tiers 3-5, the source lists these shared daily token groups:

| Pool | Limit | Listed models |
| --- | ---: | --- |
| Large | 1,000,000 tokens/day | `gpt-5.5-2026-04-23`, `gpt-5.4-2026-03-05`, `gpt-5.2-2025-12-11`, `gpt-5.1-2025-11-13`, `gpt-5.1-codex`, `gpt-5-codex`, `gpt-5-2025-08-07`, `gpt-5-chat-latest`, `gpt-4.1-2025-04-14`, `gpt-4o-2024-05-13`, `gpt-4o-2024-08-06`, `gpt-4o-2024-11-20`, `o3-2025-04-16`, `o1-preview-2024-09-12`, `o1-2024-12-17` |
| Mini/nano | 10,000,000 tokens/day | `gpt-5.4-mini-2026-03-17`, `gpt-5.4-nano-2026-03-17`, `gpt-5.1-codex-mini`, `gpt-5-mini-2025-08-07`, `gpt-5-nano-2025-08-07`, `gpt-4.1-mini-2025-04-14`, `gpt-4.1-nano-2025-04-14`, `gpt-4o-mini-2024-07-18`, `o4-mini-2025-04-16`, `o1-mini-2024-09-12`, `codex-mini-latest` |

The quota is shared across every model in the same pool. For example,
`gpt-5.4-mini-2026-03-17` and `gpt-5.4-nano-2026-03-17` draw from the same
10M/day pool.

## Reset And Overage Rule

The free-token counter refreshes daily at `00:00 UTC`.

OpenAI checks each new request against the running total for that UTC day. If a
single request would make the running total exceed the daily pool, that entire
request is billed at normal rates. This means a local guard must stop before the
estimated request crosses the pool; it is not enough to be only slightly below
the limit before sending.

## `gpt-5.4-mini`

The captured OpenAI article lists `gpt-5.4-mini-2026-03-17` in the Tier 3-5
10M/day mini/nano token pool. The short alias `gpt-5.4-mini` should be treated
as eligible only if the active API model resolves to that listed model or the
dashboard confirms the request is counted under the data-sharing incentive tier.

Repo rule: before any `openai-api` benchmark using `gpt-5.4-mini`, report:

- current repo-ledger usage for the OpenAI mini/nano pool in the active UTC day;
- projected input/output/reasoning token estimate for the requested benchmark;
- whether the request may use any excluded OpenAI tool/eval/fine-tuning path;
- the remaining local cap and the risk that dashboard state could differ from
  the local ledger;
- an explicit operator approval request.

Do not run OpenAI API experiments merely because the local ledger is under 10M
tokens. Dashboard eligibility and project data-sharing state are billing
preconditions.

## Repo Guard Implementation

The active guard implementation is in:

```text
probe/src/provider/providerUsageTracker.ts
probe/src/provider/providerQuotaPolicies.ts
```

Built-in OpenAI policies:

- large data-sharing pool: `total_token_limit_per_day: 1000000`;
- mini/nano data-sharing pool: `total_token_limit_per_day: 10000000`;
- reset window: UTC day;
- matching: model-pattern pool, so usage aggregates across all matching models.

Local ignored budgets may add stricter brakes. The current local budget file
keeps a 9M/day local cap for `gpt-5.4-mini` and `gpt-5.4-nano`, and a zero-use
emergency brake for `gpt-5.5` until the operator explicitly re-approves OpenAI
API spending.

```text
build/provider-usage/free-tier-budgets.json
build/provider-usage/provider-usage-ledger.jsonl
```

## Related Providers

Gemini and ModelScope Qwen use different quota units:

- Gemini can combine RPM, RPD, and TPM windows that vary by model/project.
- ModelScope Qwen Ambassador is API-call based for this repo:
  `Qwen-Ambassador/Qwen3.7-Max` has 2500 calls/month and
  `Qwen-Ambassador/Qwen3.7-Plus` has 10000 calls/month.

Do not reuse OpenAI token-pool assumptions for Qwen or Gemini.
