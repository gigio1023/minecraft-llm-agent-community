# Stone and Mining Registry

This document lists the foundational stone blocks and primary ores necessary for progression beyond the wooden tier in Minecraft Java 1.21.11.

---

## 🪨 1. Primary Stone Blocks
Stone and its deep variant act as the vast majority of underground generation. Mining smooth stone with a basic pickaxe drops cobblestone.
*   **Harvest Tag**: `mineable/pickaxe`
*   **Minimum Tool**: Wooden Pickaxe (required to drop the block).

| Block Name | Block ID | Item ID | Namespaced ID | Description / Note |
| :--- | :---: | :---: | :--- | :--- |
| **Stone** | 1 | 1 | `stone` | The smooth variant. Requires Silk Touch to drop directly. |
| **Cobblestone** | 12 | 35 | `cobblestone` | Dropped when mining Stone without Silk Touch. Used for basic tools. |
| **Deepslate** | 1121 | 8 | `deepslate` | The smooth dark variant found deep underground (y &lt; 0). |
| **Cobbled Deepslate** | 1122 | 9 | `cobbled_deepslate` | Dropped when mining Deepslate. Usable as a cobblestone alternative. |

---

## 💎 2. Ores & Mining Targets
Mining ores is the primary gameplay loop to upgrade tools and armor.

| Ore Name | Block ID | Item ID | Namespaced ID | Min Pickaxe Tier | Drop |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **Coal Ore** | 46 | 64 | `coal_ore` | Wooden | Coal (Item) |
| **Deepslate Coal Ore** | 47 | 65 | `deepslate_coal_ore` | Wooden | Coal (Item) |
| **Iron Ore** | 44 | 66 | `iron_ore` | Stone | Raw Iron |
| **Deepslate Iron Ore** | 45 | 67 | `deepslate_iron_ore` | Stone | Raw Iron |
| **Gold Ore** | 42 | 70 | `gold_ore` | Iron | Raw Gold |
| **Deepslate Gold Ore** | 43 | 71 | `deepslate_gold_ore` | Iron | Raw Gold |
| **Lapis Lazuli Ore** | 102 | 76 | `lapis_ore` | Stone | Lapis Lazuli |
| **Deepslate Lapis Ore**| 103 | 77 | `deepslate_lapis_ore`| Stone | Lapis Lazuli |
| **Diamond Ore** | 202 | 78 | `diamond_ore` | Iron | Diamond |
| **Deepslate Diamond Ore**| 203 | 79 | `deepslate_diamond_ore`| Iron | Diamond |
| **Obsidian** | 192 | 321 | `obsidian` | Diamond | Obsidian |

---

## ⛏️ 3. Pickaxe Tool Hierarchy
Upgrading the pickaxe is essential for progressing deeper and harvesting harder materials.

| Pickaxe Tier | Item ID | Namespaced ID | Max Durability | Base Mining Speed |
| :--- | :---: | :--- | :---: | :---: |
| **Wooden Pickaxe** | 913 | `wooden_pickaxe` | 59 | 2.0 |
| **Stone Pickaxe** | 923 | `stone_pickaxe` | 131 | 4.0 |
| **Iron Pickaxe** | 933 | `iron_pickaxe` | 250 | 6.0 |
| **Diamond Pickaxe** | 938 | `diamond_pickaxe` | 1561 | 8.0 |
| **Netherite Pickaxe**| 943 | `netherite_pickaxe`| 2031 | 9.0 |

---

## ⚠️ Pickaxe Requirement Logic
When programming the agent:
*   **Always check the tool requirement**: The pathfinder and dig mechanic will happily let the agent spend 15 seconds digging diamond ore with a wooden pickaxe, only for the block to drop nothing.
*   Before issuing `bot.dig(targetBlock)`, verify `targetBlock.harvestTools`. 
*   A tool is valid if `tool.id` exists in `Object.keys(targetBlock.harvestTools)`.
