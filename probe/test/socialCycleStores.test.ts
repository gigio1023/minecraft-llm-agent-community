import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ensureActorSoul, readActorSoul } from "../src/runtime/goals/actorSoulStore.js";
import { ensureActiveLifeGoal, readActiveLifeGoal } from "../src/runtime/goals/lifeGoalStore.js";
import { writeCycleGoal, readCycleGoal, buildDeterministicCycleGoal } from "../src/runtime/goals/cycleGoalStore.js";
import { writeCycleJudgment, readLatestCycleJudgment } from "../src/runtime/goals/cycleJudgmentStore.js";
import { createWorldEvent, listWorldEvents, writeWorldEvent } from "../src/runtime/goals/worldEventStore.js";
import { getActorWorkspacePaths } from "../src/runtime/actorWorkspacePaths.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `social-stores-${process.pid}-${Date.now()}`);

test("stores persist soul, life goal, cycle goal, judgment, and world events", async () => {
  const actorId = "npc_b";
  await fs.mkdir(path.join(rootDir, actorId), { recursive: true });

  const soul = await ensureActorSoul(rootDir, actorId);
  const lifeGoal = await ensureActiveLifeGoal(rootDir, actorId, soul);
  const event = createWorldEvent({
    summary: "Settlement needs materials",
    kind: "scenario_event"
  });
  await writeWorldEvent(rootDir, actorId, event);

  const cycleGoal = buildDeterministicCycleGoal({
    soul,
    lifeGoal,
    cycleId: "cycle-0001",
    observationRefs: [],
    worldEventRefs: [`world-events/${event.event_id}.json`],
    memoryRefs: [],
    relationshipRefs: [],
    judgmentRefs: [],
    allowedActionSkillIds: ["collectLogs"],
    allowedPrimitiveIds: ["observe", "wait", "remember"]
  });
  await writeCycleGoal(rootDir, actorId, cycleGoal);

  await writeCycleJudgment(rootDir, actorId, {
    schema: "cycle-judgment/v1",
    actor_id: actorId,
    cycle_id: "cycle-0001",
    cycle_goal_id: cycleGoal.goal_id,
    outcome: "no_progress",
    what_happened: "Observed only",
    why_it_mattered_for_life_goal: "Baseline judgment",
    verifier_status: "passed",
    evidence_refs: ["evidence/cycle-0001-observe.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_pressure: ["Try collection when safe"]
  });

  assert.ok(await readActorSoul(rootDir, actorId));
  assert.ok(await readActiveLifeGoal(rootDir, actorId));
  assert.ok(await readCycleGoal(rootDir, actorId, cycleGoal.goal_id));
  assert.ok(await readLatestCycleJudgment(rootDir, actorId));
  assert.equal((await listWorldEvents(rootDir, actorId)).length, 1);

  const paths = getActorWorkspacePaths(rootDir, actorId);
  assert.ok(await fs.stat(paths.soulMdFile));
});

test("stale expected_goal_id cannot overwrite a different cycle goal id", async () => {
  const actorId = "npc_b";
  const soul = await ensureActorSoul(rootDir, actorId);
  const lifeGoal = await ensureActiveLifeGoal(rootDir, actorId, soul);
  const first = buildDeterministicCycleGoal({
    soul,
    lifeGoal,
    cycleId: "cycle-stale",
    observationRefs: [],
    worldEventRefs: [],
    memoryRefs: [],
    relationshipRefs: [],
    judgmentRefs: [],
    allowedActionSkillIds: [],
    allowedPrimitiveIds: ["observe"]
  });
  await writeCycleGoal(rootDir, actorId, first);

  const second = { ...first, goal_id: "cycle-goal-other" };
  await assert.rejects(() => writeCycleGoal(rootDir, actorId, second, first.goal_id));
});
