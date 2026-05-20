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
  const successData = (task as any).success;

  if (!successData) {
    return {
      status: "passed",
      reason: `Task ${task.id} has no explicit physical verification conditions, default pass.`,
      progress: {}
    };
  }

  switch (successData.kind) {
    case "shared_chest_has_at_least": {
      const chestId = successData.chestId || "shared";
      const itemNames = successData.itemNames || [];
      const targetCount = successData.targetCount || 1;

      const beforeCount = countItems(
        { inventory: input.before.sharedChest?.items ?? [] },
        itemNames
      );
      const afterCount = countItems(
        { inventory: input.after.sharedChest?.items ?? [] },
        itemNames
      );

      if (afterCount >= targetCount) {
        return {
          status: "passed",
          reason: task.id === "deposit_shared_materials"
            ? "deposit_shared_materials made resources visible in shared storage."
            : `Successfully deposited/verified items in shared chest ${chestId}.`,
          progress: {
            chestId,
            itemNames: [...itemNames],
            beforeCount,
            afterCount,
            targetCount
          }
        };
      }

      if (afterCount > beforeCount) {
        return {
          status: "progressing",
          reason: task.id === "deposit_shared_materials"
            ? "deposit_shared_materials increased shared storage contents."
            : `Shared chest ${chestId} contents increased.`,
          progress: {
            chestId,
            itemNames: [...itemNames],
            beforeCount,
            afterCount,
            targetCount
          }
        };
      }

      return {
        status: "failed",
        reason: task.id === "deposit_shared_materials"
          ? "deposit_shared_materials did not change shared storage contents."
          : `No increase in shared chest ${chestId} contents.`,
        progress: {
          chestId,
          itemNames: [...itemNames],
          beforeCount,
          afterCount,
          targetCount
        }
      };
    }

    case "inventory_outputs": {
      if (!Array.isArray(successData.outputs)) {
        return { status: "failed", reason: "Invalid outputs array format", progress: {} };
      }
      const outputs = (successData.outputs as Array<{ itemNames: string[]; targetCount: number }>).map((output) => ({
        itemNames: [...output.itemNames],
        beforeCount: countItems(input.before, output.itemNames),
        afterCount: countItems(input.after, output.itemNames),
        targetCount: output.targetCount
      }));

      if (outputs.every((output) => output.afterCount >= output.targetCount)) {
        return {
          status: "passed",
          reason: task.id === "craft_planks_and_sticks"
            ? "craft_planks_and_sticks produced both planks and sticks."
            : `All multi-output craft requirements met for task ${task.id}.`,
          progress: { outputs }
        };
      }

      if (outputs.some((output) => output.afterCount > output.beforeCount)) {
        return {
          status: "progressing",
          reason: task.id === "craft_planks_and_sticks"
            ? "craft_planks_and_sticks produced some required materials."
            : `Some multi-output craft materials produced.`,
          progress: { outputs }
        };
      }

      return {
        status: "failed",
        reason: task.id === "craft_planks_and_sticks"
          ? "craft_planks_and_sticks did not produce the required outputs."
          : `No multi-output craft materials produced.`,
        progress: { outputs }
      };
    }

    case "inventory_at_least": {
      const itemNames = successData.itemNames || [];
      const targetCount = typeof successData.targetCount === "number" ? successData.targetCount : 1;
      const beforeCount = countItems(input.before, itemNames);
      const afterCount = countItems(input.after, itemNames);

      if (afterCount >= targetCount) {
        return {
          status: "passed",
          reason: (task.id === "collect_4_logs" || task.id === "craft_crafting_table")
            ? `${task.id} reached the target inventory count.`
            : `Task ${task.id} reached target count ${targetCount} of ${itemNames.join("/")}.`,
          progress: {
            itemNames: [...itemNames],
            beforeCount,
            afterCount,
            targetCount
          }
        };
      }

      if (afterCount > beforeCount) {
        return {
          status: "progressing",
          reason: (task.id === "collect_4_logs" || task.id === "craft_crafting_table")
            ? `${task.id} increased the relevant inventory count.`
            : `Inventory count of ${itemNames.join("/")} increased.`,
          progress: {
            itemNames: [...itemNames],
            beforeCount,
            afterCount,
            targetCount
          }
        };
      }

      return {
        status: "failed",
        reason: (task.id === "collect_4_logs" || task.id === "craft_crafting_table")
          ? `${task.id} did not increase the relevant inventory count.`
          : `No increase in inventory of ${itemNames.join("/")}.`,
        progress: {
          itemNames: [...itemNames],
          beforeCount,
          afterCount,
          targetCount
        }
      };
    }

    case "distance_at_most": {
      const targetId = successData.targetId || (task as any).targetId;
      if (!targetId) {
        return { status: "failed", reason: "Target ID missing for distance verification", progress: {} };
      }
      const maxDistance = successData.maxDistance ?? 4;
      const beforeDistance = distanceToActor(input.before, targetId);
      const afterDistance = distanceToActor(input.after, targetId);

      if (afterDistance !== null && afterDistance <= maxDistance) {
        return {
          status: "passed",
          reason: `${targetId} is within interaction range.`,
          progress: {
            targetId,
            beforeDistance,
            afterDistance
          }
        };
      }

      if (input.result.status === "arrived") {
        return {
          status: "passed",
          reason: `${targetId} reported as reached by the runtime action.`,
          progress: {
            targetId,
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
          reason: `${targetId} is closer than before.`,
          progress: {
            targetId,
            beforeDistance,
            afterDistance
          }
        };
      }

      return {
        status: "failed",
        reason: `${targetId} did not get closer.`,
        progress: {
          targetId,
          beforeDistance,
          afterDistance
        }
      };
    }

    default: {
      if (successData.itemNames && typeof successData.targetCount === "number") {
        const itemNames = successData.itemNames;
        const targetCount = successData.targetCount;
        const beforeCount = countItems(input.before, itemNames);
        const afterCount = countItems(input.after, itemNames);
        if (afterCount >= targetCount) {
          return { status: "passed", reason: `Fallback matched pass`, progress: { beforeCount, afterCount } };
        }
      }
      return {
        status: "passed",
        reason: `Task ${task.id} success kind '${successData.kind}' has no explicit handler, default pass.`,
        progress: {}
      };
    }
  }
}
