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
  findBlock(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
  }): { name: string; position: Positioned } | null;
  dig(block: { name: string; position: Positioned }): Promise<void>;
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
  signal?: AbortSignal
) {
  if (bot.pathfinder) {
    // Pathfinder is the preferred movement boundary because it owns collision
    // and route retries. The manual fallback below is only a short nudge for
    // stripped-down test doubles or runtimes without the plugin installed.
    await runAbortable(
      bot,
      signal,
      bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, 2))
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

function findReachableLog(bot: MiningBot) {
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
    : [
        bot.findBlock({
          matching: (candidate) => isLogName(candidate.name),
          maxDistance: 12
        })
      ].filter((entry): entry is { name: string; position: Positioned } => entry !== null);

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
    })[0] ?? null;
}

export async function collectLogs({
  bot,
  signal
}: {
  bot: MiningBot;
  signal?: AbortSignal;
}): Promise<CollectLogsResult> {
  const beforeLogCount = countInventoryLogs(bot);
  const block = findReachableLog(bot);

  if (!block) {
    return {
      status: "blocked",
      beforeLogCount,
      afterLogCount: beforeLogCount,
      inventoryDelta: 0,
      reason: "collect_logs found no reachable low log block within 12 blocks."
    };
  }

  const beforeMoveDistance = distance(bot.entity.position, block.position);
  await moveNear(bot, block.position, signal);
  const afterMoveDistance = distance(bot.entity.position, block.position);

  if (afterMoveDistance > beforeMoveDistance + 1 || afterMoveDistance > 5) {
    // A dig after movement drift would create misleading transcript evidence:
    // the bot "attempted" work but was physically farther from the target.
    stopMovement(bot);

    return {
      status: "blocked",
      block: block.name,
      target: block.position,
      beforeLogCount,
      afterLogCount: beforeLogCount,
      inventoryDelta: 0,
      reason: `collect_logs movement drifted away from ${block.name} (${beforeMoveDistance.toFixed(2)} -> ${afterMoveDistance.toFixed(2)} blocks).`
    };
  }

  await runAbortable(bot, signal, bot.dig(block));

  const droppedItem = bot.nearestEntity?.((entity) => entity.name === "item");

  if (
    droppedItem &&
    distance(bot.entity.position, droppedItem.position) <= 6 &&
    distance(block.position, droppedItem.position) <= 4
  ) {
    // Digging a block is not equivalent to owning its drop. Move toward nearby
    // item entities so pickup can be reflected in inventory evidence.
    await moveNear(bot, droppedItem.position, signal);
  } else {
    await runAbortable(bot, signal, delay(500));
  }

  const afterLogCount = countInventoryLogs(bot);
  const inventoryDelta =
    beforeLogCount !== undefined && afterLogCount !== undefined
      ? afterLogCount - beforeLogCount
      : undefined;
  const blockAfter = bot.blockAt?.(block.position);
  const blockRemoved = blockAfter ? !isLogName(blockAfter.name) : undefined;

  // Inventory pickup can lag block removal, so either signal counts as real
  // progress; neither means the action only looked successful.
  if ((inventoryDelta !== undefined && inventoryDelta > 0) || blockRemoved === true) {
    return {
      status: "collected",
      block: block.name,
      target: block.position,
      beforeLogCount,
      afterLogCount,
      inventoryDelta,
      blockRemoved,
      reason:
        inventoryDelta !== undefined && inventoryDelta > 0
          ? `collect_logs increased log inventory by ${inventoryDelta}.`
          : `collect_logs removed ${block.name} from the world.`
    };
  }

  if (inventoryDelta === undefined && blockRemoved === undefined) {
    return {
      status: "progressing",
      block: block.name,
      target: block.position,
      beforeLogCount,
      afterLogCount,
      reason: "collect_logs dug a log, but inventory and block-state evidence were unavailable."
    };
  }

  return {
    status: "blocked",
    block: block.name,
    target: block.position,
    beforeLogCount,
    afterLogCount,
    inventoryDelta,
    blockRemoved,
    reason: "collect_logs dug a log, but neither inventory nor block-state evidence changed."
  };
}
