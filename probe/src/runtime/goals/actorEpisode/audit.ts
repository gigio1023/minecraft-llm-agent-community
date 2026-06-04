/**
 * Audit checks for episode review summaries.
 *
 * @remarks Passing an episode requires evidence-backed mutation or social
 * visibility. These checks reject unsupported closure and PlanBead satisfaction
 * claims before they become misleading handoff context.
 */
import {
  type EpisodeReviewSummary,
  type PlanBeadClosureCheck
} from "./types.js";
import { validateEpisodeReviewSummary } from "./validators.js";

export type EpisodeContractAuditOptions = {
  known_refs?: Iterable<string>;
};

function knownRefSet(options?: EpisodeContractAuditOptions) {
  return options?.known_refs ? new Set(options.known_refs) : null;
}

function collectSummaryRefs(summary: EpisodeReviewSummary) {
  return [
    ...summary.final_verdict.evidence_refs,
    ...summary.evidence_trace_refs,
    ...summary.social_visibility.evidence_refs,
    ...summary.plan_bead_closure_checks.flatMap((check) => check.evidence_refs)
  ];
}

function auditRefs(
  summary: EpisodeReviewSummary,
  knownRefs: Set<string> | null,
  errors: string[]
) {
  if (!knownRefs) {
    return;
  }
  for (const ref of collectSummaryRefs(summary)) {
    if (!knownRefs.has(ref)) {
      errors.push(`Episode review references unknown artifact ref: ${ref}`);
    }
  }
}

function isAcceptedSatisfiedClosure(check: PlanBeadClosureCheck) {
  return check.status === "accepted" && check.close_kind === "satisfied";
}

export function auditEpisodeReviewSummary(
  value: unknown,
  options?: EpisodeContractAuditOptions
): string[] {
  const validation = validateEpisodeReviewSummary(value);
  if (!validation.ok) {
    return validation.errors;
  }

  const summary = validation.summary;
  const errors: string[] = [];
  const refs = knownRefSet(options);
  auditRefs(summary, refs, errors);

  if (summary.final_verdict.status === "passed") {
    if (summary.final_verdict.evidence_refs.length === 0) {
      errors.push("Episode passed without final verdict evidence refs");
    }
    if (summary.metrics.false_pass_count > 0) {
      errors.push("Episode passed with non-zero false_pass_count");
    }
    if (summary.metrics.unsupported_claim_count > 0) {
      errors.push("Episode passed with unsupported claims");
    }
    if (
      summary.metrics.verified_mutation_turns === 0 &&
      summary.social_visibility.event_count === 0
    ) {
      errors.push("Episode passed without verified mutation or social visibility evidence");
    }
  }

  for (const check of summary.plan_bead_closure_checks) {
    if (!isAcceptedSatisfiedClosure(check)) {
      continue;
    }
    if (check.evidence_refs.length === 0) {
      errors.push(`Satisfied PlanBead closure ${check.bead_id} lacks evidence refs`);
    }
    if (!check.matched_acceptance_criteria) {
      errors.push(
        `Satisfied PlanBead closure ${check.bead_id} did not match acceptance criteria`
      );
    }
  }

  return errors;
}
