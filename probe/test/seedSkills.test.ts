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
  assert.equal(all.length, 32);

  const coreIds = listCoreActionSkillIds();
  assert.equal(coreIds.length, 12);

  const survivalUtilityIds = listSurvivalUtilityActionSkillIds();
  assert.equal(survivalUtilityIds.length, 10);

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

  assert.ok(implementedIds.includes("runtimeObserveAndRemember"));
  assert.ok(implementedIds.includes("runBoundedMineflayerProgram"));
  assert.ok(implementedIds.includes("collectLogs"));
  assert.ok(implementedIds.includes("craftCraftingTable"));
  assert.ok(implementedIds.includes("mineCobblestone"));
  assert.ok(implementedIds.includes("placeCraftingTable"));
  assert.ok(implementedIds.includes("buildBasicShelter"));
  assert.ok(implementedIds.includes("equipHeldItem"));
  assert.ok(implementedIds.includes("eatFoodWhenHungry"));
  assert.ok(plannedIds.includes("mineCoal"));
  assert.ok(plannedIds.includes("smeltRawIron"));
  assert.ok(plannedIds.includes("setupSharedStash"));

  const mineCobblestone = getSeedActionSkill("mineCobblestone");
  assert.equal(mineCobblestone.runtimeStatus, "implemented");
  assert.equal(mineCobblestone.missingPrimitives, undefined);
  assert.ok(!mineCobblestone.primitiveIds.includes("collect_logs"));
  assert.ok(mineCobblestone.primitiveIds.includes("mine_block"));
});

test("reference-derived initial abilities stay planned until their primitives exist", () => {
  const plannedRuntimeSkills = [
    ["exploreForMaterials", ["explore_until", "world_diff"]],
    ["equipBestTool", ["task_tool_ranking"]],
    ["placeTorchLightArea", ["place_block", "light_level_observation"]],
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

test("eatFoodWhenHungry is active once vitals observation and consume_item are runtime-owned", () => {
  const actionSkill = getSeedActionSkill("eatFoodWhenHungry");
  assert.equal(actionSkill.runtimeStatus, "implemented");
  assert.deepEqual(actionSkill.primitiveIds, ["observe", "consume_item"]);
  assert.equal(actionSkill.missingPrimitives, undefined);
});

test("equipHeldItem is active once exact hand equip is runtime-owned", () => {
  const actionSkill = getSeedActionSkill("equipHeldItem");
  assert.equal(actionSkill.runtimeStatus, "implemented");
  assert.deepEqual(actionSkill.primitiveIds, ["observe", "equip_item"]);
  assert.equal(actionSkill.missingPrimitives, undefined);
});

test("runBoundedMineflayerProgram exposes generated helper code as an observed runtime boundary", () => {
  const actionSkill = getSeedActionSkill("runBoundedMineflayerProgram");
  assert.equal(actionSkill.runtimeStatus, "implemented");
  assert.deepEqual(actionSkill.primitiveIds, [
    "observe",
    "run_mineflayer_program",
    "observe",
    "remember"
  ]);
  assert.equal(actionSkill.missingPrimitives, undefined);
});
