import { actors, names } from "./actors.js";
import type { ActorId, BudgetRecord } from "./types.js";

const estimatedInputUsdPerMillion = 0.25;
const estimatedOutputUsdPerMillion = 2.0;

export const budgets: Record<ActorId, BudgetRecord> = {
  npc_a: { calls: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCostUsd: 0 },
  npc_b: { calls: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCostUsd: 0 },
  npc_c: { calls: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedCostUsd: 0 }
};

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 3));
}

/**
 * Tracks rough live-model spend for the exploratory skill-village path.
 *
 * The estimate is intentionally coarse; it is a budget guardrail, not billing
 * truth, and should not drive gameplay acceptance.
 */
export function addBudget(actorId: ActorId, inputText: string, outputText: string) {
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  const record = budgets[actorId];

  record.calls += 1;
  record.estimatedInputTokens += inputTokens;
  record.estimatedOutputTokens += outputTokens;
  record.estimatedCostUsd +=
    (inputTokens / 1_000_000) * estimatedInputUsdPerMillion +
    (outputTokens / 1_000_000) * estimatedOutputUsdPerMillion;
}

export function logBudgetSummary() {
  console.log("budget summary");
  for (const actorId of actors) {
    const budget = budgets[actorId];
    console.log(
      `${names[actorId]} calls=${budget.calls} inputTok~${budget.estimatedInputTokens} outputTok~${budget.estimatedOutputTokens} cost~$${budget.estimatedCostUsd.toFixed(5)}`
    );
  }
}
