# Minecraft Action Skill Audit

Use this when reviewing `probe/src/gameplay/seedSkills/registry.ts`, runtime
primitives, Mineflayer tools, or any claim that a bot can perform a Minecraft
task.

## Core Rule

Do not accept a seed action skill because it sounds like a Minecraft task. A
seed action skill is executable only when the current runtime has:

1. the Minecraft prerequisite state;
2. a Mineflayer primitive that can perform the task;
3. bounded movement/targeting/cancellation;
4. verification from world, inventory, container, or position evidence;
5. role permission to use every primitive in the action skill.

If any layer is missing, mark the action skill as planned or architecture-only,
not an active capability.

## Early-Game Progression Reality

The safe initial chain is:

```text
collect nearby low logs
-> craft planks
-> craft sticks
-> craft crafting table
-> place/find/use crafting table
-> craft wooden pickaxe
-> mine stone/cobblestone with pickaxe
-> craft stone tools/furnace
-> mine coal/iron with correct tool
-> smelt with furnace fuel/input/output handling
```

For this repo's current Phase 1, only the first part should be treated as active
unless the corresponding primitive exists and is live-tested.

## Mineflayer-Specific Checks

For every action skill, ask:

- Does `bot.findBlock` or `bot.findBlocks` search the right block family?
- Is the target close, low, reachable, and not stale?
- Does pathfinder stop on timeout or abort?
- Does the tool avoid chasing unrelated dropped items or entities?
- Does `bot.dig` require a held tool or line of sight?
- Does crafting require a crafting table object, and is one available?
- Does container interaction use an actual opened chest/furnace or only a ledger?
- Does success use `bot.inventory.items()`, `blockAt`, chest contents, or
  position distance rather than status text?
- Does the role contract allow every primitive used by the action skill?

## Action Skill Status

Use these labels:

- `implemented`: current primitives can execute the action skill and verification can
  prove progress.
- `planned`: the action skill is a valid Minecraft future target, but a required
  primitive, world interaction, role contract, or verifier is missing.

Do not put planned action skills into active ownership or provider candidate lists.
They can remain in the registry as roadmap entries only if their missing
primitive is explicit.

## Common False Capabilities

| Claimed action skill | Why it may be false | Required primitive/evidence |
|---------------|---------------------|-----------------------------|
| mineCobblestone | `collect_logs` cannot mine stone; requires pickaxe gating | `mine_block`, inventory cobblestone delta |
| mineCoal | needs ore targeting and correct pickaxe | `mine_block`, ore/block evidence, coal delta |
| craftWoodenPickaxe | requires crafting table use | `use_crafting_table`, crafted item delta |
| craftFurnace | needs cobblestone and table support | `mine_block`, table recipe support |
| smeltRawIron | crafting is not smelting | `use_furnace`, fuel/input/output evidence |
| collectDroppedItems | moving near an item is not pickup proof | item target, pickup/inventory delta |
| hostile combat | movement is not attack/retreat behavior | combat primitive, health/range evidence |

## Reference-Derived Initial Ability Candidates

Local reference repos point to the same useful initial capability set:

- Voyager: `exploreUntil`, `mineBlock`, `craftItem`, `placeItem`, `smeltItem`,
  `useChest`, `killMob`, `eat`, `equip`.
- mineflayer-chatgpt: `gather_wood`, `mine_block`, `craft_gear`,
  `light_area`, `smelt_ores`, `setup_stash`, `go_fishing`, `build_bridge`,
  with one-active-action-skill and abortable progress reporting.
- mindcraft-ce: movement, block collection, item pickup, crafting, smelting,
  chest I/O, consume/equip, flee/defense, and careful precondition messages.
- yearn_for_mines: lifecycle/status tools, reposition, gather_materials,
  craft_items, build, interact:eat/sleep/open, combat, and transient reconnect
  handling.

For this repo, the next seed action skills should be added as `planned` until
their primitive contracts exist:

| Planned seed action skill | Missing primitive contract |
|--------------------|----------------------------|
| `exploreForMaterials` | `explore_until`, `world_diff` |
| `placeCraftingTable` | `place_block`, `use_crafting_table` |
| `equipBestTool` | `equip_item`, `held_item_observation` |
| `placeTorchLightArea` | `place_block`, `light_level_observation` |
| `eatFoodWhenHungry` | `consume_item`, `vitals_observation` |
| `sleepAtNight` | `use_bed`, `time_observation` |
| `fleeDanger` | `observe_hostiles`, `flee_from_entity` |
| `setupSharedStash` | `place_block`, `open_container`, `register_shared_chest` |

Promote one to `implemented` only after the primitive, verification, and a live
artifact prove the behavior.

## Audit Output

Use a compact table:

```text
Action Skill Audit
collectLogs: implemented. Evidence: collect_logs primitive, inventory/block verifier. Risk: target selection/pathing must be live-checked.
mineCobblestone: planned. Reason: no mine_block primitive; collect_logs is invalid for stone.
...
```

Then list code changes:

```text
Implementation corrections:
- Mark planned action skills explicitly.
- Filter active runtime candidates to implemented action skills only.
- Ensure actor action skill ownership respects role contracts.
- Add missing primitive names for future work.
```

## Gotchas

- Minecraft task names are easy to overclaim. Prefer underclaiming and a clean
  next primitive over advertising a fake capability.
- Do not let a role own an action skill if its role contract cannot use all
  primitives in that action skill.
- Do not use one generic primitive name for different Minecraft mechanics.
  Mining logs, mining stone, opening containers, crafting at a table, and
  smelting are different runtime contracts.
