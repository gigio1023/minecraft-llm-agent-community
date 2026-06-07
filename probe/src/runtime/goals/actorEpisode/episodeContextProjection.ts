import { lifeGoalRef } from "../lifeGoalStore.js";
import type { ActorCycleGoal } from "../types.js";
import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import type {
  ActiveEpisode,
  PlanBeadHint,
  RelationshipContextProjection,
  SocialPressureSummary
} from "./types.js";
import { asRecord, sameStrings, unique } from "./projectionUtils.js";
import { relationshipProjectionCards } from "./sourceEvidenceBundle.js";

export function visibleActorIdsFromObservation(observation: unknown) {
  const record = asRecord(observation);
  const visibleActors = Array.isArray(record?.visibleActors) ? record.visibleActors : [];
  return visibleActors
    .map((actor) => {
      if (typeof actor === "string") {
        return actor;
      }
      const actorRecord = asRecord(actor);
      return typeof actorRecord?.actor_id === "string"
        ? actorRecord.actor_id
        : typeof actorRecord?.id === "string"
          ? actorRecord.id
          : null;
    })
    .filter((actorId): actorId is string => Boolean(actorId));
}

export function memoryRefsFromContext(context: SocialCycleContextPacket) {
  const packet = context.memory_packet;
  return unique([
    ...packet.retrieved_episodic.map((entry) => entry.memory_id),
    ...packet.retrieved_procedural.map((entry) => entry.memory_id),
    ...packet.retrieved_semantic.map((entry) => entry.memory_id),
    ...packet.retrieved_social.map((entry) => entry.memory_id),
    ...packet.guardrails.map((entry) => entry.memory_id),
    ...packet.beliefs.map((entry) => entry.memory_id)
  ]);
}

function relationshipRefsFromContext(context: SocialCycleContextPacket) {
  return unique([
    ...context.relationship_context.relationships.map((_, index) => `relationships/outgoing-${index}`),
    ...context.relationship_context.incoming_relationships.map((_, index) => `relationships/incoming-${index}`),
    ...context.relationship_context.relationship_context_signals.map((_, index) => `relationship-signals/outgoing-${index}`),
    ...context.relationship_context.incoming_relationship_context_signals.map((_, index) => `relationship-signals/incoming-${index}`)
  ]);
}

function socialPressureFromContext(context: SocialCycleContextPacket): SocialPressureSummary[] {
  const sharedStorage = context.settlement_state.shared_storage;
  const pressures: SocialPressureSummary[] = [];
  if (sharedStorage.status !== "unknown") {
    pressures.push({
      kind: "shared_storage",
      summary: `Shared storage status is ${sharedStorage.status}.`,
      evidence_refs: [...sharedStorage.evidence_refs]
    });
  }
  for (const event of context.world_events.slice(-8)) {
    pressures.push({
      kind: "world_event",
      summary: event.summary,
      evidence_refs: [...event.evidence_refs]
    });
  }
  return pressures;
}

export function planBeadHintsFromContext(context: SocialCycleContextPacket): PlanBeadHint[] {
  const packet = context.plan_bead_packet;
  if (!packet) {
    return [];
  }
  return [
    ...packet.ready_beads,
    ...packet.in_progress_beads,
    ...packet.blocked_beads
  ].map((bead) => ({
    bead_id: bead.bead_id,
    title: bead.title,
    status: bead.status,
    priority: bead.priority,
    why_it_matters: bead.description_summary,
    next_hints: [...bead.notes_next],
    blockers: [...bead.blockers],
    acceptance_evidence_required: [...bead.acceptance_evidence_required],
    evidence_refs: [...bead.evidence_refs],
    dependency_refs: [...bead.dependency_refs],
    checkpoint_ref: bead.checkpoint_ref
  }));
}

function selectedPlanBeadAnchorsFromContext(context: SocialCycleContextPacket) {
  const packet = context.plan_bead_packet;
  if (!packet) {
    return [];
  }
  return unique([
    ...packet.in_progress_beads.map((bead) => bead.bead_id),
    ...packet.ready_beads.map((bead) => bead.bead_id)
  ]).slice(0, 2);
}

export function anchorActiveEpisodeToPlanBeadContext(input: {
  activeEpisode: ActiveEpisode;
  context: SocialCycleContextPacket;
}): ActiveEpisode {
  const hintRefs = planBeadHintsFromContext(input.context).map((bead) => bead.bead_id);
  const selectedRefs = input.activeEpisode.selected_plan_bead_refs.length > 0
    ? input.activeEpisode.selected_plan_bead_refs
    : selectedPlanBeadAnchorsFromContext(input.context);
  const relatedRefs = unique([
    ...selectedRefs,
    ...input.activeEpisode.related_plan_bead_refs,
    ...hintRefs
  ]);
  if (
    sameStrings(selectedRefs, input.activeEpisode.selected_plan_bead_refs) &&
    sameStrings(relatedRefs, input.activeEpisode.related_plan_bead_refs)
  ) {
    return input.activeEpisode;
  }
  return {
    ...input.activeEpisode,
    selected_plan_bead_refs: selectedRefs,
    related_plan_bead_refs: relatedRefs
  };
}

export function retryConstraintSummaries(context: SocialCycleContextPacket) {
  return context.runtime_retry_constraints.map((constraint) => ({
    constraint_id: constraint.constraint_id,
    target_summary: `${constraint.action_kind}:${constraint.target.kind}:${constraint.target.id}`,
    args_normalized: constraint.args_normalized,
    blocked_reason: constraint.blocker_reason,
    repeat_count: constraint.repeat_count,
    evidence_refs: [...constraint.evidence_refs]
  }));
}

export function buildActiveEpisodeFromCycleGoal(input: {
  episodeId: string;
  context: SocialCycleContextPacket;
  cycleGoal: ActorCycleGoal;
  selectedPlanBeadRefs?: readonly string[];
  startedAtTurnRef?: string;
}): ActiveEpisode {
  return {
    schema: "active-episode/v1",
    episode_id: input.episodeId,
    actor_id: input.context.ActorSoul.actor_id,
    actors_visible_or_relevant: visibleActorIdsFromObservation(input.context.observation),
    life_goal_ref: lifeGoalRef(),
    purpose: input.cycleGoal.rationale,
    current_focus: input.cycleGoal.summary,
    selected_plan_bead_refs: input.selectedPlanBeadRefs && input.selectedPlanBeadRefs.length > 0
      ? [...input.selectedPlanBeadRefs]
      : selectedPlanBeadAnchorsFromContext(input.context),
    related_plan_bead_refs: planBeadHintsFromContext(input.context).map((bead) => bead.bead_id),
    success_signals: input.cycleGoal.success_condition.evidence_required.map((description) => ({
      kind: "runtime_artifact",
      description
    })),
    pivot_triggers: input.cycleGoal.stop_conditions.map((condition) => ({
      trigger: condition,
      evidence_refs: []
    })),
    mistake_budget: {
      allow_exploration_turns: 2,
      observe_repeat_limit: 1,
      exact_blocker_repeat_limit: 2
    },
    social_pressure: socialPressureFromContext(input.context),
    opened_from_refs: [
      ...input.cycleGoal.derived_from.observation_refs,
      ...input.cycleGoal.derived_from.world_event_refs,
      ...input.cycleGoal.derived_from.previous_cycle_judgment_refs
    ],
    ...(input.startedAtTurnRef ? { started_at_turn_ref: input.startedAtTurnRef } : {}),
    status: "active"
  };
}

export function buildRelationshipContextProjection(
  context: SocialCycleContextPacket
): RelationshipContextProjection {
  return {
    relationship_refs: relationshipRefsFromContext(context),
    visible_actor_ids: visibleActorIdsFromObservation(context.observation),
    relationship_cards: relationshipProjectionCards(context)
  };
}
