import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Bot } from "mineflayer";

import { loadProbeConfig, type ProbeConfig } from "../config.js";
import { assignSeedActionSkillOwnership } from "../skills/ownership.js";
import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "./actorWorkspace.js";
import { getActorWorkspacePaths } from "./actorWorkspacePaths.js";
import { ensureActorSoul } from "./goals/actorSoulStore.js";
import { bumpLifeGoalCounters, ensureActiveLifeGoal } from "./goals/lifeGoalStore.js";
import { listStrategicGoals } from "./goals/strategicGoalStore.js";
import { assembleSocialCycleContext } from "./goals/cycleContextAssembler.js";
import { createEmptySocialCycleReport, finalizeRuntimeStatus } from "./goals/cycleReport.js";
import type {
  ActionIntent,
  CycleJudgment,
  SocialCycleProviderId,
  SocialCycleRunReport,
  WorldEventKind
} from "./goals/types.js";
import { createWorldEvent, listWorldEvents, writeWorldEvent } from "./goals/worldEventStore.js";
import { runSocialGoalMindProvider } from "../provider/socialGoalMindProvider.js";
import { runSocialActionPlannerProvider } from "../provider/socialActionPlannerProvider.js";
import { runSocialCycleJudgmentProvider } from "../provider/socialCycleJudgmentProvider.js";
import type { OpenAiJsonProviderConfig } from "../provider/openaiApiJsonProvider.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import {
  compileSocialAllowedPrimitives,
  executeSocialActionIntent,
  filterExecutableSocialActionSkills,
  observeActorWorld
} from "./socialCycleExecution.js";
import { writeJson, type ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import { listActorMemoryRefs, writeActorMemoryRecords } from "../memory/actorMemory.js";
import { getActorProfile } from "../npc/profiles.js";
import {
  isMeaningfulProgressVerifier,
  type SocialPrimitiveAttemptStatus
} from "./socialCycleProgress.js";
import { createBots, closeBots } from "./createBots.js";
import { ensureLiveSmokeServer } from "../server/liveSmokeServer.js";
import { readManualMinecraftPort } from "../server/manualMinecraftPort.js";
import { startDockerServer } from "../server/dockerServer.js";

type ServerEndpoint = {
  host: string;
  port: number;
  mode: "manual" | "live_smoke" | "fresh_world";
  runRcon?: (args: string[]) => Promise<string>;
  stop: () => Promise<void>;
};

type SocialCycleActionAttemptReport = {
  attempt_id: string;
  action_index: number;
  turn_id: string;
  action_intent_ref: string;
  provider_input_refs: string[];
  provider_output_refs: string[];
  evidence_refs: string[];
  judgment_ref: string;
  verifier_status: "passed" | "failed" | "not_applicable";
  executed_tools: string[];
  tool_statuses: SocialPrimitiveAttemptStatus[];
  runtime_result: JsonValue;
  runtime_status: string;
};

type SocialCycleReportCycleWithAttempts = SocialCycleRunReport["cycles"][number] & {
  action_attempts: SocialCycleActionAttemptReport[];
};

function filterActionSkillsForAllowedPrimitives(
  records: readonly ActorActionSkillRecord[],
  allowedPrimitives: readonly string[]
) {
  const allowedPrimitiveSet = new Set(allowedPrimitives);
  return records.filter((record) =>
    record.required_primitives.every((primitive) => allowedPrimitiveSet.has(primitive))
  );
}

async function resolveServerEndpoint(
  config: ProbeConfig,
  options: { freshWorld?: boolean } = {}
): Promise<ServerEndpoint | null> {
  if (options.freshWorld) {
    const fresh = await startDockerServer(config);
    return {
      host: fresh.host,
      port: fresh.port,
      mode: "fresh_world",
      runRcon: fresh.runRcon,
      stop: fresh.stop
    };
  }

  const manualPort = readManualMinecraftPort();
  if (manualPort !== undefined) {
    return { host: "127.0.0.1", port: manualPort, mode: "manual", stop: async () => {} };
  }

  const live = await ensureLiveSmokeServer(config);
  if (!live.host || !live.port) {
    return null;
  }

  return { host: live.host, port: live.port, mode: "live_smoke", stop: async () => {} };
}

export type SocialCycleRunOptions = {
  actorId: string;
  providerId: SocialCycleProviderId;
  model: string;
  reasoning?: string;
  cycles: number;
  maxActionsPerCycle: number;
  reportPath: string;
  worldEvents?: Array<{ summary: string; kind: WorldEventKind }>;
  connectToWorld?: boolean;
  actorWorkspaceRootDir?: string;
  openAiApiKey?: string;
  /** Use a run-scoped actor workspace under social-runs/<run_id>/ to avoid stale artifacts. */
  isolateWorkspace?: boolean;
  /** Start a disposable Minecraft server/world for this run instead of reusing the live-smoke world. */
  freshWorld?: boolean;
  worldSeed?: string;
  levelType?: string;
  /** Prepare a small, live-world spawn access point for long survival/settlement runs. */
  prepareSpawnAccess?: boolean;
};

export type SocialCycleRunResult = {
  report: SocialCycleRunReport;
  reportPath: string;
};

async function persistJudgmentMemoryWrites(
  rootDir: string,
  actorId: string,
  judgment: CycleJudgment,
  actionIntent: ActionIntent,
  executedTools: readonly string[]
) {
  if (judgment.memory_writes.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  await writeActorMemoryRecords(
    rootDir,
    judgment.memory_writes.map((write, index) => ({
      schema: "actor-memory-record/v1",
      memory_id: `social-${judgment.cycle_id}-${index}`,
      actor_id: actorId,
      layer: write.layer === "belief" ? "belief" : write.layer,
      status: "active",
      confidence: write.confidence,
      scope: { kind: "actor_private", actor_id: actorId },
      created_at: now,
      updated_at: now,
      summary: write.summary,
      evidence_refs: [...judgment.evidence_refs],
      tags: ["social_cycle"],
      index: {
        objective_ids: [],
        objective_categories: ["social_cycle"],
        item_names: typeof actionIntent.args.itemName === "string" ? [actionIntent.args.itemName] : [],
        block_names: typeof actionIntent.args.blockName === "string" ? [actionIntent.args.blockName] : [],
        tool_names: [...executedTools],
        action_skill_ids: [
          ...(actionIntent.action_skill_id ? [actionIntent.action_skill_id] : []),
          ...(actionIntent.primitive_id ? [actionIntent.primitive_id] : [])
        ],
        diagnoses: [judgment.outcome],
        verifier_statuses: [judgment.verifier_status],
        causal_refs: [judgment.cycle_id]
      },
      content: {
        cycle_id: judgment.cycle_id,
        outcome: judgment.outcome,
        action_intent: actionIntent as unknown as JsonValue,
        executed_tools: [...executedTools]
      }
    }))
  );
  return judgment.memory_writes.length;
}

function floorBotPosition(bot: Bot) {
  return {
    x: Math.floor(bot.entity.position.x),
    y: Math.floor(bot.entity.position.y),
    z: Math.floor(bot.entity.position.z)
  };
}

async function prepareSpawnAccessPoint(input: {
  bot: Bot;
  runRcon: (args: string[]) => Promise<string>;
}) {
  const pos = floorBotPosition(input.bot);
  const username = input.bot.username;
  const commands: string[][] = [
    ["setworldspawn", String(pos.x), String(pos.y), String(pos.z)],
    ["execute", "at", username, "run", "fill", "~-3", "~-1", "~-3", "~3", "~-1", "~3", "grass_block"],
    ["execute", "at", username, "run", "fill", "~-3", "~0", "~-3", "~3", "~3", "~3", "air"],
    ["execute", "at", username, "run", "setblock", "~2", "~0", "~0", "chest"],
    ["execute", "at", username, "run", "setblock", "~-2", "~0", "~0", "crafting_table"],
    ["execute", "at", username, "run", "setblock", "~0", "~-1", "~0", "grass_block"]
  ];

  for (const command of commands) {
    await input.runRcon(command);
  }

  await new Promise((resolve) => setTimeout(resolve, 1_500));
  return pos;
}

export async function runSocialCycle(input: SocialCycleRunOptions): Promise<SocialCycleRunResult> {
  const loadedConfig = loadProbeConfig();
  const config: ProbeConfig = {
    ...loadedConfig,
    world: {
      seed: input.worldSeed ?? loadedConfig.world.seed,
      levelType: input.levelType ?? loadedConfig.world.levelType
    }
  };
  const runId = `social-cycle-${randomUUID()}`;
  const rootDir = input.isolateWorkspace
    ? path.join(config.actorWorkspace.rootDir, "social-runs", runId)
    : (input.actorWorkspaceRootDir ?? config.actorWorkspace.rootDir);
  const profile = getActorProfile(input.actorId);
  const reasoning = input.reasoning ?? process.env.SOCIAL_CYCLE_REASONING ?? "low";

  const report = createEmptySocialCycleReport({
    runId,
    actorId: input.actorId,
    providerId: input.providerId,
    model: input.model,
    reasoning
  });
  report.actor_workspace_root_dir = rootDir;
  report.server = {
    mode: input.freshWorld ? "fresh_world" : "live_smoke",
    seed: config.world.seed,
    level_type: config.world.levelType,
    version: config.server.version
  };

  const openAi: OpenAiJsonProviderConfig | undefined =
    input.providerId === "openai-api"
      ? {
          apiKey: input.openAiApiKey ?? process.env.OPENAI_API_KEY ?? "",
          model: input.model,
          reasoning,
          maxCompletionTokens: Number(process.env.SOCIAL_CYCLE_MAX_COMPLETION_TOKENS ?? 1600)
        }
      : undefined;

  await initializeActorWorkspaces({
    rootDir,
    actors: [{ actor_id: input.actorId, username: input.actorId, role_id: profile.gameplay_role }],
    seedActionSkillOwnership: assignSeedActionSkillOwnership(
      [input.actorId],
      { [input.actorId]: profile.gameplay_role }
    )
  });

  const soul = await ensureActorSoul(rootDir, input.actorId);
  const lifeGoal = await ensureActiveLifeGoal(rootDir, input.actorId, soul);
  report.agency_status.life_goal_source = lifeGoal.source;
  report.agency_status.used_soul = true;
  report.agency_status.used_life_goal = true;

  for (const eventInput of input.worldEvents ?? []) {
    const event = createWorldEvent({
      summary: eventInput.summary,
      kind: eventInput.kind,
      actorRefs: [input.actorId],
      runId
    });
    await writeWorldEvent(rootDir, input.actorId, event);
  }

  let bot: Bot | undefined;
  let stopServer: (() => Promise<void>) | undefined;
  let serverRunRcon: ((args: string[]) => Promise<string>) | undefined;

  if (input.connectToWorld !== false) {
    try {
      const server = await resolveServerEndpoint(config, { freshWorld: input.freshWorld });
      if (!server) {
        throw new Error("No joinable Minecraft endpoint");
      }
      stopServer = server.stop;
      serverRunRcon = server.runRcon;
      report.server = {
        ...report.server,
        mode: server.mode,
        endpoint: `${server.host}:${server.port}`
      };
      const bots = await createBots({ ...config, bots: [input.actorId] }, server);
      bot = bots[input.actorId];
      if (input.prepareSpawnAccess && bot && serverRunRcon) {
        const spawnAccessPosition = await prepareSpawnAccessPoint({
          bot,
          runRcon: serverRunRcon
        });
        report.server = {
          ...report.server,
          spawn_access_prepared: true,
          spawn_access_position: spawnAccessPosition
        };
      }
    } catch {
      report.agency_status.fixture_dependency = true;
    }
  } else {
    report.agency_status.fixture_dependency = true;
  }

  let providerFailed = false;
  let anyMeaningfulProgress = false;
  let previousCycleJudgment: {
    ref: string;
    judgment: CycleJudgment;
  } | null = null;

  try {
    const activeSkills = await listActiveActorActionSkillRecords(rootDir, input.actorId);
    const allowedPrimitives = compileSocialAllowedPrimitives(profile.gameplay_role);
    const executableActiveSkills = filterActionSkillsForAllowedPrimitives(
      filterExecutableSocialActionSkills(activeSkills),
      allowedPrimitives
    );
    const allowedSkillIds = executableActiveSkills.map((s) => s.skill_id);

    for (let cycleIndex = 0; cycleIndex < input.cycles; cycleIndex++) {
      const cycleId = `cycle-${String(cycleIndex + 1).padStart(4, "0")}`;
      const worldEvents = await listWorldEvents(rootDir, input.actorId, { runId });
      const strategicGoals = await listStrategicGoals(rootDir, input.actorId);
      const previousJudgments =
        previousCycleJudgment && cycleIndex > 0 ? [previousCycleJudgment] : [];

      if (previousJudgments.length > 0) {
        report.agency_status.used_previous_judgment = true;
      }

      const observation = await observeActorWorld({ actorId: input.actorId, bot });
      const context = await assembleSocialCycleContext({
        actorWorkspaceRootDir: rootDir,
        actorId: input.actorId,
        soul,
        lifeGoal,
        strategicGoals,
        worldEvents,
        previousJudgments,
        activeActionSkills: executableActiveSkills,
        observation,
        allowedPrimitiveIds: allowedPrimitives,
        maxActionsPerCycle: input.maxActionsPerCycle,
        cycleIndex
      });

      report.agency_status.used_world_event_refs = worldEvents.length;
      report.agency_status.used_memory_refs = Math.max(
        report.agency_status.used_memory_refs,
        listActorMemoryRefs(context.memory_packet).length
      );

      const goalMind = await runSocialGoalMindProvider({
        providerId: input.providerId,
        actorWorkspaceRootDir: rootDir,
        actorId: input.actorId,
        cycleId,
        context,
        openAi,
        allowedActionSkillIds: allowedSkillIds,
        allowedPrimitiveIds: allowedPrimitives
      });

      if (!goalMind.ok) {
        providerFailed = true;
        report.provider_error = goalMind.error;
        break;
      }

      report.agency_status.strategic_goal_source =
        goalMind.source === "llm_planner" ? "llm_planner" : "runtime_rule";
      report.agency_status.cycle_goal_source = goalMind.cycleGoal.source;
      report.agency_status.builtin_goal_authority = input.providerId === "deterministic-social";

      const paths = getActorWorkspacePaths(rootDir, input.actorId);
      const cycleGoalRef = path.join("goals", "cycle", `${goalMind.cycleGoal.goal_id}.json`);

      let lastIntentRef = "";
      let lastVerifier: "passed" | "failed" | "not_applicable" = "not_applicable";
      let actionSkillExecutionUnit = false;
      let lastJudgmentRef = "";
      let lastJudgment: {
        ref: string;
        judgment: CycleJudgment;
      } | null = null;
      const actionAttempts: SocialCycleActionAttemptReport[] = [];

      for (let actionIndex = 0; actionIndex < input.maxActionsPerCycle; actionIndex++) {
        const actionTurnId = `${cycleId}-action-${String(actionIndex + 1).padStart(2, "0")}`;
        const actionContext =
          actionIndex === 0
            ? context
            : {
                ...context,
                observation: await observeActorWorld({ actorId: input.actorId, bot })
              };
        const planner = await runSocialActionPlannerProvider({
          providerId: input.providerId,
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          actionIndex,
          cycleGoal: goalMind.cycleGoal,
          context: actionContext,
          openAi,
          defaultPrimitive: actionIndex === 0 ? "observe" : "wait",
          recentActionAttempts: actionAttempts.map((attempt) => ({
            action_index: attempt.action_index,
            executed_tools: attempt.executed_tools,
            tool_statuses: attempt.tool_statuses,
            verifier_status: attempt.verifier_status,
            runtime_status: attempt.runtime_status,
            runtime_result: attempt.runtime_result,
            evidence_refs: attempt.evidence_refs,
            judgment_ref: attempt.judgment_ref
          }))
        });

        if (!planner.ok) {
          providerFailed = true;
          report.provider_error = planner.error;
          break;
        }

        lastIntentRef = planner.intentRef;

        const execution = await executeSocialActionIntent({
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          cycleGoal: goalMind.cycleGoal,
          intent: planner.intent,
          activeActionSkills: executableActiveSkills,
          bot
        });

        lastVerifier = execution.verifierStatus;
        actionSkillExecutionUnit = execution.actionSkillExecutionUnit;
        if (
          isMeaningfulProgressVerifier(execution.verifierStatus, execution.executedTools)
        ) {
          anyMeaningfulProgress = true;
        }

        const judgmentResult = await runSocialCycleJudgmentProvider({
          providerId: input.providerId,
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          actionIndex,
          cycleGoal: goalMind.cycleGoal,
          actionIntent: planner.intent,
          context: actionContext,
          runtimeResult: execution.runtimeResult,
          evidenceRefs: execution.evidenceRefs,
          executedTools: execution.executedTools,
          verifierStatus: execution.verifierStatus,
          runId,
          openAi
        });

        if (!judgmentResult.ok) {
          providerFailed = true;
          report.provider_error = judgmentResult.error;
          break;
        }

        lastJudgmentRef = judgmentResult.judgmentRef;
        lastJudgment = {
          ref: judgmentResult.judgmentRef,
          judgment: judgmentResult.judgment
        };
        actionAttempts.push({
          attempt_id: actionTurnId,
          action_index: actionIndex,
          turn_id: actionTurnId,
          action_intent_ref: planner.intentRef,
          provider_input_refs: [
            path.relative(paths.actorDir, planner.inputRef),
            path.relative(paths.actorDir, judgmentResult.inputRef)
          ],
          provider_output_refs: [
            path.relative(paths.actorDir, planner.outputRef),
            path.relative(paths.actorDir, judgmentResult.outputRef)
          ],
          evidence_refs: execution.evidenceRefs,
          judgment_ref: judgmentResult.judgmentRef,
          verifier_status: execution.verifierStatus,
          executed_tools: execution.executedTools,
          tool_statuses: execution.toolStatuses,
          runtime_result: execution.runtimeResult,
          runtime_status: execution.gateBlocked
            ? "blocked"
            : execution.verifierStatus === "failed"
              ? "failed"
              : "completed"
        });

        await persistJudgmentMemoryWrites(
          rootDir,
          input.actorId,
          judgmentResult.judgment,
          planner.intent,
          execution.executedTools
        );
        await bumpLifeGoalCounters(rootDir, input.actorId, { actions: 1 });

        if (execution.verifierStatus === "passed" || execution.verifierStatus === "failed") {
          break;
        }
      }

      if (providerFailed) {
        break;
      }

      report.cycles.push({
        cycle_id: cycleId,
        cycle_goal_ref: cycleGoalRef,
        action_intent_ref: lastIntentRef,
        provider_input_refs: [
          path.relative(paths.actorDir, goalMind.inputRef),
          ...actionAttempts.flatMap((attempt) => attempt.provider_input_refs)
        ].filter(Boolean),
        provider_output_refs: [
          path.relative(paths.actorDir, goalMind.outputRef),
          ...actionAttempts.flatMap((attempt) => attempt.provider_output_refs)
        ].filter(Boolean),
        evidence_refs: actionAttempts.flatMap((attempt) => attempt.evidence_refs),
        judgment_ref: lastJudgmentRef,
        verifier_status: lastVerifier,
        action_attempts: actionAttempts
      } satisfies SocialCycleReportCycleWithAttempts);

      previousCycleJudgment = lastJudgment;
      await bumpLifeGoalCounters(rootDir, input.actorId, { cycles: 1 });
      report.action_skill_execution_unit = actionSkillExecutionUnit;

      // Long runs flush after each cycle so partial progress stays reviewable on failure.
      await writeJson(input.reportPath, report);
    }
  } finally {
    if (bot) {
      await closeBots({ [input.actorId]: bot });
    }
    if (stopServer) {
      await stopServer();
    }
  }

  report.agency_status.gameplay_progress_verified = anyMeaningfulProgress;
  report.runtime_status = finalizeRuntimeStatus(report, {
    providerFailed,
    anyMeaningfulProgress,
    completedCycles: report.cycles.length,
    expectedCycles: input.cycles,
    fixtureDependency: report.agency_status.fixture_dependency
  });

  if (providerFailed) {
    report.runtime_status = "failed";
  }

  await writeJson(input.reportPath, report);
  return { report, reportPath: input.reportPath };
}
