/** Regression coverage for Mineflayer session lifecycle evidence. */
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import type { Bot } from "mineflayer";

import { attachRuntimeSessionLifecycleTracker } from "../src/runtime/sessionLifecycle.js";

function createLifecycleBot() {
  const emitter = new EventEmitter() as EventEmitter & Partial<Bot>;
  emitter.username = "npc_b";
  emitter.health = 20;
  emitter.food = 20;
  emitter.entity = {
    position: {
      x: 1,
      y: 64,
      z: 2
    }
  } as Bot["entity"];
  return emitter as Bot;
}

test("session lifecycle records death and respawn as recovery pressure", () => {
  const bot = createLifecycleBot();
  const tracker = attachRuntimeSessionLifecycleTracker({ actorId: "npc_b", bot });

  bot.emit("death");
  bot.entity.position.x = 4;
  bot.entity.position.y = 65;
  bot.entity.position.z = 6;
  bot.emit("spawn");

  const snapshot = tracker.snapshot();
  assert.equal(snapshot.status, "respawned_after_death");
  assert.equal(snapshot.death_count, 1);
  assert.equal(snapshot.spawn_count, 1);
  assert.equal(snapshot.inventory_may_have_reset, true);
  assert.equal(snapshot.branch_recommended, true);
  assert.equal(snapshot.branch_reason, "danger_or_survival_pressure");
  assert.equal(snapshot.last_event?.kind, "spawn");

  tracker.close();
});
