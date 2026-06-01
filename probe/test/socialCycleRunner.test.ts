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
  action_intent_ref: string;
  provider_input_refs: string[];
  provider_output_refs: string[];
  evidence_refs: string[];
  judgment_ref: string;
  verifier_status: string;
  executed_tools: string[];
  runtime_status: string;
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
    actorWorkspaceRootDir: path.join(rootDir, "actors")
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
    actorWorkspaceRootDir: isolatedRoot
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
  assert.ok(actionPlanner?.input?.runtime_affordances);
  assert.ok(actionPlanner?.input?.direct_action_skills);
  assert.ok(actionPlanner?.input?.candidate_action_skill_search);

  const judgment = await readJsonIfExists<{ input?: Record<string, unknown> }>(
    path.join(actorDir, judgmentRef)
  );
  assert.equal(judgment?.input?.schema, "social-cycle-judgment-input/v1");
  assert.equal(judgment?.input?.action_surface, undefined);
  assert.equal(judgment?.input?.settlement_checklist, undefined);
  assert.ok(judgment?.input?.runtime_result);
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
  const attempts = readActionAttempts(cycle);
  assert.equal(attempts.length, 2);
  assert.deepEqual(attempts.map((attempt) => attempt.action_index), [0, 1]);
  assert.deepEqual(attempts.map((attempt) => attempt.turn_id), [
    "cycle-0001-action-01",
    "cycle-0001-action-02"
  ]);
  assert.deepEqual(attempts.map((attempt) => attempt.executed_tools), [["observe"], ["wait"]]);
  assert.deepEqual(attempts.map((attempt) => attempt.runtime_status), ["blocked", "blocked"]);
  assert.notEqual(attempts[0]?.action_intent_ref, attempts[1]?.action_intent_ref);
  assert.ok(attempts[0]?.action_intent_ref.includes("cycle-0001-action-01"));
  assert.ok(attempts[1]?.action_intent_ref.includes("cycle-0001-action-02"));
  assert.notEqual(attempts[0]?.judgment_ref, attempts[1]?.judgment_ref);
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
    actorWorkspaceRootDir: isolatedRoot
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
    actorWorkspaceRootDir: isolatedRoot
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
