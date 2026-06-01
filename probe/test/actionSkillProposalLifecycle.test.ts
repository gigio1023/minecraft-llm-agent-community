import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { writeActionSkillProposal } from "../src/skills/proposals/proposalStore.js";
import { transitionActionSkillStatus } from "../src/skills/lifecycle/status.js";
import { promoteActionSkillAfterTrial } from "../src/skills/lifecycle/promotion.js";
import { retireActionSkill } from "../src/skills/lifecycle/retirement.js";
import { runBoundedActionSkillRecipeTrial } from "../src/skills/recipes/trialRunner.js";
import { listActiveActorActionSkillRecords } from "../src/runtime/actorWorkspace.js";
import { writeActorActionSkillRecord } from "../src/runtime/actorWorkspaceStore.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("stores candidate action skill proposals under the owning actor workspace", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `action-skill-proposals-${process.pid}-${Date.now()}`
  );

  try {
    const proposalPath = await writeActionSkillProposal(rootDir, {
      schema: "action-skill-proposal/v1",
      proposal_id: "proposal-local-log-targeting-v1",
      skill_id: "collectLogsLocalTargeting",
      owner_actor_id: "npc_b",
      source_kind: "derived",
      status: "draft",
      task_intent: "Gather logs without walking away from the selected tree.",
      evidence_refs: ["data/actors/npc_b/evidence/fake-progress-turn-0001.json"],
      preconditions: ["nearby log block is visible"],
      required_primitives: ["observe", "collect_logs"],
      proposed_recipe_id: "recipe-local-log-targeting-v1",
      success_verifier: "inventory_delta:oak_log>=1",
      known_failure_modes: ["pathing_started_without_inventory_delta"],
      created_at: "2026-05-20T00:00:00.000Z",
      updated_at: "2026-05-20T00:00:00.000Z"
    });

    assert.equal(
      path.relative(rootDir, proposalPath),
      path.join(
        "npc_b",
        "action-skills",
        "candidates",
        "proposal-local-log-targeting-v1.json"
      )
    );

    const stored = JSON.parse(await fs.readFile(proposalPath, "utf8"));
    assert.equal(stored.status, "draft");
    assert.deepEqual(stored.required_primitives, ["observe", "collect_logs"]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("allows only explicit action skill lifecycle transitions", () => {
  assert.equal(transitionActionSkillStatus("draft", "candidate").ok, true);
  assert.equal(transitionActionSkillStatus("candidate", "active").ok, true);
  assert.equal(transitionActionSkillStatus("candidate", "rejected").ok, true);
  assert.equal(transitionActionSkillStatus("active", "retired").ok, true);
  assert.equal(transitionActionSkillStatus("active", "superseded").ok, true);

  assert.deepEqual(transitionActionSkillStatus("draft", "active"), {
    ok: false,
    reason: "Cannot transition action skill from draft to active"
  });
});

test("promotes a validated candidate after trial evidence and supersedes the old active record", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `action-skill-promotion-${process.pid}-${Date.now()}`
  );

  try {
    const activeRecord = testActionSkillRecord(
      "collectLogs",
      ["observe", "collect_logs", "wait"],
      "npc_b"
    );
    await writeActorActionSkillRecord(rootDir, activeRecord);

    const result = await promoteActionSkillAfterTrial({
      actorWorkspaceRootDir: rootDir,
      actorRole: "gatherer",
      activeActionSkills: [activeRecord],
      proposal: {
        schema: "action-skill-proposal/v1",
        proposal_id: "proposal-collect-logs-v2",
        skill_id: "collectLogs",
        owner_actor_id: "npc_b",
        source_kind: "derived",
        status: "draft",
        task_intent: "Repair log collection so the actor stays near the selected tree.",
        evidence_refs: ["evidence/fake-progress-turn-0001.json"],
        preconditions: ["nearby log block is visible"],
        required_primitives: ["observe", "collect_logs", "wait"],
        proposed_recipe_id: "recipe-collect-logs-v2",
        success_verifier: "inventory_delta:oak_log>=1",
        known_failure_modes: ["walked_away_from_log_target"],
        created_at: "2026-05-20T00:00:00.000Z",
        updated_at: "2026-05-20T00:00:00.000Z"
      },
      recipe: {
        recipe_id: "recipe-collect-logs-v2",
        skill_id: "collectLogs",
        owner_actor_id: "npc_b",
        max_duration_ms: 10_000,
        supersession_note: "replace fake-progress-prone collectLogs",
        steps: [
          {
            primitive: "observe",
            args: {},
            timeout_ms: 1_000,
            expected_evidence: ["nearby_blocks"]
          },
          {
            primitive: "collect_logs",
            args: { targetCount: 4 },
            guard: "nearby log block is visible",
            timeout_ms: 4_000,
            expected_evidence: ["inventory_delta"]
          }
        ],
        verifier: {
          kind: "inventory_delta",
          target: "oak_log",
          minimum_delta: 1
        }
      },
      trial: {
        status: "passed",
        evidence_refs: ["evidence/tool-attempt-turn-0002-collect_logs.json"],
        verifier_reason: "log inventory delta was observed during bounded trial"
      },
      created_at: "2026-05-20T00:01:00.000Z"
    });

    assert.equal(
      path.relative(rootDir, result.activePath),
      path.join("npc_b", "action-skills", "active", "collectLogs.json")
    );
    assert.equal(
      path.relative(rootDir, result.trialEvidencePath),
      path.join("npc_b", "evidence", "recipe-trial-proposal-collect-logs-v2.json")
    );

    const promoted = JSON.parse(await fs.readFile(result.activePath, "utf8"));
    assert.equal(promoted.status, "active");
    assert.deepEqual(promoted.required_primitives, ["observe", "collect_logs"]);
    assert.ok(
      promoted.evidence_refs.some((ref: string) =>
        ref.includes("recipe-trial-proposal-collect-logs-v2.json")
      )
    );
    const indexedActive = await listActiveActorActionSkillRecords(rootDir, "npc_b");
    assert.deepEqual(indexedActive.map((record) => record.skill_id), ["collectLogs"]);

    const superseded = JSON.parse(
      await fs.readFile(
        path.join(rootDir, "npc_b", "action-skills", "retired", "collectLogs.json"),
        "utf8"
      )
    );
    assert.equal(superseded.status, "superseded");
    assert.equal(
      superseded.supersession.reason,
      "replace fake-progress-prone collectLogs"
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("retires an active action skill with evidence refs and removes the active record", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `action-skill-retirement-${process.pid}-${Date.now()}`
  );

  try {
    const activeRecord = testActionSkillRecord(
      "collectLogs",
      ["observe", "collect_logs", "wait"],
      "npc_b"
    );
    const activePath = await writeActorActionSkillRecord(rootDir, activeRecord);
    const retiredPath = await retireActionSkill({
      actorWorkspaceRootDir: rootDir,
      record: activeRecord,
      reason: "repeated fake progress",
      evidence_refs: ["evidence/fake-progress-turn-0004.json"],
      retired_at: "2026-05-20T00:02:00.000Z"
    });

    await assert.rejects(() => fs.access(activePath));
    assert.equal(
      path.relative(rootDir, retiredPath),
      path.join("npc_b", "action-skills", "retired", "collectLogs.json")
    );
    const retired = JSON.parse(await fs.readFile(retiredPath, "utf8"));
    assert.equal(retired.status, "retired");
    assert.ok(retired.known_failure_modes.includes("retired:repeated fake progress"));
    assert.ok(retired.evidence_refs.includes("evidence/fake-progress-turn-0004.json"));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("runs candidate recipe steps through bounded primitive trial execution", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `action-skill-trial-runner-${process.pid}-${Date.now()}`
  );

  try {
    const proposal = {
      schema: "action-skill-proposal/v1" as const,
      proposal_id: "proposal-trial-collect-logs",
      skill_id: "collectLogsTrial",
      owner_actor_id: "npc_b",
      source_kind: "derived" as const,
      status: "draft" as const,
      task_intent: "trial collect logs",
      evidence_refs: [],
      preconditions: [],
      required_primitives: ["observe", "collect_logs"],
      proposed_recipe_id: "recipe-trial-collect-logs",
      success_verifier: "inventory_delta:oak_log>=1",
      known_failure_modes: [],
      created_at: "2026-05-20T00:00:00.000Z",
      updated_at: "2026-05-20T00:00:00.000Z"
    };
    const recipe = {
      recipe_id: "recipe-trial-collect-logs",
      skill_id: "collectLogsTrial",
      owner_actor_id: "npc_b",
      max_duration_ms: 5_000,
      steps: [
        {
          primitive: "observe" as const,
          args: {},
          timeout_ms: 1_000,
          expected_evidence: ["nearby_blocks"]
        },
        {
          primitive: "collect_logs" as const,
          args: { targetCount: 1 },
          timeout_ms: 1_000,
          expected_evidence: ["inventory_delta"]
        }
      ],
      verifier: {
        kind: "inventory_delta" as const,
        target: "oak_log",
        minimum_delta: 1
      }
    };
    const executed: string[] = [];
    const result = await runBoundedActionSkillRecipeTrial({
      actorWorkspaceRootDir: rootDir,
      proposal,
      recipe,
      async executePrimitive(step) {
        executed.push(step.primitive);
        return { tool: step.primitive, ok: true, status: "done" };
      },
      verifyTrial(steps) {
        return {
          status: steps.length === 2 ? "passed" : "failed",
          evidence_refs: ["evidence/tool-attempt-turn-0001-collect_logs.json"],
          verifier_reason: "trial observed required step sequence"
        };
      },
      created_at: "2026-05-20T00:03:00.000Z"
    });

    assert.deepEqual(executed, ["observe", "collect_logs"]);
    assert.equal(result.status, "passed");
    assert.equal(result.stepResults.length, 2);
    const trialEvidence = JSON.parse(await fs.readFile(result.trialEvidencePath, "utf8"));
    assert.equal(trialEvidence.category, "recipe_trial");
    assert.equal(trialEvidence.data.status, "passed");
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
