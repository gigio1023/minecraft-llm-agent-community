import type { ObserveResult } from "../../tools/observe.js";
import type { ActorActionSkillRecord } from "../actorWorkspaceStore.js";
import { buildActorProviderContext } from "../../provider/actorProviderContext.js";
import {
  retrieveActorMemoryForObjective,
  type ActorMemoryRetrievalPacket
} from "../../memory/actorMemory.js";
import type {
  ActorCycleGoal,
  ActorLifeGoal,
  ActorSoul,
  CycleJudgment,
  StrategicGoal,
  WorldEvent
} from "./types.js";
import type { RuntimeRetryConstraint } from "../retryConstraints.js";
import {
  buildActionSurfacePacket,
  type ActionSurfacePacket
} from "../actionSurface.js";
import { lifeGoalRef } from "./lifeGoalStore.js";
import { soulRef } from "./actorSoulStore.js";
import {
  buildSettlementState,
  type ActionSkillPostconditionResult,
  type SettlementState
} from "../settlement/settlementState.js";
import type { ToolResultRecord } from "../settlement/settlementState.js";

export type SocialCycleRelationshipContext = {
  relationships: unknown[];
  incoming_relationships: unknown[];
  relationship_pressures: unknown[];
  incoming_relationship_pressures: unknown[];
};

/**
 * Provider-facing social-cycle context assembled from runtime-owned artifacts.
 *
 * @remarks `action_surface` is the actor's executable body, while
 * `settlement_state` remains pressure/evidence context; neither is a domain
 * strategy that can replace ActorSoul or LifeGoal.
 */
export type SocialCycleContextPacket = {
  schema: "social-cycle-context/v1";
  ActorSoul: ActorSoul;
  ActorLifeGoal: ActorLifeGoal;
  strategic_goals: StrategicGoal[];
  world_events: WorldEvent[];
  previous_cycle_judgments: Array<{
    ref: string;
    cycle_id: string;
    outcome: string;
    what_happened: string;
    why_it_mattered_for_life_goal: string;
    next_goal_pressure: string[];
  }>;
  observation: ObserveResult | Record<string, unknown>;
  owned_action_skills: Array<{
    skill_id: string;
    required_primitives: string[];
    preconditions: string[];
    success_verifier: string;
  }>;
  allowed_primitive_ids: string[];
  action_surface: ActionSurfacePacket;
  runtime_retry_constraints: RuntimeRetryConstraint[];
  relationship_context: SocialCycleRelationshipContext;
  memory_packet: ActorMemoryRetrievalPacket;
  settlement_state: SettlementState;
  limits: {
    max_actions_per_cycle: number;
    cycle_index: number;
  };
  rules: {
    world_event_is_pressure_not_life_goal: true;
    no_user_prompt: true;
    runtime_verifies_success: true;
  };
};

function memoryItemNamesFromObservation(observation: ObserveResult | Record<string, unknown>) {
  const inventory = (observation as { inventory?: unknown }).inventory;
  if (!Array.isArray(inventory)) {
    return [];
  }

  return inventory
    .map((item) =>
      typeof item === "object" && item !== null && typeof (item as { name?: unknown }).name === "string"
        ? (item as { name: string }).name
        : null
    )
    .filter((name): name is string => Boolean(name));
}

function memoryItemNamesFromWorldEvents(worldEvents: readonly WorldEvent[]) {
  const summaries = worldEvents.map((event) => event.summary.toLowerCase()).join("\n");
  return [...new Set(summaries.match(/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/g) ?? [])];
}

/** Builds the compact context packet used by CycleGoal, ActionIntent, and judgment providers. */
export async function assembleSocialCycleContext(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  soul: ActorSoul;
  lifeGoal: ActorLifeGoal;
  strategicGoals: StrategicGoal[];
  worldEvents: WorldEvent[];
  previousJudgments: Array<{ ref: string; judgment: CycleJudgment }>;
  activeActionSkills: readonly ActorActionSkillRecord[];
  observation: ObserveResult | Record<string, unknown>;
  allowedPrimitiveIds: string[];
  maxActionsPerCycle: number;
  cycleIndex: number;
  recentToolResults?: readonly ToolResultRecord[];
  postconditionResults?: readonly ActionSkillPostconditionResult[];
  evidenceRefs?: readonly string[];
  judgmentRefs?: readonly string[];
  memoryWriteCount?: number;
  runtimeRetryConstraints?: readonly RuntimeRetryConstraint[];
}): Promise<SocialCycleContextPacket> {
  const actionSkillIds = input.activeActionSkills.map((record) => record.skill_id);
  const itemNames = [
    ...memoryItemNamesFromObservation(input.observation),
    ...memoryItemNamesFromWorldEvents(input.worldEvents)
  ];
  const memoryPacket = await retrieveActorMemoryForObjective(
    input.actorWorkspaceRootDir,
    input.actorId,
    {
      objectiveCategory: "social_cycle",
      itemNames,
      actionSkillIds,
      limit: 8
    }
  );
  const settlementState = buildSettlementState({
    actorId: input.actorId,
    observation: input.observation,
    activeActionSkills: input.activeActionSkills,
    previousJudgments: input.previousJudgments,
    recentToolResults: input.recentToolResults,
    postconditionResults: input.postconditionResults,
    evidenceRefs: input.evidenceRefs,
    judgmentRefs: [
      ...input.previousJudgments.map((entry) => entry.ref),
      ...(input.judgmentRefs ?? [])
    ],
    memoryWriteCount: input.memoryWriteCount
  });
  const actionSurface = buildActionSurfacePacket({
    actorId: input.actorId,
    activeActionSkills: input.activeActionSkills,
    allowedPrimitiveIds: input.allowedPrimitiveIds,
    recentBlockers: settlementState.blocker_histogram
  });

  const providerContext = await buildActorProviderContext({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    activeActionSkills: input.activeActionSkills,
    goalStack: {
      life_goal_ref: lifeGoalRef(),
      soul_ref: soulRef(input.actorId),
      social_runtime: true,
      builtin_curriculum_authority: false
    }
  });

  return {
    schema: "social-cycle-context/v1",
    ActorSoul: input.soul,
    ActorLifeGoal: input.lifeGoal,
    strategic_goals: [...input.strategicGoals],
    world_events: [...input.worldEvents],
    previous_cycle_judgments: input.previousJudgments.map(({ ref, judgment }) => ({
      ref,
      cycle_id: judgment.cycle_id,
      outcome: judgment.outcome,
      what_happened: judgment.what_happened,
      why_it_mattered_for_life_goal: judgment.why_it_mattered_for_life_goal,
      next_goal_pressure: [...judgment.next_goal_pressure]
    })),
    observation: input.observation,
    owned_action_skills: input.activeActionSkills.map((record) => ({
      skill_id: record.skill_id,
      required_primitives: [...record.required_primitives],
      preconditions: [...record.preconditions],
      success_verifier: record.success_verifier
    })),
    allowed_primitive_ids: [...input.allowedPrimitiveIds],
    action_surface: actionSurface,
    runtime_retry_constraints: [...(input.runtimeRetryConstraints ?? [])],
    relationship_context: {
      relationships: Array.isArray(providerContext.relationships)
        ? providerContext.relationships
        : [],
      incoming_relationships: Array.isArray(providerContext.incoming_relationships)
        ? providerContext.incoming_relationships
        : [],
      relationship_pressures: Array.isArray(providerContext.relationship_pressures)
        ? providerContext.relationship_pressures
        : [],
      incoming_relationship_pressures: Array.isArray(providerContext.incoming_relationship_pressures)
        ? providerContext.incoming_relationship_pressures
        : []
    },
    memory_packet: memoryPacket,
    settlement_state: settlementState,
    limits: {
      max_actions_per_cycle: input.maxActionsPerCycle,
      cycle_index: input.cycleIndex
    },
    rules: {
      world_event_is_pressure_not_life_goal: true,
      no_user_prompt: true,
      runtime_verifies_success: true
    }
  };
}

export function contextCitesPreviousJudgment(
  context: SocialCycleContextPacket,
  priorCycleId: string
): boolean {
  return context.previous_cycle_judgments.some((entry) => entry.cycle_id === priorCycleId);
}

export type ParsedCycleGoalProviderOutput = {
  strategic_goal_updates: StrategicGoal[];
  cycle_goal: ActorCycleGoal;
};

export type ParsedActionPlannerOutput = {
  action_intent: import("./types.js").ActionIntent;
};
