import { randomUUID } from "node:crypto";
import type { Bot } from "mineflayer";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

import type { AllowedTool } from "../tools/index.js";
import { validateProposal } from "../tools/index.js";
import type { ActionIntent } from "./goals/types.js";
import type { ActorCycleGoal } from "./goals/types.js";
import {
  buildActiveActionSkillGate,
  checkActiveActionSkillPermission,
  type ActiveActionSkillGate
} from "./activeActionSkillGate.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import { writeActorEvidenceRecord } from "./evidence/actorEvidence.js";
import { createDialogueState } from "./dialogueState.js";
import { createMemory } from "./memory.js";
import { observe, type ObserveResult } from "../tools/observe.js";
import { wait } from "../tools/wait.js";
import { remember } from "../tools/remember.js";
import { collectLogs } from "../tools/collectLogs.js";
import { mineBlock } from "../tools/mineBlock.js";
import { craftItem } from "../tools/craftItem.js";
import { craftWithTable } from "../tools/craftWithTable.js";
import { placeBlock } from "../tools/placeBlock.js";
import { buildPattern } from "../tools/buildPattern.js";
import { createMineflayerSharedChestAccessor } from "../tools/liveSharedChest.js";
import { depositToSharedChest, inspectChest, withdrawFromSharedChest } from "../tools/sharedChest.js";
import { say } from "../tools/say.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { getActorWorkspacePaths } from "./actorWorkspacePaths.js";
import {
  canDepositSharedItem,
  getRoleContract,
  readKeepItemCount,
  type RoleId
} from "../npc/roles/contracts.js";
import { getActorProfile } from "../npc/profiles.js";
import { createSharedStorageLedger } from "../gameplay/storage/sharedStorageLedger.js";
import { createTeamBulletin } from "../npc/social/teamBulletin.js";
import {
  deriveProgressVerifierStatus,
  type SocialPrimitiveAttemptStatus
} from "./socialCycleProgress.js";
import {
  evaluateSocialActionSkillPostcondition,
  type ActionSkillPostconditionResult,
  type ToolResultRecord
} from "./settlement/settlementState.js";

export const SOCIAL_EXECUTABLE_PRIMITIVES: ReadonlySet<string> = new Set([
  "observe",
  "move_to",
  "wait",
  "remember",
  "collect_logs",
  "mine_block",
  "craft_item",
  "craft_with_table",
  "place_block",
  "build_pattern",
  "inspect_chest",
  "deposit_shared",
  "withdraw_shared",
  "say"
]);

export function isSocialExecutablePrimitive(primitiveId: string): primitiveId is AllowedTool {
  return SOCIAL_EXECUTABLE_PRIMITIVES.has(primitiveId);
}

export function filterExecutableSocialActionSkills(
  records: readonly ActorActionSkillRecord[]
): ActorActionSkillRecord[] {
  return records.filter((record) =>
    record.required_primitives.length > 0 &&
    record.required_primitives.every(isSocialExecutablePrimitive)
  );
}

export type SocialCycleExecutionResult = {
  observation: ObserveResult | Record<string, unknown>;
  runtimeResult: JsonValue;
  evidenceRefs: string[];
  executedTools: string[];
  toolStatuses: SocialPrimitiveAttemptStatus[];
  verifierStatus: "passed" | "failed" | "not_applicable";
  gateBlocked: boolean;
  actionSkillExecutionUnit: boolean;
  postconditionResults: ActionSkillPostconditionResult[];
  toolResults: ToolResultRecord[];
};

export type SocialMovementPolicy = {
  maxDistanceBlocks: number;
  allowedTargets: string[];
  requiresMeasuredMovementEvidence: boolean;
};

export const DEFAULT_SOCIAL_MOVEMENT_POLICY: SocialMovementPolicy = {
  maxDistanceBlocks: 12,
  allowedTargets: ["bounded_scout_waypoint", "observed_resource", "known_settlement_position", "visible_actor"],
  requiresMeasuredMovementEvidence: true
};

function syntheticObservation(actorId: string): ObserveResult {
  return {
    status: "ok",
    observerId: actorId,
    position: { x: 0, y: 0, z: 0 },
    visibleActors: [],
    memory: ["synthetic observation: no live world connection"],
    inventory: []
  };
}

function asObserveActor(bot: Bot) {
  return bot as unknown as Parameters<typeof observe>[0]["actor"];
}

export async function observeActorWorld(input: {
  actorId: string;
  bot?: Bot;
  targetBot?: Bot;
}): Promise<ObserveResult | Record<string, unknown>> {
  if (!input.bot) {
    return syntheticObservation(input.actorId);
  }

  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 0 });
  const memory = createMemory(8);
  const target = input.targetBot ?? input.bot;
  return observe({
    actor: asObserveActor(input.bot),
    target: asObserveActor(target),
    dialogueState,
    memory
  });
}

export function evidenceRefFromPath(actorDir: string, evidencePath: string) {
  return evidencePath.startsWith(actorDir)
    ? evidencePath.slice(actorDir.length + 1)
    : evidencePath;
}

async function writeToolEvidence(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  evidenceId: string;
  tool: string;
  args: Record<string, unknown>;
  result: JsonValue;
  verifierReason: string;
}) {
  const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  const evidencePath = await writeActorEvidenceRecord(input.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: input.evidenceId,
    actor_id: input.actorId,
    category: "tool_attempt",
    created_at: new Date().toISOString(),
    turn_id: input.cycleId,
    tool_attempt: {
      tool: input.tool,
      args: JSON.parse(JSON.stringify(input.args)) as JsonValue,
      result: input.result
    },
    verifier_reason: input.verifierReason
  });
  return evidenceRefFromPath(paths.actorDir, evidencePath);
}

function readToolStatus(toolResult: JsonValue): string {
  if (
    typeof toolResult === "object" &&
    toolResult !== null &&
    !Array.isArray(toolResult) &&
    typeof (toolResult as { status?: unknown }).status === "string"
  ) {
    return String((toolResult as { status: string }).status);
  }
  return "unknown";
}

function readTicks(args: Record<string, unknown>) {
  return typeof args.ticks === "number" ? args.ticks : 20;
}

function readString(args: Record<string, unknown>, key: string, fallback: string) {
  return typeof args[key] === "string" ? args[key] : fallback;
}

function readOptionalString(args: Record<string, unknown>, key: string) {
  return typeof args[key] === "string" && args[key].trim().length > 0
    ? args[key].trim()
    : undefined;
}

function readOptionalCount(args: Record<string, unknown>) {
  return typeof args.targetCount === "number" ? args.targetCount : undefined;
}

function readTransferCount(args: Record<string, unknown>) {
  if (typeof args.count === "number") {
    return Math.max(1, Math.floor(args.count));
  }
  if (typeof args.targetCount === "number") {
    return Math.max(1, Math.floor(args.targetCount));
  }
  return 64;
}

function chooseDepositItemName(input: {
  bot: Bot;
  roleId: RoleId;
  args: Record<string, unknown>;
}) {
  const explicit = readOptionalString(input.args, "itemName");
  if (explicit) {
    return explicit;
  }

  const priority = [
    "crafting_table",
    "wooden_pickaxe",
    "cobblestone",
    "stick",
    "oak_planks",
    "birch_planks",
    "spruce_planks",
    "jungle_planks",
    "acacia_planks",
    "dark_oak_planks",
    "mangrove_planks",
    "cherry_planks",
    "pale_oak_planks",
    "oak_log",
    "birch_log",
    "spruce_log",
    "jungle_log",
    "acacia_log",
    "dark_oak_log",
    "mangrove_log",
    "cherry_log",
    "pale_oak_log"
  ];
  const priorityIndex = (itemName: string) => {
    const index = priority.indexOf(itemName);
    return index === -1 ? priority.length : index;
  };
  const items = input.bot.inventory.items()
    .filter((item) => canDepositSharedItem(input.roleId, item.name))
    .filter((item) => item.count > readKeepItemCount(input.roleId, item.name))
    .sort((left, right) => {
      const priorityDelta = priorityIndex(left.name) - priorityIndex(right.name);
      return priorityDelta !== 0 ? priorityDelta : right.count - left.count;
    });

  return items[0]?.name;
}

function planksForLog(itemName: string) {
  return itemName.endsWith("_log") ? itemName.replace(/_log$/, "_planks") : undefined;
}

function chooseCraftItemName(input: {
  bot: Bot;
  args: Record<string, unknown>;
}) {
  const explicit = readOptionalString(input.args, "itemName");
  if (explicit) {
    return normalizeCraftItemName(input.bot, explicit);
  }

  const actionSkillId = readOptionalString(input.args, "actionSkillId");
  if (actionSkillId === "craftCraftingTable") {
    return "crafting_table";
  }
  if (actionSkillId === "craftWoodenPickaxe") {
    return "wooden_pickaxe";
  }
  if (actionSkillId === "craftPlanksAndSticks") {
    const inventory = input.bot.inventory.items();
    const planks = inventory.find((item) => item.name.endsWith("_planks") && item.count >= 2);
    const hasSticks = inventory.some((item) => item.name === "stick" && item.count > 0);
    if (planks && !hasSticks) {
      return "stick";
    }
    const log = inventory.find((item) => item.name.endsWith("_log") && item.count > 0);
    const plankName = log ? planksForLog(log.name) : undefined;
    return plankName ?? (planks ? "stick" : undefined);
  }

  return undefined;
}

function firstCraftablePlanksName(bot: Bot) {
  const log = bot.inventory.items().find((item) => item.name.endsWith("_log") && item.count > 0);
  return log ? planksForLog(log.name) : undefined;
}

function normalizeCraftItemName(bot: Bot, itemName: string) {
  const normalized = itemName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (bot.registry.itemsByName[normalized]) {
    return normalized;
  }

  if (normalized === "sticks") {
    return "stick";
  }

  if (normalized === "planks" || normalized === "wood_planks") {
    return firstCraftablePlanksName(bot) ?? "oak_planks";
  }

  if (normalized === "planks_and_sticks" || normalized === "wood_planks_and_sticks") {
    const hasPlanks = bot.inventory.items().some((item) => item.name.endsWith("_planks") && item.count >= 2);
    return hasPlanks ? "stick" : (firstCraftablePlanksName(bot) ?? "oak_planks");
  }

  if (normalized === "wood_pickaxe" || normalized === "pickaxe") {
    return "wooden_pickaxe";
  }

  return normalized;
}

function argsForPrimitive(intent: ActionIntent, primitive: AllowedTool) {
  return {
    ...intent.args,
    ...(intent.action_skill_id ? { actionSkillId: intent.action_skill_id } : {}),
    primitiveId: primitive
  };
}

type Positioned = { x: number; y: number; z: number };

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function positionOf(bot: Bot): Positioned {
  return {
    x: bot.entity.position.x,
    y: bot.entity.position.y,
    z: bot.entity.position.z
  };
}

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function readPositionedObject(value: unknown): Positioned | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.x === "number" &&
    typeof record.y === "number" &&
    typeof record.z === "number"
  ) {
    return { x: record.x, y: record.y, z: record.z };
  }
  return null;
}

function readStringArray(args: Record<string, unknown>, key: string) {
  const raw = args[key];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function choosePlaceBlockItemName(input: {
  bot: Bot;
  args: Record<string, unknown>;
}) {
  const explicit = readOptionalString(input.args, "itemName") ?? readOptionalString(input.args, "blockName");
  if (explicit) {
    return normalizeCraftItemName(input.bot, explicit);
  }
  const actionSkillId = readOptionalString(input.args, "actionSkillId");
  if (actionSkillId === "placeCraftingTable") {
    return "crafting_table";
  }
  return undefined;
}

function readPlacementTarget(bot: Bot, args: Record<string, unknown>): Positioned {
  return (
    readPositionedObject(args.targetPosition) ??
    readPositionedObject(args.target_position) ??
    readPositionedObject(args.position) ??
    readPositionedObject(args) ??
    {
      x: Math.floor(bot.entity.position.x) + 1,
      y: Math.floor(bot.entity.position.y),
      z: Math.floor(bot.entity.position.z)
    }
  );
}

function readBuildAnchor(bot: Bot, args: Record<string, unknown>): Positioned {
  return (
    readPositionedObject(args.anchor) ??
    readPositionedObject(args.targetPosition) ??
    readPositionedObject(args.position) ??
    readPositionedObject(args) ??
    {
      x: Math.floor(bot.entity.position.x) + 2,
      y: Math.floor(bot.entity.position.y),
      z: Math.floor(bot.entity.position.z) + 2
    }
  );
}

function readScoutDistance(args: Record<string, unknown>) {
  const raw = typeof args.distance === "number" ? args.distance : 8;
  return Math.max(2, Math.min(12, Math.floor(raw)));
}

function readScoutTarget(args: Record<string, unknown>, origin: Positioned): Positioned {
  const objectTarget =
    readPositionedObject(args.position) ??
    readPositionedObject(args.targetPosition) ??
    readPositionedObject(args.target_position);
  if (objectTarget) {
    return objectTarget;
  }

  if (
    typeof args.x === "number" &&
    typeof args.y === "number" &&
    typeof args.z === "number"
  ) {
    return { x: args.x, y: args.y, z: args.z };
  }

  const step = readScoutDistance(args);
  const direction = typeof args.direction === "string" ? args.direction.toLowerCase() : "east";
  switch (direction) {
    case "north":
      return { x: origin.x, y: origin.y, z: origin.z - step };
    case "south":
      return { x: origin.x, y: origin.y, z: origin.z + step };
    case "west":
      return { x: origin.x - step, y: origin.y, z: origin.z };
    case "east":
    default:
      return { x: origin.x + step, y: origin.y, z: origin.z };
  }
}

function blockAt(bot: Bot, x: number, y: number, z: number) {
  return bot.blockAt(new Vec3(Math.floor(x), Math.floor(y), Math.floor(z)));
}

function isAirLikeBlock(block: unknown) {
  const name = (block as { name?: unknown } | null)?.name;
  return name === "air" || name === "cave_air" || name === "void_air";
}

function hasSolidCollision(block: unknown) {
  const box = (block as { boundingBox?: unknown } | null)?.boundingBox;
  if (box === "block") {
    return true;
  }
  const name = (block as { name?: unknown } | null)?.name;
  return typeof name === "string" && !isAirLikeBlock(block) && name !== "water" && name !== "lava";
}

function resolveSurfaceTarget(bot: Bot, target: Positioned, origin: Positioned): Positioned {
  const x = Math.floor(target.x);
  const z = Math.floor(target.z);
  const startY = Math.floor(Math.max(origin.y, target.y)) + 8;
  const minY = Math.floor(Math.min(origin.y, target.y)) - 16;

  for (let y = startY; y >= minY; y -= 1) {
    const support = blockAt(bot, x, y - 1, z);
    const feet = blockAt(bot, x, y, z);
    const head = blockAt(bot, x, y + 1, z);
    if (hasSolidCollision(support) && isAirLikeBlock(feet) && isAirLikeBlock(head)) {
      return { x: x + 0.5, y, z: z + 0.5 };
    }
  }

  return target;
}

async function manualMoveToward(input: {
  bot: Bot;
  target: Positioned;
  durationMs: number;
}) {
  await input.bot.lookAt(new Vec3(input.target.x, input.target.y, input.target.z), true);
  input.bot.setControlState("sprint", true);
  input.bot.setControlState("forward", true);
  try {
    await delay(input.durationMs);
  } finally {
    input.bot.setControlState("forward", false);
    input.bot.setControlState("sprint", false);
  }
}

async function runSocialMoveTo(input: {
  bot: Bot;
  args: Record<string, unknown>;
  movementPolicy?: SocialMovementPolicy;
}): Promise<JsonValue> {
  const before = positionOf(input.bot);
  const requestedTarget = readScoutTarget(input.args, before);
  const target = resolveSurfaceTarget(input.bot, requestedTarget, before);
  const movementPolicy = input.movementPolicy ?? DEFAULT_SOCIAL_MOVEMENT_POLICY;
  const requestedDistance = distance(before, target);
  if (requestedDistance > movementPolicy.maxDistanceBlocks + 0.5) {
    return {
      status: "blocked",
      requestedTarget,
      target,
      beforePosition: before,
      distanceMoved: 0,
      distanceToTarget: round(requestedDistance),
      movementPolicy,
      reason: `move_to target is ${round(requestedDistance)} blocks away, above bounded social movement limit ${movementPolicy.maxDistanceBlocks}.`
    } as JsonValue;
  }
  const timeoutMs = typeof input.args.timeoutMs === "number" ? input.args.timeoutMs : 8_000;
  const manualDurationMs =
    typeof input.args.durationMs === "number" ? input.args.durationMs : 1_200;
  let pathfinderFailureReason: string | undefined;
  let manualFallbackUsed = false;

  if (input.bot.pathfinder) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        input.bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 1)),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            input.bot.pathfinder.stop?.();
            reject(new Error(`move_to scout timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        })
      ]);
    } catch (error) {
      input.bot.pathfinder.stop?.();
      pathfinderFailureReason = error instanceof Error ? error.message : String(error);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  } else {
    manualFallbackUsed = true;
    await manualMoveToward({ bot: input.bot, target, durationMs: manualDurationMs });
  }

  const afterPathfinder = positionOf(input.bot);
  if (pathfinderFailureReason && distance(before, afterPathfinder) < 1) {
    manualFallbackUsed = true;
    await manualMoveToward({ bot: input.bot, target, durationMs: manualDurationMs });
  }

  const after = positionOf(input.bot);
  const distanceMoved = round(distance(before, after));
  const distanceToTarget = round(distance(after, target));
  const arrived = distanceToTarget <= 2.5;
  const moved = distanceMoved >= 1;

  return {
    status: arrived ? "arrived" : moved ? "moved" : "blocked",
    requestedTarget,
    target,
    beforePosition: before,
    afterPosition: after,
    distanceMoved,
    distanceToTarget,
    pathfinderFailureReason,
    manualFallbackUsed,
    movementPolicy,
    reason: arrived
      ? "move_to reached the bounded scouting waypoint."
      : moved
        ? `move_to moved ${distanceMoved} blocks toward the scouting waypoint${pathfinderFailureReason ? " after pathfinder fallback" : ""}.`
        : pathfinderFailureReason
          ? `move_to scout failed: ${pathfinderFailureReason}; manual fallback also produced no measured movement.`
          : "move_to did not produce measured movement."
  } as JsonValue;
}

async function runSocialPrimitive(input: {
  actorId: string;
  tool: AllowedTool;
  args: Record<string, unknown>;
  bot: Bot;
  targetBot?: Bot;
}): Promise<JsonValue> {
  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 0 });
  const memory = createMemory(8);
  const actor = asObserveActor(input.bot);
  const target = asObserveActor(input.targetBot ?? input.bot);
  const proposal = validateProposal({ tool: input.tool, args: input.args });
  const roleId = getActorProfile(input.actorId).gameplay_role;

  switch (proposal.tool) {
    case "observe": {
      const observed = await observe({ actor, target, dialogueState, memory });
      return observed as unknown as JsonValue;
    }
    case "move_to":
      return runSocialMoveTo({
        bot: input.bot,
        args: proposal.args,
        movementPolicy: DEFAULT_SOCIAL_MOVEMENT_POLICY
      });
    case "wait":
      return (await wait({ ticks: readTicks(proposal.args) })) as unknown as JsonValue;
    case "remember":
      return remember({
        memory,
        note: readString(proposal.args, "note", "social cycle")
      }) as unknown as JsonValue;
    case "collect_logs":
      return (await collectLogs({
        bot: input.bot,
        targetCount: readOptionalCount(proposal.args)
      })) as unknown as JsonValue;
    case "mine_block":
      return (await mineBlock({
        bot: input.bot,
        blockName: readString(proposal.args, "blockName", "stone"),
        targetCount: readOptionalCount(proposal.args),
        searchDistance: typeof proposal.args.searchDistance === "number"
          ? Math.max(4, Math.min(48, Math.floor(proposal.args.searchDistance)))
          : undefined
      })) as unknown as JsonValue;
    case "craft_item": {
      const itemName = chooseCraftItemName({ bot: input.bot, args: proposal.args });
      if (!itemName) {
        return { status: "blocked", reason: "craft_item requires itemName" };
      }
      return (await craftItem({ bot: input.bot, itemName })) as unknown as JsonValue;
    }
    case "craft_with_table": {
      const itemName = chooseCraftItemName({ bot: input.bot, args: proposal.args });
      if (!itemName) {
        return { status: "blocked", reason: "craft_with_table requires itemName" };
      }
      return (await craftWithTable({ bot: input.bot, itemName })) as unknown as JsonValue;
    }
    case "place_block": {
      const itemName = choosePlaceBlockItemName({ bot: input.bot, args: proposal.args });
      if (!itemName) {
        return { status: "blocked", reason: "place_block requires explicit itemName or a station-placement action skill" };
      }
      if (roleId !== "settler" && itemName !== "crafting_table") {
        return {
          status: "blocked",
          reason: `${roleId} may only use place_block for verified crafting_table placement`
        };
      }
      return (await placeBlock({
        bot: input.bot,
        itemName,
        targetPosition: readPlacementTarget(input.bot, proposal.args)
      })) as unknown as JsonValue;
    }
    case "build_pattern":
      return (await buildPattern({
        bot: input.bot,
        anchor: readBuildAnchor(input.bot, proposal.args),
        preferredMaterials: [
          ...readStringArray(proposal.args, "preferredMaterials"),
          ...readStringArray(proposal.args, "preferred_materials"),
          ...readStringArray(proposal.args, "materials")
        ],
        maxPlacements: typeof proposal.args.maxPlacements === "number"
          ? Math.max(1, Math.floor(proposal.args.maxPlacements))
          : 64
      })) as unknown as JsonValue;
    case "inspect_chest": {
      const chest = createMineflayerSharedChestAccessor(input.bot);
      const ledger = createSharedStorageLedger();
      const bulletin = createTeamBulletin();
      try {
        return (await inspectChest({
          actorId: input.actorId,
          roleId,
          chest,
          ledger,
          bulletin,
          currentTask: readOptionalString(proposal.args, "currentTask")
        })) as unknown as JsonValue;
      } catch (error) {
        return {
          status: "blocked",
          reason: error instanceof Error ? error.message : String(error)
        };
      }
    }
    case "deposit_shared": {
      const itemName = chooseDepositItemName({ bot: input.bot, roleId, args: proposal.args });
      if (!itemName) {
        return {
          status: "blocked",
          reason: "deposit_shared found no depositable inventory item above role reserve"
        };
      }
      const chest = createMineflayerSharedChestAccessor(input.bot);
      const ledger = createSharedStorageLedger();
      const bulletin = createTeamBulletin();
      try {
        return (await depositToSharedChest({
          actorId: input.actorId,
          roleId,
          chest,
          inventory: input.bot.inventory,
          ledger,
          bulletin,
          itemName,
          count: readTransferCount(proposal.args),
          currentTask: readOptionalString(proposal.args, "currentTask")
        })) as unknown as JsonValue;
      } catch (error) {
        return {
          status: "blocked",
          reason: error instanceof Error ? error.message : String(error),
          itemName
        };
      }
    }
    case "withdraw_shared": {
      const itemName = readOptionalString(proposal.args, "itemName");
      if (!itemName) {
        return { status: "blocked", reason: "withdraw_shared requires itemName" };
      }
      const chest = createMineflayerSharedChestAccessor(input.bot);
      const ledger = createSharedStorageLedger();
      const bulletin = createTeamBulletin();
      try {
        return (await withdrawFromSharedChest({
          actorId: input.actorId,
          roleId,
          chest,
          inventory: input.bot.inventory,
          ledger,
          bulletin,
          itemName,
          count: readTransferCount(proposal.args),
          reason: readString(proposal.args, "reason", "settlement task"),
          currentTask: readOptionalString(proposal.args, "currentTask")
        })) as unknown as JsonValue;
      } catch (error) {
        return {
          status: "blocked",
          reason: error instanceof Error ? error.message : String(error),
          itemName
        };
      }
    }
    case "say":
      return (await say({
        actor: input.bot as unknown as Parameters<typeof say>[0]["actor"],
        target: (input.targetBot ?? input.bot) as unknown as Parameters<typeof say>[0]["target"],
        dialogueState,
        text: readString(proposal.args, "text", "acknowledged")
      })) as unknown as JsonValue;
    default:
      return { status: "error", why: `Unsupported primitive in social slice: ${proposal.tool}` };
  }
}

async function executePrimitiveWithEvidence(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  tool: AllowedTool;
  args: Record<string, unknown>;
  bot?: Bot;
  targetBot?: Bot;
  gate: ActiveActionSkillGate;
}): Promise<{
  toolResult: JsonValue;
  evidenceRef: string;
  gateBlocked: boolean;
  status: string;
}> {
  const permission =
    input.tool === "move_to"
      ? ({ allowed: true } as const)
      : checkActiveActionSkillPermission(input.gate, input.tool);
  if (!permission.allowed) {
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.tool}-gate-blocked`,
      tool: input.tool,
      args: input.args,
      result: { status: "blocked", reason: permission.reason },
      verifierReason: permission.reason
    });
    return { toolResult: { status: "blocked", reason: permission.reason }, evidenceRef: ref, gateBlocked: true, status: "blocked" };
  }

  if (!input.bot) {
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.tool}-synthetic`,
      tool: input.tool,
      args: input.args,
      result: { status: "blocked", reason: "No live bot for primitive execution" },
      verifierReason: "no_bot"
    });
    return {
      toolResult: { status: "blocked", reason: "No live bot for primitive execution" },
      evidenceRef: ref,
      gateBlocked: true,
      status: "blocked"
    };
  }

  let toolResult: JsonValue;
  try {
    toolResult = await runSocialPrimitive({
      actorId: input.actorId,
      tool: input.tool,
      args: input.args,
      bot: input.bot,
      targetBot: input.targetBot
    });
  } catch (error) {
    toolResult = {
      status: "error",
      why: error instanceof Error ? error.message : String(error)
    };
  }

  const status = readToolStatus(toolResult);
  const ref = await writeToolEvidence({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    evidenceId: `${input.cycleId}-${input.tool}`,
    tool: input.tool,
    args: input.args,
    result: toolResult,
    verifierReason: status
  });
  return { toolResult, evidenceRef: ref, gateBlocked: false, status };
}

export async function executeSocialActionIntent(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  turnId?: string;
  cycleGoal: ActorCycleGoal;
  intent: ActionIntent;
  activeActionSkills: readonly ActorActionSkillRecord[];
  bot?: Bot;
  targetBot?: Bot;
}): Promise<SocialCycleExecutionResult> {
  const observation = await observeActorWorld({
    actorId: input.actorId,
    bot: input.bot,
    targetBot: input.targetBot
  });

  const evidenceRefs: string[] = [];
  const executedTools: string[] = [];
  const toolStatuses: SocialPrimitiveAttemptStatus[] = [];
  const turnId = input.turnId ?? input.cycleId;
  let gateBlocked = false;
  let actionSkillExecutionUnit = false;
  const memory = createMemory(8);

  if (input.intent.kind === "wait" || input.intent.kind === "remember") {
    if (!input.bot) {
      const ref = await writeToolEvidence({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        cycleId: turnId,
        evidenceId: `synthetic-${turnId}-${randomUUID()}`,
        tool: input.intent.kind,
        args: input.intent.args,
        result: { status: "ok", synthetic: true },
        verifierReason: `synthetic ${input.intent.kind}`
      });
      evidenceRefs.push(ref);
      executedTools.push(input.intent.kind);
      toolStatuses.push({ tool: input.intent.kind, status: "ok" });
      return {
        observation,
        runtimeResult: { status: "ok", synthetic: true, kind: input.intent.kind },
        evidenceRefs,
        executedTools,
        toolStatuses,
        verifierStatus: "not_applicable",
        gateBlocked: false,
        actionSkillExecutionUnit: false,
        postconditionResults: [],
        toolResults: []
      };
    }

    const result =
      input.intent.kind === "wait"
        ? await wait({ ticks: readTicks(input.intent.args) })
        : remember({ memory, note: readString(input.intent.args, "note", "social cycle note") });

    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: turnId,
      evidenceId: `${turnId}-${input.intent.kind}`,
      tool: input.intent.kind,
      args: input.intent.args,
      result: result as unknown as JsonValue,
      verifierReason: "status" in result ? String(result.status) : "ok"
    });
    evidenceRefs.push(ref);
    executedTools.push(input.intent.kind);
    toolStatuses.push({
      tool: input.intent.kind,
      status: "status" in result ? String(result.status) : "ok"
    });

    return {
      observation,
      runtimeResult: result as unknown as JsonValue,
      evidenceRefs,
      executedTools,
      toolStatuses,
      verifierStatus: "not_applicable",
      gateBlocked: false,
      actionSkillExecutionUnit: false,
      postconditionResults: [],
      toolResults: []
    };
  }

  const resolved = resolvePrimitivesForSocialIntent(input.intent, input.activeActionSkills);
  let primitivesToRun = resolved.primitives;
  actionSkillExecutionUnit = resolved.actionSkillExecutionUnit;

  if (resolved.blockedReason) {
    return {
      observation,
      runtimeResult: { status: "blocked", reason: resolved.blockedReason },
      evidenceRefs,
      executedTools,
      toolStatuses,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      actionSkillExecutionUnit,
      postconditionResults: [],
      toolResults: []
    };
  }

  if (primitivesToRun.length === 0) {
    return {
      observation,
      runtimeResult: { status: "blocked", reason: "No primitive resolved for intent" },
      evidenceRefs,
      executedTools,
      toolStatuses,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      actionSkillExecutionUnit,
      postconditionResults: [],
      toolResults: []
    };
  }

  for (const primitive of primitivesToRun) {
    if (!input.cycleGoal.allowed_primitive_ids.includes(primitive)) {
      return {
        observation,
        runtimeResult: {
          status: "blocked",
          reason: `Primitive ${primitive} not allowed by CycleGoal`
        },
        evidenceRefs,
        executedTools,
        toolStatuses,
        verifierStatus: "not_applicable",
        gateBlocked: true,
        actionSkillExecutionUnit,
        postconditionResults: [],
        toolResults: []
      };
    }
  }

  let gate: ActiveActionSkillGate;
  try {
    gate = buildActiveActionSkillGate({
      actorId: input.actorId,
      activeActionSkills: input.activeActionSkills
    });
  } catch (error) {
    return {
      observation,
      runtimeResult: {
        status: "blocked",
        reason: error instanceof Error ? error.message : String(error)
      },
      evidenceRefs,
      executedTools,
      toolStatuses,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      actionSkillExecutionUnit,
      postconditionResults: [],
      toolResults: []
    };
  }

  let lastToolResult: JsonValue = { status: "blocked", reason: "No primitives executed" };
  const toolResults: ToolResultRecord[] = [];

  for (const primitive of primitivesToRun) {
    const step = await executePrimitiveWithEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: turnId,
      tool: primitive,
      args: argsForPrimitive(input.intent, primitive),
      bot: input.bot,
      targetBot: input.targetBot,
      gate
    });
    evidenceRefs.push(step.evidenceRef);
    executedTools.push(primitive);
    toolStatuses.push({ tool: primitive, status: step.status });
    toolResults.push({
      tool: primitive,
      status: step.status,
      result: step.toolResult,
      evidence_ref: step.evidenceRef
    });
    lastToolResult = step.toolResult;

    if (step.gateBlocked || step.status === "error" || step.status === "blocked") {
      gateBlocked = step.gateBlocked;
      break;
    }
  }

  const postconditionResults =
    actionSkillExecutionUnit && input.intent.action_skill_id
      ? [
          evaluateSocialActionSkillPostcondition({
            actionSkillId: input.intent.action_skill_id,
            toolResults,
            evidenceRefs
          })
        ]
      : [];
  const derivedVerifierStatus = deriveProgressVerifierStatus({
    toolAttempts: toolStatuses
  });
  const verifierStatus = postconditionResults.some((result) => result.status === "failed")
    ? "failed"
    : derivedVerifierStatus;

  return {
    observation,
    runtimeResult: {
      action_skill_execution_unit: actionSkillExecutionUnit,
      executed_tools: executedTools,
      tool_statuses: toolStatuses as unknown as JsonValue,
      last_tool_result: lastToolResult,
      postcondition_results: postconditionResults as unknown as JsonValue
    },
    evidenceRefs,
    executedTools,
    toolStatuses,
    verifierStatus,
    gateBlocked,
    actionSkillExecutionUnit,
    postconditionResults,
    toolResults
  };
}

export function resolvePrimitivesForSocialIntent(
  intent: ActionIntent,
  activeActionSkills: readonly ActorActionSkillRecord[]
): {
  primitives: AllowedTool[];
  actionSkillExecutionUnit: boolean;
  blockedReason?: string;
} {
  if (intent.kind === "use_primitive" && intent.primitive_id) {
    if (!isSocialExecutablePrimitive(intent.primitive_id)) {
      return {
        primitives: [],
        actionSkillExecutionUnit: false,
        blockedReason: `Primitive ${intent.primitive_id} is not executable in the social cycle runtime`
      };
    }
    return {
      primitives: [intent.primitive_id as AllowedTool],
      actionSkillExecutionUnit: false
    };
  }

  if (intent.kind === "use_action_skill" && intent.action_skill_id) {
    const owned = activeActionSkills.find((skill) => skill.skill_id === intent.action_skill_id);
    if (!owned || owned.required_primitives.length === 0) {
      return {
        primitives: [],
        actionSkillExecutionUnit: false,
        blockedReason: "No owned action skill primitives for intent"
      };
    }
    if (!owned.required_primitives.every(isSocialExecutablePrimitive)) {
      return {
        primitives: [],
        actionSkillExecutionUnit: false,
        blockedReason: `Action skill ${owned.skill_id} includes primitives this social executor cannot run`
      };
    }
    return {
      primitives: owned.required_primitives.map((primitive) => primitive as AllowedTool),
      actionSkillExecutionUnit: true
    };
  }

  return {
    primitives: [],
    actionSkillExecutionUnit: false,
    blockedReason: "No primitive resolved for intent"
  };
}

/** Role-safe runtime affordances for the Soul/LifeGoal cycle; social context is not a hardcoded strategy funnel. */
export function compileSocialAllowedPrimitives(roleId: string) {
  const contract = getRoleContract(roleId as RoleId);
  return contract.allowedTools.filter(isSocialExecutablePrimitive);
}
