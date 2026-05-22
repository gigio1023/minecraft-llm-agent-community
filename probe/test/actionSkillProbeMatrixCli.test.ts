import assert from "node:assert/strict";
import test from "node:test";

import { buildProbeMatrixCases } from "../src/actionSkillProbeMatrixCli.js";
import { listImplementedSeedActionSkills } from "../src/gameplay/seedSkills/registry.js";

test("action skill probe matrix builds one case for every implemented seed action skill", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    maxActions: 8
  });
  const implementedIds = listImplementedSeedActionSkills().map((skill) => skill.id);

  assert.deepEqual(cases.map((entry) => entry.skillId), implementedIds);
  assert.ok(cases.every((entry) => entry.actorId === "npc_b"));
  assert.ok(cases.every((entry) => entry.maxActions === 8));
  assert.ok(cases.every((entry) => entry.roleId.length > 0));
});

test("action skill probe matrix can narrow to selected implemented skills", () => {
  const cases = buildProbeMatrixCases({
    actorId: "npc_b",
    skillIds: ["collectLogs", "craftCraftingTable"],
    maxActions: 5
  });

  assert.deepEqual(cases.map((entry) => entry.skillId), ["collectLogs", "craftCraftingTable"]);
  assert.deepEqual(cases.map((entry) => entry.roleId), ["gatherer", "crafter"]);
});

test("action skill probe matrix rejects planned or unknown skill ids", () => {
  assert.throws(
    () =>
      buildProbeMatrixCases({
        actorId: "npc_b",
        skillIds: ["mineCobblestone"],
        maxActions: 5
      }),
    /Unknown or non-implemented action skill/
  );
});
