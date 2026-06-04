import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import * as mc from "minecraft-protocol";

import { buildServerEnv, type ProbeConfig } from "../config.js";
import { shouldRetryWithStandaloneCompose } from "./composeCommand.js";

const SERVER_READY_POLL_MS = 1_000;
const COMPOSE_MANAGEMENT_TIMEOUT_MS = 30_000;
const MIN_COMPOSE_STARTUP_TIMEOUT_MS = 60_000;

export type ServerHandle = {
  host: string;
  port: number;
  runRcon?(args: string[]): Promise<string>;
  stop(): Promise<void>;
};

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
};

export function getComposeCommandTimeouts(config: ProbeConfig) {
  return {
    startupMs: Math.max(config.server.pingTimeoutMs, MIN_COMPOSE_STARTUP_TIMEOUT_MS),
    managementMs: COMPOSE_MANAGEMENT_TIMEOUT_MS
  };
}

/**
 * Runs a bounded Docker command and returns stdout only after the process exits.
 *
 * Startup and cleanup failures must be explainable from probe artifacts, so this
 * helper preserves stderr/stdout context while still forcing hung compose
 * commands through SIGTERM and then SIGKILL.
 */
function runCommand(
  command: string,
  args: readonly string[],
  options: CommandOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const commandLine = `${command} ${args.join(" ")}`;
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timeoutErrorMessage: string | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let forceKillId: ReturnType<typeof setTimeout> | undefined;

    const clearTimeoutTimer = () => {
      if (!timeoutId) {
        return;
      }

      clearTimeout(timeoutId);
      timeoutId = undefined;
    };

    const clearForceKillTimer = () => {
      if (!forceKillId) {
        return;
      }

      clearTimeout(forceKillId);
      forceKillId = undefined;
    };

    const details = () => [stderr.trim(), stdout.trim()].filter(Boolean).join("\n");

    const terminationSummary = (
      code: number | null,
      signal: NodeJS.Signals | null
    ) => (signal ? `Signal: ${signal}` : `Exit code: ${code ?? "unknown"}`);

    const rejectOnce = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeoutTimer();
      clearForceKillTimer();
      reject(error);
    };

    const resolveOnce = (value: string) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeoutTimer();
      clearForceKillTimer();
      resolve(value);
    };

    if (options.timeoutMs) {
      timeoutId = setTimeout(() => {
        clearTimeoutTimer();
        timeoutErrorMessage = `Command timed out after ${options.timeoutMs}ms: ${commandLine}`;
        child.kill("SIGTERM");
        forceKillId = setTimeout(() => {
          forceKillId = undefined;
          child.kill("SIGKILL");
        }, 1_000);
      }, options.timeoutMs);
    }

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      rejectOnce(error);
    });

    child.on("close", (code, signal) => {
      clearTimeoutTimer();
      clearForceKillTimer();

      if (settled) {
        return;
      }

      if (timeoutErrorMessage) {
        rejectOnce(
          new Error(
            [timeoutErrorMessage, terminationSummary(code, signal), details()]
              .filter(Boolean)
              .join("\n")
          )
        );
        return;
      }

      if (code === 0) {
        resolveOnce(stdout.trim());
        return;
      }

      rejectOnce(
        new Error(
          [
            `Command failed: ${commandLine}`,
            terminationSummary(code, signal),
            details()
          ]
            .filter(Boolean)
            .join("\n")
        )
      );
    });
  });
}

async function runComposeCommand(
  args: readonly string[],
  options: CommandOptions = {}
) {
  try {
    return await runCommand("docker", ["compose", ...args], options);
  } catch (error) {
    if (!shouldRetryWithStandaloneCompose(error)) {
      throw error;
    }

    return runCommand("docker-compose", args, options);
  }
}

function parsePublishedPort(value: string, line: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Unable to parse published port: ${line}`);
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Unable to parse published port: ${line}`);
  }

  return port;
}

export function parsePublishedEndpoint(output: string, fallbackHost: string) {
  const line = output
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find(Boolean);

  if (!line) {
    throw new Error("docker compose port returned no published endpoint");
  }

  if (line.startsWith("[")) {
    const bracketIndex = line.indexOf("]");
    const separatorIndex = line.lastIndexOf(":");

    if (bracketIndex === -1 || separatorIndex <= bracketIndex) {
      throw new Error(`Unable to parse published endpoint: ${line}`);
    }

    const rawHost = line.slice(1, bracketIndex);
    const port = parsePublishedPort(line.slice(separatorIndex + 1), line);

    return {
      host: normalizePublishedHost(rawHost, fallbackHost),
      port
    };
  }

  const separatorIndex = line.lastIndexOf(":");

  if (separatorIndex === -1) {
    throw new Error(`Unable to parse published endpoint: ${line}`);
  }

  const rawHost = line.slice(0, separatorIndex);
  const port = parsePublishedPort(line.slice(separatorIndex + 1), line);

  return {
    host: normalizePublishedHost(rawHost, fallbackHost),
    port
  };
}

function normalizePublishedHost(host: string, fallbackHost: string) {
  // Docker may publish on a wildcard address; Mineflayer needs a concrete host.
  if (!host || host === "0.0.0.0" || host === "::" || host === "*") {
    return fallbackHost;
  }

  return host;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForServerReady(
  host: string,
  port: number,
  version: string,
  timeoutMs: number
) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (true) {
    const remainingMs = deadline - Date.now();

    if (remainingMs <= 0) {
      break;
    }

    try {
      const pingTimeoutMs = Math.min(COMPOSE_MANAGEMENT_TIMEOUT_MS, remainingMs);

      await mc.ping({
        host,
        port,
        version,
        closeTimeout: pingTimeoutMs,
        noPongTimeout: Math.min(5_000, pingTimeoutMs)
      });
      return;
    } catch (error) {
      // Compose can report the port before the Java server has accepted login
      // traffic, so readiness is a protocol ping rather than container status.
      lastError = error;
      const retryDelayMs = Math.min(SERVER_READY_POLL_MS, deadline - Date.now());

      if (retryDelayMs <= 0) {
        break;
      }

      await delay(retryDelayMs);
    }
  }

  const reason =
    lastError instanceof Error ? lastError.message : "timed out waiting for ping";

  throw new Error(`Minecraft server was not ready before timeout: ${reason}`);
}

async function stopComposeProject(composeFile: string, env: NodeJS.ProcessEnv) {
  await runComposeCommand(["-f", composeFile, "down", "-v"], {
    cwd: path.dirname(composeFile),
    env,
    timeoutMs: COMPOSE_MANAGEMENT_TIMEOUT_MS
  });
}

async function cleanupServerResources(
  composeFile: string,
  env: NodeJS.ProcessEnv,
  dataDir: string
) {
  const cleanupErrors: unknown[] = [];

  try {
    await stopComposeProject(composeFile, env);
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    // The probe server world is disposable; actor workspaces and run evidence
    // live elsewhere and are not removed by this server cleanup path.
    await rm(dataDir, { recursive: true, force: true });
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (cleanupErrors.length === 1) {
    throw cleanupErrors[0];
  }

  if (cleanupErrors.length > 1) {
    throw new AggregateError(
      cleanupErrors,
      "Failed to clean up docker server resources"
    );
  }
}

export async function startDockerServer(
  config: ProbeConfig
): Promise<ServerHandle> {
  const commandTimeouts = getComposeCommandTimeouts(config);
  const projectName = `probe-${process.pid}-${Date.now()}-${randomUUID().replaceAll("-", "").slice(0, 8)}`;
  const composeDir = path.dirname(config.composeFile);
  const dataDir = path.resolve(composeDir, "tmp/probe-server", projectName);

  await mkdir(dataDir, { recursive: true });

  const env = {
    ...process.env,
    ...buildServerEnv(config),
    COMPOSE_PROJECT_NAME: projectName,
    MC_DATA_DIR: dataDir
  };

  let cleanupPromise: Promise<void> | undefined;

  const cleanup = () => {
    // Stop can be called from normal completion and error paths; share one
    // cleanup promise so Docker teardown is idempotent within a run.
    if (cleanupPromise) {
      return cleanupPromise;
    }

    cleanupPromise = cleanupServerResources(config.composeFile, env, dataDir).catch(
      (error) => {
        cleanupPromise = undefined;
        throw error;
      }
    );

    return cleanupPromise;
  };

  const stop = async () => {
    await cleanup();
  };
  const runRcon = (args: string[]) =>
    runComposeCommand(["-f", config.composeFile, "exec", "-T", "mc", "rcon-cli", "--", ...args], {
      cwd: composeDir,
      env,
      timeoutMs: commandTimeouts.managementMs
    });

  try {
    await runComposeCommand(["-f", config.composeFile, "up", "-d"], {
      cwd: composeDir,
      env,
      timeoutMs: commandTimeouts.startupMs
    });

    const portOutput = await runComposeCommand(
      ["-f", config.composeFile, "port", "mc", String(config.server.containerPort)],
      {
        cwd: composeDir,
        env,
        timeoutMs: commandTimeouts.managementMs
      }
    );

    const { host, port } = parsePublishedEndpoint(portOutput, config.server.host);

    await waitForServerReady(host, port, config.server.version, config.server.pingTimeoutMs);

    return {
      host,
      port,
      runRcon,
      stop
    };
  } catch (error) {
    try {
      await cleanup();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Failed to start docker server and clean up compose resources"
      );
    }

    throw error;
  }
}
