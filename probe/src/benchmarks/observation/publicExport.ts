/**
 * Public analysis export for long-run observation bundles.
 *
 * Rejects private actor-state fields. Visual/video counts are review metadata
 * only; Minecraft truth remains in structured_artifact_refs and metric evidence.
 */

import {
  assertLongRunObservationBundle,
  findPrivateFieldPaths,
  validateLongRunObservationBundle
} from "./loader.js";
import {
  OBSERVATION_JOIN_KEYS,
  OBSERVATION_METRIC_SERIES,
  PUBLIC_ANALYSIS_EXPORT_SCHEMA,
  type LongRunObservationBundleV1,
  type ObservationMetricSeriesV1,
  type PublicAnalysisExportV1
} from "./types.js";

export type PublicAnalysisExportResult =
  | { ok: true; export: PublicAnalysisExportV1 }
  | { ok: false; errors: string[] };

function metricPointCounts(
  bundle: LongRunObservationBundleV1
): Record<ObservationMetricSeriesV1, number> {
  const counts = {} as Record<ObservationMetricSeriesV1, number>;
  for (const series of OBSERVATION_METRIC_SERIES) {
    counts[series] = bundle.metrics[series].length;
  }
  return counts;
}

function seriesPresent(bundle: LongRunObservationBundleV1): ObservationMetricSeriesV1[] {
  return OBSERVATION_METRIC_SERIES.filter((series) => bundle.metrics[series].length > 0);
}

/**
 * Build a public-safe analysis export from a validated bundle.
 * Fails when private actor-state keys are present anywhere in the tree.
 */
export function buildPublicAnalysisExport(
  bundleInput: unknown
): PublicAnalysisExportResult {
  const validation = validateLongRunObservationBundle(bundleInput);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const privateHits = findPrivateFieldPaths(bundleInput);
  if (privateHits.length > 0) {
    return {
      ok: false,
      errors: [
        `public analysis export rejected private actor-state fields: ${privateHits.join(", ")}`
      ]
    };
  }

  const bundle = validation.bundle;
  const declaration = bundle.run_declaration;

  const pub: PublicAnalysisExportV1 = {
    schema: PUBLIC_ANALYSIS_EXPORT_SCHEMA,
    run_id: declaration.run_id,
    scenario_id: declaration.scenario_id,
    scenario_version: declaration.scenario_version,
    actor_ids: declaration.actors.map((actor) => actor.actor_id),
    started_at: declaration.started_at,
    ...(declaration.ended_at !== undefined ? { ended_at: declaration.ended_at } : {}),
    ...(declaration.duration_ms !== undefined ? { duration_ms: declaration.duration_ms } : {}),
    join_keys: OBSERVATION_JOIN_KEYS,
    metric_series_present: seriesPresent(bundle),
    metric_point_counts: metricPointCounts(bundle),
    structured_artifact_refs: [...bundle.structured_artifact_refs],
    visual_ref_count: bundle.visual_refs.length,
    video_segment_ref_count: bundle.video_segment_refs.length,
    dropped_capture_count: bundle.dropped_captures.length,
    missing_evidence_count: bundle.missing_evidence.length,
    pixels_are_review_only: true,
    metrics_are_descriptive_only: true,
    is_fixture: declaration.is_fixture,
    private_fields_omitted: true
  };

  return { ok: true, export: pub };
}

export function assertPublicAnalysisExport(bundleInput: unknown): PublicAnalysisExportV1 {
  const result = buildPublicAnalysisExport(bundleInput);
  if (!result.ok) {
    throw new Error(`Public analysis export rejected: ${result.errors.join("; ")}`);
  }
  return result.export;
}

/** Convenience: assert bundle then export. */
export function exportPublicAnalysisFromBundle(
  bundle: LongRunObservationBundleV1
): PublicAnalysisExportV1 {
  return assertPublicAnalysisExport(assertLongRunObservationBundle(bundle));
}
