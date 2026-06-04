/** Regression coverage for relationship ledger state transitions. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRelationshipEvent,
  createDefaultRelationshipEdge,
  createRelationshipEventRef,
  RELATIONSHIP_EVENT_KINDS,
  projectRelationshipScores,
  trustScore
} from "../src/npc/relationships/relationshipLedger.js";

test("default relationship edge starts from documented enum categories", () => {
  const edge = createDefaultRelationshipEdge("npc_a", "npc_b");

  assert.deepEqual(edge, {
    from_actor_id: "npc_a",
    to_actor_id: "npc_b",
    trust: "unproven",
    obligation: "none",
    dependency: "independent",
    friction: "none",
    familiarity: "stranger",
    recent_events: []
  });

  assert.deepEqual(projectRelationshipScores(edge), {
    trust_score: 0,
    obligation_score: 0,
    dependency_score: 0,
    friction_score: 0,
    familiarity_score: 0
  });
});

test("relationship event kinds expose the documented evidence categories", () => {
  assert.deepEqual([...RELATIONSHIP_EVENT_KINDS], [
    "resource_delivered",
    "shared_storage_updated",
    "request_made",
    "request_accepted",
    "request_ignored",
    "fake_progress_rejected",
    "verification_failed",
    "action_skill_promoted",
    "action_skill_retired",
    "helped_unblock_task",
    "took_shared_resource",
    "returned_shared_value"
  ]);
});

test("score helpers project from enum categories instead of storing freeform floats", () => {
  const edge = {
    ...createDefaultRelationshipEdge("npc_a", "npc_b"),
    trust: "reliable" as const,
    obligation: "accepted" as const,
    dependency: "blocked_by" as const,
    friction: "frustrated" as const,
    familiarity: "teammate" as const
  };

  assert.equal(trustScore(edge.trust), 3);
  assert.deepEqual(projectRelationshipScores(edge), {
    trust_score: 3,
    obligation_score: 2,
    dependency_score: 2,
    friction_score: 2,
    familiarity_score: 2
  });
});

test("request and delivery events move obligation and trust through evidence-backed states", () => {
  const requested = applyRelationshipEvent(
    createDefaultRelationshipEdge("npc_a", "npc_b"),
    event("e1", "request_made")
  );

  assert.equal(requested.obligation, "requested");
  assert.equal(requested.dependency, "helpful");
  assert.equal(requested.familiarity, "acquaintance");

  const accepted = applyRelationshipEvent(requested, event("e2", "request_accepted"));
  assert.equal(accepted.obligation, "accepted");

  const delivered = applyRelationshipEvent(accepted, event("e3", "resource_delivered"));
  assert.equal(delivered.trust, "reliable");
  assert.equal(delivered.obligation, "fulfilled");
  assert.equal(delivered.friction, "none");
  assert.equal(delivered.familiarity, "teammate");
});

test("storage update and action skill promotion can build repeated reliable evidence", () => {
  const afterStorage = applyRelationshipEvent(
    createDefaultRelationshipEdge("npc_a", "npc_b"),
    event("e1", "shared_storage_updated")
  );
  const afterPromotion = applyRelationshipEvent(
    afterStorage,
    event("e2", "action_skill_promoted")
  );

  assert.equal(afterStorage.trust, "reliable");
  assert.equal(afterPromotion.trust, "trusted");
  assert.equal(afterPromotion.familiarity, "teammate");
});

test("fake progress and verification failures degrade trust without claiming success", () => {
  const accepted = applyRelationshipEvent(
    applyRelationshipEvent(
      createDefaultRelationshipEdge("npc_a", "npc_b"),
      event("e1", "request_made")
    ),
    event("e2", "request_accepted")
  );

  const fakeProgress = applyRelationshipEvent(accepted, event("e3", "fake_progress_rejected"));
  assert.equal(fakeProgress.trust, "cautious");
  assert.equal(fakeProgress.obligation, "overdue");
  assert.equal(fakeProgress.friction, "annoyed");

  const failedAgain = applyRelationshipEvent(fakeProgress, event("e4", "verification_failed"));
  assert.equal(failedAgain.trust, "cautious");
  assert.equal(failedAgain.friction, "frustrated");

  const secondFakeProgress = applyRelationshipEvent(
    failedAgain,
    event("e5", "fake_progress_rejected")
  );
  assert.equal(secondFakeProgress.trust, "distrusted");
  assert.equal(secondFakeProgress.friction, "resentful");
});

test("helped_unblock_task resolves blocking dependency and repairs friction one step", () => {
  const blockedEdge = {
    ...createDefaultRelationshipEdge("npc_a", "npc_b"),
    trust: "cautious" as const,
    obligation: "overdue" as const,
    dependency: "critical_path" as const,
    friction: "frustrated" as const,
    familiarity: "teammate" as const
  };

  const helped = applyRelationshipEvent(blockedEdge, event("e1", "helped_unblock_task"));

  assert.equal(helped.trust, "reliable");
  assert.equal(helped.obligation, "fulfilled");
  assert.equal(helped.dependency, "helpful");
  assert.equal(helped.friction, "annoyed");
  assert.equal(helped.familiarity, "partner");
});

test("relationship events require durable evidence refs", () => {
  assert.throws(
    () =>
      createRelationshipEventRef({
        id: "e1",
        kind: "request_made",
        summary: "npc_a asked npc_b for logs",
        evidence_refs: []
      }),
    /require at least one evidence ref/
  );
});

function event(
  id: string,
  kind: Parameters<typeof createRelationshipEventRef>[0]["kind"]
) {
  return createRelationshipEventRef({
    id,
    kind,
    summary: `${kind} summary`,
    evidence_refs: [`data/actors/npc_b/evidence/${id}.json`],
    turn: Number(id.slice(1))
  });
}
