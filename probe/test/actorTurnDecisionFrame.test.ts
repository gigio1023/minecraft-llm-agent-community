/** Regression coverage for Actor Turn decision-frame evidence boundaries. */
import assert from "node:assert/strict";
import test from "node:test";

import { buildActorTurnDecisionFrame } from "../src/runtime/goals/actorEpisode/decisionFrame.js";
import type { ActionCardProjection } from "../src/runtime/goals/actorEpisode/actionCards.js";
import type {
  ActiveEpisode,
  ActorTurnCurrentStateProjection,
  EvidenceTraceEntry
} from "../src/runtime/goals/actorEpisode/types.js";

function activeEpisode(): ActiveEpisode {
  return {
    schema: "active-episode/v1",
    episode_id: "episode-1",
    actor_id: "npc_b",
    actors_visible_or_relevant: [],
    life_goal_ref: "goals/life.json",
    purpose: "Build a tiny useful structure near spawn.",
    current_focus: "Make a tiny roofless starter hut visible near spawn.",
    selected_plan_bead_refs: [],
    related_plan_bead_refs: [],
    success_signals: [
      {
        kind: "block_delta",
        description: "Visible placed blocks form a small outline or low walls."
      }
    ],
    pivot_triggers: [],
    mistake_budget: {
      allow_exploration_turns: 3,
      observe_repeat_limit: 2,
      exact_blocker_repeat_limit: 2
    },
    social_pressure: [],
    opened_from_refs: ["world-events/roofless-hut.json"],
    status: "active"
  };
}

function actionCards(): ActionCardProjection {
  return {
    schema: "action-card-projection/v1",
    actor_id: "npc_b",
    action_cards: [],
    runtime_mappings: [],
    deferred_counts: { primitives: 0, action_skills: 0 },
    missing_affordances: []
  };
}

function memoryOnlyTrace(turnId: string): EvidenceTraceEntry {
  return {
    schema: "evidence-trace/v1",
    turn_id: turnId,
    episode_id: "episode-1",
    action_ref: `actions/${turnId}.json`,
    runtime_gate_ref: `gates/${turnId}.json`,
    outcome: "no_progress",
    compact_summary: "remember preserved blocker note without physical progress",
    selected_action: { kind: "use_primitive", id: "remember", title: "Remember" }
  };
}

test("decision frame uses structure evidence instead of pending checklist as open progress front", () => {
  const currentState: ActorTurnCurrentStateProjection = {
    schema: "actor-turn-current-state/v1",
    observer_id: "npc_b",
    inventory_counts: { oak_planks: 4 },
    visible_actors: [],
    nearby_block_observations: [],
    shared_storage: { status: "unknown", items: [], evidence_refs: [] },
    structure_progress: {
      status: "progressing",
      total_placed_blocks: 6,
      latest_anchor: { x: -2, y: 64, z: -22 },
      latest_verifier: {
        status: "progressing",
        wall_coverage: 0.417,
        roof_coverage: 0
      },
      evidence_refs: ["evidence/cycle-0017-action-01-build_pattern.json"],
      summaries: ["build_pattern attempts=1 placed_blocks=6"],
      interpretation_notes: [
        "Structure progress is physical evidence context, not a universal goal-completion rule."
      ]
    },
    settlement_progress: {
      inventory_counts: { oak_planks: 4 },
      shared_storage_status: "unknown",
      known_positions: {
        shelter: { status: "progressing", anchor: { x: -2, y: 64, z: -22 }, evidence_refs: ["evidence/cycle-0017-action-01-build_pattern.json"] }
      },
      checklist: [
        {
          id: "starter_shelter_verified",
          status: "pending",
          reason: "No verified starter shelter evidence is known yet.",
          evidence_ref_count: 0
        }
      ],
      recent_blockers: []
    }
  };

  const frame = buildActorTurnDecisionFrame({
    activeEpisode: activeEpisode(),
    currentState,
    actionCardProjection: actionCards(),
    recentEvidenceTrace: [
      memoryOnlyTrace("turn-1"),
      memoryOnlyTrace("turn-2"),
      memoryOnlyTrace("turn-3")
    ]
  });

  assert.deepEqual(frame.open_progress_front.map((entry) => entry.id), ["structure_progress"]);
  assert.ok(!frame.open_progress_front.some((entry) => entry.id === "starter_shelter_verified"));
  assert.ok(frame.current_truths.some((truth) => truth.includes("structure_progress=progressing")));
  assert.ok(
    frame.next_action_guidance.some((guidance) =>
      guidance.includes("recent memory-only no_progress turns already preserved the blocker")
    )
  );
});

test("decision frame exposes death and respawn as current truth before older episode assumptions", () => {
  const currentState: ActorTurnCurrentStateProjection = {
    schema: "actor-turn-current-state/v1",
    observer_id: "npc_b",
    position: { x: 4, y: 65, z: 6 },
    inventory_counts: {},
    session_lifecycle: {
      schema: "runtime-session-lifecycle/v1",
      status: "respawned_after_death",
      death_count: 1,
      spawn_count: 1,
      last_event: {
        kind: "spawn",
        observed_at: "2026-06-06T00:00:00.000Z",
        position: { x: 4, y: 65, z: 6 }
      },
      inventory_may_have_reset: true,
      branch_recommended: true,
      branch_reason: "danger_or_survival_pressure",
      notes: ["A death event can reset inventory and invalidate older position/material assumptions."]
    },
    visible_actors: [],
    nearby_block_observations: [],
    shared_storage: { status: "unknown", items: [], evidence_refs: [] },
    settlement_progress: {
      inventory_counts: {},
      shared_storage_status: "unknown",
      known_positions: {
        actor: { position: { x: 4, y: 65, z: 6 }, evidence_refs: [] }
      },
      checklist: [],
      recent_blockers: []
    }
  };

  const frame = buildActorTurnDecisionFrame({
    activeEpisode: activeEpisode(),
    currentState,
    actionCardProjection: actionCards(),
    recentEvidenceTrace: []
  });

  assert.ok(frame.current_truths.some((truth) => truth.includes("session_status=respawned_after_death")));
  assert.ok(frame.current_truths.some((truth) => truth.includes("inventory_may_have_reset_after_death=true")));
  assert.ok(frame.next_action_guidance.some((guidance) =>
    guidance.includes("recover from current position/inventory/vitals")
  ));
});
