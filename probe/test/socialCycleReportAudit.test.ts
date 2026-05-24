import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { auditSocialCycleReport } from "../src/runtime/goals/socialCycleReportAuditCli.js";
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
      next_goal_pressure: []
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
