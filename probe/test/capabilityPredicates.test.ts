/** Offline predicate evaluation over structured evidence bags. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCapabilityMilestone,
  evaluateCapabilityPredicate,
  type CapabilityEvidenceBagV1,
  type CapabilityPredicateV1,
  type EvidencedValueV1
} from "../src/benchmarks/capability/index.js";

function evidenced<T>(
  value: T,
  evidence_refs: [string, ...string[]],
  origin: "setup" | "run" = "run"
): EvidencedValueV1<T> {
  return { value, evidence_refs, origin };
}

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
      ...available
    },
    ...rest
  };
}

test("item_count_gte passes only with run inventory and real evidence refs", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({
      inventory: evidenced({ oak_log: 2 }, ["evidence/cycle-0001-collect.json"]),
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "passed");
  assert.deepEqual(result.evidence_refs, ["evidence/cycle-0001-collect.json"]);
  assert.equal(result.evidence_refs.includes("settlement:inventory_counts"), false);
});

test("item_count_gte is unknown when inventory lacks source refs", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({
      inventory: {
        value: { oak_log: 1 },
        evidence_refs: [""] as unknown as [string, ...string[]],
        origin: "run"
      },
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "unknown");
  assert.ok((result.missing_evidence ?? []).some((entry) => entry.includes("evidence_refs")));
});

test("item_count_gte fails when inventory is present but count is too low", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 3, owner: "actor" },
    bag({
      inventory: evidenced({ oak_log: 1 }, ["evidence/inventory.json"]),
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "failed");
  assert.deepEqual(result.evidence_refs, ["evidence/inventory.json"]);
  assert.ok((result.reasons ?? []).some((reason) => reason.includes("need >= 3")));
});

test("item_count_gte is unknown when inventory evidence is missing", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({ available: { inventory: false } })
  );
  assert.equal(result.status, "unknown");
  assert.deepEqual(result.missing_evidence, ["inventory"]);
});

test("setup inventory cannot satisfy acquisition targets", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({
      inventory: evidenced({ oak_log: 8 }, ["fixture/setup-inventory.json"], "setup"),
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "unknown");
  assert.ok((result.reasons ?? []).some((reason) => /setup\/fixture/i.test(reason)));
});

test("tool names and prose cannot flip item_count_gte without inventory", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({ available: { inventory: false } })
  );
  assert.equal(result.status, "unknown");
  assert.deepEqual(result.missing_evidence, ["inventory"]);
});

test("provider_rationale-shaped attempts never pass as physical success", () => {
  // evidence_kind_seen removed; bare available flags without evidenced inventory stay unknown.
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
    bag({ available: { inventory: false } })
  );
  assert.notEqual(result.status, "passed");
  assert.equal(result.status, "unknown");
});

test("held_item_is passes, fails, and reports unknown without fabricating refs", () => {
  const predicate: CapabilityPredicateV1 = { op: "held_item_is", item: "crafting_table" };

  const passed = evaluateCapabilityPredicate(
    predicate,
    bag({
      held_item: evidenced({ name: "crafting_table", count: 1 }, ["evidence/held.json"]),
      available: { held_item: true }
    })
  );
  assert.equal(passed.status, "passed");
  assert.deepEqual(passed.evidence_refs, ["evidence/held.json"]);
  assert.equal(passed.evidence_refs.includes("settlement:held_item"), false);

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        held_item: evidenced({ name: "oak_log", count: 1 }, ["evidence/held.json"]),
        available: { held_item: true }
      })
    ).status,
    "failed"
  );

  const missing = evaluateCapabilityPredicate(predicate, bag({ available: { held_item: false } }));
  assert.equal(missing.status, "unknown");
  assert.deepEqual(missing.missing_evidence, ["held_item"]);

  const noRefs = evaluateCapabilityPredicate(
    predicate,
    bag({
      held_item: {
        value: { name: "crafting_table" },
        evidence_refs: ["  "] as unknown as [string, ...string[]],
        origin: "run"
      },
      available: { held_item: true }
    })
  );
  assert.equal(noRefs.status, "unknown");
});

test("block_observed_at resolves run position_ref against run known_blocks", () => {
  const predicate: CapabilityPredicateV1 = {
    op: "block_observed_at",
    block: "crafting_table",
    position_ref: "placed_crafting_table"
  };

  const passed = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: {
        placed_crafting_table: evidenced(
          { x: 1, y: 64, z: 2 },
          ["evidence/place-named.json"]
        )
      },
      known_blocks: [
        {
          block: "crafting_table",
          position: { x: 1, y: 64, z: 2 },
          evidence_ref: "evidence/place-table.json",
          origin: "run"
        }
      ],
      available: { blocks: true }
    })
  );
  assert.equal(passed.status, "passed");
  assert.deepEqual(passed.evidence_refs.sort(), [
    "evidence/place-named.json",
    "evidence/place-table.json"
  ]);

  const setupOnly = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: {
        placed_crafting_table: evidenced({ x: 1, y: 64, z: 2 }, ["fixture/preplaced.json"], "setup")
      },
      known_blocks: [
        {
          block: "crafting_table",
          position: { x: 1, y: 64, z: 2 },
          evidence_ref: "fixture/preplaced.json",
          origin: "setup"
        }
      ],
      available: { blocks: true }
    })
  );
  assert.equal(setupOnly.status, "unknown");

  const missingNamedRefs = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: {
        placed_crafting_table: {
          value: { x: 1, y: 64, z: 2 },
          evidence_refs: [""] as unknown as [string, ...string[]],
          origin: "run"
        }
      },
      known_blocks: [
        {
          block: "crafting_table",
          position: { x: 1, y: 64, z: 2 },
          evidence_ref: "evidence/place-table.json",
          origin: "run"
        }
      ],
      available: { blocks: true }
    })
  );
  assert.equal(missingNamedRefs.status, "unknown");

  const failed = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: {
        placed_crafting_table: evidenced({ x: 1, y: 64, z: 2 }, ["evidence/named.json"])
      },
      known_blocks: [
        {
          block: "chest",
          position: { x: 1, y: 64, z: 2 },
          evidence_ref: "e1",
          origin: "run"
        }
      ],
      available: { blocks: true }
    })
  );
  assert.equal(failed.status, "failed");

  const missingCoords = evaluateCapabilityPredicate(
    predicate,
    bag({
      named_positions: {
        placed_crafting_table: evidenced({ x: 1, y: 64, z: 2 }, ["evidence/named.json"])
      },
      known_blocks: [
        { block: "crafting_table", evidence_ref: "e-unlocated", origin: "run" }
      ],
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

test("position_within requires run actor_position refs and never invents settlement refs", () => {
  const predicate: CapabilityPredicateV1 = {
    op: "position_within",
    center_ref: "spawn",
    radius: 5
  };

  const passed = evaluateCapabilityPredicate(
    predicate,
    bag({
      actor_position: evidenced({ x: 2, y: 64, z: 0 }, ["evidence/observe-pos.json"]),
      named_positions: {
        spawn: evidenced({ x: 0, y: 64, z: 0 }, ["scenario:spawn"], "setup")
      },
      available: { position: true }
    })
  );
  assert.equal(passed.status, "passed");
  assert.equal(passed.evidence_refs.includes("settlement:actor_position"), false);
  assert.ok(passed.evidence_refs.includes("evidence/observe-pos.json"));

  assert.equal(
    evaluateCapabilityPredicate(
      predicate,
      bag({
        actor_position: evidenced({ x: 50, y: 64, z: 0 }, ["evidence/observe-pos.json"]),
        named_positions: {
          spawn: evidenced({ x: 0, y: 64, z: 0 }, ["scenario:spawn"])
        },
        available: { position: true }
      })
    ).status,
    "failed"
  );

  const unknown = evaluateCapabilityPredicate(predicate, bag({ available: { position: false } }));
  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.missing_evidence, ["actor_position"]);
});

test("container_item_count_gte cites container evidence_ref and rejects setup", () => {
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
          evidence_ref: "evidence/chest.json",
          origin: "run"
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
            evidence_ref: "evidence/chest.json",
            origin: "run"
          }
        ],
        available: { containers: true }
      })
    ).status,
    "failed"
  );

  const setup = evaluateCapabilityPredicate(
    predicate,
    bag({
      containers: [
        {
          container_ref: "chest:shared",
          items: { oak_planks: 8 },
          evidence_ref: "fixture/chest.json",
          origin: "setup"
        }
      ],
      available: { containers: true }
    })
  );
  assert.equal(setup.status, "unknown");

  const unknown = evaluateCapabilityPredicate(predicate, bag({ available: { containers: false } }));
  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.missing_evidence, ["containers"]);
});

test("all and any use three-valued Kleene logic and dedupe authoritative refs", () => {
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

  const allFailed = evaluateCapabilityPredicate(
    { op: "all", children: [oak, table] },
    bag({
      inventory: evidenced({ oak_log: 1 }, ["evidence/inv.json"]),
      available: { inventory: true }
    })
  );
  assert.equal(allFailed.status, "failed");
  assert.deepEqual(allFailed.evidence_refs, ["evidence/inv.json"]);

  const allMixedUnknown = evaluateCapabilityPredicate(
    { op: "all", children: [oak, table] },
    bag({ available: { inventory: false } })
  );
  assert.equal(allMixedUnknown.status, "unknown");

  const anyPassed = evaluateCapabilityPredicate(
    { op: "any", children: [oak, table] },
    bag({
      inventory: evidenced({ oak_log: 1 }, ["evidence/inv-a.json", "evidence/inv-a.json"]),
      available: { inventory: true }
    })
  );
  assert.equal(anyPassed.status, "passed");
  assert.deepEqual(anyPassed.evidence_refs, ["evidence/inv-a.json"]);

  const anyUnknown = evaluateCapabilityPredicate(
    { op: "any", children: [oak, table] },
    bag({ available: { inventory: false } })
  );
  assert.equal(anyUnknown.status, "unknown");
});

test("evaluateCapabilityMilestone wraps milestone predicates without settlement fallbacks", () => {
  const result = evaluateCapabilityMilestone(
    {
      milestone_id: "oak_log_inventory",
      title: "Oak log collected",
      predicate: { op: "item_count_gte", item: "oak_log", count: 1, owner: "actor" },
      order: 1,
      weight: 1
    },
    bag({
      inventory: evidenced({ "minecraft:oak_log": 1 }, ["evidence/settlement-inventory.json"]),
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "passed");
  assert.deepEqual(result.evidence_refs, ["evidence/settlement-inventory.json"]);
  assert.equal(result.evidence_refs.includes("settlement:inventory_counts"), false);
});

test("minecraft namespace prefix normalizes for inventory matches", () => {
  const result = evaluateCapabilityPredicate(
    { op: "item_count_gte", item: "minecraft:crafting_table", count: 1, owner: "actor" },
    bag({
      inventory: evidenced({ crafting_table: 1 }, ["evidence/table.json"]),
      available: { inventory: true }
    })
  );
  assert.equal(result.status, "passed");
});
