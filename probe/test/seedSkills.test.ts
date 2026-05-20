import assert from "node:assert/strict";
import test from "node:test";

import {
  listSeedActionSkills,
  getSeedActionSkill,
  listCoreActionSkillIds,
  listSocialActionSkillIds,
  listHostileActionSkillIds,
  listSurvivalUtilityActionSkillIds,
  listImplementedSeedActionSkills,
  listPlannedSeedActionSkills
} from "../src/gameplay/seedSkills/registry.js";

test("seed action skill registry provides roadmap action skills covering core, survival utility, social, and hostile categories", () => {
  const all = listSeedActionSkills();
  assert.equal(all.length, 28);

  const coreIds = listCoreActionSkillIds();
  assert.equal(coreIds.length, 12);

  const survivalUtilityIds = listSurvivalUtilityActionSkillIds();
  assert.equal(survivalUtilityIds.length, 8);

  const socialIds = listSocialActionSkillIds();
  assert.equal(socialIds.length, 4);

  const hostileIds = listHostileActionSkillIds();
  assert.equal(hostileIds.length, 4);

  // Every action skill has required fields
  for (const actionSkill of all) {
    assert.ok(actionSkill.id.length > 0, "action skill must have a non-empty id");
    assert.ok(actionSkill.summary.length > 0, "action skill must have a non-empty summary");
    assert.ok(actionSkill.implementationNotes.length > 0, "action skill must explain its implementation status");
    assert.ok(actionSkill.intentKinds.length > 0, "action skill must map to at least one intent kind");
    assert.ok(actionSkill.primitiveIds.length > 0, "action skill must use at least one runtime primitive");
  }
});

test("seed action skill registry retrieves specific action skills by id", () => {
  const actionSkill = getSeedActionSkill("collectLogs");
  assert.equal(actionSkill.id, "collectLogs");
  assert.ok(actionSkill.validRoles.includes("gatherer"));
  assert.ok(actionSkill.intentKinds.includes("bootstrap_progress"));

  assert.throws(() => getSeedActionSkill("nonexistent_skill" as any), /Unknown seed action skill/);
});

test("seed action skill registry separates implemented action skills from planned Minecraft roadmap action skills", () => {
  const implementedIds = listImplementedSeedActionSkills().map((actionSkill) => actionSkill.id);
  const plannedIds = listPlannedSeedActionSkills().map((actionSkill) => actionSkill.id);

  assert.ok(implementedIds.includes("collectLogs"));
  assert.ok(implementedIds.includes("craftCraftingTable"));
  assert.ok(plannedIds.includes("mineCobblestone"));
  assert.ok(plannedIds.includes("mineCoal"));
  assert.ok(plannedIds.includes("smeltRawIron"));
  assert.ok(plannedIds.includes("eatFoodWhenHungry"));
  assert.ok(plannedIds.includes("setupSharedStash"));

  const mineCobblestone = getSeedActionSkill("mineCobblestone");
  assert.equal(mineCobblestone.runtimeStatus, "planned");
  assert.deepEqual(mineCobblestone.missingPrimitives, ["mine_block"]);
  assert.ok(!mineCobblestone.primitiveIds.includes("collect_logs"));
});

test("reference-derived initial abilities stay planned until their primitives exist", () => {
  const plannedRuntimeSkills = [
    ["exploreForMaterials", ["explore_until", "world_diff"]],
    ["placeCraftingTable", ["place_block", "use_crafting_table"]],
    ["equipBestTool", ["equip_item", "held_item_observation"]],
    ["placeTorchLightArea", ["place_block", "light_level_observation"]],
    ["eatFoodWhenHungry", ["consume_item", "vitals_observation"]],
    ["sleepAtNight", ["use_bed", "time_observation"]],
    ["fleeDanger", ["observe_hostiles", "flee_from_entity"]],
    ["setupSharedStash", ["place_block", "open_container", "register_shared_chest"]]
  ] as const;

  for (const [actionSkillId, missingPrimitives] of plannedRuntimeSkills) {
    const actionSkill = getSeedActionSkill(actionSkillId);
    assert.equal(actionSkill.runtimeStatus, "planned");
    assert.deepEqual(actionSkill.missingPrimitives, missingPrimitives);
  }
});
