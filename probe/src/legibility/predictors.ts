import { assertPublicHistoryChecksPassed } from "./publicHistory.js";
import type {
  ExperimentDeclarationV1,
  LegibilityCondition,
  LegibilityLabel,
  LegibilityLayer,
  LegibilityMaterialAccessLabel,
  LegibilityPrediction,
  LegibilitySocialResponseLabel,
  PublicHistoryArtifact,
  PublicHistoryEvent,
  TransitionRowV1
} from "./types.js";

export const publicHistoryPredictorArms = [
  "majority_or_no_response",
  "last_response_carried_forward",
  "policy_copy",
  "actor_id_only",
  "first_m_public_responses",
  "action_family_by_responder",
  "public_profile_only",
  "history_grounded"
] as const;

export type PublicHistoryPredictorArm = typeof publicHistoryPredictorArms[number];

const socialResponseLabels = [
  "no_observable_response",
  "reply_accept_or_acknowledge",
  "reply_refuse_or_disagree",
  "approach_or_follow",
  "retreat_or_avoid",
  "reciprocate_or_help",
  "contest_or_interrupt",
  "repair_or_compensate",
  "acts_on_changed_affordance",
  "unknown_social_response"
] as const satisfies readonly LegibilitySocialResponseLabel[];

const materialAccessLabels = [
  "no_material_delta",
  "inventory_gain",
  "inventory_loss",
  "container_gain",
  "container_loss",
  "possession_or_access_granted",
  "possession_or_access_refused",
  "public_affordance_created",
  "public_affordance_used",
  "claim_or_obligation_event_recorded",
  "unknown_material_delta"
] as const satisfies readonly LegibilityMaterialAccessLabel[];

type PublicLabelObservation = {
  row_id: string;
  layer: LegibilityLayer;
  label: LegibilityLabel;
  slot_index: number;
  event_order: number;
  focal_actor_id: string;
  responder_actor_ids: string[];
  primary_responder_id: string;
  action_kind: string;
  action_family: string;
  scenario_family_id: string;
  inclusion_tags: string[];
  public_profile_id?: string;
  condition: LegibilityCondition;
};

function labelSpace(layer: LegibilityLayer): readonly LegibilityLabel[] {
  return layer === "social_response" ? socialResponseLabels : materialAccessLabels;
}

function defaultLabel(layer: LegibilityLayer): LegibilityLabel {
  return layer === "social_response" ? "no_observable_response" : "no_material_delta";
}

function isLayer(value: unknown): value is LegibilityLayer {
  return value === "social_response" || value === "material_access";
}

function isLabelForLayer(value: unknown, layer: LegibilityLayer): value is LegibilityLabel {
  return typeof value === "string" && labelSpace(layer).includes(value as LegibilityLabel);
}

function payloadString(event: PublicHistoryEvent, key: string) {
  const value = event.public_payload[key];
  return typeof value === "string" ? value : undefined;
}

function payloadStringArray(event: PublicHistoryEvent, key: string) {
  const value = event.public_payload[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

function actionFamily(actionKind: string) {
  return actionKind.split(/[:/._-]/, 1)[0] || actionKind || "unknown_action";
}

function conditionForObservation(
  declaration: ExperimentDeclarationV1,
  observation: Omit<PublicLabelObservation, "condition">
): LegibilityCondition {
  for (const assignment of declaration.conditions) {
    if (observation.responder_actor_ids.some((actorId) => assignment.actor_ids.includes(actorId))) {
      return assignment.condition;
    }
  }
  for (const assignment of declaration.conditions) {
    if (assignment.actor_ids.includes(observation.focal_actor_id)) {
      return assignment.condition;
    }
  }
  return declaration.conditions[0]?.condition ?? "scripted_responder";
}

function observationFromResponseWindow(
  declaration: ExperimentDeclarationV1,
  event: PublicHistoryEvent,
  eventOrder: number
): PublicLabelObservation | undefined {
  if (event.event_kind !== "response_window_closed") {
    return undefined;
  }
  const rowId = payloadString(event, "row_id");
  const label = payloadString(event, "social_response_label");
  if (!rowId || !isLabelForLayer(label, "social_response")) {
    return undefined;
  }
  const responderActorIds = payloadStringArray(event, "required_responder_actor_ids");
  const base = {
    row_id: rowId,
    layer: "social_response" as const,
    label,
    slot_index: event.slot_index,
    event_order: eventOrder,
    focal_actor_id: payloadString(event, "focal_actor_id") ?? event.actor_id,
    responder_actor_ids: responderActorIds,
    primary_responder_id: responderActorIds[0] ?? event.actor_id,
    action_kind: payloadString(event, "action_kind") ?? "unknown_action",
    action_family: actionFamily(payloadString(event, "action_kind") ?? "unknown_action"),
    scenario_family_id: payloadString(event, "scenario_family_id") ?? "unknown_scenario",
    inclusion_tags: payloadStringArray(event, "inclusion_tags"),
    public_profile_id: payloadString(event, "public_profile_id")
  };
  return {
    ...base,
    condition: conditionForObservation(declaration, base)
  };
}

function observationFromLabelEvent(
  declaration: ExperimentDeclarationV1,
  event: PublicHistoryEvent,
  eventOrder: number
): PublicLabelObservation | undefined {
  const rowId = payloadString(event, "row_id");
  const layer = payloadString(event, "layer");
  if (!rowId || !isLayer(layer)) {
    return undefined;
  }
  const label = payloadString(event, "label");
  if (!isLabelForLayer(label, layer)) {
    return undefined;
  }
  const responderActorIds = payloadStringArray(event, "responder_actor_ids");
  const actionKind = payloadString(event, "action_kind") ?? "unknown_action";
  const base = {
    row_id: rowId,
    layer,
    label,
    slot_index: event.slot_index,
    event_order: eventOrder,
    focal_actor_id: payloadString(event, "focal_actor_id") ?? event.actor_id,
    responder_actor_ids: responderActorIds,
    primary_responder_id: responderActorIds[0] ?? event.actor_id,
    action_kind: actionKind,
    action_family: actionFamily(actionKind),
    scenario_family_id: payloadString(event, "scenario_family_id") ?? "unknown_scenario",
    inclusion_tags: payloadStringArray(event, "inclusion_tags"),
    public_profile_id: payloadString(event, "public_profile_id")
  };
  return {
    ...base,
    condition: conditionForObservation(declaration, base)
  };
}

export function publicLabelObservations(input: {
  publicHistory: PublicHistoryArtifact;
  declaration: ExperimentDeclarationV1;
}): PublicLabelObservation[] {
  assertPublicHistoryChecksPassed(input.publicHistory);
  return input.publicHistory.events.flatMap((event, index) => {
    const observation =
      observationFromResponseWindow(input.declaration, event, index) ??
      observationFromLabelEvent(input.declaration, event, index);
    return observation ? [observation] : [];
  });
}

function historyBeforeTarget(
  observations: readonly PublicLabelObservation[],
  target: PublicLabelObservation
) {
  return observations.filter((observation) =>
    observation.row_id !== target.row_id &&
    observation.layer === target.layer &&
    observation.event_order < target.event_order
  );
}

function countLabels(observations: readonly PublicLabelObservation[]) {
  const counts = new Map<LegibilityLabel, number>();
  for (const observation of observations) {
    counts.set(observation.label, (counts.get(observation.label) ?? 0) + 1);
  }
  return counts;
}

function chooseLabel(input: {
  layer: LegibilityLayer;
  counts: ReadonlyMap<LegibilityLabel, number>;
  fallback: LegibilityLabel;
}) {
  const labels = labelSpace(input.layer);
  return [...labels].sort((left, right) =>
    (input.counts.get(right) ?? 0) - (input.counts.get(left) ?? 0) ||
    labels.indexOf(left) - labels.indexOf(right)
  )[0] ?? input.fallback;
}

function majorityFrom(
  layer: LegibilityLayer,
  observations: readonly PublicLabelObservation[],
  fallback = defaultLabel(layer)
) {
  if (observations.length === 0) {
    return fallback;
  }
  return chooseLabel({ layer, counts: countLabels(observations), fallback });
}

function oneHot(label: LegibilityLabel) {
  return { [label]: 1 };
}

function probabilitiesFromCounts(input: {
  layer: LegibilityLayer;
  counts: ReadonlyMap<LegibilityLabel, number>;
  smoothing?: number;
}) {
  const labels = labelSpace(input.layer);
  const smoothing = input.smoothing ?? 0;
  const denominator = labels.reduce((sum, label) => sum + (input.counts.get(label) ?? 0) + smoothing, 0);
  if (denominator <= 0) {
    return oneHot(defaultLabel(input.layer));
  }
  return Object.fromEntries(
    labels.map((label) => [label, ((input.counts.get(label) ?? 0) + smoothing) / denominator])
  );
}

function conditionMajority(
  target: PublicLabelObservation,
  history: readonly PublicLabelObservation[]
) {
  return majorityFrom(
    target.layer,
    history.filter((observation) => observation.condition === target.condition),
    defaultLabel(target.layer)
  );
}

function predictLabel(input: {
  arm: PublicHistoryPredictorArm;
  target: PublicLabelObservation;
  history: readonly PublicLabelObservation[];
  firstM: number;
  policyCopyMinCount: number;
}): { label: LegibilityLabel; probabilities: Record<string, number> } {
  const fallback = conditionMajority(input.target, input.history);
  if (input.arm === "majority_or_no_response") {
    return { label: fallback, probabilities: oneHot(fallback) };
  }
  if (input.arm === "last_response_carried_forward") {
    const last = [...input.history]
      .filter((observation) => observation.primary_responder_id === input.target.primary_responder_id)
      .sort((left, right) => right.event_order - left.event_order)[0]?.label ?? fallback;
    return { label: last, probabilities: oneHot(last) };
  }
  if (input.arm === "actor_id_only") {
    const label = majorityFrom(
      input.target.layer,
      input.history.filter((observation) => observation.primary_responder_id === input.target.primary_responder_id),
      fallback
    );
    return { label, probabilities: oneHot(label) };
  }
  if (input.arm === "first_m_public_responses") {
    const firstResponses = input.history
      .filter((observation) => observation.primary_responder_id === input.target.primary_responder_id)
      .sort((left, right) => left.event_order - right.event_order)
      .slice(0, input.firstM);
    const label = majorityFrom(input.target.layer, firstResponses, fallback);
    return { label, probabilities: oneHot(label) };
  }
  if (input.arm === "action_family_by_responder") {
    const label = majorityFrom(
      input.target.layer,
      input.history.filter((observation) =>
        observation.primary_responder_id === input.target.primary_responder_id &&
        observation.action_family === input.target.action_family
      ),
      fallback
    );
    return { label, probabilities: oneHot(label) };
  }
  if (input.arm === "public_profile_only") {
    const profileHistory = input.target.public_profile_id
      ? input.history.filter((observation) => observation.public_profile_id === input.target.public_profile_id)
      : [];
    const label = majorityFrom(input.target.layer, profileHistory, fallback);
    return { label, probabilities: oneHot(label) };
  }
  if (input.arm === "policy_copy") {
    const responderStratum = input.history.filter((observation) =>
      observation.primary_responder_id === input.target.primary_responder_id &&
      observation.action_family === input.target.action_family &&
      observation.scenario_family_id === input.target.scenario_family_id
    );
    if (responderStratum.length >= input.policyCopyMinCount) {
      const counts = countLabels(responderStratum);
      const label = chooseLabel({ layer: input.target.layer, counts, fallback });
      return {
        label,
        probabilities: probabilitiesFromCounts({ layer: input.target.layer, counts, smoothing: 1 })
      };
    }
    const stratum = input.history.filter((observation) =>
      observation.action_family === input.target.action_family &&
      observation.scenario_family_id === input.target.scenario_family_id
    );
    const label = majorityFrom(input.target.layer, stratum, fallback);
    return { label, probabilities: oneHot(label) };
  }

  const weighted = new Map<LegibilityLabel, number>();
  const add = (observations: readonly PublicLabelObservation[], weight: number) => {
    for (const observation of observations) {
      weighted.set(observation.label, (weighted.get(observation.label) ?? 0) + weight);
    }
  };
  add(input.history.filter((observation) =>
    observation.primary_responder_id === input.target.primary_responder_id &&
    observation.action_family === input.target.action_family
  ), 3);
  add(input.history.filter((observation) =>
    observation.primary_responder_id === input.target.primary_responder_id
  ), 2);
  add(input.history.filter((observation) =>
    observation.action_family === input.target.action_family
  ), 1);
  add(input.history.filter((observation) =>
    observation.condition === input.target.condition
  ), 0.5);
  const label = chooseLabel({ layer: input.target.layer, counts: weighted, fallback });
  return {
    label,
    probabilities: probabilitiesFromCounts({ layer: input.target.layer, counts: weighted, smoothing: 0.1 })
  };
}

function declaredPublicHistoryArms(
  declaration: ExperimentDeclarationV1,
  arms?: readonly PublicHistoryPredictorArm[]
) {
  const requested = arms ?? publicHistoryPredictorArms;
  return requested.filter((arm) => declaration.predictor_arms.includes(arm));
}

export function createPublicHistoryPredictions(input: {
  publicHistory: PublicHistoryArtifact;
  declaration: ExperimentDeclarationV1;
  createdAt: string;
  arms?: readonly PublicHistoryPredictorArm[];
  firstM?: number;
  policyCopyMinCount?: number;
}): LegibilityPrediction[] {
  const observations = publicLabelObservations({
    publicHistory: input.publicHistory,
    declaration: input.declaration
  });
  const arms = declaredPublicHistoryArms(input.declaration, input.arms);
  return observations.flatMap((target) => {
    const history = historyBeforeTarget(observations, target);
    return arms.map((arm) => {
      const predicted = predictLabel({
        arm,
        target,
        history,
        firstM: input.firstM ?? 3,
        policyCopyMinCount: input.policyCopyMinCount ?? 2
      });
      return {
        schema_version: "legibility-prediction/v1",
        prediction_id: `${target.row_id}-${target.layer}-${arm}`,
        row_id: target.row_id,
        predictor_arm: arm,
        layer: target.layer,
        predicted_label: predicted.label,
        probabilities: predicted.probabilities,
        created_at: input.createdAt
      };
    });
  });
}

function rowLabel(row: TransitionRowV1, layer: LegibilityLayer) {
  return layer === "social_response"
    ? row.observed_delta.social_response.classes[0]
    : row.observed_delta.material.classes[0];
}

// Fixture-only compatibility for the Session 1 smoke until live-shaped
// public-history targets are accepted for C2-6.
export function createFixtureOraclePredictions(input: {
  rows: readonly TransitionRowV1[];
  createdAt: string;
  arms?: readonly string[];
}): LegibilityPrediction[] {
  const arms = input.arms ?? ["history_grounded"];
  const layers: LegibilityLayer[] = ["social_response", "material_access"];
  return input.rows.flatMap((row) =>
    layers.flatMap((layer) =>
      arms.flatMap((arm) => {
        const label = rowLabel(row, layer);
        return label
          ? [{
              schema_version: "legibility-prediction/v1" as const,
              prediction_id: `${row.row_id}-${layer}-${arm}`,
              row_id: row.row_id,
              predictor_arm: arm,
              layer,
              predicted_label: label,
              probabilities: oneHot(label),
              created_at: input.createdAt
            }]
          : [];
      })
    )
  );
}
