import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runSocialCycle } from "../src/runtime/socialCycleRunner.js";
import { goalMindInputIncludesSoulAndLifeGoal } from "../src/runtime/goals/types.js";
import { readJsonIfExists } from "../src/runtime/goals/goalJsonStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `social-runner-${process.pid}-${Date.now()}`);

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
  assert.equal(result.report.agency_status.used_previous_judgment, true);

  const actorDir = path.join(rootDir, "actors", "npc_b");
  const cycle2GoalMindInput = result.report.cycles[1]?.provider_input_refs[0];
  assert.ok(cycle2GoalMindInput);
  const snapshot = await readJsonIfExists<{ input?: unknown }>(
    path.join(actorDir, cycle2GoalMindInput)
  );
  assert.equal(goalMindInputIncludesSoulAndLifeGoal(snapshot?.input), true);
  const prior = (snapshot?.input as { previous_cycle_judgments?: unknown[] })?.previous_cycle_judgments;
  assert.ok(prior && prior.length > 0);
  assert.equal(prior.length, 1);
  assert.equal((prior[0] as { cycle_id?: string }).cycle_id, "cycle-0001");
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
    next_goal_pressure: []
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
  const cycle2GoalMindInput = result.report.cycles[1]?.provider_input_refs[0];
  const snapshot = await readJsonIfExists<{ input?: { previous_cycle_judgments?: Array<{ cycle_id?: string }> } }>(
    path.join(actorDir, cycle2GoalMindInput ?? "")
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
