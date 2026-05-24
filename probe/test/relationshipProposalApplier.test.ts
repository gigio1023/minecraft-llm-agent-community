import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyCycleJudgmentRelationshipEventProposals,
  applyReviewerRelationshipEventProposals
} from "../src/reviewer/relationshipProposalApplier.js";
import {
  readRelationshipEdge,
  writeRelationshipEdge
} from "../src/npc/relationships/relationshipStore.js";
import { writeActorEvidenceRecord } from "../src/runtime/evidence/actorEvidence.js";
import type { ActorReviewOutput } from "../src/reviewer/reviewerStore.js";
import {
  applyRelationshipEvent,
  createRelationshipEventRef,
  createDefaultRelationshipEdge
} from "../src/npc/relationships/relationshipLedger.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("applies reviewer relationship proposals through guarded directional edges", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `relationship-proposal-applier-${process.pid}-${Date.now()}`
  );

  try {
    await writeActorFiles(rootDir, ["npc_a", "npc_b"]);
    const evidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "fake-progress-turn-0001-collect_logs",
      actor_id: "npc_b",
      category: "fake_progress_rejection",
      created_at: "2026-05-21T00:00:00.000Z",
      turn_id: "turn-0001",
      verifier_reason: "no log inventory delta"
    });
    const review = reviewWithRelationshipProposal(evidencePath);

    const first = await applyReviewerRelationshipEventProposals(rootDir, review);
    const second = await applyReviewerRelationshipEventProposals(rootDir, review);
    const edge = await readRelationshipEdge(rootDir, "npc_a", "npc_b");

    assert.equal(first[0]?.status, "applied");
    assert.equal(second[0]?.status, "already_applied");
    assert.equal(edge.trust, "cautious");
    assert.equal(edge.friction, "annoyed");
    assert.deepEqual(
      edge.recent_events.map((event) => event.kind),
      ["fake_progress_rejected"]
    );
    assert.deepEqual(edge.recent_events[0]?.evidence_refs, [evidencePath]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("rejects relationship proposals with self-targets or cross-actor evidence refs", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `relationship-proposal-guard-${process.pid}-${Date.now()}`
  );

  try {
    await writeActorFiles(rootDir, ["npc_a", "npc_b", "npc_c"]);
    const otherEvidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "fake-progress-turn-0001-collect_logs",
      actor_id: "npc_c",
      category: "fake_progress_rejection",
      created_at: "2026-05-21T00:00:00.000Z",
      turn_id: "turn-0001"
    });

    await assert.rejects(
      () =>
        applyReviewerRelationshipEventProposals(rootDir, {
          ...reviewWithRelationshipProposal(otherEvidencePath),
          relationship_event_proposals: [
            {
              kind: "fake_progress_rejected",
              target_actor_id: "npc_b",
              summary: "self edge must not be produced",
              evidence_refs: [otherEvidencePath]
            }
          ]
        }),
      /cannot target the reviewed actor itself/
    );

    await assert.rejects(
      () =>
        applyReviewerRelationshipEventProposals(
          rootDir,
          reviewWithRelationshipProposal(otherEvidencePath)
        ),
      /must stay under npc_b evidence, provider input, or review artifacts/
    );

    await assert.rejects(
      () =>
        applyReviewerRelationshipEventProposals(rootDir, {
          ...reviewWithRelationshipProposal(otherEvidencePath),
          relationship_event_proposals: [
            {
              kind: "fake_progress_rejected",
              target_actor_id: "../npc_a",
              summary: "path-like actor IDs must not be accepted",
              evidence_refs: [otherEvidencePath]
            }
          ]
        }),
      /actor id is not workspace-safe/
    );

    await assert.rejects(
      () =>
        applyReviewerRelationshipEventProposals(rootDir, {
          ...reviewWithRelationshipProposal(otherEvidencePath),
          relationship_event_proposals: [
            {
              kind: "fake_progress_rejected",
              target_actor_id: "npc_missing",
              summary: "unknown actor IDs must not create new workspaces",
              evidence_refs: [otherEvidencePath]
            }
          ]
        }),
      /ENOENT/
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("relationship proposal idempotence survives truncated recent event windows", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `relationship-proposal-marker-${process.pid}-${Date.now()}`
  );

  try {
    await writeActorFiles(rootDir, ["npc_a", "npc_b"]);
    const evidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "fake-progress-turn-0001-collect_logs",
      actor_id: "npc_b",
      category: "fake_progress_rejection",
      created_at: "2026-05-21T00:00:00.000Z",
      turn_id: "turn-0001"
    });
    const review = reviewWithRelationshipProposal(evidencePath);

    await applyReviewerRelationshipEventProposals(rootDir, review);
    let edge = await readRelationshipEdge(rootDir, "npc_a", "npc_b");
    for (let index = 0; index < 13; index += 1) {
      edge = applyRelationshipEvent(
        edge,
        createRelationshipEventRef({
          id: `later-${index}`,
          kind: "request_made",
          summary: "later relationship traffic",
          evidence_refs: [evidencePath]
        })
      );
    }
    await writeRelationshipEdge(rootDir, edge);

    const second = await applyReviewerRelationshipEventProposals(rootDir, review);
    const after = await readRelationshipEdge(rootDir, "npc_a", "npc_b");

    assert.equal(second[0]?.status, "already_applied");
    assert.equal(
      after.recent_events.filter((event) => event.id.includes("fake-progress-turn-0001")).length,
      0
    );
    assert.deepEqual(after.recent_events.map((event) => event.id), edge.recent_events.map((event) => event.id));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("cycle judgment relationship proposals accept actor-relative evidence refs", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `relationship-cycle-relative-${process.pid}-${Date.now()}`
  );

  try {
    await writeActorFiles(rootDir, ["npc_a", "npc_b"]);
    const evidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "cycle-0001-say",
      actor_id: "npc_b",
      category: "tool_attempt",
      created_at: "2026-05-21T00:00:00.000Z",
      turn_id: "cycle-0001-action-01"
    });
    const actorRelativeEvidenceRef = path.relative(path.join(rootDir, "npc_b"), evidencePath);

    const result = await applyCycleJudgmentRelationshipEventProposals(rootDir, {
      schema: "cycle-judgment/v1",
      actor_id: "npc_b",
      cycle_id: "cycle-0001",
      cycle_goal_id: "g1",
      outcome: "socially_resolved",
      what_happened: "npc_b helped unblock npc_a",
      why_it_mattered_for_life_goal: "Trust changed through runtime evidence",
      verifier_status: "not_applicable",
      evidence_refs: [actorRelativeEvidenceRef],
      memory_writes: [],
      relationship_event_proposals: [
        {
          target_actor_id: "npc_a",
          kind: "helped",
          evidence_refs: [actorRelativeEvidenceRef]
        }
      ],
      next_goal_pressure: []
    });

    const edge = await readRelationshipEdge(rootDir, "npc_a", "npc_b");

    assert.equal(result[0]?.status, "applied");
    assert.equal(edge.recent_events[0]?.kind, "helped_unblock_task");
    assert.deepEqual(edge.recent_events[0]?.evidence_refs, [evidencePath]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

function reviewWithRelationshipProposal(evidencePath: string): ActorReviewOutput {
  return {
    schema: "actor-review/v1",
    review_id: "review-for-fake-progress-turn-0001",
    actor_id: "npc_b",
    created_at: "2026-05-21T00:00:01.000Z",
    input_refs: [evidencePath],
    findings: [
      {
        severity: "p1",
        title: "Fake progress",
        body: "The actor claimed progress without inventory evidence."
      }
    ],
    candidate_proposals: [],
    relationship_event_proposals: [
      {
        kind: "fake_progress_rejected",
        target_actor_id: "npc_a",
        summary: "npc_b claimed log progress without inventory evidence.",
        evidence_refs: [evidencePath]
      }
    ],
    active_mutation: "forbidden"
  };
}

async function writeActorFiles(rootDir: string, actorIds: readonly string[]) {
  await Promise.all(
    actorIds.map(async (actorId) => {
      const actorDir = path.join(rootDir, actorId);
      await fs.mkdir(actorDir, { recursive: true });
      await fs.writeFile(
        path.join(actorDir, "actor.json"),
        JSON.stringify({ schema: "actor-workspace/v1", actor_id: actorId }),
        "utf8"
      );
    })
  );
}
