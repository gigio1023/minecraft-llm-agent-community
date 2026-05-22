import type { AgentLoopEvent } from "../runtime/agentLoop.js";

export type DashboardRuntimeEvent = AgentLoopEvent & {
  source: "agent_loop";
};

export type DashboardRuntimeEventSink = (event: AgentLoopEvent) => void;

/**
 * Sends runtime events to the dashboard without coupling gameplay progress to
 * dashboard availability. Network failure, a closed dashboard, or malformed
 * responses are intentionally ignored.
 */
export function createDashboardRuntimeEventSink(port: number): DashboardRuntimeEventSink {
  const url = `http://127.0.0.1:${port}/api/runtime-events`;

  return (event) => {
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...event,
        source: "agent_loop"
      } satisfies DashboardRuntimeEvent)
    }).catch(() => undefined);
  };
}
