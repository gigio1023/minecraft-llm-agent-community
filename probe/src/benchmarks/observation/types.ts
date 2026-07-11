/**
 * Long-run observation bundle contracts (V4 Slice C3).
 *
 * Offline, provider-free schemas for joinable run/cycle/actor/timestamp
 * structured evidence, descriptive metric placeholders, optional visual/video
 * review refs, and explicit dropped-capture / missing-evidence records.
 *
 * Pixels and video are review-only. Metrics describe runs; they do not prove
 * trust, culture, economy, friendship, or society. Public analysis exports must
 * not leak private actor state.
 *
 * TODO(D1): phenomenon-record/v1 cites these bundles; do not expand catalog
 * promotion workflow here.
 */

/** Fixed join keys for structured evidence, metrics, and visual/video refs. */
export const OBSERVATION_JOIN_KEYS = [
  "run_id",
  "cycle_id",
  "actor_id",
  "timestamp"
] as const;

export type ObservationJoinKeyNameV1 = (typeof OBSERVATION_JOIN_KEYS)[number];

export type ObservationJoinKeyV1 = {
  run_id: string;
  cycle_id: string;
  actor_id: string;
  /** ISO-8601 timestamp fixed as the fourth join key. */
  timestamp: string;
};

export const LONG_RUN_OBSERVATION_BUNDLE_SCHEMA =
  "long-run-observation-bundle/v1" as const;
export const MULTI_ACTOR_REPORT_INDEX_SCHEMA = "multi-actor-report-index/v1" as const;
export const PUBLIC_ANALYSIS_EXPORT_SCHEMA = "public-analysis-export/v1" as const;

export const OBSERVATION_METRIC_SERIES = [
  "goal",
  "action",
  "resource",
  "interaction",
  "spatial_co_presence",
  "role_concentration",
  "commitment",
  "stall",
  "continuity",
  "robustness",
  "efficiency",
  "cost"
] as const;

export type ObservationMetricSeriesV1 = (typeof OBSERVATION_METRIC_SERIES)[number];

export const OBSERVATION_VISUAL_KINDS = [
  "first_person",
  "third_person",
  "overview"
] as const;

export type ObservationVisualKindV1 = (typeof OBSERVATION_VISUAL_KINDS)[number];

export const OBSERVATION_CAPTURE_KINDS = [
  "first_person",
  "third_person",
  "video",
  "screenshot",
  "overview"
] as const;

export type ObservationCaptureKindV1 = (typeof OBSERVATION_CAPTURE_KINDS)[number];

/**
 * Keys that must never appear in public analysis exports.
 * Aligned with public-history private omissions.
 */
export const OBSERVATION_PRIVATE_FIELD_KEYS = [
  "soul",
  "soul_text",
  "actor_soul",
  "life_goal",
  "memory",
  "planbeads",
  "plan_beads",
  "provider_input",
  "provider_output",
  "provider_input_refs",
  "provider_output_refs",
  "prompt",
  "raw_output",
  "relationship_prose",
  "private_actor_state",
  "actor_workspace_private",
  "rationale_private"
] as const;

export type ObservationPrivateFieldKeyV1 =
  (typeof OBSERVATION_PRIVATE_FIELD_KEYS)[number];

export type ObservationActorDependencyRefsV1 = {
  actor_id: string;
  provider_id: string;
  model: string;
  /** Capability report or case evidence refs; empty when gap declared elsewhere. */
  capability_refs: string[];
  /** Continuity report or PlanBead workspace refs (public-safe paths only). */
  continuity_refs: string[];
};

export type ObservationEnvironmentProvenanceV1 = {
  server_ref?: string;
  seed_ref?: string;
  reset_refs: string[];
  reconnect_refs: string[];
  world_scenario_id?: string;
  notes?: string;
};

export type ObservationRunDeclarationV1 = {
  run_id: string;
  scenario_id: string;
  scenario_version: string;
  /** Relative path-safe ref to the scenario declaration artifact. */
  scenario_ref: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  seed?: string;
  actors: ObservationActorDependencyRefsV1[];
  environment_provenance: ObservationEnvironmentProvenanceV1;
  provider_usage_ref?: string;
  /** Fixture bundles must set true so they are never treated as research results. */
  is_fixture: boolean;
};

/**
 * One descriptive metric sample. `value` may be null as an explicit placeholder
 * when the series is declared but not yet computed from structured evidence.
 */
export type ObservationMetricPointV1 = ObservationJoinKeyV1 & {
  series: ObservationMetricSeriesV1;
  metric_key: string;
  value: number | null;
  unit?: string;
  /** Structured evidence only; visual/video refs alone are insufficient. */
  evidence_refs: string[];
  notes?: string;
};

export type ObservationMetricsBagV1 = {
  [K in ObservationMetricSeriesV1]: ObservationMetricPointV1[];
};

/**
 * Optional screenshot/visual review pointer. Never establishes Minecraft or
 * social truth by itself.
 */
export type ObservationVisualReviewRefV1 = ObservationJoinKeyV1 & {
  kind: ObservationVisualKindV1;
  artifact_ref: string;
  review_only: true;
  /** Same-run structured evidence paired for review; may be empty when missing. */
  paired_structured_evidence_refs: string[];
};

/**
 * Optional video segment review pointer. Segment bounds are review aids only.
 */
export type ObservationVideoSegmentRefV1 = ObservationJoinKeyV1 & {
  artifact_ref: string;
  review_only: true;
  start_ms?: number;
  end_ms?: number;
  paired_structured_evidence_refs: string[];
};

export type ObservationDroppedCaptureV1 = ObservationJoinKeyV1 & {
  capture_kind: ObservationCaptureKindV1;
  reason: string;
  /** Missing pixels never rewrite Minecraft or social state. */
  does_not_change_minecraft_truth: true;
};

export type ObservationMissingEvidenceV1 = ObservationJoinKeyV1 & {
  evidence_kind: string;
  reason: string;
  related_claim?: string;
};

export type LongRunObservationBundleV1 = {
  schema: typeof LONG_RUN_OBSERVATION_BUNDLE_SCHEMA;
  run_declaration: ObservationRunDeclarationV1;
  metrics: ObservationMetricsBagV1;
  visual_refs: ObservationVisualReviewRefV1[];
  video_segment_refs: ObservationVideoSegmentRefV1[];
  dropped_captures: ObservationDroppedCaptureV1[];
  missing_evidence: ObservationMissingEvidenceV1[];
  /** Cite raw artifacts rather than copying provider stories. */
  structured_artifact_refs: string[];
  pixels_are_review_only: true;
  /** Metrics describe runs; they are not society / trust / economy labels. */
  metrics_are_descriptive_only: true;
};

export type MultiActorReportIndexEntryV1 = {
  run_id: string;
  scenario_id: string;
  scenario_version: string;
  bundle_ref: string;
  actor_ids: string[];
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  dropped_capture_count: number;
  missing_evidence_count: number;
  has_visual_refs: boolean;
  has_video_refs: boolean;
  is_fixture: boolean;
};

export type MultiActorReportIndexV1 = {
  schema: typeof MULTI_ACTOR_REPORT_INDEX_SCHEMA;
  index_id: string;
  generated_at: string;
  runs: MultiActorReportIndexEntryV1[];
};

/**
 * Public-safe analysis export. Must omit private actor state and must not
 * elevate visual/video refs to Minecraft truth.
 */
export type PublicAnalysisExportV1 = {
  schema: typeof PUBLIC_ANALYSIS_EXPORT_SCHEMA;
  run_id: string;
  scenario_id: string;
  scenario_version: string;
  actor_ids: string[];
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  join_keys: typeof OBSERVATION_JOIN_KEYS;
  metric_series_present: ObservationMetricSeriesV1[];
  metric_point_counts: Record<ObservationMetricSeriesV1, number>;
  structured_artifact_refs: string[];
  visual_ref_count: number;
  video_segment_ref_count: number;
  dropped_capture_count: number;
  missing_evidence_count: number;
  pixels_are_review_only: true;
  metrics_are_descriptive_only: true;
  is_fixture: boolean;
  private_fields_omitted: true;
};
