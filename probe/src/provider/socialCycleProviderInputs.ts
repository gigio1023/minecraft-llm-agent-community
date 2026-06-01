import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal, StrategicGoal } from "../runtime/goals/types.js";
import type { JsonValue } from "./inputSnapshot.js";

const GOAL_MIND_STRATEGIC_GOAL_LIMIT = 6;

function strategicGoalRank(goal: StrategicGoal) {
  switch (goal.status) {
    case "active":
      return 0;
    case "blocked":
      return 1;
    case "paused":
      return 2;
    case "satisfied":
      return 3;
    case "retired":
      return 4;
  }
}

function selectStrategicGoalsForGoalMind(goals: readonly StrategicGoal[]) {
  return [...goals]
    .sort((left, right) => {
      const statusRank = strategicGoalRank(left) - strategicGoalRank(right);
      if (statusRank !== 0) {
        return statusRank;
      }
      return right.updated_at.localeCompare(left.updated_at);
    })
    .slice(0, GOAL_MIND_STRATEGIC_GOAL_LIMIT);
}

function buildActionSurfaceSummary(
  context: SocialCycleContextPacket,
  options: { includeDirectActionSkills: boolean }
) {
  const surface = context.action_surface;
  return {
    schema: "action-surface-summary/v1",
    actor_id: surface.actor_id,
    direct_primitives: surface.direct_primitives.map((primitive) => ({
      primitive_id: primitive.primitive_id,
      category: primitive.category,
      description: primitive.description
    })),
    ...(options.includeDirectActionSkills
      ? {
          direct_action_skills: surface.direct_action_skills.map((skill) => ({
            action_skill_id: skill.action_skill_id,
            required_primitives: [...skill.required_primitives],
            success_verifier: skill.success_verifier
          }))
        }
      : {
          direct_action_skill_count: surface.direct_action_skills.length,
          deferred_action_skill_count: surface.deferred_action_skills.length,
          action_skill_details_visible_in_stage: "action_planner"
        }),
    deferred_counts: {
      primitives: surface.deferred_primitives.length,
      action_skills: surface.deferred_action_skills.length
    },
    recent_blockers: [...surface.recent_blockers],
    missing_affordances: [...surface.missing_affordances],
    rules: surface.rules
  };
}

function buildActionSelectionModes(context: SocialCycleContextPacket) {
  const canRunGeneratedProgram = context.action_surface.direct_primitives.some(
    (primitive) => primitive.primitive_id === "run_mineflayer_program"
  );
  return {
    schema: "action-selection-modes/v1",
    modes: [
      {
        kind: "use_primitive",
        origin_authority: "select_existing_runtime_affordance",
        parameters_field: "parameters"
      },
      {
        kind: "use_action_skill",
        origin_authority: "select_existing_actor_owned_action_skill",
        parameters_field: "parameters"
      },
      {
        kind: "author_and_trial_action_skill",
        enabled: canRunGeneratedProgram,
        origin_authority: "create_new_actor_owned_candidate_only_here",
        parameters_field: "parameters",
        candidate_contract: {
          schema: "generated-action-skill-candidate/v1",
          source_language: "typescript",
          helper_api_version: "mineflayer-action-skill-helper/v1",
          source_signature: "export async function run(ctx, params)",
          required_candidate_fields: [
            "proposed_skill_id",
            "purpose",
            "input_schema",
            "source",
            "helper_allowlist",
            "timeout_ms",
            "verifier",
            "promotion_policy",
            "known_failure_modes"
          ],
          lifecycle:
            "passed trial writes an active actor-owned action skill; failed trial remains candidate evidence"
        }
      }
    ],
    rules: {
      action_selection_is_only_candidate_origin: true,
      parameters_are_executable_authority: true,
      prose_is_not_executable_authority: true,
      generated_source_requires_helper_evidence: true
    }
  };
}

export function buildGoalMindProviderInput(context: SocialCycleContextPacket): JsonValue {
  const strategicGoals = selectStrategicGoalsForGoalMind(context.strategic_goals);
  return {
    stage: "goal_mind",
    schema: "social-goal-mind-input/v1",
    ActorSoul: context.ActorSoul,
    ActorLifeGoal: context.ActorLifeGoal,
    strategic_goals: strategicGoals,
    strategic_goal_window: {
      visible_count: strategicGoals.length,
      total_count: context.strategic_goals.length,
      omitted_count: Math.max(0, context.strategic_goals.length - strategicGoals.length),
      selection_rule: "active_or_blocked_first_then_recent_updated_at"
    },
    world_events: context.world_events,
    previous_cycle_judgments: context.previous_cycle_judgments,
    observation: context.observation,
    action_surface_summary: buildActionSurfaceSummary(context, {
      includeDirectActionSkills: false
    }),
    allowed_primitive_ids: context.allowed_primitive_ids,
    runtime_retry_constraints: context.runtime_retry_constraints,
    relationship_context: context.relationship_context,
    memory_packet: context.memory_packet,
    plan_bead_packet: context.plan_bead_packet ?? null,
    settlement_state: context.settlement_state,
    limits: context.limits,
    rules: context.rules
  } as JsonValue;
}

export function buildActionPlannerProviderInput(input: {
  context: SocialCycleContextPacket;
  turnId: string;
  actionIndex?: number;
  cycleGoal: ActorCycleGoal;
  plannerCycleGoal: ActorCycleGoal;
  directActionSkills: JsonValue;
  runtimeAffordances: JsonValue;
  recentActionAttempts?: JsonValue;
}): JsonValue {
  return {
    stage: "action_planner",
    schema: "social-action-planner-input/v1",
    turn_id: input.turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: input.plannerCycleGoal,
    observation: input.context.observation,
    action_surface_summary: buildActionSurfaceSummary(input.context, {
      includeDirectActionSkills: true
    }),
    action_selection_modes: buildActionSelectionModes(input.context),
    direct_action_skills: input.directActionSkills,
    candidate_action_skill_search: input.context.candidate_action_skill_search,
    allowed_primitive_ids: input.plannerCycleGoal.allowed_primitive_ids,
    cycle_goal_allowed_primitive_ids_as_advisory: input.cycleGoal.allowed_primitive_ids,
    cycle_goal_allowed_action_skill_ids_as_advisory: input.cycleGoal.allowed_action_skill_ids,
    runtime_affordances: input.runtimeAffordances,
    world_events: input.context.world_events,
    relationship_context: input.context.relationship_context,
    memory_packet: input.context.memory_packet,
    plan_bead_packet: input.context.plan_bead_packet ?? null,
    settlement_state: input.context.settlement_state,
    blocker_histogram: input.context.settlement_state.blocker_histogram,
    runtime_retry_constraints: input.context.runtime_retry_constraints,
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    recent_action_attempts: input.recentActionAttempts ?? []
  } as JsonValue;
}

export function buildCycleJudgmentProviderInput(input: {
  context: SocialCycleContextPacket;
  turnId: string;
  actionIndex?: number;
  cycleGoal: ActorCycleGoal;
  actionIntent: ActionIntent;
  runtimeResult: JsonValue;
  evidenceRefs: string[];
  executedTools: string[];
  toolStatuses?: Array<{ tool: string; status: string }>;
  verifierStatus: string;
  planBeadOperationGuidance: JsonValue;
  actionSkillFeedbackGuidance: JsonValue;
}): JsonValue {
  return {
    stage: "cycle_judgment",
    schema: "social-cycle-judgment-input/v1",
    turn_id: input.turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: input.cycleGoal,
    action_intent: input.actionIntent,
    runtime_result: input.runtimeResult,
    evidence_refs: input.evidenceRefs,
    executed_tools: input.executedTools,
    tool_statuses: input.toolStatuses ?? [],
    verifier_status: input.verifierStatus,
    world_events: input.context.world_events,
    relationship_context: input.context.relationship_context,
    memory_packet: input.context.memory_packet,
    plan_bead_packet: input.context.plan_bead_packet ?? null,
    plan_bead_operation_guidance: input.planBeadOperationGuidance,
    action_skill_feedback_guidance: input.actionSkillFeedbackGuidance,
    action_surface_summary: buildActionSurfaceSummary(input.context, {
      includeDirectActionSkills: false
    }),
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    settlement_state: input.context.settlement_state
  } as JsonValue;
}
