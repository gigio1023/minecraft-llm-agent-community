/**
 * Mineflayer primitive for explicit hand-equipment changes.
 *
 * @remarks This adapter is intentionally narrower than generic MCP inventory
 * tools. Equipping is useful runtime preparation, but success must come from
 * held-item evidence rather than provider prose or fuzzy item matching.
 */
type InventoryItem = {
  name: string;
  count: number;
};

type EquipItemBot = {
  heldItem?: InventoryItem | null;
  inventory: {
    items(): InventoryItem[];
  };
  equip(item: any, destination: "hand"): Promise<void> | void;
};

export type EquipItemSnapshot = {
  held_item?: {
    name: string;
    count?: number;
  };
  inventory_counts: Record<string, number>;
};

export type EquipItemResult =
  | {
      status: "equipped" | "already_equipped";
      itemName: string;
      before: EquipItemSnapshot;
      after: EquipItemSnapshot;
      reason: string;
    }
  | {
      status: "blocked" | "failed";
      itemName: string;
      before: EquipItemSnapshot;
      after?: EquipItemSnapshot;
      reason: string;
    };

function snapshot(bot: EquipItemBot): EquipItemSnapshot {
  const heldItem = bot.heldItem
    ? {
        name: bot.heldItem.name,
        count: bot.heldItem.count
      }
    : undefined;

  return {
    ...(heldItem ? { held_item: heldItem } : {}),
    inventory_counts: Object.fromEntries(
      bot.inventory.items().map((item) => [item.name, item.count])
    )
  };
}

function findInventoryItem(bot: EquipItemBot, itemName: string) {
  return bot.inventory.items().find((item) => item.name === itemName && item.count > 0);
}

function itemIsHeld(snapshotValue: EquipItemSnapshot, itemName: string) {
  return snapshotValue.held_item?.name === itemName;
}

export async function equipItem(input: {
  bot: EquipItemBot;
  itemName: string;
  signal?: AbortSignal;
}): Promise<EquipItemResult> {
  const itemName = input.itemName.trim();
  const before = snapshot(input.bot);

  if (input.signal?.aborted) {
    return {
      status: "blocked",
      itemName,
      before,
      reason: "equip_item was cancelled before execution"
    };
  }

  if (itemIsHeld(before, itemName)) {
    return {
      status: "already_equipped",
      itemName,
      before,
      after: before,
      reason: `equip_item verified ${itemName} is already held`
    };
  }

  const item = findInventoryItem(input.bot, itemName);
  if (!item) {
    return {
      status: "blocked",
      itemName,
      before,
      reason: `equip_item requires exact inventory item ${itemName}`
    };
  }

  try {
    await input.bot.equip(item, "hand");
  } catch (error) {
    return {
      status: "failed",
      itemName,
      before,
      after: snapshot(input.bot),
      reason: error instanceof Error ? error.message : String(error)
    };
  }

  if (input.signal?.aborted) {
    return {
      status: "blocked",
      itemName,
      before,
      after: snapshot(input.bot),
      reason: "equip_item was cancelled after equip call"
    };
  }

  const after = snapshot(input.bot);
  if (!itemIsHeld(after, itemName)) {
    return {
      status: "failed",
      itemName,
      before,
      after,
      reason: `equip_item completed but held item is not ${itemName}`
    };
  }

  return {
    status: "equipped",
    itemName,
    before,
    after,
    reason: `equip_item verified ${itemName} in hand`
  };
}
