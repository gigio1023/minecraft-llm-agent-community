# Voyager Persona, Society, And Gameplay Research

Date: 2026-05-19

## Scope

This report re-reads local `Voyager` code for a narrower question than the prior
 repo survey:

- how to make Minecraft NPCs feel like living personas inside the world;
- how to make cooperation and one bounded hostile NPC plausible;
- how to make them play like experienced Minecraft players instead of drifting.

Local repo inspected:

- `../Voyager`

## Files Inspected

- `voyager/voyager.py`
- `voyager/agents/action.py`
- `voyager/agents/curriculum.py`
- `voyager/agents/critic.py`
- `voyager/agents/skill.py`
- `voyager/prompts/action_template.txt`
- `voyager/prompts/action_response_format.txt`
- `voyager/prompts/curriculum.txt`
- `voyager/prompts/critic.txt`
- `voyager/prompts/skill.txt`
- `voyager/control_primitives/mineBlock.js`
- `voyager/control_primitives/craftItem.js`
- `voyager/control_primitives/craftHelper.js`
- `voyager/control_primitives/smeltItem.js`
- `voyager/control_primitives/exploreUntil.js`
- `voyager/control_primitives/killMob.js`
- `voyager/control_primitives/placeItem.js`
- `voyager/control_primitives/useChest.js`
- `voyager/env/mineflayer/lib/skillLoader.js`
- `voyager/env/mineflayer/lib/observation/chests.js`
- `voyager/env/mineflayer/lib/observation/voxels.js`
- representative files under `skill_library/`

## Main Takeaway

Voyager is not a society simulator. Its strongest reusable value for this repo is
 the gameplay scaffold that makes an agent look like a Minecraft player:

- one concrete next task;
- trusted gameplay primitives;
- explicit post-action feedback;
- persistent task and world memory;
- verification after action.

That matters because believable persona and social behavior should sit on top of
 this gameplay scaffold, not replace it.

## Conceptual Lessons

### Persona needs world pressure, not richer prose

Voyager does not create believable identity through personality writing. It
 creates continuity through:

- `completed_tasks` and `failed_tasks` in `agents/curriculum.py`;
- chest memory in `agents/action.py` plus `observation/chests.js`;
- semantic event saving in `env/mineflayer/lib/skillLoader.js`.

For this repo, a living NPC should therefore have:

- a role;
- private memory;
- shared memory;
- recurring obligations;
- material dependencies;
- social consequences for missed commitments.

### Society should emerge from resources and storage

Voyager's chest-memory pattern is the most directly reusable social building
 block. NPC cooperation becomes plausible when bots know:

- where shared chests are;
- what resources were last seen there;
- which workstation or stash is public vs private;
- what items are promised to another NPC.

### One hostile NPC should still obey the same world rules

Voyager's combat/control primitives show that aggression becomes legible when it
 is bound to world checks and explicit outcomes. For this repo, one hostile NPC
 should be a bounded role with:

- narrow aggression rules;
- a short leash;
- retreat conditions;
- the same inventory and resource constraints as everyone else.

## Skilled Gameplay Lessons

### Curriculum is the anti-wandering core

`prompts/curriculum.txt` and `agents/curriculum.py` prevent idle action by
 forcing one immediate next task in concrete formats like:

- `Mine [quantity] [block]`
- `Craft [quantity] [item]`
- `Smelt [quantity] [item]`
- `Kill [quantity] [mob]`
- `Cook [quantity] [food]`
- `Equip [item]`

This is the cleanest answer to the repeated failure mode already seen in this
 repo: random walking, looking, digging, narrating.

### Trusted primitives create competence

The most portable gameplay value is in control primitives:

- `mineBlock.js`
- `craftItem.js`
- `craftHelper.js`
- `smeltItem.js`
- `exploreUntil.js`
- `useChest.js`
- `killMob.js`
- `placeItem.js`

These primitives validate names, check range, explain missing ingredients,
 enforce bounded search, and surface meaningful failure reasons.

### Verification matters as much as planning

`agents/critic.py` and `prompts/critic.txt` evaluate whether post-state actually
 advanced the task. That is a direct match for this repo's need to stop
 fake-progress behavior.

## What To Port

### Highest priority

1. A deterministic gameplay curriculum module with one concrete next task.
2. TypeScript gameplay primitives equivalent to `mineBlock`, `craftItem`,
   `smeltItem`, `exploreUntil`, `useChest`.
3. A small curated early-game seed skill set built from those primitives.
4. Shared chest/storage memory and semantic event recording.
5. Runtime-first task verification.

### Best seed skill set to port in spirit

1. `collectLogs`
2. `craftPlanksAndSticks`
3. `craftCraftingTable`
4. `craftWoodenPickaxe`
5. `mineCobblestone`
6. `craftStonePickaxe`
7. `craftFurnace`
8. `mineCoal`
9. `smeltRawIron`
10. `inspectSharedChest`
11. `depositSharedItems`
12. `collectDroppedItems`

## What Not To Port

- raw LLM-generated JavaScript eval as the core action layer;
- `voyager.py`-style monolithic runner;
- broad QA/vector-db curriculum machinery before the basics work;
- blind bulk import of learned skills from `skill_library/`.

## Repo-Specific Recommendation

Use Voyager as the source for Minecraft progression structure, not as the source
 for social architecture. The correct sequence for this repo is:

1. make the NPCs competent at Minecraft first;
2. give them shared storage and role pressure;
3. add dialogue and hostility on top of that real gameplay substrate.
