import { readFileSync } from "node:fs";

import type OpenAI from "openai";

import { assertDirectGeneratedActionSkillSource } from "../src/generatedActionSkills/directExecutor.js";
import { getLongPhaseDefinition, type LongPhaseId } from "../src/objectives/longObjective/ladder.js";

export type MatrixPhaseId = LongPhaseId | "mine_current_run_cobblestone_3";

export type MatrixPhase = {
  phaseId: MatrixPhaseId;
  summary: string;
  targetItemName: string;
  minCount: number;
  helperHints: string[];
};

export const MATRIX_PHASES: MatrixPhase[] = [
  {
    phaseId: "craft_current_run_stone_pickaxe_1",
    ...pickPhase("craft_current_run_stone_pickaxe_1")
  },
  {
    phaseId: "obtain_current_run_iron_ingot_1",
    ...pickPhase("obtain_current_run_iron_ingot_1")
  },
  {
    phaseId: "mine_current_run_cobblestone_3",
    summary:
      "Locate nearby stone blocks and mine cobblestone in the current run (scan, path, mine).",
    targetItemName: "cobblestone",
    minCount: 3,
    helperHints: ["scanNearbyBlocks", "mineBlock", "ensureItem", "inspectInventory"]
  }
];

function pickPhase(phaseId: LongPhaseId) {
  const phase = getLongPhaseDefinition(phaseId);
  return {
    summary: phase.summary,
    targetItemName: phase.targetItemName,
    minCount: phase.minCount,
    helperHints: phase.helperHints
  };
}

export const SYSTEM_CODEGEN = [
  "You are a Minecraft Mineflayer direct-generated action skill planner.",
  "Return only TypeScript source. Do not wrap in markdown or <thought> tags.",
  "Export exactly: export async function run(ctx) { ... }",
  "Never use import, require, eval, or Node APIs.",
  "Use ctx helpers: scanNearbyBlocks, mineBlock, ensureItem, craftWithTable, mineOre, smeltItem, ensureCraftingTableNearby, craftStonePickaxe, inspectInventory."
].join("\n");

export const SYSTEM_STRUCTURED = [
  "You propose one Mineflayer runtime primitive for the current phase.",
  "Respond only via the required JSON schema.",
  "Pick a tool appropriate for finding and mining stone when the phase requires cobblestone or mining."
].join("\n");

/** OpenAI Structured Outputs (strict json_schema). */
export const TOOL_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    tool: {
      type: "string",
      enum: [
        "mineBlock",
        "scanNearbyBlocks",
        "ensureItem",
        "craftWithTable",
        "mineOre",
        "smeltItem",
        "inspectInventory"
      ]
    },
    args: {
      type: "object",
      properties: {
        blockName: { type: "string" },
        expectedItemName: { type: "string" },
        count: { type: "number" },
        maxDistance: { type: "number" },
        itemName: { type: "string" }
      },
      required: ["blockName", "expectedItemName", "count", "maxDistance", "itemName"],
      additionalProperties: false
    },
    why: { type: "string" }
  },
  required: ["tool", "args", "why"],
  additionalProperties: false
} as const;

/** Genai `responseSchema` (JSON Schema subset). */
export const TOOL_PROPOSAL_GENAI_SCHEMA = {
  type: "object",
  properties: {
    tool: { type: "string" },
    args: {
      type: "object",
      properties: {
        blockName: { type: "string" },
        expectedItemName: { type: "string" },
        count: { type: "number" },
        maxDistance: { type: "number" },
        itemName: { type: "string" }
      }
    },
    why: { type: "string" }
  },
  required: ["tool", "args", "why"]
};

export function buildUserContent(phase: MatrixPhase): string {
  return [
    `Phase objective: ${phase.summary}`,
    `Success criteria: current-run evidence for ${phase.targetItemName} >= ${phase.minCount}`,
    `Helper hints: ${phase.helperHints.join(", ")}`,
    JSON.stringify({
      objective_id: "planner-provider-matrix",
      phase_id: phase.phaseId,
      actor_id: "npc_b",
      inventory: [
        { name: "stone_axe", count: 1 },
        { name: "wooden_pickaxe", count: 1 }
      ],
      nearby_context: "surface stone and logs may be present; prefer scanNearbyBlocks before mineBlock",
      memory: null
    })
  ].join("\n");
}

export function buildOpenAiMessages(
  phase: MatrixPhase,
  mode: "codegen_ts" | "json_schema"
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: mode === "codegen_ts" ? SYSTEM_CODEGEN : SYSTEM_STRUCTURED },
    { role: "user", content: buildUserContent(phase) }
  ];
}

export function sandboxTs(text: string): "PASS" | "EMPTY" | `FAIL: ${string}` {
  const trimmed = text.trim();
  if (!trimmed) return "EMPTY";
  try {
    assertDirectGeneratedActionSkillSource(trimmed);
    return "PASS";
  } catch (error) {
    return `FAIL: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function evaluateToolJson(text: string) {
  try {
    const parsed = JSON.parse(text) as { tool?: unknown; args?: unknown; why?: unknown };
    return {
      jsonParseOk: true,
      jsonHasToolArgs:
        typeof parsed.tool === "string" &&
        typeof parsed.args === "object" &&
        parsed.args !== null &&
        !Array.isArray(parsed.args)
    };
  } catch {
    return { jsonParseOk: false, jsonHasToolArgs: false };
  }
}

export function loadRepoDotEnv(repoRoot: string, options?: { overrideKeys?: string[] }) {
  const override = new Set(options?.overrideKeys ?? ["OPENAI_API_KEY", "GEMINI_API_KEY"]);
  try {
    const raw = readFileSync(`${repoRoot}/.env`, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq);
      if (process.env[key] && !override.has(key)) continue;
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // optional .env
  }
}
