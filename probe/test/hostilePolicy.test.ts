/** Regression coverage for hostile-role policy context. */
import assert from "node:assert/strict";
import test from "node:test";

import { decideHostileAction } from "../src/npc/hostile/hostilePolicy.js";

test("hostile policy allows one bounded hostile move and blocks invalid escalation", () => {
  assert.deepEqual(
    decideHostileAction({
      actorRole: "hostile",
      targetId: "npc_a",
      targetDistance: 4,
      homeDistance: 3,
      engagementTicks: 1,
      health: 20,
      allowedTargetIds: ["npc_a"]
    }),
    { action: "move_to", targetId: "npc_a" }
  );

  assert.deepEqual(
    decideHostileAction({
      actorRole: "gatherer",
      targetId: "npc_a",
      targetDistance: 4,
      homeDistance: 3,
      engagementTicks: 1,
      health: 20,
      allowedTargetIds: ["npc_a"]
    }),
    { action: "blocked", reason: "only the hostile role can use hostile policy" }
  );

  assert.deepEqual(
    decideHostileAction({
      actorRole: "hostile",
      targetId: "npc_a",
      targetDistance: 4,
      homeDistance: 20,
      engagementTicks: 1,
      health: 20,
      allowedTargetIds: ["npc_a"]
    }),
    { action: "retreat", reason: "hostile actor exceeded its home radius" }
  );

  assert.deepEqual(
    decideHostileAction({
      actorRole: "hostile",
      targetId: "npc_a",
      targetDistance: 4,
      homeDistance: 3,
      engagementTicks: 5,
      health: 20,
      allowedTargetIds: ["npc_a"]
    }),
    { action: "retreat", reason: "hostile engagement timeout reached" }
  );

  assert.deepEqual(
    decideHostileAction({
      actorRole: "hostile",
      targetId: "npc_a",
      targetDistance: 4,
      homeDistance: 3,
      engagementTicks: 1,
      health: 4,
      allowedTargetIds: ["npc_a"]
    }),
    { action: "retreat", reason: "hostile actor is below retreat health threshold" }
  );
});
