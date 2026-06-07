/**
 * Verifiers for direct long-objective phase reports.
 *
 * @remarks These checks protect probe reporting from fake success, but they are
 * scoped to direct-objective experiments rather than the social-cycle runtime.
 */
import type { InventoryItem } from "./types.js";
import type { LongPhaseDefinition } from "./ladder.js";

function countInventory(inventory: readonly InventoryItem[], itemName: string) {
  return inventory
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

export function verifyInventoryPhase(input: {
  phase: LongPhaseDefinition;
  preInventory: InventoryItem[];
  postInventory: InventoryItem[];
}) {
  const beforeCount = countInventory(input.preInventory, input.phase.targetItemName);
  const afterCount = countInventory(input.postInventory, input.phase.targetItemName);
  const delta = afterCount - beforeCount;
  const passed =
    afterCount >= input.phase.minCount &&
    (delta > 0 || beforeCount >= input.phase.minCount);

  return {
    itemName: input.phase.targetItemName,
    beforeCount,
    afterCount,
    delta,
    verifierStatus: passed ? ("passed" as const) : ("failed" as const),
    verifierReason: passed
      ? `${input.phase.targetItemName} reached ${afterCount}/${input.phase.minCount} in current-run inventory.`
      : `${input.phase.targetItemName} did not reach ${input.phase.minCount}; before=${beforeCount}, after=${afterCount}, delta=${delta}.`
  };
}

export function verifyDiamondOreObservation(input: {
  phase: LongPhaseDefinition;
  preInventory: InventoryItem[];
  postInventory: InventoryItem[];
  blockObservations: Array<{ name: string; distance: number }>;
  helperEvents: Array<{ name: string; args: unknown[]; status?: string; result?: unknown }>;
}) {
  const inventory = verifyInventoryPhase({
    phase: input.phase,
    preInventory: input.preInventory,
    postInventory: input.postInventory
  });

  const oreNames = new Set(["diamond_ore", "deepslate_diamond_ore"]);
  const observedOre = input.blockObservations.some((block) => oreNames.has(block.name));
  const minedOre = input.helperEvents.some((event) => {
    if (event.name !== "mineBlock" && event.name !== "mineOre") {
      return false;
    }
    const blockName = String(event.args[0] ?? "");
    return oreNames.has(blockName);
  });

  if (observedOre || minedOre) {
    return {
      ...inventory,
      verifierStatus: "passed" as const,
      verifierReason: observedOre
        ? "current-run block scan recorded diamond ore."
        : "current-run mine attempt recorded diamond ore target."
    };
  }

  return {
    ...inventory,
    verifierStatus: "failed" as const,
    verifierReason:
      "no current-run diamond ore observation or mine attempt evidence was recorded."
  };
}

export function verifyPhaseEvidence(input: {
  phase: LongPhaseDefinition;
  preInventory: InventoryItem[];
  postInventory: InventoryItem[];
  blockObservations?: Array<{ name: string; distance: number }>;
  helperEvents?: Array<{ name: string; args: unknown[]; status?: string; result?: unknown }>;
}) {
  if (input.phase.verifierKind === "diamond_ore_observation") {
    return verifyDiamondOreObservation({
      phase: input.phase,
      preInventory: input.preInventory,
      postInventory: input.postInventory,
      blockObservations: input.blockObservations ?? [],
      helperEvents: input.helperEvents ?? []
    });
  }

  return verifyInventoryPhase({
    phase: input.phase,
    preInventory: input.preInventory,
    postInventory: input.postInventory
  });
}
