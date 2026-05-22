export type DashboardHealth =
  | { status: "ready"; url: string }
  | { status: "not_dashboard"; url: string; reason: string };

/**
 * Verifies that an occupied dashboard port is actually this repo's dashboard.
 * A generic TCP listener is not enough because runtime events would otherwise
 * be silently sent to an unrelated stale process.
 */
export async function checkDashboardHealth(port: number, timeoutMs = 750): Promise<DashboardHealth> {
  const url = `http://127.0.0.1:${port}`;

  try {
    const response = await fetch(`${url}/api/state`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      return {
        status: "not_dashboard",
        url,
        reason: `/api/state returned HTTP ${response.status}`
      };
    }

    const payload = await response.json() as { schema?: unknown };
    if (payload.schema !== "minecraft-agent-dashboard-state/v2") {
      return {
        status: "not_dashboard",
        url,
        reason: "/api/state did not return minecraft-agent-dashboard-state/v2"
      };
    }

    return { status: "ready", url };
  } catch (error) {
    return {
      status: "not_dashboard",
      url,
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}
