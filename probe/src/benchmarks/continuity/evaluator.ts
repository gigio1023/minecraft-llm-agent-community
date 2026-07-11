/**
 * Offline goal-continuity evaluator.
 *
 * Joins saved PlanBead operation results, Active Episode, ready-front, and
 * optional CapabilityEvidenceBag artifacts. Memory/PlanBead prose may prove
 * continuity state but never physical progress.
 */

import {
  evaluateCapabilityMilestone,
  evaluateCapabilityPredicate,
  type CapabilityFailureClassV1,
  type CapabilityInterpretationStatusV1,
  type CapabilityMilestoneReportV1,
  type CapabilityPredicateResultV1
} from "../capability/index.js";
import type {
  GoalContinuityActiveEpisodeArtifactV1,
  GoalContinuityArtifactBagV1,
  GoalContinuityCaseV1,
  GoalContinuityCheckpointConflictV1,
  GoalContinuityContinuitySectionV1,
  GoalContinuityFindingV1,
  GoalContinuityLifecycleEventV1,
  GoalContinuityLifecycleObservationV1,
  GoalContinuityMemoryNoteArtifactV1,
  GoalContinuityPhysicalSectionV1,
  GoalContinuityPlanBeadOperationResultArtifactV1,
  GoalContinuityPlanBeadSnapshotArtifactV1,
  GoalContinuityReadyFrontArtifactV1,
  GoalContinuityReferencedArtifactV1,
  GoalContinuityReportV1
} from "./types.js";
import { GOAL_CONTINUITY_REPORT_SCHEMA } from "./types.js";

export type EvaluateGoalContinuityInput = {
  suite_id: string;
  suite_version: string;
  case: GoalContinuityCaseV1;
  artifact_bag: GoalContinuityArtifactBagV1;
  run_id?: string;
};

function dedupeRefs(refs: readonly string[]): string[] {
  return [...new Set(refs.filter((ref) => typeof ref === "string" && ref.trim().length > 0))];
}

function isStrongPhysicalEvidenceRef(ref: string): boolean {
  return (
    ref.startsWith("evidence/") ||
    ref.startsWith("settlement/") ||
    ref.startsWith("relationships/") ||
    ref.startsWith("reviews/applied-relationship-proposals/")
  );
}

function isProseOnlyEvidenceRef(ref: string): boolean {
  return (
    ref.startsWith("memory/") ||
    ref.startsWith("plan-beads/") ||
    ref.startsWith("planbeads/") ||
    ref.includes("plan-bead") ||
    ref.includes("memory-note")
  );
}

function presentArtifacts<T>(
  entries: GoalContinuityReferencedArtifactV1[],
  schema: string
): Array<{ ref: string; artifact: T }> {
  const out: Array<{ ref: string; artifact: T }> = [];
  for (const entry of entries) {
    if (!entry.present || entry.artifact === undefined) {
      continue;
    }
    if ((entry.artifact as { schema?: string }).schema !== schema) {
      continue;
    }
    out.push({ ref: entry.ref, artifact: entry.artifact as T });
  }
  return out;
}

function collectMissingRefs(bag: GoalContinuityArtifactBagV1): string[] {
  const missing = new Set<string>();
  for (const ref of bag.required_refs) {
    const found =
      bag.plan_bead_operation_results.some((entry) => entry.ref === ref && entry.present) ||
      bag.active_episodes.some((entry) => entry.ref === ref && entry.present) ||
      bag.ready_fronts.some((entry) => entry.ref === ref && entry.present) ||
      bag.plan_bead_snapshots.some((entry) => entry.ref === ref && entry.present) ||
      bag.memory_notes.some((entry) => entry.ref === ref && entry.present);
    if (!found) {
      missing.add(ref);
    }
  }
  for (const group of [
    bag.plan_bead_operation_results,
    bag.active_episodes,
    bag.ready_fronts,
    bag.plan_bead_snapshots,
    bag.memory_notes
  ]) {
    for (const entry of group) {
      if (!entry.present) {
        missing.add(entry.ref);
      }
    }
  }
  return [...missing];
}

function classifyLifecycleFromOperation(
  result: GoalContinuityPlanBeadOperationResultArtifactV1,
  priorStatuses: Map<string, string>
): GoalContinuityLifecycleEventV1 | null {
  if (result.status !== "accepted") {
    return null;
  }

  if (result.op === "create") {
    return "create";
  }
  if (result.op === "update_notes") {
    return "update";
  }
  if (result.op !== "set_status") {
    return null;
  }

  const nextStatus = result.operation?.patch?.status;
  const closeKind = result.operation?.patch?.close_kind;
  const beadId = result.bead_id ?? result.operation?.bead_id;
  const prior = beadId ? priorStatuses.get(beadId) : undefined;

  if (nextStatus === "blocked") {
    return "block";
  }
  if (nextStatus === "deferred") {
    return "defer";
  }
  if (nextStatus === "closed") {
    if (closeKind === "superseded") {
      return "supersede";
    }
    return "close";
  }
  if (nextStatus === "open" || nextStatus === "in_progress") {
    if (prior === "closed") {
      return "reopen";
    }
    if (prior === "blocked" || prior === "deferred") {
      return "resume";
    }
  }
  return null;
}

function applyAcceptedStatusToPriorMap(
  result: GoalContinuityPlanBeadOperationResultArtifactV1,
  priorStatuses: Map<string, string>
): void {
  if (result.status !== "accepted") {
    return;
  }
  const beadId = result.bead_id ?? result.operation?.bead_id;
  if (!beadId) {
    return;
  }
  if (result.op === "create") {
    priorStatuses.set(beadId, "open");
    return;
  }
  if (result.op === "set_status" && result.operation?.patch?.status) {
    priorStatuses.set(beadId, result.operation.patch.status);
  }
}

function observeLifecycleEvents(input: {
  required: GoalContinuityLifecycleEventV1[];
  operationResults: Array<{ ref: string; artifact: GoalContinuityPlanBeadOperationResultArtifactV1 }>;
  snapshots: Array<{ ref: string; artifact: GoalContinuityPlanBeadSnapshotArtifactV1 }>;
  missingRefs: string[];
}): GoalContinuityLifecycleObservationV1[] {
  const priorStatuses = new Map<string, string>();
  for (const snapshot of input.snapshots) {
    priorStatuses.set(snapshot.artifact.bead_id, snapshot.artifact.status);
  }

  const observed = new Map<GoalContinuityLifecycleEventV1, GoalContinuityLifecycleObservationV1>();

  for (const entry of input.operationResults) {
    const event = classifyLifecycleFromOperation(entry.artifact, priorStatuses);
    applyAcceptedStatusToPriorMap(entry.artifact, priorStatuses);
    if (!event) {
      continue;
    }
    const existing = observed.get(event);
    if (existing) {
      existing.source_artifact_refs = dedupeRefs([
        ...existing.source_artifact_refs,
        entry.ref
      ]);
      continue;
    }
    observed.set(event, {
      event,
      status: "observed",
      source_artifact_refs: [entry.ref],
      details: entry.artifact.reason
    });
  }

  return input.required.map((event) => {
    const hit = observed.get(event);
    if (hit) {
      return hit;
    }
    if (input.missingRefs.length > 0) {
      return {
        event,
        status: "unknown",
        source_artifact_refs: [],
        details: `cannot decide '${event}': missing artifact refs`
      };
    }
    return {
      event,
      status: "missing",
      source_artifact_refs: [],
      details: `required lifecycle event '${event}' not observed in operation results`
    };
  });
}

function detectCheckpointConflicts(
  operationResults: Array<{ ref: string; artifact: GoalContinuityPlanBeadOperationResultArtifactV1 }>
): GoalContinuityCheckpointConflictV1[] {
  const conflicts: GoalContinuityCheckpointConflictV1[] = [];
  for (const entry of operationResults) {
    const result = entry.artifact;
    const reasonLower = result.reason.toLowerCase();
    const mentionsCheckpoint =
      reasonLower.includes("checkpoint") ||
      result.expected_checkpoint_version !== undefined ||
      result.operation?.expected_checkpoint_version !== undefined;

    if (result.status === "rejected" && mentionsCheckpoint) {
      conflicts.push({
        source_artifact_ref: entry.ref,
        reason: result.reason,
        expected_checkpoint_version:
          result.expected_checkpoint_version ?? result.operation?.expected_checkpoint_version,
        before_checkpoint_version: result.before_checkpoint_version,
        after_checkpoint_version: result.after_checkpoint_version
      });
    }
  }
  return conflicts;
}

function detectUnsupportedPhysicalClosure(input: {
  operationResults: Array<{ ref: string; artifact: GoalContinuityPlanBeadOperationResultArtifactV1 }>;
  snapshots: Array<{ ref: string; artifact: GoalContinuityPlanBeadSnapshotArtifactV1 }>;
}): GoalContinuityFindingV1 | null {
  const snapshotById = new Map(
    input.snapshots.map((entry) => [entry.artifact.bead_id, entry] as const)
  );

  for (const entry of input.operationResults) {
    const result = entry.artifact;
    if (result.status !== "accepted" || result.op !== "set_status") {
      continue;
    }
    if (result.operation?.patch?.status !== "closed") {
      continue;
    }
    if (result.operation.patch.close_kind !== "satisfied") {
      continue;
    }

    const evidenceRefs = dedupeRefs([
      ...(result.evidence_refs ?? []),
      ...(result.operation.evidence_refs ?? [])
    ]);
    const hasStrong = evidenceRefs.some(isStrongPhysicalEvidenceRef);
    const onlyProse =
      evidenceRefs.length > 0 && evidenceRefs.every(isProseOnlyEvidenceRef);

    const beadId = result.bead_id ?? result.operation.bead_id;
    const snapshot = beadId ? snapshotById.get(beadId) : undefined;
    const requiresPhysical =
      snapshot !== undefined &&
      snapshot.artifact.acceptance_criteria.non_physical_resolution_allowed === false;

    if (!hasStrong && (onlyProse || requiresPhysical || evidenceRefs.length === 0)) {
      return {
        kind: "unsupported_physical_closure",
        status: "detected",
        source_artifact_refs: dedupeRefs([
          entry.ref,
          ...(snapshot ? [snapshot.ref] : []),
          ...evidenceRefs.filter(isProseOnlyEvidenceRef)
        ]),
        details:
          "closed as satisfied without strong runtime evidence; PlanBead/memory prose cannot prove physical completion"
      };
    }
  }
  return null;
}

function detectProseCannotProvePhysical(input: {
  memoryNotes: Array<{ ref: string; artifact: GoalContinuityMemoryNoteArtifactV1 }>;
  physicalTargetPresent: boolean;
  physicalResult?: CapabilityPredicateResultV1;
}): GoalContinuityFindingV1[] {
  const findings: GoalContinuityFindingV1[] = [];
  for (const note of input.memoryNotes) {
    if (!note.artifact.claims_physical_progress) {
      continue;
    }
    findings.push({
      kind: "prose_cannot_prove_physical",
      status: "detected",
      source_artifact_refs: [note.ref],
      details:
        "memory/PlanBead prose claimed physical progress; continuity may credit the note for work-state only"
    });
  }

  if (
    input.physicalTargetPresent &&
    input.physicalResult &&
    input.physicalResult.status !== "passed" &&
    findings.length === 0
  ) {
    // No prose claim, but keep finding absent for explicit reporting.
  }

  return findings;
}

function detectUsefulResume(input: {
  lifecycle: GoalContinuityLifecycleObservationV1[];
  caseHasInterruption: boolean;
}): GoalContinuityFindingV1 | null {
  if (!input.caseHasInterruption) {
    return null;
  }
  const resume = input.lifecycle.find((entry) => entry.event === "resume");
  if (resume?.status === "observed") {
    return {
      kind: "useful_resume_after_interruption",
      status: "detected",
      source_artifact_refs: resume.source_artifact_refs,
      details: "resume observed after declared interruption pressure"
    };
  }
  if (resume?.status === "unknown") {
    return {
      kind: "useful_resume_after_interruption",
      status: "unknown",
      source_artifact_refs: [],
      details: resume.details
    };
  }
  return {
    kind: "useful_resume_after_interruption",
    status: "absent",
    source_artifact_refs: [],
    details: "interruption declared but no resume lifecycle observation"
  };
}

function detectStaleGoalRepetition(
  episodes: Array<{ ref: string; artifact: GoalContinuityActiveEpisodeArtifactV1 }>
): GoalContinuityFindingV1 | null {
  if (episodes.length < 2) {
    return null;
  }
  const focuses = episodes.map((entry) => entry.artifact.current_focus.trim());
  const first = focuses[0];
  if (!first) {
    return null;
  }
  const allSame = focuses.every((focus) => focus === first);
  const allActiveOrDeferred = episodes.every(
    (entry) =>
      entry.artifact.status === "active" || entry.artifact.status === "deferred"
  );
  if (allSame && allActiveOrDeferred && episodes.length >= 3) {
    return {
      kind: "stale_goal_repetition",
      status: "detected",
      source_artifact_refs: episodes.map((entry) => entry.ref),
      details: "identical Active Episode focus repeated across multiple cycles without pivot"
    };
  }
  return {
    kind: "stale_goal_repetition",
    status: "absent",
    source_artifact_refs: episodes.map((entry) => entry.ref)
  };
}

function openWorkSurvival(input: {
  snapshots: Array<{ ref: string; artifact: GoalContinuityPlanBeadSnapshotArtifactV1 }>;
  episodes: Array<{ ref: string; artifact: GoalContinuityActiveEpisodeArtifactV1 }>;
  operationResults: Array<{ ref: string; artifact: GoalContinuityPlanBeadOperationResultArtifactV1 }>;
  missingRefs: string[];
  restartRequired: boolean;
}): GoalContinuityContinuitySectionV1["open_work_survival"] {
  if (input.missingRefs.length > 0 && input.snapshots.length === 0 && input.episodes.length === 0) {
    return {
      status: "unknown",
      source_artifact_refs: [],
      details: "missing artifact refs; cannot decide open-work survival"
    };
  }

  const openSnapshots = input.snapshots.filter(
    (entry) => entry.artifact.status !== "closed"
  );
  const activeEpisodes = input.episodes.filter(
    (entry) =>
      entry.artifact.status === "active" ||
      entry.artifact.status === "deferred" ||
      entry.artifact.status === "blocked"
  );
  const acceptedCreates = input.operationResults.filter(
    (entry) => entry.artifact.status === "accepted" && entry.artifact.op === "create"
  );

  if (openSnapshots.length > 0 || activeEpisodes.length > 0 || acceptedCreates.length > 0) {
    return {
      status: "retained",
      source_artifact_refs: dedupeRefs([
        ...openSnapshots.map((entry) => entry.ref),
        ...activeEpisodes.map((entry) => entry.ref),
        ...acceptedCreates.map((entry) => entry.ref)
      ]),
      details: input.restartRequired
        ? "open work retained across restart/compaction checkpoint surface"
        : "open work retained in PlanBead/Active Episode artifacts"
    };
  }

  return {
    status: "lost",
    source_artifact_refs: dedupeRefs([
      ...input.snapshots.map((entry) => entry.ref),
      ...input.episodes.map((entry) => entry.ref)
    ]),
    details: "no non-closed PlanBead or non-completed Active Episode found"
  };
}

function interpretPhysical(input: {
  case: GoalContinuityCaseV1;
  bag: GoalContinuityArtifactBagV1;
  proseRejected: GoalContinuityPhysicalSectionV1["prose_rejected_as_physical_proof"];
}): GoalContinuityPhysicalSectionV1 {
  const milestones: CapabilityMilestoneReportV1[] = [];

  if (!input.case.physical_target && (!input.case.physical_milestones || input.case.physical_milestones.length === 0)) {
    return {
      milestones: [],
      interpretation_status: "unverifiable",
      prose_rejected_as_physical_proof: input.proseRejected,
      target: undefined
    };
  }

  if (!input.bag.physical_evidence) {
    return {
      target: {
        status: "unknown",
        evidence_refs: [],
        missing_evidence: ["physical_evidence"],
        reasons: ["physical evidence bag absent; PlanBead/memory prose cannot substitute"]
      },
      milestones: (input.case.physical_milestones ?? []).map((milestone) => ({
        milestone_id: milestone.milestone_id,
        title: milestone.title,
        order: milestone.order,
        weight: milestone.weight,
        result: {
          status: "unknown",
          evidence_refs: [],
          missing_evidence: ["physical_evidence"]
        }
      })),
      interpretation_status: "unverifiable",
      prose_rejected_as_physical_proof: input.proseRejected
    };
  }

  let target: CapabilityPredicateResultV1 | undefined;
  if (input.case.physical_target) {
    target = evaluateCapabilityPredicate(input.case.physical_target, input.bag.physical_evidence);
  }

  for (const milestone of input.case.physical_milestones ?? []) {
    milestones.push({
      milestone_id: milestone.milestone_id,
      title: milestone.title,
      order: milestone.order,
      weight: milestone.weight,
      result: evaluateCapabilityMilestone(milestone, input.bag.physical_evidence)
    });
  }

  let interpretation_status: CapabilityInterpretationStatusV1 = "failed";
  if (target?.status === "unknown" || milestones.some((m) => m.result.status === "unknown")) {
    interpretation_status = "unverifiable";
  } else if (target?.status === "passed") {
    interpretation_status = "passed";
  } else if (milestones.some((m) => m.result.status === "passed")) {
    interpretation_status = "partial";
  } else if (!target && milestones.every((m) => m.result.status === "passed")) {
    interpretation_status = "passed";
  }

  return {
    target,
    milestones,
    interpretation_status,
    prose_rejected_as_physical_proof: input.proseRejected
  };
}

function interpretContinuity(input: {
  lifecycle: GoalContinuityLifecycleObservationV1[];
  findings: GoalContinuityFindingV1[];
  checkpointConflicts: GoalContinuityCheckpointConflictV1[];
  missingRefs: string[];
  openWork: GoalContinuityContinuitySectionV1["open_work_survival"];
}): CapabilityInterpretationStatusV1 {
  if (input.missingRefs.length > 0) {
    return "unverifiable";
  }
  if (input.lifecycle.some((entry) => entry.status === "unknown")) {
    return "unverifiable";
  }
  if (input.checkpointConflicts.length > 0) {
    // Conflicts remain visible; they do not auto-pass continuity.
    const requiredMissing = input.lifecycle.some((entry) => entry.status === "missing");
    if (requiredMissing) {
      return "failed";
    }
  }
  if (input.findings.some((f) => f.kind === "unsupported_physical_closure" && f.status === "detected")) {
    // Continuity observed the close; physical unsupported is a separate finding.
  }
  const requiredMissing = input.lifecycle.filter((entry) => entry.status === "missing");
  if (requiredMissing.length === 0) {
    if (input.openWork.status === "lost") {
      const closedIntentionally = input.lifecycle.some(
        (entry) =>
          (entry.event === "close" || entry.event === "supersede") && entry.status === "observed"
      );
      if (!closedIntentionally) {
        return "partial";
      }
    }
    return "passed";
  }
  if (requiredMissing.length < input.lifecycle.length) {
    return "partial";
  }
  return "failed";
}

function collectFailureClasses(input: {
  missingRefs: string[];
  physical: GoalContinuityPhysicalSectionV1;
  continuity: GoalContinuityContinuitySectionV1;
}): CapabilityFailureClassV1[] {
  const classes = new Set<CapabilityFailureClassV1>();
  if (input.missingRefs.length > 0) {
    classes.add("unverifiable");
  }
  if (input.physical.interpretation_status === "unverifiable") {
    classes.add("unverifiable");
  }
  if (input.continuity.interpretation_status === "unverifiable") {
    classes.add("unverifiable");
  }
  if (
    input.continuity.findings.some(
      (f) => f.kind === "unsupported_physical_closure" && f.status === "detected"
    )
  ) {
    classes.add("claim_without_evidence");
  }
  if (
    input.continuity.findings.some(
      (f) => f.kind === "prose_cannot_prove_physical" && f.status === "detected"
    ) &&
    input.physical.interpretation_status !== "passed"
  ) {
    classes.add("claim_without_evidence");
  }
  if (
    input.continuity.findings.some(
      (f) => f.kind === "stale_goal_repetition" && f.status === "detected"
    )
  ) {
    classes.add("context_continuity_failed");
  }
  if (input.continuity.open_work_survival.status === "lost") {
    classes.add("context_continuity_failed");
  }
  if (
    input.continuity.lifecycle_events.some((entry) => entry.status === "missing") &&
    input.continuity.interpretation_status === "failed"
  ) {
    classes.add("context_continuity_failed");
  }
  return [...classes];
}

export function evaluateGoalContinuity(
  input: EvaluateGoalContinuityInput
): GoalContinuityReportV1 {
  const bag = input.artifact_bag;
  const missingRefs = collectMissingRefs(bag);

  const operationResults = presentArtifacts<GoalContinuityPlanBeadOperationResultArtifactV1>(
    bag.plan_bead_operation_results,
    "plan-bead-operation-result/v1"
  );
  const episodes = presentArtifacts<GoalContinuityActiveEpisodeArtifactV1>(
    bag.active_episodes,
    "active-episode/v1"
  );
  const readyFronts = presentArtifacts<GoalContinuityReadyFrontArtifactV1>(
    bag.ready_fronts,
    "plan-bead-ready-front/v1"
  );
  const snapshots = presentArtifacts<GoalContinuityPlanBeadSnapshotArtifactV1>(
    bag.plan_bead_snapshots,
    "actor-plan-bead/v1"
  );
  const memoryNotes = presentArtifacts<GoalContinuityMemoryNoteArtifactV1>(
    bag.memory_notes,
    "continuity-memory-note/v1"
  );

  const lifecycle = observeLifecycleEvents({
    required: input.case.observable_lifecycle_events,
    operationResults,
    snapshots,
    missingRefs
  });

  const checkpointConflicts = detectCheckpointConflicts(operationResults);
  const findings: GoalContinuityFindingV1[] = [];

  for (const ref of missingRefs) {
    findings.push({
      kind: "missing_ref",
      status: "detected",
      source_artifact_refs: [ref],
      details: "required or declared artifact ref is missing; scored unknown/unverifiable"
    });
  }

  for (const conflict of checkpointConflicts) {
    findings.push({
      kind: "stale_checkpoint",
      status: "detected",
      source_artifact_refs: [conflict.source_artifact_ref],
      details: conflict.reason
    });
  }

  const unsupported = detectUnsupportedPhysicalClosure({ operationResults, snapshots });
  if (unsupported) {
    findings.push(unsupported);
  }

  const proseFindings = detectProseCannotProvePhysical({
    memoryNotes,
    physicalTargetPresent: input.case.physical_target !== undefined,
    physicalResult: undefined
  });
  findings.push(...proseFindings);

  const resumeFinding = detectUsefulResume({
    lifecycle,
    caseHasInterruption: input.case.interruption !== undefined
  });
  if (resumeFinding) {
    findings.push(resumeFinding);
  }

  const staleRepetition = detectStaleGoalRepetition(episodes);
  if (staleRepetition) {
    findings.push(staleRepetition);
  }

  const proseRejected = memoryNotes
    .filter((note) => note.artifact.claims_physical_progress)
    .map((note) => ({
      source_ref: note.ref,
      reason:
        "memory/PlanBead prose cannot prove physical progress; use CapabilityPredicateV1 over runtime evidence"
    }));

  const physical = interpretPhysical({
    case: input.case,
    bag,
    proseRejected
  });

  // Re-run prose findings awareness once physical result is known (already recorded).
  void physical.target;

  const openWork = openWorkSurvival({
    snapshots,
    episodes,
    operationResults,
    missingRefs,
    restartRequired: input.case.restart_checkpoint?.required === true
  });

  const continuity: GoalContinuityContinuitySectionV1 = {
    interpretation_status: "failed",
    lifecycle_events: lifecycle,
    open_work_survival: openWork,
    ready_front_changes: readyFronts.map((entry) => ({
      source_artifact_ref: entry.ref,
      ready_bead_ids: entry.artifact.ready_bead_ids,
      in_progress_bead_ids: entry.artifact.in_progress_bead_ids,
      blocked_bead_ids: entry.artifact.blocked_bead_ids
    })),
    findings,
    checkpoint_conflicts: checkpointConflicts
  };
  continuity.interpretation_status = interpretContinuity({
    lifecycle,
    findings,
    checkpointConflicts,
    missingRefs,
    openWork
  });

  return {
    schema: GOAL_CONTINUITY_REPORT_SCHEMA,
    suite_id: input.suite_id,
    suite_version: input.suite_version,
    case_id: input.case.case_id,
    run_id: input.run_id ?? bag.run_id,
    actor_id: bag.actor_id,
    physical,
    continuity,
    failure_classes: collectFailureClasses({
      missingRefs,
      physical,
      continuity
    })
  };
}
