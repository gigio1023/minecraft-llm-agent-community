/** Offline evaluator tests for goal-continuity-report/v1. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateGoalContinuity,
  loadGoalContinuityManifestFromFile,
  type GoalContinuityArtifactBagV1,
  type GoalContinuityCaseV1,
  type GoalContinuityLifecycleEventV1
} from "../src/benchmarks/continuity/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "../benchmarks/continuity/goal-continuity-v1.json");
const fixturesDir = path.join(here, "../benchmarks/continuity/fixtures");

function readBag(name: string): GoalContinuityArtifactBagV1 {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), "utf8")) as GoalContinuityArtifactBagV1;
}

function baseCase(
  events: GoalContinuityLifecycleEventV1[],
  overrides: Partial<GoalContinuityCaseV1> = {}
): GoalContinuityCaseV1 {
  const manifest = loadGoalContinuityManifestFromFile(suitePath);
  const template = manifest.cases[0]!;
  return {
    ...template,
    ...overrides,
    case_id: overrides.case_id ?? `case-${events.join("-")}`,
    observable_lifecycle_events: events,
    open_work_expectation: overrides.open_work_expectation ?? template.open_work_expectation,
    budgets: overrides.budgets ?? template.budgets,
    seed_policy: overrides.seed_policy ?? template.seed_policy,
    allowed_physical_evidence_kinds:
      overrides.allowed_physical_evidence_kinds ?? template.allowed_physical_evidence_kinds
  };
}

function evaluateFixture(
  fixtureName: string,
  events: GoalContinuityLifecycleEventV1[],
  caseOverrides: Partial<GoalContinuityCaseV1> = {}
) {
  const bag = readBag(fixtureName);
  const continuityCase = baseCase(events, caseOverrides);
  return evaluateGoalContinuity({
    suite_id: "goal-continuity-v1",
    suite_version: "1.0.0",
    case: continuityCase,
    artifact_bag: bag
  });
}

test("lifecycle create is observed with source artifact refs", () => {
  const report = evaluateFixture("lifecycle-create.json", ["create"]);
  assert.equal(report.schema, "goal-continuity-report/v1");
  const create = report.continuity.lifecycle_events.find((entry) => entry.event === "create");
  assert.ok(create);
  assert.equal(create.status, "observed");
  assert.ok(create.source_artifact_refs.length > 0);
  assert.equal(report.continuity.interpretation_status, "passed");
});

test("lifecycle update is observed", () => {
  const report = evaluateFixture("lifecycle-update.json", ["update"]);
  const update = report.continuity.lifecycle_events.find((entry) => entry.event === "update");
  assert.equal(update?.status, "observed");
  assert.ok(update?.source_artifact_refs[0]?.includes("update-001"));
});

test("lifecycle block is observed and ready-front cites blocked bead", () => {
  const report = evaluateFixture("lifecycle-block.json", ["block"]);
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "block")?.status,
    "observed"
  );
  assert.equal(report.continuity.ready_front_changes[0]?.blocked_bead_ids[0], "bead-block-1");
});

test("lifecycle defer is observed", () => {
  const report = evaluateFixture("lifecycle-defer.json", ["defer"]);
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "defer")?.status,
    "observed"
  );
  assert.equal(report.continuity.open_work_survival.status, "retained");
});

test("lifecycle resume is observed after prior block", () => {
  const report = evaluateFixture("lifecycle-resume.json", ["block", "resume"], {
    interruption: {
      kind: "new_concern",
      schedule: "during_open_work",
      description: "interrupting concern"
    }
  });
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "resume")?.status,
    "observed"
  );
  const resumeFinding = report.continuity.findings.find(
    (finding) => finding.kind === "useful_resume_after_interruption"
  );
  assert.equal(resumeFinding?.status, "detected");
});

test("lifecycle supersede is observed separately from close", () => {
  const report = evaluateFixture("lifecycle-supersede.json", ["supersede", "close"]);
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "supersede")?.status,
    "observed"
  );
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "close")?.status,
    "missing"
  );
});

test("lifecycle reopen is observed after prior close", () => {
  const report = evaluateFixture("lifecycle-reopen.json", ["close", "reopen"]);
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "reopen")?.status,
    "observed"
  );
});

test("lifecycle close with runtime evidence keeps physical and continuity separate", () => {
  const report = evaluateFixture("lifecycle-close.json", ["close"]);
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "close")?.status,
    "observed"
  );
  assert.equal(report.physical.target?.status, "passed");
  assert.equal(report.physical.interpretation_status, "passed");
  assert.equal(report.continuity.interpretation_status, "passed");
});

test("unsupported closure is flagged and prose cannot prove physical", () => {
  const report = evaluateFixture("unsupported-closure.json", ["close"], {
    physical_target: {
      op: "item_count_gte",
      item: "oak_log",
      count: 1,
      owner: "actor"
    }
  });

  const unsupported = report.continuity.findings.find(
    (finding) => finding.kind === "unsupported_physical_closure"
  );
  assert.equal(unsupported?.status, "detected");
  assert.ok((unsupported?.source_artifact_refs.length ?? 0) > 0);

  const prose = report.continuity.findings.find(
    (finding) => finding.kind === "prose_cannot_prove_physical"
  );
  assert.equal(prose?.status, "detected");
  assert.ok(report.physical.prose_rejected_as_physical_proof.length > 0);
  assert.equal(report.physical.interpretation_status, "unverifiable");
  assert.ok(report.failure_classes.includes("claim_without_evidence"));
  assert.notEqual(report.physical.interpretation_status, "passed");
});

test("stale checkpoint conflicts remain visible", () => {
  const report = evaluateFixture("stale-checkpoint.json", ["update"]);
  assert.ok(report.continuity.checkpoint_conflicts.length > 0);
  assert.ok(
    report.continuity.checkpoint_conflicts[0]?.reason.toLowerCase().includes("checkpoint")
  );
  const stale = report.continuity.findings.find((finding) => finding.kind === "stale_checkpoint");
  assert.equal(stale?.status, "detected");
  assert.equal(
    report.continuity.lifecycle_events.find((entry) => entry.event === "update")?.status,
    "missing"
  );
});

test("missing refs produce unknown/unverifiable not success", () => {
  const report = evaluateFixture("missing-ref.json", ["create", "resume"]);
  assert.equal(report.continuity.interpretation_status, "unverifiable");
  assert.ok(report.failure_classes.includes("unverifiable"));
  for (const event of report.continuity.lifecycle_events) {
    assert.equal(event.status, "unknown");
  }
  const missing = report.continuity.findings.filter((finding) => finding.kind === "missing_ref");
  assert.ok(missing.length >= 1);
  assert.notEqual(report.continuity.interpretation_status, "passed");
  assert.notEqual(report.physical.interpretation_status, "passed");
});

test("memory prose alone never passes physical target", () => {
  const bag = readBag("unsupported-closure.json");
  const continuityCase = baseCase(["close"], {
    physical_target: {
      op: "item_count_gte",
      item: "oak_log",
      count: 1,
      owner: "actor"
    },
    physical_milestones: []
  });
  // Explicitly omit physical evidence; only memory prose remains.
  delete bag.physical_evidence;

  const report = evaluateGoalContinuity({
    suite_id: "goal-continuity-v1",
    suite_version: "1.0.0",
    case: continuityCase,
    artifact_bag: bag
  });

  assert.equal(report.physical.target?.status, "unknown");
  assert.equal(report.physical.interpretation_status, "unverifiable");
  assert.ok(
    report.physical.prose_rejected_as_physical_proof.some((entry) =>
      entry.source_ref.includes("memory/")
    )
  );
  assert.ok(
    (report.physical.target?.reasons ?? []).some((reason) =>
      /prose cannot substitute|physical evidence bag absent/i.test(reason)
    )
  );
});
