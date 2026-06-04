/** Regression coverage for social obligation routing context. */
import assert from "node:assert/strict";
import test from "node:test";

import { routeObligationContextSignals } from "../src/npc/social/obligationRouter.js";

test("obligation router generates blocked_teammate context signal from bulletin entries", () => {
  const contextSignals = routeObligationContextSignals({
    actorId: "npc_a",
    roleId: "gatherer",
    bulletinEntries: [
      {
        actorId: "npc_b",
        roleId: "crafter",
        currentTask: "craft_planks",
        currentBlocker: "waiting for logs from shared storage",
        updatedAt: 3
      }
    ],
    pendingMail: [],
    turn: 4
  });

  const blocked = contextSignals.find((p) => p.kind === "blocked_teammate");
  assert.ok(blocked, "should detect blocked crafter waiting for logs");
  assert.equal(blocked!.relatedActorId, "npc_b");
  assert.ok(blocked!.summary.includes("npc_b"));
});

test("obligation router generates shared_shortage when chest is below threshold", () => {
  const contextSignals = routeObligationContextSignals({
    actorId: "npc_a",
    roleId: "quartermaster",
    bulletinEntries: [],
    pendingMail: [],
    sharedChestItems: [{ name: "oak_log", count: 2 }],
    turn: 5
  });

  const shortage = contextSignals.find((p) => p.kind === "shared_shortage");
  assert.ok(shortage, "should detect shared shortage below threshold");
  assert.ok(shortage!.summary.includes("2 items"));
});

test("obligation router generates conversation_backlog from pending mail", () => {
  const contextSignals = routeObligationContextSignals({
    actorId: "npc_a",
    roleId: "gatherer",
    bulletinEntries: [],
    pendingMail: [
      { id: "m1", from: "npc_b", to: "npc_a", turnSent: 2, kind: "social", payload: { text: "need logs" } },
      { id: "m2", from: "npc_c", to: "npc_a", turnSent: 3, kind: "task_handoff", payload: { text: "can you help?" } }
    ],
    turn: 4
  });

  const backlog = contextSignals.find((p) => p.kind === "conversation_backlog");
  assert.ok(backlog, "should detect conversation backlog");
  assert.ok(backlog!.summary.includes("2 unread"));
});

test("obligation router ignores bulletin entries about the actor itself", () => {
  const contextSignals = routeObligationContextSignals({
    actorId: "npc_a",
    roleId: "gatherer",
    bulletinEntries: [
      {
        actorId: "npc_a",
        roleId: "gatherer",
        currentBlocker: "waiting for materials",
        updatedAt: 1
      }
    ],
    pendingMail: [],
    turn: 2
  });

  assert.equal(contextSignals.length, 0, "should not generate context signals from own bulletin");
});
