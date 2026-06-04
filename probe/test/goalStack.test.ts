/** Regression coverage for NPC goal stack state behavior. */
import assert from "node:assert/strict";
import test from "node:test";

import { buildActorGoalStack } from "../src/npc/goals/goalStack.js";
import { getActorProfile } from "../src/npc/profiles.js";
import {
  createDefaultRelationshipEdge,
  createRelationshipEventRef
} from "../src/npc/relationships/relationshipLedger.js";

test("goal stack exposes relationship-derived action context as a gated goal", () => {
  const goalStack = buildActorGoalStack({
    actorProfile: getActorProfile("npc_a"),
    relationshipEdges: [
      {
        ...createDefaultRelationshipEdge("npc_a", "npc_b"),
        trust: "distrusted",
        obligation: "overdue",
        friction: "resentful",
        recent_events: [
          createRelationshipEventRef({
            id: "turn-0003-relationship",
            kind: "fake_progress_rejected",
            summary: "npc_b claimed progress without verified logs",
            evidence_refs: ["npc_a/evidence/turn-0003.json"],
            turn: 3
          })
        ]
      }
    ]
  });

  assert.equal(goalStack.relationship_goal?.kind, "recover_from_failure");
  assert.equal(goalStack.relationship_goal?.priority, "urgent");
  assert.equal(goalStack.relationship_goal?.target_actor_id, "npc_b");
  assert.equal(
    goalStack.relationship_goal?.source_context_signal_kind,
    "recovery_social_caution"
  );
  assert.equal(goalStack.relationship_goal?.action_boundary, "intent_context_only");
  assert.equal(goalStack.relationship_goal?.active_action_skill_required, true);
  assert.equal(goalStack.relationship_goal?.role_contract_boundary, "unchanged");
  assert.deepEqual(goalStack.relationship_goal?.evidence_refs, [
    "npc_a/evidence/turn-0003.json"
  ]);
});
