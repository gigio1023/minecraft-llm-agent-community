import type { ToolResult } from "../types.js";

type WrapperOptions = {
  tool: string;
  postObserve?: () => Promise<unknown> | unknown;
};

export async function withActionWrapper(
  actionFn: () => Promise<unknown> | unknown,
  options: WrapperOptions
): Promise<ToolResult> {
  const startTime = Date.now();
  
  const timeoutMs = 5000;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  let actionResult: unknown;
  let ok = false;
  let status = "unknown";
  let message: string | undefined;

  try {
    actionResult = await Promise.race([actionFn(), timeoutPromise]);
    
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
  } catch (error) {
    ok = false;
    status = "failed";
    message = error instanceof Error ? error.message : String(error);
    actionResult = {};
  }

  const durationMs = Date.now() - startTime;
  
  let observation: unknown;
  
  const requiresPostObserve = [
    "move_to", "wait", "converse", "drop_item", "say", "reply_to"
  ].includes(options.tool);

  if (requiresPostObserve && options.postObserve && ok) {
    try {
      observation = await options.postObserve();
    } catch (error) {
      // Ignore postObserve errors or log them?
    }
  }

  return {
    ...((typeof actionResult === "object" && actionResult !== null) ? actionResult : {}),
    tool: options.tool,
    ok,
    status,
    ...(message ? { message } : {}),
    ...(observation !== undefined ? { observation } : {}),
    durationMs,
  };
}

export function toToolResult(value: unknown, fallbackTool: string): ToolResult {
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
