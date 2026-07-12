/**
 * Slice B1 — multi-hop furnace case: loader acceptance, partial milestones,
 * and timeout/clean-exit cannot fake target pass.
 */

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyFurnaceObservationAdapter,
  buildIndividualCapabilityReport,
  evaluateCapabilityMilestone,
  loadIndividualCapabilityManifestFromFile,
  type CapabilityEvidenceBagV1,
  type EvidencedValueV1,
  type IndividualCapabilityCaseV1
} from "../src/benchmarks/capability/index.js";
import type { SocialCycleRunReport } from "../src/runtime/goals/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "../benchmarks/capability/individual-capability-v1.json");
const actorId = "npc_a";
const manifestHash = "multi-hop-manifest-hash";

function capabilityReportFor(
  capabilityCase: IndividualCapabilityCaseV1,
  partial: Partial<SocialCycleRunReport> = {}
): SocialCycleRunReport {
  return baseReport({
    capability_case_context: {
      schema: "capability-case-context/v1",
      case_id: capabilityCase.case_id,
      top_level_goal: capabilityCase.top_level_goal,
      manifest_hash: manifestHash
    },
    ...partial
  });
}

function evidenced<T>(
  value: T,
  evidence_refs: [string, ...string[]],
  origin: "setup" | "run" = "run"
): EvidencedValueV1<T> {
  return { value, evidence_refs, origin };
}

function emptyBag(): CapabilityEvidenceBagV1 {
  return {
    schema: "capability-evidence-bag/v1",
    actor_id: actorId,
    available: {
      inventory: false,
      held_item: false,
      position: false,
      blocks: false,
      containers: false
    }
  };
}

function baseReport(partial: Partial<SocialCycleRunReport> = {}): SocialCycleRunReport {
  return {
    schema: "social-cycle-run-report/v1",
    run_id: "multi-hop-furnace-fixture",
    actor_id: actorId,
    provider: {
      provider_id: "openai-api",
      model: "gpt-5.4-mini",
      reasoning: "low"
    },
    runtime_status: "passed",
    agency_status: {
      life_goal_source: "actor_soul",
      strategic_goal_source: "llm_planner",
      cycle_goal_source: "llm_planner",
      used_soul: true,
      used_life_goal: true,
      used_previous_judgment: false,
      used_memory_refs: 0,
      used_relationship_refs: 0,
      used_world_event_refs: 0,
      builtin_goal_authority: false,
      builtin_execution_source: false,
      fixture_dependency: false,
      helper_expansion_count: 0,
      gameplay_progress_verified: false
    },
    cycles: [
      {
        cycle_id: "cycle-0001",
        cycle_goal_ref: "goals/cycle/cycle-0001-goal.json",
        action_ref: "goals/cycle/actor-turn-actions/cycle-0001-actor-turn-action.json",
        provider_input_refs: ["provider-inputs/cycle-0001-input.json"],
        provider_output_refs: ["provider-outputs/cycle-0001-output.json"],
        evidence_refs: ["evidence/cycle-0001-observe.json"],
        judgment_ref: "judgments/cycle-0001-judgment.json",
        verifier_status: "not_applicable"
      }
    ],
    ...partial
  };
}

function loadFurnaceCase(): IndividualCapabilityCaseV1 {
  const manifest = loadIndividualCapabilityManifestFromFile(suitePath);
  const furnace = manifest.cases.find((entry) => entry.case_id === "reach_placed_furnace");
  assert.ok(furnace, "reach_placed_furnace must exist in suite 1.3.0");
  return furnace;
}

test("loader accepts the multi-hop furnace case with manifest-owned milestone order", () => {
  const manifest = loadIndividualCapabilityManifestFromFile(suitePath);
  assert.equal(manifest.version, "1.3.0");
  const furnace = loadFurnaceCase();
  assert.equal(furnace.fixture_class, "natural_world");
  assert.equal(furnace.world_scenario_id, "natural-safe-spawn-v1");
  assert.equal(furnace.completion_policy.partial_credit, "milestones");
  assert.equal(furnace.budgets.max_cycles, 100);
  assert.equal(furnace.budgets.max_runtime_actions, 200);
  assert.ok(furnace.required_capabilities.includes("mine_cobblestone"));
  assert.deepEqual(
    furnace.milestones.map((milestone) => ({
      id: milestone.milestone_id,
      order: milestone.order
    })),
    [
      { id: "log_inventory", order: 1 },
      { id: "planks_inventory", order: 2 },
      { id: "crafting_table_item", order: 3 },
      { id: "crafting_table_placed", order: 4 },
      { id: "sticks_inventory", order: 5 },
      { id: "wooden_pickaxe_present", order: 6 },
      { id: "cobblestone_inventory", order: 7 },
      { id: "cobblestone_8", order: 8 },
      { id: "furnace_item", order: 9 },
      { id: "furnace_placed", order: 10 }
    ]
  );
});

test("partial furnace milestones evaluate evidence-backed progress without target pass", () => {
  const furnace = loadFurnaceCase();
  const bag: CapabilityEvidenceBagV1 = {
    ...emptyBag(),
    inventory: evidenced(
      {
        oak_log: 4,
        oak_planks: 8,
        stick: 4,
        wooden_pickaxe: 1,
        cobblestone: 8
      },
      ["evidence/cycle-0040-inventory.json"]
    ),
    held_item: evidenced({ name: "wooden_pickaxe", count: 1 }, ["evidence/cycle-0040-held.json"]),
    named_positions: {
      placed_crafting_table: evidenced({ x: 2, y: 64, z: -1 }, [
        "evidence/cycle-0020-place-table.json"
      ]),
      // Position ref present but furnace never observed there → target failed, not unknown.
      placed_furnace: evidenced({ x: 9, y: 64, z: 9 }, ["evidence/cycle-0040-observe.json"])
    },
    known_blocks: [
      {
        block: "crafting_table",
        position: { x: 2, y: 64, z: -1 },
        evidence_ref: "evidence/cycle-0020-place-table.json",
        origin: "run"
      }
    ],
    available: {
      inventory: true,
      held_item: true,
      position: false,
      blocks: true,
      containers: false
    }
  };

  const byId = Object.fromEntries(
    furnace.milestones.map((milestone) => [
      milestone.milestone_id,
      evaluateCapabilityMilestone(milestone, bag).status
    ])
  );

  assert.equal(byId.log_inventory, "passed");
  assert.equal(byId.planks_inventory, "passed");
  assert.equal(byId.crafting_table_item, "failed");
  assert.equal(byId.crafting_table_placed, "passed");
  assert.equal(byId.sticks_inventory, "passed");
  assert.equal(byId.wooden_pickaxe_present, "passed");
  assert.equal(byId.cobblestone_inventory, "passed");
  assert.equal(byId.cobblestone_8, "passed");
  assert.equal(byId.furnace_item, "failed");
  assert.equal(byId.furnace_placed, "failed");

  const report = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.3.0",
    case: furnace,
    report: capabilityReportFor(furnace, { runtime_status: "passed" }),
    evidence_bag: bag,
    manifest_hash: manifestHash
  });

  assert.equal(report.target.status, "failed");
  assert.equal(report.interpretation_status, "partial");
  assert.notEqual(report.interpretation_status, "passed");
  assert.ok(report.milestones.filter((entry) => entry.result.status === "passed").length >= 6);
});

test("clean exit and timeout without furnace placement cannot fake target pass", () => {
  const furnace = loadFurnaceCase();
  const partialBag: CapabilityEvidenceBagV1 = {
    ...emptyBag(),
    inventory: evidenced({ oak_log: 2, cobblestone: 3 }, ["evidence/cycle-0010-inventory.json"]),
    available: {
      inventory: true,
      held_item: false,
      position: false,
      blocks: false,
      containers: false
    }
  };

  const cleanExit = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.3.0",
    case: furnace,
    report: capabilityReportFor(furnace, { runtime_status: "passed" }),
    evidence_bag: partialBag,
    manifest_hash: manifestHash
  });
  assert.equal(cleanExit.runtime_status, "passed");
  assert.notEqual(cleanExit.interpretation_status, "passed");
  assert.notEqual(cleanExit.target.status, "passed");

  const timedOut = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.3.0",
    case: furnace,
    report: capabilityReportFor(furnace, { runtime_status: "timeout" }),
    evidence_bag: partialBag,
    manifest_hash: manifestHash
  });
  assert.equal(timedOut.runtime_status, "timeout");
  assert.notEqual(timedOut.interpretation_status, "passed");
  assert.notEqual(timedOut.target.status, "passed");
});

test("furnaceObservationAdapter maps place_block furnace evidence into the bag", () => {
  const furnace = loadFurnaceCase();
  const socialReport = capabilityReportFor(furnace, {
    cycles: [
      {
        cycle_id: "cycle-0001",
        cycle_goal_ref: "goals/cycle/cycle-0001-goal.json",
        action_ref: "goals/cycle/actor-turn-actions/cycle-0001-actor-turn-action.json",
        provider_input_refs: [],
        provider_output_refs: [],
        evidence_refs: ["evidence/cycle-0001-place-furnace.json"],
        judgment_ref: "judgments/cycle-0001-judgment.json",
        verifier_status: "passed"
      }
    ]
  });

  const enriched = applyFurnaceObservationAdapter(emptyBag(), {
    report: socialReport,
    artifactsByRef: {
      "evidence/cycle-0001-place-furnace.json": {
        schema: "actor-evidence/v1",
        evidence_id: "cycle-0001-place-furnace",
        actor_id: actorId,
        category: "tool_attempt",
        created_at: "2026-07-11T00:00:00.000Z",
        tool_attempt: {
          tool: "place_block",
          args: { itemName: "furnace" },
          result: {
            status: "placed",
            itemName: "furnace",
            afterBlockName: "furnace",
            targetPosition: { x: 5, y: 64, z: 3 }
          }
        }
      }
    }
  });

  assert.equal(enriched.available.blocks, true);
  assert.equal(enriched.named_positions?.placed_furnace?.value.x, 5);
  assert.equal(enriched.named_positions?.placed_furnace?.origin, "run");
  assert.equal(enriched.known_blocks?.[0]?.block, "furnace");

  const withInventory: CapabilityEvidenceBagV1 = {
    ...enriched,
    inventory: evidenced({ furnace: 0, cobblestone: 0 }, ["evidence/cycle-0001-place-furnace.json"]),
    available: {
      ...enriched.available,
      inventory: true
    }
  };

  const report = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.3.0",
    case: furnace,
    report: socialReport,
    evidence_bag: withInventory,
    manifest_hash: manifestHash
  });

  const furnacePlaced = report.milestones.find((entry) => entry.milestone_id === "furnace_placed");
  assert.equal(furnacePlaced?.result.status, "passed");
  assert.equal(report.target.status, "passed");
  assert.equal(report.interpretation_status, "passed");
});
