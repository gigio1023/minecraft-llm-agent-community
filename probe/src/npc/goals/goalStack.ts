import type { DeterministicTask } from "../../gameplay/curriculum/deterministicCurriculum.js";
import type { ActorProfile } from "../profiles.js";
import {
  deriveRelationshipActionContextSignals,
  selectDominantRelationshipActionContextSignal,
  type RelationshipActionContextSignal,
  type RelationshipActionContextSignalKind
} from "../relationships/actionContextSignal.js";
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
  source_context_signal_kind?: RelationshipActionContextSignalKind;
  action_boundary?: "intent_context_only";
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
    case "craft_wooden_pickaxe":
      return "craft_item";
    case "mine_cobblestone":
      return "gather_resource";
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
    case "craft_wooden_pickaxe":
      return "wooden_pickaxe";
    case "mine_cobblestone":
      return "cobblestone";
    case "deposit_shared_materials":
      return "shared_materials";
    case "approach_visible_target":
      return undefined;
  }
}

/**
 * Curriculum-backed goal frames for probe/v0 loops only.
 * Social-cycle runtime (`probe:social-cycle`) must not treat this stack as goal authority.
 */
export function buildActorGoalStack(input: {
  actorProfile: ActorProfile;
  currentTask?: DeterministicTask | null;
  recentFailure?: boolean;
  relationshipEdges?: readonly RelationshipEdge[];
  relationshipContextSignal?: RelationshipActionContextSignal | null;
}): ActorGoalStack {
  const relationshipContextSignal =
    input.relationshipContextSignal ??
    selectDominantRelationshipActionContextSignal(
      deriveRelationshipActionContextSignals(input.relationshipEdges ?? [])
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
    ...(relationshipContextSignal
      ? { relationship_goal: buildRelationshipGoalFrame(relationshipContextSignal) }
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
  signal: RelationshipActionContextSignal
): GoalFrame {
  return {
    kind: relationshipContextSignalGoalKind(signal.kind),
    priority: signal.priority,
    status: "in_progress",
    summary: signal.summary,
    target_actor_id: signal.target_actor_id,
    source_context_signal_kind: signal.kind,
    action_boundary: signal.action_boundary,
    active_action_skill_required: signal.active_action_skill_required,
    role_contract_boundary: signal.role_contract_boundary,
    evidence_refs: signal.evidence_refs
  };
}

function relationshipContextSignalGoalKind(
  kind: RelationshipActionContextSignalKind
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
