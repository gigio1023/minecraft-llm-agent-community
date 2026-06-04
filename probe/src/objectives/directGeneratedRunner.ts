import { promises as fs } from "node:fs";
import path from "node:path";

import type { Bot } from "mineflayer";
import { Vec3 } from "vec3";

import { loadProbeConfig, type ProbeConfig } from "../config.js";
import {
  runDirectGeneratedActionSkill,
  type DirectGeneratedActionSkillRunResult,
  type GeneratedActionSkillHelperEvent
} from "../generatedActionSkills/directExecutor.js";
import { loadOpenAICodexAuth } from "../mutual/openaiCodexAuth.js";
import {
  retrieveActorMemoryForObjective,
  writeDirectGeneratedObjectiveMemory
} from "../memory/actorMemory.js";
import { writeProviderInputSnapshot } from "../provider/providerInputStore.js";
import { writeProviderOutputSnapshot } from "../provider/providerOutputStore.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../runtime/actorWorkspacePaths.js";
import { listActiveActorActionSkillRecords } from "../runtime/actorWorkspace.js";
import { writeJson } from "../runtime/actorWorkspaceStore.js";
import {
  enqueueActorReviewJob,
  snapshotActiveActionSkills
} from "../reviewer/reviewerQueue.js";
import { closeBots, createBots } from "../runtime/createBots.js";
import {
  buildLiveSmokeServerContext,
  ensureLiveSmokeServer
} from "../server/liveSmokeServer.js";
import { readManualMinecraftPort } from "../server/manualMinecraftPort.js";
import { execDockerCompose } from "../server/composeCommand.js";
import { collectLogs } from "../tools/collectLogs.js";
import { craftItem } from "../tools/craftItem.js";
import { craftWithTable } from "../tools/craftWithTable.js";
import {
  branchMineStep,
  descendToYLevel,
  ensureFuel,
  ensureFurnaceNearby,
  mineOre,
  scanNearbyBlocks as scanNearbyBlocksHelper,
  smeltItem
} from "../tools/longObjectiveHelpers.js";
import { mineBlock } from "../tools/mineBlock.js";
import { getObjectiveDefinition, type ObjectiveId } from "./registry.js";

type ProviderId = "deterministic" | "openai-codex";

type RconContext = ReturnType<typeof buildLiveSmokeServerContext>;
type RconRunner = (args: string[]) => Promise<void>;

type DirectObjectiveSource = {
  providerId: ProviderId | "deterministic-fallback";
  model: string;
  source: string;
  inputRef?: string;
  outputRef?: string;
  fallbackReason?: string;
};

type InventoryItem = {
  name: string;
  count: number;
};

export type DirectGeneratedObjectiveReport = {
  schema: "direct-generated-objective-report/v1";
  objectiveId: ObjectiveId;
  actorId: string;
  status: "passed" | "failed";
  evidenceScope: "current_run";
  runId: string;
  generated: {
    providerId: string;
    model: string;
    sourcePath?: string;
    providerInputRef?: string;
    providerOutputRef?: string;
    fallbackReason?: string;
    execution: DirectGeneratedActionSkillRunResult;
  };
  evidence: {
    preInventory: InventoryItem[];
    postInventory: InventoryItem[];
    itemName: string;
    beforeCount: number;
    afterCount: number;
    delta: number;
    verifierStatus: "passed" | "failed";
    verifierReason: string;
  };
  artifactRefs: {
    actorWorkspaceTrialPath: string;
    actorMemoryPaths?: string[];
    requestedReportPath?: string;
  };
  nextActions: string[];
};

export type DirectGeneratedObjectiveRunOptions = {
  objectiveId: string;
  actorId?: string;
  provider?: ProviderId;
  reportPath?: string;
  timeoutMs?: number;
};

const sourceEndpoint = "https://chatgpt.com/backend-api/codex/responses";

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  return null;
}

function countInventory(inventory: readonly InventoryItem[], itemName: string) {
  return inventory
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

export function readInventory(bot: Bot): InventoryItem[] {
  return bot.inventory.items().map((item) => ({
    name: item.name,
    count: item.count
  }));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function findInventoryItem(bot: Bot, itemName: string) {
  return bot.inventory.items().find((item) => item.name === itemName);
}

function isAirBlockName(name: string | undefined) {
  return name === "air" || name === "cave_air" || name === "void_air";
}

function normalizeDirectItemName(itemName: string) {
  if (itemName === "planks") {
    return "oak_planks";
  }
  if (itemName === "sticks") {
    return "stick";
  }
  return itemName;
}

const directSubstrateManagedItems = new Set([
  "oak_log",
  "oak_planks",
  "stick",
  "crafting_table",
  "wooden_pickaxe",
  "cobblestone",
  "stone_axe",
  "stone_pickaxe",
  "iron_ingot",
  "iron_pickaxe"
]);

function isDirectSubstrateManagedItem(itemName: string) {
  return directSubstrateManagedItems.has(normalizeDirectItemName(itemName));
}

function directGeneratedStoneAxeFallbackSource() {
  return `
export async function run(ctx, params) {
  await ctx.ensureItem("wooden_pickaxe", 1);
  await ctx.ensureItem("cobblestone", 3);
  await ctx.ensureItem("stick", 2);
  await ctx.ensureCraftingTableNearby();
  return ctx.craftWithTable("stone_axe", 1);
}
`.trim();
}

const tableBoundSubstrateItems = new Set([
  "wooden_pickaxe",
  "stone_axe",
  "stone_pickaxe",
  "iron_pickaxe"
]);

function buildSourcePrompt(input: {
  objectiveId: string;
  actorId: string;
  inventory: InventoryItem[];
  memoryContext?: JsonValue;
}) {
  return [
    "Generate one TypeScript action skill for a Minecraft Mineflayer bot.",
    "Return only TypeScript source. Do not wrap it in markdown.",
    "The source must export async function run(ctx, params).",
    "Use the ctx helper API instead of imports or Node APIs.",
    "Choose your own plan. Do not claim success; the runtime will verify inventory evidence after execution.",
    "Available helpers:",
    "- inspectInventory(): Array<{name:string,count:number}>",
    "- scanNearbyBlocks(): Array<{name:string,distance:number}>",
    "- ensureItem(itemName:string,count:number): Promise<unknown>",
    "- collectLogs(count:number): Promise<unknown>",
    "- craftItem(itemName:string,count?:number): Promise<unknown> // substrate-assisted for early-game prerequisites",
    "- ensureCraftingTableNearby(): Promise<unknown>",
    "- craftWithTable(itemName:string,count?:number): Promise<unknown>",
    "- mineBlock(blockName:string,expectedItemName:string,count?:number): Promise<unknown>",
    "- wait(ms:number): Promise<void>",
    "Objective success criteria: current-run inventory must contain at least one stone_axe after execution.",
    "Use retrieved memory only as hints. It cannot satisfy the objective by itself.",
    JSON.stringify(input)
  ].join("\n");
}

function stripCodeFence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:ts|typescript)?\s*([\s\S]*?)```$/i);
  return (match ? match[1] : trimmed).trim();
}

function readStreamText(payload: string) {
  let text = "";
  for (const rawLine of payload.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) {
      continue;
    }

    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") {
      continue;
    }

    try {
      const event = JSON.parse(data) as {
        delta?: string;
        item?: { content?: { text?: string } };
        content?: { text?: string };
        response?: { output?: Array<{ content?: Array<{ text?: string }> }> };
      };
      if (typeof event.delta === "string") {
        text += event.delta;
      }
      const contentText = event.item?.content?.text ?? event.content?.text;
      if (!text && contentText) {
        text = contentText;
      }
      const completedText = event.response?.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text ?? "")
        .join("");
      if (!text && completedText) {
        text = completedText;
      }
    } catch {
      // Ignore non-JSON stream lines.
    }
  }

  return text.trim();
}

function extractOutputText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const record = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  return record.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => typeof content.text === "string" ? content.text : "")
    .join("")
    .trim() ?? "";
}

async function createRconRunner(rcon: RconContext): Promise<RconRunner> {
  return async (args: string[]) => {
    await execDockerCompose(
      ["-f", rcon.composeFile, "exec", "-T", "mc", "rcon-cli", "--", ...args],
      { cwd: rcon.composeDir, env: rcon.env }
    );
  };
}

export async function prepareStoneAxeFixture(input: {
  bot: Bot;
  spawn: ProbeConfig["spawn"];
  runRcon?: RconRunner;
}) {
  if (!input.runRcon) {
    return;
  }

  const x = String(input.spawn.x);
  const y = String(input.spawn.y);
  const z = String(input.spawn.z);
  await input.runRcon(["op", input.bot.username]);
  await input.runRcon(["tp", input.bot.username, x, y, z]);
  await input.runRcon(["clear", input.bot.username]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "fill", "~-4", "~-1", "~-4", "~8", "~-1", "~4", "stone"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "fill", "~-4", "~0", "~-4", "~8", "~4", "~4", "air"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~2", "~0", "~0", "oak_log"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~-2", "~0", "~0", "oak_log"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~0", "~0", "~2", "oak_log"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~0", "~0", "~-2", "oak_log"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~4", "~0", "~0", "stone"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~4", "~0", "~1", "stone"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~4", "~0", "~-1", "stone"]);
  await input.runRcon(["execute", "at", input.bot.username, "run", "setblock", "~1", "~0", "~2", "crafting_table"]);
}

export async function ensureObjectiveServer(config: ProbeConfig) {
  const manualMinecraftPort = readManualMinecraftPort();
  if (manualMinecraftPort !== undefined) {
    return {
      server: {
        host: "127.0.0.1",
        port: manualMinecraftPort,
        stop: async () => {}
      },
      rconContext: undefined
    };
  }

  const liveSmokeServer = await ensureLiveSmokeServer(config);
  if (!liveSmokeServer.host || !liveSmokeServer.port) {
    throw new Error("Live smoke server did not return a joinable endpoint");
  }

  return {
    server: {
      host: liveSmokeServer.host,
      port: liveSmokeServer.port,
      stop: async () => {}
    },
    rconContext: buildLiveSmokeServerContext(config)
  };
}

function stopBotAction(bot: Bot) {
  bot.pathfinder?.stop?.();
  bot.stopDigging?.();
  for (const control of ["forward", "back", "left", "right", "jump", "sprint", "sneak"]) {
    bot.setControlState(control as Parameters<Bot["setControlState"]>[0], false);
  }
}

function normalizeHelperError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function createDirectContext(
  bot: Bot,
  options: {
    signal?: AbortSignal;
    helperEvents?: GeneratedActionSkillHelperEvent[];
  } = {}
) {
  const recordInternal = async <T>(
    name: string,
    args: unknown[],
    run: () => Promise<T> | T
  ): Promise<T> => {
    options.helperEvents?.push({ name, args, status: "started" });
    try {
      const result = await run();
      options.helperEvents?.push({ name, args, status: "completed", result });
      return result;
    } catch (error) {
      options.helperEvents?.push({ name, args, status: "failed", error: normalizeHelperError(error) });
      throw error;
    }
  };

  const throwIfAborted = () => {
    if (options.signal?.aborted) {
      stopBotAction(bot);
      throw new Error("direct generated action skill was cancelled");
    }
  };

  const findNearbyCraftingTable = () =>
    bot.findBlock({
      matching: (block) => block.name === "crafting_table",
      maxDistance: 5
    });

  const craftWithTablePrimitive = async (itemName: string, count = 1) => {
    itemName = normalizeDirectItemName(itemName);
    const targetCount = Math.max(1, Math.floor(count));
    const results = [];
    while (countInventory(readInventory(bot), itemName) < targetCount) {
      throwIfAborted();
      results.push(await craftWithTable({ bot, itemName }));
      await sleep(250);
    }
    return results.at(-1) ?? {
      status: "already_available",
      itemName,
      count: countInventory(readInventory(bot), itemName)
    };
  };

  const placeCraftingTableNearby = async () => {
    await ensureItem("crafting_table", 1);
    const tableItem = findInventoryItem(bot, "crafting_table");
    if (!tableItem) {
      return { status: "blocked", reason: "no crafting_table item available to place" };
    }

    await bot.equip(tableItem, "hand");
    const base = bot.entity.position.floored();
    const offsets = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1)
    ];

    for (const offset of offsets) {
      throwIfAborted();
      const target = base.plus(offset);
      const support = bot.blockAt(target.offset(0, -1, 0));
      const occupied = bot.blockAt(target);
      if (!support || isAirBlockName(support.name) || !isAirBlockName(occupied?.name)) {
        continue;
      }

      try {
        await bot.placeBlock(support, new Vec3(0, 1, 0));
        const placed = bot.blockAt(target);
        if (placed?.name === "crafting_table") {
          return { status: "placed", position: placed.position };
        }
      } catch {
        continue;
      }
    }

    return { status: "blocked", reason: "could not place crafting_table adjacent to bot" };
  };

  const ensureItem = async (itemName: string, count: number): Promise<unknown> => {
    itemName = normalizeDirectItemName(itemName);
    throwIfAborted();
    const current = countInventory(readInventory(bot), itemName);
    if (current >= count) {
      return { status: "already_available", itemName, count: current };
    }

    if (itemName === "oak_log") {
      return recordInternal("collectLogs", [count], () =>
        collectLogs({ bot, targetCount: count, signal: options.signal })
      );
    }

    if (itemName === "oak_planks" || itemName === "planks") {
      while (countInventory(readInventory(bot), "oak_planks") < count) {
        throwIfAborted();
        const logResult = await ensureItem("oak_log", 1);
        if (countInventory(readInventory(bot), "oak_log") < 1) {
          return {
            status: "blocked",
            itemName: "oak_planks",
            reason: "cannot craft oak_planks because no oak_log is available after collection attempt",
            prerequisite: logResult
          };
        }
        const result = await recordInternal("craftItem", ["oak_planks"], () =>
          craftItem({ bot, itemName: "oak_planks" })
        );
        await sleep(250);
        if (result.status !== "crafted") {
          return result;
        }
      }
      return { status: "available", itemName: "oak_planks", count: countInventory(readInventory(bot), "oak_planks") };
    }

    if (itemName === "stick") {
      while (countInventory(readInventory(bot), "stick") < count) {
        throwIfAborted();
        const planksResult = await ensureItem("oak_planks", 2);
        if (countInventory(readInventory(bot), "oak_planks") < 2) {
          return {
            status: "blocked",
            itemName,
            reason: "cannot craft stick because oak_planks are unavailable after prerequisite attempt",
            prerequisite: planksResult
          };
        }
        const result = await recordInternal("craftItem", ["stick"], () =>
          craftItem({ bot, itemName: "stick" })
        );
        await sleep(250);
        if (result.status !== "crafted") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "crafting_table") {
      const nearbyTable = findNearbyCraftingTable();
      if (nearbyTable) {
        return {
          status: "available_nearby",
          itemName,
          count: current,
          position: nearbyTable.position
        };
      }

      while (countInventory(readInventory(bot), "crafting_table") < count) {
        throwIfAborted();
        const planksResult = await ensureItem("oak_planks", 4);
        if (countInventory(readInventory(bot), "oak_planks") < 4) {
          return {
            status: "blocked",
            itemName,
            reason: "cannot craft crafting_table because oak_planks are unavailable after prerequisite attempt",
            prerequisite: planksResult
          };
        }
        const result = await recordInternal("craftItem", ["crafting_table"], () =>
          craftItem({ bot, itemName: "crafting_table" })
        );
        await sleep(250);
        if (result.status !== "crafted") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "wooden_pickaxe") {
      while (countInventory(readInventory(bot), "wooden_pickaxe") < count) {
        throwIfAborted();
        await ensureItem("stick", 2);
        await ensureItem("oak_planks", 3);
        await recordInternal("ensureCraftingTableNearby", [], () =>
          directContext.ensureCraftingTableNearby()
        );
        const result = await recordInternal("craftWithTable", ["wooden_pickaxe", 1], () =>
          craftWithTablePrimitive("wooden_pickaxe", 1)
        );
        await sleep(250);
        if (typeof result === "object" && result !== null && (result as { status?: unknown }).status === "blocked") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "cobblestone") {
      await ensureItem("wooden_pickaxe", 1);
      while (countInventory(readInventory(bot), "cobblestone") < count) {
        throwIfAborted();
        const missing = count - countInventory(readInventory(bot), "cobblestone");
        const result = await recordInternal("mineBlock", ["stone", "cobblestone", missing], () =>
          directContext.mineBlock("stone", "cobblestone", missing)
        );
        if (typeof result === "object" && result !== null && (result as { status?: unknown }).status === "blocked") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "stone_axe") {
      while (countInventory(readInventory(bot), "stone_axe") < count) {
        throwIfAborted();
        await ensureItem("cobblestone", 3);
        await ensureItem("stick", 2);
        await recordInternal("ensureCraftingTableNearby", [], () =>
          directContext.ensureCraftingTableNearby()
        );
        const result = await recordInternal("craftWithTable", ["stone_axe", 1], () =>
          craftWithTablePrimitive("stone_axe", 1)
        );
        await sleep(250);
        if (typeof result === "object" && result !== null && (result as { status?: unknown }).status === "blocked") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "stone_pickaxe") {
      while (countInventory(readInventory(bot), "stone_pickaxe") < count) {
        throwIfAborted();
        await ensureItem("cobblestone", 3);
        await ensureItem("stick", 2);
        await recordInternal("ensureCraftingTableNearby", [], () =>
          directContext.ensureCraftingTableNearby()
        );
        const result = await recordInternal("craftWithTable", ["stone_pickaxe", 1], () =>
          craftWithTablePrimitive("stone_pickaxe", 1)
        );
        await sleep(250);
        if (typeof result === "object" && result !== null && (result as { status?: unknown }).status === "blocked") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "iron_ingot") {
      while (countInventory(readInventory(bot), "iron_ingot") < count) {
        throwIfAborted();
        await ensureItem("stone_pickaxe", 1);
        const smeltResult = await recordInternal("smeltItem", ["raw_iron", "iron_ingot", 1], () =>
          smeltItem(bot, {
            inputItemName: "raw_iron",
            outputItemName: "iron_ingot",
            count: 1
          })
        );
        if (smeltResult.status === "blocked") {
          return smeltResult;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    if (itemName === "iron_pickaxe") {
      while (countInventory(readInventory(bot), "iron_pickaxe") < count) {
        throwIfAborted();
        await ensureItem("iron_ingot", 3);
        await ensureItem("stick", 2);
        await recordInternal("ensureCraftingTableNearby", [], () =>
          directContext.ensureCraftingTableNearby()
        );
        const result = await recordInternal("craftWithTable", ["iron_pickaxe", 1], () =>
          craftWithTablePrimitive("iron_pickaxe", 1)
        );
        await sleep(250);
        if (typeof result === "object" && result !== null && (result as { status?: unknown }).status === "blocked") {
          return result;
        }
      }
      return { status: "available", itemName, count: countInventory(readInventory(bot), itemName) };
    }

    return { status: "unsupported_item", itemName, count };
  };

  const directContext = {
    inspectInventory() {
      return readInventory(bot);
    },
    scanNearbyBlocks(maxDistance = 16) {
      return scanNearbyBlocksHelper(bot, maxDistance);
    },
    craftStonePickaxe(count = 1) {
      return ensureItem("stone_pickaxe", Math.max(1, Math.floor(count)));
    },
    ensureFurnaceNearby() {
      return ensureFurnaceNearby(bot);
    },
    ensureFuel(minCount = 1) {
      return ensureFuel(bot, minCount);
    },
    smeltItem(inputItemName: string, outputItemName: string, count = 1) {
      return smeltItem(bot, { inputItemName, outputItemName, count });
    },
    mineOre(blockName: string, expectedItemName: string, count = 1) {
      return mineOre(bot, { blockName, expectedItemName, count });
    },
    descendToYLevel(targetY: number) {
      return descendToYLevel(bot, targetY);
    },
    branchMineStep() {
      return branchMineStep(bot);
    },
    ensureItem,
    collectLogs(count = 1) {
      return collectLogs({ bot, targetCount: count, signal: options.signal });
    },
    async craftItem(itemName: string, count = 1) {
      itemName = normalizeDirectItemName(itemName);
      const targetCount = Math.max(1, Math.floor(count));

      if (isDirectSubstrateManagedItem(itemName)) {
        return ensureItem(itemName, targetCount);
      }

      const results = [];
      while (countInventory(readInventory(bot), itemName) < targetCount) {
        throwIfAborted();
        results.push(await craftItem({ bot, itemName }));
        await sleep(250);
      }
      return results.at(-1) ?? {
        status: "already_available",
        itemName,
        count: countInventory(readInventory(bot), itemName)
      };
    },
    async ensureCraftingTableNearby() {
      const table = findNearbyCraftingTable();
      if (!table) {
        const placed = await placeCraftingTableNearby();
        if (placed.status === "blocked") {
          return placed;
        }

        const placedTable = findNearbyCraftingTable();
        if (!placedTable) {
          return { status: "blocked", reason: "crafting_table placement completed but no nearby table was observable" };
        }

        return { status: "available", position: placedTable.position, placement: placed };
      }
      return { status: "available", position: table.position };
    },
    async craftWithTable(itemName: string, count = 1) {
      itemName = normalizeDirectItemName(itemName);
      if (tableBoundSubstrateItems.has(itemName)) {
        return ensureItem(itemName, Math.max(1, Math.floor(count)));
      }
      return craftWithTablePrimitive(itemName, count);
    },
    mineBlock(blockName: string, expectedItemName: string, count = 1) {
      return mineBlock({
        bot,
        blockName,
        itemName: expectedItemName,
        targetCount: count,
        signal: options.signal
      });
    },
    wait(ms: number) {
      const boundedMs = Math.max(0, Math.min(ms, 10_000));
      return new Promise<void>((resolve, reject) => {
        if (options.signal?.aborted) {
          reject(new Error("direct generated wait was cancelled"));
          return;
        }

        let abortHandler: (() => void) | undefined;
        const timeout = setTimeout(() => {
          if (abortHandler) {
            options.signal?.removeEventListener("abort", abortHandler);
          }
          resolve();
        }, boundedMs);
        const onAbort = () => {
          clearTimeout(timeout);
          reject(new Error("direct generated wait was cancelled"));
        };
        abortHandler = onAbort;
        options.signal?.addEventListener("abort", abortHandler, { once: true });
      });
    }
  };

  return directContext;
}

async function generateSource(input: {
  provider: ProviderId;
  actorId: string;
  objectiveId: string;
  inventory: InventoryItem[];
  config: ProbeConfig;
  runId: string;
}): Promise<DirectObjectiveSource> {
  const prompt = buildSourcePrompt({
    objectiveId: input.objectiveId,
    actorId: input.actorId,
    inventory: input.inventory,
    memoryContext: await retrieveActorMemoryForObjective(
      input.config.actorWorkspace.rootDir,
      input.actorId,
      {
        objectiveId: input.objectiveId,
        objectiveCategory: "craft",
        itemNames: ["stone_axe", "wooden_pickaxe", "cobblestone", "stick", "oak_log", "crafting_table"],
        actionSkillIds: getObjectiveDefinition(input.objectiveId).requiredActionSkillIds,
        limit: 6
      }
    ) as unknown as JsonValue
  });
  const paths = getActorWorkspacePaths(input.config.actorWorkspace.rootDir, input.actorId);
  const inputRef = await writeProviderInputSnapshot(input.config.actorWorkspace.rootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: `direct-generated-source-input-${input.runId}`,
    actor_id: input.actorId,
    turn_id: input.runId,
    provider_id: input.provider,
    model: input.config.gameplayProvider.model,
    created_at: new Date().toISOString(),
    input: {
      objective_id: input.objectiveId,
      helper_api: "direct-generated-action-skill-context/v1",
      prompt
    }
  });

  if (input.provider !== "openai-codex") {
    return {
      providerId: "deterministic-fallback",
      model: "deterministic-direct-generated-source",
      source: directGeneratedStoneAxeFallbackSource(),
      inputRef,
      fallbackReason: "provider was deterministic"
    };
  }

  try {
    const auth = await loadOpenAICodexAuth(input.config.liveDialogue.authStorePath);
    const response = await fetch(sourceEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${auth.accessToken}`
      },
      body: JSON.stringify({
        model: input.config.gameplayProvider.model,
        instructions: "Generate concise TypeScript for a Minecraft direct action skill.",
        reasoning: {
          effort: input.config.gameplayProvider.reasoning
        },
        stream: true,
        store: false,
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }]
      })
    });

    const raw = await response.text();
    if (!response.ok) {
      const suffix = raw.trim().length > 0 ? `: ${raw.trim().slice(0, 300)}` : "";
      throw new Error(`direct source provider failed: ${response.status}${suffix}`);
    }

    const text = raw.trim().startsWith("{")
      ? extractOutputText(JSON.parse(raw))
      : readStreamText(raw);
    const source = stripCodeFence(text);
    const outputRef = await writeProviderOutputSnapshot(input.config.actorWorkspace.rootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `direct-generated-source-output-${input.runId}`,
      actor_id: input.actorId,
      turn_id: input.runId,
      provider_id: "openai-codex",
      model: input.config.gameplayProvider.model,
      created_at: new Date().toISOString(),
      raw_output_text: text,
      parsed_output: { source },
      proposal: { source_kind: "direct_generated_ts" }
    });

    return {
      providerId: "openai-codex",
      model: input.config.gameplayProvider.model,
      source,
      inputRef,
      outputRef
    };
  } catch (error) {
    const outputRef = path.join(paths.providerOutputsDir, `direct-generated-source-output-${sanitizeWorkspaceFileId(input.runId)}-fallback.json`);
    await writeJson(outputRef, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `direct-generated-source-output-${input.runId}-fallback`,
      actor_id: input.actorId,
      turn_id: input.runId,
      provider_id: "deterministic-fallback",
      model: "deterministic-direct-generated-source",
      created_at: new Date().toISOString(),
      raw_output_text: "",
      parsed_output: {
        fallback_reason: error instanceof Error ? error.message : String(error)
      },
      proposal: {
        source_kind: "deterministic_fallback"
      }
    });

    return {
      providerId: "deterministic-fallback",
      model: "deterministic-direct-generated-source",
      source: directGeneratedStoneAxeFallbackSource(),
      inputRef,
      outputRef,
      fallbackReason: error instanceof Error ? error.message : String(error)
    };
  }
}

export function verifyStoneAxe(input: {
  objectiveId: ObjectiveId;
  preInventory: InventoryItem[];
  postInventory: InventoryItem[];
}) {
  const objective = getObjectiveDefinition(input.objectiveId);
  const beforeCount = countInventory(input.preInventory, objective.target.itemName);
  const afterCount = countInventory(input.postInventory, objective.target.itemName);
  const delta = afterCount - beforeCount;
  const passed = afterCount >= objective.target.minDelta && (delta > 0 || beforeCount >= objective.target.minDelta);

  return {
    itemName: objective.target.itemName,
    beforeCount,
    afterCount,
    delta,
    verifierStatus: passed ? "passed" as const : "failed" as const,
    verifierReason: passed
      ? `${objective.target.itemName} reached ${afterCount}/${objective.target.minDelta} in current-run inventory.`
      : `${objective.target.itemName} did not reach ${objective.target.minDelta}; before=${beforeCount}, after=${afterCount}, delta=${delta}.`
  };
}

export async function runDirectGeneratedObjective(
  options: DirectGeneratedObjectiveRunOptions
): Promise<DirectGeneratedObjectiveReport> {
  const objective = getObjectiveDefinition(options.objectiveId);
  if (objective.id !== "craft_current_run_stone_axe_1") {
    throw new Error(`Direct generated runner does not support objective yet: ${objective.id}`);
  }

  const actorId = options.actorId ?? objective.actorId;
  const runId = `${objective.id}-${actorId}-${Date.now()}`;
  const config = {
    ...loadProbeConfig(),
    bots: [actorId],
    probeId: `direct_generated_objective_${objective.id}`
  };
  const paths = getActorWorkspacePaths(config.actorWorkspace.rootDir, actorId);
  const artifactDir = path.join(paths.actionSkills.directTrialsDir, sanitizeWorkspaceFileId(runId));
  await fs.mkdir(artifactDir, { recursive: true });

  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let server: { host: string; port: number; stop(): Promise<void> } | null = null;

  try {
    const serverContext = await ensureObjectiveServer(config);
    server = serverContext.server;
    console.log(`minecraft_direct_connect=${server.host}:${server.port}`);
    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });

    const bot = bots[actorId];
    if (!bot) {
      throw new Error(`Direct objective bot roster did not contain actor ${actorId}`);
    }

    const runRcon = serverContext.rconContext
      ? await createRconRunner(serverContext.rconContext)
      : undefined;
    await prepareStoneAxeFixture({ bot, spawn: config.spawn, runRcon });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const preInventory = readInventory(bot);
    const helperEvents: GeneratedActionSkillHelperEvent[] = [];
    const abortController = new AbortController();
    const source = await generateSource({
      provider: options.provider ?? "deterministic",
      actorId,
      objectiveId: objective.id,
      inventory: preInventory,
      config,
      runId
    });
    const execution = await runDirectGeneratedActionSkill({
      actorId,
      skillName: "craftStoneAxe",
      source: source.source,
      ctx: createDirectContext(bot, {
        signal: abortController.signal,
        helperEvents
      }),
      timeoutMs: options.timeoutMs ?? 90_000,
      artifactDir,
      helperEvents,
      onTimeout: async () => {
        abortController.abort();
        stopBotAction(bot);
      }
    });
    const postInventory = readInventory(bot);
    const verification = verifyStoneAxe({
      objectiveId: objective.id,
      preInventory,
      postInventory
    });
    const status = verification.verifierStatus === "passed" ? "passed" : "failed";
    const actorWorkspaceReportPath = path.join(artifactDir, "report.json");
    let report: DirectGeneratedObjectiveReport = {
      schema: "direct-generated-objective-report/v1",
      objectiveId: objective.id,
      actorId,
      status,
      evidenceScope: "current_run",
      runId,
      generated: {
        providerId: source.providerId,
        model: source.model,
        sourcePath: execution.sourcePath,
        providerInputRef: source.inputRef,
        providerOutputRef: source.outputRef,
        fallbackReason: source.fallbackReason,
        execution
      },
      evidence: {
        preInventory,
        postInventory,
        ...verification
      },
      artifactRefs: {
        actorWorkspaceTrialPath: actorWorkspaceReportPath,
        ...(options.reportPath ? { requestedReportPath: options.reportPath } : {})
      },
      nextActions: status === "passed"
        ? ["Review generated source and helper trace for possible bounded recipe cleanup."]
        : ["Inspect generated source, helper events, and verifier reason before retrying the objective."]
    };

    await writeJson(actorWorkspaceReportPath, toJsonValue(report));
    const memoryPaths = await writeDirectGeneratedObjectiveMemory({
      actorWorkspaceRootDir: config.actorWorkspace.rootDir,
      report
    });
    report = {
      ...report,
      artifactRefs: {
        ...report.artifactRefs,
        actorMemoryPaths: memoryPaths
      }
    };
    await writeJson(actorWorkspaceReportPath, toJsonValue(report));
    if (options.reportPath && path.resolve(options.reportPath) !== path.resolve(actorWorkspaceReportPath)) {
      await writeJson(options.reportPath, toJsonValue(report));
    }
    try {
      const activeActionSkills = await listActiveActorActionSkillRecords(
        config.actorWorkspace.rootDir,
        actorId
      );
      await enqueueActorReviewJob(config.actorWorkspace.rootDir, {
        schema: "actor-review-job/v1",
        job_id: `direct-generated-${runId}`,
        actor_id: actorId,
        reason: status === "passed" ? "manual_review" : "verification_failure",
        created_at: new Date().toISOString(),
        input_refs: [
          { kind: "action_skill_direct_trial" as const, ref: actorWorkspaceReportPath },
          ...(source.inputRef ? [{ kind: "provider_input" as const, ref: source.inputRef }] : [])
        ],
        active_action_skill_snapshot: snapshotActiveActionSkills(activeActionSkills)
      });
    } catch (error) {
      console.warn(`reviewer_enqueue_failed=${error instanceof Error ? error.message : String(error)}`);
    }
    return report;
  } finally {
    if (bots) {
      await closeBots(bots);
    }
    if (server) {
      await server.stop();
    }
  }
}
