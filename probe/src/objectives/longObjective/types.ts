/**
 * Data contracts for direct long-objective planner, execution, and review
 * reports.
 *
 * @remarks These types document the direct-generated objective path without
 * making it the current social simulation runtime architecture.
 */
import type { GeneratedActionSkillHelperEvent } from "../../generatedActionSkills/directExecutor.js";
import type { DirectGeneratedActionSkillRunResult } from "../../generatedActionSkills/directExecutor.js";
import type { LongObjectiveId } from "./ladder.js";

export type LongObjectiveStopReason =
  | "objective_passed"
  | "phase_failed"
  | "environment_blocked"
  | "provider_blocked"
  | "missing_helper"
  | "missing_verifier"
  | "budget_exhausted_with_progress"
  | "budget_exhausted_without_progress"
  | "unsafe_or_rejected_source";

export type InventoryItem = {
  name: string;
  count: number;
};

export type LongObjectivePhaseReport = {
  phaseId: string;
  summary: string;
  status: "passed" | "failed" | "skipped";
  verifierStatus: "passed" | "failed" | "missing";
  verifierReason: string;
  generated: {
    providerId: string;
    sourceKind?: "llm-generated-ts" | "builtin-phase-source";
    model: string;
    sourcePath?: string;
    providerInputRef?: string;
    providerOutputRef?: string;
    fallbackReason?: string;
    execution: DirectGeneratedActionSkillRunResult;
  };
  evidence: {
    preInventory: InventoryItem[];
    postInventory: InventoryItem[];
    itemName: string;
    beforeCount: number;
    afterCount: number;
    delta: number;
    blockObservations?: Array<{ name: string; distance: number }>;
  };
  helperEvents: GeneratedActionSkillHelperEvent[];
  memoryPaths?: string[];
};

export type LongObjectiveReport = {
  schema: "long-objective-report/v1";
  runId: string;
  objectiveId: LongObjectiveId;
  actorId: string;
  providerId: string;
  evidenceScope: "current_run";
  status: "passed" | "failed" | "blocked";
  stopReason: LongObjectiveStopReason;
  phases: LongObjectivePhaseReport[];
  artifactRefs: {
    actorWorkspaceTrialPath: string;
    actorMemoryPaths?: string[];
    requestedReportPath?: string;
  };
  nextRecommendedPhase?: string;
  nextImplementationTasks: string[];
};
