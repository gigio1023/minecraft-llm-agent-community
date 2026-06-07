---
sidebar_position: 12
---

# Single Actor Long-Term Diamond Handoff

Search token: `SINGLE_ACTOR_LONG_TERM_DIAMOND_HANDOFF`.

Status: supporting evaluation harness, not the active product direction.

This page is retained as an opt-in dependency-chain evidence harness. It must
not override `SPEC.md`, the Soul/LifeGoal social runtime, or the current
single-actor social-cycle direction.

When this harness is explicitly in scope, it answers a substrate question:

```text
Can one actor repeatedly complete increasingly long Minecraft objectives with
real current-run evidence?
```

That question is useful because social simulation needs real gameplay context,
but it is not the product goal by itself. Diamond is a stress test for long
dependency chains, not a north-star achievement.

## Target

Build a single-actor long-term objective harness that can attempt:

```text
obtain_current_run_diamond_1
```

The first milestone is not necessarily a successful diamond run. The first
milestone is a truthful, resumable, evidence-rich attempt that shows exactly how
far the actor got and why it stopped.

The harness should support a progression ladder:

1. `craft_current_run_stone_axe_1`
2. `craft_current_run_stone_pickaxe_1`
3. `obtain_current_run_iron_ingot_1`
4. `craft_current_run_iron_pickaxe_1`
5. `locate_current_run_diamond_ore_1`
6. `obtain_current_run_diamond_1`

Do not start from diamond as one huge opaque objective. Start with the ladder,
then let the same architecture run longer.

## Evaluation Principle

Actor-owned direct trials may be expressive. The runtime must be denser.

That means:

- use direct generated TypeScript action skills as the fast action language;
- expose high-level Mineflayer helpers that create evidence;
- let the model plan, retry, and generate bounded trial code when this
  evaluation path is deliberately selected;
- keep Minecraft mechanics, action boundaries, timeouts, inventory checks,
  block checks, and verifier truth in runtime-owned helpers;
- persist every attempt as actor workspace evidence and memory.

The model can be creative. The runtime decides whether the world changed.

## Gemini Live Planning Provider

Use Gemini for cheap, high-volume planning and critique, not as proof of
Minecraft success.

Current official-doc constraints checked on 2026-05-23:

- Gemini API limits are per project, not per API key, and actual limits can vary
  by AI Studio project.
- Free Tier `Gemini 2.5 Flash Live` and `Gemini 2.0 Flash Live` are listed with
  `3 sessions`, `1,000,000 TPM`, and `RPD=*`.
- Standard text-out calls such as `gemini-2.5-flash` have normal RPM/RPD
  limits and should not be used as the main long-run loop unless quota is
  explicitly acceptable.
- Native Audio preview models have much smaller free-tier limits in the public
  table and are not the default text-planning target.

References:

- `https://ai.google.dev/gemini-api/docs/rate-limits`
- `https://ai.google.dev/gemini-api/docs/live`
- `https://ai.google.dev/api/live`
- `https://ai.google.dev/gemini-api/docs/downloads`

The implementation may start with raw WebSocket if SDK behavior is awkward, but
the preferred repo-facing abstraction should be a provider module, not ad-hoc
calls from runners.

Recommended provider id:

```text
gemini-planner
```

Recommended auth source:

```text
GEMINI_API_KEY
```

The key may be copied locally from:

```text
~/git/iyuno-ai-engineer-task/.env
```

Never print the key. Never commit it. Use an ignored repo-local auth file or
environment variable:

```text
build/provider-auth/gemini.env
```

That path is ignored by the repo's `.gitignore`.

Local `.env` is also ignored and has been prepared for the next implementation
session with this strategy:

```text
GEMINI_PLANNER_PRIMARY=text-genai
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_TEXT_FALLBACK_MODEL=gemini-2.5-flash-lite
GEMINI_TEXT_REQUEST_TIMEOUT_MS=900000
GEMINI_TEXT_MAX_PARALLEL=1

PROBE_LONG_OBJECTIVE_PROVIDER=gemini-planner
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai
```

Implementation expectation:

1. Use standard text-only `google-genai` calls with structured JSON output.
2. When standard text-only calls hit quota/rate-limit errors such as `429`, fall
   back to Gemini Live.
3. Use Gemini Live as a text-only-like path by requesting audio output with
   output transcription enabled, discarding audio bytes, and reading only the
   streamed transcription text.
4. Keep Live concurrency to one session by default. The useful free-tier shape
   is high token volume, not many parallel WebSocket sessions.
5. Store the selected path, model, quota/rate-limit error, and fallback decision
   in provider output snapshots so later reviews can distinguish provider quota
   exhaustion from gameplay failure.

If the model names change, re-check official Gemini docs and update the env
defaults before running long objectives. Do not silently switch to a paid or
Pro model.

## Provider Role

Gemini Live should be used for:

- breaking a long objective into the next short Minecraft objective;
- generating direct TypeScript action skill source for the next step;
- reading failed helper traces and proposing a smaller retry;
- summarizing memory into guardrails for the next generated attempt;
- classifying whether the actor needs a new helper, a better target selector, a
  verifier fix, or just another attempt.

Gemini Live must not:

- mark an objective as passed;
- mutate active action skills directly;
- replace current-run verifier evidence;
- run unbounded retries without runtime budget control;
- hide quota or connection errors as gameplay failures.

## Long-Term Objective Harness

Implement a runner that executes one actor through objective phases.

Suggested command:

```bash
cd probe
bun run probe:long-objective -- --objective obtain_current_run_diamond_1 --actor npc_b --provider gemini-planner --max-phases 12 --max-actions-per-phase 12 --report ../tmp/long-objective-diamond-gemini.json
```

The runner should produce a report with:

- run id;
- objective id;
- actor id;
- provider id;
- phase list;
- generated source refs;
- helper-call evidence refs;
- pre/post inventory snapshots;
- block/location observations where available;
- verifier result per phase;
- memory records written;
- stop reason;
- next recommended phase.

Stop reasons should be explicit:

- `objective_passed`;
- `phase_failed`;
- `environment_blocked`;
- `provider_blocked`;
- `missing_helper`;
- `missing_verifier`;
- `budget_exhausted_with_progress`;
- `budget_exhausted_without_progress`;
- `unsafe_or_rejected_source`.

## Phase Ladder Details

### Phase 1: Stone Axe Baseline

This already has proof and should remain the sanity check.

Pass:

- current-run inventory contains `stone_axe >= 1`.

### Phase 2: Stone Pickaxe

Why:

- diamond requires iron pickaxe or better;
- iron requires stone pickaxe for practical mining.

Pass:

- current-run inventory contains `stone_pickaxe >= 1`.

Needed runtime substrate:

- table-bound crafting support;
- cobblestone acquisition;
- prerequisite-aware crafting helper.

### Phase 3: Iron Ingot

Why:

- iron pickaxe requires iron ingots.

Pass:

- current-run inventory contains `iron_ingot >= 1`.

Likely needed runtime substrate:

- mine iron ore or raw iron;
- furnace/campfire/smelting helper;
- fuel acquisition;
- placement and use of furnace;
- timeout-aware smelting wait;
- verifier for raw iron, fuel, furnace, and ingot delta.

### Phase 4: Iron Pickaxe

Pass:

- current-run inventory contains `iron_pickaxe >= 1`.

Needed runtime substrate:

- crafting table nearby;
- sticks;
- iron ingot count;
- table-bound crafting verifier.

### Phase 5: Diamond Ore Location

This is the first genuinely long-horizon phase.

Pass:

- current-run observation records a diamond ore block position, or
- current-run mine attempt records a diamond ore target.

Likely needed runtime substrate:

- bounded underground descent;
- torch/light/safety policy if mobs are enabled;
- y-level targeting;
- branch mining or cave exploration helper;
- stuck/loop detection;
- block scan memory;
- tool durability awareness.

Do not require final diamond acquisition before the locator can produce useful
evidence.

### Phase 6: Diamond Acquisition

Pass:

- current-run inventory contains `diamond >= 1`.

Required guard:

- do not accept mined diamond ore without inventory pickup;
- require correct tool class evidence, preferably `iron_pickaxe` or better.

## Implementation Workstreams

### Workstream A: Gemini Live Provider Adapter

Build a provider adapter that can be used by objective generation and review.

Required:

- `gemini-planner` provider id;
- key loading from `GEMINI_API_KEY` or ignored
  `build/provider-auth/gemini.env`;
- primary text-only GenAI path using `GEMINI_TEXT_MODEL`;
- structured JSON output whose `source` field contains the generated TypeScript;
- transcript-safe input/output snapshots;
- credential-shaped key filtering;
- fallback error classification.

Start with text-in/text-out if supported cleanly by the SDK. If the selected
Live model only returns audio-first responses, use output transcription and
discard audio bytes. Keep this hidden behind the provider adapter.

### Workstream B: Long Objective Planner

Build a phase planner over the existing direct generated action skill path.

Required:

- objective ladder definitions;
- phase result schema;
- stop reason taxonomy;
- current-run phase verifier;
- actor memory writes after each phase;
- retrieval of relevant prior phase memory before the next provider call.

### Workstream C: Missing Minecraft Substrate

Add only helpers needed by the ladder.

Likely first helpers:

- `craftStonePickaxe`;
- `ensureFurnaceNearby`;
- `smeltItem`;
- `mineOre`;
- `ensureFuel`;
- `scanNearbyBlocks`;
- `descendToYLevel`;
- `branchMineStep`.

Each helper must emit evidence. Long actions can be decomposed into multiple
runtime phases, but interruption-sensitive actions such as digging remain
atomic until Mineflayer resolves or fails.

### Workstream D: Dashboard Long Objective View

Add a single-actor objective timeline:

- current phase;
- generated source;
- helper calls;
- inventory/block deltas;
- memory written;
- stop reason;
- next recommended phase.

Dashboard remains fire-and-forget.

### Workstream E: Reviewer Cleanup

After failed long-objective attempts, queue reviewer work that can say:

- missing helper;
- helper bug;
- bad generated source;
- insufficient memory retrieval;
- bad verifier;
- environment blocker;
- budget too low;
- genuine Minecraft long-horizon limitation.

Reviewer output should produce concrete next implementation tasks, not generic
encouragement.

## Test Gates

### Gate 1: Provider Smoke Without Minecraft

```bash
cd probe
bun run probe:gemini-planner-smoke -- --prompt "Return JSON: {\"ok\":true}" --report ../tmp/gemini-planner-smoke.json
```

Pass:

- no key printed;
- provider output snapshot exists;
- report classifies quota/auth/session errors clearly.

### Gate 2: Stone Pickaxe Objective

```bash
cd probe
bun run probe:long-objective -- --objective craft_current_run_stone_pickaxe_1 --actor npc_b --provider gemini-planner --max-phases 4 --max-actions-per-phase 10 --report ../tmp/long-stone-pickaxe.json
```

Pass:

- `stone_pickaxe >= 1` from current-run inventory.

### Gate 3: Iron Ingot Attempt

```bash
cd probe
bun run probe:long-objective -- --objective obtain_current_run_iron_ingot_1 --actor npc_b --provider gemini-planner --max-phases 8 --max-actions-per-phase 12 --report ../tmp/long-iron-ingot.json
```

Pass or useful failure:

- passed with `iron_ingot >= 1`, or
- stopped with exact missing helper/verifier/environment reason.

### Gate 4: Diamond Attempt

```bash
cd probe
bun run probe:long-objective -- --objective obtain_current_run_diamond_1 --actor npc_b --provider gemini-planner --max-phases 20 --max-actions-per-phase 16 --report ../tmp/long-diamond-attempt.json
```

First acceptable result:

- diamond acquired, or
- truthful ladder progress plus a precise stop reason and next implementation
  task.

## Non-Goals

- no actor relationship proof yet;
- no multi-actor scheduling yet;
- no social dashboard before single-actor long objective dashboard;
- no success from provider text;
- no unbounded underground wandering without phase reports;
- no direct secret printing from the copied Gemini key;
- no committing ignored auth, evidence, or tmp reports.

## Cursor Composer Handoff Prompt

Use this prompt for the next implementation session:

```text
You are working in /Users/naem1023/git/minecraft-llm-agent-community.

Read AGENTS.md, SPEC.md, project-docs/Agent-Search-Index.md, and especially
project-docs/Architecture/Single-Actor-Long-Term-Diamond-Handoff.md.

The next priority is NOT actor relationship proof. First prove one actor can
complete or truthfully progress through increasingly long Minecraft dependency
chains. The target ladder is:
1. craft_current_run_stone_axe_1
2. craft_current_run_stone_pickaxe_1
3. obtain_current_run_iron_ingot_1
4. craft_current_run_iron_pickaxe_1
5. locate_current_run_diamond_ore_1
6. obtain_current_run_diamond_1

Use Gemini Live as a cheap high-volume planner/generator when available. A
GEMINI_API_KEY exists in ~/git/iyuno-ai-engineer-task/.env; load it without
printing it and copy only into ignored local auth/env storage such as
build/provider-auth/gemini.env or the process environment. Do not commit
secrets.

The local .env should use:
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai.
Use standard text-only google-genai calls with GEMINI_TEXT_MODEL=gemini-2.5-flash
and structured JSON output. If the text path hits quota or rate limits, record a
provider blocker instead of falling back to Gemini Live.

Build:
- gemini-planner provider adapter or smoke path;
- single-actor long objective runner;
- phase/report schema with explicit stop reasons;
- current-run verifiers for each implemented phase;
- only the Mineflayer helpers needed by the ladder;
- dashboard timeline if it can observe without affecting gameplay.

Keep the LLM free to generate TypeScript action programs, but keep success
runtime-owned. Generated return text is never success. Current-run Minecraft
inventory, block, helper-call, and verifier evidence decides success.

First gates:
1. Gemini Live smoke without Minecraft.
2. craft_current_run_stone_pickaxe_1 current-run success.
3. obtain_current_run_iron_ingot_1 success or precise missing-helper report.
4. obtain_current_run_diamond_1 attempt with truthful phase report.

Run:
- bun test
- bun run typecheck
- relevant objective command reports
- docs npm run build

Treat Docker, server, auth, or provider quota issues as environment blockers,
not gameplay failures. Do not commit data/evidence, tmp reports, or provider
auth files.
```

## Review Questions

Before the next PR is considered successful, answer:

- What is the deepest objective phase the actor reached?
- Which exact current-run evidence proves each passed phase?
- Which helper or verifier was missing when progress stopped?
- Did Gemini output source code, a plan, or both?
- Were generated source, provider input/output, helper calls, and verifier
  results tied together in actor workspace?
- Can the same actor resume with useful memory rather than repeating the same
  failed plan?
