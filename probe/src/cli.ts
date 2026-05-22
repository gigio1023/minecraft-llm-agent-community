import { runProbe } from "./runProbe.js";
import { startDashboardServer, type DashboardServer } from "./dashboard/dashboardServer.js";
import { checkDashboardHealth } from "./dashboard/dashboardHealth.js";
import { createDashboardRuntimeEventSink } from "./dashboard/runtimeEvents.js";
import { probePort } from "./server/serverLifecycle.js";

type CliOptions = {
  provider?: "deterministic" | "openai-codex";
  bots?: string;
  npcCount?: number;
  observeMs?: number;
  maxActions?: number;
  dashboard?: boolean;
  dashboardPort?: number;
};

function parsePositiveInteger(value: string, flag: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }

  return parsed;
}

function parsePort(value: string, flag: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error(`${flag} must be an integer between 1 and 65535`);
  }

  return parsed;
}

function defaultNpcIds(count: number) {
  return Array.from({ length: count }, (_, index) =>
    `npc_${String.fromCharCode("a".charCodeAt(0) + index)}`
  ).join(",");
}

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case "--provider": {
        const provider = next();
        if (provider !== "deterministic" && provider !== "openai-codex") {
          throw new Error("--provider must be deterministic or openai-codex");
        }
        options.provider = provider;
        break;
      }
      case "--bots":
        options.bots = next();
        break;
      case "--npcs":
        options.npcCount = parsePositiveInteger(next(), "--npcs");
        break;
      case "--observe-ms":
        options.observeMs = Number(next());
        if (!Number.isInteger(options.observeMs) || options.observeMs < 0) {
          throw new Error("--observe-ms must be a non-negative integer");
        }
        break;
      case "--max-actions":
        options.maxActions = parsePositiveInteger(next(), "--max-actions");
        break;
      case "--dashboard":
        options.dashboard = true;
        break;
      case "--no-dashboard":
        options.dashboard = false;
        break;
      case "--dashboard-port":
        options.dashboardPort = parsePort(next(), "--dashboard-port");
        break;
      case "--help":
        console.log([
          "Usage: bun run src/cli.ts [--provider deterministic|openai-codex] [--npcs N|--bots npc_a,npc_b] [--max-actions N] [--observe-ms MS] [--dashboard-port PORT] [--no-dashboard]",
          "",
          "Dashboard:",
          "  Starts by default at http://127.0.0.1:4173 while the probe runs.",
          "  Use --no-dashboard to disable it.",
          "",
          "Examples:",
          "  bun run src/cli.ts --npcs 3 --max-actions 20 --observe-ms 60000",
          "  bun run src/cli.ts --provider openai-codex --npcs 3 --max-actions 20 --observe-ms 120000"
        ].join("\n"));
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function applyOptionsToEnv(options: CliOptions) {
  if (options.provider) {
    process.env.PROBE_GAMEPLAY_PROVIDER = options.provider;
  }

  if (options.bots) {
    process.env.PROBE_BOTS = options.bots;
  } else if (options.npcCount) {
    process.env.PROBE_BOTS = defaultNpcIds(options.npcCount);
  }

  if (options.observeMs !== undefined) {
    process.env.PROBE_OBSERVE_MS = String(options.observeMs);
  }

  if (options.maxActions !== undefined) {
    process.env.PROBE_MAX_ACTIONS = String(options.maxActions);
  }
}

// AggregateError is common because runtime failures and cleanup failures are
// reported together; flatten it so CLI logs remain useful for artifact review.
function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    const nested = error.errors.map((entry) => formatError(entry)).join("\n");
    return `${error.message}\n${nested}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function startCliDashboard(options: CliOptions) {
  if (options.dashboard === false) {
    return { server: null, eventPort: undefined };
  }

  const port = options.dashboardPort ?? 4173;

  try {
    if ((await probePort(port)).inUse) {
      const health = await checkDashboardHealth(port);
      if (health.status === "ready") {
        console.warn(`dashboard already running: ${health.url}`);
        return { server: null, eventPort: port };
      }

      console.warn(`dashboard port occupied by non-dashboard process: ${health.url} (${health.reason})`);
      return { server: null, eventPort: undefined };
    }

    const server = startDashboardServer(port);
    console.log(`dashboard ready: ${server.url}`);
    return { server, eventPort: port };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EADDRINUSE"
    ) {
      const health = await checkDashboardHealth(port);
      if (health.status === "ready") {
        console.warn(`dashboard already running: ${health.url}`);
        return { server: null, eventPort: port };
      }
    }

    console.warn(`dashboard unavailable: ${formatError(error)}`);
    return { server: null, eventPort: undefined };
  }
}

async function main() {
  let dashboardServer: DashboardServer | null = null;

  try {
    const options = parseArgs(process.argv.slice(2));
    applyOptionsToEnv(options);
    const dashboard = await startCliDashboard(options);
    dashboardServer = dashboard.server;
    const { transcriptPath, cleanupError } = await runProbe({
      onEvent: dashboard.eventPort ? createDashboardRuntimeEventSink(dashboard.eventPort) : undefined
    });

    if (cleanupError) {
      console.warn(formatError(cleanupError));
    }

    console.log(transcriptPath);
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  } finally {
    dashboardServer?.stop();
  }
}

void main();
