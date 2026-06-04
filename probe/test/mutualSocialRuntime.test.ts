/** Regression coverage for legacy mutual social runtime behavior. */
import assert from "node:assert/strict";
import test from "node:test";

import { createMutualRuntimeState } from "../src/mutual/runtimeState.js";

test("mutual runtime social context tracks thread state, mailbox, and bounded hostile context", () => {
  const state = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper",
    socialContextEnabled: true
  });

  state.setCurrentTask("npc_a", "deposit_shared_materials");
  state.recordUtterance({
    actorId: "npc_a",
    targetId: "npc_b",
    text: "Jun, take the crafting table to the shared chest."
  });
  state.markDroppedItem("npc_a", "paper");
  state.beginTurn("npc_b");
  state.recordObservation("npc_b", {
    visibleActors: [{ id: "npc_a", distance: 2 }]
  });
  state.recordToolResult("npc_b", {
    tool: "wait",
    ok: true,
    status: "waited"
  });

  const social = state.socialContext("npc_b");

  assert.equal(social?.role?.roleId, "gatherer");
  assert.equal(social?.mailbox[0]?.kind, "task_handoff");
  assert.equal(social?.mailbox[0]?.payload.taskId, "deposit_shared_materials");
  assert.equal(social?.hostileAlert?.action, "move_to");
  assert.equal(social?.thread.turn, 1);
  assert.equal(social?.thread.lastResult?.status, "waited");
});
