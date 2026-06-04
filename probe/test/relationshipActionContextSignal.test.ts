/** Regression coverage for relationship-derived action context signals. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveRelationshipActionContextSignal,
  selectDominantRelationshipActionContextSignal
} from "../src/npc/relationships/actionContextSignal.js";
import {
  createDefaultRelationshipEdge,
  createRelationshipEventRef,
  type RelationshipEdge
} from "../src/npc/relationships/relationshipLedger.js";

test("relationship context signal is derived from relationship enums, not personality floats", () => {
  const signal = deriveRelationshipActionContextSignal({
    ...edge("npc_a", "npc_b"),
    trust: "distrusted",
    obligation: "overdue",
    friction: "resentful"
  });

  assert.equal(signal?.kind, "recovery_social_caution");
  assert.equal(signal?.priority, "urgent");
  assert.deepEqual(signal?.derived_from, {
    trust: "distrusted",
    obligation: "overdue",
    dependency: "independent",
    friction: "resentful",
    familiarity: "stranger"
  });
  assert.equal(signal?.action_boundary, "intent_context_only");
  assert.equal(signal?.active_action_skill_required, true);
  assert.equal(signal?.role_contract_boundary, "unchanged");
  assert.equal(hasNumericProjection(signal), false);
});

test("fulfilled reliable relationships produce cooperative confidence context", () => {
  const signal = deriveRelationshipActionContextSignal({
    ...edge("npc_a", "npc_b"),
    trust: "reliable",
    obligation: "fulfilled",
    friction: "none"
  });

  assert.equal(signal?.kind, "cooperative_confidence");
  assert.equal(signal?.priority, "background");
  assert.equal(signal?.target_actor_id, "npc_b");
});

test("dominant relationship context signal prefers blocking obligations over background confidence", () => {
  const dominant = selectDominantRelationshipActionContextSignal([
    deriveRelationshipActionContextSignal({
      ...edge("npc_a", "npc_b"),
      trust: "trusted",
      obligation: "fulfilled",
      friction: "none"
    }),
    deriveRelationshipActionContextSignal({
      ...edge("npc_a", "npc_c"),
      obligation: "accepted",
      dependency: "critical_path"
    })
  ].filter((signal) => signal !== null));

  assert.equal(dominant?.kind, "obligation_repair");
  assert.equal(dominant?.priority, "blocking");
  assert.equal(dominant?.target_actor_id, "npc_c");
});

function edge(fromActorId: string, toActorId: string): RelationshipEdge {
  return {
    ...createDefaultRelationshipEdge(fromActorId, toActorId),
    recent_events: [
      createRelationshipEventRef({
        id: `${fromActorId}-${toActorId}-evidence`,
        kind: "request_made",
        summary: `${fromActorId} relationship event for ${toActorId}`,
        evidence_refs: [`${fromActorId}/evidence/turn-0001.json`],
        turn: 1
      })
    ]
  };
}

function hasNumericProjection(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).some(
    ([key, entry]) =>
      typeof entry === "number" ||
      key.endsWith("_score") ||
      hasNumericProjection(entry)
  );
}
