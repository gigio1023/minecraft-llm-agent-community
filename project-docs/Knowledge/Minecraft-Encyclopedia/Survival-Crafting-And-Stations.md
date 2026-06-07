# Survival Crafting & Stations Registry

This document catalogues the core functional blocks required for crafting, smelting, and safe habitation in Minecraft Java 1.21.11.

---

## 🛠️ 1. Core Stations
These blocks provide UIs to process materials or store items. Without a crafting table, the agent is restricted to a 2x2 grid.

| Station Name | Block ID | Item ID | Namespaced ID | Interaction / Purpose |
| :--- | :---: | :---: | :--- | :--- |
| **Crafting Table** | 205 | 332 | `crafting_table` | Unlocks the 3x3 crafting grid. Essential for almost all tools and blocks. |
| **Chest** | 200 | 331 | `chest` | Provides 27 slots of inventory. Can be doubled by placing two adjacent to each other. |
| **Furnace** | 208 | 334 | `furnace` | Smelts ores into ingots and cooks raw food using a fuel source. |

### Crafting Logic for Agents
When crafting items that require a `crafting_table`, the agent MUST:
1. Locate a nearby `crafting_table` block in the world.
2. If none exists, craft a `crafting_table` item using 4 planks in the 2x2 inventory grid, then place it in the world.
3. Call `bot.craft(recipe, count, craftingTableBlock)`.

---

## 🔥 2. Illumination & Safety
Light prevents hostile mob spawning. Maintaining light levels inside the village or mining outposts is a key survival requirement.

| Name | Block ID | Item ID | Namespaced ID | Crafting Requirements |
| :--- | :---: | :---: | :--- | :--- |
| **Torch** | 193 | 322 | `torch` | 1 Stick + 1 Coal (or Charcoal). Yields 4 torches. |

### Torch Mechanics
*   **Placement**: Can be placed on the top or sides of most solid blocks.
*   **Light Level**: Emits a light level of 14.
*   **Safety Threshold**: Hostile mobs generally require a light level of 0 to spawn. Placing a torch guarantees safety in a moderate radius (roughly 13-14 blocks diagonally in open air, less around corners).

---

## 📦 3. Basic Raw Materials
These items are the intermediate step between mining and crafting advanced goods.

| Item Name | Item ID | Namespaced ID | Primary Use |
| :--- | :---: | :--- | :--- |
| **Coal** | 896 | `coal` | Fuel for furnaces and component for crafting torches. |
| **Raw Iron** | 903 | `raw_iron` | Mined from Iron Ore. Must be smelted in a furnace. |
| **Raw Gold** | 907 | `raw_gold` | Mined from Gold Ore. Must be smelted in a furnace. |
| **Iron Ingot**| 904 | `iron_ingot` | Smelted from Raw Iron. Used for armor, iron tools, shears, and buckets. |
| **Lapis Lazuli**| 900 | `lapis_lazuli` | Used for enchanting and dyeing. |
| **Diamond** | 898 | `diamond` | Used for top-tier gear, enchantment tables, and jukeboxes. |

### Furnace Smelting Logic for Agents
When smelting:
1. The agent needs a furnace block.
2. Call `bot.openFurnace(furnaceBlock)`.
3. Put the raw material (e.g., `raw_iron`) in the input slot.
4. Put fuel (e.g., `coal` or `oak_planks`) in the fuel slot.
5. Wait for the `furnace.on('update')` events to track progress, and extract the `iron_ingot` from the output slot.
