/** Long-horizon first-iron-batch target and partial-credit regressions. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateCapabilityMilestone,
  evaluateCapabilityPredicate,
  loadIndividualCapabilityManifestFromFile,
  type CapabilityEvidenceBagV1,
  type EvidencedValueV1
} from "../src/benchmarks/capability/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const suitePath = path.join(here, "../benchmarks/capability/individual-capability-v1.json");

function evidenced<T>(value: T, ref: string): EvidencedValueV1<T> {
  return { value, evidence_refs: [ref], origin: "run" };
}

function loadFirstIronCase() {
  const manifest = loadIndividualCapabilityManifestFromFile(suitePath);
  const capabilityCase = manifest.cases.find(
    (entry) => entry.case_id === "prepare_first_iron_batch"
  );
  assert.ok(capabilityCase);
  return capabilityCase;
}

test("first iron batch passes only with the complete ready-to-smelt state", () => {
  const capabilityCase = loadFirstIronCase();
  const bag: CapabilityEvidenceBagV1 = {
    schema: "capability-evidence-bag/v1",
    actor_id: "npc_b",
    inventory: evidenced(
      {
        stone_pickaxe: 1,
        raw_iron: 3,
        coal: 1
      },
      "evidence/final-inventory.json"
    ),
    held_item: evidenced(
      { name: "stone_pickaxe", count: 1 },
      "evidence/final-held-item.json"
    ),
    named_positions: {
      placed_furnace: evidenced(
        { x: 1, y: 64, z: 1 },
        "evidence/place-furnace.json"
      )
    },
    known_blocks: [
      {
        block: "furnace",
        position: { x: 1, y: 64, z: 1 },
        evidence_ref: "evidence/place-furnace.json",
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

  const result = evaluateCapabilityPredicate(capabilityCase.target, bag);

  assert.equal(result.status, "passed");
  assert.deepEqual(
    [...result.evidence_refs].sort(),
    [
      "evidence/final-held-item.json",
      "evidence/final-inventory.json",
      "evidence/place-furnace.json"
    ]
  );
});

test("wooden-tier progress cannot fake readiness without stone pickaxe and raw iron", () => {
  const capabilityCase = loadFirstIronCase();
  const bag: CapabilityEvidenceBagV1 = {
    schema: "capability-evidence-bag/v1",
    actor_id: "npc_b",
    inventory: evidenced(
      {
        wooden_pickaxe: 1,
        cobblestone: 8,
        coal: 1,
        raw_iron: 0
      },
      "evidence/partial-inventory.json"
    ),
    held_item: evidenced(
      { name: "wooden_pickaxe", count: 1 },
      "evidence/partial-held-item.json"
    ),
    available: {
      inventory: true,
      held_item: true,
      position: false,
      blocks: true,
      containers: false
    }
  };

  const target = evaluateCapabilityPredicate(capabilityCase.target, bag);
  const milestoneStatus = Object.fromEntries(
    capabilityCase.milestones.map((milestone) => [
      milestone.milestone_id,
      evaluateCapabilityMilestone(milestone, bag).status
    ])
  );

  assert.equal(target.status, "failed");
  assert.equal(milestoneStatus.first_iron_wooden_pickaxe_present, "passed");
  assert.equal(milestoneStatus.first_iron_coal_inventory, "passed");
  assert.equal(milestoneStatus.first_iron_stone_pickaxe_present, "failed");
  assert.equal(milestoneStatus.first_iron_raw_iron_1, "failed");
  assert.equal(milestoneStatus.first_iron_furnace_placed, "unknown");
});
