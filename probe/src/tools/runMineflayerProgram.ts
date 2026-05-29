import type { Bot } from "mineflayer";
import { Vec3 } from "vec3";

import {
  runDirectGeneratedActionSkill,
  type DirectGeneratedActionSkillRunResult,
  type GeneratedActionSkillHelperEvent
} from "../generatedActionSkills/directExecutor.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { createDialogueState } from "../runtime/dialogueState.js";
import { createMemory } from "../runtime/memory.js";
import { buildPattern } from "./buildPattern.js";
import { collectLogs } from "./collectLogs.js";
import { consumeItem } from "./consumeItem.js";
import { craftItem } from "./craftItem.js";
import { craftWithTable } from "./craftWithTable.js";
import { mineBlock } from "./mineBlock.js";
import { observe } from "./observe.js";
import { placeBlock } from "./placeBlock.js";
import { say } from "./say.js";

type Positioned = { x: number; y: number; z: number };
type ControlStateName = Parameters<Bot["setControlState"]>[0];

type RunMineflayerProgramStatus =
  | "completed_with_evidence"
  | "completed"
  | "timeout"
  | "skill_error"
  | "rejected";

export type RunMineflayerProgramResult = {
  status: RunMineflayerProgramStatus;
  purpose?: string;
  sourcePath?: string;
  timeoutMs: number;
  durationMs: number;
  helperEvents: JsonValue[];
  generatedResult?: JsonValue;
  errorMessage?: string;
  postObservation: JsonValue;
  reason: string;
};

export type RunMineflayerProgramInput = {
  actorId: string;
  bot: Bot;
  targetBot?: Bot;
  source: string;
  purpose?: string;
  expectedObservation?: string;
  artifactDir?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
};

const movementControls: ControlStateName[] = ["forward", "back", "left", "right", "jump", "sprint", "sneak"];
const allowedControls = new Set(movementControls);
const allowedMineflayerMethods = new Set([
  "activateItem",
  "chat",
  "clearControlStates",
  "deactivateItem",
  "equipByName",
  "lookAt",
  "lookAtNearestBlock",
  "setControlState",
  "swingArm"
]);

const successfulHelperStatuses: Record<string, Set<string>> = {
  buildPattern: new Set(["built"]),
  collectLogs: new Set(["collected"]),
  consumeItem: new Set(["consumed"]),
  craftItem: new Set(["crafted"]),
  craftWithTable: new Set(["crafted"]),
  mineBlock: new Set(["mined"]),
  placeBlock: new Set(["placed", "already_present"]),
  say: new Set(["delivered"])
};

function asObserveActor(bot: Bot) {
  return bot as unknown as Parameters<typeof observe>[0]["actor"];
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

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function readTimeoutMs(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(500, Math.min(10_000, Math.floor(value)))
    : 8_000;
}

function readPosition(value: unknown): Positioned | null {
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
  return readPosition(record.position) ?? readPosition(record.targetPosition) ?? readPosition(record.target_position);
}

function positionOf(bot: Bot): Positioned {
  return {
    x: bot.entity.position.x,
    y: bot.entity.position.y,
    z: bot.entity.position.z
  };
}

function clearMovement(bot: Bot) {
  for (const control of movementControls) {
    bot.setControlState(control, false);
  }
  bot.pathfinder?.stop?.();
  bot.stopDigging?.();
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error("run_mineflayer_program was cancelled");
  }
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("run_mineflayer_program wait was cancelled"));
      return;
    }
    let onAbort: (() => void) | undefined;
    const timeout = setTimeout(() => {
      if (onAbort) {
        signal?.removeEventListener("abort", onAbort);
      }
      resolve();
    }, Math.max(0, Math.min(ms, 10_000)));
    onAbort = () => {
      clearTimeout(timeout);
      reject(new Error("run_mineflayer_program wait was cancelled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function targetVec3(value: unknown) {
  const position = readPosition(value);
  if (!position) {
    throw new Error("Mineflayer lookAt requires x/y/z, position, targetPosition, or target_position");
  }
  return new Vec3(position.x, position.y, position.z);
}

async function runMineflayerMethod(input: {
  bot: Bot;
  method: string;
  args?: Record<string, unknown>;
  signal?: AbortSignal;
}) {
  const args = input.args ?? {};
  if (!allowedMineflayerMethods.has(input.method)) {
    throw new Error(`Mineflayer method ${input.method} is not exposed by run_mineflayer_program`);
  }
  throwIfAborted(input.signal);

  switch (input.method) {
    case "lookAt": {
      const target = targetVec3(args.target ?? args);
      await input.bot.lookAt(target, true);
      return { status: "completed", method: input.method, target };
    }
    case "lookAtNearestBlock": {
      const blockName = typeof args.blockName === "string" ? normalizeName(args.blockName) : undefined;
      if (!blockName) {
        throw new Error("lookAtNearestBlock requires blockName");
      }
      const maxDistance = typeof args.maxDistance === "number" ? Math.max(2, Math.min(32, args.maxDistance)) : 8;
      const block = input.bot.findBlock({
        matching: (candidate) => candidate.name === blockName,
        maxDistance
      });
      if (!block) {
        return { status: "blocked", method: input.method, blockName, reason: "no matching loaded block" };
      }
      await input.bot.lookAt(new Vec3(block.position.x + 0.5, block.position.y + 0.5, block.position.z + 0.5), true);
      return { status: "completed", method: input.method, blockName, position: block.position };
    }
    case "setControlState": {
      const control = typeof args.control === "string" ? args.control : "";
      if (!allowedControls.has(control as ControlStateName)) {
        throw new Error(`Control ${control} is not exposed by run_mineflayer_program`);
      }
      const state = Boolean(args.state);
      input.bot.setControlState(control as ControlStateName, state);
      if (state && typeof args.durationMs === "number") {
        await delay(args.durationMs, input.signal);
        input.bot.setControlState(control as ControlStateName, false);
      }
      return { status: "completed", method: input.method, control, state };
    }
    case "clearControlStates":
      clearMovement(input.bot);
      return { status: "completed", method: input.method };
    case "swingArm":
      input.bot.swingArm?.(
        args.hand === "left" ? "left" : "right",
        typeof args.showHand === "boolean" ? args.showHand : true
      );
      return { status: "completed", method: input.method, hand: args.hand === "left" ? "left" : "right" };
    case "equipByName": {
      const itemName = typeof args.itemName === "string" ? normalizeName(args.itemName) : undefined;
      if (!itemName) {
        throw new Error("equipByName requires itemName");
      }
      const item = input.bot.inventory.items().find((candidate) => candidate.name === itemName);
      if (!item) {
        return { status: "blocked", method: input.method, itemName, reason: "item not in inventory" };
      }
      const destination = typeof args.destination === "string" ? args.destination : "hand";
      await input.bot.equip(item, destination as Parameters<Bot["equip"]>[1]);
      return { status: "completed", method: input.method, itemName, destination };
    }
    case "activateItem":
      input.bot.activateItem();
      return { status: "completed", method: input.method };
    case "deactivateItem":
      input.bot.deactivateItem();
      return { status: "completed", method: input.method };
    case "chat": {
      const text = typeof args.text === "string" ? args.text : "";
      if (!text.trim()) {
        throw new Error("chat requires text");
      }
      input.bot.chat(text);
      return { status: "sent", method: input.method, text };
    }
  }
}

function helperHasVerifiedEvidence(event: GeneratedActionSkillHelperEvent) {
  if (event.status !== "completed") {
    return false;
  }
  const acceptedStatuses = successfulHelperStatuses[event.name];
  if (!acceptedStatuses) {
    return false;
  }
  const status =
    event.result &&
    typeof event.result === "object" &&
    !Array.isArray(event.result) &&
    typeof (event.result as { status?: unknown }).status === "string"
      ? String((event.result as { status: string }).status)
      : "";
  return acceptedStatuses.has(status);
}

function resultStatus(result: DirectGeneratedActionSkillRunResult): RunMineflayerProgramStatus {
  if (result.status !== "completed") {
    return result.status;
  }
  return result.helperEvents.some(helperHasVerifiedEvidence)
    ? "completed_with_evidence"
    : "completed";
}

async function observeAfter(input: { actorId: string; bot: Bot; targetBot?: Bot }) {
  return observe({
    actor: asObserveActor(input.bot),
    target: asObserveActor(input.targetBot ?? input.bot),
    dialogueState: createDialogueState({ busyRepliesBeforeAvailable: 0 }),
    memory: createMemory(8)
  });
}

export async function runMineflayerProgram(
  input: RunMineflayerProgramInput
): Promise<RunMineflayerProgramResult> {
  const timeoutMs = readTimeoutMs(input.timeoutMs);
  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 0 });
  const memory = createMemory(8);

  const ctx = {
    actorId: input.actorId,
    purpose: input.purpose,
    expectedObservation: input.expectedObservation,
    position: () => positionOf(input.bot),
    inventoryItems: () =>
      input.bot.inventory.items().map((item) => ({
        name: item.name,
        count: item.count
      })),
    observe: () =>
      observe({
        actor: asObserveActor(input.bot),
        target: asObserveActor(input.targetBot ?? input.bot),
        dialogueState,
        memory
      }),
    wait: (ms: number) => delay(ms, input.signal),
    collectLogs: (targetCount = 1) =>
      collectLogs({ bot: input.bot, targetCount: Math.max(1, Math.floor(targetCount)), signal: input.signal }),
    mineBlock: (blockName: string, targetCount = 1, searchDistance?: number) =>
      mineBlock({
        bot: input.bot,
        blockName: normalizeName(blockName),
        targetCount: Math.max(1, Math.floor(targetCount)),
        searchDistance,
        signal: input.signal
      }),
    craftItem: (itemName: string) => craftItem({ bot: input.bot, itemName: normalizeName(itemName) }),
    craftWithTable: (itemName: string) => craftWithTable({ bot: input.bot, itemName: normalizeName(itemName) }),
    consumeItem: (itemName: string) =>
      consumeItem({ bot: input.bot, itemName: normalizeName(itemName), signal: input.signal }),
    placeBlock: (itemName: string, targetPosition: Positioned) =>
      placeBlock({
        bot: input.bot,
        itemName: normalizeName(itemName),
        targetPosition,
        signal: input.signal
      }),
    buildPattern: (args: {
      anchor?: Positioned;
      targetPosition?: Positioned;
      preferredMaterials?: string[];
      maxPlacements?: number;
    } = {}) =>
      buildPattern({
        bot: input.bot,
        anchor: args.anchor ?? args.targetPosition ?? {
          x: Math.floor(input.bot.entity.position.x) + 2,
          y: Math.floor(input.bot.entity.position.y),
          z: Math.floor(input.bot.entity.position.z) + 2
        },
        preferredMaterials: args.preferredMaterials ?? [],
        maxPlacements: args.maxPlacements,
        signal: input.signal
      }),
    say: (text: string) =>
      say({
        actor: input.bot as unknown as Parameters<typeof say>[0]["actor"],
        target: (input.targetBot ?? input.bot) as unknown as Parameters<typeof say>[0]["target"],
        dialogueState,
        text
      }),
    mineflayer: (method: string, args?: Record<string, unknown>) =>
      runMineflayerMethod({ bot: input.bot, method, args, signal: input.signal })
  };

  const execution = await runDirectGeneratedActionSkill({
    actorId: input.actorId,
    skillName: "socialCycleMineflayerProgram",
    source: input.source,
    ctx,
    timeoutMs,
    artifactDir: input.artifactDir,
    onTimeout: () => clearMovement(input.bot)
  });
  clearMovement(input.bot);

  const postObservation = await observeAfter(input);
  const status = resultStatus(execution);
  const helperEvents = execution.helperEvents.map(toJsonValue);
  const reason =
    status === "completed_with_evidence"
      ? "generated program completed and at least one runtime helper produced verified evidence"
      : status === "completed"
        ? "generated program completed, but no helper produced a verifier-classified mutation"
        : execution.errorMessage ?? `generated program ended with ${status}`;

  return {
    status,
    purpose: input.purpose,
    sourcePath: execution.sourcePath,
    timeoutMs: execution.timeoutMs,
    durationMs: execution.durationMs,
    helperEvents,
    generatedResult: toJsonValue(execution.result),
    errorMessage: execution.errorMessage,
    postObservation: toJsonValue(postObservation),
    reason
  };
}
