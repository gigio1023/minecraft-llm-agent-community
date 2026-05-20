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
  pathfinder?: {
    goto(goal: unknown): Promise<void>;
  };
  findBlock(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
  }): { name: string; position: Positioned } | null;
  dig(block: { name: string; position: Positioned }): Promise<void>;
  nearestEntity?(predicate: (entity: { name?: string; position: Positioned }) => boolean): { name?: string; position: Positioned } | null;
  lookAt(target: Positioned, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
};

type CollectLogsResult = {
  status: "collected" | "no_logs_found";
  block?: string;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function moveNear(bot: MiningBot, position: Positioned) {
  if (bot.pathfinder) {
    await bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, 1));
    return;
  }

  await bot.lookAt(position, true);
  bot.setControlState("forward", true);

  try {
    await delay(800);
  } finally {
    bot.setControlState("forward", false);
  }
}

export async function collectLogs({ bot }: { bot: MiningBot }): Promise<CollectLogsResult> {
  const block = bot.findBlock({
    matching: (candidate) => LOG_BLOCK_NAMES.includes(candidate.name as (typeof LOG_BLOCK_NAMES)[number]),
    maxDistance: 24
  });

  if (!block) {
    return { status: "no_logs_found" };
  }

  await moveNear(bot, block.position);
  await bot.lookAt(block.position, true);
  await bot.dig(block);

  const droppedItem = bot.nearestEntity?.((entity) => entity.name === "item");

  if (droppedItem) {
    await moveNear(bot, droppedItem.position);
  } else {
    await delay(500);
  }

  return {
    status: "collected",
    block: block.name
  };
}
