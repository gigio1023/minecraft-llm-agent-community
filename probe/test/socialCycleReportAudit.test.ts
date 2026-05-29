import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { auditSocialCycleReport } from "../src/runtime/goals/socialCycleReportAuditCli.js";
import { buildSocialCycleReviewSummary } from "../src/runtime/goals/socialCycleReviewSummary.js";
import type { SocialCycleRunReport } from "../src/runtime/goals/types.js";

const actorId = "npc_b";

function baseReport(): SocialCycleRunReport {
  return {
    schema: "social-cycle-run-report/v1",
    run_id: "social-cycle-audit-fixture",
    actor_id: actorId,
    provider: {
      provider_id: "openai-api",
      model: "gpt-5.4-mini",
      reasoning: "low"
    },
    runtime_status: "blocked",
    agency_status: {
      life_goal_source: "actor_soul",
      strategic_goal_source: "llm_planner",
      cycle_goal_source: "llm_planner",
      used_soul: true,
      used_life_goal: true,
      used_previous_judgment: true,
      used_memory_refs: 0,
      used_relationship_refs: 0,
      used_world_event_refs: 0,
      builtin_goal_authority: false,
      builtin_execution_source: false,
      fixture_dependency: false,
      helper_expansion_count: 0,
      gameplay_progress_verified: false
    },
    cycles: [
      {
        cycle_id: "cycle-0001",
        cycle_goal_ref: "goals/cycle/cycle-0001-goal.json",
        action_intent_ref: "goals/cycle/intents/cycle-0001-intent.json",
        provider_input_refs: ["provider-inputs/cycle-0001-input.json"],
        provider_output_refs: ["provider-outputs/cycle-0001-output.json"],
        evidence_refs: ["evidence/cycle-0001-observe.json"],
        judgment_ref: "judgments/cycle-0001-judgment.json",
        verifier_status: "not_applicable"
      },
      {
        cycle_id: "cycle-0002",
        cycle_goal_ref: "goals/cycle/cycle-0002-goal.json",
        action_intent_ref: "goals/cycle/intents/cycle-0002-intent.json",
        provider_input_refs: ["provider-inputs/cycle-0002-input.json"],
        provider_output_refs: ["provider-outputs/cycle-0002-output.json"],
        evidence_refs: ["evidence/cycle-0002-observe.json"],
        judgment_ref: "judgments/cycle-0002-judgment.json",
        verifier_status: "not_applicable"
      }
    ]
  };
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function makeWorkspaceRoot(name: string) {
  return fs.mkdtemp(path.join(os.tmpdir(), `${name}-`));
}

async function writeActorWorkspaceFixture(
  workspaceRoot: string,
  report: SocialCycleRunReport
) {
  const actorDir = path.join(workspaceRoot, actorId);
  await writeJson(path.join(actorDir, "actor.json"), {
    schema: "actor-workspace/v1",
    actor_id: actorId
  });
  await writeJson(path.join(actorDir, "goals/life/active.json"), {
    schema: "actor-life-goal/v1",
    actor_id: actorId,
    goal_id: "life-goal",
    objective: "Build a reliable settlement routine",
    status: "active",
    source: "actor_soul",
    created_at: "2026-05-23T00:00:00.000Z",
    updated_at: "2026-05-23T00:00:00.000Z",
    cycle_count: 0,
    action_count: 0,
    evidence_refs: [],
    memory_refs: [],
    relationship_refs: []
  });

  for (const cycle of report.cycles) {
    await writeJson(path.join(actorDir, cycle.cycle_goal_ref), {
      schema: "actor-cycle-goal/v1",
      actor_id: actorId,
      goal_id: cycle.cycle_goal_ref,
      cycle_id: cycle.cycle_id,
      summary: "Observe settlement state"
    });
    await writeJson(path.join(actorDir, cycle.action_intent_ref), {
      schema: "action-intent/v1",
      actor_id: actorId,
      cycle_id: cycle.cycle_id,
      cycle_goal_id: cycle.cycle_goal_ref,
      kind: "use_primitive",
      primitive_id: "observe",
      args: {},
      why_this_action: "Audit fixture",
      expected_evidence: ["observation"],
      fallback_if_blocked: "wait"
    });
    await writeJson(path.join(actorDir, cycle.judgment_ref), {
      schema: "cycle-judgment/v1",
      actor_id: actorId,
      cycle_id: cycle.cycle_id,
      cycle_goal_id: cycle.cycle_goal_ref,
      outcome: "no_progress",
      what_happened: "Observed only",
      why_it_mattered_for_life_goal: "No verified gameplay progress",
      verifier_status: cycle.verifier_status,
      evidence_refs: cycle.evidence_refs,
      memory_writes: [],
      relationship_event_proposals: [],
      next_goal_context: []
    });
    await writeJson(path.join(actorDir, cycle.provider_input_refs[0]!), {
      schema: "provider-input-snapshot/v1",
      actor_id: actorId,
      input: {
        stage: "goal_mind",
        ActorSoul: {
          schema: "actor-soul/v1",
          actor_id: actorId,
          display_name: "NPC B",
          society_id: "test",
          role: "forager",
          life_goal: "Build a reliable settlement routine",
          public_responsibilities: [],
          private_drives: [],
          values: [],
          needs: { survival: [], social: [], learning: [] },
          boundaries: {
            forbidden_actions: [],
            requires_evidence_before_claiming: [],
            shared_resource_rules: []
          },
          action_skill_policy: {
            prefer_owned_action_skills: true,
            allow_primitive_fallback: true,
            allow_generated_action_skill_trials: false
          },
          memory_policy: {
            retrieve_layers: [],
            must_consider_recent_cycle_judgment: true
          },
          speech_style: "brief"
        },
        ActorLifeGoal: {
          schema: "actor-life-goal/v1",
          actor_id: actorId,
          goal_id: "life-goal",
          objective: "Build a reliable settlement routine",
          status: "active",
          source: "actor_soul",
          created_at: "2026-05-23T00:00:00.000Z",
          updated_at: "2026-05-23T00:00:00.000Z",
          cycle_count: 0,
          action_count: 0,
          evidence_refs: [],
          memory_refs: [],
          relationship_refs: []
        },
        previous_cycle_judgments: cycle.cycle_id === "cycle-0002" ? [{ cycle_id: "cycle-0001" }] : []
      }
    });
    await writeJson(path.join(actorDir, cycle.provider_output_refs[0]!), {
      schema: "provider-output-snapshot/v1",
      actor_id: actorId,
      raw_output_text: "{}"
    });
    await writeJson(path.join(actorDir, cycle.evidence_refs[0]!), {
      schema: "actor-evidence/v1",
      actor_id: actorId,
      evidence_id: cycle.evidence_refs[0]
    });
  }
}

test("rejects social-cycle reports with missing actor artifact refs", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-audit-missing-refs");
  const report = baseReport();
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeJson(path.join(workspaceRoot, actorId, "actor.json"), {
    schema: "actor-workspace/v1",
    actor_id: actorId
  });
  await writeJson(reportPath, report);

  const errors = await auditSocialCycleReport(reportPath);

  assert.ok(errors.some((error) => error.includes("Missing cycle goal artifact")));
  assert.ok(errors.some((error) => error.includes("Missing action intent artifact")));
  assert.ok(errors.some((error) => error.includes("Missing provider input artifact")));
  assert.ok(errors.some((error) => error.includes("Missing provider output artifact")));
  assert.ok(errors.some((error) => error.includes("Missing judgment artifact")));
  assert.ok(errors.some((error) => error.includes("Missing evidence artifact")));
});

test("rejects synthetic passed reports without verifier-backed gameplay progress", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-audit-no-progress-pass");
  const report = baseReport();
  report.runtime_status = "passed";
  report.agency_status.gameplay_progress_verified = false;
  report.cycles = report.cycles.map((cycle) => ({
    ...cycle,
    verifier_status: "not_applicable"
  }));
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeActorWorkspaceFixture(workspaceRoot, report);
  await writeJson(reportPath, report);

  const errors = await auditSocialCycleReport(reportPath);

  assert.ok(
    errors.some((error) =>
      error.includes("runtime_status is passed without verifier-backed gameplay progress")
    )
  );
});

test("rejects satisfied settlement checklist items without evidence refs", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-audit-settlement-evidence");
  const report = baseReport();
  report.runtime_status = "passed";
  report.agency_status.gameplay_progress_verified = true;
  report.cycles = report.cycles.map((cycle, index) => ({
    ...cycle,
    verifier_status: index === 0 ? "passed" : "not_applicable"
  }));
  report.settlement_checklist = {
    schema: "settlement-checklist/v1",
    satisfied_count: 1,
    pending_count: 0,
    blocked_count: 0,
    items: [
      {
        id: "crafting_table_known_or_placed",
        status: "satisfied",
        evidence_refs: [],
        reason: "fixture forgot evidence"
      }
    ]
  };
  report.settlement_state = {
    schema: "settlement-state/v1",
    actor_id: actorId,
    updated_at: "2026-05-24T00:00:00.000Z",
    inventory_counts: {},
    shared_storage: { status: "unknown", items: [], evidence_refs: [] },
    known_positions: {},
    blocker_histogram: [],
    available_action_skill_ids: [],
    missing_primitive_blockers: [],
    progress: {
      has_crafting_table: true,
      has_verified_shelter: false,
      has_shared_storage_contribution: false,
      has_judgment_or_memory: true,
      has_blocker_summary: false
    },
    checklist: report.settlement_checklist
  };
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeActorWorkspaceFixture(workspaceRoot, report);
  await writeJson(reportPath, report);

  const errors = await auditSocialCycleReport(reportPath);

  assert.ok(
    errors.some((error) =>
      error.includes("Settlement checklist item crafting_table_known_or_placed is satisfied without evidence refs")
    )
  );
});

test("rejects move_to intents with empty or invalid structured args", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-audit-move-empty-args");
  const report = baseReport();
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeActorWorkspaceFixture(workspaceRoot, report);
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[0]!.action_intent_ref), {
    schema: "action-intent/v1",
    actor_id: actorId,
    cycle_id: "cycle-0001",
    cycle_goal_id: report.cycles[0]!.cycle_goal_ref,
    kind: "use_primitive",
    primitive_id: "move_to",
    args: {},
    why_this_action: "Move using hidden defaults",
    expected_evidence: ["position_delta"],
    fallback_if_blocked: "remember"
  });
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[1]!.action_intent_ref), {
    schema: "action-intent/v1",
    actor_id: actorId,
    cycle_id: "cycle-0002",
    cycle_goal_id: report.cycles[1]!.cycle_goal_ref,
    kind: "use_primitive",
    primitive_id: "move_to",
    args: { target: "npc_a" },
    why_this_action: "Move using prose-era target args",
    expected_evidence: ["position_delta"],
    fallback_if_blocked: "remember"
  });
  await writeJson(reportPath, report);

  const errors = await auditSocialCycleReport(reportPath);

  assert.ok(
    errors.some((error) =>
      error.includes("move_to intent") && error.includes("has empty args")
    )
  );
  assert.ok(
    errors.some((error) =>
      error.includes("move_to intent") && error.includes("has invalid physical args")
    )
  );
});

test("rejects physical absence claims without scan-backed evidence when evidence refs are inspectable", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-audit-claim-without-scan");
  const report = baseReport();
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeActorWorkspaceFixture(workspaceRoot, report);
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[0]!.judgment_ref), {
    schema: "cycle-judgment/v1",
    actor_id: actorId,
    cycle_id: "cycle-0001",
    cycle_goal_id: report.cycles[0]!.cycle_goal_ref,
    outcome: "blocked",
    what_happened: "Could not find a matching target nearby.",
    why_it_mattered_for_life_goal: "An absence claim needs scan evidence before changing direction.",
    verifier_status: "not_applicable",
    evidence_refs: report.cycles[0]!.evidence_refs,
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: []
  });
  await writeJson(reportPath, report);

  const errors = await auditSocialCycleReport(reportPath);

  assert.ok(
    errors.some((error) =>
      error.includes("physical absence") && error.includes("without world-state scan evidence")
    )
  );
});

test("rejects physical absence claims backed only by non-exhaustive scan evidence", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-audit-absence-non-exhaustive");
  const report = baseReport();
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeActorWorkspaceFixture(workspaceRoot, report);
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[0]!.judgment_ref), {
    schema: "cycle-judgment/v1",
    actor_id: actorId,
    cycle_id: "cycle-0001",
    cycle_goal_id: report.cycles[0]!.cycle_goal_ref,
    outcome: "blocked",
    what_happened: "No matching target block was found nearby.",
    why_it_mattered_for_life_goal: "Absence claims require exhaustive evidence.",
    verifier_status: "not_applicable",
    evidence_refs: report.cycles[0]!.evidence_refs,
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: []
  });
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[0]!.evidence_refs[0]!), {
    schema: "actor-evidence/v1",
    actor_id: actorId,
    evidence_id: report.cycles[0]!.evidence_refs[0],
    category: "tool_attempt",
    tool_attempt: {
      tool: "observe",
      args: {},
      result: {
        worldStateSummary: {
          schema: "world-state-summary/v1",
          scan_id: "scan-absence",
          center: { x: 0, y: 64, z: 0 },
          radius: 32,
          vertical_range: { min_y: 48, max_y: 80, center_y: 64 },
          loaded_coverage: {
            method: "blockAt-sampled-columns",
            scope: "sampled_columns_only",
            sample_stride: 8,
            sampled_columns: 4,
            loaded_columns: 4,
            unknown_columns: 0,
            exhaustive: false,
            sample_had_unknown_columns: false,
            absence_claims_exhaustive: false,
            incomplete: true
          },
          block_observations: {
            total_verified: 0,
            truncated: false,
            by_name: [],
            nearest: []
          },
          limitations: ["sampled scan fixture"]
        }
      }
    }
  });
  await writeJson(reportPath, report);

  const errors = await auditSocialCycleReport(reportPath);

  assert.ok(
    errors.some((error) =>
      error.includes("physical absence claim") && error.includes("non-exhaustive")
    )
  );
});

test("review summary surfaces world scan counts and movement contract status", async () => {
  const workspaceRoot = await makeWorkspaceRoot("social-review-scan-summary");
  const report = baseReport();
  report.actor_workspace_root_dir = workspaceRoot;
  report.runtime_retry_constraints = [
    {
      schema: "runtime-retry-constraint/v1",
      constraint_id: "retry-primitive-move_to-test",
      actor_id: actorId,
      action_kind: "use_primitive",
      target: { kind: "primitive", id: "move_to", primitive_id: "move_to" },
      args_fingerprint: "abc123",
      args_normalized: { direction: "east", distance: 6 },
      blocker_key: "blocked_pathfinder_failed",
      blocker_status: "blocked",
      blocker_reason: "pathfinder failed",
      repeat_count: 2,
      attempt_refs: ["cycle-0001-action-01", "cycle-0002-action-01"],
      evidence_refs: ["evidence/cycle-0001-observe.json"],
      rule: {
        same_target_and_args_blocked: true,
        provider_must_pivot_or_repair_args: true,
        runtime_blocks_before_mineflayer: true
      }
    }
  ];
  report.cycles[0]!.action_attempts = [
    {
      attempt_id: "cycle-0001-action-01",
      action_index: 0,
      turn_id: "cycle-0001-action-01",
      action_intent_ref: report.cycles[0]!.action_intent_ref,
      provider_input_refs: [],
      provider_output_refs: [],
      evidence_refs: [report.cycles[0]!.evidence_refs[0]!],
      judgment_ref: report.cycles[0]!.judgment_ref,
      verifier_status: "not_applicable",
      executed_tools: [],
      tool_statuses: [],
      runtime_status: "blocked",
      retry_constraint_blocked: true
    }
  ];
  const reportPath = path.join(workspaceRoot, "report.json");
  await writeActorWorkspaceFixture(workspaceRoot, report);
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[0]!.action_intent_ref), {
    schema: "action-intent/v1",
    actor_id: actorId,
    cycle_id: "cycle-0001",
    cycle_goal_id: report.cycles[0]!.cycle_goal_ref,
    kind: "use_primitive",
    primitive_id: "move_to",
    args: { direction: "east", distance: 6 },
    why_this_action: "Move toward an explicitly observed waypoint",
    expected_evidence: ["position_delta"],
    fallback_if_blocked: "remember"
  });
  await writeJson(path.join(workspaceRoot, actorId, report.cycles[0]!.evidence_refs[0]!), {
    schema: "actor-evidence/v1",
    actor_id: actorId,
    evidence_id: report.cycles[0]!.evidence_refs[0],
    category: "tool_attempt",
    tool_attempt: {
      tool: "observe",
      args: {},
      result: {
        worldStateSummary: {
          schema: "world-state-summary/v1",
          scan_id: "scan-1",
          center: { x: 0, y: 64, z: 0 },
          radius: 32,
          vertical_range: { min_y: 48, max_y: 80, center_y: 64 },
          block_observations: {
            total_verified: 1,
            by_name: [{ name: "minecraft_block", count: 1 }],
            nearest: [{ name: "minecraft_block", distance: 5, position: { x: 5, y: 64, z: 0 } }],
            truncated: false
          },
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
          }
        },
        nearbyBlocks: [{ name: "minecraft_block", distance: 5 }]
      }
    }
  });
  await writeJson(reportPath, report);

  const summary = await buildSocialCycleReviewSummary(reportPath);
  const row = summary.rows[0]!;

  assert.equal(row.movement_contract_status, "valid");
  assert.equal(row.world_scan_ref_count, 1);
  assert.deepEqual(row.world_scan_refs, [report.cycles[0]!.evidence_refs[0]]);
  assert.equal(row.world_scan_counts.world_state_summary, 1);
  assert.equal(row.world_scan_counts.block_observations, 1);
  assert.equal(row.world_scan_counts.nearest_examples, 1);
  assert.equal(row.world_scan_counts.non_exhaustive_coverage, 1);
  assert.equal(row.world_scan_counts.nearby_blocks, undefined);
  assert.equal(row.retry_constraint_blocked, true);
  assert.equal(summary.runtime_retry_constraint_count, 1);
  assert.equal(summary.retry_constraint_blocked_attempts, 1);
});
