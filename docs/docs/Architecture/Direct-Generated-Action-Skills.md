---
sidebar_position: 11
---

# Direct Generated Action Skills

Search token: `DIRECT_GENERATED_ACTION_SKILLS`.

Direct generated action skills are TypeScript action programs generated for a
specific Minecraft objective and executed directly against the runtime helper
surface.

This is the main propagation path for new behavior. Bounded recipes remain
valuable as a later cleanup and promotion format, but the runtime should not
require every useful behavior to be hand-authored before it can be tried.

## Why This Exists

Voyager's useful insight is not raw `eval` by itself. The useful insight is that
Mineflayer code is a compact action language for Minecraft. A goal such as
`craft 1 stone_axe` is easier to solve by generating a small program that checks
inventory, crafts prerequisites, mines missing material, and verifies the final
item than by asking a human to pre-register every possible action skill.

The direct path should support:

- fast objective-driven propagation;
- code artifacts that explain what the model attempted;
- current-run evidence that decides success;
- typed actor memory that lets future generated code reuse verified attempts
  and avoid known failed patterns;
- background reviewer cleanup into smaller reusable action skills or recipes.

## Runtime Contract

A generated action skill must export:

```ts
export async function run(ctx) {
  // Mineflayer-backed work through ctx helpers.
}
```

The default direct context should expose high-level helpers first:

- inventory and world observation;
- `ensureItem(name, count)` style acquisition helpers;
- crafting helpers such as `craftItem` and `craftWithTable`;
- mining helpers such as `mineBlock`;
- `ensureCraftingTableNearby`, including local crafting-table placement when no
  table is near the actor;
- bounded wait, move, and equip helpers.

Raw `bot` access may be exposed in trusted research runs, but generated code
should prefer helpers because helper calls create reviewable evidence.

The helpers are intentionally more capable than the smallest Mineflayer API
call. For early-game objectives, a generated call such as
`craftItem("crafting_table", 1)` should be treated as a reasonable request, not
as proof that the model planned every prerequisite correctly. The substrate may
collect logs, craft planks, craft sticks, place a table, mine cobblestone, and
craft table-bound tools through evidence-producing helper calls. This keeps the
LLM's action program free while moving Minecraft mechanics and verifier
responsibility into runtime-owned code.

## Guardrail Level

The default guardrail is intentionally light:

- block imports, `require`, process/env, filesystem, network, `eval`, and
  `Function`;
- reject obvious unbounded loops such as `while (true)` and `for (;;)`;
- run with a timeout;
- abort timeout by stopping Mineflayer pathfinder, digging, and movement state;
- record generated source, helper calls, return value, error or timeout, and
  pre/post objective evidence.

This is not a heavy sandbox. The main safety mechanism is that success is never
accepted from the generated return value alone. The objective verifier must see
current-run Minecraft evidence.

## Lifecycle

```text
objective
-> generated TypeScript action skill
-> direct execution
-> objective verifier
-> active/candidate storage with evidence
-> background reviewer cleanup
```

Successful direct code can become reusable quickly, but it still carries its
trial evidence. Background reviewers can later:

- split large generated code into smaller action skills;
- convert stable helper traces into bounded recipes;
- mark repeated failures as broken;
- identify missing primitives or missing helper affordances.

## Stone Axe Example

`craft_current_run_stone_axe_1` should be allowed to generate a program like:

```ts
export async function run(ctx) {
  await ctx.ensureItem("stick", 2);
  await ctx.ensureItem("crafting_table", 1);
  await ctx.ensureItem("wooden_pickaxe", 1);
  await ctx.ensureItem("cobblestone", 3);
  await ctx.ensureCraftingTableNearby();
  await ctx.craftWithTable("stone_axe", 1);
}
```

The action skill passes only when current-run inventory evidence shows
`stone_axe >= 1`.

Current implementation proof:

```bash
cd probe
bun run probe:objective -- --objective craft_current_run_stone_axe_1 --mode direct-generated --provider deterministic --actor npc_b --report ../tmp/objective-stone-axe-direct-current.json
```

The current passing report records:

- generated TypeScript source under actor workspace direct-trial artifacts;
- provider input snapshot for the source-generation request;
- helper events for log collection, plank/stick crafting, crafting table use,
  wooden pickaxe crafting, stone mining, and final stone axe crafting;
- `preInventory=[]`;
- `postInventory` containing `stone_axe: 1`;
- verifier status `passed` from current-run inventory delta.
- typed memory records under `memory/episodic` and `memory/procedural` for
  future objective-scoped retrieval.

`--provider openai-codex` has also passed this objective with model-generated
TypeScript. The direct context intentionally tolerates common generated-code
shapes such as `sticks`/`planks` aliases, count-as-target helper calls, and
substrate-assisted `craftItem(...)` calls for supported early-game prerequisite
chains, while still requiring the final objective verifier to read Minecraft
inventory evidence.

Latest current-run provider proof:

```bash
cd probe
bun run probe:objective -- --objective craft_current_run_stone_axe_1 --mode direct-generated --provider openai-codex --actor npc_b --report ../tmp/objective-stone-axe-gpt54-mini-low-memory-rerun-2.json
```

The run `craft_current_run_stone_axe_1-npc_b-1779475080615` used
`gpt-5.4-mini` with reasoning `low`, retrieved prior failed-trial memory as
guardrail context, generated its own TypeScript action program, and passed only
after current-run inventory contained `stone_axe: 1`.

That proof also covers the current helper-substrate contract: `craftItem(...)`
and `craftWithTable(...)` are prerequisite-aware for supported early-game
items, while `collectLogs` and `mineBlock` keep the live dig operation atomic
and bound only the post-dig pickup/pathfinder fallback phase.

## Relationship To Bounded Recipes

Bounded recipes are no longer the only creation path. They are the cleaned-up,
reviewable representation that can be produced after direct generated code has
shown value.

The repo should avoid going back to a world where `build/generated-skills` is a
loose legacy dump. Direct generated action skills belong under actor workspace
artifacts and objective reports, with source and trial evidence tied together.

## Relationship To Typed Memory

Direct generated code is allowed to be creative. Memory is the substrate that
keeps that creativity grounded:

```text
generated source
-> helper events
-> verifier result
-> episodic memory
-> procedural or guardrail candidate
-> bounded retrieval into the next provider call
```

This means the model can keep trying new Mineflayer strategies, but future
turns receive evidence-linked lessons instead of stale summaries or a giant
unfiltered transcript.
