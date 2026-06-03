import { writeCycleJudgment } from "../cycleJudgmentStore.js";
import {
  validateCycleJudgment,
  type ActionIntent,
  type ActorCycleGoal,
  type CycleJudgment
} from "../types.js";
import {
  clampCycleJudgmentOutcome,
  deterministicJudgmentOutcome,
  type SocialPrimitiveAttemptStatus
} from "../../socialCycleProgress.js";

export type ActorTurnRuntimeClassifierResult =
  | {
      ok: true;
      judgment: CycleJudgment;
      judgmentRef: string;
      branchRecommended: boolean;
      branchReason: string;
    }
  | { ok: false; error: string };

function runtimeStatusSummary(input: {
  verifierStatus: CycleJudgment["verifier_status"];
  executedTools: readonly string[];
  toolStatuses: readonly SocialPrimitiveAttemptStatus[];
}) {
  const statusText = input.toolStatuses
    .map((status) => `${status.tool}:${status.status}`)
    .join(", ");
  return `Runtime classifier saw verifier=${input.verifierStatus}, tools=${input.executedTools.join(",") || "none"}${statusText ? `, statuses=${statusText}` : ""}.`;
}

function branchReason(input: {
  verifierStatus: CycleJudgment["verifier_status"];
  retryConstraintBlocked?: boolean;
}) {
  if (input.retryConstraintBlocked) {
    return "exact runtime retry constraint blocked this turn";
  }
  if (input.verifierStatus === "failed") {
    return "runtime verifier failed";
  }
  return "";
}

function memoryWritesForRuntime(input: {
  intent: ActionIntent;
  outcome: CycleJudgment["outcome"];
}): CycleJudgment["memory_writes"] {
  if (input.outcome === "no_progress") {
    return [];
  }
  const layer = input.outcome === "blocked" ? "procedural" : "episodic";
  return [
    {
      layer,
      summary: input.intent.why_this_action,
      confidence: "observed"
    }
  ];
}

/**
 * Classifies an Actor Turn from runtime evidence without another provider call.
 *
 * @remarks This writes a CycleJudgment-compatible artifact only for migration:
 * it preserves report, memory, settlement, and previous-judgment readers while
 * moving ordinary Actor Turn evaluation out of the LLM hot path.
 */
export async function classifyActorTurnRuntime(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  turnId: string;
  runId?: string;
  cycleGoal: ActorCycleGoal;
  actionIntent: ActionIntent;
  evidenceRefs: readonly string[];
  executedTools: readonly string[];
  toolStatuses: readonly SocialPrimitiveAttemptStatus[];
  verifierStatus: CycleJudgment["verifier_status"];
  retryConstraintBlocked?: boolean;
}): Promise<ActorTurnRuntimeClassifierResult> {
  const outcome = deterministicJudgmentOutcome({
    verifierStatus: input.verifierStatus,
    executedTools: [...input.executedTools],
    toolStatuses: input.toolStatuses
  });
  const reason = branchReason({
    verifierStatus: input.verifierStatus,
    retryConstraintBlocked: input.retryConstraintBlocked
  });
  const judgment = clampCycleJudgmentOutcome({
    judgment: {
      schema: "cycle-judgment/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      ...(input.runId ? { run_id: input.runId } : {}),
      cycle_goal_id: input.cycleGoal.goal_id,
      outcome,
      what_happened: runtimeStatusSummary(input),
      why_it_mattered_for_life_goal:
        `${input.cycleGoal.summary} remains bounded by runtime evidence; this classifier does not create PlanBead operations or executable authority.`,
      verifier_status: input.verifierStatus,
      evidence_refs: [...input.evidenceRefs],
      memory_writes: memoryWritesForRuntime({
        intent: input.actionIntent,
        outcome
      }),
      relationship_event_proposals: [],
      next_goal_context: reason
        ? [`Branch consideration: ${reason}.`]
        : ["Continue the active episode using the next Actor Turn evidence trace."],
      bead_op_proposals: []
    },
    actionIntent: input.actionIntent,
    executedTools: [...input.executedTools],
    toolStatuses: input.toolStatuses
  });

  const validated = validateCycleJudgment(judgment);
  if (!validated.ok) {
    return { ok: false, error: validated.errors.join("; ") };
  }

  const { ref } = await writeCycleJudgment(
    input.actorWorkspaceRootDir,
    input.actorId,
    validated.judgment,
    input.turnId
  );

  return {
    ok: true,
    judgment: validated.judgment,
    judgmentRef: ref,
    branchRecommended: reason.length > 0,
    branchReason: reason
  };
}
