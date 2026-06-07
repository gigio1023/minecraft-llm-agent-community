/**
 * Registry for direct objective probe definitions.
 *
 * @remarks Objective probes are useful for Mineflayer capability checks, but
 * they should not define the social runtime's CycleGoal sequence.
 */
import type { AllowedTool } from "../tools/index.js";

export type ObjectiveId =
  | "collect_current_run_oak_log_1"
  | "mine_current_run_cobblestone_1"
  | "inspect_then_deposit_oak_log_1"
  | "craft_current_run_stone_axe_1";

export type ObjectiveDefinition = {
  id: ObjectiveId;
  summary: string;
  actorId: string;
  requiredActionSkillIds: string[];
  allowedPrimitives: AllowedTool[];
  target: {
    itemName: string;
    minDelta: number;
  };
};

const objectiveDefinitions = {
  collect_current_run_oak_log_1: {
    id: "collect_current_run_oak_log_1",
    summary: "Collect at least one log from the current Minecraft run.",
    actorId: "npc_b",
    requiredActionSkillIds: ["collectLogs"],
    allowedPrimitives: ["observe", "collect_logs", "remember"],
    target: {
      itemName: "oak_log",
      minDelta: 1
    }
  },
  mine_current_run_cobblestone_1: {
    id: "mine_current_run_cobblestone_1",
    summary: "Mine at least one cobblestone with current-run evidence.",
    actorId: "npc_b",
    requiredActionSkillIds: ["mineCobblestone"],
    allowedPrimitives: ["observe", "mine_block", "remember"],
    target: {
      itemName: "cobblestone",
      minDelta: 1
    }
  },
  inspect_then_deposit_oak_log_1: {
    id: "inspect_then_deposit_oak_log_1",
    summary: "Deposit at least one log into the shared chest with actor ledger evidence.",
    actorId: "npc_b",
    requiredActionSkillIds: ["inspectSharedChest", "depositSharedItems"],
    allowedPrimitives: ["observe", "inspect_chest", "deposit_shared", "remember"],
    target: {
      itemName: "oak_log",
      minDelta: 1
    }
  },
  craft_current_run_stone_axe_1: {
    id: "craft_current_run_stone_axe_1",
    summary: "Craft one stone axe through a direct generated TypeScript action skill.",
    actorId: "npc_b",
    requiredActionSkillIds: ["directGeneratedCraftStoneAxe"],
    allowedPrimitives: ["observe", "collect_logs", "craft_item", "craft_with_table", "mine_block", "wait", "remember"],
    target: {
      itemName: "stone_axe",
      minDelta: 1
    }
  }
} as const satisfies Record<ObjectiveId, ObjectiveDefinition>;

export function listObjectiveDefinitions() {
  return Object.values(objectiveDefinitions);
}

export function getObjectiveDefinition(id: string): ObjectiveDefinition {
  const objective = objectiveDefinitions[id as ObjectiveId];
  if (!objective) {
    throw new Error(`Unknown objective: ${id}`);
  }

  return objective;
}
