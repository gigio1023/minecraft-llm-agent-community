import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { loadProbeConfig, type ProbeConfig } from "../config.js";
import { assignSeedActionSkillOwnership } from "../skills/ownership.js";
import { closeBots, createBots, type ProbeBots } from "../runtime/createBots.js";
import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "../runtime/actorWorkspace.js";
import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../runtime/actorWorkspacePaths.js";
import { ensureActorSoul, soulRef } from "../runtime/goals/actorSoulStore.js";
import { ensureActiveLifeGoal } from "../runtime/goals/lifeGoalStore.js";
import { writeCycleGoal } from "../runtime/goals/cycleGoalStore.js";
import { listStrategicGoals } from "../runtime/goals/strategicGoalStore.js";
import {
  assembleSocialCycleContext,
  type SocialCycleContextPacket
} from "../runtime/goals/cycleContextAssembler.js";
import type { ActorCycleGoal, SocialCycleProviderId } from "../runtime/goals/types.js";
import {
  buildActiveEpisodeFromCycleGoal,
  buildActorTurnInput,
  type ActorTurnResolvedAction
} from "../runtime/goals/actorEpisode/index.js";
import {
  compileSocialAllowedPrimitives,
  filterExecutableSocialActionSkills,
  observeActorWorld
} from "../runtime/socialCycleExecution.js";
import { deriveRuntimeRetryConstraints, type RuntimeRetryAttempt } from "../runtime/retryConstraints.js";
import { resolveServerEndpoint, type ServerEndpoint } from "../runtime/socialCycleRunner.js";
import { runSocialCycleTurnCore } from "../runtime/socialCycleTurnCore.js";
import type { ActorActionSkillRecord } from "../runtime/actorWorkspaceStore.js";
import { getActorProfile } from "../npc/profiles.js";
import {
  computeReadyPlanBeads,
  loadPlanBeadGraphSnapshot
} from "../runtime/goals/planBeads/index.js";
import { runSharedSessionSchedule } from "./sharedSessionScheduler.js";
import type {
  ActorProviderRoute,
  ActorTurnSlotCompletionEvent,
  LegibilitySessionArtifact
} from "./types.js";

export type LiveSharedLegibilitySessionResult = {
  outputDir: string;
  sessionPath: string;
  session: LegibilitySessionArtifact;
};

type ActorRuntimeState = {
  soul: Awaited<ReturnType<typeof ensureActorSoul>>;
  lifeGoal: Awaited<ReturnType<typeof ensureActiveLifeGoal>>;
  activeActionSkills: ActorActionSkillRecord[];
  allowedPrimitiveIds: string[];
  retryAttempts: RuntimeRetryAttempt[];
};

const PROVIDER_FREE_LIVE_ROUTE_IDS: ReadonlySet<SocialCycleProviderId> = new Set([
  "deterministic-social",
  "scripted-social"
]);

export function defaultLiveSharedActorRoutes(): ActorProviderRoute[] {
  return [
    {
      actor_id: "npc_a",
      provider_id: "deterministic-social",
      model: "deterministic-social"
    },
    {
      actor_id: "npc_b",
      provider_id: "scripted-social",
      model: "scripted-social"
    }
  ];
}

export function assertProviderFreeLiveRoutes(routes: readonly ActorProviderRoute[]) {
  const blocked = routes.filter((route) => !PROVIDER_FREE_LIVE_ROUTE_IDS.has(route.provider_id));
  if (blocked.length > 0) {
    throw new Error(
      `Live legibility Phase A is provider-free; blocked provider routes: ${
        blocked.map((route) => `${route.actor_id}:${route.provider_id}`).join(", ")
      }`
    );
  }
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

function outputRelative(outputDir: string, filePath: string) {
  return path.relative(outputDir, filePath);
}

function actorWorkspaceRef(actorId: string, ref: string) {
  return path.join("actor-workspaces", actorId, ref);
}

function refToOutputPath(outputDir: string, ref: string) {
  return path.isAbsolute(ref) ? ref : path.join(outputDir, ref);
}

export async function assertLiveSessionEvidenceRefsResolve(input: {
  outputDir: string;
  slotEvents: readonly ActorTurnSlotCompletionEvent[];
}) {
  const refs = input.slotEvents.flatMap((event) => [
    ...(event.action_ref ? [event.action_ref] : []),
    ...event.evidence_refs
  ]);
  const missing: string[] = [];
  for (const ref of refs) {
    try {
      await fs.stat(refToOutputPath(input.outputDir, ref));
    } catch {
      missing.push(ref);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Live shared-session slot events contain missing evidence refs: ${missing.join(", ")}`);
  }
}

function filterActionSkillsForAllowedPrimitives(
  records: readonly ActorActionSkillRecord[],
  allowedPrimitives: readonly string[]
) {
  const allowedPrimitiveSet = new Set(allowedPrimitives);
  return records.filter((record) =>
    record.required_primitives.every((primitive) => allowedPrimitiveSet.has(primitive))
  );
}

function buildProviderFreeCycleGoal(input: {
  actorId: string;
  cycleId: string;
  lifeGoalId: string;
  allowedActionSkillIds: readonly string[];
  allowedPrimitiveIds: readonly string[];
}): ActorCycleGoal {
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: input.actorId,
    goal_id: `cycle-goal-${randomUUID()}`,
    life_goal_id: input.lifeGoalId,
    cycle_id: input.cycleId,
    status: "active",
    source: "runtime_rule",
    summary: "Complete one provider-free live shared-session legibility slot.",
    rationale:
      "C2-1 live substrate smoke fixes the session wiring while preserving Actor Turn choice and runtime-owned execution evidence.",
    derived_from: {
      soul_ref: soulRef(input.actorId),
      observation_refs: [],
      world_event_refs: [],
      memory_refs: [],
      relationship_refs: [],
      previous_cycle_judgment_refs: []
    },
    success_condition: {
      verifier: "live_shared_session_slot_evidence",
      evidence_required: [
        "Actor Turn provider selection artifact",
        "runtime execution evidence refs",
        "slot completion event with provider route metadata"
      ]
    },
    allowed_action_skill_ids: [...input.allowedActionSkillIds],
    allowed_primitive_ids: [...input.allowedPrimitiveIds],
    stop_conditions: [
      "slot completed with runtime evidence",
      "provider-free route failed",
      "runtime gate blocked execution",
      "environment setup failed"
    ]
  };
}

function actionKindFor(action: ActorTurnResolvedAction) {
  if (action.kind === "use_primitive") {
    return action.primitive_id;
  }
  if (action.kind === "use_action_skill") {
    return action.action_skill_id;
  }
  return action.kind;
}

function defaultPrimitiveForRoute(route: ActorProviderRoute) {
  return route.provider_id === "deterministic-social" ? "observe" : undefined;
}

function targetActorIdFor(input: {
  actorId: string;
  actorIds: readonly string[];
}) {
  return input.actorIds.find((actorId) => actorId !== input.actorId);
}

async function initializeActorRuntimeState(input: {
  actorWorkspaceRootDir: string;
  actorRoutes: readonly ActorProviderRoute[];
}) {
  const actorIds = input.actorRoutes.map((route) => route.actor_id);
  const roles = Object.fromEntries(
    actorIds.map((actorId) => [actorId, getActorProfile(actorId).gameplay_role])
  );
  await initializeActorWorkspaces({
    rootDir: input.actorWorkspaceRootDir,
    actors: actorIds.map((actorId) => ({
      actor_id: actorId,
      username: actorId,
      role_id: roles[actorId] ?? "gatherer"
    })),
    seedActionSkillOwnership: assignSeedActionSkillOwnership(actorIds, roles)
  });

  const states = new Map<string, ActorRuntimeState>();
  for (const actorId of actorIds) {
    const soul = await ensureActorSoul(input.actorWorkspaceRootDir, actorId);
    const lifeGoal = await ensureActiveLifeGoal(input.actorWorkspaceRootDir, actorId, soul);
    const allowedPrimitiveIds = compileSocialAllowedPrimitives(roles[actorId] ?? "gatherer");
    const activeSkills = await listActiveActorActionSkillRecords(input.actorWorkspaceRootDir, actorId);
    const activeActionSkills = filterActionSkillsForAllowedPrimitives(
      filterExecutableSocialActionSkills(activeSkills),
      allowedPrimitiveIds
    );
    states.set(actorId, {
      soul,
      lifeGoal,
      activeActionSkills,
      allowedPrimitiveIds,
      retryAttempts: []
    });
  }
  return states;
}

async function buildActorTurnContext(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  slotIndex: number;
  bots: ProbeBots;
  actorIds: readonly string[];
  state: ActorRuntimeState;
  maxActionsPerCycle: number;
}) {
  const targetActorId = targetActorIdFor({ actorId: input.actorId, actorIds: input.actorIds });
  const observation = await observeActorWorld({
    actorId: input.actorId,
    bot: input.bots[input.actorId],
    ...(targetActorId ? { targetBot: input.bots[targetActorId] } : {})
  });
  const strategicGoals = await listStrategicGoals(input.actorWorkspaceRootDir, input.actorId);
  const planBeadGraph = await loadPlanBeadGraphSnapshot(input.actorWorkspaceRootDir, input.actorId);
  const planBeadPacket = computeReadyPlanBeads({
    beads: planBeadGraph.beads,
    dependencies: planBeadGraph.dependencies,
    lifeGoalId: input.state.lifeGoal.goal_id,
    nowIso: new Date().toISOString(),
    maxReady: 3
  });

  return assembleSocialCycleContext({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    soul: input.state.soul,
    lifeGoal: input.state.lifeGoal,
    strategicGoals,
    worldEvents: [],
    previousJudgments: [],
    activeActionSkills: input.state.activeActionSkills,
    observation,
    allowedPrimitiveIds: input.state.allowedPrimitiveIds,
    maxActionsPerCycle: input.maxActionsPerCycle,
    cycleIndex: input.slotIndex - 1,
    runtimeRetryConstraints: deriveRuntimeRetryConstraints({
      actorId: input.actorId,
      attempts: input.state.retryAttempts
    }),
    planBeadPacket
  });
}

async function writeEnvironmentBlocker(input: {
  outputDir: string;
  sessionId: string;
  error: unknown;
}) {
  await writeJson(path.join(input.outputDir, "environment-blocker.json"), {
    schema: "legibility-live-session-environment-blocker/v1",
    session_id: input.sessionId,
    status: "environment_blocked",
    error: input.error instanceof Error ? input.error.message : String(input.error),
    recorded_at: new Date().toISOString()
  });
}

export async function runLiveSharedLegibilitySession(input: {
  outputDir: string;
  actorRoutes?: readonly ActorProviderRoute[];
  slotsPerActor?: number;
  cleanOutputDir?: boolean;
  writtenAt?: string;
  worldSeed?: string;
}): Promise<LiveSharedLegibilitySessionResult> {
  const outputDir = input.outputDir;
  if (input.cleanOutputDir ?? true) {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
  await fs.mkdir(outputDir, { recursive: true });

  const actorRoutes = input.actorRoutes ?? defaultLiveSharedActorRoutes();
  assertProviderFreeLiveRoutes(actorRoutes);
  const actorIds = actorRoutes.map((route) => route.actor_id);
  const sessionId = `c2-live-shared-session-${randomUUID()}`;
  const createdAt = input.writtenAt ?? new Date().toISOString();
  const actorWorkspaceRootDir = path.join(outputDir, "actor-workspaces");
  const loadedConfig = loadProbeConfig();
  const config: ProbeConfig = {
    ...loadedConfig,
    bots: actorIds,
    world: {
      ...loadedConfig.world,
      seed: input.worldSeed ?? loadedConfig.world.seed
    }
  };

  let server: ServerEndpoint | null = null;
  let bots: ProbeBots | null = null;
  try {
    const statesByActor = await initializeActorRuntimeState({
      actorWorkspaceRootDir,
      actorRoutes
    });
    server = await resolveServerEndpoint(config, { freshWorld: true });
    if (!server) {
      throw new Error("No joinable Minecraft endpoint for live shared legibility session");
    }
    bots = await createBots(config, server);

    const slotEvents = await runSharedSessionSchedule({
      session_id: sessionId,
      actorRoutes,
      slotsPerActor: input.slotsPerActor ?? 1,
      turnHandler: async ({ actor_id, route, turn_id, cycle_id, slot_index }) => {
        const state = statesByActor.get(actor_id);
        if (!state) {
          throw new Error(`Missing actor runtime state for ${actor_id}`);
        }
        const context: SocialCycleContextPacket = await buildActorTurnContext({
          actorWorkspaceRootDir,
          actorId: actor_id,
          cycleId: cycle_id,
          slotIndex: slot_index,
          bots: bots!,
          actorIds,
          state,
          maxActionsPerCycle: 1
        });
        const cycleGoal = buildProviderFreeCycleGoal({
          actorId: actor_id,
          cycleId: cycle_id,
          lifeGoalId: state.lifeGoal.goal_id,
          allowedActionSkillIds: state.activeActionSkills.map((skill) => skill.skill_id),
          allowedPrimitiveIds: state.allowedPrimitiveIds
        });
        const writtenCycleGoal = await writeCycleGoal(actorWorkspaceRootDir, actor_id, cycleGoal);
        const activeEpisode = buildActiveEpisodeFromCycleGoal({
          episodeId: `episode-${turn_id}`,
          context,
          cycleGoal,
          selectedPlanBeadRefs: [],
          startedAtTurnRef: turn_id
        });
        const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
          turnId: turn_id,
          context,
          activeEpisode,
          currentObservationRefs: cycleGoal.derived_from.observation_refs,
          recentEvidenceTrace: [],
          providerBudgetHint: {
            provider_id: route.provider_id,
            model: route.model,
            status: "ok"
          }
        });
        const startedAt = new Date().toISOString();
        const targetActorId = targetActorIdFor({ actorId: actor_id, actorIds });
        const turnCore = await runSocialCycleTurnCore({
          providerId: route.provider_id,
          actorWorkspaceRootDir,
          actorDir: getActorWorkspacePaths(actorWorkspaceRootDir, actor_id).actorDir,
          actorId: actor_id,
          runId: sessionId,
          cycleId: cycle_id,
          turnId: turn_id,
          actionIndex: 0,
          cycleGoal,
          cycleGoalId: cycleGoal.goal_id,
          activeEpisodeId: activeEpisode.episode_id,
          actorTurnInput,
          actionCardProjection,
          activeActionSkills: state.activeActionSkills,
          runtimeRetryConstraints: deriveRuntimeRetryConstraints({
            actorId: actor_id,
            attempts: state.retryAttempts
          }),
          defaultPrimitive: defaultPrimitiveForRoute(route),
          bot: bots![actor_id],
          ...(targetActorId ? { targetBot: bots![targetActorId] } : {})
        });
        if (turnCore.status !== "completed") {
          throw new Error(`Live shared-session turn ${turn_id} did not complete: ${turnCore.status}`);
        }
        if (turnCore.retryAttempt) {
          state.retryAttempts.push(turnCore.retryAttempt);
        }
        const completedAt = new Date().toISOString();
        const evidenceRefs = turnCore.execution.evidenceRefs.map((ref) => actorWorkspaceRef(actor_id, ref));
        return {
          action_kind: actionKindFor(turnCore.plannedRuntimeAction),
          action_ref: actorWorkspaceRef(actor_id, turnCore.plannedActionRef),
          evidence_refs: [
            outputRelative(outputDir, path.join(actorWorkspaceRootDir, actor_id, writtenCycleGoal.ref)),
            ...evidenceRefs
          ],
          started_at: startedAt,
          completed_at: completedAt
        };
      }
    });

    await assertLiveSessionEvidenceRefsResolve({ outputDir, slotEvents });

    const session: LegibilitySessionArtifact = {
      schema: "legibility-session/v1",
      session_id: sessionId,
      created_at: createdAt,
      actor_routes: [...actorRoutes],
      slot_events: slotEvents,
      chat_events: [],
      response_windows: [],
      transition_rows: []
    };
    const sessionPath = await writeJson(path.join(outputDir, "session.json"), session);
    return { outputDir, sessionPath, session };
  } catch (error) {
    await writeEnvironmentBlocker({ outputDir, sessionId, error });
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
