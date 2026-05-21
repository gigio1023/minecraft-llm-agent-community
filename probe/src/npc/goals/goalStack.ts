import type { DeterministicTask } from "../../gameplay/curriculum/deterministicCurriculum.js";
import type { ActorProfile } from "../profiles.js";
import {
  deriveRelationshipActionPressures,
  selectDominantRelationshipActionPressure,
  type RelationshipActionPressure,
  type RelationshipActionPressureKind
} from "../relationships/actionPressure.js";
import type { RelationshipEdge } from "../relationships/relationshipLedger.js";

export type GoalKind =
  | "gather_resource"
  | "craft_item"
  | "deposit_shared"
  | "withdraw_shared"
  | "inspect_storage"
  | "ask_for_help"
  | "answer_request"
  | "repair_action_skill"
  | "recover_from_failure"
  | "reduce_friction"
  | "coordinate_with_reliable_actor";

export type GoalPriority = "background" | "normal" | "urgent" | "blocking";

export type GoalStatus =
  | "unstarted"
  | "in_progress"
  | "blocked"
  | "waiting_on_actor"
  | "verified_complete"
  | "failed";

export type GoalFrame = {
  kind: GoalKind;
  priority: GoalPriority;
  status: GoalStatus;
  summary: string;
  target_actor_id?: string;
  target_item?: string;
  source_pressure_kind?: RelationshipActionPressureKind;
  action_boundary?: "intent_pressure_only";
  active_action_skill_required?: true;
  role_contract_boundary?: "unchanged";
  evidence_refs: string[];
};

export type ActorGoalStack = {
  public_obligation?: GoalFrame;
  private_goal?: GoalFrame;
  relationship_goal?: GoalFrame;
  learning_goal?: GoalFrame;
  recovery_goal?: GoalFrame;
};

function taskToGoalKind(task: DeterministicTask): GoalKind {
  switch (task.id) {
    case "collect_4_logs":
      return "gather_resource";
    case "craft_planks_and_sticks":
    case "craft_crafting_table":
      return "craft_item";
    case "deposit_shared_materials":
      return "deposit_shared";
    case "approach_visible_target":
      return "answer_request";
  }
}

function taskTargetItem(task: DeterministicTask) {
  switch (task.id) {
    case "collect_4_logs":
      return "logs";
    case "craft_planks_and_sticks":
      return "planks_and_sticks";
    case "craft_crafting_table":
      return "crafting_table";
    case "deposit_shared_materials":
      return "shared_materials";
    case "approach_visible_target":
      return undefined;
  }
}

export function buildActorGoalStack(input: {
  actorProfile: ActorProfile;
  currentTask?: DeterministicTask | null;
  recentFailure?: boolean;
  relationshipEdges?: readonly RelationshipEdge[];
  relationshipPressure?: RelationshipActionPressure | null;
}): ActorGoalStack {
  const relationshipPressure =
    input.relationshipPressure ??
    selectDominantRelationshipActionPressure(
      deriveRelationshipActionPressures(input.relationshipEdges ?? [])
    );
  const publicObligation = input.currentTask
    ? {
        kind: taskToGoalKind(input.currentTask),
        priority: input.recentFailure ? "urgent" : "normal",
        status: input.recentFailure ? "blocked" : "in_progress",
        summary: input.currentTask.reason,
        ...(input.currentTask.id === "approach_visible_target"
          ? { target_actor_id: input.currentTask.targetId }
          : {}),
        ...(taskTargetItem(input.currentTask)
          ? { target_item: taskTargetItem(input.currentTask) }
          : {}),
        evidence_refs: []
      } satisfies GoalFrame
    : undefined;

  const privateGoal = {
    kind: "reduce_friction",
    priority: "background",
    status: "in_progress",
    summary: input.actorProfile.private_goal,
    evidence_refs: []
  } satisfies GoalFrame;

  return {
    ...(publicObligation ? { public_obligation: publicObligation } : {}),
    private_goal: privateGoal,
    ...(relationshipPressure
      ? { relationship_goal: buildRelationshipGoalFrame(relationshipPressure) }
      : {}),
    ...(input.recentFailure
      ? {
          recovery_goal: {
            kind: "recover_from_failure",
            priority: "urgent",
            status: "blocked",
            summary: "Use runtime evidence to recover from the latest failed action.",
            evidence_refs: []
          } satisfies GoalFrame
        }
      : {})
  };
}

export function buildRelationshipGoalFrame(
  pressure: RelationshipActionPressure
): GoalFrame {
  return {
    kind: relationshipPressureGoalKind(pressure.kind),
    priority: pressure.priority,
    status: "in_progress",
    summary: pressure.summary,
    target_actor_id: pressure.target_actor_id,
    source_pressure_kind: pressure.kind,
    action_boundary: pressure.action_boundary,
    active_action_skill_required: pressure.active_action_skill_required,
    role_contract_boundary: pressure.role_contract_boundary,
    evidence_refs: pressure.evidence_refs
  };
}

function relationshipPressureGoalKind(
  kind: RelationshipActionPressureKind
): GoalKind {
  switch (kind) {
    case "recovery_social_caution":
      return "recover_from_failure";
    case "obligation_repair":
      return "answer_request";
    case "friction_reduction":
      return "reduce_friction";
    case "cooperative_confidence":
      return "coordinate_with_reliable_actor";
  }
}
