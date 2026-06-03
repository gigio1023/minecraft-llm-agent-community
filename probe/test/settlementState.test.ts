import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSettlementState,
  evaluateSocialActionSkillPostcondition,
  type ToolResultRecord
} from "../src/runtime/settlement/settlementState.js";

test("settlement state absorbs crafting_table evidence from worldStateSummary", () => {
  const state = buildSettlementState({
    actorId: "npc_b",
    activeActionSkills: [],
    previousJudgments: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 42.5, y: 79, z: 86.5 },
      inventory: [],
      nearbyBlocks: [{ name: "chest", distance: 1.58 }],
      worldStateSummary: {
        schema: "world-state-summary/v1",
        block_observations: {
          total_verified: 64,
          truncated: true,
          by_name: [
            {
              name: "crafting_table",
              count: 1,
              nearest: [
                {
                  name: "crafting_table",
                  position: { x: 40, y: 79, z: 86 },
                  distance: 2.55
                }
              ]
            }
          ]
        }
      }
    },
    evidenceRefs: ["evidence/cycle-0003-action-02-observe.json"],
    now: "2026-06-03T00:00:00.000Z"
  });

  assert.equal(state.progress.has_crafting_table, true);
  assert.equal(state.known_positions.crafting_table?.status, "nearby");
  assert.deepEqual(state.known_positions.crafting_table?.position, { x: 40, y: 79, z: 86 });
  assert.deepEqual(
    state.checklist.items.find((item) => item.id === "crafting_table_known_or_placed")?.evidence_refs,
    ["evidence/cycle-0003-action-02-observe.json"]
  );
});

test("settlement state carries shared chest deposit evidence into known position state", () => {
  const state = buildSettlementState({
    actorId: "npc_b",
    activeActionSkills: [],
    previousJudgments: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: []
    },
    recentToolResults: [
      {
        tool: "deposit_shared",
        status: "deposited",
        evidence_ref: "evidence/cycle-0007-action-01-deposit_shared.json",
        result: {
          status: "deposited",
          chestId: "shared_spawn_chest",
          itemName: "spruce_planks",
          movedCount: 2
        }
      }
    ],
    now: "2026-06-03T00:00:00.000Z"
  });

  assert.equal(state.shared_storage.status, "contributed");
  assert.equal(state.shared_storage.chest_id, "shared_spawn_chest");
  assert.deepEqual(state.shared_storage.items, [{ name: "spruce_planks", count: 2 }]);
  assert.equal(state.known_positions.shared_chest?.status, "contributed");
  assert.equal(state.known_positions.shared_chest?.chest_id, "shared_spawn_chest");
  assert.deepEqual(state.known_positions.shared_chest?.evidence_refs, [
    "evidence/cycle-0007-action-01-deposit_shared.json"
  ]);
});

test("shared-storage handoff is evaluable from verified deposit evidence", () => {
  const toolResults: ToolResultRecord[] = [
    {
      tool: "deposit_shared",
      status: "deposited",
      evidence_ref: "evidence/cycle-0001-action-01-deposit_shared.json",
      result: {
        status: "deposited",
        chestId: "shared_spawn_chest",
        itemName: "oak_log",
        movedCount: 4
      }
    },
    {
      tool: "say",
      status: "delivered",
      evidence_ref: "evidence/cycle-0001-action-02-say.json",
      result: {
        status: "delivered",
        targetId: "npc_a"
      }
    }
  ];
  const evidenceRefs = toolResults
    .map((entry) => entry.evidence_ref)
    .filter((entry): entry is string => Boolean(entry));
  const postcondition = evaluateSocialActionSkillPostcondition({
    actionSkillId: "handoffItemAtChest",
    toolResults,
    evidenceRefs
  });

  assert.equal(postcondition.status, "passed");
  assert.ok(postcondition.checklist_item_ids.includes("shared_storage_contribution"));

  const state = buildSettlementState({
    actorId: "npc_b",
    activeActionSkills: [],
    previousJudgments: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      position: { x: 0, y: 64, z: 0 },
      inventory: []
    },
    recentToolResults: toolResults,
    postconditionResults: [postcondition],
    evidenceRefs,
    now: "2026-06-03T00:00:00.000Z"
  });

  assert.equal(state.progress.has_shared_storage_contribution, true);
  assert.equal(state.shared_storage.status, "contributed");
  assert.equal(state.shared_storage.chest_id, "shared_spawn_chest");
  assert.deepEqual(state.shared_storage.items, [{ name: "oak_log", count: 4 }]);
  assert.equal(state.known_positions.shared_chest?.status, "contributed");
  assert.deepEqual(
    state.checklist.items.find((item) => item.id === "shared_storage_contribution")?.evidence_refs,
    evidenceRefs
  );
});
