import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveRelationshipActionPressure,
  selectDominantRelationshipActionPressure
} from "../src/npc/relationships/actionPressure.js";
import {
  createDefaultRelationshipEdge,
  createRelationshipEventRef,
  type RelationshipEdge
} from "../src/npc/relationships/relationshipLedger.js";

test("relationship pressure is derived from relationship enums, not personality floats", () => {
  const pressure = deriveRelationshipActionPressure({
    ...edge("npc_a", "npc_b"),
    trust: "distrusted",
    obligation: "overdue",
    friction: "resentful"
  });

  assert.equal(pressure?.kind, "recovery_social_caution");
  assert.equal(pressure?.priority, "urgent");
  assert.deepEqual(pressure?.derived_from, {
    trust: "distrusted",
    obligation: "overdue",
    dependency: "independent",
    friction: "resentful",
    familiarity: "stranger"
  });
  assert.equal(pressure?.action_boundary, "intent_pressure_only");
  assert.equal(pressure?.active_action_skill_required, true);
  assert.equal(pressure?.role_contract_boundary, "unchanged");
  assert.equal(hasNumericProjection(pressure), false);
});

test("fulfilled reliable relationships produce cooperative confidence pressure", () => {
  const pressure = deriveRelationshipActionPressure({
    ...edge("npc_a", "npc_b"),
    trust: "reliable",
    obligation: "fulfilled",
    friction: "none"
  });

  assert.equal(pressure?.kind, "cooperative_confidence");
  assert.equal(pressure?.priority, "background");
  assert.equal(pressure?.target_actor_id, "npc_b");
});

test("dominant relationship pressure prefers blocking obligations over background confidence", () => {
  const dominant = selectDominantRelationshipActionPressure([
    deriveRelationshipActionPressure({
      ...edge("npc_a", "npc_b"),
      trust: "trusted",
      obligation: "fulfilled",
      friction: "none"
    }),
    deriveRelationshipActionPressure({
      ...edge("npc_a", "npc_c"),
      obligation: "accepted",
      dependency: "critical_path"
    })
  ].filter((pressure) => pressure !== null));

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
