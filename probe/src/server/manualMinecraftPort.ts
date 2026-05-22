import * as mc from "minecraft-protocol";

export type ManualMinecraftServerPreflight =
  | { status: "ready"; port: number }
  | { status: "environment_blocked"; reason: string; port?: number };

export function readManualMinecraftPort(value = process.env.MC_PORT) {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`MC_PORT must be an integer between 1 and 65535, got: ${value}`);
  }

  return port;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Verifies that MC_PORT points at a Minecraft protocol server, not merely any
 * TCP listener. This runs before action-skill probes mutate actor workspace
 * state, so a stale port override stays an environment blocker.
 */
export async function checkManualMinecraftServer(input: {
  port: number;
  host?: string;
  version: string;
  timeoutMs?: number;
}): Promise<ManualMinecraftServerPreflight> {
  const host = input.host ?? "127.0.0.1";
  const timeoutMs = input.timeoutMs ?? 2_000;

  try {
    await mc.ping({
      host,
      port: input.port,
      version: input.version,
      closeTimeout: timeoutMs,
      noPongTimeout: timeoutMs
    });

    return { status: "ready", port: input.port };
  } catch (error) {
    return {
      status: "environment_blocked",
      port: input.port,
      reason: `MC_PORT=${input.port} is not a ready Minecraft server: ${formatError(error)}`
    };
  }
}
