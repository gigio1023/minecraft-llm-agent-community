import type { ObserveResult } from "../../tools/observe.js";
import type { ActorActionSkillRecord } from "../actorWorkspaceStore.js";
import { buildActorProviderContext } from "../../provider/actorProviderContext.js";
import { retrieveActorMemoryForObjective } from "../../memory/actorMemory.js";
import type {
  ActorCycleGoal,
  ActorLifeGoal,
  ActorSoul,
  CycleJudgment,
  StrategicGoal,
  WorldEvent
} from "./types.js";
import { lifeGoalRef } from "./lifeGoalStore.js";
import { soulRef } from "./actorSoulStore.js";

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
  relationship_context: unknown;
  memory_packet: unknown;
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
}): Promise<SocialCycleContextPacket> {
  const memoryPacket = await retrieveActorMemoryForObjective(
    input.actorWorkspaceRootDir,
    input.actorId,
    { limit: 8 }
  );

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
    relationship_context: providerContext.relationships,
    memory_packet: memoryPacket,
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

export type ParsedGoalMindOutput = {
  strategic_goal_updates: StrategicGoal[];
  cycle_goal: ActorCycleGoal;
};

export type ParsedActionPlannerOutput = {
  action_intent: import("./types.js").ActionIntent;
};
