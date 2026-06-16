import * as mc from "minecraft-protocol";

const SERVER_READY_POLL_MS = 1_000;
const SERVER_READY_PING_TIMEOUT_MS = 30_000;

export type ServerEndpointCandidate = {
  host: string;
  port: number;
  source: "published_port" | "container_ip";
};

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

async function pingServerEndpoint(
  candidate: ServerEndpointCandidate,
  version: string,
  timeoutMs: number
) {
  await mc.ping({
    host: candidate.host,
    port: candidate.port,
    version,
    closeTimeout: timeoutMs,
    noPongTimeout: Math.min(5_000, timeoutMs)
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
      const pingTimeoutMs = Math.min(SERVER_READY_PING_TIMEOUT_MS, remainingMs);

      await pingServerEndpoint({ host, port, source: "published_port" }, version, pingTimeoutMs);
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

function uniqueEndpointCandidates(
  candidates: readonly ServerEndpointCandidate[]
): ServerEndpointCandidate[] {
  const seen = new Set<string>();
  const unique: ServerEndpointCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.host}:${candidate.port}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

export async function waitForReachableServerEndpoint(input: {
  candidates: readonly ServerEndpointCandidate[];
  version: string;
  timeoutMs: number;
}) {
  const deadline = Date.now() + input.timeoutMs;
  const candidates = uniqueEndpointCandidates(input.candidates);
  let lastError: unknown;

  while (true) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      break;
    }

    for (const candidate of candidates) {
      const candidateRemainingMs = deadline - Date.now();
      if (candidateRemainingMs <= 0) {
        break;
      }

      try {
        await pingServerEndpoint(
          candidate,
          input.version,
          Math.min(5_000, candidateRemainingMs)
        );
        return candidate;
      } catch (error) {
        lastError = error;
      }
    }

    const retryDelayMs = Math.min(SERVER_READY_POLL_MS, deadline - Date.now());
    if (retryDelayMs <= 0) {
      break;
    }

    await delay(retryDelayMs);
  }

  const reason =
    lastError instanceof Error ? lastError.message : "timed out waiting for ping";
  const describedCandidates = candidates
    .map((candidate) => `${candidate.source}:${candidate.host}:${candidate.port}`)
    .join(", ");

  throw new Error(
    `Minecraft server was not ready before timeout: ${reason}; candidates=${describedCandidates}`
  );
}
