---
sidebar_position: 2
---

# Provider Setup

Provider-backed gameplay paths are optional during the rebuild.

Deterministic mode must remain usable without live provider access.

## Current Rule

The runtime owns validation, execution, verification, transcript, and artifacts.

The provider only proposes the next bounded action.

## Auth Store

When this repo says "Codex auth" for gameplay, it means runtime provider auth,
not Codex CLI login.

Use an ignored repo-local auth store such as:

```text
build/provider-auth/openai-codex-auth.json
```

Do not commit or print raw tokens.

## Provider Role In The Current Rebuild

Provider-backed paths are useful for:

- next action proposal;
- later trace inspection.

The social-cycle provider path is separate from the `openai-codex` gameplay and
reviewer providers. It can use Gemini API (`gemini-api`), OpenAI API
(`openai-api`), or ModelScope API-Inference (`modelscope-api`) from the
repo-root `.env`.

Private Qwen models exposed through ModelScope API-Inference are documented in
`project-docs/Setup/ModelScope-Qwen-API-Access.md`. The `modelscope-api`
adapter uses OpenAI-compatible Chat Completions transport, not the OpenAI
Responses API path used by `openai-api`.

## Provider Usage Guard

Search token: `PROVIDER_USAGE_GUARD`.

Provider-backed calls must be auditable before and after a run:

- before the request, the runtime checks all matching provider/model quota
  policies and local brakes;
- if no budget matches, the guard fails closed by default and refuses the live
  provider request;
- after the request, the provider output snapshot stores the usage record;
- the ignored global ledger appends one JSONL row per provider request;
- the social-cycle report includes `provider_usage` totals for the run.

For daily free-tier reset windows and Korea-time conversions, read
`project-docs/Setup/Provider-Free-Tier-Reset-Windows.md` before long live
runs. In short: OpenAI API complimentary-token budgets reset at `00:00 UTC`
(`09:00 KST`), while Gemini API daily `RPD` budgets reset at midnight Pacific
time (`16:00 KST` during PDT, `17:00 KST` during PST).

Default ignored ledger path:

```text
build/provider-usage/provider-usage-ledger.jsonl
```

Budget overrides:

```text
PROVIDER_USAGE_BUDGETS_PATH=build/provider-usage/free-tier-budgets.json
PROVIDER_USAGE_BUDGETS_JSON='{"budgets":[...]}'
PROVIDER_USAGE_ENFORCEMENT=enforce
```

Do not start a live benchmark with a paid or quota-limited provider/model until
that exact model has a local budget entry. `unbudgeted` is not an allowed
benchmark state. To run a deliberate smoke test without a budget, the operator
must explicitly set both `PROVIDER_USAGE_ENFORCEMENT=track` and
`PROVIDER_USAGE_ALLOW_UNBUDGETED=1` for that process and record why the run is
not protected by the local brake. Long or comparison benchmarks must not use
those overrides.

Every live provider HTTP request must pass the guard immediately before the
request is sent. Generation calls include estimated input/output token usage.
Non-generating provider calls, such as OpenAI Responses background polling, are
tracked as `requests: 1` with zero tokens so request-count budgets still apply.

The guard has a built-in provider/model quota policy matrix in
`probe/src/provider/providerQuotaPolicies.ts`. Local JSON budgets are additional
brakes or overrides; they do not replace the need for the built-in policy unless
`PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS=1` is deliberately set for a focused
test. A request is allowed only if every matching enforced policy remains under
limit. This matters for shared pools such as OpenAI's complimentary mini/nano
token group, where `gpt-5.4-mini` and `gpt-5.4-nano` draw from the same daily
pool rather than isolated per-model counters.

Current built-in quota policy types:

| Provider | Models | Metric | Window | Active guard |
| --- | --- | --- | --- | --- |
| `openai-api` | documented large-model data-sharing group | total tokens | UTC day | 1M/day shared pool |
| `openai-api` | documented mini/nano data-sharing group | total tokens | UTC day | 10M/day shared pool |
| `modelscope-api` | `Qwen-Ambassador/Qwen3.7-Max` | API calls | calendar month | 2500 calls/month |
| `modelscope-api` | `Qwen-Ambassador/Qwen3.7-Plus` | API calls | calendar month | 10000 calls/month |
| `gemini-api` | configured Gemini/Gemma free-tier references | requests/tokens | Pacific day/minute | operator-observed RPM/RPD/TPM brakes |

Budget JSON shape:

```json
{
  "schema": "provider-usage-budgets/v1",
  "budgets": [
    {
      "provider_id": "gemini-api",
      "model": "gemma-4-31b-it",
      "request_limit_per_minute": 15,
      "request_limit_per_day": 1500,
      "request_limit_per_month": 30000,
      "already_used": { "requests": 0 },
      "already_used_this_month": { "requests": 0 },
      "mode": "enforce"
    }
  ]
}
```

`already_used` is for user-provided current free-tier usage before starting a
run. Use it when AI Studio or another provider dashboard says the project has
already consumed part of the free-tier pool. This is intentionally local and
ignored; do not commit personal usage state.

Monthly limits use the same local ledger and are keyed by UTC `YYYY-MM`.
`request_limit_per_month`, `input_token_limit_per_month`,
`output_token_limit_per_month`, and `total_token_limit_per_month` are local
operator brakes. `already_used_this_month` is only for usage that happened
outside this repo's ledger. For ModelScope Qwen Ambassador access, the
operator-provided quota is API-call based, not token based:
`Qwen-Ambassador/Qwen3.7-Max` has 2500 API calls/month and
`Qwen-Ambassador/Qwen3.7-Plus` has 10000 API calls/month. The monthly allowance
resets at the end of each calendar month. Future flagship model ids may replace
the current Qwen 3.7 ids; update the policy matrix and local budget file before
using a new id.

Daily provider budget windows are provider-specific. `openai-api` uses
`quota_day_utc`, because OpenAI's complimentary-token counter refreshes at
00:00 UTC. `gemini-api` uses `pacific_day`, because Gemini API daily RPD resets
at midnight Pacific time.

OpenAI API calls need an additional operator approval step before any live
benchmark. The data-sharing complimentary tokens apply only when the org is
eligible, the relevant project is sharing API inputs/outputs with OpenAI, the
account has positive balance, and the actual model is in the documented offer.
If one request would cross the daily token pool, that entire request is billed
at normal rates. Therefore, before any `openai-api` benchmark, report the
ledger's current UTC-day usage, estimate the requested batch's tokens, state
whether the model appears in the eligible pool, and ask the operator for
approval. Do not infer that a request is free merely because the repo ledger is
under the local cap.

The built-in `gemma-4-31b-it` budget is an operator guardrail, not an official
quota guarantee. Google documents that Gemini API limits vary by project, tier,
and model, and that active limits should be checked in AI Studio.

The repo also carries Gemini Flash Lite-like request/token window guards based
on operator free-tier references. Treat these as project/model safety caps, not
universal Gemini quota guarantees. If a live Gemini API error reports a lower
`quotaValue`, encode the stricter value in the ignored local budget file before
continuing a run.

## Social-Cycle Model Selection

`probe:social-cycle` does not choose live provider models from environment
fallbacks. For `openai-api`, `gemini-api`, and `modelscope-api`, pass the exact
model id with `--model` on every run. The CLI intentionally ignores
`OPENAI_MODEL`, `GEMINI_MODEL`, `MODELSCOPE_MODEL`, and `SOCIAL_CYCLE_MODEL`
for social-cycle model selection so benchmark reports cannot hide which model
was evaluated.

`deterministic-social` remains the local baseline and uses
`model: "deterministic-social"` as a harness label, not as an external model
default.

## Social-Cycle Gemini API

Gemini API is the current lightweight path for social-cycle provider tests:

```text
GEMINI_API_KEY=...
```

Small provider-only smoke:

```bash
cd probe
bun run probe:gemini-json-smoke -- \
  --model gemma-4-31b-it \
  --report ../tmp/gemini-json-smoke.json
```

One-cycle social runtime check without connecting to Minecraft:

```bash
cd probe
bun run probe:social-cycle -- \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --offline \
  --report ../tmp/social-cycle-npc-b-gemma31b-offline.json \
  --no-dashboard
```

Experimental Actor Turn bridge check:

```bash
cd probe
bun run probe:social-cycle -- \
  --provider deterministic-social \
  --model deterministic-social \
  --actor npc_b \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --offline \
  --action-hot-path actor_turn \
  --report ../tmp/social-cycle-actor-turn-cli-smoke.json \
  --no-dashboard
```

This check should write `actor-turn-input/v1` provider snapshots and
`action_hot_path: "actor_turn"` in the report. In this mode ordinary turn
judgment is runtime-classified, so per-action `cycle-judgment` provider
snapshots should not appear. A two-cycle non-branch smoke should show one
initial `goal_mind` provider input, four `actor-turn` provider inputs, the same
`active_episode_ref` on both cycles, and no `deliberation_branch_refs`. Offline
runs can still end as `blocked` because they cannot prove Minecraft mutation.

Live social-cycle run:

```bash
cd probe
bun run probe:social-cycle -- \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --actor npc_b \
  --cycles 2 \
  --max-actions-per-cycle 3 \
  --report ../tmp/social-cycle-npc-b-gemma31b.json \
  --no-dashboard
```

The CLI default provider is `deterministic-social`; pass `--provider gemini-api`
or `SOCIAL_CYCLE_PROVIDER=gemini-api` to make live calls explicit. Live provider
runs must also pass `--model`.

## Gameplay Provider Switch

Phase-one gameplay uses the deterministic provider by default.

To opt into the live OpenAI Codex gameplay provider:

```bash
bun run src/cli.ts --provider openai-codex --npcs 3 --observe-ms 120000
```

Equivalent environment form:

```bash
PROBE_GAMEPLAY_PROVIDER=openai-codex PROBE_BOTS=npc_a,npc_b,npc_c PROBE_OBSERVE_MS=120000 bun run probe:v0
```

The live gameplay provider receives:

- current observation;
- current deterministic task;
- last tool result;
- active action skill ids and allowed primitives;
- actor workspace context containing active action skills, candidates, recent
  evidence, recent reviews, and memory.

The provider still returns only one bounded runtime primitive. Runtime action
skill gates and verification decide whether the proposed action can execute or
counts as progress.

If the live provider throws after an actor turn has already observed the world,
the runtime records a failed `provider_error` transcript step and emits a
`provider_failed` dashboard event. When provider input snapshots are enabled,
that failed step still points at the exact provider-facing input packet.

## Live Dashboard

The probe CLI starts the local Elysia dashboard server by default while a probe
is running:

```bash
bun run src/cli.ts --provider openai-codex --npcs 3 --observe-ms 120000
```

Open `http://127.0.0.1:4173`. It refreshes from local files and shows, per NPC:

- latest status and tool evidence;
- raw provider input snapshots;
- raw provider output snapshots when a live provider is used;
- memory files;
- active and candidate action skills;
- relationship edges.

If `provider-outputs/` is empty, the current run either used deterministic mode
or failed before the live provider returned an LLM response.

If `build/provider-auth/openai-codex-auth.json` is missing, the CLI fails before
live gameplay provider turns begin. That is an auth setup blocker, not a
Minecraft action-skill verdict. Do not paste or print token contents while
diagnosing it.

Use `--no-dashboard` to disable the server or `--dashboard-port <port>` to move
it off the default port.

## Gemini Planner For Long Objectives

For long-objective and direct-generated planner calls, use REST `text-genai`
with Gemini 2.5 Flash as the current primary path. The planner returns a
structured JSON envelope whose `source` field contains the TypeScript program:

```text
GEMINI_API_KEY=...                         # ignored local only
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai
```

Behavior:

- long-objective and direct-generated calls remain evaluation or propagation
  tracks, not the social-life runtime;
- objective reports must distinguish LLM output from builtin fallback and helper
  expansion;
- text-genai calls use `@google/genai` structured output
  (`responseMimeType: "application/json"` plus `responseJsonSchema`) and append
  provider usage ledger records;
- Native Audio Dialog is not a fallback or recovery path for generating
  `export async function run(ctx)` code.

Real validation command (preferred over smoke-only checks):

```bash
cd probe
bun run server:ready
bun run probe:long-objective -- \
  --objective craft_current_run_stone_pickaxe_1 \
  --actor npc_b \
  --provider gemini-planner \
  --force-path text-genai \
  --report ../tmp/long-stone-pickaxe-gemini.json
```

Read `AGENTS.md` for testing priority: implementation runs and report feedback
matter more than shallow smoke CLIs.

## Reviewer Provider Switch

Per-actor review jobs use the deterministic reviewer by default.

To opt into the OpenAI Codex reviewer:

```bash
REVIEW_ACTORS_PROVIDER=openai-codex bun run review:actors npc_b
```

The reviewer receives immutable review jobs plus actor workspace context. It can
write findings and draft candidate proposal hints only; active action skill
mutation remains forbidden.

Provider-backed paths are not allowed to silently replace:

- runtime verification;
- transcript evidence;
- checkpoint-like runtime artifacts;
- deterministic baseline coverage.

## Trace Expectations

When provider-backed paths are used, Langfuse traces should help answer:

- what input context the provider saw;
- what bounded proposal it returned;
- whether a malformed or weak proposal contributed to failure.

Trace evidence is supplementary to transcript and runtime artifacts, not a
replacement for them.

## Social Cycle Provider (OpenAI API)

OpenAI API remains an explicit opt-in path for the Soul/LifeGoal/CycleGoal
vertical slice. It is not the default because cost-sensitive runs should not
silently consume paid or exhausted free-tier usage. The key must live in the
repo-root `.env`.

```text
# repo-root .env
OPENAI_API_KEY=...
SOCIAL_CYCLE_REASONING=low
```

Social-cycle provider requests do not expose an output-token cap. OpenAI
Responses requests omit `max_output_tokens`, so a long run fails only on
provider, schema, budget, or runtime evidence rather than an operator-imposed
completion cap.

OpenAI Responses background polling defaults to a 15 minute wait per response
(`OPENAI_RESPONSES_POLL_TIMEOUT_MS`, default `900000`). This is a transport
wait boundary, not an output-token cap. Timeout, rate-limit, and server errors
are retryable within the provider's retry budget.

Run:

```bash
cd probe
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider openai-api \
  --model gpt-5.4-mini \
  --cycles 2 \
  --max-actions-per-cycle 3 \
  --report ../tmp/social-cycle-openai-real-action.json \
  --no-dashboard
```

Use `deterministic-social` only for tests and baseline implementation reports.
It must mark builtin goal authority so it cannot be confused with OpenAI agency.
Do not use OpenAI API for cost-sensitive tests until the local free-tier or paid
budget is known.

Do not use `openai-codex` or `build/provider-auth/openai-codex-auth.json` for
`probe:social-cycle --provider openai-api`.
