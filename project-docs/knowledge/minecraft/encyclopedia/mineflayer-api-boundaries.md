# Mineflayer & Pathfinder API Boundaries

This document details the signatures, parameters, return types, emitted events, and verification patterns for the 10 target Mineflayer (v4.37.1) and mineflayer-pathfinder (v2.4.5) methods.

---

## 🔍 API Detailed Technical Reference

### 1. `bot.dig(block, [forceLook], [raycast])`
*   **Signature**: `bot.dig(block: Block, forceLook?: boolean | "ignore" | "raycast", raycast?: boolean | "ignore"): Promise<void>`
*   **Key Parameters**:
    *   `block`: The `Block` instance in the world (must be a valid block object). *Warning*: Passing coordinates directly instead of a Block object causes crashes because Mineflayer needs to query `.digTime()` on the block.
    *   `forceLook`: Defaults to `true`. Turns the bot to face the block before mining.
    *   `raycast`: Defaults to `true`. Checks for line-of-sight visibility.
*   **Events Emitted**: `'diggingStarted'`, `'diggingCompleted'`, `'diggingAborted'`.
*   **Verification & Anti-Fake**:
    *   **Success**: Await the promise, verify block state at position updates to `air` (`bot.blockAt(pos)?.name === 'air'`), and check that inventory count increases.
    *   **Anti-Fake**: Digging is atomic. If the bot stops digging, takes damage, or moves, the server resets the break animation completely. Never query progress mid-dig, as that resets block-breaking animation.

### 2. `bot.craft(recipe, [count], [craftingTable])`
*   **Signature**: `bot.craft(recipe: Recipe, count?: number, craftingTable?: Block): Promise<void>`
*   **Key Parameters**:
    *   `recipe`: A recipe object (typically returned by `bot.recipesFor`).
    *   `count`: Number of times to craft the recipe (defaults to `1`).
    *   `craftingTable`: Block instance of the table. *Must* be provided for 3x3 grid recipes. Passing `null` limits crafting to 2x2 inventory grids.
*   **Events Emitted**: Triggers `'windowOpen'` internally.
*   **Verification & Anti-Fake**:
    *   **Success**: Await promise, and check that the inventory count of the product item increases.
    *   **Anti-Fake**: A promise resolution does not guarantee that items were added due to potential lag or inventory full conditions on the server. Always check inventory count delta.

### 3. `bot.openContainer(containerBlockOrEntity)`
*   **Signature**: `bot.openContainer(containerBlockOrEntity: Block | Entity): Promise<Container>`
*   **Return Type**: `Promise<Container>` (extends `Window` class).
*   **Events Emitted**: `'windowOpen'` on the bot. Sets `bot.currentWindow`.
*   **Verification & Anti-Fake**:
    *   **Success**: Resolves to a `Container` instance; `container.containerItems()` retrieves contents.
    *   **Anti-Fake**: Keeping container windows open blocks other bots from opening them, and locks the bot's own inventory transactions. Wrap all container transactions in a `finally` block to call `container.close()`.

### 4. `bot.openFurnace(furnaceBlock)`
*   **Signature**: `bot.openFurnace(furnaceBlock: Block): Promise<Furnace>`
*   **Return Type**: `Promise<Furnace>` (extends `Window`).
*   **Events Emitted**: `'update'` (fired on the Furnace instance when cooking progress or fuel levels change).
*   **Verification & Anti-Fake**:
    *   **Success**: Furnace object exposes `furnace.inputItem()`, `furnace.fuelItem()`, and `furnace.outputItem()`.
    *   **Anti-Fake**: Smelting takes 10 seconds. Do not block the runtime loop waiting with the furnace window open. Put the items, close the furnace, and return after 10s.

### 5. `bot.equip(item, destination)`
*   **Signature**: `bot.equip(item: Item, destination: "hand" | "off-hand" | "head" | "torso" | "legs" | "feet"): Promise<void>`
*   **Key Parameters**:
    *   `item`: Item instance from the bot's inventory.
    *   `destination`: Body part where the item is placed.
*   **Verification & Anti-Fake**:
    *   **Success**: Check that `bot.heldItem` (for `"hand"`) or the target armor slot matches the item properties.
    *   **Anti-Fake**: If the hand is full or the item is missing, the promise rejects. Do not assume tool is equipped without cross-checking the slot state.

### 6. `bot.consume()`
*   **Signature**: `bot.consume(): Promise<void>`
*   **Verification & Anti-Fake**:
    *   **Success**: Hunger level `bot.food` increases, and inventory food count decreases.
    *   **Anti-Fake**: Consumption requires **1.6 seconds (32 ticks)**. The action is easily cancelled if the bot moves, takes damage, or attacks. If interrupted, the promise rejects. Enforce that the bot stands still while eating.

### 7. `bot.placeBlock(referenceBlock, faceVector)`
*   **Signature**: `bot.placeBlock(referenceBlock: Block, faceVector: Vec3): Promise<void>`
*   **Key Parameters**:
    *   `referenceBlock`: The adjacent block against which the new block is placed.
    *   `faceVector`: Face of the reference block clicked (e.g. `(0, 1, 0)` for top).
*   **Events Emitted**: `'blockUpdate'`.
*   **Verification & Anti-Fake**:
    *   **Success**: Verify block at coordinates changes to the placed block type.
    *   **Anti-Fake**: `bot.placeBlock` can hang indefinitely under network desync or illegal placements. Wrap in a race-timeout wrapper:
        ```typescript
        await Promise.race([
          bot.placeBlock(refBlock, face),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Placement Timeout")), 5000))
        ]);
        ```

### 8. `bot.attack(entity, [swing])`
*   **Signature**: `bot.attack(entity: Entity, swing?: boolean): void` *(Synchronous)*
*   **Events Emitted**: `'entityHurt'` on the target, `'swing'` on the bot.
*   **Verification & Anti-Fake**:
    *   **Success**: Watch for `'entityHurt'` event where the attacker is the bot, or verify the entity's health/armor metadata decreases.
    *   **Anti-Fake**: Arm swing animation occurs even if the target is out of range or attack cooldown is active. Ensure target entity is within **3 blocks** distance before calling `bot.attack`.

### 9. `bot.waitForTicks(ticks)`
*   **Signature**: `bot.waitForTicks(ticks: number): Promise<void>`
*   **Verification & Anti-Fake**:
    *   **Success**: Bounded physical delay finishes.
    *   **Anti-Fake**: If physics are disabled (bot is dead, disconnected, or riding), the promise will hang. Always wrap in a safety `setTimeout` fallback.

### 10. `bot.pathfinder.goto(goal)`
*   **Signature**: `bot.pathfinder.goto(goal: Goal): Promise<void>`
*   **Events Emitted**: `'goal_reached'`, `'path_update'`.
*   **Verification & Anti-Fake**:
    *   **Success**: Verify physical distance delta to destination (`bot.entity.position.distanceTo(targetCoords)`).
    *   **Anti-Fake**: Bots can get stuck grinding against corners or blocks. Always track position coordinate updates over time, and call `bot.pathfinder.stop()` if the bot does not make progress.
