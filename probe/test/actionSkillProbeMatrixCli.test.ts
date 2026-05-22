import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  auditExistingActionSkillEvidence,
  buildFreshEvidenceCommand,
  buildProbeMatrixEvidenceGaps,
  buildProbeMatrixNextActions,
  buildProbeMatrixReport,
  buildProbeMatrixCases,
  buildProbeMatrixSkillStatuses,
  checkProbeMatrixEnvironment,
  classifyProbeMatrixReport,
  countProbeMatrixEvidenceScopes,
  countProbeMatrixSkillStatuses,
  normalizeDockerPreflightResult
} from "../src/actionSkillProbeMatrixCli.js";
import type { ProbeMatrixSkillStatus } from "../src/actionSkillProbeMatrixCli.js";
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
  assert.ok(cases.every((entry) => entry.probePreconditionMode.length > 0));
  assert.ok(cases.every((entry) => entry.readinessItems.length === 7));
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
  assert.deepEqual(cases.map((entry) => entry.probePreconditionMode), ["placed_logs", "inventory_planks_and_sticks"]);
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

test("action skill probe matrix preflight rejects non-Minecraft manual port listeners", async () => {
  const previous = process.env.MC_PORT;
  const server = createServer();
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  process.env.MC_PORT = String(address.port);
  try {
    const result = await checkProbeMatrixEnvironment();
    assert.equal(result.status, "environment_blocked");
    assert.match(result.reason, new RegExp(`MC_PORT=${address.port}`));
    assert.match(result.reason, /not a ready Minecraft server/);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    if (previous === undefined) {
      delete process.env.MC_PORT;
    } else {
      process.env.MC_PORT = previous;
    }
  }
});

test("action skill probe matrix preflight blocks disconnected manual Minecraft port overrides", async () => {
  const previous = process.env.MC_PORT;
  const server = createServer();
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  process.env.MC_PORT = String(port);
  try {
    const result = await checkProbeMatrixEnvironment();
    assert.equal(result.status, "environment_blocked");
    assert.match(result.reason, new RegExp(`MC_PORT=${port}`));
  } finally {
    if (previous === undefined) {
      delete process.env.MC_PORT;
    } else {
      process.env.MC_PORT = previous;
    }
  }
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
  assert.deepEqual(report.summary.statusCounts, {
    passed: 0,
    failed: 0,
    error: 0,
    pendingLiveEvidence: 1,
    environmentBlocked: 0
  });
  assert.deepEqual(report.summary.evidenceScopeCounts, {
    currentRun: 0,
    historicalTranscript: 0,
    missing: 1,
    environmentBlocked: 0
  });
  assert.equal(report.verdict, "incomplete");
  assert.equal(report.skillStatuses.length, 1);
  assert.equal(report.skillStatuses[0].skillId, "collectLogs");
  assert.equal(report.skillStatuses[0].status, "pending_live_evidence");
  assert.equal(report.skillStatuses[0].evidenceScope, "missing");
  assert.match(report.skillStatuses[0].freshEvidenceCommand, /--skill collectLogs/);
  assert.equal(report.evidenceGaps.length, 1);
  assert.equal(report.evidenceGaps[0].status, "pending_live_evidence");
  assert.equal(report.evidenceGaps[0].evidenceScope, "missing");
  assert.equal(report.nextActions.length, 1);
  assert.equal(report.nextActions[0].kind, "run_fresh_live_probe");
  assert.equal(report.nextActions[0].priority, "P0");
  assert.equal(report.nextActions[0].skillId, "collectLogs");
  assert.match(report.nextActions[0].command ?? "", /--skill collectLogs/);
  assert.deepEqual(report.evidenceGaps[0].requiredEvidence.postcondition, report.cases[0].postconditionEvidence);
  assert.equal(report.cases[0].skillId, "collectLogs");
  assert.equal(report.cases[0].probePreconditionMode, "placed_logs");
  assert.deepEqual(report.cases[0].readinessItems.map((item) => item.id), [
    "implemented_seed_action_skill",
    "role_selected",
    "primitive_ownership_declared",
    "verification_contract_declared",
    "postcondition_spec_declared",
    "deterministic_probe_driver_declared",
    "probe_precondition_mode_declared"
  ]);
  assert.ok(report.cases[0].readinessItems.every((item) => item.status === "ready"));
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
  assert.deepEqual(report.summary.statusCounts, {
    passed: 0,
    failed: 0,
    error: 0,
    pendingLiveEvidence: 0,
    environmentBlocked: 1
  });
  assert.deepEqual(report.summary.evidenceScopeCounts, {
    currentRun: 0,
    historicalTranscript: 0,
    missing: 0,
    environmentBlocked: 1
  });
  assert.equal(report.verdict, "environment_blocked");
  assert.equal(report.skillStatuses.length, 1);
  assert.equal(report.skillStatuses[0].status, "environment_blocked");
  assert.equal(report.skillStatuses[0].evidenceScope, "environment_blocked");
  assert.match(report.skillStatuses[0].freshEvidenceCommand, /--skill craftPlanksAndSticks/);
  assert.equal(report.evidenceGaps.length, 1);
  assert.equal(report.evidenceGaps[0].status, "environment_blocked");
  assert.equal(report.evidenceGaps[0].evidenceScope, "environment_blocked");
  assert.equal(report.nextActions.length, 1);
  assert.equal(report.nextActions[0].kind, "restore_environment");
  assert.match(report.nextActions[0].command ?? "", /docker info/);
  assert.deepEqual(report.nextActions[0].skillIds, ["craftPlanksAndSticks"]);
  assert.match(report.evidenceGaps[0].reason, /docker unavailable/);
  assert.equal(report.summary.completed, 0);
  assert.equal(report.summary.planned, 1);
});

test("action skill probe matrix classifies reusable report verdicts", () => {
  assert.equal(
    classifyProbeMatrixReport({
      planned: 2,
      completed: 2,
      passed: 2,
      failed: 0,
      error: 0
    }),
    "passed"
  );

  assert.equal(
    classifyProbeMatrixReport({
      planned: 2,
      completed: 1,
      passed: 1,
      failed: 0,
      error: 0
    }),
    "incomplete"
  );

  assert.equal(
    classifyProbeMatrixReport({
      planned: 2,
      completed: 1,
      passed: 0,
      failed: 1,
      error: 0
    }),
    "failed"
  );

  assert.equal(
    classifyProbeMatrixReport({
      planned: 2,
      completed: 0,
      passed: 0,
      failed: 0,
      error: 1,
      preflight: {
        status: "environment_blocked",
        reason: "docker unavailable"
      }
    }),
    "environment_blocked"
  );
});

test("action skill probe matrix evidence gaps explain failed and unrun cases", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 8
  });
  const gaps = buildProbeMatrixEvidenceGaps({
    cases,
    results: [
      {
        status: "failed",
        skillId: "collectLogs",
        actorId: "npc_b",
        contract: {
          skillId: "collectLogs",
          primitiveIds: ["observe", "collect_logs", "wait"],
          evidence: ["inventory delta"],
          protectedBy: ["test/collectLogs.test.ts"]
        },
        allowedPrimitives: ["observe", "collect_logs", "wait"],
        transcriptPath: "data/evidence/collect.json",
        finalWhy: "log inventory did not increase",
        terminalStatus: "success",
        terminalWhy: "terminal memory reached",
        postconditionStatus: "failed",
        postconditionFailure: "log inventory did not increase",
        failureKind: "postcondition_failed"
      }
    ]
  });

  assert.equal(gaps.length, 2);
  assert.equal(gaps[0].skillId, "collectLogs");
  assert.equal(gaps[0].status, "failed");
  assert.equal(gaps[0].evidenceScope, "current_run");
  assert.match(gaps[0].reason, /log inventory did not increase/);
  assert.equal(gaps[0].terminalStatus, "success");
  assert.equal(gaps[0].postconditionStatus, "failed");
  assert.equal(gaps[0].failureKind, "postcondition_failed");
  assert.equal(gaps[0].transcriptPath, "data/evidence/collect.json");
  assert.equal(gaps[1].skillId, "craftCraftingTable");
  assert.equal(gaps[1].status, "pending_live_evidence");
  assert.equal(gaps[1].evidenceScope, "missing");
  assert.match(gaps[1].freshEvidenceCommand, /--skill craftCraftingTable/);
  assert.ok(gaps[1].requiredEvidence.contract.length > 0);
  assert.ok(gaps[1].requiredEvidence.postcondition.length > 0);
});

test("action skill probe matrix builds concrete fresh evidence commands", () => {
  const [testCase] = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs"],
    maxActions: 20
  });

  assert.equal(
    buildFreshEvidenceCommand(testCase),
    "bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 20 --init-actor-workspace baseline --no-dashboard"
  );
});

test("action skill probe matrix next actions classify missing, failed, and environment-blocked gaps", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 8
  });
  const missingGap = buildProbeMatrixEvidenceGaps({ cases }).find((gap) => gap.skillId === "collectLogs");
  assert.ok(missingGap);
  const blockedGap = buildProbeMatrixEvidenceGaps({
    cases: [cases[0]],
    preflight: { status: "environment_blocked", reason: "docker unavailable" }
  })[0];
  const failedGap = buildProbeMatrixEvidenceGaps({
    cases: [cases[1]],
    results: [
      {
        status: "failed",
        skillId: "craftCraftingTable",
        actorId: "npc_b",
        contract: {
          skillId: "craftCraftingTable",
          primitiveIds: ["observe", "craft_item", "wait"],
          evidence: ["crafting table inventory"],
          protectedBy: ["test/craftItem.test.ts"]
        },
        allowedPrimitives: ["observe", "craft_item", "wait"],
        finalWhy: "missing crafting table inventory",
        postconditionStatus: "failed",
        postconditionFailure: "missing crafting table inventory",
        failureKind: "postcondition_failed"
      }
    ]
  })[0];

  const actions = buildProbeMatrixNextActions([missingGap, blockedGap, failedGap]);

  assert.deepEqual(actions.map((action) => action.kind), [
    "restore_environment",
    "run_fresh_live_probe",
    "fix_failed_probe"
  ]);
  assert.ok(actions.every((action) => action.priority === "P0"));
  assert.match(actions[0].command ?? "", /docker info/);
  assert.match(actions[1].command ?? "", /--init-actor-workspace baseline/);
  assert.match(actions[2].command ?? "", /--init-actor-workspace baseline/);
  assert.deepEqual(actions[0].skillIds, ["collectLogs"]);
  assert.equal(actions[2].skillId, "craftCraftingTable");
  assert.match(actions[2].reason, /missing crafting table inventory/);
});

test("action skill probe matrix next action uses manual port diagnostics for MC_PORT blockers", () => {
  const [testCase] = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs"],
    maxActions: 8
  });
  const [blockedGap] = buildProbeMatrixEvidenceGaps({
    cases: [testCase],
    preflight: { status: "environment_blocked", reason: "MC_PORT=32771 is not accepting connections" }
  });

  const [action] = buildProbeMatrixNextActions([blockedGap]);

  assert.equal(action.kind, "restore_environment");
  assert.equal(action.command, "lsof -nP -iTCP:32771 -sTCP:LISTEN");
});

test("action skill probe matrix skill statuses provide one row per case", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 8
  });
  const statuses = buildProbeMatrixSkillStatuses({
    cases,
    results: [
      {
        status: "passed",
        skillId: "collectLogs",
        actorId: "npc_b",
        contract: {
          skillId: "collectLogs",
          primitiveIds: ["observe", "collect_logs", "wait"],
          evidence: ["inventory delta"],
          protectedBy: ["test/collectLogs.test.ts"]
        },
        allowedPrimitives: ["observe", "collect_logs", "wait"],
        transcriptPath: "data/evidence/collect.json",
        finalWhy: "collect_4_logs completed with runtime inventory evidence",
        terminalStatus: "success",
        terminalWhy: "remembered runtime evidence",
        postconditionStatus: "passed"
      }
    ]
  });

  assert.deepEqual(statuses.map((entry) => entry.skillId), ["collectLogs", "craftCraftingTable"]);
  assert.equal(statuses[0].status, "passed");
  assert.equal(statuses[0].evidenceScope, "current_run");
  assert.equal(statuses[0].transcriptPath, "data/evidence/collect.json");
  assert.equal(statuses[0].terminalStatus, "success");
  assert.equal(statuses[0].postconditionStatus, "passed");
  assert.match(statuses[0].reason, /runtime inventory evidence/);
  assert.match(statuses[0].freshEvidenceCommand, /--skill collectLogs/);
  assert.equal(statuses[1].status, "pending_live_evidence");
  assert.equal(statuses[1].evidenceScope, "missing");
  assert.match(statuses[1].freshEvidenceCommand, /--skill craftCraftingTable/);
  assert.ok(statuses[1].requiredEvidence.postcondition.length > 0);
});

test("action skill probe matrix skill statuses mark all unrun cases as environment blocked after preflight failure", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 8
  });
  const statuses = buildProbeMatrixSkillStatuses({
    cases,
    preflight: {
      status: "environment_blocked",
      reason: "docker unavailable"
    },
    results: []
  });

  assert.deepEqual(statuses.map((entry) => entry.status), ["environment_blocked", "environment_blocked"]);
  assert.deepEqual(statuses.map((entry) => entry.evidenceScope), ["environment_blocked", "environment_blocked"]);
  assert.ok(statuses.every((entry) => entry.reason === "docker unavailable"));
  assert.ok(statuses.every((entry) => entry.freshEvidenceCommand.includes("--init-actor-workspace baseline")));
});

test("action skill probe matrix counts status rows for summary coverage", () => {
  const statuses: ProbeMatrixSkillStatus[] = [
    {
      skillId: "collectLogs",
      status: "passed",
      evidenceScope: "current_run",
      reason: "proved",
      requiredEvidence: {
        contract: [],
        postcondition: []
      },
      freshEvidenceCommand: "run collect"
    },
    {
      skillId: "craftPlanksAndSticks",
      status: "pending_live_evidence",
      evidenceScope: "missing",
      reason: "not run",
      requiredEvidence: {
        contract: [],
        postcondition: []
      },
      freshEvidenceCommand: "run craft"
    },
    {
      skillId: "craftCraftingTable",
      status: "failed",
      evidenceScope: "current_run",
      reason: "missing inventory",
      requiredEvidence: {
        contract: [],
        postcondition: []
      },
      freshEvidenceCommand: "run table"
    },
    {
      skillId: "inspectSharedChest",
      status: "environment_blocked",
      evidenceScope: "environment_blocked",
      reason: "docker unavailable",
      requiredEvidence: {
        contract: [],
        postcondition: []
      },
      freshEvidenceCommand: "run inspect"
    },
    {
      skillId: "depositSharedItems",
      status: "error",
      evidenceScope: "current_run",
      reason: "unexpected error",
      requiredEvidence: {
        contract: [],
        postcondition: []
      },
      freshEvidenceCommand: "run deposit"
    }
  ];

  assert.deepEqual(countProbeMatrixSkillStatuses(statuses), {
    passed: 1,
    failed: 1,
    error: 1,
    pendingLiveEvidence: 1,
    environmentBlocked: 1
  });
  assert.deepEqual(countProbeMatrixEvidenceScopes(statuses), {
    currentRun: 3,
    historicalTranscript: 0,
    missing: 1,
    environmentBlocked: 1
  });
});

test("action skill probe matrix audits existing transcript evidence without Docker", async () => {
  const evidenceDir = await mkdtemp(path.join(tmpdir(), "action-skill-matrix-evidence-"));
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 8
  });

  await writeFile(
    path.join(evidenceDir, "action_skill_probe_collectLogs-100.json"),
    JSON.stringify({
      metadata: {
        action_skill_probe: {
          actor_id: "npc_b",
          skill_id: "collectLogs"
        }
      },
      steps: [
        {
          tool: "collect_logs",
          result: {
            status: "blocked",
            beforeLogCount: 0,
            afterLogCount: 0
          }
        }
      ],
      final: {
        status: "failed",
        why: "old failed attempt"
      }
    })
  );
  await writeFile(
    path.join(evidenceDir, "action_skill_probe_collectLogs-200.json"),
    JSON.stringify({
      metadata: {
        action_skill_probe: {
          actor_id: "npc_b",
          skill_id: "collectLogs"
        }
      },
      steps: [
        {
          tool: "collect_logs",
          result: {
            status: "collected",
            beforeLogCount: 0,
            afterLogCount: 4,
            inventoryDelta: 4
          },
          verification: {
            status: "passed",
            progress: {
              itemNames: ["oak_log"],
              beforeCount: 0,
              afterCount: 4,
              targetCount: 4
            }
          }
        }
      ],
      final: {
        status: "success",
        why: "new passed attempt"
      }
    })
  );
  await writeFile(
    path.join(evidenceDir, "action_skill_probe_collectLogs-canonical-200.json"),
    JSON.stringify({
      final: {
        status: "success",
        why: "canonical payload is not a raw probe transcript"
      }
    })
  );

  const results = await auditExistingActionSkillEvidence({ evidenceDir, cases });
  const report = buildProbeMatrixReport({
    mode: "evidence_audit",
    actorId: "npc_b",
    maxActions: 8,
    cases,
    results,
    createdAt: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].status, "passed");
  assert.equal(results[0].skillId, "collectLogs");
  assert.equal(results[0].terminalStatus, "success");
  assert.equal(results[0].terminalWhy, "new passed attempt");
  assert.equal(results[0].postconditionStatus, "passed");
  assert.match(results[0].transcriptPath ?? "", /action_skill_probe_collectLogs-200\.json/);
  assert.equal(report.verdict, "incomplete");
  assert.equal(report.summary.passed, 1);
  assert.equal(report.summary.completed, 1);
  assert.deepEqual(report.summary.statusCounts, {
    passed: 1,
    failed: 0,
    error: 0,
    pendingLiveEvidence: 1,
    environmentBlocked: 0
  });
  assert.deepEqual(report.summary.evidenceScopeCounts, {
    currentRun: 0,
    historicalTranscript: 1,
    missing: 1,
    environmentBlocked: 0
  });
  assert.deepEqual(report.skillStatuses.map((entry) => entry.status), ["passed", "pending_live_evidence"]);
  assert.deepEqual(report.skillStatuses.map((entry) => entry.evidenceScope), ["historical_transcript", "missing"]);
  assert.equal(report.evidenceGaps.length, 1);
  assert.equal(report.evidenceGaps[0].skillId, "craftCraftingTable");
  assert.equal(report.evidenceGaps[0].status, "pending_live_evidence");
});

test("action skill probe matrix audits the latest transcript instead of hiding regressions behind older passes", async () => {
  const evidenceDir = await mkdtemp(path.join(tmpdir(), "action-skill-matrix-regression-"));
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs"],
    maxActions: 8
  });

  await writeFile(
    path.join(evidenceDir, "action_skill_probe_collectLogs-100.json"),
    JSON.stringify({
      metadata: {
        action_skill_probe: {
          actor_id: "npc_b",
          skill_id: "collectLogs"
        }
      },
      steps: [
        {
          tool: "collect_logs",
          result: { status: "collected" },
          verification: {
            status: "passed",
            progress: {
              itemNames: ["oak_log"],
              beforeCount: 0,
              afterCount: 4,
              targetCount: 4
            }
          }
        }
      ],
      final: {
        status: "success",
        why: "older passing attempt"
      }
    })
  );
  await writeFile(
    path.join(evidenceDir, "action_skill_probe_collectLogs-200.json"),
    JSON.stringify({
      metadata: {
        action_skill_probe: {
          actor_id: "npc_b",
          skill_id: "collectLogs"
        }
      },
      steps: [
        {
          tool: "collect_logs",
          result: {
            status: "collected",
            beforeLogCount: 0,
            afterLogCount: 0
          }
        }
      ],
      final: {
        status: "success",
        why: "newer optimistic attempt"
      }
    })
  );

  const results = await auditExistingActionSkillEvidence({ evidenceDir, cases });
  const report = buildProbeMatrixReport({
    mode: "evidence_audit",
    actorId: "npc_b",
    maxActions: 8,
    cases,
    results,
    createdAt: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].status, "failed");
  assert.equal(results[0].terminalStatus, "success");
  assert.equal(results[0].postconditionStatus, "failed");
  assert.equal(results[0].failureKind, "postcondition_failed");
  assert.match(results[0].transcriptPath ?? "", /action_skill_probe_collectLogs-200\.json/);
  assert.equal(report.verdict, "failed");
  assert.equal(report.evidenceGaps.length, 1);
  assert.equal(report.evidenceGaps[0].skillId, "collectLogs");
  assert.equal(report.evidenceGaps[0].evidenceScope, "historical_transcript");
  assert.equal(report.evidenceGaps[0].failureKind, "postcondition_failed");
});
