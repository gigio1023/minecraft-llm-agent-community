import assert from "node:assert/strict";
import test from "node:test";

import { listSeedSkills, getSeedSkill, listCoreSkillIds, listSocialSkillIds, listHostileSkillIds } from "../src/gameplay/seedSkills/registry.js";

test("seed skill registry provides 20 skills covering core, social, and hostile categories", () => {
  const all = listSeedSkills();
  assert.equal(all.length, 20);

  const coreIds = listCoreSkillIds();
  assert.equal(coreIds.length, 12);

  const socialIds = listSocialSkillIds();
  assert.equal(socialIds.length, 4);

  const hostileIds = listHostileSkillIds();
  assert.equal(hostileIds.length, 4);

  // Every skill has required fields
  for (const skill of all) {
    assert.ok(skill.id.length > 0, "skill must have a non-empty id");
    assert.ok(skill.summary.length > 0, "skill must have a non-empty summary");
    assert.ok(skill.intentKinds.length > 0, "skill must map to at least one intent kind");
    assert.ok(skill.primitiveIds.length > 0, "skill must use at least one runtime primitive");
  }
});

test("seed skill registry retrieves specific skills by id", () => {
  const skill = getSeedSkill("collectLogs");
  assert.equal(skill.id, "collectLogs");
  assert.ok(skill.validRoles.includes("gatherer"));
  assert.ok(skill.intentKinds.includes("bootstrap_progress"));

  assert.throws(() => getSeedSkill("nonexistent_skill" as any), /Unknown seed skill/);
});
