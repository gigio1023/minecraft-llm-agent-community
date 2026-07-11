/** Strict loader/writer tests for goal-continuity-artifact-bag/v1. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertGoalContinuityArtifactBag,
  evaluateGoalContinuity,
  loadGoalContinuityArtifactBagFromFile,
  loadGoalContinuityManifestFromFile,
  selectGoalContinuityCase,
  validateGoalContinuityArtifactBag,
  validateGoalContinuityRestartObservation,
  writeGoalContinuityRestartObservation,
  type GoalContinuityLifecycleEventV1
} from "../src/benchmarks/continuity/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, "../benchmarks/continuity/fixtures");
const negativeDir = path.join(fixturesDir, "bag-negative");
const suitePath = path.join(here, "../benchmarks/continuity/goal-continuity-v1.json");

const LIFECYCLE_FIXTURES: Array<{
  file: string;
  events: GoalContinuityLifecycleEventV1[];
}> = [
  { file: "lifecycle-create.json", events: ["create"] },
  { file: "lifecycle-update.json", events: ["update"] },
  { file: "lifecycle-block.json", events: ["block"] },
  { file: "lifecycle-defer.json", events: ["defer"] },
  { file: "lifecycle-resume.json", events: ["block", "resume"] },
  { file: "lifecycle-supersede.json", events: ["supersede", "close"] },
  { file: "lifecycle-reopen.json", events: ["close", "reopen"] },
  { file: "lifecycle-close.json", events: ["close"] },
  { file: "unsupported-closure.json", events: ["close"] },
  { file: "stale-checkpoint.json", events: ["update"] },
  { file: "missing-ref.json", events: ["create", "resume"] }
];

function readNegative(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(negativeDir, name), "utf8"));
}

function expectRejection(name: string, pattern: RegExp): void {
  const result = validateGoalContinuityArtifactBag(readNegative(name));
  assert.equal(result.ok, false, `${name} should be rejected`);
  if (result.ok) {
    return;
  }
  assert.match(result.errors.join("; "), pattern, `${name} errors: ${result.errors.join("; ")}`);
}

test("lifecycle fixtures load through strict bag loader and evaluate unchanged", () => {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  const template = selectGoalContinuityCase(manifest, "interrupt_and_resume_open_work");

  for (const fixture of LIFECYCLE_FIXTURES) {
    const bag = loadGoalContinuityArtifactBagFromFile(fixturesDir, fixture.file);
    assert.equal(bag.schema, "goal-continuity-artifact-bag/v1");
    const report = evaluateGoalContinuity({
      suite_id: "goal-continuity-v1",
      suite_version: "1.1.0",
      case: {
        ...template,
        case_id: `load-${fixture.file}`,
        observable_lifecycle_events: fixture.events,
        interruption:
          fixture.file === "lifecycle-resume.json"
            ? {
                kind: "new_concern",
                schedule: "during_open_work",
                description: "interrupting concern"
              }
            : template.interruption
      },
      artifact_bag: bag
    });
    assert.equal(report.schema, "goal-continuity-report/v1");
  }
});

test("declared missing refs remain visible and load without success inflation", () => {
  const bag = loadGoalContinuityArtifactBagFromFile(fixturesDir, "missing-ref.json");
  assert.equal(bag.plan_bead_operation_results[0]?.present, false);
  assert.equal(bag.active_episodes[0]?.present, false);
  const report = evaluateGoalContinuity({
    suite_id: "goal-continuity-v1",
    suite_version: "1.1.0",
    case: {
      ...selectGoalContinuityCase(
        loadGoalContinuityManifestFromFile(suitePath),
        "interrupt_and_resume_open_work"
      ),
      case_id: "missing-ref-load",
      observable_lifecycle_events: ["create", "resume"]
    },
    artifact_bag: bag
  });
  assert.equal(report.continuity.interpretation_status, "unverifiable");
  assert.ok(report.failure_classes.includes("unverifiable"));
});

test("rejects unknown bag key", () => {
  expectRejection("unknown-bag-key.json", /extra_field is not an allowed key/);
});

test("rejects unknown nested artifact key", () => {
  expectRejection("unknown-nested-key.json", /extra_op_field is not an allowed key/);
});

test("rejects wrong bag schema", () => {
  expectRejection("wrong-schema.json", /schema must be 'goal-continuity-artifact-bag\/v1'/);
});

test("rejects absolute refs", () => {
  expectRejection("absolute-ref.json", /root-safe relative ref|absolute/);
});

test("rejects escaping refs", () => {
  expectRejection("escaping-ref.json", /root-safe relative ref|escape/);
});

test("rejects URI refs", () => {
  expectRejection("uri-ref.json", /URI refs/);
});

test("rejects duplicate refs across incompatible collections", () => {
  expectRejection("duplicate-cross-collection.json", /incompatible collections/);
});

test("rejects present true without artifact", () => {
  expectRejection("present-true-missing-artifact.json", /artifact is required when present is true/);
});

test("rejects wrong artifact schema for collection", () => {
  expectRejection(
    "wrong-artifact-schema.json",
    /schema must be 'plan-bead-operation-result\/v1'/
  );
});

test("rejects artifact actor id mismatch", () => {
  expectRejection("actor-id-mismatch.json", /must match bag actor_id/);
});

test("rejects required refs that do not resolve to a collection entry", () => {
  expectRejection("required-ref-unresolved.json", /does not resolve to any collection entry/);
});

test("rejects invalid operation status without reading reason prose", () => {
  const result = validateGoalContinuityArtifactBag(readNegative("invalid-operation-status.json"));
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.errors.join("; "), /status must be one of/);
  assert.equal(
    result.errors.some((error) => /reason/.test(error) && /checkpoint mismatch/i.test(error)),
    false
  );
});

test("rejects invalid operation op", () => {
  expectRejection("invalid-operation-op.json", /op must be one of/);
});

test("rejects unknown operation patch keys", () => {
  expectRejection("invalid-operation-patch.json", /mystery_field is not an allowed key/);
});

test("rejects negative checkpoint versions", () => {
  expectRejection("negative-checkpoint-version.json", /non-negative integer/);
});

test("rejects present false entries that still carry an artifact", () => {
  expectRejection("present-false-with-artifact.json", /artifact must be absent when present is false/);
});

test("rejects restart observation with identical before and after refs", () => {
  expectRejection("restart-same-before-after.json", /before_ref and after_ref must be distinct/);
});

test("rejects observed restart with empty source refs", () => {
  expectRejection(
    "restart-observed-empty-sources.json",
    /source_artifact_refs must be non-empty when status is 'observed'/
  );
});

test("rejects restart observation with invalid open work ids", () => {
  expectRejection("restart-invalid-open-work-ids.json", /before_open_bead_ids\[0\] must be a non-empty string/);
});

test("loadGoalContinuityArtifactBagFromFile rejects paths outside declared root", () => {
  assert.throws(
    () => loadGoalContinuityArtifactBagFromFile(fixturesDir, "../goal-continuity-v1.json"),
    /escape|unsafe|Invalid GoalContinuityArtifactBag ref/i
  );
  assert.throws(
    () => loadGoalContinuityArtifactBagFromFile(fixturesDir, "/etc/passwd"),
    /absolute|Invalid GoalContinuityArtifactBag ref/i
  );
  assert.throws(
    () => loadGoalContinuityArtifactBagFromFile(fixturesDir, "file:///tmp/x.json"),
    /URI/
  );
});

test("assertGoalContinuityArtifactBag accepts valid create fixture", () => {
  const raw = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, "lifecycle-create.json"), "utf8")
  ) as unknown;
  const bag = assertGoalContinuityArtifactBag(raw);
  assert.equal(bag.actor_id, "npc_a");
  assert.equal(bag.plan_bead_operation_results[0]?.present, true);
});

test("restart observation validator and writer round-trip under declared root", () => {
  const observation = {
    schema: "goal-continuity-restart-observation/v1",
    status: "observed",
    before_ref: "checkpoints/before-restart.json",
    after_ref: "checkpoints/after-restart.json",
    before_open_bead_ids: ["bead-resume-1"],
    after_open_bead_ids: ["bead-resume-1"],
    source_artifact_refs: ["runtime/restart-observation.json"]
  };
  const validated = validateGoalContinuityRestartObservation(observation);
  assert.equal(validated.ok, true);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "goal-continuity-restart-"));
  try {
    const written = writeGoalContinuityRestartObservation(
      root,
      "runtime/restart-observation.json",
      observation
    );
    assert.equal(written.relative_ref, "runtime/restart-observation.json");
    assert.equal(written.observation.status, "observed");
    const reloaded = JSON.parse(fs.readFileSync(written.absolute_path, "utf8")) as unknown;
    const again = validateGoalContinuityRestartObservation(reloaded);
    assert.equal(again.ok, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("writer rejects unsafe relative filenames", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "goal-continuity-restart-bad-"));
  try {
    assert.throws(
      () =>
        writeGoalContinuityRestartObservation(root, "../escape.json", {
          schema: "goal-continuity-restart-observation/v1",
          status: "not_observed",
          before_ref: "checkpoints/before.json",
          after_ref: "checkpoints/after.json",
          before_open_bead_ids: [],
          after_open_bead_ids: [],
          source_artifact_refs: []
        }),
      /escape|unsafe/i
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
