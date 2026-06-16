/**
 * Assembles the final Actor Turn provider packet from focused projections.
 *
 * @remarks The heavy policy pieces live in sibling modules so this file stays
 * as the vertical-slice boundary: context in, one provider input out.
 */
import { soulRef } from "../actorSoulStore.js";
import { lifeGoalRef } from "../lifeGoalStore.js";
import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import { buildActionCardProjection, type ActionCardProjection } from "./actionCards.js";
import { annotateActionCardsWithCurrentStateHints } from "./actionCardSelection.js";
import { buildActorTurnCurrentStateProjection } from "./currentStateProjection.js";
import { buildActorTurnDecisionFrame } from "./decisionFrame.js";
import {
  anchorActiveEpisodeToPlanBeadContext,
  buildRelationshipContextProjection,
  planBeadHintsFromContext,
  retryConstraintSummaries
} from "./episodeContextProjection.js";
import { buildMinecraftBasicGuideProjection } from "./minecraftBasicGuide.js";
import { buildActorTurnSourceEvidenceBundle } from "./sourceEvidenceBundle.js";
import type {
  ActiveEpisode,
  ActorTurnInput,
  EvidenceTraceEntry,
  ProviderBudgetHint
} from "./types.js";

export function buildActorTurnInput(input: {
  turnId: string;
  context: SocialCycleContextPacket;
  activeEpisode: ActiveEpisode;
  currentObservationRefs: readonly string[];
  recentEvidenceTrace?: readonly EvidenceTraceEntry[];
  providerBudgetHint?: ProviderBudgetHint;
}): { actorTurnInput: ActorTurnInput; actionCardProjection: ActionCardProjection } {
  const currentState = buildActorTurnCurrentStateProjection(input.context);
  const recentEvidenceTrace = [...(input.recentEvidenceTrace ?? [])];
  const actionCardProjection = annotateActionCardsWithCurrentStateHints(
    buildActionCardProjection(input.context.action_surface),
    currentState
  );
  const planBeadHints = planBeadHintsFromContext(input.context);
  const activeEpisode = anchorActiveEpisodeToPlanBeadContext({
    activeEpisode: input.activeEpisode,
    context: input.context
  });
  const actorTurnInput: ActorTurnInput = {
    schema: "actor-turn-input/v1",
    turn_id: input.turnId,
    decision_frame: buildActorTurnDecisionFrame({
      activeEpisode,
      currentState,
      actionCardProjection,
      recentEvidenceTrace
    }),
    active_episode: activeEpisode,
    actor_context: {
      actor_id: input.context.ActorSoul.actor_id,
      actor_soul_ref: soulRef(input.context.ActorSoul.actor_id),
      life_goal_ref: lifeGoalRef(),
      life_goal_summary: input.context.ActorLifeGoal.objective
    },
    current_state: currentState,
    source_evidence_bundle: buildActorTurnSourceEvidenceBundle({
      context: input.context,
      currentState,
      currentObservationRefs: input.currentObservationRefs,
      recentEvidenceTrace,
      planBeadHints
    }),
    relationship_context: buildRelationshipContextProjection(input.context),
    runtime_retry_constraints: retryConstraintSummaries(input.context),
    action_cards: actionCardProjection.action_cards,
    minecraft_basic_guide: buildMinecraftBasicGuideProjection(),
    provider_budget_hint: input.providerBudgetHint ?? {
      provider_id: "unknown",
      model: "unknown",
      status: "unknown"
    }
  };
  return { actorTurnInput, actionCardProjection };
}
