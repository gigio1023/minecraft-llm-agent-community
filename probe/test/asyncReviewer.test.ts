import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  enqueueActorReviewJob,
  runQueuedActorReviewJobs
} from "../src/reviewer/reviewerQueue.js";
import { getActorWorkspacePaths } from "../src/runtime/actorWorkspacePaths.js";
import { writeActorEvidenceRecord } from "../src/runtime/evidence/actorEvidence.js";
import { writeActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("queues per-actor reviewer jobs over actor-scoped immutable artifact refs", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `async-reviewer-queue-${process.pid}-${Date.now()}`
  );

  try {
    const evidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "verification-failure-turn-0001-collect_logs",
      actor_id: "npc_a",
      category: "verification_failure",
      created_at: "2026-05-20T00:00:00.000Z",
      turn_id: "turn-0001",
      target: "oak_log",
      verifier_reason: "inventory and block evidence did not improve"
    });
    await writeActorActionSkillRecord(
      rootDir,
      testActionSkillRecord("collectLogs", ["observe", "collect_logs"], "npc_a")
    );

    const jobPath = await enqueueActorReviewJob(rootDir, {
      schema: "actor-review-job/v1",
      job_id: "review-job-0001",
      actor_id: "npc_a",
      reason: "verification_failure",
      created_at: "2026-05-20T00:00:01.000Z",
      input_refs: [{ kind: "evidence", ref: evidencePath }],
      active_action_skill_snapshot: [
        {
          skill_id: "collectLogs",
          status: "active",
          required_primitives: ["observe", "collect_logs"]
        }
      ]
    });

    const paths = getActorWorkspacePaths(rootDir, "npc_a");
    assert.equal(
      path.relative(rootDir, jobPath),
      path.join("npc_a", "reviews", "queue", "review-job-0001.json")
    );

    const stored = JSON.parse(await fs.readFile(jobPath, "utf8"));
    assert.equal(stored.schema, "actor-review-job/v1");
    assert.equal(stored.actor_id, "npc_a");
    assert.deepEqual(stored.input_refs, [{ kind: "evidence", ref: evidencePath }]);
    await fs.access(path.join(paths.actionSkills.activeDir, "collectLogs.json"));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("reviewer job refs cannot point at another actor workspace", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `async-reviewer-ref-guard-${process.pid}-${Date.now()}`
  );

  try {
    const otherEvidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "verification-failure-turn-0001-collect_logs",
      actor_id: "npc_b",
      category: "verification_failure",
      created_at: "2026-05-20T00:00:00.000Z",
      turn_id: "turn-0001"
    });

    await assert.rejects(
      () =>
        enqueueActorReviewJob(rootDir, {
          schema: "actor-review-job/v1",
          job_id: "review-job-0002",
          actor_id: "npc_a",
          reason: "verification_failure",
          created_at: "2026-05-20T00:00:01.000Z",
          input_refs: [{ kind: "evidence", ref: otherEvidencePath }],
          active_action_skill_snapshot: []
        }),
      /must stay under npc_a evidence artifacts/
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("deterministic reviewer runner writes actor reviews without active skill mutation", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `async-reviewer-runner-${process.pid}-${Date.now()}`
  );

  try {
    const evidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "fake-progress-turn-0001-collect_logs",
      actor_id: "npc_a",
      category: "fake_progress_rejection",
      created_at: "2026-05-20T00:00:00.000Z",
      turn_id: "turn-0001",
      target: "oak_log",
      verifier_reason: "actor swung but did not change inventory or blocks"
    });
    const activePath = await writeActorActionSkillRecord(
      rootDir,
      testActionSkillRecord("collectLogs", ["observe", "collect_logs"], "npc_a")
    );
    const beforeActive = await fs.readFile(activePath, "utf8");

    await enqueueActorReviewJob(rootDir, {
      schema: "actor-review-job/v1",
      job_id: "review-job-0003",
      actor_id: "npc_a",
      reason: "fake_progress_rejection",
      created_at: "2026-05-20T00:00:01.000Z",
      input_refs: [{ kind: "evidence", ref: evidencePath }],
      active_action_skill_snapshot: [
        {
          skill_id: "collectLogs",
          status: "active",
          required_primitives: ["observe", "collect_logs"]
        }
      ]
    });

    const results = await runQueuedActorReviewJobs(rootDir, "npc_a", {
      now: () => "2026-05-20T00:00:02.000Z"
    });

    assert.equal(results.length, 1);
    assert.equal(
      path.relative(rootDir, results[0].reviewPath),
      path.join("npc_a", "reviews", "review-for-review-job-0003.json")
    );

    const review = JSON.parse(await fs.readFile(results[0].reviewPath, "utf8"));
    assert.equal(review.schema, "actor-review/v1");
    assert.equal(review.actor_id, "npc_a");
    assert.equal(review.active_mutation, "forbidden");
    assert.match(review.findings[0].title, /fake progress/i);
    assert.equal(review.candidate_proposals.length, 1);
    assert.equal(
      path.relative(rootDir, review.candidate_proposals[0]),
      path.join("npc_a", "action-skills", "candidates", "proposal-review-job-0003.json")
    );
    const proposal = JSON.parse(await fs.readFile(review.candidate_proposals[0], "utf8"));
    assert.equal(proposal.schema, "action-skill-proposal/v1");
    assert.equal(proposal.owner_actor_id, "npc_a");
    assert.equal(proposal.status, "draft");
    assert.deepEqual(proposal.evidence_refs, [evidencePath]);
    assert.equal(await fs.readFile(activePath, "utf8"), beforeActive);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
