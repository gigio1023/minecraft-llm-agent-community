import assert from "node:assert/strict";
import test from "node:test";

import {
  computeReadyPlanBeads,
  validatePlanBeadPacket,
  type ActorPlanBead,
  type PlanBeadDependency,
  type PlanBeadPriority,
  type PlanBeadStatus
} from "../src/runtime/goals/planBeads/index.js";

const nowIso = "2026-05-31T00:00:00.000Z";

function makeBead(input: {
  bead_id: string;
  status?: PlanBeadStatus;
  priority?: PlanBeadPriority;
  title?: string;
  life_goal_id?: string;
  metadata?: ActorPlanBead["metadata"];
  checkpoint?: Partial<ActorPlanBead["checkpoint"]>;
}): ActorPlanBead {
  const status = input.status ?? "open";
  return {
    schema: "actor-plan-bead/v1",
    bead_id: input.bead_id,
    actor_id: "npc_b",
    life_goal_id: input.life_goal_id ?? "life-1",
    kind: "concern",
    status,
    priority: input.priority ?? 2,
    title: input.title ?? `Track ${input.bead_id}`,
    description: `Keep ${input.bead_id} as resumable PlanBead context.`,
    design_notes: "This bead guides continuity but does not execute gameplay.",
    acceptance_criteria: {
      evidence_required: [`evidence required for ${input.bead_id}`],
      non_physical_resolution_allowed: true
    },
    notes: {
      completed: [],
      in_progress: [],
      blockers: [],
      next: [`Review next step for ${input.bead_id}.`],
      key_decisions: []
    },
    labels: ["test"],
    metadata: input.metadata ?? {},
    refs: {
      evidence_refs: [`evidence/${input.bead_id}.json`],
      memory_refs: [],
      judgment_refs: [],
      cycle_goal_refs: [],
      relationship_refs: [],
      world_event_refs: [],
      action_skill_refs: []
    },
    checkpoint: {
      version: 1,
      created_at: "2026-05-30T00:00:00.000Z",
      updated_at: `2026-05-30T00:00:0${input.priority ?? 2}.000Z`,
      evidence_refs: [`checkpoint/${input.bead_id}.json`],
      ...input.checkpoint
    },
    assertion_policy: {
      bead_is_context_not_authority: true,
      physical_success_requires_current_evidence: true
    }
  };
}

function makeDependency(input: {
  bead_id: string;
  depends_on_bead_id: string;
  type: PlanBeadDependency["type"];
}): PlanBeadDependency {
  return {
    schema: "actor-plan-bead-dependency/v1",
    actor_id: "npc_b",
    bead_id: input.bead_id,
    depends_on_bead_id: input.depends_on_bead_id,
    type: input.type,
    rationale: `${input.bead_id} is linked to ${input.depends_on_bead_id}.`,
    evidence_refs: [`dependency/${input.bead_id}-${input.depends_on_bead_id}.json`],
    created_at: nowIso
  };
}

test("in-progress concern is preserved while a new open concern is ready", () => {
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({ bead_id: "bead-a", status: "in_progress" }),
      makeBead({ bead_id: "bead-b", status: "open" })
    ],
    dependencies: [],
    nowIso,
    lifeGoalId: "life-1"
  });

  assert.equal(validatePlanBeadPacket(result).ok, true);
  assert.equal(result.physical_progress_claim, false);
  assert.deepEqual(result.in_progress_beads.map((bead) => bead.bead_id), ["bead-a"]);
  assert.deepEqual(result.ready_beads.map((bead) => bead.bead_id), ["bead-b"]);
});

test("open blocking dependency suppresses a dependent bead with explanation", () => {
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({ bead_id: "bead-blocker", status: "open" }),
      makeBead({ bead_id: "bead-dependent", status: "open" })
    ],
    dependencies: [
      makeDependency({
        bead_id: "bead-dependent",
        depends_on_bead_id: "bead-blocker",
        type: "blocks"
      })
    ],
    nowIso
  });

  assert.deepEqual(result.ready_beads.map((bead) => bead.bead_id), ["bead-blocker"]);
  assert.deepEqual(result.blocked_beads.map((bead) => bead.bead_id), ["bead-dependent"]);
  assert.equal(result.blocked_explanations[0]?.blocking_dependencies[0]?.blocking_bead_id, "bead-blocker");
  assert.equal(result.blocked_explanations[0]?.blocking_dependencies[0]?.dependency_type, "blocks");
});

test("closed blocking dependency unblocks the dependent bead", () => {
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({
        bead_id: "bead-blocker",
        status: "closed",
        checkpoint: {
          close_kind: "satisfied",
          close_reason: "Verified by prior evidence."
        }
      }),
      makeBead({ bead_id: "bead-dependent", status: "open" })
    ],
    dependencies: [
      makeDependency({
        bead_id: "bead-dependent",
        depends_on_bead_id: "bead-blocker",
        type: "blocks"
      })
    ],
    nowIso
  });

  assert.deepEqual(result.ready_beads.map((bead) => bead.bead_id), ["bead-dependent"]);
  assert.deepEqual(result.blocked_beads, []);
  assert.equal(result.graph_summary.ready_count, 1);
});

test("future deferred_until metadata excludes an open bead from the ready front", () => {
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({
        bead_id: "bead-deferred",
        status: "open",
        metadata: { deferred_until: "2026-06-01T00:00:00.000Z" }
      })
    ],
    dependencies: [],
    nowIso
  });

  assert.deepEqual(result.ready_beads, []);
  assert.equal(result.graph_summary.deferred_count, 1);
  assert.equal(result.deferred_explanations[0]?.bead_id, "bead-deferred");
  assert.deepEqual(result.deferred_explanations[0]?.reasons, ["future_deferred_until"]);
});

test("discovered_from does not block readiness and remains in dependency refs", () => {
  const dependency = makeDependency({
    bead_id: "bead-new-concern",
    depends_on_bead_id: "bead-original",
    type: "discovered_from"
  });
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({ bead_id: "bead-original", status: "open", priority: 3 }),
      makeBead({ bead_id: "bead-new-concern", status: "open", priority: 1 })
    ],
    dependencies: [dependency],
    nowIso
  });
  const newConcern = result.ready_beads.find((bead) => bead.bead_id === "bead-new-concern");

  assert.ok(newConcern);
  assert.deepEqual(result.blocked_beads, []);
  assert.deepEqual(newConcern.dependency_refs, [
    "plan-bead-dependency:npc_b:bead-new-concern:discovered_from:bead-original"
  ]);
});

test("lifeGoalId filters out beads from another LifeGoal", () => {
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({ bead_id: "bead-life-1", status: "open", life_goal_id: "life-1" }),
      makeBead({ bead_id: "bead-life-2", status: "open", life_goal_id: "life-2" })
    ],
    dependencies: [],
    nowIso,
    lifeGoalId: "life-1"
  });

  assert.deepEqual(result.ready_beads.map((bead) => bead.bead_id), ["bead-life-1"]);
  assert.equal(result.graph_summary.open_count, 1);
});

test("cross-LifeGoal dependencies remain context but do not block the current ready front", () => {
  const result = computeReadyPlanBeads({
    beads: [
      makeBead({ bead_id: "bead-current", status: "open", life_goal_id: "life-1" }),
      makeBead({ bead_id: "bead-old-life", status: "open", life_goal_id: "life-2" })
    ],
    dependencies: [
      makeDependency({
        bead_id: "bead-current",
        depends_on_bead_id: "bead-old-life",
        type: "blocks"
      })
    ],
    nowIso,
    lifeGoalId: "life-1"
  });

  assert.deepEqual(result.ready_beads.map((bead) => bead.bead_id), ["bead-current"]);
  assert.deepEqual(result.blocked_beads, []);
  assert.deepEqual(result.ready_beads[0]?.dependency_refs, [
    "plan-bead-dependency:npc_b:bead-current:blocks:bead-old-life"
  ]);
});

test("checkpoint refs use actor workspace sanitized bead file ids", () => {
  const result = computeReadyPlanBeads({
    beads: [makeBead({ bead_id: "concern:A", status: "open" })],
    dependencies: [],
    nowIso
  });

  assert.equal(result.ready_beads[0]?.checkpoint_ref, "plan-beads/beads/concern_A.json");
  assert.equal(result.ready_beads[0]?.checkpoint_version, 1);
});

test("maxReady bounds ready_beads without mutating caller input", () => {
  const beads = [
    makeBead({ bead_id: "bead-low-priority", status: "open", priority: 4 }),
    makeBead({ bead_id: "bead-high-priority", status: "open", priority: 0 })
  ];
  const dependencies: PlanBeadDependency[] = [];
  const originalBeads = JSON.parse(JSON.stringify(beads));
  const originalDependencies = JSON.parse(JSON.stringify(dependencies));

  const result = computeReadyPlanBeads({
    beads,
    dependencies,
    nowIso,
    maxReady: 1
  });

  assert.deepEqual(result.ready_beads.map((bead) => bead.bead_id), ["bead-high-priority"]);
  assert.equal(result.graph_summary.ready_count, 2);
  assert.deepEqual(beads, originalBeads);
  assert.deepEqual(dependencies, originalDependencies);
});
