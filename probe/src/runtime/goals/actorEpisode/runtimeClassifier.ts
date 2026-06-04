import { writeCycleJudgment } from "../cycleJudgmentStore.js";
import {
  validateCycleJudgment,
  type ActorCycleGoal,
  type CycleJudgment
} from "../types.js";
import type { ActorTurnResolvedAction } from "./types.js";
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
  action: ActorTurnResolvedAction;
  outcome: CycleJudgment["outcome"];
  verifierStatus: CycleJudgment["verifier_status"];
  evidenceRefCount: number;
}): CycleJudgment["memory_writes"] {
  if (input.outcome === "no_progress") {
    return [];
  }
  const layer = input.outcome === "blocked" ? "procedural" : "episodic";
  const actionId = actorTurnActionRuntimeLabel(input.action);
  return [
    {
      layer,
      summary:
        `Actor Turn runtime classified ${actionId} as ${input.outcome}; verifier=${input.verifierStatus}; evidence_refs=${input.evidenceRefCount}.`,
      confidence: "observed"
    }
  ];
}

function actorTurnActionRuntimeLabel(action: ActorTurnResolvedAction) {
  if (action.kind === "use_primitive") {
    return `primitive:${action.primitive_id}`;
  }
  if (action.kind === "use_action_skill") {
    return `action_skill:${action.action_skill_id}`;
  }
  return action.kind;
}

/**
 * Records an Actor Turn selection that failed provider-to-runtime contracts.
 *
 * @remarks This is intentionally not repaired into a fallback action here. A
 * contract rejection is useful no-progress evidence for the next Actor Turn,
 * but it must not become hidden movement, hidden placement, or fake progress.
 */
export async function classifyActorTurnProviderContractRejection(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  turnId: string;
  runId?: string;
  cycleGoal: ActorCycleGoal;
  error: string;
  evidenceRefs: readonly string[];
}): Promise<ActorTurnRuntimeClassifierResult> {
  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    ...(input.runId ? { run_id: input.runId } : {}),
    cycle_goal_id: input.cycleGoal.goal_id,
    outcome: "blocked",
    what_happened:
      `Actor Turn provider output was rejected after bounded repair: ${input.error}. No Minecraft action was executed.`,
    why_it_mattered_for_life_goal:
      "The actor tried to act, but the selected Action Card did not satisfy runtime contracts. Recording this as blocked evidence preserves the mistake for the next turn without granting executable authority from prose or malformed parameters.",
    verifier_status: "failed",
    evidence_refs: [...input.evidenceRefs],
    memory_writes: [
      {
        layer: "procedural",
        summary:
          `Actor Turn contract rejection: ${input.error}. Next turn must choose a visible Action Card with schema-valid logical parameters, or author a specific helper if no card can express the needed action.`,
        confidence: "observed"
      }
    ],
    relationship_event_proposals: [],
    next_goal_context: [
      "Provider contract rejection is a blocked action attempt, not world progress.",
      "Next Actor Turn should pivot to schema-valid parameters, a different visible Action Card, or author_mineflayer_action with full context."
    ],
    bead_op_proposals: []
  };
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
    branchRecommended: true,
    branchReason: "actor turn provider contract rejected after repair"
  };
}

/**
 * Classifies an Actor Turn from runtime evidence without another provider call.
 *
 * @remarks This writes a CycleJudgment-compatible artifact only for report and
 * memory readers. It intentionally avoids an extra judgment-provider call on the
 * ordinary hot path. Durable PlanBead creation/update should happen in explicit
 * lifecycle or branch-time Deliberation code, not by parsing classifier prose.
 */
export async function classifyActorTurnRuntime(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  turnId: string;
  runId?: string;
  cycleGoal: ActorCycleGoal;
  action: ActorTurnResolvedAction;
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
        `Runtime evidence for ${input.cycleGoal.goal_id} updates the active episode under ActorSoul/LifeGoal context. This classifier records executed-tool results only; it does not assert unscanned world state, infer PlanBead operations from prose, or grant executable authority.`,
      verifier_status: input.verifierStatus,
      evidence_refs: [...input.evidenceRefs],
      memory_writes: memoryWritesForRuntime({
        action: input.action,
        outcome,
        verifierStatus: input.verifierStatus,
        evidenceRefCount: input.evidenceRefs.length
      }),
      relationship_event_proposals: [],
      next_goal_context: reason
        ? [`Branch consideration: ${reason}.`]
        : ["Continue the active episode using the next Actor Turn evidence trace."],
      bead_op_proposals: []
    },
    action: input.action,
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
