# MineDojo Knowledge Resources Applicability Review

Search token: `MINEDOJO_KNOWLEDGE_RESOURCES_APPLICABILITY`.

Recorded: 2026-06-08.

Status: research archive. This note records a reference review, not an active
runtime contract or product spec.

## Scope

This review inspected the local MineDojo reference checkout at:

- `/Users/naem1023/git/minecraft-references/MineDojo`

The review used parallel subagent lanes:

- local MineDojo source/data inventory;
- MineDojo paper and project mechanism extraction;
- applicability matrix against this repo's current Soul-grounded runtime rules.

The local checkout contains MineDojo code, task YAML, data loader code,
Minecraft constants, Malmo source, docs, and images. It does not vendor the full
YouTube, Wiki, or Reddit datasets.

MineDojo paper metadata:

- Paper: `MineDojo: Building Open-Ended Embodied Agents with Internet-Scale Knowledge`
- arXiv: `2206.08853`
- Initial arXiv date: 2022-06-17
- Venue: NeurIPS 2022 Datasets and Benchmarks Track
- Local README source: `/Users/naem1023/git/minecraft-references/MineDojo/README.md`

## Repo Boundary

MineDojo is a reference, not a product spec for this repo.

The useful translation target is:

- repo-owned Minecraft mechanics knowledge;
- typed action contracts;
- fixture and scenario-test ideas;
- verifier design;
- evidence-rich observation/action artifacts;
- actor-owned action skill lifecycle support.

The rejected translation target is:

- generic Minecraft benchmark optimization;
- a race-to-diamond or fastest-tech-tree objective;
- a Malmo/Gym loop replacement for the current Mineflayer runtime;
- hidden Minecraft domain planners;
- prose-derived tool visibility, primitive args, permissions, retry clearance,
  or verifier success;
- Voyager-style global skill library or raw eval loop.

## Local Inventory

Important local paths:

- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/data/download.py`
  - Zenodo download wiring for YouTube, Wiki, and Reddit datasets.
  - Useful as dataset source pointers only. The active runtime should not depend
    on downloading these corpora.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/data/youtube_dataset.py`
  - Loader for YouTube JSON metadata records.
  - README scale claim: 730K+ narrated Minecraft videos, about 300K hours, and
    about 2.2B transcript words.
  - Useful offline for mechanics extraction, action skill inspiration, and
    human demonstration priors. Not action authority.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/data/wiki_dataset.py`
  - Loader for Wiki page folders with `data.json`, `screenshot.png`, images,
    sprites, tables, text, and layout-related records.
  - README scale claim: about 7K Wiki pages.
  - Strongest external-knowledge candidate for extracting stable Minecraft
    mechanics, with license and version checks.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/data/reddit_dataset.py`
  - Loader for Reddit post ids/types plus live PRAW metadata/comment fetch.
  - Requires Reddit API credentials for live metadata/comment access.
  - README scale claim: 340K+ posts and 6.6M comments.
  - Useful as weak community-tip and failure-pattern material only.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/tasks/description_files/programmatic_tasks.yaml`
  - 1,581 programmatic task entries.
  - Subagent count: harvest 895, combat 471, techtree 213, survival 2.
  - Contains natural-language prompts, generated guidance, and categories.
  - Useful for boring-competence probe ideas, not hidden CycleGoal planning.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/tasks/description_files/creative_tasks.yaml`
  - 1,560 creative task entries.
  - Subagent count by source: 1,042 `youtube`, 302 `gpt3`, 216 `manual`.
  - Useful for broad goal phrasing and creative-action review ideas, but lower
    confidence for executable details.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/tasks/description_files/tasks_specs.yaml`
  - 74 template specs.
  - Contains initial inventory, biome, target, reward, spawn, voxel, and lidar
    fields.
  - Useful for explicit fixture and verifier design.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/sim/mc_meta/mc_constants.json`
  - Subagent parsed counts: 400 crafting recipes, 51 smelting recipes, 392
    items, 236 blocks, 68 achievements, 1,819 stats.
  - Strong raw material for typed mechanics records and guide generation.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/sim/mc_meta/mc.py`
  - Item lists, recipe-derived mappings, and biome map for MineDojo's Minecraft
    version.
  - Useful only after version normalization against this repo's server and
    Mineflayer version.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/tasks/meta/utils/success_criteria.py`
  - Inventory, kill-stat, survival-time, and item-use success checks.
  - Useful as verifier pattern examples.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/sim/handlers/agent/actions`
  - Action handler vocabulary for craft, equip, place, smelt, camera, keyboard,
    and slot operations.
  - Useful as action-surface and schema inspiration only.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/sim/handlers/agent/observations`
  - Observation handler vocabulary for inventory, location, life stats, damage,
    achievements, voxels, lidar, POV, and related state.
  - Useful as evidence-field inspiration only.
- `/Users/naem1023/git/minecraft-references/MineDojo/minedojo/sim/Malmo`
  - Vendored Malmo source and docs.
  - Low-level historical reference only. Do not adopt as active runtime
    architecture.

## Mechanisms And Adaptation

### Internet-Scale Knowledge Base

Mechanical lesson:

MineDojo treats Minecraft knowledge as a first-class external resource. Its
knowledge base includes YouTube gameplay/transcripts, Wiki pages, and Reddit
posts/comments.

Adaptation:

Use the idea to improve a repo-local Minecraft knowledge layer:

- compact `minecraft_basic_guide` entries;
- `project-docs/knowledge/minecraft/encyclopedia/*` records;
- source-linked mechanics notes;
- action skill authoring references;
- fixture and verifier examples.

Do not feed raw internet-scale corpora into runtime context. Knowledge is
background context, not executable authority.

### Wiki Mechanics

Mechanical lesson:

Minecraft mechanics are often structured but buried in mixed media: prose,
tables, images, sprites, screenshots, and tutorial layouts.

Adaptation:

Normalize useful mechanics into typed records:

- items and blocks;
- recipes and smelting;
- station requirements;
- item-vs-world-block distinctions;
- tool suitability;
- mob and biome vocabulary;
- loaded-world and reachability constraints.

Do not parse wiki prose at runtime to decide tool visibility, action
eligibility, primitive parameters, permissions, retry clearance, or verifier
success.

### YouTube Demonstrations

Mechanical lesson:

Narrated gameplay can show how humans sequence actions and describe Minecraft
activities over time.

Adaptation:

Use video/transcript data only offline:

- action skill idea discovery;
- helper UX vocabulary;
- failure-mode discovery;
- scenario examples;
- verifier question generation.

Do not use video-language priors as proof that this actor progressed in the
current world. Runtime truth must come from Mineflayer observation, inventory,
block/container/position/chat evidence, helper events, transcript artifacts, and
verifier output.

### Reddit And Community Tips

Mechanical lesson:

Community discussions expose practical tips, questions, architectural ideas, and
failure patterns.

Adaptation:

Use as weak reference material for social simulation inspiration and
failure-pattern discovery. Reject popularity or community advice as runtime
policy. Social behavior must derive from ActorSoul/LifeGoal, current evidence,
relationships, obligations, settlement state, memory, and action surface.

### Task Diversity

Mechanical lesson:

MineDojo's task suite gives broad coverage across harvest, combat, tech tree,
survival, creative, and playthrough activities.

Adaptation:

Use tasks as coverage and fixture inspiration:

- collect one item;
- craft with and without a station;
- place a station;
- deposit into shared storage;
- inspect a container;
- move to a reachable target;
- record truthful failure when a target is absent or unloaded.

Do not turn task categories into default CycleGoal phases. Survival, harvest,
tech tree, combat, building, storage, and social communication are context
sources, not mandatory planner stages.

### Programmatic Success Criteria

Mechanical lesson:

MineDojo's programmatic tasks score success through simulator state changes:
inventory deltas, kill stats, item-use stats, and survival time.

Adaptation:

Strongly adapt this idea into per-action-skill verifiers:

- inventory delta for collect/craft/deposit actions;
- block mutation and item pickup for mining;
- placed block and support evidence for placement;
- container snapshot delta for storage;
- position delta and tolerance for movement;
- chat/transcript evidence for conversation-like action skills;
- survival/stall evidence for wait-like actions.

Do not use global benchmark reward as the social-cycle contract. This repo needs
action-local verifier output, transcript records, artifact refs, retry
constraints, and actor workspace continuity.

### Controlled Worlds And Fixtures

Mechanical lesson:

MineDojo task specs can control initial inventory, mobs, biome, time, weather,
spawn, and observation modalities.

Adaptation:

Use controlled worlds only for explicit scenario tests and fixture probes. The
fixture setup must be recorded as setup evidence and must never count as actor
progress. Natural survival/social runs must distinguish setup state from
actor-owned outcomes.

### MineCLIP And Learned Reward

Mechanical lesson:

MineDojo uses pretrained video-language reward signals to reduce manual reward
engineering for free-form tasks.

Adaptation:

Mostly reject for active runtime authority. A learned reward model could be a
future offline reviewer or weak creative-task signal, but it must not:

- mark runtime action success;
- promote action skills;
- clear PlanBeads;
- clear retry constraints;
- replace exact verifiers;
- overwrite artifact-grounded judgments.

For this repo, verifier contracts beat latent reward scores.

### Unified Gym-Style Interface

Mechanical lesson:

MineDojo exposes a unified `make`, `reset`, `step`, `obs/reward/done/info`
interface, making benchmark experiments easy to run and compare.

Adaptation:

Adapt the interface discipline, not the implementation:

```text
observe -> Actor Turn tool selection -> gate -> execute -> verify -> record
```

The current Mineflayer runtime should keep session lifecycle, reconnect,
provider snapshots, action-surface contracts, transcripts, evidence artifacts,
and actor workspace state explicit.

## Applicability Matrix

| MineDojo-style resource | Allowed | Risky | Forbidden |
| --- | --- | --- | --- |
| Minecraft mechanics knowledge | `minecraft_basic_guide`, typed recipes, station requirements, item-vs-block distinctions | Letting guide text imply current inventory or world state | Treating guide prose as runtime permission, executable args, verifier success, or strategy checklist |
| Task diversity taxonomy | Capability coverage map and fixture inspiration | Turning taxonomy into default CycleGoal sequence | Benchmark, race-to-diamond, or fastest-tech-tree objective |
| project-docs/knowledge/minecraft/document corpus | Curated background docs, source refs, evidence-linked cards | Over-compressed provider-facing hints | Regex/string parsing docs to decide tool visibility, eligibility, permissions, or args |
| Human demonstrations | Offline examples for verifier ideas, helper UX, and action-skill tests | Copying traces as hidden action sequences | Replay or global plan library that bypasses Actor Turn and runtime validation |
| Skill-library concepts | Actor-owned action skill lifecycle with promotion from current-run evidence | Global reusable best-skill catalog detached from actor state | Raw eval loops or active global skill library |
| Curriculum concepts | Bounded capability scaffolding under ActorSoul/LifeGoal | Generic progression ladder quietly steering the actor | Universal benchmark curriculum or open-ended autonomy goal |
| World knowledge summaries | Raw Minecraft names, positions, distances, loaded-world limits, scan refs | Fixed material/station/survival categories in provider input | Hidden domain planner summaries such as construction-readiness, shelter-first, or recommended candidates |
| Fixtures/preconditions | Deterministic probes with explicit setup artifacts | Mistaking fixture-backed success for natural runtime competence | Counting fixture setup as actor progress |
| Verifier material | Inventory, block, container, chat, and position postconditions | Weak proxy verifiers that accept tool status alone | Provider text, memory notes, guide text, or rationale as proof |
| Generated code examples | Material for bounded `author_mineflayer_action` candidate trials | Offline importer creating runtime candidates | Background reviewers or scripts originating new NPC action skills during runtime |
| Memory/reflection examples | Evidence-backed actor-owned memory and blocker history | Summary-only memory that hides source evidence | Reflection text claiming physical progress or replacing verification |

## Recommended Follow-Up Work

1. Add a small MineDojo-derived mechanics extraction audit.
   - Input: `mc_constants.json`.
   - Output: a version-normalized report comparing MineDojo item/recipe names
     against the current Mineflayer/server version.
   - Purpose: decide what can safely enrich `minecraft_basic_guide` or the
     Minecraft Encyclopedia.

2. Create a narrow verifier-pattern comparison note.
   - Input: `success_criteria.py`.
   - Output: mapping from MineDojo's inventory/kill/use/time checks to this
     repo's action-skill verifier schemas.
   - Purpose: improve verifier clarity without importing benchmark scoring.

3. Select 5 to 10 boring-competence fixture candidates from `tasks_specs.yaml`.
   - Prefer early, observable tasks: collect logs, craft planks, craft/place a
     crafting table, craft sticks, craft a wooden pickaxe, collect cobblestone,
     deposit an item, inspect a chest.
   - Record fixture setup separately from actor progress.

4. Keep YouTube and Reddit as later offline research only.
   - Do not download large corpora until there is a concrete extraction target,
     storage plan, license note, and no-runtime-dependency boundary.

## Bottom Line

MineDojo is valuable here as a mechanism catalog: knowledge resources, task
diversity, typed simulator interfaces, and state-backed evaluation. The project
should not copy MineDojo's benchmark objective, Malmo/Gym substrate, reward-model
authority, or internet-scale training frame.

The useful translation is narrower and more compatible with the current rebuild:
better repo-owned Minecraft knowledge, clearer action contracts, bounded
scenario fixtures, and verifier-backed runtime evidence for Soul-grounded actor
behavior.
