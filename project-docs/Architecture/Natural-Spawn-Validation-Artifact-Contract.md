---
sidebar_position: 106
---

# Natural Spawn Validation Artifact Contract

Search token: `NATURAL_SPAWN_VALIDATION_ARTIFACT_CONTRACT`.

Status: active implementation slice.

## Goal

The natural safe-spawn lane needs a reviewable artifact that proves the start
was acceptable or explains why setup failed. The artifact must be written before
provider cycles so a bad spawn cannot be misdiagnosed as an Actor Turn failure.

## Runtime Insertion Point

Run validation after the bot has joined and the runtime has waited for chunks to
settle, before provider planning/action cycles start.

Expected order:

1. create or refresh the server world according to scenario settings;
2. run required pre-bot commands, if any;
3. create Mineflayer bot and wait for loaded-world readiness;
4. validate natural spawn from Mineflayer-visible world state;
5. run post-validation RCON spawn-pinning commands;
6. write manifest and validation artifact refs;
7. start provider cycles only if all required setup and validation passed.

This uses Mineflayer loaded-world evidence because pre-bot RCON cannot prove
what the bot can currently observe or stand in.

## Artifact Path

Write under the actor workspace evidence tree, for example:

```text
data/actors/social-runs/<run_id>/<actor_id>/evidence/world-scenarios/<run_id>-natural-spawn-validation.json
```

The exact filename can follow local artifact naming conventions, but the schema
name should be stable:

```text
natural-spawn-validation/v1
```

## Required Fields

Minimum JSON shape:

```json
{
  "schema": "natural-spawn-validation/v1",
  "scenario_id": "natural-safe-spawn-v1",
  "run_id": "...",
  "actor_id": "...",
  "credited_as_actor_progress": false,
  "status": "passed",
  "world": {
    "seed": "...",
    "dimension": "overworld",
    "server_version": "...",
    "level_type": "default"
  },
  "scan": {
    "center": { "x": 0, "y": 64, "z": 0 },
    "radius": 24,
    "vertical_range": { "min_y": 58, "max_y": 72 },
    "loaded_world_only": true,
    "null_or_unloaded_block_count": 0,
    "candidate_limit": 128
  },
  "selected_candidate": {
    "position": { "x": 0, "y": 64, "z": 0 },
    "support_block": "minecraft:grass_block",
    "feet_block": "minecraft:air",
    "head_block": "minecraft:air",
    "nearest_logs": [
      { "name": "minecraft:oak_log", "x": 8, "y": 64, "z": 3, "distance": 8.5 }
    ],
    "acceptance_reasons": [
      "feet_passable",
      "head_passable",
      "solid_natural_support",
      "nearby_loaded_log_observed"
    ]
  },
  "rejected_candidates": [
    {
      "position": { "x": 1, "y": 68, "z": 1 },
      "reason": "leaf_or_log_support"
    }
  ],
  "post_validation_commands": [],
  "notes": []
}
```

If validation fails, use `status: "failed"`, leave `selected_candidate` absent
or null, and record typed rejection/limit reasons.

## Manifest And Report Linkage

Add explicit refs rather than relying on prose:

- scenario manifest includes `validation_refs` or equivalent structured refs;
- social-cycle report includes `server.world_scenario.validation_ref` and
  `server.world_scenario.setup_status`;
- report audit collects the manifest ref and validation ref;
- review docs quote artifact paths when making runtime behavior claims.

`setup_status: "passed"` is allowed only when:

- all required pre-bot command results passed;
- all required post-bot command results passed;
- required natural spawn validation passed;
- required spawn-pinning commands passed.

## Failure Semantics

Natural spawn validation failure is an environment/setup failure. It is not:

- a provider failure;
- an Actor Turn decision failure;
- an action skill failure;
- evidence that the actor ignored a tree;
- a reason to silently fall back to a flat fixture.

When validation fails, stop before provider cycles unless the command explicitly
requests a diagnostic run that records the setup failure as such.

## Mineflayer Evidence Boundary

Mineflayer exposes loaded-world block and chunk events, including block lookups,
chunk load/unload events, and `waitForChunksToLoad`. The validation artifact
must state that it only scanned loaded world state. Null/unloaded lookups are
evidence of a visibility limit, not proof that terrain or trees are absent.

Source: <https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md>

## Tests

Prefer pure tests for the artifact builder and setup-status aggregation:

- passing candidate produces `natural-spawn-validation/v1` with
  `credited_as_actor_progress: false`;
- candidate on leaves/logs is rejected;
- missing nearby loaded log fails validation without claiming unloaded chunks
  were searched;
- aggregate status fails when validation fails;
- manifest/report refs include validation artifact paths.

Runtime smoke can then verify the Mineflayer integration with a live server.

## Done Criteria

- Every natural safe-spawn run has either a passed validation artifact or a
  failed setup artifact.
- Provider cycles do not start after required validation failure.
- Reviewers can diagnose spawn setup without replaying the seed.
- The artifact cannot be mistaken for actor progress or hidden strategy.
