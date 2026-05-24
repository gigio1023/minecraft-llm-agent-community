import type { JsonValue } from "../inputSnapshot.js";

/** Planner backends that can propose direct-generated TypeScript source text. */
export type ObjectivePhasePlannerId =
  | "gemini-live-planner"
  | "openai-codex-planner"
  | "builtin-planner";

/** Gemini transport paths; owned here so objectives do not import gemini config. */
export type ObjectivePlannerPathId = "text-genai" | "live-transcription";

/**
 * How the phase program was produced.
 * `builtin-phase-source` is a repo-authored template, not an LLM and not a
 * loaded seed action skill bundle.
 */
export type DirectGeneratedSourceKind = "llm-generated-ts" | "builtin-phase-source";

/** Runtime-facing resolution after policy checks have decided whether source may run. */
export type DirectGeneratedSourceResolutionStatus =
  | "ready"
  | "provider_blocked"
  | "unsafe_or_rejected_source";

export type ObjectivePhasePlannerRequest = {
  actorId: string;
  turnId: string;
  actorWorkspaceRootDir: string;
  phaseId: string;
  objectiveId: string;
  prompt: string;
  memoryContext?: JsonValue;
  repoRoot?: string;
};

export type DirectGeneratedSourcePlan = {
  sourceKind: DirectGeneratedSourceKind;
  source: string;
  plannerId: ObjectivePhasePlannerId;
  model: string;
  providerInputRef?: string;
  providerOutputRef?: string;
  selectedPath?: string;
  attemptedPaths?: string[];
  fallbackReason?: string;
  errorKind?: string;
};

export type ObjectivePhasePlannerPort = {
  readonly plannerId: ObjectivePhasePlannerId;
  planPhaseSource(request: ObjectivePhasePlannerRequest): Promise<DirectGeneratedSourcePlan>;
};
