# Minecraft Java Edition Encyclopedia Index

This encyclopedia serves as the canonical knowledge base for the headless Minecraft agent-loop runtime and async reviewer sidecars. It outlines block IDs, item registries, craft recipes, mob stats, Mineflayer API boundaries, and action skill verification specs.

---

## 📌 Version Baseline Specs
The technical details in this encyclopedia are verified against the following version registry:
*   **Minecraft Java Edition**: `1.21.11`
*   **minecraft-data**: `3.110.2`
*   **mineflayer**: `4.37.1`
*   **mineflayer-pathfinder**: `2.4.5`

---

## 📂 Encyclopedia Directory Structure

Use the following topic-focused files to query specific knowledge blocks:

### 1. Primitives & Ground Rules
*   [Mineflayer API Boundaries](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Mineflayer-API-Boundaries.md)
    *   Detailed specifications of Mineflayer's action methods (`bot.dig`, `bot.craft`, `bot.openContainer`, etc.).
    *   State changes, emitted events, and custom timeout race-wrappers to bypass network lag or infinite hangs.
*   [Early Survival Progression Graph](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Early-Survival-Progression-Graph.md)
    *   Mermaid dependency flowchart mapping early game progression from chopping logs to smelting iron.

### 2. Item & Block registries
*   [Wood and Forestry](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Wood-And-Forestry.md)
    *   Logs, wood, planks, sticks, and wooden tools/weapons.
    *   Block hardness values, IDs, and preferred tool mappings.
*   [Stone and Mining](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Stone-And-Mining.md)
    *   Stone, Cobblestone, Deepslate, and Ore blocks (Coal, Iron, Gold, Diamond, Lapis).
    *   Tool tier requirements, block hardness, and expected raw drops.
*   [Food and Fuel Basics](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Food-And-Fuel-Basics.md)
    *   Fuel tick values, burn times, and item cooking capacities.
    *   Edible food nutrition points, saturation modifiers, and raw-vs-gameplay scaling ratios.
*   [Mob Registry](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Mob-Registry.md)
    *   Passive mobs (sheep, cow, pig, chicken) and drops/shearing/milking rules.
    *   Hostile threats (zombie, skeleton, spider, creeper) with hitbox sizes, health, and drop tables.

### 3. Action Skills & Verification
*   [Implemented Action Skills](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Action-Skill-Implemented.md)
    *   Detailed review of the 12 active seed skills (e.g., `collectLogs`, `mineCobblestone`, `inspectSharedChest`).
    *   Verification contracts, underlying APIs, and fake-progress rejection checks.
*   [Planned Action Skills](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Action-Skill-Planned.md)
    *   Implementation specs, pre-conditions, and verifiers for the remaining roadmap skills (e.g., `craftStonePickaxe`, `smeltRawIron`, `fleeDanger`).
*   [Survival Crafting and Stations](file:///Users/naem1023/git/minecraft-llm-agent-community/docs/docs/Knowledge/Minecraft-Encyclopedia/Survival-Crafting-And-Stations.md)
    *   Inventory crafting (2x2) vs station crafting (3x3).
    *   Recipes for essential components (planks, sticks, torches, tools, chests, furnaces, crafting tables).

---

## ⚙️ How to Consume this Encyclopedia
1.  **Actor Workspace Constraints**: Ensure that all action skill logic relies *strictly* on the IDs and tool tiers documented here.
2.  **Verification-First**: Do not mark tasks complete based on optimistic promise resolution. Always cross-examine state deltas (inventory count delta, block state changes) as defined in the verification files.
3.  **Reviewer Guardrails**: Async reviewers must use the Mineflayer API boundaries to identify common desyncs, window handle leaks, and pathfinding loop stalls.
