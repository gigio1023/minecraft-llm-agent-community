import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildDirectGeneratedObjectiveMemoryRecords,
  retrieveActorMemoryForObjective,
  writeDirectGeneratedObjectiveMemory,
  type ActorMemoryRecord
} from "../src/memory/actorMemory.js";
import type { DirectGeneratedObjectiveReport } from "../src/objectives/directGeneratedRunner.js";

const here = path.dirname(fileURLToPath(import.meta.url));

function baseReport(overrides: Partial<DirectGeneratedObjectiveReport> = {}): DirectGeneratedObjectiveReport {
  return {
    schema: "direct-generated-objective-report/v1",
    objectiveId: "craft_current_run_stone_axe_1",
    actorId: "npc_b",
    status: "passed",
    evidenceScope: "current_run",
    runId: "craft_current_run_stone_axe_1-npc_b-test",
    generated: {
      providerId: "openai-codex",
      model: "gpt-5.4-mini",
      sourcePath: "/tmp/generated.ts",
      execution: {
        status: "completed",
        actorId: "npc_b",
        skillName: "craftStoneAxe",
        sourcePath: "/tmp/generated.ts",
        helperEvents: [
          { name: "ensureItem", args: ["wooden_pickaxe", 1], status: "completed" },
          { name: "mineBlock", args: ["stone", "cobblestone", 3], status: "completed" },
          { name: "craftWithTable", args: ["stone_axe", 1], status: "completed" }
        ],
        durationMs: 1200,
        timeoutMs: 90000
      }
    },
    evidence: {
      preInventory: [],
      postInventory: [{ name: "stone_axe", count: 1 }],
      itemName: "stone_axe",
      beforeCount: 0,
      afterCount: 1,
      delta: 1,
      verifierStatus: "passed",
      verifierReason: "stone_axe reached 1/1 in current-run inventory."
    },
    artifactRefs: {
      actorWorkspaceTrialPath: "/tmp/report.json"
    },
    nextActions: [],
    ...overrides
  };
}

test("direct generated objective memory captures episode and procedural candidate", () => {
  const records = buildDirectGeneratedObjectiveMemoryRecords({
    report: baseReport(),
    now: "2026-05-23T00:00:00.000Z"
  });

  assert.equal(records.length, 2);
  assert.equal(records[0]?.layer, "episodic");
  assert.equal(records[0]?.kind, "direct_objective_episode");
  assert.equal(records[0]?.status, "active");
  assert.equal(records[1]?.layer, "procedural");
  assert.equal(records[1]?.kind, "action_skill_note");
  assert.equal(records[1]?.status, "candidate");
  assert.deepEqual(records[0]?.index.objective_ids, ["craft_current_run_stone_axe_1"]);
  assert.equal(records[0]?.index.item_names.includes("stone_axe"), true);
  assert.equal(records[1]?.index.diagnoses[0], "candidate_procedure_from_verified_direct_trial");
});

test("failed direct generated objective memory captures guardrail candidate", () => {
  const report = baseReport({
    status: "failed",
    generated: {
      ...baseReport().generated,
      execution: {
        ...baseReport().generated.execution,
        status: "skill_error",
        errorMessage: "failed to craft"
      }
    },
    evidence: {
      ...baseReport().evidence,
      postInventory: [],
      afterCount: 0,
      delta: 0,
      verifierStatus: "failed",
      verifierReason: "stone_axe did not reach 1."
    }
  });
  const records = buildDirectGeneratedObjectiveMemoryRecords({
    report,
    now: "2026-05-23T00:00:00.000Z"
  });

  assert.equal(records.length, 2);
  assert.equal(records[1]?.layer, "guardrail");
  assert.equal(records[1]?.kind, "blocker");
  assert.equal(records[1]?.status, "candidate");
  assert.equal(records[1]?.index.diagnoses.includes("inventory_no_delta"), true);
});

test("retrieves objective-scoped typed memory without using stale records", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `actor-memory-${process.pid}-${Date.now()}`
  );

  try {
    const paths = await writeDirectGeneratedObjectiveMemory({
      actorWorkspaceRootDir: rootDir,
      report: baseReport({
        artifactRefs: {
          actorWorkspaceTrialPath: path.join(
            rootDir,
            "npc_b/action-skills/direct-trials/report.json"
          )
        }
      }),
      now: "2026-05-23T00:00:00.000Z"
    });
    assert.equal(paths.length, 2);

    const stalePath = path.join(rootDir, "npc_b/memory/episodic/stale.json");
    const staleRecord: ActorMemoryRecord = {
      ...buildDirectGeneratedObjectiveMemoryRecords({
        report: baseReport({ runId: "stale-run" }),
        now: "2026-05-22T00:00:00.000Z"
      })[0]!,
      memory_id: "stale-run",
      status: "stale"
    };
    await fs.mkdir(path.dirname(stalePath), { recursive: true });
    await fs.writeFile(stalePath, JSON.stringify(staleRecord, null, 2));

    const packet = await retrieveActorMemoryForObjective(rootDir, "npc_b", {
      objectiveId: "craft_current_run_stone_axe_1",
      itemNames: ["stone_axe"],
      actionSkillIds: ["directGeneratedCraftStoneAxe"],
      limit: 8
    });

    assert.equal(packet.schema, "actor-memory-retrieval/v1");
    assert.equal(packet.retrieved_episodic.length, 1);
    assert.equal(packet.retrieved_procedural.length, 1);
    assert.equal(packet.retrieved_episodic[0]?.memory_id.includes("stale"), false);
    assert.equal(packet.retrieved_episodic[0]?.kind, "direct_objective_episode");
    assert.equal(packet.retrieved_episodic[0]?.reason.includes("objective:"), true);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("retrieval normalizes legacy memory records that do not yet have kind", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `actor-memory-legacy-${process.pid}-${Date.now()}`
  );

  try {
    const legacyPath = path.join(rootDir, "npc_b/memory/episodic/legacy.json");
    const record = buildDirectGeneratedObjectiveMemoryRecords({
      report: baseReport({ runId: "legacy-run" }),
      now: "2026-05-23T00:00:00.000Z"
    })[0]!;
    const legacyRecord = { ...record } as Partial<ActorMemoryRecord>;
    delete legacyRecord.kind;
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.writeFile(legacyPath, JSON.stringify(legacyRecord, null, 2));

    const packet = await retrieveActorMemoryForObjective(rootDir, "npc_b", {
      objectiveId: "craft_current_run_stone_axe_1",
      limit: 8
    });

    assert.equal(packet.retrieved_episodic[0]?.memory_id, "episode-legacy-run");
    assert.equal(packet.retrieved_episodic[0]?.kind, "direct_objective_episode");
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
