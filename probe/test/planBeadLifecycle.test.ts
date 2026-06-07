/** Regression coverage for evidence-derived PlanBead lifecycle updates. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyPlanBeadOperations,
  computeReadyPlanBeads,
  derivePlanBeadLifecycleOperationsFromCurrentState,
  derivePlanBeadLifecycleOperationsFromTurnEvidence,
  readActorPlanBead,
  writeActorPlanBead,
  type ActorPlanBead,
  type PlanBeadOperation
} from "../src/runtime/goals/planBeads/index.js";
import type { ActorTurnResolvedAction, JsonObject } from "../src/runtime/goals/actorEpisode/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const actorId = "npc_b";
const lifeGoalId = "life-1";
const now = "2026-06-03T00:00:00.000Z";

function testRoot(label: string) {
  return path.resolve(
    here,
    "test-artifacts",
    `plan-bead-lifecycle-${label}-${process.pid}-${randomUUID()}`
  );
}

function bead(input: {
  beadId: string;
  title: string;
  description: string;
  evidenceRequired: string[];
  status?: ActorPlanBead["status"];
  metadata?: ActorPlanBead["metadata"];
}): ActorPlanBead {
  return {
    schema: "actor-plan-bead/v1",
    bead_id: input.beadId,
    actor_id: actorId,
    life_goal_id: lifeGoalId,
    kind: "concern",
    status: input.status ?? "open",
    priority: 1,
    title: input.title,
    description: input.description,
    design_notes: "Runtime lifecycle test bead; context only.",
    acceptance_criteria: {
      evidence_required: input.evidenceRequired,
      non_physical_resolution_allowed: false
    },
    notes: {
      completed: [],
      in_progress: ["Existing note survives lifecycle updates."],
      blockers: [],
      next: ["Wait for runtime evidence."],
      key_decisions: []
    },
    labels: [],
    metadata: input.metadata ?? {},
    refs: {
      evidence_refs: [],
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
      evidence_refs: []
    },
    assertion_policy: {
      bead_is_context_not_authority: true,
      physical_success_requires_current_evidence: true
    }
  };
}

function intent(input: {
  primitiveId: string;
  parameters?: JsonObject;
}): ActorTurnResolvedAction {
  return {
    schema: "actor-turn-resolved-action/v1",
    actor_id: actorId,
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-0001",
    kind: "use_primitive",
    action_card_id: `primitive:${input.primitiveId}`,
    primitive_id: input.primitiveId,
    parameters: input.parameters ?? {},
    expected_outcome: "record_blocker_or_done",
    why_this_action: "Runtime lifecycle test intent.",
    expected_evidence: ["runtime evidence"],
    fallback_if_blocked: "record blocker"
  };
}

async function writeActorArtifact(rootDir: string, ref: string, value: unknown = {}) {
  const filePath = path.join(rootDir, actorId, ref);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function applyLifecycleOps(input: {
  rootDir: string;
  operations: PlanBeadOperation[];
}) {
  return applyPlanBeadOperations({
    rootDir: input.rootDir,
    actorId,
    lifeGoalId,
    cycleId: "cycle-0001",
    turnId: "turn-0001",
    now,
    operations: input.operations
  });
}

test("deposit_shared runtime evidence closes a matching shared-storage PlanBead through guarded operations", async () => {
  const rootDir = testRoot("deposit-close");
  try {
    await writeActorArtifact(rootDir, "evidence/cycle-0001-deposit-shared.json");
    await writeActorPlanBead(rootDir, bead({
      beadId: "bead-shared-storage",
      title: "Contribute useful materials to shared storage",
      description: "npc_a needs oak logs deposited into the shared chest.",
      evidenceRequired: ["deposit_shared evidence with moved count"],
      metadata: { lifecycle_close_signals: ["deposit_shared:oak_log"] }
    }));

    const operations = derivePlanBeadLifecycleOperationsFromTurnEvidence({
      actorId,
      cycleId: "cycle-0001",
      turnId: "turn-0001",
      action: intent({ primitiveId: "deposit_shared", parameters: { itemName: "oak_log" } }),
      toolStatuses: [{ tool: "deposit_shared", status: "deposited" }],
      evidenceRefs: ["evidence/cycle-0001-deposit-shared.json"],
      beads: [bead({
        beadId: "bead-shared-storage",
        title: "Contribute useful materials to shared storage",
        description: "npc_a needs oak logs deposited into the shared chest.",
        evidenceRequired: ["deposit_shared evidence with moved count"],
        metadata: { lifecycle_close_signals: ["deposit_shared:oak_log"] }
      })]
    });
    assert.equal(operations.length, 1);
    assert.equal(operations[0]?.op, "set_status");
    assert.equal(operations[0]?.patch.status, "closed");
    assert.equal(operations[0]?.patch.close_kind, "satisfied");

    const applied = await applyLifecycleOps({ rootDir, operations });
    assert.equal(applied.results[0]?.status, "accepted");
    const updated = await readActorPlanBead(rootDir, actorId, "bead-shared-storage");
    assert.equal(updated?.status, "closed");
    assert.equal(updated?.checkpoint.close_kind, "satisfied");
    const readyFront = computeReadyPlanBeads({
      beads: updated ? [updated] : [],
      dependencies: [],
      lifeGoalId,
      nowIso: now
    });
    assert.equal(readyFront.ready_beads.length, 0);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("inspect_chest updates a deposit bead as incomplete instead of closing it", () => {
  const depositBead = bead({
    beadId: "bead-deposit",
    title: "Deposit oak logs into shared chest",
    description: "The actor should contribute materials, not only inspect the chest.",
    evidenceRequired: ["deposit_shared movedCount > 0"],
    metadata: {
      lifecycle_close_signals: ["deposit_shared:oak_log"],
      lifecycle_incomplete_signals: ["inspect_chest"]
    }
  });
  const operations = derivePlanBeadLifecycleOperationsFromTurnEvidence({
    actorId,
    cycleId: "cycle-0001",
    turnId: "turn-0001",
    action: intent({ primitiveId: "inspect_chest" }),
    toolStatuses: [{ tool: "inspect_chest", status: "inspected" }],
    evidenceRefs: ["evidence/cycle-0001-inspect-chest.json"],
    beads: [depositBead]
  });

  assert.equal(operations.length, 1);
  assert.equal(operations[0]?.op, "update_notes");
  assert.match(operations[0]?.patch.in_progress?.join("\n") ?? "", /deposit evidence is still missing/);
  assert.ok(operations[0]?.patch.in_progress?.includes("Existing note survives lifecycle updates."));
});

test("current shared-storage contribution evidence closes stale deposit-access PlanBeads", () => {
  const staleAccessBead = bead({
    beadId: "bead-shared-storage-access",
    title: "Verify shared chest access for oak_log deposit",
    description: "npc_a needs one oak_log deposited into shared storage before trusting progress.",
    evidenceRequired: ["runtime evidence matching this PlanBead's concern"],
    metadata: { lifecycle_close_signals: ["deposit_shared:oak_log"] }
  });

  const operations = derivePlanBeadLifecycleOperationsFromCurrentState({
    actorId,
    cycleId: "cycle-0002",
    turnId: "cycle-0002-current-state",
    currentState: {
      shared_storage: {
        status: "contributed",
        items: [{ name: "oak_log", count: 1 }],
        evidence_refs: ["evidence/cycle-0001-action-01-deposit_shared.json"]
      }
    },
    beads: [staleAccessBead]
  });

  assert.equal(operations.length, 1);
  assert.equal(operations[0]?.op, "set_status");
  assert.equal(operations[0]?.bead_id, "bead-shared-storage-access");
  assert.equal(operations[0]?.patch.status, "closed");
  assert.match(operations[0]?.patch.close_reason ?? "", /deposited oak_log/);
});

test("current shared-storage lifecycle does not close unrelated item-only PlanBeads", () => {
  const collectWoodBead = bead({
    beadId: "bead-collect-oak-log",
    title: "Collect oak_log for starter shelter",
    description: "The actor should gather oak_log for later construction.",
    evidenceRequired: ["inventory contains oak_log from collection"]
  });

  const operations = derivePlanBeadLifecycleOperationsFromCurrentState({
    actorId,
    cycleId: "cycle-0002",
    turnId: "cycle-0002-current-state",
    currentState: {
      shared_storage: {
        status: "contributed",
        items: [{ name: "oak_log", count: 1 }],
        evidence_refs: ["evidence/cycle-0001-action-01-deposit_shared.json"]
      }
    },
    beads: [collectWoodBead]
  });

  assert.deepEqual(operations, []);
});

test("crafted item evidence closes only a matching crafting PlanBead", () => {
  const matching = bead({
    beadId: "bead-crafting-table",
    title: "Craft crafting_table for table recipes",
    description: "The actor needs a crafting_table item before placing a station.",
    evidenceRequired: ["crafted crafting_table inventory delta"],
    metadata: { lifecycle_close_signals: ["crafted:crafting_table"] }
  });
  const unrelated = bead({
    beadId: "bead-storage",
    title: "Contribute to shared storage",
    description: "The actor should deposit useful materials later.",
    evidenceRequired: ["deposit_shared evidence"]
  });

  const operations = derivePlanBeadLifecycleOperationsFromTurnEvidence({
    actorId,
    cycleId: "cycle-0001",
    turnId: "turn-0001",
    action: intent({ primitiveId: "craft_item", parameters: { itemName: "crafting_table" } }),
    toolStatuses: [{ tool: "craft_item", status: "crafted" }],
    evidenceRefs: ["evidence/cycle-0001-craft-item.json"],
    beads: [matching, unrelated]
  });

  assert.equal(operations.length, 1);
  assert.equal(operations[0]?.op, "set_status");
  assert.equal(operations[0]?.bead_id, "bead-crafting-table");
});

test("movement and observation evidence never derive PlanBead lifecycle close operations", () => {
  const travelBead = bead({
    beadId: "bead-any",
    title: "Reach shared storage",
    description: "This should require storage evidence, not movement or observation prose.",
    evidenceRequired: ["deposit_shared evidence"]
  });

  for (const [tool, status] of [["move_to", "arrived"], ["observe", "ok"], ["wait", "ok"], ["remember", "ok"]] as const) {
    const operations = derivePlanBeadLifecycleOperationsFromTurnEvidence({
      actorId,
      cycleId: "cycle-0001",
      turnId: "turn-0001",
      action: intent({ primitiveId: tool }),
      toolStatuses: [{ tool, status }],
      evidenceRefs: ["evidence/cycle-0001-context.json"],
      beads: [travelBead]
    });
    assert.deepEqual(operations, []);
  }
});

test("lifecycle operations do not carry executable authority fields", () => {
  const operations = derivePlanBeadLifecycleOperationsFromTurnEvidence({
    actorId,
    cycleId: "cycle-0001",
    turnId: "turn-0001",
    action: intent({ primitiveId: "deposit_shared", parameters: { itemName: "oak_log" } }),
    toolStatuses: [{ tool: "deposit_shared", status: "deposited" }],
    evidenceRefs: ["evidence/cycle-0001-deposit-shared.json"],
    beads: [
      bead({
        beadId: "bead-shared-storage",
        title: "Shared storage contribution",
        description: "Deposit oak_log into the shared chest.",
        evidenceRequired: ["deposit evidence"],
        metadata: { lifecycle_close_signals: ["deposit_shared:oak_log"] }
      })
    ]
  });

  const serialized = JSON.stringify(operations);
  assert.equal(serialized.includes("primitive_id"), false);
  assert.equal(serialized.includes("action_skill_id"), false);
  assert.equal(serialized.includes("\"args\""), false);
  assert.equal(serialized.includes("physical_progress_claim"), false);
});
