# Planned Action Skills

This document outlines the proposed specification, parameter structures, pre-conditions, and verification rules for the planned action skills on the development roadmap.

---

## 📅 Roadmap Action Skills

### 1. `craftStonePickaxe`
*   **Target Primitives**: `observe`, `wait`, `use_crafting_table` *(Missing)*
*   **Mineflayer APIs**: `bot.findBlock(table)`, `bot.recipesFor(pickaxeId)`, `bot.craft()`.
*   **Pre-conditions**: Has 3 Cobblestone, 2 Sticks, and a placed Crafting Table nearby (within 5 blocks).
*   **Verification Check**: `stone_pickaxe` inventory count increases by >= 1; Cobblestone/Sticks decrease.
*   **Vanilla Mapping**: Station crafting of stone pickaxe (3x3 grid).

### 2. `craftFurnace`
*   **Target Primitives**: `observe`, `wait`, `use_crafting_table` *(Missing)*
*   **Mineflayer APIs**: Same table-crafting APIs as above.
*   **Pre-conditions**: Has 8 Cobblestone, and a placed Crafting Table nearby.
*   **Verification Check**: Placed crafting table utilized. `furnace` inventory count increases by >= 1; Cobblestone count decreases by 8.
*   **Vanilla Mapping**: Crafting a furnace using 8 Cobblestone (3x3 grid).

### 3. `mineCoal`
*   **Target Primitives**: `observe`, `wait`, `mine_block` *(Missing)*
*   **Mineflayer APIs**: `bot.findBlocks` (coal_ore within 12 blocks), `bot.equip(pickaxe)`, `bot.dig()`.
*   **Pre-conditions**: Has wooden/stone pickaxe equipped in hand. Coal ore vein located.
*   **Verification Check**: Coal ore block removed, and inventory `coal` item count increases. Tool-local delta state status is `"mined"`.
*   **Vanilla Mapping**: Mining coal ore block to get coal.

### 4. `smeltRawIron`
*   **Target Primitives**: `observe`, `wait`, `use_furnace` *(Missing)*
*   **Mineflayer APIs**: `bot.findBlock(furnace)`, `bot.openFurnace(block)`, `furnace.putInput()`, `furnace.putFuel()`, `furnace.takeOutput()`.
*   **Pre-conditions**: Has Raw Iron, Coal/Charcoal, and placed Furnace nearby.
*   **Verification Check**: Input and fuel deposited in furnace slots. `iron_ingot` count increases, raw iron/fuel count decreases.
*   **Fake-Progress Rejection**: Verify that the bot does not close the furnace window immediately if the smelting transaction has not completed (1 item takes 10s).
*   **Vanilla Mapping**: Smelting iron ore in a furnace.

### 5. `collectDroppedItems`
*   **Target Primitives**: `observe`, `wait`, `collect_dropped_item` *(Missing)*
*   **Mineflayer APIs**: `bot.nearestEntity(item)`, `bot.pathfinder.goto(GoalNear)`.
*   **Pre-conditions**: Edible/useful item entity detected on ground.
*   **Verification Check**: Pathfinder coordinates arrive at item drop position, and target inventory item count increases.
*   **Vanilla Mapping**: Picking up items on the ground.

### 6. `exploreForMaterials`
*   **Target Primitives**: `observe`, `wait`, `explore_until`, `world_diff` *(Missing)*
*   **Mineflayer APIs**: `bot.pathfinder.goto`, `bot.findBlocks`, `bot.entity.position`.
*   **Pre-conditions**: Active search zone defined in curricular goals.
*   **Verification Check**: Bot moves minimum horizontal coordinate distance and updates memory with coordinates of newly discovered blocks/veins.
*   **Vanilla Mapping**: Scouting for resources.

### 7. `placeCraftingTable`
*   **Target Primitives**: `observe`, `wait`, `place_block`, `use_crafting_table` *(Missing)*
*   **Mineflayer APIs**: `bot.equip(table, "hand")`, `bot.placeBlock(referenceBlock, faceVector)`.
*   **Pre-conditions**: Has `crafting_table` item in inventory. Reference block visible.
*   **Verification Check**: Table block placed in world, block type at coordinates updates to `crafting_table`, inventory table count decreases.
*   **Vanilla Mapping**: Placing crafting table block.

### 8. `equipBestTool`
*   **Target Primitives**: `observe`, `wait`, `equip_item`, `held_item_observation` *(Missing)*
*   **Mineflayer APIs**: `bot.inventory.items()`, `bot.equip()`.
*   **Pre-conditions**: Has higher tier tool in inventory relative to what is currently held.
*   **Verification Check**: `bot.heldItem` updates to the target tool instance with correct tier and type.
*   **Vanilla Mapping**: Selecting the best tool for the task.

### 9. `placeTorchLightArea`
*   **Target Primitives**: `observe`, `wait`, `place_block`, `light_level_observation` *(Missing)*
*   **Mineflayer APIs**: `bot.equip(torch, "hand")`, `bot.placeBlock()`, `bot.lightAt()`.
*   **Pre-conditions**: Has `torch` in inventory. Current block light level &lt; 7.
*   **Verification Check**: Torch block placed, inventory count decreases, and block light level increases.
*   **Vanilla Mapping**: Placing torches to prevent mob spawns.

### 10. `eatFoodWhenHungry`
*   **Target Primitives**: `observe`, `wait`, `consume_item`, `vitals_observation` *(Missing)*
*   **Mineflayer APIs**: `bot.food`, `bot.equip()`, `bot.consume()`.
*   **Pre-conditions**: Hunger points &lt; 20. Has edible food in inventory.
*   **Verification Check**: Food item count decreases, and `bot.food` hunger points increase.
*   **Vanilla Mapping**: Eating food to restore health/hunger.

### 11. `sleepAtNight`
*   **Target Primitives**: `observe`, `wait`, `use_bed`, `time_observation` *(Missing)*
*   **Mineflayer APIs**: `bot.time.timeOfDay`, `bot.sleep(bedBlock)`, `bot.isSleeping`.
*   **Pre-conditions**: Nighttime (`timeOfDay` >= 12542) or thunderstorm. Bed block nearby.
*   **Verification Check**: `bot.isSleeping` is true, and timeOfDay skips to morning (0 ticks).
*   **Vanilla Mapping**: Sleeping in a bed.

### 12. `fleeDanger`
*   **Target Primitives**: `observe`, `wait`, `observe_hostiles`, `flee_from_entity` *(Missing)*
*   **Mineflayer APIs**: `bot.entities`, `bot.pathfinder.goto(GoalInvert)`.
*   **Pre-conditions**: Hostile threat within 16-block detection radius.
*   **Verification Check**: Proximity distance delta to hostile increases; agent moves to a safe zone.
*   **Vanilla Mapping**: Evading hostile monsters.

### 13. `setupSharedStash`
*   **Target Primitives**: `observe`, `wait`, `place_block`, `open_container`, `register_shared_chest` *(Missing)*
*   **Mineflayer APIs**: `bot.equip(chest)`, `bot.placeBlock()`, `bot.openChest()`.
*   **Pre-conditions**: Has chest in inventory.
*   **Verification Check**: Chest block placed, opened, and coordinates registered in the shared ledger.
*   **Vanilla Mapping**: Placing a chest to start a shared base storage.

---

## 🥷 Hostile Roadmap Skills (Planned)
*   **`patrolArea`**: Moves along pre-defined coordinates to scan for threats.
*   **`threatenApproach`**: Approaches intruder and uses proximity chat to warn them away.
*   **`stealFromChestIfExposed`**: Withdraws items from shared chest belonging to another faction.
*   **`attackThenRetreat`**: Strikes target using weapon, then paths backward to avoid retaliation.
