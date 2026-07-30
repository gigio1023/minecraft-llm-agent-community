# OpenAI API Data-Sharing Complimentary Daily Usage

Status: billing-sensitive provider reference. Active runtime guard rules live in
`project-docs/operations/setup/provider-setup.md`. Reset windows and Korea-time
conversion live in
`project-docs/operations/setup/provider-free-tier-reset-windows.md`.

Recorded: 2026-07-24 (`Asia/Seoul`).

This document is for this repo's `openai-api` experiments. It does not describe
ChatGPT, Codex app usage, or the retired `openai-codex` gameplay auth path.

## Candidate Authority

The only OpenAI complimentary-usage model candidates allowed in this repo are
the exact aliases in the eligibility notice copied from the operator's active
OpenAI dashboard on 2026-07-23 and confirmed by the operator on 2026-07-24.

The OpenAI Help Center article
["Sharing feedback, evaluation and fine-tuning data, and API inputs and outputs with OpenAI"](https://help.openai.com/en/articles/10306912-sharing-feedback-evals-and-api-data-with-openai)
supports the general eligibility, reset, and overage rules below. It does not
expand this repo's candidate list.

Hard rule: do not substitute a dated snapshot, newer model, family-relative
name, or model that appears only in a public article. Any exact model not listed
below is `unbudgeted` until the operator supplies a new dashboard notice and
asks to update this record.

## Eligibility Preconditions

Complimentary daily tokens are not automatic for every API request. The
dashboard notice and supporting Help Center article require all of these:

- the organization is eligible for complimentary shared traffic;
- API input/output sharing is enabled for the exact project used by the key;
- the request is sent through that enabled project;
- the account has a positive balance;
- the exact model alias is in the active dashboard notice;
- the request type is included in the offer.

The Help Center article excludes fine-tuning, evals, and tool use. Actor Turn
uses required function tools, so the model list alone does not prove an Actor
Turn request is complimentary. Treat that path as billing-sensitive until a
separately approved tool-call canary and a before/after dashboard observation
show how it is classified.

## Operator-Provided Daily Pools

| Pool | Limit | Exact allowed aliases |
| --- | ---: | --- |
| Large | 1,000,000 tokens/day | `gpt-5.4`, `gpt-5.2`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-5`, `gpt-5-codex`, `gpt-5-chat-latest`, `gpt-4.1`, `gpt-4o`, `o1`, `o3` |
| Mini/nano | 10,000,000 tokens/day | `gpt-5.4-mini`, `gpt-5.4-nano`, `gpt-5.1-codex-mini`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-4o-mini`, `o1-mini`, `o3-mini`, `o4-mini`, `codex-mini-latest` |

Usage is shared across every alias in the same pool. For example,
`gpt-5.4-mini` and `gpt-5.4-nano` draw from the same 10M/day pool.

Explicit exclusions include `gpt-5.5`, every GPT-5.6 variant, and dated model
snapshots. They are absent from the operator-provided notice and therefore are
not free-tier candidates in this repo even if a public page mentions them.

## Selected Model: `gpt-5.4`

The selected OpenAI model for the next provider-capability work is exactly:

```text
openai-api:gpt-5.4
```

It belongs to the operator-provided 1M/day shared pool. Do not silently fall
back to `gpt-5.4-mini`, a dated snapshot, GPT-5.5, or GPT-5.6.

Before any live `openai-api:gpt-5.4` request, record:

- current repo-ledger usage for the large-model pool in the active UTC day;
- current dashboard usage for that same UTC day;
- projected input, output, reasoning, and total tokens for the whole lane;
- whether the request uses function tools or another excluded request type;
- the remaining local and dashboard capacity;
- explicit operator approval for the exact canary or lane.

The next GPT-5.4 plan uses a stricter campaign ceiling below the 1M pool. The
runtime still needs a matching ignored local budget entry before execution.
Historical local entries for `gpt-5.4-mini`, `gpt-5.4-nano`, or `gpt-5.5` do
not authorize `gpt-5.4`.

## Reset And Overage Rule

The complimentary counter refreshes at `00:00 UTC` (`09:00 KST`).

OpenAI checks a new request against the running total for that UTC day. If the
request would cross the remaining pool, that entire request is billed at
standard rates. A live run must stop before the estimated next request crosses
the campaign ceiling; being slightly below the limit before sending is not
enough.

## Repo Guard Implementation

The active guard implementation is:

```text
probe/src/provider/providerUsageTracker.ts
probe/src/provider/providerQuotaPolicies.ts
```

Built-in policies:

- exact operator-provided large aliases: 1,000,000 total tokens per UTC day;
- exact operator-provided mini/nano aliases: 10,000,000 total tokens per UTC
  day;
- usage aggregates across each shared pool;
- quota authority is `operator_provided_doc`;
- OpenAI preflight still requires current dashboard approval.

Local ignored budgets may impose stricter request and token brakes:

```text
build/provider-usage/free-tier-budgets.json
build/provider-usage/provider-usage-ledger.jsonl
```

Never use `PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS=1`, tracking mode, or an
unbudgeted override for a live benchmark.

## Related Providers

OpenAI pool semantics do not apply to Qwen:

- ModelScope `Qwen-Ambassador/Qwen3.7-Max`: 2,500 API calls/month;
- ModelScope `Qwen-Ambassador/Qwen3.7-Plus`: 10,000 API calls/month;
- Model Studio `qwen3.8-max-preview`: 120 RPM and 500K TPM per person, with no
  announced aggregate token cap; this capacity statement does not by itself
  prove billing treatment.
