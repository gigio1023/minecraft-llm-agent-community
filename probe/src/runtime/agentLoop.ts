import type { AllowedTool, ToolProposal, ValidatedProposal } from "../tools/index.js";
import type { ToolResult } from "../mutual/types.js";
import type { ObserveResult } from "../tools/observe.js";
import { toToolResult } from "../mutual/tools/wrapper.js";
import { selectDeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";
import { verifyTask, type TaskVerification } from "../gameplay/verification/verifyTask.js";
import { createAntiRepeatPolicy } from "./antiRepeat.js";
import { buildPressureIntentContext, type IntentRecord, type PressureIntentContext } from "./pressureIntent.js";
import { createMemoryCompactor, type StepRecord } from "../memory/summaries/memoryCompactor.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as mineflayer from "mineflayer";
import { pathfinder, Movements } from "mineflayer-pathfinder";
import minecraftData from "minecraft-data";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type RuntimeActor = {
  username: string;
};

type ToolContext<TActor extends RuntimeActor> = {
  actor: TActor;
  target: TActor;
  args: Record<string, unknown>;
};

type TranscriptRecorder = {
  recordStep(step: {
    actor: string;
    observation: JsonValue;
    task?: JsonValue;
    pressureContext?: JsonValue;
    tool: AllowedTool;
    args?: Record<string, JsonValue>;
    result: JsonValue;
    verification?: JsonValue;
  }): void;
};

type Provider = {
  next(input: {
    observation: ObserveResult;
    lastResult: ToolResult | null;
    currentTask?: ReturnType<typeof selectDeterministicTask>;
  }): Promise<ToolProposal> | ToolProposal;
};

export type AgentLoopTools<TActor extends RuntimeActor> = {
  validateProposal(proposal: ToolProposal): ValidatedProposal;
  observe(input: { actor: TActor; target: TActor }): Promise<ObserveResult> | ObserveResult;
  move_to(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  collect_logs(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  craft_item(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  inspect_chest(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  deposit_shared(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  withdraw_shared(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  say(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  wait(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  remember(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
};

type AgentLoopArgs<TActor extends RuntimeActor> = {
  bots: {
    actor: TActor;
    target: TActor;
  };
  provider: Provider;
  tools: AgentLoopTools<TActor>;
  transcript: TranscriptRecorder;
  initialCompletedTaskIds?: string[];
  maxSteps?: number;
  config?: any;
  server?: { host: string; port: number };
};

const DEFAULT_MAX_STEPS = 10;

function toJsonRecord(args: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, toJsonValue(value)])
  );
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

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  throw new Error(`Tool args must be JSON-safe, received ${typeof value}`);
}

async function executeTool<TActor extends RuntimeActor>(
  tools: AgentLoopTools<TActor>,
  validated: ValidatedProposal,
  actor: TActor,
  target: TActor,
  observation: ObserveResult
): Promise<ToolResult> {
  switch (validated.tool) {
    case "observe":
      return {
        tool: "observe",
        ok: true,
        status: observation.status,
        observation
      };
    case "move_to":
      return tools.move_to({ actor, target, args: validated.args });
    case "collect_logs":
      return tools.collect_logs({ actor, target, args: validated.args });
    case "craft_item":
      return tools.craft_item({ actor, target, args: validated.args });
    case "inspect_chest":
      return tools.inspect_chest({ actor, target, args: validated.args });
    case "deposit_shared":
      return tools.deposit_shared({ actor, target, args: validated.args });
    case "withdraw_shared":
      return tools.withdraw_shared({ actor, target, args: validated.args });
    case "say":
      return tools.say({ actor, target, args: validated.args });
    case "wait":
      return tools.wait({ actor, target, args: validated.args });
    case "remember":
      return tools.remember({ actor, target, args: validated.args });
  }
}

function isBotConnected(bot: any): boolean {
  return bot && bot._client && bot._client.socket && bot._client.socket.writable;
}

export async function runAgentLoop<TActor extends RuntimeActor>({
  bots,
  provider,
  tools,
  transcript,
  initialCompletedTaskIds = [],
  maxSteps = DEFAULT_MAX_STEPS,
  config,
  server
}: AgentLoopArgs<TActor>) {
  let actor = bots.actor;
  const target = bots.target;

  // Create checkpoints directory asynchronously (skip in test environment to avoid test pollution)
  const isTestEnv = process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test";
  const checkpointDir = path.join(process.cwd(), "build", "checkpoints");
  if (!isTestEnv) {
    await fs.mkdir(checkpointDir, { recursive: true });
  }

  const tasksPath = path.join(checkpointDir, `tasks-${actor.username}.json`);
  const memoryPath = path.join(checkpointDir, `memory-${actor.username}.json`);
  const physicalPath = path.join(checkpointDir, `physical-${actor.username}.json`);

  // 1) Hydrate completed tasks checkpoint
  const completedTaskIds = new Set<string>(initialCompletedTaskIds);
  if (!isTestEnv) {
    try {
      const tasksContent = await fs.readFile(tasksPath, "utf-8");
      const parsedTasks = JSON.parse(tasksContent) as string[];
      for (const taskId of parsedTasks) {
        completedTaskIds.add(taskId);
      }
      console.log(`[${actor.username}] Hydrated completed tasks checkpoint:`, [...completedTaskIds]);
    } catch (e) {
      console.log(`[${actor.username}] No tasks checkpoint or error reading, using default tasks.`);
    }
  }

  // 2) Hydrate memory state checkpoint
  const compactor = createMemoryCompactor();
  let accumulatedSummary = "";
  const recentSteps: StepRecord[] = [];
  if (!isTestEnv) {
    try {
      const memoryContent = await fs.readFile(memoryPath, "utf-8");
      const parsedMemory = JSON.parse(memoryContent) as { accumulatedSummary: string; recentSteps: StepRecord[] };
      accumulatedSummary = parsedMemory.accumulatedSummary || "";
      for (const stepRec of parsedMemory.recentSteps || []) {
        recentSteps.push(stepRec);
      }
      console.log(`[${actor.username}] Hydrated memory summary length: ${accumulatedSummary.length}, recent steps: ${recentSteps.length}`);
    } catch (e) {
      console.log(`[${actor.username}] No memory checkpoint or error reading, starting fresh memory.`);
    }
  }

  // 3) Hydrate physical state checkpoint and loop step indices
  let startStep = 0;
  let currentEpoch = 1;
  if (!isTestEnv) {
    try {
      const physicalContent = await fs.readFile(physicalPath, "utf-8");
      const parsedPhys = JSON.parse(physicalContent) as { x: number; y: number; z: number; health?: number; hunger?: number; epoch?: number; totalTurns?: number };
      if (typeof parsedPhys.totalTurns === "number") {
        startStep = parsedPhys.totalTurns;
      }
      if (typeof parsedPhys.epoch === "number") {
        currentEpoch = parsedPhys.epoch;
      }
      console.log(`[${actor.username}] Hydrated physical state at turn ${startStep}, epoch ${currentEpoch}: x=${parsedPhys.x}, y=${parsedPhys.y}, z=${parsedPhys.z}`);
    } catch (e) {
      console.log(`[${actor.username}] No physical checkpoint or error reading, starting loop from step 0.`);
    }
  }

  let lastResult: ToolResult | null = null;
  let previousIntent: IntentRecord | undefined;
  let previousProposal: ToolProposal | undefined;
  const antiRepeat = createAntiRepeatPolicy();
  let consecutiveBypassTurns = 0;
  const maxContinuousBypassTurns = 5;

  // Sliding window for Stall Detection
  const lastThreeTurns: Array<{ tool: string; args: any; ok: boolean }> = [];

  for (let step = startStep; step < maxSteps; step += 1) {
    // Check if the bot connection is still alive, otherwise auto reconnect
    if (!isTestEnv && !isBotConnected(actor)) {
      console.log(`[${actor.username}] Connection lost! Initiating auto reconnect...`);
      let success = false;
      const staggerDelays = [1000, 2000, 5000, 10000, 30000, 60000];
      let reconnectAttempts = 0;
      const maxAttempts = config?.reconnect_attempts ?? 50;

      while (reconnectAttempts < maxAttempts && !success) {
        reconnectAttempts++;
        const delay = staggerDelays[Math.min(reconnectAttempts - 1, staggerDelays.length - 1)];
        console.log(`[${actor.username}] Reconnect attempt ${reconnectAttempts}/${maxAttempts} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
          const newBot = mineflayer.createBot({
            host: server?.host ?? "127.0.0.1",
            port: server?.port ?? 25565,
            username: actor.username,
            auth: "offline",
            version: config?.server?.version ?? "1.20.1",
            viewDistance: "tiny"
          });
          newBot.loadPlugin(pathfinder);

          const mcData = minecraftData(newBot.version || config?.server?.version || "1.20.1");
          const defaultMovements = new (Movements as any)(newBot, mcData);
          (newBot as any).pathfinder.setMovements(defaultMovements);

          await new Promise<void>((resolve, reject) => {
            const onSpawn = () => {
              newBot.off("spawn", onSpawn);
              newBot.off("error", onError);
              newBot.off("end", onEnd);
              resolve();
            };
            const onError = (err: Error) => {
              newBot.off("spawn", onSpawn);
              newBot.off("error", onError);
              newBot.off("end", onEnd);
              reject(err);
            };
            const onEnd = (reason: string) => {
              newBot.off("spawn", onSpawn);
              newBot.off("error", onError);
              newBot.off("end", onEnd);
              reject(new Error(`Bot ended before spawn: ${reason}`));
            };
            newBot.on("spawn", onSpawn);
            newBot.on("error", onError);
            newBot.on("end", onEnd);
          });

          bots.actor = newBot as any;
          actor = newBot as any;
          success = true;
          console.log(`[${actor.username}] Auto reconnect successful on attempt ${reconnectAttempts}!`);
        } catch (err) {
          console.error(`[${actor.username}] Reconnect attempt ${reconnectAttempts} failed:`, err);
        }
      }

      if (!success) {
        throw new Error(`[${actor.username}] Auto reconnect failed after ${maxAttempts} attempts.`);
      }
    }

    const observation = await tools.observe({ actor, target });
    if (accumulatedSummary) {
      observation.memory = [accumulatedSummary, ...observation.memory];
    }

    // Stall Detection Guard
    const isStalled = lastThreeTurns.length === 3 && lastThreeTurns.every(t => {
      return !t.ok && t.tool === lastThreeTurns[0].tool && JSON.stringify(t.args) === JSON.stringify(lastThreeTurns[0].args);
    });

    if (isStalled) {
      const stallMsg = `[STALL GUARD] 에이전트 ${actor.username}이(가) 최근 3턴 동안 동일한 행동(${lastThreeTurns[0].tool})을 수행하여 실패했습니다. 인자: ${JSON.stringify(lastThreeTurns[0].args)}. 동일한 툴과 좌표 매개변수를 계속해서 반복 호출하지 말고, 다른 툴을 활용하거나 대상 좌표를 변경하여 새로운 방식을 모색하세요.`;
      console.log(`[${actor.username}] [Turn ${step + 1}] Stall detected! Injecting warning to prompter.`);
      observation.memory = [stallMsg, ...observation.memory];
    }

    const currentTask = selectDeterministicTask({
      visibleActors: observation.visibleActors.map((visibleActor) => ({
        id: visibleActor.id,
        distance: visibleActor.distance
      })),
      ...(observation.inventory ? { inventory: observation.inventory } : {}),
      ...(observation.sharedChest ? { sharedChest: observation.sharedChest } : {}),
      completedTaskIds: [...completedTaskIds]
    });

    const pressureContext = buildPressureIntentContext({
      actorId: actor.username,
      turn: step + 1,
      observation,
      currentTask,
      completedTaskIds: [...completedTaskIds],
      previousIntent
    });
    previousIntent = pressureContext.currentIntent;

    // 3-tier Safety Guard System for Event-driven LLM triggers
    let proposal: ToolProposal;
    const isSustainableTool =
      previousProposal &&
      ["collect_logs", "move_to", "wait"].includes(previousProposal.tool);

    // Duck typing entities search to check for hostile threats within 16 blocks
    let hostileDetected = false;
    const entities = (actor as any).entities;
    if (entities) {
      const hostileNames = ["zombie", "skeleton", "spider", "creeper", "witch", "enderman", "slime", "phantom", "pillager"];
      const botPos = (actor as any).entity?.position;
      for (const key of Object.keys(entities)) {
        const entity = entities[key];
        if (entity && hostileNames.includes(entity.name)) {
          if (botPos && entity.position) {
            const dist = botPos.distanceTo(entity.position);
            if (dist <= 16) {
              hostileDetected = true;
              break;
            }
          }
        }
      }
    }

    const hungerWarning = typeof (actor as any).food === "number" && (actor as any).food <= 6;
    const healthWarning = typeof (actor as any).health === "number" && (actor as any).health < 20;
    const safetyTriggered = hostileDetected || hungerWarning || healthWarning;

    const shouldBypass =
      lastResult &&
      lastResult.ok &&
      isSustainableTool &&
      currentTask &&
      !completedTaskIds.has(currentTask.id) &&
      consecutiveBypassTurns < maxContinuousBypassTurns &&
      !safetyTriggered;

    if (shouldBypass) {
      proposal = previousProposal!;
      consecutiveBypassTurns += 1;
      console.log(`[${actor.username}] [Turn ${step + 1}] Bypassing LLM (Consecutive: ${consecutiveBypassTurns}). Continuing: ${proposal.tool}`);
    } else {
      proposal = await provider.next({ observation, lastResult, currentTask });
      consecutiveBypassTurns = 0;
      if (safetyTriggered) {
        console.log(`[${actor.username}] [Turn ${step + 1}] Safety Guard Triggered (Hostile: ${hostileDetected}, Hunger: ${hungerWarning}, Health: ${healthWarning}). Forcing LLM call.`);
      }
    }
    previousProposal = proposal;

    const validated = tools.validateProposal(proposal);
    const result = await executePhaseOneTool({
      tools,
      validated,
      actor,
      target,
      observation,
      currentTask,
      actorId: actor.username,
      antiRepeat
    });
    const verification = readVerification(result);

    // Record this turn in the stall history window
    lastThreeTurns.push({
      tool: validated.tool,
      args: validated.args,
      ok: result.ok
    });
    if (lastThreeTurns.length > 3) {
      lastThreeTurns.shift();
    }

    const stepRecord: StepRecord = {
      actor: actor.username,
      observation: toJsonValue(observation),
      ...(currentTask ? { task: toJsonValue(currentTask) } : {}),
      pressureContext: toJsonValue(pressureContext),
      tool: validated.tool as AllowedTool,
      args: Object.keys(validated.args).length > 0 ? toJsonRecord(validated.args) : undefined,
      result: toJsonValue(result),
      ...(verification ? { verification: toJsonValue(verification) } : {})
    };

    // Async Non-blocking Transcript Logging
    transcript.recordStep(stepRecord as any);
    recentSteps.push(stepRecord);

    // Strict Array Capping to protect against Node.js Heap OOM leaks
    if (recentSteps.length > 12) {
      recentSteps.splice(0, recentSteps.length - 12);
    }

    // 100-turn Rolling Epoch Management for transcript.jsonl (skip if test env)
    const currentEpochVal = Math.floor(step / 100) + 1;
    if (!isTestEnv) {
      const transcriptPath = path.join(checkpointDir, `transcript-${actor.username}-epoch-${currentEpochVal}.jsonl`);
      const jsonlLine = JSON.stringify(stepRecord) + "\n";
      await fs.appendFile(transcriptPath, jsonlLine, "utf-8").catch(err => {
        console.error(`[${actor.username}] Failed async writing transcript JSONL line:`, err);
      });
    }

    if (recentSteps.length >= 5) {
      console.log(`[${actor.username}] Compacting last 5 steps to reduce context...`);
      accumulatedSummary = await compactor.compact(recentSteps, accumulatedSummary);
      recentSteps.length = 0;
      
      // Async Non-blocking write of memory checkpoint (skip if test env)
      if (!isTestEnv) {
        await fs.writeFile(memoryPath, JSON.stringify({ accumulatedSummary, recentSteps }), "utf-8").catch(err => {
          console.error(`[${actor.username}] Failed async writing memory checkpoint:`, err);
        });
      }
    }

    lastResult = toToolResult(result, validated.tool);

    // Async Non-blocking write of tasks checkpoint (skip if test env)
    if (currentTask && verification?.status === "passed") {
      completedTaskIds.add(currentTask.id);
      if (!isTestEnv) {
        await fs.writeFile(tasksPath, JSON.stringify([...completedTaskIds]), "utf-8").catch(err => {
          console.error(`[${actor.username}] Failed async writing tasks checkpoint:`, err);
        });
      }
    }

    // Async Non-blocking write of physical state checkpoint (skip if test env)
    const actorPos = (actor as any).entity?.position;
    const physicalState = {
      x: actorPos?.x ?? 0,
      y: actorPos?.y ?? 0,
      z: actorPos?.z ?? 0,
      health: (actor as any).health,
      hunger: (actor as any).food,
      epoch: currentEpochVal,
      totalTurns: step + 1
    };
    if (!isTestEnv) {
      await fs.writeFile(physicalPath, JSON.stringify(physicalState), "utf-8").catch(err => {
        console.error(`[${actor.username}] Failed async writing physical checkpoint:`, err);
      });
    }

    const stepDelay = process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test" ? 0 : 1000;
    await new Promise((resolve) => setTimeout(resolve, stepDelay));

    if (validated.tool === "remember") {
      return {
        status: "success" as const,
        why:
          typeof result.note === "string"
            ? result.note
            : "runtime-owned curriculum reached a terminal note"
      };
    }
  }

  throw new Error(`Agent loop exhausted ${maxSteps}-step budget without remember`);
}

function readVerification(result: ToolResult) {
  if (typeof result.verification !== "object" || result.verification === null) {
    return undefined;
  }

  return result.verification as TaskVerification;
}

async function executePhaseOneTool<TActor extends RuntimeActor>(input: {
  tools: AgentLoopTools<TActor>;
  validated: ValidatedProposal;
  actor: TActor;
  target: TActor;
  observation: ObserveResult;
  currentTask: ReturnType<typeof selectDeterministicTask>;
  actorId: string;
  antiRepeat: ReturnType<typeof createAntiRepeatPolicy>;
}) {
  const {
    tools,
    validated,
    actor,
    target,
    observation,
    currentTask,
    actorId,
    antiRepeat
  } = input;

  if (currentTask && !currentTask.primitiveIds.includes(validated.tool)) {
    if (validated.tool === "remember") {
      return executeTool(tools, validated, actor, target, observation);
    }

    return {
      tool: validated.tool,
      ok: false,
      status: "invalid",
      message: `Task ${currentTask.id} does not allow ${validated.tool}`
    } satisfies ToolResult;
  }

  const shouldVerifyCurrentTask =
    currentTask !== null &&
    currentTask !== undefined &&
    validated.tool !== "observe" &&
    validated.tool !== "wait" &&
    validated.tool !== "remember";

  if (
    shouldVerifyCurrentTask &&
    antiRepeat.shouldBlock({
      actorId,
      tool: validated.tool,
      args: validated.args
    })
  ) {
    const verification = verifyTask(currentTask, {
      before: observation,
      after: observation,
      result: {
        tool: validated.tool,
        ok: false,
        status: "blocked"
      }
    });

    return {
      tool: validated.tool,
      ok: false,
      status: "blocked",
      message: `Repeated failed ${validated.tool} attempt blocked by runtime policy`,
      verification
    } satisfies ToolResult;
  }

  const result = await executeTool(tools, validated, actor, target, observation);

  if (!shouldVerifyCurrentTask || !currentTask) {
    return result;
  }

  const after = await tools.observe({ actor, target });
  const verification = verifyTask(currentTask, {
    before: observation,
    after,
    result
  });

  antiRepeat.record({
    actorId,
    tool: validated.tool,
    args: validated.args,
    verificationStatus: verification.status
  });

  return {
    ...result,
    verification
  } satisfies ToolResult;
}
