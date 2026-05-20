import assert from "node:assert/strict";
import { test } from "bun:test";

import { createTurnPhasedMailbox } from "../src/runtime/mailbox/turnPhasedMailbox.js";
import { createAgentThreadState } from "../src/runtime/threads/agentThreadState.js";

test("turn-phased mailbox exposes only pre-turn mail and defers late mail to the next turn", () => {
  const mailbox = createTurnPhasedMailbox();

  mailbox.enqueue({
    id: "m1",
    from: "npc_a",
    to: "npc_b",
    turnSent: 0,
    kind: "task_handoff",
    payload: { taskId: "deposit_shared_materials" }
  });

  mailbox.beginTurn("npc_b");
  assert.deepEqual(mailbox.visible("npc_b").map((item) => item.id), ["m1"]);

  mailbox.enqueue({
    id: "m2",
    from: "npc_a",
    to: "npc_b",
    turnSent: 1,
    kind: "warning",
    payload: { text: "hostile seen" }
  });

  assert.deepEqual(mailbox.visible("npc_b").map((item) => item.id), ["m1"]);
  assert.deepEqual(mailbox.consume("npc_b").map((item) => item.id), ["m1"]);
  mailbox.beginTurn("npc_b");
  assert.deepEqual(mailbox.visible("npc_b").map((item) => item.id), ["m2"]);
});

test("agent thread records observations, results, working memory, and inbound or outbound mail", () => {
  const thread = createAgentThreadState({
    threadId: "thread:npc_b",
    agentId: "npc_b",
    roleId: "crafter"
  });

  thread.beginTurn();
  thread.setCurrentTask("craft_planks_and_sticks");
  thread.setActiveAction("craft_item");
  thread.recordObservation({ inventory: [{ name: "oak_log", count: 4 }] });
  thread.recordResult({ status: "crafted", itemName: "oak_planks" });
  thread.updateWorkingMemory({ nextIntendedAction: "craft stick" });
  thread.remember("crafted planks from shared logs");
  thread.recordInboundMail({
    id: "m1",
    from: "npc_a",
    to: "npc_b",
    turnSent: 1,
    kind: "task_handoff",
    payload: { taskId: "craft_planks_and_sticks" }
  });

  assert.deepEqual(thread.snapshot(), {
    threadId: "thread:npc_b",
    agentId: "npc_b",
    roleId: "crafter",
    turn: 1,
    currentTask: "craft_planks_and_sticks",
    activeAction: "craft_item",
    lastObservation: { inventory: [{ name: "oak_log", count: 4 }] },
    lastResult: { status: "crafted", itemName: "oak_planks" },
    privateMemory: ["crafted planks from shared logs"],
    workingMemory: {
      currentTask: "craft_planks_and_sticks",
      currentBlocker: null,
      currentPromise: null,
      nextIntendedAction: "craft stick"
    },
    outboundMail: [],
    inboundMail: [
      {
        id: "m1",
        from: "npc_a",
        to: "npc_b",
        turnSent: 1,
        kind: "task_handoff",
        payload: { taskId: "craft_planks_and_sticks" }
      }
    ]
  });
});
