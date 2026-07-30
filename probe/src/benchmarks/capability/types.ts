import type { WorldScenarioId } from "../../server/worldScenarios.js";

/** Closed runtime-recorded evidence categories. Prose/video/screenshot never decide targets. */
export const CAPABILITY_ALLOWED_EVIDENCE_KINDS = [
  "inventory",
  "held_item",
  "tool_attempt",
  "settlement",
  "block_observation",
  "container",
  "actor_position"
] as const;

export type CapabilityAllowedEvidenceKindV1 =
  (typeof CAPABILITY_ALLOWED_EVIDENCE_KINDS)[number];

export type CapabilityPredicateV1 =
  | { op: "item_count_gte"; item: string; count: number; owner: "actor" }
  | { op: "held_item_is"; item: string }
  | { op: "block_observed_at"; block: string; position_ref: string }
  | { op: "position_within"; center_ref: string; radius: number }
  | { op: "container_item_count_gte"; container_ref: string; item: string; count: number }
  | { op: "all"; children: CapabilityPredicateV1[] }
  | { op: "any"; children: CapabilityPredicateV1[] };

export type CapabilityMilestoneV1 = {
  milestone_id: string;
  title: string;
  predicate: CapabilityPredicateV1;
  order: number | null;
  weight: number;
};

export type IndividualCapabilityCaseV1 = {
  case_id: string;
  title: string;
  top_level_goal: string;
  world_scenario_id: WorldScenarioId;
  fixture_class: "natural_world" | "command_fixture" | "mixed";
  required_capabilities: string[];
  budgets: {
    max_cycles: number;
    max_runtime_actions: number;
    max_wall_time_ms: number;
    max_provider_requests?: number;
    max_total_tokens?: number;
    max_estimated_cost?: number;
  };
  target: CapabilityPredicateV1;
  milestones: CapabilityMilestoneV1[];
  allowed_evidence_kinds: CapabilityAllowedEvidenceKindV1[];
  seed_policy: {
    kind: "fixed" | "declared_set" | "fresh";
    seeds?: string[];
    repeats: number;
  };
  completion_policy: {
    require_target: boolean;
    partial_credit: "milestones" | "none";
  };
};

export type IndividualCapabilityManifestV1 = {
  schema: "individual-capability-manifest/v1";
  suite_id: string;
  version: string;
  description: string;
  cases: IndividualCapabilityCaseV1[];
};

export type CapabilityPredicateResultV1 = {
  status: "passed" | "failed" | "unknown";
  evidence_refs: string[];
  missing_evidence?: string[];
  unsupported?: string[];
  reasons?: string[];
};
