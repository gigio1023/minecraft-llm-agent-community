import { runtimePrimitives } from "../gameplay/primitives/registry.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";

export type ActionSurfaceExposure = "direct" | "deferred";

export type ActionSurfacePrimitive = {
  primitive_id: string;
  category: string;
  exposure: ActionSurfaceExposure;
  executable: boolean;
  reason: string;
  description: string;
};

export type ActionSurfaceActionSkill = {
  action_skill_id: string;
  exposure: ActionSurfaceExposure;
  executable: boolean;
  required_primitives: string[];
  missing_primitives: string[];
  preconditions: string[];
  success_verifier: string;
  reason: string;
};

export type ActionSurfacePacket = {
  schema: "action-surface/v1";
  actor_id: string;
  direct_primitives: ActionSurfacePrimitive[];
  deferred_primitives: ActionSurfacePrimitive[];
  direct_action_skills: ActionSurfaceActionSkill[];
  deferred_action_skills: ActionSurfaceActionSkill[];
  recent_blockers: Array<{ key: string; count: number; example: string }>;
  missing_affordances: string[];
  rules: {
    exposes_actor_body_not_strategy: true;
    domain_goals_are_pressure_not_core_architecture: true;
    runtime_verification_required: true;
  };
};

const primitiveDescriptions: Record<string, string> = {
  observe: "Refresh live inventory, nearby blocks, actors, and memory-facing state.",
  move_to: "Move to a bounded waypoint, observed resource, known settlement position, or visible actor.",
  collect_logs: "Gather reachable low log blocks; success requires inventory evidence.",
  mine_block: "Mine a requested block such as stone when tool and reachability evidence allow it.",
  craft_item: "Craft an inventory recipe when ingredients exist.",
  craft_with_table: "Craft a table-bound recipe when a crafting table is nearby.",
  place_block: "Place one explicit inventory block and verify the world block afterward.",
  build_pattern: "Run one bounded block-pattern executor only when the current pressure makes building relevant.",
  inspect_chest: "Inspect a nearby shared chest and record a container snapshot.",
  deposit_shared: "Deposit role-allowed useful inventory into shared storage.",
  withdraw_shared: "Withdraw a specific item from shared storage when it enables the current goal.",
  say: "Speak when communication matters for the current relationship or role pressure.",
  wait: "Wait briefly when the world needs time or no better physical action is justified.",
  remember: "Record a blocker, observation, or decision to avoid blind repetition."
};

function primitiveDescription(primitiveId: string) {
  return primitiveDescriptions[primitiveId] ?? "Runtime primitive exposed by the current actor body.";
}

function primitiveReason(input: {
  primitiveId: string;
  roleAllowedPrimitiveIds: Set<string>;
  activePrimitiveIds: Set<string>;
}) {
  if (!input.roleAllowedPrimitiveIds.has(input.primitiveId)) {
    return "not role-allowed in the current actor contract";
  }
  if (!input.activePrimitiveIds.has(input.primitiveId)) {
    return "not backed by an active actor-owned action skill";
  }
  return "role-allowed and backed by active actor-owned action skills";
}

function actionSkillExposure(input: {
  record: ActorActionSkillRecord;
  executablePrimitiveIds: Set<string>;
}): ActionSurfaceActionSkill {
  const missing = input.record.required_primitives.filter(
    (primitive) => !input.executablePrimitiveIds.has(primitive)
  );
  const executable = input.record.status === "active" && missing.length === 0;
  return {
    action_skill_id: input.record.skill_id,
    exposure: executable ? "direct" : "deferred",
    executable,
    required_primitives: [...input.record.required_primitives],
    missing_primitives: missing,
    preconditions: [...input.record.preconditions],
    success_verifier: input.record.success_verifier,
    reason: executable
      ? "all required primitives are executable in the current actor body"
      : missing.length > 0
        ? `missing executable primitives: ${missing.join(", ")}`
        : `action skill status is ${input.record.status}`
  };
}

/**
 * Builds the model-visible action surface without turning any domain objective
 * into a core strategy. Shelter, storage, mining, and speech are all just
 * affordances until Soul/LifeGoal pressure and runtime evidence make one useful.
 */
export function buildActionSurfacePacket(input: {
  actorId: string;
  activeActionSkills: readonly ActorActionSkillRecord[];
  allowedPrimitiveIds: readonly string[];
  recentBlockers?: Array<{ key: string; count: number; example: string }>;
}): ActionSurfacePacket {
  const roleAllowedPrimitiveIds = new Set(input.allowedPrimitiveIds);
  const activePrimitiveIds = new Set(
    input.activeActionSkills.flatMap((record) =>
      record.status === "active" ? record.required_primitives : []
    )
  );
  const executablePrimitiveIds = new Set(
    [...roleAllowedPrimitiveIds].filter((primitiveId) => activePrimitiveIds.has(primitiveId))
  );

  const primitiveRows = runtimePrimitives.map((primitive) => {
    const executable = executablePrimitiveIds.has(primitive.id);
    return {
      primitive_id: primitive.id,
      category: primitive.category,
      exposure: executable ? "direct" as const : "deferred" as const,
      executable,
      reason: primitiveReason({
        primitiveId: primitive.id,
        roleAllowedPrimitiveIds,
        activePrimitiveIds
      }),
      description: primitiveDescription(primitive.id)
    };
  });

  const actionSkillRows = input.activeActionSkills.map((record) =>
    actionSkillExposure({ record, executablePrimitiveIds })
  );

  return {
    schema: "action-surface/v1",
    actor_id: input.actorId,
    direct_primitives: primitiveRows.filter((row) => row.exposure === "direct"),
    deferred_primitives: primitiveRows.filter((row) => row.exposure === "deferred"),
    direct_action_skills: actionSkillRows.filter((row) => row.exposure === "direct"),
    deferred_action_skills: actionSkillRows.filter((row) => row.exposure === "deferred"),
    recent_blockers: [...(input.recentBlockers ?? [])],
    missing_affordances: actionSkillRows
      .flatMap((row) => row.missing_primitives)
      .filter((primitiveId, index, all) => all.indexOf(primitiveId) === index)
      .sort(),
    rules: {
      exposes_actor_body_not_strategy: true,
      domain_goals_are_pressure_not_core_architecture: true,
      runtime_verification_required: true
    }
  };
}
