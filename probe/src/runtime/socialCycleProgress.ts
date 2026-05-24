import type { ActionIntent, CycleJudgment, CycleJudgmentOutcome } from "./goals/types.js";

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

export type SocialPrimitiveAttemptStatus = {
  tool: string;
  status: string;
};

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

export function isMeaningfulProgressVerifier(
  verifierStatus: "passed" | "failed" | "not_applicable",
  executedTools: string[]
): boolean {
  return (
    verifierStatus === "passed" &&
    executedTools.some(isMeaningfulGameplayPrimitive)
  );
}

export function clampCycleJudgmentOutcome(input: {
  judgment: CycleJudgment;
  actionIntent: ActionIntent;
  executedTools: string[];
}): CycleJudgment {
  if (input.judgment.outcome !== "verified_progress") {
    return input.judgment;
  }

  const meaningful = input.executedTools.filter(isMeaningfulGameplayPrimitive);
  if (meaningful.length === 0) {
    return { ...input.judgment, outcome: "no_progress" };
  }

  if (
    input.actionIntent.kind === "use_action_skill" &&
    input.actionIntent.action_skill_id === "runtimeObserveAndRemember" &&
    meaningful.every((tool) => SOCIAL_OBSERVATION_ONLY_PRIMITIVES.has(tool))
  ) {
    return { ...input.judgment, outcome: "no_progress" };
  }

  return input.judgment;
}

export function deterministicJudgmentOutcome(input: {
  verifierStatus: CycleJudgment["verifier_status"];
  executedTools: string[];
}): CycleJudgmentOutcome {
  if (isMeaningfulProgressVerifier(input.verifierStatus, input.executedTools)) {
    return "verified_progress";
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
