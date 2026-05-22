import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeActorIds } from "./runtime/actorRoster.js";

import fs from "node:fs";
import yaml from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));

export type ProbeConfig = {
  probeId: string;
  evidenceDir: string;
  composeFile: string;
  world: {
    seed: string;
    levelType: string;
  };
  spawn: {
    x: number;
    y: number;
    z: number;
  };
  liveDialogue: {
    providerId: "openai-codex";
    authStorePath: string;
    model: "gpt-5.4-mini";
    reasoning: "low";
    maxRetries: 1;
    delayStartMs: 30000;
  };
  gameplayProvider: {
    providerId: "deterministic" | "openai-codex";
    model: "gpt-5.4-mini";
    reasoning: "low";
    maxRetries: 1;
  };
  actorWorkspace: {
    rootDir: string;
    initializeOnStart: boolean;
  };
  server: {
    image: string;
    version: string;
    host: string;
    hostPort: number;
    containerPort: number;
    publishStrategy: "fixed-host-port";
    pingTimeoutMs: number;
  };
  bots: string[];
  dialogue: {
    busyRepliesBeforeAvailable: number;
    waitTicks: number;
  };
  memoryLimit: number;
};

export function parseProbeBotIds(value: string | undefined) {
  return value?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`Expected boolean environment value, received: ${value}`);
}

export function parsePortEnv(value: string | undefined, defaultValue: number) {
  if (value === undefined || value.trim().length === 0) {
    return defaultValue;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Expected TCP port environment value, received: ${value}`);
  }

  return port;
}

function parseGameplayProviderId(value: string | undefined): ProbeConfig["gameplayProvider"]["providerId"] {
  if (!value || value.trim().length === 0) {
    return "deterministic";
  }

  if (value === "deterministic" || value === "openai-codex") {
    return value;
  }

  throw new Error(`Unsupported PROBE_GAMEPLAY_PROVIDER: ${value}`);
}

export function loadProbeConfig(): ProbeConfig {
  const envBots = parseProbeBotIds(process.env.PROBE_BOTS);

  let yamlConfig = {
    world: { seed: "", levelType: "default" },
    spawn: { x: 49.9, y: -58.0, z: -119.0 }
  };
  try {
    const yamlStr = fs.readFileSync(path.resolve(here, "../probe-config.yaml"), "utf8");
    yamlConfig = yaml.parse(yamlStr);
  } catch (error) {
    console.warn("Could not read probe-config.yaml, using defaults.", error);
  }

  return {
    probeId: "agent_loop_probe_v0",
    evidenceDir: path.resolve(here, "../../data/evidence"),
    composeFile: path.resolve(here, "../compose.yaml"),
    world: {
      seed: yamlConfig.world?.seed || "",
      levelType: yamlConfig.world?.levelType || "default"
    },
    spawn: {
      x: yamlConfig.spawn?.x ?? 49.9,
      y: yamlConfig.spawn?.y ?? -58.0,
      z: yamlConfig.spawn?.z ?? -119.0
    },
    liveDialogue: {
      providerId: "openai-codex",
      // Gameplay provider auth is repo-local and intentionally separate from
      // Codex CLI login; the auth loader rejects expired stores before live runs.
      authStorePath: path.resolve(here, "../../build/provider-auth/openai-codex-auth.json"),
      model: "gpt-5.4-mini",
      reasoning: "low",
      maxRetries: 1,
      delayStartMs: 30_000
    },
    gameplayProvider: {
      providerId: parseGameplayProviderId(process.env.PROBE_GAMEPLAY_PROVIDER),
      model: "gpt-5.4-mini",
      reasoning: "low",
      maxRetries: 1
    },
    actorWorkspace: {
      rootDir: path.resolve(here, "../../data/actors"),
      // Default on so tests and smoke runs start from an inspectable baseline;
      // initialization rewrites indexes but does not delete actor artifacts.
      initializeOnStart: parseBooleanEnv(process.env.ACTOR_WORKSPACE_INIT, true)
    },
    server: {
      image: "itzg/minecraft-server:java21",
      version: "1.21.11",
      host: "127.0.0.1",
      hostPort: parsePortEnv(process.env.MC_HOST_PORT, 25565),
      containerPort: 25565,
      publishStrategy: "fixed-host-port",
      pingTimeoutMs: 120000
    },
    bots: normalizeActorIds(envBots),
    dialogue: {
      busyRepliesBeforeAvailable: 1,
      waitTicks: 20
    },
    memoryLimit: 8
  };
}

export function loadMutualProbeConfig(): ProbeConfig {
  return {
    ...loadProbeConfig(),
    probeId: "mutual_npc_interaction_probe_v1"
  };
}

export function buildServerEnv(config: ProbeConfig) {
  return {
    MC_IMAGE: config.server.image,
    MC_DATA_DIR: path.resolve(here, "../../tmp/probe-server"),
    MC_HOST_PORT: String(config.server.hostPort),
    EULA: "TRUE",
    VERSION: config.server.version,
    TYPE: "VANILLA",
    ONLINE_MODE: "FALSE",
    MODE: "survival",
    DIFFICULTY: "peaceful",
    LEVEL_TYPE: config.world.levelType || "default",
    SEED: config.world.seed || "",
    GENERATE_STRUCTURES: "true",
    SPAWN_NPCS: "true",
    SPAWN_ANIMALS: "true",
    SPAWN_MONSTERS: "false",
    VIEW_DISTANCE: "10",
    SIMULATION_DISTANCE: "10",
    ENABLE_COMMAND_BLOCK: "true",
    ENABLE_RCON: "true"
  } satisfies Record<string, string>;
}
