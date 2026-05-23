import path from "node:path";

import { assertDirectGeneratedActionSkillSource } from "../src/generatedActionSkills/directExecutor.js";
import { getLongPhaseDefinition } from "../src/objectives/longObjective/ladder.js";
import type { ObjectivePlannerPathId } from "../src/provider/planner/types.js";
import { callGeminiLivePlanner } from "../src/provider/gemini/geminiLivePlanner.js";

type TrialResult = {
  pathMode: string;
  trial: number;
  selectedPath?: string;
  model?: string;
  attemptedPaths: string[];
  errorKind?: string;
  textLength: number;
  hasRunExport: boolean;
  sandboxOk: boolean;
  sandboxError?: string;
  preview: string;
};

function buildMineflayerPhasePrompt() {
  const phase = getLongPhaseDefinition("craft_current_run_stone_pickaxe_1");
  return [
    "Generate one TypeScript action skill for a Minecraft Mineflayer bot.",
    "Return only TypeScript source. Do not wrap it in markdown.",
    "The source must export exactly: export async function run(ctx) { ... }",
    "Never use import, require, eval, or Node APIs.",
    "Use the ctx helper API instead of imports or Node APIs.",
    "Do not claim success; runtime verifiers decide pass/fail from current-run evidence.",
    "Available helpers include:",
    "- inspectInventory(), scanNearbyBlocks(maxDistance?)",
    "- ensureItem(itemName,count), collectLogs(count), craftItem(itemName,count?)",
    "- ensureCraftingTableNearby(), craftWithTable(itemName,count?)",
    "- craftStonePickaxe(count?), mineBlock(blockName,expectedItemName,count?)",
    "- ensureFurnaceNearby(), ensureFuel(minCount?), smeltItem(inputItem,outputItem,count?)",
    "- mineOre(blockName,expectedItemName,count?), descendToYLevel(y), branchMineStep()",
    "- wait(ms)",
    `Phase objective: ${phase.summary}`,
    `Success criteria: current-run evidence for ${phase.targetItemName} >= ${phase.minCount}`,
    `Helper hints: ${phase.helperHints.join(", ")}`,
    JSON.stringify({
      objective_id: "craft_current_run_stone_pickaxe_1",
      phase_id: phase.phaseId,
      actor_id: "npc_b",
      inventory: [{ name: "stone_axe", count: 1 }],
      memory: null
    })
  ].join("\n");
}

function validateSource(text: string) {
  const trimmed = text.trim();
  const hasRunExport = /export\s+async\s+function\s+run\s*\(/.test(trimmed);
  try {
    assertDirectGeneratedActionSkillSource(trimmed);
    return { hasRunExport, sandboxOk: true as const, sandboxError: undefined };
  } catch (error) {
    return {
      hasRunExport,
      sandboxOk: false as const,
      sandboxError: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runTrial(input: {
  pathMode: string;
  trial: number;
  forcePath?: ObjectivePlannerPathId;
  prompt: string;
  actorWorkspaceRootDir: string;
  repoRoot: string;
}): Promise<TrialResult> {
  const turnId = `codegen-validate-${input.pathMode}-${input.trial}-${Date.now()}`;
  const result = await callGeminiLivePlanner({
    actorId: "npc_b",
    turnId,
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    prompt: input.prompt,
    repoRoot: input.repoRoot,
    forcePath: input.forcePath
  });

  const validation = validateSource(result.text);
  const preview = result.text.trim().replace(/\s+/g, " ").slice(0, 160);

  return {
    pathMode: input.pathMode,
    trial: input.trial,
    selectedPath: result.selectedPath,
    model: result.model,
    attemptedPaths: result.attemptedPaths,
    errorKind: result.errorKind,
    textLength: result.text.length,
    preview,
    ...validation
  };
}

async function main() {
  const repoRoot = path.resolve(process.cwd(), "..");
  const actorWorkspaceRootDir = path.join(repoRoot, "data/actors");
  const prompt = buildMineflayerPhasePrompt();

  const scenarios: Array<{ pathMode: string; forcePath?: ObjectivePlannerPathId; trials: number }> =
    [
      { pathMode: "text-genai", forcePath: "text-genai", trials: 2 },
      { pathMode: "live-transcription", forcePath: "live-transcription", trials: 2 },
      { pathMode: "default-order", trials: 1 }
    ];

  const results: TrialResult[] = [];
  for (const scenario of scenarios) {
    for (let trial = 1; trial <= scenario.trials; trial += 1) {
      console.log(`running ${scenario.pathMode} trial ${trial}...`);
      results.push(
        await runTrial({
          pathMode: scenario.pathMode,
          trial,
          forcePath: scenario.forcePath,
          prompt,
          actorWorkspaceRootDir,
          repoRoot
        })
      );
    }
  }

  console.log("\n=== Gemini Mineflayer codegen validation ===\n");
  console.log(
    "pathMode\ttrial\tselectedPath\tmodel\ttextLen\trunExport\tsandbox\terrorKind"
  );
  for (const row of results) {
    console.log(
      [
        row.pathMode,
        row.trial,
        row.selectedPath ?? "-",
        row.model ?? "-",
        row.textLength,
        row.hasRunExport ? "yes" : "no",
        row.sandboxOk ? "PASS" : "FAIL",
        row.errorKind ?? row.sandboxError ?? "-"
      ].join("\t")
    );
    if (row.textLength > 0) {
      console.log(`  preview: ${row.preview}`);
    }
    console.log("");
  }

  const sandboxPass = results.filter((r) => r.sandboxOk).length;
  const withText = results.filter((r) => r.textLength > 0).length;
  console.log(`summary: ${sandboxPass}/${results.length} sandbox PASS, ${withText}/${results.length} non-empty text`);

  process.exitCode = sandboxPass > 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
