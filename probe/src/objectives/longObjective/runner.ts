import { promises as fs } from "node:fs";
import path from "node:path";

import type { Bot } from "mineflayer";

import { loadProbeConfig, type ProbeConfig } from "../../config.js";
import { runDirectGeneratedActionSkill } from "../../generatedActionSkills/directExecutor.js";
import type {
  DirectGeneratedActionSkillRunResult,
  GeneratedActionSkillHelperEvent
} from "../../generatedActionSkills/directExecutor.js";
import { retrieveActorMemoryForObjective } from "../../memory/actorMemory.js";
import { scanNearbyBlocks as scanNearbyBlocksHelper } from "../../tools/longObjectiveHelpers.js";
import {
  createObjectivePhasePlanner,
  normalizeObjectivePhasePlannerId
} from "../../provider/planner/createObjectivePhasePlanner.js";
import type { ObjectivePlannerPathId } from "../../provider/planner/types.js";
import {
  planDirectGeneratedSource,
  type ResolvedDirectGeneratedSource
} from "../../provider/planner/planDirectGeneratedSource.js";
import type { JsonValue } from "../../provider/inputSnapshot.js";
import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../../runtime/actorWorkspacePaths.js";
import { writeJson } from "../../runtime/actorWorkspaceStore.js";
import { enqueueActorReviewJob, snapshotActiveActionSkills } from "../../reviewer/reviewerQueue.js";
import { listActiveActorActionSkillRecords } from "../../runtime/actorWorkspace.js";
import { closeBots, createBots } from "../../runtime/createBots.js";
import { buildLiveSmokeServerContext } from "../../server/liveSmokeServer.js";
import { execDockerCompose } from "../../server/composeCommand.js";
import {
  createDirectContext,
  prepareStoneAxeFixture,
  ensureObjectiveServer,
  readInventory
} from "../directGeneratedRunner.js";
import { getLongObjectivePhaseLadder, type LongObjectiveId, type LongPhaseDefinition } from "./ladder.js";
import { writeLongObjectiveMemoryIndex, writeLongObjectivePhaseMemory } from "./memory.js";
import { buildLongObjectiveReviewerTasks } from "./reviewer.js";
import type { LongObjectivePhaseReport, LongObjectiveReport, LongObjectiveStopReason } from "./types.js";
import { verifyPhaseEvidence } from "./verifiers.js";

export type LongObjectiveRunOptions = {
  objectiveId: string;
  actorId?: string;
  provider?: string;
  maxPhases?: number;
  maxActionsPerPhase?: number;
  reportPath?: string;
  timeoutMs?: number;
  forcePlannerPath?: ObjectivePlannerPathId;
};

type RconContext = ReturnType<typeof buildLiveSmokeServerContext>;
type RconRunner = (args: string[]) => Promise<void>;

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

function countInventory(inventory: ReturnType<typeof readInventory>, itemName: string) {
  return inventory
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

export function getLongObjectiveStatusForStopReason(
  stopReason: LongObjectiveStopReason
): LongObjectiveReport["status"] {
  if (stopReason === "objective_passed") {
    return "passed";
  }
  if (stopReason === "provider_blocked" || stopReason === "environment_blocked") {
    return "blocked";
  }
  return "failed";
}

export function classifyPlannerResolutionStopReason(
  resolved: Pick<ResolvedDirectGeneratedSource, "resolutionStatus">
): LongObjectiveStopReason | undefined {
  if (resolved.resolutionStatus === "provider_blocked") {
    return "provider_blocked";
  }
  if (resolved.resolutionStatus === "unsafe_or_rejected_source") {
    return "unsafe_or_rejected_source";
  }
  return undefined;
}

function buildPhasePrompt(input: {
  objectiveId: string;
  phase: LongPhaseDefinition;
  actorId: string;
  inventory: ReturnType<typeof readInventory>;
  memoryContext?: JsonValue;
}) {
  return [
    "Generate one TypeScript action skill for a Minecraft Mineflayer bot.",
    "Return only TypeScript source. Do not wrap it in markdown.",
    "The source must export exactly: export async function run(ctx, params) { ... }",
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
    `Phase objective: ${input.phase.summary}`,
    `Success criteria: current-run evidence for ${input.phase.targetItemName} >= ${input.phase.minCount}`,
    `Helper hints: ${input.phase.helperHints.join(", ")}`,
  JSON.stringify({
      objective_id: input.objectiveId,
      phase_id: input.phase.phaseId,
      actor_id: input.actorId,
      inventory: input.inventory,
      memory: input.memoryContext
    })
  ].join("\n");
}

async function createRconRunner(rcon: RconContext): Promise<RconRunner> {
  return async (args: string[]) => {
    await execDockerCompose(
      ["-f", rcon.composeFile, "exec", "-T", "mc", "rcon-cli", "--", ...args],
      { cwd: rcon.composeDir, env: rcon.env }
    );
  };
}

function stopBotAction(bot: Bot) {
  bot.pathfinder?.stop?.();
  bot.stopDigging?.();
  for (const control of ["forward", "back", "left", "right", "jump", "sprint", "sneak"]) {
    bot.setControlState(control as Parameters<Bot["setControlState"]>[0], false);
  }
}

function classifyHelperBlock(helperEvents: GeneratedActionSkillHelperEvent[]) {
  const blocked = helperEvents.find(
    (event) =>
      event.status === "completed" &&
      typeof event.result === "object" &&
      event.result !== null &&
      (event.result as { status?: unknown }).status === "blocked"
  );
  if (!blocked) {
    return undefined;
  }

  const reason =
    typeof blocked.result === "object" &&
    blocked.result !== null &&
    typeof (blocked.result as { reason?: unknown }).reason === "string"
      ? (blocked.result as { reason: string }).reason
      : blocked.name;

  if (/not wired|not implemented|needs pathfinder/i.test(reason)) {
    return "missing_helper" as const;
  }
  return "phase_failed" as const;
}

function createSkippedExecution(input: {
  actorId: string;
  phaseId: string;
  helperEvents: GeneratedActionSkillHelperEvent[];
  timeoutMs: number;
  reason: string;
}): DirectGeneratedActionSkillRunResult {
  return {
    status: "rejected",
    actorId: input.actorId,
    skillName: input.phaseId,
    helperEvents: input.helperEvents,
    errorMessage: `execution skipped before gameplay: ${input.reason}`,
    durationMs: 0,
    timeoutMs: input.timeoutMs
  };
}

function createPlannerSkippedPhaseReport(input: {
  actorId: string;
  phase: LongPhaseDefinition;
  resolved: ResolvedDirectGeneratedSource;
  stopReason: LongObjectiveStopReason;
  preInventory: ReturnType<typeof readInventory>;
  postInventory: ReturnType<typeof readInventory>;
  helperEvents: GeneratedActionSkillHelperEvent[];
  timeoutMs: number;
}): LongObjectivePhaseReport {
  const reason =
    input.resolved.fallbackReason ??
    input.resolved.errorKind ??
    input.resolved.resolutionStatus;
  const beforeCount = countInventory(input.preInventory, input.phase.targetItemName);
  const afterCount = countInventory(input.postInventory, input.phase.targetItemName);

  return {
    phaseId: input.phase.phaseId,
    summary: input.phase.summary,
    status: input.stopReason === "provider_blocked" ? "skipped" : "failed",
    verifierStatus: "missing",
    verifierReason: `phase execution skipped before gameplay: ${reason}`,
    generated: {
      providerId: input.resolved.plannerId,
      sourceKind: input.resolved.sourceKind,
      model: input.resolved.model,
      providerInputRef: input.resolved.providerInputRef,
      providerOutputRef: input.resolved.providerOutputRef,
      fallbackReason: reason,
      execution: createSkippedExecution({
        actorId: input.actorId,
        phaseId: input.phase.phaseId,
        helperEvents: input.helperEvents,
        timeoutMs: input.timeoutMs,
        reason
      })
    },
    evidence: {
      preInventory: input.preInventory,
      postInventory: input.postInventory,
      itemName: input.phase.targetItemName,
      beforeCount,
      afterCount,
      delta: afterCount - beforeCount,
      blockObservations: []
    },
    helperEvents: input.helperEvents
  };
}

export async function runLongObjective(options: LongObjectiveRunOptions): Promise<LongObjectiveReport> {
  const objectiveId = options.objectiveId as LongObjectiveId;
  const actorId = options.actorId ?? "npc_b";
  const providerId = normalizeObjectivePhasePlannerId(options.provider);
  const ladder = getLongObjectivePhaseLadder(objectiveId);
  const maxPhases = options.maxPhases ?? ladder.length;
  const maxActionsPerPhase = options.maxActionsPerPhase ?? 12;
  const runId = `${objectiveId}-${actorId}-${Date.now()}`;
  const config: ProbeConfig = {
    ...loadProbeConfig(),
    bots: [actorId],
    probeId: `long_objective_${objectiveId}`
  };
  const paths = getActorWorkspacePaths(config.actorWorkspace.rootDir, actorId);
  const artifactDir = path.join(paths.actionSkills.directTrialsDir, "long-objectives", sanitizeWorkspaceFileId(runId));
  await fs.mkdir(artifactDir, { recursive: true });

  const phases: LongObjectivePhaseReport[] = [];
  let stopReason: LongObjectiveStopReason = "budget_exhausted_without_progress";
  let nextRecommendedPhase: string | undefined;
  let hadProgress = false;

  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let server: { host: string; port: number; stop(): Promise<void> } | null = null;

  try {
    const serverContext = await ensureObjectiveServer(config);
    server = serverContext.server;
    console.log(`minecraft_long_objective_connect=${server.host}:${server.port}`);
    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });

    const bot = bots[actorId];
    if (!bot) {
      throw new Error(`Long objective bot roster did not contain actor ${actorId}`);
    }

    const runRcon = serverContext.rconContext
      ? await createRconRunner(serverContext.rconContext)
      : undefined;
    await prepareStoneAxeFixture({ bot, spawn: config.spawn, runRcon });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const phasesToRun = ladder.slice(0, maxPhases);
    for (const [index, phase] of phasesToRun.entries()) {
      const preInventory = readInventory(bot);
      const helperEvents: GeneratedActionSkillHelperEvent[] = [];
      const abortController = new AbortController();
      const memoryContext = await retrieveActorMemoryForObjective(
        config.actorWorkspace.rootDir,
        actorId,
        {
          objectiveId,
          objectiveCategory: "long",
          itemNames: [phase.targetItemName],
          actionSkillIds: phase.helperHints,
          limit: 6
        }
      );

      const planner = createObjectivePhasePlanner({
        plannerId: options.provider,
        config,
        forceGeminiPath: options.forcePlannerPath
      });
      const resolved = await planDirectGeneratedSource({
        planner,
        request: {
          actorId,
          turnId: `${runId}-${phase.phaseId}`,
          actorWorkspaceRootDir: config.actorWorkspace.rootDir,
          phaseId: phase.phaseId,
          objectiveId,
          prompt: buildPhasePrompt({
            objectiveId,
            phase,
            actorId,
            inventory: preInventory,
            memoryContext: memoryContext as unknown as JsonValue
          }),
          memoryContext: memoryContext as unknown as JsonValue
        }
      });

      const plannerStopReason = classifyPlannerResolutionStopReason(resolved);
      if (plannerStopReason) {
        const postInventory = readInventory(bot);
        const phaseReport = createPlannerSkippedPhaseReport({
          actorId,
          phase,
          resolved,
          stopReason: plannerStopReason,
          preInventory,
          postInventory,
          helperEvents,
          timeoutMs: options.timeoutMs ?? 90_000
        });
        const memoryPaths = await writeLongObjectivePhaseMemory({
          actorWorkspaceRootDir: config.actorWorkspace.rootDir,
          actorId,
          runId,
          objectiveId,
          phase: phaseReport,
          artifactDir
        });
        phaseReport.memoryPaths = memoryPaths;
        phases.push(phaseReport);
        stopReason = plannerStopReason;
        nextRecommendedPhase = phase.phaseId;
        break;
      }

      const plannerMeta = {
        providerId: resolved.plannerId,
        sourceKind: resolved.sourceKind,
        model: resolved.model,
        inputRef: resolved.providerInputRef,
        outputRef: resolved.providerOutputRef,
        fallbackReason: resolved.fallbackReason
      };

      const runPhaseSkill = async (skillSource: string) =>
        runDirectGeneratedActionSkill({
          actorId,
          skillName: phase.phaseId,
          source: skillSource,
          ctx: createDirectContext(bot, {
            signal: abortController.signal,
            helperEvents
          }),
          timeoutMs: options.timeoutMs ?? 90_000,
          artifactDir: path.join(artifactDir, sanitizeWorkspaceFileId(phase.phaseId)),
          helperEvents,
          onTimeout: async () => {
            abortController.abort();
            stopBotAction(bot);
          }
        });

      const execution = await runPhaseSkill(resolved.source);

      const postInventory = readInventory(bot);
      const blockObservations = scanNearbyBlocksHelper(bot, 24);
      const verification = verifyPhaseEvidence({
        phase,
        preInventory,
        postInventory,
        blockObservations,
        helperEvents
      });

      const phasePassed = verification.verifierStatus === "passed";
      if (phasePassed || verification.delta > 0) {
        hadProgress = true;
      }

      const phaseReport: LongObjectivePhaseReport = {
        phaseId: phase.phaseId,
        summary: phase.summary,
        status: phasePassed ? "passed" : "failed",
        verifierStatus: verification.verifierStatus,
        verifierReason: verification.verifierReason,
        generated: {
          providerId: plannerMeta.providerId,
          sourceKind: plannerMeta.sourceKind,
          model: plannerMeta.model,
          sourcePath: execution.sourcePath,
          providerInputRef: plannerMeta.inputRef,
          providerOutputRef: plannerMeta.outputRef,
          fallbackReason: plannerMeta.fallbackReason,
          execution
        },
        evidence: {
          preInventory,
          postInventory,
          itemName: verification.itemName,
          beforeCount: verification.beforeCount,
          afterCount: verification.afterCount,
          delta: verification.delta,
          blockObservations
        },
        helperEvents
      };

      const memoryPaths = await writeLongObjectivePhaseMemory({
        actorWorkspaceRootDir: config.actorWorkspace.rootDir,
        actorId,
        runId,
        objectiveId,
        phase: phaseReport,
        artifactDir
      });
      phaseReport.memoryPaths = memoryPaths;
      phases.push(phaseReport);

      if (!phasePassed) {
        const helperStop = classifyHelperBlock(helperEvents);
        stopReason =
          helperStop ??
          (execution.status === "rejected" ? "unsafe_or_rejected_source" : "phase_failed");
        nextRecommendedPhase = phase.phaseId;
        if (index < phasesToRun.length - 1 && maxActionsPerPhase > 0) {
          // budget metadata only; phases already bounded by maxPhases
        }
        break;
      }

      if (index === phasesToRun.length - 1) {
        stopReason = "objective_passed";
      }
    }

    if (stopReason !== "objective_passed" && phases.every((phase) => phase.status === "passed")) {
      stopReason = "objective_passed";
    }

    if (stopReason === "budget_exhausted_without_progress" && phases.length >= maxPhases) {
      stopReason = hadProgress
        ? "budget_exhausted_with_progress"
        : "budget_exhausted_without_progress";
      nextRecommendedPhase = nextRecommendedPhase ?? phases.at(-1)?.phaseId;
    }

    const status = getLongObjectiveStatusForStopReason(stopReason);

    const report: LongObjectiveReport = {
      schema: "long-objective-report/v1",
      runId,
      objectiveId,
      actorId,
      providerId,
      evidenceScope: "current_run",
      status,
      stopReason,
      phases,
      artifactRefs: {
        actorWorkspaceTrialPath: path.join(artifactDir, "report.json"),
        actorMemoryPaths: phases.flatMap((phase) => phase.memoryPaths ?? []),
        ...(options.reportPath ? { requestedReportPath: options.reportPath } : {})
      },
      nextRecommendedPhase,
      nextImplementationTasks: []
    };

    report.nextImplementationTasks = buildLongObjectiveReviewerTasks(report);
    await writeLongObjectiveMemoryIndex({
      actorWorkspaceRootDir: config.actorWorkspace.rootDir,
      actorId,
      objectiveId,
      memoryPaths: report.artifactRefs.actorMemoryPaths ?? []
    });
    await writeJson(path.join(artifactDir, "report.json"), toJsonValue(report));
    if (options.reportPath) {
      await writeJson(options.reportPath, toJsonValue(report));
    }

    try {
      const activeActionSkills = await listActiveActorActionSkillRecords(
        config.actorWorkspace.rootDir,
        actorId
      );
      await enqueueActorReviewJob(config.actorWorkspace.rootDir, {
        schema: "actor-review-job/v1",
        job_id: `long-objective-${runId}`,
        actor_id: actorId,
        reason: status === "passed" ? "manual_review" : "verification_failure",
        created_at: new Date().toISOString(),
        input_refs: [
          { kind: "action_skill_direct_trial", ref: path.join(artifactDir, "report.json") }
        ],
        active_action_skill_snapshot: snapshotActiveActionSkills(activeActionSkills)
      });
    } catch (error) {
      console.warn(`long_objective_reviewer_enqueue_failed=${error instanceof Error ? error.message : String(error)}`);
    }

    console.log(
      `long_objective_summary status=${status} objective=${objectiveId} stop=${stopReason} phases=${phases.length}`
    );
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stopReason: LongObjectiveStopReason = /docker|server|connect|auth/i.test(message)
      ? "environment_blocked"
      : "phase_failed";
    const report: LongObjectiveReport = {
      schema: "long-objective-report/v1",
      runId,
      objectiveId,
      actorId,
      providerId,
      evidenceScope: "current_run",
      status: getLongObjectiveStatusForStopReason(stopReason),
      stopReason,
      phases,
      artifactRefs: {
        actorWorkspaceTrialPath: path.join(artifactDir, "report.json"),
        ...(options.reportPath ? { requestedReportPath: options.reportPath } : {})
      },
      nextImplementationTasks: [
        stopReason === "environment_blocked"
          ? `Fix environment blocker: ${message}`
          : `Inspect long objective runner failure: ${message}`
      ]
    };
    await writeJson(path.join(artifactDir, "report.json"), toJsonValue(report));
    if (options.reportPath) {
      await writeJson(options.reportPath, toJsonValue(report));
    }
    throw error;
  } finally {
    if (bots) {
      await closeBots(bots);
    }
    if (server) {
      await server.stop();
    }
  }
}
