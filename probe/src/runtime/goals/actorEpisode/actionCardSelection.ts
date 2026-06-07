import type { ActionCardProjection } from "./actionCards.js";
import type { ActorTurnCurrentStateProjection } from "./types.js";
import { unique } from "./projectionUtils.js";

/**
 * Adds provider-visible hints without selecting, hiding, or rejecting actions.
 *
 * @remarks This module must stay out of the Minecraft-planner business. It may
 * surface structured current-state facts that are already in `ActorTurnInput`,
 * but it must not parse prose requirements, compute recipe eligibility, hide
 * tools, inject defaults, or decide which Action Card the LLM should choose.
 */
export function annotateActionCardsWithCurrentStateHints(
  projection: ActionCardProjection,
  currentState: ActorTurnCurrentStateProjection
): ActionCardProjection {
  const actionCards = projection.action_cards.map((card) => {
    if (card.title === "Inspect Chest" || card.title === "Inspect Shared Chest") {
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          "Use empty parameters for the bounded shared-chest container snapshot/openability action.",
          `Current shared_storage status: ${currentState.shared_storage.status}.`,
          ...(currentState.shared_storage.items.length > 0
            ? [
                `Known shared_storage items: ${currentState.shared_storage.items
                  .map((item) => `${item.name}:${item.count}`)
                  .join(", ")}.`
              ]
            : []),
          ...(currentState.shared_storage.evidence_refs.length > 0
            ? [`Shared storage evidence refs: ${currentState.shared_storage.evidence_refs.join(", ")}.`]
            : [])
        ])
      };
    }

    if (card.title === "Deposit Shared" ||
      card.title === "Deposit Shared Items" ||
      card.title === "Handoff Item At Chest") {
      const candidates = currentState.deposit_candidates.slice(0, 6);
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          ...(candidates.length > 0
            ? [
                `Current deposit candidates: ${candidates
                  .map((candidate) =>
                    `${candidate.itemName} inventory=${candidate.inventoryCount} suggestedCount=${candidate.suggestedCount}${
                      candidate.socially_requested ? " socially_requested" : ""
                    }`
                  )
                  .join("; ")}.`
              ]
            : ["No deposit candidates are currently projected from inventory/social context."]),
          "If choosing this Action Card, provide explicit itemName and count in parameters; runtime will not infer them from prose."
        ])
      };
    }

    if (card.title === "Craft Item" || card.title === "Craft With Table") {
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          "Use current_state.inventory_counts plus minecraft_basic_guide to choose itemName; runtime will validate structured args but will not parse current_state_requirements as a recipe gate."
        ])
      };
    }

    if (card.title === "Place Block" || card.title === "Build Pattern") {
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          "Provide an explicit targetPosition/anchor in structured parameters; runtime will not synthesize placement coordinates.",
          "Placement and pattern verifiers are local physical-evidence checks, not universal goal-completion rules; compare current_state.structure_progress with active_episode/world event wording before continuing, adapting, or pivoting."
        ])
      };
    }

    return card;
  });

  return { ...projection, action_cards: actionCards };
}
