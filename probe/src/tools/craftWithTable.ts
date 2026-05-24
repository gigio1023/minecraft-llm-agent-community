import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

type Positioned = { x: number; y: number; z: number };

type Recipe = unknown;

type CraftingTableBot = {
  registry: {
    itemsByName: Record<string, { id: number }>;
  };
  entity: {
    position: Positioned;
  };
  inventory?: {
    items(): Array<{ name: string; count: number }>;
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
  blockAt?(position: Positioned): { name: string; position?: Positioned } | null;
  pathfinder?: {
    goto(goal: unknown): Promise<void>;
    stop?(): void;
  };
  lookAt?(position: Vec3, force?: boolean): Promise<void>;
  setControlState?(control: "forward" | "sprint", state: boolean): void;
  equip?(item: any, destination: any): Promise<void>;
  placeBlock?(referenceBlock: { name: string; position?: Positioned }, faceVector: Vec3): Promise<void>;
  recipesFor(itemId: number, metadata: null, minResultCount: number, craftingTable: unknown): Recipe[];
  craft(recipe: Recipe, count: number, craftingTable: unknown): Promise<void>;
};

type CraftWithTableResult = {
  status: "crafted" | "blocked";
  itemName: string;
  tablePosition?: Positioned;
  beforeCount?: number;
  afterCount?: number;
  inventoryDelta?: number;
  reason: string;
};

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function countInventoryItem(bot: CraftingTableBot, itemName: string) {
  if (!bot.inventory) {
    return undefined;
  }

  return bot.inventory
    .items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

function isCraftingTable(block: { name: string }) {
  return block.name === "crafting_table";
}

function isAirLike(block: { name: string } | null | undefined) {
  return !block || block.name === "air" || block.name === "cave_air" || block.name === "void_air";
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function findNearbyCraftingTable(bot: CraftingTableBot, maxDistance: number) {
  const fromBlocks = bot.findBlocks?.({
    matching: isCraftingTable,
    maxDistance,
    count: 8
  })
    .map((position) => {
      const block = bot.blockAt?.(position);
      return block && isCraftingTable(block) ? block : null;
    })
    .filter((entry): entry is { name: string; position: Positioned } =>
      entry !== null && entry.position !== undefined
    ) ?? [];
  const candidates = fromBlocks.length > 0
    ? fromBlocks
    : bot.findBlock
      ? [
          bot.findBlock({
            matching: isCraftingTable,
            maxDistance
          })
        ].filter((entry): entry is { name: string; position: Positioned } => entry !== null)
      : [];

  return candidates.sort((left, right) =>
    distance(bot.entity.position, left.position) - distance(bot.entity.position, right.position)
  )[0] ?? null;
}

async function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout: () => void) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          onTimeout();
          reject(new Error(`craft_with_table pathfinder timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function moveNearCraftingTable(input: {
  bot: CraftingTableBot;
  table: { position: Positioned };
  interactionDistance: number;
  moveTimeoutMs: number;
}) {
  const beforeDistance = distance(input.bot.entity.position, input.table.position);
  if (beforeDistance <= input.interactionDistance) {
    return {
      attempted: false,
      beforeDistance,
      afterDistance: beforeDistance
    };
  }

  let pathfinderFailureReason: string | undefined;
  let manualFallbackUsed = false;

  if (input.bot.pathfinder) {
    try {
      input.bot.pathfinder.stop?.();
      await raceWithTimeout(
        input.bot.pathfinder.goto(
          new goals.GoalNear(
            input.table.position.x,
            input.table.position.y,
            input.table.position.z,
            Math.max(1, Math.floor(input.interactionDistance))
          )
        ),
        input.moveTimeoutMs,
        () => input.bot.pathfinder?.stop?.()
      );
    } catch (error) {
      pathfinderFailureReason = error instanceof Error ? error.message : String(error);
      input.bot.pathfinder.stop?.();
    }
  }

  let afterDistance = distance(input.bot.entity.position, input.table.position);

  if (
    afterDistance > input.interactionDistance + 0.75 &&
    input.bot.lookAt &&
    input.bot.setControlState
  ) {
    manualFallbackUsed = true;
    const durationMs = Math.min(
      6_000,
      Math.max(1_500, Math.ceil((afterDistance - input.interactionDistance) * 450))
    );
    await input.bot.lookAt(
      new Vec3(
        input.table.position.x + 0.5,
        input.table.position.y + 0.5,
        input.table.position.z + 0.5
      ),
      true
    );
    input.bot.setControlState("sprint", true);
    input.bot.setControlState("forward", true);
    try {
      await delay(durationMs);
    } finally {
      input.bot.setControlState("forward", false);
      input.bot.setControlState("sprint", false);
    }
    afterDistance = distance(input.bot.entity.position, input.table.position);
  }

  return {
    attempted: true,
    beforeDistance,
    afterDistance,
    pathfinderFailureReason,
    manualFallbackUsed
  };
}

async function tryPlaceLocalCraftingTable(
  bot: CraftingTableBot
): Promise<{ name: string; position: Positioned } | null> {
  const tableItem = bot.inventory?.items().find((item) => item.name === "crafting_table" && item.count > 0);
  if (!tableItem || !bot.equip || !bot.placeBlock || !bot.blockAt) {
    return null;
  }

  const origin = {
    x: Math.floor(bot.entity.position.x),
    y: Math.floor(bot.entity.position.y),
    z: Math.floor(bot.entity.position.z)
  };
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2]
  ] as const;

  for (const [dx, dz] of offsets) {
    const supportPos = new Vec3(origin.x + dx, origin.y - 1, origin.z + dz);
    const placePos = new Vec3(origin.x + dx, origin.y, origin.z + dz);
    const support = bot.blockAt(supportPos);
    const target = bot.blockAt(placePos);
    if (!support || isAirLike(support) || !isAirLike(target)) {
      continue;
    }

    await bot.equip(tableItem, "hand");
    await bot.placeBlock(support, new Vec3(0, 1, 0));
    await delay(500);

    const placed = bot.blockAt(placePos);
    if (placed && isCraftingTable(placed)) {
      return placed.position ? { name: "crafting_table", position: placed.position } : {
        name: "crafting_table",
        position: { x: placePos.x, y: placePos.y, z: placePos.z }
      };
    }
  }

  return null;
}

/**
 * Crafts a table-bound recipe against a real crafting table block. If the actor
 * has a crafting table item but cannot reach an existing table, the primitive
 * may place one nearby before crafting and still verifies the requested
 * inventory increase.
 */
export async function craftWithTable({
  bot,
  itemName,
  maxDistance = 24,
  interactionDistance = 3,
  moveTimeoutMs = 8_000
}: {
  bot: CraftingTableBot;
  itemName: string;
  maxDistance?: number;
  interactionDistance?: number;
  moveTimeoutMs?: number;
}): Promise<CraftWithTableResult> {
  const item = bot.registry.itemsByName[itemName];

  if (!item) {
    throw new Error(`Unknown table craft item: ${itemName}`);
  }

  let table: { name: string; position: Positioned } | null =
    findNearbyCraftingTable(bot, maxDistance);

  if (!table) {
    const placedTable = await tryPlaceLocalCraftingTable(bot);
    if (!placedTable) {
      return {
        status: "blocked",
        itemName,
        reason: `craft_with_table found no crafting_table block within ${maxDistance} blocks and could not place a local table`
      };
    }
    table = placedTable;
  }

  let moveResult: Awaited<ReturnType<typeof moveNearCraftingTable>> | undefined;
  moveResult = await moveNearCraftingTable({
    bot,
    table,
    interactionDistance,
    moveTimeoutMs
  });

  if ((moveResult?.afterDistance ?? 0) > interactionDistance + 0.75) {
    const localTable = await tryPlaceLocalCraftingTable(bot);
    if (localTable) {
      table = localTable;
    } else {
      return {
        status: "blocked",
        itemName,
        tablePosition: table.position,
        reason: `craft_with_table found a table but remained ${Number(moveResult.afterDistance.toFixed(2))} blocks away${moveResult.pathfinderFailureReason ? ` after pathfinder failure: ${moveResult.pathfinderFailureReason}` : ""}${moveResult.manualFallbackUsed ? " after manual movement fallback" : ""}; no local crafting_table could be placed`
      };
    }
  }

  const beforeCount = countInventoryItem(bot, itemName);
  if (beforeCount === undefined) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      reason: `craft_with_table cannot verify ${itemName} without inventory evidence`
    };
  }

  const [recipe] = bot.recipesFor(item.id, null, 1, table);

  if (!recipe) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      beforeCount,
      reason: `craft_with_table found no table recipe for ${itemName}`
    };
  }

  await bot.craft(recipe, 1, table);

  const afterCount = countInventoryItem(bot, itemName);
  if (afterCount === undefined) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      beforeCount,
      reason: `craft_with_table lost ${itemName} inventory evidence after craft`
    };
  }

  const inventoryDelta = afterCount - beforeCount;

  if (inventoryDelta <= 0) {
    return {
      status: "blocked",
      itemName,
      tablePosition: table.position,
      beforeCount,
      afterCount,
      inventoryDelta,
      reason: `craft_with_table completed but ${itemName} inventory did not increase`
    };
  }

  return {
    status: "crafted",
    itemName,
    tablePosition: table.position,
    beforeCount,
    afterCount,
    inventoryDelta,
    reason: `craft_with_table increased ${itemName} inventory by ${inventoryDelta}`
  };
}
