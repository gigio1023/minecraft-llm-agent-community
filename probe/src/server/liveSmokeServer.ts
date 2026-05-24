import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  buildServerEnv,
  loadProbeConfig,
  type ProbeConfig
} from "../config.js";
import {
  parsePublishedEndpoint,
  waitForServerReady
} from "./dockerServer.js";
import { shouldRetryWithStandaloneCompose } from "./composeCommand.js";

export const LIVE_SMOKE_PROJECT_NAME = "minecraft-agent-live-smoke";
const LIVE_SMOKE_MANAGEMENT_TIMEOUT_MS = 10_000;

type LiveSmokeServerContext = {
  composeFile: string;
  composeDir: string;
  dataDir: string;
  env: NodeJS.ProcessEnv;
  host: string;
  version: string;
  containerPort: number;
  pingTimeoutMs: number;
};

export type LiveSmokeServerReport = {
  status: "ready" | "not_running" | "stopped";
  source: "existing" | "started" | "none" | "stopped";
  host?: string;
  port?: number;
  endpoint?: string;
  composeProject: string;
  dataDir: string;
  stopCommand: string;
};

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
};

export function buildLiveSmokeServerContext(
  config: ProbeConfig = loadProbeConfig()
): LiveSmokeServerContext {
  const composeDir = path.dirname(config.composeFile);
  const dataDir = path.resolve(composeDir, "tmp/live-smoke-server");

  return {
    composeFile: config.composeFile,
    composeDir,
    dataDir,
    host: config.server.host,
    version: config.server.version,
    containerPort: config.server.containerPort,
    pingTimeoutMs: config.server.pingTimeoutMs,
    env: {
      ...process.env,
      ...buildServerEnv(config),
      COMPOSE_PROJECT_NAME: LIVE_SMOKE_PROJECT_NAME,
      MC_DATA_DIR: dataDir
    }
  };
}

function runCommand(
  command: string,
  args: readonly string[],
  options: CommandOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const rejectOnce = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      reject(error);
    };

    const resolveOnce = (value: string) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolve(value);
    };

    if (options.timeoutMs) {
      timeoutId = setTimeout(() => {
        child.kill("SIGTERM");
        rejectOnce(
          new Error(
            `Command timed out after ${options.timeoutMs}ms: ${command} ${args.join(" ")}`
          )
        );
      }, options.timeoutMs);
    }

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", rejectOnce);

    child.on("close", (code, signal) => {
      if (settled) {
        return;
      }

      if (code === 0) {
        resolveOnce(stdout.trim());
        return;
      }

      rejectOnce(
        new Error(
          [
            `Command failed: ${command} ${args.join(" ")}`,
            signal ? `Signal: ${signal}` : `Exit code: ${code ?? "unknown"}`,
            stderr.trim(),
            stdout.trim()
          ]
            .filter(Boolean)
            .join("\n")
        )
      );
    });
  });
}

async function runComposeCommand(
  context: LiveSmokeServerContext,
  args: readonly string[],
  timeoutMs: number
) {
  try {
    return await runCommand("docker", ["compose", ...args], {
      cwd: context.composeDir,
      env: context.env,
      timeoutMs
    });
  } catch (error) {
    if (!shouldRetryWithStandaloneCompose(error)) {
      throw error;
    }

    return runCommand("docker-compose", args, {
      cwd: context.composeDir,
      env: context.env,
      timeoutMs
    });
  }
}

async function readPublishedEndpoint(context: LiveSmokeServerContext) {
  const output = await runComposeCommand(
    context,
    [
      "-f",
      context.composeFile,
      "port",
      "mc",
      String(context.containerPort)
    ],
    LIVE_SMOKE_MANAGEMENT_TIMEOUT_MS
  );

  return parsePublishedEndpoint(output, context.host);
}

function buildReport(
  context: LiveSmokeServerContext,
  status: LiveSmokeServerReport["status"],
  source: LiveSmokeServerReport["source"],
  endpoint?: { host: string; port: number }
): LiveSmokeServerReport {
  return {
    status,
    source,
    host: endpoint?.host,
    port: endpoint?.port,
    endpoint: endpoint ? `${endpoint.host}:${endpoint.port}` : undefined,
    composeProject: LIVE_SMOKE_PROJECT_NAME,
    dataDir: context.dataDir,
    stopCommand: "bun run --cwd probe server:stop"
  };
}

export function formatLiveSmokeServerReport(report: LiveSmokeServerReport) {
  const lines = [
    `status=${report.status}`,
    `source=${report.source}`,
    `compose_project=${report.composeProject}`,
    `data_dir=${report.dataDir}`,
    `stop_command=${report.stopCommand}`
  ];

  if (report.endpoint) {
    lines.splice(2, 0, `endpoint=${report.endpoint}`);
    lines.splice(3, 0, `minecraft_direct_connect=${report.endpoint}`);
  }

  return lines.join("\n");
}

export async function getLiveSmokeServerStatus(
  config: ProbeConfig = loadProbeConfig()
): Promise<LiveSmokeServerReport> {
  const context = buildLiveSmokeServerContext(config);

  try {
    const endpoint = await readPublishedEndpoint(context);
    await waitForServerReady(
      endpoint.host,
      endpoint.port,
      context.version,
      context.pingTimeoutMs
    );

    return buildReport(context, "ready", "existing", endpoint);
  } catch {
    return buildReport(context, "not_running", "none");
  }
}

export async function ensureLiveSmokeServer(
  config: ProbeConfig = loadProbeConfig()
): Promise<LiveSmokeServerReport> {
  const context = buildLiveSmokeServerContext(config);
  const existing = await getLiveSmokeServerStatus(config);

  if (existing.status === "ready") {
    return existing;
  }

  await mkdir(context.dataDir, { recursive: true });
  await runComposeCommand(context, ["-f", context.composeFile, "up", "-d"], context.pingTimeoutMs);

  const endpoint = await readPublishedEndpoint(context);
  await waitForServerReady(
    endpoint.host,
    endpoint.port,
    context.version,
    context.pingTimeoutMs
  );

  return buildReport(context, "ready", "started", endpoint);
}

export async function stopLiveSmokeServer(
  config: ProbeConfig = loadProbeConfig()
): Promise<LiveSmokeServerReport> {
  const context = buildLiveSmokeServerContext(config);

  await runComposeCommand(context, ["-f", context.composeFile, "down"], LIVE_SMOKE_MANAGEMENT_TIMEOUT_MS);

  return buildReport(context, "stopped", "stopped");
}
