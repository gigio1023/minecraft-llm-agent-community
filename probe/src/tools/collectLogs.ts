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
  blockAt?(position: Positioned): { name: string } | null;
  stopDigging?(): void;
  lookAt(target: Positioned, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
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

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
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
  signal?: AbortSignal
) {
  if (beforeLogCount === undefined) {
    return undefined;
  }

  const deadline = Date.now() + 2_500;
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

  return false;
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
      return block && isLogName(block.name) ? { name: block.name, position } : null;
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

export async function collectLogs({
  bot,
  signal,
  targetCount
}: {
  bot: MiningBot;
  signal?: AbortSignal;
  targetCount?: number;
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
      return {
        status: "blocked",
        block: lastBlock?.name,
        target: lastBlock?.position,
        attemptedBlocks,
        beforeLogCount,
        afterLogCount,
        inventoryDelta:
          beforeLogCount !== undefined && afterLogCount !== undefined
            ? afterLogCount - beforeLogCount
            : undefined,
        blockRemoved: lastBlockRemoved,
        reason: "collect_logs found no reachable low log block within 12 blocks."
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
      await moveToNearbyDrop(bot, block.position, signal);
      afterLogCount = await waitForLogInventoryIncrease(bot, afterLogCount, signal);
    }

    const blockAfter = bot.blockAt?.(block.position);
    lastBlockRemoved = blockAfter ? !isLogName(blockAfter.name) : undefined;

    if (
      attemptBeforeLogCount !== undefined &&
      afterLogCount !== undefined &&
      afterLogCount <= attemptBeforeLogCount
    ) {
      return {
        status: "blocked",
        block: block.name,
        target: block.position,
        attemptedBlocks,
        beforeLogCount,
        afterLogCount,
        inventoryDelta:
          beforeLogCount !== undefined ? afterLogCount - beforeLogCount : undefined,
        blockRemoved: lastBlockRemoved,
        reason: "collect_logs dug a log, but log inventory did not increase."
      };
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
