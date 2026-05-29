---
sidebar_position: 1
---

# Minecraft Encyclopedia Research Brief

Search tokens: `MINECRAFT_ENCYCLOPEDIA_RESEARCH_BRIEF`,
`MINECRAFT_ACTION_SKILL_KNOWLEDGE`,
`VANILLA_MECHANICS_TO_VERIFIERS`.

This brief is a handoff prompt for a separate AI session. It exists because this
runtime must stop depending on stale model memory for Minecraft facts.

## Why This Exists

The current runtime asks an LLM/provider to propose bounded Minecraft actions.
That is fragile when the model's Minecraft knowledge is outdated, incomplete,
or from the wrong version. The repository needs a local, versioned Minecraft
knowledge layer that the runtime, reviewers, and future prompts can cite instead
of trusting model memory.

The target is not a raw wiki mirror. The target is a compact repo-local
encyclopedia that can answer gameplay questions such as:

- what item ids count as logs, planks, ores, fuel, food, or tools;
- what recipes require only inventory crafting versus a crafting table;
- what blocks require a tool to produce the useful drop;
- what evidence proves mining, crafting, eating, storage, movement, or smelting;
- what Mineflayer API boundary must be awaited before verification;
- which Minecraft mechanics should become runtime primitives, action skills, or
  verifier rules.

## Fixed Version Baseline

Use these versions unless the repository changes them:

- Minecraft Java Edition: `1.21.11`, from `probe/src/config.ts`.
- `minecraft-data`: `3.110.2`, from `probe/package.json`.
- `mineflayer`: `4.37.1`, from `probe/package.json`.
- `mineflayer-pathfinder`: `2.4.5`, from `probe/package.json`.

Do not use unsourced Minecraft facts from the model's memory. If a fact cannot
be confirmed from `minecraft-data`, Mineflayer docs, official Minecraft notes,
or a cited Minecraft Wiki page, mark it as `needs_source`.

## Source Priority

Use sources in this order:

1. Repo source of truth:
   - `AGENTS.md`;
   - `SPEC.md`;
   - `docs/blog-doc/Agent-Search-Index.md`;
   - `docs/blog-doc/Architecture/Runtime-Loop-And-Verification.md`;
   - `docs/blog-doc/Architecture/Action-Skill-Verification.md`;
   - `probe/src/gameplay/primitives/registry.ts`;
   - `probe/src/gameplay/seedSkills/registry.ts`;
   - `probe/src/gameplay/seedSkills/verificationContracts.ts`.
2. Versioned machine data:
   - `minecraft-data` / `node-minecraft-data` for blocks, items, entities,
     recipes, foods, materials, windows, effects, and version metadata.
3. Runtime API references:
   - Mineflayer API docs for `bot.dig`, `bot.craft`, `bot.openContainer`,
     `bot.openFurnace`, `bot.equip`, `bot.consume`, `bot.placeBlock`,
     `bot.attack`, `bot.waitForTicks`, and inventory/window transfer APIs.
   - `mineflayer-pathfinder` docs for `bot.pathfinder.goto`, `GoalNear`,
     `GoalGetToBlock`, movement settings, stop behavior, and path events.
4. Official Minecraft material:
   - Minecraft.net release notes and official guides.
5. Minecraft Wiki:
   - use only for mechanics explanation when versioned data is insufficient;
   - cite URLs;
   - do not copy long passages.

Useful source URLs:

- Minecraft Java Edition 1.21.11:
  `https://www.minecraft.net/article/minecraft-java-edition-1-21-11`
- Minecraft first-day survival guide:
  `https://www.minecraft.net/article/how-survive-your-first-day`
- Mineflayer API:
  `https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md`
- Mineflayer pathfinder:
  `https://github.com/PrismarineJS/mineflayer-pathfinder`
- `minecraft-data`:
  `https://github.com/PrismarineJS/minecraft-data`
- `node-minecraft-data`:
  `https://github.com/PrismarineJS/node-minecraft-data`

## Required Research Shape

Build two layers.

### 1. Versioned Vanilla Encyclopedia

This layer is broad. It replaces stale model memory with local versioned facts.

Cover at least:

- item and block ids for wood families, logs, planks, sticks, crafting tables,
  chests, stone, cobblestone, deepslate, coal ore, coal, furnace, torches, raw
  iron, iron ingot, common tools, common foods, beds, wool, passive mobs,
  hostile mobs, and early-game stations;
- recipe graph for early survival:
  - logs to planks;
  - planks to sticks;
  - planks to crafting table;
  - planks/sticks/crafting table to wooden pickaxe;
  - stone to cobblestone by mining;
  - cobblestone/sticks/crafting table to stone pickaxe;
  - cobblestone to furnace;
  - coal/stick to torch;
  - raw food/fuel/furnace to cooked food;
  - raw iron/fuel/furnace to iron ingot;
  - planks to chest;
- harvest and drop rules for early blocks:
  - target block;
  - required or preferred tool;
  - expected drop;
  - whether block removal alone is enough evidence;
- food/fuel basics:
  - edible item ids and food/saturation values when available;
  - fuel candidates needed for furnace tasks;
- mob categories:
  - passive food/resource mobs;
  - hostile threat mobs relevant to `fleeDanger`;
  - source of evidence that Mineflayer can observe.

### 2. Action-Skill Mechanics Layer

This layer maps encyclopedia facts into runtime behavior.

For each implemented and planned seed action skill, record:

- Minecraft mechanics needed;
- candidate runtime primitives;
- missing primitive boundary, if any;
- required Mineflayer APIs;
- required observations before the action;
- required post-action evidence;
- fake-progress cases to reject;
- likely failure modes;
- source refs.

Implemented skills to map:

- `runtimeObserveAndRemember`;
- `collectLogs`;
- `craftPlanksAndSticks`;
- `craftCraftingTable`;
- `craftWoodenPickaxe`;
- `mineCobblestone`;
- `placeCraftingTable`;
- `eatFoodWhenHungry`;
- `inspectSharedChest`;
- `depositSharedItems`;
- `approachAndRequestItem`;
- `announceResourceDiscovery`;
- `handoffItemAtChest`;
- `waitForBusyCrafter`.

Planned skills to map:

- `craftStonePickaxe`;
- `craftFurnace`;
- `mineCoal`;
- `smeltRawIron`;
- `collectDroppedItems`;
- `exploreForMaterials`;
- `equipBestTool`;
- `placeTorchLightArea`;
- `sleepAtNight`;
- `fleeDanger`;
- `setupSharedStash`;
- hostile action skills only after the survival and utility layer is solid.

## Current File Layout

Prefer small, reviewable files. Do not create a single giant document.

The public knowledge docs live under
`docs/blog-doc/Knowledge/Minecraft-Encyclopedia/`:

1. `Index.md`
   - human-readable index;
   - version stamp;
   - what data exists and how runtime/reviewers should use it.
2. `Mineflayer-API-Boundaries.md`
   - Mineflayer and pathfinder boundary notes that affect action execution.
3. `Early-Survival-Progression-Graph.md`
   - dependency graph for early survival mechanics and evidence.
4. `Action-Skill-Implemented.md` and `Action-Skill-Planned.md`
   - implemented/planned action skill mapping.
5. `Wood-And-Forestry.md`, `Stone-And-Mining.md`,
   `Survival-Crafting-And-Stations.md`, `Food-And-Fuel-Basics.md`, and
   `Mob-Registry.md`
   - focused mechanics records for runtime/verifier use.

Potential implementation files, if the knowledge layer is promoted into code:

1. `probe/src/gameplay/knowledge/vanillaKnowledge.ts`
   - curated compact TypeScript knowledge index;
   - version metadata;
   - item/block families;
   - recipe groups;
   - harvest/drop rules;
   - station requirements;
   - tool, food, fuel, mob, and storage categories;
   - source refs per curated fact.
2. `probe/src/gameplay/knowledge/extractMinecraftData.ts`
   - helper or script that reads `minecraft-data` for the configured Minecraft
     version and validates or generates compact facts;
   - do not hand-type large data tables from memory.
7. Optional generated summary:
   - `probe/src/gameplay/knowledge/generated/minecraft-1.21.11-summary.json`;
   - keep compact;
   - include generation timestamp, Minecraft version, and `minecraft-data`
     package version.
8. `probe/test/minecraftKnowledge.test.ts`
   - verifies key early survival recipe facts exist;
   - verifies source refs are present;
   - verifies seed action skills can map to knowledge entries;
   - rejects implemented skills being represented as unsourced or purely
     aspirational.

Also update:

- `docs/blog-doc/Agent-Search-Index.md` with the search tokens from this page;
- `docs/sidebars.js` with a `Knowledge` category if missing.

## Data Shape Guidance

Use a compact shape similar to:

```ts
export type MinecraftKnowledgeEntry = {
  id: string;
  minecraftVersion: string;
  kind:
    | "item_family"
    | "block_family"
    | "recipe"
    | "harvest_rule"
    | "station"
    | "food"
    | "fuel"
    | "mob_category"
    | "mechanic"
    | "action_skill_mapping";
  summary: string;
  facts: Record<string, unknown>;
  runtimeUses: {
    actionSkillIds: string[];
    primitiveIds: string[];
    verifierEvidence: string[];
    fakeProgressToReject: string[];
  };
  sourceRefs: Array<{
    label: string;
    url?: string;
    repoPath?: string;
    dataPackage?: string;
  }>;
  confidence: "data_backed" | "source_backed" | "needs_source";
};
```

Keep generated raw facts separate from curated runtime facts. The runtime should
consume curated facts first and use generated summaries for validation and
lookups.

## Hard Rules

- Do not trust the model's Minecraft memory.
- Do not copy long wiki pages into this repo.
- Do not store canonical knowledge under ignored runtime artifact paths such as
  `data/evidence/`, `data/actors/`, `tmp/`, or `build/`.
- Do not treat `build/generated-skills` as active action skill memory.
- Do not add generated TypeScript action skill execution to the hot path.
- Do not claim an action skill is implemented because the encyclopedia says the
  Minecraft mechanic exists.
- Do not confuse Minecraft item/block existence with runtime capability.
- Do not inspect or print auth tokens.

## Verification Commands

Run what is feasible:

```bash
cd probe
bun test
bun run typecheck
```

```bash
cd docs
npm run build
```

```bash
git diff --check
```

If a command cannot run, report why. Do not hide unverified work.

## Final Report Template

Use this final report shape:

```md
## Added Knowledge

- Version baseline:
- Data sources:
- Human docs:
- Runtime TS knowledge:
- Tests:

## Runtime Impact

- Action skills improved:
- Planned skills now ready for primitive design:
- Verifier rules clarified:

## Remaining Gaps

- Unsourced facts:
- Missing Mineflayer API confirmation:
- Missing tests:
- Future extraction work:
```

## One-Shot Prompt For Another AI Session

Copy this prompt into the other AI session:

```text
You are working in this repository. Read
docs/blog-doc/Knowledge/Minecraft-Encyclopedia-Research-Brief.md first, then follow
it exactly.

Your task is to build a repo-local Minecraft Java 1.21.11 encyclopedia layer so
the runtime no longer depends on stale LLM Minecraft knowledge.

Use minecraft-data for broad item/block/recipe/entity/food facts. Use Mineflayer
and mineflayer-pathfinder docs for runtime API boundaries. Use official
Minecraft docs and Minecraft Wiki only for concise mechanics explanations with
source URLs.

Produce the requested Knowledge docs, compact TypeScript knowledge index,
extraction helper, and tests. Keep facts version-stamped and source-backed.
Do not mirror wiki pages. Do not change provider auth. Do not add generated code
execution to the hot path. Do not claim runtime capability unless this repo has
an implemented primitive/action skill and verifier evidence.

After changes, run cd probe && bun test, cd probe && bun run typecheck,
cd docs && npm run build, and git diff --check where feasible. Report any
command you could not run.
```
