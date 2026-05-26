# Food and Fuel Basics

Managing hunger and smelting resources are core gameplay loops. Without food, an agent cannot sprint and will eventually take starvation damage.

---

## 🍗 1. Food Registry
Food restores the hunger bar (Food Points) and saturation (invisible buffer before hunger depletes). 
*   **Maximum Food Level**: 20
*   **Maximum Saturation**: 20 (can never exceed current Food Level)

| Food Name | Item ID | Namespaced ID | Food Points Restored | Saturation Restored | Source |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **Apple** | 893 | `apple` | 4 | 2.4 | Oak/Dark Oak leaves (rare drop). |
| **Bread** | 953 | `bread` | 5 | 6.0 | Crafted from 3 Wheat. |
| **Raw Beef** | 1110 | `beef` | 3 | 1.8 | Dropped by Cows. |
| **Cooked Beef** | 1111 | `cooked_beef` | 8 | 12.8 | Smelted Raw Beef. |
| **Raw Porkchop** | 983 | `porkchop` | 3 | 1.8 | Dropped by Pigs. |
| **Cooked Porkchop**| 984 | `cooked_porkchop`| 8 | 12.8 | Smelted Raw Porkchop. |
| **Raw Chicken** | 1112 | `chicken` | 2 | 1.2 | Dropped by Chickens. (30% chance of Hunger). |
| **Cooked Chicken** | 1113 | `cooked_chicken` | 6 | 7.2 | Smelted Raw Chicken. |
| **Raw Mutton** | 1264 | `mutton` | 2 | 1.2 | Dropped by Sheep. |
| **Cooked Mutton** | 1265 | `cooked_mutton` | 6 | 9.6 | Smelted Raw Mutton. |
| **Sweet Berries** | 1373 | `sweet_berries` | 2 | 0.4 | Harvested from Sweet Berry Bushes. |
| **Glow Berries** | 1374 | `glow_berries` | 2 | 0.4 | Harvested from Cave Vines. |

### Eating Logic for Agents
Agents should actively monitor `bot.food`. If `bot.food &lt;= 16`, the agent should eat to maintain the ability to heal naturally.
*   **API Call**: `await bot.equip(foodItemId, 'hand')` followed by `await bot.consume()`.

---

## 🔥 2. Fuel Registry
Furnaces require fuel to smelt ores and cook food. Each operation takes exactly 10 seconds (200 ticks).
*   **Coal Item ID**: 896 (`coal`)

| Fuel Type | Namespaced ID | Burn Time (Ticks) | Items Smelted per Unit |
| :--- | :--- | :---: | :---: |
| **Coal / Charcoal**| `coal` / `charcoal` | 1600 | 8.0 |
| **Wood Logs** | `*_log` | 300 | 1.5 |
| **Wood Planks** | `*_planks` | 300 | 1.5 |
| **Sticks** | `stick` | 100 | 0.5 |
| **Wooden Tools** | `wooden_*` | 200 | 1.0 |

### Efficient Smelting Tips
*   Always use Coal or Charcoal if available (1 coal smelts exactly 8 items).
*   Logs and Planks burn for the same amount of time. Therefore, **always craft Logs into Planks before using them as fuel**. One Log yields 4 Planks. 
    *   1 Log as fuel = 1.5 items smelted.
    *   1 Log -> 4 Planks as fuel = 6.0 items smelted.
