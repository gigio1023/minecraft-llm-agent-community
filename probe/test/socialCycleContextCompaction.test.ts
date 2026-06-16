/** Regression coverage for compaction without laundering weak progress claims. */
import assert from "node:assert/strict";
import test from "node:test";

import { buildNpcBActionSkillRecord } from "./helpers/socialCycleTestHelpers.js";
import { buildActionSurfacePacket } from "../src/runtime/actionSurface.js";
import { buildSettlementState } from "../src/runtime/settlement/settlementState.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import {
  buildSocialCycleContextCheckpoint,
  socialCycleAuthorityContextNames,
  type SocialCycleContextPacketLike
} from "../src/runtime/goals/socialCycleContextCompaction.js";
import type {
  ActorCycleGoal,
  ActorLifeGoal,
  CycleJudgment
} from "../src/runtime/goals/types.js";
import type { ActorTurnResolvedAction } from "../src/runtime/goals/actorEpisode/index.js";
import type { PlanBeadPacket } from "../src/runtime/goals/planBeads/index.js";

const createdAt = "2026-05-25T00:00:00.000Z";

function lifeGoal(): ActorLifeGoal {
  const soul = compileActorSoulFromProfile("npc_b");
  return {
    schema: "actor-life-goal/v1",
    actor_id: "npc_b",
    goal_id: "life-1",
    objective: soul.life_goal,
    status: "active",
    source: "actor_soul",
    created_at: createdAt,
    updated_at: createdAt,
    cycle_count: 2,
    action_count: 4,
    evidence_refs: ["evidence/life-goal-state.json"],
    memory_refs: ["memory/episodic/social-cycle-0001.json"],
    relationship_refs: []
  };
}

function cycleGoal(): ActorCycleGoal {
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: "npc_b",
    goal_id: "cycle-goal-1",
    life_goal_id: "life-1",
    cycle_id: "cycle-0003",
    status: "active",
    source: "runtime_rule",
    summary: "Follow up on blocked log collection with a bounded observation",
    rationale: "Previous judgment says the actor needs better local evidence before acting.",
    derived_from: {
      soul_ref: "soul.json",
      observation_refs: ["evidence/cycle-0003-observe.json"],
      world_event_refs: [],
      memory_refs: ["memory/episodic/social-cycle-0001.json"],
      relationship_refs: [],
      previous_cycle_judgment_refs: ["judgments/cycle-0002-action-01-judgment.json"]
    },
    success_condition: {
      verifier: "runtime_primitive_or_evidence",
      evidence_required: ["tool_attempt", "verifier_status"]
    },
    allowed_action_skill_ids: ["collectLogs", "runtimeObserveAndRemember"],
    allowed_primitive_ids: ["observe", "collect_logs", "wait", "remember"],
    stop_conditions: ["verifier_passed", "max_actions_reached"]
  };
}

function actorTurnAction(): ActorTurnResolvedAction {
  return {
    schema: "actor-turn-resolved-action/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0003",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_primitive",
    action_card_id: "primitive:observe",
    primitive_id: "observe",
    parameters: {},
    expected_outcome: "diagnostic_unlock",
    why_this_action: "Refresh state before choosing another log action.",
    expected_evidence: ["observation"],
    fallback_if_blocked: "remember the blocker and wait"
  };
}

function previousJudgment(): CycleJudgment {
  return {
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0002",
    cycle_goal_id: "cycle-goal-0",
    outcome: "verified_progress",
    what_happened: "Provider output claimed physical progress.",
    why_it_mattered_for_life_goal: "Useful only if runtime evidence supports it.",
    verifier_status: "passed",
    evidence_refs: ["evidence/cycle-0002-action.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: ["Continue only with current evidence"]
  };
}

function planBeadPacket(): PlanBeadPacket {
  return {
    schema: "plan-bead-packet/v1",
    physical_progress_claim: false,
    ready_beads: [
      {
        bead_id: "bead-b",
        kind: "concern",
        status: "open",
        priority: 1,
        title: "Investigate new storage concern",
        description_summary: "Concern B appeared while concern A remains in progress.",
        acceptance_evidence_required: ["runtime storage evidence"],
        notes_next: ["Observe the shared chest before acting."],
        blockers: [],
        labels: ["context-change"],
        evidence_refs: ["plan-beads/beads/bead-b.json"],
        dependency_refs: ["plan-bead-dependency:npc_b:bead-b:discovered_from:bead-a"],
        checkpoint_version: 1,
        checkpoint_ref: "plan-beads/beads/bead-b.json"
      }
    ],
    in_progress_beads: [
      {
        bead_id: "bead-a",
        kind: "concern",
        status: "in_progress",
        priority: 2,
        title: "Continue prior resource concern",
        description_summary: "Concern A remains preserved across the context change.",
        acceptance_evidence_required: ["runtime resource evidence"],
        notes_next: ["Do not forget the prior concern."],
        blockers: [],
        labels: ["context-change"],
        evidence_refs: ["plan-beads/beads/bead-a.json"],
        dependency_refs: [],
        checkpoint_version: 2,
        checkpoint_ref: "plan-beads/beads/bead-a.json"
      }
    ],
    blocked_beads: [],
    recently_closed_beads: [],
    graph_summary: {
      open_count: 2,
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

function contextPacket(): SocialCycleContextPacketLike {
  const soul = compileActorSoulFromProfile("npc_b");
  const activeActionSkills = [buildNpcBActionSkillRecord()];
  const observation = {
    status: "ok" as const,
    observerId: "npc_b",
    position: { x: 1, y: 64, z: 1 },
    visibleActors: [],
    memory: Array.from({ length: 80 }, (_, index) =>
      `old observe/wait note ${index}: repeated context that should not be carried raw`
    ),
    inventory: [{ name: "minecraft_item", count: 2 }],
    worldStateSummary: {
      schema: "world-state-summary/v1",
      scan_id: "scan-1",
      center: { x: 1, y: 64, z: 1 },
      radius: 32,
      vertical_range: { min_y: 48, max_y: 80, center_y: 64 },
      loaded_coverage: {
        method: "blockAt-sampled-columns",
        scope: "sampled_columns_only",
        sample_stride: 8,
        sampled_columns: 4,
        loaded_columns: 4,
        unknown_columns: 0,
        approximate_loaded_ratio: 1,
        exhaustive: false,
        sample_had_unknown_columns: false,
        absence_claims_exhaustive: false,
        incomplete: true
      },
      block_observations: {
        total_verified: 1,
        truncated: false,
        by_name: [
          {
            name: "minecraft_block",
            count: 1,
            nearest: [{ name: "minecraft_block", distance: 6.25, position: { x: 7, y: 64, z: 1 } }]
          }
        ],
        nearest: [{ name: "minecraft_block", distance: 6.25, position: { x: 7, y: 64, z: 1 } }]
      },
      limitations: []
    },
    sharedChest: {
      chestId: "shared_spawn_chest",
      items: [{ name: "minecraft_item", count: 1 }]
    }
  };
  const judgment = previousJudgment();
  return {
    schema: "social-cycle-context/v1",
    ActorSoul: soul,
    ActorLifeGoal: lifeGoal(),
    previous_cycle_judgments: [
      {
        ref: "judgments/cycle-0002-action-01-judgment.json",
        cycle_id: judgment.cycle_id,
        outcome: judgment.outcome,
        what_happened: judgment.what_happened,
        why_it_mattered_for_life_goal: judgment.why_it_mattered_for_life_goal,
        next_goal_context: judgment.next_goal_context
      }
    ],
    observation,
    action_surface: buildActionSurfacePacket({
      actorId: "npc_b",
      activeActionSkills,
      allowedPrimitiveIds: ["observe", "collect_logs", "wait", "remember"],
      recentBlockers: [{ key: "no_low_logs", count: 2, example: "No reachable low logs" }]
    }),
    relationship_context: {
      relationships: [],
      incoming_relationships: [],
      relationship_context_signals: [],
      incoming_relationship_context_signals: []
    },
    memory_packet: {
      schema: "actor-memory-retrieval/v1",
      actor_id: "npc_b",
      retrieval_policy: {
        objective_category: "social_cycle",
        kinds: [],
        item_names: ["oak_log"],
        action_skill_ids: ["collectLogs"],
        limit: 8,
        ranking_signals: []
      },
      retrieved_episodic: [
        {
          memory_id: "social-cycle-0002",
          kind: "blocker",
          layer: "episodic",
          status: "active",
          confidence: "observed",
          summary: "collect_logs failed before; keep observation evidence current.",
          evidence_refs: ["evidence/cycle-0002-collect_logs.json"],
          reason: "recent blocker",
          score: 10
        }
      ],
      retrieved_procedural: [],
      retrieved_semantic: [],
      retrieved_social: [],
      guardrails: [],
      beliefs: []
    },
    plan_bead_packet: planBeadPacket(),
    settlement_state: buildSettlementState({
      actorId: "npc_b",
      observation,
      activeActionSkills,
      previousJudgments: [{ judgment }],
      evidenceRefs: ["evidence/cycle-0003-observe.json"],
      judgmentRefs: ["judgments/cycle-0002-action-01-judgment.json"],
      now: createdAt
    }),
    runtime_retry_constraints: [
      {
        schema: "runtime-retry-constraint/v1",
        constraint_id: "retry-primitive-move_to-test",
        actor_id: "npc_b",
        action_kind: "use_primitive",
        target: {
          kind: "primitive",
          id: "move_to",
          primitive_id: "move_to"
        },
        args_fingerprint: "abc123",
        args_normalized: { direction: "east", distance: 8 },
        blocker_key: "blocked_pathfinder_failed",
        blocker_status: "blocked",
        blocker_reason: "pathfinder failed before target",
        repeat_count: 2,
        attempt_refs: ["cycle-0001-action-01", "cycle-0002-action-01"],
        evidence_refs: ["evidence/cycle-0002-move_to.json"],
        rule: {
          same_target_and_args_blocked: true,
          provider_must_pivot_or_repair_args: true,
          runtime_blocks_before_mineflayer: true
        }
      }
    ],
    world_events: [
      {
        schema: "world-event/v1",
        event_id: "world-event-1",
        kind: "scenario_event",
        authority: "context_only",
        summary: "Settlement wants useful materials, but LifeGoal remains authoritative.",
        actor_refs: ["npc_b"],
        evidence_refs: ["evidence/world-event-1.json"],
        created_at: createdAt
      }
    ]
  };
}

test("social-cycle context checkpoint preserves authority names and compact refs", () => {
  const checkpoint = buildSocialCycleContextCheckpoint({
    checkpointId: "checkpoint-test",
    createdAt,
    context: contextPacket(),
    currentCycleGoal: cycleGoal(),
    currentActorTurnAction: actorTurnAction(),
    trigger: "token_limit",
    reason: "Provider input exceeded local token budget after repeated observe/wait context.",
    refs: {
      inputContextRef: "provider-inputs/goal-mind-cycle-0003.json",
      latestObservationRef: "evidence/cycle-0003-observe.json",
      cycleGoalRef: "goals/cycle/cycle-goal-1.json",
      actorTurnActionRef: "goals/cycle/actor-turn-actions/cycle-0003-action-01-actor-turn-action.json",
      recentActionRefs: ["goals/cycle/actor-turn-actions/cycle-0002-action-01-actor-turn-action.json"],
      evidenceRefs: [
        "evidence/cycle-0002-collect_logs.json",
        "evidence/cycle-0003-observe.json"
      ],
      verifierRefs: ["verifier/cycle-0002-collect_logs.json"],
      judgmentRefs: ["judgments/cycle-0002-action-01-judgment.json"],
      memoryRefs: ["memory/episodic/social-cycle-0002.json"],
      planBeadPacketRef: "provider-inputs/plan-bead-packet-cycle-0003.json",
      planBeadRefs: ["plan-beads/beads/bead-a.json", "plan-beads/beads/bead-b.json"],
      providerOutputRefs: ["provider-outputs/goal-mind-cycle-0003-out.json"]
    }
  });

  assert.equal(checkpoint.schema, "social-cycle-context-checkpoint/v1");
  assert.equal(checkpoint.trigger, "token_limit");
  assert.equal(checkpoint.reason.includes("repeated observe/wait"), true);
  assert.equal(checkpoint.rules.no_provider_call, true);
  assert.ok(checkpoint.estimated_tokens_before > checkpoint.estimated_tokens_after);
  assert.ok(checkpoint.recent_tail_refs.includes("evidence/cycle-0003-observe.json"));
  assert.ok(checkpoint.recent_tail_refs.includes("verifier/cycle-0002-collect_logs.json"));

  const inputNames = checkpoint.input_context_manifest.entries.map((entry) => entry.context_name);
  const replacementNames = checkpoint.replacement_context_manifest.entries.map((entry) => entry.context_name);
  for (const contextName of socialCycleAuthorityContextNames) {
    assert.ok(inputNames.includes(contextName), `input manifest should include ${contextName}`);
    assert.ok(replacementNames.includes(contextName), `replacement manifest should include ${contextName}`);
  }

  const observationEntry = checkpoint.replacement_context_manifest.entries.find((entry) =>
    entry.context_name === "latest observation summary/ref"
  );
  assert.equal(observationEntry?.retention, "summary_and_ref");
  assert.deepEqual(observationEntry?.refs, ["evidence/cycle-0003-observe.json"]);

  const retryEntry = checkpoint.replacement_context_manifest.entries.find((entry) =>
    entry.context_name === "runtime retry constraints"
  );
  assert.equal(retryEntry?.retention, "summary_and_ref");

  const planBeadInputEntry = checkpoint.input_context_manifest.entries.find((entry) =>
    entry.context_name === "plan bead packet"
  );
  assert.equal(planBeadInputEntry?.retention, "full");
  assert.equal(planBeadInputEntry?.authority_bearing, false);
  assert.ok(planBeadInputEntry?.refs.includes("plan-beads/beads/bead-a.json"));

  const planBeadReplacementEntry = checkpoint.replacement_context_manifest.entries.find((entry) =>
    entry.context_name === "plan bead packet"
  );
  assert.equal(planBeadReplacementEntry?.retention, "summary_and_ref");
});

test("compact summary facts are ref-backed and cannot claim physical progress", () => {
  const checkpoint = buildSocialCycleContextCheckpoint({
    context: contextPacket(),
    currentCycleGoal: cycleGoal(),
    currentActorTurnAction: actorTurnAction(),
    trigger: "cycle_boundary",
    reason: "Snapshot before the next cycle provider input.",
    refs: {
      inputContextRef: "provider-inputs/action-planner-cycle-0003.json",
      latestObservationRef: "evidence/cycle-0003-observe.json",
      cycleGoalRef: "goals/cycle/cycle-goal-1.json",
      actorTurnActionRef: "goals/cycle/actor-turn-actions/cycle-0003-action-01-actor-turn-action.json",
      evidenceRefs: ["evidence/cycle-0003-observe.json"],
      verifierRefs: ["verifier/cycle-0002-collect_logs.json"],
      judgmentRefs: ["judgments/cycle-0002-action-01-judgment.json"]
    }
  });

  assert.deepEqual(checkpoint.compact_summary.physical_progress_claims, []);
  for (const fact of checkpoint.compact_summary.facts) {
    assert.equal(fact.physical_progress_claim, false);
    assert.ok(fact.evidence_refs.length > 0, `${fact.label} should have evidence refs`);
  }

  const priorJudgmentFact = checkpoint.compact_summary.facts.find((fact) =>
    fact.label === "previous CycleJudgment cycle-0002"
  );
  assert.ok(priorJudgmentFact);
  assert.match(priorJudgmentFact.summary, /carries it only as judgment context/);

  const observationFact = checkpoint.compact_summary.facts.find((fact) =>
    fact.label === "latest observation"
  );
  assert.ok(observationFact);
  assert.match(observationFact.summary, /coverage=sampled_columns_only\/non_exhaustive/);
  assert.doesNotMatch(observationFact.summary, /observed blocks=not present/);

  const retryFact = checkpoint.compact_summary.facts.find((fact) =>
    fact.label === "runtime retry constraints"
  );
  assert.ok(retryFact);
  assert.match(retryFact.summary, /exact target\/args gates/);

  const planBeadFact = checkpoint.compact_summary.facts.find((fact) =>
    fact.label === "plan bead packet"
  );
  assert.ok(planBeadFact);
  assert.equal(planBeadFact.physical_progress_claim, false);
  assert.equal(planBeadFact.scope, "plan_bead_context");
  assert.match(planBeadFact.summary, /context only/);
});

test("builder rejects compact summaries without required evidence refs", () => {
  assert.throws(
    () =>
      buildSocialCycleContextCheckpoint({
        context: contextPacket(),
        currentCycleGoal: cycleGoal(),
        currentActorTurnAction: actorTurnAction(),
        trigger: "report_snapshot",
        reason: "bad checkpoint",
        refs: {
          inputContextRef: "provider-inputs/action-planner-cycle-0003.json",
          latestObservationRef: "",
          cycleGoalRef: "goals/cycle/cycle-goal-1.json",
          actorTurnActionRef: "goals/cycle/actor-turn-actions/cycle-0003-action-01-actor-turn-action.json"
        }
      }),
    /latestObservationRef/
  );
});
