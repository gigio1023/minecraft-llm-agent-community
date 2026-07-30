/**
 * Offline writer for long-run observation bundles and multi-actor report index.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { isRootSafeRelativeRef } from "../capability/artifactRefs.js";

import {
  assertLongRunObservationBundle,
  assertMultiActorReportIndex,
  validateLongRunObservationBundle,
  validateMultiActorReportIndex
} from "./loader.js";
import {
  MULTI_ACTOR_REPORT_INDEX_SCHEMA,
  type LongRunObservationBundleV1,
  type MultiActorReportIndexEntryV1,
  type MultiActorReportIndexV1
} from "./types.js";

export type WriteObservationBundleResult = {
  bundle_path: string;
  bundle_ref: string;
  bundle: LongRunObservationBundleV1;
};

export type WriteObservationBundleOptions = {
  /** Relative filename under outputDir. Defaults to `observation-bundle.json`. */
  bundle_filename?: string;
};

function toPosixRelative(fromDir: string, absolutePath: string): string {
  return path.relative(fromDir, absolutePath).split(path.sep).join("/");
}

function resolveOutputFilename(outputDir: string, filename: string, field: string): string {
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(filename) ||
    path.isAbsolute(filename) ||
    !isRootSafeRelativeRef(filename)
  ) {
    throw new Error(`${field} must be a root-safe relative filename`);
  }
  return path.join(outputDir, filename);
}

function indexEntryFromBundle(
  bundle: LongRunObservationBundleV1,
  bundleRef: string
): MultiActorReportIndexEntryV1 {
  const declaration = bundle.run_declaration;
  return {
    run_id: declaration.run_id,
    scenario_id: declaration.scenario_id,
    scenario_version: declaration.scenario_version,
    bundle_ref: bundleRef,
    actor_ids: declaration.actors.map((actor) => actor.actor_id),
    started_at: declaration.started_at,
    ...(declaration.ended_at !== undefined ? { ended_at: declaration.ended_at } : {}),
    ...(declaration.duration_ms !== undefined ? { duration_ms: declaration.duration_ms } : {}),
    dropped_capture_count: bundle.dropped_captures.length,
    missing_evidence_count: bundle.missing_evidence.length,
    has_visual_refs: bundle.visual_refs.length > 0,
    has_video_refs: bundle.video_segment_refs.length > 0,
    is_fixture: declaration.is_fixture
  };
}

/**
 * Validate and write a long-run observation bundle under `outputDir`.
 * Returns the written absolute path and a path-safe relative ref from outputDir.
 */
export function writeLongRunObservationBundle(
  outputDir: string,
  bundleInput: unknown,
  options: WriteObservationBundleOptions = {}
): WriteObservationBundleResult {
  const bundle = assertLongRunObservationBundle(bundleInput);
  const filename = options.bundle_filename ?? "observation-bundle.json";
  const bundlePath = resolveOutputFilename(outputDir, filename, "bundle_filename");

  mkdirSync(path.dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");

  return {
    bundle_path: bundlePath,
    bundle_ref: toPosixRelative(outputDir, bundlePath),
    bundle
  };
}

export type UpsertObservationIndexOptions = {
  index_id: string;
  generated_at: string;
  /** Relative path from the index directory to the bundle file. */
  bundle_ref: string;
};

/**
 * Create or update a multi-actor report index entry for a validated bundle.
 * Replaces any existing entry with the same run_id.
 */
export function upsertMultiActorReportIndex(
  indexPath: string,
  bundle: LongRunObservationBundleV1,
  options: UpsertObservationIndexOptions
): MultiActorReportIndexV1 {
  const validation = validateLongRunObservationBundle(bundle);
  if (!validation.ok) {
    throw new Error(`Cannot index invalid bundle: ${validation.errors.join("; ")}`);
  }

  let existing: MultiActorReportIndexV1 | null = null;
  if (existsSync(indexPath)) {
    const raw = readFileSync(indexPath, "utf8");
    existing = assertMultiActorReportIndex(JSON.parse(raw) as unknown);
  }

  const entry = indexEntryFromBundle(bundle, options.bundle_ref);
  const runs = existing
    ? [...existing.runs.filter((run) => run.run_id !== entry.run_id), entry]
    : [entry];

  const index: MultiActorReportIndexV1 = {
    schema: MULTI_ACTOR_REPORT_INDEX_SCHEMA,
    index_id: options.index_id,
    generated_at: options.generated_at,
    runs: runs.sort((a, b) => a.run_id.localeCompare(b.run_id))
  };

  const indexValidation = validateMultiActorReportIndex(index);
  if (!indexValidation.ok) {
    throw new Error(`Invalid MultiActorReportIndex: ${indexValidation.errors.join("; ")}`);
  }

  mkdirSync(path.dirname(indexPath), { recursive: true });
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return index;
}

/**
 * Write bundle and upsert the multi-actor index in one offline step.
 */
export function writeObservationBundleAndIndex(input: {
  outputDir: string;
  bundle: unknown;
  index_filename?: string;
  bundle_filename?: string;
  index_id: string;
  generated_at: string;
}): {
  bundle_path: string;
  bundle_ref: string;
  index_path: string;
  bundle: LongRunObservationBundleV1;
  index: MultiActorReportIndexV1;
} {
  const indexPath = resolveOutputFilename(
    input.outputDir,
    input.index_filename ?? "multi-actor-report-index.json",
    "index_filename"
  );
  const written = writeLongRunObservationBundle(input.outputDir, input.bundle, {
    bundle_filename: input.bundle_filename
  });
  const index = upsertMultiActorReportIndex(indexPath, written.bundle, {
    index_id: input.index_id,
    generated_at: input.generated_at,
    bundle_ref: written.bundle_ref
  });
  return {
    bundle_path: written.bundle_path,
    bundle_ref: written.bundle_ref,
    index_path: indexPath,
    bundle: written.bundle,
    index
  };
}
