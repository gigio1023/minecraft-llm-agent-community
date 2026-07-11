/** Normalized individual-capability-report/v1 adapter and builder coverage. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptSocialCycleReportToEvidenceBag,
  buildIndividualCapabilityReport,
  isRootSafeRelativeRef,
  resolveRootSafeArtifactRef,
  type CapabilityEvidenceBagV1,
  type EvidencedValueV1,
  type IndividualCapabilityCaseV1
} from "../src/benchmarks/capability/index.js";
import type { SocialCycleRunReport } from "../src/runtime/goals/types.js";
import type { SettlementState } from "../src/runtime/settlement/settlementState.js";

const actorId = "npc_a";

function evidenced<T>(
  value: T,
  evidence_refs: [string, ...string[]],
  origin: "setup" | "run" = "run"
): EvidencedValueV1<T> {
  return { value, evidence_refs, origin };
}

function emptyBag(actor_id = actorId): CapabilityEvidenceBagV1 {
  return {
    schema: "capability-evidence-bag/v1",
    actor_id,
    available: {
      inventory: false,
      held_item: false,
      position: false,
      blocks: false,
      containers: false
    }
  };
}

function baseCase(partial: Partial<IndividualCapabilityCaseV1> = {}): IndividualCapabilityCaseV1 {
  return {
    case_id: "collect_logs",
    title: "Collect logs",
    top_level_goal: "Gather at least one oak log.",
    world_scenario_id: "natural-safe-spawn-v1",
    fixture_class: "natural_world",
    required_capabilities: [],
    budgets: {
      max_cycles: 20,
      max_runtime_actions: 40,
      max_wall_time_ms: 600000
    },
    target: { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    milestones: [
      {
        milestone_id: "any_log_inventory",
        title: "Any oak log present",
        predicate: { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
        order: 1,
        weight: 1
      },
      {
        milestone_id: "two_logs",
        title: "Two oak logs",
        predicate: { op: "item_count_gte", item: "oak_log", count: 2, owner: "actor" },
        order: 2,
        weight: 1
      }
    ],
    allowed_evidence_kinds: ["inventory", "tool_attempt", "settlement"],
    seed_policy: { kind: "fixed", seeds: ["natural-safe-spawn-v1"], repeats: 1 },
    completion_policy: { require_target: true, partial_credit: "milestones" },
    ...partial
  };
}

function baseReport(partial: Partial<SocialCycleRunReport> = {}): SocialCycleRunReport {
  return {
    schema: "social-cycle-run-report/v1",
    run_id: "capability-report-fixture",
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

function settlementStub(partial: Partial<SettlementState> = {}): SettlementState {
  return {
    schema: "settlement-state/v1",
    actor_id: actorId,
    updated_at: "2026-07-11T00:00:00.000Z",
    inventory_counts: {},
    shared_storage: {
      status: "unknown",
      items: [],
      evidence_refs: []
    },
    known_positions: {},
    blocker_histogram: [],
    available_action_skill_ids: [],
    missing_primitive_blockers: [],
    structure_progress: {
      status: "none",
      total_placed_blocks: 0,
      evidence_refs: [],
      summaries: [],
      interpretation_notes: []
    },
    progress: {
      has_crafting_table: false,
      has_structure_progress: false,
      has_verified_shelter: false,
      has_shared_storage_contribution: false,
      has_judgment_or_memory: false,
      has_blocker_summary: false
    },
    checklist: {
      schema: "settlement-checklist/v1",
      items: [],
      satisfied_count: 0,
      pending_count: 0,
      blocked_count: 0
    },
    ...partial
  };
}

test("clean runtime exit without target evidence is not capability passed", () => {
  const report = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase(),
    report: baseReport({ runtime_status: "passed" }),
    evidence_bag: emptyBag()
  });

  assert.equal(report.runtime_status, "passed");
  assert.notEqual(report.interpretation_status, "passed");
  assert.ok(
    report.interpretation_status === "unverifiable" || report.interpretation_status === "failed"
  );
  assert.equal(report.target.status, "unknown");
  assert.equal(report.failure_class, "unverifiable");
});

test("partial milestones with failed or unknown target never imply capability passed", () => {
  const bag: CapabilityEvidenceBagV1 = {
    ...emptyBag(),
    inventory: evidenced({ oak_log: 1 }, ["evidence/cycle-0001-collect.json"]),
    available: {
      inventory: true,
      held_item: false,
      position: false,
      blocks: false,
      containers: false
    }
  };

  const failedTarget = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase({
      target: { op: "item_count_gte", item: "oak_log", count: 3, owner: "actor" }
    }),
    report: baseReport({ runtime_status: "passed" }),
    evidence_bag: bag
  });

  assert.equal(failedTarget.target.status, "failed");
  assert.equal(failedTarget.milestones[0]?.result.status, "passed");
  assert.equal(failedTarget.milestones[1]?.result.status, "failed");
  assert.equal(failedTarget.interpretation_status, "partial");
  assert.notEqual(failedTarget.interpretation_status, "passed");

  const unknownTarget = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase({
      target: { op: "held_item_is", item: "wooden_pickaxe" }
    }),
    report: baseReport({ runtime_status: "passed" }),
    evidence_bag: bag
  });

  assert.equal(unknownTarget.target.status, "unknown");
  assert.equal(unknownTarget.milestones[0]?.result.status, "passed");
  assert.equal(unknownTarget.interpretation_status, "unverifiable");
  assert.notEqual(unknownTarget.interpretation_status, "passed");
});

test("setup inventory from fixture contamination does not pass item_count_gte", () => {
  const report = baseReport({
    runtime_status: "passed",
    agency_status: {
      ...baseReport().agency_status,
      fixture_dependency: true
    },
    server: {
      mode: "fresh_world",
      seed: "fixture-seed",
      level_type: "flat",
      version: "1.20.4",
      starter_inventory_seeded: true,
      world_scenario: {
        scenario_id: "wooden-pickaxe-flat-benchmark-v1",
        lane: "fixture_probe",
        fixture_dependency: true,
        requires_fresh_world: true
      }
    },
    cycles: [
      {
        cycle_id: "cycle-0001",
        cycle_goal_ref: "goals/cycle/cycle-0001-goal.json",
        action_ref: "goals/cycle/actor-turn-actions/cycle-0001-actor-turn-action.json",
        provider_input_refs: [],
        provider_output_refs: [],
        evidence_refs: ["evidence/cycle-0001-observe.json"],
        judgment_ref: "judgments/cycle-0001-judgment.json",
        verifier_status: "not_applicable"
      }
    ]
  });

  const bag = adaptSocialCycleReportToEvidenceBag({
    report,
    artifactsByRef: {
      "evidence/cycle-0001-observe.json": {
        schema: "actor-evidence/v1",
        evidence_id: "cycle-0001-observe",
        actor_id: actorId,
        category: "tool_attempt",
        created_at: "2026-07-11T00:00:00.000Z",
        data: {
          inventory: [{ name: "oak_log", count: 8 }]
        }
      }
    }
  });

  assert.equal(bag.available.inventory, true);
  assert.equal(bag.inventory?.origin, "setup");
  assert.ok((bag.inventory?.value.oak_log ?? 0) >= 1);

  const capabilityReport = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase(),
    report,
    evidence_bag: bag
  });

  assert.notEqual(capabilityReport.interpretation_status, "passed");
  assert.equal(capabilityReport.target.status, "unknown");
});

test("artifactRefs rejects absolute and escaping refs", () => {
  assert.equal(isRootSafeRelativeRef("/etc/passwd"), false);
  assert.equal(isRootSafeRelativeRef("../escape.json"), false);
  assert.equal(isRootSafeRelativeRef("evidence/../secrets.json"), false);
  assert.equal(isRootSafeRelativeRef("evidence/cycle-0001.json"), true);

  const absolute = resolveRootSafeArtifactRef("/tmp/actor", "/tmp/actor/evidence/x.json");
  assert.equal(absolute.ok, false);

  const escape = resolveRootSafeArtifactRef("/tmp/actor", "../../etc/passwd");
  assert.equal(escape.ok, false);

  const ok = resolveRootSafeArtifactRef("/tmp/actor", "evidence/cycle-0001.json");
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.relative_ref, "evidence/cycle-0001.json");
  }
});

test("missing bag refs yield unverifiable interpretation", () => {
  const report = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase(),
    report: baseReport({
      runtime_status: "passed",
      settlement_state: settlementStub({
        inventory_counts: { oak_log: 4 }
      })
    }),
    evidence_bag: emptyBag()
  });

  assert.equal(report.interpretation_status, "unverifiable");
  assert.equal(report.failure_class, "unverifiable");
  assert.equal(report.target.status, "unknown");
});

test("settlement inventory without refs is omitted by the evidence bag adapter", () => {
  const bag = adaptSocialCycleReportToEvidenceBag({
    report: baseReport({
      settlement_state: settlementStub({
        inventory_counts: { oak_log: 9 }
      })
    })
  });

  assert.equal(bag.available.inventory, false);
  assert.equal(bag.inventory, undefined);
});

test("placed crafting_table maps to named_positions when refs exist", () => {
  const bag = adaptSocialCycleReportToEvidenceBag({
    report: baseReport({
      settlement_state: settlementStub({
        known_positions: {
          crafting_table: {
            status: "placed",
            position: { x: 1, y: 64, z: 2 },
            evidence_refs: ["evidence/cycle-0002-place.json"]
          }
        }
      })
    })
  });

  assert.equal(bag.available.blocks, true);
  assert.equal(bag.named_positions?.placed_crafting_table?.value.x, 1);
  assert.equal(bag.named_positions?.placed_crafting_table?.origin, "run");
  assert.equal(bag.known_blocks?.[0]?.block, "crafting_table");
  assert.equal(bag.known_blocks?.[0]?.evidence_ref, "evidence/cycle-0002-place.json");
});

test("shared_storage maps to containers with origin", () => {
  const bag = adaptSocialCycleReportToEvidenceBag({
    report: baseReport({
      settlement_state: settlementStub({
        shared_storage: {
          status: "contributed",
          chest_id: "shared-chest-1",
          items: [{ name: "oak_log", count: 2 }],
          evidence_refs: ["evidence/cycle-0003-deposit.json"]
        }
      })
    })
  });

  assert.equal(bag.available.containers, true);
  assert.equal(bag.containers?.[0]?.container_ref, "shared-chest-1");
  assert.equal(bag.containers?.[0]?.origin, "run");
  assert.equal(bag.containers?.[0]?.items.oak_log, 2);
});

test("deterministic re-normalize yields the same interpretation and refs", () => {
  const bag: CapabilityEvidenceBagV1 = {
    ...emptyBag(),
    inventory: evidenced({ oak_log: 1 }, ["evidence/b.json", "evidence/a.json"]),
    available: {
      inventory: true,
      held_item: false,
      position: false,
      blocks: false,
      containers: false
    }
  };
  const socialReport = baseReport({
    runtime_status: "failed",
    settlement_state: settlementStub({
      blocker_histogram: [
        { key: "no_progress", count: 2, example: "observe loop" },
        { key: "blocked", count: 1, example: "path" }
      ]
    })
  });

  const first = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase(),
    report: socialReport,
    evidence_bag: bag
  });
  const second = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase(),
    report: socialReport,
    evidence_bag: bag
  });

  assert.deepEqual(first, second);
  assert.equal(first.interpretation_status, "passed");
  assert.deepEqual(first.artifact_refs.evidence_refs, ["evidence/cycle-0001-observe.json"]);
  assert.deepEqual(
    first.blockers.map((entry) => entry.key),
    ["blocked", "no_progress"]
  );
});

test("run inventory deltas from cycle evidence pass item_count_gte", () => {
  const socialReport = baseReport({
    runtime_status: "passed",
    cycles: [
      {
        cycle_id: "cycle-0001",
        cycle_goal_ref: "goals/cycle/cycle-0001-goal.json",
        action_ref: "goals/cycle/actor-turn-actions/cycle-0001-actor-turn-action.json",
        provider_input_refs: [],
        provider_output_refs: [],
        evidence_refs: ["evidence/cycle-0001-collect.json"],
        judgment_ref: "judgments/cycle-0001-judgment.json",
        verifier_status: "passed"
      }
    ]
  });

  const bag = adaptSocialCycleReportToEvidenceBag({
    report: socialReport,
    artifactsByRef: {
      "evidence/cycle-0001-collect.json": {
        schema: "actor-evidence/v1",
        evidence_id: "cycle-0001-collect",
        actor_id: actorId,
        category: "tool_attempt",
        created_at: "2026-07-11T00:00:00.000Z",
        tool_attempt: {
          tool: "collect_logs",
          args: {},
          result: {
            status: "collected",
            block: "oak_log",
            afterLogCount: 1,
            inventoryDelta: 1
          }
        }
      }
    }
  });

  assert.equal(bag.inventory?.origin, "run");
  assert.equal(bag.inventory?.value.oak_log, 1);

  const capabilityReport = buildIndividualCapabilityReport({
    suite_id: "individual-capability-v1",
    suite_version: "1.0.0",
    case: baseCase(),
    report: socialReport,
    evidence_bag: bag
  });

  assert.equal(capabilityReport.interpretation_status, "passed");
  assert.equal(capabilityReport.target.status, "passed");
  assert.equal(capabilityReport.runtime_status, "passed");
});
