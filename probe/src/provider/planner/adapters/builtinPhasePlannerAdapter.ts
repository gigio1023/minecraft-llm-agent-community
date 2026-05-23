import { getBuiltinPhaseSource } from "../builtinPhaseSources.js";
import type {
  DirectGeneratedSourcePlan,
  ObjectivePhasePlannerPort,
  ObjectivePhasePlannerRequest
} from "../types.js";

/** Skips external LLM calls and always returns a builtin phase program. */
export class BuiltinPhasePlannerAdapter implements ObjectivePhasePlannerPort {
  readonly plannerId = "builtin-planner" as const;

  planPhaseSource(request: ObjectivePhasePlannerRequest): Promise<DirectGeneratedSourcePlan> {
    return Promise.resolve({
      sourceKind: "builtin-phase-source",
      source: getBuiltinPhaseSource(request.phaseId),
      plannerId: this.plannerId,
      model: "builtin-phase-program",
      fallbackReason: "builtin planner selected explicitly"
    });
  }
}
