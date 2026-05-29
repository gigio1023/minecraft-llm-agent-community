import type { ObjectivePhasePlannerId } from "./types.js";

const CANONICAL_PLANNER_IDS: readonly ObjectivePhasePlannerId[] = [
  "gemini-planner",
  "openai-codex-planner",
  "builtin-planner"
];

function normalizeExplicitPlannerId(raw: string): ObjectivePhasePlannerId {
  if (raw === "gemini-live-planner" || raw === "gemini-planner") {
    return "gemini-planner";
  }
  if (raw === "openai-codex-planner" || raw === "openai-codex") {
    return "openai-codex-planner";
  }
  if (raw === "builtin-planner" || raw === "builtin" || raw === "deterministic") {
    return "builtin-planner";
  }

  throw new Error(
    `Unknown objective phase planner: ${raw}. Expected one of: ${CANONICAL_PLANNER_IDS.join(", ")}`
  );
}

/**
 * Resolves CLI/env provider strings to a canonical planner id.
 * Env fallback applies only when no explicit provider was given.
 */
export function normalizeObjectivePhasePlannerId(explicit?: string): ObjectivePhasePlannerId {
  const trimmed = explicit?.trim();
  if (trimmed) {
    return normalizeExplicitPlannerId(trimmed);
  }

  const fromEnv = process.env.PROBE_LONG_OBJECTIVE_PROVIDER?.trim();
  if (fromEnv) {
    return normalizeExplicitPlannerId(fromEnv);
  }

  return "gemini-planner";
}
