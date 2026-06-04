/**
 * Error taxonomy for Gemini planner/provider failures.
 *
 * @remarks Classifying provider failures keeps setup, quota, schema, and model
 * issues separate from runtime action evidence.
 */
export type GeminiPlannerErrorKind =
  | "auth_missing"
  | "auth_invalid"
  | "quota_exceeded"
  | "rate_limited"
  | "session_blocked"
  | "timeout"
  | "network"
  | "parse"
  | "unknown";

export class GeminiPlannerError extends Error {
  readonly kind: GeminiPlannerErrorKind;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(input: {
    kind: GeminiPlannerErrorKind;
    message: string;
    retryable?: boolean;
    statusCode?: number;
    cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = "GeminiPlannerError";
    this.kind = input.kind;
    this.retryable =
      input.retryable ??
      (input.kind === "rate_limited" ||
        input.kind === "quota_exceeded" ||
        input.kind === "timeout" ||
        input.kind === "network");
    this.statusCode = input.statusCode;
  }
}

export function classifyGeminiError(error: unknown): GeminiPlannerError {
  if (error instanceof GeminiPlannerError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;

  if (/api key|unauthorized|401|403/i.test(message)) {
    return new GeminiPlannerError({
      kind: statusCode === 401 ? "auth_invalid" : "auth_missing",
      message,
      statusCode
    });
  }

  if (statusCode === 429 || /quota|rate.?limit|resource.?exhausted/i.test(message)) {
    return new GeminiPlannerError({
      kind: statusCode === 429 ? "rate_limited" : "quota_exceeded",
      message,
      retryable: true,
      statusCode
    });
  }

  if (/timeout|timed out/i.test(message)) {
    return new GeminiPlannerError({ kind: "timeout", message, retryable: true, statusCode });
  }

  if (/session|websocket|live/i.test(message)) {
    return new GeminiPlannerError({ kind: "session_blocked", message, retryable: false, statusCode });
  }

  if (/network|fetch failed|econn/i.test(message)) {
    return new GeminiPlannerError({ kind: "network", message, retryable: true, statusCode });
  }

  return new GeminiPlannerError({ kind: "unknown", message, statusCode, cause: error });
}
