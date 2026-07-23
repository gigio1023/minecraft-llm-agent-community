import path from "node:path";
import type { Bot } from "mineflayer";

import {
  runSocialActorTurnProvider,
  type ActorTurnProviderResult
} from "../provider/socialActorTurnProvider.js";
import type { OpenAiJsonProviderConfig } from "../provider/openaiApiJsonProvider.js";
import type { GeminiJsonProviderConfig } from "../provider/geminiApiJsonProvider.js";
import type { ModelScopeApiProviderConfig } from "../provider/modelscopeApiProvider.js";
import type { ModelStudioApiProviderConfig } from "../provider/modelStudioApiProvider.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { writeActorGoalArtifact } from "./goals/goalJsonStore.js";
import {
  validateCycleJudgment,
  type ActorCycleGoal,
  type CycleJudgment,
  type SocialCycleProviderId
} from "./goals/types.js";
import {
  classifyActorTurnProviderContractRejection,
  classifyActorTurnRuntime,
  type ActionCardProjection,
  type ActorTurnInput,
  type ActorTurnResolvedAction,
  type ActorTurnRuntimeClassifierResult
} from "./goals/actorEpisode/index.js";
import { writeCycleJudgment } from "./goals/cycleJudgmentStore.js";
import {
  executeActorTurnAction,
  type SocialCycleExecutionResult
} from "./socialCycleExecution.js";
import {
  buildRuntimeRetryAttempt,
  type RuntimeRetryAttempt,
  type RuntimeRetryConstraint
} from "./retryConstraints.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import type { SocialPrimitiveAttemptStatus } from "./socialCycleProgress.js";
import { deterministicJudgmentOutcome } from "./socialCycleProgress.js";
import type { ActionSkillPostconditionResult } from "./settlement/settlementState.js";
import type { ObserveChatEvent } from "../tools/observe.js";

export type SocialCycleActionAttemptReport = {
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

export type SocialCycleRuntimeClassifier = typeof classifyActorTurnRuntime;

type TurnProviderConfig = {
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  modelScope?: ModelScopeApiProviderConfig;
  modelStudio?: ModelStudioApiProviderConfig;
};

export function actorRelativeRef(actorDir: string, ref: string | undefined) {
  if (!ref) {
    return undefined;
  }
  return path.isAbsolute(ref) ? path.relative(actorDir, ref) : ref;
}

export function optionalStringProperty(value: unknown, key: string) {
  return value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>)[key] === "string"
    ? (value as Record<string, string>)[key]
    : undefined;
}

export function optionalStringArrayProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return Array.isArray(candidate) && candidate.every((entry) => typeof entry === "string")
    ? candidate
    : undefined;
}

export function providerRefs(input: {
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

function buildExecutedActionAttempt(input: {
  actorDir: string;
  turnId: string;
  actionIndex: number;
  activeEpisodeId?: string;
  plannedActionRef: string;
  planner: Extract<ActorTurnProviderResult, { ok: true }>;
  execution: SocialCycleExecutionResult;
  judgmentRef: string;
  judgmentInputRef?: string;
  judgmentOutputRef?: string;
  branchRecommended?: boolean;
  branchReason?: string;
  runtimeStatusOverride?: string;
}): SocialCycleActionAttemptReport {
  const refs = providerRefs({
    actorDir: input.actorDir,
    inputRef: input.planner.inputRef,
    outputRef: input.planner.outputRef,
    intermediateInputRefs: input.planner.intermediateInputRefs,
    intermediateOutputRefs: input.planner.intermediateOutputRefs
  });
  return {
    attempt_id: input.turnId,
    action_index: input.actionIndex,
    turn_id: input.turnId,
    active_episode_id: input.activeEpisodeId,
    action_ref: input.plannedActionRef,
    provider_input_refs: [
      ...refs.provider_input_refs,
      input.judgmentInputRef ? path.relative(input.actorDir, input.judgmentInputRef) : ""
    ].filter(Boolean),
    provider_output_refs: [
      ...refs.provider_output_refs,
      input.judgmentOutputRef ? path.relative(input.actorDir, input.judgmentOutputRef) : ""
    ].filter(Boolean),
    evidence_refs: input.execution.evidenceRefs,
    judgment_ref: input.judgmentRef,
    verifier_status: input.execution.verifierStatus,
    executed_tools: input.execution.executedTools,
    tool_statuses: input.execution.toolStatuses,
    runtime_result: input.execution.runtimeResult,
    runtime_status:
      input.runtimeStatusOverride ??
      (input.execution.gateBlocked
        ? "blocked"
        : input.execution.verifierStatus === "failed"
          ? "failed"
          : "completed"),
    retry_constraint_blocked: input.execution.retryConstraintBlocked,
    branch_recommended: input.branchRecommended,
    branch_reason: input.branchReason,
    postcondition_results: input.execution.postconditionResults,
    plan_bead_operation_result_refs: []
  };
}

async function writeRuntimeClassifierFailureJudgment(input: {
  rootDir: string;
  actorId: string;
  runId: string;
  cycleId: string;
  turnId: string;
  cycleGoal: ActorCycleGoal;
  execution: SocialCycleExecutionResult;
  error: string;
}): Promise<{
  judgment: CycleJudgment;
  judgmentRef: string;
  branchRecommended: true;
  branchReason: string;
}> {
  const branchReason = "runtime classifier failed after action execution";
  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    run_id: input.runId,
    cycle_goal_id: input.cycleGoal.goal_id,
    outcome: deterministicJudgmentOutcome({
      verifierStatus: input.execution.verifierStatus,
      executedTools: input.execution.executedTools,
      toolStatuses: input.execution.toolStatuses
    }),
    what_happened:
      `The Minecraft action completed, but runtime result classification failed: ${input.error}. ` +
      "The execution evidence remains authoritative and is retained on this action attempt.",
    why_it_mattered_for_life_goal:
      "The run must stop for runtime diagnosis without discarding verified world or inventory changes and without relabeling the failure as a provider error.",
    verifier_status: input.execution.verifierStatus,
    evidence_refs: [...input.execution.evidenceRefs],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: [
      "Inspect the runtime classifier failure and the retained execution evidence before continuing."
    ],
    bead_op_proposals: []
  };
  const validated = validateCycleJudgment(judgment);
  if (!validated.ok) {
    throw new Error(
      `failed to write runtime classifier failure judgment: ${validated.errors.join("; ")}`
    );
  }
  const { ref } = await writeCycleJudgment(
    input.rootDir,
    input.actorId,
    validated.judgment,
    input.turnId
  );
  return {
    judgment: validated.judgment,
    judgmentRef: ref,
    branchRecommended: true,
    branchReason
  };
}

export function actorTurnProviderFailureKind(
  result: ActorTurnProviderResult
) {
  return !result.ok && "failureKind" in result ? result.failureKind : undefined;
}

export async function buildActorTurnProviderContractRejectionAttempt(input: {
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

export type SocialCycleTurnCoreResult =
  | {
      status: "completed";
      planner: Extract<ActorTurnProviderResult, { ok: true }>;
      plannedActionRef: string;
      plannedRuntimeAction: ActorTurnResolvedAction;
      execution: SocialCycleExecutionResult;
      retryAttempt?: RuntimeRetryAttempt;
      judgment: CycleJudgment;
      judgmentRef: string;
      judgmentResult: Extract<ActorTurnRuntimeClassifierResult, { ok: true }>;
      attempt: SocialCycleActionAttemptReport;
    }
  | {
      status: "provider_contract_rejection";
      attempt: SocialCycleActionAttemptReport;
      judgment: CycleJudgment;
      judgmentRef: string;
    }
  | {
      status: "provider_failed";
      planner: Extract<ActorTurnProviderResult, { ok: false }>;
    }
  | {
      status: "classifier_failed";
      planner: Extract<ActorTurnProviderResult, { ok: true }>;
      plannedActionRef: string;
      plannedRuntimeAction: ActorTurnResolvedAction;
      execution: SocialCycleExecutionResult;
      retryAttempt?: RuntimeRetryAttempt;
      judgmentResult: Extract<ActorTurnRuntimeClassifierResult, { ok: false }>;
      judgment: CycleJudgment;
      judgmentRef: string;
      attempt: SocialCycleActionAttemptReport;
    };

export async function runSocialCycleTurnCore(input: {
  providerId: SocialCycleProviderId;
  actorWorkspaceRootDir: string;
  actorDir: string;
  actorId: string;
  runId: string;
  cycleId: string;
  turnId: string;
  actionIndex: number;
  cycleGoal: ActorCycleGoal;
  cycleGoalId: string;
  activeEpisodeId?: string;
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  activeActionSkills: readonly ActorActionSkillRecord[];
  runtimeRetryConstraints?: readonly RuntimeRetryConstraint[];
  defaultPrimitive?: string;
  bot?: Bot;
  targetBot?: Bot;
  otherBots?: readonly Bot[];
  chatEvents?: readonly ObserveChatEvent[];
  providerConfig?: TurnProviderConfig;
  /** Case-budget abort; threaded into action execution for abort+await cleanup. */
  signal?: AbortSignal;
  /** Test-only replacement for the deterministic post-action classifier. */
  classifyRuntimeForTest?: SocialCycleRuntimeClassifier;
}): Promise<SocialCycleTurnCoreResult> {
  // Prefer early abort over starting provider planning when the case budget
  // (or external) signal already fired. Deep HTTP cancel is out of scope here.
  if (input.signal?.aborted) {
    return {
      status: "provider_failed",
      planner: {
        ok: false,
        errorKind: "case_budget_aborted",
        error:
          "Case budget abort: provider planning skipped because AbortSignal was already aborted.",
        inputRef: "",
        outputRef: ""
      }
    };
  }

  const planner = await runSocialActorTurnProvider({
    providerId: input.providerId,
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    cycleGoalId: input.cycleGoalId,
    actorTurnInput: input.actorTurnInput,
    actionCardProjection: input.actionCardProjection,
    openAi: input.providerConfig?.openAi,
    gemini: input.providerConfig?.gemini,
    modelScope: input.providerConfig?.modelScope,
    modelStudio: input.providerConfig?.modelStudio,
    defaultPrimitive: input.defaultPrimitive,
    runId: input.runId
  });

  if (!planner.ok) {
    if (actorTurnProviderFailureKind(planner) === "provider_contract_rejection") {
      const rejection = await buildActorTurnProviderContractRejectionAttempt({
        rootDir: input.actorWorkspaceRootDir,
        actorDir: input.actorDir,
        actorId: input.actorId,
        runId: input.runId,
        cycleId: input.cycleId,
        turnId: input.turnId,
        actionIndex: input.actionIndex,
        cycleGoal: input.cycleGoal,
        activeEpisodeId: input.activeEpisodeId,
        planner
      });
      return {
        status: "provider_contract_rejection",
        ...rejection
      };
    }
    return {
      status: "provider_failed",
      planner
    };
  }

  const plannedActionRef = planner.actionRef;
  const plannedRuntimeAction = planner.action;
  const execution = await executeActorTurnAction({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    cycleGoal: input.cycleGoal,
    action: planner.action,
    activeActionSkills: input.activeActionSkills,
    runtimeRetryConstraints: input.runtimeRetryConstraints,
    bot: input.bot,
    targetBot: input.targetBot,
    ...(input.otherBots ? { otherBots: input.otherBots } : {}),
    ...(input.chatEvents ? { chatEvents: input.chatEvents } : {}),
    ...(input.signal ? { signal: input.signal } : {})
  });
  const retryAttempt = buildRuntimeRetryAttempt({
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    actionIndex: input.actionIndex,
    intent: plannedRuntimeAction,
    execution
  });

  const judgmentResult = await (input.classifyRuntimeForTest ?? classifyActorTurnRuntime)({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    runId: input.runId,
    cycleGoal: input.cycleGoal,
    action: plannedRuntimeAction,
    evidenceRefs: execution.evidenceRefs,
    executedTools: execution.executedTools,
    toolStatuses: execution.toolStatuses,
    verifierStatus: execution.verifierStatus,
    retryConstraintBlocked: execution.retryConstraintBlocked
  });

  if (!judgmentResult.ok) {
    const fallback = await writeRuntimeClassifierFailureJudgment({
      rootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      runId: input.runId,
      cycleId: input.cycleId,
      turnId: input.turnId,
      cycleGoal: input.cycleGoal,
      execution,
      error: judgmentResult.error
    });
    return {
      status: "classifier_failed",
      planner,
      plannedActionRef,
      plannedRuntimeAction,
      execution,
      ...(retryAttempt ? { retryAttempt } : {}),
      judgmentResult,
      judgment: fallback.judgment,
      judgmentRef: fallback.judgmentRef,
      attempt: buildExecutedActionAttempt({
        actorDir: input.actorDir,
        turnId: input.turnId,
        actionIndex: input.actionIndex,
        activeEpisodeId: input.activeEpisodeId,
        plannedActionRef,
        planner,
        execution,
        judgmentRef: fallback.judgmentRef,
        branchRecommended: fallback.branchRecommended,
        branchReason: fallback.branchReason,
        runtimeStatusOverride: "classifier_failed"
      })
    };
  }
  const judgmentInputRef = optionalStringProperty(judgmentResult, "inputRef");
  const judgmentOutputRef = optionalStringProperty(judgmentResult, "outputRef");
  const branchRecommended = "branchRecommended" in judgmentResult
    ? judgmentResult.branchRecommended
    : undefined;
  const branchReason = "branchReason" in judgmentResult && judgmentResult.branchReason
    ? judgmentResult.branchReason
    : undefined;

  return {
    status: "completed",
    planner,
    plannedActionRef,
    plannedRuntimeAction,
    execution,
    ...(retryAttempt ? { retryAttempt } : {}),
    judgment: judgmentResult.judgment,
    judgmentRef: judgmentResult.judgmentRef,
    judgmentResult,
    attempt: buildExecutedActionAttempt({
      actorDir: input.actorDir,
      turnId: input.turnId,
      actionIndex: input.actionIndex,
      activeEpisodeId: input.activeEpisodeId,
      plannedActionRef,
      planner,
      execution,
      judgmentRef: judgmentResult.judgmentRef,
      judgmentInputRef,
      judgmentOutputRef,
      branchRecommended,
      branchReason
    })
  };
}
