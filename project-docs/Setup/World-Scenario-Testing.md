---
sidebar_position: 34
---

# World Scenario Testing

Search token: `WORLD_SCENARIO_TESTING`.

Status: active setup guide for live social-cycle experiments.

## Purpose

World scenarios separate test-environment noise from actor behavior. They do not
add a hidden Minecraft planner and they do not give Actor Turn extra executable
authority.

Use two lanes:

| Lane | Use For | World Shape | Progress Authority |
|------|---------|-------------|--------------------|
| `fixture_probe` | Testing whether a behavior can use runtime tools in a controlled setting | Flat or bounded fixture, fixed spawn, explicit RCON setup | Runtime evidence after actor actions only |
| `survival_social_run` | Testing broad survival and social adaptation | Natural seeded world | Runtime evidence after actor actions only |

Fixture setup commands are evidence about the test environment. They are not
actor progress. A granted item, cleared work pad, placed resource rack, or fixed
spawn must never satisfy a CycleGoal by itself.

## Current Scenarios

### `natural-survival`

Default lane for normal world runs. It keeps the normal configured world type,
seed, and server defaults.

Use it after the target behavior is already stable enough that terrain, trees,
water, caves, and animals are useful environment pressure rather than noise.

### `natural-safe-spawn-v1`

Fresh natural survival/social lane for ordinary terrain with a validated start
near loaded-world tree evidence. It uses:

- `LEVEL_TYPE=default`
- no `GENERATOR_SETTINGS`
- `requiresFreshWorld=true`
- no `fill`, `setblock`, resource rack, cleared pad, or starter structure

After the Mineflayer bot joins and chunks settle, the runtime writes a
`natural-spawn-validation/v1` artifact. Passing validation means the candidate
had passable feet/head cells, solid natural support, no dense canopy/tree-top
support, no loaded hazard, and at least one nearby loaded natural log observed
within the bounded scan. It does not prove unloaded chunks, and it is not actor
progress.

### `roofless-hut-flat-survival-v1`

Flat survival construction fixture for the small roofless-hut experiment.

Server setup:

- `LEVEL_TYPE=FLAT`
- `GENERATOR_SETTINGS` for a plains superflat with bedrock, deepslate, stone,
  dirt, and grass layers
- structures disabled
- passive and hostile spawns disabled
- peaceful survival mode
- fixed actor start at `0 64 0`
- clear `21x21` work pad
- nearby oak-log rack as survival material source

The scenario also writes a context-only world event:

```text
Current local task: build a very small roofless hut on the marked flat worksite using nearby survival materials. A useful result is a visible low wall outline or partial shelter footprint with verifier evidence. Choose the worksite and keep taking physical actions when possible.
```

This world event is scenario context only. The LLM still chooses actions through
Actor Turn, and verifiers still decide progress from world, inventory, position,
container, transcript, and evidence artifacts.

## CLI

Run a controlled 40-cycle construction probe:

```bash
cd probe
SOCIAL_CYCLE_PROVIDER=openai-api \
SOCIAL_CYCLE_MODEL=gpt-5.4-mini \
SOCIAL_CYCLE_REASONING=medium \
bun run probe:social-cycle \
  --provider openai-api \
  --model gpt-5.4-mini \
  --actor npc_b \
  --cycles 40 \
  --max-actions-per-cycle 1 \
  --world-scenario roofless-hut-flat-survival-v1 \
  --visual-evidence \
  --visual-evidence-interval 1 \
  --visual-evidence-width 960 \
  --visual-evidence-height 540 \
  --report ../tmp/social-cycle-roofless-hut-flat-openai-gpt54mini-40.json
```

`--world-scenario roofless-hut-flat-survival-v1` implies a fresh disposable
world because changing `LEVEL_TYPE`, `SEED`, or `GENERATOR_SETTINGS` only affects
new world generation.

## Artifacts

Each non-default scenario writes:

```text
data/actors/social-runs/<run_id>/<actor_id>/evidence/world-scenarios/<run_id>-<scenario_id>.json
```

The manifest records:

- scenario id and lane;
- server world settings;
- actor start;
- build area;
- fixture resources;
- pre-bot and post-bot RCON command results;
- optional command failures that were recorded but did not block setup;
- required command failures that blocked the run.
- validation artifact refs for scenarios that require setup validation.

The social-cycle report links this manifest under:

```json
{
  "server": {
    "world_scenario": {
      "scenario_id": "roofless-hut-flat-survival-v1",
      "lane": "fixture_probe",
      "manifest_ref": "evidence/world-scenarios/...",
      "validation_ref": "evidence/world-scenarios/...",
      "validation_status": "passed",
      "setup_status": "passed"
    }
  }
}
```

## Review Rule

Do not compare fixture-probe success to broad survival competence. A fixture run
answers a narrower question: can the actor use current runtime tools, state, and
evidence to make physical progress when the environment is not the blocker?

After fixture behavior is stable, run a separate `survival_social_run` with a
natural seed and record the new failure modes separately.
