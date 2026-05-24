import { assertDirectGeneratedActionSkillSource } from "../../generatedActionSkills/directExecutor.js";
import { getBuiltinPhaseSource } from "./builtinPhaseSources.js";
import type {
  DirectGeneratedSourcePlan,
  DirectGeneratedSourceResolutionStatus,
  ObjectivePhasePlannerPort,
  ObjectivePhasePlannerRequest
} from "./types.js";

export type ResolvedDirectGeneratedSource = DirectGeneratedSourcePlan & {
  resolutionStatus: DirectGeneratedSourceResolutionStatus;
  usedBuiltinFallback: boolean;
};

/**
 * Domain-facing planner orchestration: explicit builtin planners resolve to
 * repo-authored source; LLM planners must produce source that passes the direct
 * action-skill policy before the runtime can execute it.
 */
export async function planDirectGeneratedSource(input: {
  planner: ObjectivePhasePlannerPort;
  request: ObjectivePhasePlannerRequest;
}): Promise<ResolvedDirectGeneratedSource> {
  const proposal = await input.planner.planPhaseSource(input.request);

  if (proposal.plannerId === "builtin-planner") {
    const source = proposal.source.trim() || getBuiltinPhaseSource(input.request.phaseId);
    assertDirectGeneratedActionSkillSource(source);
    return {
      ...proposal,
      sourceKind: "builtin-phase-source",
      source,
      model: "builtin-phase-program",
      resolutionStatus: "ready",
      usedBuiltinFallback: false
    };
  }

  if (proposal.source.trim()) {
    try {
      assertDirectGeneratedActionSkillSource(proposal.source);
      return {
        ...proposal,
        resolutionStatus: "ready",
        usedBuiltinFallback: false
      };
    } catch (error) {
      return {
        ...proposal,
        resolutionStatus: "unsafe_or_rejected_source",
        usedBuiltinFallback: false,
        fallbackReason: `planner source rejected by sandbox: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  return {
    ...proposal,
    source: "",
    resolutionStatus: "provider_blocked",
    usedBuiltinFallback: false,
    fallbackReason: proposal.fallbackReason ?? proposal.errorKind ?? "planner returned no source"
  };
}
