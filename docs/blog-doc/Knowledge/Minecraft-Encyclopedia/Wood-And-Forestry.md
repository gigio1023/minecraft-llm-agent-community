# Wood and Forestry Registry

This document details the registry IDs, block properties, and item stats for all wood families and wooden tools in Minecraft Java 1.21.11.

---

## 🪵 1. Wood Logs and Wood Blocks
Logs and Wood blocks are the foundational building blocks for early-game progression.
*   **Block Hardness**: `2.0`
*   **Blast Resistance**: `2.0`
*   **Stack Size**: `64`
*   **Harvest Tag**: `mineable/axe` (an axe is not strictly required to get the drop, but it significantly speeds up mining progress).

| Wood Family | Log Block ID | Log Item ID | Log Namespaced ID | Wood Block ID | Wood Item ID | Wood Namespaced ID |
| :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| **Oak** | 49 | 134 | `oak_log` | 71 | 171 | `oak_wood` |
| **Spruce** | 50 | 135 | `spruce_log` | 72 | 172 | `spruce_wood` |
| **Birch** | 51 | 136 | `birch_log` | 73 | 173 | `birch_wood` |
| **Jungle** | 52 | 137 | `jungle_log` | 74 | 174 | `jungle_wood` |
| **Acacia** | 53 | 138 | `acacia_log` | 75 | 175 | `acacia_wood` |
| **Cherry** | 54 | 139 | `cherry_log` | 76 | 176 | `cherry_wood` |
| **Dark Oak** | 55 | 141 | `dark_oak_log` | 77 | 178 | `dark_oak_wood` |
| **Mangrove** | 57 | 142 | `mangrove_log` | 78 | 179 | `mangrove_wood` |

---

## 🪵 2. Wood Planks
Planks are crafted from logs (1 log = 4 planks) and are the primary material for sticks, crafting tables, chests, and wooden tools.
*   **Block Hardness**: `2.0`
*   **Blast Resistance**: `3.0`
*   **Stack Size**: `64`
*   **Harvest Tag**: `mineable/axe`

| Plank Variant | Block ID | Item ID | Item Namespaced ID |
| :--- | :---: | :---: | :--- |
| **Oak Planks** | 13 | 36 | `oak_planks` |
| **Spruce Planks** | 14 | 37 | `spruce_planks` |
| **Birch Planks** | 15 | 38 | `birch_planks` |
| **Jungle Planks** | 16 | 39 | `jungle_planks` |
| **Acacia Planks** | 17 | 40 | `acacia_planks` |
| **Cherry Planks** | 18 | 41 | `cherry_planks` |
| **Dark Oak Planks** | 19 | 42 | `dark_oak_planks` |
| **Mangrove Planks** | 22 | 44 | `mangrove_planks` |
| **Bamboo Planks** | 23 | 45 | `bamboo_planks` |

---

## 🔨 3. Sticks & Wooden Tools
Wooden tools represent Tier 0 in mining and harvesting. They can be repaired in an anvil using any matching type of wood planks.
*   **Stick**: Item ID `946` | Stack Size: `64`
*   **Tool Stack Size**: `1` (all tools)
*   **Maximum Durability**: `59` (all wooden tools)

| Tool / Weapon | Item ID | Namespaced ID | Primary In-game Purpose / Interaction |
| :--- | :---: | :--- | :--- |
| **Wooden Sword** | 911 | `wooden_sword` | Combating hostile threats. Deals 4 HP damage. |
| **Wooden Shovel** | 912 | `wooden_shovel` | Rapid excavation of dirt, sand, gravel, and snow. |
| **Wooden Pickaxe** | 913 | `wooden_pickaxe` | Mining Stone, Cobblestone, and Coal. Required to drop Cobblestone. |
| **Wooden Axe** | 914 | `wooden_axe` | Harvesting logs, wood, planks, chests, and crafting tables. |
| **Wooden Hoe** | 915 | `wooden_hoe` | Tilling soil blocks and harvesting leaves/hay bales quickly. |

---

## ⚠️ Digging Time Calculation for Logs
Under vanilla mechanics, the formula for digging time is:

`Dig Time (seconds) = (Block Hardness * 1.5) / Tool Speed` (if matching tool is used)
`Dig Time (seconds) = (Block Hardness * 5.0) / 1` (if mined by hand)

*   **Mining Oak Log by Hand**: 2.0 * 5.0 = 10.0 seconds.
*   **Mining Oak Log with Wooden Axe**: 2.0 * 1.5 / 2.0 = 1.5 seconds.
*   *Note*: In-game lag can cause minor deviations. Always await the `bot.dig` promise fully.
