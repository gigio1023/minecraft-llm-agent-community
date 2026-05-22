import { goals } from "mineflayer-pathfinder";

const LOG_BLOCK_NAMES = [
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log"
] as const;

type Positioned = { x: number; y: number; z: number };

type MiningBot = {
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
  }): { name: string; position: Positioned } | null;
  canDigBlock?(block: { name: string; position: Positioned }): boolean;
  dig(block: { name: string; position: Positioned }, forceLook?: boolean | "ignore" | "raycast"): Promise<void>;
  nearestEntity?(predicate: (entity: { name?: string; position: Positioned }) => boolean): { name?: string; position: Positioned } | null;
  blockAt?(position: Positioned): { name: string; position?: Positioned } | null;
  stopDigging?(): void;
  lookAt(target: Positioned, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
  equip?(item: any, destination: any): Promise<void>;
};

type CollectLogsResult = {
  status: "collected" | "progressing" | "blocked";
  block?: string;
  target?: Positioned;
  attemptedBlocks?: Array<{
    block: string;
    position: Positioned;
    outcome: "dug" | "path_blocked" | "dig_blocked";
    reason?: string;
  }>;
  beforeLogCount?: number;
  afterLogCount?: number;
  inventoryDelta?: number;
  blockRemoved?: boolean;
  reason: string;
};

const AXE_ITEM_NAMES = [
  "wooden_axe",
  "stone_axe",
  "iron_axe",
  "golden_axe",
  "diamond_axe",
  "netherite_axe"
] as const;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Best-effort axe equip before digging. Faster dig time is a meaningful live
 * difference, but missing an axe must not block the action entirely.
 */
async function equipAxeIfAvailable(bot: MiningBot): Promise<boolean> {
  if (!bot.equip || !bot.inventory) {
    return false;
  }

  const items = bot.inventory.items();
  const axe = items.find((item) =>
    AXE_ITEM_NAMES.includes(item.name as (typeof AXE_ITEM_NAMES)[number])
  );

  if (!axe) {
    return false;
  }

  try {
    await bot.equip(axe, "hand");
    return true;
  } catch {
    return false;
  }
}

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function horizontalDistance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function stopMovement(bot: MiningBot) {
  // Cancellation can happen while pathfinder, digging, or manual controls are
  // active. Clear all movement-like state so the next action starts from a
  // known stopped boundary instead of inheriting motion from this primitive.
  bot.pathfinder?.stop?.();
  bot.stopDigging?.();

  for (const control of ["forward", "back", "left", "right", "jump", "sprint", "sneak"]) {
    bot.setControlState(control, false);
  }
}

function abortError() {
  return new Error("collect_logs was cancelled before the action completed");
}

async function runAbortable<T>(
  bot: MiningBot,
  signal: AbortSignal | undefined,
  action: Promise<T>
) {
  if (!signal) {
    return action;
  }

  if (signal.aborted) {
    stopMovement(bot);
    throw abortError();
  }

  let abortHandler: (() => void) | undefined;
  const aborted = new Promise<never>((_, reject) => {
    abortHandler = () => {
      // The runtime treats abort as a session boundary, not just a rejected
      // promise. Mineflayer may otherwise keep walking or digging after the
      // orchestration loop has moved on.
      stopMovement(bot);
      reject(abortError());
    };
    signal.addEventListener("abort", abortHandler, { once: true });
  });

  try {
    return await Promise.race([action, aborted]);
  } finally {
    if (abortHandler) {
      signal.removeEventListener("abort", abortHandler);
    }
  }
}

async function moveNear(
  bot: MiningBot,
  position: Positioned,
  signal?: AbortSignal,
  range = 2
) {
  if (bot.pathfinder) {
    // Pathfinder is the preferred movement boundary because it owns collision
    // and route retries. The manual fallback below is only a short nudge for
    // stripped-down test doubles or runtimes without the plugin installed.
    await runAbortable(
      bot,
      signal,
      bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, range))
    );
    return;
  }

  await runAbortable(bot, signal, bot.lookAt(position, true));
  bot.setControlState("forward", true);

  try {
    await runAbortable(bot, signal, delay(800));
  } finally {
    bot.setControlState("forward", false);
  }
}

function isLogName(name: string) {
  return LOG_BLOCK_NAMES.includes(name as (typeof LOG_BLOCK_NAMES)[number]);
}

function countInventoryLogs(bot: MiningBot) {
  if (!bot.inventory) {
    return undefined;
  }

  return bot.inventory
    .items()
    .filter((item) => isLogName(item.name))
    .reduce((sum, item) => sum + item.count, 0);
}

async function waitForLogInventoryIncrease(
  bot: MiningBot,
  beforeLogCount: number | undefined,
  signal?: AbortSignal,
  waitMs = 2_500
) {
  if (beforeLogCount === undefined) {
    return undefined;
  }

  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    const current = countInventoryLogs(bot);
    if (current !== undefined && current > beforeLogCount) {
      return current;
    }

    await runAbortable(bot, signal, delay(150));
  }

  return countInventoryLogs(bot);
}

async function moveToNearbyDrop(
  bot: MiningBot,
  blockPosition: Positioned,
  signal?: AbortSignal
) {
  const deadline = Date.now() + 2_000;

  while (Date.now() < deadline) {
    const droppedItem = bot.nearestEntity?.((entity) => entity.name === "item");

    if (
      droppedItem &&
      distance(bot.entity.position, droppedItem.position) <= 8 &&
      distance(blockPosition, droppedItem.position) <= 5
    ) {
      await moveNear(bot, droppedItem.position, signal, 1);
      return true;
    }

    await runAbortable(bot, signal, delay(150));
  }

  try {
    // Some protocol versions expose the dropped item entity later than the
    // block break itself. Walk back onto the broken block as a deterministic
    // pickup fallback instead of declaring failure from missing entity metadata.
    await moveNear(bot, blockPosition, signal, 1);
    return true;
  } catch {
    return false;
  }
}

async function waitAfterPickupMove(
  bot: MiningBot,
  beforeLogCount: number | undefined,
  signal: AbortSignal | undefined,
  pickupWaitMs: number
) {
  const afterPickupMove = await waitForLogInventoryIncrease(
    bot,
    beforeLogCount,
    signal,
    pickupWaitMs
  );

  if (
    beforeLogCount !== undefined &&
    afterPickupMove !== undefined &&
    afterPickupMove > beforeLogCount
  ) {
    return afterPickupMove;
  }

  // Minecraft pickup can lag one short tick behind pathfinder arrival on a busy
  // local server. Give that final pickup tick a bounded chance before failing.
  return waitForLogInventoryIncrease(bot, beforeLogCount, signal, 1_000);
}

async function tryPickupLogDrop(input: {
  bot: MiningBot;
  blockPosition: Positioned;
  beforeLogCount: number | undefined;
  signal?: AbortSignal;
  pickupWaitMs: number;
}) {
  await moveToNearbyDrop(input.bot, input.blockPosition, input.signal);
  return waitAfterPickupMove(
    input.bot,
    input.beforeLogCount,
    input.signal,
    input.pickupWaitMs
  );
}

async function digLogBlockToBreak(
  bot: MiningBot,
  block: { name: string; position: Positioned },
  signal?: AbortSignal
) {
  // Mineflayer digging is an uninterrupted action: checking progress by
  // stopping and restarting would reset the block-break animation. Await the
  // single dig promise, then inspect pickup evidence after the block break has
  // either completed or failed.
  await runAbortable(bot, signal, bot.dig(block, true));
}

function findReachableLogs(bot: MiningBot) {
  const origin = bot.entity.position;
  // findBlocks gives a small candidate set that can be filtered by height and
  // distance. findBlock is kept as a compatibility fallback for narrower bot
  // doubles, but it should not be the only evidence path in live runs.
  const fromBlocks = bot.findBlocks?.({
    matching: (candidate) => isLogName(candidate.name),
    maxDistance: 12,
    count: 16
  })
    .map((position) => {
      const block = bot.blockAt?.(position);
      // Preserve the full Mineflayer Block object. bot.dig needs methods such
      // as digTime(); reducing the block to {name, position} creates a live-only
      // failure that unit doubles will not catch.
      return block && isLogName(block.name) ? block : null;
    })
    .filter((entry): entry is { name: string; position: Positioned } => entry !== null) ?? [];
  const candidates = fromBlocks.length > 0
    ? fromBlocks
    : bot.findBlock
      ? [
          bot.findBlock({
            matching: (candidate) => isLogName(candidate.name),
            maxDistance: 12
          })
        ].filter((entry): entry is { name: string; position: Positioned } => entry !== null)
      : [];

  return candidates
    // Low logs are intentional: early probes should not "succeed" by selecting
    // canopy blocks that Mineflayer can see but cannot reliably reach or dig.
    .filter((candidate) => Math.abs(candidate.position.y - origin.y) <= 3)
    .sort((left, right) => {
      const leftDistance = horizontalDistance(origin, left.position);
      const rightDistance = horizontalDistance(origin, right.position);

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.position.y - right.position.y;
    });
}

function uniqueCandidateKey(candidate: { position: Positioned }) {
  return `${Math.floor(candidate.position.x)}:${Math.floor(candidate.position.y)}:${Math.floor(candidate.position.z)}`;
}

const DEFAULT_PICKUP_WAIT_MS = 5_000;

export async function collectLogs({
  bot,
  signal,
  targetCount,
  pickupWaitMs = DEFAULT_PICKUP_WAIT_MS
}: {
  bot: MiningBot;
  signal?: AbortSignal;
  targetCount?: number;
  /** Maximum ms to wait for dropped item pickup after a dig. */
  pickupWaitMs?: number;
}): Promise<CollectLogsResult> {
  const beforeLogCount = countInventoryLogs(bot);
  const targetLogCount =
    typeof targetCount === "number" && Number.isFinite(targetCount) && targetCount > 0
      ? Math.floor(targetCount)
      : beforeLogCount !== undefined
        ? beforeLogCount + 1
        : undefined;
  let afterLogCount = beforeLogCount;
  let lastBlock: { name: string; position: Positioned } | null = null;
  let lastBlockRemoved: boolean | undefined;
  const attemptedBlocks: NonNullable<CollectLogsResult["attemptedBlocks"]> = [];
  const exhaustedCandidates = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (
      targetLogCount !== undefined &&
      afterLogCount !== undefined &&
      afterLogCount >= targetLogCount
    ) {
      break;
    }

    const block = findReachableLogs(bot).find(
      (candidate) => !exhaustedCandidates.has(uniqueCandidateKey(candidate))
    );

    if (!block) {
      const inventoryDelta =
        beforeLogCount !== undefined && afterLogCount !== undefined
          ? afterLogCount - beforeLogCount
          : undefined;
      const dugWithoutPickup =
        attemptedBlocks.some((attemptedBlock) => attemptedBlock.outcome === "dug") &&
        inventoryDelta !== undefined &&
        inventoryDelta <= 0;

      return {
        status: "blocked",
        block: lastBlock?.name,
        target: lastBlock?.position,
        attemptedBlocks,
        beforeLogCount,
        afterLogCount,
        inventoryDelta,
        blockRemoved: lastBlockRemoved,
        reason: dugWithoutPickup
          ? "collect_logs dug a log, but log inventory did not increase."
          : "collect_logs found no reachable low log block within 12 blocks."
      };
    }

    lastBlock = block;
    const candidateKey = uniqueCandidateKey(block);

    const beforeMoveDistance = distance(bot.entity.position, block.position);
    try {
      await moveNear(bot, block.position, signal, 2);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      exhaustedCandidates.add(candidateKey);
      attemptedBlocks.push({
        block: block.name,
        position: block.position,
        outcome: "path_blocked",
        reason: error instanceof Error ? error.message : String(error)
      });
      continue;
    }

    const afterMoveDistance = distance(bot.entity.position, block.position);

    if (afterMoveDistance > beforeMoveDistance + 1 || afterMoveDistance > 5) {
      // A dig after movement drift would create misleading transcript evidence:
      // the bot "attempted" work but was physically farther from the target.
      stopMovement(bot);

      return {
        status: "blocked",
        block: block.name,
        target: block.position,
        attemptedBlocks,
        beforeLogCount,
        afterLogCount,
        inventoryDelta:
          beforeLogCount !== undefined && afterLogCount !== undefined
            ? afterLogCount - beforeLogCount
            : undefined,
        blockRemoved: lastBlockRemoved,
        reason: `collect_logs movement drifted away from ${block.name} (${beforeMoveDistance.toFixed(2)} -> ${afterMoveDistance.toFixed(2)} blocks).`
      };
    }

    const attemptBeforeLogCount = afterLogCount;
    try {
      await equipAxeIfAvailable(bot);
      await digLogBlockToBreak(bot, block, signal);
      attemptedBlocks.push({
        block: block.name,
        position: block.position,
        outcome: "dug"
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      exhaustedCandidates.add(candidateKey);
      attemptedBlocks.push({
        block: block.name,
        position: block.position,
        outcome: "dig_blocked",
        reason: error instanceof Error ? error.message : String(error)
      });
      continue;
    }

    const countImmediatelyAfterDig = countInventoryLogs(bot);

    if (
      attemptBeforeLogCount !== undefined &&
      countImmediatelyAfterDig !== undefined &&
      countImmediatelyAfterDig > attemptBeforeLogCount
    ) {
      afterLogCount = countImmediatelyAfterDig;
    } else {
      afterLogCount = await tryPickupLogDrop({
        bot,
        blockPosition: block.position,
        beforeLogCount: afterLogCount,
        signal,
        pickupWaitMs
      });
    }

    const blockAfter = bot.blockAt?.(block.position);
    lastBlockRemoved = blockAfter ? !isLogName(blockAfter.name) : undefined;

    if (
      attemptBeforeLogCount !== undefined &&
      afterLogCount !== undefined &&
      afterLogCount <= attemptBeforeLogCount
    ) {
      const totalInventoryDelta =
        beforeLogCount !== undefined ? afterLogCount - beforeLogCount : undefined;

      if (totalInventoryDelta !== undefined && totalInventoryDelta > 0) {
        return {
          status: "progressing",
          block: block.name,
          target: block.position,
          attemptedBlocks,
          beforeLogCount,
          afterLogCount,
          inventoryDelta: totalInventoryDelta,
          blockRemoved: lastBlockRemoved,
          reason: `collect_logs increased log inventory by ${totalInventoryDelta}, but a later pickup did not increase inventory.`
        };
      }

      // A single pickup miss is not enough to end the whole action skill when
      // other nearby log candidates still exist. Keep success strict
      // (inventory delta required), but continue through the bounded candidate
      // set so one bad drop/pickup timing does not become fake task failure.
      exhaustedCandidates.add(candidateKey);
      continue;
    }
  }

  const inventoryDelta =
    beforeLogCount !== undefined && afterLogCount !== undefined
      ? afterLogCount - beforeLogCount
      : undefined;

  if (
    inventoryDelta !== undefined &&
    inventoryDelta > 0 &&
    (targetLogCount === undefined || (afterLogCount ?? 0) >= targetLogCount)
  ) {
    return {
      status: "collected",
      block: lastBlock?.name,
      target: lastBlock?.position,
      attemptedBlocks,
      beforeLogCount,
      afterLogCount,
      inventoryDelta,
      blockRemoved: lastBlockRemoved,
      reason: `collect_logs increased log inventory by ${inventoryDelta}.`
    };
  }

  if (inventoryDelta !== undefined && inventoryDelta > 0) {
    return {
      status: "progressing",
      block: lastBlock?.name,
      target: lastBlock?.position,
      attemptedBlocks,
      beforeLogCount,
      afterLogCount,
      inventoryDelta,
      blockRemoved: lastBlockRemoved,
      reason: `collect_logs increased log inventory by ${inventoryDelta}, but target is ${targetLogCount}.`
    };
  }

  if (inventoryDelta === undefined && lastBlockRemoved === undefined) {
    return {
      status: "blocked",
      block: lastBlock?.name,
      target: lastBlock?.position,
      attemptedBlocks,
      beforeLogCount,
      afterLogCount,
      reason: "collect_logs dug a log, but inventory evidence was unavailable."
    };
  }

  return {
    status: "blocked",
    block: lastBlock?.name,
    target: lastBlock?.position,
    attemptedBlocks,
    beforeLogCount,
    afterLogCount,
    inventoryDelta,
    blockRemoved: lastBlockRemoved,
    reason: "collect_logs dug a log, but log inventory did not increase."
  };
}
