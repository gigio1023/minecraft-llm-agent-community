import type { LongObjectivePhaseReport, LongObjectiveReport } from "./types.js";

export function buildLongObjectiveReviewerTasks(report: LongObjectiveReport): string[] {
  const tasks: string[] = [];
  const failedPhase = report.phases.find((phase) => phase.status === "failed");

  if (report.stopReason === "provider_blocked") {
    tasks.push("Resolve Gemini planner auth/quota/session blocker before retrying gameplay.");
    return tasks;
  }

  if (report.stopReason === "environment_blocked") {
    tasks.push("Fix Minecraft server/docker/auth connectivity, then rerun the same objective.");
    return tasks;
  }

  if (!failedPhase) {
    if (report.status !== "passed") {
      tasks.push("Inspect long-objective report budgets and phase ordering for premature stop.");
    }
    return tasks;
  }

  const blockedHelper = failedPhase.helperEvents.find(
    (event) =>
      event.status === "completed" &&
      typeof event.result === "object" &&
      event.result !== null &&
      (event.result as { status?: unknown }).status === "blocked"
  );

  if (blockedHelper) {
    const reason =
      typeof blockedHelper.result === "object" &&
      blockedHelper.result !== null &&
      typeof (blockedHelper.result as { reason?: unknown }).reason === "string"
        ? (blockedHelper.result as { reason: string }).reason
        : blockedHelper.name;
    if (/not wired|not implemented|needs pathfinder/i.test(reason)) {
      tasks.push(`Implement missing helper for ${failedPhase.phaseId}: ${reason}`);
    } else {
      tasks.push(`Debug helper ${blockedHelper.name} for ${failedPhase.phaseId}: ${reason}`);
    }
  }

  if (failedPhase.generated.execution.status === "rejected") {
    tasks.push("Reject unsafe generated source and tighten planner prompt guardrails.");
  }

  if (failedPhase.generated.execution.status === "timeout") {
    tasks.push(`Increase per-phase timeout or split ${failedPhase.phaseId} into smaller runtime phases.`);
  }

  if (failedPhase.verifierStatus === "failed" && tasks.length === 0) {
    tasks.push(`Fix verifier or gameplay path for ${failedPhase.phaseId}: ${failedPhase.verifierReason}`);
  }

  if ((report.artifactRefs.actorMemoryPaths?.length ?? 0) === 0) {
    tasks.push("Ensure long-objective memory writes occur after each phase for resume.");
  }

  if (tasks.length === 0) {
    tasks.push(`Retry ${failedPhase.phaseId} with improved helper trace review.`);
  }

  return tasks;
}

export function summarizeFailedPhase(phase: LongObjectivePhaseReport | undefined) {
  if (!phase) {
    return "no failed phase recorded";
  }
  return `${phase.phaseId}: ${phase.verifierReason}`;
}
