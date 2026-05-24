import type { Bot } from "mineflayer";

type InventoryBot = Bot & {
  inventory: {
    items(): Array<{ name: string; count: number }>;
  };
};

export type LongHelperResult = {
  status: "completed" | "blocked";
  reason: string;
  details?: Record<string, unknown>;
};

function countItem(bot: InventoryBot, itemName: string) {
  return bot.inventory
    .items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

export async function ensureFurnaceNearby(bot: Bot): Promise<LongHelperResult> {
  const furnace = bot.findBlock({
    matching: (block) => block.name === "furnace",
    maxDistance: 6
  });

  if (!furnace) {
    return {
      status: "blocked",
      reason: "ensureFurnaceNearby found no furnace within 6 blocks"
    };
  }

  return {
    status: "completed",
    reason: "furnace block is nearby",
    details: { position: furnace.position }
  };
}

export async function ensureFuel(bot: Bot, minCount = 1): Promise<LongHelperResult> {
  const fuelNames = ["coal", "charcoal", "oak_log", "oak_planks"];
  const available = fuelNames
    .map((name) => ({ name, count: countItem(bot as InventoryBot, name) }))
    .filter((entry) => entry.count >= minCount);

  if (available.length === 0) {
    return {
      status: "blocked",
      reason: `ensureFuel could not find ${minCount} fuel item in inventory`
    };
  }

  return {
    status: "completed",
    reason: `fuel available: ${available[0]?.name}`,
    details: { fuel: available[0] }
  };
}

export async function smeltItem(
  bot: Bot,
  input: { inputItemName: string; outputItemName: string; count?: number }
): Promise<LongHelperResult> {
  const furnaceCheck = await ensureFurnaceNearby(bot);
  if (furnaceCheck.status === "blocked") {
    return furnaceCheck;
  }

  const fuelCheck = await ensureFuel(bot, 1);
  if (fuelCheck.status === "blocked") {
    return fuelCheck;
  }

  const before = countItem(bot as InventoryBot, input.outputItemName);
  if (before >= (input.count ?? 1)) {
    return {
      status: "completed",
      reason: `${input.outputItemName} already available before smelt`,
      details: { beforeCount: before }
    };
  }

  return {
    status: "blocked",
    reason:
      "smeltItem runtime substrate is not wired to furnace interaction yet; mine raw iron and add furnace smelt primitive next"
  };
}

export async function mineOre(
  bot: Bot,
  input: { blockName: string; expectedItemName: string; count?: number }
): Promise<LongHelperResult> {
  const oreBlock = bot.findBlock({
    matching: (block) => block.name === input.blockName,
    maxDistance: 24
  });

  if (!oreBlock) {
    return {
      status: "blocked",
      reason: `mineOre could not find ${input.blockName} within 24 blocks`
    };
  }

  return {
    status: "blocked",
    reason: `mineOre located ${input.blockName} but atomic dig execution must be delegated to ctx.mineBlock`,
    details: {
      position: oreBlock.position,
      expectedItemName: input.expectedItemName,
      count: input.count ?? 1
    }
  };
}

export function scanNearbyBlocks(bot: Bot, maxDistance = 16) {
  return bot
    .findBlocks({
      matching: (block) => block.name !== "air" && block.name !== "cave_air",
      maxDistance,
      count: 48
    })
    .map((position) => {
      const block = bot.blockAt(position);
      return {
        name: block?.name ?? "unknown",
        distance: Number(bot.entity.position.distanceTo(position).toFixed(1))
      };
    });
}

export async function descendToYLevel(bot: Bot, targetY: number): Promise<LongHelperResult> {
  const currentY = Math.floor(bot.entity.position.y);
  if (currentY <= targetY) {
    return {
      status: "completed",
      reason: `already at or below Y=${targetY}`,
      details: { currentY }
    };
  }

  return {
    status: "blocked",
    reason: `descendToYLevel needs pathfinder descent policy (currentY=${currentY}, targetY=${targetY})`
  };
}

export async function branchMineStep(bot: Bot): Promise<LongHelperResult> {
  return {
    status: "blocked",
    reason: "branchMineStep exploration policy is not implemented yet"
  };
}
