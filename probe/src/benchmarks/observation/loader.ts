/**
 * Strict validation and loaders for long-run observation bundles and indexes.
 */

import { readFileSync } from "node:fs";

import { isRootSafeRelativeRef } from "../capability/artifactRefs.js";
import {
  LONG_RUN_OBSERVATION_BUNDLE_SCHEMA,
  MULTI_ACTOR_REPORT_INDEX_SCHEMA,
  OBSERVATION_CAPTURE_KINDS,
  OBSERVATION_JOIN_KEYS,
  OBSERVATION_METRIC_SERIES,
  OBSERVATION_PRIVATE_FIELD_KEYS,
  OBSERVATION_VISUAL_KINDS,
  type LongRunObservationBundleV1,
  type MultiActorReportIndexV1,
  type ObservationJoinKeyV1,
  type ObservationMetricPointV1,
  type ObservationMetricSeriesV1,
  type ObservationMetricsBagV1
} from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

export type ObservationBundleValidationResult =
  | { ok: true; bundle: LongRunObservationBundleV1 }
  | ValidationFailure;

export type ObservationIndexValidationResult =
  | { ok: true; index: MultiActorReportIndexV1 }
  | ValidationFailure;

const bundleKeys = [
  "schema",
  "run_declaration",
  "metrics",
  "visual_refs",
  "video_segment_refs",
  "dropped_captures",
  "missing_evidence",
  "structured_artifact_refs",
  "pixels_are_review_only",
  "metrics_are_descriptive_only"
] as const;

const runDeclarationKeys = [
  "run_id",
  "scenario_id",
  "scenario_version",
  "scenario_ref",
  "started_at",
  "ended_at",
  "duration_ms",
  "seed",
  "actors",
  "environment_provenance",
  "provider_usage_ref",
  "is_fixture"
] as const;

const actorDependencyKeys = [
  "actor_id",
  "provider_id",
  "model",
  "capability_refs",
  "continuity_refs"
] as const;

const environmentProvenanceKeys = [
  "server_ref",
  "seed_ref",
  "reset_refs",
  "reconnect_refs",
  "world_scenario_id",
  "notes"
] as const;

const metricPointKeys = [
  ...OBSERVATION_JOIN_KEYS,
  "series",
  "metric_key",
  "value",
  "unit",
  "evidence_refs",
  "notes"
] as const;

const visualRefKeys = [
  ...OBSERVATION_JOIN_KEYS,
  "kind",
  "artifact_ref",
  "review_only",
  "paired_structured_evidence_refs"
] as const;

const videoSegmentKeys = [
  ...OBSERVATION_JOIN_KEYS,
  "artifact_ref",
  "review_only",
  "start_ms",
  "end_ms",
  "paired_structured_evidence_refs"
] as const;

const droppedCaptureKeys = [
  ...OBSERVATION_JOIN_KEYS,
  "capture_kind",
  "reason",
  "does_not_change_minecraft_truth"
] as const;

const missingEvidenceKeys = [
  ...OBSERVATION_JOIN_KEYS,
  "evidence_kind",
  "reason",
  "related_claim"
] as const;

const indexKeys = ["schema", "index_id", "generated_at", "runs"] as const;

const indexEntryKeys = [
  "run_id",
  "scenario_id",
  "scenario_version",
  "bundle_ref",
  "actor_ids",
  "started_at",
  "ended_at",
  "duration_ms",
  "dropped_capture_count",
  "missing_evidence_count",
  "has_visual_refs",
  "has_video_refs",
  "is_fixture"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function includesString<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: string[]
) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      errors.push(`${path}.${key} is not an allowed key`);
    }
  }
}

function assertString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!nonEmptyString(record[key])) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function assertLiteralTrue(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  if (record[key] !== true) {
    errors.push(`${path}.${key} must be true`);
  }
}

function assertBoolean(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (typeof record[key] !== "boolean") {
    errors.push(`${path}.${key} must be a boolean`);
  }
}

function assertPathSafeRef(
  value: unknown,
  path: string,
  errors: string[]
): void {
  if (!nonEmptyString(value)) {
    errors.push(`${path} must be a non-empty path-safe relative ref`);
    return;
  }
  if (!isRootSafeRelativeRef(value)) {
    errors.push(`${path} must be a root-safe relative ref (no absolute paths or '..' escapes)`);
  }
}

function assertStringArray(value: unknown, path: string, errors: string[]): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    errors.push(`${path} must be a string array`);
    return [];
  }
  for (const [index, entry] of value.entries()) {
    if (!nonEmptyString(entry)) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  }
  return value as string[];
}

function assertPathSafeRefArray(value: unknown, path: string, errors: string[]): void {
  const refs = assertStringArray(value, path, errors);
  for (const [index, ref] of refs.entries()) {
    if (nonEmptyString(ref) && !isRootSafeRelativeRef(ref)) {
      errors.push(
        `${path}[${index}] must be a root-safe relative ref (no absolute paths or '..' escapes)`
      );
    }
  }
}

/**
 * Validate the four fixed join keys. Exported for tests and writers.
 */
export function validateObservationJoinKey(
  value: unknown,
  path: string,
  errors: string[],
  knownActorIds?: ReadonlySet<string>,
  knownRunId?: string
): ObservationJoinKeyV1 | null {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return null;
  }

  for (const key of OBSERVATION_JOIN_KEYS) {
    if (!nonEmptyString(value[key])) {
      errors.push(`${path}.${key} must be a non-empty string (fixed join key)`);
    }
  }

  if (knownRunId && nonEmptyString(value.run_id) && value.run_id !== knownRunId) {
    errors.push(`${path}.run_id '${value.run_id}' must match run_declaration.run_id '${knownRunId}'`);
  }

  if (knownActorIds && nonEmptyString(value.actor_id) && !knownActorIds.has(value.actor_id)) {
    errors.push(`${path}.actor_id '${value.actor_id}' is not a declared actor_id`);
  }

  if (
    nonEmptyString(value.run_id) &&
    nonEmptyString(value.cycle_id) &&
    nonEmptyString(value.actor_id) &&
    nonEmptyString(value.timestamp)
  ) {
    return {
      run_id: value.run_id,
      cycle_id: value.cycle_id,
      actor_id: value.actor_id,
      timestamp: value.timestamp
    };
  }
  return null;
}

function emptyMetricsBag(): ObservationMetricsBagV1 {
  const bag = {} as ObservationMetricsBagV1;
  for (const series of OBSERVATION_METRIC_SERIES) {
    bag[series] = [];
  }
  return bag;
}

function validateMetricPoint(
  value: unknown,
  path: string,
  expectedSeries: ObservationMetricSeriesV1,
  knownActorIds: ReadonlySet<string>,
  knownRunId: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, metricPointKeys, path, errors);
  validateObservationJoinKey(value, path, errors, knownActorIds, knownRunId);
  assertString(value, "metric_key", path, errors);
  assertPathSafeRefArray(value.evidence_refs, `${path}.evidence_refs`, errors);

  if (value.series !== expectedSeries) {
    errors.push(`${path}.series must be '${expectedSeries}'`);
  }
  if (!isFiniteNumberOrNull(value.value)) {
    errors.push(`${path}.value must be a finite number or null (placeholder)`);
  }
  if (value.unit !== undefined) {
    assertString(value, "unit", path, errors);
  }
  if (value.notes !== undefined) {
    assertString(value, "notes", path, errors);
  }
}

function validateMetrics(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  knownRunId: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const key of Object.keys(value)) {
    if (!includesString(OBSERVATION_METRIC_SERIES, key)) {
      errors.push(`${path}.${key} is not an allowed metric series`);
    }
  }

  for (const series of OBSERVATION_METRIC_SERIES) {
    if (!(series in value)) {
      errors.push(`${path}.${series} must be present (use [] as placeholder)`);
      continue;
    }
    const points = value[series];
    if (!Array.isArray(points)) {
      errors.push(`${path}.${series} must be an array`);
      continue;
    }
    for (const [index, point] of points.entries()) {
      validateMetricPoint(
        point,
        `${path}.${series}[${index}]`,
        series,
        knownActorIds,
        knownRunId,
        errors
      );
    }
  }
}

function validateVisualRefs(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  knownRunId: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, visualRefKeys, entryPath, errors);
    validateObservationJoinKey(entry, entryPath, errors, knownActorIds, knownRunId);
    if (!includesString(OBSERVATION_VISUAL_KINDS, entry.kind)) {
      errors.push(`${entryPath}.kind must be one of: ${OBSERVATION_VISUAL_KINDS.join(", ")}`);
    }
    assertPathSafeRef(entry.artifact_ref, `${entryPath}.artifact_ref`, errors);
    assertLiteralTrue(entry, "review_only", entryPath, errors);
    assertPathSafeRefArray(
      entry.paired_structured_evidence_refs,
      `${entryPath}.paired_structured_evidence_refs`,
      errors
    );
  }
}

function validateVideoSegmentRefs(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  knownRunId: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, videoSegmentKeys, entryPath, errors);
    validateObservationJoinKey(entry, entryPath, errors, knownActorIds, knownRunId);
    assertPathSafeRef(entry.artifact_ref, `${entryPath}.artifact_ref`, errors);
    assertLiteralTrue(entry, "review_only", entryPath, errors);
    assertPathSafeRefArray(
      entry.paired_structured_evidence_refs,
      `${entryPath}.paired_structured_evidence_refs`,
      errors
    );
    if (entry.start_ms !== undefined && !isNonNegativeInteger(entry.start_ms)) {
      errors.push(`${entryPath}.start_ms must be a non-negative integer when present`);
    }
    if (entry.end_ms !== undefined && !isNonNegativeInteger(entry.end_ms)) {
      errors.push(`${entryPath}.end_ms must be a non-negative integer when present`);
    }
    if (
      isNonNegativeInteger(entry.start_ms) &&
      isNonNegativeInteger(entry.end_ms) &&
      entry.end_ms < entry.start_ms
    ) {
      errors.push(`${entryPath}.end_ms must be >= start_ms`);
    }
  }
}

function validateDroppedCaptures(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  knownRunId: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, droppedCaptureKeys, entryPath, errors);
    validateObservationJoinKey(entry, entryPath, errors, knownActorIds, knownRunId);
    if (!includesString(OBSERVATION_CAPTURE_KINDS, entry.capture_kind)) {
      errors.push(
        `${entryPath}.capture_kind must be one of: ${OBSERVATION_CAPTURE_KINDS.join(", ")}`
      );
    }
    assertString(entry, "reason", entryPath, errors);
    assertLiteralTrue(entry, "does_not_change_minecraft_truth", entryPath, errors);
  }
}

function validateMissingEvidence(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  knownRunId: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, missingEvidenceKeys, entryPath, errors);
    validateObservationJoinKey(entry, entryPath, errors, knownActorIds, knownRunId);
    assertString(entry, "evidence_kind", entryPath, errors);
    assertString(entry, "reason", entryPath, errors);
    if (entry.related_claim !== undefined) {
      assertString(entry, "related_claim", entryPath, errors);
    }
  }
}

function validateActors(
  value: unknown,
  path: string,
  errors: string[]
): Set<string> {
  const actorIds = new Set<string>();
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return actorIds;
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, actorDependencyKeys, entryPath, errors);
    assertString(entry, "actor_id", entryPath, errors);
    assertString(entry, "provider_id", entryPath, errors);
    assertString(entry, "model", entryPath, errors);
    assertPathSafeRefArray(entry.capability_refs, `${entryPath}.capability_refs`, errors);
    assertPathSafeRefArray(entry.continuity_refs, `${entryPath}.continuity_refs`, errors);
    if (nonEmptyString(entry.actor_id)) {
      if (actorIds.has(entry.actor_id)) {
        errors.push(`${entryPath}.actor_id duplicate '${entry.actor_id}'`);
      }
      actorIds.add(entry.actor_id);
    }
  }
  return actorIds;
}

function validateEnvironmentProvenance(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, environmentProvenanceKeys, path, errors);
  assertPathSafeRefArray(value.reset_refs, `${path}.reset_refs`, errors);
  assertPathSafeRefArray(value.reconnect_refs, `${path}.reconnect_refs`, errors);
  if (value.server_ref !== undefined) {
    assertPathSafeRef(value.server_ref, `${path}.server_ref`, errors);
  }
  if (value.seed_ref !== undefined) {
    assertPathSafeRef(value.seed_ref, `${path}.seed_ref`, errors);
  }
  if (value.world_scenario_id !== undefined) {
    assertString(value, "world_scenario_id", path, errors);
  }
  if (value.notes !== undefined) {
    assertString(value, "notes", path, errors);
  }
}

function validateRunDeclaration(
  value: unknown,
  path: string,
  errors: string[]
): { runId: string | null; actorIds: Set<string> } {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return { runId: null, actorIds: new Set() };
  }
  rejectUnknownKeys(value, runDeclarationKeys, path, errors);
  assertString(value, "run_id", path, errors);
  assertString(value, "scenario_id", path, errors);
  assertString(value, "scenario_version", path, errors);
  assertPathSafeRef(value.scenario_ref, `${path}.scenario_ref`, errors);
  assertString(value, "started_at", path, errors);
  assertBoolean(value, "is_fixture", path, errors);

  if (value.ended_at !== undefined) {
    assertString(value, "ended_at", path, errors);
  }
  if (value.duration_ms !== undefined && !isNonNegativeInteger(value.duration_ms)) {
    errors.push(`${path}.duration_ms must be a non-negative integer when present`);
  }
  if (value.seed !== undefined) {
    assertString(value, "seed", path, errors);
  }
  if (value.provider_usage_ref !== undefined) {
    assertPathSafeRef(value.provider_usage_ref, `${path}.provider_usage_ref`, errors);
  }

  const actorIds = validateActors(value.actors, `${path}.actors`, errors);
  validateEnvironmentProvenance(
    value.environment_provenance,
    `${path}.environment_provenance`,
    errors
  );

  return {
    runId: nonEmptyString(value.run_id) ? value.run_id : null,
    actorIds
  };
}

/**
 * Recursively collect private field keys present in a value tree.
 * Used by public-export rejection tests and export builders.
 */
export function findPrivateFieldPaths(
  value: unknown,
  path = "$"
): string[] {
  const hits: string[] = [];
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      hits.push(...findPrivateFieldPaths(entry, `${path}[${index}]`));
    }
    return hits;
  }
  if (!isRecord(value)) {
    return hits;
  }
  for (const [key, child] of Object.entries(value)) {
    if (includesString(OBSERVATION_PRIVATE_FIELD_KEYS, key)) {
      hits.push(`${path}.${key}`);
    }
    hits.push(...findPrivateFieldPaths(child, `${path}.${key}`));
  }
  return hits;
}

export function validateLongRunObservationBundle(
  value: unknown
): ObservationBundleValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["LongRunObservationBundle must be an object"] };
  }

  rejectUnknownKeys(value, bundleKeys, "LongRunObservationBundle", errors);

  if (value.schema !== LONG_RUN_OBSERVATION_BUNDLE_SCHEMA) {
    errors.push(`schema must be '${LONG_RUN_OBSERVATION_BUNDLE_SCHEMA}'`);
  }

  assertLiteralTrue(value, "pixels_are_review_only", "LongRunObservationBundle", errors);
  assertLiteralTrue(value, "metrics_are_descriptive_only", "LongRunObservationBundle", errors);

  const { runId, actorIds } = validateRunDeclaration(
    value.run_declaration,
    "LongRunObservationBundle.run_declaration",
    errors
  );

  if (runId) {
    validateMetrics(
      value.metrics,
      "LongRunObservationBundle.metrics",
      actorIds,
      runId,
      errors
    );
    validateVisualRefs(
      value.visual_refs,
      "LongRunObservationBundle.visual_refs",
      actorIds,
      runId,
      errors
    );
    validateVideoSegmentRefs(
      value.video_segment_refs,
      "LongRunObservationBundle.video_segment_refs",
      actorIds,
      runId,
      errors
    );
    validateDroppedCaptures(
      value.dropped_captures,
      "LongRunObservationBundle.dropped_captures",
      actorIds,
      runId,
      errors
    );
    validateMissingEvidence(
      value.missing_evidence,
      "LongRunObservationBundle.missing_evidence",
      actorIds,
      runId,
      errors
    );
  }

  assertPathSafeRefArray(
    value.structured_artifact_refs,
    "LongRunObservationBundle.structured_artifact_refs",
    errors
  );

  const privateHits = findPrivateFieldPaths(value);
  if (privateHits.length > 0) {
    errors.push(
      `private actor-state fields are forbidden in observation bundles: ${privateHits.join(", ")}`
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, bundle: value as LongRunObservationBundleV1 };
}

export function assertLongRunObservationBundle(value: unknown): LongRunObservationBundleV1 {
  const result = validateLongRunObservationBundle(value);
  if (!result.ok) {
    throw new Error(`Invalid LongRunObservationBundle: ${result.errors.join("; ")}`);
  }
  return result.bundle;
}

export function loadLongRunObservationBundleFromFile(path: string): LongRunObservationBundleV1 {
  const raw = readFileSync(path, "utf8");
  return assertLongRunObservationBundle(JSON.parse(raw) as unknown);
}

export function validateMultiActorReportIndex(
  value: unknown
): ObservationIndexValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["MultiActorReportIndex must be an object"] };
  }

  rejectUnknownKeys(value, indexKeys, "MultiActorReportIndex", errors);

  if (value.schema !== MULTI_ACTOR_REPORT_INDEX_SCHEMA) {
    errors.push(`schema must be '${MULTI_ACTOR_REPORT_INDEX_SCHEMA}'`);
  }
  assertString(value, "index_id", "MultiActorReportIndex", errors);
  assertString(value, "generated_at", "MultiActorReportIndex", errors);

  if (!Array.isArray(value.runs)) {
    errors.push("MultiActorReportIndex.runs must be an array");
  } else {
    const runIds = new Set<string>();
    for (const [index, entry] of value.runs.entries()) {
      const entryPath = `MultiActorReportIndex.runs[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${entryPath} must be an object`);
        continue;
      }
      rejectUnknownKeys(entry, indexEntryKeys, entryPath, errors);
      assertString(entry, "run_id", entryPath, errors);
      assertString(entry, "scenario_id", entryPath, errors);
      assertString(entry, "scenario_version", entryPath, errors);
      assertPathSafeRef(entry.bundle_ref, `${entryPath}.bundle_ref`, errors);
      assertString(entry, "started_at", entryPath, errors);
      assertBoolean(entry, "has_visual_refs", entryPath, errors);
      assertBoolean(entry, "has_video_refs", entryPath, errors);
      assertBoolean(entry, "is_fixture", entryPath, errors);

      const actorIds = assertStringArray(entry.actor_ids, `${entryPath}.actor_ids`, errors);
      if (actorIds.length === 0) {
        errors.push(`${entryPath}.actor_ids must be non-empty`);
      }
      if (!isNonNegativeInteger(entry.dropped_capture_count)) {
        errors.push(`${entryPath}.dropped_capture_count must be a non-negative integer`);
      }
      if (!isNonNegativeInteger(entry.missing_evidence_count)) {
        errors.push(`${entryPath}.missing_evidence_count must be a non-negative integer`);
      }
      if (entry.ended_at !== undefined) {
        assertString(entry, "ended_at", entryPath, errors);
      }
      if (entry.duration_ms !== undefined && !isNonNegativeInteger(entry.duration_ms)) {
        errors.push(`${entryPath}.duration_ms must be a non-negative integer when present`);
      }
      if (nonEmptyString(entry.run_id)) {
        if (runIds.has(entry.run_id)) {
          errors.push(`${entryPath}.run_id duplicate '${entry.run_id}'`);
        }
        runIds.add(entry.run_id);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, index: value as MultiActorReportIndexV1 };
}

export function assertMultiActorReportIndex(value: unknown): MultiActorReportIndexV1 {
  const result = validateMultiActorReportIndex(value);
  if (!result.ok) {
    throw new Error(`Invalid MultiActorReportIndex: ${result.errors.join("; ")}`);
  }
  return result.index;
}

export function loadMultiActorReportIndexFromFile(path: string): MultiActorReportIndexV1 {
  const raw = readFileSync(path, "utf8");
  return assertMultiActorReportIndex(JSON.parse(raw) as unknown);
}

/** Helper for tests and offline writers: empty placeholder metric bag. */
export function createEmptyObservationMetricsBag(): ObservationMetricsBagV1 {
  return emptyMetricsBag();
}

export type { ObservationMetricPointV1 };
