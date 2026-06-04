/** Regression coverage for serialized PlanBead type and policy contracts. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertValidActorPlanBead,
  validateActorPlanBead,
  validatePlanBeadDependency,
  validatePlanBeadOperation,
  validatePlanBeadPacket
} from "../src/runtime/goals/planBeads/index.js";

function validBead() {
  return {
    schema: "actor-plan-bead/v1",
    bead_id: "bead-food-path",
    actor_id: "npc_b",
    life_goal_id: "life-1",
    kind: "concern",
    status: "open",
    priority: 2,
    title: "Secure a reliable food path",
    description: "Track the open concern before taking on more settlement work.",
    design_notes: "Keep this as context for CycleGoal choice, not an action script.",
    acceptance_criteria: {
      evidence_required: ["inventory or chest evidence for food source"],
      non_physical_resolution_allowed: true
    },
    notes: {
      completed: [],
      in_progress: [],
      blockers: [],
      next: ["Inspect current food inventory and nearby safe options."],
      key_decisions: []
    },
    labels: ["survival", "settlement"],
    metadata: {},
    refs: {
      evidence_refs: ["evidence/cycle-0001-observe.json"],
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
      evidence_refs: ["evidence/cycle-0001-observe.json"]
    },
    assertion_policy: {
      bead_is_context_not_authority: true,
      physical_success_requires_current_evidence: true
    }
  };
}

function validContextSummary() {
  return {
    bead_id: "bead-food-path",
    kind: "concern",
    status: "open",
    priority: 2,
    title: "Secure a reliable food path",
    description_summary: "Track the open concern before taking on more settlement work.",
    acceptance_evidence_required: ["inventory or chest evidence for food source"],
    notes_next: ["Inspect current food inventory and nearby safe options."],
    blockers: [],
    labels: ["survival"],
    evidence_refs: ["evidence/cycle-0001-observe.json"],
    dependency_refs: [],
    checkpoint_version: 1,
    checkpoint_ref: "plan-beads/beads/bead-food-path.json"
  };
}

function validPacket() {
  return {
    schema: "plan-bead-packet/v1",
    physical_progress_claim: false,
    ready_beads: [validContextSummary()],
    in_progress_beads: [],
    blocked_beads: [],
    recently_closed_beads: [],
    graph_summary: {
      open_count: 1,
      ready_count: 1,
      blocked_count: 0,
      deferred_count: 0,
      closed_recent_count: 0
    },
    rules: {
      beads_are_context_not_authority: true,
      ready_front_guides_goal_selection: true,
      action_surface_controls_execution: true,
      runtime_verifies_physical_progress: true
    }
  };
}

test("ActorPlanBead validator accepts a context-only bead", () => {
  const bead = assertValidActorPlanBead(validBead());

  assert.equal(bead.schema, "actor-plan-bead/v1");
  assert.equal(bead.assertion_policy.bead_is_context_not_authority, true);
});

test("ActorPlanBead validator rejects missing context-not-authority flag", () => {
  const result = validateActorPlanBead({
    ...validBead(),
    assertion_policy: {
      physical_success_requires_current_evidence: true
    }
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("bead_is_context_not_authority")));
});

test("PlanBeadDependency validator rejects self-dependencies", () => {
  const result = validatePlanBeadDependency({
    schema: "actor-plan-bead-dependency/v1",
    actor_id: "npc_b",
    bead_id: "bead-food-path",
    depends_on_bead_id: "bead-food-path",
    type: "blocks",
    rationale: "A bead cannot block itself.",
    evidence_refs: ["evidence/cycle-0001-observe.json"],
    created_at: "2026-05-31T00:00:00.000Z"
  });

  assert.equal(result.ok, false);
});

test("PlanBeadPacket validator rejects physical progress claims", () => {
  const result = validatePlanBeadPacket({
    ...validPacket(),
    physical_progress_claim: true
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("physical_progress_claim")));
});

test("PlanBeadPacket validator rejects missing context authority rule", () => {
  const result = validatePlanBeadPacket({
    ...validPacket(),
    rules: {
      ready_front_guides_goal_selection: true,
      action_surface_controls_execution: true,
      runtime_verifies_physical_progress: true
    }
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("beads_are_context_not_authority")));
});

test("PlanBeadOperation validator rejects executable authority in patches", () => {
  const result = validatePlanBeadOperation({
    schema: "plan-bead-operation/v1",
    actor_id: "npc_b",
    rationale: "Try to smuggle a primitive target through bead state.",
    evidence_refs: ["evidence/cycle-0001-observe.json"],
    confidence: "inferred",
    op: "create",
    patch: {
      kind: "concern",
      title: "Move to logs",
      description: "This should remain context only.",
      acceptance_evidence_required: ["runtime movement evidence"],
      notes_next: ["Do not execute from this patch."],
      priority: 1,
      primitive_id: "move_to",
      args: { x: 1, y: 64, z: 1 }
    }
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("primitive_id")));
});

test("PlanBead validators reject unknown statuses and dependency types", () => {
  assert.equal(validateActorPlanBead({ ...validBead(), status: "done" }).ok, false);
  assert.equal(
    validatePlanBeadDependency({
      schema: "actor-plan-bead-dependency/v1",
      actor_id: "npc_b",
      bead_id: "bead-food-path",
      depends_on_bead_id: "bead-tooling",
      type: "unlocks",
      rationale: "Unknown edge type.",
      evidence_refs: ["evidence/cycle-0001-observe.json"],
      created_at: "2026-05-31T00:00:00.000Z"
    }).ok,
    false
  );
});
