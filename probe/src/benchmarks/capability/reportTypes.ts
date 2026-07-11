/**
 * Normalized per-run capability report for V4 Stage 1.
 *
 * Keep `runtime_status` (from the social-cycle report) separate from
 * `interpretation_status` (capability evaluation). Clean runtime exit alone
 * never implies capability `passed`.
 */

import type { CapabilityPredicateResultV1 } from "./types.js";

export const CAPABILITY_INTERPRETATION_STATUSES = [
  "passed",
  "partial",
  "failed",
  "blocked",
  "environment_blocked",
  "unverifiable"
] as const;

export type CapabilityInterpretationStatusV1 =
  (typeof CAPABILITY_INTERPRETATION_STATUSES)[number];

export const CAPABILITY_FAILURE_CLASSES = [
  "manifest_invalid",
  "world_setup_failed",
  "provider_blocked",
  "model_goal_misread",
  "missing_action_capability",
  "runtime_execution_failed",
  "verifier_failed",
  "no_measurable_progress",
  "stalled_after_progress",
  "context_continuity_failed",
  "claim_without_evidence",
  "budget_exhausted",
  "unverifiable"
] as const;

export type CapabilityFailureClassV1 = (typeof CAPABILITY_FAILURE_CLASSES)[number];

/** Runtime exit status copied from `social-cycle-run-report/v1`. */
export type CapabilityRuntimeStatusV1 =
  | "passed"
  | "failed"
  | "blocked"
  | "timeout"
  | "environment_blocked";

export type CapabilityBudgetObservedV1 = {
  cycles: number;
  runtime_actions: number;
  wall_time_ms?: number;
  provider_requests?: number;
  total_tokens?: number;
  estimated_cost?: number;
};

export type CapabilityMilestoneReportV1 = {
  milestone_id: string;
  title: string;
  order: number | null;
  weight: number;
  result: CapabilityPredicateResultV1;
};

export type CapabilityStallRecordV1 = {
  key: string;
  count: number;
  example?: string;
};

export type CapabilityBlockerRecordV1 = {
  key: string;
  count: number;
  example?: string;
};

export type CapabilityProviderUsageTotalsV1 = {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  total_tokens: number;
};

export type IndividualCapabilityReportV1 = {
  schema: "individual-capability-report/v1";
  suite_id: string;
  suite_version: string;
  case_id: string;
  /** Optional content hash of the loaded manifest; omitted when not supplied. */
  manifest_hash?: string;
  run_id: string;
  /** Optional git commit recorded by the caller; omitted when not supplied. */
  commit?: string;
  actor_id: string;
  provider: {
    provider_id: string;
    model: string;
    reasoning: string;
  };
  platform?: string;
  minecraft_version?: string;
  world_scenario_id?: string;
  seed?: string;
  budgets: {
    declared: {
      max_cycles: number;
      max_runtime_actions: number;
      max_wall_time_ms: number;
      max_provider_requests?: number;
      max_total_tokens?: number;
      max_estimated_cost?: number;
    };
    observed: CapabilityBudgetObservedV1;
  };
  target: CapabilityPredicateResultV1;
  milestones: CapabilityMilestoneReportV1[];
  /**
   * Social-cycle runtime exit status. Independent of capability interpretation.
   * `runtime_status === "passed"` does not imply capability success.
   */
  runtime_status: CapabilityRuntimeStatusV1;
  /** Capability evaluation status after target/milestone predicates. */
  interpretation_status: CapabilityInterpretationStatusV1;
  failure_class?: CapabilityFailureClassV1;
  next_diagnostic_action?: string;
  unsupported_success_claim_count: number;
  stalls: CapabilityStallRecordV1[];
  blockers: CapabilityBlockerRecordV1[];
  provider_usage?: CapabilityProviderUsageTotalsV1;
  provider_usage_ledger_ref?: string;
  evidence_bag_available: {
    inventory: boolean;
    held_item: boolean;
    position: boolean;
    blocks: boolean;
    containers: boolean;
  };
  artifact_refs: {
    raw_report_ref?: string;
    actor_workspace_ref?: string;
    evidence_refs: string[];
    provider_input_refs: string[];
    provider_output_refs: string[];
    verifier_refs: string[];
    transcript_refs: string[];
    visual_evidence_refs: string[];
  };
  diagnostic_notes: string[];
  /**
   * Optional wall-clock stamp. When present, repeated normalization may differ
   * only in this field; all scored fields remain deterministic.
   */
  generated_at?: string;
};
