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
import type { SocialCycleProviderId, SocialCycleRunReport, WorldEvent, WorldEventKind } from "./goals/types.js";
import { createWorldEvent, listWorldEvents, writeWorldEvent } from "./goals/worldEventStore.js";
import { readCycleJudgmentByCycleId } from "./goals/cycleJudgmentStore.js";
import { runSocialGoalMindProvider } from "../provider/socialGoalMindProvider.js";
import { runSocialActionPlannerProvider } from "../provider/socialActionPlannerProvider.js";
import { runSocialCycleJudgmentProvider } from "../provider/socialCycleJudgmentProvider.js";
import type { OpenAiJsonProviderConfig } from "../provider/openaiApiJsonProvider.js";
import {
  compileSocialAllowedPrimitives,
  executeSocialActionIntent,
  observeActorWorld
} from "./socialCycleExecution.js";
import { writeJson } from "./actorWorkspaceStore.js";
import { writeActorMemoryRecords } from "../memory/actorMemory.js";
import { getActorProfile } from "../npc/profiles.js";
import { isMeaningfulProgressVerifier } from "./socialCycleProgress.js";
import { createBots, closeBots } from "./createBots.js";
import { ensureLiveSmokeServer } from "../server/liveSmokeServer.js";
import { readManualMinecraftPort } from "../server/manualMinecraftPort.js";

type ServerEndpoint = {
  host: string;
  port: number;
  stop: () => Promise<void>;
};

async function resolveServerEndpoint(config: ProbeConfig): Promise<ServerEndpoint | null> {
  const manualPort = readManualMinecraftPort();
  if (manualPort !== undefined) {
    return { host: "127.0.0.1", port: manualPort, stop: async () => {} };
  }

  const live = await ensureLiveSmokeServer(config);
  if (!live.host || !live.port) {
    return null;
  }

  return { host: live.host, port: live.port, stop: async () => {} };
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
};

export type SocialCycleRunResult = {
  report: SocialCycleRunReport;
  reportPath: string;
};

async function persistJudgmentMemoryWrites(
  rootDir: string,
  actorId: string,
  judgment: import("./goals/types.js").CycleJudgment
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
        item_names: [],
        block_names: [],
        tool_names: [],
        action_skill_ids: [],
        diagnoses: [],
        verifier_statuses: [judgment.verifier_status],
        causal_refs: [judgment.cycle_id]
      },
      content: { cycle_id: judgment.cycle_id, outcome: judgment.outcome }
    }))
  );
  return judgment.memory_writes.length;
}

export async function runSocialCycle(input: SocialCycleRunOptions): Promise<SocialCycleRunResult> {
  const config = loadProbeConfig();
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

  if (input.connectToWorld !== false) {
    try {
      const server = await resolveServerEndpoint(config);
      if (!server) {
        throw new Error("No joinable Minecraft endpoint");
      }
      stopServer = server.stop;
      const bots = await createBots({ ...config, bots: [input.actorId] }, server);
      bot = bots[input.actorId];
    } catch {
      report.agency_status.fixture_dependency = true;
    }
  } else {
    report.agency_status.fixture_dependency = true;
  }

  let providerFailed = false;
  let anyMeaningfulProgress = false;
  let previousCycleId: string | null = null;

  try {
    const activeSkills = await listActiveActorActionSkillRecords(rootDir, input.actorId);
    const allowedPrimitives = compileSocialAllowedPrimitives(profile.gameplay_role);
    const allowedSkillIds = activeSkills.map((s) => s.skill_id);

    for (let cycleIndex = 0; cycleIndex < input.cycles; cycleIndex++) {
      const cycleId = `cycle-${String(cycleIndex + 1).padStart(4, "0")}`;
      const worldEvents = await listWorldEvents(rootDir, input.actorId, { runId });
      const strategicGoals = await listStrategicGoals(rootDir, input.actorId);
      const prior =
        previousCycleId && cycleIndex > 0
          ? await readCycleJudgmentByCycleId(rootDir, input.actorId, previousCycleId)
          : null;
      const previousJudgments = prior ? [{ ref: prior.ref, judgment: prior.judgment }] : [];

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
        activeActionSkills: activeSkills,
        observation,
        allowedPrimitiveIds: allowedPrimitives,
        maxActionsPerCycle: input.maxActionsPerCycle,
        cycleIndex
      });

      report.agency_status.used_world_event_refs = worldEvents.length;
      report.agency_status.used_memory_refs = context.previous_cycle_judgments.length;

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
      let lastEvidenceRefs: string[] = [];
      let lastVerifier: "passed" | "failed" | "not_applicable" = "not_applicable";
      let actionSkillExecutionUnit = false;
      let lastPlannerInputRef = "";
      let lastPlannerOutputRef = "";
      let lastJudgmentInputRef = "";
      let lastJudgmentOutputRef = "";
      let lastJudgmentRef = "";

      for (let actionIndex = 0; actionIndex < input.maxActionsPerCycle; actionIndex++) {
        const planner = await runSocialActionPlannerProvider({
          providerId: input.providerId,
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          cycleGoal: goalMind.cycleGoal,
          context,
          openAi,
          defaultPrimitive: actionIndex === 0 ? "observe" : "wait"
        });

        if (!planner.ok) {
          providerFailed = true;
          report.provider_error = planner.error;
          break;
        }

        lastIntentRef = planner.intentRef;
        lastPlannerInputRef = planner.inputRef;
        lastPlannerOutputRef = planner.outputRef;

        const execution = await executeSocialActionIntent({
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          cycleGoal: goalMind.cycleGoal,
          intent: planner.intent,
          activeActionSkills: activeSkills,
          bot
        });

        lastEvidenceRefs = execution.evidenceRefs;
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
          cycleGoal: goalMind.cycleGoal,
          actionIntent: planner.intent,
          context,
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

        lastJudgmentInputRef = judgmentResult.inputRef;
        lastJudgmentOutputRef = judgmentResult.outputRef;
        lastJudgmentRef = judgmentResult.judgmentRef;

        await persistJudgmentMemoryWrites(rootDir, input.actorId, judgmentResult.judgment);
        await bumpLifeGoalCounters(rootDir, input.actorId, { actions: 1 });
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
          path.relative(paths.actorDir, lastPlannerInputRef),
          path.relative(paths.actorDir, lastJudgmentInputRef)
        ].filter(Boolean),
        provider_output_refs: [
          path.relative(paths.actorDir, goalMind.outputRef),
          path.relative(paths.actorDir, lastPlannerOutputRef),
          path.relative(paths.actorDir, lastJudgmentOutputRef)
        ].filter(Boolean),
        evidence_refs: lastEvidenceRefs,
        judgment_ref: lastJudgmentRef,
        verifier_status: lastVerifier
      });

      previousCycleId = cycleId;
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
