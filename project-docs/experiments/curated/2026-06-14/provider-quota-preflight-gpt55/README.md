# Provider Quota Preflight For GPT-5.5 Benchmark

Search token: `EXPERIMENT_2026_06_14_PROVIDER_QUOTA_PREFLIGHT_GPT55`.

Status: preflight completed; `gpt-5.5` benchmark not run.

## Request

The operator asked whether the placed-furnace benchmark could be rerun after
quota reset with `gpt-5.5` medium reasoning. The preflight also checked related
benchmark candidates because provider/model quotas are provider-specific and
some pools are shared.

## Preflight Inputs

- Estimated run size: 110 provider requests, 3,200,000 total tokens.
- Estimated peak minute usage: 1 provider request/minute.
- Ledger: `build/provider-usage/provider-usage-ledger.jsonl`
- Local budgets: `build/provider-usage/free-tier-budgets.json`
- Generated artifact: `preflight.json`

The estimate is intentionally conservative and based on recent 60-cycle
Minecraft social-cycle runs, including the Qwen placed-furnace benchmark.

## Result

| Provider | Model | Status | Reason |
| --- | --- | --- | --- |
| `openai-api` | `gpt-5.5` | blocked | Projected 3.2M tokens exceeds the 1M/day large-model pool, and the local `gpt-5.5` emergency brake is still `0` requests. |
| `openai-api` | `gpt-5.4-mini` | needs dashboard approval | Local ledger and budgets are under the mini pool cap, but OpenAI still requires dashboard/free-tier eligibility and operator approval before any live benchmark. |
| `modelscope-api` | `Qwen-Ambassador/Qwen3.7-Max` | allowed | Monthly API-call guard remains under cap. |
| `modelscope-api` | `Qwen-Ambassador/Qwen3.7-Plus` | allowed | Monthly API-call guard remains under cap. |

## Decision

Do not run the `gpt-5.5` medium benchmark from this preflight. The reset window
being fresh is not sufficient because the estimated run exceeds the relevant
OpenAI large-model free-token pool and the local emergency brake explicitly
blocks this model after the earlier billing incident.

Qwen Max/Plus remain the safer live benchmark providers for this scenario
because their monthly API-call quotas are explicit and the local ledger is well
under the monthly caps.
