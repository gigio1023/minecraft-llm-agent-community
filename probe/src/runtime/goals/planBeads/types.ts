export const planBeadStatuses = [
  "open",
  "in_progress",
  "blocked",
  "deferred",
  "closed"
] as const;

export type PlanBeadStatus = (typeof planBeadStatuses)[number];

export const planBeadCloseKinds = [
  "satisfied",
  "abandoned",
  "superseded",
  "duplicate",
  "not_relevant"
] as const;

export type PlanBeadCloseKind = (typeof planBeadCloseKinds)[number];

export const planBeadKinds = [
  "concern",
  "obligation",
  "blocker_repair",
  "investigation",
  "resource_project",
  "relationship_repair",
  "action_skill_followup"
] as const;

export type PlanBeadKind = (typeof planBeadKinds)[number];

export type PlanBeadPriority = 0 | 1 | 2 | 3 | 4;

export type PlanBeadMetadataValue = string | number | boolean | string[];

/**
 * Artifact references that explain why a PlanBead exists or changed.
 *
 * PlanBeads carry links to evidence and context, but those links do not become
 * primitive parameters or runtime permission.
 */
export type PlanBeadRefs = {
  evidence_refs: string[];
  memory_refs: string[];
  judgment_refs: string[];
  cycle_goal_refs: string[];
  relationship_refs: string[];
  world_event_refs: string[];
  action_skill_refs: string[];
};

/**
 * Persistent actor-owned work-state record for concerns, blockers, obligations,
 * and resumable follow-up.
 *
 * @remarks The assertion policy is part of the serialized record so any
 * provider or reviewer packet keeps the central invariant visible: a PlanBead is
 * context, not executable authority, and physical success requires current
 * evidence.
 */
export type ActorPlanBead = {
  schema: "actor-plan-bead/v1";
  bead_id: string;
  actor_id: string;
  life_goal_id: string;
  run_id?: string;
  kind: PlanBeadKind;
  status: PlanBeadStatus;
  priority: PlanBeadPriority;
  title: string;
  description: string;
  design_notes: string;
  acceptance_criteria: {
    evidence_required: string[];
    non_physical_resolution_allowed: boolean;
  };
  notes: {
    completed: string[];
    in_progress: string[];
    blockers: string[];
    next: string[];
    key_decisions: string[];
  };
  labels: string[];
  metadata: Record<string, PlanBeadMetadataValue>;
  refs: PlanBeadRefs;
  checkpoint: {
    version: number;
    created_at: string;
    updated_at: string;
    last_touched_cycle_id?: string;
    close_kind?: PlanBeadCloseKind;
    close_reason?: string;
    evidence_refs: string[];
  };
  assertion_policy: {
    bead_is_context_not_authority: true;
    physical_success_requires_current_evidence: true;
  };
};

export const planBeadDependencyTypes = [
  "blocks",
  "parent_child",
  "waits_for",
  "tracks",
  "discovered_from",
  "caused_by",
  "validates",
  "relates_to",
  "supersedes"
] as const;

export type PlanBeadDependencyType = (typeof planBeadDependencyTypes)[number];

export type PlanBeadDependency = {
  schema: "actor-plan-bead-dependency/v1";
  actor_id: string;
  bead_id: string;
  depends_on_bead_id: string;
  type: PlanBeadDependencyType;
  rationale: string;
  evidence_refs: string[];
  created_at: string;
};

export type PlanBeadContextSummary = {
  bead_id: string;
  kind: PlanBeadKind;
  status: PlanBeadStatus;
  priority: PlanBeadPriority;
  title: string;
  description_summary: string;
  acceptance_evidence_required: string[];
  notes_next: string[];
  blockers: string[];
  labels: string[];
  evidence_refs: string[];
  dependency_refs: string[];
  checkpoint_version: number;
  checkpoint_ref: string;
};

/**
 * Compact provider-facing PlanBead context.
 *
 * @remarks `physical_progress_claim` must remain false. The packet may guide
 * CycleGoal or Actor Turn selection, while runtime action contracts and
 * verifiers still control execution and success.
 */
export type PlanBeadPacket = {
  schema: "plan-bead-packet/v1";
  physical_progress_claim: false;
  ready_beads: PlanBeadContextSummary[];
  in_progress_beads: PlanBeadContextSummary[];
  blocked_beads: PlanBeadContextSummary[];
  recently_closed_beads: Array<{
    bead_id: string;
    title: string;
    close_kind: PlanBeadCloseKind;
    close_reason: string;
    evidence_refs: string[];
  }>;
  graph_summary: {
    open_count: number;
    ready_count: number;
    blocked_count: number;
    deferred_count: number;
    closed_recent_count: number;
  };
  rules: {
    beads_are_context_not_authority: true;
    ready_front_guides_goal_selection: true;
    action_surface_controls_execution: true;
    runtime_verifies_physical_progress: true;
  };
};

export const planBeadOperationConfidences = [
  "observed",
  "reviewed",
  "inferred",
  "uncertain"
] as const;

export type PlanBeadOperationConfidence =
  (typeof planBeadOperationConfidences)[number];

/**
 * Raw PlanBead operation proposal accepted from provider or reviewer stages.
 *
 * @remarks Validation and application are intentionally separate so malformed
 * operations can be rejected individually without failing an entire
 * CycleJudgment.
 */
export type PlanBeadOperationBase = {
  schema: "plan-bead-operation/v1";
  actor_id: string;
  rationale: string;
  evidence_refs: string[];
  confidence: PlanBeadOperationConfidence;
  expected_checkpoint_version?: number;
};

export type PlanBeadOperation =
  | (PlanBeadOperationBase & {
      op: "create";
      patch: {
        kind: PlanBeadKind;
        title: string;
        description: string;
        acceptance_evidence_required: string[];
        notes_next: string[];
        priority: PlanBeadPriority;
      };
    })
  | (PlanBeadOperationBase & {
      op: "update_notes";
      bead_id: string;
      patch: Partial<ActorPlanBead["notes"]>;
    })
  | (PlanBeadOperationBase & {
      op: "set_status";
      bead_id: string;
      patch: {
        status: PlanBeadStatus;
        close_kind?: PlanBeadCloseKind;
        close_reason?: string;
      };
    })
  | (PlanBeadOperationBase & {
      op: "add_dependency";
      patch: Omit<PlanBeadDependency, "schema" | "actor_id" | "created_at">;
    });
