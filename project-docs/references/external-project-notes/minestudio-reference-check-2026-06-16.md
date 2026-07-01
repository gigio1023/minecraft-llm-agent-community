---
status: archived-reference-check
recorded: 2026-06-16
---

# MineStudio Reference Check

Search token: `MINESTUDIO_REFERENCE_CHECK_2026_06_16`.

Purpose: check CraftJarvis/MineStudio as a possible reference for this repo's
Minecraft social-simulation benchmark and runtime harness.

Implementation deep dive:

- `MINESTUDIO_IMPLEMENTATION_ANALYSIS_2026_06_16`:
  `project-docs/references/external-project-notes/minestudio-implementation-analysis-2026-06-16.md`

Conclusion:

```text
MineStudio is valuable as a reference for Minecraft task manifests, simulator
callbacks, trajectory recording, baseline visual policies, and video/VLM review.
It is not a direct runtime replacement for this repo's current TypeScript
Mineflayer Actor Turn and action-skill harness.
```

The useful move is to absorb MineStudio's benchmark discipline offline, not to
switch the active harness to MineRL/Malmo.

## Sources Checked

Official/current sources:

- GitHub: https://github.com/CraftJarvis/MineStudio
- Documentation: https://craftjarvis.github.io/MineStudio/
- Simulator docs:
  https://craftjarvis.github.io/MineStudio/simulator/index.html
- Benchmark docs:
  https://craftjarvis.github.io/MineStudio/benchmark/index.html
- Quick benchmark docs:
  https://craftjarvis.github.io/MineStudio/benchmark/quick-benchmark.html
- Automatic evaluation docs:
  https://craftjarvis.github.io/MineStudio/benchmark/automatic-evaluation.html
- arXiv: https://arxiv.org/abs/2412.18293
- Hugging Face dataset:
  https://huggingface.co/datasets/CraftJarvis/minestudio-data-6xx-v110
- Hugging Face model example:
  https://huggingface.co/CraftJarvis/MineStudio_VPT.rl_from_early_game_2x
- PyPI: https://pypi.org/project/minestudio/

Local inspection:

```text
tmp/research/minestudio
```

The local clone is ignored by git and is only a research scratch checkout.

```text
commit: 278aa8553668d591339dbf30d281594ed06ee882
date:   2025-10-10T13:55:18+08:00
title:  Add Zread page to README
```

## What MineStudio Is

MineStudio presents itself as a streamlined package for Minecraft AI agent
development. The paper and README describe seven integrated components:

1. simulator;
2. data;
3. models;
4. offline training;
5. online training;
6. inference;
7. benchmark.

The codebase is primarily Python plus Java and is built around MineRL/Malmo
style simulator environments. It includes:

- `minestudio/simulator`;
- `minestudio/data`;
- `minestudio/models`;
- `minestudio/offline`;
- `minestudio/online`;
- `minestudio/inference`;
- `minestudio/benchmark`.

The public model gallery includes VPT, STEVE-1, GROOT, and ROCKET variants.
These are visual/action-policy baselines, not LLM Actor Turn providers.

## Installability And Version State

MineStudio is installable in principle.

Evidence:

- GitHub README says to install with `pip install MineStudio` or from GitHub.
- PyPI lists `minestudio 1.1.6`, released 2025-06-24.
- PyPI provides both source distribution and wheel files.
- GitHub releases show `v1.1.4` as latest release on the repository page.
- The inspected `pyproject.toml` on current `master` declares version `1.1.5`.

This means the package exists and can be downloaded, but release/source/docs
version alignment is not perfectly clean. If used later, pin the exact package
or commit and record the environment.

Local `pyproject.toml` requirements include:

- Python `>=3.10`;
- `torch>=2.3.1`;
- `ray`;
- `gym`, `gym3`, `gymnasium`;
- `minecraft_data==3.20.0`;
- `cuda-python; platform_system!='Darwin'`;
- rendering stack dependencies such as OpenCV, PyOpenGL, pyglet, pyrender.

README/docs also require JDK 8 for the simulator and recommend Linux. Rendering
uses Xvfb or VirtualGL. The Docker example builds with
`--platform=linux/amd64`.

Local implication:

```text
Running MineStudio directly on this Apple Silicon macOS workspace is likely a
setup project, not a quick benchmark path.
```

## Benchmark Assets Found

Local inspection found:

```text
simple task YAML files: 76
hard task YAML files:   77
criteria text files:    83
```

Example simple task:

```yaml
custom_init_commands:
- /give @s minecraft:map
- /give @s minecraft:compass
- /give @s minecraft:cooked_beef 16
- /give @s minecraft:bread 16
defaults:
- base
- _self_
text: Explore the world to find a village.
```

Example construction task:

```yaml
custom_init_commands:
- /give @s minecraft:oak_planks 10
- /give @s minecraft:stick 5
- /setblock ~2 ~ ~ minecraft:crafting_table
defaults:
- base
- _self_
text: Build a gate to secure your area in Minecraft.
reference_video: build_gate
```

Example harder fixture task:

```yaml
custom_init_commands:
- /give @s minecraft:water_bucket 5
- /give @s minecraft:stone 64
- /give @s minecraft:dirt 64
- /execute as @p at @s run fill ~-2 ~-1 ~-2 ~2 ~4 ~2 water
- /give @s minecraft:wooden_shovel 1
defaults:
- base
- _self_
text: Create a stunning waterfall using water buckets and natural terrain.
```

Important observation:

```text
Many MineStudio tasks are command-fixtured. That is fine for a controlled task
benchmark, but command-provided inventory or terrain must not be counted as
natural-world social evidence in this repo.
```

## Benchmark Implementation Pattern

The benchmark loader has a small manifest conversion point:

```text
convert_yaml_to_callbacks(yaml_file)
```

It reads:

- `custom_init_commands`;
- task `text`;
- the YAML filename as task name.

The benchmark test path wires those into:

- `RecordCallback`;
- `CommandsCallback`;
- `TaskCallback`;
- `MinecraftSim`;
- a VPT policy.

This is mechanically useful because it separates:

```text
task manifest -> setup commands -> provider/task context -> episode record
```

Local adaptation should keep that separation, but translate it into this repo's
runtime vocabulary:

```text
scenario manifest -> world setup fixture -> Actor Turn context ->
runtime artifacts -> verifier/scorer
```

## Simulator Callback Pattern

MineStudio's simulator docs and code expose useful callback ideas:

- `CommandsCallback`: execute commands on reset for environment setup;
- `RecordCallback`: record observation/action/info at each step;
- `RewardsCallback`: attach reward to event patterns;
- `SpeedTestCallback`: measure simulator speed;
- `FastResetCallback`: kill the agent and teleport to random location;
- `HardResetCallback`: full reset behavior;
- `TaskCallback`: inject task metadata into observation;
- `InitInventoryCallback`;
- `VoxelsCallback`;
- `MaskActionsCallback`;
- `PrevActionCallback`;
- `SummonMobsCallback`.

The most useful local equivalents:

- command setup should map to explicit world-scenario setup artifacts;
- recording should map to our transcript, screenshots, helper events, and
  structured action evidence;
- task metadata should map to scenario and Active Episode context;
- speed/cost/latency should map to provider and runtime usage records.

The main caution:

```text
FastResetCallback is not equivalent to this repo's fresh-world same-seed
fairness requirement. It kills the agent and teleports it to a random location.
Use it as reset-design inspiration, not as a fairness protocol.
```

## Auto-Evaluation Pattern

MineStudio includes criteria files and video/VLM evaluation scripts.

The criteria files commonly score:

- task progress;
- action control;
- error recognition and correction;
- creative attempts;
- task completion efficiency;
- material selection and usage.

For this repo, those are useful as secondary review dimensions, not runtime
truth. The source of truth should remain:

- inventory deltas;
- block placement/breaking evidence;
- container snapshots;
- chat/social event ledgers;
- memory/relationship updates;
- action-skill verifier output;
- world-state scans with loaded-world limits;
- first-person and third-person screenshots as support.

Local adaptation:

| MineStudio dimension | Keep? | Local interpretation |
| --- | --- | --- |
| Task progress | Yes | Milestone and social-consequence progress, backed by structured evidence. |
| Action control | Yes | Useless, repeated, contradictory, or blocked actions per cycle. |
| Error recognition/correction | Yes | Detect blocker, repair plan, change action, or ask/clarify. |
| Creative attempts | Limited | Only count if it changes verified social/world state; do not reward spectacle. |
| Efficiency | Yes | Cycles, wall time, action count, provider calls, tokens, cost, latency. |
| Material selection/usage | Yes | Personal possession, transfer, claim, station/container use, weak commons. |

VLM or human-style video review should remain a supporting audit layer. It
should not override structured runtime evidence.

## Hugging Face Data And Models

The README lists converted OpenAI VPT contractor datasets:

- `minestudio-data-6xx`: free gameplay;
- `minestudio-data-7xx`: early game;
- `minestudio-data-8xx`: house building from scratch;
- `minestudio-data-9xx`: house building from random materials;
- `minestudio-data-10xx`: obtain diamond pickaxe.

The checked `CraftJarvis/minestudio-data-6xx-v110` Hugging Face page reports:

- total file size: 248 GB;
- no dataset card;
- dataset viewer unavailable.

This is a large visual trajectory dataset, not a ready-made LLM benchmark for
our runtime. It may become useful later for:

- visual-policy baseline comparison;
- offline behavior mining;
- low-level motor-policy research;
- negative contrast against text/action-skill social actors.

It is not needed for the next social-simulation harness work.

## Direct Integration Verdict

Do not replace the current harness with MineStudio.

Reasons:

1. MineStudio's active runtime is Python/MineRL/Malmo, while this repo's active
   runtime is TypeScript/Mineflayer Actor Turn plus action skills.
2. MineStudio policies are visual/key-mouse style; this repo currently evaluates
   LLM providers choosing structured runtime actions and generated action-skill
   candidates.
3. MineStudio's benchmark tasks are mostly task-centric and often
   command-fixtured; this repo's research target is grounded social continuity
   in natural worlds.
4. MineStudio's video/VLM scoring is useful for review, but our runtime can
   verify many outcomes with structured evidence.
5. Running MineStudio locally would require separate Python/JDK/rendering/GPU or
   container setup and likely Linux/amd64 assumptions.

Do use MineStudio as a reference source.

## What This Reference Teaches Mechanically

MineStudio teaches:

1. Keep task manifests small and declarative.
2. Separate setup commands from task text and runtime execution.
3. Record each episode as an analyzable artifact, not only a terminal log.
4. Make reset, commands, rewards, recording, and task injection explicit
   callbacks.
5. Maintain simple and hard task variants.
6. Provide criteria files that make video review repeatable.
7. Publish reusable datasets and model checkpoints separately from benchmark
   code.

These are good engineering patterns.

## How To Adapt It To This Repo

Adapt MineStudio into an offline manifest/reference lane:

```text
MineStudio YAML/criteria -> local reference manifest -> social-scenario pressure
candidate -> natural-world or fixture-labeled benchmark -> structured verifier
and report
```

Recommended first adapter schema:

```json
{
  "source_id": "minestudio:simple/find_village",
  "source_url": "https://github.com/CraftJarvis/MineStudio",
  "difficulty": "simple",
  "task_text": "Explore the world to find a village.",
  "init_commands": [],
  "requires_command_fixture": false,
  "fixture_kind": "none | inventory | block | terrain | mob | mixed",
  "natural_world_candidate": true,
  "competence_pressure": ["navigation", "exploration"],
  "social_pressure_candidates": ["shared-location-memory", "warning", "escort"],
  "verification_plan": [
    "world-state scan for village blocks/entities",
    "position evidence inside village boundary",
    "chat/social event if another actor requested the search"
  ],
  "reject_reason": null
}
```

The adapter should be offline. It should not import MineStudio as a runtime
dependency.

## Good Candidate Tasks To Translate First

Start with a small set rather than the whole manifest.

Natural-world or near-natural candidates:

- `find_village`;
- `explore_chest`;
- `collect_wood`;
- `collect_wool`;
- `mine_iron_ore`;
- `plant_wheats`;
- `sleep_in_bed`;
- `travel_by_boat`;
- `climb_the_mountain`.

Fixture-labeled competence candidates:

- `build_gate`;
- `craft_to_clock`;
- `craft_smelting`;
- `build_a_waterfall`;
- `prepare_a_birthday_present_for_your_neighbor`;
- `use_bow`;
- `use_shield`.

Social wrapper examples:

| Task | Social pressure wrapper |
| --- | --- |
| `find_village` | One actor searches, then records and communicates a useful place to another actor. |
| `explore_chest` | Actor must inspect loot while respecting another actor's material claim. |
| `collect_wool` | Actor acquires a bed material for another actor's night-safety need. |
| `craft_smelting` | Actor uses or lends a furnace under weak public-affordance rules. |
| `build_gate` | Actor creates a public affordance only if a local place and social need justify it. |
| `prepare_a_birthday_present_for_your_neighbor` | Useful as a social intent template, but must be grounded in actual item transfer and memory. |

## Risks To Avoid

- Do not present MineStudio adoption as a research contribution.
- Do not count command-injected items as natural-world acquisition.
- Do not let VLM scoring become runtime truth.
- Do not make task success the primary paper figure.
- Do not import a Python/Malmo stack into the active TypeScript runtime unless
  there is a separate, explicit experiment lane.
- Do not reward visual creativity unless it produces verified social or
  material consequences.
- Do not use MineStudio fast reset as a fairness protocol for model comparison.

## Recommended Next Step

Implement a small, provider-free MineStudio manifest adapter only if the next
benchmark work needs more scenario candidates.

Scope:

1. Read a local MineStudio-style YAML directory.
2. Emit a local JSON manifest under a non-runtime research/generated directory.
3. Classify each task as natural-world candidate, command fixture, or reject.
4. Attach local verification-plan notes.
5. Pick 10-15 tasks for social-pressure translation.

Acceptance criteria:

- no new runtime dependency on MineStudio;
- no provider call;
- no Minecraft server required;
- generated manifest clearly labels command-fixtured tasks;
- active benchmark docs refer to the translated manifest as scenario pressure,
  not as the social benchmark itself.
