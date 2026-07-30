import fs from "node:fs/promises";
import path from "node:path";

import { isLegibilityCondition } from "./types.js";
import type {
  ActorProviderRoute,
  ActorSoulRouteMode,
  ConditionSeedResetMetadata,
  ConditionSoulProvenance,
  ExperimentDeclarationV1,
  FamilyHoldoutPolicy,
  LegibilityConditionDeclaration,
  LegibilityCondition
} from "./types.js";
import type { SocialCycleProviderId } from "../runtime/goals/types.js";

type ConditionRouteDefault = {
  provider_id: SocialCycleProviderId;
  model: string;
  actor_soul_route: ActorSoulRouteMode;
  actor_model_family: string;
  soul_consistency: ConditionSoulProvenance["soul_consistency"];
};

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

export const providerFreeConditionRouteDefaults = {
  scripted_responder: {
    provider_id: "scripted-social",
    model: "scripted-social",
    actor_soul_route: "not_applicable",
    actor_model_family: "scripted-social",
    soul_consistency: "scripted_policy_no_actor_soul"
  },
  stable_soul: {
    provider_id: "deterministic-social",
    model: "deterministic-social/stable-soul-standin",
    actor_soul_route: "stable_actor_soul",
    actor_model_family: "deterministic-social",
    soul_consistency: "stable_private_actor_soul"
  },
  resampled_soul: {
    provider_id: "deterministic-social",
    model: "deterministic-social/resampled-soul-standin",
    actor_soul_route: "resampled_actor_soul",
    actor_model_family: "deterministic-social",
    soul_consistency: "resampled_private_actor_soul"
  }
} as const satisfies Record<LegibilityCondition, ConditionRouteDefault>;

export type ConditionRouteOverride = Partial<Pick<ConditionRouteDefault, "provider_id" | "model">>;

export type ConditionDeclarationInput = {
  condition: LegibilityCondition;
  actorIds: string[];
  responderActorIds?: string[];
  counterbalancing?: string;
  conditionId?: string;
  seedOrResetId?: string;
  seedResetRef?: string;
  resetIndex?: number;
  provenanceRefs?: string[];
  soulFamilyId?: string;
  soulInstanceId?: string;
  soulGenerationSeed?: string;
  privateSoulRef?: string;
  resampledFromSoulInstanceId?: string;
  actorModelFamily?: string;
  predictorModelFamily?: string;
};

const conditionRequiresSeedResetRef = {
  scripted_responder: false,
  stable_soul: false,
  resampled_soul: true
} as const satisfies Record<LegibilityCondition, boolean>;

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

function cleanActorIds(actorIds: readonly string[], field: string) {
  const clean = unique(actorIds.map((actorId) => actorId.trim()).filter(Boolean));
  if (clean.length === 0) {
    throw new Error(`${field} must include at least one actor id`);
  }
  return clean;
}

function slug(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized || "unknown";
}

function actorSlug(actorIds: readonly string[]) {
  return actorIds.map(slug).sort().join("+");
}

function requireKnownCondition(value: unknown): LegibilityCondition {
  if (!isLegibilityCondition(value)) {
    throw new Error(`Unknown legibility condition: ${String(value)}`);
  }
  return value;
}

function defaultSeedOrResetId(input: {
  condition: LegibilityCondition;
  actorIds: readonly string[];
  resetIndex: number;
}) {
  return `${input.condition}-${actorSlug(input.actorIds)}-seed-reset-${input.resetIndex}`;
}

function defaultConditionId(input: {
  condition: LegibilityCondition;
  actorIds: readonly string[];
  seedOrResetId: string;
}) {
  return `${input.condition}:${actorSlug(input.actorIds)}:${slug(input.seedOrResetId)}`;
}

function defaultSoulFamilyId(input: {
  condition: LegibilityCondition;
  actorIds: readonly string[];
  actorModelFamily: string;
}) {
  const familyByCondition = {
    scripted_responder: `${input.actorModelFamily}:scripted-policy`,
    stable_soul: `${input.actorModelFamily}:actor-soul-family:${actorSlug(input.actorIds)}`,
    resampled_soul: `${input.actorModelFamily}:actor-soul-family:${actorSlug(input.actorIds)}`
  } as const satisfies Record<LegibilityCondition, string>;
  return familyByCondition[input.condition];
}

function stableSoulInstanceId(input: {
  actorIds: readonly string[];
  soulFamilyId: string;
}) {
  return `stable-soul:${actorSlug(input.actorIds)}:${slug(input.soulFamilyId)}`;
}

function defaultSoulInstanceId(input: {
  condition: LegibilityCondition;
  actorIds: readonly string[];
  seedOrResetId: string;
  soulFamilyId: string;
}) {
  const stableInstance = stableSoulInstanceId(input);
  const instanceByCondition = {
    scripted_responder: `scripted-policy:${slug(input.soulFamilyId)}`,
    stable_soul: stableInstance,
    resampled_soul: `resampled-soul:${actorSlug(input.actorIds)}:${slug(input.seedOrResetId)}:${slug(input.soulFamilyId)}`
  } as const satisfies Record<LegibilityCondition, string>;
  return instanceByCondition[input.condition];
}

function defaultSoulGenerationSeed(input: {
  condition: LegibilityCondition;
  actorIds: readonly string[];
  seedOrResetId: string;
  soulFamilyId: string;
}) {
  const seedByCondition = {
    scripted_responder: `scripted-policy:${slug(input.soulFamilyId)}`,
    stable_soul: `stable-soul:${actorSlug(input.actorIds)}:${slug(input.soulFamilyId)}`,
    resampled_soul: `resampled-soul:${actorSlug(input.actorIds)}:${slug(input.seedOrResetId)}:${slug(input.soulFamilyId)}`
  } as const satisfies Record<LegibilityCondition, string>;
  return seedByCondition[input.condition];
}

function defaultPrivateSoulRef(input: {
  actorIds: readonly string[];
  soulInstanceId: string;
}) {
  return `actor-workspaces/${input.actorIds[0]}/goals/soul/${slug(input.soulInstanceId)}.json`;
}

function createFamilyHoldoutPolicy(input: {
  conditionId: string;
  actorModelFamily: string;
  predictorModelFamily: string;
}): FamilyHoldoutPolicy {
  const heldOut = input.actorModelFamily !== input.predictorModelFamily;
  if (!heldOut) {
    throw new Error(
      `Condition ${input.conditionId} violates held-out-family provenance: actor and predictor model families match`
    );
  }
  return {
    actor_model_family: input.actorModelFamily,
    predictor_model_family: input.predictorModelFamily,
    held_out_family_required: true,
    held_out_family_satisfied: heldOut,
    same_family_predictor_role: "diagnostic_only"
  };
}

function createConditionDeclaration(input: {
  assignment: ConditionDeclarationInput;
  index: number;
}): LegibilityConditionDeclaration {
  const condition = requireKnownCondition(input.assignment.condition);
  const defaults = providerFreeConditionRouteDefaults[condition];
  const actorIds = cleanActorIds(input.assignment.actorIds, "actorIds");
  const responderActorIds = input.assignment.responderActorIds
    ? cleanActorIds(input.assignment.responderActorIds, "responderActorIds")
    : actorIds;
  const resetIndex = input.assignment.resetIndex ?? input.index + 1;
  const seedOrResetId = input.assignment.seedOrResetId ?? defaultSeedOrResetId({
    condition,
    actorIds,
    resetIndex
  });
  if (conditionRequiresSeedResetRef[condition] && !input.assignment.seedResetRef) {
    throw new Error(`Condition ${condition} requires an explicit seedResetRef`);
  }
  const conditionId = input.assignment.conditionId ?? defaultConditionId({
    condition,
    actorIds,
    seedOrResetId
  });
  const actorModelFamily = input.assignment.actorModelFamily ?? defaults.actor_model_family;
  const predictorModelFamily = input.assignment.predictorModelFamily ?? "held-out-public-history-baseline";
  const soulFamilyId = input.assignment.soulFamilyId ?? defaultSoulFamilyId({
    condition,
    actorIds: responderActorIds,
    actorModelFamily
  });
  const soulInstanceId = input.assignment.soulInstanceId ?? defaultSoulInstanceId({
    condition,
    actorIds: responderActorIds,
    seedOrResetId,
    soulFamilyId
  });
  const seedReset: ConditionSeedResetMetadata = {
    seed_or_reset_id: seedOrResetId,
    ...(input.assignment.seedResetRef ? { seed_reset_ref: input.assignment.seedResetRef } : {}),
    declared_before_outcome: true,
    reset_index: resetIndex,
    provenance_path: `conditions/${slug(conditionId)}/seed-reset`
  };
  const soulProvenance: ConditionSoulProvenance = {
    actor_soul_route: defaults.actor_soul_route,
    soul_consistency: defaults.soul_consistency,
    soul_family_id: soulFamilyId,
    soul_instance_id: soulInstanceId,
    soul_generation_seed: input.assignment.soulGenerationSeed ?? defaultSoulGenerationSeed({
      condition,
      actorIds: responderActorIds,
      seedOrResetId,
      soulFamilyId
    }),
    ...(defaults.actor_soul_route === "not_applicable"
      ? {}
      : { private_soul_ref: input.assignment.privateSoulRef ?? defaultPrivateSoulRef({
          actorIds: responderActorIds,
          soulInstanceId
        }) }),
    ...(input.assignment.resampledFromSoulInstanceId
      ? { resampled_from_soul_instance_id: input.assignment.resampledFromSoulInstanceId }
      : {}),
    family_holdout: createFamilyHoldoutPolicy({
      conditionId,
      actorModelFamily,
      predictorModelFamily
    }),
    private_soul_text_in_declaration: false
  };

  return {
    condition_id: conditionId,
    condition,
    actor_ids: actorIds,
    responder_actor_ids: responderActorIds,
    counterbalancing: input.assignment.counterbalancing ?? "session-1 deterministic smoke order",
    seed_reset: seedReset,
    soul_provenance: soulProvenance,
    provenance_refs: unique([
      ...(input.assignment.seedResetRef ? [input.assignment.seedResetRef] : []),
      ...(input.assignment.provenanceRefs ?? [])
    ])
  };
}

export function buildProviderFreeConditionRoutes(input: {
  actorAssignments: ExperimentDeclarationV1["conditions"];
  seedOrResetIdsByCondition?: Partial<Record<LegibilityCondition, string>>;
  seedResetRefsByCondition?: Partial<Record<LegibilityCondition, string>>;
  routeOverridesByCondition?: Partial<Record<LegibilityCondition, ConditionRouteOverride>>;
}): ActorProviderRoute[] {
  const seenActorIds = new Set<string>();
  const routes: ActorProviderRoute[] = [];

  for (const assignment of input.actorAssignments) {
    const condition = requireKnownCondition(assignment.condition);
    const defaults = providerFreeConditionRouteDefaults[condition];
    const override = input.routeOverridesByCondition?.[condition];
    for (const actorId of assignment.actor_ids) {
      if (seenActorIds.has(actorId)) {
        throw new Error(`Actor ${actorId} assigned to more than one legibility condition`);
      }
      seenActorIds.add(actorId);
      const seedOrResetId =
        input.seedOrResetIdsByCondition?.[condition] ?? assignment.seed_reset.seed_or_reset_id;
      const seedResetRef =
        input.seedResetRefsByCondition?.[condition] ?? assignment.seed_reset.seed_reset_ref;
      routes.push({
        actor_id: actorId,
        provider_id: override?.provider_id ?? defaults.provider_id,
        model: override?.model ?? defaults.model,
        condition,
        condition_id: assignment.condition_id,
        actor_soul_route: assignment.soul_provenance.actor_soul_route,
        ...(seedOrResetId ? { seed_or_reset_id: seedOrResetId } : {}),
        ...(seedResetRef ? { seed_reset_ref: seedResetRef } : {}),
        soul_family_id: assignment.soul_provenance.soul_family_id,
        soul_instance_id: assignment.soul_provenance.soul_instance_id,
        actor_model_family: assignment.soul_provenance.family_holdout.actor_model_family,
        predictor_model_family: assignment.soul_provenance.family_holdout.predictor_model_family
      });
    }
  }

  return routes;
}

export function buildProviderFreeConditionRoutesFromDeclaration(input: {
  declaration: ExperimentDeclarationV1;
  seedOrResetIdsByCondition?: Partial<Record<LegibilityCondition, string>>;
  seedResetRefsByCondition?: Partial<Record<LegibilityCondition, string>>;
  routeOverridesByCondition?: Partial<Record<LegibilityCondition, ConditionRouteOverride>>;
}) {
  return buildProviderFreeConditionRoutes({
    actorAssignments: input.declaration.conditions,
    seedOrResetIdsByCondition: input.seedOrResetIdsByCondition,
    seedResetRefsByCondition: input.seedResetRefsByCondition,
    routeOverridesByCondition: input.routeOverridesByCondition
  });
}

export function requireConditionRouteForActor(input: {
  actorRoutes: readonly ActorProviderRoute[];
  actorId: string;
}): ActorProviderRoute & { condition: LegibilityCondition } {
  const route = input.actorRoutes.find((candidate) => candidate.actor_id === input.actorId);
  if (!route) {
    throw new Error(`Missing legibility route for actor ${input.actorId}`);
  }
  if (!route.condition) {
    throw new Error(`Legibility route for actor ${input.actorId} has no declared condition`);
  }
  return route as ActorProviderRoute & { condition: LegibilityCondition };
}

export function createExperimentDeclaration(input: {
  experimentId: string;
  actorAssignments: ConditionDeclarationInput[];
  scenarioFamilies: string[];
  seedResetRefs: string[];
  providerFree: boolean;
  preflightRef?: string;
  writtenAt?: string;
  ciLevel?: number;
}): ExperimentDeclarationV1 {
  const conditions = input.actorAssignments.map((assignment, index) =>
    createConditionDeclaration({
      assignment,
      index
    })
  );
  return {
    schema_version: "experiment-declaration/v1",
    experiment_id: input.experimentId,
    written_at: input.writtenAt ?? new Date().toISOString(),
    conditions,
    soul_generation_rules: {
      schema: "soul-generation-rules/v1",
      scripted_responder:
        "scripted_responder uses the fixed scripted-social policy and records no private ActorSoul text.",
      stable_soul:
        "stable_soul keeps the responder ActorSoul instance and soul family stable across repeated declarations.",
      resampled_soul:
        "resampled_soul records a new soul instance and seed/reset id for each declared reset episode.",
      private_soul_text_in_declaration: false
    },
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
    seed_reset_refs: unique([
      ...input.seedResetRefs,
      ...conditions.flatMap((condition) => condition.provenance_refs)
    ])
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
