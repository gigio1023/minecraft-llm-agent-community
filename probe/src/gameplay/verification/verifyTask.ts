import type { ToolResult } from "../../mutual/types.js";
import type { DeterministicTask } from "../curriculum/deterministicCurriculum.js";

type VisibleActor = {
  id: string;
  distance: number;
};

type VerificationObservation = {
  visibleActors?: VisibleActor[];
  inventory?: Array<{ name: string; count: number }>;
  nearbyBlocks?: Array<{ name: string; distance: number }>;
  sharedChest?: {
    chestId: string;
    items: Array<{ name: string; count: number }>;
  };
};

export type TaskVerification = {
  status: "passed" | "progressing" | "failed";
  reason: string;
  progress: Record<string, unknown>;
};

function distanceToActor(observation: VerificationObservation, targetId: string) {
  return observation.visibleActors?.find((actor) => actor.id === targetId)?.distance ?? null;
}

function countItems(observation: VerificationObservation, itemNames: readonly string[]) {
  return observation.inventory
    ?.filter((item) => itemNames.includes(item.name))
    .reduce((sum, item) => sum + item.count, 0) ?? 0;
}

function countNearbyBlocks(observation: VerificationObservation, blockNames: readonly string[]) {
  return observation.nearbyBlocks?.filter((block) => blockNames.includes(block.name)).length ?? null;
}

export function verifyTask(
  task: DeterministicTask,
  input: {
    before: VerificationObservation;
    after: VerificationObservation;
    result: ToolResult;
  }
): TaskVerification {
  if (task.id === "deposit_shared_materials") {
    // Shared storage success is judged from the public chest snapshot, not from
    // the actor's private inventory. That makes the evidence reusable for later
    // multi-actor pressure without trusting a single bot's local state.
    const beforeCount = countItems(
      { inventory: input.before.sharedChest?.items ?? [] },
      task.success.itemNames
    );
    const afterCount = countItems(
      { inventory: input.after.sharedChest?.items ?? [] },
      task.success.itemNames
    );

    if (afterCount >= task.success.targetCount) {
      return {
        status: "passed",
        reason: "deposit_shared_materials made resources visible in shared storage.",
        progress: {
          chestId: task.success.chestId,
          itemNames: [...task.success.itemNames],
          beforeCount,
          afterCount,
          targetCount: task.success.targetCount
        }
      };
    }

    if (afterCount > beforeCount) {
      return {
        status: "progressing",
        reason: "deposit_shared_materials increased shared storage contents.",
        progress: {
          chestId: task.success.chestId,
          itemNames: [...task.success.itemNames],
          beforeCount,
          afterCount,
          targetCount: task.success.targetCount
        }
      };
    }

    return {
      status: "failed",
      reason: "deposit_shared_materials did not change shared storage contents.",
      progress: {
        chestId: task.success.chestId,
        itemNames: [...task.success.itemNames],
        beforeCount,
        afterCount,
        targetCount: task.success.targetCount
      }
    };
  }

  if (
    task.id === "collect_4_logs" ||
    task.id === "craft_crafting_table" ||
    task.id === "craft_wooden_pickaxe" ||
    task.id === "mine_cobblestone"
  ) {
    const beforeCount = countItems(input.before, task.success.itemNames);
    const afterCount = countItems(input.after, task.success.itemNames);
    const beforeNearbyBlockCount =
      task.id === "collect_4_logs" ? countNearbyBlocks(input.before, task.success.itemNames) : null;
    const afterNearbyBlockCount =
      task.id === "collect_4_logs" ? countNearbyBlocks(input.after, task.success.itemNames) : null;
    const toolInventoryDelta =
      (task.id === "collect_4_logs" || task.id === "mine_cobblestone") &&
      typeof input.result.inventoryDelta === "number"
        ? input.result.inventoryDelta
        : null;
    const toolBlockRemoved =
      (task.id === "collect_4_logs" || task.id === "mine_cobblestone") &&
      typeof input.result.blockRemoved === "boolean"
        ? input.result.blockRemoved
        : null;
    const progress = {
      itemNames: [...task.success.itemNames],
      beforeCount,
      afterCount,
      targetCount: task.success.targetCount,
      ...(task.id === "collect_4_logs" || task.id === "mine_cobblestone"
        ? {
            beforeNearbyBlockCount,
            afterNearbyBlockCount,
            ...(toolInventoryDelta !== null ? { toolInventoryDelta } : {}),
            ...(toolBlockRemoved !== null ? { toolBlockRemoved } : {})
          }
        : {})
    };

    const mineBlockHasToolEvidence =
      task.id !== "mine_cobblestone" ||
      (input.result.status === "mined" &&
        toolInventoryDelta !== null &&
        toolInventoryDelta > 0 &&
        toolBlockRemoved === true);

    // Verification is observation-led, but mining must also prove the primitive
    // itself dug a block and produced the inventory delta. This rejects fixture
    // or pickup side effects that make inventory look correct after a blocked
    // mine_block result.
    if (afterCount >= task.success.targetCount && mineBlockHasToolEvidence) {
      return {
        status: "passed",
        reason: `${task.id} reached ${afterCount}/${task.success.targetCount} relevant inventory items.`,
        progress
      };
    }

    if (task.id === "mine_cobblestone" && afterCount >= task.success.targetCount) {
      return {
        status: "failed",
        reason: "mine_cobblestone inventory reached target without a mined block result and positive tool-local delta.",
        progress
      };
    }

    if (afterCount > beforeCount) {
      return {
        status: "progressing",
        reason: `${task.id} increased relevant inventory from ${beforeCount} to ${afterCount}, but target is ${task.success.targetCount}.`,
        progress
      };
    }

    if (
      task.id === "collect_4_logs" &&
      toolInventoryDelta !== null &&
      toolInventoryDelta > 0
    ) {
      return {
        status: "progressing",
        reason: `collect_4_logs tool evidence reports inventory delta ${toolInventoryDelta}, but post-observation has not reached target yet.`,
        progress
      };
    }

    if (
      task.id === "mine_cobblestone" &&
      toolInventoryDelta !== null &&
      toolInventoryDelta > 0
    ) {
      return {
        status: "progressing",
        reason: `mine_cobblestone tool evidence reports inventory delta ${toolInventoryDelta}, but post-observation has not reached target yet.`,
        progress
      };
    }

    return {
      status: "failed",
      reason:
        task.id === "collect_4_logs"
          ? `collect_4_logs saw no relevant inventory increase (${beforeCount} -> ${afterCount}).`
          : task.id === "mine_cobblestone"
            ? `mine_cobblestone saw no cobblestone inventory increase (${beforeCount} -> ${afterCount}).`
          : `${task.id} did not increase the relevant inventory count (${beforeCount} -> ${afterCount}).`,
      progress
    };
  }

  if (task.id === "craft_planks_and_sticks") {
    // This task has two required outputs. Count each output group separately so
    // a bot that only crafts planks does not pass the stick requirement by
    // increasing one material family.
    const outputs = task.success.outputs.map((output) => ({
      itemNames: [...output.itemNames],
      beforeCount: countItems(input.before, output.itemNames),
      afterCount: countItems(input.after, output.itemNames),
      targetCount: output.targetCount
    }));

    if (outputs.every((output) => output.afterCount >= output.targetCount)) {
      return {
        status: "passed",
        reason: "craft_planks_and_sticks produced both planks and sticks.",
        progress: { outputs }
      };
    }

    if (outputs.some((output) => output.afterCount > output.beforeCount)) {
      return {
        status: "progressing",
        reason: "craft_planks_and_sticks produced some required materials.",
        progress: { outputs }
      };
    }

    return {
      status: "failed",
      reason: "craft_planks_and_sticks did not produce the required outputs.",
      progress: { outputs }
    };
  }

  // Mineflayer movement can report an attempted action without a fresh position
  // observation, so approach tasks fail closed unless distance evidence improves.
  const beforeDistance = distanceToActor(input.before, task.targetId);
  const afterDistance = distanceToActor(input.after, task.targetId);

  if (afterDistance !== null && afterDistance <= task.success.maxDistance) {
    return {
      status: "passed",
      reason: `${task.targetId} is within interaction range at distance ${afterDistance}.`,
      progress: {
        targetId: task.targetId,
        beforeDistance,
        afterDistance
      }
    };
  }

  if (
    beforeDistance !== null &&
    afterDistance !== null &&
    afterDistance < beforeDistance
  ) {
    // Getting closer is useful progress evidence, but approach remains
    // incomplete until the post-observation crosses the interaction threshold.
    return {
      status: "progressing",
      reason: `${task.targetId} is closer than before (${beforeDistance} -> ${afterDistance}) but not within ${task.success.maxDistance}.`,
      progress: {
        targetId: task.targetId,
        beforeDistance,
        afterDistance
      }
    };
  }

  return {
    status: "failed",
    reason:
      afterDistance === null
        ? `${task.targetId} had no post-action distance observation, so move_to cannot be verified from the action status alone.`
        : `${task.targetId} did not get closer (${beforeDistance} -> ${afterDistance}).`,
    progress: {
      targetId: task.targetId,
      beforeDistance,
      afterDistance
    }
  };
}
