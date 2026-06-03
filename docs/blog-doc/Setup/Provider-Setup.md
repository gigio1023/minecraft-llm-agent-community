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
reviewer providers. It can use Gemini API (`gemini-api`) or OpenAI API
(`openai-api`) from the repo-root `.env`.

## Provider Usage Guard

Search token: `PROVIDER_USAGE_GUARD`.

Provider-backed calls must be auditable before and after a run:

- before the request, the runtime checks a local free-tier budget when one
  matches the provider/model;
- after the request, the provider output snapshot stores the usage record;
- the ignored global ledger appends one JSONL row per provider request;
- the social-cycle report includes `provider_usage` totals for the run.

For daily free-tier reset windows and Korea-time conversions, read
`docs/blog-doc/Setup/Provider-Free-Tier-Reset-Windows.md` before long live
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
      "already_used": { "requests": 0 },
      "mode": "enforce"
    }
  ]
}
```

`already_used` is for user-provided current free-tier usage before starting a
run. Use it when AI Studio or another provider dashboard says the project has
already consumed part of the free-tier pool. This is intentionally local and
ignored; do not commit personal usage state.

Daily provider budget windows are provider-specific. `openai-api` uses
`quota_day_utc`, because OpenAI's complimentary-token counter refreshes at
00:00 UTC. `gemini-api` uses `pacific_day`, because Gemini API daily RPD resets
at midnight Pacific time.

The built-in `gemma-4-31b-it` budget is an operator guardrail, not an official
quota guarantee. Google documents that Gemini API limits vary by project, tier,
and model, and that active limits should be checked in AI Studio.

The repo also carries a conservative `gemini-2.5-flash-lite` guard at 20
requests per Pacific day. This is based on a live Gemini API error observed on
2026-06-02 during an Actor Turn social-cycle run:
`GenerateRequestsPerDayPerProjectPerModel-FreeTier` returned `quotaValue: 20`
for `gemini-2.5-flash-lite`. Treat this as a project/model safety cap, not a
universal Gemini quota.

## Social-Cycle Gemini API

Gemini API is the current lightweight path for social-cycle provider tests:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemma-4-31b-it
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
or `SOCIAL_CYCLE_PROVIDER=gemini-api` to make live calls explicit.

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
OPENAI_MODEL=...
SOCIAL_CYCLE_REASONING=low
SOCIAL_CYCLE_MAX_COMPLETION_TOKENS=1600
```

Run:

```bash
cd probe
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider openai-api \
  --model "$OPENAI_MODEL" \
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
