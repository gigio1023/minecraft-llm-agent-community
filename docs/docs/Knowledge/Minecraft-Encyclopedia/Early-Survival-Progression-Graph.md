# Early Survival Progression Graph

This document provides a visual and structural representation of early-game survival progression, mapping the dependencies from raw wood logs to advanced iron mining tools in Minecraft Java 1.21.11.

---

## 🗺️ Progression Dependency Flowchart

The diagram below maps how raw materials, crafting grids, and tools progress. Rectangles represent blocks or items, and rounded shapes represent crafting/mining actions.

```mermaid
flowchart TD
    %% Base Materials
    log["Wood Log (ID 134-142)"]
    plank["Wood Planks (ID 221-269)"]
    stick["Stick (ID 946)"]
    crafting_table["Crafting Table (ID 333)"]
    
    %% Hand Crafting (2x2)
    log --> |Hand Craft 2x2| plank
    plank --> |Hand Craft 2x2| stick
    plank --> |Hand Craft 2x2| crafting_table
    
    %% Wooden Pickaxe Crafting
    wooden_pickaxe["Wooden Pickaxe (ID 913)"]
    plank & stick & crafting_table --> |Station Craft 3x3| wooden_pickaxe
    
    %% Cobblestone Mining
    stone_block["Stone Block (ID 1)"]
    cobblestone["Cobblestone (ID 35)"]
    stone_block & wooden_pickaxe --> |Mine Block| cobblestone
    
    %% Stone Tool & Station Crafting
    stone_pickaxe["Stone Pickaxe (ID 918)"]
    furnace["Furnace (ID 334)"]
    cobblestone & stick & crafting_table --> |Station Craft 3x3| stone_pickaxe
    cobblestone & crafting_table --> |Station Craft 3x3| furnace
    
    %% Coal Mining
    coal_ore["Coal Ore (ID 46)"]
    coal["Coal (ID 896)"]
    coal_ore & stone_pickaxe --> |Mine Block| coal
    
    %% Iron Mining
    iron_ore["Iron Ore (ID 44)"]
    raw_iron["Raw Iron (ID 903)"]
    iron_ore & stone_pickaxe --> |Mine Block| raw_iron
    
    %% Smelting
    iron_ingot["Iron Ingot (ID 904)"]
    raw_iron & coal & furnace --> |Smelt in Furnace| iron_ingot
    
    %% Iron Pickaxe Crafting
    iron_pickaxe["Iron Pickaxe (ID 933)"]
    iron_ingot & stick & crafting_table --> |Station Craft 3x3| iron_pickaxe

    %% Styling
    classDef material fill:#d4efdf,stroke:#27ae60,stroke-width:2px;
    classDef tool fill:#fcf3cf,stroke:#f1c40f,stroke-width:2px;
    classDef station fill:#ebdef0,stroke:#8e44ad,stroke-width:2px;
    class log,plank,stick,cobblestone,coal,raw_iron,iron_ingot material;
    class wooden_pickaxe,stone_pickaxe,iron_pickaxe tool;
    class crafting_table,furnace station;
```

---

## 📈 Milestone Progression Checklist

### 🌲 Phase 1: Forestry & Hand Crafting
*   [ ] Collect 3-4 Wood Logs.
*   [ ] Craft 12-16 Wood Planks.
*   [ ] Craft 8 Sticks.
*   [ ] Craft 1 Crafting Table.

### 🪓 Phase 2: Wooden Pickaxe & Stone Age
*   [ ] Place Crafting Table.
*   [ ] Craft Wooden Pickaxe.
*   [ ] Mine 11+ Cobblestone.
*   [ ] Craft Stone Pickaxe and Wooden Axe.

### 🔥 Phase 3: Metallurgy & Smelting
*   [ ] Craft Furnace.
*   [ ] Mine Coal (at least 3-4 pieces) using Stone Pickaxe.
*   [ ] Mine Iron Ore (at least 3 pieces) using Stone Pickaxe.
*   [ ] Ignite Furnace using Coal; smelt Raw Iron to produce Iron Ingots.
*   [ ] Craft Iron Pickaxe using Crafting Table.
