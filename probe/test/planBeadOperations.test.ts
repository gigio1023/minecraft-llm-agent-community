import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyPlanBeadOperations,
  appendPlanBeadDependency,
  listActorPlanBeads,
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

async function writeActorArtifact(rootDir: string, ref: string, value: unknown = {}) {
  const filePath = path.join(rootDir, actorId, ref);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

test("applies a status operation through the guarded applier", async () => {
  const rootDir = testRoot("status");
  try {
    await writeActorPlanBead(rootDir, bead("bead-b"));
    await writeActorArtifact(rootDir, "evidence/cycle-0001-observe.json");

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
    await writeActorArtifact(rootDir, "evidence/cycle-0001-observe.json");

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
    await writeActorArtifact(rootDir, "evidence/cycle-0001-observe.json");

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

test("rejects missing operation evidence refs before mutating state", async () => {
  const rootDir = testRoot("missing-evidence");
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
          rationale: "Missing evidence should be rejected.",
          evidence_refs: ["evidence/missing.json"],
          confidence: "observed",
          patch: { status: "in_progress" }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "rejected");
    assert.match(applied.results[0]?.reason ?? "", /missing actor artifact/);
    const unchanged = await readActorPlanBead(rootDir, actorId, "bead-b");
    assert.equal(unchanged?.status, "open");
    assert.equal(unchanged?.checkpoint.version, 1);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("records malformed operation proposals as rejected artifacts", async () => {
  const rootDir = testRoot("malformed-operation");
  try {
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
          patch: { status: "in_progress" }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "rejected");
    assert.equal(applied.results[0]?.op, "invalid");
    assert.match(applied.results[0]?.reason ?? "", /Invalid PlanBeadOperation/);
    assert.equal(applied.result_refs.length, 1);
    const resultPath = path.join(rootDir, actorId, applied.result_refs[0]!);
    const stored = JSON.parse(await fs.readFile(resultPath, "utf8")) as { status?: string };
    assert.equal(stored.status, "rejected");
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("normalizes provider create placeholders without granting id authority", async () => {
  const rootDir = testRoot("create-placeholder");
  try {
    await writeActorArtifact(rootDir, "evidence/cycle-0001-place_block.json");

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
          op: "create",
          bead_id: "",
          rationale: "Provider included a transport placeholder id.",
          evidence_refs: ["evidence/cycle-0001-place_block.json"],
          confidence: "observed",
          expected_checkpoint_version: 1,
          patch: {
            kind: "progress_step",
            title: "Resolve placement followup",
            description: "Track a placement concern from runtime evidence.",
            acceptance_evidence_required: ["runtime evidence"],
            notes_next: ["Use fresh observation before retrying."],
            priority: 1
          }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "accepted");
    assert.notEqual(applied.results[0]?.bead_id, "");
    const beads = await listActorPlanBeads(rootDir, actorId);
    assert.equal(beads.length, 1);
    assert.equal(beads[0]?.kind, "concern");
    assert.equal(beads[0]?.refs.evidence_refs[0], "evidence/cycle-0001-place_block.json");
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("applies same-batch operations against the latest accepted checkpoint", async () => {
  const rootDir = testRoot("same-batch-checkpoint");
  try {
    await writeActorPlanBead(rootDir, bead("bead-b"));
    await writeActorArtifact(rootDir, "evidence/cycle-0001-remember.json");

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
          rationale: "First update from the same model judgment.",
          evidence_refs: ["evidence/cycle-0001-remember.json"],
          confidence: "observed",
          expected_checkpoint_version: 1,
          patch: {
            blockers: ["No valid target was confirmed."]
          }
        },
        {
          schema: "plan-bead-operation/v1",
          actor_id: actorId,
          op: "set_status",
          bead_id: "bead-b",
          rationale: "Second operation was based on the same input checkpoint.",
          evidence_refs: ["evidence/cycle-0001-remember.json"],
          confidence: "inferred",
          expected_checkpoint_version: 1,
          patch: {
            status: "open"
          }
        }
      ]
    });

    assert.deepEqual(applied.results.map((result) => result.status), ["accepted", "accepted"]);
    const updated = await readActorPlanBead(rootDir, actorId, "bead-b");
    assert.equal(updated?.checkpoint.version, 3);
    assert.deepEqual(updated?.notes.blockers, ["No valid target was confirmed."]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("normalizes provider note aliases for update operations", async () => {
  const rootDir = testRoot("note-alias");
  try {
    await writeActorPlanBead(rootDir, bead("bead-b"));
    await writeActorArtifact(rootDir, "evidence/cycle-0001-remember.json");

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
          rationale: "Provider used blocked instead of blockers.",
          evidence_refs: ["evidence/cycle-0001-remember.json"],
          confidence: "observed",
          expected_checkpoint_version: 1,
          patch: {
            blocked: ["No reachable target was found."]
          }
        }
      ]
    });

    assert.equal(applied.results[0]?.status, "accepted");
    const updated = await readActorPlanBead(rootDir, actorId, "bead-b");
    assert.deepEqual(updated?.notes.blockers, ["No reachable target was found."]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("satisfied close requires strong runtime or guarded relationship evidence", async () => {
  const rootDir = testRoot("satisfied-close");
  try {
    await writeActorPlanBead(rootDir, bead("bead-b"));
    await writeActorArtifact(rootDir, "judgments/cycle-0001-judgment.json");

    const rejected = await applyPlanBeadOperations({
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
          rationale: "Judgment context alone cannot satisfy a bead.",
          evidence_refs: ["judgments/cycle-0001-judgment.json"],
          confidence: "observed",
          patch: {
            status: "closed",
            close_kind: "satisfied",
            close_reason: "Judgment text said it was done."
          }
        }
      ]
    });

    assert.equal(rejected.results[0]?.status, "rejected");
    assert.match(rejected.results[0]?.reason ?? "", /satisfied PlanBead requires runtime evidence/);
    assert.equal((await readActorPlanBead(rootDir, actorId, "bead-b"))?.status, "open");

    await writeActorArtifact(rootDir, "evidence/cycle-0001-verified.json");
    const accepted = await applyPlanBeadOperations({
      rootDir,
      actorId,
      lifeGoalId,
      cycleId: "cycle-0001",
      turnId: "cycle-0001-action-02",
      now,
      operations: [
        {
          schema: "plan-bead-operation/v1",
          actor_id: actorId,
          op: "set_status",
          bead_id: "bead-b",
          rationale: "Runtime evidence supports satisfied closure.",
          evidence_refs: ["evidence/cycle-0001-verified.json"],
          confidence: "observed",
          patch: {
            status: "closed",
            close_kind: "satisfied",
            close_reason: "Runtime evidence verified the tracked concern."
          }
        }
      ]
    });

    assert.equal(accepted.results[0]?.status, "accepted");
    const closed = await readActorPlanBead(rootDir, actorId, "bead-b");
    assert.equal(closed?.status, "closed");
    assert.equal(closed?.checkpoint.close_kind, "satisfied");
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
