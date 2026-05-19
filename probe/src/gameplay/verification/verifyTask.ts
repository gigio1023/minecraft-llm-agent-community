import type { ToolResult } from "../../mutual/types.js";
import type { DeterministicTask } from "../curriculum/deterministicCurriculum.js";

type VisibleActor = {
  id: string;
  distance: number;
};

type VerificationObservation = {
  visibleActors?: VisibleActor[];
  inventory?: Array<{ name: string; count: number }>;
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

export function verifyTask(
  task: DeterministicTask,
  input: {
    before: VerificationObservation;
    after: VerificationObservation;
    result: ToolResult;
  }
): TaskVerification {
  if (task.id === "deposit_shared_materials") {
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

  if (task.id === "collect_4_logs" || task.id === "craft_crafting_table") {
    const beforeCount = countItems(input.before, task.success.itemNames);
    const afterCount = countItems(input.after, task.success.itemNames);

    if (afterCount >= task.success.targetCount) {
      return {
        status: "passed",
        reason: `${task.id} reached the target inventory count.`,
        progress: {
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
        reason: `${task.id} increased the relevant inventory count.`,
        progress: {
          itemNames: [...task.success.itemNames],
          beforeCount,
          afterCount,
          targetCount: task.success.targetCount
        }
      };
    }

    return {
      status: "failed",
      reason: `${task.id} did not increase the relevant inventory count.`,
      progress: {
        itemNames: [...task.success.itemNames],
        beforeCount,
        afterCount,
        targetCount: task.success.targetCount
      }
    };
  }

  if (task.id === "craft_planks_and_sticks") {
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

  const beforeDistance = distanceToActor(input.before, task.targetId);
  const afterDistance = distanceToActor(input.after, task.targetId);

  if (afterDistance !== null && afterDistance <= task.success.maxDistance) {
    return {
      status: "passed",
      reason: `${task.targetId} is within interaction range.`,
      progress: {
        targetId: task.targetId,
        beforeDistance,
        afterDistance
      }
    };
  }

  if (input.result.status === "arrived") {
    return {
      status: "passed",
      reason: `${task.targetId} reported as reached by the runtime action.`,
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
    return {
      status: "progressing",
      reason: `${task.targetId} is closer than before.`,
      progress: {
        targetId: task.targetId,
        beforeDistance,
        afterDistance
      }
    };
  }

  return {
    status: "failed",
    reason: `${task.targetId} did not get closer.`,
    progress: {
      targetId: task.targetId,
      beforeDistance,
      afterDistance
    }
  };
}
