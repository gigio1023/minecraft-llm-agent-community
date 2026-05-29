import assert from "node:assert/strict";
import test from "node:test";

import { buildContextIntentState } from "../src/runtime/contextIntent.js";

test("buildContextIntentState selects bootstrap progression from the current task", () => {
  const context = buildContextIntentState({
    actorId: "npc_a",
    turn: 1,
    observation: {
      status: "ok",
      visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
      inventory: [],
      memory: []
    },
    currentTask: {
      id: "collect_4_logs",
      reason: "Need enough wood to start the early-game crafting chain.",
      blockers: [],
      preferredActorRoles: ["gatherer"],
      primitiveIds: ["observe", "collect_logs", "wait"],
      success: {
        kind: "inventory_at_least",
        itemNames: ["oak_log"],
        targetCount: 4
      }
    },
    completedTaskIds: []
  });

  assert.equal(context.lifecycleMode, "bootstrap");
  assert.equal(context.currentIntent.kind, "bootstrap_progress");
  assert.equal(context.contextSignals[0]?.kind, "bootstrap_missing_progress");
  assert.equal(context.intentTransition, "selected");
});

test("buildContextIntentState re-enters recovery when progression regresses after completed bootstrap work", () => {
  const context = buildContextIntentState({
    actorId: "npc_a",
    turn: 4,
    observation: {
      status: "ok",
      visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
      inventory: [],
      memory: []
    },
    currentTask: {
      id: "collect_4_logs",
      reason: "Need enough wood to restart the basic tool chain.",
      blockers: [],
      preferredActorRoles: ["gatherer"],
      primitiveIds: ["observe", "collect_logs", "wait"],
      success: {
        kind: "inventory_at_least",
        itemNames: ["oak_log"],
        targetCount: 4
      }
    },
    completedTaskIds: ["craft_planks_and_sticks", "craft_crafting_table"]
  });

  assert.equal(context.lifecycleMode, "recovery");
  assert.equal(context.currentIntent.kind, "recover_basic_tools");
  assert.equal(context.contextSignals[0]?.kind, "recovery_after_death");
});

test("buildContextIntentState can select a non-bootstrap social intent when no bootstrap task is active", () => {
  const context = buildContextIntentState({
    actorId: "npc_a",
    turn: 2,
    observation: {
      status: "ok",
      visibleActors: [{ id: "npc_b", distance: 1.5, busy: false }],
      memory: []
    },
    currentTask: null,
    completedTaskIds: [],
    previousIntent: {
      id: "intent-1",
      actorId: "npc_a",
      kind: "request_or_handoff",
      summary: "approach npc_b and check whether they are available to coordinate",
      chosenFromContextSignalIds: ["context-signal-1"],
      lifecycleMode: "normal",
      status: "active",
      source: "runtime_default",
      successCondition: "npc_b responds or the actor reaches a better coordination point",
      interruptible: true,
      createdAtTurn: 1,
      lastUpdatedTurn: 1
    }
  });

  assert.equal(context.lifecycleMode, "normal");
  assert.equal(context.currentIntent.kind, "request_or_handoff");
  assert.equal(context.contextSignals.some((signal) => signal.kind === "nearby_opportunity"), true);
  assert.equal(context.intentTransition, "continued");
});
