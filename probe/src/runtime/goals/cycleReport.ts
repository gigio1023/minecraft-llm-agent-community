/**
 * Builds compact social-cycle report summaries.
 *
 * @remarks Reports should preserve evidence refs and blocker context without
 * turning provider prose or repeated observation into progress claims.
 */
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
    action_hot_path: "actor_turn",
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
    cycles: [],
    postcondition_results: [],
    plan_bead_ready_fronts: [],
    plan_bead_operation_results: [],
    relationship_application_results: [],
    memory_reuse: {
      retrieved_memory_refs: 0,
      memory_writes: 0,
      used_previous_judgment: false
    }
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
    environmentBlocked?: boolean;
  }
): SocialCycleRunReport["runtime_status"] {
  if (input.providerFailed) {
    return "failed";
  }
  if (input.environmentBlocked) {
    return "environment_blocked";
  }
  if (input.completedCycles < input.expectedCycles) {
    return "blocked";
  }
  if (input.anyMeaningfulProgress) {
    return "passed";
  }
  return "blocked";
}
