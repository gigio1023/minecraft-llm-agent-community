---
sidebar_position: 103
---

# World Scenario Truthfulness And Natural Spawn Implementation Plan

Search token: `WORLD_SCENARIO_TRUTHFULNESS_NATURAL_SPAWN_PLAN`.

Status: active index for split implementation plans.

Recorded: 2026-06-12 UTC.

## Purpose

World-scenario work is currently blocked on setup truthfulness. The latest flat
roofless-hut manifests are useful as failure evidence, but they cannot prove the
worksite or oak-log rack existed because required RCON commands were recorded as
`passed` even when command output contained failure text.

The next implementation must first make setup artifacts truthful, then add a
natural safe-spawn lane that validates an ordinary playable start without
placing resources, clearing terrain, or pre-crediting actor progress.

This file is only the routing index. Keep detailed phase instructions in the
split documents below instead of growing this plan into another long handoff.

## Split Plan Index

| Order | Search Token | Document | Main Question |
| --- | --- | --- | --- |
| 1 | `WORLD_SCENARIO_RCON_TRUTHFULNESS_PLAN` | `World-Scenario-RCON-Truthfulness-Plan.md` | Can required and optional RCON setup output be classified truthfully? |
| 2 | `NATURAL_SAFE_SPAWN_SCENARIO_CONTRACT` | `Natural-Safe-Spawn-Scenario-Contract.md` | What does `natural-safe-spawn-v1` configure, validate, and forbid? |
| 3 | `NATURAL_SPAWN_VALIDATION_ARTIFACT_CONTRACT` | `Natural-Spawn-Validation-Artifact-Contract.md` | What artifact proves or rejects the spawn before provider cycles? |
| 4 | `WORLD_SCENARIO_SMOKE_GATES` | `World-Scenario-Smoke-Gates.md` | What must pass before spending provider budget on behavior evaluation? |

## Implementation Order

1. Harden RCON command result truthfulness and aggregate `setup_status`.
2. Revalidate or downgrade the flat roofless-hut fixture after the classifier
   can expose required setup failures.
3. Add `natural-safe-spawn-v1` with `requiresFreshWorld: true`, a default
   natural world, and no terrain/resource fixture mutation.
4. Add post-bot Mineflayer loaded-world spawn validation and link the artifact
   from the manifest, social-cycle report, and audit flow.
5. Run unit/type/doc gates and a setup smoke before any 40/60-cycle provider
   behavior verdict.

## Current Evidence

Relevant local records:

- `project-docs/Architecture/Natural-Safe-Spawn-World-Scenario-Research-2026-06-10.md`
- `project-docs/Architecture/Roofless-Hut-Flat-Scenario-Run-2026-06-08.md`
- `project-docs/Setup/World-Scenario-Testing.md`

Known manifest symptoms to preserve as regression cases:

| Symptom | Required Meaning |
| --- | --- |
| `Incomplete` from `setworldspawn` | Command failed; do not record as passed. |
| `Incorrect argument for command` from gamerule compatibility command | Optional failure may continue but must be visible. |
| `That position is not loaded` from required `fill` | Required setup failed; fixture truth is not proven. |
| `That position is not loaded` from required resource rack command | Required setup failed; actor behavior cannot be judged against that fixture. |

## Authority Boundaries

- Scenario setup is environment evidence, not actor progress.
- Spawn validation may pin a start position, but it must not create a hidden
  shelter, storage, resource, pathing, or survival planner.
- Selected spawn coordinates and candidate rejections are artifact evidence.
  They must not be converted into provider-facing build locations, material
  plans, or strategy hints.
- PlanBeads, memory, Minecraft Basic Guide text, and provider rationale remain
  non-authoritative prose unless a runtime validator accepts structured action
  arguments.

## External Mechanics Checked

- itzg server properties docs confirm `SEED`, `LEVEL_TYPE`, and
  `GENERATOR_SETTINGS` are server/world-generation inputs:
  <https://docker-minecraft-server.readthedocs.io/en/latest/configuration/server-properties/>
- Minecraft Java Edition 1.21.11 renamed gamerules to namespaced snake-case
  IDs, including `spawnRadius` to `minecraft:respawn_radius`:
  <https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-11>
- `/setworldspawn` changes world spawn, but normal spawn spreading still
  applies unless constrained by gamerule:
  <https://minecraft.wiki/w/Commands/setworldspawn>
- `/spawnpoint` sets a player-specific spawn position:
  <https://minecraft.wiki/w/Commands/spawnpoint>
- Mineflayer exposes loaded-world state through world/chunk/block APIs, so spawn
  validation should run after the bot joins and chunks settle:
  <https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md>

## Done Criteria

- The active plan is split and index-routed rather than enlarged in one file.
- `setup_status: "passed"` means all required pre-bot commands, required
  post-bot commands, and required spawn validation passed.
- `natural-safe-spawn-v1` is explicitly fresh-world, natural, and non-mutating.
- Spawn validation writes a reviewable `natural-spawn-validation/v1` artifact
  with `credited_as_actor_progress: false`.
- A smoke gate proves setup truthfulness before any provider-heavy Actor Turn
  evaluation.
