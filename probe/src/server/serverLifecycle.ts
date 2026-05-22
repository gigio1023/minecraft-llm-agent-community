import { createConnection } from "node:net";

export type PortStatus = {
  port: number;
  inUse: boolean;
};

/**
 * Probes whether a TCP port is currently accepting connections.
 * Returns within timeoutMs regardless of server response.
 */
export async function probePort(port: number, host = "127.0.0.1", timeoutMs = 2000): Promise<PortStatus> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host, timeout: timeoutMs });
    let settled = false;

    const settle = (inUse: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ port, inUse });
    };

    socket.on("connect", () => settle(true));
    socket.on("error", () => settle(false));
    socket.on("timeout", () => settle(false));
  });
}

/**
 * Asserts that a port is free. Throws with an actionable message when the port
 * is already in use, so the caller gets explicit reuse-or-fail behavior instead
 * of a confusing EADDRINUSE later.
 */
export async function requirePortFree(port: number, host = "127.0.0.1"): Promise<void> {
  const status = await probePort(port, host);
  if (status.inUse) {
    throw new Error(
      `Port ${port} is already in use on ${host}. ` +
      `Stop the existing process or choose a different port.`
    );
  }
}

/**
 * Wraps a server start function with explicit port-free assertion.
 * Dashboard or gameplay servers call this to get reuse-or-fail behavior.
 */
export async function acquirePort(
  port: number,
  host = "127.0.0.1"
): Promise<{ port: number; host: string }> {
  await requirePortFree(port, host);
  return { port, host };
}
