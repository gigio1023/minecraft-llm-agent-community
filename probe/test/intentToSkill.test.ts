import assert from "node:assert/strict";
import test from "node:test";

import { compileActionSkillCandidates, compileAllowedPrimitiveIds } from "../src/runtime/intentToSkill.js";

test("intent-to-action-skill compiler returns bootstrap action skills for a gatherer in bootstrap mode", () => {
  const candidates = compileActionSkillCandidates({
    intentKind: "bootstrap_progress",
    roleId: "gatherer",
    lifecycleMode: "bootstrap"
  });

  assert.ok(candidates.length > 0, "gatherer should have bootstrap candidates");

  const ids = candidates.map((c) => c.id);
  assert.ok(ids.includes("collectLogs"), "gatherer can collect logs during bootstrap");
  assert.ok(!ids.includes("mineCobblestone"), "planned stone mining is not an active runtime candidate");
  assert.ok(!ids.includes("mineCoal"), "planned coal mining is not an active runtime candidate");
  assert.ok(!ids.includes("craftPlanksAndSticks"), "gatherer cannot craft during bootstrap");
});

test("intent-to-action-skill compiler returns craft action skills for a crafter in bootstrap mode", () => {
  const candidates = compileActionSkillCandidates({
    intentKind: "bootstrap_progress",
    roleId: "crafter",
    lifecycleMode: "bootstrap"
  });

  assert.ok(candidates.length > 0, "crafter should have bootstrap candidates");

  const ids = candidates.map((c) => c.id);
  assert.ok(ids.includes("craftPlanksAndSticks"), "crafter can craft planks");
  assert.ok(ids.includes("craftCraftingTable"), "crafter can craft crafting table");
  assert.ok(ids.includes("craftWoodenPickaxe"), "crafter can craft a table-bound wooden pickaxe");
  assert.ok(!ids.includes("collectLogs"), "crafter should not have collectLogs in bootstrap");
});

test("intent-to-action-skill compiler filters hostile action skills from cooperative roles", () => {
  const candidates = compileActionSkillCandidates({
    intentKind: "avoid_or_retreat",
    roleId: "gatherer",
    lifecycleMode: "normal"
  });

  const ids = candidates.map((c) => c.id);
  assert.ok(!ids.includes("attackThenRetreat"), "cooperative role must not get hostile action skills");
  assert.ok(!ids.includes("threatenApproach"), "cooperative role must not get hostile action skills");
});

test("intent-to-action-skill compiler narrows action skills during recovery lifecycle", () => {
  const normalCandidates = compileActionSkillCandidates({
    intentKind: "recover_basic_tools",
    roleId: "gatherer",
    lifecycleMode: "normal"
  });

  const recoveryCandidates = compileActionSkillCandidates({
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
