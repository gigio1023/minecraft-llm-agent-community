---
sidebar_position: 100
---

# Roofless Hut Flat Scenario Run

Search token: `ROOFLESS_HUT_FLAT_SCENARIO_RUN_2026_06_08`.

Status: dated runtime experiment record.

Recorded:

- `2026-06-08 00:35:03 KST (+0900)`
- `2026-06-07 15:35:03 UTC`

## Purpose

This run verified the new world-scenario test lane for separating environment
noise from Actor Turn behavior. Previous roofless-hut experiments often started
inside forest terrain, which made it hard to tell whether the actor failed
because the runtime decision loop was weak or because the spawn environment was
bad for construction.

The change under test was a named fixture scenario, not a hidden Minecraft
planner. The fixture should create a repeatable flat worksite and nearby
survival resource source, then let the Actor Turn LLM decide what to do from
normal action cards and runtime evidence.

## Implementation Change Under Test

The runtime now supports named world scenarios:

- `natural-survival`
- `roofless-hut-flat-survival-v1`

The roofless-hut fixture configures a fresh flat Minecraft world, disables
irrelevant spawn noise, prepares a small flat work pad, places an oak-log rack
near the actor, records a scenario manifest, and injects only a context-only
world event. RCON setup artifacts are fixture evidence and must not count as
actor progress.

Primary implementation files:

- `probe/src/server/worldScenarios.ts`
- `probe/src/socialCycleCli.ts`
- `probe/src/runtime/socialCycleRunner.ts`
- `probe/src/config.ts`
- `probe/compose.yaml`
- `project-docs/Setup/World-Scenario-Testing.md`

## Run Configuration

Runtime artifacts from the local run:

- Report:
  `tmp/social-cycle-roofless-hut-flat-openai-gpt54mini-40-20260607T152128Z.json`
- Review:
  `tmp/social-cycle-roofless-hut-flat-openai-gpt54mini-40-20260607T152128Z-review.md`
- Scenario manifest:
  `data/actors/social-runs/social-cycle-1381e729-ea13-416a-b5e2-278fd4355184/npc_b/evidence/world-scenarios/social-cycle-1381e729-ea13-416a-b5e2-278fd4355184-roofless-hut-flat-survival-v1.json`
- Final screenshot:
  `data/actors/social-runs/social-cycle-1381e729-ea13-416a-b5e2-278fd4355184/npc_b/visual-evidence/cycle-0040-final.png`

Run metadata:

- Run id: `social-cycle-1381e729-ea13-416a-b5e2-278fd4355184`
- Actor: `npc_b`
- Provider: OpenAI API
- Model: `gpt-5.4-mini`
- Reasoning: `medium`
- Requested cycles: `40`
- Max actions per cycle: `1`
- World scenario: `roofless-hut-flat-survival-v1`
- World lane: `fixture_probe`
- Minecraft version: `1.21.11`
- Level type: `FLAT`
- Visual evidence: enabled every cycle

Scenario event:

```text
Current local task: build a very small roofless hut on the marked flat worksite
using nearby survival materials. A useful result is a visible low wall outline
or partial shelter footprint with verifier evidence. Choose the worksite and
keep taking physical actions when possible.
```

## Result

The runtime completed all 40 cycles, but the run ended blocked:

- Runtime status: `blocked`
- Provider error: `null`
- Cycles: `40`
- Visual captures: `42`
- Visual capture failures: `0`
- Scenario setup status: `passed`
- Gameplay progress verified: `false`
- Provider usage records: `43`
- Input tokens: `1,081,487`
- Output tokens: `63,760`
- Thinking tokens: `37,789`
- Total tokens: `1,145,247`
- Budget guard status: `allowed`
- Projected day total: `4,153,499 / 9,000,000`

The disposable Minecraft container was stopped after the run. The remaining
Docker containers were the pre-existing Langfuse services.

## Fixture Evidence

The fixture did what it was supposed to do:

- `LEVEL_TYPE=FLAT`
- flat plains generator settings were passed through `GENERATOR_SETTINGS`
- structures and irrelevant mobs were disabled
- world spawn was set at `(0, 64, 0)`
- a clear 21x21 work pad was prepared around the origin
- an oak-log rack was placed at `x=8..10`, `y=64..65`, `z=-2..2`
- the actor was teleported to `(0, 64, 0)` in survival mode
- actor inventory was cleared

The manifest recorded 20 passed `pre_bot` commands and 3 passed `post_bot`
commands. There were no required or optional setup failures.

## Behavioral Diagnosis

The useful outcome is negative: the fixture removed forest-spawn noise, but the
Actor Turn loop still did not build.

Action distribution:

- `move_to`: `33`
- `observe`: `3`
- `remember`: `3`
- `mine_block`: `1`
- `collectLogs`: `1`

The actor spent most of the run repeatedly moving instead of converting the
flat worksite and nearby log rack into construction progress. The first cycles
repeated `move_to` with `{ "direction": "north", "distance": 4 }`, which moved
away from the oak-log rack placed east of the start. Later recovery attempts
still did not create a usable material path or a hut footprint.

The final screenshot showed only the flat grass world, with no visible shelter
outline or placed hut blocks. That agrees with the runtime review:

- outcome distribution: `no_progress: 38`, `blocked: 2`
- CycleGoal provider cited prior judgment: `0` cycles
- runtime retry constraints: `0`
- generated Mineflayer helper expansion count: `0`
- selected PlanBeads existed near the end, but they did not turn into physical
  Minecraft progress.

## Review Conclusion

Verdict: `FIXTURE_PASSED_ACTOR_TURN_BLOCKED`.

The environment split is valid and useful. It proves that the earlier forest
spawn issue was not the only blocker. With a clean flat worksite and reachable
fixture material available, the actor still failed because the ordinary Actor
Turn loop treated repeated position changes and notes as enough activity and
did not pivot into resource acquisition, block placement, or generated
Mineflayer authoring.

This should not be fixed by adding a hidden hut planner. The next improvement
should preserve the repo direction:

1. Keep the named scenario as a test lane, not actor progress.
2. Make Actor Turn consume source evidence and previous judgment more directly
   when repeated movement produces no construction delta.
3. Strengthen branch/retry behavior so repeated `move_to` success without
   physical goal progress becomes a reason to pivot.
4. Prefer better action-surface affordances and evidence feedback over
   domain-specific shelter planning.
5. Keep PlanBeads passive; they may track blockers and followups, but they must
   not decide the Minecraft strategy.

The fixture should remain part of future low-cost behavior testing because it
separates "bad spawn" from "bad decision loop" without giving the actor a
scripted solution.
