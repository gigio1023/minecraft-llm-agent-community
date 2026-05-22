import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildActorProviderContext } from "../src/provider/actorProviderContext.js";
import {
  createDefaultRelationshipEdge,
  createRelationshipEventRef
} from "../src/npc/relationships/relationshipLedger.js";
import { writeRelationshipEdge } from "../src/npc/relationships/relationshipStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("provider context includes relationship action pressure without granting tools", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `actor-provider-relationship-pressure-${process.pid}-${Date.now()}`
  );

  try {
    await writeRelationshipEdge(rootDir, {
      ...createDefaultRelationshipEdge("npc_a", "npc_b"),
      trust: "distrusted",
      obligation: "overdue",
      friction: "resentful",
      recent_events: [
        createRelationshipEventRef({
          id: "turn-0007-fake-progress",
          kind: "fake_progress_rejected",
          summary: "npc_b claimed a handoff without inventory evidence",
          evidence_refs: ["npc_a/evidence/turn-0007.json"],
          turn: 7
        })
      ]
    });

    const context = await buildActorProviderContext({
      actorWorkspaceRootDir: rootDir,
      actorId: "npc_a",
      activeActionSkills: []
    });
    const pressure = (
      context.relationship_pressures as Array<Record<string, unknown>>
    )[0];
    const relationship = (
      context.relationships as Array<{
        action_pressure: Record<string, unknown> | null;
      }>
    )[0];
    const goalStack = context.goal_stack as {
      relationship_goal?: Record<string, unknown>;
    };

    assert.equal(pressure.kind, "recovery_social_caution");
    assert.equal(pressure.priority, "urgent");
    assert.deepEqual(pressure.derived_from, {
      trust: "distrusted",
      obligation: "overdue",
      dependency: "independent",
      friction: "resentful",
      familiarity: "stranger"
    });
    assert.equal(pressure.action_boundary, "intent_pressure_only");
    assert.equal(pressure.active_action_skill_required, true);
    assert.equal(pressure.role_contract_boundary, "unchanged");
    assert.equal(Object.hasOwn(pressure, "allowed_tools"), false);
    assert.equal(relationship.action_pressure?.kind, "recovery_social_caution");
    assert.equal(goalStack.relationship_goal?.kind, "recover_from_failure");
    assert.equal(
      goalStack.relationship_goal?.source_pressure_kind,
      "recovery_social_caution"
    );
    assert.equal(goalStack.relationship_goal?.action_boundary, "intent_pressure_only");
    assert.equal(goalStack.relationship_goal?.active_action_skill_required, true);
    assert.equal(
      (context.rules as Record<string, unknown>).relationship_pressure_changes_intent_only,
      true
    );
    assert.equal(
      (context.rules as Record<string, unknown>).relationship_pressure_does_not_grant_tools,
      true
    );
    assert.equal((context.rules as Record<string, unknown>).active_action_skill_required, true);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
