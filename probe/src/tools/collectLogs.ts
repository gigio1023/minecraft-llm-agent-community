import { goals } from "mineflayer-pathfinder";

export const LOG_BLOCK_NAMES = [
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log",
  "pale_oak_log"
] as const;

const COLLECT_LOG_SEARCH_RADIUS = 24;

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
  nearbyLogHints?: Array<{
    block: string;
    position: Positioned;
    distance: number;
    yDelta: number;
    direction: string;
    reachableLow: boolean;
  }>;
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
  action: Promise<T>,
  timeoutMs?: number
) {
  if (!signal && timeoutMs === undefined) {
    return action;
  }

  if (signal?.aborted) {
    stopMovement(bot);
    throw abortError();
  }

  let abortHandler: (() => void) | undefined;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  action.catch(() => {
    // Timeout/abort may already have returned a structured primitive failure.
    // Late Mineflayer rejection after stop() should not hide that evidence.
  });
  const aborted = new Promise<never>((_, reject) => {
    if (!signal) {
      return;
    }
    abortHandler = () => {
      // The runtime treats abort as a session boundary, not just a rejected
      // promise. Mineflayer may otherwise keep walking or digging after the
      // orchestration loop has moved on.
      stopMovement(bot);
      reject(abortError());
    };
    signal.addEventListener("abort", abortHandler, { once: true });
  });
  const timedOut = new Promise<never>((_, reject) => {
    if (timeoutMs === undefined) {
      return;
    }

    timeoutHandle = setTimeout(() => {
      stopMovement(bot);
      reject(new Error(`collect_logs timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([action, aborted, timedOut]);
  } finally {
    if (abortHandler) {
      signal?.removeEventListener("abort", abortHandler);
    }
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function moveNear(
  bot: MiningBot,
  position: Positioned,
  signal?: AbortSignal,
  range = 2
) {
  if (
    typeof (bot.entity.position as { distanceTo?: unknown }).distanceTo === "function" &&
    distance(bot.entity.position, position) <= Math.min(4.5, range + 2.5)
  ) {
    await runAbortable(bot, signal, bot.lookAt(position, true));
    return;
  }

  if (bot.pathfinder) {
    // Pathfinder is the preferred movement boundary because it owns collision
    // and route retries. The manual fallback below is only a short nudge for
    // stripped-down test doubles or runtimes without the plugin installed.
    await runAbortable(
      bot,
      signal,
      bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, range)),
      5_000
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

async function nudgeToward(
  bot: MiningBot,
  position: Positioned,
  signal?: AbortSignal,
  durationMs = 700
) {
  await runAbortable(bot, signal, bot.lookAt(position, true), 1_000);
  bot.setControlState("forward", true);

  try {
    await runAbortable(bot, signal, delay(durationMs), durationMs + 500);
  } finally {
    bot.setControlState("forward", false);
  }
}

async function moveOntoBlock(
  bot: MiningBot,
  position: Positioned,
  signal?: AbortSignal
) {
  if (!bot.pathfinder) {
    await nudgeToward(bot, position, signal, 900);
    return;
  }

  await runAbortable(
    bot,
    signal,
    bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z)),
    5_000
  );
}

export function isLogName(name: string) {
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
  signal?: AbortSignal,
  searchWaitMs = 2_000
) {
  const deadline = Date.now() + searchWaitMs;

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
  pickupWaitMs: number,
  finalGraceMs = 1_000
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
  return waitForLogInventoryIncrease(bot, beforeLogCount, signal, finalGraceMs);
}

async function tryPickupLogDrop(input: {
  bot: MiningBot;
  blockPosition: Positioned;
  beforeLogCount: number | undefined;
  signal?: AbortSignal;
  pickupWaitMs: number;
  searchWaitMs?: number;
  finalGraceMs?: number;
  nudgeMs?: number;
}) {
  try {
    await moveToNearbyDrop(input.bot, input.blockPosition, input.signal, input.searchWaitMs);
    await moveOntoBlock(input.bot, input.blockPosition, input.signal);
  } catch {
    // Pickup movement is best-effort after the atomic dig has completed. If
    // pathing to a transient item entity times out, still wait for inventory
    // evidence because the item may have been picked up during the failed move.
    stopMovement(input.bot);
  }
  const nudgeMs = input.nudgeMs ?? 500;
  if (nudgeMs > 0 && distance(input.bot.entity.position, input.blockPosition) <= 4) {
    await nudgeToward(input.bot, input.blockPosition, input.signal, nudgeMs);
  }
  return waitAfterPickupMove(
    input.bot,
    input.beforeLogCount,
    input.signal,
    input.pickupWaitMs,
    input.finalGraceMs
  );
}

async function sweepDugLogDrops(input: {
  bot: MiningBot;
  attemptedBlocks: NonNullable<CollectLogsResult["attemptedBlocks"]>;
  afterLogCount: number | undefined;
  targetLogCount: number | undefined;
  signal?: AbortSignal;
}) {
  let currentLogCount = input.afterLogCount;
  const dugPositions = input.attemptedBlocks
    .filter((attempt) => attempt.outcome === "dug")
    .map((attempt) => attempt.position)
    .reverse();

  for (const position of dugPositions) {
    if (
      currentLogCount !== undefined &&
      input.targetLogCount !== undefined &&
      currentLogCount >= input.targetLogCount
    ) {
      break;
    }

    currentLogCount = await tryPickupLogDrop({
      bot: input.bot,
      blockPosition: position,
      beforeLogCount: currentLogCount,
      signal: input.signal,
      pickupWaitMs: 150,
      searchWaitMs: 50,
      finalGraceMs: 50,
      nudgeMs: 0
    });
  }

  return currentLogCount;
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
  await runAbortable(bot, signal, bot.dig(block, true), 15_000);
}

function findReachableLogs(bot: MiningBot) {
  const origin = bot.entity.position;
  // findBlocks gives a small candidate set that can be filtered by height and
  // distance. findBlock is kept as a compatibility fallback for narrower bot
  // doubles, but it should not be the only evidence path in live runs.
  const fromBlocks = bot.findBlocks?.({
    matching: (candidate) => isLogName(candidate.name),
    maxDistance: COLLECT_LOG_SEARCH_RADIUS,
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
            maxDistance: COLLECT_LOG_SEARCH_RADIUS
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

function round(value: number) {
  return Number(value.toFixed(2));
}

function directionFrom(origin: Positioned, target: Positioned) {
  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  if (Math.abs(dx) >= Math.abs(dz)) {
    return dx >= 0 ? "east" : "west";
  }
  return dz >= 0 ? "south" : "north";
}

function scanNearbyLogHints(bot: MiningBot) {
  const origin = bot.entity.position;
  const positions = bot.findBlocks?.({
    matching: (candidate) => isLogName(candidate.name),
    maxDistance: 32,
    count: 24
  }) ?? [];

  const seen = new Set<string>();
  const hints = positions
    .map((position) => {
      const block = bot.blockAt?.(position);
      return block && isLogName(block.name) ? block : null;
    })
    .filter((entry): entry is { name: string; position: Positioned } => entry !== null)
    .filter((block) => {
      const key = uniqueCandidateKey(block);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((block) => ({
      block: block.name,
      position: block.position,
      distance: round(distance(origin, block.position)),
      yDelta: round(block.position.y - origin.y),
      direction: directionFrom(origin, block.position),
      reachableLow: Math.abs(block.position.y - origin.y) <= 3
    }))
    .sort((left, right) => left.distance - right.distance);

  return hints.slice(0, 8);
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
      const targetNotMetAfterProgress =
        inventoryDelta !== undefined &&
        inventoryDelta > 0 &&
        targetLogCount !== undefined &&
        (afterLogCount ?? 0) < targetLogCount;

      if (targetNotMetAfterProgress) {
        afterLogCount = await sweepDugLogDrops({
          bot,
          attemptedBlocks,
          afterLogCount,
          targetLogCount,
          signal
        });

        const settledInventoryDelta =
          beforeLogCount !== undefined && afterLogCount !== undefined
            ? afterLogCount - beforeLogCount
            : inventoryDelta;

        if (afterLogCount !== undefined && afterLogCount >= targetLogCount) {
          return {
            status: "collected",
            block: lastBlock?.name,
            target: lastBlock?.position,
            attemptedBlocks,
            beforeLogCount,
            afterLogCount,
            inventoryDelta: settledInventoryDelta,
            blockRemoved: lastBlockRemoved,
            reason: `collect_logs increased log inventory by ${settledInventoryDelta}.`
          };
        }
      }

      const dugWithoutPickup =
        attemptedBlocks.some((attemptedBlock) => attemptedBlock.outcome === "dug") &&
        inventoryDelta !== undefined &&
        inventoryDelta <= 0;

      return {
        status: targetNotMetAfterProgress ? "progressing" : "blocked",
        block: lastBlock?.name,
        target: lastBlock?.position,
        nearbyLogHints: scanNearbyLogHints(bot),
        attemptedBlocks,
        beforeLogCount,
        afterLogCount,
        inventoryDelta,
        blockRemoved: lastBlockRemoved,
        reason: targetNotMetAfterProgress
          ? `collect_logs increased log inventory by ${inventoryDelta}, but exhausted reachable candidates before target ${targetLogCount}.`
          : dugWithoutPickup
            ? "collect_logs dug a log, but log inventory did not increase."
            : `collect_logs found no reachable low log block within ${COLLECT_LOG_SEARCH_RADIUS} blocks.`
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
        nearbyLogHints: scanNearbyLogHints(bot),
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
      exhaustedCandidates.add(candidateKey);
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
        pickupWaitMs,
        searchWaitMs: pickupWaitMs < 500 ? 150 : undefined,
        finalGraceMs: pickupWaitMs < 500 ? 150 : undefined
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
        exhaustedCandidates.add(candidateKey);
        continue;
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
    nearbyLogHints: scanNearbyLogHints(bot),
    attemptedBlocks,
    beforeLogCount,
    afterLogCount,
    inventoryDelta,
    blockRemoved: lastBlockRemoved,
    reason: "collect_logs dug a log, but log inventory did not increase."
  };
}
