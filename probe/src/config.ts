import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export type ProbeConfig = {
  probeId: string;
  evidenceDir: string;
  composeFile: string;
  liveDialogue: {
    providerId: "openai-codex";
    authStorePath: string;
    model: "gpt-5.4-mini";
    reasoning: "low";
    maxRetries: 1;
    delayStartMs: 30000;
  };
  server: {
    image: string;
    version: string;
    host: string;
    containerPort: number;
    publishStrategy: "ephemeral-host-port";
    pingTimeoutMs: number;
  };
  bots: [string, string];
  dialogue: {
    busyRepliesBeforeAvailable: number;
    waitTicks: number;
  };
  memoryLimit: number;
};

export function loadProbeConfig(): ProbeConfig {
  return {
    probeId: "agent_loop_probe_v0",
    evidenceDir: path.resolve(here, "../../data/evidence"),
    composeFile: path.resolve(here, "../compose.yaml"),
    liveDialogue: {
      providerId: "openai-codex",
      authStorePath: path.resolve(here, "../../build/provider-auth/openai-codex-auth.json"),
      model: "gpt-5.4-mini",
      reasoning: "low",
      maxRetries: 1,
      delayStartMs: 30_000
    },
    server: {
      image: "itzg/minecraft-server:java21",
      version: "1.21.11",
      host: "127.0.0.1",
      containerPort: 25565,
      publishStrategy: "ephemeral-host-port",
      pingTimeoutMs: 120000
    },
    bots: ["npc_a", "npc_b"],
    dialogue: {
      busyRepliesBeforeAvailable: 1,
      waitTicks: 20
    },
    memoryLimit: 8
  };
}

export function loadMutualProbeConfig(): ProbeConfig {
  return loadProbeConfig();
}

export function buildServerEnv(config: ProbeConfig) {
  return {
    MC_IMAGE: config.server.image,
    MC_DATA_DIR: path.resolve(here, "../../tmp/probe-server"),
    EULA: "TRUE",
    VERSION: config.server.version,
    TYPE: "VANILLA",
    ONLINE_MODE: "FALSE",
    MODE: "creative",
    DIFFICULTY: "peaceful",
    LEVEL_TYPE: "FLAT",
    GENERATE_STRUCTURES: "false",
    SPAWN_NPCS: "true",
    SPAWN_ANIMALS: "false",
    SPAWN_MONSTERS: "false",
    VIEW_DISTANCE: "6",
    SIMULATION_DISTANCE: "6",
    ENABLE_COMMAND_BLOCK: "true"
  } satisfies Record<string, string>;
}
