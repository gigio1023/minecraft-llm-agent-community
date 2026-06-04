import { randomUUID } from "node:crypto";

import { soulRef } from "../actorSoulStore.js";
import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import type { ActorCycleGoal } from "../types.js";
import { listActorMemoryRefs } from "../../../memory/actorMemory.js";
import type { ActiveEpisode } from "./types.js";

function evidenceDescriptions(episode: ActiveEpisode) {
  const descriptions = episode.success_signals.map((signal) => signal.description);
  return descriptions.length > 0
    ? descriptions
    : ["Runtime evidence should show useful progress or a truthful blocker."];
}

/**
 * Reuses an Active Episode as the bounded focus for another Actor Turn cycle.
 *
 * @remarks This is not Deliberation. It preserves the current focus and writes
 * the report-compatible ActorCycleGoal artifact without asking another LLM to
 * re-plan ordinary turns.
 */
export function buildCycleGoalFromActiveEpisode(input: {
  cycleId: string;
  context: SocialCycleContextPacket;
  activeEpisode: ActiveEpisode;
}): ActorCycleGoal {
  const memoryRefs = listActorMemoryRefs(input.context.memory_packet).map((ref) => ref.memory_id);
  const worldEventRefs = input.context.world_events.map((event) => `world-events/${event.event_id}.json`);
  const relationshipRefs = [
    ...input.context.relationship_context.relationships.map((_, index) => `relationships/outgoing-${index}`),
    ...input.context.relationship_context.incoming_relationships.map((_, index) => `relationships/incoming-${index}`)
  ];
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: input.context.ActorSoul.actor_id,
    goal_id: `cycle-goal-${randomUUID()}`,
    life_goal_id: input.context.ActorLifeGoal.goal_id,
    cycle_id: input.cycleId,
    status: "active",
    source: "runtime_rule",
    summary: input.activeEpisode.current_focus,
    rationale:
      `Continue Active Episode ${input.activeEpisode.episode_id}: ${input.activeEpisode.purpose}`,
    derived_from: {
      soul_ref: soulRef(input.context.ActorSoul.actor_id),
      observation_refs: [],
      world_event_refs: worldEventRefs,
      memory_refs: memoryRefs,
      relationship_refs: relationshipRefs,
      previous_cycle_judgment_refs: input.context.previous_cycle_judgments.map((judgment) => judgment.ref),
      ...(input.activeEpisode.selected_plan_bead_refs.length > 0
        ? { plan_bead_refs: [...input.activeEpisode.selected_plan_bead_refs] }
        : {})
    },
    success_condition: {
      verifier: "active_episode_runtime_evidence",
      evidence_required: evidenceDescriptions(input.activeEpisode)
    },
    allowed_action_skill_ids: input.context.owned_action_skills.map((skill) => skill.skill_id),
    allowed_primitive_ids: [...input.context.allowed_primitive_ids],
    stop_conditions: input.activeEpisode.pivot_triggers.map((trigger) => trigger.trigger)
  };
}
