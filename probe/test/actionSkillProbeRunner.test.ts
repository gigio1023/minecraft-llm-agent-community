import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSkillProbeActionSkillRecords,
  loadSkillProbeContract,
  validateSkillProbeConfig,
  type ActionSkillProbeConfig
} from "../src/runtime/actionSkillProbeRunner.js";

test("actionSkillProbeRunner builds active records restricted to the target skill primitives", () => {
  const baseConfig: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "collectLogs",
    roleId: "gatherer",
    maxActions: 1
  };

  const records = buildSkillProbeActionSkillRecords(baseConfig);

  assert.equal(records.length, 2);

  const collectLogsRecord = records.find((r) => r.skill_id === "collectLogs");
  assert.ok(collectLogsRecord);
  assert.equal(collectLogsRecord.status, "active");
  assert.equal(collectLogsRecord.owner_actor_id, "npc_a");
  assert.ok(collectLogsRecord.required_primitives.includes("collect_logs"));
  assert.ok(collectLogsRecord.required_primitives.includes("observe"));
});

test("actionSkillProbeRunner includes runtimeObserveAndRemember for loop termination", () => {
  const records = buildSkillProbeActionSkillRecords({
    actorId: "npc_a",
    skillId: "collectLogs",
    roleId: "gatherer",
    maxActions: 1
  });
  const baseline = records.find((r) => r.skill_id === "runtimeObserveAndRemember");

  assert.ok(baseline);
  assert.ok(baseline.required_primitives.includes("observe"));
  assert.ok(baseline.required_primitives.includes("wait"));
  assert.ok(baseline.required_primitives.includes("remember"));
});

test("actionSkillProbeRunner does not duplicate runtimeObserveAndRemember when probing it directly", () => {
  const config: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "runtimeObserveAndRemember",
    roleId: "gatherer",
    maxActions: 1
  };

  const records = buildSkillProbeActionSkillRecords(config);
  assert.equal(records.length, 1);
  assert.equal(records[0].skill_id, "runtimeObserveAndRemember");
});

test("actionSkillProbeRunner throws for planned unimplemented skills", () => {
  const config: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "craftWoodenPickaxe",
    roleId: "crafter",
    maxActions: 1
  };

  assert.throws(() => buildSkillProbeActionSkillRecords(config), /not "implemented"/);
});

test("actionSkillProbeRunner throws when the role is not valid for the skill", () => {
  const config: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "collectLogs",
    roleId: "crafter",
    maxActions: 1
  };

  assert.throws(() => buildSkillProbeActionSkillRecords(config), /not valid for role/);
});

test("actionSkillProbeRunner returns the verification contract and allowed primitives for collectLogs", () => {
  const { contract, allowedPrimitives } = loadSkillProbeContract("collectLogs");

  assert.equal(contract.skillId, "collectLogs");
  assert.ok(contract.evidence.length > 0);
  assert.ok(allowedPrimitives.includes("collect_logs"));
  assert.ok(allowedPrimitives.includes("observe"));
  assert.ok(allowedPrimitives.includes("wait"));
  assert.ok(allowedPrimitives.includes("remember"));
});

test("actionSkillProbeRunner returns contract for craftPlanksAndSticks", () => {
  const { contract, allowedPrimitives } = loadSkillProbeContract("craftPlanksAndSticks");

  assert.equal(contract.skillId, "craftPlanksAndSticks");
  assert.ok(allowedPrimitives.includes("craft_item"));
  assert.ok(allowedPrimitives.includes("observe"));
});

test("actionSkillProbeRunner always includes observe, wait, remember in allowed primitives", () => {
  const { allowedPrimitives } = loadSkillProbeContract("collectLogs");

  assert.ok(allowedPrimitives.includes("observe"));
  assert.ok(allowedPrimitives.includes("wait"));
  assert.ok(allowedPrimitives.includes("remember"));
});

test("actionSkillProbeRunner accepts a valid config for an implemented skill", () => {
  assert.doesNotThrow(() =>
    validateSkillProbeConfig({
      actorId: "npc_a",
      skillId: "collectLogs",
      roleId: "gatherer",
      maxActions: 1
    })
  );
});

test("actionSkillProbeRunner throws for empty actorId", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "",
        skillId: "collectLogs",
        roleId: "gatherer",
        maxActions: 1
      }),
    /--actor is required/
  );
});

test("actionSkillProbeRunner throws for empty skillId", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "npc_a",
        skillId: "" as any,
        roleId: "gatherer",
        maxActions: 1
      }),
    /--skill is required/
  );
});

test("actionSkillProbeRunner throws for a planned skill", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "npc_a",
        skillId: "craftWoodenPickaxe",
        roleId: "crafter",
        maxActions: 1
      }),
    /planned but not implemented/
  );
});

test("actionSkillProbeRunner throws for maxActions less than 1", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "npc_a",
        skillId: "collectLogs",
        roleId: "gatherer",
        maxActions: 0
      }),
    /--max-actions must be at least 1/
  );
});
