/** Regression coverage for the bounded social-cycle runner loop. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  runSocialCycle,
  selectGeminiFallbackModelsForCall,
  selectGeminiModelForCall
} from "../src/runtime/socialCycleRunner.js";
import { cycleGoalProviderInputIncludesSoulAndLifeGoal } from "../src/runtime/goals/types.js";
import { readJsonIfExists } from "../src/runtime/goals/goalJsonStore.js";
import { initializeActorWorkspaces } from "../src/runtime/actorWorkspace.js";
import { ensureActorSoul } from "../src/runtime/goals/actorSoulStore.js";
import { ensureActiveLifeGoal } from "../src/runtime/goals/lifeGoalStore.js";
import { assignSeedActionSkillOwnership } from "../src/skills/ownership.js";
import { getActorProfile } from "../src/npc/profiles.js";
import { writeStrategicGoal } from "../src/runtime/goals/strategicGoalStore.js";
import type { StrategicGoal } from "../src/runtime/goals/types.js";
import {
  appendPlanBeadDependency,
  readActorPlanBead,
  writeActorPlanBead,
  type ActorPlanBead
} from "../src/runtime/goals/planBeads/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `social-runner-${process.pid}-${Date.now()}`);

type ReportActionAttempt = {
  attempt_id: string;
  action_index: number;
  turn_id: string;
  active_episode_id?: string;
  action_ref: string;
  provider_input_refs: string[];
  provider_output_refs: string[];
  evidence_refs: string[];
  judgment_ref: string;
  verifier_status: string;
  executed_tools: string[];
  runtime_status: string;
  branch_recommended?: boolean;
  branch_reason?: string;
};

function readActionAttempts(cycle: unknown): ReportActionAttempt[] {
  const attempts = (cycle as { action_attempts?: unknown }).action_attempts;
  return Array.isArray(attempts) ? attempts as ReportActionAttempt[] : [];
}

function runnerPlanBead(input: {
  beadId: string;
  lifeGoalId: string;
  status: ActorPlanBead["status"];
  priority: ActorPlanBead["priority"];
}): ActorPlanBead {
  return {
    schema: "actor-plan-bead/v1",
    bead_id: input.beadId,
    actor_id: "npc_b",
    life_goal_id: input.lifeGoalId,
    kind: "concern",
    status: input.status,
    priority: input.priority,
    title: `Runner ${input.beadId}`,
    description: "Seeded PlanBead for deterministic social-cycle continuity proof.",
    design_notes: "Context only; not executable authority.",
    acceptance_criteria: {
      evidence_required: ["runtime evidence"],
      non_physical_resolution_allowed: true
    },
    notes: {
      completed: [],
      in_progress: [],
      blockers: [],
      next: [`Keep ${input.beadId} visible in ready-front context.`],
      key_decisions: []
    },
    labels: ["runner-proof"],
    metadata: {},
    refs: {
      evidence_refs: [`plan-beads/beads/${input.beadId}.json`],
      memory_refs: [],
      judgment_refs: [],
      cycle_goal_refs: [],
      relationship_refs: [],
      world_event_refs: [],
      action_skill_refs: []
    },
    checkpoint: {
      version: 1,
      created_at: "2026-05-31T00:00:00.000Z",
      updated_at: "2026-05-31T00:00:00.000Z",
      evidence_refs: [`plan-beads/beads/${input.beadId}.json`]
    },
    assertion_policy: {
      bead_is_context_not_authority: true,
      physical_success_requires_current_evidence: true
    }
  };
}

function runnerStrategicGoal(index: number): StrategicGoal {
  const padded = String(index).padStart(2, "0");
  return {
    schema: "actor-strategic-goal/v1",
    actor_id: "npc_b",
    strategic_goal_id: `strategic-test-${padded}`,
    life_goal_id: "life-npc_b",
    status: "active",
    summary: `Historical strategic goal ${padded}`,
    rationale: "Seeded to prove provider inputs do not resend the whole strategic history.",
    derived_from: {
      soul_ref: "goals/soul/soul-npc_b.json",
      world_event_refs: [],
      memory_refs: [],
      relationship_refs: [],
      previous_cycle_judgment_refs: []
    },
    success_direction: "Keep the latest relevant goals visible without flooding the provider.",
    current_blockers: [`historical blocker ${padded}`],
    updated_at: `2026-05-31T00:${padded}:00.000Z`
  };
}

test("deterministic-social run writes two cycles and cites prior judgment", async () => {
  const reportPath = path.join(rootDir, "deterministic-report.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 2,
    maxActionsPerCycle: 2,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: path.join(rootDir, "actors"),
    actionHotPath: "legacy"
  });

  assert.equal(result.report.cycles.length, 2);
  assert.equal(result.report.agency_status.used_soul, true);
  assert.equal(result.report.agency_status.used_life_goal, true);
  assert.equal(result.report.agency_status.cycle_goal_source, "runtime_rule");
  assert.equal(result.report.agency_status.builtin_goal_authority, true);
  assert.equal(result.report.agency_status.builtin_execution_source, true);
  assert.equal(result.report.agency_status.used_previous_judgment, true);
  assert.equal(result.report.runtime_status, "blocked");
  assert.equal(result.report.agency_status.gameplay_progress_verified, false);
  assert.equal(result.report.plan_bead_ready_fronts?.length, 2);
  assert.equal(result.report.plan_bead_ready_fronts?.[0]?.ready_bead_ids.length, 0);
  assert.ok(result.report.cycles[0]?.plan_bead_packet_ref);
  assert.equal(result.report.settlement_state?.schema, "settlement-state/v1");
  assert.equal(result.report.settlement_checklist?.schema, "settlement-checklist/v1");
  assert.equal(result.report.memory_reuse?.used_previous_judgment, true);
  assert.ok((result.report.memory_reuse?.memory_writes ?? 0) >= 2);

  const actorDir = path.join(rootDir, "actors", "npc_b");
  const cycle2CycleGoalProviderInput = result.report.cycles[1]?.provider_input_refs[0];
  assert.ok(cycle2CycleGoalProviderInput);
  const snapshot = await readJsonIfExists<{ input?: unknown }>(
    path.join(actorDir, cycle2CycleGoalProviderInput)
  );
  assert.equal(cycleGoalProviderInputIncludesSoulAndLifeGoal(snapshot?.input), true);
  const prior = (snapshot?.input as { previous_cycle_judgments?: unknown[] })?.previous_cycle_judgments;
  assert.ok(prior && prior.length > 0);
  assert.equal(prior.length, 1);
  assert.equal((prior[0] as { cycle_id?: string }).cycle_id, "cycle-0001");
  const planBeadPacket = (snapshot?.input as { plan_bead_packet?: { graph_summary?: { open_count?: number } } })
    ?.plan_bead_packet;
  assert.equal(planBeadPacket?.graph_summary?.open_count, 0);
});

test("Gemini social-cycle model rotation selects one model per provider call", () => {
  const rotation = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
  assert.equal(
    selectGeminiModelForCall({ rotation, callIndex: 0, fallbackModel: "gemma-4-31b-it" }),
    "gemini-3-flash-preview"
  );
  assert.equal(
    selectGeminiModelForCall({ rotation, callIndex: 1, fallbackModel: "gemma-4-31b-it" }),
    "gemini-2.5-flash"
  );
  assert.equal(
    selectGeminiModelForCall({ rotation, callIndex: 3, fallbackModel: "gemma-4-31b-it" }),
    "gemini-3-flash-preview"
  );
  assert.equal(
    selectGeminiModelForCall({ rotation: [], callIndex: 3, fallbackModel: "gemma-4-31b-it" }),
    "gemma-4-31b-it"
  );
  assert.deepEqual(
    selectGeminiFallbackModelsForCall({
      rotation,
      callIndex: 0,
      fallbackModel: "gemini-3-flash-preview"
    }),
    ["gemini-2.5-flash", "gemini-3.1-flash-lite"]
  );
});

test("social-cycle provider inputs are stage-specific and bounded", async () => {
  const isolatedRoot = path.join(rootDir, "projected-provider-inputs");
  const actorId = "npc_b";
  for (let index = 0; index < 9; index++) {
    await writeStrategicGoal(isolatedRoot, actorId, runnerStrategicGoal(index));
  }

  const reportPath = path.join(isolatedRoot, "projected-report.json");
  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 1,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "legacy"
  });

  const actorDir = path.join(isolatedRoot, actorId);
  const refs = result.report.cycles[0]?.provider_input_refs ?? [];
  const goalMindRef = refs.find((ref) => ref.includes("goal-mind"));
  const actionPlannerRef = refs.find((ref) => ref.includes("action-planner"));
  const judgmentRef = refs.find((ref) => ref.includes("cycle-judgment"));
  assert.ok(goalMindRef);
  assert.ok(actionPlannerRef);
  assert.ok(judgmentRef);

  const goalMind = await readJsonIfExists<{ input?: Record<string, unknown> }>(
    path.join(actorDir, goalMindRef)
  );
  assert.equal(goalMind?.input?.schema, "social-goal-mind-input/v1");
  assert.equal(Array.isArray(goalMind?.input?.strategic_goals), true);
  assert.equal((goalMind?.input?.strategic_goals as unknown[]).length, 6);
  assert.equal((goalMind?.input?.strategic_goal_window as { omitted_count?: number })?.omitted_count, 3);
  assert.equal(goalMind?.input?.action_surface, undefined);
  assert.ok(goalMind?.input?.minecraft_basic_guide);
  assert.ok(
    (goalMind?.input?.minecraft_basic_guide as { coordinates_and_visibility?: unknown })
      ?.coordinates_and_visibility
  );
  assert.ok(
    (goalMind?.input?.minecraft_basic_guide as { breaking_and_drops?: unknown })
      ?.breaking_and_drops
  );
  assert.equal(
    (goalMind?.input?.minecraft_basic_guide as { schema?: string })?.schema,
    "minecraft-basic-guide/v1"
  );
  const knownItemFlows = (goalMind?.input?.minecraft_basic_guide as {
    known_item_flows?: Array<{ output?: string; station?: string; inputs?: unknown[] }>;
  })?.known_item_flows;
  assert.ok(Array.isArray(knownItemFlows));
  assert.ok(
    knownItemFlows.some(
      (flow) => flow.output === "wooden_pickaxe" && flow.station === "placed_crafting_table_3x3"
    )
  );
  assert.ok(
    knownItemFlows.some((flow) => flow.output === "crafting_table" && flow.station === "inventory_2x2")
  );
  const blockedRecoveryGuides = (goalMind?.input?.minecraft_basic_guide as {
    blocked_recovery_guides?: Array<{ blocked_reason_contains?: string; next_action_rule?: string }>;
  })?.blocked_recovery_guides;
  assert.ok(Array.isArray(blockedRecoveryGuides));
  assert.ok(
    blockedRecoveryGuides.some((guide) =>
      guide.blocked_reason_contains?.includes("requires crafting_table in inventory")
    )
  );
  assert.match(
    String(
      (goalMind?.input?.minecraft_basic_guide as {
        observe_stop_guides?: { same_missing_prerequisite_limit?: unknown };
      })?.observe_stop_guides?.same_missing_prerequisite_limit
    ),
    /observe has stopped being useful/
  );
  assert.match(
    String(
      (goalMind?.input?.minecraft_basic_guide as {
        crafting_and_stations?: { wooden_pickaxe_preconditions?: unknown };
      })?.crafting_and_stations?.wooden_pickaxe_preconditions
    ),
    /reachable placed crafting_table/
  );
  assert.match(
    String(
      (goalMind?.input?.minecraft_basic_guide as {
        basic_progression_dependencies?: { recover_from_missing_prerequisite?: unknown };
      })?.basic_progression_dependencies?.recover_from_missing_prerequisite
    ),
    /missing crafting_table item -> craft it/
  );
  assert.ok(goalMind?.input?.action_surface_summary);
  assert.equal(
    (goalMind?.input?.action_surface_summary as { direct_action_skills?: unknown })
      ?.direct_action_skills,
    undefined
  );

  const actionPlanner = await readJsonIfExists<{ input?: Record<string, unknown> }>(
    path.join(actorDir, actionPlannerRef)
  );
  assert.equal(actionPlanner?.input?.schema, "social-action-planner-input/v1");
  assert.equal(actionPlanner?.input?.action_surface, undefined);
  assert.equal(actionPlanner?.input?.owned_action_skills, undefined);
  assert.equal(actionPlanner?.input?.settlement_checklist, undefined);
  assert.ok(actionPlanner?.input?.minecraft_basic_guide);
  assert.ok(actionPlanner?.input?.runtime_affordances);
  assert.ok(actionPlanner?.input?.direct_action_skills);
  assert.ok(actionPlanner?.input?.candidate_action_skill_search);
  assert.equal(
    (actionPlanner?.input?.actor_turn_contract as { schema?: string })?.schema,
    "actor-turn-contract/v1"
  );
  assert.ok(Array.isArray(actionPlanner?.input?.action_cards));
  assert.ok(
    (actionPlanner?.input?.action_cards as Array<Record<string, unknown>>).every(
      (card) =>
        card.schema === "action-card/v1" &&
        card.primitive_id === undefined &&
        card.action_skill_id === undefined
    )
  );

  const judgment = await readJsonIfExists<{ input?: Record<string, unknown> }>(
    path.join(actorDir, judgmentRef)
  );
  assert.equal(judgment?.input?.schema, "social-cycle-judgment-input/v1");
  assert.equal(judgment?.input?.action_surface, undefined);
  assert.equal(judgment?.input?.settlement_checklist, undefined);
  assert.ok(judgment?.input?.runtime_result);
  assert.ok(judgment?.input?.minecraft_basic_guide);
  assert.ok(judgment?.input?.action_surface_summary);
  assert.equal(
    (judgment?.input?.action_surface_summary as { direct_action_skills?: unknown })
      ?.direct_action_skills,
    undefined
  );
});

test("deterministic-social maxActionsPerCycle=2 report keeps observe and wait attempts", async () => {
  const isolatedRoot = path.join(rootDir, `multi-action-${Date.now()}`);
  const reportPath = path.join(isolatedRoot, "deterministic-report.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 1,
    maxActionsPerCycle: 2,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: path.join(isolatedRoot, "actors")
  });

  const cycle = result.report.cycles[0];
  assert.ok(cycle);
  assert.equal(result.report.action_hot_path, "actor_turn");
  const attempts = readActionAttempts(cycle);
  assert.equal(attempts.length, 2);
  assert.deepEqual(attempts.map((attempt) => attempt.action_index), [0, 1]);
  assert.deepEqual(attempts.map((attempt) => attempt.turn_id), [
    "cycle-0001-action-01",
    "cycle-0001-action-02"
  ]);
  assert.deepEqual(attempts.map((attempt) => attempt.executed_tools), [["observe"], ["wait"]]);
  assert.deepEqual(attempts.map((attempt) => attempt.runtime_status), ["blocked", "completed"]);
  assert.notEqual(attempts[0]?.action_ref, attempts[1]?.action_ref);
  assert.ok(attempts[0]?.action_ref.includes("cycle-0001-action-01"));
  assert.ok(attempts[1]?.action_ref.includes("cycle-0001-action-02"));
  assert.notEqual(attempts[0]?.judgment_ref, attempts[1]?.judgment_ref);
});

test("deterministic-social actor_turn action path writes Actor Turn snapshots and resolved intents", async () => {
  const isolatedRoot = path.join(rootDir, "actor-turn-hot-path");
  const reportPath = path.join(isolatedRoot, "actor-turn-report.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 1,
    maxActionsPerCycle: 2,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "actor_turn"
  });

  assert.equal(result.report.action_hot_path, "actor_turn");
  const actorDir = path.join(isolatedRoot, "npc_b");
  const attempts = readActionAttempts(result.report.cycles[0]);
  assert.equal(attempts.length, 2);

  const actorTurnInputRefs = attempts
    .flatMap((attempt) => attempt.provider_input_refs)
    .filter((ref) => ref.includes("actor-turn"));
  assert.equal(actorTurnInputRefs.length, 2);
  assert.equal(
    attempts.flatMap((attempt) => attempt.provider_input_refs).some((ref) => ref.includes("cycle-judgment")),
    false
  );
  assert.equal(
    attempts.flatMap((attempt) => attempt.provider_output_refs).some((ref) => ref.includes("cycle-judgment")),
    false
  );

  const actorTurnSnapshot = await readJsonIfExists<{ input?: Record<string, unknown> }>(
    path.join(actorDir, actorTurnInputRefs[0]!)
  );
  assert.equal(actorTurnSnapshot?.input?.schema, "actor-turn-input/v1");
  assert.ok(Array.isArray(actorTurnSnapshot?.input?.action_cards));
  assert.ok(
    (actorTurnSnapshot?.input?.action_cards as Array<Record<string, unknown>>).every(
      (card) =>
        card.schema === "action-card/v1" &&
        card.primitive_id === undefined &&
        card.action_skill_id === undefined
    )
  );
  assert.equal(
    (actorTurnSnapshot?.input?.active_episode as { schema?: string })?.schema,
    "active-episode/v1"
  );

  const firstIntent = await readJsonIfExists<{ kind?: string; primitive_id?: string }>(
    path.join(actorDir, attempts[0]!.action_ref)
  );
  const secondIntent = await readJsonIfExists<{ kind?: string; primitive_id?: string }>(
    path.join(actorDir, attempts[1]!.action_ref)
  );
  assert.equal(firstIntent?.kind, "use_primitive");
  assert.equal(firstIntent?.primitive_id, "observe");
  assert.equal(secondIntent?.kind, "use_primitive");
  assert.equal(secondIntent?.primitive_id, "wait");

  const judgment = await readJsonIfExists<{ what_happened?: string; bead_op_proposals?: unknown[] }>(
    path.join(actorDir, result.report.cycles[0]!.judgment_ref)
  );
  assert.match(judgment?.what_happened ?? "", /Runtime classifier/);
  assert.deepEqual(judgment?.bead_op_proposals, []);
});

test("shared-storage social smoke writes run-scoped request into Actor Turn context", async () => {
  const isolatedRoot = path.join(rootDir, "shared-storage-social-smoke");
  const reportPath = path.join(isolatedRoot, "shared-storage-social-smoke-report.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 1,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "actor_turn",
    sharedStorageSocialSmoke: true
  });

  assert.equal(result.report.server?.shared_storage_social_smoke, true);
  const actorDir = path.join(isolatedRoot, "npc_b");
  const providerInputRefs = result.report.cycles.flatMap((cycle) => cycle.provider_input_refs);
  const goalMindRef = providerInputRefs.find((ref) => ref.includes("goal-mind"));
  const actorTurnRef = providerInputRefs.find((ref) => ref.includes("actor-turn"));
  assert.ok(goalMindRef);
  assert.ok(actorTurnRef);

  const goalMind = await readJsonIfExists<{ input?: { world_events?: Array<{ summary?: string; actor_refs?: string[] }> } }>(
    path.join(actorDir, goalMindRef)
  );
  const smokeGoalEvent = goalMind?.input?.world_events?.find((event) =>
    event.summary?.includes("deposit one oak_log into shared storage")
  );
  assert.ok(smokeGoalEvent);
  assert.deepEqual(smokeGoalEvent.actor_refs, ["npc_a", "npc_b"]);

  const actorTurn = await readJsonIfExists<{
    input?: {
      active_episode?: { social_pressure?: Array<{ summary?: string }> };
      current_state?: { obligation_summaries?: string[] };
    };
  }>(path.join(actorDir, actorTurnRef));
  assert.ok(
    actorTurn?.input?.active_episode?.social_pressure?.some((pressure) =>
      pressure.summary?.includes("deposit one oak_log into shared storage")
    )
  );
  assert.ok(
    actorTurn?.input?.current_state?.obligation_summaries?.some((summary) =>
      summary.includes("deposit one oak_log into shared storage")
    )
  );
});

test("deterministic-social actor_turn reuses Active Episode without repeated goal mind", async () => {
  const isolatedRoot = path.join(rootDir, "actor-turn-episode-continuation");
  const reportPath = path.join(isolatedRoot, "actor-turn-continuation-report.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 2,
    maxActionsPerCycle: 2,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "actor_turn"
  });

  const actorDir = path.join(isolatedRoot, "npc_b");
  const providerInputRefs = result.report.cycles.flatMap((cycle) => cycle.provider_input_refs);
  assert.equal(providerInputRefs.filter((ref) => ref.includes("goal-mind")).length, 1);
  assert.equal(providerInputRefs.filter((ref) => ref.includes("actor-turn")).length, 4);
  assert.equal(providerInputRefs.some((ref) => ref.includes("action-planner")), false);
  assert.equal(providerInputRefs.some((ref) => ref.includes("cycle-judgment")), false);
  assert.equal(result.report.active_episode_refs?.length, 1);
  assert.equal(result.report.deliberation_branch_refs?.length ?? 0, 0);
  assert.equal(result.report.cycles[0]?.active_episode_ref, result.report.cycles[1]?.active_episode_ref);

  const actorTurnSnapshots = await Promise.all(
    providerInputRefs
      .filter((ref) => ref.includes("actor-turn"))
      .map((ref) => readJsonIfExists<{ input?: { active_episode?: { episode_id?: string; current_focus?: string }; recent_evidence_trace?: Array<{ episode_id?: string }> } }>(
        path.join(actorDir, ref)
      ))
  );
  const episodeIds = new Set(
    actorTurnSnapshots.map((snapshot) => snapshot?.input?.active_episode?.episode_id)
  );
  assert.deepEqual([...episodeIds], ["episode-cycle-0001"]);

  const cycle2Turn = actorTurnSnapshots[2]?.input;
  assert.ok((cycle2Turn?.recent_evidence_trace?.length ?? 0) > 0);
  assert.ok(cycle2Turn?.recent_evidence_trace?.every((entry) => entry.episode_id === "episode-cycle-0001"));

  const cycle2Goal = await readJsonIfExists<{ source?: string; summary?: string }>(
    path.join(actorDir, result.report.cycles[1]!.cycle_goal_ref)
  );
  assert.equal(cycle2Goal?.source, "runtime_rule");
  assert.equal(cycle2Goal?.summary, actorTurnSnapshots[0]?.input?.active_episode?.current_focus);
});

test("deterministic-social actor_turn branches through dedicated Deliberation provider", async () => {
  const isolatedRoot = path.join(rootDir, "actor-turn-deliberation-branch");
  const reportPath = path.join(isolatedRoot, "actor-turn-branch-report.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 2,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "actor_turn",
    deterministicActorTurnPrimitives: ["move_to", "observe"]
  });

  const actorDir = path.join(isolatedRoot, "npc_b");
  const providerInputRefs = result.report.cycles.flatMap((cycle) => cycle.provider_input_refs);
  assert.equal(providerInputRefs.filter((ref) => ref.includes("goal-mind")).length, 1);
  assert.equal(providerInputRefs.filter((ref) => ref.includes("deliberation")).length, 1);
  assert.equal(providerInputRefs.filter((ref) => ref.includes("actor-turn")).length, 2);
  assert.equal(providerInputRefs.some((ref) => ref.includes("cycle-judgment")), false);
  assert.equal(result.report.deliberation_branch_refs?.length, 1);
  assert.equal(result.report.active_episode_refs?.length, 2);
  assert.notEqual(result.report.cycles[0]?.active_episode_ref, result.report.cycles[1]?.active_episode_ref);
  assert.equal(result.report.cycles[0]?.deliberation_trigger_reason, "episode_blocked");
  assert.equal(result.report.cycles[0]?.deliberation_branch_ref, result.report.deliberation_branch_refs?.[0]);
  assert.equal(result.report.cycles[1]?.deliberation_branch_ref, undefined);
  assert.equal(readActionAttempts(result.report.cycles[0])[0]?.branch_recommended, true);
  assert.match(readActionAttempts(result.report.cycles[0])[0]?.branch_reason ?? "", /runtime verifier failed/);

  const branch = await readJsonIfExists<{ current_episode_ref?: string; reason?: string }>(
    path.join(actorDir, result.report.deliberation_branch_refs![0]!)
  );
  assert.equal(branch?.current_episode_ref, result.report.cycles[0]?.active_episode_ref);
  assert.equal(branch?.reason, "episode_blocked");

  const cycle2ActorTurnRef = result.report.cycles[1]!.provider_input_refs.find((ref) =>
    ref.includes("actor-turn")
  );
  const cycle2ActorTurn = await readJsonIfExists<{ input?: { active_episode?: { episode_id?: string; opened_from_refs?: string[] } } }>(
    path.join(actorDir, cycle2ActorTurnRef!)
  );
  assert.match(cycle2ActorTurn?.input?.active_episode?.episode_id ?? "", /^episode-branch-cycle-0001-/);
  assert.equal(
    cycle2ActorTurn?.input?.active_episode?.opened_from_refs?.includes(result.report.cycles[0]!.active_episode_ref!),
    true
  );

  const deliberationRef = result.report.cycles[1]!.provider_input_refs.find((ref) =>
    ref.includes("deliberation")
  );
  const deliberationSnapshot = await readJsonIfExists<{ input?: { schema?: string; branch?: { branch_id?: string } } }>(
    path.join(actorDir, deliberationRef!)
  );
  assert.equal(deliberationSnapshot?.input?.schema, "deliberation-input/v1");
  assert.match(deliberationSnapshot?.input?.branch?.branch_id ?? "", /^branch-cycle-0001-/);
});

test("stale alphabetically later judgment is not used as previous context", async () => {
  const isolatedRoot = path.join(rootDir, `stale-judgment-${Date.now()}`);
  const { writeCycleJudgment } = await import("../src/runtime/goals/cycleJudgmentStore.js");
  const { initializeActorWorkspaces } = await import("../src/runtime/actorWorkspace.js");
  const { assignSeedActionSkillOwnership } = await import("../src/skills/ownership.js");
  const { getActorProfile } = await import("../src/npc/profiles.js");

  const actorId = "npc_b";
  const profile = getActorProfile(actorId);
  await initializeActorWorkspaces({
    rootDir: isolatedRoot,
    actors: [{ actor_id: actorId, username: actorId, role_id: profile.gameplay_role }],
    seedActionSkillOwnership: assignSeedActionSkillOwnership([actorId], {
      [actorId]: profile.gameplay_role
    })
  });

  await writeCycleJudgment(isolatedRoot, actorId, {
    schema: "cycle-judgment/v1",
    actor_id: actorId,
    cycle_id: "cycle-0007",
    cycle_goal_id: "stale",
    outcome: "no_progress",
    what_happened: "stale from another run",
    why_it_mattered_for_life_goal: "stale",
    verifier_status: "passed",
    evidence_refs: [],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: []
  });

  const reportPath = path.join(isolatedRoot, "stale-report.json");
  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 2,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "legacy"
  });

  const actorDir = path.join(isolatedRoot, actorId);
  const cycle2CycleGoalProviderInput = result.report.cycles[1]?.provider_input_refs[0];
  const snapshot = await readJsonIfExists<{ input?: { previous_cycle_judgments?: Array<{ cycle_id?: string }> } }>(
    path.join(actorDir, cycle2CycleGoalProviderInput ?? "")
  );
  const prior = snapshot?.input?.previous_cycle_judgments ?? [];
  assert.equal(prior.length, 1);
  assert.equal(prior[0]?.cycle_id, "cycle-0001");
  assert.notEqual(prior[0]?.cycle_id, "cycle-0007");
});

test("provider failure does not report runtime pass", async () => {
  const reportPath = path.join(rootDir, "openai-missing-key.json");
  const result = await runSocialCycle({
    actorId: "npc_b",
    providerId: "openai-api",
    model: "gpt-5.4-mini",
    cycles: 1,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: path.join(rootDir, "actors-openai"),
    openAiApiKey: ""
  });

  assert.equal(result.report.runtime_status, "failed");
  assert.ok(result.report.provider_error);
  await fs.access(reportPath);
});

test("deterministic-social run carries PlanBead ready front and guarded operations", async () => {
  const isolatedRoot = path.join(rootDir, `planbeads-vertical-${Date.now()}`);
  const actorId = "npc_b";
  const profile = getActorProfile(actorId);
  await initializeActorWorkspaces({
    rootDir: isolatedRoot,
    actors: [{ actor_id: actorId, username: actorId, role_id: profile.gameplay_role }],
    seedActionSkillOwnership: assignSeedActionSkillOwnership([actorId], {
      [actorId]: profile.gameplay_role
    })
  });
  const soul = await ensureActorSoul(isolatedRoot, actorId);
  const lifeGoal = await ensureActiveLifeGoal(isolatedRoot, actorId, soul);
  await writeActorPlanBead(
    isolatedRoot,
    runnerPlanBead({
      beadId: "bead-a",
      lifeGoalId: lifeGoal.goal_id,
      status: "in_progress",
      priority: 2
    })
  );
  await writeActorPlanBead(
    isolatedRoot,
    runnerPlanBead({
      beadId: "bead-b",
      lifeGoalId: lifeGoal.goal_id,
      status: "open",
      priority: 1
    })
  );
  await appendPlanBeadDependency(isolatedRoot, {
    schema: "actor-plan-bead-dependency/v1",
    actor_id: actorId,
    bead_id: "bead-b",
    depends_on_bead_id: "bead-a",
    type: "discovered_from",
    rationale: "Concern B appeared while concern A was in progress.",
    evidence_refs: ["plan-beads/beads/bead-b.json"],
    created_at: "2026-05-31T00:00:00.000Z"
  });

  const reportPath = path.join(isolatedRoot, "planbeads-report.json");
  const result = await runSocialCycle({
    actorId,
    providerId: "deterministic-social",
    model: "deterministic-social",
    cycles: 2,
    maxActionsPerCycle: 1,
    reportPath,
    connectToWorld: false,
    actorWorkspaceRootDir: isolatedRoot,
    actionHotPath: "legacy"
  });

  assert.equal(result.report.cycles.length, 2);
  assert.deepEqual(result.report.plan_bead_ready_fronts?.[0]?.in_progress_bead_ids, ["bead-a"]);
  assert.deepEqual(result.report.plan_bead_ready_fronts?.[0]?.ready_bead_ids, ["bead-b"]);
  assert.deepEqual(result.report.cycles[0]?.selected_plan_bead_refs, ["plan-beads/beads/bead-b.json"]);
  assert.ok((result.report.cycles[0]?.plan_bead_operation_result_refs ?? []).length > 0);
  assert.equal(result.report.plan_bead_operation_results?.[0]?.status, "accepted");
  assert.equal(result.report.plan_bead_operation_results?.[0]?.bead_id, "bead-b");
  assert.equal(result.report.plan_bead_graph_summary?.last_ready_front_ref, result.report.plan_bead_ready_fronts?.[1]?.ref);

  const beadB = await readActorPlanBead(isolatedRoot, actorId, "bead-b");
  assert.equal(beadB?.status, "in_progress");
  assert.ok((beadB?.checkpoint.version ?? 0) >= 2);

  const actorDir = path.join(isolatedRoot, actorId);
  const goalMindInputRef = result.report.cycles[0]?.provider_input_refs[0];
  const snapshot = await readJsonIfExists<{ input?: { plan_bead_packet?: unknown; action_surface?: Record<string, unknown> } }>(
    path.join(actorDir, goalMindInputRef ?? "")
  );
  assert.ok(snapshot?.input?.plan_bead_packet);
  assert.equal(snapshot.input.action_surface?.plan_bead_packet, undefined);
});
