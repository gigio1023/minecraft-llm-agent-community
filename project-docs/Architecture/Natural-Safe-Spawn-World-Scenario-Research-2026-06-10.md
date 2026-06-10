---
sidebar_position: 102
---

# Natural Safe Spawn World Scenario Research

Search token: `NATURAL_SAFE_SPAWN_WORLD_SCENARIO_RESEARCH_2026_06_10`.

Status: dated research and implementation handoff.

Recorded: 2026-06-10 UTC.

## User Goal

Keep the world natural instead of a flat fixture. The actor should begin in an
ordinary natural area with nearby trees, but not inside a dense canopy and not
spawned on top of a tree. The start area may be uneven; it just needs to be a
normal, inspectable, playable natural spawn for early survival and construction
experiments.

This is a setup/runtime problem, not a hidden Minecraft planner. The runtime may
choose and validate a good natural spawn point, but it must not give Actor Turn a
scripted building strategy, pre-credit resource gathering, or mutate the world
into a fake success state.

## Sources Checked

- itzg Minecraft Server on Docker server properties:
  https://docker-minecraft-server.readthedocs.io/en/latest/configuration/server-properties/
- itzg Docker `SEED` mapping to `level-seed`:
  https://github.com/itzg/docker-minecraft-server/blob/master/docs/configuration/server-properties.md
- Minecraft official command overview for `/setworldspawn`:
  https://www.minecraft.net/en-us/article/minecraft-commands
- Minecraft Wiki `/setworldspawn` details:
  https://minecraft.wiki/w/Commands/setworldspawn
- Minecraft Wiki `server.properties` reference:
  https://minecraft.wiki/w/Server.properties
- Minecraft Wiki game rules reference:
  https://minecraft.wiki/w/Game_rule

The official Minecraft command overview confirms the basic `/setworldspawn`
shape, but the detailed Java Edition spawn-spreading behavior is documented more
clearly on Minecraft Wiki. Treat the wiki as implementation guidance that should
be verified by this repo's own runtime artifacts.

## Research Conclusion

`server.properties` alone is not enough to guarantee this spawn quality.

What server config can do:

- Use a natural world by keeping `LEVEL_TYPE=default`.
- Reproduce a world by setting `SEED`, which itzg maps to `level-seed`.
- Disable spawn protection for bot actions near spawn with `SPAWN_PROTECTION=0`.
- Keep natural structures, animals, and ordinary terrain enabled or disabled by
  scenario policy.

What server config cannot prove:

- The actor did not spawn on leaves or inside a tree.
- A reachable log exists within a bounded radius.
- The immediate spawn area is open enough for movement and screenshots.
- The terrain is ordinary enough for early survival but not a dense forest or
  canopy trap.

Therefore the right shape is a named natural scenario with runtime validation:
generate a normal world, inspect candidate spawn positions, choose a safe natural
start, set world/player spawn, and record the evidence.

## Latest Report Trigger

The latest roofless-hut flat run exposed a fixture trust issue:

- Report:
  `tmp/social-cycle-roofless-hut-flat-openai-gpt54mini-40-20260607T152128Z.json`
- Scenario manifest:
  `data/actors/social-runs/social-cycle-1381e729-ea13-416a-b5e2-278fd4355184/npc_b/evidence/world-scenarios/social-cycle-1381e729-ea13-416a-b5e2-278fd4355184-roofless-hut-flat-survival-v1.json`

The manifest records all 23 RCON setup results as `passed`, but several required
commands returned failure-like output:

- `setworldspawn 0 64 0 0` returned `Incomplete ...`.
- required `fill ... minecraft:dirt` returned `That position is not loaded`.
- required `fill ... minecraft:grass_block` returned `That position is not loaded`.
- required `fill ... minecraft:air` returned `That position is not loaded`.
- required `fill ... minecraft:oak_log` returned `That position is not loaded`.

That means the fixture report is not trustworthy enough to claim a prepared
worksite or a nearby oak-log rack. This does not excuse the Actor Turn movement
loop, but it changes the next work order: fix setup truthfulness before judging
another construction run.

## Recommended Scenario

Add `natural-safe-spawn-v1`.

Policy:

- `lane`: `survival_social_run`
- `LEVEL_TYPE`: `default`
- no `GENERATOR_SETTINGS`
- no `fill`, `setblock`, placed log rack, cleared pad, or artificial worksite
- natural terrain and natural resources remain world truth
- allowed setup authority: choose and pin a safe natural spawn, set gamerules
  needed for deterministic starting conditions, and record validation evidence

Candidate spawn acceptance should require all of these:

- the player standing cell and head cell are air-like/passable;
- the block below is ordinary solid natural ground, not leaves or logs;
- a small immediate radius is not dominated by leaves/logs;
- the actor is not inside water, lava, powdered snow, cactus, fire, or a cave
  opening;
- a reachable `*_log` block exists within a bounded radius such as 16-32 blocks;
- the chosen area is not a dense canopy biome such as jungle or dark forest if
  simpler terrain candidates exist;
- the scan records radius, center, raw block names, candidate positions,
  rejected reasons, nearest logs, and loaded-world limitations.

Use world-spawn handling carefully. `/setworldspawn` sets the world spawn, but
Java world spawn spreading can still apply unless the gamerule is constrained.
The repo should set the appropriate current-version gamerule and also set the
actor's player spawn when a bot username is known.

## Implementation Order

1. Harden RCON command result validation first.

   Update `probe/src/server/worldScenarios.ts` so `runWorldScenarioCommands`
   treats failure-like command output as failure, not `passed`. Start with exact
   patterns observed in the latest manifest:

   - `That position is not loaded`
   - `Incomplete`
   - `Incorrect argument for command`
   - `Unknown or incomplete command`
   - `No player was found`

   Required commands with failure-like output should set `required_failure=true`.
   Optional commands may be recorded as failed without blocking setup.

2. Add a focused regression test.

   Extend `probe/test/worldScenarios.test.ts` with a required command that
   returns `That position is not loaded` and assert the command result fails.
   Add an optional command with the same output and assert setup continues.

3. Introduce `natural-safe-spawn-v1` as a scenario definition.

   Do not mutate terrain. The scenario should select natural world settings and
   add a context-only world event such as:

   ```text
   Current local task: begin from the verified natural spawn area, use nearby
   natural resources, and make physical early-survival progress from runtime
   evidence. The spawn validation only proves starting conditions; it does not
   count as actor progress.
   ```

4. Add spawn validation artifacts.

   Create a `natural-spawn-validation/v1` evidence record under the actor
   workspace. It should include seed, selected coordinate, scan center/radius,
   loaded-world limits, ground block, headroom, nearest logs, candidate
   rejections, and a clear `credited_as_actor_progress: false`.

5. Run a short live smoke before a provider-heavy run.

   First run with deterministic or no-provider validation to prove the world
   setup is truthful. Then run a low-cycle provider run, ideally 10-20 cycles,
   before spending another 40-cycle budget.

## Explicit Non-Goals

- Do not revive a flat construction fixture as the default.
- Do not place logs, clear pads, or build starter structures for this natural
  scenario.
- Do not add a hidden shelter planner or coordinate script.
- Do not classify fixture/setup commands as actor progress.
- Do not parse provider prose, memory, PlanBeads, or guide text as execution
  authority.

## Next Handoff

Start in these files:

- `probe/src/server/worldScenarios.ts`
- `probe/test/worldScenarios.test.ts`
- `probe/src/runtime/socialCycleRunner.ts`
- `project-docs/Setup/World-Scenario-Testing.md`

Success criteria for the next implementation slice:

- `bun test test/worldScenarios.test.ts` fails before the RCON-output fix and
  passes after it.
- A required RCON setup command that returns `That position is not loaded`
  blocks the scenario with `setup_status=failed`.
- `natural-safe-spawn-v1` produces a natural-world manifest and spawn-validation
  artifact without terrain mutation commands.
- The next live report can distinguish a bad spawn, missing nearby logs, and a
  real Actor Turn behavior loop failure.
