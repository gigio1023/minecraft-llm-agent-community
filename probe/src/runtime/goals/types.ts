/** Soul/LifeGoal/CycleGoal social runtime record schemas and small validators. */

import type {
  ActionSkillPostconditionResult,
  SettlementChecklist,
  SettlementState
} from "../settlement/settlementState.js";
import type { ProviderUsageSummary } from "../../provider/providerUsageTracker.js";
import type { RuntimeRetryConstraint } from "../retryConstraints.js";

export type ActorSoul = {
  schema: "actor-soul/v1";
  actor_id: string;
  display_name: string;
  society_id: string;
  role: string;
  life_goal: string;
  public_responsibilities: string[];
  private_drives: string[];
  values: string[];
  needs: {
    survival: string[];
    social: string[];
    learning: string[];
  };
  boundaries: {
    forbidden_actions: string[];
    requires_evidence_before_claiming: string[];
    shared_resource_rules: string[];
  };
  action_skill_policy: {
    prefer_owned_action_skills: boolean;
    allow_primitive_fallback: boolean;
    allow_generated_action_skill_trials: boolean;
  };
  memory_policy: {
    retrieve_layers: string[];
    must_consider_recent_cycle_judgment: boolean;
  };
  speech_style: string;
};

export type ActorLifeGoalStatus = "active" | "paused" | "blocked" | "stalled" | "retired";
export type ActorLifeGoalSource = "actor_soul" | "scenario" | "operator_override";

export type ActorLifeGoal = {
  schema: "actor-life-goal/v1";
  actor_id: string;
  goal_id: string;
  objective: string;
  status: ActorLifeGoalStatus;
  source: ActorLifeGoalSource;
  created_at: string;
  updated_at: string;
  cycle_count: number;
  action_count: number;
  evidence_refs: string[];
  memory_refs: string[];
  relationship_refs: string[];
};

export type StrategicGoalStatus =
  | "active"
  | "paused"
  | "blocked"
  | "satisfied"
  | "retired";

export type StrategicGoal = {
  schema: "actor-strategic-goal/v1";
  actor_id: string;
  strategic_goal_id: string;
  life_goal_id: string;
  status: StrategicGoalStatus;
  summary: string;
  rationale: string;
  derived_from: {
    soul_ref: string;
    world_event_refs: string[];
    memory_refs: string[];
    relationship_refs: string[];
    previous_cycle_judgment_refs: string[];
  };
  success_direction: string;
  current_blockers: string[];
  updated_at: string;
};

export type CycleGoalStatus =
  | "active"
  | "satisfied"
  | "blocked"
  | "stalled"
  | "abandoned"
  | "interrupted"
  | "superseded";

export type CycleGoalSource =
  | "llm_planner"
  | "llm_authored_policy"
  | "runtime_rule"
  | "world_event_context";

export type ActorCycleGoal = {
  schema: "actor-cycle-goal/v1";
  actor_id: string;
  goal_id: string;
  life_goal_id: string;
  cycle_id: string;
  status: CycleGoalStatus;
  source: CycleGoalSource;
  summary: string;
  rationale: string;
  derived_from: {
    soul_ref: string;
    observation_refs: string[];
    world_event_refs: string[];
    memory_refs: string[];
    relationship_refs: string[];
    previous_cycle_judgment_refs: string[];
    plan_bead_refs?: string[];
  };
  success_condition: {
    verifier: string;
    evidence_required: string[];
  };
  allowed_action_skill_ids: string[];
  allowed_primitive_ids: string[];
  stop_conditions: string[];
};

export type WorldEventKind =
  | "environment_event"
  | "actor_event"
  | "scenario_event"
  | "operator_event";

export type WorldEventAuthority = "context_only" | "scenario_rule" | "debug_override";

export type WorldEvent = {
  schema: "world-event/v1";
  event_id: string;
  kind: WorldEventKind;
  authority: WorldEventAuthority;
  summary: string;
  actor_refs: string[];
  evidence_refs: string[];
  created_at: string;
  /** When set, social-cycle runs only surface events from the same run_id. */
  run_id?: string;
};

export type GeneratedActionSkillCandidate = {
  schema: "generated-action-skill-candidate/v1";
  proposed_skill_id: string;
  purpose: string;
  source_language: "typescript";
  source: string;
  input_schema: Record<string, unknown>;
  helper_api_version: "mineflayer-action-skill-helper/v1";
  helper_allowlist: string[];
  timeout_ms: number;
  verifier: Record<string, unknown>;
  promotion_policy: "promote_after_passed_trial";
  known_failure_modes: string[];
};

/** Cycle outcomes distinguish final success from useful current-run mutation that still failed a verifier. */
export type CycleJudgmentOutcome =
  | "verified_progress"
  | "partial_verified_progress"
  | "no_progress"
  | "blocked"
  | "unsafe"
  | "socially_resolved";

const cycleJudgmentOutcomes: readonly CycleJudgmentOutcome[] = [
  "verified_progress",
  "partial_verified_progress",
  "no_progress",
  "blocked",
  "unsafe",
  "socially_resolved"
];

const cycleJudgmentVerifierStatuses = [
  "passed",
  "failed",
  "not_applicable"
] as const;

const memoryWriteLayers = [
  "episodic",
  "procedural",
  "social",
  "belief",
  "guardrail"
] as const;

const memoryWriteConfidences = ["observed", "inferred", "uncertain"] as const;

const relationshipEventProposalKinds = [
  "request_made",
  "request_accepted",
  "fulfilled",
  "blocked",
  "helped",
  "failed_obligation"
] as const;

export type CycleJudgment = {
  schema: "cycle-judgment/v1";
  actor_id: string;
  cycle_id: string;
  /** Social-cycle run that produced this judgment, when applicable. */
  run_id?: string;
  cycle_goal_id: string;
  outcome: CycleJudgmentOutcome;
  what_happened: string;
  why_it_mattered_for_life_goal: string;
  verifier_status: "passed" | "failed" | "not_applicable";
  outcome_contract?: {
    schema: "actor-turn-outcome-contract-evaluation/v1";
    expected_outcome: string;
    observed_deltas: string[];
    status: string;
    outcome_override?: CycleJudgmentOutcome;
    branch_recommended: boolean;
    reason: string;
  };
  evidence_refs: string[];
  memory_writes: Array<{
    layer: "episodic" | "procedural" | "social" | "belief" | "guardrail";
    summary: string;
    confidence: "observed" | "inferred" | "uncertain";
  }>;
  relationship_event_proposals: Array<{
    target_actor_id: string;
    kind:
      | "request_made"
      | "request_accepted"
      | "fulfilled"
      | "blocked"
      | "helped"
      | "failed_obligation";
    evidence_refs: string[];
  }>;
  next_goal_context: string[];
  /** Proposal candidates are validated by the guarded PlanBead applier per item. */
  bead_op_proposals?: unknown[];
};

export type SocialCycleProviderId = "openai-api" | "gemini-api" | "deterministic-social";

export type SocialCycleVisualEvidenceCapture = {
  schema: "visual-evidence-capture/v1";
  actor_id: string;
  run_id: string;
  cycle_id: string;
  phase: "initial" | "cycle_end" | "final" | "startup";
  status: "captured" | "failed";
  captured_at: string;
  method: "prismarine-viewer-web-screenshot";
  artifact_ref: string;
  image_ref?: string;
  image_path?: string;
  viewer_url?: string;
  bot_position?: { x: number; y: number; z: number; yaw: number; pitch: number };
  error?: string;
};

export type SocialCycleVisualEvidence = {
  schema: "social-cycle-visual-evidence/v1";
  enabled: true;
  method: "prismarine-viewer-web-screenshot";
  first_person: true;
  interval_cycles: number;
  viewport: { width: number; height: number };
  viewer_url?: string;
  viewer_port?: number;
  chrome_executable_path?: string;
  captures: SocialCycleVisualEvidenceCapture[];
  failures: Array<{ captured_at: string; error: string }>;
  notes: string[];
};

export type SocialCycleRunReport = {
  schema: "social-cycle-run-report/v1";
  run_id: string;
  actor_id: string;
  provider: {
    provider_id: SocialCycleProviderId;
    model: string;
    reasoning: string;
  };
  action_hot_path?: "actor_turn";
  provider_usage?: ProviderUsageSummary;
  runtime_status: "passed" | "failed" | "blocked" | "timeout" | "environment_blocked";
  active_episode_refs?: string[];
  deliberation_branch_refs?: string[];
  server?: {
    mode: "manual" | "live_smoke" | "fresh_world";
    seed: string;
    level_type: string;
    version: string;
	    endpoint?: string;
	    spawn_access_prepared?: boolean;
	    spawn_access_position?: { x: number; y: number; z: number };
	    shared_storage_social_smoke?: boolean;
	    starter_inventory_seeded?: boolean;
	    error_kind?: "environment_blocked";
    error?: string;
  };
  /** Producer workspace root used to resolve actor-relative artifact refs during audit. */
  actor_workspace_root_dir?: string;
  agency_status: {
    life_goal_source: ActorLifeGoalSource;
    strategic_goal_source: "llm_planner" | "runtime_rule";
    cycle_goal_source: CycleGoalSource;
    used_soul: boolean;
    used_life_goal: boolean;
    used_previous_judgment: boolean;
    used_memory_refs: number;
    used_relationship_refs: number;
    used_world_event_refs: number;
    builtin_goal_authority: boolean;
    builtin_execution_source: boolean;
    fixture_dependency: boolean;
    helper_expansion_count: number;
    gameplay_progress_verified: boolean;
  };
  cycles: Array<{
    cycle_id: string;
    cycle_goal_ref: string;
    active_episode_ref?: string;
    deliberation_branch_ref?: string;
    deliberation_trigger_reason?: string;
    action_ref: string;
    provider_input_refs: string[];
    provider_output_refs: string[];
    evidence_refs: string[];
    judgment_ref: string;
    verifier_status: "passed" | "failed" | "not_applicable";
    plan_bead_packet_ref?: string;
    selected_plan_bead_refs?: string[];
    plan_bead_operation_result_refs?: string[];
    action_attempts?: Array<{
      attempt_id: string;
      action_index: number;
      turn_id: string;
      active_episode_id?: string;
      action_ref: string;
      provider_input_refs: string[];
      provider_output_refs: string[];
      evidence_refs: string[];
      judgment_ref: string;
      verifier_status: "passed" | "failed" | "not_applicable";
      executed_tools: string[];
      tool_statuses: Array<{ tool: string; status: string }>;
      runtime_result?: unknown;
      runtime_status: string;
      retry_constraint_blocked?: boolean;
      branch_recommended?: boolean;
      branch_reason?: string;
      postcondition_results?: ActionSkillPostconditionResult[];
      plan_bead_operation_result_refs?: string[];
    }>;
  }>;
  provider_error?: string;
  provider_error_refs?: Array<{
    stage: string;
    turn_id?: string;
    error: string;
    provider_input_refs: string[];
    provider_output_refs: string[];
  }>;
  action_skill_execution_unit?: boolean;
  settlement_state?: SettlementState;
  settlement_checklist?: SettlementChecklist;
  postcondition_results?: ActionSkillPostconditionResult[];
  runtime_retry_constraints?: RuntimeRetryConstraint[];
  plan_bead_graph_summary?: {
    schema: "plan-bead-graph-summary/v1";
    actor_id: string;
    open_count: number;
    ready_count: number;
    blocked_count: number;
    deferred_count: number;
    closed_recent_count: number;
    last_ready_front_ref?: string;
  };
  plan_bead_ready_fronts?: Array<{
    schema: "plan-bead-ready-front/v1";
    cycle_id: string;
    ref: string;
    ready_bead_ids: string[];
    in_progress_bead_ids: string[];
    blocked_bead_ids: string[];
    physical_progress_claim: false;
  }>;
  plan_bead_operation_results?: Array<{
    cycle_id: string;
    turn_id: string;
    ref: string;
    op: string;
    status: "accepted" | "rejected";
    bead_id?: string;
    reason?: string;
  }>;
  visual_evidence?: SocialCycleVisualEvidence;
  relationship_application_results?: Array<{
    event_id: string;
    from_actor_id: string;
    to_actor_id: string;
    kind: string;
    status: "applied" | "already_applied" | "rejected";
    reason?: string;
    relationship_path?: string;
  }>;
  memory_reuse?: {
    retrieved_memory_refs: number;
    memory_writes: number;
    used_previous_judgment: boolean;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(record: Record<string, unknown>, key: string, errors: string[]) {
  if (typeof record[key] !== "string" || record[key].length === 0) {
    errors.push(`${key} must be a non-empty string`);
  }
}

function assertStringArray(record: Record<string, unknown>, key: string, errors: string[]) {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    errors.push(`${key} must be a string array`);
  }
}

function assertRecord(record: Record<string, unknown>, key: string, errors: string[]) {
  if (!isRecord(record[key])) {
    errors.push(`${key} must be an object`);
  }
}

function includesString<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function validateActorSoul(value: unknown): { ok: true; soul: ActorSoul } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActorSoul must be an object"] };
  }
  if (value.schema !== "actor-soul/v1") {
    errors.push("schema must be actor-soul/v1");
  }
  assertString(value, "actor_id", errors);
  assertString(value, "display_name", errors);
  assertString(value, "life_goal", errors);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, soul: value as ActorSoul };
}

export function validateActorLifeGoal(
  value: unknown
): { ok: true; lifeGoal: ActorLifeGoal } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActorLifeGoal must be an object"] };
  }
  if (value.schema !== "actor-life-goal/v1") {
    errors.push("schema must be actor-life-goal/v1");
  }
  assertString(value, "actor_id", errors);
  assertString(value, "goal_id", errors);
  assertString(value, "objective", errors);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, lifeGoal: value as ActorLifeGoal };
}

export function validateActorCycleGoal(
  value: unknown
): { ok: true; cycleGoal: ActorCycleGoal } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActorCycleGoal must be an object"] };
  }
  if (value.schema !== "actor-cycle-goal/v1") {
    errors.push("schema must be actor-cycle-goal/v1");
  }
  assertString(value, "actor_id", errors);
  assertString(value, "goal_id", errors);
  assertString(value, "life_goal_id", errors);
  assertString(value, "cycle_id", errors);
  assertString(value, "summary", errors);
  assertString(value, "rationale", errors);
  assertStringArray(value, "allowed_action_skill_ids", errors);
  assertStringArray(value, "allowed_primitive_ids", errors);
  assertStringArray(value, "stop_conditions", errors);
  if (!isRecord(value.derived_from)) {
    errors.push("derived_from must be an object");
  }
  if (!isRecord(value.success_condition)) {
    errors.push("success_condition must be an object");
  } else {
    assertString(value.success_condition, "verifier", errors);
    assertStringArray(value.success_condition, "evidence_required", errors);
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, cycleGoal: value as ActorCycleGoal };
}

export function validateCycleJudgment(
  value: unknown
): { ok: true; judgment: CycleJudgment } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["CycleJudgment must be an object"] };
  }
  if (value.schema !== "cycle-judgment/v1") {
    errors.push("schema must be cycle-judgment/v1");
  }
  assertString(value, "actor_id", errors);
  assertString(value, "cycle_id", errors);
  assertString(value, "cycle_goal_id", errors);
  assertString(value, "what_happened", errors);
  assertString(value, "why_it_mattered_for_life_goal", errors);
  assertStringArray(value, "evidence_refs", errors);
  assertStringArray(value, "next_goal_context", errors);
  if (!includesString(cycleJudgmentOutcomes, value.outcome)) {
    errors.push("outcome must be a known CycleJudgment outcome");
  }
  if (!includesString(cycleJudgmentVerifierStatuses, value.verifier_status)) {
    errors.push("verifier_status must be passed, failed, or not_applicable");
  }
  if (!Array.isArray(value.memory_writes)) {
    errors.push("memory_writes must be an array");
  } else {
    for (const [index, write] of value.memory_writes.entries()) {
      if (!isRecord(write)) {
        errors.push(`memory_writes[${index}] must be an object`);
        continue;
      }
      if (!includesString(memoryWriteLayers, write.layer)) {
        errors.push(`memory_writes[${index}].layer must be a known memory layer`);
      }
      assertString(write, "summary", errors);
      if (!includesString(memoryWriteConfidences, write.confidence)) {
        errors.push(`memory_writes[${index}].confidence must be observed, inferred, or uncertain`);
      }
    }
  }
  if (!Array.isArray(value.relationship_event_proposals)) {
    errors.push("relationship_event_proposals must be an array");
  } else {
    for (const [index, proposal] of value.relationship_event_proposals.entries()) {
      if (!isRecord(proposal)) {
        errors.push(`relationship_event_proposals[${index}] must be an object`);
        continue;
      }
      assertString(proposal, "target_actor_id", errors);
      if (!includesString(relationshipEventProposalKinds, proposal.kind)) {
        errors.push(`relationship_event_proposals[${index}].kind must be a known proposal kind`);
      }
      assertStringArray(proposal, "evidence_refs", errors);
    }
  }
  if (value.bead_op_proposals !== undefined) {
    if (!Array.isArray(value.bead_op_proposals)) {
      errors.push("bead_op_proposals must be an array when present");
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, judgment: value as CycleJudgment };
}

export function cycleGoalProviderInputIncludesSoulAndLifeGoal(input: unknown): boolean {
  if (!isRecord(input)) {
    return false;
  }
  const soul = input.ActorSoul ?? input.actor_soul;
  const lifeGoal = input.ActorLifeGoal ?? input.actor_life_goal;
  return validateActorSoul(soul).ok && validateActorLifeGoal(lifeGoal).ok;
}

/** @deprecated Use cycleGoalProviderInputIncludesSoulAndLifeGoal for new code. */
export function goalMindInputIncludesSoulAndLifeGoal(input: unknown): boolean {
  return cycleGoalProviderInputIncludesSoulAndLifeGoal(input);
}
