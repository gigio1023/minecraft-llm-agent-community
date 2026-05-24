import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assembleSocialCycleContext, contextCitesPreviousJudgment } from "../src/runtime/goals/cycleContextAssembler.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import type { CycleJudgment } from "../src/runtime/goals/types.js";
import { buildNpcBActionSkillRecord } from "./helpers/socialCycleTestHelpers.js";
import { writeActorMemoryRecords } from "../src/memory/actorMemory.js";

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
  await writeActorMemoryRecords(rootDir, [
    {
      schema: "actor-memory-record/v1",
      memory_id: "social-cycle-blocker",
      actor_id: "npc_b",
      layer: "episodic",
      status: "active",
      confidence: "observed",
      scope: { kind: "actor_private", actor_id: "npc_b" },
      created_at: "2026-05-23T00:00:00.000Z",
      updated_at: "2026-05-23T00:00:00.000Z",
      summary: "collect_logs was blocked near spawn after no low logs were reachable.",
      evidence_refs: ["evidence/cycle-0001-collect_logs.json"],
      tags: ["social_cycle"],
      index: {
        objective_ids: [],
        objective_categories: ["social_cycle"],
        item_names: ["oak_log"],
        block_names: [],
        tool_names: ["collect_logs"],
        action_skill_ids: ["collectLogs"],
        diagnoses: ["blocked"],
        verifier_statuses: ["failed"],
        causal_refs: ["cycle-0001"]
      },
      content: { cycle_id: "cycle-0001", outcome: "blocked" }
    }
  ]);

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
  assert.equal(context.memory_packet.retrieved_episodic[0]?.memory_id, "social-cycle-blocker");
  assert.equal(context.memory_packet.retrieval_policy.objective_category, "social_cycle");
});
