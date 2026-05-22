import assert from "node:assert/strict";
import test from "node:test";
import minecraftData from "minecraft-data";

const mcData = minecraftData("1.21.11");

test("Essential basic block IDs must be factually correct", () => {
  assert.equal(mcData.blocksByName["crafting_table"].id, 205);
  assert.equal(mcData.blocksByName["chest"].id, 200);
  assert.equal(mcData.blocksByName["furnace"].id, 208);
  assert.equal(mcData.blocksByName["torch"].id, 193);
  assert.equal(mcData.blocksByName["stone"].id, 1);
  assert.equal(mcData.blocksByName["cobblestone"].id, 12);
  assert.equal(mcData.blocksByName["deepslate"].id, 1121);
  assert.equal(mcData.blocksByName["oak_log"].id, 49);
  assert.equal(mcData.blocksByName["oak_planks"].id, 13);
});

test("Essential basic item IDs must be factually correct", () => {
  assert.equal(mcData.itemsByName["crafting_table"].id, 332);
  assert.equal(mcData.itemsByName["stone_pickaxe"].id, 923);
  assert.equal(mcData.itemsByName["wooden_pickaxe"].id, 913);
  assert.equal(mcData.itemsByName["iron_pickaxe"].id, 933);
  assert.equal(mcData.itemsByName["coal"].id, 896);
  assert.equal(mcData.itemsByName["iron_ingot"].id, 904);
  assert.equal(mcData.itemsByName["oak_planks"].id, 36);
  assert.equal(mcData.itemsByName["torch"].id, 322);
});

test("Common mob entity IDs must be factually correct", () => {
  assert.equal(mcData.entitiesByName["cow"].id, 30);
  assert.equal(mcData.entitiesByName["zombie"].id, 150);
  assert.equal(mcData.entitiesByName["creeper"].id, 32);
});
