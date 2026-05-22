import type { RuntimePrimitiveId } from "../primitives/registry.js";

type VisibleActor = {
  id: string;
  distance: number;
};

type InventoryItem = {
  name: string;
  count: number;
};

const LOG_ITEM_NAMES = [
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log"
] as const;

const PLANK_ITEM_NAMES = [
  "oak_planks",
  "birch_planks",
  "spruce_planks",
  "jungle_planks",
  "acacia_planks",
  "dark_oak_planks",
  "mangrove_planks",
  "cherry_planks"
] as const;

export type DeterministicCurriculumState = {
  visibleActors: VisibleActor[];
  inventory?: InventoryItem[];
  nearbyBlocks?: Array<{ name: string; distance: number }>;
  sharedChest?: {
    chestId: string;
    items: InventoryItem[];
  };
  completedTaskIds?: readonly string[];
};

type ApproachTask = {
  id: "approach_visible_target";
  reason: string;
  blockers: string[];
  preferredActorRoles: string[];
  primitiveIds: RuntimePrimitiveId[];
  targetId: string;
  success: {
    kind: "distance_at_most";
    targetId: string;
    maxDistance: number;
  };
};

type InventoryGoal = {
  kind: "inventory_at_least";
  itemNames: readonly string[];
  targetCount: number;
};

type CollectLogsTask = {
  id: "collect_4_logs";
  reason: string;
  blockers: string[];
  preferredActorRoles: string[];
  primitiveIds: RuntimePrimitiveId[];
  success: InventoryGoal;
};

type CraftPlanksAndSticksTask = {
  id: "craft_planks_and_sticks";
  reason: string;
  blockers: string[];
  preferredActorRoles: string[];
  primitiveIds: RuntimePrimitiveId[];
  success: {
    kind: "inventory_outputs";
    outputs: Array<{ itemNames: readonly string[]; targetCount: number }>;
  };
};

type CraftCraftingTableTask = {
  id: "craft_crafting_table";
  reason: string;
  blockers: string[];
  preferredActorRoles: string[];
  primitiveIds: RuntimePrimitiveId[];
  success: InventoryGoal;
};

type CraftWoodenPickaxeTask = {
  id: "craft_wooden_pickaxe";
  reason: string;
  blockers: string[];
  preferredActorRoles: string[];
  primitiveIds: RuntimePrimitiveId[];
  success: InventoryGoal;
};

type DepositSharedMaterialsTask = {
  id: "deposit_shared_materials";
  reason: string;
  blockers: string[];
  preferredActorRoles: string[];
  primitiveIds: RuntimePrimitiveId[];
  success: {
    kind: "shared_chest_has_at_least";
    chestId: string;
    itemNames: readonly string[];
    targetCount: number;
  };
};

export type DeterministicTask =
  | ApproachTask
  | CollectLogsTask
  | CraftPlanksAndSticksTask
  | CraftCraftingTableTask
  | CraftWoodenPickaxeTask
  | DepositSharedMaterialsTask;

const APPROACH_DISTANCE = 1.5;

function countItems(inventory: InventoryItem[] | undefined, names: readonly string[]) {
  if (!inventory) {
    return 0;
  }

  return inventory
    .filter((item) => names.includes(item.name))
    .reduce((sum, item) => sum + item.count, 0);
}

export function selectDeterministicTask(
  state: DeterministicCurriculumState,
  maxDistance = APPROACH_DISTANCE
): DeterministicTask | null {
  const completedTaskIds = new Set(state.completedTaskIds ?? []);

  // Inventory observations anchor boring competence; social approach is only a
  // fallback when the runtime cannot currently prove an early-game material task.
  if (state.inventory) {
    const logCount = countItems(state.inventory, LOG_ITEM_NAMES);
    const plankCount = countItems(state.inventory, PLANK_ITEM_NAMES);
    const stickCount = countItems(state.inventory, ["stick"]);
    const craftingTableCount = countItems(state.inventory, ["crafting_table"]);
    const woodenPickaxeCount = countItems(state.inventory, ["wooden_pickaxe"]);
    const nearbyCraftingTableCount =
      state.nearbyBlocks?.filter((block) => block.name === "crafting_table").length ?? 0;
    const sharedChestResourceCount = countItems(state.sharedChest?.items, [
      ...LOG_ITEM_NAMES,
      ...PLANK_ITEM_NAMES,
      "crafting_table"
    ]);

    // Shared storage visibility comes before local crafting so later actors can
    // reason from a public artifact instead of another actor's private inventory.
    if (
      state.sharedChest &&
      (logCount > 0 || plankCount > 0 || craftingTableCount > 0) &&
      sharedChestResourceCount < 1
    ) {
      return {
        id: "deposit_shared_materials",
        reason: "Need to make gathered materials available through shared storage.",
        blockers: [],
        preferredActorRoles: ["gatherer", "quartermaster"],
        primitiveIds: ["observe", "inspect_chest", "deposit_shared", "wait"],
        success: {
          kind: "shared_chest_has_at_least",
          chestId: state.sharedChest.chestId,
          itemNames: [...LOG_ITEM_NAMES, ...PLANK_ITEM_NAMES, "crafting_table"],
          targetCount: 1
        }
      };
    }

    if (woodenPickaxeCount >= 1 || completedTaskIds.has("craft_wooden_pickaxe")) {
      return null;
    }

    if (
      (craftingTableCount >= 1 || completedTaskIds.has("craft_crafting_table") || nearbyCraftingTableCount > 0) &&
      nearbyCraftingTableCount > 0 &&
      plankCount >= 3 &&
      stickCount >= 2
    ) {
      return {
        id: "craft_wooden_pickaxe",
        reason: "Need a first table-crafted tool before mining stone.",
        blockers: [],
        preferredActorRoles: ["crafter"],
        primitiveIds: ["observe", "craft_with_table", "wait"],
        success: {
          kind: "inventory_at_least",
          itemNames: ["wooden_pickaxe"],
          targetCount: 1
        }
      };
    }

    if (craftingTableCount >= 1 || completedTaskIds.has("craft_crafting_table")) {
      // The actor has a crafting table item, but placing/finding a table block
      // remains a separate primitive boundary. Do not claim tool progression
      // until the runtime can observe a nearby table block.
      return null;
    }

    if (plankCount >= 4 && stickCount >= 2) {
      return {
        id: "craft_crafting_table",
        reason: "Need a crafting table to unlock the next progression layer.",
        blockers: [],
        preferredActorRoles: ["crafter"],
        primitiveIds: ["observe", "craft_item", "wait"],
        success: {
          kind: "inventory_at_least",
          itemNames: ["crafting_table"],
          targetCount: 1
        }
      };
    }

    if (logCount >= 4) {
      return {
        id: "craft_planks_and_sticks",
        reason: "Need planks and sticks before crafting any tool station.",
        blockers: [],
        preferredActorRoles: ["crafter"],
        primitiveIds: ["observe", "craft_item", "wait"],
        success: {
          kind: "inventory_outputs",
          outputs: [
            { itemNames: PLANK_ITEM_NAMES, targetCount: 4 },
            { itemNames: ["stick"], targetCount: 2 }
          ]
        }
      };
    }

    if (completedTaskIds.has("craft_planks_and_sticks")) {
      // Completed ids are a fallback for cases where inventory observation is
      // temporarily narrow after reconnect or pickup lag. They should advance
      // the chain, but verification still owns the pass/fail decision.
      return {
        id: "craft_crafting_table",
        reason: "Need a crafting table to unlock the next progression layer.",
        blockers: [],
        preferredActorRoles: ["crafter"],
        primitiveIds: ["observe", "craft_item", "wait"],
        success: {
          kind: "inventory_at_least",
          itemNames: ["crafting_table"],
          targetCount: 1
        }
      };
    }

    if (completedTaskIds.has("collect_4_logs")) {
      return {
        id: "craft_planks_and_sticks",
        reason: "Need planks and sticks before crafting any tool station.",
        blockers: [],
        preferredActorRoles: ["crafter"],
        primitiveIds: ["observe", "craft_item", "wait"],
        success: {
          kind: "inventory_outputs",
          outputs: [
            { itemNames: PLANK_ITEM_NAMES, targetCount: 4 },
            { itemNames: ["stick"], targetCount: 2 }
          ]
        }
      };
    }

    if (logCount < 4) {
      return {
        id: "collect_4_logs",
        reason: "Need enough wood to start the early-game crafting chain.",
        blockers: [],
        preferredActorRoles: ["gatherer"],
        primitiveIds: ["observe", "collect_logs", "wait"],
        success: {
          kind: "inventory_at_least",
          itemNames: LOG_ITEM_NAMES,
          targetCount: 4
        }
      };
    }

    return {
      id: "craft_planks_and_sticks",
      reason: "Need planks and sticks before crafting any tool station.",
      blockers: [],
      preferredActorRoles: ["crafter"],
      primitiveIds: ["observe", "craft_item", "wait"],
      success: {
        kind: "inventory_outputs",
        outputs: [
          { itemNames: PLANK_ITEM_NAMES, targetCount: 4 },
          { itemNames: ["stick"], targetCount: 2 }
        ]
      }
    };
  }

  const [nearestActor] = [...state.visibleActors].sort((left, right) => left.distance - right.distance);

  if (!nearestActor) {
    return null;
  }

  if (nearestActor.distance <= maxDistance) {
    return null;
  }

  // Social movement remains a fallback task. It keeps the loop doing observable
  // work when inventory evidence is missing, but it is not the primary proof of
  // Minecraft competence.
  return {
    id: "approach_visible_target",
    reason: `Need to close distance to ${nearestActor.id} before the next interaction.`,
    blockers: [],
    preferredActorRoles: ["runner"],
    primitiveIds: ["observe", "move_to", "wait"],
    targetId: nearestActor.id,
    success: {
      kind: "distance_at_most",
      targetId: nearestActor.id,
      maxDistance
    }
  };
}
