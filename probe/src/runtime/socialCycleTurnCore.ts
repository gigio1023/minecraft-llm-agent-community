import path from "node:path";
import type { Bot } from "mineflayer";

import {
  runSocialActorTurnProvider,
  type ActorTurnProviderResult
} from "../provider/socialActorTurnProvider.js";
import type { OpenAiJsonProviderConfig } from "../provider/openaiApiJsonProvider.js";
import type { GeminiJsonProviderConfig } from "../provider/geminiApiJsonProvider.js";
import type { ModelScopeApiProviderConfig } from "../provider/modelscopeApiProvider.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { writeActorGoalArtifact } from "./goals/goalJsonStore.js";
import type {
  ActorCycleGoal,
  CycleJudgment,
  SocialCycleProviderId
} from "./goals/types.js";
import {
  classifyActorTurnProviderContractRejection,
  classifyActorTurnRuntime,
  type ActionCardProjection,
  type ActorTurnInput,
  type ActorTurnResolvedAction,
  type ActorTurnRuntimeClassifierResult
} from "./goals/actorEpisode/index.js";
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
import type { ActionSkillPostconditionResult } from "./settlement/settlementState.js";

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

type TurnProviderConfig = {
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  modelScope?: ModelScopeApiProviderConfig;
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
  providerConfig?: TurnProviderConfig;
}): Promise<SocialCycleTurnCoreResult> {
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
    targetBot: input.targetBot
  });
  const retryAttempt = buildRuntimeRetryAttempt({
    actorId: input.actorId,
    cycleId: input.cycleId,
    turnId: input.turnId,
    actionIndex: input.actionIndex,
    intent: plannedRuntimeAction,
    execution
  });

  const judgmentResult = await classifyActorTurnRuntime({
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
    return {
      status: "classifier_failed",
      planner,
      plannedActionRef,
      plannedRuntimeAction,
      execution,
      ...(retryAttempt ? { retryAttempt } : {}),
      judgmentResult
    };
  }

  const refs = providerRefs({
    actorDir: input.actorDir,
    inputRef: planner.inputRef,
    outputRef: planner.outputRef,
    intermediateInputRefs: planner.intermediateInputRefs,
    intermediateOutputRefs: planner.intermediateOutputRefs
  });
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
    attempt: {
      attempt_id: input.turnId,
      action_index: input.actionIndex,
      turn_id: input.turnId,
      active_episode_id: input.activeEpisodeId,
      action_ref: plannedActionRef,
      provider_input_refs: [
        ...refs.provider_input_refs,
        judgmentInputRef ? path.relative(input.actorDir, judgmentInputRef) : ""
      ].filter(Boolean),
      provider_output_refs: [
        ...refs.provider_output_refs,
        judgmentOutputRef ? path.relative(input.actorDir, judgmentOutputRef) : ""
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
      plan_bead_operation_result_refs: []
    }
  };
}
