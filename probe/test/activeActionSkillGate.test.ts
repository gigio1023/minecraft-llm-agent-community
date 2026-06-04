/** Regression coverage for active action skill primitive gates. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActiveActionSkillGate,
  checkActiveActionSkillPermission
} from "../src/runtime/activeActionSkillGate.js";
import {
  runtimeControlActionSkill,
  testActionSkillRecord
} from "./helpers/actionSkillRecords.js";

test("active action skill gate derives allowed primitives from actor-owned active records", () => {
  const gate = buildActiveActionSkillGate({
    actorId: "npc_a",
    activeActionSkills: [
      runtimeControlActionSkill(),
      testActionSkillRecord("collectLogs", ["observe", "collect_logs", "wait"]),
      testActionSkillRecord("foreignSkill", ["craft_item"], "npc_b")
    ]
  });

  assert.deepEqual(gate.activeSkillIds, [
    "runtimeObserveAndRemember",
    "collectLogs"
  ]);
  assert.deepEqual(gate.allowedPrimitives, [
    "observe",
    "wait",
    "remember",
    "collect_logs"
  ]);
  assert.equal(checkActiveActionSkillPermission(gate, "collect_logs").allowed, true);

  const denied = checkActiveActionSkillPermission(gate, "craft_item");
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /not backed by active action skills/);
});

test("active action skill gate fails closed when no active records exist", () => {
  assert.throws(
    () => buildActiveActionSkillGate({ actorId: "npc_a", activeActionSkills: [] }),
    /has no active action skill records/
  );
});
