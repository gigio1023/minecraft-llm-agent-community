/**
 * Deterministic builder for `individual-capability-report/v1`.
 *
 * Evaluates target and milestones via A1 predicates. Clean runtime exit without
 * a passed target is never interpreted as capability `passed`.
 */

import type { SocialCycleRunReport } from "../../runtime/goals/types.js";
import {
  evaluateCapabilityMilestone,
  evaluateCapabilityPredicate
} from "./predicates.js";
import type { CapabilityEvidenceBagV1 } from "./evidenceBag.js";
import type {
  CapabilityBlockerRecordV1,
  CapabilityBudgetObservedV1,
  CapabilityFailureClassV1,
  CapabilityInterpretationStatusV1,
  CapabilityMilestoneReportV1,
  CapabilityProviderUsageTotalsV1,
  CapabilityStallRecordV1,
  IndividualCapabilityReportV1
} from "./reportTypes.js";
import type {
  CapabilityPredicateResultV1,
  IndividualCapabilityCaseV1
} from "./types.js";

export type BuildIndividualCapabilityReportInput = {
  suite_id: string;
  suite_version: string;
  case: IndividualCapabilityCaseV1;
  report: SocialCycleRunReport;
  evidence_bag: CapabilityEvidenceBagV1;
  manifest_hash?: string;
  commit?: string;
  platform?: string;
  raw_report_ref?: string;
  actor_workspace_ref?: string;
  transcript_refs?: string[];
  /**
   * When set, included as `generated_at`. Omit for fully deterministic JSON
   * across repeated normalization of the same inputs.
   */
  generated_at?: string;
};

function sortStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function countRuntimeActions(report: SocialCycleRunReport): number {
  let count = 0;
  for (const cycle of report.cycles) {
    if (cycle.action_attempts && cycle.action_attempts.length > 0) {
      count += cycle.action_attempts.length;
    } else {
      count += 1;
    }
  }
  return count;
}

function providerUsageTotals(
  report: SocialCycleRunReport
): CapabilityProviderUsageTotalsV1 | undefined {
  const totals = report.provider_usage?.totals;
  if (!totals || totals.length === 0) {
    return undefined;
  }
  const matching = totals.filter(
    (entry) =>
      entry.provider_id === report.provider.provider_id && entry.model === report.provider.model
  );
  const source = matching.length > 0 ? matching : totals;
  return source.reduce<CapabilityProviderUsageTotalsV1>(
    (acc, entry) => ({
      requests: acc.requests + entry.usage.requests,
      input_tokens: acc.input_tokens + entry.usage.input_tokens,
      output_tokens: acc.output_tokens + entry.usage.output_tokens,
      thinking_tokens: acc.thinking_tokens + entry.usage.thinking_tokens,
      total_tokens: acc.total_tokens + entry.usage.total_tokens
    }),
    {
      requests: 0,
      input_tokens: 0,
      output_tokens: 0,
      thinking_tokens: 0,
      total_tokens: 0
    }
  );
}

function observedBudgets(
  report: SocialCycleRunReport,
  usage: CapabilityProviderUsageTotalsV1 | undefined,
  wallTimeMs?: number
): CapabilityBudgetObservedV1 {
  return {
    cycles: report.cycles.length,
    runtime_actions: countRuntimeActions(report),
    ...(wallTimeMs !== undefined ? { wall_time_ms: wallTimeMs } : {}),
    ...(usage
      ? {
          provider_requests: usage.requests,
          total_tokens: usage.total_tokens
        }
      : {})
    // estimated_cost omitted unless a real normalized cost source exists.
  };
}

function blockerRecords(report: SocialCycleRunReport): CapabilityBlockerRecordV1[] {
  const histogram = report.settlement_state?.blocker_histogram ?? [];
  return histogram
    .map((entry) => ({
      key: entry.key,
      count: entry.count,
      ...(entry.example ? { example: entry.example } : {})
    }))
    .sort((a, b) => a.key.localeCompare(b.key) || a.count - b.count);
}

function stallRecords(
  report: SocialCycleRunReport,
  blockers: CapabilityBlockerRecordV1[]
): CapabilityStallRecordV1[] {
  const stalls = blockers.filter(
    (entry) =>
      entry.key.includes("stall") ||
      entry.key.includes("no_progress") ||
      entry.key === "blocked"
  );
  if (stalls.length > 0) {
    return stalls;
  }
  // Cheap judgment-derived stall signal when settlement histogram is empty.
  const missingPrimitive = report.settlement_state?.missing_primitive_blockers ?? [];
  return missingPrimitive
    .map((key) => ({ key, count: 1 }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function collectArtifactRefs(report: SocialCycleRunReport): {
  evidence_refs: string[];
  provider_input_refs: string[];
  provider_output_refs: string[];
  verifier_refs: string[];
  visual_evidence_refs: string[];
} {
  const evidence_refs: string[] = [];
  const provider_input_refs: string[] = [];
  const provider_output_refs: string[] = [];
  const verifier_refs: string[] = [];

  for (const cycle of report.cycles) {
    evidence_refs.push(...cycle.evidence_refs);
    provider_input_refs.push(...cycle.provider_input_refs);
    provider_output_refs.push(...cycle.provider_output_refs);
    if (cycle.verifier_status === "passed" || cycle.verifier_status === "failed") {
      verifier_refs.push(cycle.judgment_ref);
    }
    for (const attempt of cycle.action_attempts ?? []) {
      evidence_refs.push(...attempt.evidence_refs);
      provider_input_refs.push(...attempt.provider_input_refs);
      provider_output_refs.push(...attempt.provider_output_refs);
    }
  }

  const visual_evidence_refs: string[] = [];
  for (const capture of report.visual_evidence?.captures ?? []) {
    if (typeof capture.artifact_ref === "string" && capture.artifact_ref.trim().length > 0) {
      visual_evidence_refs.push(capture.artifact_ref);
    }
    if (typeof capture.image_ref === "string" && capture.image_ref.trim().length > 0) {
      visual_evidence_refs.push(capture.image_ref);
    }
    if (typeof capture.image_path === "string" && capture.image_path.trim().length > 0) {
      visual_evidence_refs.push(capture.image_path);
    }
  }

  return {
    evidence_refs: sortStrings(evidence_refs),
    provider_input_refs: sortStrings(provider_input_refs),
    provider_output_refs: sortStrings(provider_output_refs),
    verifier_refs: sortStrings(verifier_refs),
    visual_evidence_refs: sortStrings(visual_evidence_refs)
  };
}

function countUnsupportedSuccessClaims(report: SocialCycleRunReport): number {
  let count = 0;
  if (
    report.agency_status.gameplay_progress_verified === false &&
    report.runtime_status === "passed" &&
    report.settlement_state?.progress &&
    (report.settlement_state.progress.has_crafting_table ||
      report.settlement_state.progress.has_shared_storage_contribution ||
      report.settlement_state.progress.has_verified_shelter)
  ) {
    count += 1;
  }
  for (const cycle of report.cycles) {
    if (cycle.verifier_status === "failed") {
      count += 1;
    }
  }
  return count;
}

function milestoneReports(
  capabilityCase: IndividualCapabilityCaseV1,
  bag: CapabilityEvidenceBagV1
): CapabilityMilestoneReportV1[] {
  return [...capabilityCase.milestones]
    .map((milestone) => ({
      milestone_id: milestone.milestone_id,
      title: milestone.title,
      order: milestone.order,
      weight: milestone.weight,
      result: evaluateCapabilityMilestone(milestone, bag)
    }))
    .sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.milestone_id.localeCompare(b.milestone_id);
    });
}

function passedMilestoneCount(milestones: CapabilityMilestoneReportV1[]): number {
  return milestones.filter((entry) => entry.result.status === "passed").length;
}

function interpretCapability(input: {
  runtime_status: SocialCycleRunReport["runtime_status"];
  target: CapabilityPredicateResultV1;
  milestones: CapabilityMilestoneReportV1[];
  completion_policy: IndividualCapabilityCaseV1["completion_policy"];
  report: SocialCycleRunReport;
  unsupported_success_claim_count: number;
}): {
  interpretation_status: CapabilityInterpretationStatusV1;
  failure_class?: CapabilityFailureClassV1;
  next_diagnostic_action?: string;
  diagnostic_notes: string[];
} {
  const { runtime_status, target, milestones, completion_policy, report } = input;
  const notes: string[] = [];
  const partialAllowed = completion_policy.partial_credit === "milestones";
  const anyMilestonePassed = passedMilestoneCount(milestones) > 0;

  if (runtime_status === "environment_blocked") {
    return {
      interpretation_status: "environment_blocked",
      failure_class: "world_setup_failed",
      next_diagnostic_action: "Inspect server/world scenario setup artifacts and validation refs.",
      diagnostic_notes: notes
    };
  }

  if (runtime_status === "blocked" && report.provider_error) {
    return {
      interpretation_status: "blocked",
      failure_class: "provider_blocked",
      next_diagnostic_action: "Resolve provider auth/quota/budget before re-running the case.",
      diagnostic_notes: notes
    };
  }

  if (runtime_status === "blocked") {
    const missingPrimitives = report.settlement_state?.missing_primitive_blockers ?? [];
    if (missingPrimitives.length > 0) {
      return {
        interpretation_status: "blocked",
        failure_class: "missing_action_capability",
        next_diagnostic_action: "Inspect missing primitive/action-skill blockers in settlement_state.",
        diagnostic_notes: notes
      };
    }
    return {
      interpretation_status: "blocked",
      failure_class: "runtime_execution_failed",
      next_diagnostic_action: "Inspect runtime blockers and cycle evidence for the blocking turn.",
      diagnostic_notes: notes
    };
  }

  if (target.status === "unknown") {
    notes.push("Target predicate is unverifiable because required evidence refs are missing or setup-only.");
    return {
      interpretation_status: "unverifiable",
      failure_class: "unverifiable",
      next_diagnostic_action:
        "Produce inventory/block/container evidence with resolvable actor-workspace refs before scoring.",
      diagnostic_notes: notes
    };
  }

  if (input.unsupported_success_claim_count > 0 && target.status !== "passed") {
    notes.push("Detected unsupported success claims without matching verified target evidence.");
  }

  // CRITICAL: clean runtime exit without a passed target is never capability passed.
  if (target.status === "passed") {
    if (runtime_status === "timeout") {
      notes.push("Target passed under timeout runtime_status; treat as passed on evidence only.");
    }
    return {
      interpretation_status: "passed",
      diagnostic_notes: notes
    };
  }

  if (target.status === "failed") {
    if (partialAllowed && anyMilestonePassed) {
      notes.push("Partial milestones passed but the declared target did not.");
      return {
        interpretation_status: "partial",
        failure_class: anyMilestonePassed ? "stalled_after_progress" : "no_measurable_progress",
        next_diagnostic_action:
          "Inspect the first failed milestone after last passed progress and its evidence refs.",
        diagnostic_notes: notes
      };
    }
    return {
      interpretation_status: "failed",
      failure_class: anyMilestonePassed ? "stalled_after_progress" : "no_measurable_progress",
      next_diagnostic_action: "Inspect target failure reasons and nearest milestone evidence.",
      diagnostic_notes: notes
    };
  }

  // Exhaustive guard — should not reach here.
  return {
    interpretation_status: "unverifiable",
    failure_class: "unverifiable",
    diagnostic_notes: notes
  };
}

/**
 * Build a normalized capability report. Array fields are sorted for stable JSON
 * except optional `generated_at`, which is caller-supplied and non-scored.
 */
export function buildIndividualCapabilityReport(
  input: BuildIndividualCapabilityReportInput
): IndividualCapabilityReportV1 {
  const { report, evidence_bag, case: capabilityCase } = input;
  const target = evaluateCapabilityPredicate(capabilityCase.target, evidence_bag);
  const milestones = milestoneReports(capabilityCase, evidence_bag);
  const usage = providerUsageTotals(report);
  const blockers = blockerRecords(report);
  const stalls = stallRecords(report, blockers);
  const unsupported_success_claim_count = countUnsupportedSuccessClaims(report);
  const interpretation = interpretCapability({
    runtime_status: report.runtime_status,
    target,
    milestones,
    completion_policy: capabilityCase.completion_policy,
    report,
    unsupported_success_claim_count
  });
  const artifact_refs = collectArtifactRefs(report);

  // Harden the critical invariant even if interpretCapability changes later.
  let interpretation_status = interpretation.interpretation_status;
  let failure_class = interpretation.failure_class;
  if (report.runtime_status === "passed" && target.status !== "passed") {
    if (target.status === "unknown") {
      interpretation_status = "unverifiable";
      failure_class = "unverifiable";
    } else if (interpretation_status === "passed") {
      interpretation_status =
        capabilityCase.completion_policy.partial_credit === "milestones" &&
        passedMilestoneCount(milestones) > 0
          ? "partial"
          : "failed";
      failure_class = failure_class ?? "no_measurable_progress";
    }
  }

  const declared = capabilityCase.budgets;

  return {
    schema: "individual-capability-report/v1",
    suite_id: input.suite_id,
    suite_version: input.suite_version,
    case_id: capabilityCase.case_id,
    ...(input.manifest_hash ? { manifest_hash: input.manifest_hash } : {}),
    run_id: report.run_id,
    ...(input.commit ? { commit: input.commit } : {}),
    actor_id: report.actor_id,
    provider: {
      provider_id: report.provider.provider_id,
      model: report.provider.model,
      reasoning: report.provider.reasoning
    },
    ...(input.platform ? { platform: input.platform } : {}),
    ...(report.server?.version ? { minecraft_version: report.server.version } : {}),
    ...(report.server?.world_scenario?.scenario_id
      ? { world_scenario_id: report.server.world_scenario.scenario_id }
      : { world_scenario_id: capabilityCase.world_scenario_id }),
    ...(report.server?.seed ? { seed: report.server.seed } : {}),
    budgets: {
      declared: {
        max_cycles: declared.max_cycles,
        max_runtime_actions: declared.max_runtime_actions,
        max_wall_time_ms: declared.max_wall_time_ms,
        ...(declared.max_provider_requests !== undefined
          ? { max_provider_requests: declared.max_provider_requests }
          : {}),
        ...(declared.max_total_tokens !== undefined
          ? { max_total_tokens: declared.max_total_tokens }
          : {}),
        ...(declared.max_estimated_cost !== undefined
          ? { max_estimated_cost: declared.max_estimated_cost }
          : {})
      },
      observed: observedBudgets(report, usage)
    },
    target,
    milestones,
    runtime_status: report.runtime_status,
    interpretation_status,
    ...(failure_class ? { failure_class } : {}),
    ...(interpretation.next_diagnostic_action
      ? { next_diagnostic_action: interpretation.next_diagnostic_action }
      : {}),
    unsupported_success_claim_count,
    stalls,
    blockers,
    ...(usage ? { provider_usage: usage } : {}),
    ...(report.provider_usage?.ledger_path
      ? { provider_usage_ledger_ref: report.provider_usage.ledger_path }
      : {}),
    evidence_bag_available: { ...evidence_bag.available },
    artifact_refs: {
      ...(input.raw_report_ref ? { raw_report_ref: input.raw_report_ref } : {}),
      ...(input.actor_workspace_ref ? { actor_workspace_ref: input.actor_workspace_ref } : {}),
      evidence_refs: artifact_refs.evidence_refs,
      provider_input_refs: artifact_refs.provider_input_refs,
      provider_output_refs: artifact_refs.provider_output_refs,
      verifier_refs: artifact_refs.verifier_refs,
      transcript_refs: sortStrings(input.transcript_refs ?? []),
      visual_evidence_refs: artifact_refs.visual_evidence_refs
    },
    diagnostic_notes: [...interpretation.diagnostic_notes].sort((a, b) => a.localeCompare(b)),
    ...(input.generated_at ? { generated_at: input.generated_at } : {})
  };
}
