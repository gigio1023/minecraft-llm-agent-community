import type { ObjectivePlannerPathId } from "../planner/types.js";

/** @deprecated Prefer ObjectivePlannerPathId from provider/planner/types. */
export type GeminiPlannerPathId = ObjectivePlannerPathId;

export type GeminiPlannerConfig = {
  providerId: "gemini-live-planner";
  primaryPath: GeminiPlannerPathId;
  fallbackPath?: GeminiPlannerPathId;
  textModel: string;
  textFallbackModel: string;
  textRequestTimeoutMs: number;
  textMaxParallel: number;
  liveModel: string;
  liveResponseMode: string;
  liveMaxSessions: number;
  liveTurnTimeoutMs: number;
  liveEndpoint: string;
  liveApiVersion: string;
};

function parseProviderOrder(raw: string | undefined): GeminiPlannerPathId[] {
  const defaults: GeminiPlannerPathId[] = ["live-transcription", "text-genai"];
  if (!raw?.trim()) {
    return defaults;
  }

  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is GeminiPlannerPathId =>
      entry === "text-genai" || entry === "live-transcription"
    );

  return parsed.length > 0 ? parsed : defaults;
}

export function resolveGeminiPlannerPathOrder(forcePath?: GeminiPlannerPathId): GeminiPlannerPathId[] {
  if (forcePath) {
    return [forcePath];
  }

  const forced = process.env.GEMINI_PLANNER_FORCE_PATH?.trim();
  if (forced === "native-audio-dialog") {
    return ["live-transcription"];
  }
  if (forced === "text-genai" || forced === "live-transcription") {
    return [forced];
  }

  const primary = process.env.GEMINI_PLANNER_PRIMARY?.trim();
  if (primary === "native-audio-dialog" || primary === "live-transcription") {
    return ["live-transcription", "text-genai"];
  }
  if (primary === "text-genai") {
    return ["text-genai", "live-transcription"];
  }

  return parseProviderOrder(process.env.PROBE_LONG_OBJECTIVE_PROVIDER_ORDER);
}

export function loadGeminiPlannerConfig(forcePath?: GeminiPlannerPathId): GeminiPlannerConfig {
  const order = resolveGeminiPlannerPathOrder(forcePath);
  const [primaryPath, fallbackPath] = order;

  return {
    providerId: "gemini-live-planner",
    primaryPath: primaryPath ?? "text-genai",
    fallbackPath: fallbackPath,
    textModel: process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-2.5-flash",
    textFallbackModel: process.env.GEMINI_TEXT_FALLBACK_MODEL?.trim() || "gemini-2.5-flash-lite",
    textRequestTimeoutMs: Number(process.env.GEMINI_TEXT_REQUEST_TIMEOUT_MS ?? 900_000),
    textMaxParallel: Number(process.env.GEMINI_TEXT_MAX_PARALLEL ?? 1),
    liveModel:
      process.env.GEMINI_LIVE_MODEL?.trim() ||
      process.env.GEMINI_NATIVE_AUDIO_DIALOG_MODEL?.trim() ||
      "gemini-2.5-flash-native-audio-latest",
    liveApiVersion: process.env.GEMINI_LIVE_API_VERSION?.trim() || "v1alpha",
    liveResponseMode:
      process.env.GEMINI_LIVE_RESPONSE_MODE?.trim() || "audio_with_output_transcription",
    liveMaxSessions: Number(process.env.GEMINI_LIVE_MAX_SESSIONS ?? 1),
    liveTurnTimeoutMs: Number(process.env.GEMINI_LIVE_TURN_TIMEOUT_MS ?? 900_000),
    liveEndpoint:
      process.env.GEMINI_LIVE_ENDPOINT?.trim() ||
      "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
  };
}
