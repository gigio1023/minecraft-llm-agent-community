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

RCON transport success is not the same thing as setup success. Some Minecraft
commands return failure text through a successful RCON call. Known failure-like
output such as `That position is not loaded`, `Incomplete`, `Incorrect argument
for command`, `Unknown or incomplete command`, or `No player was found` is
recorded as command failure. Required command failure blocks setup; optional
command failure is preserved in the manifest without blocking the run.

## Current Scenarios

### `natural-survival`

Default lane for normal world runs. It keeps the normal configured world type,
seed, and server defaults.

Use it after the target behavior is already stable enough that terrain, trees,
water, caves, and animals are useful environment pressure rather than noise.

### `natural-safe-spawn-v1`

Natural survival/social run lane with setup validation before Actor Turn cycles
begin.

Server setup:

- `LEVEL_TYPE=default`
- no `GENERATOR_SETTINGS`
- ordinary generated terrain, trees, structures, animals, and resources
- no `fill`, `setblock`, resource rack, cleared pad, or starter structure
- peaceful starting policy and hostile spawns disabled for early runtime review

After the bot joins, the runtime writes a `natural-spawn-validation/v1` artifact
from Mineflayer loaded-world evidence. The validation checks that the selected
start has passable standing/head cells, ordinary natural support below, no dense
leaf/log trap in the immediate area, and at least one loaded `*_log` block within
the bounded scan radius. It also embeds a `world-state-scan/v1` snapshot so
reviewers can inspect raw observed block names and loaded-world limitations.

If validation passes, the runtime may pin the actor's player spawn and teleport
the actor to the validated start. That placement is setup evidence only:

```json
{
  "schema": "natural-spawn-validation/v1",
  "credited_as_actor_progress": false
}
```

If validation fails, the run is an environment/setup failure rather than an
Actor Turn behavior failure.

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

Run a provider-free natural safe-spawn setup smoke:

```bash
cd probe
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle \
  --provider deterministic-social \
  --model deterministic-social \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-safe-spawn-v1 \
  --report ../tmp/social-cycle-natural-safe-spawn-deterministic-1.json
```

This command may exit non-zero if the one-cycle deterministic runtime is
`blocked`. For setup smoke review, inspect `server.world_scenario.setup_status`,
`natural_spawn_validation_status`, and the manifest/artifact refs before judging
Actor Turn behavior.

Run a controlled 40-cycle construction probe:

```bash
cd probe
SOCIAL_CYCLE_PROVIDER=openai-api \
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
- natural spawn validation status and artifact ref when applicable;
- pre-bot and post-bot RCON command results;
- optional command failures that were recorded but did not block setup;
- required command failures that blocked the run.

The social-cycle report links this manifest under:

```json
{
  "server": {
    "world_scenario": {
      "scenario_id": "roofless-hut-flat-survival-v1",
      "lane": "fixture_probe",
      "manifest_ref": "evidence/world-scenarios/..."
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
