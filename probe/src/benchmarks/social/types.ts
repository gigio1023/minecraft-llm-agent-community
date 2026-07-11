import type { WorldScenarioId } from "../../server/worldScenarios.js";

/**
 * Interdependent social scenario declaration (V4 Step C1).
 *
 * Declares environment pressure and measurement settings only.
 * Must not prescribe trust, cooperation, refusal, specialization, partners,
 * promises, relationship labels, or social outcomes. Must not embed hidden
 * action plans or parameter suggestions.
 *
 * C2 family declarations live under `probe/benchmarks/social/scenarios/` and
 * are indexed by `socialScenarioFamilies.ts`. Do not expand family runners here.
 */
export const INTERDEPENDENT_SOCIAL_SCENARIO_SCHEMA =
  "interdependent-social-scenario/v1" as const;

export type SocialFixtureClassV1 = "natural_world" | "command_fixture" | "mixed";

export type SocialRoleAssignmentModeV1 = "assigned" | "negotiable" | "unassigned";

export type SocialActivityKindV1 = "economic" | "cooperative" | "quest";

export type SocialAsymmetryKindV1 = "resource" | "access" | "information";

export type SocialActivityDependencyV1 =
  | "resource_flow"
  | "shared_infrastructure"
  | "competing_demand"
  | "sequential_unlock";

export type SocialMaterialStakeKindV1 =
  | "possession"
  | "access"
  | "place"
  | "station"
  | "tool"
  | "food"
  | "cache"
  | "shared_infrastructure";

export type SocialProvenanceSourceKindV1 = "authored" | "catalog_derived" | "experimental";

/** Actor identity + profile ref. Assigned setup roles are initial conditions, not relationship outcomes. */
export type SocialActorProfileRefV1 = {
  actor_id: string;
  profile_ref: string;
  /** Present only when role_assignment_mode is `assigned`. */
  assigned_setup_role?: string;
};

export type SocialModelActorAssignmentV1 = {
  actor_id: string;
  provider_id: string;
  model: string;
};

export type SocialModelAssignmentV1 = {
  /** Whether actors are intended for capability-comparable analysis. */
  comparable_capability: boolean;
  assignments: SocialModelActorAssignmentV1[];
};

export type SocialAsymmetryV1 = {
  asymmetry_id: string;
  kind: SocialAsymmetryKindV1;
  description: string;
  visible_to: "all" | "holders" | "none";
  holder_actor_ids: string[];
  subject: string;
};

export type SocialActivityNodeV1 = {
  activity_id: string;
  kind: SocialActivityKindV1;
  title: string;
  description: string;
};

export type SocialActivityEdgeV1 = {
  from_activity_id: string;
  to_activity_id: string;
  dependency: SocialActivityDependencyV1;
  description: string;
};

export type SocialActivityGraphV1 = {
  nodes: SocialActivityNodeV1[];
  edges: SocialActivityEdgeV1[];
};

/**
 * Required individual capability either cites resolvable benchmark evidence
 * or explicitly declares an evidence gap. Fixture progress is never evidence.
 */
export type SocialCapabilityRequirementV1 =
  | {
      capability_case_id: string;
      evidence_status: "resolved";
      evidence_ref: string;
      suite_id?: string;
    }
  | {
      capability_case_id: string;
      evidence_status: "declared_gap";
      gap_reason: string;
    };

export type SocialInteractionOpportunityV1 = {
  opportunity_id: string;
  description: string;
  involved_actor_ids: string[];
};

export type SocialMaterialStakeV1 = {
  stake_id: string;
  kind: SocialMaterialStakeKindV1;
  description: string;
  affected_actor_ids: string[];
};

export type SocialResponseWindowSettingsV1 = {
  /**
   * Windows close only after each other active actor completes at least one
   * subsequent Actor Turn slot, or the declared timeout fires.
   */
  require_subsequent_actor_turn: true;
  timeout_ms: number;
};

export type SocialMetricSettingsV1 = {
  record_goal_series: boolean;
  record_action_series: boolean;
  record_resource_series: boolean;
  record_interaction_series: boolean;
  record_spatial_series: boolean;
};

export type SocialVisualSettingsV1 = {
  capture_first_person: boolean;
  capture_third_person: boolean;
  capture_video: boolean;
  /** Pixels are review-only; they never decide Minecraft or social state. */
  pixels_are_review_only: true;
};

export type SocialBudgetSettingsV1 = {
  max_cycles: number;
  max_runtime_actions_per_actor: number;
  max_wall_time_ms: number;
  max_provider_requests?: number;
  max_total_tokens?: number;
  max_estimated_cost?: number;
};

export type SocialProvenanceV1 = {
  source_kind: SocialProvenanceSourceKindV1;
  source_ref: string;
  reset_refs: string[];
  notes?: string;
};

export type InterdependentSocialScenarioV1 = {
  schema: typeof INTERDEPENDENT_SOCIAL_SCENARIO_SCHEMA;
  scenario_id: string;
  version: string;
  title: string;
  description: string;
  world_scenario_id: WorldScenarioId;
  /**
   * Declares whether world setup uses natural spawn, command fixtures, or both.
   * Fixture progress must never be credited as actor progress.
   */
  fixture_class: SocialFixtureClassV1;
  /** Must be false. Command/mixed fixture setup is never actor competence. */
  fixture_progress_credited_to_actors: false;
  /** Must be false. Scenario creates opportunity, not a required social response. */
  social_response_prescribed: false;
  actor_count: number;
  actor_profiles: SocialActorProfileRefV1[];
  model_assignment: SocialModelAssignmentV1;
  role_assignment_mode: SocialRoleAssignmentModeV1;
  asymmetries: SocialAsymmetryV1[];
  activity_graph: SocialActivityGraphV1;
  required_capabilities: SocialCapabilityRequirementV1[];
  interaction_opportunities: SocialInteractionOpportunityV1[];
  material_stakes: SocialMaterialStakeV1[];
  response_window: SocialResponseWindowSettingsV1;
  metrics: SocialMetricSettingsV1;
  visual: SocialVisualSettingsV1;
  budgets: SocialBudgetSettingsV1;
  provenance: SocialProvenanceV1;
};
