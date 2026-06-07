import type { ActionCardProjection } from "./actionCards.js";
import { unique } from "./projectionUtils.js";

/**
 * Appends static, parameter-shaping guidance to specific Action Cards without
 * selecting, hiding, or rejecting actions.
 *
 * @remarks Hints stay turn-invariant so the large `action_cards` block remains a
 * stable prompt prefix (reused by inference prefix caches); live
 * shared_storage/deposit values are read from `current_state`, not inlined here.
 * This module must not parse prose
 * requirements, compute recipe eligibility, hide tools, inject defaults, or
 * decide which Action Card the LLM should choose.
 */
export function annotateActionCardsWithStaticParameterHints(
  projection: ActionCardProjection
): ActionCardProjection {
  const actionCards = projection.action_cards.map((card) => {
    if (card.title === "Inspect Chest" || card.title === "Inspect Shared Chest") {
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          "Use empty parameters for the bounded shared-chest container snapshot/openability action.",
          "Read the live shared_storage status, items, and evidence from current_state.shared_storage."
        ])
      };
    }

    if (card.title === "Deposit Shared" ||
      card.title === "Deposit Shared Items" ||
      card.title === "Handoff Item At Chest") {
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          "Read current_state.deposit_candidates for itemName, inventoryCount, suggestedCount, and socially_requested.",
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
