import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assembleSocialCycleContext, contextCitesPreviousJudgment } from "../src/runtime/goals/cycleContextAssembler.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import type { CycleJudgment } from "../src/runtime/goals/types.js";
import { buildNpcBActionSkillRecord } from "./helpers/socialCycleTestHelpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `social-context-${process.pid}`);

test("assembled context always includes ActorSoul and LifeGoal", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const lifeGoal = {
    schema: "actor-life-goal/v1" as const,
    actor_id: "npc_b",
    goal_id: "life-1",
    objective: soul.life_goal,
    status: "active" as const,
    source: "actor_soul" as const,
    created_at: "2026-05-23T00:00:00.000Z",
    updated_at: "2026-05-23T00:00:00.000Z",
    cycle_count: 0,
    action_count: 0,
    evidence_refs: [],
    memory_refs: [],
    relationship_refs: []
  };

  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "g1",
    outcome: "no_progress",
    what_happened: "waited",
    why_it_mattered_for_life_goal: "trust",
    verifier_status: "passed",
    evidence_refs: [],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_pressure: []
  };

  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal,
    strategicGoals: [],
    worldEvents: [
      {
        schema: "world-event/v1",
        event_id: "evt-1",
        kind: "scenario_event",
        authority: "pressure_only",
        summary: "Need logs",
        actor_refs: ["npc_b"],
        evidence_refs: [],
        created_at: "2026-05-23T00:00:00.000Z"
      }
    ],
    previousJudgments: [{ ref: "judgments/cycle-0001-judgment.json", judgment }],
    activeActionSkills: [buildNpcBActionSkillRecord()],
    observation: { status: "ok", observerId: "npc_b", visibleActors: [], memory: [] },
    allowedPrimitiveIds: ["observe"],
    maxActionsPerCycle: 1,
    cycleIndex: 1
  });

  assert.equal(context.ActorSoul.actor_id, "npc_b");
  assert.equal(context.ActorLifeGoal.objective, soul.life_goal);
  assert.notEqual(context.ActorLifeGoal.objective, "Need logs");
  assert.equal(contextCitesPreviousJudgment(context, "cycle-0001"), true);
});
