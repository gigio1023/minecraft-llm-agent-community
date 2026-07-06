import type { SocialCycleProviderId } from "../runtime/goals/types.js";
import type { JsonValue } from "../provider/inputSnapshot.js";

export type LegibilityCondition =
  | "scripted_responder"
  | "stable_soul"
  | "resampled_soul";

export type LegibilityLayer = "social_response" | "material_access";

export type LegibilitySocialResponseLabel =
  | "no_observable_response"
  | "reply_accept_or_acknowledge"
  | "reply_refuse_or_disagree"
  | "approach_or_follow"
  | "retreat_or_avoid"
  | "reciprocate_or_help"
  | "contest_or_interrupt"
  | "repair_or_compensate"
  | "acts_on_changed_affordance"
  | "unknown_social_response";

export type LegibilityMaterialAccessLabel =
  | "no_material_delta"
  | "inventory_gain"
  | "inventory_loss"
  | "container_gain"
  | "container_loss"
  | "possession_or_access_granted"
  | "possession_or_access_refused"
  | "public_affordance_created"
  | "public_affordance_used"
  | "claim_or_obligation_event_recorded"
  | "unknown_material_delta";

export type LegibilityLabel =
  | LegibilitySocialResponseLabel
  | LegibilityMaterialAccessLabel;

export type ActorProviderRoute = {
  actor_id: string;
  provider_id: SocialCycleProviderId;
  model: string;
  condition?: LegibilityCondition;
};

export type ActorTurnSlotCompletionEvent = {
  schema: "actor-turn-slot-completion/v1";
  session_id: string;
  slot_index: number;
  actor_id: string;
  provider_id: SocialCycleProviderId;
  model: string;
  turn_id: string;
  cycle_id: string;
  action_kind: string;
  action_ref?: string;
  started_at: string;
  completed_at: string;
  evidence_refs: string[];
};

export type StructuredChatEvent = {
  schema: "structured-chat-event/v1";
  session_id: string;
  speaker_id: string;
  message: string;
  observed_by: string[];
  slot_index: number;
  observed_at: string;
  position?: { x: number; y: number; z: number };
  evidence_refs: string[];
};

export type ResponseWindowCloseReason =
  | "all_other_actor_slots_completed"
  | "timeout";

export type ResponseWindowRecord = {
  schema: "response-window/v1";
  window_id: string;
  session_id: string;
  focal_actor_id: string;
  focal_turn_id: string;
  focal_slot_index: number;
  required_responder_actor_ids: string[];
  completed_responder_actor_ids: string[];
  opened_at: string;
  closed_at?: string;
  close_reason?: ResponseWindowCloseReason;
  timeout_after_slots: number;
  status: "open" | "closed";
  response_chat_events: StructuredChatEvent[];
  evidence_refs: string[];
};

export type TransitionRowV1 = {
  schema_version: "transition-row/v1";
  row_id: string;
  session_id: string;
  seed_or_reset_id: string;
  cycle_index: number;
  actor_id: string;
  condition: LegibilityCondition;
  timestamps: {
    action_selected_at: string;
    action_started_at: string;
    action_finished_at: string;
    response_window_closed_at?: string;
    label_locked_at?: string;
  };
  state_before: {
    snapshot_ref: string;
    other_actors: {
      visible_actor_ids: string[];
      interaction_range_actor_ids: string[];
      loaded_world_caveat: string;
    };
    social_context_refs: {
      recent_interaction_refs: string[];
    };
  };
  executed_action: {
    action_kind: string;
    action_card_id?: string;
    runtime_action_id: string;
    structured_args_ref?: string;
    validation_status: "passed" | "failed" | "not_applicable";
    permission_status: "passed" | "failed" | "not_applicable";
    action_started: true;
  };
  observed_delta: {
    physical: {
      classes: string[];
      evidence_refs: string[];
    };
    material: {
      classes: LegibilityMaterialAccessLabel[];
      evidence_refs: string[];
    };
    social_response: {
      response_window: ResponseWindowRecord;
      classes: LegibilitySocialResponseLabel[];
      evidence_refs: string[];
    };
    exclusions: Array<{ reason: string; evidence_refs: string[] }>;
  };
  row_quality: {
    verdict: "valid" | "partial" | "excluded";
    inclusion_tags: string[];
    exclusion_reasons: string[];
    notes: string[];
  };
  metadata: {
    provider: SocialCycleProviderId;
    model: string;
    scenario_family_id: string;
    scenario_family_ids: string[];
    artifact_refs: string[];
  };
};

export type LegibilitySessionArtifact = {
  schema: "legibility-session/v1";
  session_id: string;
  created_at: string;
  actor_routes: ActorProviderRoute[];
  slot_events: ActorTurnSlotCompletionEvent[];
  chat_events: StructuredChatEvent[];
  response_windows: ResponseWindowRecord[];
  transition_rows: TransitionRowV1[];
};

export type PublicHistoryEvent = {
  event_id: string;
  session_id: string;
  slot_index: number;
  actor_id: string;
  event_kind:
    | "actor_turn_completed"
    | "chat_observed"
    | "response_window_closed"
    | "material_label_locked";
  public_payload: Record<string, JsonValue>;
  evidence_refs: string[];
};

export type PublicHistoryArtifact = {
  schema: "public-history/v1";
  session_id: string;
  created_at: string;
  allowlist_version: "public-history-allowlist/v1";
  allowlisted_fields: string[];
  events: PublicHistoryEvent[];
  leakage_checks: {
    schema: "public-history-leakage-checks/v1";
    identity_permutation: {
      status: "passed" | "failed";
      reason: string;
    };
    prompt_shape: {
      status: "passed" | "failed";
      reason: string;
    };
    private_field_scan: {
      status: "passed" | "failed";
      omitted_private_key_count: number;
      unknown_key_failures: string[];
    };
  };
};

export type ExperimentDeclarationV1 = {
  schema_version: "experiment-declaration/v1";
  experiment_id: string;
  written_at: string;
  conditions: Array<{
    condition: LegibilityCondition;
    actor_ids: string[];
    counterbalancing: string;
  }>;
  public_private_boundary: {
    public_history_allowlist_version: "public-history-allowlist/v1";
    forbidden_fields: string[];
  };
  scenario_families: string[];
  predictor_arms: string[];
  input_cutoff: "before_action_started_at";
  metrics: {
    include_per_condition_lift: true;
    include_rer: true;
    include_matched_stratum: true;
    include_auc: true;
    bootstrap_grouping: "seed_or_reset_id";
    ci_level: number;
  };
  label_locking: {
    required_before_prediction_join: true;
  };
  leakage_tests: string[];
  stop_results: string[];
  provider_budget: {
    provider_free: boolean;
    preflight_ref?: string;
  };
  seed_reset_refs: string[];
};

export type LegibilityPrediction = {
  schema_version: "legibility-prediction/v1";
  prediction_id: string;
  row_id: string;
  predictor_arm: string;
  layer: LegibilityLayer;
  predicted_label: LegibilityLabel;
  probabilities: Record<string, number>;
  created_at: string;
};

export type JoinedLegibilityPrediction = LegibilityPrediction & {
  actual_label: LegibilityLabel;
  condition: LegibilityCondition;
  seed_or_reset_id: string;
  stratum_id: string;
};

export type LegibilityScoreReport = {
  schema: "legibility-score-report/v1";
  experiment_id: string;
  scored_at: string;
  declaration_ref: string;
  row_count: number;
  joined_prediction_count: number;
  metrics: Array<{
    condition: LegibilityCondition;
    layer: LegibilityLayer;
    predictor_arm: string;
    baseline_arm: string;
    support: number;
    macro_f1: number;
    majority_macro_f1: number;
    lift: number;
    brier: number;
    majority_brier: number;
    rer_brier: number;
    matched_stratum_macro_f1: number;
    auc_lift_over_0_5: number;
    bootstrap_ci: { low: number; high: number; iterations: number };
  }>;
  notes: string[];
};
