/** Regression coverage for direct objective evaluation artifacts. */
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { evaluateObjectiveTranscript } from "../src/objectives/evaluator.js";

async function writeTranscript(payload: unknown) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "objective-eval-"));
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "transcript.json");
  await writeFile(file, JSON.stringify(payload, null, 2));
  return file;
}

test("objective evaluator passes only current-run collect_logs inventory delta", async () => {
  const transcriptPath = await writeTranscript({
    steps: [
      {
        actor: "npc_b",
        tool: "collect_logs",
        args: { targetCount: 4 },
        result: {
          status: "collected",
          beforeLogCount: 0,
          afterLogCount: 4,
          inventoryDelta: 4
        },
        verification: {
          status: "passed",
          reason: "collect_4_logs reached 4/4 relevant inventory items.",
          progress: {
            beforeCount: 0,
            afterCount: 4,
            toolInventoryDelta: 4
          }
        }
      }
    ]
  });

  const report = await evaluateObjectiveTranscript({
    objectiveId: "collect_current_run_oak_log_1",
    transcriptPath
  });

  assert.equal(report.status, "passed");
  assert.equal(report.evidence.delta, 4);
  assert.equal(report.findings.some((finding) => finding.kind === "evidence" && finding.status === "passed"), true);
});

test("objective evaluator rejects remember-only fake success", async () => {
  const transcriptPath = await writeTranscript({
    steps: [
      {
        actor: "npc_b",
        tool: "remember",
        args: { note: "I collected logs already." },
        result: { status: "remembered", ok: true }
      }
    ],
    final: { status: "success", why: "npc_b said done" }
  });

  const report = await evaluateObjectiveTranscript({
    objectiveId: "collect_current_run_oak_log_1",
    transcriptPath
  });

  assert.equal(report.status, "failed");
  assert.equal(
    report.findings.some((finding) => finding.kind === "evidence" && finding.status === "failed"),
    true
  );
});

test("objective evaluator detects repeated observe loop", async () => {
  const transcriptPath = await writeTranscript({
    steps: [
      { actor: "npc_b", tool: "observe", result: { status: "ok" } },
      { actor: "npc_b", tool: "observe", result: { status: "ok" } }
    ]
  });

  const report = await evaluateObjectiveTranscript({
    objectiveId: "collect_current_run_oak_log_1",
    transcriptPath
  });

  assert.equal(report.status, "failed");
  assert.equal(
    report.findings.some((finding) => finding.kind === "proposal" && finding.status === "failed"),
    true
  );
});
