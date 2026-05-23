import assert from "node:assert/strict";
import test from "node:test";

import { planDirectGeneratedSource } from "../src/provider/planner/planDirectGeneratedSource.js";
import type {
  DirectGeneratedSourcePlan,
  ObjectivePhasePlannerPort,
  ObjectivePhasePlannerRequest
} from "../src/provider/planner/types.js";

const phaseId = "craft_current_run_stone_axe_1";
const baseRequest: ObjectivePhasePlannerRequest = {
  actorId: "npc_b",
  turnId: "turn-1",
  actorWorkspaceRootDir: "/tmp/actors",
  phaseId,
  objectiveId: "craft_current_run_stone_pickaxe_1",
  prompt: "craft stone axe"
};

const validLlmSource = "export async function run(ctx) { return ctx.inspectInventory(); }";
const blockedLlmSource = 'import fs from "node:fs"; export async function run(ctx) {}';

function stubPlanner(plan: DirectGeneratedSourcePlan): ObjectivePhasePlannerPort {
  return {
    plannerId: plan.plannerId,
    planPhaseSource: async () => plan
  };
}

test("planDirectGeneratedSource keeps valid LLM source", async () => {
  const resolved = await planDirectGeneratedSource({
    planner: stubPlanner({
      sourceKind: "llm-generated-ts",
      source: validLlmSource,
      plannerId: "gemini-live-planner",
      model: "gemini-2.5-flash"
    }),
    request: baseRequest
  });

  assert.equal(resolved.sourceKind, "llm-generated-ts");
  assert.equal(resolved.usedBuiltinFallback, false);
  assert.match(resolved.source, /export async function run/);
});

test("planDirectGeneratedSource falls back when LLM source is empty", async () => {
  const resolved = await planDirectGeneratedSource({
    planner: stubPlanner({
      sourceKind: "llm-generated-ts",
      source: "",
      plannerId: "gemini-live-planner",
      model: "gemini-2.5-flash",
      errorKind: "empty_response"
    }),
    request: baseRequest
  });

  assert.equal(resolved.sourceKind, "builtin-phase-source");
  assert.equal(resolved.usedBuiltinFallback, true);
  assert.ok(resolved.fallbackReason?.match(/empty_response|no source/));
});

test("planDirectGeneratedSource falls back when planner is blocked", async () => {
  const resolved = await planDirectGeneratedSource({
    planner: stubPlanner({
      sourceKind: "llm-generated-ts",
      source: "",
      plannerId: "openai-codex-planner",
      model: "gpt-5",
      fallbackReason: "planner blocked: auth"
    }),
    request: baseRequest
  });

  assert.equal(resolved.sourceKind, "builtin-phase-source");
  assert.equal(resolved.usedBuiltinFallback, true);
});

test("planDirectGeneratedSource falls back when sandbox rejects LLM source", async () => {
  const resolved = await planDirectGeneratedSource({
    planner: stubPlanner({
      sourceKind: "llm-generated-ts",
      source: blockedLlmSource,
      plannerId: "gemini-live-planner",
      model: "gemini-2.5-flash"
    }),
    request: baseRequest
  });

  assert.equal(resolved.sourceKind, "builtin-phase-source");
  assert.equal(resolved.usedBuiltinFallback, true);
  assert.ok(resolved.fallbackReason?.match(/sandbox/i));
});

test("planDirectGeneratedSource uses explicit builtin planner", async () => {
  const resolved = await planDirectGeneratedSource({
    planner: stubPlanner({
      sourceKind: "builtin-phase-source",
      source: "",
      plannerId: "builtin-planner",
      model: "builtin-phase-program"
    }),
    request: baseRequest
  });

  assert.equal(resolved.plannerId, "builtin-planner");
  assert.equal(resolved.sourceKind, "builtin-phase-source");
  assert.equal(resolved.usedBuiltinFallback, true);
  assert.match(resolved.source, /craftWithTable\("stone_axe"/);
});

test("planDirectGeneratedSource fails loudly when builtin phase is missing", async () => {
  await assert.rejects(
    () =>
      planDirectGeneratedSource({
        planner: stubPlanner({
          sourceKind: "builtin-phase-source",
          source: "",
          plannerId: "builtin-planner",
          model: "builtin-phase-program"
        }),
        request: { ...baseRequest, phaseId: "unknown_phase_id" }
      }),
    /No builtin phase source/
  );
});
