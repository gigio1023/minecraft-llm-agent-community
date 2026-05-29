export type FoodMetadata = {
  foodPoints?: number;
  saturation?: number;
};

type InventoryItem = {
  name: string;
  count: number;
};

type ConsumeItemBot = {
  username?: string;
  food?: number;
  health?: number;
  foodSaturation?: number;
  heldItem?: InventoryItem | null;
  registry?: unknown;
  inventory: {
    items(): InventoryItem[];
  };
  equip(item: any, destination: "hand"): Promise<void> | void;
  consume(): Promise<void> | void;
};

export type FoodCandidate = {
  name: string;
  count: number;
  food_points?: number;
  saturation?: number;
};

export type ConsumeItemResult =
  | {
      status: "consumed";
      itemName: string;
      before: ConsumeVitalsSnapshot;
      after: ConsumeVitalsSnapshot;
      count_delta: number;
      food_delta: number;
      health_delta: number;
      reason: string;
    }
  | {
      status: "blocked" | "failed";
      itemName?: string;
      before: ConsumeVitalsSnapshot;
      after?: ConsumeVitalsSnapshot;
      food_candidates: FoodCandidate[];
      reason: string;
    };

export type ConsumeVitalsSnapshot = {
  food?: number;
  health?: number;
  food_saturation?: number;
  held_item?: {
    name: string;
    count?: number;
  };
  inventory_counts: Record<string, number>;
};

function snapshot(bot: ConsumeItemBot): ConsumeVitalsSnapshot {
  const heldItem = bot.heldItem
    ? {
        name: bot.heldItem.name,
        count: bot.heldItem.count
      }
    : undefined;
  return {
    ...(typeof bot.food === "number" ? { food: bot.food } : {}),
    ...(typeof bot.health === "number" ? { health: bot.health } : {}),
    ...(typeof bot.foodSaturation === "number" ? { food_saturation: bot.foodSaturation } : {}),
    ...(heldItem ? { held_item: heldItem } : {}),
    inventory_counts: Object.fromEntries(
      bot.inventory.items().map((item) => [item.name, item.count])
    )
  };
}

function foodMetadata(bot: ConsumeItemBot, itemName: string): FoodMetadata | undefined {
  if (!bot.registry || typeof bot.registry !== "object") {
    return undefined;
  }
  const foodsByName = (bot.registry as { foodsByName?: unknown }).foodsByName;
  if (!foodsByName || typeof foodsByName !== "object") {
    return undefined;
  }
  return (foodsByName as Record<string, FoodMetadata | undefined>)[itemName];
}

function toCandidate(bot: ConsumeItemBot, item: InventoryItem): FoodCandidate | null {
  const food = foodMetadata(bot, item.name);
  if (!food) {
    return null;
  }
  return {
    name: item.name,
    count: item.count,
    ...(typeof food.foodPoints === "number" ? { food_points: food.foodPoints } : {}),
    ...(typeof food.saturation === "number" ? { saturation: food.saturation } : {})
  };
}

export function listFoodCandidates(bot: ConsumeItemBot): FoodCandidate[] {
  return bot.inventory
    .items()
    .map((item) => toCandidate(bot, item))
    .filter((item): item is FoodCandidate => item !== null)
    .sort((left, right) => {
      const foodDelta = (right.food_points ?? 0) - (left.food_points ?? 0);
      return foodDelta !== 0 ? foodDelta : left.name.localeCompare(right.name);
    });
}

export function selectFoodCandidateName(bot: ConsumeItemBot): string | undefined {
  return listFoodCandidates(bot)[0]?.name;
}

function findInventoryItem(bot: ConsumeItemBot, itemName: string) {
  return bot.inventory.items().find((item) => item.name === itemName && item.count > 0);
}

function countOf(snapshot: ConsumeVitalsSnapshot, itemName: string) {
  return snapshot.inventory_counts[itemName] ?? 0;
}

function delta(after: number | undefined, before: number | undefined) {
  return typeof after === "number" && typeof before === "number"
    ? Number((after - before).toFixed(2))
    : 0;
}

export async function consumeItem(input: {
  bot: ConsumeItemBot;
  itemName?: string;
  signal?: AbortSignal;
}): Promise<ConsumeItemResult> {
  const before = snapshot(input.bot);
  const candidates = listFoodCandidates(input.bot);
  const itemName = input.itemName ?? candidates[0]?.name;

  if (input.signal?.aborted) {
    return {
      status: "blocked",
      itemName,
      before,
      food_candidates: candidates,
      reason: "consume_item was cancelled before execution"
    };
  }

  if (typeof before.food === "number" && before.food >= 20) {
    return {
      status: "blocked",
      itemName,
      before,
      food_candidates: candidates,
      reason: "consume_item cannot verify useful consumption while food is already full"
    };
  }

  if (!itemName) {
    return {
      status: "blocked",
      before,
      food_candidates: candidates,
      reason: "consume_item found no edible inventory item"
    };
  }

  if (!foodMetadata(input.bot, itemName)) {
    return {
      status: "blocked",
      itemName,
      before,
      food_candidates: candidates,
      reason: `${itemName} is not marked edible by the Mineflayer registry`
    };
  }

  const item = findInventoryItem(input.bot, itemName);
  if (!item) {
    return {
      status: "blocked",
      itemName,
      before,
      food_candidates: candidates,
      reason: `consume_item could not find ${itemName} in inventory`
    };
  }

  try {
    if (input.bot.heldItem?.name !== itemName) {
      await input.bot.equip(item, "hand");
    }
    if (input.signal?.aborted) {
      return {
        status: "blocked",
        itemName,
        before,
        after: snapshot(input.bot),
        food_candidates: candidates,
        reason: "consume_item was cancelled after equipping the item"
      };
    }
    await input.bot.consume();
  } catch (error) {
    return {
      status: "failed",
      itemName,
      before,
      after: snapshot(input.bot),
      food_candidates: candidates,
      reason: error instanceof Error ? error.message : String(error)
    };
  }

  const after = snapshot(input.bot);
  const countDelta = countOf(after, itemName) - countOf(before, itemName);
  const foodDelta = delta(after.food, before.food);
  const healthDelta = delta(after.health, before.health);
  if (countDelta < 0 || foodDelta > 0 || healthDelta > 0) {
    return {
      status: "consumed",
      itemName,
      before,
      after,
      count_delta: countDelta,
      food_delta: foodDelta,
      health_delta: healthDelta,
      reason: `consume_item verified ${itemName} through inventory or vitals delta`
    };
  }

  return {
    status: "failed",
    itemName,
    before,
    after,
    food_candidates: candidates,
    reason: `consume_item completed but ${itemName} count, food, and health did not change`
  };
}
