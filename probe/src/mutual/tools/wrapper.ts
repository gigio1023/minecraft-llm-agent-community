import type { ToolResult } from "../types.js";
import {
  runAction,
  type ActionTimeoutPolicy
} from "../../runtime/actions/actionRunner.js";

type WrapperOptions = {
  tool: string;
  timeoutMs?: number;
  timeoutPolicy?: ActionTimeoutPolicy;
  postObserve?: () => Promise<unknown> | unknown;
};

export async function withActionWrapper(
  actionFn: (signal: AbortSignal) => Promise<unknown> | unknown,
  options: WrapperOptions
): Promise<ToolResult> {
  let actionResult: unknown;
  let ok = false;
  let status = "unknown";
  let message: string | undefined;

  const runnerResult = await runAction({
    tool: options.tool,
    action: actionFn,
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.timeoutPolicy ? { timeoutPolicy: options.timeoutPolicy } : {})
  });

  actionResult = runnerResult.value ?? {};

  // Tool implementations can return rich domain statuses such as `busy` or
  // `blocked`; the wrapper normalizes them without erasing action-specific data.
  if (runnerResult.status === "completed") {
    if (typeof actionResult === "object" && actionResult !== null) {
      if ("status" in actionResult) {
        status = String(actionResult.status);
      } else {
        status = "done";
      }
      
      ok = status !== "failed" && status !== "blocked";
      
      if ("message" in actionResult && typeof actionResult.message === "string") {
        message = actionResult.message;
      }
    } else {
      ok = true;
      status = "done";
    }
  } else {
    ok = false;
    status = runnerResult.status;
    message = runnerResult.message;
    actionResult = {};
  }

  let observation: unknown;
  
  const requiresPostObserve = [
    "move_to", "wait", "converse", "drop_item", "say", "reply_to"
  ].includes(options.tool);

  if (requiresPostObserve && options.postObserve && ok) {
    try {
      observation = await options.postObserve();
    } catch (error) {
      // Post-observation improves evidence, but it must not convert a completed
      // action into a failure when the underlying primitive already returned.
    }
  }

  return {
    ...((typeof actionResult === "object" && actionResult !== null) ? actionResult : {}),
    tool: options.tool,
    ok,
    status,
    ...(message ? { message } : {}),
    ...(observation !== undefined ? { observation } : {}),
    durationMs: runnerResult.durationMs,
    timeoutMs: runnerResult.timeoutMs,
    timedOut: runnerResult.timedOut,
    cancelled: runnerResult.cancelled
  };
}

export function toToolResult(value: unknown, fallbackTool: string): ToolResult {
  // Live and deterministic paths both feed lastResult back to providers, so the
  // fallback keeps unknown values transcript-safe instead of passing raw output.
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const tool = typeof record.tool === "string" ? record.tool : fallbackTool;
    const status = typeof record.status === "string" ? record.status : "done";
    const ok =
      typeof record.ok === "boolean"
        ? record.ok
        : status !== "failed" && status !== "blocked";

    return {
      ...record,
      tool,
      ok,
      status
    } as ToolResult;
  }

  return {
    tool: fallbackTool,
    ok: true,
    status: "done"
  };
}
