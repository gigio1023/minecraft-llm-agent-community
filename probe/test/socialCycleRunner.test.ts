import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runSocialCycle } from "../src/runtime/socialCycleRunner.js";
import { cycleGoalProviderInputIncludesSoulAndLifeGoal } from "../src/runtime/goals/types.js";
import { readJsonIfExists } from "../src/runtime/goals/goalJsonStore.js";

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
