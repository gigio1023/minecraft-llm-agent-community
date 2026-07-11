/** Tests for long-run-observation-bundle/v1 (Step C3). */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { isRootSafeRelativeRef } from "../src/benchmarks/capability/artifactRefs.js";
import {
  OBSERVATION_JOIN_KEYS,
  OBSERVATION_METRIC_SERIES,
  buildPublicAnalysisExport,
  createEmptyObservationMetricsBag,
  findPrivateFieldPaths,
  loadLongRunObservationBundleFromFile,
  validateLongRunObservationBundle,
  validateObservationJoinKey,
  writeObservationBundleAndIndex
} from "../src/benchmarks/observation/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  here,
  "../benchmarks/observation/fixtures/long-run-observation-bundle-v1.json"
);

function cloneFixture(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
}

test("checked-in fixture loads with all metric series and review-only flags", () => {
  const bundle = loadLongRunObservationBundleFromFile(fixturePath);
  assert.equal(bundle.schema, "long-run-observation-bundle/v1");
  assert.equal(bundle.run_declaration.is_fixture, true);
  assert.equal(bundle.pixels_are_review_only, true);
  assert.equal(bundle.metrics_are_descriptive_only, true);
  assert.equal(bundle.run_declaration.actors.length, 2);
  assert.ok(bundle.dropped_captures.length >= 1);
  assert.ok(bundle.missing_evidence.length >= 1);
  assert.equal(bundle.dropped_captures[0]?.does_not_change_minecraft_truth, true);
  assert.equal(bundle.visual_refs[0]?.review_only, true);

  for (const series of OBSERVATION_METRIC_SERIES) {
    assert.ok(series in bundle.metrics, `missing metric series ${series}`);
    assert.ok(Array.isArray(bundle.metrics[series]));
  }

  const empty = createEmptyObservationMetricsBag();
  for (const series of OBSERVATION_METRIC_SERIES) {
    assert.deepEqual(empty[series], []);
  }
});

test("join keys are fixed as run_id/cycle_id/actor_id/timestamp", () => {
  assert.deepEqual([...OBSERVATION_JOIN_KEYS], [
    "run_id",
    "cycle_id",
    "actor_id",
    "timestamp"
  ]);

  const errors: string[] = [];
  const ok = validateObservationJoinKey(
    {
      run_id: "r1",
      cycle_id: "c1",
      actor_id: "actor_a",
      timestamp: "2026-07-11T00:00:00.000Z"
    },
    "join",
    errors,
    new Set(["actor_a"]),
    "r1"
  );
  assert.ok(ok);
  assert.equal(errors.length, 0);

  const missingErrors: string[] = [];
  validateObservationJoinKey(
    { run_id: "r1", cycle_id: "c1", actor_id: "actor_a" },
    "join",
    missingErrors
  );
  assert.ok(missingErrors.some((error) => error.includes("timestamp")));

  const mismatchErrors: string[] = [];
  validateObservationJoinKey(
    {
      run_id: "other-run",
      cycle_id: "c1",
      actor_id: "actor_a",
      timestamp: "2026-07-11T00:00:00.000Z"
    },
    "join",
    mismatchErrors,
    new Set(["actor_a"]),
    "fixture-long-run-obs-001"
  );
  assert.ok(mismatchErrors.some((error) => /run_id/.test(error)));
});

test("fixture metric and visual rows use matching join keys", () => {
  const bundle = loadLongRunObservationBundleFromFile(fixturePath);
  const runId = bundle.run_declaration.run_id;
  const actorIds = new Set(bundle.run_declaration.actors.map((actor) => actor.actor_id));

  for (const series of OBSERVATION_METRIC_SERIES) {
    for (const point of bundle.metrics[series]) {
      assert.equal(point.run_id, runId);
      assert.ok(actorIds.has(point.actor_id));
      assert.ok(point.cycle_id.length > 0);
      assert.ok(point.timestamp.length > 0);
      assert.equal(point.series, series);
    }
  }

  for (const visual of bundle.visual_refs) {
    assert.equal(visual.run_id, runId);
    assert.ok(actorIds.has(visual.actor_id));
    assert.equal(visual.review_only, true);
  }

  for (const dropped of bundle.dropped_captures) {
    assert.equal(dropped.run_id, runId);
    assert.equal(dropped.does_not_change_minecraft_truth, true);
  }
});

test("path-unsafe artifact refs are rejected", () => {
  const absolute = cloneFixture();
  (absolute.run_declaration as Record<string, unknown>).scenario_ref = "/tmp/secret.json";
  const absoluteResult = validateLongRunObservationBundle(absolute);
  assert.equal(absoluteResult.ok, false);
  if (!absoluteResult.ok) {
    assert.ok(absoluteResult.errors.some((error) => /root-safe|absolute/i.test(error)));
  }

  const escaping = cloneFixture();
  (escaping.run_declaration as Record<string, unknown>).scenario_ref =
    "../outside/scenario.json";
  const escapeResult = validateLongRunObservationBundle(escaping);
  assert.equal(escapeResult.ok, false);
  if (!escapeResult.ok) {
    assert.ok(escapeResult.errors.some((error) => /root-safe|\.\./i.test(error)));
  }

  const visualEscape = cloneFixture();
  const visuals = visualEscape.visual_refs as Array<Record<string, unknown>>;
  visuals[0]!.artifact_ref = "artifacts/../../etc/passwd";
  const visualResult = validateLongRunObservationBundle(visualEscape);
  assert.equal(visualResult.ok, false);
  if (!visualResult.ok) {
    assert.ok(visualResult.errors.some((error) => /root-safe|\.\./i.test(error)));
  }

  assert.equal(isRootSafeRelativeRef("artifacts/visual/cycle-0001-fp.png"), true);
  assert.equal(isRootSafeRelativeRef("/etc/passwd"), false);
  assert.equal(isRootSafeRelativeRef("../escape.png"), false);
});

test("private actor-state fields are rejected by bundle validation and public export", () => {
  const tainted = cloneFixture();
  (tainted as Record<string, unknown>).soul = "private soul text";
  const privatePaths = findPrivateFieldPaths(tainted);
  assert.ok(privatePaths.some((entry) => entry.endsWith(".soul")));

  const bundleResult = validateLongRunObservationBundle(tainted);
  assert.equal(bundleResult.ok, false);
  if (!bundleResult.ok) {
    assert.ok(bundleResult.errors.some((error) => /private actor-state/i.test(error)));
  }

  const exportResult = buildPublicAnalysisExport(tainted);
  assert.equal(exportResult.ok, false);
  if (!exportResult.ok) {
    assert.ok(exportResult.errors.some((error) => /private/i.test(error)));
  }

  const nested = cloneFixture();
  const actors = (nested.run_declaration as Record<string, unknown>).actors as Array<
    Record<string, unknown>
  >;
  actors[0]!.memory = { note: "private" };
  const nestedExport = buildPublicAnalysisExport(nested);
  assert.equal(nestedExport.ok, false);
  if (!nestedExport.ok) {
    assert.ok(nestedExport.errors.some((error) => /memory|private/i.test(error)));
  }
});

test("public analysis export omits private fields and keeps review-only pixel flags", () => {
  const bundle = loadLongRunObservationBundleFromFile(fixturePath);
  const result = buildPublicAnalysisExport(bundle);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  const pub = result.export;
  assert.equal(pub.schema, "public-analysis-export/v1");
  assert.equal(pub.run_id, bundle.run_declaration.run_id);
  assert.deepEqual([...pub.join_keys], [...OBSERVATION_JOIN_KEYS]);
  assert.equal(pub.pixels_are_review_only, true);
  assert.equal(pub.metrics_are_descriptive_only, true);
  assert.equal(pub.private_fields_omitted, true);
  assert.equal(pub.is_fixture, true);
  assert.equal(pub.dropped_capture_count, bundle.dropped_captures.length);
  assert.equal(pub.missing_evidence_count, bundle.missing_evidence.length);
  assert.equal(pub.visual_ref_count, bundle.visual_refs.length);
  assert.equal("soul" in pub, false);
  assert.equal("memory" in pub, false);
  assert.equal("planbeads" in pub, false);
  assert.ok(pub.structured_artifact_refs.length > 0);
});

test("offline writer writes bundle and multi-actor index with joinable run entry", () => {
  const bundle = loadLongRunObservationBundleFromFile(fixturePath);
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "obs-bundle-"));

  const written = writeObservationBundleAndIndex({
    outputDir,
    bundle,
    index_id: "fixture-multi-actor-index",
    generated_at: "2026-07-11T01:00:00.000Z"
  });

  assert.ok(fs.existsSync(written.bundle_path));
  assert.ok(fs.existsSync(written.index_path));
  assert.equal(written.bundle_ref, "observation-bundle.json");
  assert.equal(written.index.schema, "multi-actor-report-index/v1");
  assert.equal(written.index.runs.length, 1);
  assert.equal(written.index.runs[0]?.run_id, bundle.run_declaration.run_id);
  assert.equal(written.index.runs[0]?.bundle_ref, "observation-bundle.json");
  assert.equal(written.index.runs[0]?.is_fixture, true);
  assert.equal(written.index.runs[0]?.dropped_capture_count, 1);
  assert.equal(written.index.runs[0]?.missing_evidence_count, 1);
  assert.equal(written.index.runs[0]?.has_visual_refs, true);
  assert.equal(written.index.runs[0]?.has_video_refs, false);

  const reloaded = loadLongRunObservationBundleFromFile(written.bundle_path);
  assert.equal(reloaded.run_declaration.run_id, bundle.run_declaration.run_id);
});

test("missing metric series placeholder fails validation", () => {
  const incomplete = cloneFixture();
  const metrics = incomplete.metrics as Record<string, unknown>;
  delete metrics.cost;
  const result = validateLongRunObservationBundle(incomplete);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => /metrics\.cost/.test(error)));
  }
});

test("pixels_are_review_only must stay true", () => {
  const bad = cloneFixture();
  bad.pixels_are_review_only = false;
  const result = validateLongRunObservationBundle(bad);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => /pixels_are_review_only/.test(error)));
  }
});

test("numeric metrics require structured evidence refs", () => {
  const bad = cloneFixture();
  const metrics = bad.metrics as Record<string, Array<Record<string, unknown>>>;
  const point = metrics.action?.[0];
  assert.ok(point);
  if (!point) {
    return;
  }
  point.value = 1;
  point.evidence_refs = [];
  const result = validateLongRunObservationBundle(bad);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => /evidence_refs.*non-empty/i.test(error)));
  }
});

test("join and run timestamps must be real ISO date-times", () => {
  const bad = cloneFixture();
  (bad.run_declaration as Record<string, unknown>).started_at = "sometime tomorrow";
  const metrics = bad.metrics as Record<string, Array<Record<string, unknown>>>;
  const point = metrics.action?.[0];
  assert.ok(point);
  if (point) {
    point.timestamp = "cycle one";
  }
  const result = validateLongRunObservationBundle(bad);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => /started_at.*ISO-8601/i.test(error)));
    assert.ok(result.errors.some((error) => /timestamp.*ISO-8601/i.test(error)));
  }
});

test("schema-only observation bundles cannot omit every structured source ref", () => {
  const bad = cloneFixture();
  bad.structured_artifact_refs = [];
  const result = validateLongRunObservationBundle(bad);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => /structured_artifact_refs.*non-empty/i.test(error)));
  }
});

test("observation writer cannot escape its output directory", () => {
  const bundle = loadLongRunObservationBundleFromFile(fixturePath);
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "obs-bundle-path-"));
  assert.throws(
    () =>
      writeObservationBundleAndIndex({
        outputDir,
        bundle,
        index_filename: "../outside-index.json",
        index_id: "fixture-index",
        generated_at: "2026-07-11T01:00:00.000Z"
      }),
    /index_filename.*root-safe/i
  );
  assert.throws(
    () =>
      writeObservationBundleAndIndex({
        outputDir,
        bundle,
        bundle_filename: "/tmp/outside-bundle.json",
        index_id: "fixture-index",
        generated_at: "2026-07-11T01:00:00.000Z"
      }),
    /bundle_filename.*root-safe/i
  );
});
