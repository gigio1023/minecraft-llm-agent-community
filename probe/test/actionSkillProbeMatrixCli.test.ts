import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProbeMatrixReport,
  buildProbeMatrixCases,
  normalizeDockerPreflightResult
} from "../src/actionSkillProbeMatrixCli.js";
import { listImplementedSeedActionSkills } from "../src/gameplay/seedSkills/registry.js";

test("action skill probe matrix builds one case for every implemented seed action skill", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    maxActions: 8
  });
  const implementedIds = listImplementedSeedActionSkills().map((skill) => skill.id);

  assert.deepEqual(cases.map((entry) => entry.skillId), implementedIds);
  assert.ok(cases.every((entry) => entry.actorId === "npc_b"));
  assert.ok(cases.every((entry) => entry.maxActions === 8));
  assert.ok(cases.every((entry) => entry.roleId.length > 0));
  assert.ok(cases.every((entry) => entry.primitiveIds.length > 0));
  assert.ok(cases.every((entry) => entry.contractEvidence.length > 0));
  assert.ok(cases.every((entry) => entry.postconditionEvidence.length > 0));
});

test("action skill probe matrix can narrow to selected implemented skills", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 5
  });

  assert.deepEqual(cases.map((entry) => entry.skillId), ["collectLogs", "craftCraftingTable"]);
  assert.deepEqual(cases.map((entry) => entry.roleId), ["gatherer", "crafter"]);
  assert.deepEqual(cases.map((entry) => entry.preconditions), [[], ["inventory has planks"]]);
});

test("action skill probe matrix rejects planned or unknown skill ids", () => {
  assert.throws(
    () =>
      buildProbeMatrixCases({
        actorId: "npc_b",
        skillIds: ["mineCobblestone"],
        maxActions: 5
      }),
    /Unknown or non-implemented action skill/
  );
});

test("action skill probe matrix preflight separates docker environment blockers", () => {
  assert.deepEqual(
    normalizeDockerPreflightResult({
      code: 0,
      stdout: "28.0.0",
      stderr: "",
      signal: null
    }),
    { status: "ready" }
  );

  const blocked = normalizeDockerPreflightResult({
    code: 1,
    stdout: "",
    stderr: "failed to connect to the docker API",
    signal: null
  });

  assert.equal(blocked.status, "environment_blocked");
  assert.match(blocked.reason, /failed to connect to the docker API/);
});

test("action skill probe matrix builds a reusable JSON report shape", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs"],
    maxActions: 8
  });
  const report = buildProbeMatrixReport({
    mode: "dry_run",
    actorId: "npc_b",
    maxActions: 8,
    cases,
    createdAt: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.schema, "action-skill-probe-matrix-report/v1");
  assert.equal(report.mode, "dry_run");
  assert.equal(report.actorId, "npc_b");
  assert.equal(report.summary.planned, 1);
  assert.equal(report.summary.completed, 0);
  assert.equal(report.cases[0].skillId, "collectLogs");
  assert.ok(report.cases[0].contractEvidence.length > 0);
  assert.ok(report.cases[0].postconditionEvidence.length > 0);
});

test("action skill probe matrix report counts environment preflight blockers as errors", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["craftPlanksAndSticks"],
    maxActions: 8
  });
  const report = buildProbeMatrixReport({
    mode: "live",
    actorId: "npc_b",
    maxActions: 8,
    cases,
    preflight: {
      status: "environment_blocked",
      reason: "docker unavailable"
    },
    results: [],
    createdAt: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.summary.error, 1);
  assert.equal(report.summary.completed, 0);
  assert.equal(report.summary.planned, 1);
});
