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
import { annotateActionCardsWithStaticParameterHints } from "./actionCardSelection.js";
import { buildActorTurnCurrentStateProjection } from "./currentStateProjection.js";
import { buildActorTurnDecisionFrame } from "./decisionFrame.js";
import {
  anchorActiveEpisodeToPlanBeadContext,
  buildRelationshipContextProjection,
  memoryRefsFromContext,
  planBeadHintsFromContext,
  retryConstraintSummaries
} from "./episodeContextProjection.js";
import { buildMinecraftBasicGuideProjection } from "./minecraftBasicGuide.js";
import { buildMineflayerCodegenSkillProjection } from "./mineflayerCodegenSkill.js";
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
  const actionCardProjection = annotateActionCardsWithStaticParameterHints(
    buildActionCardProjection(input.context.action_surface)
  );
  const activeEpisode = anchorActiveEpisodeToPlanBeadContext({
    activeEpisode: input.activeEpisode,
    context: input.context
  });
  // Key order is the serialized prompt order, which sets the prompt prefix-cache
  // boundary (inference backends reuse the prefix up to the first byte that
  // changes between turns). Keep cache-stable blocks first and turn-volatile
  // fields last.
  const actorTurnInput: ActorTurnInput = {
    schema: "actor-turn-input/v1",
    minecraft_basic_guide: buildMinecraftBasicGuideProjection(),
    mineflayer_codegen_skill: buildMineflayerCodegenSkillProjection(),
    action_cards: actionCardProjection.action_cards,
    actor_context: {
      actor_id: input.context.ActorSoul.actor_id,
      actor_soul_ref: soulRef(input.context.ActorSoul.actor_id),
      life_goal_ref: lifeGoalRef(),
      life_goal_summary: input.context.ActorLifeGoal.objective
    },
    relationship_context: buildRelationshipContextProjection(input.context),
    compact_plan_bead_hints: planBeadHintsFromContext(input.context),
    current_observation_refs: [...input.currentObservationRefs],
    provider_budget_hint: input.providerBudgetHint ?? {
      provider_id: "unknown",
      model: "unknown",
      status: "unknown"
    },
    turn_id: input.turnId,
    active_episode: activeEpisode,
    decision_frame: buildActorTurnDecisionFrame({
      activeEpisode,
      currentState,
      actionCardProjection,
      recentEvidenceTrace
    }),
    current_state: currentState,
    recent_evidence_trace: recentEvidenceTrace,
    memory_refs: memoryRefsFromContext(input.context),
    runtime_retry_constraints: retryConstraintSummaries(input.context)
  };
  return { actorTurnInput, actionCardProjection };
}
