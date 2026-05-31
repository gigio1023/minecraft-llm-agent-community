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

export type PlanBeadRefs = {
  evidence_refs: string[];
  memory_refs: string[];
  judgment_refs: string[];
  cycle_goal_refs: string[];
  relationship_refs: string[];
  world_event_refs: string[];
  action_skill_refs: string[];
};

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
  checkpoint_ref: string;
};

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
