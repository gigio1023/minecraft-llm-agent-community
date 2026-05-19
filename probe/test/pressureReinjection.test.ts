import assert from "node:assert/strict";
import test from "node:test";

import { buildPressureIntentContext } from "../src/runtime/pressureIntent.js";

test("reinjection triggers recovery mode when recent death count is positive", () => {
  const context = buildPressureIntentContext({
    actorId: "npc_a",
    turn: 5,
    observation: {
      status: "ok",
      visibleActors: [],
      inventory: [],
      memory: []
    },
    currentTask: null,
    completedTaskIds: ["collect_4_logs", "craft_planks_and_sticks"],
    reinjectionHints: {
      recentDeathCount: 1,
      hasPickaxe: false,
      hasCraftingTable: false
    }
  });

  assert.equal(context.lifecycleMode, "recovery");
  assert.equal(context.currentIntent.kind, "recover_basic_tools");
});

test("reinjection triggers scarcity when shared essentials are below floor", () => {
  const context = buildPressureIntentContext({
    actorId: "npc_a",
    turn: 8,
    observation: {
      status: "ok",
      visibleActors: [],
      inventory: [],
      memory: []
    },
    currentTask: null,
    completedTaskIds: [],
    reinjectionHints: {
      sharedEssentialsBelowFloor: true
    }
  });

  assert.equal(context.lifecycleMode, "scarcity");
  assert.equal(context.currentIntent.kind, "resupply_shared_storage");
  assert.ok(context.pressures.some((p) => p.kind === "shared_shortage"));
});

test("external pressures from obligation router merge into context", () => {
  const context = buildPressureIntentContext({
    actorId: "npc_a",
    turn: 3,
    observation: {
      status: "ok",
      visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
      memory: []
    },
    currentTask: null,
    completedTaskIds: [],
    externalPressures: [
      {
        id: "ext-1",
        actorId: "npc_a",
        kind: "blocked_teammate",
        summary: "npc_b is waiting for logs",
        source: "bulletin",
        relatedActorId: "npc_b",
        urgency: 0.85,
        roleRelevance: 0.9,
        sharedImportance: 0.9,
        personalImportance: 0.4,
        accessibility: 0.7,
        novelty: 0.5,
        recoveryWeight: 0.0,
        interruptsCurrentIntent: false
      }
    ]
  });

  assert.ok(context.pressures.some((p) => p.kind === "blocked_teammate"));
  assert.ok(context.pressures.some((p) => p.id === "ext-1"), "external pressure should appear in context");
});

test("station missing pressure fires when no crafting table in non-recovery mode", () => {
  const context = buildPressureIntentContext({
    actorId: "npc_a",
    turn: 2,
    observation: {
      status: "ok",
      visibleActors: [],
      inventory: [],
      memory: []
    },
    currentTask: null,
    completedTaskIds: [],
    reinjectionHints: {
      hasCraftingTable: false,
      hasPickaxe: true
    }
  });

  assert.ok(context.pressures.some((p) => p.kind === "station_missing"));
});
