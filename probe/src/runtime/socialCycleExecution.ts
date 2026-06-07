import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Bot } from "mineflayer";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

import type { AllowedTool } from "../tools/index.js";
import { validateProposal } from "../tools/index.js";
import {
  legacyPlannerActionParameters,
  type ActorCycleGoal,
  type GeneratedActionSkillCandidate,
  type LegacyPlannerAction
} from "./goals/types.js";
import {
  defaultExpectedOutcomeForActionSkill,
  defaultExpectedOutcomeForPrimitive,
  evaluateExpectedOutcomeAgainstDeltas,
  observedDeltasFromHelperEvents,
  type ActorTurnOutcomeContractEvaluation,
  type ActorTurnExpectedOutcome,
  type ActorTurnResolvedAction
} from "./goals/actorEpisode/index.js";
import {
  validatePrimitiveActionParameters,
  type MoveToTargetMetadata
} from "./goals/actionParameterContracts.js";
import {
  buildActiveActionSkillGate,
  checkActiveActionSkillPermission,
  type ActiveActionSkillGate
} from "./activeActionSkillGate.js";
import {
  addActorActionSkillToLibraryIndex,
  writeActorActionSkillRecord,
  type ActorActionSkillRecord
} from "./actorWorkspaceStore.js";
import { writeActorEvidenceRecord } from "./evidence/actorEvidence.js";
import type { ActorEvidenceCategory } from "./evidence/actorEvidence.js";
import { createDialogueState } from "./dialogueState.js";
import { createMemory } from "./memory.js";
import { observe, type ObserveResult } from "../tools/observe.js";
import { wait } from "../tools/wait.js";
import { remember } from "../tools/remember.js";
import { collectLogs } from "../tools/collectLogs.js";
import { mineBlock } from "../tools/mineBlock.js";
import { craftItem } from "../tools/craftItem.js";
import { craftWithTable } from "../tools/craftWithTable.js";
import { consumeItem, selectFoodCandidateName } from "../tools/consumeItem.js";
import { equipItem } from "../tools/equipItem.js";
import { runMineflayerProgram } from "../tools/runMineflayerProgram.js";
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
import { runAction } from "./actions/actionRunner.js";
import {
  attachRuntimeHooksToResult,
  runPrimitivePostActionHooks,
  runPrimitivePreActionHooks
} from "./actions/actionHooks.js";
import { evaluatePrimitiveSessionPreflight } from "./actions/sessionPreflight.js";
import {
  findMatchingRuntimeRetryConstraint,
  type RuntimeRetryConstraint
} from "./retryConstraints.js";
import { writeActionSkillProposal } from "../skills/proposals/proposalStore.js";
import type { ActionSkillProposalRecord } from "../skills/proposals/types.js";
import {
  generatedCandidateRequiredPrimitives,
  generatedCandidateSuccessVerifier,
  validateGeneratedActionSkillTrialRequest,
  type GeneratedActionSkillLifecycleStatus
} from "../skills/generated/authoringSchemas.js";
import { evaluateGeneratedActionSkillTrialVerifier } from "../skills/generated/verifierEvaluation.js";

function actorTurnActionParameters(action: ActorTurnResolvedAction): Record<string, unknown> {
  return action.parameters as Record<string, unknown>;
}

function expectedOutcomeForGeneratedHelper(helperName: unknown): ActorTurnExpectedOutcome | null {
  if (typeof helperName !== "string") {
    return null;
  }
  switch (helperName) {
    case "placeBlock":
    case "buildPattern":
    case "mineBlock":
      return "world_block_delta";
    case "collectLogs":
    case "craftItem":
    case "craftWithTable":
    case "consumeItem":
      return "inventory_delta";
    case "equipItem":
      return "equipment_delta";
    case "moveTo":
      return "position_delta";
    case "say":
      return "social_delta";
    case "observe":
      return "diagnostic_unlock";
    default:
      return null;
  }
}

function expectedOutcomeForGeneratedCandidate(
  candidate: GeneratedActionSkillCandidate
): ActorTurnExpectedOutcome {
  const verifier = candidate.verifier;
  if (typeof verifier === "object" && verifier !== null && !Array.isArray(verifier)) {
    const outcome = expectedOutcomeForGeneratedHelper((verifier as { helper?: unknown }).helper);
    if (outcome) {
      return outcome;
    }
  }
  for (const helperName of candidate.helper_allowlist ?? []) {
    const outcome = expectedOutcomeForGeneratedHelper(helperName);
    if (outcome) {
      return outcome;
    }
  }
  return defaultExpectedOutcomeForActionSkill(candidate.proposed_skill_id ?? "");
}

function actorTurnActionFromLegacyPlannerAction(
  action: LegacyPlannerAction
): ActorTurnResolvedAction {
  const parameters = legacyPlannerActionParameters(action) as ActorTurnResolvedAction["parameters"];
  if (action.kind === "use_action_skill") {
    return {
      schema: "actor-turn-resolved-action/v1",
      actor_id: action.actor_id,
      cycle_id: action.cycle_id,
      cycle_goal_id: action.cycle_goal_id,
      kind: "use_action_skill",
      action_card_id: `legacy:${action.action_skill_id ?? "missing-action-skill"}`,
      action_skill_id: action.action_skill_id ?? "",
      parameters,
      expected_outcome: defaultExpectedOutcomeForActionSkill(action.action_skill_id ?? ""),
      why_this_action: action.why_this_action,
      expected_evidence: action.expected_evidence,
      fallback_if_blocked: action.fallback_if_blocked
    };
  }
  if (action.kind === "author_and_trial_action_skill") {
    const candidate = action.candidate as GeneratedActionSkillCandidate;
    return {
      schema: "actor-turn-resolved-action/v1",
      actor_id: action.actor_id,
      cycle_id: action.cycle_id,
      cycle_goal_id: action.cycle_goal_id,
      kind: "author_mineflayer_action",
      parameters,
      candidate,
      expected_outcome: expectedOutcomeForGeneratedCandidate(candidate),
      why_this_action: action.why_this_action,
      expected_evidence: action.expected_evidence,
      fallback_if_blocked: action.fallback_if_blocked
    };
  }
  const primitiveId = action.kind === "use_primitive"
    ? (action.primitive_id ?? "")
    : action.kind;
  return {
    schema: "actor-turn-resolved-action/v1",
    actor_id: action.actor_id,
    cycle_id: action.cycle_id,
    cycle_goal_id: action.cycle_goal_id,
    kind: "use_primitive",
    action_card_id: `legacy:${primitiveId || "missing-primitive"}`,
    primitive_id: primitiveId,
    parameters,
    expected_outcome: defaultExpectedOutcomeForPrimitive(primitiveId),
    why_this_action: action.why_this_action,
    expected_evidence: action.expected_evidence,
    fallback_if_blocked: action.fallback_if_blocked
  };
}

export const SOCIAL_EXECUTABLE_PRIMITIVES: ReadonlySet<string> = new Set([
  "observe",
  "move_to",
  "wait",
  "remember",
  "collect_logs",
  "mine_block",
  "craft_item",
  "craft_with_table",
  "consume_item",
  "equip_item",
  "run_mineflayer_program",
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
  contractBlocked: boolean;
  retryConstraintBlocked: boolean;
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
  allowedTargets: ["explicit_position", "bounded_scout_waypoint"],
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
  category?: ActorEvidenceCategory;
}) {
  const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  const evidencePath = await writeActorEvidenceRecord(input.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: input.evidenceId,
    actor_id: input.actorId,
    category: input.category ?? "tool_attempt",
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

async function writeRetryConstraintEvidence(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  action: ActorTurnResolvedAction;
  constraint: RuntimeRetryConstraint;
}) {
  const result: JsonValue = {
    status: "blocked",
    reason:
      "runtime_retry_constraint blocked the same action target and structured args after repeated matching blockers",
    retry_constraint: input.constraint as unknown as JsonValue,
    action: input.action as unknown as JsonValue
  };
  return writeToolEvidence({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    evidenceId: `${input.cycleId}-${input.constraint.constraint_id}-blocked`,
    tool: `retry_constraint:${input.constraint.target.kind}:${input.constraint.target.id}`,
    args: actorTurnActionParameters(input.action),
    result,
    verifierReason: input.constraint.blocker_reason,
    category: "retry_constraint_blocked"
  });
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

function readGeneratedSource(args: Record<string, unknown>) {
  return typeof args.source === "string" ? args.source : "";
}

function readOptionalRecord(args: Record<string, unknown>, key: string) {
  const value = args[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
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
  // Direct provider transfer intents are rejected before execution unless a
  // count is explicit. This fallback is only for actor-owned action-skill
  // bundles whose local policy resolves shared-storage transfer size.
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

function chooseConsumeItemName(input: {
  bot: Bot;
  args: Record<string, unknown>;
}) {
  const explicit = readOptionalString(input.args, "itemName");
  if (explicit) {
    return normalizeCraftItemName(input.bot, explicit);
  }

  const actionSkillId = readOptionalString(input.args, "actionSkillId");
  if (actionSkillId === "eatFoodWhenHungry") {
    return selectFoodCandidateName(input.bot);
  }

  return undefined;
}

function chooseMineBlockName(args: Record<string, unknown>) {
  const explicit = readOptionalString(args, "blockName") ?? readOptionalString(args, "targetBlock");
  if (explicit) {
    return explicit;
  }

  const actionSkillId = readOptionalString(args, "actionSkillId");
  if (actionSkillId === "mineCobblestone") {
    return "stone";
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

function argsForPrimitive(
  action: ActorTurnResolvedAction,
  primitive: AllowedTool,
  actionSkillRecord?: ActorActionSkillRecord
) {
  const parameters = actorTurnActionParameters(action);
  if (
    primitive === "run_mineflayer_program" &&
    actionSkillRecord &&
    isGeneratedMineflayerActionSkill(actionSkillRecord)
  ) {
    return {
      ...parameters,
      source: actionSkillRecord.generated_source,
      purpose: actionSkillRecord.notes ?? actionSkillRecord.success_verifier,
      expectedObservation: action.expected_evidence.join("; "),
      timeoutMs: actionSkillRecord.generated_timeout_ms,
      parameters,
      helperAllowlist: actionSkillRecord.generated_helper_allowlist ?? [],
      ...(action.kind === "use_action_skill"
        ? { actionSkillId: action.action_skill_id }
        : {}),
      primitiveId: primitive
    };
  }

  return {
    ...parameters,
    ...(action.kind === "use_action_skill" && action.action_skill_id
      ? { actionSkillId: action.action_skill_id }
      : {}),
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
  const surfacePosition =
    readPositionedObject(args.surfacePosition) ??
    readPositionedObject(args.surface_position) ??
    readPositionedObject(args.supportPosition) ??
    readPositionedObject(args.support_position);
  if (surfacePosition) {
    return {
      x: surfacePosition.x,
      y: surfacePosition.y + 1,
      z: surfacePosition.z
    };
  }

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

function moveTargetFromContract(target: MoveToTargetMetadata, origin: Positioned): Positioned {
  if (target.kind === "position") {
    return target.position;
  }

  switch (target.direction) {
    case "north":
      return { x: origin.x, y: origin.y, z: origin.z - target.distance };
    case "south":
      return { x: origin.x, y: origin.y, z: origin.z + target.distance };
    case "west":
      return { x: origin.x - target.distance, y: origin.y, z: origin.z };
    case "east":
      return { x: origin.x + target.distance, y: origin.y, z: origin.z };
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
  const argsContract = validatePrimitiveActionParameters({
    primitiveId: "move_to",
    args: input.args,
    actionSkillId: readOptionalString(input.args, "actionSkillId")
  });
  if (!argsContract.ok || !argsContract.target) {
    return {
      status: "blocked",
      beforePosition: before,
      distanceMoved: 0,
      action_parameter_contract: argsContract,
      reason: argsContract.ok
        ? "move_to contract did not resolve a target"
        : `Actor Turn action parameter contract failed: ${argsContract.error}`
    } as JsonValue;
  }
  const requestedTarget = moveTargetFromContract(argsContract.target, before);
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
      action_parameter_contract: argsContract,
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
    action_parameter_contract: argsContract,
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
  actorWorkspaceRootDir: string;
  actorId: string;
  tool: AllowedTool;
  args: Record<string, unknown>;
  bot: Bot;
  targetBot?: Bot;
  signal?: AbortSignal;
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
        targetCount: readOptionalCount(proposal.args),
        signal: input.signal
      })) as unknown as JsonValue;
    case "mine_block":
      {
        const blockName = chooseMineBlockName(proposal.args);
        if (!blockName) {
          return { status: "blocked", reason: "mine_block requires blockName or targetBlock" };
        }
      return (await mineBlock({
        bot: input.bot,
        blockName,
        targetCount: readOptionalCount(proposal.args),
        searchDistance: typeof proposal.args.searchDistance === "number"
          ? Math.max(4, Math.min(48, Math.floor(proposal.args.searchDistance)))
          : undefined,
        signal: input.signal
      })) as unknown as JsonValue;
      }
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
    case "consume_item": {
      const itemName = chooseConsumeItemName({ bot: input.bot, args: proposal.args });
      if (!itemName) {
        return { status: "blocked", reason: "consume_item requires itemName or edible inventory for eatFoodWhenHungry" };
      }
      return (await consumeItem({
        bot: input.bot,
        itemName,
        signal: input.signal
      })) as unknown as JsonValue;
    }
    case "equip_item": {
      const itemName = readOptionalString(proposal.args, "itemName");
      if (!itemName) {
        return { status: "blocked", reason: "equip_item requires exact itemName" };
      }
      return (await equipItem({
        bot: input.bot,
        itemName,
        signal: input.signal
      })) as unknown as JsonValue;
    }
    case "run_mineflayer_program": {
      const source = readGeneratedSource(proposal.args);
      const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
      const helperAllowlist = [
        ...readStringArray(proposal.args, "helperAllowlist"),
        ...readStringArray(proposal.args, "helper_allowlist")
      ];
      return (await runMineflayerProgram({
        actorId: input.actorId,
        bot: input.bot,
        targetBot: input.targetBot,
        source,
        parameters: readOptionalRecord(proposal.args, "parameters"),
        purpose: readOptionalString(proposal.args, "purpose"),
        expectedObservation: readOptionalString(proposal.args, "expectedObservation") ??
          readOptionalString(proposal.args, "expected_observation"),
        timeoutMs: typeof proposal.args.timeoutMs === "number" ? proposal.args.timeoutMs : undefined,
        ...(helperAllowlist.length > 0 ? { helperAllowlist } : {}),
        artifactDir: path.join(paths.actorDir, "action-skills", "direct-trials"),
        signal: input.signal
      })) as unknown as JsonValue;
    }
    case "place_block": {
      const itemName = choosePlaceBlockItemName({ bot: input.bot, args: proposal.args });
      if (!itemName) {
        return { status: "blocked", reason: "place_block requires explicit itemName or a station-placement action skill" };
      }
      return (await placeBlock({
        bot: input.bot,
        itemName,
        targetPosition: readPlacementTarget(input.bot, proposal.args),
        signal: input.signal
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
          : 64,
        signal: input.signal
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
        ...(input.targetBot
          ? { target: input.targetBot as unknown as Parameters<typeof say>[0]["target"] }
          : {}),
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
  allowActionSkillFallback: boolean;
}): Promise<{
  toolResult: JsonValue;
  evidenceRef: string;
  gateBlocked: boolean;
  contractBlocked: boolean;
  status: string;
}> {
  // Hook records are written into tool evidence so reviewers can separate
  // permission blocks, missing live bots, and post-action progress classification.
  const permission = checkActiveActionSkillPermission(input.gate, input.tool);
  const sessionPreflight = input.bot
    ? evaluatePrimitiveSessionPreflight(input.bot)
    : undefined;
  const preHooks = runPrimitivePreActionHooks({
    tool: input.tool,
    permission,
    hasLiveBot: sessionPreflight?.has_live_bot ?? false,
    sessionPreflight
  });
  if (!preHooks.allowed) {
    const toolResult = attachRuntimeHooksToResult({
      result: preHooks.blockedResult ?? { status: "blocked", reason: "pre-action hook blocked execution" },
      hooks: preHooks.records
    });
    const reason =
      preHooks.records.find((record) => record.status === "blocked")?.reason ??
      "pre-action hook blocked execution";
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.tool}-gate-blocked`,
      tool: input.tool,
      args: input.args,
      result: toolResult,
      verifierReason: reason
    });
    return {
      toolResult,
      evidenceRef: ref,
      gateBlocked: true,
      contractBlocked: false,
      status: "blocked"
    };
  }

  // Argument contracts are separate from action-skill gates: the primitive may
  // be allowed, but the provider still must supply explicit executable args.
  if (!input.allowActionSkillFallback) {
    const directFallback =
      readOptionalString(input.args, "actionSkillId") ??
      readOptionalString(input.args, "action_skill_id");
    if (directFallback) {
      const reason =
        "Direct primitive intents cannot carry args.actionSkillId; use use_action_skill for actor-owned action skill execution";
      const toolResult = attachRuntimeHooksToResult({
        result: {
          status: "blocked",
          reason
        },
        hooks: [
          ...preHooks.records,
          {
            schema: "runtime-action-hook/v1",
            phase: "pre",
            hook_id: "action_parameter_contract",
            status: "blocked",
            reason
          }
        ]
      });
      const ref = await writeToolEvidence({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        cycleId: input.cycleId,
        evidenceId: `${input.cycleId}-${input.tool}-args-contract-blocked`,
        tool: input.tool,
        args: input.args,
        result: toolResult,
        verifierReason: reason,
        category: "action_parameter_contract_failure"
      });
      return {
        toolResult,
        evidenceRef: ref,
        gateBlocked: true,
        contractBlocked: true,
        status: "blocked"
      };
    }
  }

  const argsContract = validatePrimitiveActionParameters({
    primitiveId: input.tool,
    args: input.args,
    actionSkillId: input.allowActionSkillFallback
      ? readOptionalString(input.args, "actionSkillId")
      : undefined
  });
  if (!argsContract.ok) {
    const toolResult = attachRuntimeHooksToResult({
      result: {
        status: "blocked",
        reason: `Actor Turn action parameter contract failed: ${argsContract.error}`,
        action_parameter_contract: argsContract as unknown as JsonValue
      },
      hooks: [
        ...preHooks.records,
        {
          schema: "runtime-action-hook/v1",
          phase: "pre",
          hook_id: "action_parameter_contract",
          status: "blocked",
          reason: argsContract.error
        }
      ]
    });
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.tool}-args-contract-blocked`,
      tool: input.tool,
      args: input.args,
      result: toolResult,
      verifierReason: argsContract.error,
      category: "action_parameter_contract_failure"
    });
    return {
      toolResult,
      evidenceRef: ref,
      gateBlocked: true,
      contractBlocked: true,
      status: "blocked"
    };
  }

  const actionResult = await runAction({
    tool: input.tool,
    action: (signal) =>
      runSocialPrimitive({
        actorId: input.actorId,
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        tool: input.tool,
        args: input.args,
        bot: input.bot!,
        targetBot: input.targetBot,
        signal
      })
  });
  const toolResult = actionResult.ok
    ? (actionResult.value as JsonValue)
    : ({
        status: actionResult.status,
        reason: actionResult.message ?? `Primitive ${input.tool} did not complete`,
        timedOut: actionResult.timedOut,
        cancelled: actionResult.cancelled,
        durationMs: actionResult.durationMs,
        timeoutMs: actionResult.timeoutMs
      } as JsonValue);

  const status = readToolStatus(toolResult);
  const postHooks = runPrimitivePostActionHooks({
    tool: input.tool,
    status,
    result: toolResult
  });
  const resultWithHooks = attachRuntimeHooksToResult({
    result: toolResult,
    hooks: [...preHooks.records, ...postHooks]
  });
  const ref = await writeToolEvidence({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    evidenceId: `${input.cycleId}-${input.tool}`,
    tool: input.tool,
    args: input.args,
    result: resultWithHooks,
    verifierReason: status
  });
  return {
    toolResult: resultWithHooks,
    evidenceRef: ref,
    gateBlocked: false,
    contractBlocked: false,
    status
  };
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return String(value) as JsonValue;
  }
}

function generatedTrialLifecycleStatus(input: {
  verifierStatus: "passed" | "failed" | "not_applicable";
  outcomeContract: ActorTurnOutcomeContractEvaluation;
}): GeneratedActionSkillLifecycleStatus {
  if (input.outcomeContract.status === "diagnostic_only" || input.outcomeContract.status === "recorded") {
    return "diagnostic_only";
  }
  return input.verifierStatus === "passed" && input.outcomeContract.status === "satisfied"
    ? "promotable"
    : "trial_failed";
}

function isGeneratedMineflayerActionSkill(record: ActorActionSkillRecord) {
  return (
    record.source_kind === "learned" &&
    record.generated_source_language === "typescript" &&
    typeof record.generated_source === "string" &&
    record.generated_source.trim().length > 0
  );
}

function sourceRefFromToolResult(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  toolResult: JsonValue;
}) {
  if (
    typeof input.toolResult !== "object" ||
    input.toolResult === null ||
    Array.isArray(input.toolResult) ||
    typeof (input.toolResult as { sourcePath?: unknown }).sourcePath !== "string"
  ) {
    return undefined;
  }
  const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  return evidenceRefFromPath(paths.actorDir, (input.toolResult as { sourcePath: string }).sourcePath);
}

function helperEventsFromToolResult(toolResult: JsonValue) {
  if (
    typeof toolResult === "object" &&
    toolResult !== null &&
    !Array.isArray(toolResult) &&
    Array.isArray((toolResult as { helperEvents?: unknown }).helperEvents)
  ) {
    return (toolResult as { helperEvents: unknown[] }).helperEvents.map(toJsonValue);
  }
  return [];
}

function buildGeneratedActionSkillProposal(input: {
  actorId: string;
  turnId: string;
  candidate: GeneratedActionSkillCandidate;
  parameters: Record<string, unknown>;
  evidenceRefs: string[];
  lifecycleStatus: GeneratedActionSkillLifecycleStatus;
  verifierStatus: "passed" | "failed" | "not_applicable";
  sourceRef?: string;
  helperEvents: JsonValue[];
  verifierOutput: JsonValue;
  reason: string;
  now: string;
}): ActionSkillProposalRecord {
  const proposalId = `${input.turnId}-author-${input.candidate.proposed_skill_id}`;
  return {
    schema: "action-skill-proposal/v1",
    proposal_id: proposalId,
    skill_id: input.candidate.proposed_skill_id,
    owner_actor_id: input.actorId,
    source_kind: "learned",
    status: "draft",
    task_intent: input.candidate.purpose,
    evidence_refs: [...input.evidenceRefs],
    preconditions: ["authored during action selection", "generated source passed runtime source guard"],
    required_primitives: generatedCandidateRequiredPrimitives(input.candidate),
    proposed_recipe_id: `generated-source:${proposalId}`,
    success_verifier: generatedCandidateSuccessVerifier(input.candidate),
    known_failure_modes: [...input.candidate.known_failure_modes],
    created_at: input.now,
    updated_at: input.now,
    legacy_generated_code: input.candidate.source,
    legacy_generated_code_language: "typescript",
    generated_candidate: input.candidate,
    generated_parameters: input.parameters,
    generated_lifecycle_status: input.lifecycleStatus,
    generated_trial: {
      schema: "generated-action-skill-trial/v1",
      status: input.lifecycleStatus,
      verifier_status: input.verifierStatus,
      evidence_refs: [...input.evidenceRefs],
      ...(input.sourceRef ? { source_ref: input.sourceRef } : {}),
      helper_events: input.helperEvents,
      verifier_output: input.verifierOutput,
      reason: input.reason
    },
    notes:
      input.lifecycleStatus === "promotable"
        ? "Generated in the action-selection stage. Passed trial is eligible for runtime active-record promotion."
        : "Generated in the action-selection stage. Failed trial remains candidate evidence until repaired."
  };
}

function buildGeneratedActiveActionSkillRecord(input: {
  actorId: string;
  candidate: GeneratedActionSkillCandidate;
  proposalRef: string;
  sourceRef?: string;
  trialEvidenceRef: string;
  parameters: Record<string, unknown>;
  evidenceRefs: string[];
  now: string;
}): ActorActionSkillRecord {
  return {
    schema: "actor-action-skill/v1",
    skill_id: input.candidate.proposed_skill_id,
    owner_actor_id: input.actorId,
    source_kind: "learned",
    status: "active",
    created_at: input.now,
    updated_at: input.now,
    required_primitives: ["run_mineflayer_program"],
    preconditions: [
      "authored in action selection",
      "generated source passed source guard",
      "trial completed with verifier-classified helper evidence"
    ],
    success_verifier: generatedCandidateSuccessVerifier(input.candidate),
    known_failure_modes: [...input.candidate.known_failure_modes],
    evidence_refs: [...input.evidenceRefs, input.trialEvidenceRef, input.proposalRef],
    review_refs: [],
    generated_source: input.candidate.source,
    generated_source_language: "typescript",
    ...(input.sourceRef ? { generated_source_ref: input.sourceRef } : {}),
    generated_candidate_ref: input.proposalRef,
    generated_input_schema: input.candidate.input_schema,
    generated_helper_allowlist: [...input.candidate.helper_allowlist],
    generated_timeout_ms: input.candidate.timeout_ms,
    generated_verifier: input.candidate.verifier,
    notes:
      `Generated Mineflayer action skill promoted from ${input.proposalRef}. ` +
      `Example parameters from trial: ${JSON.stringify(input.parameters)}`
  };
}

async function writeGeneratedActiveActionSkill(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  candidate: GeneratedActionSkillCandidate;
  proposalRef: string;
  sourceRef?: string;
  trialEvidenceRef: string;
  parameters: Record<string, unknown>;
  evidenceRefs: string[];
  now: string;
}) {
  const activeRecord = buildGeneratedActiveActionSkillRecord(input);
  const activePath = await writeActorActionSkillRecord(
    input.actorWorkspaceRootDir,
    activeRecord
  );
  await addActorActionSkillToLibraryIndex({
    rootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    status: "active",
    skillId: activeRecord.skill_id,
    updatedAt: input.now
  });
  const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  return {
    activeRecord,
    activePath,
    activeRef: evidenceRefFromPath(paths.actorDir, activePath)
  };
}

async function executeAuthorAndTrialActionSkill(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  turnId: string;
  action: Extract<ActorTurnResolvedAction, { kind: "author_mineflayer_action" }>;
  activeActionSkills: readonly ActorActionSkillRecord[];
  bot?: Bot;
  targetBot?: Bot;
}): Promise<Omit<SocialCycleExecutionResult, "observation">> {
  const validation = validateGeneratedActionSkillTrialRequest(input.action);
  if (!validation.ok) {
    const reason = validation.errors.join("; ");
    const toolResult: JsonValue = {
      status: "blocked",
      reason,
      action_parameter_contract: {
        schema: "generated-action-skill-candidate-contract/v1",
        ok: false,
        errors: validation.errors
      }
    };
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.turnId,
      evidenceId: `${input.turnId}-author-action-skill-contract-blocked`,
      tool: "author_and_trial_action_skill",
      args: actorTurnActionParameters(input.action),
      result: toolResult,
      verifierReason: reason,
      category: "action_parameter_contract_failure"
    });
    return {
      runtimeResult: toolResult,
      evidenceRefs: [ref],
      executedTools: [],
      toolStatuses: [],
      verifierStatus: "not_applicable",
      gateBlocked: true,
      contractBlocked: true,
      retryConstraintBlocked: false,
      actionSkillExecutionUnit: false,
      postconditionResults: [],
      toolResults: []
    };
  }

  let gate: ActiveActionSkillGate;
  try {
    gate = buildActiveActionSkillGate({
      actorId: input.actorId,
      activeActionSkills: input.activeActionSkills
    });
  } catch (error) {
    return {
      runtimeResult: {
        status: "blocked",
        reason: error instanceof Error ? error.message : String(error)
      },
      evidenceRefs: [],
      executedTools: [],
      toolStatuses: [],
      verifierStatus: "not_applicable",
      gateBlocked: true,
      contractBlocked: false,
      retryConstraintBlocked: false,
      actionSkillExecutionUnit: false,
      postconditionResults: [],
      toolResults: []
    };
  }

  const generatedArgs = {
    source: validation.candidate.source,
    purpose: validation.candidate.purpose,
    expectedObservation: input.action.expected_evidence.join("; "),
    timeoutMs: validation.candidate.timeout_ms,
    parameters: validation.parameters,
    helperAllowlist: validation.candidate.helper_allowlist
  };
  const step = await executePrimitiveWithEvidence({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.turnId,
    tool: "run_mineflayer_program",
    args: generatedArgs,
    bot: input.bot,
    targetBot: input.targetBot,
    gate,
    allowActionSkillFallback: false
  });
  const toolStatuses = [{ tool: "run_mineflayer_program", status: step.status }];
  const generatedVerifier = evaluateGeneratedActionSkillTrialVerifier({
    candidate: validation.candidate,
    runtimeResult: step.toolResult
  });
  const helperEvents = helperEventsFromToolResult(step.toolResult);
  const outcomeContract = evaluateExpectedOutcomeAgainstDeltas({
    expectedOutcome: input.action.expected_outcome,
    verifierStatus: generatedVerifier.status,
    observedDeltas: observedDeltasFromHelperEvents(helperEvents)
  });
  const verifierStatus =
    generatedVerifier.status === "failed"
      ? "failed"
      : outcomeContract.status === "satisfied"
        ? "passed"
        : outcomeContract.status === "diagnostic_only" || outcomeContract.status === "recorded"
          ? "not_applicable"
          : "failed";
  const lifecycleStatus = generatedTrialLifecycleStatus({
    verifierStatus,
    outcomeContract
  });
  const sourceRef = sourceRefFromToolResult({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    toolResult: step.toolResult
  });
  const now = new Date().toISOString();
  const trialReason =
    verifierStatus === "passed"
      ? `${generatedVerifier.reason} Outcome contract: ${outcomeContract.reason}`
      : `Generated candidate trial verifier did not produce promotable progress: ${generatedVerifier.reason}. Outcome contract: ${outcomeContract.reason}`;

  const proposal = buildGeneratedActionSkillProposal({
    actorId: input.actorId,
    turnId: input.turnId,
    candidate: validation.candidate,
    parameters: validation.parameters,
    evidenceRefs: [step.evidenceRef],
    lifecycleStatus,
    verifierStatus,
    sourceRef,
    helperEvents,
    verifierOutput: {
      ...generatedVerifier,
      outcome_contract: outcomeContract
    } as unknown as JsonValue,
    reason: trialReason,
    now
  });
  const proposalPath = await writeActionSkillProposal(input.actorWorkspaceRootDir, proposal);
  const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  const proposalRef = evidenceRefFromPath(paths.actorDir, proposalPath);
  const trialEvidencePath = await writeActorEvidenceRecord(input.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: `${input.turnId}-generated-action-skill-trial-${validation.candidate.proposed_skill_id}`,
    actor_id: input.actorId,
    category: "action_skill_candidate_trial",
    created_at: now,
    turn_id: input.turnId,
    target: validation.candidate.proposed_skill_id,
    verifier_reason: trialReason,
    data: {
      schema: "generated-action-skill-trial/v1",
      candidate_proposal_ref: proposalRef,
      generated_lifecycle_status: lifecycleStatus,
      verifier_status: verifierStatus,
      verifier_output: generatedVerifier as unknown as JsonValue,
      source_ref: sourceRef ?? null,
      parameters: validation.parameters as JsonValue,
      helper_events: helperEvents,
      outcome_contract: outcomeContract as unknown as JsonValue,
      runtime_result: step.toolResult
    } as JsonValue
  });
  const trialEvidenceRef = evidenceRefFromPath(paths.actorDir, trialEvidencePath);
  await writeActionSkillProposal(input.actorWorkspaceRootDir, {
    ...proposal,
    evidence_refs: [step.evidenceRef, trialEvidenceRef],
    generated_trial: {
      ...proposal.generated_trial!,
      evidence_refs: [step.evidenceRef, trialEvidenceRef]
    }
  });
  const activePromotion =
    lifecycleStatus === "promotable"
      ? await writeGeneratedActiveActionSkill({
          actorWorkspaceRootDir: input.actorWorkspaceRootDir,
          actorId: input.actorId,
          candidate: validation.candidate,
          proposalRef,
          sourceRef,
          trialEvidenceRef,
          parameters: validation.parameters,
          evidenceRefs: [step.evidenceRef],
          now
        })
      : null;

  const evidenceRefs = [
    step.evidenceRef,
    trialEvidenceRef,
    proposalRef,
    ...(activePromotion ? [activePromotion.activeRef] : [])
  ];
  const runtimeResult: JsonValue = {
    status: lifecycleStatus,
    action_authoring: {
      schema: "author-and-trial-action-skill-result/v1",
      candidate_proposal_ref: proposalRef,
      trial_evidence_ref: trialEvidenceRef,
      active_action_skill_ref: activePromotion?.activeRef ?? null,
      generated_lifecycle_status: lifecycleStatus,
      verifier_status: verifierStatus,
      outcome_contract: outcomeContract as unknown as JsonValue,
      promotion_policy: validation.candidate.promotion_policy,
      active_promotion_performed: Boolean(activePromotion)
    },
    executed_tools: ["run_mineflayer_program"],
    tool_statuses: toolStatuses as unknown as JsonValue,
    last_tool_result: step.toolResult
  };

  return {
    runtimeResult,
    evidenceRefs,
    executedTools: ["run_mineflayer_program"],
    toolStatuses,
    verifierStatus,
    gateBlocked: step.gateBlocked,
    contractBlocked: step.contractBlocked,
    retryConstraintBlocked: false,
    actionSkillExecutionUnit: false,
    postconditionResults: [],
    toolResults: [
      {
        tool: "run_mineflayer_program",
        status: step.status,
        result: step.toolResult,
        evidence_ref: step.evidenceRef
      }
    ]
  };
}

export async function executeActorTurnAction(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  turnId?: string;
  cycleGoal: ActorCycleGoal;
  action: ActorTurnResolvedAction;
  activeActionSkills: readonly ActorActionSkillRecord[];
  runtimeRetryConstraints?: readonly RuntimeRetryConstraint[];
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
  let contractBlocked = false;
  let actionSkillExecutionUnit = false;
  const memory = createMemory(8);
  const actionParameters = actorTurnActionParameters(input.action);
  const matchingRetryConstraint = findMatchingRuntimeRetryConstraint(
    input.action,
    input.runtimeRetryConstraints ?? []
  );

  if (matchingRetryConstraint) {
    // A retry constraint is a runtime gate, not provider advice. It prevents
    // repeated no-op Mineflayer calls while preserving an evidence trail the
    // next planner turn can inspect.
    const ref = await writeRetryConstraintEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: turnId,
      action: input.action,
      constraint: matchingRetryConstraint
    });
    return {
      observation,
      runtimeResult: {
        status: "blocked",
        reason:
          "runtime_retry_constraint blocked the same action target and structured args after repeated matching blockers",
        retry_constraint: matchingRetryConstraint as unknown as JsonValue
      },
      evidenceRefs: [ref],
      executedTools: [],
      toolStatuses: [],
      verifierStatus: "not_applicable",
      gateBlocked: true,
      contractBlocked: false,
      retryConstraintBlocked: true,
      actionSkillExecutionUnit: false,
      postconditionResults: [],
      toolResults: []
    };
  }

  if (input.action.kind === "author_mineflayer_action") {
    const authoringResult = await executeAuthorAndTrialActionSkill({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      turnId,
      action: input.action,
      activeActionSkills: input.activeActionSkills,
      bot: input.bot,
      targetBot: input.targetBot
    });
    return {
      observation,
      ...authoringResult
    };
  }

  if (
    input.action.kind === "use_primitive" &&
    (input.action.primitive_id === "wait" || input.action.primitive_id === "remember")
  ) {
    // wait/remember do not mutate Minecraft directly, but they still influence
    // future cycles. Keep them inside the active action-skill authority model
    // so they cannot become an unchecked escape hatch.
    const controlTool = input.action.primitive_id as AllowedTool;
    let controlGate: ActiveActionSkillGate;
    try {
      controlGate = buildActiveActionSkillGate({
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
        contractBlocked: false,
        retryConstraintBlocked: false,
        actionSkillExecutionUnit: false,
        postconditionResults: [],
        toolResults: []
      };
    }

    const permission = checkActiveActionSkillPermission(controlGate, controlTool);
    if (!permission.allowed) {
      const toolResult: JsonValue = {
        status: "blocked",
        reason: permission.reason,
        runtime_hooks: [
          {
            schema: "runtime-action-hook/v1",
            phase: "pre",
            hook_id: "active_action_skill_gate",
            status: "blocked",
            reason: permission.reason
          }
        ]
      };
      const ref = await writeToolEvidence({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        cycleId: turnId,
        evidenceId: `${turnId}-${controlTool}-gate-blocked`,
        tool: controlTool,
        args: actionParameters,
        result: toolResult,
        verifierReason: permission.reason
      });
      evidenceRefs.push(ref);
      executedTools.push(controlTool);
      toolStatuses.push({ tool: controlTool, status: "blocked" });
      return {
        observation,
        runtimeResult: toolResult,
        evidenceRefs,
        executedTools,
        toolStatuses,
        verifierStatus: "not_applicable",
        gateBlocked: true,
        contractBlocked: false,
        retryConstraintBlocked: false,
        actionSkillExecutionUnit: false,
        postconditionResults: [],
        toolResults: [
          {
            tool: controlTool,
            status: "blocked",
            result: toolResult,
            evidence_ref: ref
          }
        ]
      };
    }

    const argsContract = validatePrimitiveActionParameters({
      primitiveId: controlTool,
      args: actionParameters
    });
    if (!argsContract.ok) {
      const toolResult: JsonValue = {
        status: "blocked",
        reason: `Actor Turn action parameter contract failed: ${argsContract.error}`,
        action_parameter_contract: argsContract as unknown as JsonValue
      };
      const ref = await writeToolEvidence({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        cycleId: turnId,
        evidenceId: `${turnId}-${controlTool}-args-contract-blocked`,
        tool: controlTool,
        args: actionParameters,
        result: toolResult,
        verifierReason: argsContract.error,
        category: "action_parameter_contract_failure"
      });
      evidenceRefs.push(ref);
      executedTools.push(controlTool);
      toolStatuses.push({ tool: controlTool, status: "blocked" });
      return {
        observation,
        runtimeResult: toolResult,
        evidenceRefs,
        executedTools,
        toolStatuses,
        verifierStatus: "not_applicable",
        gateBlocked: true,
        contractBlocked: true,
        retryConstraintBlocked: false,
        actionSkillExecutionUnit: false,
        postconditionResults: [],
        toolResults: [
          {
            tool: controlTool,
            status: "blocked",
            result: toolResult,
            evidence_ref: ref
          }
        ]
      };
    }

    if (!input.bot) {
      const ref = await writeToolEvidence({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        cycleId: turnId,
        evidenceId: `synthetic-${turnId}-${randomUUID()}`,
        tool: controlTool,
        args: actionParameters,
        result: { status: "ok", synthetic: true },
        verifierReason: `synthetic ${controlTool}`
      });
      evidenceRefs.push(ref);
      executedTools.push(controlTool);
      toolStatuses.push({ tool: controlTool, status: "ok" });
      return {
        observation,
        runtimeResult: { status: "ok", synthetic: true, kind: controlTool },
        evidenceRefs,
        executedTools,
        toolStatuses,
        verifierStatus: "not_applicable",
        gateBlocked: false,
        contractBlocked: false,
        retryConstraintBlocked: false,
        actionSkillExecutionUnit: false,
        postconditionResults: [],
        toolResults: []
      };
    }

    const result =
      input.action.primitive_id === "wait"
        ? await wait({ ticks: readTicks(actionParameters) })
        : remember({ memory, note: readString(actionParameters, "note", "social cycle note") });

    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: turnId,
      evidenceId: `${turnId}-${controlTool}`,
      tool: controlTool,
      args: actionParameters,
      result: result as unknown as JsonValue,
      verifierReason: "status" in result ? String(result.status) : "ok"
    });
    evidenceRefs.push(ref);
    executedTools.push(controlTool);
    toolStatuses.push({
      tool: controlTool,
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
      contractBlocked: false,
      retryConstraintBlocked: false,
      actionSkillExecutionUnit: false,
      postconditionResults: [],
      toolResults: []
    };
  }

  const resolved = resolvePrimitivesForActorTurnAction(input.action, input.activeActionSkills);
  let primitivesToRun = resolved.primitives;
  actionSkillExecutionUnit = resolved.actionSkillExecutionUnit;
  const actionSkillId = input.action.kind === "use_action_skill"
    ? input.action.action_skill_id
    : undefined;
  const selectedActionSkill = actionSkillId
    ? input.activeActionSkills.find((skill) => skill.skill_id === actionSkillId)
    : undefined;

  if (resolved.blockedReason) {
    return {
      observation,
      runtimeResult: { status: "blocked", reason: resolved.blockedReason },
      evidenceRefs,
      executedTools,
      toolStatuses,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      contractBlocked: false,
      retryConstraintBlocked: false,
      actionSkillExecutionUnit,
      postconditionResults: [],
      toolResults: []
    };
  }

  if (primitivesToRun.length === 0) {
    return {
      observation,
      runtimeResult: { status: "blocked", reason: "No primitive resolved for action" },
      evidenceRefs,
      executedTools,
      toolStatuses,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      contractBlocked: false,
      retryConstraintBlocked: false,
      actionSkillExecutionUnit,
      postconditionResults: [],
      toolResults: []
    };
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
      contractBlocked: false,
      retryConstraintBlocked: false,
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
      args: argsForPrimitive(input.action, primitive, selectedActionSkill),
      bot: input.bot,
      targetBot: input.targetBot,
      gate,
      allowActionSkillFallback: input.action.kind === "use_action_skill"
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

    if (
      step.gateBlocked ||
      step.contractBlocked ||
      step.status === "error" ||
      step.status === "blocked" ||
      step.status === "failed" ||
      step.status === "timeout" ||
      step.status === "cancelled"
    ) {
      gateBlocked = step.gateBlocked;
      contractBlocked = step.contractBlocked;
      break;
    }
  }

  const postconditionResults =
    actionSkillExecutionUnit && input.action.kind === "use_action_skill"
      ? [
          evaluateSocialActionSkillPostcondition({
            actionSkillId: input.action.action_skill_id,
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
    contractBlocked,
    retryConstraintBlocked: false,
    actionSkillExecutionUnit,
    postconditionResults,
    toolResults
  };
}

export async function executeLegacyPlannerAction(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  turnId?: string;
  cycleGoal: ActorCycleGoal;
  action: LegacyPlannerAction;
  activeActionSkills: readonly ActorActionSkillRecord[];
  runtimeRetryConstraints?: readonly RuntimeRetryConstraint[];
  bot?: Bot;
  targetBot?: Bot;
}): Promise<SocialCycleExecutionResult> {
  return executeActorTurnAction({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    cycleGoal: input.cycleGoal,
    action: actorTurnActionFromLegacyPlannerAction(input.action),
    activeActionSkills: input.activeActionSkills,
    runtimeRetryConstraints: input.runtimeRetryConstraints,
    bot: input.bot,
    targetBot: input.targetBot
  });
}

export function resolvePrimitivesForActorTurnAction(
  action: ActorTurnResolvedAction,
  activeActionSkills: readonly ActorActionSkillRecord[]
): {
  primitives: AllowedTool[];
  actionSkillExecutionUnit: boolean;
  blockedReason?: string;
} {
  if (action.kind === "use_primitive" && action.primitive_id) {
    if (!isSocialExecutablePrimitive(action.primitive_id)) {
      return {
        primitives: [],
        actionSkillExecutionUnit: false,
        blockedReason: `Primitive ${action.primitive_id} is not executable in the social cycle runtime`
      };
    }
    return {
      primitives: [action.primitive_id as AllowedTool],
      actionSkillExecutionUnit: false
    };
  }

  if (action.kind === "use_action_skill" && action.action_skill_id) {
    const owned = activeActionSkills.find((skill) => skill.skill_id === action.action_skill_id);
    if (!owned || owned.required_primitives.length === 0) {
      return {
        primitives: [],
        actionSkillExecutionUnit: false,
        blockedReason: "No owned action skill primitives for action"
      };
    }
    if (isGeneratedMineflayerActionSkill(owned)) {
      return {
        primitives: ["run_mineflayer_program"],
        actionSkillExecutionUnit: true
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
    blockedReason: "No primitive resolved for action"
  };
}

export function resolvePrimitivesForLegacyPlannerAction(
  action: LegacyPlannerAction,
  activeActionSkills: readonly ActorActionSkillRecord[]
): {
  primitives: AllowedTool[];
  actionSkillExecutionUnit: boolean;
  blockedReason?: string;
} {
  const parameters = legacyPlannerActionParameters(action);
  if (
    action.kind === "use_primitive" &&
    typeof action.action_skill_id === "string"
  ) {
    return {
      primitives: [],
      actionSkillExecutionUnit: false,
      blockedReason:
        "Direct primitive intents cannot carry action_skill_id or args.actionSkillId; use use_action_skill for actor-owned action skill execution"
    };
  }
  return resolvePrimitivesForActorTurnAction(
    actorTurnActionFromLegacyPlannerAction(action),
    activeActionSkills
  );
}

/** Role-safe runtime affordances for the Soul/LifeGoal cycle; social context is not a hardcoded strategy funnel. */
export function compileSocialAllowedPrimitives(roleId: string) {
  const contract = getRoleContract(roleId as RoleId);
  return contract.allowedTools.filter(isSocialExecutablePrimitive);
}
