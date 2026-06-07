import type { GeneratedActionSkillCandidate } from "../types.js";

export type { GeneratedActionSkillCandidate };

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export const activeEpisodeStatuses = [
  "active",
  "closing",
  "deferred",
  "blocked",
  "completed"
] as const;

export type ActiveEpisodeStatus = (typeof activeEpisodeStatuses)[number];

export const actionCardReadinesses = [
  "ready",
  "risky",
  "requires_current_state_check"
] as const;

export type ActionCardReadiness = (typeof actionCardReadinesses)[number];

export const actorTurnChoices = [
  "use_existing_action",
  "author_mineflayer_action"
] as const;

export type ActorTurnChoice = (typeof actorTurnChoices)[number];

export const actorTurnExpectedOutcomes = [
  "world_block_delta",
  "inventory_delta",
  "equipment_delta",
  "position_delta",
  "social_delta",
  "diagnostic_unlock",
  "record_blocker_or_done"
] as const;

export type ActorTurnExpectedOutcome = (typeof actorTurnExpectedOutcomes)[number];

export const evidenceTraceOutcomes = [
  "verified_mutation",
  "position_delta",
  "partial_verified_progress",
  "blocked",
  "rejected_by_contract",
  "timed_out",
  "no_progress",
  "environment_blocked"
] as const;

export type EvidenceTraceOutcome = (typeof evidenceTraceOutcomes)[number];

export const deliberationBranchReasons = [
  "episode_success",
  "episode_blocked",
  "repeated_exact_blocker",
  "new_social_pressure",
  "danger_or_survival_pressure",
  "missing_affordance",
  "context_change",
  "budget_or_compaction_pressure",
  "user_or_world_event"
] as const;

export type DeliberationBranchReason = (typeof deliberationBranchReasons)[number];

export const episodeVerdictStatuses = [
  "passed",
  "failed",
  "blocked",
  "deferred",
  "environment_blocked",
  "provider_budget_blocker"
] as const;

export type EpisodeVerdictStatus = (typeof episodeVerdictStatuses)[number];

export const episodeFailureClassifications = [
  "misleading-success",
  "artifact-gap",
  "tool-evidence-gap",
  "verification-gap",
  "provider-schema-gap",
  "action-timidness",
  "reckless-action",
  "loop-constriction",
  "provider-repeat",
  "retry-gate-gap",
  "state-consolidation-gap",
  "social-surface-gap",
  "relationship-evidence-gap",
  "episode-continuity-loss",
  "compaction-laundering",
  "harness-narrowing",
  "provider-budget-blocker",
  "environment-blocked"
] as const;

export type EpisodeFailureClassification =
  (typeof episodeFailureClassifications)[number];

export type EvidenceExpectation = {
  kind:
    | "inventory_delta"
    | "position_delta"
    | "block_delta"
    | "container_delta"
    | "chat_event"
    | "relationship_event"
    | "shared_storage_event"
    | "world_scan"
    | "runtime_artifact";
  description: string;
};

export type PivotTrigger = {
  trigger: string;
  evidence_refs: string[];
};

export type SocialPressureSummary = {
  kind: "chat" | "request" | "obligation" | "visible_actor" | "shared_storage" | "world_event";
  summary: string;
  evidence_refs: string[];
};

export type PlanBeadHint = {
  bead_id: string;
  title: string;
  status: "open" | "in_progress" | "blocked" | "deferred" | "closed";
  priority: 0 | 1 | 2 | 3 | 4;
  why_it_matters: string;
  next_hints: string[];
  blockers: string[];
  acceptance_evidence_required: string[];
  evidence_refs: string[];
  dependency_refs: string[];
  checkpoint_ref: string;
};

export type RuntimeRetryConstraintSummary = {
  constraint_id: string;
  target_summary: string;
  args_normalized: JsonValue;
  blocked_reason: string;
  repeat_count: number;
  evidence_refs: string[];
};

export type ProviderBudgetHint = {
  provider_id: string;
  model: string;
  status: "ok" | "near_limit" | "would_exceed" | "unknown";
  remaining_turns_hint?: number;
};

export type ActorSoulAndLifeGoalProjection = {
  actor_id: string;
  actor_soul_ref: string;
  life_goal_ref: string;
  life_goal_summary: string;
};

export type RelationshipContextProjection = {
  relationship_refs: string[];
  visible_actor_ids: string[];
  obligations: string[];
};

/**
 * Actor Turn view of current Minecraft and settlement state.
 *
 * @remarks This projection is evidence substrate for choosing the next action.
 * It should not launder absence claims: world scans must carry limitations and
 * `absence_claims_exhaustive` explicitly.
 */
export type ActorTurnCurrentStateProjection = {
  schema: "actor-turn-current-state/v1";
  observer_id: string;
  position?: { x: number; y: number; z: number };
  inventory_counts: Record<string, number>;
  vitals?: {
    health?: number;
    food?: number;
    held_item?: { name: string; count?: number };
    food_candidates: Array<{ name: string; count: number }>;
  };
  session_lifecycle?: {
    schema: "runtime-session-lifecycle/v1";
    status: "active" | "dead_or_respawning" | "respawned_after_death" | "disconnected_or_error";
    death_count: number;
    spawn_count: number;
    last_event?: {
      kind: "death" | "spawn" | "end" | "kicked" | "error";
      observed_at: string;
      position?: { x: number; y: number; z: number };
      health?: number;
      food?: number;
      reason?: string;
    };
    inventory_may_have_reset: boolean;
    branch_recommended: boolean;
    branch_reason?: "danger_or_survival_pressure" | "environment_blocked";
    notes: string[];
  };
  visible_actors: Array<{ id: string; distance?: number; busy?: boolean }>;
  obligation_summaries?: string[];
  nearby_block_hints: Array<{ name: string; distance?: number }>;
  shared_storage: {
    status: string;
    chest_id?: string;
    items: Array<{ name: string; count: number }>;
    evidence_refs: string[];
  };
  deposit_candidates: Array<{
    itemName: string;
    inventoryCount: number;
    suggestedCount: number;
    maxDepositableCount: number;
    socially_requested: boolean;
    requested_by_actor_ids: string[];
    request_summaries: string[];
    evidence_refs: string[];
  }>;
  world_scan?: {
    scan_id: string;
    radius?: number;
    coverage_scope: string;
    absence_claims_exhaustive: boolean;
    total_verified_blocks: number;
    truncated: boolean;
    retained_block_counts: Array<{ name: string; count: number }>;
    limitations: string[];
  };
  structure_progress?: {
    status: string;
    total_placed_blocks: number;
    latest_pattern_id?: string;
    latest_anchor?: { x: number; y: number; z: number };
    latest_material?: string;
    latest_verifier?: {
      status: string;
      wall_coverage?: number;
      roof_coverage?: number;
      placed_shell_blocks?: number;
      required_shell_blocks?: number;
      reason?: string;
    };
    evidence_refs: string[];
    summaries: string[];
    interpretation_notes: string[];
  };
  settlement_progress: {
    inventory_counts: Record<string, number>;
    shared_storage_status: string;
    known_position_summaries: string[];
    checklist: Array<{
      id: string;
      status: string;
      reason: string;
      evidence_ref_count: number;
    }>;
    recent_blockers: Array<{
      key: string;
      count: number;
      example?: string;
    }>;
  };
};

/**
 * Compact decision context for the Actor Turn provider.
 *
 * @remarks The frame summarizes evidence and branch context only. It must not
 * rank tools, inject parameters, hide Action Cards, or become a second
 * Minecraft planner. Only a validated Actor Turn resolved action with
 * structured parameters can become executable runtime work.
 */
export type ActorTurnDecisionFrame = {
  schema: "actor-turn-decision-frame/v1";
  priority_order: string[];
  episode_focus: string;
  episode_focus_status: {
    status: "open" | "satisfied" | "blocked_or_no_progress" | "unknown";
    focus: string;
    evidence_refs: string[];
    next: string;
  };
  current_truths: string[];
  open_social_requests: Array<{
    itemName?: string;
    suggestedCount?: number;
    summary: string;
    evidence_refs: string[];
  }>;
  completed_work: string[];
  recent_action_verdicts: Array<{
    turn_id: string;
    action_summary: string;
    outcome: EvidenceTraceOutcome;
    evidence_refs: string[];
  }>;
  do_not_repeat: string[];
  open_progress_front: Array<{
    id: string;
    status: string;
    next_theme: string;
    evidence_refs: string[];
  }>;
  next_action_guidance: string[];
};

export type MinecraftBasicGuideProjection = {
  schema: "minecraft-basic-guide/v1";
  guide_ref?: string;
  item_flows: string[];
  station_requirements: string[];
  blocker_recovery_guides: string[];
  observe_stop_guides: string[];
};

export type MineflayerCodegenSkillProjection = {
  schema: "mineflayer-codegen-skill/v1";
  skill_ref: string;
  skill_markdown: string;
  upstream_ref: string;
  applies_when: "outer Actor Turn selected author_mineflayer_action";
  helper_api_version: "mineflayer-action-skill-helper/v1";
  allowed_ctx_helpers: string[];
  bounded_mineflayer_methods: string[];
  output_schema_rules: string[];
  helper_call_contracts: string[];
  mineflayer_api_notes: string[];
  forbidden_source_patterns: string[];
  verifier_and_evidence_rules: string[];
  common_failure_modes: string[];
};

export type ActiveEpisode = {
  schema: "active-episode/v1";
  episode_id: string;
  actor_id: string;
  actors_visible_or_relevant: string[];
  life_goal_ref: string;
  purpose: string;
  current_focus: string;
  selected_plan_bead_refs: string[];
  related_plan_bead_refs: string[];
  success_signals: EvidenceExpectation[];
  pivot_triggers: PivotTrigger[];
  mistake_budget: {
    allow_exploration_turns: number;
    observe_repeat_limit: number;
    exact_blocker_repeat_limit: number;
  };
  social_pressure: SocialPressureSummary[];
  opened_from_refs: string[];
  started_at_turn_ref?: string;
  status: ActiveEpisodeStatus;
};

export type ActionCard = {
  schema: "action-card/v1";
  action_card_id: string;
  title: string;
  description: string;
  parameters_schema_ref: string;
  parameter_hints: string[];
  /** Advisory provider context for selection only; runtime validators still require explicit structured args. */
  current_state_requirements: string[];
  expected_evidence: string[];
  likely_blockers: string[];
  readiness: ActionCardReadiness;
  runtime_mapping_ref: string;
};

export type ActorTurnInput = {
  schema: "actor-turn-input/v1";
  turn_id: string;
  decision_frame: ActorTurnDecisionFrame;
  active_episode: ActiveEpisode;
  actor_context: ActorSoulAndLifeGoalProjection;
  current_observation_refs: string[];
  current_state: ActorTurnCurrentStateProjection;
  recent_evidence_trace: EvidenceTraceEntry[];
  compact_plan_bead_hints: PlanBeadHint[];
  memory_refs: string[];
  relationship_context: RelationshipContextProjection;
  runtime_retry_constraints: RuntimeRetryConstraintSummary[];
  action_cards: ActionCard[];
  minecraft_basic_guide: MinecraftBasicGuideProjection;
  mineflayer_codegen_skill: MineflayerCodegenSkillProjection;
  provider_budget_hint: ProviderBudgetHint;
};

export type ActorTurnExecutionDraft =
  | {
      schema: "actor-turn-execution-draft/v1";
      choice: "use_existing_action";
      action_card_id: string;
      parameters: JsonObject;
      expected_outcome: ActorTurnExpectedOutcome;
      why_this_action: string;
      expected_evidence: string[];
      fallback_if_blocked: string;
    }
  | {
      schema: "actor-turn-execution-draft/v1";
      choice: "author_mineflayer_action";
      proposed_action_skill_id: string;
      purpose: string;
      input_schema: JsonObject;
      parameters: JsonObject;
      source_language: "typescript";
      source: string;
      helper_api_version: "mineflayer-action-skill-helper/v1";
      helper_allowlist: string[];
      timeout_ms: number;
      verifier: JsonObject;
      known_failure_modes: string[];
      promotion_policy: "promote_after_passed_trial";
      expected_outcome: ActorTurnExpectedOutcome;
      why_this_action: string;
      expected_evidence: string[];
      fallback_if_blocked: string;
};

export type ActorTurnResolvedAction =
  | {
      schema: "actor-turn-resolved-action/v1";
      actor_id: string;
      cycle_id: string;
      cycle_goal_id: string;
      kind: "use_primitive";
      action_card_id: string;
      primitive_id: string;
      parameters: JsonObject;
      expected_outcome: ActorTurnExpectedOutcome;
      why_this_action: string;
      expected_evidence: string[];
      fallback_if_blocked: string;
    }
  | {
      schema: "actor-turn-resolved-action/v1";
      actor_id: string;
      cycle_id: string;
      cycle_goal_id: string;
      kind: "use_action_skill";
      action_card_id: string;
      action_skill_id: string;
      parameters: JsonObject;
      expected_outcome: ActorTurnExpectedOutcome;
      why_this_action: string;
      expected_evidence: string[];
      fallback_if_blocked: string;
    }
  | {
      schema: "actor-turn-resolved-action/v1";
      actor_id: string;
      cycle_id: string;
      cycle_goal_id: string;
      kind: "author_mineflayer_action";
      parameters: JsonObject;
      candidate: GeneratedActionSkillCandidate;
      expected_outcome: ActorTurnExpectedOutcome;
      why_this_action: string;
      expected_evidence: string[];
      fallback_if_blocked: string;
    };

export type EvidenceTraceEntry = {
  schema: "evidence-trace/v1";
  turn_id: string;
  episode_id: string;
  action_ref: string;
  runtime_gate_ref: string;
  execution_ref?: string;
  verifier_ref?: string;
  post_observation_ref?: string;
  provider_usage_ref?: string;
  outcome: EvidenceTraceOutcome;
  selected_action?: {
    kind: string;
    id: string;
    action_card_id?: string;
    title?: string;
  };
  parameters?: JsonObject;
  rationale?: {
    why_this_action?: string;
    fallback_if_blocked?: string;
  };
  runtime_status?: string;
  tool_statuses?: Array<{ tool: string; status: string }>;
  blocker_reason?: string;
  compact_summary: string;
};

export type DeliberationBranch = {
  schema: "deliberation-branch/v1";
  branch_id: string;
  reason: DeliberationBranchReason;
  evidence_refs: string[];
  current_episode_ref: string;
};

export type DeliberationOutput = {
  schema: "deliberation-output/v1";
  branch_id: string;
  current_episode_ref: string;
  rationale: string;
  next_episode: ActiveEpisode;
  plan_bead_op_proposals: unknown[];
};

export type PlanBeadClosureCheck = {
  bead_id: string;
  close_kind: "satisfied" | "abandoned" | "superseded" | "duplicate" | "not_relevant";
  status: "accepted" | "rejected";
  evidence_refs: string[];
  acceptance_evidence_required: string[];
  matched_acceptance_criteria: boolean;
  reason: string;
};

export type EpisodeReviewSummary = {
  schema: "episode-review-summary/v1";
  episode_id: string;
  actor_id: string;
  provider: {
    provider_id: string;
    model: string;
  };
  total_turns: number;
  final_verdict: {
    status: EpisodeVerdictStatus;
    reason: string;
    evidence_refs: string[];
  };
  metrics: {
    non_observe_wait_remember_turns: number;
    verified_mutation_turns: number;
    social_visibility_events: number;
    false_pass_count: number;
    unsupported_claim_count: number;
    exact_retry_constraint_blocks: number;
    distinct_action_families: number;
  };
  evidence_trace_refs: string[];
  plan_bead_closure_checks: PlanBeadClosureCheck[];
  social_visibility: {
    event_count: number;
    evidence_refs: string[];
  };
  failure_classifications: EpisodeFailureClassification[];
};
