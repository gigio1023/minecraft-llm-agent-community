/**
 * Phenomenon catalog formats for V4 Step D1.
 *
 * A phenomenon-record/v1 is an evidence-linked observation candidate, not a
 * scientific claim or locked research label. Fixture records must stay labeled
 * as fixtures and never as research results. Negative, boring, and retired
 * candidates remain first-class catalog entries.
 *
 * Only the user or an explicitly delegated reviewer may promote status to
 * `selected_for_followup` via an explicit `reviewer_decision`. Writers default
 * status to `candidate`.
 */

export const PHENOMENON_RECORD_SCHEMA = "phenomenon-record/v1" as const;
export const PHENOMENON_CATALOG_INDEX_SCHEMA = "phenomenon-catalog-index/v1" as const;

export const PHENOMENON_STATUSES = [
  "candidate",
  "selected_for_followup",
  "retired"
] as const;

export type PhenomenonStatusV1 = (typeof PHENOMENON_STATUSES)[number];

export const PHENOMENON_RECORD_KINDS = ["fixture", "observation"] as const;

export type PhenomenonRecordKindV1 = (typeof PHENOMENON_RECORD_KINDS)[number];

/**
 * Observation class is independent of status so negative/boring candidates
 * remain searchable after retirement or while still candidate.
 */
export const PHENOMENON_OBSERVATION_CLASSES = [
  "neutral",
  "negative",
  "boring",
  "degenerate"
] as const;

export type PhenomenonObservationClassV1 =
  (typeof PHENOMENON_OBSERVATION_CLASSES)[number];

export const PHENOMENON_ALTERNATIVE_EXPLANATION_KINDS = [
  "competence",
  "prompt",
  "role",
  "fixture",
  "evaluator"
] as const;

export type PhenomenonAlternativeExplanationKindV1 =
  (typeof PHENOMENON_ALTERNATIVE_EXPLANATION_KINDS)[number];

export const PHENOMENON_REVIEWER_ROLES = ["user", "delegated_reviewer"] as const;

export type PhenomenonReviewerRoleV1 = (typeof PHENOMENON_REVIEWER_ROLES)[number];

export const PHENOMENON_REVIEWER_DECISIONS = [
  "keep_candidate",
  "select_for_followup",
  "retire"
] as const;

export type PhenomenonReviewerDecisionKindV1 =
  (typeof PHENOMENON_REVIEWER_DECISIONS)[number];

/** Recurrence requires both numerator and denominator; a lone quote is not enough. */
export type PhenomenonRecurrenceV1 = {
  /** Count of runs/windows where the pattern was observed. */
  numerator: number;
  /** Count of comparable runs/windows examined. Must be >= 1 and >= numerator. */
  denominator: number;
  notes?: string;
};

export type PhenomenonScenarioVersionRefV1 = {
  scenario_id: string;
  version: string;
};

export type PhenomenonModelConfigurationV1 = {
  actor_id: string;
  provider_id: string;
  model: string;
};

export type PhenomenonAlternativeExplanationV1 = {
  kind: PhenomenonAlternativeExplanationKindV1;
  explanation: string;
};

/**
 * Explicit reviewer decision for status changes. Writers must receive this field
 * to promote to `selected_for_followup`; absent decision defaults to candidate.
 */
export type PhenomenonReviewerDecisionV1 = {
  reviewer_role: PhenomenonReviewerRoleV1;
  decision: PhenomenonReviewerDecisionKindV1;
  rationale: string;
  decided_at: string;
};

/** Persisted user/reviewer decision attached when status leaves plain candidate. */
export type PhenomenonUserDecisionV1 = {
  status: PhenomenonStatusV1;
  rationale: string;
  decided_by: PhenomenonReviewerRoleV1;
  decided_at: string;
};

export type PhenomenonRecordV1 = {
  schema: typeof PHENOMENON_RECORD_SCHEMA;
  phenomenon_id: string;
  title: string;
  status: PhenomenonStatusV1;
  /** Fixture catalog entries exercise writer/index behavior and are not research results. */
  record_kind: PhenomenonRecordKindV1;
  observation_class: PhenomenonObservationClassV1;
  /** Concise recurring pattern description. */
  pattern: string;
  scenario_versions: PhenomenonScenarioVersionRefV1[];
  run_refs: string[];
  seeds: string[];
  actor_ids: string[];
  model_configurations: PhenomenonModelConfigurationV1[];
  recurrence: PhenomenonRecurrenceV1;
  material_stake_refs: string[];
  opportunity_refs: string[];
  evidence_refs: string[];
  visual_segment_refs: string[];
  capability_refs: string[];
  continuity_refs: string[];
  alternative_explanations: PhenomenonAlternativeExplanationV1[];
  /** Distinguishing change or control that would separate alternative explanations. */
  proposed_control: string;
  user_decision?: PhenomenonUserDecisionV1;
};

export type PhenomenonCatalogIndexEntryV1 = {
  phenomenon_id: string;
  title: string;
  status: PhenomenonStatusV1;
  record_kind: PhenomenonRecordKindV1;
  observation_class: PhenomenonObservationClassV1;
  pattern: string;
  scenario_ids: string[];
  scenario_versions: string[];
  run_refs: string[];
  seeds: string[];
  actor_ids: string[];
  models: string[];
  recurrence_numerator: number;
  recurrence_denominator: number;
  material_stake_refs: string[];
  opportunity_refs: string[];
  capability_refs: string[];
  continuity_refs: string[];
  record_ref: string;
};

export type PhenomenonCatalogIndexV1 = {
  schema: typeof PHENOMENON_CATALOG_INDEX_SCHEMA;
  updated_at: string;
  entries: PhenomenonCatalogIndexEntryV1[];
};

export type PhenomenonCatalogSearchQueryV1 = {
  status?: PhenomenonStatusV1 | readonly PhenomenonStatusV1[];
  observation_class?:
    | PhenomenonObservationClassV1
    | readonly PhenomenonObservationClassV1[];
  record_kind?: PhenomenonRecordKindV1 | readonly PhenomenonRecordKindV1[];
  scenario_id?: string;
  actor_id?: string;
  model?: string;
  seed?: string;
  /** Case-insensitive substring match against title and pattern. */
  text?: string;
  /** When false, exclude fixtures. Default true (fixtures remain searchable). */
  include_fixtures?: boolean;
  /** When false, exclude retired. Default true (retired remain searchable). */
  include_retired?: boolean;
  /** When false, exclude negative/boring/degenerate. Default true. */
  include_negative_or_boring?: boolean;
};
