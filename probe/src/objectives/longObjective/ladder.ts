/**
 * Declarative ladder of direct long-objective probe tasks.
 *
 * @remarks The ladder is capability scaffolding for experiments, not a mandatory
 * CycleGoal sequence for Soul-grounded social simulation.
 */
export type LongObjectiveId =
  | "craft_current_run_stone_pickaxe_1"
  | "obtain_current_run_iron_ingot_1"
  | "craft_current_run_iron_pickaxe_1"
  | "locate_current_run_diamond_ore_1"
  | "obtain_current_run_diamond_1";

export type LongPhaseId =
  | "craft_current_run_stone_axe_1"
  | "craft_current_run_stone_pickaxe_1"
  | "obtain_current_run_iron_ingot_1"
  | "craft_current_run_iron_pickaxe_1"
  | "locate_current_run_diamond_ore_1"
  | "obtain_current_run_diamond_1";

export type LongPhaseDefinition = {
  phaseId: LongPhaseId;
  summary: string;
  targetItemName: string;
  minCount: number;
  verifierKind: "inventory" | "diamond_ore_observation";
  helperHints: string[];
};

const phaseDefinitions: Record<LongPhaseId, LongPhaseDefinition> = {
  craft_current_run_stone_axe_1: {
    phaseId: "craft_current_run_stone_axe_1",
    summary: "Sanity baseline: craft one stone axe in the current run.",
    targetItemName: "stone_axe",
    minCount: 1,
    verifierKind: "inventory",
    helperHints: ["ensureItem", "craftWithTable", "mineBlock"]
  },
  craft_current_run_stone_pickaxe_1: {
    phaseId: "craft_current_run_stone_pickaxe_1",
    summary: "Craft one stone pickaxe for iron mining.",
    targetItemName: "stone_pickaxe",
    minCount: 1,
    verifierKind: "inventory",
    helperHints: ["ensureItem", "craftWithTable", "mineBlock"]
  },
  obtain_current_run_iron_ingot_1: {
    phaseId: "obtain_current_run_iron_ingot_1",
    summary: "Obtain one iron ingot with smelting evidence.",
    targetItemName: "iron_ingot",
    minCount: 1,
    verifierKind: "inventory",
    helperHints: ["mineOre", "smeltItem", "ensureFuel", "ensureFurnaceNearby"]
  },
  craft_current_run_iron_pickaxe_1: {
    phaseId: "craft_current_run_iron_pickaxe_1",
    summary: "Craft one iron pickaxe for diamond mining.",
    targetItemName: "iron_pickaxe",
    minCount: 1,
    verifierKind: "inventory",
    helperHints: ["ensureItem", "craftWithTable"]
  },
  locate_current_run_diamond_ore_1: {
    phaseId: "locate_current_run_diamond_ore_1",
    summary: "Record diamond ore block observation in the current run.",
    targetItemName: "diamond_ore",
    minCount: 1,
    verifierKind: "diamond_ore_observation",
    helperHints: ["scanNearbyBlocks", "descendToYLevel", "branchMineStep", "mineBlock"]
  },
  obtain_current_run_diamond_1: {
    phaseId: "obtain_current_run_diamond_1",
    summary: "Mine diamond with iron pickaxe or better and inventory pickup evidence.",
    targetItemName: "diamond",
    minCount: 1,
    verifierKind: "inventory",
    helperHints: ["mineOre", "scanNearbyBlocks", "branchMineStep"]
  }
};

const objectivePhaseLadders: Record<LongObjectiveId, LongPhaseId[]> = {
  craft_current_run_stone_pickaxe_1: [
    "craft_current_run_stone_axe_1",
    "craft_current_run_stone_pickaxe_1"
  ],
  obtain_current_run_iron_ingot_1: [
    "craft_current_run_stone_axe_1",
    "craft_current_run_stone_pickaxe_1",
    "obtain_current_run_iron_ingot_1"
  ],
  craft_current_run_iron_pickaxe_1: [
    "craft_current_run_stone_axe_1",
    "craft_current_run_stone_pickaxe_1",
    "obtain_current_run_iron_ingot_1",
    "craft_current_run_iron_pickaxe_1"
  ],
  locate_current_run_diamond_ore_1: [
    "craft_current_run_stone_axe_1",
    "craft_current_run_stone_pickaxe_1",
    "obtain_current_run_iron_ingot_1",
    "craft_current_run_iron_pickaxe_1",
    "locate_current_run_diamond_ore_1"
  ],
  obtain_current_run_diamond_1: [
    "craft_current_run_stone_axe_1",
    "craft_current_run_stone_pickaxe_1",
    "obtain_current_run_iron_ingot_1",
    "craft_current_run_iron_pickaxe_1",
    "locate_current_run_diamond_ore_1",
    "obtain_current_run_diamond_1"
  ]
};

export function getLongObjectivePhaseLadder(objectiveId: string): LongPhaseDefinition[] {
  const ladder = objectivePhaseLadders[objectiveId as LongObjectiveId];
  if (!ladder) {
    throw new Error(`Unknown long objective: ${objectiveId}`);
  }

  return ladder.map((phaseId) => phaseDefinitions[phaseId]);
}

export function getLongPhaseDefinition(phaseId: string): LongPhaseDefinition {
  const phase = phaseDefinitions[phaseId as LongPhaseId];
  if (!phase) {
    throw new Error(`Unknown long objective phase: ${phaseId}`);
  }
  return phase;
}
