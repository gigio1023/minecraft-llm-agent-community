/** Regression coverage for runtime artifact persistence and references. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildFakeProgressRejectionEvidence,
  writeActorEvidenceRecord
} from "../src/runtime/evidence/actorEvidence.js";
import { writeProviderInputSnapshot } from "../src/provider/providerInputStore.js";
import { buildActorProviderContext } from "../src/provider/actorProviderContext.js";
import { writeReviewerOutput } from "../src/reviewer/reviewerStore.js";
import { writeActionSkillProposal } from "../src/skills/proposals/proposalStore.js";
import {
  applyRelationshipEvent,
  createDefaultRelationshipEdge,
  createRelationshipEventRef
} from "../src/npc/relationships/relationshipLedger.js";
import { writeRelationshipEdge } from "../src/npc/relationships/relationshipStore.js";
import { writeActorActionSkillRecord, writeJson } from "../src/runtime/actorWorkspaceStore.js";
import { testActionSkillRecord } from "./helpers/actionSkillRecords.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("writes actor-scoped fake-progress evidence with concrete missing deltas", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `runtime-artifacts-${process.pid}-${Date.now()}`
  );

  try {
    const evidence = buildFakeProgressRejectionEvidence({
      actor_id: "npc_b",
      turn_id: "turn-0001",
      target: "oak_log",
      pre_position: { x: 0, y: 64, z: 0 },
      post_position: { x: 8, y: 64, z: 8 },
      tool_attempt: { tool: "collect_logs", status: "pathing_started" },
      verifier_reason:
        "collect_4_logs saw no relevant inventory increase and no nearby log-block decrease.",
      missing_delta: {
        kind: "inventory_delta",
        item: "oak_log",
        before: 0,
        after: 0
      },
      created_at: "2026-05-20T00:00:00.000Z"
    });
    const filePath = await writeActorEvidenceRecord(rootDir, evidence);
    const stored = JSON.parse(await fs.readFile(filePath, "utf8"));

    assert.equal(stored.schema, "actor-evidence/v1");
    assert.equal(stored.category, "fake_progress_rejection");
    assert.equal(stored.actor_id, "npc_b");
    assert.equal(stored.target, "oak_log");
    assert.deepEqual(stored.missing_delta, {
      kind: "inventory_delta",
      item: "oak_log",
      before: 0,
      after: 0
    });
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("provider input snapshots reject credential-shaped payloads", async () => {
  await assert.rejects(
    () =>
      writeProviderInputSnapshot("/tmp/unused", {
        schema: "provider-input-snapshot/v1",
        snapshot_id: "turn-0001",
        actor_id: "npc_b",
        turn_id: "turn-0001",
        provider_id: "openai-codex",
        model: "gpt-5.4-mini",
        created_at: "2026-05-20T00:00:00.000Z",
        input: {
          authorization: "Bearer secret",
          prompt: "collect logs"
        }
      }),
    /credential-like key authorization/
  );
});

test("writes provider snapshots and reviewer outputs into actor workspace paths", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `provider-reviewer-${process.pid}-${Date.now()}`
  );

  try {
    const snapshotPath = await writeProviderInputSnapshot(rootDir, {
      schema: "provider-input-snapshot/v1",
      snapshot_id: "turn-0003",
      actor_id: "npc_b",
      turn_id: "turn-0003",
      provider_id: "openai-codex",
      model: "gpt-5.4-mini",
      created_at: "2026-05-20T00:00:00.000Z",
      input: {
        prompt: "collect logs",
        allowed_tools: ["observe", "collect_logs"]
      },
      active_action_skills: ["collectLogs"]
    });
    const reviewPath = await writeReviewerOutput(rootDir, {
      schema: "actor-review/v1",
      review_id: "review-0001",
      actor_id: "npc_b",
      created_at: "2026-05-20T00:00:00.000Z",
      input_refs: [snapshotPath],
      findings: [
        {
          severity: "p1",
          title: "fake progress",
          body: "The actor moved away from the target without log inventory evidence."
        }
      ],
      candidate_proposals: [],
      active_mutation: "forbidden"
    });

    assert.equal(
      path.relative(rootDir, snapshotPath),
      path.join("npc_b", "provider-inputs", "turn-0003.json")
    );
    assert.equal(
      path.relative(rootDir, reviewPath),
      path.join("npc_b", "reviews", "review-0001.json")
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("builds provider-facing actor context from workspace artifacts", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `actor-provider-context-${process.pid}-${Date.now()}`
  );

  try {
    await writeJson(path.join(rootDir, "npc_b", "actor.json"), {
      schema: "actor-workspace/v1",
      actor_id: "npc_b",
      username: "npc_b",
      role_id: "gatherer",
      actor_profile: {
        actor_id: "npc_b",
        gameplay_role: "gatherer",
        display_name: "Jun",
        social_archetype: "distracted gatherer",
        public_responsibility: "collect logs and deposit usable materials",
        private_goal: "finish the current resource task before taking on social coordination",
        learning_bias: "learns from task results and direct world observations",
        risk_posture: "moderate risk; moves quickly but pauses when a task is blocked",
        speech_style: "quick and slightly distracted"
      }
    });
    const activeSkill = testActionSkillRecord(
      "collectLogs",
      ["observe", "collect_logs", "wait"],
      "npc_b"
    );
    await writeActorActionSkillRecord(rootDir, activeSkill);
    const evidencePath = await writeActorEvidenceRecord(rootDir, {
      schema: "actor-evidence/v1",
      evidence_id: "fake-progress-turn-0001-collect_logs",
      actor_id: "npc_b",
      category: "fake_progress_rejection",
      created_at: "2026-05-20T00:00:00.000Z",
      turn_id: "turn-0001",
      target: "oak_log",
      verifier_reason: "no inventory delta"
    });
    await writeActionSkillProposal(rootDir, {
      schema: "action-skill-proposal/v1",
      proposal_id: "proposal-repair-collect-logs",
      skill_id: "collectLogsRepair",
      owner_actor_id: "npc_b",
      source_kind: "derived",
      status: "draft",
      task_intent: "repair collect logs",
      evidence_refs: [evidencePath],
      preconditions: ["nearby log block is visible"],
      required_primitives: ["observe", "collect_logs"],
      proposed_recipe_id: "recipe-repair-collect-logs",
      success_verifier: "inventory_delta:oak_log>=1",
      known_failure_modes: ["fake_progress"],
      created_at: "2026-05-20T00:00:01.000Z",
      updated_at: "2026-05-20T00:00:01.000Z"
    });
    await writeRelationshipEdge(
      rootDir,
      applyRelationshipEvent(
        createDefaultRelationshipEdge("npc_a", "npc_b"),
        createRelationshipEventRef({
          id: "resource-delivered-turn-0001",
          kind: "resource_delivered",
          summary: "npc_b delivered logs",
          evidence_refs: [evidencePath],
          turn: 1
        })
      )
    );

    const context = await buildActorProviderContext({
      actorWorkspaceRootDir: rootDir,
      actorId: "npc_b",
      activeActionSkills: [activeSkill],
      memory: ["saw oak logs west of spawn"]
    });

    assert.equal(context.schema, "actor-provider-context/v1");
    assert.deepEqual(context.actor, { actor_id: "npc_b", role_id: "gatherer" });
    assert.equal((context.actor_profile as { display_name: string }).display_name, "Jun");
    assert.equal(
      (
        context.incoming_relationships as Array<{
          from_actor_id: string;
          trust: string;
          trust_score: number;
        }>
      )[0]?.trust,
      "reliable"
    );
    assert.equal(
      (
        context.incoming_relationships as Array<{
          from_actor_id: string;
          trust: string;
          trust_score: number;
        }>
      )[0]?.trust_score,
      3
    );
    assert.equal(
      (context.active_action_skills as Array<{ skill_id: string }>)[0]?.skill_id,
      "collectLogs"
    );
    assert.equal(
      (context.candidate_action_skills as Array<{ proposal_id: string }>)[0]?.proposal_id,
      "proposal-repair-collect-logs"
    );
    assert.equal(
      (context.recent_evidence as Array<{ category: string }>)[0]?.category,
      "fake_progress_rejection"
    );
    assert.deepEqual(context.memory, ["saw oak logs west of spawn"]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
