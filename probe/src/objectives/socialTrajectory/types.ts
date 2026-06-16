export type GroundedSocialEventType =
  | "request"
  | "promise"
  | "refusal"
  | "loan"
  | "handoff"
  | "return"
  | "shared_deposit"
  | "shared_inspect"
  | "shared_withdraw"
  | "craft"
  | "obligation_update"
  | "relationship_update"
  | "memory_write"
  | "blocker";

export type GroundedSocialActor = {
  actor_id: string;
  role: "quartermaster" | "gatherer" | "crafter" | "observer";
  life_goal: string;
};

export type GroundedSocialEvent = {
  event_id: string;
  cycle: number;
  actor_id: string;
  type: GroundedSocialEventType;
  target_actor_id?: string;
  item_id?: string;
  count?: number;
  container_id?: string;
  expected_minecraft_action?: string;
  observed_minecraft_result?: string;
  evidence_refs: string[];
  notes?: string;
};

export type GroundedSocialTrajectoryInput = {
  schema: "grounded-social-trajectory-input/v1";
  run_id: string;
  created_at: string;
  scenario_id: string;
  provider: {
    id: "deterministic" | "none" | string;
    model: string;
    live_provider_calls: number;
  };
  environment: {
    world_seed?: string;
    world_scenario_id?: string;
    live_minecraft_server: boolean;
    notes?: string;
  };
  actors: GroundedSocialActor[];
  events: GroundedSocialEvent[];
};

export type GroundedSocialDimensionId =
  | "physical_contribution"
  | "social_exchange"
  | "cross_actor_consumption"
  | "memory_or_relationship_continuity"
  | "auditability";

export type GroundedSocialDimensionScore = {
  id: GroundedSocialDimensionId;
  label: string;
  weight: number;
  score: number;
  passed: boolean;
  evidence_event_ids: string[];
  findings: string[];
};

export type GroundedSocialHarnessDimensionId =
  | "event_integrity"
  | "chat_action_coherence"
  | "action_awareness_trace"
  | "cross_actor_causality"
  | "continuity_state";

export type GroundedSocialHarnessDimensionScore = {
  id: GroundedSocialHarnessDimensionId;
  label: string;
  weight: number;
  score: number;
  passed: boolean;
  evidence_event_ids: string[];
  findings: string[];
};

export type GroundedSocialHarnessAuditReport = {
  schema: "grounded-social-harness-audit/v1";
  summary: {
    score: number;
    max_score: number;
    status: "passed" | "partial" | "failed";
    blocking_findings: string[];
  };
  dimensions: GroundedSocialHarnessDimensionScore[];
  notes: string[];
};

export type GroundedSocialTrajectoryReport = {
  schema: "grounded-social-trajectory-report/v1";
  run_id: string;
  created_at: string;
  scenario_id: string;
  provider: GroundedSocialTrajectoryInput["provider"];
  environment: GroundedSocialTrajectoryInput["environment"];
  actors: GroundedSocialActor[];
  summary: {
    score: number;
    max_score: number;
    status: "passed" | "partial" | "failed";
    event_count: number;
    evidence_ref_count: number;
    first_social_event_cycle?: number;
    first_shared_contribution_cycle?: number;
    first_cross_actor_consumption_cycle?: number;
  };
  dimensions: GroundedSocialDimensionScore[];
  harness_audit: GroundedSocialHarnessAuditReport;
  events: GroundedSocialEvent[];
  notes: string[];
};
