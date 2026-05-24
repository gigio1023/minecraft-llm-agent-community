import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

type Positioned = { x: number; y: number; z: number };
type MineflayerBlockLike = {
  name: string;
  position: Positioned;
};

type MineBlockBot = {
  entity: {
    position: Positioned;
  };
  inventory?: {
    items(): Array<{ name: string; count: number }>;
  };
  pathfinder?: {
    goto(goal: unknown): Promise<void>;
    stop?(): void;
  };
  findBlocks?(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
    count: number;
  }): Positioned[];
  findBlock?(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
  }): MineflayerBlockLike | null;
  blockAt?(position: Positioned): MineflayerBlockLike | null;
  canDigBlock?(block: MineflayerBlockLike): boolean;
  dig(block: MineflayerBlockLike, forceLook?: boolean | "ignore" | "raycast"): Promise<void>;
  nearestEntity?(predicate: (entity: { name?: string; position: Positioned }) => boolean): { name?: string; position: Positioned } | null;
  lookAt?(target: Positioned, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
  stopDigging?(): void;
  equip?(item: unknown, destination: unknown): Promise<void>;
};

export type MineBlockResult = {
  status: "mined" | "progressing" | "blocked";
  blockName: string;
  itemName: string;
  target?: Positioned;
  attemptedBlocks: Array<{
    block: string;
    position: Positioned;
    outcome: "dug" | "path_blocked" | "dig_blocked";
    reason?: string;
  }>;
  beforeCount?: number;
  afterCount?: number;
  inventoryDelta?: number;
  blockRemoved?: boolean;
  equippedTool?: string;
  reason: string;
};

const PICKAXE_ITEM_NAMES = [
  "wooden_pickaxe",
  "stone_pickaxe",
  "iron_pickaxe",
  "golden_pickaxe",
  "diamond_pickaxe",
  "netherite_pickaxe"
] as const;

const BLOCK_DROPS: Record<string, string> = {
  stone: "cobblestone",
  coal_ore: "coal",
  deepslate_coal_ore: "coal"
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function countInventoryItem(bot: MineBlockBot, itemName: string) {
  if (!bot.inventory) {
    return undefined;
  }

  return bot.inventory
    .items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

function stopMovement(bot: MineBlockBot) {
  bot.pathfinder?.stop?.();
  bot.stopDigging?.();

  for (const control of ["forward", "back", "left", "right", "jump", "sprint", "sneak"]) {
    bot.setControlState(control, false);
  }
}

async function runPathfinderGoto(input: {
  bot: MineBlockBot;
  goal: unknown;
  signal: AbortSignal | undefined;
  timeoutMs: number;
  abortMessage: string;
  timeoutMessage: string;
}) {
  if (!input.bot.pathfinder) {
    return;
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const gotoPromise = input.bot.pathfinder.goto(input.goal);
  gotoPromise.catch(() => {
    // A timeout or abort path owns the returned error. Pathfinder may reject
    // later after `stop()`, and that late rejection must not mask the evidence.
  });

  try {
    await Promise.race([
      gotoPromise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          input.bot.pathfinder?.stop?.();
          reject(new Error(input.timeoutMessage));
        }, input.timeoutMs);

        if (input.signal) {
          onAbort = () => {
            input.bot.pathfinder?.stop?.();
            reject(new Error(input.abortMessage));
          };
          input.signal.addEventListener("abort", onAbort, { once: true });
        }
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
    if (onAbort) {
      input.signal?.removeEventListener("abort", onAbort);
    }
  }
}

async function equipPickaxeIfAvailable(bot: MineBlockBot) {
  if (!bot.equip || !bot.inventory) {
    return undefined;
  }

  const pickaxe = bot.inventory.items().find((item) =>
    PICKAXE_ITEM_NAMES.includes(item.name as (typeof PICKAXE_ITEM_NAMES)[number])
  );

  if (!pickaxe) {
    return undefined;
  }

  await bot.equip(pickaxe, "hand");
  return pickaxe.name;
}

function findCandidateBlocks(bot: MineBlockBot, blockName: string, searchDistance: number) {
  const minimumY = Math.floor(bot.entity.position.y) - 16;
  const fromBlocks = bot.findBlocks?.({
    matching: (block) => block.name === blockName,
    maxDistance: searchDistance,
    count: 192
  })
    .map((position) => {
      const block = bot.blockAt?.(position);
      return block?.name === blockName && block.position.y >= minimumY
        ? block
        : null;
    })
    .filter((entry): entry is MineflayerBlockLike => entry !== null) ?? [];

  if (fromBlocks.length > 0) {
    return fromBlocks.sort((left, right) =>
      distance(bot.entity.position, left.position) - distance(bot.entity.position, right.position)
    );
  }

  const block = bot.findBlock?.({
    matching: (candidate) => candidate.name === blockName,
    maxDistance: searchDistance
  });

  return block && block.position.y >= minimumY ? [block] : [];
}

async function waitForInventoryIncrease(
  bot: MineBlockBot,
  itemName: string,
  beforeCount: number | undefined,
  signal: AbortSignal | undefined,
  timeoutMs: number
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new Error("mine_block was cancelled before inventory evidence settled");
    }

    const current = countInventoryItem(bot, itemName);
    if (beforeCount !== undefined && current !== undefined && current > beforeCount) {
      return current;
    }

    await delay(100);
  }

  return countInventoryItem(bot, itemName);
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new Error("mine_block was cancelled before the action completed");
  }
}

async function moveToBlock(
  bot: MineBlockBot,
  position: Positioned,
  signal: AbortSignal | undefined,
  timeoutMs: number
) {
  throwIfAborted(signal);

  if (distance(bot.entity.position, position) <= 4.5) {
    await bot.lookAt?.(new Vec3(position.x + 0.5, position.y + 0.5, position.z + 0.5), true);
    return;
  }

  if (bot.pathfinder) {
    await runPathfinderGoto({
      bot,
      goal: new goals.GoalNear(position.x, position.y, position.z, 2),
      signal,
      timeoutMs,
      abortMessage: "mine_block was cancelled while pathing",
      timeoutMessage: "mine_block pathfinder timeout while moving to block"
    });
    return;
  }

  await bot.lookAt?.(new Vec3(position.x + 0.5, position.y + 0.5, position.z + 0.5), true);
}

async function moveNearPickup(
  bot: MineBlockBot,
  position: Positioned,
  signal: AbortSignal | undefined,
  timeoutMs: number
) {
  throwIfAborted(signal);

  if (distance(bot.entity.position, position) <= 1.25) {
    return;
  }

  if (bot.pathfinder) {
    await runPathfinderGoto({
      bot,
      goal: new goals.GoalNear(position.x, position.y, position.z, 1),
      signal,
      timeoutMs,
      abortMessage: "mine_block was cancelled while moving to the mined drop",
      timeoutMessage: "mine_block pathfinder timeout while moving to the mined drop"
    });
    return;
  }

  await bot.lookAt?.(new Vec3(position.x + 0.5, position.y + 0.5, position.z + 0.5), true);
}

/**
 * Mines a nearby block and verifies the expected drop entered inventory.
 *
 * The first live contract uses `stone -> cobblestone`. Other block/drop pairs
 * can reuse this boundary later, but they must add their own fixture and
 * postcondition proof before being treated as implemented action skills.
 */
export async function mineBlock({
  bot,
  blockName,
  itemName = BLOCK_DROPS[blockName],
  targetCount = 1,
  signal,
  pickupWaitMs = 1_500,
  moveToBlockTimeoutMs = 6_000,
  pickupMoveTimeoutMs = 3_000,
  searchDistance = 24
}: {
  bot: MineBlockBot;
  blockName: string;
  itemName?: string;
  targetCount?: number;
  signal?: AbortSignal;
  pickupWaitMs?: number;
  moveToBlockTimeoutMs?: number;
  pickupMoveTimeoutMs?: number;
  searchDistance?: number;
}): Promise<MineBlockResult> {
  if (!itemName) {
    throw new Error(`mine_block has no expected drop mapping for ${blockName}`);
  }

  const beforeCount = countInventoryItem(bot, itemName);
  const attemptedBlocks: MineBlockResult["attemptedBlocks"] = [];
  const equippedTool = await equipPickaxeIfAvailable(bot);

  if (!equippedTool) {
    return {
      status: "blocked",
      blockName,
      itemName,
      attemptedBlocks,
      beforeCount,
      reason: `mine_block requires a pickaxe before mining ${blockName}`
    };
  }

  const targetTotal = beforeCount !== undefined
    ? Math.max(targetCount, beforeCount + 1)
    : targetCount;
  let afterCount = beforeCount;
  let lastBlockRemoved = false;
  const onAbort = () => {
    stopMovement(bot);
  };

  try {
    signal?.addEventListener("abort", onAbort, { once: true });
    for (const block of findCandidateBlocks(bot, blockName, searchDistance)) {
      throwIfAborted(signal);

      if (afterCount !== undefined && afterCount >= targetTotal) {
        break;
      }

      try {
        await moveToBlock(bot, block.position, signal, moveToBlockTimeoutMs);
      } catch (error) {
        attemptedBlocks.push({
          block: block.name,
          position: block.position,
          outcome: "path_blocked",
          reason: error instanceof Error ? error.message : String(error)
        });
        continue;
      }

      throwIfAborted(signal);

      const attemptBeforeCount = afterCount;
      try {
        if (bot.canDigBlock && !bot.canDigBlock(block)) {
          attemptedBlocks.push({
            block: block.name,
            position: block.position,
            outcome: "dig_blocked",
            reason: "canDigBlock returned false"
          });
          continue;
        }
        await bot.dig(block, true);
      } catch (error) {
        attemptedBlocks.push({
          block: block.name,
          position: block.position,
          outcome: "dig_blocked",
          reason: error instanceof Error ? error.message : String(error)
        });
        continue;
      }

      attemptedBlocks.push({
        block: block.name,
        position: block.position,
        outcome: "dug"
      });

      const afterBlock = bot.blockAt?.(block.position);
      lastBlockRemoved = afterBlock ? afterBlock.name !== block.name : true;
      afterCount = await waitForInventoryIncrease(bot, itemName, attemptBeforeCount, signal, pickupWaitMs);

      if (
        attemptBeforeCount !== undefined &&
        afterCount !== undefined &&
        afterCount <= attemptBeforeCount
      ) {
        const itemEntity = bot.nearestEntity?.((entity) =>
          entity.name === "item" && distance(entity.position, block.position) <= 4
        );

        try {
          await moveNearPickup(bot, itemEntity?.position ?? block.position, signal, pickupMoveTimeoutMs);
          afterCount = await waitForInventoryIncrease(bot, itemName, attemptBeforeCount, signal, 2_000);
        } catch (error) {
          if (signal?.aborted) {
            throw error;
          }
          const lastAttempt = attemptedBlocks.at(-1);
          if (lastAttempt?.outcome === "dug") {
            lastAttempt.reason = error instanceof Error ? error.message : String(error);
          }
          afterCount = countInventoryItem(bot, itemName);
        }
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
    stopMovement(bot);
  }

  const inventoryDelta =
    beforeCount !== undefined && afterCount !== undefined
      ? afterCount - beforeCount
      : undefined;

  if (afterCount !== undefined && afterCount >= targetTotal) {
    return {
      status: "mined",
      blockName,
      itemName,
      target: attemptedBlocks.find((attempt) => attempt.outcome === "dug")?.position,
      attemptedBlocks,
      beforeCount,
      afterCount,
      inventoryDelta,
      blockRemoved: lastBlockRemoved,
      equippedTool,
      reason: `mine_block increased ${itemName} inventory by ${inventoryDelta ?? "unknown"}.`
    };
  }

  if (inventoryDelta !== undefined && inventoryDelta > 0) {
    return {
      status: "progressing",
      blockName,
      itemName,
      target: attemptedBlocks.find((attempt) => attempt.outcome === "dug")?.position,
      attemptedBlocks,
      beforeCount,
      afterCount,
      inventoryDelta,
      blockRemoved: lastBlockRemoved,
      equippedTool,
      reason: `mine_block increased ${itemName} inventory by ${inventoryDelta}, but target is ${targetTotal}.`
    };
  }

  return {
    status: "blocked",
    blockName,
    itemName,
    target: attemptedBlocks.at(-1)?.position,
    attemptedBlocks,
    beforeCount,
    afterCount,
    inventoryDelta,
    blockRemoved: lastBlockRemoved,
    equippedTool,
    reason: attemptedBlocks.some((attempt) => attempt.outcome === "dug")
      ? `mine_block dug ${blockName}, but ${itemName} inventory did not increase.`
      : `mine_block found no reachable ${blockName} block within ${searchDistance} blocks.`
  };
}
