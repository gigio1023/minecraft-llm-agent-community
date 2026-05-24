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
reviewer providers. It uses the OpenAI API key in the repo-root `.env`.

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
with Gemini 2.5 Flash as the current primary path:

```text
GEMINI_API_KEY=...                         # ignored local only
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai,live-transcription
```

Behavior:

- long-objective and direct-generated calls remain evaluation or propagation
  tracks, not the social-life runtime;
- objective reports must distinguish LLM output from builtin fallback and helper
  expansion;
- Native Audio Dialog remains dialog/smoke only. It is not the primary path for
  generating `export async function run(ctx)` code.

Real validation command (preferred over smoke-only checks):

```bash
cd probe
bun run server:ready
bun run probe:long-objective -- \
  --objective craft_current_run_stone_pickaxe_1 \
  --actor npc_b \
  --provider gemini-live-planner \
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

The Soul/LifeGoal/CycleGoal vertical slice uses the OpenAI API directly, not the
Codex auth store. The key must live in the repo-root `.env`.

```text
# repo-root .env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
SOCIAL_CYCLE_REASONING=low
SOCIAL_CYCLE_MAX_COMPLETION_TOKENS=1600
```

`gpt-5.4-mini` is the default because eligible accounts may have free-tier mini
model access. Do not treat that eligibility as guaranteed.

Run:

```bash
cd probe
OPENAI_MODEL=gpt-5.4-mini bun run probe:social-cycle -- \
  --actor npc_b \
  --provider openai-api \
  --cycles 2 \
  --max-actions-per-cycle 3 \
  --report ../tmp/social-cycle-openai-real-action.json \
  --no-dashboard
```

Use `deterministic-social` only for tests and baseline implementation reports.
It must mark builtin goal authority so it cannot be confused with OpenAI agency.
If `gpt-5.4-mini` is unavailable, retry with `OPENAI_MODEL=gpt-5-mini`.

Do not use `openai-codex` or `build/provider-auth/openai-codex-auth.json` for
`probe:social-cycle --provider openai-api`.
