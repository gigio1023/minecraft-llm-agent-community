/** Runtime session preflight should block stale bot state before Mineflayer calls. */
import assert from "node:assert/strict";
import test from "node:test";

import { runPrimitivePreActionHooks } from "../src/runtime/actions/actionHooks.js";
import { evaluatePrimitiveSessionPreflight } from "../src/runtime/actions/sessionPreflight.js";

const allowedPermission = {
  allowed: true as const,
  reason: "test primitive allowed"
};

test("session preflight reports a spawned live bot as ready", () => {
  const result = evaluatePrimitiveSessionPreflight({
    entity: { position: { x: 0, y: 64, z: 0 } },
    health: 20,
    _client: { ended: false, socket: { destroyed: false } }
  });

  assert.equal(result.status, "ready");
  assert.equal(result.has_live_bot, true);
});

test("session preflight blocks ended Mineflayer clients", () => {
  const result = evaluatePrimitiveSessionPreflight({
    entity: { position: { x: 0, y: 64, z: 0 } },
    health: 20,
    _client: { ended: true }
  });

  assert.equal(result.status, "disconnected_or_ended");
  assert.equal(result.has_live_bot, false);
});

test("primitive pre-hook records session preflight blocks separately from missing bot", () => {
  const sessionPreflight = evaluatePrimitiveSessionPreflight({
    entity: { position: { x: 0, y: 64, z: 0 } },
    health: 0,
    _client: { ended: false }
  });

  const result = runPrimitivePreActionHooks({
    tool: "mine_block",
    permission: allowedPermission,
    hasLiveBot: sessionPreflight.has_live_bot,
    sessionPreflight
  });

  assert.equal(result.allowed, false);
  assert.equal(result.records[0]?.hook_id, "runtime_session_preflight");
  assert.match(result.records[0]?.reason ?? "", /dead or respawning/);
});

test("primitive pre-hook preserves existing missing-live-bot evidence when no preflight is supplied", () => {
  const result = runPrimitivePreActionHooks({
    tool: "mine_block",
    permission: allowedPermission,
    hasLiveBot: false
  });

  assert.equal(result.allowed, false);
  assert.equal(result.records[0]?.hook_id, "live_bot_required");
});
