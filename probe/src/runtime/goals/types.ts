/** Soul/LifeGoal/CycleGoal social runtime record schemas and small validators. */

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
  | "world_event_pressure";

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

export type WorldEventAuthority = "pressure_only" | "scenario_rule" | "debug_override";

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

export type ActionIntentKind =
  | "use_action_skill"
  | "use_primitive"
  | "wait"
  | "remember";

export type ActionIntent = {
  schema: "action-intent/v1";
  actor_id: string;
  cycle_id: string;
  cycle_goal_id: string;
  kind: ActionIntentKind;
  action_skill_id?: string;
  primitive_id?: string;
  args: Record<string, unknown>;
  why_this_action: string;
  expected_evidence: string[];
  fallback_if_blocked: string;
};

export type CycleJudgmentOutcome =
  | "verified_progress"
  | "no_progress"
  | "blocked"
  | "unsafe"
  | "socially_resolved";

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
  next_goal_pressure: string[];
};

export type SocialCycleProviderId = "openai-api" | "deterministic-social";

export type SocialCycleRunReport = {
  schema: "social-cycle-run-report/v1";
  run_id: string;
  actor_id: string;
  provider: {
    provider_id: SocialCycleProviderId;
    model: string;
    reasoning: string;
  };
  runtime_status: "passed" | "failed" | "blocked" | "timeout";
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
    action_intent_ref: string;
    provider_input_refs: string[];
    provider_output_refs: string[];
    evidence_refs: string[];
    judgment_ref: string;
    verifier_status: "passed" | "failed" | "not_applicable";
  }>;
  provider_error?: string;
  action_skill_execution_unit?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(record: Record<string, unknown>, key: string, errors: string[]) {
  if (typeof record[key] !== "string" || record[key].length === 0) {
    errors.push(`${key} must be a non-empty string`);
  }
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
  assertString(value, "goal_id", errors);
  assertString(value, "cycle_id", errors);
  assertString(value, "summary", errors);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, cycleGoal: value as ActorCycleGoal };
}

export function validateActionIntent(
  value: unknown
): { ok: true; intent: ActionIntent } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActionIntent must be an object"] };
  }
  if (value.schema !== "action-intent/v1") {
    errors.push("schema must be action-intent/v1");
  }
  assertString(value, "cycle_id", errors);
  assertString(value, "cycle_goal_id", errors);
  if (typeof value.kind !== "string") {
    errors.push("kind required");
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, intent: value as ActionIntent };
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
  assertString(value, "cycle_id", errors);
  assertString(value, "what_happened", errors);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, judgment: value as CycleJudgment };
}

export function goalMindInputIncludesSoulAndLifeGoal(input: unknown): boolean {
  if (!isRecord(input)) {
    return false;
  }
  const soul = input.ActorSoul ?? input.actor_soul;
  const lifeGoal = input.ActorLifeGoal ?? input.actor_life_goal;
  return validateActorSoul(soul).ok && validateActorLifeGoal(lifeGoal).ok;
}
