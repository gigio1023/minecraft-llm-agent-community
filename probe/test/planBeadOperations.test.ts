import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyPlanBeadOperations,
  appendPlanBeadDependency,
  listPlanBeadDependencies,
  readActorPlanBead,
  writeActorPlanBead,
  type ActorPlanBead,
  type PlanBeadDependency
} from "../src/runtime/goals/planBeads/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const actorId = "npc_b";
const lifeGoalId = "life-1";
const now = "2026-05-31T00:00:00.000Z";

function testRoot(label: string) {
  return path.resolve(
    here,
    "test-artifacts",
    `plan-bead-ops-${label}-${process.pid}-${randomUUID()}`
  );
}

function bead(beadId: string, status: ActorPlanBead["status"] = "open"): ActorPlanBead {
  return {
    schema: "actor-plan-bead/v1",
    bead_id: beadId,
    actor_id: actorId,
    life_goal_id: lifeGoalId,
    kind: "concern",
    status,
    priority: 1,
    title: `Track ${beadId}`,
    description: "A context-only PlanBead for operation tests.",
    design_notes: "Never executable authority.",
    acceptance_criteria: {
      evidence_required: ["runtime evidence"],
      non_physical_resolution_allowed: true
    },
    notes: {
      completed: [],
      in_progress: [],
      blockers: [],
      next: ["Keep context current."],
      key_decisions: []
    },
    labels: [],
    metadata: {},
    refs: {
      evidence_refs: ["evidence/seed.json"],
      memory_refs: [],
      judgment_refs: [],
      cycle_goal_refs: [],
      relationship_refs: [],
      world_event_refs: [],
      action_skill_refs: []
    },
    checkpoint: {
      version: 1,
      created_at: now,
      updated_at: now,
      evidence_refs: ["evidence/seed.json"]
    },
    assertion_policy: {
      bead_is_context_not_authority: true,
      physical_success_requires_current_evidence: true
    }
  };
}

function dependency(beadId: string, dependsOnBeadId: string): PlanBeadDependency {
  return {
    schema: "actor-plan-bead-dependency/v1",
    actor_id: actorId,
    bead_id: beadId,
    depends_on_bead_id: dependsOnBeadId,
    type: "blocks",
    rationale: `${beadId} waits for ${dependsOnBeadId}`,
    evidence_refs: ["evidence/dependency.json"],
    created_at: now
  };
}

test("applies a status operation through the guarded applier", async () => {
  const rootDir = testRoot("status");
  try {
    await writeActorPlanBead(rootDir, bead("bead-b"));

    const applied = await applyPlanBeadOperations({
      rootDir,
      actorId,
      lifeGoalId,
      cycleId: "cycle-0001",
      turnId: "cycle-0001-action-01",
      now,
      operations: [
        {
          schema: "plan-bead-operation/v1",
          actor_id: actorId,
          op: "set_status",
          bead_id: "bead-b",
          rationale: "The current CycleGoal selected this bead.",
          evidence_refs: ["evidence/cycle-0001-observe.json"],
          confidence: "observed",
          expected_checkpoint_version: 1,
          patch: { status: "in_progress" }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "accepted");
    assert.equal(applied.results[0]?.after_checkpoint_version, 2);
    assert.equal(applied.result_refs.length, 1);
    const updated = await readActorPlanBead(rootDir, actorId, "bead-b");
    assert.equal(updated?.status, "in_progress");
    assert.equal(updated?.checkpoint.version, 2);
    assert.ok(updated?.refs.evidence_refs.includes("evidence/cycle-0001-observe.json"));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("rejects stale checkpoint operations without mutating the bead", async () => {
  const rootDir = testRoot("stale");
  try {
    await writeActorPlanBead(rootDir, bead("bead-b"));

    const applied = await applyPlanBeadOperations({
      rootDir,
      actorId,
      lifeGoalId,
      cycleId: "cycle-0001",
      turnId: "cycle-0001-action-01",
      now,
      operations: [
        {
          schema: "plan-bead-operation/v1",
          actor_id: actorId,
          op: "update_notes",
          bead_id: "bead-b",
          rationale: "Stale update should not apply.",
          evidence_refs: ["evidence/cycle-0001-observe.json"],
          confidence: "observed",
          expected_checkpoint_version: 99,
          patch: { in_progress: ["stale"] }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "rejected");
    assert.match(applied.results[0]?.reason ?? "", /stale checkpoint/);
    const unchanged = await readActorPlanBead(rootDir, actorId, "bead-b");
    assert.equal(unchanged?.checkpoint.version, 1);
    assert.deepEqual(unchanged?.notes.in_progress, []);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("rejects dependency cycles and accepts non-cyclic dependencies", async () => {
  const rootDir = testRoot("dependencies");
  try {
    await writeActorPlanBead(rootDir, bead("bead-a"));
    await writeActorPlanBead(rootDir, bead("bead-b"));
    await appendPlanBeadDependency(rootDir, dependency("bead-b", "bead-a"));

    const applied = await applyPlanBeadOperations({
      rootDir,
      actorId,
      lifeGoalId,
      cycleId: "cycle-0001",
      turnId: "cycle-0001-action-01",
      now,
      operations: [
        {
          schema: "plan-bead-operation/v1",
          actor_id: actorId,
          op: "add_dependency",
          rationale: "This would create A -> B -> A.",
          evidence_refs: ["evidence/cycle-0001-observe.json"],
          confidence: "observed",
          patch: {
            bead_id: "bead-a",
            depends_on_bead_id: "bead-b",
            type: "blocks",
            rationale: "Cycle attempt.",
            evidence_refs: ["evidence/cycle-0001-observe.json"]
          }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "rejected");
    assert.match(applied.results[0]?.reason ?? "", /cycle/);
    assert.equal((await listPlanBeadDependencies(rootDir, actorId)).length, 1);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
