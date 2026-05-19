# Minecraft Gameplay And Voyager Seed Skills Research

Date: 2026-05-19

## Minecraft Gameplay Model

Minecraft survival starts with an empty inventory. A useful player loop is not
"look around and dig random dirt"; it is:

1. Gather immediately available resources: logs, dirt, stone, food.
2. Craft basic materials: planks, sticks, crafting table.
3. Craft tools: wooden pickaxe, stone pickaxe, axe, sword, shovel, hoe.
4. Use better tools to unlock better resources: stone, coal, iron, copper,
   diamond, redstone, lapis.
5. Build survival infrastructure: bed, furnace, chest, torches, shelter/base.
6. Establish renewables: crops, animals, tree farming, storage, smelting.
7. Explore structured opportunities: villages, caves, mineshafts, temples,
   shipwrecks, Nether, End.
8. Upgrade equipment: armor, shield, bucket, iron tools, diamond/netherite gear.

In multiplayer, meaningful social behavior usually comes from resource
allocation, role specialization, cooperation, trade, shared base/stash work, or
competition over scarce resources.

## Voyager Prompt Lessons

Voyager's `action_template.txt` gives the LLM a task-specific code-generation
contract:

- It receives prior code, execution error, chat log, biome, time, nearby blocks,
  nearby entities, health, hunger, position, equipment, inventory, chests, task,
  context, and critique.
- It must explain missing steps, plan step by step, then write one async
  Mineflayer function.
- It must reuse game primitives instead of raw APIs:
  - `mineBlock(bot, name, count)`
  - `craftItem(bot, name, count)`
  - `smeltItem(bot, itemName, fuelName, count)`
  - `placeItem(bot, name, position)`
  - `killMob(bot, name, timeout)`
  - `exploreUntil(bot, direction, maxDistance, callback)`
- It must call `bot.chat` for intermediate progress.
- It must avoid infinite loops/event listeners and write reusable functions.

Voyager's `curriculum.txt` also matters. It asks for one concrete next task in
formats like:

- `Mine [quantity] [block]`
- `Craft [quantity] [item]`
- `Smelt [quantity] [item]`
- `Kill [quantity] [mob]`
- `Cook [quantity] [food]`
- `Equip [item]`

This curriculum prevents idle wandering by anchoring action generation to
game-progress tasks.

## Voyager Control Primitives

The key primitives are:

- `mineBlock`: validates block name, finds matching blocks within max distance
  32, uses collect-block pathing, saves a mined event, and warns to explore first
  if none are nearby.
- `craftItem`: validates item name, walks to a crafting table if nearby, crafts
  via recipes, and emits chat feedback when requirements are missing.
- `smeltItem`: opens a furnace, supplies fuel/input, waits for output, takes
  output, and emits feedback for invalid fuel/input.
- `exploreUntil`: moves in a bounded direction and repeatedly checks a callback
  until a target is found or timeout is reached.
- `placeItem`, `killMob`, `useChest`, and related helpers make high-level
  Minecraft actions reusable.

## Voyager Seed Skill Categories

Observed skill library categories from `MineDojo/Voyager`:

- Resource collection: `mineWoodLog`, `mineThreeMoreOakLogs`,
  `obtainOneMoreAcaciaLog`, `obtainBirchLogs`, `collectBamboo`,
  `collectFiveCactusBlocks`
- Stone and ore mining: `mineTenCobblestone`, `mineEightCobblestone`,
  `mineFiveCoalOres`, `mineFiveIronOres`, `mineFiveCopperOres`,
  `mineFiveLapisLazuliOres`, `mineDeepslateOres`
- Crafting: `craftCraftingTable`, `craftOakPlanksAndSticks`,
  `craftWoodenPickaxe`, `craftStonePickaxe`, `craftFurnace`, `craftChest`,
  `craftBucket`, `craftIronPickaxe`, `craftIronSword`, `craftShield`,
  `craftWhiteBed`, `craftTorches`
- Smelting/cooking: `smeltFiveRawIron`, `smeltRawCopper`, `cookPorkchops`,
  `cookRawMutton`, `cookRawBeef`
- Food and mobs: `killOnePig`, `killTwoPigs`, `killFourSheep`,
  `killThreeChickens`, `eatCookedMutton`, `eatCookedBeef`
- Equipment: `equipIronSword`, `equipIronArmor`, `equipShield`
- Exploration/interaction: `exploreCave`, `exploreCaveAndGatherResources`,
  `openChestAndCheckContents`, `fishInNearbyWaterSafely`, `plantOakSapling`

## Seed Skill Set To Port First

For this probe, port a small TypeScript subset before more social simulation:

1. `mineBlock(ctx, name, count)`
2. `collectLogs(ctx, count)`
3. `craftPlanksAndSticks(ctx)`
4. `craftCraftingTable(ctx)`
5. `craftWoodenPickaxe(ctx)`
6. `mineCobblestone(ctx, count)`
7. `craftStonePickaxe(ctx)`
8. `craftFurnace(ctx)`
9. `mineCoal(ctx, count)`
10. `smeltRawIron(ctx, count)`
11. `inspectVillageChest(ctx)`
12. `collectDroppedItems(ctx)`

Only after these exist should NPC social behavior be tested. Social dynamics
should then be driven by real task pressure: who collects logs, who crafts,
who mines stone, who takes village loot, who stores/shared items, and who
prioritizes personal upgrades.
