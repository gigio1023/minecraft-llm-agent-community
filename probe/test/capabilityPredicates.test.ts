/** Offline predicate evaluation over structured evidence bags. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCapabilityMilestone,
  evaluateCapabilityPredicate,
  type CapabilityEvidenceBagV1,
  type CapabilityPredicateV1
} from "../src/benchmarks/capability/index.js";

function bag(
  partial: Omit<Partial<CapabilityEvidenceBagV1>, "available"> & {
    available?: Partial<CapabilityEvidenceBagV1["available"]>;
  } = {}
): CapabilityEvidenceBagV1 {
  const { available, ...rest } = partial;
  return {
    schema: "capability-evidence-bag/v1",
    actor_id: "npc_a",
    available: {
      inventory: false,
      held_item: false,
      position: false,
      blocks: false,
      containers: false,
      facts: false,
      ...available
    },
    ...rest
  };
}

test("item_count_gte passes with inventory evidence refs", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({
      inventory_counts: { oak_log: 2 },
      facts: [
        {
          evidence_ref: "evidence/cycle-0001-collect.json",
          kind: "tool_attempt",
          item: "oak_log",
          status: "collected"
        }
      ],
      available: { inventory: true, facts: true }
    })
  );
  assert.equal(result.status, "passed");
  assert.deepEqual(result.evidence_refs, ["evidence/cycle-0001-collect.json"]);
});

test("item_count_gte fails when inventory is present but count is too low", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 3, owner: "actor" },
    bag({
      inventory_counts: { oak_log: 1 },
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "failed");
  assert.ok((result.reasons ?? []).some((reason) => reason.includes("need >= 3")));
});

test("item_count_gte is unknown when inventory evidence is missing", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({ available: { inventory: false } })
  );
  assert.equal(result.status, "unknown");
  assert.deepEqual(result.missing_evidence, ["inventory_counts"]);
});

test("tool names and prose cannot flip item_count_gte without inventory", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({
      facts: [
        {
          evidence_ref: "evidence/prose.json",
          kind: "provider_rationale",
          tool: "collect_logs",
          text: "I successfully collected oak logs"
        }
      ],
      available: { inventory: false, facts: true }
    })
  );
  assert.equal(result.status, "unknown");
  assert.deepEqual(result.missing_evidence, ["inventory_counts"]);
});

test("held_item_is passes, fails, and reports unknown", () => {
  const predicate: CapabilityPredicateV1 = { op: "held_item_is", item: "crafting_table" };

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        held_item: { name: "crafting_table", count: 1 },
        available: { held_item: true }
      })
    ).status,
    "passed"
  );

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        held_item: { name: "oak_log", count: 1 },
        available: { held_item: true }
      })
    ).status,
    "failed"
  );

  const missing = evaluateCapabilityPredicate(predicate, bag({ available: { held_item: false } }));
  assert.equal(missing.status, "unknown");
  assert.deepEqual(missing.missing_evidence, ["held_item"]);
});

test("block_observed_at resolves symbolic position_ref against known_blocks", () => {
  const predicate: CapabilityPredicateV1 = {
    op: "block_observed_at",
    block: "crafting_table",
    position_ref: "placed_crafting_table"
  };

  const passed = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: {
        placed_crafting_table: { x: 1, y: 64, z: 2, evidence_ref: "settlement:named_positions" }
      },
      known_blocks: [
        {
          block: "crafting_table",
          position: { x: 1, y: 64, z: 2 },
          evidence_ref: "evidence/place-table.json"
        }
      ],
      available: { blocks: true }
    })
  );
  assert.equal(passed.status, "passed");
  assert.deepEqual(passed.evidence_refs, ["evidence/place-table.json"]);

  const failed = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: { placed_crafting_table: { x: 1, y: 64, z: 2 } },
      known_blocks: [{ block: "chest", position: { x: 1, y: 64, z: 2 }, evidence_ref: "e1" }],
      available: { blocks: true }
    })
  );
  assert.equal(failed.status, "failed");

  const missingCoords = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: { placed_crafting_table: { x: 1, y: 64, z: 2 } },
      known_blocks: [{ block: "crafting_table", evidence_ref: "e-unlocated" }],
      available: { blocks: true }
    })
  );
  assert.equal(missingCoords.status, "unknown");
  assert.ok(
    (missingCoords.missing_evidence ?? []).some((entry) => entry.includes("known_blocks.position"))
  );

  const unknown = evaluateCapabilityPredicate(predicate, bag({ available: { blocks: false } }));
  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.missing_evidence, ["known_blocks"]);
});

test("position_within uses named center_ref and actor_position", () => {
  const predicate: CapabilityPredicateV1 = {
    op: "position_within",
    center_ref: "spawn",
    radius: 5
  };

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        actor_position: { x: 2, y: 64, z: 0 },
        named_positions: { spawn: { x: 0, y: 64, z: 0, evidence_ref: "scenario:spawn" } },
        available: { position: true }
      })
    ).status,
    "passed"
  );

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        actor_position: { x: 50, y: 64, z: 0 },
        named_positions: { spawn: { x: 0, y: 64, z: 0 } },
        available: { position: true }
      })
    ).status,
    "failed"
  );

  const unknown = evaluateCapabilityPredicate(predicate, bag({ available: { position: false } }));
  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.missing_evidence, ["actor_position"]);
});

test("container_item_count_gte cites container evidence_ref", () => {
  const predicate: CapabilityPredicateV1 = {
    op: "container_item_count_gte",
    container_ref: "chest:shared",
    item: "oak_planks",
    count: 4
  };

  const passed = evaluateCapabilityPredicate(
    predicate,
    bag({
      containers: [
        {
          container_ref: "chest:shared",
          items: { oak_planks: 8 },
          evidence_ref: "evidence/chest.json"
        }
      ],
      available: { containers: true }
    })
  );
  assert.equal(passed.status, "passed");
  assert.deepEqual(passed.evidence_refs, ["evidence/chest.json"]);

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        containers: [
          {
            container_ref: "chest:shared",
            items: { oak_planks: 1 },
            evidence_ref: "evidence/chest.json"
          }
        ],
        available: { containers: true }
      })
    ).status,
    "failed"
  );

  const unknown = evaluateCapabilityPredicate(predicate, bag({ available: { containers: false } }));
  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.missing_evidence, ["containers"]);
});

test("evidence_kind_seen matches typed constraints only", () => {
  const predicate: CapabilityPredicateV1 = {
    op: "evidence_kind_seen",
    evidence_kind: "tool_attempt",
    constraints: { tool: "place_block", block: "crafting_table", status: "placed" }
  };

  const passed = evaluateCapabilityPredicate(
    predicate,
    bag({
      facts: [
        {
          evidence_ref: "evidence/place.json",
          kind: "tool_attempt",
          tool: "place_block",
          block: "crafting_table",
          status: "placed"
        }
      ],
      available: { facts: true }
    })
  );
  assert.equal(passed.status, "passed");
  assert.deepEqual(passed.evidence_refs, ["evidence/place.json"]);

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        facts: [
          {
            evidence_ref: "evidence/chat.json",
            kind: "tool_attempt",
            tool: "place_block",
            block: "crafting_table",
            status: "failed"
          }
        ],
        available: { facts: true }
      })
    ).status,
    "failed"
  );

  const unknown = evaluateCapabilityPredicate(predicate, bag({ available: { facts: false } }));
  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.missing_evidence, ["facts"]);
});

test("all and any use three-valued Kleene logic", () => {
  const oak: CapabilityPredicateV1 = {
    op: "item_count_gte",
    item: "oak_log",
    count: 1,
    owner: "actor"
  };
  const table: CapabilityPredicateV1 = {
    op: "item_count_gte",
    item: "crafting_table",
    count: 1,
    owner: "actor"
  };

  const allUnknown = evaluateCapabilityPredicate(
    { op: "all", children: [oak, table] },
    bag({
      inventory_counts: { oak_log: 1 },
      available: { inventory: true }
    })
  );
  // table missing from inventory counts → failed (count 0), not unknown
  assert.equal(allUnknown.status, "failed");

  const allMixedUnknown = evaluateCapabilityPredicate(
    { op: "all", children: [oak, table] },
    bag({
      inventory_counts: { oak_log: 1 },
      available: { inventory: false }
    })
  );
  assert.equal(allMixedUnknown.status, "unknown");

  const anyPassed = evaluateCapabilityPredicate(
    { op: "any", children: [oak, table] },
    bag({
      inventory_counts: { oak_log: 1 },
      available: { inventory: true }
    })
  );
  assert.equal(anyPassed.status, "passed");

  const anyUnknown = evaluateCapabilityPredicate(
    { op: "any", children: [oak, table] },
    bag({ available: { inventory: false } })
  );
  assert.equal(anyUnknown.status, "unknown");
});

test("evaluateCapabilityMilestone wraps milestone predicates", () => {
  const result = evaluateCapabilityMilestone(
    {
      milestone_id: "oak_log_inventory",
      title: "Oak log collected",
      predicate: { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
      order: 1,
      weight: 1
    },
    bag({
      inventory_counts: { "minecraft:oak_log": 1 },
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "passed");
  assert.deepEqual(result.evidence_refs, ["settlement:inventory_counts"]);
});

test("minecraft namespace prefix normalizes for inventory matches", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "minecraft:crafting_table", count: 1, owner: "actor" },
    bag({
      inventory_counts: { crafting_table: 1 },
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "passed");
});
