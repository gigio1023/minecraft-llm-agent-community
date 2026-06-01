import assert from "node:assert/strict";
import test from "node:test";

import {
  buildServerEnv,
  loadMutualProbeConfig,
  loadProbeConfig,
  parseBooleanEnv,
  parsePortEnv,
  parseProbeBotIds
} from "../src/config.js";
import {
  getComposeCommandTimeouts,
  parsePublishedEndpoint
} from "../src/server/dockerServer.js";
import {
  formatLiveSmokeServerReport,
  type LiveSmokeServerReport
} from "../src/server/liveSmokeServer.js";

test("loads probe config and builds vanilla server env", () => {
  const config = loadProbeConfig();
  const env = buildServerEnv(config);

  assert.equal(config.server.version, "1.21.11");
  assert.equal(config.server.image, "itzg/minecraft-server:java21");
  assert.equal(config.server.host, "127.0.0.1");
  assert.equal(config.server.hostPort, 25565);
  assert.equal(config.server.containerPort, 25565);
  assert.equal(config.server.publishStrategy, "fixed-host-port");
  assert.match(config.actorWorkspace.rootDir, /data\/actors$/);
  assert.equal(config.actorWorkspace.initializeOnStart, true);
  assert.deepEqual(config.bots, ["npc_a", "npc_b"]);

  assert.equal(env.EULA, "TRUE");
  assert.equal(env.MC_UID, String(process.getuid?.() ?? 1000));
  assert.equal(env.MC_GID, String(process.getgid?.() ?? 1000));
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
  assert.equal(env.SPAWN_PROTECTION, "0");
  assert.equal(env.ENABLE_RCON, "true");
  assert.equal(env.VIEW_DISTANCE, "10");
  assert.equal(env.SIMULATION_DISTANCE, "10");
  assert.equal(env.MC_HOST_PORT, "25565");
});

test("parses actor workspace initialization option", () => {
  const originalActorWorkspaceInit = process.env.ACTOR_WORKSPACE_INIT;

  try {
    assert.equal(parseBooleanEnv(undefined, true), true);
    assert.equal(parseBooleanEnv("1", false), true);
    assert.equal(parseBooleanEnv("false", true), false);

    process.env.ACTOR_WORKSPACE_INIT = "0";
    assert.equal(loadProbeConfig().actorWorkspace.initializeOnStart, false);
  } finally {
    if (originalActorWorkspaceInit === undefined) {
      delete process.env.ACTOR_WORKSPACE_INIT;
    } else {
      process.env.ACTOR_WORKSPACE_INIT = originalActorWorkspaceInit;
    }
  }
});

test("parses fixed Minecraft host port option", () => {
  const originalHostPort = process.env.MC_HOST_PORT;

  try {
    assert.equal(parsePortEnv(undefined, 25565), 25565);
    assert.equal(parsePortEnv("25566", 25565), 25566);

    process.env.MC_HOST_PORT = "25566";
    const config = loadProbeConfig();
    const env = buildServerEnv(config);
    assert.equal(config.server.hostPort, 25566);
    assert.equal(env.MC_HOST_PORT, "25566");
    assert.throws(() => parsePortEnv("0", 25565), /Expected TCP port/);
    assert.throws(() => parsePortEnv("not-a-port", 25565), /Expected TCP port/);
  } finally {
    if (originalHostPort === undefined) {
      delete process.env.MC_HOST_PORT;
    } else {
      process.env.MC_HOST_PORT = originalHostPort;
    }
  }
});

test("uses a longer timeout for docker compose up while keeping compose port and down bounded", () => {
  const config = loadProbeConfig();
  const timeouts = getComposeCommandTimeouts(config);

  assert.equal(timeouts.startupMs, config.server.pingTimeoutMs);
  assert.equal(timeouts.managementMs, 30_000);
  assert.ok(timeouts.startupMs > timeouts.managementMs);
});

test("parses docker compose published endpoints for local client connection", () => {
  assert.deepEqual(parsePublishedEndpoint("0.0.0.0:32769", "127.0.0.1"), {
    host: "127.0.0.1",
    port: 32769
  });
  assert.deepEqual(parsePublishedEndpoint("127.0.0.1:25565", "127.0.0.1"), {
    host: "127.0.0.1",
    port: 25565
  });
  assert.deepEqual(parsePublishedEndpoint("[::]:32770", "127.0.0.1"), {
    host: "127.0.0.1",
    port: 32770
  });
  assert.throws(
    () => parsePublishedEndpoint("127.0.0.1:25565abc", "127.0.0.1"),
    /Unable to parse published port/
  );
});

test("formats live smoke server report without provider auth or secret fields", () => {
  const report: LiveSmokeServerReport = {
    status: "ready",
    source: "started",
    host: "127.0.0.1",
    port: 25565,
    endpoint: "127.0.0.1:25565",
    composeProject: "minecraft-agent-live-smoke",
    dataDir: "/tmp/probe-server",
    stopCommand: "bun run --cwd probe server:stop"
  };

  assert.equal(
    formatLiveSmokeServerReport(report),
    [
      "status=ready",
      "source=started",
      "endpoint=127.0.0.1:25565",
      "minecraft_direct_connect=127.0.0.1:25565",
      "compose_project=minecraft-agent-live-smoke",
      "data_dir=/tmp/probe-server",
      "stop_command=bun run --cwd probe server:stop"
    ].join("\n")
  );
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

test("parses comma-delimited probe bot IDs for two NPC spawn smoke runs", () => {
  const originalProbeBots = process.env.PROBE_BOTS;

  try {
    process.env.PROBE_BOTS = " npc_a, npc_b ";

    assert.deepEqual(parseProbeBotIds(process.env.PROBE_BOTS), ["npc_a", "npc_b"]);
    assert.deepEqual(loadProbeConfig().bots, ["npc_a", "npc_b"]);
  } finally {
    if (originalProbeBots === undefined) {
      delete process.env.PROBE_BOTS;
    } else {
      process.env.PROBE_BOTS = originalProbeBots;
    }
  }
});
