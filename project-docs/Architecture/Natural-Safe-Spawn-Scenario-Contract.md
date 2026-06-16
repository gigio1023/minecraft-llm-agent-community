---
sidebar_position: 105
---

# Natural Safe Spawn Scenario Contract

Search token: `NATURAL_SAFE_SPAWN_SCENARIO_CONTRACT`.

Status: active implementation slice.

## Goal

`natural-safe-spawn-v1` should start the actor in an ordinary natural world
where the immediate area is playable and a tree is nearby, without flattening
terrain, placing logs, clearing a pad, or scripting a survival plan.

This scenario answers the user's world-setting requirement: natural surrounding
terrain, an ordinary respawn area, at least one nearby natural tree/log, and no
tree-top or dense-canopy spawn.

## Scenario Definition

Required fields:

| Field | Value |
| --- | --- |
| `id` | `natural-safe-spawn-v1` |
| `lane` | `survival_social_run` |
| `requiresFreshWorld` | `true` |
| `LEVEL_TYPE` | `default` |
| `GENERATOR_SETTINGS` | unset or empty |
| terrain/resource mutation | forbidden |
| fixture resource rack | forbidden |
| cleared work pad | forbidden |

`requiresFreshWorld: true` is non-negotiable for the default path. Server
properties such as seed and level type shape new world generation; they do not
prove that an already-created world matches the scenario.

If an operator intentionally reuses a pre-proven world later, that must be an
explicit override with its own evidence artifact. It should not be the default
scenario behavior.

## Allowed Setup

Allowed setup is limited to environment reproducibility and spawn pinning:

- selecting a seed and normal world type before fresh world creation;
- deterministic time/weather/mob rules only when recorded as scenario policy;
- post-validation `/setworldspawn`;
- version-aware respawn radius gamerule;
- post-validation `/spawnpoint <actor> ...`;
- optional `/tp` to the validated candidate only as setup positioning evidence.

For Minecraft Java Edition 1.21.11 and later, use the namespaced gamerule:

```text
gamerule minecraft:respawn_radius 0
```

For older compatible versions, use:

```text
gamerule spawnRadius 0
```

The same version-aware pattern applies to other renamed gamerules already used
by scenario setup, such as time, weather, and mob spawning rules.

## Forbidden Setup

The v1 natural scenario must not use:

- `fill` or `setblock` to change local terrain;
- placed logs, chests, tools, crafting stations, or food;
- cleared pads, roads, markers, or starter structures;
- `forceload` as a shortcut for proving natural-world visibility;
- resource-family summaries or survival-priority hints as provider-facing
  context;
- selected spawn coordinates as build-site or route advice.

`forceload` is not terrain mutation, but it changes the loaded-world condition
being tested. Keep it out of v1 unless a later plan records a separate reason
and artifact semantics.

## Candidate Acceptance

Validate candidates after the Mineflayer bot joins and chunks settle. The
candidate is a setup start position, not an actor achievement.

Pass conditions:

- feet cell is passable;
- head cell is passable;
- support block below is solid ordinary natural ground;
- support block is not leaves, logs, cactus, magma, campfire, fire, water,
  lava, powder snow, or another hazard;
- immediate radius is not dominated by leaves or logs;
- candidate is not on a tree, inside a dense canopy, or at the edge of an
  obvious cave/drop hazard;
- at least one natural low `*_log` block is observed within a bounded loaded
  scan radius, initially 16 to 32 blocks.

Use "observed nearby log" for v1, not "reachable tree", unless a pathfinder or
action-skill verifier proves reachability. Reachability is gameplay evidence;
spawn validation should not overclaim it.

Rejection reasons should be typed, for example:

- `feet_blocked`
- `head_blocked`
- `bad_support_block`
- `leaf_or_log_support`
- `hazard_block`
- `canopy_dominated`
- `cave_or_drop_risk`
- `no_loaded_nearby_log`
- `unloaded_or_null_scan`

## Search Bounds

Keep the first implementation small and auditable:

- scan around the bot's loaded world, not the entire seed;
- record center, radius, vertical range, dimension, and loaded-world limits;
- cap candidate count and rejection records;
- fail setup truthfully if no acceptable candidate is found in bounds.

The artifact must not imply unloaded chunks were inspected.

## Provider Exposure

Actor Turn may receive neutral evidence refs or a compact scenario note such as
"the run starts in a validated natural survival lane." It must not receive:

- selected candidate coordinates as a build target;
- tree coordinates as a prescribed first move;
- material-family checklists;
- shelter-first advice;
- a hidden planner output derived from the validation scan.

The actor still chooses actions through Action Cards or
`author_mineflayer_action`, and runtime validators still own physical success.

## Sources

- itzg server properties for `SEED`, `LEVEL_TYPE`, and `GENERATOR_SETTINGS`:
  <https://docker-minecraft-server.readthedocs.io/en/latest/configuration/server-properties/>
- Minecraft Java Edition 1.21.11 gamerule rename notes:
  <https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-11>
- `/setworldspawn` behavior and spawn spreading:
  <https://minecraft.wiki/w/Commands/setworldspawn>
- `/spawnpoint` player-specific spawn command:
  <https://minecraft.wiki/w/Commands/spawnpoint>

## Done Criteria

- `parseWorldScenarioId("natural-safe-spawn-v1")` succeeds.
- The scenario forces fresh world creation by default.
- The scenario uses default natural terrain and no generator settings.
- No terrain/resource mutation command exists in the scenario setup.
- The manifest explicitly says setup validation is not actor progress.
