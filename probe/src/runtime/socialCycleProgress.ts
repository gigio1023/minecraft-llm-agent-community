import type { CycleJudgment, CycleJudgmentOutcome } from "./goals/types.js";

type JudgmentAction = {
  kind: string;
  action_skill_id?: string;
};

/** Primitives that refresh state but do not by themselves satisfy gather/craft cycle goals. */
export const SOCIAL_OBSERVATION_ONLY_PRIMITIVES = new Set([
  "observe",
  "wait",
  "remember",
  "say"
]);

export function isMeaningfulGameplayPrimitive(primitiveId: string): boolean {
  return !SOCIAL_OBSERVATION_ONLY_PRIMITIVES.has(primitiveId);
}

export function isDurableGameplayPrimitive(primitiveId: string): boolean {
  return isMeaningfulGameplayPrimitive(primitiveId) &&
    primitiveId !== "move_to" &&
    primitiveId !== "equip_item" &&
    primitiveId !== "inspect_chest";
}

export type SocialPrimitiveAttemptStatus = {
  tool: string;
  status: string;
};

/** Converts primitive-level statuses into the verifier status stored on a cycle attempt. */
export function deriveProgressVerifierStatus(input: {
  toolAttempts?: readonly SocialPrimitiveAttemptStatus[];
  executedTools?: readonly string[];
  lastToolStatus?: string;
  toolStatuses?: readonly SocialPrimitiveAttemptStatus[];
}): "passed" | "failed" | "not_applicable" {
  const statusRows =
    input.toolAttempts ??
    input.toolStatuses ??
    (input.executedTools && input.lastToolStatus
      ? [{ tool: input.executedTools[input.executedTools.length - 1] ?? "unknown", status: input.lastToolStatus }]
      : []);
  const executedTools = input.executedTools ?? statusRows.map((entry) => entry.tool);
  const meaningful = executedTools.filter(isMeaningfulGameplayPrimitive);
  if (meaningful.length === 0) {
    return "not_applicable";
  }

  const lastMeaningfulStatus = [...statusRows]
    .reverse()
    .find((entry) => isMeaningfulGameplayPrimitive(entry.tool));

  if (!lastMeaningfulStatus) {
    return "failed";
  }

  return isSuccessfulMeaningfulToolStatus(lastMeaningfulStatus.tool, lastMeaningfulStatus.status)
    ? "passed"
    : "failed";
}

/**
 * Detects current-run mutation that should be preserved without claiming final success.
 *
 * @remarks This protects runs such as partial block placement: useful evidence
 * should survive review, but it must not become a completed shelter/home claim.
 */
export function hasPartialVerifiedProgress(input: {
  toolAttempts?: readonly SocialPrimitiveAttemptStatus[];
  toolStatuses?: readonly SocialPrimitiveAttemptStatus[];
}) {
  const statusRows = input.toolAttempts ?? input.toolStatuses ?? [];
  return statusRows.some((entry) =>
    isPartialMeaningfulToolStatus(entry.tool, entry.status)
  );
}

export function isMeaningfulProgressVerifier(
  verifierStatus: "passed" | "failed" | "not_applicable",
  executedTools: string[]
): boolean {
  return (
    verifierStatus === "passed" &&
    executedTools.some(isMeaningfulGameplayPrimitive)
  );
}

export function isMovementOnlyVerifier(
  verifierStatus: "passed" | "failed" | "not_applicable",
  executedTools: string[]
): boolean {
  return (
    verifierStatus === "passed" &&
    executedTools.includes("move_to") &&
    executedTools.every((tool) =>
      tool === "move_to" || SOCIAL_OBSERVATION_ONLY_PRIMITIVES.has(tool)
    )
  );
}

export function isDurableProgressVerifier(
  verifierStatus: "passed" | "failed" | "not_applicable",
  executedTools: string[]
): boolean {
  return (
    verifierStatus === "passed" &&
    executedTools.some(isDurableGameplayPrimitive)
  );
}

/** Rejects provider-written outcomes that are stronger than runtime evidence supports. */
export function clampCycleJudgmentOutcome(input: {
  judgment: CycleJudgment;
  action?: JudgmentAction;
  executedTools: string[];
  toolStatuses?: readonly SocialPrimitiveAttemptStatus[];
}): CycleJudgment {
  if (
    input.judgment.outcome !== "verified_progress" &&
    input.judgment.outcome !== "partial_verified_progress"
  ) {
    return input.judgment;
  }

  const durable = input.executedTools.filter(isDurableGameplayPrimitive);
  if (durable.length === 0) {
    return { ...input.judgment, outcome: "no_progress" };
  }

  const hasPartial = hasPartialVerifiedProgress({ toolStatuses: input.toolStatuses });

  if (
    input.judgment.outcome === "verified_progress" &&
    input.judgment.verifier_status !== "passed"
  ) {
    return {
      ...input.judgment,
      outcome: hasPartial ? "partial_verified_progress" : "blocked"
    };
  }

  if (
    input.judgment.outcome === "partial_verified_progress" &&
    input.judgment.verifier_status === "passed"
  ) {
    return { ...input.judgment, outcome: "verified_progress" };
  }

  if (input.judgment.outcome === "partial_verified_progress" && !hasPartial) {
    return { ...input.judgment, outcome: "blocked" };
  }

  if (
    input.action?.kind === "use_action_skill" &&
    input.action.action_skill_id === "runtimeObserveAndRemember" &&
    input.executedTools.every((tool) => SOCIAL_OBSERVATION_ONLY_PRIMITIVES.has(tool))
  ) {
    return { ...input.judgment, outcome: "no_progress" };
  }

  return input.judgment;
}

/** Deterministic provider baseline mirrors the same full/partial/blocked semantics as LLM runs. */
export function deterministicJudgmentOutcome(input: {
  verifierStatus: CycleJudgment["verifier_status"];
  executedTools: string[];
  toolStatuses?: readonly SocialPrimitiveAttemptStatus[];
}): CycleJudgmentOutcome {
  if (isDurableProgressVerifier(input.verifierStatus, input.executedTools)) {
    return "verified_progress";
  }
  if (
    input.verifierStatus === "failed" &&
    hasPartialVerifiedProgress({ toolStatuses: input.toolStatuses })
  ) {
    return "partial_verified_progress";
  }
  if (input.verifierStatus === "failed") {
    return "blocked";
  }
  return "no_progress";
}

export function isSuccessfulMeaningfulToolStatus(tool: string, status: string): boolean {
  switch (tool) {
    case "collect_logs":
      return status === "collected";
    case "mine_block":
      return status === "mined";
    case "craft_item":
    case "craft_with_table":
      return status === "crafted";
    case "consume_item":
      return status === "consumed";
    case "equip_item":
      return status === "equipped" || status === "already_equipped";
    case "run_mineflayer_program":
      return status === "completed_with_evidence";
    case "place_block":
      return status === "placed" || status === "already_present";
    case "build_pattern":
      return status === "built";
    case "inspect_chest":
      return status === "inspected";
    case "deposit_shared":
      return status === "deposited";
    case "withdraw_shared":
      return status === "withdrawn";
    case "move_to":
      return status === "arrived" || status === "moved";
    default:
      return false;
  }
}

export function isPartialMeaningfulToolStatus(tool: string, status: string): boolean {
  switch (tool) {
    case "build_pattern":
      return status === "progressing";
    default:
      return false;
  }
}
