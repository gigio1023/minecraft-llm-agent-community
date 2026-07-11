/**
 * Provider-free offline smoke for the V4 capability runner (Step A3).
 *
 * Uses deterministic-social with connectToWorld=false. Overrides cycles to keep
 * the suite fast while still exercising declaration → raw → normalized → index.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CAPABILITY_CASE_DECLARATION_SCHEMA,
  CAPABILITY_SUITE_INDEX_SCHEMA,
  countRuntimeActions,
  hashCapabilityManifest,
  loadIndividualCapabilityManifestFromFile,
  runCapabilityCase
} from "../src/benchmarks/capability/index.js";
import type {
  CapabilityBudgetStatusV1,
  CapabilityCaseDeclarationV1,
  CapabilitySuiteIndexV1,
  IndividualCapabilityReportV1
} from "../src/benchmarks/capability/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const probeRoot = path.resolve(here, "..");
const repoRoot = path.resolve(probeRoot, "..");
const manifestPath = path.join(
  probeRoot,
  "benchmarks/capability/individual-capability-v1.json"
);

async function readFirstActorTurnInput(actorWorkspacePath: string) {
  const providerInputsDir = path.join(actorWorkspacePath, "npc_b", "provider-inputs");
  const names = (await fs.readdir(providerInputsDir)).sort();
  const actorTurnName = names.find((name) => name.startsWith("actor-turn-"));
  assert.ok(actorTurnName, "expected a saved Actor Turn provider input");
  const snapshot = JSON.parse(
    await fs.readFile(path.join(providerInputsDir, actorTurnName), "utf8")
  ) as { input?: Record<string, unknown> };
  assert.ok(snapshot.input, "provider input snapshot must contain input");
  return snapshot.input;
}

function allObjectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(allObjectKeys);
  }
  if (!value || typeof value !== "object") {
    return [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
    key,
    ...allObjectKeys(child)
  ]);
}

test("capability runner provider-free offline smoke emits declaration, raw, normalized, suite index", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-runner-smoke-"));
  const manifest = loadIndividualCapabilityManifestFromFile(manifestPath);
  const expectedHash = hashCapabilityManifest(manifest);

  const result = await runCapabilityCase({
    manifestPath,
    caseId: "collect_logs",
    outDir,
    providerId: "deterministic-social",
    model: "deterministic-social",
    connectToWorld: false,
    cycles: 2,
    maxActionsPerCycle: 2,
    actorId: "npc_b",
    repoRoot,
    implementationRevision: null
  });

  // Declaration written before run (and still present).
  const declarationRaw = await fs.readFile(result.declaration_path, "utf8");
  const declaration = JSON.parse(declarationRaw) as CapabilityCaseDeclarationV1;
  assert.equal(declaration.schema, CAPABILITY_CASE_DECLARATION_SCHEMA);
  assert.equal(declaration.suite_id, "individual-capability-v1");
  assert.equal(declaration.case_id, "collect_logs");
  assert.equal(declaration.manifest_hash, expectedHash);
  assert.equal(declaration.world_scenario_id, "natural-safe-spawn-v1");
  assert.equal(declaration.provider.provider_id, "deterministic-social");
  assert.equal(declaration.provider_free, true);
  assert.equal(declaration.connect_to_world, false);
  assert.ok(declaration.budgets.max_cycles >= 1);
  assert.ok(declaration.output_paths.raw_report);
  assert.ok(declaration.output_paths.normalized_report);
  assert.ok(declaration.output_paths.suite_index);

  // Raw social-cycle report exists.
  const rawReport = JSON.parse(await fs.readFile(result.raw_report_path, "utf8")) as {
    schema?: string;
    provider?: { provider_id?: string; model?: string };
    capability_case_context?: {
      case_id?: string;
      top_level_goal?: string;
      manifest_hash?: string;
    };
    provider_usage?: { totals?: Array<{ usage?: { requests?: number } }> };
    cycles?: unknown[];
  };
  assert.equal(rawReport.schema, "social-cycle-run-report/v1");
  assert.equal(rawReport.provider?.provider_id, "deterministic-social");
  assert.equal(rawReport.provider?.model, "deterministic-social");
  assert.equal(rawReport.capability_case_context?.case_id, "collect_logs");
  assert.equal(
    rawReport.capability_case_context?.top_level_goal,
    manifest.cases.find((entry) => entry.case_id === "collect_logs")?.top_level_goal
  );
  assert.equal(rawReport.capability_case_context?.manifest_hash, expectedHash);
  assert.equal((rawReport.cycles ?? []).length, 2);

  const placeTableRecord = JSON.parse(
    await fs.readFile(
      path.join(
        declaration.output_paths.actor_workspace,
        "npc_b/action-skills/active/placeCraftingTable.json"
      ),
      "utf8"
    )
  ) as { input_schema?: { required?: unknown } };
  assert.deepEqual(placeTableRecord.input_schema?.required, ["targetPosition"]);

  // Zero provider HTTP: deterministic-social must not record live provider requests.
  const usageTotals = rawReport.provider_usage?.totals ?? [];
  const liveRequests = usageTotals.reduce(
    (sum, entry) => sum + (entry.usage?.requests ?? 0),
    0
  );
  assert.equal(liveRequests, 0);

  // Normalized capability report exists and does not claim pass without evidence.
  const normalized = JSON.parse(
    await fs.readFile(result.normalized_report_path, "utf8")
  ) as IndividualCapabilityReportV1;
  assert.equal(normalized.schema, "individual-capability-report/v1");
  assert.equal(normalized.case_id, "collect_logs");
  assert.equal(normalized.manifest_hash, expectedHash);
  assert.notEqual(normalized.interpretation_status, "passed");
  assert.notEqual(normalized.target.status, "passed");

  // Budget status artifact.
  const budgetStatus = JSON.parse(
    await fs.readFile(result.budget_status_path, "utf8")
  ) as CapabilityBudgetStatusV1;
  assert.equal(budgetStatus.schema, "capability-budget-status/v1");
  assert.equal(budgetStatus.target_passed, false);
  // Smoke uses cycle override below declared budgets, so exhaustion is false.
  assert.equal(budgetStatus.budget_stopped, false);
  assert.equal(budgetStatus.budget_exhausted, false);
  assert.ok(
    Number.isFinite(budgetStatus.observed.wall_time_ms) &&
      (budgetStatus.observed.wall_time_ms ?? -1) >= 0
  );
  assert.ok(
    Number.isFinite(normalized.budgets.observed.wall_time_ms) &&
      (normalized.budgets.observed.wall_time_ms ?? -1) >= 0
  );

  // Suite index updated.
  const suiteIndex = JSON.parse(
    await fs.readFile(result.suite_index_path, "utf8")
  ) as CapabilitySuiteIndexV1;
  assert.equal(suiteIndex.schema, CAPABILITY_SUITE_INDEX_SCHEMA);
  assert.equal(suiteIndex.suite_id, "individual-capability-v1");
  assert.equal(suiteIndex.manifest_hash, expectedHash);
  assert.equal(suiteIndex.runs.length, 1);
  assert.equal(suiteIndex.runs[0]?.case_id, "collect_logs");
  assert.equal(suiteIndex.runs[0]?.provider_free, true);
  assert.equal(suiteIndex.runs[0]?.budget_stopped, false);
  assert.equal(suiteIndex.runs[0]?.capability_run_id, declaration.capability_run_id);
  assert.ok(suiteIndex.runs[0]?.declaration_ref.includes("declaration.json"));
  assert.ok(suiteIndex.runs[0]?.normalized_report_ref.includes("normalized-report.json"));
});

test("capability runner sends distinct declared goals without evaluation rules or scenario task prose", async () => {
  const manifest = loadIndividualCapabilityManifestFromFile(manifestPath);
  const expectedHash = hashCapabilityManifest(manifest);
  const cases = [
    "collect_logs",
    "acquire_diamond_pickaxe_infeasible",
    "craft_wooden_pickaxe"
  ] as const;
  const savedInputs = new Map<string, Record<string, unknown>>();

  for (const caseId of cases) {
    const outDir = await fs.mkdtemp(path.join(os.tmpdir(), `capability-goal-${caseId}-`));
    const result = await runCapabilityCase({
      manifestPath,
      caseId,
      outDir,
      providerId: "deterministic-social",
      model: "deterministic-social",
      connectToWorld: false,
      cycles: 1,
      maxActionsPerCycle: 1,
      actorId: "npc_b",
      repoRoot,
      implementationRevision: null
    });
    savedInputs.set(caseId, await readFirstActorTurnInput(result.declaration.output_paths.actor_workspace));
  }

  for (const caseId of cases) {
    const savedInput = savedInputs.get(caseId);
    assert.ok(savedInput);
    const capabilityContext = savedInput.capability_case_context as Record<string, unknown>;
    const declaredCase = manifest.cases.find((entry) => entry.case_id === caseId);
    assert.ok(declaredCase);
    assert.deepEqual(capabilityContext, {
      schema: "capability-case-context/v1",
      case_id: caseId,
      top_level_goal: declaredCase.top_level_goal,
      manifest_hash: expectedHash
    });
    assert.equal(
      (savedInput.active_episode as { current_focus?: unknown }).current_focus,
      declaredCase.top_level_goal
    );
    assert.deepEqual(
      (savedInput.source_evidence_bundle as { world_event_cards?: unknown }).world_event_cards,
      []
    );
    const keys = new Set(allObjectKeys(savedInput));
    assert.equal(keys.has("milestones"), false);
    assert.equal(keys.has("completion_policy"), false);
    assert.equal(keys.has("allowed_evidence_kinds"), false);
  }

  assert.notEqual(
    (savedInputs.get("collect_logs")?.capability_case_context as { top_level_goal: string })
      .top_level_goal,
    (savedInputs.get("acquire_diamond_pickaxe_infeasible")?.capability_case_context as {
      top_level_goal: string;
    }).top_level_goal
  );
  assert.doesNotMatch(
    JSON.stringify(savedInputs.get("craft_wooden_pickaxe")),
    /Useful milestone evidence includes|oak_planks and stick crafting/
  );
});

test("capability runner exits conceptually on unknown case", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-runner-bad-case-"));
  await assert.rejects(
    () =>
      runCapabilityCase({
        manifestPath,
        caseId: "not_a_real_case",
        outDir,
        providerId: "deterministic-social",
        connectToWorld: false,
        cycles: 1,
        repoRoot,
        implementationRevision: null
      }),
    /not found/i
  );
});

test("runtime action counting does not invent one action for an empty cycle", () => {
  assert.equal(
    countRuntimeActions({
      cycles: [{ action_attempts: [] }, {}, { action_attempts: [{}, {}] }]
    }),
    2
  );
});

test("capability runner rejects debug overrides beyond declared action budgets", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-runner-budget-"));
  await assert.rejects(
    () =>
      runCapabilityCase({
        manifestPath,
        caseId: "collect_logs",
        outDir,
        providerId: "deterministic-social",
        connectToWorld: false,
        cycles: 20,
        maxActionsPerCycle: 3,
        repoRoot,
        implementationRevision: null
      }),
    /max_runtime_actions/i
  );
});
