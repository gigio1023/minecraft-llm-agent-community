import assert from "node:assert/strict";
import test from "node:test";

import { compileSkillCandidates, compileAllowedPrimitiveIds } from "../src/runtime/intentToSkill.js";

test("intent-to-skill compiler returns bootstrap skills for a gatherer in bootstrap mode", () => {
  const candidates = compileSkillCandidates({
    intentKind: "bootstrap_progress",
    roleId: "gatherer",
    lifecycleMode: "bootstrap"
  });

  assert.ok(candidates.length > 0, "gatherer should have bootstrap candidates");

  const ids = candidates.map((c) => c.id);
  assert.ok(ids.includes("collectLogs"), "gatherer can collect logs during bootstrap");
  assert.ok(!ids.includes("craftPlanksAndSticks"), "gatherer cannot craft during bootstrap");
});

test("intent-to-skill compiler returns craft skills for a crafter in bootstrap mode", () => {
  const candidates = compileSkillCandidates({
    intentKind: "bootstrap_progress",
    roleId: "crafter",
    lifecycleMode: "bootstrap"
  });

  assert.ok(candidates.length > 0, "crafter should have bootstrap candidates");

  const ids = candidates.map((c) => c.id);
  assert.ok(ids.includes("craftPlanksAndSticks"), "crafter can craft planks");
  assert.ok(ids.includes("craftCraftingTable"), "crafter can craft crafting table");
  assert.ok(!ids.includes("collectLogs"), "crafter should not have collectLogs in bootstrap");
});

test("intent-to-skill compiler filters hostile skills from cooperative roles", () => {
  const candidates = compileSkillCandidates({
    intentKind: "avoid_or_retreat",
    roleId: "gatherer",
    lifecycleMode: "normal"
  });

  const ids = candidates.map((c) => c.id);
  assert.ok(!ids.includes("attackThenRetreat"), "cooperative role must not get hostile skills");
  assert.ok(!ids.includes("threatenApproach"), "cooperative role must not get hostile skills");
});

test("intent-to-skill compiler narrows skills during recovery lifecycle", () => {
  const normalCandidates = compileSkillCandidates({
    intentKind: "recover_basic_tools",
    roleId: "gatherer",
    lifecycleMode: "normal"
  });

  const recoveryCandidates = compileSkillCandidates({
    intentKind: "recover_basic_tools",
    roleId: "gatherer",
    lifecycleMode: "recovery"
  });

  // Recovery should be more constrained
  assert.ok(recoveryCandidates.length > 0, "recovery should have some candidates");
  assert.ok(
    recoveryCandidates.length <= normalCandidates.length,
    "recovery should not have more candidates than normal"
  );
});

test("compileAllowedPrimitiveIds always includes observe, wait, remember", () => {
  const primitives = compileAllowedPrimitiveIds({
    intentKind: "bootstrap_progress",
    roleId: "gatherer",
    lifecycleMode: "bootstrap"
  });

  assert.ok(primitives.includes("observe"));
  assert.ok(primitives.includes("wait"));
  assert.ok(primitives.includes("remember"));
});
