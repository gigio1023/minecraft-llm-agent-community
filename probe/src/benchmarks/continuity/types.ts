/**
 * Goal-continuity benchmark contracts for V4 Stage 2 Slice B2.
 *
 * Manifests declare pressure and observable lifecycle *kinds*, never correct
 * PlanBead titles or prescribed intermediate goals. PlanBead / memory prose may
 * prove continuity state only; physical progress requires CapabilityPredicateV1
 * over runtime evidence.
 */

import type {
  CapabilityAllowedEvidenceKindV1,
  CapabilityFailureClassV1,
  CapabilityInterpretationStatusV1,
  CapabilityMilestoneReportV1,
  CapabilityMilestoneV1,
  CapabilityPredicateResultV1,
  CapabilityPredicateV1,
  CapabilityEvidenceBagV1
} from "../capability/index.js";
import type { WorldScenarioId } from "../../server/worldScenarios.js";

export const GOAL_CONTINUITY_MANIFEST_SCHEMA = "goal-continuity-manifest/v1" as const;
export const GOAL_CONTINUITY_REPORT_SCHEMA = "goal-continuity-report/v1" as const;
export const GOAL_CONTINUITY_ARTIFACT_BAG_SCHEMA = "goal-continuity-artifact-bag/v1" as const;

/** Actor-side lifecycle kinds the evaluator can observe from saved artifacts. */
export const GOAL_CONTINUITY_LIFECYCLE_EVENTS = [
  "create",
  "update",
  "block",
  "defer",
  "resume",
  "supersede",
  "reopen",
  "close"
] as const;

export type GoalContinuityLifecycleEventV1 =
  (typeof GOAL_CONTINUITY_LIFECYCLE_EVENTS)[number];

export const GOAL_CONTINUITY_OPEN_WORK_KINDS = [
  "any_open_work",
  "dependency_chain",
  "competing_goals"
] as const;

export type GoalContinuityOpenWorkKindV1 =
  (typeof GOAL_CONTINUITY_OPEN_WORK_KINDS)[number];

export const GOAL_CONTINUITY_INTERRUPTION_KINDS = [
  "evidence_change",
  "new_concern",
  "process_restart",
  "context_compaction"
] as const;

export type GoalContinuityInterruptionKindV1 =
  (typeof GOAL_CONTINUITY_INTERRUPTION_KINDS)[number];

export const GOAL_CONTINUITY_INTERRUPTION_SCHEDULES = [
  "during_open_work",
  "after_progress",
  "at_cycle"
] as const;

export type GoalContinuityInterruptionScheduleV1 =
  (typeof GOAL_CONTINUITY_INTERRUPTION_SCHEDULES)[number];

export type GoalContinuityBudgetsV1 = {
  max_cycles: number;
  max_runtime_actions: number;
  max_wall_time_ms: number;
  max_provider_requests?: number;
  max_total_tokens?: number;
  max_estimated_cost?: number;
};

export type GoalContinuitySeedPolicyV1 = {
  kind: "fixed" | "declared_set" | "fresh";
  seeds?: string[];
  repeats: number;
};

/**
 * Pressure declaration only. Must not name the correct PlanBead title or
 * prescribe intermediate goal text.
 */
export type GoalContinuityOpenWorkExpectationV1 = {
  kind: GoalContinuityOpenWorkKindV1;
  /** Human-readable pressure description for experimenters; not scored as a title match. */
  pressure_notes: string;
};

export type GoalContinuityInterruptionV1 = {
  kind: GoalContinuityInterruptionKindV1;
  schedule: GoalContinuityInterruptionScheduleV1;
  at_cycle?: number;
  description: string;
};

export type GoalContinuityRestartCheckpointV1 = {
  required: boolean;
  description: string;
};

export type GoalContinuityCaseV1 = {
  case_id: string;
  title: string;
  top_level_goal: string;
  world_scenario_id: WorldScenarioId;
  fixture_class: "natural_world" | "command_fixture" | "mixed";
  open_work_expectation: GoalContinuityOpenWorkExpectationV1;
  interruption?: GoalContinuityInterruptionV1;
  restart_checkpoint?: GoalContinuityRestartCheckpointV1;
  /** Lifecycle kinds the evaluator must be able to observe; not PlanBead titles. */
  observable_lifecycle_events: GoalContinuityLifecycleEventV1[];
  /** Optional physical target reused from A1 CapabilityPredicateV1. */
  physical_target?: CapabilityPredicateV1;
  physical_milestones?: CapabilityMilestoneV1[];
  allowed_physical_evidence_kinds: CapabilityAllowedEvidenceKindV1[];
  budgets: GoalContinuityBudgetsV1;
  seed_policy: GoalContinuitySeedPolicyV1;
};

export type GoalContinuityManifestV1 = {
  schema: typeof GOAL_CONTINUITY_MANIFEST_SCHEMA;
  suite_id: string;
  version: string;
  description: string;
  cases: GoalContinuityCaseV1[];
};

export type GoalContinuityLifecycleObservationStatusV1 =
  | "observed"
  | "missing"
  | "unknown"
  | "conflict";

export type GoalContinuityLifecycleObservationV1 = {
  event: GoalContinuityLifecycleEventV1;
  status: GoalContinuityLifecycleObservationStatusV1;
  source_artifact_refs: string[];
  details?: string;
};

export type GoalContinuityCheckpointConflictV1 = {
  source_artifact_ref: string;
  reason: string;
  expected_checkpoint_version?: number;
  before_checkpoint_version?: number;
  after_checkpoint_version?: number;
};

export type GoalContinuityFindingV1 = {
  kind:
    | "unsupported_physical_closure"
    | "stale_checkpoint"
    | "missing_ref"
    | "stale_goal_repetition"
    | "prose_cannot_prove_physical"
    | "useful_resume_after_interruption";
  status: "detected" | "absent" | "unknown";
  source_artifact_refs: string[];
  details?: string;
};

export type GoalContinuityPhysicalSectionV1 = {
  target?: CapabilityPredicateResultV1;
  milestones: CapabilityMilestoneReportV1[];
  interpretation_status: CapabilityInterpretationStatusV1;
  /** PlanBead/memory prose offered as physical proof and rejected. */
  prose_rejected_as_physical_proof: Array<{
    source_ref: string;
    reason: string;
  }>;
};

export type GoalContinuityContinuitySectionV1 = {
  interpretation_status: CapabilityInterpretationStatusV1;
  lifecycle_events: GoalContinuityLifecycleObservationV1[];
  open_work_survival: {
    status: "retained" | "lost" | "unknown";
    source_artifact_refs: string[];
    details?: string;
  };
  ready_front_changes: Array<{
    source_artifact_ref: string;
    ready_bead_ids: string[];
    in_progress_bead_ids: string[];
    blocked_bead_ids: string[];
  }>;
  findings: GoalContinuityFindingV1[];
  checkpoint_conflicts: GoalContinuityCheckpointConflictV1[];
};

export type GoalContinuityReportV1 = {
  schema: typeof GOAL_CONTINUITY_REPORT_SCHEMA;
  suite_id: string;
  suite_version: string;
  case_id: string;
  run_id: string;
  actor_id: string;
  /** Physical competence — never derived from PlanBead/memory prose. */
  physical: GoalContinuityPhysicalSectionV1;
  /** Continuity quality — PlanBead/episode/ready-front artifacts only. */
  continuity: GoalContinuityContinuitySectionV1;
  failure_classes: CapabilityFailureClassV1[];
};

/**
 * Offline join bag of saved JSON artifacts. Missing declared refs become
 * unknown/unverifiable; they never score as zero or success.
 */
export type GoalContinuityPlanBeadOperationResultArtifactV1 = {
  schema: "plan-bead-operation-result/v1";
  operation_result_id: string;
  actor_id: string;
  cycle_id: string;
  turn_id: string;
  op: "create" | "update_notes" | "set_status" | "add_dependency" | "invalid";
  status: "accepted" | "rejected";
  reason: string;
  bead_id?: string;
  evidence_refs: string[];
  created_at: string;
  before_checkpoint_version?: number;
  after_checkpoint_version?: number;
  expected_checkpoint_version?: number;
  operation?: {
    op: string;
    bead_id?: string;
    expected_checkpoint_version?: number;
    evidence_refs?: string[];
    patch?: {
      status?: string;
      close_kind?: string;
      close_reason?: string;
      title?: string;
      kind?: string;
    };
  };
};

export type GoalContinuityActiveEpisodeArtifactV1 = {
  schema: "active-episode/v1";
  episode_id: string;
  actor_id: string;
  purpose: string;
  current_focus: string;
  selected_plan_bead_refs: string[];
  related_plan_bead_refs: string[];
  status: "active" | "closing" | "deferred" | "blocked" | "completed";
  opened_from_refs: string[];
};

export type GoalContinuityReadyFrontArtifactV1 = {
  schema: "plan-bead-ready-front/v1";
  cycle_id: string;
  ready_bead_ids: string[];
  in_progress_bead_ids: string[];
  blocked_bead_ids: string[];
  physical_progress_claim: false;
};

export type GoalContinuityPlanBeadSnapshotArtifactV1 = {
  schema: "actor-plan-bead/v1";
  bead_id: string;
  actor_id: string;
  status: "open" | "in_progress" | "blocked" | "deferred" | "closed";
  title: string;
  acceptance_criteria: {
    evidence_required: string[];
    non_physical_resolution_allowed: boolean;
  };
  checkpoint: {
    version: number;
    close_kind?: string;
    close_reason?: string;
    evidence_refs: string[];
  };
  refs: {
    evidence_refs: string[];
    memory_refs: string[];
  };
  assertion_policy: {
    bead_is_context_not_authority: true;
    physical_success_requires_current_evidence: true;
  };
};

export type GoalContinuityMemoryNoteArtifactV1 = {
  schema: "continuity-memory-note/v1";
  note_id: string;
  prose: string;
  /** When true, evaluator must reject this note as physical proof. */
  claims_physical_progress: boolean;
};

export type GoalContinuityReferencedArtifactV1 = {
  ref: string;
  present: boolean;
  artifact?:
    | GoalContinuityPlanBeadOperationResultArtifactV1
    | GoalContinuityActiveEpisodeArtifactV1
    | GoalContinuityReadyFrontArtifactV1
    | GoalContinuityPlanBeadSnapshotArtifactV1
    | GoalContinuityMemoryNoteArtifactV1;
};

export type GoalContinuityArtifactBagV1 = {
  schema: typeof GOAL_CONTINUITY_ARTIFACT_BAG_SCHEMA;
  actor_id: string;
  run_id: string;
  /** Declared refs that must resolve; missing → unknown/unverifiable. */
  required_refs: string[];
  plan_bead_operation_results: GoalContinuityReferencedArtifactV1[];
  active_episodes: GoalContinuityReferencedArtifactV1[];
  ready_fronts: GoalContinuityReferencedArtifactV1[];
  plan_bead_snapshots: GoalContinuityReferencedArtifactV1[];
  memory_notes: GoalContinuityReferencedArtifactV1[];
  /** Optional physical evidence bag; absent when only continuity is scored. */
  physical_evidence?: CapabilityEvidenceBagV1;
};
