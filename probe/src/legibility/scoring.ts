import type {
  ExperimentDeclarationV1,
  JoinedLegibilityPrediction,
  LegibilityLayer,
  LegibilityPrediction,
  LegibilityScoreReport,
  LegibilityLabel,
  PublicHistoryArtifact,
  TransitionRowV1
} from "./types.js";
import { assertPublicHistoryChecksPassed } from "./publicHistory.js";

function timestamp(value: string | undefined) {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(time) ? time : undefined;
}

function hasPredictedDelta(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(hasPredictedDelta);
  }
  if (Object.prototype.hasOwnProperty.call(value, "predicted_delta")) {
    return true;
  }
  return Object.values(value as Record<string, unknown>).some(hasPredictedDelta);
}

function actualLabel(row: TransitionRowV1, layer: LegibilityLayer): LegibilityLabel | undefined {
  if (row.row_quality.verdict === "excluded") {
    return undefined;
  }
  if (layer === "social_response") {
    return row.observed_delta.social_response.classes[0];
  }
  return row.observed_delta.material.classes[0];
}

function stratumId(row: TransitionRowV1) {
  return [
    row.metadata.scenario_family_id,
    row.executed_action.action_kind,
    row.row_quality.inclusion_tags.includes("material_stake") ? "material_stake" : "no_material_stake",
    row.state_before.other_actors.visible_actor_ids.length > 0 ? "responder_visible" : "responder_not_visible",
    row.observed_delta.social_response.response_window.close_reason ?? "window_open"
  ].join("|");
}

export function joinPredictionsAfterLabelLock(input: {
  declaration: ExperimentDeclarationV1;
  publicHistory?: PublicHistoryArtifact;
  rows: readonly TransitionRowV1[];
  predictions: readonly LegibilityPrediction[];
}): JoinedLegibilityPrediction[] {
  if (!input.declaration || input.declaration.schema_version !== "experiment-declaration/v1") {
    throw new Error("Scoring requires an experiment-declaration/v1 artifact");
  }
  if (input.publicHistory) {
    assertPublicHistoryChecksPassed(input.publicHistory);
  }
  const declarationTime = timestamp(input.declaration.written_at);
  if (declarationTime === undefined) {
    throw new Error("Experiment declaration written_at must be a valid timestamp");
  }
  const rowsById = new Map(input.rows.map((row) => [row.row_id, row]));
  const joined: JoinedLegibilityPrediction[] = [];
  for (const row of input.rows) {
    if (hasPredictedDelta(row)) {
      throw new Error(`transition-row/v1 must not contain predicted_delta: ${row.row_id}`);
    }
    const actionStartedAt = timestamp(row.timestamps.action_started_at);
    if (actionStartedAt !== undefined && declarationTime > actionStartedAt) {
      throw new Error(`Declaration was written after action start for row ${row.row_id}`);
    }
  }
  for (const prediction of input.predictions) {
    const row = rowsById.get(prediction.row_id);
    if (!row) {
      throw new Error(`Prediction references unknown row_id: ${prediction.row_id}`);
    }
    const labelLockedAt = timestamp(row.timestamps.label_locked_at);
    const predictionCreatedAt = timestamp(prediction.created_at);
    if (labelLockedAt === undefined) {
      throw new Error(`Row labels are not locked before prediction join: ${row.row_id}`);
    }
    if (predictionCreatedAt === undefined || predictionCreatedAt < labelLockedAt) {
      throw new Error(`Prediction ${prediction.prediction_id} was not created after label lock`);
    }
    const label = actualLabel(row, prediction.layer);
    if (!label) {
      continue;
    }
    joined.push({
      ...prediction,
      actual_label: label,
      condition: row.condition,
      seed_or_reset_id: row.seed_or_reset_id,
      stratum_id: stratumId(row)
    });
  }
  return joined;
}

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

function majorityLabel(labels: readonly LegibilityLabel[]) {
  const counts = new Map<LegibilityLabel, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))[0]?.[0];
}

function macroF1(items: readonly { actual: LegibilityLabel; predicted: LegibilityLabel }[]) {
  if (items.length === 0) {
    return 0;
  }
  const labels = unique(items.flatMap((item) => [item.actual, item.predicted]));
  const scores = labels.map((label) => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (const item of items) {
      if (item.actual === label && item.predicted === label) {
        tp += 1;
      } else if (item.actual !== label && item.predicted === label) {
        fp += 1;
      } else if (item.actual === label && item.predicted !== label) {
        fn += 1;
      }
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  });
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function brier(items: readonly JoinedLegibilityPrediction[], labels: readonly LegibilityLabel[]) {
  if (items.length === 0 || labels.length === 0) {
    return 0;
  }
  const sum = items.reduce((outer, item) => {
    const rowScore = labels.reduce((inner, label) => {
      const predicted = item.probabilities[label] ?? 0;
      const actual = item.actual_label === label ? 1 : 0;
      return inner + (predicted - actual) ** 2;
    }, 0) / labels.length;
    return outer + rowScore;
  }, 0);
  return sum / items.length;
}

function baselinePredictions(
  items: readonly JoinedLegibilityPrediction[],
  majority: LegibilityLabel
): JoinedLegibilityPrediction[] {
  return items.map((item) => ({
    ...item,
    predicted_label: majority,
    probabilities: { [majority]: 1 }
  }));
}

function matchedStratumMacroF1(items: readonly JoinedLegibilityPrediction[]) {
  const byStratum = new Map<string, JoinedLegibilityPrediction[]>();
  for (const item of items) {
    byStratum.set(item.stratum_id, [...(byStratum.get(item.stratum_id) ?? []), item]);
  }
  const scores = [...byStratum.values()].map((stratumItems) =>
    macroF1(stratumItems.map((item) => ({ actual: item.actual_label, predicted: item.predicted_label })))
  );
  return scores.length === 0 ? 0 : scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function aucForLabel(items: readonly JoinedLegibilityPrediction[], label: LegibilityLabel) {
  const positives = items.filter((item) => item.actual_label === label);
  const negatives = items.filter((item) => item.actual_label !== label);
  if (positives.length === 0 || negatives.length === 0) {
    return 0.5;
  }
  let wins = 0;
  let ties = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      const positiveScore = positive.probabilities[label] ?? (positive.predicted_label === label ? 1 : 0);
      const negativeScore = negative.probabilities[label] ?? (negative.predicted_label === label ? 1 : 0);
      if (positiveScore > negativeScore) {
        wins += 1;
      } else if (positiveScore === negativeScore) {
        ties += 1;
      }
    }
  }
  return (wins + ties * 0.5) / (positives.length * negatives.length);
}

function aucLift(items: readonly JoinedLegibilityPrediction[]) {
  const labels = unique(items.map((item) => item.actual_label));
  if (labels.length === 0) {
    return 0;
  }
  const auc = labels.reduce((sum, label) => sum + aucForLabel(items, label), 0) / labels.length;
  return auc - 0.5;
}

function groupedBootstrapLift(input: {
  items: readonly JoinedLegibilityPrediction[];
  majority: LegibilityLabel;
  iterations: number;
}) {
  const groups = unique(input.items.map((item) => item.seed_or_reset_id));
  if (groups.length <= 1 || input.items.length === 0) {
    const score = macroF1(input.items.map((item) => ({ actual: item.actual_label, predicted: item.predicted_label })));
    const baseline = macroF1(
      input.items.map((item) => ({ actual: item.actual_label, predicted: input.majority }))
    );
    return { low: score - baseline, high: score - baseline, iterations: 0 };
  }
  let state = 17;
  const random = () => {
    state = (state * 48271) % 0x7fffffff;
    return state / 0x7fffffff;
  };
  const lifts: number[] = [];
  for (let index = 0; index < input.iterations; index++) {
    const sampledGroups = Array.from({ length: groups.length }, () => groups[Math.floor(random() * groups.length)]!);
    const sampled = sampledGroups.flatMap((group) => input.items.filter((item) => item.seed_or_reset_id === group));
    const score = macroF1(sampled.map((item) => ({ actual: item.actual_label, predicted: item.predicted_label })));
    const baseline = macroF1(sampled.map((item) => ({ actual: item.actual_label, predicted: input.majority })));
    lifts.push(score - baseline);
  }
  lifts.sort((left, right) => left - right);
  return {
    low: lifts[Math.floor(lifts.length * 0.025)] ?? 0,
    high: lifts[Math.floor(lifts.length * 0.975)] ?? 0,
    iterations: input.iterations
  };
}

export function scoreLegibilityPredictions(input: {
  declaration: ExperimentDeclarationV1;
  declarationRef: string;
  publicHistory?: PublicHistoryArtifact;
  rows: readonly TransitionRowV1[];
  predictions: readonly LegibilityPrediction[];
  scoredAt?: string;
}): LegibilityScoreReport {
  const joined = joinPredictionsAfterLabelLock(input);
  const conditions = unique(input.rows.map((row) => row.condition));
  const layers: LegibilityLayer[] = ["social_response", "material_access"];
  const metrics: LegibilityScoreReport["metrics"] = [];
  const notes: string[] = [];

  for (const condition of conditions) {
    for (const layer of layers) {
      const conditionLayerItems = joined.filter((item) =>
        item.condition === condition && item.layer === layer
      );
      const majority = majorityLabel(conditionLayerItems.map((item) => item.actual_label));
      if (!majority) {
        notes.push(`No scorable rows for ${condition}/${layer}`);
        continue;
      }
      for (const arm of input.declaration.predictor_arms) {
        const items = conditionLayerItems.filter((item) => item.predictor_arm === arm);
        if (items.length === 0) {
          metrics.push({
            condition,
            layer,
            predictor_arm: arm,
            baseline_arm: "majority_or_no_response",
            support: 0,
            macro_f1: 0,
            majority_macro_f1: 0,
            lift: 0,
            brier: 0,
            majority_brier: 0,
            rer_brier: 0,
            matched_stratum_macro_f1: 0,
            auc_lift_over_0_5: 0,
            bootstrap_ci: { low: 0, high: 0, iterations: 0 }
          });
          continue;
        }
        const labels = unique(items.flatMap((item) => [
          item.actual_label,
          item.predicted_label,
          ...Object.keys(item.probabilities) as LegibilityLabel[]
        ]));
        const predictedPairs = items.map((item) => ({
          actual: item.actual_label,
          predicted: item.predicted_label
        }));
        const majorityItems = baselinePredictions(items, majority);
        const score = macroF1(predictedPairs);
        const baselineScore = macroF1(
          items.map((item) => ({ actual: item.actual_label, predicted: majority }))
        );
        const brierScore = brier(items, labels);
        const majorityBrier = brier(majorityItems, labels);
        metrics.push({
          condition,
          layer,
          predictor_arm: arm,
          baseline_arm: "majority_or_no_response",
          support: items.length,
          macro_f1: score,
          majority_macro_f1: baselineScore,
          lift: score - baselineScore,
          brier: brierScore,
          majority_brier: majorityBrier,
          rer_brier: (majorityBrier - brierScore) / Math.max(majorityBrier, 1e-9),
          matched_stratum_macro_f1: matchedStratumMacroF1(items),
          auc_lift_over_0_5: aucLift(items),
          bootstrap_ci: groupedBootstrapLift({
            items,
            majority,
            iterations: 200
          })
        });
      }
    }
  }

  return {
    schema: "legibility-score-report/v1",
    experiment_id: input.declaration.experiment_id,
    scored_at: input.scoredAt ?? new Date().toISOString(),
    declaration_ref: input.declarationRef,
    row_count: input.rows.length,
    joined_prediction_count: joined.length,
    metrics,
    notes
  };
}
