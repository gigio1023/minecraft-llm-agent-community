import type { SeedActionSkillId } from "../gameplay/seedSkills/registry.js";
import { getSeedActionSkill } from "../gameplay/seedSkills/registry.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getActionSkillVerificationContract,
  type ActionSkillVerificationContract
} from "../gameplay/seedSkills/verificationContracts.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import type { AllowedTool } from "../tools/index.js";
import { validateProposal } from "../tools/index.js";
import type { RoleId } from "../npc/roles/contracts.js";
import type { ProbeConfig } from "../config.js";
import { loadProbeConfig } from "../config.js";
import { createBots, closeBots, type ProbeBots } from "./createBots.js";
import { createDialogueState } from "./dialogueState.js";
import { createMemory } from "./memory.js";
import { createTranscript } from "./transcript.js";
import { runAgentLoop, type AgentLoopEvent } from "./agentLoop.js";
import { withActionWrapper } from "../mutual/tools/wrapper.js";
import { moveTo } from "../tools/moveTo.js";
import { observe } from "../tools/observe.js";
import { remember } from "../tools/remember.js";
import { say } from "../tools/say.js";
import { wait } from "../tools/wait.js";
import { collectLogs } from "../tools/collectLogs.js";
import { mineBlock } from "../tools/mineBlock.js";
import { craftItem } from "../tools/craftItem.js";
import { craftWithTable } from "../tools/craftWithTable.js";
import { consumeItem } from "../tools/consumeItem.js";
import { runMineflayerProgram } from "../tools/runMineflayerProgram.js";
import { placeBlock, type Positioned } from "../tools/placeBlock.js";
import { buildPattern } from "../tools/buildPattern.js";
import { getRoleContract } from "../npc/roles/contracts.js";
import { createSharedStorageLedger } from "../gameplay/storage/sharedStorageLedger.js";
import { createTeamBulletin } from "../npc/social/teamBulletin.js";
import { createSharedSettlementState } from "../memory/shared/sharedSettlementState.js";
import {
  depositToSharedChest,
  inspectChest,
  withdrawFromSharedChest
} from "../tools/sharedChest.js";
import { createMineflayerSharedChestAccessor } from "../tools/liveSharedChest.js";
import {
  buildLiveSmokeServerContext,
  ensureLiveSmokeServer
} from "../server/liveSmokeServer.js";
import { readManualMinecraftPort } from "../server/manualMinecraftPort.js";
import { execDockerCompose } from "../server/composeCommand.js";
import { getActorWorkspacePaths } from "./actorWorkspacePaths.js";

export type ActionSkillProbeConfig = {
  actorId: string;
  skillId: SeedActionSkillId;
  roleId: RoleId;
  maxActions: number;
  onEvent?: (event: AgentLoopEvent) => void;
};

export type ActionSkillProbeResult = {
  status: "passed" | "failed" | "error";
  skillId: SeedActionSkillId;
  actorId: string;
  contract: ActionSkillVerificationContract;
  /** Primitives allowed through the narrowed gate. */
  allowedPrimitives: AllowedTool[];
  transcriptPath?: string;
  finalWhy?: string;
  terminalStatus?: string;
  terminalWhy?: string;
  postconditionStatus?: "passed" | "failed";
  postconditionFailure?: string;
  failureKind?: "terminal_failed" | "postcondition_failed" | "terminal_and_postcondition_failed";
  /** Non-zero only when status is "error". */
  errorMessage?: string;
};

export type ActionSkillProbeFinal = {
  status: string;
  why: string;
};

type ServerEndpoint = {
  host: string;
  port: number;
  stop(): Promise<void>;
};

type ObserveActor = Parameters<typeof observe>[0]["actor"];
type RconContext = ReturnType<typeof buildLiveSmokeServerContext>;
type RconRunner = (args: string[]) => Promise<void>;

const probeCompletedTaskHints: Partial<Record<SeedActionSkillId, string[]>> = {
  craftPlanksAndSticks: ["collect_4_logs"],
  craftCraftingTable: ["collect_4_logs", "craft_planks_and_sticks"],
  mineCobblestone: ["collect_4_logs", "craft_planks_and_sticks", "craft_crafting_table", "craft_wooden_pickaxe"]
};

const probeFixtureOffsets = {
  sharedChest: [1, 0, -4],
  craftingTable: [2, 0, -2]
} as const;

const deterministicProbeDriverSkillIds = [
  "runtimeObserveAndRemember",
  "runBoundedMineflayerProgram",
  "collectLogs",
  "craftPlanksAndSticks",
  "craftCraftingTable",
  "craftWoodenPickaxe",
  "mineCobblestone",
  "placeCraftingTable",
  "eatFoodWhenHungry",
  "buildBasicShelter",
  "inspectSharedChest",
  "depositSharedItems",
  "approachAndRequestItem",
  "announceResourceDiscovery",
  "handoffItemAtChest",
  "waitForBusyCrafter"
] as const satisfies readonly SeedActionSkillId[];

const deterministicProbeDriverSkillIdSet = new Set<SeedActionSkillId>(deterministicProbeDriverSkillIds);

export const actionSkillProbeProviderMetadata = {
  provider_id: "deterministic-action-skill-probe",
  model: "deterministic-action-skill-probe-driver"
} as const;

export type ActionSkillProbePreconditionMode =
  | "none"
  | "placed_logs"
  | "inventory_logs"
  | "inventory_planks_and_sticks"
  | "table_craft_inputs"
  | "placeable_crafting_table"
  | "hungry_with_food"
  | "shelter_build_materials"
  | "placed_stone_with_pickaxe"
  | "inspectable_shared_chest"
  | "depositable_shared_chest"
  | "social_bootstrap_inventory";

const actionSkillProbePreconditionModes = {
  runtimeObserveAndRemember: "none",
  runBoundedMineflayerProgram: "none",
  collectLogs: "placed_logs",
  craftPlanksAndSticks: "inventory_logs",
  craftCraftingTable: "inventory_planks_and_sticks",
  craftWoodenPickaxe: "table_craft_inputs",
  mineCobblestone: "placed_stone_with_pickaxe",
  placeCraftingTable: "placeable_crafting_table",
  eatFoodWhenHungry: "hungry_with_food",
  buildBasicShelter: "shelter_build_materials",
  inspectSharedChest: "inspectable_shared_chest",
  depositSharedItems: "depositable_shared_chest",
  approachAndRequestItem: "social_bootstrap_inventory",
  announceResourceDiscovery: "social_bootstrap_inventory",
  handoffItemAtChest: "depositable_shared_chest",
  waitForBusyCrafter: "social_bootstrap_inventory"
} as const satisfies Partial<Record<SeedActionSkillId, ActionSkillProbePreconditionMode>>;

const actionSkillProbePreconditionModeBySkill =
  actionSkillProbePreconditionModes as Partial<Record<SeedActionSkillId, ActionSkillProbePreconditionMode>>;

export function hasDeterministicActionSkillProbeDriver(skillId: SeedActionSkillId) {
  return deterministicProbeDriverSkillIdSet.has(skillId);
}

export function getActionSkillProbePreconditionMode(skillId: SeedActionSkillId) {
  return actionSkillProbePreconditionModeBySkill[skillId];
}

export function actionSkillProbeRequiresManagedFixture(skillId: SeedActionSkillId) {
  const preconditionMode = getActionSkillProbePreconditionMode(skillId);
  if (!preconditionMode) {
    throw new Error(`Missing action skill probe precondition mode for implemented skill: ${skillId}`);
  }

  return preconditionMode !== "none";
}

function asObserveActor(bot: import("mineflayer").Bot): ObserveActor {
  return bot as unknown as ObserveActor;
}

function readStringArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected non-empty string arg: ${name}`);
  }

  return value;
}

function readTicksArg(args: Record<string, unknown>) {
  const value = args.ticks;

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("Expected non-negative integer arg: ticks");
  }

  return value;
}

function readOptionalPositiveIntegerArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected positive integer arg: ${name}`);
  }

  return value;
}

function optionalPositionArg(args: Record<string, unknown>, name: string): Positioned | undefined {
  const value = args[name];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  return typeof record.x === "number" &&
    typeof record.y === "number" &&
    typeof record.z === "number"
    ? { x: record.x, y: record.y, z: record.z }
    : undefined;
}

function defaultPlaceTarget(actor: import("mineflayer").Bot): Positioned {
  return {
    x: Math.floor(actor.entity.position.x) + 1,
    y: Math.floor(actor.entity.position.y),
    z: Math.floor(actor.entity.position.z)
  };
}

export function defaultBuildAnchor(actor: import("mineflayer").Bot): Positioned {
  return {
    x: Math.floor(actor.entity.position.x) + 2,
    y: Math.floor(actor.entity.position.y),
    z: Math.floor(actor.entity.position.z) + 2
  };
}

function assertTarget(targetId: string, expectedTargetId: string) {
  if (targetId !== expectedTargetId) {
    throw new Error(`Unsupported target: ${targetId}`);
  }
}

function needsSeparateTarget(skillId: SeedActionSkillId) {
  const skill = getSeedActionSkill(skillId);
  return skill.primitiveIds.some((primitive) => primitive === "move_to" || primitive === "say");
}

function buildProbeConfig(input: ActionSkillProbeConfig, baseConfig = loadProbeConfig()): ProbeConfig {
  const targetActorId = needsSeparateTarget(input.skillId) ? `${input.actorId}_target` : input.actorId;
  const bots =
    targetActorId === input.actorId
      ? [input.actorId]
      : [input.actorId, targetActorId];

  return {
    ...baseConfig,
    probeId: `action_skill_probe_${input.skillId}`,
    bots
  };
}

async function ensureProbeServer(config: ProbeConfig): Promise<{
  server: ServerEndpoint;
  rconContext?: RconContext;
}> {
  const manualMinecraftPort = readManualMinecraftPort();
  if (manualMinecraftPort !== undefined) {
    return {
      server: {
        host: "127.0.0.1",
        port: manualMinecraftPort,
        stop: async () => {}
      }
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

async function createRconRunner(rcon: RconContext): Promise<RconRunner> {
  return async (args: string[]) => {
    await execDockerCompose(
      ["-f", rcon.composeFile, "exec", "-T", "mc", "rcon-cli", "--", ...args],
      { cwd: rcon.composeDir, env: rcon.env }
    );
  };
}

async function teleportProbeBotsToSpawn(
  bots: ProbeBots,
  spawnConfig: { x: number; y: number; z: number },
  runRcon?: RconRunner
) {
  if (!runRcon) {
    return;
  }

  const offsets = [
    [0, 0, 0],
    [2, 0, 0]
  ];
  const actorIds = Object.keys(bots);

  await Promise.allSettled([
    runRcon([
      "setworldspawn",
      String(Math.floor(spawnConfig.x)),
      String(Math.floor(spawnConfig.y)),
      String(Math.floor(spawnConfig.z))
    ]),
    ...actorIds.map((actorId, index) => {
      const [dx, dy, dz] = offsets[index] ?? [0, 0, 0];
      return runRcon([
        "tp",
        bots[actorId].username,
        String(spawnConfig.x + dx),
        String(spawnConfig.y + dy),
        String(spawnConfig.z + dz)
      ]);
    })
  ]);

  await Promise.allSettled(
    actorIds.map((actorId) => runRcon(["clear", bots[actorId].username]))
  );
}

function fixturePosition(
  spawnConfig: { x: number; y: number; z: number },
  offset: readonly [number, number, number]
) {
  return {
    x: Math.floor(spawnConfig.x) + offset[0],
    y: Math.floor(spawnConfig.y) + offset[1],
    z: Math.floor(spawnConfig.z) + offset[2]
  };
}

export function buildProbePreconditionRconCommands(input: {
  actorUsername: string;
  skillId: SeedActionSkillId;
  spawnConfig: { x: number; y: number; z: number };
}): string[][] {
  const preconditionMode = getActionSkillProbePreconditionMode(input.skillId);
  if (!preconditionMode) {
    throw new Error(`Missing action skill probe precondition mode for implemented skill: ${input.skillId}`);
  }

  if (preconditionMode === "none") {
    return [];
  }

  const chest = fixturePosition(input.spawnConfig, probeFixtureOffsets.sharedChest);
  const table = fixturePosition(input.spawnConfig, probeFixtureOffsets.craftingTable);
  const commands: string[][] = [
    ["setblock", String(chest.x), String(chest.y), String(chest.z), "air"],
    ["setblock", String(table.x), String(table.y), String(table.z), "air"]
  ];
  const give = (itemName: string, count: number) => {
    commands.push(["give", input.actorUsername, `minecraft:${itemName}`, String(count)]);
  };
  const placeChestFixture = (itemsNbt?: string) => {
    commands.push(
      ["execute", "at", input.actorUsername, "run", "fill", "~-12", "~-1", "~-12", "~12", "~3", "~12", "air", "replace", "chest"],
      ["execute", "at", input.actorUsername, "run", "fill", "~-12", "~-1", "~-12", "~12", "~3", "~12", "air", "replace", "trapped_chest"]
    );
    commands.push(["setblock", String(chest.x), String(chest.y), String(chest.z), "chest"]);
    if (itemsNbt) {
      commands.push([
        "data",
        "merge",
        "block",
        String(chest.x),
        String(chest.y),
        String(chest.z),
        itemsNbt
      ]);
    }
  };

  if (preconditionMode === "placed_logs") {
    // Keep the log fixture at the actor's settled Y. Absolute spawn-Y logs can
    // become high targets after the bot falls to terrain, creating delayed
    // pickups and "3/4 progress" loops in the live matrix.
    commands.push(
      ["execute", "at", input.actorUsername, "run", "fill", "~-3", "~-1", "~-3", "~6", "~-1", "~3", "stone"],
      ["execute", "at", input.actorUsername, "run", "fill", "~-3", "~0", "~-3", "~6", "~3", "~3", "air"],
      ["execute", "at", input.actorUsername, "run", "setblock", "~2", "~0", "~0", "oak_log"],
      ["execute", "at", input.actorUsername, "run", "setblock", "~3", "~0", "~0", "oak_log"],
      ["execute", "at", input.actorUsername, "run", "setblock", "~4", "~0", "~0", "oak_log"],
      ["execute", "at", input.actorUsername, "run", "setblock", "~5", "~0", "~0", "oak_log"]
    );
  }

  if (preconditionMode === "placed_stone_with_pickaxe") {
    // The mining proof must be relative to the actor, not the configured spawn
    // Y. Probe spawn is intentionally one block high, and bots can settle at a
    // slightly different Y before their Mineflayer client loads nearby blocks.
    commands.push(
      ["execute", "at", input.actorUsername, "run", "fill", "~-3", "~-1", "~-3", "~3", "~-1", "~3", "stone"],
      ["execute", "at", input.actorUsername, "run", "fill", "~-3", "~0", "~-3", "~3", "~3", "~3", "air"],
      ["execute", "at", input.actorUsername, "run", "setblock", "~2", "~0", "~0", "stone"]
    );
    give("wooden_pickaxe", 1);
  }

  if (preconditionMode === "inventory_logs") {
    give("oak_log", 4);
  }

  if (preconditionMode === "inventory_planks_and_sticks") {
    give("oak_planks", 4);
    give("stick", 2);
  }

  if (preconditionMode === "table_craft_inputs") {
    commands.push(["setblock", String(table.x), String(table.y), String(table.z), "crafting_table"]);
    give("oak_planks", 3);
    give("stick", 2);
  }

  if (preconditionMode === "placeable_crafting_table") {
    commands.push(
      ["execute", "at", input.actorUsername, "run", "fill", "~-2", "~-1", "~-2", "~4", "~-1", "~2", "stone"],
      ["execute", "at", input.actorUsername, "run", "fill", "~-2", "~0", "~-2", "~4", "~3", "~2", "air"]
    );
    give("crafting_table", 1);
  }

  if (preconditionMode === "hungry_with_food") {
    commands.push(
      ["difficulty", "normal"],
      ["effect", "give", input.actorUsername, "minecraft:hunger", "10", "32", "true"]
    );
    give("bread", 2);
  }

  if (preconditionMode === "shelter_build_materials") {
    commands.push(
      ["execute", "at", input.actorUsername, "run", "fill", "~-3", "~-1", "~-3", "~8", "~-1", "~8", "stone"],
      ["execute", "at", input.actorUsername, "run", "fill", "~-3", "~0", "~-3", "~8", "~4", "~8", "air"]
    );
    give("dirt", 64);
  }

  if (preconditionMode === "inspectable_shared_chest") {
    give("crafting_table", 1);
    placeChestFixture('{Items:[{Slot:0b,id:"minecraft:oak_log",Count:2b}]}');
  }

  if (preconditionMode === "depositable_shared_chest") {
    give("crafting_table", input.skillId === "handoffItemAtChest" ? 2 : 1);
    placeChestFixture();
  }

  if (preconditionMode === "social_bootstrap_inventory") {
    // A local crafting table in inventory suppresses the bootstrap curriculum,
    // letting social probes validate their own primitives instead of being
    // redirected to wood gathering.
    give("crafting_table", 1);
  }

  return commands;
}

async function setupProbePreconditions(input: {
  bots: ProbeBots;
  actorId: string;
  skillId: SeedActionSkillId;
  spawnConfig: { x: number; y: number; z: number };
  runRcon?: RconRunner;
}) {
  const { bots, actorId, skillId, spawnConfig, runRcon } = input;
  const preconditionMode = getActionSkillProbePreconditionMode(skillId);

  if (!preconditionMode) {
    throw new Error(`Missing action skill probe precondition mode for implemented skill: ${skillId}`);
  }

  if (!runRcon) {
    if (preconditionMode !== "none") {
      throw new Error(
        `Action skill ${skillId} requires managed RCON fixture setup (${preconditionMode}); ` +
        "unset MC_PORT or run against the managed probe server."
      );
    }

    return;
  }

  const actor = bots[actorId];
  if (!actor) {
    return;
  }

  const commands = buildProbePreconditionRconCommands({
    actorUsername: actor.username,
    skillId,
    spawnConfig
  });
  for (const command of commands) {
    await runRcon(command);
  }

  await new Promise((resolve) => {
    const waitMs = skillId === "eatFoodWhenHungry"
      ? 5500
      : skillId === "collectLogs"
        ? 3000
        : 1500;
    setTimeout(resolve, waitMs);
  });
}

function createActionSkillProbeProvider(
  skillId: SeedActionSkillId,
  targetActorId: string,
  buildAnchor?: Positioned
) {
  if (!hasDeterministicActionSkillProbeDriver(skillId)) {
    throw new Error(`Missing deterministic action skill probe driver for implemented skill: ${skillId}`);
  }

  let turn = 0;
  return {
    next(input: {
      observation?: {
        inventory?: Array<{ name: string; count: number }>;
        vitals?: {
          food_candidates?: Array<{ name: string; count: number }>;
        };
      };
      lastResult: { tool: string; status: string; verification?: { status?: string } } | null;
    }) {
      turn += 1;

      if (!input.lastResult) {
        return { tool: "observe", args: {} };
      }

      if (input.lastResult.tool === "remember") {
        return { tool: "remember", args: { note: `${skillId} probe already reached terminal memory` } };
      }

      if (skillId === "runtimeObserveAndRemember") {
        if (input.lastResult.tool === "observe") {
          return { tool: "wait", args: { ticks: 20 } };
        }
        if (input.lastResult.tool === "wait") {
          return { tool: "remember", args: { note: "runtimeObserveAndRemember probe observed, waited, and persisted memory" } };
        }
        throw new Error(`runtimeObserveAndRemember probe received unexpected last tool: ${input.lastResult.tool}`);
      }

      if (skillId === "runBoundedMineflayerProgram") {
        if (
          input.lastResult.tool === "run_mineflayer_program" &&
          input.lastResult.status === "completed_with_evidence"
        ) {
          return { tool: "remember", args: { note: "runBoundedMineflayerProgram completed with helper and post-observation evidence" } };
        }
        return {
          tool: "run_mineflayer_program",
          args: {
            purpose: "probe bounded generated helper execution",
            expectedObservation: "source, helper events, delivered chat, and post-observation are recorded",
            source: `
              export async function run(ctx, params) {
                await ctx.observe();
                return ctx.say("I can report what I just saw.");
              }
            `
          }
        };
      }

      if (skillId === "inspectSharedChest") {
        if (input.lastResult.tool === "inspect_chest" && input.lastResult.status === "inspected") {
          return { tool: "remember", args: { note: "inspectSharedChest inspected live shared storage" } };
        }
        return { tool: "inspect_chest", args: {} };
      }

      if (skillId === "depositSharedItems") {
        if (input.lastResult.tool === "deposit_shared" && input.lastResult.status === "deposited") {
          return { tool: "remember", args: { note: `${skillId} moved item into shared storage` } };
        }
        return { tool: "deposit_shared", args: { itemName: "crafting_table", count: 1 } };
      }

      if (skillId === "handoffItemAtChest") {
        if (input.lastResult.tool === "deposit_shared" && input.lastResult.status === "deposited") {
          return { tool: "say", args: { target: targetActorId, text: "I left a crafting table in the shared chest." } };
        }
        if (input.lastResult.tool === "say" && input.lastResult.status === "busy") {
          return { tool: "wait", args: { ticks: 20 } };
        }
        if (input.lastResult.tool === "wait") {
          return { tool: "say", args: { target: targetActorId, text: "I left a crafting table in the shared chest." } };
        }
        if (input.lastResult.tool === "say" && input.lastResult.status === "delivered") {
          return { tool: "remember", args: { note: "handoffItemAtChest deposited and announced the handoff" } };
        }
        return { tool: "deposit_shared", args: { itemName: "crafting_table", count: 1 } };
      }

      if (skillId === "approachAndRequestItem") {
        if (input.lastResult.tool === "move_to" && input.lastResult.status === "arrived") {
          return { tool: "say", args: { target: targetActorId, text: "can you spare one oak log?" } };
        }
        if (input.lastResult.tool === "say" && input.lastResult.status === "delivered") {
          return { tool: "remember", args: { note: "approachAndRequestItem arrived and delivered request" } };
        }
        return { tool: "move_to", args: { target: targetActorId } };
      }

      if (skillId === "announceResourceDiscovery") {
        if (input.lastResult.tool === "say" && input.lastResult.status === "delivered") {
          return { tool: "remember", args: { note: "announceResourceDiscovery delivered resource announcement" } };
        }
        return { tool: "say", args: { target: targetActorId, text: "I found oak logs near spawn." } };
      }

      if (skillId === "waitForBusyCrafter") {
        if (input.lastResult.tool === "say" && input.lastResult.status === "busy") {
          return { tool: "wait", args: { ticks: 20 } };
        }
        if (input.lastResult.tool === "wait") {
          return { tool: "say", args: { target: targetActorId, text: "checking again when you are ready" } };
        }
        if (input.lastResult.tool === "say" && input.lastResult.status === "delivered") {
          return { tool: "remember", args: { note: "waitForBusyCrafter waited through busy state and delivered follow-up" } };
        }
        return { tool: "say", args: { target: targetActorId, text: "are you free to talk?" } };
      }

      if (input.lastResult.verification?.status === "passed") {
        return { tool: "remember", args: { note: `${skillId} completed with runtime verification evidence` } };
      }

      if (skillId === "craftPlanksAndSticks") {
        const planks = input.observation?.inventory
          ?.filter((item) => item.name.endsWith("_planks"))
          .reduce((sum, item) => sum + item.count, 0) ?? 0;
        return planks < 4
          ? { tool: "craft_item", args: { itemName: "planks" } }
          : { tool: "craft_item", args: { itemName: "stick" } };
      }

      if (skillId === "craftCraftingTable") {
        return { tool: "craft_item", args: { itemName: "crafting_table" } };
      }

      if (skillId === "craftWoodenPickaxe") {
        if (input.lastResult.tool === "craft_with_table" && input.lastResult.status === "crafted") {
          return { tool: "remember", args: { note: "craftWoodenPickaxe completed table-bound craft attempt" } };
        }

        return { tool: "craft_with_table", args: { itemName: "wooden_pickaxe" } };
      }

      if (skillId === "mineCobblestone") {
        if (input.lastResult.tool === "mine_block" && input.lastResult.status === "mined") {
          return { tool: "remember", args: { note: "mineCobblestone completed stone mining attempt" } };
        }

        return { tool: "mine_block", args: { blockName: "stone", itemName: "cobblestone", targetCount: 1 } };
      }

      if (skillId === "placeCraftingTable") {
        if (input.lastResult.tool === "place_block" && input.lastResult.status === "placed") {
          return { tool: "remember", args: { note: "placeCraftingTable placed and verified a crafting table block" } };
        }

        return { tool: "place_block", args: { itemName: "crafting_table" } };
      }

      if (skillId === "eatFoodWhenHungry") {
        if (input.lastResult.tool === "consume_item" && input.lastResult.status === "consumed") {
          return { tool: "remember", args: { note: "eatFoodWhenHungry consumed edible food with vitals evidence" } };
        }

        const itemName = input.observation?.vitals?.food_candidates?.find((item) => item.count > 0)?.name ??
          input.observation?.inventory?.find((item) => item.name === "bread" && item.count > 0)?.name ??
          "bread";
        return { tool: "consume_item", args: { itemName } };
      }

      if (skillId === "buildBasicShelter") {
        if (input.lastResult.tool === "build_pattern" && input.lastResult.status === "built") {
          return { tool: "remember", args: { note: "buildBasicShelter completed a verified starter shelter shell" } };
        }

        return {
          tool: "build_pattern",
          args: {
            patternId: "starter_shelter_2x2_v1",
            ...(buildAnchor ? { anchor: buildAnchor } : {}),
            preferredMaterials: ["dirt"],
            maxPlacements: 64
          }
        };
      }

      if (skillId === "collectLogs") {
        return { tool: "collect_logs", args: { targetCount: 4 } };
      }

      throw new Error(`Unhandled deterministic action skill probe driver branch: ${skillId}`);
    }
  };
}

export type ProbeTranscriptPayload = {
  steps?: Array<{
    tool?: string;
    args?: Record<string, unknown>;
    result?: Record<string, unknown>;
    verification?: { status?: string; reason?: string; progress?: Record<string, unknown> };
  }>;
};

type ProbeTranscriptStep = NonNullable<ProbeTranscriptPayload["steps"]>[number];

export type ActionSkillPostconditionSpec = {
  skillId: SeedActionSkillId;
  evidenceSummary: string[];
  minimumPassingTranscript: ProbeTranscriptPayload;
  validate(steps: ProbeTranscriptStep[]): string | null;
};

const logItemNames = [
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log"
] as const;

const plankItemNames = [
  "oak_planks",
  "birch_planks",
  "spruce_planks",
  "jungle_planks",
  "acacia_planks",
  "dark_oak_planks",
  "mangrove_planks",
  "cherry_planks"
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function numberField(record: Record<string, unknown>, name: string) {
  return typeof record[name] === "number" ? record[name] : undefined;
}

function arrayField(record: Record<string, unknown>, name: string): unknown[] {
  return Array.isArray(record[name]) ? record[name] : [];
}

function hasPassedToolVerificationProgress(
  steps: ProbeTranscriptStep[],
  tool: string,
  predicate: (progress: Record<string, unknown>) => boolean
) {
  return steps.some((step) => {
    if (step.tool !== tool || step.verification?.status !== "passed") {
      return false;
    }

    return predicate(asRecord(step.verification.progress));
  });
}

function progressHasTargetInventory(input: {
  progress: Record<string, unknown>;
  itemNames: readonly string[];
  minimumAfterCount?: number;
}) {
  const itemNames = arrayField(input.progress, "itemNames");
  const afterCount = numberField(input.progress, "afterCount") ?? 0;
  const targetCount = numberField(input.progress, "targetCount") ?? input.minimumAfterCount ?? 1;

  return input.itemNames.some((itemName) => itemNames.includes(itemName)) &&
    afterCount >= targetCount &&
    afterCount >= (input.minimumAfterCount ?? 1);
}

function progressHasCraftOutputs(
  progress: Record<string, unknown>,
  requirements: readonly { itemNames: readonly string[]; minimumAfterCount: number }[]
) {
  const outputs = arrayField(progress, "outputs").map(asRecord);

  return requirements.every((requirement) =>
    outputs.some((output) => {
      const itemNames = arrayField(output, "itemNames");
      const afterCount = numberField(output, "afterCount") ?? 0;
      const targetCount = numberField(output, "targetCount") ?? requirement.minimumAfterCount;

      return requirement.itemNames.some((itemName) => itemNames.includes(itemName)) &&
        afterCount >= targetCount &&
        afterCount >= requirement.minimumAfterCount;
    })
  );
}

function hasChestId(result: Record<string, unknown>) {
  return typeof result.chestId === "string" && result.chestId.trim().length > 0;
}

function hasLedgerIdentity(result: Record<string, unknown>) {
  return typeof result.actorId === "string" &&
    result.actorId.trim().length > 0 &&
    typeof result.ledgerSeq === "number" &&
    Number.isInteger(result.ledgerSeq) &&
    result.ledgerSeq > 0;
}

function itemSnapshotHasPositiveCount(items: unknown[]) {
  return items
    .map(asRecord)
    .some((item) => typeof item.name === "string" && (numberField(item, "count") ?? 0) > 0);
}

function hasPositiveTransfer(result: Record<string, unknown>) {
  return result.status === "deposited" &&
    hasChestId(result) &&
    hasLedgerIdentity(result) &&
    typeof result.itemName === "string" &&
    (numberField(result, "movedCount") ?? 0) > 0;
}

function hasToolResult(
  steps: ProbeTranscriptStep[],
  tool: string,
  predicate: (result: Record<string, unknown>) => boolean
) {
  return steps.some((step) => step.tool === tool && predicate(asRecord(step.result)));
}

function hasVitalsObservationWithFoodCandidate(step: ProbeTranscriptStep) {
  if (step.tool !== "observe") {
    return false;
  }

  const result = asRecord(step.result);
  const observation = asRecord(result.observation);
  const vitals = asRecord(observation.vitals);
  const foodCandidates = arrayField(vitals, "food_candidates").map(asRecord);

  return result.status === "ok" &&
    observation.status === "ok" &&
    typeof vitals.food === "number" &&
    foodCandidates.some((candidate) =>
      typeof candidate.name === "string" &&
      (numberField(candidate, "count") ?? 0) > 0
    );
}

function hasConsumedFoodEvidence(result: Record<string, unknown>) {
  const before = asRecord(result.before);
  const after = asRecord(result.after);

  return result.status === "consumed" &&
    typeof result.itemName === "string" &&
    result.itemName.trim().length > 0 &&
    typeof before.food === "number" &&
    before.food < 20 &&
    typeof after.food === "number" &&
    (
      (numberField(result, "count_delta") ?? 0) < 0 ||
      (numberField(result, "food_delta") ?? 0) > 0 ||
      (numberField(result, "health_delta") ?? 0) > 0
    );
}

function hasToolResultAfter(
  steps: ProbeTranscriptStep[],
  input: {
    afterTool: string;
    tool: string;
    predicate: (result: Record<string, unknown>) => boolean;
  }
) {
  const afterIndex = steps.findIndex((step) => step.tool === input.afterTool);
  if (afterIndex < 0) {
    return false;
  }

  return steps
    .slice(afterIndex + 1)
    .some((step) => step.tool === input.tool && input.predicate(asRecord(step.result)));
}

function textArgMatches(step: ProbeTranscriptStep, predicate: (text: string) => boolean) {
  const text = asRecord(step.args).text;
  return typeof text === "string" && predicate(text);
}

function hasDirectedTargetArg(step: ProbeTranscriptStep) {
  const target = asRecord(step.args).target;
  return typeof target === "string" && target.trim().length > 0;
}

function hasDirectedTargetResult(step: ProbeTranscriptStep) {
  const target = asRecord(step.result).targetId;
  return typeof target === "string" && target.trim().length > 0;
}

function textResultMatches(step: ProbeTranscriptStep, predicate: (text: string) => boolean) {
  const text = asRecord(step.result).text;
  return typeof text === "string" && predicate(text);
}

function hasDeliveredSpeechEvidence(step: ProbeTranscriptStep, predicate: (text: string) => boolean) {
  return step.tool === "say" &&
    asRecord(step.result).status === "delivered" &&
    hasDirectedTargetArg(step) &&
    hasDirectedTargetResult(step) &&
    textArgMatches(step, predicate) &&
    textResultMatches(step, predicate);
}

function hasBoundedWaitResult(step: ProbeTranscriptStep) {
  const result = asRecord(step.result);
  return step.tool === "wait" &&
    result.status === "waited" &&
    (numberField(result, "ticks") ?? 0) > 0 &&
    (numberField(result, "durationMs") ?? -1) >= 0;
}

function hasObservationSnapshot(step: ProbeTranscriptStep) {
  const result = asRecord(step.result);
  const observation = asRecord(result.observation);
  return step.tool === "observe" &&
    result.status === "ok" &&
    observation.status === "ok" &&
    typeof observation.observerId === "string" &&
    observation.observerId.trim().length > 0 &&
    Array.isArray(observation.visibleActors) &&
    Array.isArray(observation.memory);
}

function isRequestText(text: string) {
  return /request|need|spare|share|give|bring/i.test(text) &&
    /\b(oak\s+log|log|plank|stick|crafting\s+table|chest|food|coal|cobblestone)\b/i.test(text);
}

function isResourceAnnouncementText(text: string) {
  return /found|located|discovered|near/i.test(text) && /log|wood|resource|oak/i.test(text);
}

function isResourceMemoryText(text: string) {
  return /found|located|discovered|resource|log|wood|oak/i.test(text);
}

function isHandoffText(text: string) {
  return /left|deposited|placed|shared|chest|handoff/i.test(text);
}

function isFollowUpText(text: string) {
  return /check|checking|ready|again|follow/i.test(text);
}

export const actionSkillPostconditionSpecs: Partial<Record<SeedActionSkillId, ActionSkillPostconditionSpec>> = {
  runtimeObserveAndRemember: {
    skillId: "runtimeObserveAndRemember",
    evidenceSummary: ["observation snapshot was captured", "bounded wait completed before memory note was persisted"],
    minimumPassingTranscript: {
      steps: [
        { tool: "observe", result: { status: "ok", observation: { status: "ok", observerId: "npc_b", visibleActors: [], memory: [] } } },
        { tool: "wait", result: { status: "waited", ticks: 20, durationMs: 1000 } },
        { tool: "remember", result: { status: "remembered", note: "observed" } }
      ]
    },
    validate(steps) {
      const observeIndex = steps.findIndex(hasObservationSnapshot);

      if (observeIndex < 0) {
        return "runtimeObserveAndRemember did not capture an observation snapshot";
      }

      const waitIndex = steps.findIndex((step, index) => {
        return index > observeIndex && hasBoundedWaitResult(step);
      });

      if (waitIndex < 0) {
        return "runtimeObserveAndRemember did not complete a bounded wait after observing";
      }

      return steps
        .slice(waitIndex + 1)
        .some((step) => {
          const result = asRecord(step.result);
          return step.tool === "remember" &&
            result.status === "remembered" &&
            typeof result.note === "string" &&
            result.note.trim().length > 0;
        })
        ? null
        : "runtimeObserveAndRemember did not persist a non-empty memory note after waiting";
    }
  },
  runBoundedMineflayerProgram: {
    skillId: "runBoundedMineflayerProgram",
    evidenceSummary: [
      "run_mineflayer_program stored generated source and helper call evidence",
      "at least one helper call produced verifier-classified evidence",
      "post-observation was recorded for the next closed-loop action"
    ],
    minimumPassingTranscript: {
      steps: [{
        tool: "run_mineflayer_program",
        result: {
          status: "completed_with_evidence",
          sourcePath: "/tmp/socialCycleMineflayerProgram.ts",
          helperEvents: [
            { name: "observe", status: "completed", result: { status: "ok" } },
            { name: "say", status: "completed", result: { status: "delivered", text: "I can report what I just saw." } }
          ],
          postObservation: { status: "ok", observerId: "npc_b", visibleActors: [], memory: [] }
        }
      }]
    },
    validate(steps) {
      return hasToolResult(steps, "run_mineflayer_program", (result) => {
        const helperEvents = arrayField(result, "helperEvents").map(asRecord);
        const postObservation = asRecord(result.postObservation);
        return result.status === "completed_with_evidence" &&
          typeof result.sourcePath === "string" &&
          result.sourcePath.length > 0 &&
          postObservation.status === "ok" &&
          helperEvents.some((event) => {
            const helperResult = asRecord(event.result);
            return event.status === "completed" &&
              (
                helperResult.status === "delivered" ||
                helperResult.status === "collected" ||
                helperResult.status === "mined" ||
                helperResult.status === "crafted" ||
                helperResult.status === "consumed" ||
                helperResult.status === "placed" ||
                helperResult.status === "already_present" ||
                helperResult.status === "built"
              );
          });
      })
        ? null
        : "runBoundedMineflayerProgram did not record generated source, verified helper evidence, and post-observation";
    }
  },
  collectLogs: {
    skillId: "collectLogs",
    evidenceSummary: [
      "collect_logs result reports a positive inventory delta",
      "collect_logs result includes at least one dug log attempt",
      "runtime verifier passed after log inventory reached the target count"
    ],
    minimumPassingTranscript: {
      steps: [{
        tool: "collect_logs",
        result: {
          status: "collected",
          inventoryDelta: 4,
          afterLogCount: 4,
          attemptedBlocks: [{ block: "oak_log", outcome: "dug" }]
        },
        verification: {
          status: "passed",
          progress: {
            itemNames: [...logItemNames],
            beforeCount: 0,
            afterCount: 4,
            targetCount: 4
          }
        }
      }]
    },
    validate(steps) {
      const collectedStep = steps.find((step) => {
        if (step.tool !== "collect_logs") {
          return false;
        }

        const result = asRecord(step.result);
        const attemptedBlocks = arrayField(result, "attemptedBlocks").map(asRecord);

        return result.status === "collected" &&
          (numberField(result, "inventoryDelta") ?? 0) > 0 &&
          (numberField(result, "afterLogCount") ?? 0) >= 4 &&
          attemptedBlocks.some((attempt) =>
            typeof attempt.block === "string" &&
            logItemNames.includes(attempt.block as (typeof logItemNames)[number]) &&
            attempt.outcome === "dug"
          );
      });

      if (!collectedStep) {
        return "collectLogs did not record a collected result with positive log inventory delta and dug-block evidence";
      }

      return hasPassedToolVerificationProgress(steps, "collect_logs", (progress) =>
        progressHasTargetInventory({
          progress,
          itemNames: logItemNames,
          minimumAfterCount: 4
        })
      )
        ? null
        : "collectLogs never produced passed log inventory target evidence in transcript";
    }
  },
  craftPlanksAndSticks: {
    skillId: "craftPlanksAndSticks",
    evidenceSummary: ["runtime verifier passed after plank and stick inventory outputs"],
    minimumPassingTranscript: {
      steps: [{
        tool: "craft_item",
        result: { status: "crafted" },
        verification: {
          status: "passed",
          progress: {
            outputs: [
              { itemNames: [...plankItemNames], beforeCount: 0, afterCount: 4, targetCount: 4 },
              { itemNames: ["stick"], beforeCount: 0, afterCount: 4, targetCount: 2 }
            ]
          }
        }
      }]
    },
    validate(steps) {
      return hasPassedToolVerificationProgress(steps, "craft_item", (progress) =>
        progressHasCraftOutputs(progress, [
          { itemNames: plankItemNames, minimumAfterCount: 4 },
          { itemNames: ["stick"], minimumAfterCount: 2 }
        ])
      )
        ? null
        : "craftPlanksAndSticks never produced passed plank and stick inventory evidence in transcript";
    }
  },
  craftCraftingTable: {
    skillId: "craftCraftingTable",
    evidenceSummary: ["runtime verifier passed after crafting table inventory output"],
    minimumPassingTranscript: {
      steps: [{
        tool: "craft_item",
        result: { status: "crafted" },
        verification: {
          status: "passed",
          progress: {
            itemNames: ["crafting_table"],
            beforeCount: 0,
            afterCount: 1,
            targetCount: 1
          }
        }
      }]
    },
    validate(steps) {
      return hasPassedToolVerificationProgress(steps, "craft_item", (progress) =>
        progressHasTargetInventory({
          progress,
          itemNames: ["crafting_table"],
          minimumAfterCount: 1
        })
      )
        ? null
        : "craftCraftingTable never produced passed crafting table inventory evidence in transcript";
    }
  },
  craftWoodenPickaxe: {
    skillId: "craftWoodenPickaxe",
    evidenceSummary: [
      "craft_with_table result reports a nearby crafting table block",
      "craft_with_table result reports positive wooden_pickaxe inventory delta",
      "runtime verifier passed after wooden_pickaxe inventory output"
    ],
    minimumPassingTranscript: {
      steps: [{
        tool: "craft_with_table",
        result: {
          status: "crafted",
          itemName: "wooden_pickaxe",
          tablePosition: { x: 1, y: 64, z: 1 },
          inventoryDelta: 1,
          afterCount: 1
        },
        verification: {
          status: "passed",
          progress: {
            itemNames: ["wooden_pickaxe"],
            beforeCount: 0,
            afterCount: 1,
            targetCount: 1
          }
        }
      }]
    },
    validate(steps) {
      const craftedStep = steps.find((step) => {
        if (step.tool !== "craft_with_table") {
          return false;
        }

        const result = asRecord(step.result);
        const tablePosition = asRecord(result.tablePosition);

        return result.status === "crafted" &&
          result.itemName === "wooden_pickaxe" &&
          (numberField(result, "inventoryDelta") ?? 0) > 0 &&
          (numberField(result, "afterCount") ?? 0) >= 1 &&
          typeof tablePosition.x === "number" &&
          typeof tablePosition.y === "number" &&
          typeof tablePosition.z === "number";
      });

      if (!craftedStep) {
        return "craftWoodenPickaxe did not record table-bound craft result evidence with positive wooden_pickaxe inventory delta";
      }

      return hasPassedToolVerificationProgress(steps, "craft_with_table", (progress) =>
        progressHasTargetInventory({
          progress,
          itemNames: ["wooden_pickaxe"],
          minimumAfterCount: 1
        })
      )
        ? null
        : "craftWoodenPickaxe never produced passed wooden_pickaxe inventory evidence in transcript";
    }
  },
  mineCobblestone: {
    skillId: "mineCobblestone",
    evidenceSummary: [
      "mine_block result reports positive cobblestone inventory delta",
      "mine_block result includes at least one dug stone attempt",
      "runtime verifier passed after cobblestone inventory reached the target count"
    ],
    minimumPassingTranscript: {
      steps: [{
        tool: "mine_block",
        result: {
          status: "mined",
          blockName: "stone",
          itemName: "cobblestone",
          inventoryDelta: 1,
          afterCount: 1,
          attemptedBlocks: [{ block: "stone", outcome: "dug" }],
          equippedTool: "wooden_pickaxe"
        },
        verification: {
          status: "passed",
          progress: {
            itemNames: ["cobblestone"],
            beforeCount: 0,
            afterCount: 1,
            targetCount: 1
          }
        }
      }]
    },
    validate(steps) {
      const minedStep = steps.find((step) => {
        if (step.tool !== "mine_block") {
          return false;
        }

        const result = asRecord(step.result);
        const attemptedBlocks = arrayField(result, "attemptedBlocks").map(asRecord);

        return result.status === "mined" &&
          result.blockName === "stone" &&
          result.itemName === "cobblestone" &&
          typeof result.equippedTool === "string" &&
          result.equippedTool.includes("pickaxe") &&
          (numberField(result, "inventoryDelta") ?? 0) > 0 &&
          (numberField(result, "afterCount") ?? 0) >= 1 &&
          attemptedBlocks.some((attempt) =>
            attempt.block === "stone" &&
            attempt.outcome === "dug"
          );
      });

      if (!minedStep) {
        return "mineCobblestone did not record a mined result with pickaxe, positive cobblestone inventory delta, and dug stone evidence";
      }

      return hasPassedToolVerificationProgress(steps, "mine_block", (progress) =>
        progressHasTargetInventory({
          progress,
          itemNames: ["cobblestone"],
          minimumAfterCount: 1
        })
      )
        ? null
        : "mineCobblestone never produced passed cobblestone inventory target evidence in transcript";
    }
  },
  placeCraftingTable: {
    skillId: "placeCraftingTable",
    evidenceSummary: [
      "place_block selected crafting_table from inventory",
      "place_block verified crafting_table at the target world position"
    ],
    minimumPassingTranscript: {
      steps: [{
        tool: "place_block",
        result: {
          status: "placed",
          itemName: "crafting_table",
          afterBlockName: "crafting_table",
          targetPosition: { x: 1, y: 64, z: 0 },
          inventoryDelta: -1
        }
      }]
    },
    validate(steps) {
      return hasToolResult(steps, "place_block", (result) => {
        const targetPosition = asRecord(result.targetPosition);
        return result.status === "placed" &&
          result.itemName === "crafting_table" &&
          result.afterBlockName === "crafting_table" &&
          typeof targetPosition.x === "number" &&
          typeof targetPosition.y === "number" &&
          typeof targetPosition.z === "number" &&
          (numberField(result, "inventoryDelta") ?? 0) < 0;
      })
        ? null
        : "placeCraftingTable did not record a verified crafting_table placement with target coordinates and inventory delta";
    }
  },
  eatFoodWhenHungry: {
    skillId: "eatFoodWhenHungry",
    evidenceSummary: [
      "observe exposed raw vitals and edible inventory candidates",
      "consume_item verified a named food item through inventory or vitals delta"
    ],
    minimumPassingTranscript: {
      steps: [
        {
          tool: "observe",
          result: {
            status: "ok",
            observation: {
              status: "ok",
              observerId: "npc_b",
              visibleActors: [],
              memory: [],
              vitals: {
                food: 14,
                food_candidates: [{ name: "bread", count: 2, food_points: 5, saturation: 6 }]
              }
            }
          }
        },
        {
          tool: "consume_item",
          result: {
            status: "consumed",
            itemName: "bread",
            before: { food: 14, inventory_counts: { bread: 2 } },
            after: { food: 19, inventory_counts: { bread: 1 } },
            count_delta: -1,
            food_delta: 5,
            health_delta: 0
          }
        }
      ]
    },
    validate(steps) {
      const observationIndex = steps.findIndex(hasVitalsObservationWithFoodCandidate);

      if (observationIndex < 0) {
        return "eatFoodWhenHungry did not observe raw vitals and edible inventory evidence";
      }

      return steps
        .slice(observationIndex + 1)
        .some((step) => step.tool === "consume_item" && hasConsumedFoodEvidence(asRecord(step.result)))
        ? null
        : "eatFoodWhenHungry did not record consume_item evidence with a named food item and inventory or vitals delta";
    }
  },
  buildBasicShelter: {
    skillId: "buildBasicShelter",
    evidenceSummary: [
      "build_pattern result reached built status",
      "shelter verification passed with wall/roof coverage, clear interior, and new shell blocks"
    ],
    minimumPassingTranscript: {
      steps: [{
        tool: "build_pattern",
        result: {
          status: "built",
          patternId: "starter_shelter_2x2_v1",
          placementLedger: [{ status: "placed" }],
          verification: {
            status: "passed",
            wallCoverage: 1,
            roofCoverage: 1,
            interiorClear: true,
            floorSupported: true,
            placedShellBlocks: 20,
            missingCells: []
          }
        }
      }]
    },
    validate(steps) {
      return hasToolResult(steps, "build_pattern", (result) => {
        const verification = asRecord(result.verification);
        return result.status === "built" &&
          result.patternId === "starter_shelter_2x2_v1" &&
          verification.status === "passed" &&
          (numberField(verification, "wallCoverage") ?? 0) >= 1 &&
          (numberField(verification, "roofCoverage") ?? 0) >= 1 &&
          verification.interiorClear === true &&
          verification.floorSupported === true &&
          (numberField(verification, "placedShellBlocks") ?? 0) >= 20 &&
          arrayField(verification, "missingCells").length === 0;
      })
        ? null
        : "buildBasicShelter did not record a built starter shelter with passing world-state verifier evidence";
    }
  },
  inspectSharedChest: {
    skillId: "inspectSharedChest",
    evidenceSummary: ["shared chest inspection returned a ledger-backed chest id and non-empty positive item snapshot"],
    minimumPassingTranscript: {
      steps: [{ tool: "inspect_chest", result: { status: "inspected", actorId: "npc_b", ledgerSeq: 1, chestId: "shared_spawn_chest", items: [{ name: "oak_log", count: 2 }] } }]
    },
    validate(steps) {
      return hasToolResult(steps, "inspect_chest", (result) =>
        result.status === "inspected" &&
        hasChestId(result) &&
        hasLedgerIdentity(result) &&
        itemSnapshotHasPositiveCount(arrayField(result, "items"))
      )
        ? null
        : "inspectSharedChest did not inspect a live shared chest with ledger identity, chest id, and item evidence";
    }
  },
  depositSharedItems: {
    skillId: "depositSharedItems",
    evidenceSummary: ["deposit_shared moved a named item with ledger identity, chest id, and positive count"],
    minimumPassingTranscript: {
      steps: [{ tool: "deposit_shared", result: { status: "deposited", actorId: "npc_b", ledgerSeq: 1, chestId: "shared_spawn_chest", itemName: "crafting_table", movedCount: 1 } }]
    },
    validate(steps) {
      return hasToolResult(steps, "deposit_shared", hasPositiveTransfer)
        ? null
        : "depositSharedItems did not move a named item into shared storage with ledger identity";
    }
  },
  approachAndRequestItem: {
    skillId: "approachAndRequestItem",
    evidenceSummary: ["move_to arrived within range", "say result confirmed targeted request text for a specific item"],
    minimumPassingTranscript: {
      steps: [
        {
          tool: "move_to",
          result: {
            status: "arrived",
            arrived: true,
            beforeDistance: 3,
            afterDistance: 1,
            distanceDelta: 2
          }
        },
        { tool: "say", args: { target: "npc_target", text: "can you spare one oak log?" }, result: { status: "delivered", actorId: "npc_b", targetId: "npc_target", text: "can you spare one oak log?" } }
      ]
    },
    validate(steps) {
      const arrived = steps.findIndex(
        (step) => step.tool === "move_to" &&
          asRecord(step.result).status === "arrived" &&
          asRecord(step.result).arrived === true &&
          (numberField(asRecord(step.result), "afterDistance") ?? Number.POSITIVE_INFINITY) <= 1.5 &&
          typeof numberField(asRecord(step.result), "beforeDistance") === "number" &&
          typeof numberField(asRecord(step.result), "distanceDelta") === "number"
      );

      if (arrived < 0) {
        return "approachAndRequestItem did not reach interaction range with measured distance evidence";
      }
      return steps
        .slice(arrived + 1)
        .some((step) =>
          hasDeliveredSpeechEvidence(step, isRequestText)
        )
        ? null
        : "approachAndRequestItem did not deliver a targeted request for a specific item after arriving";
    }
  },
  announceResourceDiscovery: {
    skillId: "announceResourceDiscovery",
    evidenceSummary: ["say result confirmed targeted resource-discovery text", "resource note was persisted after announcement"],
    minimumPassingTranscript: {
      steps: [
        { tool: "say", args: { target: "npc_target", text: "I found oak logs near spawn." }, result: { status: "delivered", actorId: "npc_b", targetId: "npc_target", text: "I found oak logs near spawn." } },
        { tool: "remember", result: { status: "remembered", note: "announceResourceDiscovery delivered resource announcement" } }
      ]
    },
    validate(steps) {
      const announcementIndex = steps.findIndex((step) =>
          hasDeliveredSpeechEvidence(step, isResourceAnnouncementText)
      );

      if (announcementIndex < 0) {
        return "announceResourceDiscovery did not deliver a resource-discovery message";
      }

      return steps
        .slice(announcementIndex + 1)
        .some((step) => {
          const result = asRecord(step.result);
          return step.tool === "remember" &&
            result.status === "remembered" &&
            typeof result.note === "string" &&
            isResourceMemoryText(result.note);
        })
        ? null
        : "announceResourceDiscovery did not persist a resource memory note after announcing";
    }
  },
  handoffItemAtChest: {
    skillId: "handoffItemAtChest",
    evidenceSummary: ["deposit_shared moved a positive item count with ledger identity", "say result confirmed targeted handoff text"],
    minimumPassingTranscript: {
      steps: [
        { tool: "deposit_shared", result: { status: "deposited", actorId: "npc_b", ledgerSeq: 1, chestId: "shared_spawn_chest", itemName: "crafting_table", movedCount: 1 } },
        { tool: "say", args: { target: "npc_target", text: "I left a crafting table in the shared chest." }, result: { status: "delivered", actorId: "npc_b", targetId: "npc_target", text: "I left a crafting table in the shared chest." } }
      ]
    },
    validate(steps) {
      const depositIndex = steps.findIndex(
        (step) => step.tool === "deposit_shared" &&
          hasPositiveTransfer(asRecord(step.result))
      );

      if (depositIndex < 0) {
        return "handoffItemAtChest did not move a named item into shared storage with ledger identity";
      }
      return steps
        .slice(depositIndex + 1)
        .some((step) =>
          hasDeliveredSpeechEvidence(step, isHandoffText)
        )
        ? null
        : "handoffItemAtChest did not announce the shared chest handoff with handoff text";
    }
  },
  waitForBusyCrafter: {
    skillId: "waitForBusyCrafter",
    evidenceSummary: ["say result confirmed targeted busy state", "wait completed", "say result confirmed targeted follow-up text"],
    minimumPassingTranscript: {
      steps: [
        { tool: "say", args: { target: "npc_target", text: "are you free to talk?" }, result: { status: "busy", actorId: "npc_b", targetId: "npc_target", reason: "npc_target is busy" } },
        { tool: "wait", result: { status: "waited", ticks: 20, durationMs: 1000 } },
        { tool: "say", args: { target: "npc_target", text: "checking again when you are ready" }, result: { status: "delivered", actorId: "npc_b", targetId: "npc_target", text: "checking again when you are ready" } }
      ]
    },
    validate(steps) {
      const busyIndex = steps.findIndex(
        (step) => step.tool === "say" &&
          asRecord(step.result).status === "busy" &&
          hasDirectedTargetArg(step) &&
          hasDirectedTargetResult(step)
      );
      if (busyIndex < 0) {
        return "waitForBusyCrafter did not observe a busy response";
      }
      const waitIndex = steps.findIndex(
        (step, index) => index > busyIndex && hasBoundedWaitResult(step)
      );
      if (waitIndex < 0) {
        return "waitForBusyCrafter did not wait after busy response";
      }
      return steps
        .slice(waitIndex + 1)
        .some((step) =>
          hasDeliveredSpeechEvidence(step, isFollowUpText)
        )
        ? null
        : "waitForBusyCrafter did not deliver a follow-up message after waiting";
    }
  }
};

export async function validateProbePostcondition(skillId: SeedActionSkillId, transcriptPath: string) {
  const payload = JSON.parse(await fs.readFile(transcriptPath, "utf8")) as ProbeTranscriptPayload;
  const steps = payload.steps ?? [];

  const spec = actionSkillPostconditionSpecs[skillId];
  if (!spec) {
    return `Missing action skill probe postcondition spec: ${skillId}`;
  }

  return spec.validate(steps);
}

export function classifyActionSkillProbeOutcome(input: {
  final: ActionSkillProbeFinal;
  postconditionFailure: string | null;
}): Pick<
  ActionSkillProbeResult,
  "status" | "finalWhy" | "terminalStatus" | "terminalWhy" | "postconditionStatus" | "postconditionFailure" | "failureKind"
> {
  const postconditionStatus = input.postconditionFailure ? "failed" : "passed";
  const base = {
    terminalStatus: input.final.status,
    terminalWhy: input.final.why,
    postconditionStatus,
    ...(input.postconditionFailure ? { postconditionFailure: input.postconditionFailure } : {})
  } satisfies Pick<
    ActionSkillProbeResult,
    "terminalStatus" | "terminalWhy" | "postconditionStatus" | "postconditionFailure"
  >;

  if (input.final.status === "success" && !input.postconditionFailure) {
    return {
      status: "passed",
      finalWhy: input.final.why,
      ...base
    };
  }

  if (input.final.status === "success") {
    return {
      status: "failed",
      finalWhy: input.postconditionFailure ?? input.final.why,
      failureKind: "postcondition_failed",
      ...base
    };
  }

  if (!input.postconditionFailure) {
    return {
      status: "failed",
      finalWhy: `terminal status ${input.final.status} even though postcondition passed: ${input.final.why}`,
      failureKind: "terminal_failed",
      ...base
    };
  }

  return {
    status: "failed",
    finalWhy: `${input.final.why}; postcondition: ${input.postconditionFailure}`,
    failureKind: "terminal_and_postcondition_failed",
    ...base
  };
}

/**
 * Builds a minimal set of active action skill records that restricts the
 * runtime gate to only the primitives required by the target skill.
 *
 * The runner creates a synthetic active record so the existing agentLoop gate
 * can be reused without modification. This keeps the probe narrow: the actor
 * can only use primitives declared by the skill under test.
 */
export function buildSkillProbeActionSkillRecords(
  config: ActionSkillProbeConfig
): ActorActionSkillRecord[] {
  const skill = getSeedActionSkill(config.skillId);

  if (skill.runtimeStatus !== "implemented") {
    throw new Error(
      `Cannot probe skill ${config.skillId}: runtime status is "${skill.runtimeStatus}", not "implemented"`
    );
  }

  if (!skill.validRoles.includes(config.roleId)) {
    throw new Error(
      `Skill ${config.skillId} is not valid for role "${config.roleId}". Valid roles: ${skill.validRoles.join(", ")}`
    );
  }

  const now = new Date().toISOString();

  return [
    {
      schema: "actor-action-skill/v1",
      skill_id: config.skillId,
      owner_actor_id: config.actorId,
      source_kind: "seed",
      status: "active",
      created_at: now,
      updated_at: now,
      required_primitives: [...skill.primitiveIds],
      preconditions: [...skill.preconditions],
      success_verifier: `runtime verifier for ${config.skillId}`,
      known_failure_modes: [],
      evidence_refs: [],
      review_refs: [],
      notes: `Skill probe synthetic record for ${config.skillId}`
    },
    // Always include the runtimeObserveAndRemember skill so the agent can
    // terminate the loop with remember and observe state.
    ...(config.skillId !== "runtimeObserveAndRemember"
      ? [
          {
            schema: "actor-action-skill/v1" as const,
            skill_id: "runtimeObserveAndRemember",
            owner_actor_id: config.actorId,
            source_kind: "seed" as const,
            status: "active" as const,
            created_at: now,
            updated_at: now,
            required_primitives: ["observe", "wait", "remember"],
            preconditions: [],
            success_verifier: "runtime verifier for runtimeObserveAndRemember",
            known_failure_modes: [],
            evidence_refs: [],
            review_refs: [],
            notes: "Baseline control bundle for skill probe"
          }
        ]
      : [])
  ];
}

/**
 * Loads the verification contract for the skill and returns the allowed
 * primitive set. Use this to validate probe results after execution.
 */
export function loadSkillProbeContract(skillId: SeedActionSkillId): {
  contract: ActionSkillVerificationContract;
  allowedPrimitives: AllowedTool[];
} {
  const contract = getActionSkillVerificationContract(skillId);
  const allowedPrimitives = [...contract.primitiveIds] as AllowedTool[];

  // Ensure observe, wait, remember are always available.
  for (const baseline of ["observe", "wait", "remember"] as AllowedTool[]) {
    if (!allowedPrimitives.includes(baseline)) {
      allowedPrimitives.push(baseline);
    }
  }

  return { contract, allowedPrimitives };
}

/**
 * Validates the probe config before execution. Throws for invalid or
 * unimplemented skill requests.
 */
export function validateSkillProbeConfig(config: ActionSkillProbeConfig): void {
  if (!config.actorId || config.actorId.trim().length === 0) {
    throw new Error("--actor is required");
  }

  if (!config.skillId || config.skillId.trim().length === 0) {
    throw new Error("--skill is required");
  }

  // getSeedActionSkill throws for unknown skills
  const skill = getSeedActionSkill(config.skillId);

  if (skill.runtimeStatus !== "implemented") {
    throw new Error(
      `Skill "${config.skillId}" is planned but not implemented. ` +
      `Missing primitives: ${skill.missingPrimitives?.join(", ") ?? "unknown"}`
    );
  }

  if (config.maxActions < 1) {
    throw new Error("--max-actions must be at least 1");
  }

  if (!hasDeterministicActionSkillProbeDriver(config.skillId)) {
    throw new Error(`Action skill ${config.skillId} is implemented but has no deterministic live probe driver`);
  }

  if (!getActionSkillProbePreconditionMode(config.skillId)) {
    throw new Error(`Action skill ${config.skillId} is implemented but has no live probe precondition mode`);
  }
}

/**
 * Runs one action skill through the real Mineflayer runtime loop with a narrowed
 * active-action-skill gate. This is the live harness from the handoff: it
 * creates evidence from actual bot state and fails when the loop cannot reach a
 * runtime-verifiable terminal result within the configured action budget.
 */
export async function runLiveActionSkillProbe(
  input: ActionSkillProbeConfig
): Promise<ActionSkillProbeResult> {
  validateSkillProbeConfig(input);

  const { contract, allowedPrimitives } = loadSkillProbeContract(input.skillId);
  const activeActionSkills = buildSkillProbeActionSkillRecords(input);
  const config = buildProbeConfig(input);
  let server: ServerEndpoint | null = null;
  let bots: ProbeBots | null = null;
  let runRcon: RconRunner | undefined;

  try {
    const serverContext = await ensureProbeServer(config);
    server = serverContext.server;
    console.log(`minecraft_direct_connect=${server.host}:${server.port}`);

    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });
    runRcon = serverContext.rconContext
      ? await createRconRunner(serverContext.rconContext)
      : undefined;
    await teleportProbeBotsToSpawn(bots, config.spawn, runRcon);
    await setupProbePreconditions({
      bots,
      actorId: input.actorId,
      skillId: input.skillId,
      spawnConfig: config.spawn,
      runRcon
    });

    const actor = bots[input.actorId];
    const target = bots[Object.keys(bots).find((actorId) => actorId !== input.actorId) ?? input.actorId];
    if (!actor || !target) {
      throw new Error(`Probe bot roster did not contain actor ${input.actorId}`);
    }

    const memory = createMemory(config.memoryLimit);
    const dialogueState = createDialogueState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable
    });
    const provider = createActionSkillProbeProvider(
      input.skillId,
      target.username,
      defaultBuildAnchor(actor)
    );
    const sharedStorageLedger = createSharedStorageLedger();
    const teamBulletin = createTeamBulletin();
    const sharedSettlementState = createSharedSettlementState();
    const sharedChest = createMineflayerSharedChestAccessor(actor);
    const transcript = createTranscript({
      evidenceDir: config.evidenceDir,
      probeId: config.probeId,
      bots: Object.keys(bots),
      metadata: {
        action_skill_probe: {
          actor_id: input.actorId,
          skill_id: input.skillId,
          role_id: input.roleId,
          max_actions: input.maxActions,
          allowed_primitives: allowedPrimitives,
          verification_contract: contract
        }
      }
    });

    function readActorInventory() {
      return actor.inventory?.items().map((item) => ({
        name: item.name,
        count: item.count
      })) ?? [];
    }

    const final = await runAgentLoop({
      bots: { actor, target },
      roleId: input.roleId,
      provider,
      maxActions: input.maxActions,
      initialCompletedTaskIds: probeCompletedTaskHints[input.skillId] ?? [],
      activeActionSkills,
      stopAfterRuntimeTaskCompletion: false,
      artifacts: {
        actorWorkspaceRootDir: config.actorWorkspace.rootDir,
        providerInputSnapshots: {
          provider_id: actionSkillProbeProviderMetadata.provider_id,
          model: actionSkillProbeProviderMetadata.model
        },
        providerOutputSnapshots: {
          provider_id: actionSkillProbeProviderMetadata.provider_id,
          model: actionSkillProbeProviderMetadata.model
        }
      },
      transcript,
      onEvent: input.onEvent,
      tools: {
        validateProposal,
        observe: ({ actor, target }) =>
          observe({
            actor: asObserveActor(actor),
            target: asObserveActor(target),
            dialogueState,
            memory,
            sharedChest
          }),
        move_to: ({ actor, target, args }) =>
          withActionWrapper(
            () => {
              const targetId = readStringArg(args, "target");
              assertTarget(targetId, target.username);
              return moveTo({ actor, target, targetId });
            },
            { tool: "move_to" }
          ),
        collect_logs: ({ actor, args }) =>
          withActionWrapper(
            (signal) =>
              collectLogs({
                bot: actor,
                signal,
                targetCount: readOptionalPositiveIntegerArg(args, "targetCount")
              }),
            { tool: "collect_logs" }
          ),
        mine_block: ({ actor, args }) =>
          withActionWrapper(
            (signal) =>
              mineBlock({
                bot: actor,
                signal,
                blockName: readStringArg(args, "blockName"),
                itemName: readStringArg(args, "itemName"),
                targetCount: readOptionalPositiveIntegerArg(args, "targetCount")
              }),
            { tool: "mine_block" }
          ),
        craft_item: ({ actor, args }) =>
          withActionWrapper(
            () => craftItem({ bot: actor, itemName: readStringArg(args, "itemName") }),
            { tool: "craft_item" }
          ),
        craft_with_table: ({ actor, args }) =>
          withActionWrapper(
            () => craftWithTable({ bot: actor, itemName: readStringArg(args, "itemName") }),
            { tool: "craft_with_table" }
          ),
        consume_item: ({ actor, args }) =>
          withActionWrapper(
            (signal) => consumeItem({
              bot: actor,
              itemName: readStringArg(args, "itemName"),
              signal
            }),
            { tool: "consume_item" }
          ),
        run_mineflayer_program: ({ actor, target, args }) =>
          withActionWrapper(
            (signal) => runMineflayerProgram({
              actorId: actor.username,
              bot: actor,
              targetBot: target,
              source: readStringArg(args, "source"),
              purpose: typeof args.purpose === "string" ? args.purpose : undefined,
              expectedObservation:
                typeof args.expectedObservation === "string"
                  ? args.expectedObservation
                  : undefined,
              timeoutMs: typeof args.timeoutMs === "number" ? args.timeoutMs : undefined,
              artifactDir: path.join(
                getActorWorkspacePaths(config.actorWorkspace.rootDir, actor.username).actorDir,
                "action-skills",
                "direct-trials"
              ),
              signal
            }),
            { tool: "run_mineflayer_program", timeoutMs: 12_000 }
          ),
        place_block: ({ actor, args }) =>
          withActionWrapper(
            (signal) => placeBlock({
              bot: actor,
              itemName: readStringArg(args, "itemName"),
              targetPosition: optionalPositionArg(args, "targetPosition") ?? defaultPlaceTarget(actor),
              signal
            }),
            { tool: "place_block" }
          ),
        build_pattern: ({ actor, args }) =>
          withActionWrapper(
            (signal) => buildPattern({
              bot: actor,
              anchor: optionalPositionArg(args, "anchor") ?? defaultBuildAnchor(actor),
              preferredMaterials: Array.isArray(args.preferredMaterials)
                ? args.preferredMaterials.filter((entry): entry is string => typeof entry === "string")
                : [],
              maxPlacements: typeof args.maxPlacements === "number"
                ? Math.max(1, Math.floor(args.maxPlacements))
                : 64,
              signal
            }),
            { tool: "build_pattern" }
          ),
        inspect_chest: () =>
          withActionWrapper(
            async () => {
              const result = await inspectChest({
                actorId: actor.username,
                roleId: input.roleId,
                chest: sharedChest,
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                currentTask: getRoleContract(input.roleId).priorityList[0]
              });

              if (result.status === "inspected") {
                sharedSettlementState.rememberSharedChest(result.chestId, result.items ?? []);
              }

              return result;
            },
            { tool: "inspect_chest" }
          ),
        deposit_shared: ({ args }) =>
          withActionWrapper(
            async () => {
              const result = await depositToSharedChest({
                actorId: actor.username,
                roleId: input.roleId,
                chest: sharedChest,
                inventory: {
                  items: readActorInventory
                },
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                itemName: readStringArg(args, "itemName"),
                count: typeof args.count === "number" ? args.count : 1,
                currentTask: "deposit_shared_materials"
              });

              sharedSettlementState.rememberSharedChest(
                result.chestId,
                sharedStorageLedger.latestChest(result.chestId) ?? []
              );

              return result;
            },
            { tool: "deposit_shared" }
          ),
        withdraw_shared: ({ args }) =>
          withActionWrapper(
            async () => {
              const result = await withdrawFromSharedChest({
                actorId: actor.username,
                roleId: input.roleId,
                chest: sharedChest,
                inventory: {
                  items: readActorInventory
                },
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                itemName: readStringArg(args, "itemName"),
                count: typeof args.count === "number" ? args.count : 1,
                reason:
                  typeof args.reason === "string" && args.reason.length > 0
                    ? args.reason
                    : "action skill probe withdrawal",
                currentTask: getRoleContract(input.roleId).priorityList[0]
              });

              sharedSettlementState.rememberSharedChest(
                result.chestId,
                sharedStorageLedger.latestChest(result.chestId) ?? []
              );

              return result;
            },
            { tool: "withdraw_shared" }
          ),
        say: ({ actor, target, args }) =>
          withActionWrapper(
            () => {
              const targetId = readStringArg(args, "target");
              const text = readStringArg(args, "text");
              assertTarget(targetId, target.username);
              return say({ actor, target, dialogueState, text });
            },
            { tool: "say" }
          ),
        wait: ({ args }) =>
          withActionWrapper(
            () => wait({ ticks: readTicksArg(args) }),
            { tool: "wait" }
          ),
        remember: ({ args }) =>
          withActionWrapper(
            () => remember({ memory, note: readStringArg(args, "note") }),
            { tool: "remember" }
          )
      }
    });

    const transcriptPath = await transcript.write({
      status: final.status,
      why: final.why,
      action_skill_probe: {
        actor_id: input.actorId,
        skill_id: input.skillId,
        role_id: input.roleId,
        allowed_primitives: allowedPrimitives,
        verification_contract: contract
      }
    });

    const postconditionFailure = await validateProbePostcondition(input.skillId, transcriptPath);
    const outcome = classifyActionSkillProbeOutcome({
      final,
      postconditionFailure
    });

    return {
      status: outcome.status,
      skillId: input.skillId,
      actorId: input.actorId,
      contract,
      allowedPrimitives,
      transcriptPath,
      finalWhy: outcome.finalWhy,
      terminalStatus: outcome.terminalStatus,
      terminalWhy: outcome.terminalWhy,
      postconditionStatus: outcome.postconditionStatus,
      ...(outcome.postconditionFailure ? { postconditionFailure: outcome.postconditionFailure } : {}),
      ...(outcome.failureKind ? { failureKind: outcome.failureKind } : {})
    };
  } catch (error) {
    return {
      status: "error",
      skillId: input.skillId,
      actorId: input.actorId,
      contract,
      allowedPrimitives,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (runRcon && input.skillId === "eatFoodWhenHungry") {
      await runRcon(["difficulty", "peaceful"]).catch(() => {});
    }
    if (bots) {
      await closeBots(bots);
    }
    if (server) {
      await server.stop();
    }
  }
}
