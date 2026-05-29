import type { ObjectivePlannerPathId } from "../planner/types.js";

/** @deprecated Prefer ObjectivePlannerPathId from provider/planner/types. */
export type GeminiPlannerPathId = ObjectivePlannerPathId;

export type GeminiPlannerConfig = {
  providerId: "gemini-planner";
  primaryPath: GeminiPlannerPathId;
  fallbackPath?: GeminiPlannerPathId;
  textModel: string;
  textFallbackModel: string;
  textRequestTimeoutMs: number;
  textMaxParallel: number;
};

function parseProviderOrder(raw: string | undefined): GeminiPlannerPathId[] {
  const defaults: GeminiPlannerPathId[] = ["text-genai"];
  if (!raw?.trim()) {
    return defaults;
  }

  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is GeminiPlannerPathId => entry === "text-genai");

  return parsed.length > 0 ? parsed : defaults;
}

export function resolveGeminiPlannerPathOrder(forcePath?: GeminiPlannerPathId): GeminiPlannerPathId[] {
  if (forcePath) {
    return [forcePath];
  }

  const forced = process.env.GEMINI_PLANNER_FORCE_PATH?.trim();
  if (forced === "text-genai") {
    return [forced];
  }

  const primary = process.env.GEMINI_PLANNER_PRIMARY?.trim();
  if (primary === "text-genai") {
    return ["text-genai"];
  }

  return parseProviderOrder(process.env.PROBE_LONG_OBJECTIVE_PROVIDER_ORDER);
}

export function loadGeminiPlannerConfig(forcePath?: GeminiPlannerPathId): GeminiPlannerConfig {
  const order = resolveGeminiPlannerPathOrder(forcePath);
  const [primaryPath, fallbackPath] = order;

  return {
    providerId: "gemini-planner",
    primaryPath: primaryPath ?? "text-genai",
    fallbackPath: fallbackPath,
    textModel: process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-2.5-flash",
    textFallbackModel: process.env.GEMINI_TEXT_FALLBACK_MODEL?.trim() || "gemini-2.5-flash-lite",
    textRequestTimeoutMs: Number(process.env.GEMINI_TEXT_REQUEST_TIMEOUT_MS ?? 900_000),
    textMaxParallel: Number(process.env.GEMINI_TEXT_MAX_PARALLEL ?? 1)
  };
}
