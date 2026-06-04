/**
 * Mineflayer primitive for placing a block with bounded target and support
 * checks.
 *
 * @remarks Placement is a physical mutation claim, so this tool must be strict
 * about structured args, reachable positions, held inventory, and verifier
 * evidence. Provider prose must never supply missing target coordinates.
 */
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

export type Positioned = { x: number; y: number; z: number };

type MineflayerBlockLike = {
  name: string;
  position: Positioned;
  boundingBox?: string;
};

type PlaceBlockBot = {
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
  blockAt?(position: Positioned): MineflayerBlockLike | null;
  equip?(item: unknown, destination: unknown): Promise<void>;
  placeBlock?(referenceBlock: MineflayerBlockLike, faceVector: Vec3): Promise<void>;
  lookAt?(target: Positioned, force?: boolean): Promise<void>;
  setControlState?(control: string, state: boolean): void;
};

export type PlaceBlockResult = {
  status: "placed" | "already_present" | "blocked";
  itemName: string;
  targetPosition: Positioned;
  requestedTargetPosition?: Positioned;
  supportPosition?: Positioned;
  targetResolution?: "requested_target" | "surface_position_above_requested_target";
  expectedBlockNames: string[];
  beforeBlockName?: string;
  afterBlockName?: string;
  beforeCount?: number;
  afterCount?: number;
  inventoryDelta?: number;
  referencePosition?: Positioned;
  faceVector?: Positioned;
  approachPosition?: Positioned;
  reason: string;
};

const DEFAULT_REPLACEABLE_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "short_grass",
  "tall_grass",
  "grass",
  "fern",
  "large_fern",
  "dead_bush",
  "snow",
  "seagrass",
  "tall_seagrass"
]);

const NON_SUPPORT_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "water",
  "lava",
  "short_grass",
  "tall_grass",
  "grass",
  "fern",
  "large_fern",
  "dead_bush",
  "snow",
  "seagrass",
  "tall_seagrass"
]);

const PROTECTED_SURFACE_TARGET_BLOCKS = new Set([
  "barrel",
  "blast_furnace",
  "brewing_stand",
  "campfire",
  "cartography_table",
  "chest",
  "chipped_anvil",
  "composter",
  "crafting_table",
  "damaged_anvil",
  "dispenser",
  "dropper",
  "enchanting_table",
  "ender_chest",
  "furnace",
  "grindstone",
  "hopper",
  "lectern",
  "loom",
  "shulker_box",
  "smithing_table",
  "smoker",
  "soul_campfire",
  "stonecutter",
  "trapped_chest"
]);

const FACE_OFFSETS = [
  new Vec3(0, -1, 0),
  new Vec3(0, 1, 0),
  new Vec3(1, 0, 0),
  new Vec3(-1, 0, 0),
  new Vec3(0, 0, 1),
  new Vec3(0, 0, -1)
];

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error("place_block was cancelled before placement completed");
  }
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function normalizePosition(position: Positioned): Positioned {
  return {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    z: Math.floor(position.z)
  };
}

function add(left: Positioned, right: Positioned): Positioned {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z
  };
}

function toVec3(position: Positioned) {
  return new Vec3(position.x, position.y, position.z);
}

function negate(vector: Vec3) {
  return new Vec3(-vector.x, -vector.y, -vector.z);
}

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function countInventoryItem(bot: PlaceBlockBot, itemName: string) {
  if (!bot.inventory) {
    return undefined;
  }

  return bot.inventory
    .items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

async function waitForInventoryDecrease(
  bot: PlaceBlockBot,
  itemName: string,
  beforeCount: number | undefined,
  timeoutMs: number,
  signal?: AbortSignal
) {
  if (beforeCount === undefined) {
    return undefined;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    throwIfAborted(signal);
    const current = countInventoryItem(bot, itemName);
    if (current !== undefined && current < beforeCount) {
      return current;
    }
    await delay(50, signal);
  }

  return countInventoryItem(bot, itemName);
}

function findInventoryItem(bot: PlaceBlockBot, itemName: string) {
  return bot.inventory?.items().find((item) => item.name === itemName && item.count > 0);
}

function isReplaceable(block: MineflayerBlockLike | null | undefined, allowReplace: Set<string>) {
  return !block || allowReplace.has(block.name);
}

function isSupportBlock(block: MineflayerBlockLike | null | undefined) {
  if (!block) {
    return false;
  }
  if (block.boundingBox === "block") {
    return true;
  }
  return !NON_SUPPORT_BLOCKS.has(block.name);
}

function isProtectedSurfaceTargetBlock(block: MineflayerBlockLike | null | undefined) {
  if (!block) {
    return false;
  }
  return PROTECTED_SURFACE_TARGET_BLOCKS.has(block.name) ||
    block.name.endsWith("_bed") ||
    block.name.endsWith("_door") ||
    block.name.endsWith("_fence_gate") ||
    block.name.endsWith("_sign") ||
    block.name.endsWith("_trapdoor") ||
    block.name.endsWith("shulker_box");
}

function isResolvableSupportSurface(block: MineflayerBlockLike | null | undefined) {
  return isSupportBlock(block) && !isProtectedSurfaceTargetBlock(block);
}

type PlacementTargetResolution =
  | {
      ok: true;
      targetPosition: Positioned;
      requestedTargetPosition: Positioned;
      supportPosition?: Positioned;
      targetResolution: PlaceBlockResult["targetResolution"];
      beforeBlock: MineflayerBlockLike | null | undefined;
    }
  | {
      ok: false;
      targetPosition: Positioned;
      requestedTargetPosition: Positioned;
      beforeBlock: MineflayerBlockLike | null | undefined;
      reason: string;
    };

function resolvePlacementTarget(input: {
  bot: PlaceBlockBot;
  requestedTarget: Positioned;
  expectedBlockNames: readonly string[];
  replaceable: Set<string>;
}): PlacementTargetResolution {
  const requestedBlock = input.bot.blockAt?.(toVec3(input.requestedTarget));
  if (
    !requestedBlock ||
    input.expectedBlockNames.includes(requestedBlock.name) ||
    isReplaceable(requestedBlock, input.replaceable)
  ) {
    return {
      ok: true,
      targetPosition: input.requestedTarget,
      requestedTargetPosition: input.requestedTarget,
      targetResolution: "requested_target",
      beforeBlock: requestedBlock
    };
  }

  if (isResolvableSupportSurface(requestedBlock)) {
    const aboveTarget = add(input.requestedTarget, { x: 0, y: 1, z: 0 });
    const aboveBlock = input.bot.blockAt?.(toVec3(aboveTarget));
    if (
      !aboveBlock ||
      input.expectedBlockNames.includes(aboveBlock.name) ||
      isReplaceable(aboveBlock, input.replaceable)
    ) {
      return {
        ok: true,
        targetPosition: aboveTarget,
        requestedTargetPosition: input.requestedTarget,
        supportPosition: input.requestedTarget,
        targetResolution: "surface_position_above_requested_target",
        beforeBlock: aboveBlock
      };
    }
    return {
      ok: false,
      targetPosition: input.requestedTarget,
      requestedTargetPosition: input.requestedTarget,
      beforeBlock: aboveBlock,
      reason:
        `place_block target ${requestedBlock.name} looks like a support surface, ` +
        `but the space above contains non-replaceable block ${aboveBlock.name}.`
    };
  }

  return {
    ok: false,
    targetPosition: input.requestedTarget,
    requestedTargetPosition: input.requestedTarget,
    beforeBlock: requestedBlock,
    reason: `place_block target contains non-replaceable block ${requestedBlock.name}.`
  };
}

async function manualMoveToward(bot: PlaceBlockBot, target: Positioned, signal?: AbortSignal) {
  if (!bot.lookAt || !bot.setControlState) {
    return;
  }

  throwIfAborted(signal);
  const beforeDistance = distance(bot.entity.position, target);
  const durationMs = Math.min(1_200, Math.max(300, Math.ceil(beforeDistance * 250)));
  await bot.lookAt(new Vec3(target.x + 0.5, target.y + 0.8, target.z + 0.5), true);
  bot.setControlState("forward", true);
  try {
    await delay(durationMs, signal);
    throwIfAborted(signal);
  } finally {
    bot.setControlState("forward", false);
  }
}

async function moveNearTarget(
  bot: PlaceBlockBot,
  target: Positioned,
  timeoutMs: number,
  approachPosition?: Positioned,
  signal?: AbortSignal
) {
  throwIfAborted(signal);
  const moveTarget = approachPosition ?? target;
  const placementReach = 4.6;
  const alreadyInReach = distance(bot.entity.position, target) <= placementReach;

  if (alreadyInReach) {
    await bot.lookAt?.(new Vec3(target.x + 0.5, target.y + 0.5, target.z + 0.5), true);
    return;
  }

  if (!bot.pathfinder) {
    await bot.lookAt?.(new Vec3(target.x + 0.5, target.y + 0.5, target.z + 0.5), true);
    return;
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  try {
    const goal = new goals.GoalNear(
      moveTarget.x,
      moveTarget.y,
      moveTarget.z,
      approachPosition ? 1 : 2
    );
    await Promise.race([
      bot.pathfinder.goto(goal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          bot.pathfinder?.stop?.();
          reject(new Error(`place_block pathfinder timeout after ${timeoutMs}ms`));
        }, timeoutMs);
        if (signal) {
          onAbort = () => {
            bot.pathfinder?.stop?.();
            reject(new Error("place_block was cancelled while moving near target"));
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }
      })
    ]);
  } catch (error) {
    await manualMoveToward(bot, moveTarget, signal);
    const movedWithinReach = distance(bot.entity.position, target) <= placementReach;
    if (movedWithinReach) {
      await bot.lookAt?.(new Vec3(target.x + 0.5, target.y + 0.5, target.z + 0.5), true);
      return;
    }
    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
    if (onAbort) {
      signal?.removeEventListener("abort", onAbort);
    }
  }

  throwIfAborted(signal);
  await bot.lookAt?.(new Vec3(target.x + 0.5, target.y + 0.5, target.z + 0.5), true);
}

function stopControls(bot: PlaceBlockBot) {
  bot.pathfinder?.stop?.();
  for (const control of ["forward", "back", "left", "right", "jump", "sprint", "sneak"]) {
    bot.setControlState?.(control, false);
  }
}

function findPlacementReference(bot: PlaceBlockBot, targetPosition: Positioned) {
  for (const offset of FACE_OFFSETS) {
    const referencePosition = add(targetPosition, negate(offset));
    const referenceBlock = bot.blockAt?.(toVec3(referencePosition));
    if (isSupportBlock(referenceBlock)) {
      return {
        referenceBlock,
        referencePosition,
        faceVector: offset
      };
    }
  }
  return null;
}

export async function placeBlock({
  bot,
  itemName,
  targetPosition,
  expectedBlockNames = [itemName],
  approachPosition,
  allowReplace = [...DEFAULT_REPLACEABLE_BLOCKS],
  moveTimeoutMs = 6_000,
  inventorySettleMs = 500,
  signal
}: {
  bot: PlaceBlockBot;
  itemName: string;
  targetPosition: Positioned;
  expectedBlockNames?: string[];
  approachPosition?: Positioned;
  allowReplace?: string[];
  moveTimeoutMs?: number;
  inventorySettleMs?: number;
  signal?: AbortSignal;
}): Promise<PlaceBlockResult> {
  const requestedTarget = normalizePosition(targetPosition);
  const normalizedApproach = approachPosition ? normalizePosition(approachPosition) : undefined;
  const expected = expectedBlockNames.length > 0 ? expectedBlockNames : [itemName];
  const replaceable = new Set([...DEFAULT_REPLACEABLE_BLOCKS, ...allowReplace]);
  let targetResolution = resolvePlacementTarget({
    bot,
    requestedTarget,
    expectedBlockNames: expected,
    replaceable
  });
  if (!targetResolution.ok) {
    return {
      status: "blocked",
      itemName,
      targetPosition: targetResolution.targetPosition,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      expectedBlockNames: expected,
      beforeBlockName: targetResolution.beforeBlock?.name,
      beforeCount: countInventoryItem(bot, itemName),
      approachPosition: normalizedApproach,
      reason: targetResolution.reason
    };
  }

  let normalizedTarget = targetResolution.targetPosition;
  let beforeBlock = targetResolution.beforeBlock;
  const beforeCount = countInventoryItem(bot, itemName);

  if (beforeBlock && expected.includes(beforeBlock.name)) {
    return {
      status: "already_present",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: beforeBlock.name,
      afterBlockName: beforeBlock.name,
      beforeCount,
      afterCount: beforeCount,
      inventoryDelta: 0,
      approachPosition: normalizedApproach,
      reason: `place_block target already contains ${beforeBlock.name}.`
    };
  }

  if (!bot.placeBlock || !bot.equip) {
    return {
      status: "blocked",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: beforeBlock?.name,
      beforeCount,
      approachPosition: normalizedApproach,
      reason: "place_block requires Mineflayer equip and placeBlock APIs."
    };
  }

  const inventoryItem = findInventoryItem(bot, itemName);
  if (!inventoryItem) {
    return {
      status: "blocked",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: beforeBlock?.name,
      beforeCount,
      approachPosition: normalizedApproach,
      reason: `place_block requires ${itemName} in inventory.`
    };
  }

  try {
    await bot.equip(inventoryItem, "hand");
    await moveNearTarget(bot, normalizedTarget, moveTimeoutMs, normalizedApproach, signal);
  } catch (error) {
    return {
      status: "blocked",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: beforeBlock?.name,
      beforeCount,
      approachPosition: normalizedApproach,
      reason: error instanceof Error ? error.message : String(error)
    };
  }

  targetResolution = resolvePlacementTarget({
    bot,
    requestedTarget,
    expectedBlockNames: expected,
    replaceable
  });
  if (!targetResolution.ok) {
    return {
      status: "blocked",
      itemName,
      targetPosition: targetResolution.targetPosition,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      expectedBlockNames: expected,
      beforeBlockName: targetResolution.beforeBlock?.name,
      beforeCount,
      approachPosition: normalizedApproach,
      reason: targetResolution.reason
    };
  }
  normalizedTarget = targetResolution.targetPosition;
  beforeBlock = targetResolution.beforeBlock;
  const currentBlock = targetResolution.beforeBlock;
  if (currentBlock && expected.includes(currentBlock.name)) {
    return {
      status: "already_present",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: currentBlock.name,
      afterBlockName: currentBlock.name,
      beforeCount,
      afterCount: beforeCount,
      inventoryDelta: 0,
      approachPosition: normalizedApproach,
      reason: `place_block target already contains ${currentBlock.name}.`
    };
  }

  const reference = findPlacementReference(bot, normalizedTarget);
  if (!reference?.referenceBlock) {
    return {
      status: "blocked",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: currentBlock?.name ?? beforeBlock?.name,
      beforeCount,
      approachPosition: normalizedApproach,
      reason: "place_block found no adjacent support block for placement."
    };
  }

  try {
    throwIfAborted(signal);
    await bot.placeBlock(reference.referenceBlock, reference.faceVector);
  } catch (error) {
    return {
      status: "blocked",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: beforeBlock?.name,
      beforeCount,
      referencePosition: reference.referencePosition,
      faceVector: reference.faceVector,
      approachPosition: normalizedApproach,
      reason: error instanceof Error ? error.message : String(error)
    };
  } finally {
    stopControls(bot);
  }

  const afterBlock = bot.blockAt?.(toVec3(normalizedTarget));
  const afterCount = await waitForInventoryDecrease(bot, itemName, beforeCount, inventorySettleMs, signal);
  const inventoryDelta =
    beforeCount !== undefined && afterCount !== undefined
      ? afterCount - beforeCount
      : undefined;

  if (afterBlock && expected.includes(afterBlock.name)) {
    return {
      status: "placed",
      itemName,
      targetPosition: normalizedTarget,
      requestedTargetPosition: targetResolution.requestedTargetPosition,
      supportPosition: targetResolution.supportPosition,
      targetResolution: targetResolution.targetResolution,
      expectedBlockNames: expected,
      beforeBlockName: beforeBlock?.name,
      afterBlockName: afterBlock.name,
      beforeCount,
      afterCount,
      inventoryDelta,
      referencePosition: reference.referencePosition,
      faceVector: reference.faceVector,
      approachPosition: normalizedApproach,
      reason: `place_block verified ${afterBlock.name} at target position.`
    };
  }

  return {
    status: "blocked",
    itemName,
    targetPosition: normalizedTarget,
    requestedTargetPosition: targetResolution.requestedTargetPosition,
    supportPosition: targetResolution.supportPosition,
    targetResolution: targetResolution.targetResolution,
    expectedBlockNames: expected,
    beforeBlockName: beforeBlock?.name,
    afterBlockName: afterBlock?.name,
    beforeCount,
    afterCount,
    inventoryDelta,
    referencePosition: reference.referencePosition,
    faceVector: reference.faceVector,
    approachPosition: normalizedApproach,
    reason: `place_block did not verify ${expected.join("|")} at target position.`
  };
}
