# Implemented Action Skills

This document details the mechanics, verification contracts, and failure modes for the 12 active seed action skills currently implemented in the Minecraft agent runtime.

---

## 🛠️ Implemented Skills Reference

### 1. `runtimeObserveAndRemember`
*   **Primitives Used**: `observe`, `wait`, `remember`
*   **Mineflayer APIs**:
    *   `bot.entity.position.distanceTo` (computes distance to visible teammates).
    *   `bot.inventory.items()` (snapshots active inventory).
    *   `bot.findBlocks` / `bot.blockAt` (scans 16-block radius, Y-delta &lt;= 3, keeps max 12 including tables/chests).
    *   `sharedChest.inspect()` (queries chest inventory ledger).
    *   `dialogueState.peek(target)` (checks teammate busy flags).
*   **Verification Contract**: `ObserveResult` contains valid position coordinates, list of visible actors with status, and a list of scanned block coordinates. `RememberResult` confirms the note is added to the agent's memory store.
*   **Fake-Progress Rejection**: Reject observation if entity locations are stale. Reject memory addition if the note string is empty or undefined.
*   **Vanilla Mapping**: Cognitive sensing and visual environment scan.

### 2. `collectLogs`
*   **Primitives Used**: `observe`, `collect_logs`, `wait`
*   **Mineflayer APIs**:
    *   `bot.findBlocks` (searches max 16 logs within 12 blocks, Y-delta &lt;= 3).
    *   `bot.pathfinder.goto(GoalNear)` (navigates to target log).
    *   `bot.equip(axe, "hand")` (equips appropriate axe).
    *   `bot.dig(block, true)` (mines log block).
    *   `bot.nearestEntity(item)` (searches drops on ground).
*   **Verification Contract**: Mineflayer dig promise resolves without interruption. Pathfinder movement does not drift. Log inventory count increases.
*   **Fake-Progress Rejection**:
    *   *Drift / Abort*: Reject success if pathfinder drifts away from the target log block or if the dig promise is interrupted.
    *   *Zero-Yield*: Reject success if logs count does not increase after digging or picking up nearby drops.
*   **Vanilla Mapping**: Chopping trees and collecting wood.

### 3. `craftPlanksAndSticks`
*   **Primitives Used**: `observe`, `craft_item`, `wait`
*   **Mineflayer APIs**:
    *   `bot.recipesFor(planksOrSticks, null, 1, null)` (passing null table restricts to 2x2 grid).
    *   `bot.craft(recipe, 1, null)`.
*   **Verification Contract**: Logs count decreases; Planks/Sticks count in inventory increases to target.
*   **Fake-Progress Rejection**: Verify both planks and sticks counts separately. Reject if inventory delta &lt;= 0 or if the bot tries to craft without logs.
*   **Vanilla Mapping**: Hand crafting planks and sticks (2x2 grid).

### 4. `craftCraftingTable`
*   **Primitives Used**: `observe`, `craft_item`, `wait`
*   **Mineflayer APIs**: Same as Planks/Sticks with `crafting_table` ID.
*   **Verification Contract**: `crafting_table` inventory count increases by >= 1; Planks count decreases by 4.
*   **Fake-Progress Rejection**: Verify plank consumption. Reject if table count delta &lt;= 0.
*   **Vanilla Mapping**: Crafting a crafting table (2x2 grid).

### 5. `craftWoodenPickaxe`
*   **Primitives Used**: `observe`, `craft_with_table`, `wait`
*   **Mineflayer APIs**:
    *   `bot.findBlocks` (finds placed crafting table within 5 blocks).
    *   `bot.recipesFor(pickaxeId, null, 1, tableBlock)`.
    *   `bot.craft(recipe, 1, tableBlock)`.
*   **Verification Contract**: Planks/Sticks decrease. `wooden_pickaxe` count increases by >= 1.
*   **Fake-Progress Rejection**: Reject if crafting table is missing or out of range. Enforce 3x3 table check (requires passing `tableBlock`).
*   **Vanilla Mapping**: Station crafting of wooden pickaxe (3x3 grid).

### 6. `mineCobblestone`
*   **Primitives Used**: `observe`, `mine_block`, `wait`
*   **Mineflayer APIs**:
    *   `bot.findBlocks` (finds stone block within 12 blocks, Y >= bot Y).
    *   `bot.equip(pickaxe, "hand")`.
    *   `bot.dig(stoneBlock, true)`.
    *   `bot.nearestEntity` / `bot.pathfinder.goto` (navigates to drop coordinates).
*   **Verification Contract**: Target stone block replaced by `air`. `cobblestone` inventory count increases.
*   **Fake-Progress Rejection**:
    *   *No-Tool Check*: Reject if pickaxe is not equipped in hand (mining stone with hand drops nothing).
    *   *Ambient Pickup*: Verifier tracks block removal + local delta to reject stone picked up from teammate drops.
    *   *Y-Level Mine Guard*: Prevents bot from digging block directly beneath it (falling risk) or unreachable deep blocks.
*   **Vanilla Mapping**: Mining stone with pickaxe to get cobblestone.

### 7. `inspectSharedChest`
*   **Primitives Used**: `observe`, `inspect_chest`, `wait`
*   **Mineflayer APIs**:
    *   `bot.findBlock` (finds chest within 12 blocks).
    *   `bot.pathfinder.goto(GoalNear)`.
    *   `bot.openContainer(chestBlock)`.
    *   `chest.containerItems()` (snapshots contents).
    *   `chest.close()`.
*   **Verification Contract**: Chest window opens, contents snapshot is cloned/returned, and the ledger records the transaction.
*   **Fake-Progress Rejection**:
    *   *Window Handle Leak*: To prevent leaving the chest open (which blocks other bots), interactions are wrapped in a `finally` block to call `chest.close()`:
        ```typescript
        let chest;
        try {
          chest = await bot.openContainer(block);
          // perform inspection
        } finally {
          if (chest) chest.close();
        }
        ```
*   **Vanilla Mapping**: Viewing chest inventory.

### 8. `depositSharedItems`
*   **Primitives Used**: `observe`, `inspect_chest`, `deposit_shared`, `wait`
*   **Mineflayer APIs**: Container open/close APIs, plus `chest.deposit(itemId, metadata, count)`.
*   **Verification Contract**: Bot's inventory count for the item decreases; chest item ledger counts increase.
*   **Fake-Progress Rejection**:
    *   *Reserve Protection*: The verifier checks personal reserve limits (`readKeepItemCount`) to prevent the bot from depositing essential tools or items needed for its own survival role.
    *   *Zero-Deposit Fault*: Reject if no items were moved, preventing empty ledger writes.
*   **Vanilla Mapping**: Storing items in a chest.

### 9. `approachAndRequestItem`
*   **Primitives Used**: `observe`, `move_to`, `say`, `wait`
*   **Mineflayer APIs**:
    *   `bot.pathfinder.goto(GoalNear)`.
    *   `dialogueState.requestTalk` / `peek` (checks target availability).
    *   `bot.chat()`.
*   **Verification Contract**: Bot arrives within 1.5 blocks of target teammate. Proximity chat message is sent.
*   **Fake-Progress Rejection**: Reject if teammate is busy/unavailable (dialogue state checks prevent sending messages to occupied NPCs). Pathfinder times out after 10 seconds if blocked.
*   **Vanilla Mapping**: Direct interaction and cooperative request.

### 10. `announceResourceDiscovery`
*   **Primitives Used**: `observe`, `say`, `remember`
*   **Mineflayer APIs**: `bot.chat()`, `memory.add()`.
*   **Verification Contract**: Broadcasts vein coordinates in chat. Note is saved to the bot's memory store.
*   **Fake-Progress Rejection**: Reject if coordinates are not persisted in memory or if duplicate locations are broadcasted within 60 seconds.
*   **Vanilla Mapping**: Coordinates communication.

### 11. `handoffItemAtChest`
*   **Primitives Used**: `observe`, `inspect_chest`, `deposit_shared`, `say`, `wait`
*   **Mineflayer APIs**: Combined Chest and Chat APIs.
*   **Verification Contract**: Item is successfully deposited in chest, chest closed, and directed chat confirming handoff is delivered.
*   **Fake-Progress Rejection**: Reject if chat is delivered before chest deposit transaction successfully completes.
*   **Vanilla Mapping**: Leaving items in chest for a teammate.

### 12. `waitForBusyCrafter`
*   **Primitives Used**: `observe`, `wait`, `say`
*   **Mineflayer APIs**: `dialogueState.requestTalk` (returns `"busy"`), `delay(ms)`.
*   **Verification Contract**: Talk request logged as `"busy"`, delay completes, follow-up request verifies release.
*   **Fake-Progress Rejection**: Enforce a minimum delay duration (ticks) to prevent tight-loop CPU spinning.
*   **Vanilla Mapping**: Standing by while teammate finishes using a crafting table.
