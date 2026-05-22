import type { ToolResult } from "../mutual/types.js";
import type { DeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";
import type { JsonValue } from "./inputSnapshot.js";

type Proposal = {
  tool: string;
  args?: Record<string, unknown>;
};

function isBusyResult(lastResult: ToolResult) {
  return lastResult.status === "busy";
}

type NextInput = {
  observation?: Record<string, unknown> & {
    inventory?: Array<{ name: string; count: number }>;
    visibleActors?: Array<{ id: string; distance: number }>;
  };
  lastResult: ToolResult | null;
  currentTask?: DeterministicTask | null;
  goalStack?: JsonValue;
  activeActionSkillContext?: {
    activeSkillIds: string[];
    allowedPrimitives: string[];
  };
  actorProviderContext?: JsonValue;
};

function readVisibleTargetId(input: NextInput) {
  return input.observation?.visibleActors?.[0]?.id;
}

function countItems(observation: NextInput["observation"], names: readonly string[]) {
  return observation?.inventory
    ?.filter((item) => names.includes(item.name))
    .reduce((sum, item) => sum + item.count, 0) ?? 0;
}

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

const SHARED_DEPOSIT_ITEM_PREFERENCE = [
  "crafting_table",
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log",
  ...PLANK_ITEM_NAMES
] as const;

function hasNoToolResult(input: NextInput) {
  return input.lastResult === null;
}

function readPreferredDepositItem(input: NextInput) {
  const inventory = input.observation?.inventory ?? [];

  return SHARED_DEPOSIT_ITEM_PREFERENCE.find((itemName) =>
    inventory.some((item) => item.name === itemName && item.count > 0)
  ) ?? "crafting_table";
}

export function createDeterministicProvider() {
  return {
    next(input: NextInput): Proposal {
      if (hasNoToolResult(input)) {
        return { tool: "observe", args: {} };
      }

      const lastResult = input.lastResult;

      if (!lastResult) {
        return { tool: "observe", args: {} };
      }

      if (input.currentTask?.id === "collect_4_logs") {
        // Deterministic mode is deliberately boring: repeat the owned primitive
        // until runtime evidence either verifies progress or records a blocker.
        if (lastResult.tool === "collect_logs" && lastResult.status === "blocked") {
          return {
            tool: "remember",
            args: { note: "collect_4_logs was blocked repeatedly" }
          };
        }

        return { tool: "collect_logs", args: { targetCount: 4 } };
      }

      if (input.currentTask?.id === "craft_planks_and_sticks") {
        if (lastResult.tool === "craft_item" && lastResult.status === "blocked") {
          return {
            tool: "remember",
            args: { note: "craft_planks_and_sticks was blocked repeatedly" }
          };
        }

        // Inventory observation drives the next craft step; the provider does
        // not assume that a previous craft result changed state.
        if (countItems(input.observation, PLANK_ITEM_NAMES) < 4) {
          return {
            tool: "craft_item",
            args: { itemName: "planks" }
          };
        }

        return {
          tool: "craft_item",
          args: { itemName: "stick" }
        };
      }

      if (input.currentTask?.id === "craft_crafting_table") {
        if (lastResult.tool === "craft_item" && lastResult.status === "blocked") {
          return {
            tool: "remember",
            args: { note: "craft_crafting_table was blocked repeatedly" }
          };
        }

        return {
          tool: "craft_item",
          args: { itemName: "crafting_table" }
        };
      }

      if (input.currentTask?.id === "deposit_shared_materials") {
        if (lastResult.tool === "deposit_shared" && lastResult.status === "blocked") {
          return {
            tool: "remember",
            args: { note: "deposit_shared_materials was blocked repeatedly" }
          };
        }

        return {
          tool: "deposit_shared",
          args: {
            chestId: input.currentTask.success.chestId,
            itemName: readPreferredDepositItem(input),
            count: 1
          }
        };
      }

      if (input.currentTask?.id === "approach_visible_target") {
        if (lastResult.tool === "observe") {
          return { tool: "move_to", args: { target: input.currentTask.targetId } };
        }

        if (lastResult.tool === "move_to") {
          if (lastResult.status === "blocked") {
            return {
              tool: "remember",
              args: { note: `approach to ${input.currentTask.targetId} was blocked repeatedly` }
            };
          }

          return { tool: "move_to", args: { target: input.currentTask.targetId } };
        }
      }

      if (lastResult.tool === "deposit_shared") {
        return {
          tool: "remember",
          args: { note: "shared chest now has a public resource contribution" }
        };
      }

      if (lastResult.tool === "collect_logs") {
        return {
          tool: "remember",
          args: { note: "collect_4_logs completed with runtime inventory evidence" }
        };
      }

      if (lastResult.tool === "craft_item") {
        return {
          tool: "remember",
          args: { note: "crafted the first early-game workstation" }
        };
      }

      if (lastResult.tool === "observe") {
        const targetId = readVisibleTargetId(input);

        // No visible actor is a real terminal observation for this social probe,
        // not a reason to wander and invent social progress.
        if (!targetId) {
          return {
            tool: "remember",
            args: { note: "no visible actor was available for the next social step" }
          };
        }

        return { tool: "move_to", args: { target: targetId } };
      }

      if (lastResult.tool === "move_to") {
        const targetId = readVisibleTargetId(input);

        if (!targetId) {
          return {
            tool: "remember",
            args: { note: "no visible actor remained after movement" }
          };
        }

        return {
          tool: "say",
          args: { target: targetId, text: `hi ${targetId}, are you free?` }
        };
      }

      if (lastResult.tool === "say" && isBusyResult(lastResult)) {
        return {
          tool: "wait",
          args: { ticks: 20, reason: "npc_b was busy" }
        };
      }

      if (lastResult.tool === "wait") {
        return {
          tool: "say",
          args: {
            target: readVisibleTargetId(input) ?? "npc_b",
            text: "checking again when you are ready"
          }
        };
      }

      return {
        tool: "remember",
        args: { note: "npc_b responded after one busy turn" }
      };
    }
  };
}
