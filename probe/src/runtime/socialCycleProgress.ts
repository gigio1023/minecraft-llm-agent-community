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

export function deriveProgressVerifierStatus(input: {
  executedTools: string[];
  lastToolStatus: string;
}): "passed" | "failed" | "not_applicable" {
  const meaningful = input.executedTools.filter(isMeaningfulGameplayPrimitive);
  if (meaningful.length === 0) {
    return "not_applicable";
  }
  const lastMeaningful = meaningful[meaningful.length - 1]!;
  const lastIndex = input.executedTools.lastIndexOf(lastMeaningful);
  const status = lastIndex >= 0 ? input.lastToolStatus : "unknown";
  return status === "ok" || status === "waited" || status === "remembered" ? "passed" : "failed";
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
