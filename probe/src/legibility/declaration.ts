import fs from "node:fs/promises";
import path from "node:path";

import type {
  ExperimentDeclarationV1,
  LegibilityCondition
} from "./types.js";

export const centralPlanPredictorArms = [
  "majority_or_no_response",
  "scripted_heuristic",
  "policy_copy",
  "last_response_carried_forward",
  "llm_prior",
  "current_observation",
  "history_grounded",
  "same_family_predictor",
  "shuffled_history",
  "actor_id_only",
  "first_m_public_responses",
  "action_family_by_responder",
  "public_profile_only",
  "dialogue_only",
  "no_generated_action_rows"
] as const;

export function createExperimentDeclaration(input: {
  experimentId: string;
  actorAssignments: Array<{
    condition: LegibilityCondition;
    actorIds: string[];
    counterbalancing?: string;
  }>;
  scenarioFamilies: string[];
  seedResetRefs: string[];
  providerFree: boolean;
  preflightRef?: string;
  writtenAt?: string;
  ciLevel?: number;
}): ExperimentDeclarationV1 {
  return {
    schema_version: "experiment-declaration/v1",
    experiment_id: input.experimentId,
    written_at: input.writtenAt ?? new Date().toISOString(),
    conditions: input.actorAssignments.map((assignment) => ({
      condition: assignment.condition,
      actor_ids: [...assignment.actorIds],
      counterbalancing: assignment.counterbalancing ?? "session-1 deterministic smoke order"
    })),
    public_private_boundary: {
      public_history_allowlist_version: "public-history-allowlist/v1",
      forbidden_fields: [
        "ActorSoul",
        "LifeGoal",
        "memory",
        "PlanBeads",
        "provider inputs",
        "provider outputs",
        "relationship prose without typed evidence"
      ]
    },
    scenario_families: [...input.scenarioFamilies],
    predictor_arms: [...centralPlanPredictorArms],
    input_cutoff: "before_action_started_at",
    metrics: {
      include_per_condition_lift: true,
      include_rer: true,
      include_matched_stratum: true,
      include_auc: true,
      bootstrap_grouping: "seed_or_reset_id",
      ci_level: input.ciLevel ?? 0.95
    },
    label_locking: {
      required_before_prediction_join: true
    },
    leakage_tests: [
      "identity_permutation",
      "prompt_shape",
      "actor_id_only",
      "first_m_public_responses",
      "action_family_by_responder",
      "public_profile_only"
    ],
    stop_results: [
      "K1 measurement broken if scripted_responder history lift <= +0.05 macro-F1 or CI crosses 0",
      "K6 defer if two focused sessions cannot close a preregistered batch",
      "K7 dialogue-only collapse if >= 80% scorable response labels are chat-only"
    ],
    provider_budget: {
      provider_free: input.providerFree,
      ...(input.preflightRef ? { preflight_ref: input.preflightRef } : {})
    },
    seed_reset_refs: [...input.seedResetRefs]
  };
}

export async function writeExperimentDeclaration(
  filePath: string,
  declaration: ExperimentDeclarationV1
) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(declaration, null, 2)}\n`, "utf8");
  return filePath;
}
