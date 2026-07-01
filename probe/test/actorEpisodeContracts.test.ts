/** Regression coverage for Actor Episode and review-summary contracts. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  auditEpisodeReviewSummary,
  validateActionCard,
  validateActiveEpisode,
  validateActorTurnInput,
  validateActorTurnExecutionDraft,
  validateDeliberationBranch,
  validateDeliberationOutput,
  validateEpisodeReviewSummary,
  validateEvidenceTraceEntry,
  type ActiveEpisode,
  type ActorTurnInput,
  type EpisodeReviewSummary,
  type EvidenceTraceEntry
} from "../src/runtime/goals/actorEpisode/index.js";

const episode: ActiveEpisode = {
  schema: "active-episode/v1",
  episode_id: "episode-wood-table-001",
  actor_id: "npc_b",
  actors_visible_or_relevant: ["npc_a"],
  life_goal_ref: "goals/life/active.json",
  purpose: "Recover from the blocked crafting-table path without forgetting shared work.",
  current_focus: "Place or regain access to a crafting table, then continue toolmaking.",
  selected_plan_bead_refs: ["plan-beads/beads/bead-crafting-table-access.json"],
  related_plan_bead_refs: ["plan-beads/beads/bead-shared-tooling.json"],
  success_signals: [
    {
      kind: "block_delta",
      description: "Crafting table is placed or an accessible crafting table is verified."
    }
  ],
  pivot_triggers: [
    {
      trigger: "same placement target is blocked twice",
      evidence_refs: ["evidence/turn-001-place-failed.json"]
    }
  ],
  mistake_budget: {
    allow_exploration_turns: 2,
    observe_repeat_limit: 1,
    exact_blocker_repeat_limit: 2
  },
  social_pressure: [
    {
      kind: "shared_storage",
      summary: "Other actors need visible toolmaking progress.",
      evidence_refs: ["storage/shared-chest-ledger.json"]
    }
  ],
  opened_from_refs: ["judgments/cycle-0004-judgment.json"],
  started_at_turn_ref: "turns/turn-001.json",
  status: "active"
};

const evidenceTrace: EvidenceTraceEntry = {
  schema: "evidence-trace/v1",
  turn_id: "turn-001",
  episode_id: episode.episode_id,
  action_ref: "actions/turn-001-action.json",
  runtime_gate_ref: "runtime-gates/turn-001-gate.json",
  execution_ref: "evidence/turn-001-place.json",
  verifier_ref: "verifiers/turn-001-place.json",
  post_observation_ref: "observations/turn-001-post.json",
  provider_usage_ref: "provider-usage/turn-001.json",
  outcome: "verified_mutation",
  compact_summary: "Placed a crafting table and verified a nearby post-observation."
};

function actorTurnInput(): ActorTurnInput {
  return {
    schema: "actor-turn-input/v1",
    turn_id: "turn-002",
    decision_frame: {
      schema: "actor-turn-decision-frame/v1",
      priority_order: [
        "use decision_frame current_truths before older episode wording",
        "consume completed_work and do_not_repeat before choosing an action",
        "choose one visible action_cards entry with schema-valid parameters"
      ],
      episode_focus: "Place or regain access to a crafting table, then continue toolmaking.",
      episode_focus_status: {
        status: "open",
        focus: "Place or regain access to a crafting table, then continue toolmaking.",
        evidence_refs: ["goals/cycle-001.json"],
        next: "advance_the_focus_with_runtime_evidence_or_pivot_when_current_truths_contradict_it"
      },
      current_truths: [
        "inventory=crafting_table:1",
        "crafting_table=unknown",
        "visible_actor=npc_a"
      ],
      completed_work: [],
      recent_action_verdicts: [],
      do_not_repeat: ["do not reuse the blocked placement target from turn-001"],
      open_progress_front: [],
      next_action_guidance: [
        "choose a new explicit placement cell or record the blocker if no valid cell exists"
      ]
    },
    active_episode: episode,
    actor_context: {
      actor_id: "npc_b",
      actor_soul_ref: "soul/npc_b.json",
      life_goal_ref: "goals/life/active.json",
      life_goal_summary: "Become reliable in settlement work through evidence-backed action."
    },
    current_state: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory_counts: { crafting_table: 1 },
      visible_actors: [{ id: "npc_a", distance: 4, busy: false }],
      nearby_block_observations: [
        { name: "grass_block", distance: 1, source: "observation_nearby_block", evidence_refs: [] }
      ],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      settlement_progress: {
        inventory_counts: { crafting_table: 1 },
        shared_storage_status: "unknown",
        known_positions: {
          actor: { position: { x: 0, y: 64, z: 0 }, evidence_refs: ["observations/turn-002-pre.json"] }
        },
        checklist: [
          {
            id: "crafting_table_known_or_placed",
            status: "pending",
            reason: "Crafting table has not been placed yet.",
            evidence_ref_count: 0
          }
        ],
        recent_blockers: []
      }
    },
    source_evidence_bundle: {
      schema: "actor-turn-source-evidence-bundle/v1",
      observation: {
        observation_refs: ["observations/turn-002-pre.json"],
        position: { x: 0, y: 64, z: 0 },
        inventory_items: [{ name: "crafting_table", count: 1 }],
        visible_actors: [{ id: "npc_a", distance: 4, busy: false }],
        nearby_blocks: [
          {
            name: "grass_block",
            distance: 1,
            source: "observation_nearby_block",
            evidence_refs: ["observations/turn-002-pre.json"]
          }
        ]
      },
      world_event_cards: [],
      memory_cards: [],
      recent_action_details: [
        {
          turn_id: evidenceTrace.turn_id,
          episode_id: evidenceTrace.episode_id,
          outcome: evidenceTrace.outcome,
          compact_summary: evidenceTrace.compact_summary,
          evidence_refs: []
        }
      ],
      plan_bead_cards: [
        {
          bead_id: "bead-crafting-table-access",
          title: "Crafting table access is blocked",
          status: "in_progress",
          priority: 1,
          why_it_matters: "Toolmaking cannot continue until the table issue is physically resolved.",
          next_hints: ["Repair table placement before trying table-sized recipes."],
          blockers: ["last placement target was occupied"],
          acceptance_evidence_required: ["block or inventory evidence for table access"],
          evidence_refs: ["evidence/turn-001-place.json"],
          dependency_refs: ["plan-bead-dependency:npc_b:bead-crafting-table-access:blocks:bead-toolmaking"],
          checkpoint_ref: "plan-beads/beads/bead-crafting-table-access.json"
        }
      ]
    },
    relationship_context: {
      relationship_refs: ["relationships/npc_a-npc_b.json"],
      visible_actor_ids: ["npc_a"],
      relationship_cards: [
        {
          source: "incoming_signal",
          ref: "relationships/npc_a-npc_b.json",
          summary: "Make shared progress visible if toolmaking remains blocked."
        }
      ]
    },
    runtime_retry_constraints: [
      {
        constraint_id: "retry-place-table-oak-leaves",
        target_summary: "place crafting_table at blocked oak_leaves target",
        args_normalized: { itemName: "crafting_table", targetPosition: { x: 1, y: 64, z: 0 } },
        blocked_reason: "target cell was occupied",
        repeat_count: 2,
        evidence_refs: ["evidence/turn-001-place-failed.json"]
      }
    ],
    action_cards: [
      {
        schema: "action-card/v1",
        action_card_id: "card-place-block-nearby",
        title: "Place a block in a nearby valid cell",
        description: "Place an inventory block at a structured target position.",
        parameters_schema_ref: "schemas/place-block-nearby-parameters.json",
        parameter_hints: ["{itemName:string,targetPosition:{x:number,y:number,z:number}}"],
        current_state_requirements: [
          "inventory has the requested block item",
          "provider supplied an explicit target cell or support surface"
        ],
        expected_evidence: ["block delta", "post-observation"],
        likely_blockers: ["occupied target", "missing inventory item"],
        readiness: "requires_current_state_check",
        runtime_mapping_ref: "runtime-actions/place_block"
      }
    ],
    minecraft_basic_guide: {
      schema: "minecraft-basic-guide/v1",
      guide_ref: "project-docs/runtime/overview/minecraft-basic-guide.md",
      item_flows: ["log -> planks -> crafting_table"],
      station_requirements: ["wooden_pickaxe requires crafting_table access"],
      blocker_recovery_guides: ["if placement target is occupied, pick another adjacent valid cell"],
      observe_stop_guides: ["do not repeat observe after scan-backed blocker evidence"]
    },
    provider_budget_hint: {
      provider_id: "gemini-api",
      model: "gemma-4-31b-it",
      status: "ok",
      remaining_turns_hint: 60
    }
  };
}

function passedEpisodeSummary(): EpisodeReviewSummary {
  return {
    schema: "episode-review-summary/v1",
    episode_id: episode.episode_id,
    actor_id: "npc_b",
    provider: {
      provider_id: "gemini-api",
      model: "gemma-4-31b-it"
    },
    total_turns: 3,
    final_verdict: {
      status: "passed",
      reason: "Crafting table access was physically verified and shared context was updated.",
      evidence_refs: ["evidence/turn-001-place.json", "storage/shared-chest-ledger.json"]
    },
    metrics: {
      non_observe_wait_remember_turns: 3,
      verified_mutation_turns: 1,
      social_visibility_events: 1,
      false_pass_count: 0,
      unsupported_claim_count: 0,
      exact_retry_constraint_blocks: 1,
      distinct_action_families: 3
    },
    evidence_trace_refs: ["traces/turn-001.json", "traces/turn-002.json"],
    plan_bead_closure_checks: [
      {
        bead_id: "bead-crafting-table-access",
        close_kind: "satisfied",
        status: "accepted",
        evidence_refs: ["evidence/turn-001-place.json"],
        acceptance_evidence_required: ["block or inventory evidence for table access"],
        matched_acceptance_criteria: true,
        reason: "Post-observation confirmed table access."
      }
    ],
    social_visibility: {
      event_count: 1,
      evidence_refs: ["storage/shared-chest-ledger.json"]
    },
    failure_classifications: []
  };
}

test("Actor Episode contract validators accept the deterministic vertical-slice records", () => {
  assert.equal(validateActiveEpisode(episode).ok, true);
  assert.equal(validateEvidenceTraceEntry(evidenceTrace).ok, true);
  assert.equal(validateActorTurnInput(actorTurnInput()).ok, true);
  assert.equal(validateActionCard(actorTurnInput().action_cards[0]).ok, true);
  assert.equal(validateEpisodeReviewSummary(passedEpisodeSummary()).ok, true);
  assert.deepEqual(
    auditEpisodeReviewSummary(passedEpisodeSummary(), {
      known_refs: [
        "evidence/turn-001-place.json",
        "storage/shared-chest-ledger.json",
        "traces/turn-001.json",
        "traces/turn-002.json"
      ]
    }),
    []
  );
});

test("Actor Turn input rejects malformed source evidence cards", () => {
  const input = actorTurnInput();
  const malformed = structuredClone(input) as Record<string, any>;
  malformed.source_evidence_bundle.recent_action_details = [
    {
      turn_id: evidenceTrace.turn_id,
      outcome: "unknown",
      compact_summary: "missing structured source evidence shape",
      evidence_refs: []
    }
  ];

  const result = validateActorTurnInput(malformed);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) =>
      error.includes("source_evidence_bundle.recent_action_details[0].outcome")
    )
  );
});

test("Actor Turn output uses Action Cards instead of primitive or action-skill authority", () => {
  const valid = validateActorTurnExecutionDraft({
    schema: "actor-turn-execution-draft/v1",
    choice: "use_existing_action",
    action_card_id: "card-place-block-nearby",
    parameters: { item: "crafting_table", position: { x: 1, y: 64, z: 1 } },
    expected_outcome: "record_blocker_or_done",
    why_this_action: "Use the existing placement card with explicit parameters.",
    expected_evidence: ["block delta"],
    fallback_if_blocked: "try a different adjacent target"
  });
  assert.equal(valid.ok, true);

  const invalid = validateActorTurnExecutionDraft({
    schema: "actor-turn-execution-draft/v1",
    choice: "use_existing_action",
    action_card_id: "card-place-block-nearby",
    primitive_id: "place_block",
    action_skill_id: "placeCraftingTable",
    args: { item: "crafting_table" },
    parameters: { item: "crafting_table" },
    expected_outcome: "record_blocker_or_done",
    why_this_action: "This leaks old selection taxonomy.",
    expected_evidence: ["block delta"],
    fallback_if_blocked: "observe"
  });

  assert.equal(invalid.ok, false);
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("primitive_id")));
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("action_skill_id")));
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("args")));
});

test("Actor Turn output accepts bounded Mineflayer authoring without raw execution authority", () => {
  const result = validateActorTurnExecutionDraft({
    schema: "actor-turn-execution-draft/v1",
    choice: "author_mineflayer_action",
    proposed_action_skill_id: "findNearbyCraftingTableCell",
    purpose: "Find a valid adjacent cell and place the crafting table there.",
    input_schema: {
      type: "object",
      required: ["item"],
      additionalProperties: false,
      properties: { item: { const: "crafting_table" } }
    },
    parameters: { item: "crafting_table" },
    expected_outcome: "record_blocker_or_done",
    source_language: "typescript",
    source: "export async function run(ctx, params) { await ctx.placeBlock(params.item, { x: 1, y: 64, z: 0 }); }",
    helper_api_version: "mineflayer-action-skill-helper/v1",
    helper_allowlist: ["placeBlock", "observe"],
    timeout_ms: 8000,
    verifier: { kind: "block_or_inventory_delta", item: "crafting_table" },
    known_failure_modes: ["no adjacent replaceable cell"],
    promotion_policy: "promote_after_passed_trial",
    why_this_action: "Existing placement attempts keep selecting occupied targets.",
    expected_evidence: ["helper events", "post-observation"],
    fallback_if_blocked: "record blocker and branch to Deliberation"
  });

  assert.equal(result.ok, true);
});

test("Episode review rejects passed verdicts built from movement or narration only", () => {
  const summary = passedEpisodeSummary();
  summary.final_verdict.evidence_refs = ["evidence/turn-001-move.json"];
  summary.metrics.verified_mutation_turns = 0;
  summary.metrics.social_visibility_events = 0;
  summary.social_visibility = { event_count: 0, evidence_refs: [] };
  summary.plan_bead_closure_checks = [];

  const errors = auditEpisodeReviewSummary(summary, {
    known_refs: ["evidence/turn-001-move.json", "traces/turn-001.json", "traces/turn-002.json"]
  });

  assert.ok(
    errors.some((error) =>
      error.includes("Episode passed without verified mutation or social visibility evidence")
    )
  );
});

test("Episode review rejects satisfied PlanBead closure that does not match acceptance criteria", () => {
  const summary = passedEpisodeSummary();
  summary.plan_bead_closure_checks[0] = {
    bead_id: "bead-crafting-table-access",
    close_kind: "satisfied",
    status: "accepted",
    evidence_refs: ["evidence/turn-001-move.json"],
    acceptance_evidence_required: ["block or inventory evidence for table access"],
    matched_acceptance_criteria: false,
    reason: "Movement happened, but table access was not proven."
  };

  const errors = auditEpisodeReviewSummary(summary, {
    known_refs: [
      "evidence/turn-001-place.json",
      "evidence/turn-001-move.json",
      "storage/shared-chest-ledger.json",
      "traces/turn-001.json",
      "traces/turn-002.json"
    ]
  });

  assert.ok(
    errors.some((error) =>
      error.includes("Satisfied PlanBead closure bead-crafting-table-access did not match acceptance criteria")
    )
  );
});

test("Episode review audits artifact refs instead of trusting summary prose", () => {
  const errors = auditEpisodeReviewSummary(passedEpisodeSummary(), {
    known_refs: ["evidence/turn-001-place.json"]
  });

  assert.ok(
    errors.some((error) =>
      error.includes("Episode review references unknown artifact ref: storage/shared-chest-ledger.json")
    )
  );
  assert.ok(
    errors.some((error) =>
      error.includes("Episode review references unknown artifact ref: traces/turn-001.json")
    )
  );
});

test("Deliberation branch contract is branch-only and evidence-linked", () => {
  const result = validateDeliberationBranch({
    schema: "deliberation-branch/v1",
    branch_id: "branch-repeated-placement-blocker",
    reason: "repeated_exact_blocker",
    evidence_refs: ["runtime-retry-constraints/retry-place-table-oak-leaves.json"],
    current_episode_ref: "episodes/episode-wood-table-001.json"
  });

  assert.equal(result.ok, true);

  const emptyEvidence = validateDeliberationBranch({
    schema: "deliberation-branch/v1",
    branch_id: "branch-without-evidence",
    reason: "context_change",
    evidence_refs: [],
    current_episode_ref: "episodes/episode-wood-table-001.json"
  });
  assert.equal(emptyEvidence.ok, false);
});

test("Deliberation output can reframe episodes but cannot emit executable authority", () => {
  const valid = validateDeliberationOutput({
    schema: "deliberation-output/v1",
    branch_id: "branch-repeated-placement-blocker",
    current_episode_ref: "episodes/episode-wood-table-001.json",
    rationale: "The same placement target is blocked, so reframe the episode around recovery.",
    next_episode: {
      ...episode,
      episode_id: "episode-wood-table-recovery-002",
      opened_from_refs: [
        ...episode.opened_from_refs,
        "episodes/episode-wood-table-001.json",
        "runtime-retry-constraints/retry-place-table-oak-leaves.json"
      ]
    },
    plan_bead_op_proposals: []
  });
  assert.equal(valid.ok, true);

  const invalid = validateDeliberationOutput({
    schema: "deliberation-output/v1",
    branch_id: "branch-repeated-placement-blocker",
    current_episode_ref: "episodes/episode-wood-table-001.json",
    rationale: "This output tries to choose the next action.",
    primitive_id: "place_block",
    action_skill_id: "placeCraftingTable",
    parameters: { itemName: "crafting_table" },
    next_episode: episode,
    plan_bead_op_proposals: [
      {
        op: "update_notes",
        action_card_id: "card-place-block",
        source_language: "typescript"
      }
    ]
  });

  assert.equal(invalid.ok, false);
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("primitive_id")));
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("action_skill_id")));
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("parameters")));
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("action_card_id")));
  assert.ok(!invalid.ok && invalid.errors.some((error) => error.includes("source_language")));
});
