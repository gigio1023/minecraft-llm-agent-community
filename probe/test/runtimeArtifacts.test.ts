import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildFakeProgressRejectionEvidence,
  writeActorEvidenceRecord
} from "../src/runtime/evidence/actorEvidence.js";
import { writeProviderInputSnapshot } from "../src/provider/providerInputStore.js";
import { writeReviewerOutput } from "../src/reviewer/reviewerStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("writes actor-scoped fake-progress evidence with concrete missing deltas", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `runtime-artifacts-${process.pid}-${Date.now()}`
  );

  try {
    const evidence = buildFakeProgressRejectionEvidence({
      actor_id: "npc_b",
      turn_id: "turn-0001",
      target: "oak_log",
      pre_position: { x: 0, y: 64, z: 0 },
      post_position: { x: 8, y: 64, z: 8 },
      tool_attempt: { tool: "collect_logs", status: "pathing_started" },
      verifier_reason:
        "collect_4_logs saw no relevant inventory increase and no nearby log-block decrease.",
      missing_delta: {
        kind: "inventory_delta",
        item: "oak_log",
        before: 0,
        after: 0
      },
      created_at: "2026-05-20T00:00:00.000Z"
    });
    const filePath = await writeActorEvidenceRecord(rootDir, evidence);
    const stored = JSON.parse(await fs.readFile(filePath, "utf8"));

    assert.equal(stored.schema, "actor-evidence/v1");
    assert.equal(stored.category, "fake_progress_rejection");
    assert.equal(stored.actor_id, "npc_b");
    assert.equal(stored.target, "oak_log");
    assert.deepEqual(stored.missing_delta, {
      kind: "inventory_delta",
      item: "oak_log",
      before: 0,
      after: 0
    });
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("provider input snapshots reject credential-shaped payloads", async () => {
  await assert.rejects(
    () =>
      writeProviderInputSnapshot("/tmp/unused", {
        schema: "provider-input-snapshot/v1",
        snapshot_id: "turn-0001",
        actor_id: "npc_b",
        turn_id: "turn-0001",
        provider_id: "openai-codex",
        model: "gpt-5.4-mini",
        created_at: "2026-05-20T00:00:00.000Z",
        input: {
          authorization: "Bearer secret",
          prompt: "collect logs"
        }
      }),
    /credential-like key authorization/
  );
});

test("writes provider snapshots and reviewer outputs into actor workspace paths", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `provider-reviewer-${process.pid}-${Date.now()}`
  );

  try {
    const snapshotPath = await writeProviderInputSnapshot(rootDir, {
      schema: "provider-input-snapshot/v1",
      snapshot_id: "turn-0003",
      actor_id: "npc_b",
      turn_id: "turn-0003",
      provider_id: "openai-codex",
      model: "gpt-5.4-mini",
      created_at: "2026-05-20T00:00:00.000Z",
      input: {
        prompt: "collect logs",
        allowed_tools: ["observe", "collect_logs"]
      },
      active_action_skills: ["collectLogs"]
    });
    const reviewPath = await writeReviewerOutput(rootDir, {
      schema: "actor-review/v1",
      review_id: "review-0001",
      actor_id: "npc_b",
      created_at: "2026-05-20T00:00:00.000Z",
      input_refs: [snapshotPath],
      findings: [
        {
          severity: "p1",
          title: "fake progress",
          body: "The actor moved away from the target without inventory or block delta evidence."
        }
      ],
      candidate_proposals: [],
      active_mutation: "forbidden"
    });

    assert.equal(
      path.relative(rootDir, snapshotPath),
      path.join("npc_b", "provider-inputs", "turn-0003.json")
    );
    assert.equal(
      path.relative(rootDir, reviewPath),
      path.join("npc_b", "reviews", "review-0001.json")
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
