import { assertDirectGeneratedActionSkillSource } from "../../generatedActionSkills/directExecutor.js";
import { getBuiltinPhaseSource } from "./builtinPhaseSources.js";
import type {
  DirectGeneratedSourcePlan,
  ObjectivePhasePlannerPort,
  ObjectivePhasePlannerRequest
} from "./types.js";

export type ResolvedDirectGeneratedSource = DirectGeneratedSourcePlan & {
  usedBuiltinFallback: boolean;
};

/**
 * Domain-facing planner orchestration: ask the selected LLM adapter, then fall back
 * to builtin phase source when needed. Runtime sandbox rejection after execution
 * is still retried by the long-objective runner.
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
      usedBuiltinFallback: true
    };
  }

  if (proposal.source.trim()) {
    try {
      assertDirectGeneratedActionSkillSource(proposal.source);
      return { ...proposal, usedBuiltinFallback: false };
    } catch (error) {
      return toBuiltinPhaseSource(
        proposal,
        input.request.phaseId,
        `planner source rejected by sandbox: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return toBuiltinPhaseSource(
    proposal,
    input.request.phaseId,
    proposal.fallbackReason ?? proposal.errorKind ?? "planner returned no source"
  );
}

function toBuiltinPhaseSource(
  proposal: DirectGeneratedSourcePlan,
  phaseId: string,
  reason: string
): ResolvedDirectGeneratedSource {
  const source = getBuiltinPhaseSource(phaseId);
  assertDirectGeneratedActionSkillSource(source);
  return {
    ...proposal,
    sourceKind: "builtin-phase-source",
    source,
    model: "builtin-phase-program",
    usedBuiltinFallback: true,
    fallbackReason: reason
  };
}
