import type { SocialCycleRunReport } from "./types.js";

export function createEmptySocialCycleReport(input: {
  runId: string;
  actorId: string;
  providerId: SocialCycleRunReport["provider"]["provider_id"];
  model: string;
  reasoning: string;
}): SocialCycleRunReport {
  return {
    schema: "social-cycle-run-report/v1",
    run_id: input.runId,
    actor_id: input.actorId,
    provider: {
      provider_id: input.providerId,
      model: input.model,
      reasoning: input.reasoning
    },
    runtime_status: "blocked",
    agency_status: {
      life_goal_source: "actor_soul",
      strategic_goal_source: "runtime_rule",
      cycle_goal_source: "runtime_rule",
      used_soul: false,
      used_life_goal: false,
      used_previous_judgment: false,
      used_memory_refs: 0,
      used_relationship_refs: 0,
      used_world_event_refs: 0,
      builtin_goal_authority: false,
      builtin_execution_source: false,
      fixture_dependency: false,
      helper_expansion_count: 0,
      gameplay_progress_verified: false
    },
    cycles: []
  };
}

export function finalizeRuntimeStatus(
  report: SocialCycleRunReport,
  input: {
    providerFailed: boolean;
    anyMeaningfulProgress: boolean;
    completedCycles: number;
    expectedCycles: number;
    fixtureDependency: boolean;
  }
): SocialCycleRunReport["runtime_status"] {
  if (input.providerFailed) {
    return "failed";
  }
  if (input.completedCycles < input.expectedCycles) {
    return "blocked";
  }
  if (input.fixtureDependency) {
    return "passed";
  }
  if (input.anyMeaningfulProgress) {
    return "passed";
  }
  return "blocked";
}
