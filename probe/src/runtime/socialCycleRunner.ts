import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Bot } from "mineflayer";

import { loadProbeConfig, type ProbeConfig } from "../config.js";
import { assignSeedActionSkillOwnership } from "../skills/ownership.js";
import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "./actorWorkspace.js";
import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "./actorWorkspacePaths.js";
import { ensureActorSoul, soulRef } from "./goals/actorSoulStore.js";
import { bumpLifeGoalCounters, ensureActiveLifeGoal } from "./goals/lifeGoalStore.js";
import { writeCycleGoal } from "./goals/cycleGoalStore.js";
import { writeActorGoalArtifact } from "./goals/goalJsonStore.js";
import { listStrategicGoals } from "./goals/strategicGoalStore.js";
import {
  assembleSocialCycleContext,
  type SocialCycleContextPacket
} from "./goals/cycleContextAssembler.js";
import { createEmptySocialCycleReport, finalizeRuntimeStatus } from "./goals/cycleReport.js";
import type {
  ActorCycleGoal,
  CycleJudgment,
  SocialCycleProviderId,
  SocialCycleRunReport,
  WorldEventKind
} from "./goals/types.js";
import { createWorldEvent, listWorldEvents, writeWorldEvent } from "./goals/worldEventStore.js";
import { runSocialCycleGoalProvider } from "../provider/socialGoalMindProvider.js";
import {
  runSocialActorTurnProvider,
  type ActorTurnProviderResult
} from "../provider/socialActorTurnProvider.js";
import { runSocialDeliberationProvider } from "../provider/socialDeliberationProvider.js";
import type { OpenAiJsonProviderConfig } from "../provider/openaiApiJsonProvider.js";
import type { GeminiJsonProviderConfig } from "../provider/geminiApiJsonProvider.js";
import type { ModelScopeApiProviderConfig } from "../provider/modelscopeApiProvider.js";
import { summarizeProviderUsage } from "../provider/providerUsageTracker.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import {
  compileSocialAllowedPrimitives,
  executeActorTurnAction,
  filterExecutableSocialActionSkills,
  observeActorWorld
} from "./socialCycleExecution.js";
import {
  buildRuntimeRetryAttempt,
  deriveRuntimeRetryConstraints,
  type RuntimeRetryAttempt
} from "./retryConstraints.js";
import { writeJson, type ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import {
  listActorMemoryRefs,
  writeActorMemoryRecords,
  type ActorMemoryKind
} from "../memory/actorMemory.js";
import { getActorProfile } from "../npc/profiles.js";
import {
  isDurableProgressVerifier,
  isMovementOnlyVerifier,
  hasPartialVerifiedProgress,
  type SocialPrimitiveAttemptStatus
} from "./socialCycleProgress.js";
import { createBots, closeBots } from "./createBots.js";
import { ensureLiveSmokeServer } from "../server/liveSmokeServer.js";
import { readManualMinecraftPort } from "../server/manualMinecraftPort.js";
import { startDockerServer } from "../server/dockerServer.js";
import {
  applyWorldScenarioToConfig,
  buildWorldScenarioCommands,
  createWorldScenarioManifest,
  getWorldScenario,
  runWorldScenarioCommands,
  type WorldScenarioId,
  type WorldScenarioManifest
} from "../server/worldScenarios.js";
import {
  buildNaturalSpawnPlacementCommands,
  createNaturalSpawnValidation
} from "../server/naturalSpawnValidation.js";
import {
  buildSettlementState,
  type ActionSkillPostconditionResult,
  type ToolResultRecord
} from "./settlement/settlementState.js";
import { applyCycleJudgmentRelationshipEventProposals } from "../reviewer/relationshipProposalApplier.js";
import {
  applyPlanBeadOperations,
  computeReadyPlanBeads,
  derivePlanBeadLifecycleOperationsFromCurrentState,
  derivePlanBeadLifecycleOperationsFromTurnEvidence,
  loadPlanBeadGraphSnapshot,
  writePlanBeadReadyFrontSnapshot
} from "./goals/planBeads/index.js";
import {
  buildActiveEpisodeFromCycleGoal,
  buildCycleGoalFromActiveEpisode,
  buildActorTurnCurrentStateProjection,
  buildActorTurnInput,
  anchorActiveEpisodeToPlanBeadContext,
  classifyActorTurnRuntime,
  classifyActorTurnProviderContractRejection,
  writeActiveEpisode,
  writeDeliberationBranch,
  type ActiveEpisode,
  type DeliberationBranch,
  type DeliberationBranchReason,
  type ActorTurnRuntimeClassifierResult,
  type ActorTurnResolvedAction,
  type EvidenceTraceEntry
} from "./goals/actorEpisode/index.js";
import {
  createUnavailableVisualEvidence,
  startVisualEvidenceRecorder,
  type VisualEvidenceOptions,
  type VisualEvidenceRecorder
} from "./visualEvidence.js";
import {
  attachRuntimeSessionLifecycleTracker,
  withRuntimeSessionLifecycle,
  type RuntimeSessionLifecycleTracker
} from "./sessionLifecycle.js";

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
  active_episode_id?: string;
  action_ref: string;
  provider_input_refs: string[];
  provider_output_refs: string[];
  evidence_refs: string[];
  judgment_ref: string;
  verifier_status: "passed" | "failed" | "not_applicable";
  executed_tools: string[];
  tool_statuses: SocialPrimitiveAttemptStatus[];
  runtime_result: JsonValue;
  runtime_status: string;
  retry_constraint_blocked: boolean;
  branch_recommended?: boolean;
  branch_reason?: string;
  postcondition_results: ActionSkillPostconditionResult[];
  plan_bead_operation_result_refs: string[];
};

type SocialCycleReportCycleWithAttempts = SocialCycleRunReport["cycles"][number] & {
  action_attempts: SocialCycleActionAttemptReport[];
};

type EvidenceTraceAttempt = Pick<
  SocialCycleActionAttemptReport,
  | "turn_id"
  | "action_ref"
  | "evidence_refs"
  | "judgment_ref"
  | "verifier_status"
  | "executed_tools"
  | "tool_statuses"
  | "runtime_status"
> & {
  retry_constraint_blocked?: boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function actorRelativeRef(actorDir: string, ref: string | undefined) {
  if (!ref) {
    return undefined;
  }
  return path.isAbsolute(ref) ? path.relative(actorDir, ref) : ref;
}

function optionalStringProperty(value: unknown, key: string) {
  return value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>)[key] === "string"
    ? (value as Record<string, string>)[key]
    : undefined;
}

function optionalStringArrayProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return Array.isArray(candidate) && candidate.every((entry) => typeof entry === "string")
    ? candidate
    : undefined;
}

function providerRefs(input: {
  actorDir: string;
  inputRef?: string;
  outputRef?: string;
  intermediateInputRefs?: string[];
  intermediateOutputRefs?: string[];
}) {
  return {
    provider_input_refs: [
      ...(input.intermediateInputRefs ?? []),
      input.inputRef
    ]
      .map((ref) => actorRelativeRef(input.actorDir, ref))
      .filter((ref): ref is string => Boolean(ref)),
    provider_output_refs: [
      ...(input.intermediateOutputRefs ?? []),
      input.outputRef
    ]
      .map((ref) => actorRelativeRef(input.actorDir, ref))
      .filter((ref): ref is string => Boolean(ref))
  };
}

function appendProviderErrorRefs(input: {
  report: SocialCycleRunReport;
  actorDir: string;
  stage: string;
  turnId?: string;
  error: string;
  inputRef?: string;
  outputRef?: string;
  intermediateInputRefs?: string[];
  intermediateOutputRefs?: string[];
}) {
  const refs = providerRefs({
    actorDir: input.actorDir,
    inputRef: input.inputRef,
    outputRef: input.outputRef,
    intermediateInputRefs: input.intermediateInputRefs,
    intermediateOutputRefs: input.intermediateOutputRefs
  });
  input.report.provider_error_refs ??= [];
  input.report.provider_error_refs.push({
    stage: input.stage,
    ...(input.turnId ? { turn_id: input.turnId } : {}),
    error: input.error,
    ...refs
  });
}

function actorTurnProviderFailureKind(
  result: ActorTurnProviderResult
) {
  return !result.ok && "failureKind" in result ? result.failureKind : undefined;
}

async function buildActorTurnProviderContractRejectionAttempt(input: {
  rootDir: string;
  actorDir: string;
  actorId: string;
  runId: string;
  cycleId: string;
  turnId: string;
  actionIndex: number;
  cycleGoal: ActorCycleGoal;
  activeEpisodeId?: string;
  planner: Extract<ActorTurnProviderResult, { ok: false }>;
}): Promise<{
  attempt: SocialCycleActionAttemptReport;
  judgment: CycleJudgment;
  judgmentRef: string;
}> {
  const refs = providerRefs({
    actorDir: input.actorDir,
    inputRef: input.planner.inputRef,
    outputRef: input.planner.outputRef,
    intermediateInputRefs: input.planner.intermediateInputRefs,
    intermediateOutputRefs: input.planner.intermediateOutputRefs
  });
  const { ref: markerRef } = await writeActorGoalArtifact(
    input.rootDir,
    input.actorId,
    path.join("goals", "cycle", "intents"),
    `${input.turnId}-provider-contract-rejection`,
    {
      schema: "actor-turn-provider-contract-rejection/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      turn_id: input.turnId,
      non_executable: true,
      error: input.planner.error,
      provider_input_refs: refs.provider_input_refs,
      provider_output_refs: refs.provider_output_refs
    }
  );
  const { ref: evidenceRef } = await writeActorGoalArtifact(
    input.rootDir,
    input.actorId,
    "evidence",
    `${input.turnId}-provider-contract-rejection`,
    {
      schema: "actor-turn-provider-contract-rejection-evidence/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      turn_id: input.turnId,
      status: "blocked",
      verifier_status: "failed",
      no_minecraft_action_executed: true,
      error: input.planner.error,
      provider_input_refs: refs.provider_input_refs,
      provider_output_refs: refs.provider_output_refs
    }
  );
  const judgmentResult = await classifyActorTurnProviderContractRejection({
    actorWorkspaceRootDir: input.rootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    runId: input.runId,
    cycleGoal: input.cycleGoal,
    error: input.planner.error,
    evidenceRefs: [evidenceRef]
  });
  if (!judgmentResult.ok) {
    throw new Error(`failed to write provider contract rejection judgment: ${judgmentResult.error}`);
  }
  const runtimeResult: JsonValue = {
    schema: "actor-turn-provider-contract-rejection-runtime-result/v1",
    status: "blocked",
    verifier_status: "failed",
    no_minecraft_action_executed: true,
    error: input.planner.error,
    provider_input_refs: refs.provider_input_refs,
    provider_output_refs: refs.provider_output_refs
  };
  return {
    judgment: judgmentResult.judgment,
    judgmentRef: judgmentResult.judgmentRef,
    attempt: {
      attempt_id: input.turnId,
      action_index: input.actionIndex,
      turn_id: input.turnId,
      active_episode_id: input.activeEpisodeId,
      action_ref: markerRef,
      provider_input_refs: refs.provider_input_refs,
      provider_output_refs: refs.provider_output_refs,
      evidence_refs: [evidenceRef],
      judgment_ref: judgmentResult.judgmentRef,
      verifier_status: "failed",
      executed_tools: ["actor_turn_provider_contract"],
      tool_statuses: [{ tool: "actor_turn_provider_contract", status: "rejected" }],
      runtime_result: runtimeResult,
      runtime_status: "blocked",
      retry_constraint_blocked: false,
      branch_recommended: judgmentResult.branchRecommended,
      branch_reason: judgmentResult.branchReason,
      postcondition_results: [],
      plan_bead_operation_result_refs: []
    }
  };
}

function countRelationshipContextRefs(context: {
  relationship_context: {
    relationships: unknown[];
    incoming_relationships: unknown[];
    relationship_context_signals: unknown[];
    incoming_relationship_context_signals: unknown[];
  };
}) {
  return (
    context.relationship_context.relationships.length +
    context.relationship_context.incoming_relationships.length +
    context.relationship_context.relationship_context_signals.length +
    context.relationship_context.incoming_relationship_context_signals.length
  );
}

function planBeadGraphSummary(input: {
  actorId: string;
  packet: ReturnType<typeof computeReadyPlanBeads>;
  readyFrontRef?: string;
}): NonNullable<SocialCycleRunReport["plan_bead_graph_summary"]> {
  return {
    schema: "plan-bead-graph-summary/v1",
    actor_id: input.actorId,
    open_count: input.packet.graph_summary.open_count,
    ready_count: input.packet.graph_summary.ready_count,
    blocked_count: input.packet.graph_summary.blocked_count,
    deferred_count: input.packet.graph_summary.deferred_count,
    closed_recent_count: input.packet.graph_summary.closed_recent_count,
    ...(input.readyFrontRef ? { last_ready_front_ref: input.readyFrontRef } : {})
  };
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

function evidenceTraceFromActionAttempts(input: {
  cycleId: string;
  episodeId: string;
  attempts: readonly EvidenceTraceAttempt[];
}): EvidenceTraceEntry[] {
  return input.attempts.slice(-4).map((attempt) => {
    const outcome: EvidenceTraceEntry["outcome"] =
      attempt.retry_constraint_blocked || attempt.runtime_status === "blocked"
        ? "blocked"
        : attempt.runtime_status === "failed"
          ? "no_progress"
          : isMovementOnlyVerifier(attempt.verifier_status, attempt.executed_tools)
            ? "position_delta"
          : attempt.verifier_status === "passed"
            ? "verified_mutation"
            : hasPartialVerifiedProgress({ toolStatuses: attempt.tool_statuses })
              ? "partial_verified_progress"
              : "no_progress";
    return {
      schema: "evidence-trace/v1",
      turn_id: attempt.turn_id,
      episode_id: input.episodeId,
      action_ref: attempt.action_ref,
      runtime_gate_ref: `runtime-gates/${attempt.turn_id}.json`,
      ...(attempt.evidence_refs[0] ? { execution_ref: attempt.evidence_refs[0] } : {}),
      ...(attempt.judgment_ref ? { verifier_ref: attempt.judgment_ref } : {}),
      outcome,
      compact_summary:
        `${attempt.turn_id} ${attempt.executed_tools.join(",") || "no_tool"} -> ${attempt.runtime_status}`
    };
  });
}

const diagnosticBranchOnlyTools = new Set(["observe", "inspect_chest", "remember", "wait"]);

function hasBranchableRuntimeTool(attempt: SocialCycleActionAttemptReport) {
  return attempt.executed_tools.some((tool) => !diagnosticBranchOnlyTools.has(tool));
}

function branchReasonFromActionAttempts(
  attempts: readonly SocialCycleActionAttemptReport[]
): DeliberationBranchReason | null {
  if (attempts.some((attempt) => attempt.retry_constraint_blocked)) {
    return "repeated_exact_blocker";
  }
  // Diagnostic/control turns feed the next Actor Turn; by themselves they are
  // not a meaningful branch point. This keeps Deliberation off the ordinary hot
  // path while still branching for failed movement, crafting, placement,
  // generated-code, inventory, equipment, and social actions.
  if (attempts.some((attempt) => attempt.branch_recommended && hasBranchableRuntimeTool(attempt))) {
    return "episode_blocked";
  }
  if (attempts.some((attempt) => attempt.verifier_status === "failed" || attempt.runtime_status === "failed")) {
    return "episode_blocked";
  }
  return null;
}

function worldEventRef(eventId: string) {
  return `world-events/${eventId}.json`;
}

function newWorldEventRefs(input: {
  activeEpisode: ActiveEpisode;
  context: SocialCycleContextPacket;
}) {
  const opened = new Set(input.activeEpisode.opened_from_refs);
  return input.context.world_events
    .map((event) => worldEventRef(event.event_id))
    .filter((ref) => !opened.has(ref));
}

function branchReasonFromContextSignals(input: {
  activeEpisode: ActiveEpisode;
  context: SocialCycleContextPacket;
}): DeliberationBranchReason | null {
  const currentState = buildActorTurnCurrentStateProjection(input.context);
  if (currentState.session_lifecycle?.branch_recommended) {
    return "danger_or_survival_pressure";
  }
  const currentVisibleActors = currentState.visible_actors.map((actor) => actor.id);
  const knownActors = new Set(input.activeEpisode.actors_visible_or_relevant);
  if (currentVisibleActors.some((actorId) => !knownActors.has(actorId))) {
    return "new_social_pressure";
  }

  const opened = new Set(input.activeEpisode.opened_from_refs);
  const hasNewActorLinkedWorldEvent = input.context.world_events.some((event) =>
    event.actor_refs.length > 0 && !opened.has(worldEventRef(event.event_id))
  );
  if (hasNewActorLinkedWorldEvent) {
    return "new_social_pressure";
  }

  return newWorldEventRefs(input).length > 0 ? "context_change" : null;
}

function pushUniqueRef(target: string[] | undefined, ref: string) {
  const refs = target ?? [];
  if (!refs.includes(ref)) {
    refs.push(ref);
  }
  return refs;
}

function actorTurnDefaultPrimitive(input: {
  configured?: readonly string[];
  cycleIndex: number;
  actionIndex: number;
  maxActionsPerCycle: number;
}) {
  const linearIndex = input.cycleIndex * input.maxActionsPerCycle + input.actionIndex;
  return input.configured?.[linearIndex] ?? (input.actionIndex === 0 ? "observe" : "wait");
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
  geminiApiKey?: string;
  geminiModelRotation?: string[];
  repoRoot?: string;
  /** Use a run-scoped actor workspace under social-runs/<run_id>/ to avoid stale artifacts. */
  isolateWorkspace?: boolean;
  /** Start a disposable Minecraft server/world for this run instead of reusing the live-smoke world. */
  freshWorld?: boolean;
  /**
   * Named test environment. Scenario setup is fixture evidence only; Actor Turn
   * still owns action selection and runtime verifiers still own progress truth.
   */
  worldScenario?: WorldScenarioId;
  benchmarkTask?: string;
  worldSeed?: string;
  levelType?: string;
  /** Prepare a small, live-world spawn access point for long survival/settlement runs. */
  prepareSpawnAccess?: boolean;
  /** Seed a small social proof scenario: npc_a asks the active actor to contribute inventory to shared storage. */
  sharedStorageSocialSmoke?: boolean;
  /** Deterministic-social debug hook for exercising Actor Turn branches without a live provider. */
  deterministicActorTurnPrimitives?: string[];
  /** Optional bot-view screenshots for human review; visual evidence never grants progress authority. */
  visualEvidence?: VisualEvidenceOptions;
};

export type SocialCycleRunResult = {
  report: SocialCycleRunReport;
  reportPath: string;
};

export function selectGeminiModelForCall(input: {
  rotation?: readonly string[];
  callIndex: number;
  fallbackModel: string;
}) {
  const rotation = (input.rotation ?? [])
    .map((model) => model.trim())
    .filter(Boolean);
  if (rotation.length === 0) {
    return input.fallbackModel;
  }
  return rotation[input.callIndex % rotation.length] ?? input.fallbackModel;
}

export function selectGeminiFallbackModelsForCall(input: {
  rotation?: readonly string[];
  callIndex: number;
  fallbackModel: string;
}) {
  const rotation = (input.rotation ?? [])
    .map((model) => model.trim())
    .filter(Boolean);
  if (rotation.length <= 1) {
    return [];
  }
  const selected = input.callIndex % rotation.length;
  return rotation.filter((model, index) => index !== selected && model !== input.fallbackModel);
}

type ReportedRuntimeAction = ActorTurnResolvedAction;

export function benchmarkTaskEvidenceRequirements() {
  return [
    "Runtime action evidence must show physical progress toward the benchmark target; provider prose is not enough.",
    "Final success must be scored by explicit benchmark target evidence such as inventory, held item, block, position, container, or transcript artifacts.",
    "Intermediate milestones count as partial credit only when runtime evidence proves the milestone and the scoring report names it as partial credit."
  ];
}

function runtimeActionParameters(action: ReportedRuntimeAction): Record<string, unknown> {
  return action.parameters as Record<string, unknown>;
}

function runtimeActionSkillIds(action: ReportedRuntimeAction) {
  return [
    ...(action.kind === "use_action_skill" ? [action.action_skill_id] : []),
    ...(action.kind === "use_primitive" ? [action.primitive_id] : [])
  ].filter((id): id is string => typeof id === "string" && id.length > 0);
}

function buildBenchmarkTaskCycleGoal(input: {
  actorId: string;
  cycleId: string;
  context: SocialCycleContextPacket;
  task: string;
  allowedActionSkillIds: readonly string[];
  allowedPrimitiveIds: readonly string[];
}): ActorCycleGoal {
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: input.actorId,
    goal_id: `cycle-goal-${randomUUID()}`,
    life_goal_id: input.context.ActorLifeGoal.goal_id,
    cycle_id: input.cycleId,
    status: "active",
    source: "world_event_context",
    summary: input.task,
    rationale:
      "Operator benchmark target for a model-comparison run. This fixes the target outcome while leaving action choice, parameter choice, execution, and verification under the normal Actor Turn and runtime evidence path.",
    derived_from: {
      soul_ref: soulRef(input.actorId),
      observation_refs: [],
      world_event_refs: input.context.world_events.map((event) => `world-events/${event.event_id}.json`),
      memory_refs: listActorMemoryRefs(input.context.memory_packet).map((ref) => ref.memory_id),
      relationship_refs: [],
      previous_cycle_judgment_refs: input.context.previous_cycle_judgments.map((judgment) => judgment.ref)
    },
    success_condition: {
      verifier: "benchmark_target_runtime_evidence",
      evidence_required: benchmarkTaskEvidenceRequirements()
    },
    allowed_action_skill_ids: [...input.allowedActionSkillIds],
    allowed_primitive_ids: [...input.allowedPrimitiveIds],
    stop_conditions: [
      "benchmark target reached with runtime evidence",
      "max cycles reached",
      "runtime gate blocked",
      "environment setup failed"
    ]
  };
}

function memoryKindForJudgmentWrite(input: {
  layer: CycleJudgment["memory_writes"][number]["layer"];
  judgment: CycleJudgment;
  action: ReportedRuntimeAction;
}): ActorMemoryKind {
  if (input.layer === "procedural") {
    return "action_skill_note";
  }
  if (input.layer === "social") {
    return "relationship_event";
  }
  if (input.layer === "guardrail" || input.judgment.outcome === "blocked") {
    return "blocker";
  }
  if (input.action.kind === "use_primitive" && input.action.primitive_id === "observe") {
    return "world_observation";
  }
  return "cycle_judgment";
}

async function persistJudgmentMemoryWrites(
  rootDir: string,
  actorId: string,
  judgment: CycleJudgment,
  action: ReportedRuntimeAction,
  executedTools: readonly string[],
  runtimeResult: JsonValue,
  toolStatuses: readonly SocialPrimitiveAttemptStatus[],
  judgmentRef: string
) {
  if (judgment.memory_writes.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const parameters = runtimeActionParameters(action);
  await writeActorMemoryRecords(
    rootDir,
    judgment.memory_writes.map((write, index) => ({
      schema: "actor-memory-record/v1",
      memory_id: `social-${judgment.cycle_id}-${sanitizeWorkspaceFileId(judgmentRef)}-${index}`,
      actor_id: actorId,
      layer: write.layer === "belief" ? "belief" : write.layer,
      kind: memoryKindForJudgmentWrite({
        layer: write.layer,
        judgment,
        action
      }),
      status: "active",
      confidence:
        judgment.verifier_status === "passed" || write.confidence !== "observed"
          ? write.confidence
          : "uncertain",
      scope: { kind: "actor_private", actor_id: actorId },
      created_at: now,
      updated_at: now,
      summary: write.summary,
      evidence_refs: [...judgment.evidence_refs],
      tags: ["social_cycle"],
      index: {
        objective_ids: [],
        objective_categories: ["social_cycle"],
        item_names: typeof parameters.itemName === "string" ? [parameters.itemName] : [],
        block_names: typeof parameters.blockName === "string" ? [parameters.blockName] : [],
        tool_names: [...executedTools],
        action_skill_ids: runtimeActionSkillIds(action),
        diagnoses: [judgment.outcome],
        verifier_statuses: [judgment.verifier_status],
        causal_refs: [judgment.cycle_id, judgmentRef]
      },
      content: {
        cycle_id: judgment.cycle_id,
        judgment_ref: judgmentRef,
        outcome: judgment.outcome,
        verifier_status: judgment.verifier_status,
        action: action as unknown as JsonValue,
        executed_tools: [...executedTools],
        tool_statuses: toolStatuses as unknown as JsonValue,
        runtime_result: runtimeResult
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
  const commands: string[][] = [
    ["setworldspawn", String(pos.x), String(pos.y), String(pos.z)],
    [
      "fill",
      String(pos.x - 3),
      String(pos.y - 1),
      String(pos.z - 3),
      String(pos.x + 3),
      String(pos.y - 1),
      String(pos.z + 3),
      "minecraft:grass_block"
    ],
    [
      "fill",
      String(pos.x - 3),
      String(pos.y),
      String(pos.z - 3),
      String(pos.x + 3),
      String(pos.y + 3),
      String(pos.z + 3),
      "minecraft:air"
    ],
    [
      "setblock",
      String(pos.x + 2),
      String(pos.y),
      String(pos.z),
      "minecraft:chest",
      "replace"
    ],
    [
      "setblock",
      String(pos.x - 2),
      String(pos.y),
      String(pos.z),
      "minecraft:crafting_table",
      "replace"
    ],
    ["setblock", String(pos.x), String(pos.y - 1), String(pos.z), "minecraft:grass_block", "replace"]
  ];

  for (const command of commands) {
    await input.runRcon(command);
  }

  await new Promise((resolve) => setTimeout(resolve, 1_500));
  return pos;
}

async function seedSharedStorageSocialSmokeInventory(input: {
  bot: Bot;
  runRcon: (args: string[]) => Promise<string>;
}) {
  await input.runRcon(["give", input.bot.username, "minecraft:oak_log", "4"]);
  await new Promise((resolve) => setTimeout(resolve, 750));
}

function sharedStorageSocialSmokeSummary(actorId: string) {
  return `npc_a requests that ${actorId} deposit one oak_log into shared storage before npc_a trusts ${actorId}'s next progress claim.`;
}

export async function runSocialCycle(input: SocialCycleRunOptions): Promise<SocialCycleRunResult> {
  const repoRoot = input.repoRoot ?? path.resolve(process.cwd(), "..");
  const loadedConfig = loadProbeConfig();
  const worldScenario = getWorldScenario(input.worldScenario);
  const requestedConfig: ProbeConfig = {
    ...loadedConfig,
    world: {
      ...loadedConfig.world,
      seed: input.worldSeed ?? loadedConfig.world.seed,
      levelType: input.levelType ?? loadedConfig.world.levelType
    }
  };
  const config = applyWorldScenarioToConfig(requestedConfig, worldScenario, {
    worldSeed: input.worldSeed
  });
  const useFreshWorld = input.freshWorld === true || worldScenario.requiresFreshWorld;
  const runId = `social-cycle-${randomUUID()}`;
  const workspaceBaseDir = input.actorWorkspaceRootDir ?? config.actorWorkspace.rootDir;
  const rootDir =
    input.isolateWorkspace === true ||
    (!input.actorWorkspaceRootDir && input.isolateWorkspace !== false)
      ? path.join(workspaceBaseDir, "social-runs", runId)
      : workspaceBaseDir;
  const profile = getActorProfile(input.actorId);
  const reasoning = input.reasoning ?? process.env.SOCIAL_CYCLE_REASONING ?? "low";

  const report = createEmptySocialCycleReport({
    runId,
    actorId: input.actorId,
    providerId: input.providerId,
    model: input.model,
    reasoning
  });
  report.agency_status.builtin_execution_source = input.providerId === "deterministic-social";
  report.actor_workspace_root_dir = rootDir;
  report.server = {
    mode: useFreshWorld ? "fresh_world" : "live_smoke",
    seed: config.world.seed,
    level_type: config.world.levelType,
    version: config.server.version,
    ...(config.world.generatorSettings ? { generator_settings: config.world.generatorSettings } : {}),
    generate_structures: config.world.generateStructures ?? true,
    world_scenario: {
      scenario_id: worldScenario.id,
      lane: worldScenario.lane,
      fixture_dependency: worldScenario.fixtureDependency,
      requires_fresh_world: worldScenario.requiresFreshWorld,
      setup_status: "not_applicable",
      ...(worldScenario.buildArea ? { build_area: worldScenario.buildArea } : {})
    }
  };

  const openAi: OpenAiJsonProviderConfig | undefined =
    input.providerId === "openai-api"
      ? {
          apiKey: input.openAiApiKey ?? process.env.OPENAI_API_KEY ?? "",
          model: input.model,
          reasoning,
          repoRoot
        }
      : undefined;
  const gemini: GeminiJsonProviderConfig | undefined =
    input.providerId === "gemini-api"
      ? {
          apiKey: input.geminiApiKey ?? process.env.GEMINI_API_KEY ?? "",
          model: input.model,
          requestTimeoutMs: Number(process.env.GEMINI_TEXT_REQUEST_TIMEOUT_MS ?? 900_000),
          maxRetries: Number(process.env.GEMINI_JSON_MAX_RETRIES ?? 2),
          repoRoot
        }
      : undefined;
  const modelScope: ModelScopeApiProviderConfig | undefined =
    input.providerId === "modelscope-api"
      ? {
          apiKey: process.env.MODELSCOPE_API_KEY ?? "",
          baseUrl: process.env.MODELSCOPE_BASE_URL,
          model: input.model,
          requestTimeoutMs: Number(process.env.MODELSCOPE_REQUEST_TIMEOUT_MS ?? 180_000),
          maxRetries: Number(process.env.MODELSCOPE_JSON_MAX_RETRIES ?? 1),
          repoRoot
        }
      : undefined;
  let geminiProviderCallIndex = 0;
  const geminiForProviderCall = () => {
    if (!gemini) {
      return undefined;
    }
    const model = selectGeminiModelForCall({
      rotation: input.geminiModelRotation,
      callIndex: geminiProviderCallIndex,
      fallbackModel: gemini.model
    });
    const fallbackModels = selectGeminiFallbackModelsForCall({
      rotation: input.geminiModelRotation,
      callIndex: geminiProviderCallIndex,
      fallbackModel: model
    });
    geminiProviderCallIndex++;
    return { ...gemini, model, fallbackModels };
  };

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

  let worldScenarioManifest: WorldScenarioManifest | undefined;
  let worldScenarioManifestRef: string | undefined;
  if (worldScenario.id !== "natural-survival") {
    const actorDir = getActorWorkspacePaths(rootDir, input.actorId).actorDir;
    worldScenarioManifestRef = path.join(
      "evidence",
      "world-scenarios",
      `${sanitizeWorkspaceFileId(runId)}-${sanitizeWorkspaceFileId(worldScenario.id)}.json`
    );
    worldScenarioManifest = createWorldScenarioManifest(worldScenario, { world: config.world });
    await writeJson(path.join(actorDir, worldScenarioManifestRef), worldScenarioManifest);
    if (report.server?.world_scenario) {
      report.server.world_scenario.manifest_ref = worldScenarioManifestRef;
    }
    report.agency_status.fixture_dependency = report.agency_status.fixture_dependency ||
      worldScenario.fixtureDependency;
  }

  if (worldScenario.worldEventSummary) {
    const event = createWorldEvent({
      summary: worldScenario.worldEventSummary,
      kind: "scenario_event",
      actorRefs: [input.actorId],
      authority: "context_only",
      runId
    });
    await writeWorldEvent(rootDir, input.actorId, event);
  }

  if (input.benchmarkTask?.trim()) {
    const event = createWorldEvent({
      summary: `Operator benchmark task: ${input.benchmarkTask.trim()}`,
      kind: "scenario_event",
      actorRefs: [input.actorId],
      authority: "scenario_rule",
      runId
    });
    await writeWorldEvent(rootDir, input.actorId, event);
  }

  if (input.sharedStorageSocialSmoke) {
    const event = createWorldEvent({
      summary: sharedStorageSocialSmokeSummary(input.actorId),
      kind: "scenario_event",
      actorRefs: ["npc_a", input.actorId],
      authority: "context_only",
      runId
    });
    await writeWorldEvent(rootDir, input.actorId, event);
    if (report.server) {
      report.server = {
        ...report.server,
        shared_storage_social_smoke: true
      };
    }
  }

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
  let visualEvidenceRecorder: VisualEvidenceRecorder | undefined;
  let sessionLifecycleTracker: RuntimeSessionLifecycleTracker | undefined;
  let environmentBlocked = false;

  if (input.connectToWorld !== false) {
    try {
      const server = await resolveServerEndpoint(config, { freshWorld: useFreshWorld });
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
      if (worldScenarioManifest && worldScenarioManifestRef && serverRunRcon) {
        const preBotCommands = buildWorldScenarioCommands({
          scenario: worldScenario,
          phase: "pre_bot",
          serverVersion: config.server.version
        });
        if (preBotCommands.length > 0) {
          const preBotRun = await runWorldScenarioCommands({
            phase: "pre_bot",
            commands: preBotCommands,
            runRcon: serverRunRcon
          });
          worldScenarioManifest.command_runs.push(preBotRun);
          await writeJson(
            path.join(getActorWorkspacePaths(rootDir, input.actorId).actorDir, worldScenarioManifestRef),
            worldScenarioManifest
          );
          if (preBotRun.required_failure) {
            throw new Error(`World scenario ${worldScenario.id} pre-bot setup failed`);
          }
        }
      }

      const bots = await createBots({ ...config, bots: [input.actorId] }, server);
      bot = bots[input.actorId];
      if (bot) {
        sessionLifecycleTracker = attachRuntimeSessionLifecycleTracker({
          actorId: input.actorId,
          bot
        });
      }
      if (worldScenarioManifest && worldScenarioManifestRef && bot && serverRunRcon) {
        const actorDir = getActorWorkspacePaths(rootDir, input.actorId).actorDir;
        if (worldScenario.id === "natural-safe-spawn-v1") {
          const validationRef = path.join(
            "evidence",
            "world-scenarios",
            `${sanitizeWorkspaceFileId(runId)}-${sanitizeWorkspaceFileId(worldScenario.id)}-natural-spawn-validation.json`
          );
          const validation = createNaturalSpawnValidation({
            bot,
            actorId: input.actorId,
            seed: config.world.seed
          });
          worldScenarioManifest.natural_spawn_validation = {
            status: validation.status,
            artifact_ref: validationRef,
            credited_as_actor_progress: false
          };
          await writeJson(path.join(actorDir, validationRef), validation);
          await writeJson(
            path.join(actorDir, worldScenarioManifestRef),
            worldScenarioManifest
          );
          if (report.server?.world_scenario) {
            report.server.world_scenario.natural_spawn_validation_status = validation.status;
            report.server.world_scenario.natural_spawn_validation_ref = validationRef;
          }
          if (validation.status === "failed" || !validation.selected_player_position) {
            throw new Error(
              `World scenario ${worldScenario.id} safe-spawn validation failed: ${validation.failure_reasons.join(", ")}`
            );
          }
          const placementRun = await runWorldScenarioCommands({
            phase: "post_bot",
            commands: buildNaturalSpawnPlacementCommands({
              username: bot.username,
              selectedPlayerPosition: validation.selected_player_position
            }),
            runRcon: serverRunRcon
          });
          worldScenarioManifest.command_runs.push(placementRun);
          await writeJson(
            path.join(actorDir, worldScenarioManifestRef),
            worldScenarioManifest
          );
          if (placementRun.required_failure) {
            throw new Error(`World scenario ${worldScenario.id} safe-spawn placement failed`);
          }
          if (report.server?.world_scenario) {
            report.server.world_scenario.setup_status = "passed";
          }
        }
        const postBotCommands = buildWorldScenarioCommands({
          scenario: worldScenario,
          phase: "post_bot",
          serverVersion: config.server.version,
          bot
        });
        if (postBotCommands.length > 0) {
          const postBotRun = await runWorldScenarioCommands({
            phase: "post_bot",
            commands: postBotCommands,
            runRcon: serverRunRcon
          });
          worldScenarioManifest.command_runs.push(postBotRun);
          await writeJson(
            path.join(actorDir, worldScenarioManifestRef),
            worldScenarioManifest
          );
          if (report.server?.world_scenario) {
            report.server.world_scenario.setup_status = postBotRun.required_failure ? "failed" : "passed";
          }
          if (postBotRun.required_failure) {
            throw new Error(`World scenario ${worldScenario.id} post-bot setup failed`);
          }
        }
      }
      if ((input.prepareSpawnAccess || input.sharedStorageSocialSmoke) && bot && serverRunRcon) {
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
      if (input.sharedStorageSocialSmoke && bot && serverRunRcon) {
        await seedSharedStorageSocialSmokeInventory({ bot, runRcon: serverRunRcon });
        report.server = {
          ...report.server,
          starter_inventory_seeded: true
        };
      }
    } catch (error) {
      environmentBlocked = true;
      report.agency_status.fixture_dependency = true;
      if (report.server?.world_scenario) {
        report.server.world_scenario.setup_status = "failed";
      }
      report.server = {
        ...report.server,
        error_kind: "environment_blocked",
        error: errorMessage(error)
      };
    }
  } else {
    report.agency_status.fixture_dependency = true;
  }

  if (input.visualEvidence?.enabled) {
    const actorDir = getActorWorkspacePaths(rootDir, input.actorId).actorDir;
    if (bot) {
      try {
        visualEvidenceRecorder = await startVisualEvidenceRecorder({
          actorDir,
          actorId: input.actorId,
          runId,
          bot,
          options: input.visualEvidence
        });
        report.visual_evidence = visualEvidenceRecorder.manifest;
        await visualEvidenceRecorder.capture({ cycleId: "initial", phase: "initial" });
        report.visual_evidence = visualEvidenceRecorder.manifest;
      } catch (error) {
        report.visual_evidence = createUnavailableVisualEvidence({
          actorId: input.actorId,
          runId,
          reason: `Visual evidence startup failed: ${errorMessage(error)}`,
          intervalCycles: input.visualEvidence.intervalCycles,
          cameraMode: input.visualEvidence.cameraMode,
          width: input.visualEvidence.width,
          height: input.visualEvidence.height
        });
      }
    } else {
      report.visual_evidence = createUnavailableVisualEvidence({
        actorId: input.actorId,
        runId,
        reason: "Visual evidence requested but the Minecraft bot was not connected",
        intervalCycles: input.visualEvidence.intervalCycles,
        cameraMode: input.visualEvidence.cameraMode,
        width: input.visualEvidence.width,
        height: input.visualEvidence.height
      });
    }
  }

  const observeCurrentActorWorld = async () =>
    withRuntimeSessionLifecycle(
      await observeActorWorld({ actorId: input.actorId, bot }),
      sessionLifecycleTracker
    );

  let providerFailed = false;
  let anyMeaningfulProgress = false;
  let previousCycleJudgment: {
    ref: string;
    judgment: CycleJudgment;
  } | null = null;
  const recentToolResults: ToolResultRecord[] = [];
  const settlementToolResults: ToolResultRecord[] = [];
  const runtimeRetryAttempts: RuntimeRetryAttempt[] = [];
  const allPostconditionResults: ActionSkillPostconditionResult[] = [];
  let memoryWriteCount = 0;
  let activeEpisodeState: { episode: ActiveEpisode; ref: string; openedCycleId: string } | null = null;
  let pendingDeliberationBranch: {
    branchRef: string;
    branch: DeliberationBranch;
    reason: DeliberationBranchReason;
  } | null = null;

  try {
    const activeSkills = await listActiveActorActionSkillRecords(rootDir, input.actorId);
    const allowedPrimitives = compileSocialAllowedPrimitives(profile.gameplay_role);
    const executableActiveSkills = filterActionSkillsForAllowedPrimitives(
      filterExecutableSocialActionSkills(activeSkills),
      allowedPrimitives
    );
    const allowedSkillIds = executableActiveSkills.map((s) => s.skill_id);

    for (let cycleIndex = 0; !environmentBlocked && cycleIndex < input.cycles; cycleIndex++) {
      const cycleId = `cycle-${String(cycleIndex + 1).padStart(4, "0")}`;
      const worldEvents = await listWorldEvents(rootDir, input.actorId, { runId });
      const strategicGoals = await listStrategicGoals(rootDir, input.actorId);
      const previousJudgments: Array<{ ref: string; judgment: CycleJudgment }> =
        previousCycleJudgment && cycleIndex > 0 ? [previousCycleJudgment] : [];
      const cycleRetryConstraints = deriveRuntimeRetryConstraints({
        actorId: input.actorId,
        attempts: runtimeRetryAttempts
      });
      let planBeadGraph = await loadPlanBeadGraphSnapshot(rootDir, input.actorId);
      let planBeadPacket = computeReadyPlanBeads({
        beads: planBeadGraph.beads,
        dependencies: planBeadGraph.dependencies,
        lifeGoalId: lifeGoal.goal_id,
        nowIso: new Date().toISOString(),
        maxReady: 3
      });

      if (previousJudgments.length > 0) {
        report.agency_status.used_previous_judgment = true;
      }

      const observation = await observeCurrentActorWorld();
      let context = await assembleSocialCycleContext({
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
        cycleIndex,
        recentToolResults: settlementToolResults,
        postconditionResults: allPostconditionResults,
        evidenceRefs: report.cycles.flatMap((cycle) => cycle.evidence_refs),
        judgmentRefs: report.cycles.map((cycle) => cycle.judgment_ref).filter(Boolean),
        memoryWriteCount,
        runtimeRetryConstraints: cycleRetryConstraints,
        planBeadPacket
      });
      const cyclePlanBeadOperationResultRefs: string[] = [];
      const currentStateLifecycleOperations = derivePlanBeadLifecycleOperationsFromCurrentState({
        actorId: input.actorId,
        cycleId,
        turnId: `${cycleId}-current-state`,
        currentState: buildActorTurnCurrentStateProjection(context),
        beads: planBeadGraph.beads
      });
      if (currentStateLifecycleOperations.length > 0) {
        const beadOperationApplication = await applyPlanBeadOperations({
          rootDir,
          actorId: input.actorId,
          lifeGoalId: lifeGoal.goal_id,
          cycleId,
          turnId: `${cycleId}-current-state`,
          operations: currentStateLifecycleOperations
        });
        report.plan_bead_operation_results ??= [];
        report.plan_bead_operation_results.push(
          ...beadOperationApplication.results.map((result, index) => ({
            cycle_id: cycleId,
            turn_id: `${cycleId}-current-state`,
            ref: beadOperationApplication.result_refs[index] ?? "",
            op: result.op,
            status: result.status,
            bead_id: result.bead_id,
            reason: result.reason
          }))
        );
        cyclePlanBeadOperationResultRefs.push(...beadOperationApplication.result_refs);
        planBeadGraph = await loadPlanBeadGraphSnapshot(rootDir, input.actorId);
        planBeadPacket = computeReadyPlanBeads({
          beads: planBeadGraph.beads,
          dependencies: planBeadGraph.dependencies,
          lifeGoalId: lifeGoal.goal_id,
          nowIso: new Date().toISOString(),
          maxReady: 3
        });
        context = await assembleSocialCycleContext({
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
          cycleIndex,
          recentToolResults: settlementToolResults,
          postconditionResults: allPostconditionResults,
          evidenceRefs: report.cycles.flatMap((cycle) => cycle.evidence_refs),
          judgmentRefs: report.cycles.map((cycle) => cycle.judgment_ref).filter(Boolean),
          memoryWriteCount,
          runtimeRetryConstraints: cycleRetryConstraints,
          planBeadPacket
        });
      }
      const readyFrontSnapshot = await writePlanBeadReadyFrontSnapshot({
        rootDir,
        actorId: input.actorId,
        cycleId,
        packet: planBeadPacket
      });
      report.plan_bead_ready_fronts ??= [];
      report.plan_bead_ready_fronts.push({
        schema: "plan-bead-ready-front/v1",
        cycle_id: cycleId,
        ref: readyFrontSnapshot.ref,
        ready_bead_ids: planBeadPacket.ready_beads.map((bead) => bead.bead_id),
        in_progress_bead_ids: planBeadPacket.in_progress_beads.map((bead) => bead.bead_id),
        blocked_bead_ids: planBeadPacket.blocked_beads.map((bead) => bead.bead_id),
        physical_progress_claim: false
      });
      report.plan_bead_graph_summary = planBeadGraphSummary({
        actorId: input.actorId,
        packet: planBeadPacket,
        readyFrontRef: readyFrontSnapshot.ref
      });
      report.runtime_retry_constraints = cycleRetryConstraints;

      report.agency_status.used_world_event_refs = worldEvents.length;
      report.agency_status.used_memory_refs = Math.max(
        report.agency_status.used_memory_refs,
        listActorMemoryRefs(context.memory_packet).length
      );
      report.agency_status.used_relationship_refs = Math.max(
        report.agency_status.used_relationship_refs,
        countRelationshipContextRefs(context)
      );
      if (report.memory_reuse) {
        report.memory_reuse.retrieved_memory_refs = Math.max(
          report.memory_reuse.retrieved_memory_refs,
          listActorMemoryRefs(context.memory_packet).length
        );
        report.memory_reuse.used_previous_judgment = report.agency_status.used_previous_judgment;
      }

      const paths = getActorWorkspacePaths(rootDir, input.actorId);
      let cycleGoal: ActorCycleGoal;
      let cycleGoalRef = "";
      let cycleGoalInputRef: string | undefined;
      let cycleGoalOutputRef: string | undefined;
      let activeEpisodeForCycle: ActiveEpisode;
      let activeEpisodeRefForCycle = "";

      if (activeEpisodeState && !pendingDeliberationBranch) {
        const anchoredEpisode = anchorActiveEpisodeToPlanBeadContext({
          activeEpisode: activeEpisodeState.episode,
          context
        });
        if (anchoredEpisode !== activeEpisodeState.episode) {
          const writtenAnchoredEpisode = await writeActiveEpisode(
            rootDir,
            input.actorId,
            anchoredEpisode
          );
          activeEpisodeState = {
            episode: anchoredEpisode,
            ref: writtenAnchoredEpisode.ref,
            openedCycleId: activeEpisodeState.openedCycleId
          };
        }
        cycleGoal = buildCycleGoalFromActiveEpisode({
          cycleId,
          context,
          activeEpisode: activeEpisodeState.episode
        });
        const writtenCycleGoal = await writeCycleGoal(rootDir, input.actorId, cycleGoal);
        cycleGoalRef = writtenCycleGoal.ref;
        activeEpisodeForCycle = activeEpisodeState.episode;
        activeEpisodeRefForCycle = activeEpisodeState.ref;
        report.agency_status.strategic_goal_source = "runtime_rule";
        report.agency_status.cycle_goal_source = cycleGoal.source;
        report.agency_status.builtin_goal_authority = input.providerId === "deterministic-social";
      } else if (activeEpisodeState && pendingDeliberationBranch) {
        const deliberation = await runSocialDeliberationProvider({
          providerId: input.providerId,
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          branch: pendingDeliberationBranch.branch,
          currentEpisode: activeEpisodeState.episode,
          currentEpisodeRef: activeEpisodeState.ref,
          context,
          openAi,
          gemini: geminiForProviderCall(),
          modelScope,
          runId
        });
        if (!deliberation.ok) {
          providerFailed = true;
          report.provider_error = deliberation.error;
          appendProviderErrorRefs({
            report,
            actorDir: paths.actorDir,
            stage: "deliberation",
            turnId: `${cycleId}-deliberation`,
            error: deliberation.error,
            inputRef: deliberation.inputRef,
            outputRef: deliberation.outputRef
          });
          break;
        }

        const beadOperationApplication = await applyPlanBeadOperations({
          rootDir,
          actorId: input.actorId,
          lifeGoalId: lifeGoal.goal_id,
          cycleId,
          turnId: `${cycleId}-deliberation`,
          operations: deliberation.deliberation.plan_bead_op_proposals
        });
        report.plan_bead_operation_results ??= [];
        report.plan_bead_operation_results.push(
          ...beadOperationApplication.results.map((result, index) => ({
            cycle_id: cycleId,
            turn_id: `${cycleId}-deliberation`,
            ref: beadOperationApplication.result_refs[index] ?? "",
            op: result.op,
            status: result.status,
            bead_id: result.bead_id,
            reason: result.reason
          }))
        );
        cyclePlanBeadOperationResultRefs.push(...beadOperationApplication.result_refs);

        cycleGoal = buildCycleGoalFromActiveEpisode({
          cycleId,
          context,
          activeEpisode: deliberation.episode
        });
        const writtenCycleGoal = await writeCycleGoal(rootDir, input.actorId, cycleGoal);
        cycleGoalRef = writtenCycleGoal.ref;
        cycleGoalInputRef = deliberation.inputRef;
        cycleGoalOutputRef = deliberation.outputRef;
        activeEpisodeForCycle = deliberation.episode;
        activeEpisodeRefForCycle = deliberation.episodeRef;
        activeEpisodeState = {
          episode: activeEpisodeForCycle,
          ref: activeEpisodeRefForCycle,
          openedCycleId: cycleId
        };
        pendingDeliberationBranch = null;
        report.active_episode_refs = pushUniqueRef(report.active_episode_refs, activeEpisodeRefForCycle);
        report.agency_status.strategic_goal_source = "runtime_rule";
        report.agency_status.cycle_goal_source = cycleGoal.source;
        report.agency_status.builtin_goal_authority = input.providerId === "deterministic-social";
      } else if (input.benchmarkTask?.trim()) {
        cycleGoal = buildBenchmarkTaskCycleGoal({
          actorId: input.actorId,
          cycleId,
          context,
          task: input.benchmarkTask.trim(),
          allowedActionSkillIds: allowedSkillIds,
          allowedPrimitiveIds: allowedPrimitives
        });
        const writtenCycleGoal = await writeCycleGoal(rootDir, input.actorId, cycleGoal);
        cycleGoalRef = writtenCycleGoal.ref;
        activeEpisodeForCycle = buildActiveEpisodeFromCycleGoal({
          episodeId: `episode-${cycleId}`,
          context,
          cycleGoal,
          selectedPlanBeadRefs: cycleGoal.derived_from.plan_bead_refs ?? [],
          startedAtTurnRef: `${cycleId}-action-01`
        });
        const activeEpisodeWritten = await writeActiveEpisode(
          rootDir,
          input.actorId,
          activeEpisodeForCycle
        );
        activeEpisodeRefForCycle = activeEpisodeWritten.ref;
        activeEpisodeState = {
          episode: activeEpisodeForCycle,
          ref: activeEpisodeRefForCycle,
          openedCycleId: cycleId
        };
        pendingDeliberationBranch = null;
        report.active_episode_refs = pushUniqueRef(report.active_episode_refs, activeEpisodeRefForCycle);
        report.agency_status.strategic_goal_source = "runtime_rule";
        report.agency_status.cycle_goal_source = cycleGoal.source;
        report.agency_status.builtin_goal_authority = false;
      } else {
        const cycleGoalProvider = await runSocialCycleGoalProvider({
          providerId: input.providerId,
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          context,
          openAi,
          gemini: geminiForProviderCall(),
          modelScope,
          allowedActionSkillIds: allowedSkillIds,
          allowedPrimitiveIds: allowedPrimitives,
          runId
        });

        if (!cycleGoalProvider.ok) {
          providerFailed = true;
          report.provider_error = cycleGoalProvider.error;
          appendProviderErrorRefs({
            report,
            actorDir: paths.actorDir,
            stage: "goal_mind",
            turnId: cycleId,
            error: cycleGoalProvider.error,
            inputRef: cycleGoalProvider.inputRef,
            outputRef: cycleGoalProvider.outputRef
          });
          break;
        }

        cycleGoal = cycleGoalProvider.cycleGoal;
        cycleGoalRef = path.join("goals", "cycle", `${cycleGoal.goal_id}.json`);
        cycleGoalInputRef = cycleGoalProvider.inputRef;
        cycleGoalOutputRef = cycleGoalProvider.outputRef;
        activeEpisodeForCycle = buildActiveEpisodeFromCycleGoal({
          episodeId: `episode-${cycleId}`,
          context,
          cycleGoal,
          selectedPlanBeadRefs: cycleGoal.derived_from.plan_bead_refs ?? [],
          startedAtTurnRef: `${cycleId}-action-01`
        });
        if (pendingDeliberationBranch) {
          activeEpisodeForCycle.opened_from_refs = [
            ...new Set([...activeEpisodeForCycle.opened_from_refs, pendingDeliberationBranch.branchRef])
          ];
        }
        const activeEpisodeWritten = await writeActiveEpisode(
          rootDir,
          input.actorId,
          activeEpisodeForCycle
        );
        activeEpisodeRefForCycle = activeEpisodeWritten.ref;
        activeEpisodeState = {
          episode: activeEpisodeForCycle,
          ref: activeEpisodeRefForCycle,
          openedCycleId: cycleId
        };
        pendingDeliberationBranch = null;
        report.active_episode_refs = pushUniqueRef(report.active_episode_refs, activeEpisodeRefForCycle);
        report.agency_status.strategic_goal_source =
          cycleGoalProvider.source === "llm_planner" ? "llm_planner" : "runtime_rule";
        report.agency_status.cycle_goal_source = cycleGoal.source;
        report.agency_status.builtin_goal_authority = cycleGoal.source === "runtime_rule";
      }

      let lastActionRef = "";
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
        const actionRetryConstraints = deriveRuntimeRetryConstraints({
          actorId: input.actorId,
          attempts: runtimeRetryAttempts
        });
        const baseActionContext: SocialCycleContextPacket =
          actionIndex === 0
            ? context
            : await assembleSocialCycleContext({
                actorWorkspaceRootDir: rootDir,
                actorId: input.actorId,
                soul,
                lifeGoal,
                strategicGoals,
                worldEvents,
                previousJudgments,
                activeActionSkills: executableActiveSkills,
                observation: await observeCurrentActorWorld(),
                allowedPrimitiveIds: allowedPrimitives,
                maxActionsPerCycle: input.maxActionsPerCycle,
                cycleIndex,
                recentToolResults: settlementToolResults,
                postconditionResults: allPostconditionResults,
                evidenceRefs: [
                  ...report.cycles.flatMap((cycle) => cycle.evidence_refs),
                  ...actionAttempts.flatMap((attempt) => attempt.evidence_refs)
                ],
                judgmentRefs: [
                  ...report.cycles.map((cycle) => cycle.judgment_ref).filter(Boolean),
                  ...(lastJudgmentRef ? [lastJudgmentRef] : [])
                ],
                memoryWriteCount,
                runtimeRetryConstraints: actionRetryConstraints,
                planBeadPacket: computeReadyPlanBeads({
                  ...(await loadPlanBeadGraphSnapshot(rootDir, input.actorId)),
                  lifeGoalId: lifeGoal.goal_id,
                  nowIso: new Date().toISOString(),
                  maxReady: 3
                })
              });
        const actionContext: SocialCycleContextPacket = {
          ...baseActionContext,
          runtime_retry_constraints: actionRetryConstraints
        };
        report.runtime_retry_constraints = actionRetryConstraints;
        const planner: ActorTurnProviderResult = await (async () => {
          const episodeId = activeEpisodeForCycle.episode_id;
          const priorActionAttempts = report.cycles.flatMap((cycle) => cycle.action_attempts ?? []);
          const { actorTurnInput, actionCardProjection } = buildActorTurnInput({
            turnId: actionTurnId,
            context: actionContext,
            activeEpisode: activeEpisodeForCycle,
            currentObservationRefs: cycleGoal.derived_from.observation_refs,
            recentEvidenceTrace: evidenceTraceFromActionAttempts({
              cycleId,
              episodeId,
              attempts: [...priorActionAttempts, ...actionAttempts].slice(-4)
            }),
            providerBudgetHint: {
              provider_id: input.providerId,
              model: input.model,
              status: "unknown"
            }
          });
          return runSocialActorTurnProvider({
            providerId: input.providerId,
            actorWorkspaceRootDir: rootDir,
            actorId: input.actorId,
            cycleId,
            cycleGoalId: cycleGoal.goal_id,
            actorTurnInput,
            actionCardProjection,
            openAi,
            gemini: geminiForProviderCall(),
            modelScope,
            defaultPrimitive: actorTurnDefaultPrimitive({
              configured: input.deterministicActorTurnPrimitives,
              cycleIndex,
              actionIndex,
              maxActionsPerCycle: input.maxActionsPerCycle
            }),
            runId
          });
        })();

        if (!planner.ok) {
          if (actorTurnProviderFailureKind(planner) === "provider_contract_rejection") {
            const contractRejection = await buildActorTurnProviderContractRejectionAttempt({
              rootDir,
              actorDir: paths.actorDir,
              actorId: input.actorId,
              runId,
              cycleId,
              turnId: actionTurnId,
              actionIndex,
              cycleGoal,
              activeEpisodeId: activeEpisodeForCycle.episode_id,
              planner
            });
            lastActionRef = contractRejection.attempt.action_ref;
            lastVerifier = "failed";
            lastJudgmentRef = contractRejection.judgmentRef;
            lastJudgment = {
              ref: contractRejection.judgmentRef,
              judgment: contractRejection.judgment
            };
            actionAttempts.push(contractRejection.attempt);
            break;
          }
          providerFailed = true;
          report.provider_error = planner.error;
          appendProviderErrorRefs({
            report,
            actorDir: paths.actorDir,
            stage: "actor_turn",
            turnId: actionTurnId,
            error: planner.error,
            inputRef: planner.inputRef,
            outputRef: planner.outputRef,
            intermediateInputRefs: optionalStringArrayProperty(planner, "intermediateInputRefs"),
            intermediateOutputRefs: optionalStringArrayProperty(planner, "intermediateOutputRefs")
          });
          break;
        }

        const plannedActionRef = planner.actionRef;
        const plannedRuntimeAction: ReportedRuntimeAction = planner.action;
        lastActionRef = plannedActionRef;

        const execution = await executeActorTurnAction({
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          cycleGoal,
          action: planner.action,
          activeActionSkills: executableActiveSkills,
          runtimeRetryConstraints: actionRetryConstraints,
          bot
        });
        const retryAttempt = buildRuntimeRetryAttempt({
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          actionIndex,
          intent: plannedRuntimeAction,
          execution
        });
        if (retryAttempt) {
          runtimeRetryAttempts.push(retryAttempt);
          if (runtimeRetryAttempts.length > 48) {
            runtimeRetryAttempts.splice(0, runtimeRetryAttempts.length - 48);
          }
          report.runtime_retry_constraints = deriveRuntimeRetryConstraints({
            actorId: input.actorId,
            attempts: runtimeRetryAttempts
          });
        }

        lastVerifier = execution.verifierStatus;
        actionSkillExecutionUnit = execution.actionSkillExecutionUnit;
        // Report-level gameplay progress includes verified partial mutation so
        // long runs do not hide useful world changes behind a failed final verifier.
        if (
          isDurableProgressVerifier(execution.verifierStatus, execution.executedTools) ||
          hasPartialVerifiedProgress({ toolStatuses: execution.toolStatuses })
        ) {
          anyMeaningfulProgress = true;
        }
        allPostconditionResults.push(...execution.postconditionResults);
        recentToolResults.push(...execution.toolResults);
        settlementToolResults.push(...execution.toolResults);
        if (recentToolResults.length > 20) {
          recentToolResults.splice(0, recentToolResults.length - 20);
        }

        const judgmentResult: ActorTurnRuntimeClassifierResult = await classifyActorTurnRuntime({
          actorWorkspaceRootDir: rootDir,
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          runId,
          cycleGoal,
          action: plannedRuntimeAction,
          evidenceRefs: execution.evidenceRefs,
          executedTools: execution.executedTools,
          toolStatuses: execution.toolStatuses,
          verifierStatus: execution.verifierStatus,
          retryConstraintBlocked: execution.retryConstraintBlocked
        });

        if (!judgmentResult.ok) {
          providerFailed = true;
          report.provider_error = judgmentResult.error;
          appendProviderErrorRefs({
            report,
            actorDir: paths.actorDir,
            stage: "actor_turn_classifier",
            turnId: actionTurnId,
            error: judgmentResult.error,
            inputRef: optionalStringProperty(judgmentResult, "inputRef"),
            outputRef: optionalStringProperty(judgmentResult, "outputRef")
          });
          break;
        }

        lastJudgmentRef = judgmentResult.judgmentRef;
        lastJudgment = {
          ref: judgmentResult.judgmentRef,
          judgment: judgmentResult.judgment
        };
        const lifecycleBeadOperations = derivePlanBeadLifecycleOperationsFromTurnEvidence({
          actorId: input.actorId,
          cycleId,
          turnId: actionTurnId,
          action: plannedRuntimeAction,
          toolStatuses: execution.toolStatuses,
          evidenceRefs: execution.evidenceRefs,
          beads: (await loadPlanBeadGraphSnapshot(rootDir, input.actorId)).beads
        });
        const beadOperationApplication = await applyPlanBeadOperations({
          rootDir,
          actorId: input.actorId,
          lifeGoalId: lifeGoal.goal_id,
          cycleId,
          turnId: actionTurnId,
          operations: [
            ...(judgmentResult.judgment.bead_op_proposals ?? []),
            ...lifecycleBeadOperations
          ]
        });
        report.plan_bead_operation_results ??= [];
        report.plan_bead_operation_results.push(
          ...beadOperationApplication.results.map((result, index) => ({
            cycle_id: cycleId,
            turn_id: actionTurnId,
            ref: beadOperationApplication.result_refs[index] ?? "",
            op: result.op,
            status: result.status,
            bead_id: result.bead_id,
            reason: result.reason
          }))
        );
        const judgmentInputRef = optionalStringProperty(judgmentResult, "inputRef");
        const judgmentOutputRef = optionalStringProperty(judgmentResult, "outputRef");
        const plannerProviderRefs = providerRefs({
          actorDir: paths.actorDir,
          inputRef: planner.inputRef,
          outputRef: planner.outputRef,
          intermediateInputRefs: optionalStringArrayProperty(planner, "intermediateInputRefs"),
          intermediateOutputRefs: optionalStringArrayProperty(planner, "intermediateOutputRefs")
        });
        const branchRecommended = "branchRecommended" in judgmentResult
          ? judgmentResult.branchRecommended
          : undefined;
        const branchReason = "branchReason" in judgmentResult && judgmentResult.branchReason
          ? judgmentResult.branchReason
          : undefined;
        actionAttempts.push({
          attempt_id: actionTurnId,
          action_index: actionIndex,
          turn_id: actionTurnId,
          active_episode_id: activeEpisodeForCycle.episode_id,
          action_ref: plannedActionRef,
          provider_input_refs: [
            ...plannerProviderRefs.provider_input_refs,
            judgmentInputRef ? path.relative(paths.actorDir, judgmentInputRef) : ""
          ].filter(Boolean),
          provider_output_refs: [
            ...plannerProviderRefs.provider_output_refs,
            judgmentOutputRef ? path.relative(paths.actorDir, judgmentOutputRef) : ""
          ].filter(Boolean),
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
              : "completed",
          retry_constraint_blocked: execution.retryConstraintBlocked,
          branch_recommended: branchRecommended,
          branch_reason: branchReason,
          postcondition_results: execution.postconditionResults,
          plan_bead_operation_result_refs: beadOperationApplication.result_refs
        });

        const memoryWrites = await persistJudgmentMemoryWrites(
          rootDir,
          input.actorId,
          judgmentResult.judgment,
          plannedRuntimeAction,
          execution.executedTools,
          execution.runtimeResult,
          execution.toolStatuses,
          judgmentResult.judgmentRef
        );
        memoryWriteCount += memoryWrites;
        if (report.memory_reuse) {
          report.memory_reuse.memory_writes = memoryWriteCount;
        }
        const relationshipApplications = await applyCycleJudgmentRelationshipEventProposals(
          rootDir,
          judgmentResult.judgment
        );
        report.relationship_application_results?.push(...relationshipApplications);
        await bumpLifeGoalCounters(rootDir, input.actorId, { actions: 1 });

        if (execution.verifierStatus === "passed" || execution.verifierStatus === "failed") {
          break;
        }
      }

      if (providerFailed) {
        break;
      }

      let cycleDeliberationBranchRef: string | undefined;
      let deliberationTriggerReason: DeliberationBranchReason | undefined;
      const postCycleSettlementState = buildSettlementState({
        actorId: input.actorId,
        observation: await observeCurrentActorWorld(),
        activeActionSkills: executableActiveSkills,
        previousJudgments: lastJudgment ? [lastJudgment] : [],
        recentToolResults: settlementToolResults,
        postconditionResults: allPostconditionResults,
        evidenceRefs: [
          ...report.cycles.flatMap((cycle) => cycle.evidence_refs),
          ...actionAttempts.flatMap((attempt) => attempt.evidence_refs)
        ],
        judgmentRefs: [
          ...report.cycles.map((cycle) => cycle.judgment_ref).filter(Boolean),
          ...(lastJudgmentRef ? [lastJudgmentRef] : [])
        ],
        memoryWriteCount
      });
      const branchReason = branchReasonFromActionAttempts(actionAttempts) ??
        branchReasonFromContextSignals({
          activeEpisode: activeEpisodeForCycle,
          context
        });
      if (branchReason && activeEpisodeState) {
        const branchEvidenceRefs = actionAttempts.flatMap((attempt) => attempt.evidence_refs);
        const branch = {
          schema: "deliberation-branch/v1" as const,
          branch_id: `branch-${cycleId}-${randomUUID()}`,
          reason: branchReason,
          evidence_refs: branchEvidenceRefs.length > 0
            ? branchEvidenceRefs
            : lastJudgmentRef
              ? [lastJudgmentRef]
              : [],
          current_episode_ref: activeEpisodeState.ref
        };
        const writtenBranch = await writeDeliberationBranch(rootDir, input.actorId, branch);
        cycleDeliberationBranchRef = writtenBranch.ref;
        deliberationTriggerReason = branchReason;
        pendingDeliberationBranch = {
          branchRef: writtenBranch.ref,
          branch,
          reason: branchReason
        };
        report.deliberation_branch_refs = pushUniqueRef(
          report.deliberation_branch_refs,
          writtenBranch.ref
        );
      }

      report.cycles.push({
        cycle_id: cycleId,
        cycle_goal_ref: cycleGoalRef,
        action_ref: lastActionRef,
        provider_input_refs: [
          cycleGoalInputRef ? path.relative(paths.actorDir, cycleGoalInputRef) : "",
          ...actionAttempts.flatMap((attempt) => attempt.provider_input_refs)
        ].filter(Boolean),
        provider_output_refs: [
          cycleGoalOutputRef ? path.relative(paths.actorDir, cycleGoalOutputRef) : "",
          ...actionAttempts.flatMap((attempt) => attempt.provider_output_refs)
        ].filter(Boolean),
        evidence_refs: actionAttempts.flatMap((attempt) => attempt.evidence_refs),
        judgment_ref: lastJudgmentRef,
        verifier_status: lastVerifier,
        plan_bead_packet_ref: readyFrontSnapshot.ref,
        active_episode_ref: activeEpisodeRefForCycle,
        deliberation_branch_ref: cycleDeliberationBranchRef,
        deliberation_trigger_reason: deliberationTriggerReason,
        selected_plan_bead_refs: activeEpisodeForCycle.selected_plan_bead_refs,
        plan_bead_operation_result_refs: [
          ...cyclePlanBeadOperationResultRefs,
          ...actionAttempts.flatMap((attempt) => attempt.plan_bead_operation_result_refs ?? [])
        ],
        action_attempts: actionAttempts
      } satisfies SocialCycleReportCycleWithAttempts);

      previousCycleJudgment = lastJudgment;
      await bumpLifeGoalCounters(rootDir, input.actorId, { cycles: 1 });
      report.action_skill_execution_unit = actionSkillExecutionUnit;
      report.postcondition_results = allPostconditionResults;
      report.settlement_state = postCycleSettlementState;
      report.settlement_checklist = report.settlement_state.checklist;
      if (
        visualEvidenceRecorder &&
        (cycleIndex + 1) % visualEvidenceRecorder.manifest.interval_cycles === 0
      ) {
        await visualEvidenceRecorder.capture({ cycleId, phase: "cycle_end" });
        report.visual_evidence = visualEvidenceRecorder.manifest;
      }

      // Long runs flush after each cycle so partial progress stays reviewable on failure.
      await writeJson(input.reportPath, report);
    }
  } finally {
    const cleanupErrors: string[] = [];
    if (visualEvidenceRecorder) {
      try {
        const finalCycleId = report.cycles.at(-1)?.cycle_id ?? "final";
        await visualEvidenceRecorder.capture({ cycleId: finalCycleId, phase: "final" });
        report.visual_evidence = visualEvidenceRecorder.manifest;
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
      try {
        await visualEvidenceRecorder.close();
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    sessionLifecycleTracker?.close();
    if (bot) {
      try {
        await closeBots({ [input.actorId]: bot });
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (stopServer) {
      try {
        await stopServer();
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (cleanupErrors.length > 0 && report.server) {
      report.server = {
        ...report.server,
        error: `Post-run cleanup failed: ${cleanupErrors.join("; ")}`
      };
    }
  }

  report.agency_status.gameplay_progress_verified = anyMeaningfulProgress;
  report.runtime_status = finalizeRuntimeStatus(report, {
    providerFailed,
    anyMeaningfulProgress,
    completedCycles: report.cycles.length,
    expectedCycles: input.cycles,
    fixtureDependency: report.agency_status.fixture_dependency,
    environmentBlocked
  });

  if (providerFailed) {
    report.runtime_status = "failed";
  }

  report.provider_usage = await summarizeProviderUsage({ repoRoot, runId });
  await writeJson(input.reportPath, report);
  return { report, reportPath: input.reportPath };
}
