import type { ActionCardProjection } from "./actionCards.js";
import { unique } from "./projectionUtils.js";

/**
 * Groups repeated provider-visible hints without selecting, hiding, or rejecting actions.
 *
 * @remarks This module must stay out of the Minecraft-planner business. It may
 * It may point to structured state already in `ActorTurnInput`, but it must not
 * parse prose requirements, compute recipe eligibility, hide tools, inject
 * defaults, or decide which Action Card the LLM should choose.
 */
export function annotateActionCardsWithSharedGuidance(
  projection: ActionCardProjection
): ActionCardProjection {
  if (!projection.shared_guidance) {
    return projection;
  }
  const cardIdsForTitles = (titles: readonly string[]) => projection.action_cards
    .filter((card) => titles.includes(card.title))
    .map((card) => card.action_card_id);
  const groupedGuidance = [
    {
      action_card_ids: cardIdsForTitles(["Inspect Chest", "Inspect Shared Chest"]),
      guidance: ["Use empty parameters for bounded shared-chest inspection."]
    },
    {
      action_card_ids: cardIdsForTitles(["Deposit Shared", "Deposit Shared Items", "Handoff Item At Chest"]),
      guidance: [
        "Choose itemName and count from current inventory plus relevant world-event or relationship evidence, and provide both explicitly."
      ]
    },
    {
      action_card_ids: cardIdsForTitles(["Craft Item", "Craft With Table"]),
      guidance: ["Choose itemName from current inventory and the Minecraft Basic Guide; the runtime still validates it explicitly."]
    },
    {
      action_card_ids: cardIdsForTitles(["Place Block", "Place Crafting Table", "Build Pattern"]),
      guidance: [
        "Provide targetPosition or anchor explicitly and choose it from known nearby block coordinates; the runtime never invents placement coordinates.",
        "Placement evidence proves the local physical change only; compare it with the active goal before continuing."
      ]
    }
  ].filter((group) => group.action_card_ids.length > 0);

  return {
    ...projection,
    shared_guidance: {
      ...projection.shared_guidance,
      grouped_guidance: groupedGuidance
    },
    action_cards: projection.action_cards.map((card) => ({
      ...card,
      parameter_hints: unique(card.parameter_hints)
    }))
  };
}
