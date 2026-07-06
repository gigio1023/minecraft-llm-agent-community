import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Bot } from "mineflayer";

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
import { ResponseWindowTracker } from "./responseWindows.js";
import {
  labelMaterialAccessFromEvidence,
  labelSocialResponseFromWindow,
  type MaterialAccessEvidenceEvent
} from "./evidenceLabeler.js";
import type {
  ActorProviderRoute,
  ActorTurnSlotCompletionEvent,
  LegibilitySessionArtifact,
  StructuredChatEvent,
  TransitionRowV1
} from "./types.js";

export type LiveSharedLegibilitySessionResult = {
  outputDir: string;
  sessionPath: string;
  session: LegibilitySessionArtifact;
};

export type LiveSharedDefaultPrimitiveMap = Record<string, string>;

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
const LIVE_CHAT_OBSERVATION_RADIUS_BLOCKS = 32;
const LIVE_CHAT_DUPLICATE_WINDOW_MS = 500;
const LIVE_CHAT_SETTLE_MS = 200;
const LIVE_RESPONSE_WINDOW_TIMEOUT_AFTER_SLOTS = 2;
const NON_FOCAL_RESPONSE_WINDOW_ACTION_KINDS = new Set(["observe", "wait"]);

export function defaultLiveSharedActorRoutes(): ActorProviderRoute[] {
  return [
    {
      actor_id: "npc_a",
      provider_id: "deterministic-social",
      model: "deterministic-social",
      condition: "scripted_responder",
      condition_id: "c2-live-provider-free-scripted-responder",
      actor_soul_route: "not_applicable",
      seed_or_reset_id: "c2-live-provider-free-scripted-responder"
    },
    {
      actor_id: "npc_b",
      provider_id: "scripted-social",
      model: "scripted-social",
      condition: "scripted_responder",
      condition_id: "c2-live-provider-free-scripted-responder",
      actor_soul_route: "not_applicable",
      seed_or_reset_id: "c2-live-provider-free-scripted-responder"
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

export function isLiveResponseWindowFocalTurn(event: ActorTurnSlotCompletionEvent) {
  return !NON_FOCAL_RESPONSE_WINDOW_ACTION_KINDS.has(event.action_kind);
}

export type LiveChatActorRangeState = {
  actor_id: string;
  connected: boolean;
  position: { x: number; y: number; z: number } | null;
};

function roundPosition(position: { x: number; y: number; z: number }) {
  return {
    x: Number(position.x.toFixed(2)),
    y: Number(position.y.toFixed(2)),
    z: Number(position.z.toFixed(2))
  };
}

function botPosition(bot: Bot | undefined) {
  const position = bot?.entity?.position;
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number" ||
    typeof position.z !== "number"
  ) {
    return null;
  }
  return roundPosition(position);
}

export function liveActorRangeStateFromBots(input: {
  actorIds: readonly string[];
  bots: ProbeBots;
}): LiveChatActorRangeState[] {
  return input.actorIds.map((actorId) => {
    const position = botPosition(input.bots[actorId]);
    return {
      actor_id: actorId,
      connected: Boolean(position),
      position
    };
  });
}

function distanceBetween(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number }
) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

export function computeLiveChatObservedBy(input: {
  speaker_id: string;
  roster: readonly LiveChatActorRangeState[];
  radiusBlocks?: number;
}): string[] {
  const radiusBlocks = input.radiusBlocks ?? LIVE_CHAT_OBSERVATION_RADIUS_BLOCKS;
  const speaker = input.roster.find((actor) => actor.actor_id === input.speaker_id);
  if (!speaker?.connected || !speaker.position) {
    return [];
  }
  const speakerPosition = speaker.position;
  return input.roster
    .flatMap((actor) => {
      if (
        actor.actor_id === input.speaker_id ||
        !actor.connected ||
        !actor.position ||
        distanceBetween(speakerPosition, actor.position) > radiusBlocks
      ) {
        return [];
      }
      return [actor.actor_id];
    })
    .sort();
}

export function chatEventsForActor(
  events: readonly StructuredChatEvent[],
  actorId: string
): StructuredChatEvent[] {
  return events.filter((event) => event.observed_by.includes(actorId));
}

function botTick(bot: Bot | undefined) {
  return typeof bot?.time?.age === "number" ? bot.time.age : undefined;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createLiveMineflayerChatCapture(input: {
  sessionId: string;
  outputDir: string;
  actorIds: readonly string[];
  bots: ProbeBots;
}) {
  const actorIdSet = new Set(input.actorIds);
  const events: StructuredChatEvent[] = [];
  const pendingWrites: Promise<unknown>[] = [];
  const writeErrors: string[] = [];
  const recentEventMsByKey = new Map<string, number>();
  const listeners: Array<{ bot: Bot; listener: (...args: unknown[]) => void }> = [];
  let activeSlotIndex = 0;
  let sequence = 0;

  const recordChat = (username: string, message: string) => {
    const speakerId = username.trim();
    const text = message.trim();
    if (!actorIdSet.has(speakerId) || text.length === 0) {
      return;
    }

    const nowMs = Date.now();
    const duplicateKey = `${speakerId}\u0000${text}`;
    const previousMs = recentEventMsByKey.get(duplicateKey);
    if (previousMs !== undefined && nowMs - previousMs < LIVE_CHAT_DUPLICATE_WINDOW_MS) {
      return;
    }
    recentEventMsByKey.set(duplicateKey, nowMs);

    const roster = liveActorRangeStateFromBots({
      actorIds: input.actorIds,
      bots: input.bots
    });
    const observedBy = computeLiveChatObservedBy({
      speaker_id: speakerId,
      roster,
      radiusBlocks: LIVE_CHAT_OBSERVATION_RADIUS_BLOCKS
    });
    const tick = botTick(input.bots[speakerId]);
    const position = botPosition(input.bots[speakerId]);
    const eventRef = path.join(
      "chat-events",
      `${String(++sequence).padStart(4, "0")}-${sanitizeWorkspaceFileId(speakerId)}.json`
    );
    const event: StructuredChatEvent = {
      schema: "structured-chat-event/v1",
      session_id: input.sessionId,
      speaker_id: speakerId,
      message: text,
      observed_by: observedBy,
      slot_index: activeSlotIndex,
      observed_at: new Date(nowMs).toISOString(),
      ...(tick !== undefined ? { tick } : {}),
      ...(position ? { position } : {}),
      evidence_refs: [eventRef]
    };
    events.push(event);
    pendingWrites.push(
      writeJson(path.join(input.outputDir, eventRef), {
        ...event,
        observation_policy: {
          schema: "live-chat-observation-range-policy/v1",
          radius_blocks: LIVE_CHAT_OBSERVATION_RADIUS_BLOCKS,
          roster_state: roster
        }
      }).catch((error: unknown) => {
        writeErrors.push(error instanceof Error ? error.message : String(error));
      })
    );
  };

  for (const bot of Object.values(input.bots)) {
    const listener = (...args: unknown[]) => {
      const [username, message] = args;
      if (typeof username === "string" && typeof message === "string") {
        recordChat(username, message);
      }
    };
    bot.on("chat", listener);
    listeners.push({ bot, listener });
  }

  return {
    events,
    setActiveSlot(slotIndex: number) {
      activeSlotIndex = slotIndex;
    },
    eventsForActor(actorId: string) {
      return chatEventsForActor(events, actorId);
    },
    async settle() {
      await delay(LIVE_CHAT_SETTLE_MS);
    },
    async flush() {
      await Promise.all(pendingWrites);
      if (writeErrors.length > 0) {
        throw new Error(`Failed to write live chat event evidence: ${writeErrors.join("; ")}`);
      }
    },
    dispose() {
      for (const { bot, listener } of listeners) {
        bot.off("chat", listener);
      }
    }
  };
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

function defaultPrimitiveForRoute(
  route: ActorProviderRoute,
  defaultPrimitivesByActor?: LiveSharedDefaultPrimitiveMap
) {
  const explicit = defaultPrimitivesByActor?.[route.actor_id]?.trim();
  if (explicit) {
    return explicit;
  }
  return route.provider_id === "deterministic-social" ? "observe" : undefined;
}

function targetActorIdFor(input: {
  actorId: string;
  actorIds: readonly string[];
}) {
  return input.actorIds.find((actorId) => actorId !== input.actorId);
}

function visibleActorIdsFromObservation(observation: unknown) {
  if (!observation || typeof observation !== "object") {
    return [];
  }
  const visibleActors = (observation as { visibleActors?: unknown }).visibleActors;
  if (!Array.isArray(visibleActors)) {
    return [];
  }
  return visibleActors
    .map((actor) =>
      actor &&
      typeof actor === "object" &&
      typeof (actor as { id?: unknown }).id === "string"
        ? (actor as { id: string }).id
        : null
    )
    .filter((actorId): actorId is string => Boolean(actorId))
    .sort();
}

function loadedWorldCaveatFromObservation(observation: unknown) {
  if (!observation || typeof observation !== "object") {
    return "Live C2-3 row: state-before observation was not available as a structured object.";
  }
  const loadedWorldScope = (observation as { loadedWorldScope?: unknown }).loadedWorldScope;
  if (
    loadedWorldScope &&
    typeof loadedWorldScope === "object" &&
    typeof (loadedWorldScope as { caveat?: unknown }).caveat === "string"
  ) {
    return (loadedWorldScope as { caveat: string }).caveat;
  }
  return "Live C2-3 row: loaded-world absence claims are scoped to Mineflayer observation limits.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(value: unknown, key: string) {
  return isRecord(value) && typeof value[key] === "string" ? value[key] : undefined;
}

function numberField(value: unknown, key: string) {
  return isRecord(value) && typeof value[key] === "number" && Number.isFinite(value[key])
    ? value[key]
    : undefined;
}

function classesForMaterialToolResult(input: {
  tool: string;
  status: string;
  result: unknown;
}): MaterialAccessEvidenceEvent["classes"] {
  const inventoryDelta = numberField(input.result, "inventoryDelta");
  const movedCount = numberField(input.result, "movedCount");
  if (
    ["collect_logs", "craft_item", "craft_with_table", "consume_item"].includes(input.tool) &&
    inventoryDelta !== undefined &&
    inventoryDelta > 0
  ) {
    return ["inventory_gain"];
  }
  if (
    ["place_block", "consume_item"].includes(input.tool) &&
    inventoryDelta !== undefined &&
    inventoryDelta < 0
  ) {
    return ["inventory_loss"];
  }
  if (input.tool === "deposit_shared" && input.status === "deposited" && (movedCount ?? 0) > 0) {
    return ["container_gain", "inventory_loss"];
  }
  if (input.tool === "withdraw_shared" && input.status === "withdrew" && (movedCount ?? 0) > 0) {
    return ["container_loss", "inventory_gain"];
  }
  return [];
}

async function materialEvidenceFromTurn(input: {
  outputDir: string;
  sessionId: string;
  actorId: string;
  turnId: string;
  toolResults: readonly {
    tool: string;
    status: string;
    result: unknown;
    evidence_ref?: string;
  }[];
}) {
  const events: MaterialAccessEvidenceEvent[] = [];
  for (const [index, toolResult] of input.toolResults.entries()) {
    const classes = classesForMaterialToolResult(toolResult);
    if (classes.length === 0 || !toolResult.evidence_ref) {
      continue;
    }
    const materialRef = path.join(
      "material-evidence",
      `${sanitizeWorkspaceFileId(input.turnId)}-${String(index + 1).padStart(2, "0")}-${sanitizeWorkspaceFileId(toolResult.tool)}.json`
    );
    const event = {
      schema: "material-access-evidence/v1" as const,
      event_kind: toolResult.tool === "deposit_shared" || toolResult.tool === "withdraw_shared"
        ? "container_delta" as const
        : "inventory_delta" as const,
      classes,
      evidence_refs: [
        materialRef,
        actorWorkspaceRef(input.actorId, toolResult.evidence_ref)
      ]
    };
    await writeJson(path.join(input.outputDir, materialRef), {
      ...event,
      session_id: input.sessionId,
      actor_id: input.actorId,
      turn_id: input.turnId,
      tool: toolResult.tool,
      status: toolResult.status,
      runtime_status: stringField(toolResult.result, "status"),
      runtime_evidence_ref: actorWorkspaceRef(input.actorId, toolResult.evidence_ref),
      label_source_policy: {
        schema: "material-access-label-source-policy/v1",
        source: "typed_social_cycle_tool_result",
        chat_text_used_for_material_label: false
      }
    });
    events.push(event);
  }
  return events;
}

function requireRouteForClosedWindow(input: {
  actorRoutes: readonly ActorProviderRoute[];
  event: ActorTurnSlotCompletionEvent;
}) {
  const route = input.actorRoutes.find((candidate) => candidate.actor_id === input.event.actor_id);
  if (!route) {
    throw new Error(`Missing provider route for closed response-window actor ${input.event.actor_id}`);
  }
  if (!route.condition) {
    throw new Error(`Provider route for actor ${input.event.actor_id} has no condition metadata`);
  }
  if (!route.seed_or_reset_id) {
    throw new Error(`Provider route for actor ${input.event.actor_id} has no seed/reset metadata`);
  }
  return route as ActorProviderRoute & {
    condition: NonNullable<ActorProviderRoute["condition"]>;
    seed_or_reset_id: string;
  };
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
  otherBots: readonly Bot[];
  chatEvents: readonly StructuredChatEvent[];
  state: ActorRuntimeState;
  maxActionsPerCycle: number;
}) {
  const targetActorId = targetActorIdFor({ actorId: input.actorId, actorIds: input.actorIds });
  const observation = await observeActorWorld({
    actorId: input.actorId,
    bot: input.bots[input.actorId],
    ...(targetActorId ? { targetBot: input.bots[targetActorId] } : {}),
    otherBots: input.otherBots,
    chatEvents: input.chatEvents
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
  responseWindowTimeoutAfterSlots?: number;
  defaultPrimitivesByActor?: LiveSharedDefaultPrimitiveMap;
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
  const responseTracker = new ResponseWindowTracker({
    sessionId,
    activeActorIds: actorIds,
    timeoutAfterSlots: input.responseWindowTimeoutAfterSlots ?? LIVE_RESPONSE_WINDOW_TIMEOUT_AFTER_SLOTS
  });
  const pendingByWindow = new Map<string, ActorTurnSlotCompletionEvent>();
  const stateBeforeRefsByTurn = new Map<string, string>();
  const visibleActorIdsByTurn = new Map<string, string[]>();
  const loadedWorldCaveatByTurn = new Map<string, string>();
  const materialEvidenceByTurn = new Map<string, MaterialAccessEvidenceEvent[]>();
  const rows: TransitionRowV1[] = [];
  let chatEventCursor = 0;
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
  let chatCapture: ReturnType<typeof createLiveMineflayerChatCapture> | null = null;
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
    chatCapture = createLiveMineflayerChatCapture({
      sessionId,
      outputDir,
      actorIds,
      bots
    });

    const slotEvents = await runSharedSessionSchedule({
      session_id: sessionId,
      actorRoutes,
      slotsPerActor: input.slotsPerActor ?? 1,
      onSlotCompleted: async (event) => {
        for (const chatEvent of chatCapture!.events.slice(chatEventCursor)) {
          responseTracker.recordChatEvent(chatEvent);
        }
        chatEventCursor = chatCapture!.events.length;

        const timedOut = responseTracker.closeTimedOut(event.slot_index, event.completed_at);
        const closedBySlotCompletion = responseTracker.recordSlotCompletion(event);
        for (const window of [...timedOut, ...closedBySlotCompletion]) {
          const focalEvent = pendingByWindow.get(window.window_id);
          if (!focalEvent) {
            continue;
          }
          const route = requireRouteForClosedWindow({ actorRoutes, event: focalEvent });
          const stateBeforeRef = stateBeforeRefsByTurn.get(focalEvent.turn_id);
          if (!stateBeforeRef) {
            throw new Error(`Missing state-before ref for closed response window ${window.window_id}`);
          }
          const closeReason = window.close_reason;
          if (!closeReason) {
            throw new Error(`Closed response window ${window.window_id} has no close reason`);
          }
          const socialLabelDecision = labelSocialResponseFromWindow(window);
          const materialLabelDecision = labelMaterialAccessFromEvidence({
            materialEvidence: materialEvidenceByTurn.get(focalEvent.turn_id) ?? [],
            fallbackEvidenceRefs: focalEvent.evidence_refs
          });
          const row: TransitionRowV1 = {
            schema_version: "transition-row/v1",
            row_id: `${window.window_id}-row`,
            session_id: sessionId,
            seed_or_reset_id: route.seed_or_reset_id,
            cycle_index: rows.length + 1,
            actor_id: focalEvent.actor_id,
            condition: route.condition,
            timestamps: {
              action_selected_at: focalEvent.started_at,
              action_started_at: focalEvent.started_at,
              action_finished_at: focalEvent.completed_at,
              response_window_closed_at: window.closed_at,
              label_locked_at: window.closed_at
            },
            state_before: {
              snapshot_ref: stateBeforeRef,
              other_actors: {
                visible_actor_ids: visibleActorIdsByTurn.get(focalEvent.turn_id) ?? [],
                interaction_range_actor_ids: visibleActorIdsByTurn.get(focalEvent.turn_id) ?? [],
                loaded_world_caveat: loadedWorldCaveatByTurn.get(focalEvent.turn_id) ??
                  "Live C2-3 row: loaded-world absence claims are scoped to Mineflayer observation limits."
              },
              social_context_refs: {
                recent_interaction_refs: focalEvent.evidence_refs
              }
            },
            executed_action: {
              action_kind: focalEvent.action_kind,
              ...(focalEvent.action_ref ? { action_card_id: focalEvent.action_ref } : {}),
              runtime_action_id: focalEvent.turn_id,
              validation_status: "passed",
              permission_status: "passed",
              action_started: true
            },
            observed_delta: {
              physical: {
                classes: focalEvent.action_kind === "say" ? ["no_physical_delta"] : ["unknown_physical_delta"],
                evidence_refs: focalEvent.evidence_refs
              },
              material: {
                classes: materialLabelDecision.classes,
                evidence_refs: materialLabelDecision.evidence_refs
              },
              social_response: {
                response_window: window,
                classes: socialLabelDecision.classes,
                evidence_refs: socialLabelDecision.evidence_refs
              },
              exclusions: []
            },
            row_quality: {
              verdict: "partial",
              inclusion_tags: [
                "live_response_window_closed",
                closeReason,
                ...(socialLabelDecision.classes.includes("no_observable_response")
                  ? ["non_vacuous_absence_label"]
                  : ["response_observed_unclassified"])
              ],
              exclusion_reasons: [],
              notes: [
                "C2-4 evidence-grounded labeler applied; material remains unknown unless typed material evidence exists."
              ]
            },
            metadata: {
              provider: focalEvent.provider_id,
              model: focalEvent.model,
              scenario_family_id: "c2-live-shared-session-response-window",
              scenario_family_ids: ["c2-live-shared-session-response-window"],
              artifact_refs: Array.from(new Set([
                stateBeforeRef,
                ...(focalEvent.action_ref ? [focalEvent.action_ref] : []),
                ...focalEvent.evidence_refs,
                ...window.evidence_refs,
                ...materialLabelDecision.evidence_refs,
                ...socialLabelDecision.evidence_refs,
                ...(route.seed_reset_ref ? [route.seed_reset_ref] : [])
              ]))
            }
          };
          rows.push(row);
          await writeJson(path.join(outputDir, "transition-rows", `${row.row_id}.json`), row);
          pendingByWindow.delete(window.window_id);
        }

        if (isLiveResponseWindowFocalTurn(event)) {
          const openedWindow = responseTracker.open({
            focalActorId: event.actor_id,
            focalTurnId: event.turn_id,
            focalSlotIndex: event.slot_index,
            openedAt: event.completed_at,
            evidenceRefs: [
              ...(event.action_ref ? [event.action_ref] : []),
              ...event.evidence_refs
            ]
          });
          pendingByWindow.set(openedWindow.window_id, event);
        }
      },
      turnHandler: async ({ actor_id, route, turn_id, cycle_id, slot_index }) => {
        const state = statesByActor.get(actor_id);
        if (!state) {
          throw new Error(`Missing actor runtime state for ${actor_id}`);
        }
        const otherBots = actorIds
          .filter((otherActorId) => otherActorId !== actor_id)
          .map((otherActorId) => bots![otherActorId])
          .filter((bot): bot is Bot => Boolean(bot));
        const observedChatEvents = chatCapture!.eventsForActor(actor_id);
        const context: SocialCycleContextPacket = await buildActorTurnContext({
          actorWorkspaceRootDir,
          actorId: actor_id,
          cycleId: cycle_id,
          slotIndex: slot_index,
          bots: bots!,
          actorIds,
          otherBots,
          chatEvents: observedChatEvents,
          state,
          maxActionsPerCycle: 1
        });
        const stateBeforeRef = outputRelative(
          outputDir,
          await writeJson(path.join(outputDir, "state-before", `${turn_id}.json`), {
            schema: "live-shared-session-state-before/v1",
            session_id: sessionId,
            turn_id,
            cycle_id,
            slot_index,
            actor_id,
            visible_actor_ids: visibleActorIdsFromObservation(context.observation),
            observed_chat_event_refs: observedChatEvents.flatMap((event) => event.evidence_refs),
            loaded_world_caveat: loadedWorldCaveatFromObservation(context.observation),
            observation: context.observation
          })
        );
        stateBeforeRefsByTurn.set(turn_id, stateBeforeRef);
        visibleActorIdsByTurn.set(turn_id, visibleActorIdsFromObservation(context.observation));
        loadedWorldCaveatByTurn.set(turn_id, loadedWorldCaveatFromObservation(context.observation));
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
        const routeDefaultPrimitive = defaultPrimitiveForRoute(route, input.defaultPrimitivesByActor);
        const explicitDefaultPrimitive = input.defaultPrimitivesByActor?.[actor_id]?.trim();
        if (
          explicitDefaultPrimitive &&
          !state.allowedPrimitiveIds.includes(explicitDefaultPrimitive)
        ) {
          throw new Error(
            `Explicit live shared-session primitive ${explicitDefaultPrimitive} is not allowed for ${actor_id}`
          );
        }
        if (
          explicitDefaultPrimitive &&
          !actionCardProjection.runtime_mappings.some((mapping) =>
            mapping.kind === "use_primitive" && mapping.primitive_id === explicitDefaultPrimitive
          )
        ) {
          throw new Error(
            `Explicit live shared-session primitive ${explicitDefaultPrimitive} is not exposed as an Action Card for ${actor_id}`
          );
        }
        chatCapture!.setActiveSlot(slot_index);
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
          defaultPrimitive: routeDefaultPrimitive,
          bot: bots![actor_id],
          ...(targetActorId ? { targetBot: bots![targetActorId] } : {}),
          otherBots,
          chatEvents: observedChatEvents
        });
        await chatCapture!.settle();
        if (turnCore.status !== "completed") {
          throw new Error(`Live shared-session turn ${turn_id} did not complete: ${turnCore.status}`);
        }
        if (turnCore.retryAttempt) {
          state.retryAttempts.push(turnCore.retryAttempt);
        }
        materialEvidenceByTurn.set(turn_id, await materialEvidenceFromTurn({
          outputDir,
          sessionId,
          actorId: actor_id,
          turnId: turn_id,
          toolResults: turnCore.execution.toolResults
        }));
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
    await chatCapture.flush();

    const session: LegibilitySessionArtifact = {
      schema: "legibility-session/v1",
      session_id: sessionId,
      created_at: createdAt,
      actor_routes: [...actorRoutes],
      slot_events: slotEvents,
      chat_events: [...chatCapture.events],
      response_windows: responseTracker.all(),
      transition_rows: rows
    };
    const sessionPath = await writeJson(path.join(outputDir, "session.json"), session);
    return { outputDir, sessionPath, session };
  } catch (error) {
    await writeEnvironmentBlocker({ outputDir, sessionId, error });
    throw error;
  } finally {
    chatCapture?.dispose();
    if (bots) {
      await closeBots(bots);
    }
    if (server) {
      await server.stop();
    }
  }
}
