import assert from "node:assert/strict";
import test from "node:test";

import { buildServerEnv, loadMutualProbeConfig, loadProbeConfig } from "../src/config.js";
import { getComposeCommandTimeouts } from "../src/server/dockerServer.js";

test("loads probe config and builds vanilla server env", () => {
  const config = loadProbeConfig();
  const env = buildServerEnv(config);

  assert.equal(config.server.version, "1.21.11");
  assert.equal(config.server.image, "itzg/minecraft-server:java21");
  assert.equal(config.server.host, "127.0.0.1");
  assert.equal(config.server.containerPort, 25565);
  assert.equal(config.server.publishStrategy, "ephemeral-host-port");
  assert.deepEqual(config.bots, ["npc_a", "npc_b"]);

  assert.equal(env.EULA, "TRUE");
  assert.equal(env.VERSION, "1.21.11");
  assert.equal(env.TYPE, "VANILLA");
  assert.equal(env.ONLINE_MODE, "FALSE");
  assert.equal(env.MODE, "survival");
  assert.equal(env.DIFFICULTY, "peaceful");
  assert.equal(env.LEVEL_TYPE, "default");
  assert.equal(env.GENERATE_STRUCTURES, "true");
  assert.equal(env.SPAWN_NPCS, "true");
  assert.equal(env.SPAWN_ANIMALS, "true");
  assert.equal(env.SPAWN_MONSTERS, "false");
});

test("uses a longer timeout for docker compose up while keeping compose port and down bounded", () => {
  const config = loadProbeConfig();
  const timeouts = getComposeCommandTimeouts(config);

  assert.equal(timeouts.startupMs, config.server.pingTimeoutMs);
  assert.equal(timeouts.managementMs, 10_000);
  assert.ok(timeouts.startupMs > timeouts.managementMs);
});

test("loads locked live dialogue provider settings for the mutual probe", () => {
  const config = loadMutualProbeConfig();

  assert.equal(config.probeId, "mutual_npc_interaction_probe_v1");
  assert.equal(config.server.version, "1.21.11");
  assert.deepEqual(config.bots, ["npc_a", "npc_b"]);
  assert.equal(config.liveDialogue.providerId, "openai-codex");
  assert.equal(config.liveDialogue.model, "gpt-5.4-mini");
  assert.equal(config.liveDialogue.reasoning, "low");
  assert.equal(config.liveDialogue.maxRetries, 1);
  assert.equal(config.liveDialogue.delayStartMs, 30_000);
  assert.match(config.liveDialogue.authStorePath, /build\/provider-auth\/openai-codex-auth\.json$/);
});
