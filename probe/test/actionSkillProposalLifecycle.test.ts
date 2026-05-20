import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { writeActionSkillProposal } from "../src/skills/proposals/proposalStore.js";
import { transitionActionSkillStatus } from "../src/skills/lifecycle/status.js";

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
      success_verifier: "inventory_delta:oak_log>=1 or block_delta:log_removed",
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
