---
sidebar_position: 41
---

# Minecraft Basic Guide

Search token: `MINECRAFT_BASIC_GUIDE`.

Status: active provider-input architecture.

Recorded: 2026-06-02.

## Purpose

The Minecraft Basic Guide is the compact mechanics guide that every social-cycle
provider stage receives as `minecraft_basic_guide`.

Its purpose is to give the LLM enough ordinary Minecraft knowledge to choose
executable actions without rediscovering basic game mechanics from observation.
It is especially important for early survival dependencies such as:

- log -> matching planks;
- planks -> sticks;
- planks -> crafting table item;
- crafting table item -> placed crafting table world block;
- placed crafting table + planks + sticks -> wooden pickaxe;
- wooden pickaxe -> useful cobblestone mining;
- cobblestone + placed crafting table -> stone tools, furnace, and other
  station-gated items.

This guide is not a hard-coded survival strategy. It does not say that every
actor must rush tools, build a base, mine, or follow a benchmark progression.
It only makes the mechanics of an already-relevant action legible.

## Boundary

The guide is different from these runtime packets:

| Packet | Owns | Does Not Own |
|--------|------|--------------|
| `minecraft_basic_guide` | Stable Minecraft mechanics hints, prerequisite flows, station requirements, repeated-observe guidance | CycleGoal choice, runtime permission, physical proof |
| `observation` | Current scoped world, inventory, entity, and position evidence | Global absence outside loaded scans, recipe knowledge |
| `action_surface_summary` | Which actor body capabilities are currently direct/deferred | Domain strategy |
| `runtime_affordances` | Executable primitive ids and args shapes for this turn | Minecraft recipe background |
| Actor Turn tool selection | One visible Action Card or `author_mineflayer_action` selection | Proof of success |
| Runtime evidence | World, inventory, movement, block, container, chat, and transcript truth | Provider preference |

The guide is advisory context. Runtime gates still validate action availability,
structured parameters, role permissions, action-skill ownership, timeouts, and
verification. If the guide and runtime evidence appear to disagree, the runtime
evidence wins for current state.

## Provider Stages

Every ordinary Actor Turn should receive `minecraft_basic_guide`:

- Actor Turn provider: uses it to choose a useful visible Action Card, fill
  schema-bound parameters, or justify `author_mineflayer_action` instead of
  repeating observe;
- internal Mineflayer codegen provider: uses it as mechanics background while
  still relying on current state and runtime helper contracts;
- branch-time Deliberation provider: may use the same vocabulary to reframe
  blockers or durable work, but cannot use the guide to close PlanBeads or claim
  physical progress.

The guide is intentionally stage-independent. A blocker discovered during
runtime evidence classification should feed the next Actor Turn or branch-time
Deliberation with the same mechanics vocabulary.

## Shape

The current provider input uses:

```json
{
  "schema": "minecraft-basic-guide/v1",
  "known_item_flows": [
    {
      "output": "crafting_table",
      "station": "inventory_2x2",
      "inputs": [{ "item_family": "planks", "count": 4 }],
      "output_count": 1,
      "executable_recovery_when_missing": "craft planks if a log is available; otherwise collect logs. After crafting the item, place it before using it as a station."
    },
    {
      "output": "wooden_pickaxe",
      "station": "placed_crafting_table_3x3",
      "inputs": [
        { "item_family": "planks", "count": 3 },
        { "item": "stick", "count": 2 }
      ],
      "output_count": 1,
      "executable_recovery_when_missing": "if no reachable placed crafting_table exists, craft/place one or move to an observed reachable table; if sticks or planks are missing, craft those prerequisites first"
    }
  ],
  "station_requirements": {
    "inventory_2x2": "Can craft small recipes such as planks, sticks, and crafting_table directly from inventory.",
    "placed_crafting_table_3x3": "Required for table-sized recipes such as wooden_pickaxe, stone_pickaxe, furnace, chest, axe, shovel, and sword. The station must be a reachable world block, not merely an inventory item.",
    "crafting_table_item_rule": "The crafting_table item itself is an inventory_2x2 recipe. Do not call craft_with_table for crafting_table, planks, or sticks; use craft_item or an actor-owned prerequisite action skill."
  },
  "blocked_recovery_guides": [
    {
      "blocked_reason_contains": "requires crafting_table in inventory",
      "next_action_rule": "Do not observe for the inventory item again. If inventory has at least four planks, craft_item crafting_table. If not, craft planks from logs or collect_logs first."
    }
  ],
  "observe_stop_guides": {
    "same_missing_prerequisite_limit": "If two recent observations show the same inventory counts and the same missing prerequisite, observe has stopped being useful for that prerequisite."
  }
}
```

## Current Minimum Guide

The guide should cover at least:

- coordinate and loaded-world visibility limits;
- movement and reach requirements;
- block placement target vs support semantics;
- inventory 2x2 crafting vs placed crafting table 3x3 crafting;
- item-vs-world-block differences for crafting tables, chests, and furnaces;
- early item flows through planks, sticks, crafting tables, wooden pickaxes,
  cobblestone, stone pickaxes, furnaces, and chests;
- tool suitability for useful drops;
- block removal vs inventory pickup;
- container item vs opened container state;
- repeated-observe stop guidance;
- blocker-to-prerequisite recovery guidance.

Do not expand the guide into a full Minecraft wiki dump. Use
`Knowledge/Minecraft-Encyclopedia/*` for deeper research and keep provider input
compact.

## Failure Mode Addressed

The guide exists because live runs showed the LLM could know Minecraft in a
general sense but still fail to apply basic prerequisites under long-cycle
pressure. A concrete failure pattern was:

```text
collect logs -> craft planks -> craft sticks -> try wooden_pickaxe at an
unreachable table -> try placeCraftingTable without a crafting_table item ->
repeat observe looking for crafting_table evidence
```

A later Actor Turn run showed a related error:

```text
collect logs -> collect more logs -> craft_with_table(crafting_table) -> timeout
```

That is also wrong. `crafting_table` is not the next table-bound recipe; it is
an inventory-grid prerequisite. The correct prerequisite path is logs -> planks
-> craft_item crafting_table -> place or reach a crafting_table world block.

The corrected behavior should be:

```text
if wooden_pickaxe is useful:
  ensure sticks and planks
  ensure a reachable placed crafting_table
  if no table item exists, craft crafting_table from four planks
  place it or move to an observed reachable table
  then craft wooden_pickaxe
```

The guide does not force the actor to make a wooden pickaxe. It only prevents
the actor from treating missing prerequisites as a mystery that repeated
observation can solve.

## Implementation

Implementation lives in:

- `probe/src/runtime/goals/actorEpisode/minecraftBasicGuide.ts`
- `probe/src/runtime/goals/actorEpisode/turnInput.ts`
- `probe/src/provider/socialActorTurnProvider.ts`
- `probe/src/provider/socialCycleProviderInputs.ts`
- `probe/src/provider/socialGoalMindProvider.ts`
- `probe/test/socialCycleRunner.test.ts`

The Actor Turn provider input should include `minecraft_basic_guide` with schema
`minecraft-basic-guide/v1` and concrete known item flows for at least
`crafting_table` and `wooden_pickaxe`. New behavior should be reviewed through
the Actor Turn input snapshot.
