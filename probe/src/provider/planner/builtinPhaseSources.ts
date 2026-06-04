import type { LongPhaseId } from "../../objectives/longObjective/ladder.js";

/**
 * Repo-authored direct-generated programs used when no LLM planner is selected
 * or when LLM output is empty, blocked, or rejected by the sandbox.
 *
 * This is NOT:
 * - loading an active seed action skill from the gameplay registry;
 * - running a bundled action skill implementation by id.
 *
 * It IS the same execution shape as a generated program (`export async function run(ctx, params)`),
 * but the TypeScript is checked into this repo per long-objective phase.
 */
const builtinSourceByPhase: Partial<Record<LongPhaseId, string>> = {
  craft_current_run_stone_axe_1: `
export async function run(ctx, params) {
  await ctx.ensureItem("wooden_pickaxe", 1);
  await ctx.ensureItem("cobblestone", 3);
  await ctx.ensureItem("stick", 2);
  await ctx.ensureCraftingTableNearby();
  return ctx.craftWithTable("stone_axe", 1);
}
`.trim(),
  craft_current_run_stone_pickaxe_1: `
export async function run(ctx, params) {
  await ctx.ensureItem("wooden_pickaxe", 1);
  await ctx.ensureItem("cobblestone", 3);
  await ctx.ensureItem("stick", 2);
  await ctx.ensureCraftingTableNearby();
  return ctx.craftStonePickaxe(1);
}
`.trim(),
  obtain_current_run_iron_ingot_1: `
export async function run(ctx, params) {
  await ctx.ensureItem("stone_pickaxe", 1);
  await ctx.mineBlock("iron_ore", "raw_iron", 1);
  return ctx.smeltItem("raw_iron", "iron_ingot", 1);
}
`.trim(),
  craft_current_run_iron_pickaxe_1: `
export async function run(ctx, params) {
  await ctx.ensureItem("iron_ingot", 3);
  await ctx.ensureItem("stick", 2);
  await ctx.ensureCraftingTableNearby();
  return ctx.craftWithTable("iron_pickaxe", 1);
}
`.trim(),
  locate_current_run_diamond_ore_1: `
export async function run(ctx, params) {
  const blocks = ctx.scanNearbyBlocks(24);
  const ore = blocks.find((block) =>
    block.name === "diamond_ore" || block.name === "deepslate_diamond_ore"
  );
  return { observed: Boolean(ore), blocks };
}
`.trim(),
  obtain_current_run_diamond_1: `
export async function run(ctx, params) {
  await ctx.ensureItem("iron_pickaxe", 1);
  await ctx.mineBlock("diamond_ore", "diamond", 1);
  return ctx.inspectInventory();
}
`.trim()
};

export function getBuiltinPhaseSource(phaseId: string): string {
  const source = builtinSourceByPhase[phaseId as LongPhaseId];
  if (!source) {
    throw new Error(`No builtin phase source for ${phaseId}`);
  }
  return source;
}
