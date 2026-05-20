import assert from "node:assert/strict";
import test from "node:test";

import type { ActionSkillRecipe } from "../src/skills/recipes/types.js";
import { validateActionSkillRecipe } from "../src/skills/recipes/validator.js";

const validCollectLogsRecipe: ActionSkillRecipe = {
  recipe_id: "recipe_collect_logs_v1",
  skill_id: "collectLogs",
  owner_actor_id: "npc_b",
  max_duration_ms: 10_000,
  steps: [
    {
      primitive: "observe",
      args: {},
      timeout_ms: 1_000,
      expected_evidence: ["nearby_blocks"]
    },
    {
      primitive: "collect_logs",
      args: {},
      timeout_ms: 6_000,
      expected_evidence: ["inventory_delta", "block_delta"]
    }
  ],
  verifier: {
    kind: "inventory_delta",
    target: "oak_log",
    minimum_delta: 1
  }
};

test("validates bounded action skill recipes over implemented primitives", () => {
  const result = validateActionSkillRecipe(validCollectLogsRecipe, {
    actorRole: "gatherer",
    activeSkillIds: []
  });

  assert.deepEqual(result, { ok: true, errors: [] });
});

test("rejects unknown primitives before a candidate can be trialed", () => {
  const result = validateActionSkillRecipe(
    {
      ...validCollectLogsRecipe,
      steps: [
        ...validCollectLogsRecipe.steps,
        {
          primitive: "mine_block",
          args: {},
          timeout_ms: 1_000,
          expected_evidence: ["block_delta"]
        }
      ]
    } as unknown as ActionSkillRecipe,
    { actorRole: "gatherer", activeSkillIds: [] }
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Unknown runtime primitive: mine_block/);
});

test("rejects primitives outside the actor role contract", () => {
  const result = validateActionSkillRecipe(validCollectLogsRecipe, {
    actorRole: "quartermaster",
    activeSkillIds: []
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Role quartermaster cannot use primitive collect_logs/);
});

test("rejects missing timeouts and success-by-text verifiers", () => {
  const result = validateActionSkillRecipe(
    {
      ...validCollectLogsRecipe,
      steps: [{ ...validCollectLogsRecipe.steps[0], timeout_ms: 0 }],
      verifier: {
        kind: "provider_text",
        target: "provider said done"
      } as unknown as ActionSkillRecipe["verifier"]
    },
    { actorRole: "gatherer", activeSkillIds: [] }
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /step 0 must include a positive timeout_ms/);
  assert.match(result.errors.join("\n"), /verifier kind provider_text cannot prove Minecraft progress/);
});

test("rejects duplicate active skills without an explicit supersession note", () => {
  const result = validateActionSkillRecipe(validCollectLogsRecipe, {
    actorRole: "gatherer",
    activeSkillIds: ["collectLogs"]
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /duplicates active action skill collectLogs/);
});
