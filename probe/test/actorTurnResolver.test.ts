/** Regression coverage for Actor Turn output resolution into ActorTurnResolvedAction. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveActorTurnExecutionDraftToAction,
  type ActionCardProjection,
  type ActorTurnExecutionDraft
} from "../src/runtime/goals/actorEpisode/index.js";

function requireResolvedAction(result: ReturnType<typeof resolveActorTurnExecutionDraftToAction>) {
  if (!result.ok) {
    assert.fail(result.errors.join("; "));
  }
  return result.action;
}

const projection: ActionCardProjection = {
  schema: "action-card-projection/v1",
  actor_id: "npc_b",
  action_cards: [
    {
      schema: "action-card/v1",
      action_card_id: "card-place-block",
      title: "Place Block",
      description: "Place an inventory block at an explicit position.",
      parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/place_block.json",
      parameter_hints: ["{itemName:string,targetPosition:{x:number,y:number,z:number}}"],
      current_state_requirements: [
        "inventory has the requested block item",
        "provider supplied an explicit target cell or support surface"
      ],
      expected_evidence: ["block delta"],
      likely_blockers: ["missing itemName", "missing target position"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-place-block.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-craft-item",
      title: "Craft Item",
      description: "Craft an inventory-grid recipe.",
      parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/craft_item.json",
      parameter_hints: ["{itemName:string} for inventory-grid recipes only."],
      current_state_requirements: ["inventory has ingredients for the requested inventory-grid recipe"],
      expected_evidence: ["crafted inventory item"],
      likely_blockers: ["missing itemName", "table-bound recipe"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-craft-item.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-collect-logs",
      title: "Collect Logs",
      description: "Run the actor-owned collect logs action skill.",
      parameters_schema_ref: "actor-action-skills/collectLogs/parameters-schema.json",
      parameter_hints: ["Actor-owned action skill can use empty parameters when preconditions are met."],
      current_state_requirements: [],
      expected_evidence: ["inventory logs increased"],
      likely_blockers: ["no low logs nearby"],
      readiness: "risky",
      runtime_mapping_ref: "action-card-mappings/card-collect-logs.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-craft-with-table",
      title: "Craft With Table",
      description: "Craft a table-bound recipe against a reachable crafting table.",
      parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/craft_with_table.json",
      parameter_hints: ["{itemName:string} for table-bound recipes."],
      current_state_requirements: [
        "nearby loaded world evidence contains a reachable crafting_table block",
        "inventory has ingredients for the requested table-bound recipe"
      ],
      expected_evidence: ["crafted table-bound item"],
      likely_blockers: ["missing exact ingredients"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-craft-with-table.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-craft-crafting-table",
      title: "Craft Crafting Table",
      description: "Craft a crafting table from inventory-grid planks.",
      parameters_schema_ref: "actor-action-skills/craftCraftingTable/parameters-schema.json",
      parameter_hints: ["Empty parameters are allowed only when current_state satisfies recipe counts."],
      current_state_requirements: [
        "inventory has planks >= 4",
        "no usable crafting_table already known",
        "no crafting_table item already carried"
      ],
      expected_evidence: ["crafted crafting_table inventory delta"],
      likely_blockers: ["not enough planks"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-craft-crafting-table.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-inspect-chest",
      title: "Inspect Chest",
      description: "Inspect a nearby shared chest and record container snapshot/openability evidence.",
      parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/inspect_chest.json",
      parameter_hints: ["{} to inspect the nearest known shared chest."],
      current_state_requirements: ["shared chest nearby"],
      expected_evidence: ["container snapshot or blocked openability evidence"],
      likely_blockers: ["shared chest unavailable"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-inspect-chest.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-say",
      title: "Say",
      description: "Speak when communication matters for current relationship or role context.",
      parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/say.json",
      parameter_hints: ["{text:string}"],
      current_state_requirements: ["communication context exists"],
      expected_evidence: ["runtime evidence from say"],
      likely_blockers: ["missing text"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-say.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-place-crafting-table",
      title: "Place Crafting Table",
      description: "Place or approach a crafting table so table recipes become available.",
      parameters_schema_ref: "actor-action-skills/placeCraftingTable/parameters-schema.json",
      parameter_hints: ["Empty parameters are allowed only when current_state satisfies station placement preconditions."],
      current_state_requirements: ["inventory has crafting_table", "no usable crafting_table already known"],
      expected_evidence: ["placed or confirmed reachable crafting_table"],
      likely_blockers: ["missing crafting_table item", "crafting_table already usable"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-place-crafting-table.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-craft-planks-and-sticks",
      title: "Craft Planks And Sticks",
      description: "Craft planks and sticks from inventory logs.",
      parameters_schema_ref: "actor-action-skills/craftPlanksAndSticks/parameters-schema.json",
      parameter_hints: [
        "Empty parameters are preferred; itemName may only name a crafted output such as oak_planks or stick."
      ],
      current_state_requirements: [
        "inventory has logs",
        "basic planks/sticks need not already satisfied"
      ],
      expected_evidence: ["crafted planks or sticks"],
      likely_blockers: ["missing logs"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-craft-planks-and-sticks.json"
    },
    {
      schema: "action-card/v1",
      action_card_id: "card-craft-wooden-pickaxe",
      title: "Craft Wooden Pickaxe",
      description: "Craft a wooden pickaxe from planks and sticks at a reachable crafting table.",
      parameters_schema_ref: "actor-action-skills/craftWoodenPickaxe/parameters-schema.json",
      parameter_hints: ["Empty parameters are allowed only when no wooden_pickaxe is already carried."],
      current_state_requirements: [
        "inventory has planks >= 3",
        "inventory has sticks >= 2",
        "crafting_table nearby",
        "no wooden_pickaxe already carried"
      ],
      expected_evidence: ["wooden_pickaxe inventory increase"],
      likely_blockers: ["missing ingredients", "already carrying wooden_pickaxe"],
      readiness: "requires_current_state_check",
      runtime_mapping_ref: "action-card-mappings/card-craft-wooden-pickaxe.json"
    }
  ],
  runtime_mappings: [
    {
      kind: "use_primitive",
      action_card_id: "card-place-block",
      primitive_id: "place_block"
    },
    {
      kind: "use_primitive",
      action_card_id: "card-craft-item",
      primitive_id: "craft_item"
    },
    {
      kind: "use_action_skill",
      action_card_id: "card-collect-logs",
      action_skill_id: "collectLogs"
    },
    {
      kind: "use_primitive",
      action_card_id: "card-craft-with-table",
      primitive_id: "craft_with_table"
    },
    {
      kind: "use_primitive",
      action_card_id: "card-inspect-chest",
      primitive_id: "inspect_chest"
    },
    {
      kind: "use_primitive",
      action_card_id: "card-say",
      primitive_id: "say"
    },
    {
      kind: "use_action_skill",
      action_card_id: "card-craft-crafting-table",
      action_skill_id: "craftCraftingTable"
    },
    {
      kind: "use_action_skill",
      action_card_id: "card-place-crafting-table",
      action_skill_id: "placeCraftingTable"
    },
    {
      kind: "use_action_skill",
      action_card_id: "card-craft-planks-and-sticks",
      action_skill_id: "craftPlanksAndSticks"
    },
    {
      kind: "use_action_skill",
      action_card_id: "card-craft-wooden-pickaxe",
      action_skill_id: "craftWoodenPickaxe"
    }
  ],
  deferred_counts: {
    primitives: 0,
    action_skills: 0
  },
  missing_affordances: []
};

function resolutionBase() {
  return {
    actorId: "npc_b",
    cycleId: "cycle-0001",
    cycleGoalId: "cycle-goal-0001",
    currentState: {
      schema: "actor-turn-current-state/v1" as const,
      observer_id: "npc_b",
      inventory_counts: { crafting_table: 1 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    actionCardProjection: projection
  };
}

test("Runtime Action Resolver maps use_existing_action cards to primitive ActorTurnResolvedAction", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-place-block",
      parameters: { itemName: "crafting_table", targetPosition: { x: 0, y: 64, z: 1 } },
      why_this_action: "Place the table in a different explicit cell.",
      expected_evidence: ["block delta"],
      fallback_if_blocked: "try another adjacent cell"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_primitive");
  assert.equal(action.primitive_id, "place_block");
  assert.deepEqual(action.parameters, {
    itemName: "crafting_table",
    targetPosition: { x: 0, y: 64, z: 1 }
  });
});

test("Runtime Action Resolver rejects primitive Action Cards with missing required args", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      ...resolutionBase().currentState,
      shared_storage: {
        status: "contributed",
        items: [{ name: "oak_log", count: 1 }],
        evidence_refs: ["evidence/deposit.json"]
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-say",
      parameters: {},
      why_this_action: "Tell npc_a the deposit is done.",
      expected_evidence: ["runtime evidence from say"],
      fallback_if_blocked: "use the recommended text candidate"
    }
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("say requires text")));
});

test("Runtime Action Resolver rejects place_block without an explicit structured target", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      ...resolutionBase().currentState,
      inventory_counts: { crafting_table: 1 }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-place-block",
      parameters: { itemName: "crafting_table" },
      why_this_action: "Try to place a crafting table without a target cell.",
      expected_evidence: ["block delta"],
      fallback_if_blocked: "choose another explicit target"
    }
  });

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("explicit target position"))
  );
});

test("Runtime Action Resolver treats crafting-table placement current-state requirements as advisory", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { crafting_table: 1 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: ["crafting_table=placed at (37, 71, -13)"],
        checklist: [
          {
            id: "crafting_table_known_or_placed",
            status: "satisfied",
            reason: "Crafting table was verified in prior runtime evidence.",
            evidence_ref_count: 1
          }
        ],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-place-crafting-table",
      parameters: {},
      why_this_action: "Try placing the table again.",
      expected_evidence: ["crafting_table still visible"],
      fallback_if_blocked: "craft a table-bound tool instead"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "placeCraftingTable");
  assert.deepEqual(action.parameters, {});
});

test("Runtime Action Resolver does not turn crafting-table proximity requirement text into rejection", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      position: { x: 4.13, y: 85, z: -14.46 },
      inventory_counts: { acacia_planks: 8, stick: 4 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [
          "crafting_table=placed at (-8, 104, 7) distance_from_actor=25.2 usable_now=false"
        ],
        checklist: [
          {
            id: "crafting_table_known_or_placed",
            status: "satisfied",
            reason: "Crafting table was verified in prior runtime evidence.",
            evidence_ref_count: 1
          }
        ],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-wooden-pickaxe",
      parameters: { itemName: "wooden_pickaxe" },
      why_this_action: "Craft a wooden pickaxe at the known table.",
      expected_evidence: ["wooden_pickaxe inventory delta"],
      fallback_if_blocked: "craft or place a local table"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftWoodenPickaxe");
});

test("Runtime Action Resolver allows crafting a new table when the known table is far", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      position: { x: 4.13, y: 85, z: -14.46 },
      inventory_counts: { acacia_planks: 8, stick: 4 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [
          "crafting_table=placed at (-8, 104, 7) distance_from_actor=25.2 usable_now=false"
        ],
        checklist: [
          {
            id: "crafting_table_known_or_placed",
            status: "satisfied",
            reason: "Crafting table was verified in prior runtime evidence.",
            evidence_ref_count: 1
          }
        ],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-crafting-table",
      parameters: {},
      why_this_action: "Craft a local table because the known placed table is not usable now.",
      expected_evidence: ["crafted crafting_table"],
      fallback_if_blocked: "collect logs"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftCraftingTable");
});

test("Runtime Action Resolver maps use_existing_action cards to action skill ActorTurnResolvedAction", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-collect-logs",
      parameters: { targetCount: 2 },
      why_this_action: "Use the actor-owned collection bundle.",
      expected_evidence: ["inventory logs increased"],
      fallback_if_blocked: "record blocker and scout"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "collectLogs");
  assert.deepEqual(action.parameters, { targetCount: 2 });
});

test("Runtime Action Resolver rejects action-skill parameters that fail mapped input_schema", () => {
  const actionCardProjection: ActionCardProjection = {
    ...projection,
    runtime_mappings: projection.runtime_mappings.map((mapping) =>
      mapping.action_card_id === "card-collect-logs" && mapping.kind === "use_action_skill"
        ? {
            ...mapping,
            input_schema: {
              type: "object",
              additionalProperties: false,
              required: ["targetCount"],
              properties: {
                targetCount: { type: "integer", minimum: 1 }
              }
            }
          }
        : mapping
    )
  };
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    actionCardProjection,
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-collect-logs",
      parameters: { targetCount: "two" },
      why_this_action: "Use the actor-owned collection bundle with invalid typed parameters.",
      expected_evidence: ["inventory logs increased"],
      fallback_if_blocked: "provide schema-valid parameters"
    }
  });

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("parameters.targetCount must be an integer"))
  );
});

test("Runtime Action Resolver treats broad planks-and-sticks current-state requirements as advisory", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: {
        spruce_log: 1,
        spruce_planks: 24,
        stick: 4
      },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-planks-and-sticks",
      parameters: {},
      why_this_action: "Craft more generic wood materials.",
      expected_evidence: ["crafted planks or sticks"],
      fallback_if_blocked: "choose the next physical need"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftPlanksAndSticks");
});

test("Runtime Action Resolver keeps planks-and-sticks crafting valid when sticks are still missing", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: {
        spruce_log: 1,
        spruce_planks: 24
      },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-planks-and-sticks",
      parameters: {},
      why_this_action: "Craft sticks from existing wood materials.",
      expected_evidence: ["stick inventory increase"],
      fallback_if_blocked: "choose another prerequisite"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftPlanksAndSticks");
});

test("Runtime Action Resolver rejects unmapped Action Cards", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-missing",
      parameters: {},
      why_this_action: "Try an unmapped card.",
      expected_evidence: ["runtime evidence"],
      fallback_if_blocked: "choose a mapped card"
    }
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("No runtime mapping")));
});

test("Runtime Action Resolver does not reject only because current_state requirement text is unsatisfied", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: {},
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-place-block",
      parameters: { itemName: "crafting_table", targetPosition: { x: 0, y: 64, z: 1 } },
      why_this_action: "Try to place a crafting table that is not in inventory.",
      expected_evidence: ["block delta"],
      fallback_if_blocked: "collect logs and craft a crafting table item"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_primitive");
  assert.equal(action.primitive_id, "place_block");
  assert.deepEqual(action.parameters, {
    itemName: "crafting_table",
    targetPosition: { x: 0, y: 64, z: 1 }
  });
});

test("Runtime Action Resolver leaves recipe count requirements advisory", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { spruce_planks: 2 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-crafting-table",
      parameters: {},
      why_this_action: "Crafting table would help toolmaking.",
      expected_evidence: ["crafted crafting_table"],
      fallback_if_blocked: "craft planks first"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftCraftingTable");
});

test("Runtime Action Resolver leaves usable-table redundancy requirements advisory", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { oak_planks: 4 },
      visible_actors: [],
      nearby_block_hints: [{ name: "crafting_table", distance: 1 }],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: ["crafting_table=nearby at (1, 64, 0)"],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-crafting-table",
      parameters: {},
      why_this_action: "Craft another table even though one is already reachable.",
      expected_evidence: ["crafted crafting_table"],
      fallback_if_blocked: "use the nearby table"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftCraftingTable");
});

test("Runtime Action Resolver leaves carried crafting-table requirements advisory", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { oak_planks: 4, crafting_table: 1 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-crafting-table",
      parameters: {},
      why_this_action: "Craft another table even though one is already carried.",
      expected_evidence: ["crafted crafting_table"],
      fallback_if_blocked: "place the carried table"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftCraftingTable");
});

test("Runtime Action Resolver rejects inventory-grid recipes through table-bound craft_with_table", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { spruce_planks: 4, stick: 8 },
      visible_actors: [],
      nearby_block_hints: [],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-with-table",
      parameters: { itemName: "stick" },
      why_this_action: "Try to craft an inventory-grid recipe through the table-bound primitive.",
      expected_evidence: ["crafted stick"],
      fallback_if_blocked: "use craft_item for inventory-grid recipes"
    }
  });

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) =>
        error.includes("craft_with_table is for table-bound recipes")
      )
  );
});

test("Runtime Action Resolver leaves wooden-pickaxe redundancy requirements advisory", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { oak_planks: 3, stick: 2, wooden_pickaxe: 1 },
      visible_actors: [],
      nearby_block_hints: [{ name: "crafting_table", distance: 1 }],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-wooden-pickaxe",
      parameters: {},
      why_this_action: "Craft another wooden pickaxe even though one is already present.",
      expected_evidence: ["crafted wooden_pickaxe"],
      fallback_if_blocked: "mine stone with the existing pickaxe"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "use_action_skill");
  assert.equal(action.action_skill_id, "craftWoodenPickaxe");
});

test("Runtime Action Resolver does not enforce table-bound inventory counts from current_state text", () => {
  const missingSticks = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { oak_planks: 3, cobblestone: 33, wooden_pickaxe: 1 },
      visible_actors: [],
      nearby_block_hints: [{ name: "crafting_table", distance: 1 }],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-with-table",
      parameters: { itemName: "wooden_pickaxe" },
      why_this_action: "Try to craft another wooden pickaxe.",
      expected_evidence: ["crafted wooden_pickaxe"],
      fallback_if_blocked: "craft sticks first"
    }
  });

  const missingSticksAction = requireResolvedAction(missingSticks);
  assert.equal(missingSticksAction.kind, "use_primitive");
  assert.equal(missingSticksAction.primitive_id, "craft_with_table");

  const furnace = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { cobblestone: 8 },
      visible_actors: [],
      nearby_block_hints: [{ name: "crafting_table", distance: 1 }],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: [],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-with-table",
      parameters: { itemName: "furnace" },
      why_this_action: "Craft a furnace from exact table-bound ingredients.",
      expected_evidence: ["crafted furnace"],
      fallback_if_blocked: "record missing cobblestone"
    }
  });

  const furnaceAction = requireResolvedAction(furnace);
  assert.equal(furnaceAction.kind, "use_primitive");
  assert.equal(furnaceAction.primitive_id, "craft_with_table");
});

test("Runtime Action Resolver requires craft_item itemName but leaves recipe ingredients advisory", () => {
  const state = {
    schema: "actor-turn-current-state/v1" as const,
    observer_id: "npc_b",
    inventory_counts: { oak_planks: 1, stick: 4, cobblestone: 33, wooden_pickaxe: 1 },
    visible_actors: [],
    nearby_block_hints: [],
    shared_storage: { status: "unknown", items: [], evidence_refs: [] },
    deposit_candidates: [],
    settlement_progress: {
      inventory_counts: {},
      shared_storage_status: "unknown",
      known_position_summaries: [],
      checklist: [],
      recent_blockers: []
    }
  };
  const missingItemName = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: state,
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-item",
      parameters: {},
      why_this_action: "Try to craft without naming an item.",
      expected_evidence: ["crafted inventory item"],
      fallback_if_blocked: "provide itemName"
    }
  });
  assert.equal(missingItemName.ok, false);
  assert.ok(
    !missingItemName.ok &&
      missingItemName.errors.some((error) => error.includes("craft_item requires itemName"))
  );

  for (const itemName of ["stick", "oak_planks", "crafting_table"]) {
    const result = resolveActorTurnExecutionDraftToAction({
      ...resolutionBase(),
      currentState: state,
      output: {
        schema: "actor-turn-execution-draft/v1",
        choice: "use_existing_action",
        action_card_id: "card-craft-item",
        parameters: { itemName },
        why_this_action: `Try to craft ${itemName} without exact ingredients.`,
        expected_evidence: [`crafted ${itemName}`],
        fallback_if_blocked: "choose a non-crafting action"
      }
    });
    const action = requireResolvedAction(result);
    assert.equal(action.kind, "use_primitive");
    assert.equal(action.primitive_id, "craft_item");
  }

  const stick = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      ...state,
      inventory_counts: { oak_planks: 2 }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "use_existing_action",
      action_card_id: "card-craft-item",
      parameters: { itemName: "stick" },
      why_this_action: "Craft sticks from exact inventory-grid ingredients.",
      expected_evidence: ["crafted stick"],
      fallback_if_blocked: "use another action"
    }
  });
  const stickAction = requireResolvedAction(stick);
  assert.equal(stickAction.kind, "use_primitive");
  assert.equal(stickAction.primitive_id, "craft_item");
});

test("Runtime Action Resolver maps author_mineflayer_action to generated ActorTurnResolvedAction", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "saySettlementNeed",
      purpose: "Say a concrete settlement need with helper evidence.",
      input_schema: {
        type: "object",
        required: ["text"],
        additionalProperties: false,
        properties: { text: { type: "string" } }
      },
      parameters: { text: "I am blocked placing the crafting table; trying a new cell." },
      source_language: "typescript",
      source: "export async function run(ctx, params) { await ctx.say(params.text); return { status: 'ok' }; }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["say"],
      timeout_ms: 5000,
      verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
      known_failure_modes: ["chat unavailable"],
      promotion_policy: "promote_after_passed_trial",
      why_this_action: "The actor needs a reusable bounded communication action.",
      expected_evidence: ["helper say delivered"],
      fallback_if_blocked: "remember communication blocker"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "author_mineflayer_action");
  assert.equal(action.candidate.proposed_skill_id, "saySettlementNeed");
  assert.deepEqual(action.parameters, {
    text: "I am blocked placing the crafting table; trying a new cell."
  });
});

test("Runtime Action Resolver allows generated shared chest probe when strict authoring guards pass", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: {},
      visible_actors: [],
      nearby_block_hints: [{ name: "chest", distance: 2 }],
      shared_storage: {
        status: "known",
        items: [],
        evidence_refs: ["evidence/cycle-0001-inspect_chest.json"]
      },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "known",
        known_position_summaries: ["shared_chest=inspected at (1, 64, 0)"],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "probeSharedChestOpenability",
      purpose: "Check whether the shared chest can be opened and snapshot the container.",
      input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
      parameters: {},
      source_language: "typescript",
      source: "export async function run(ctx, params) { await ctx.observe({}); return { status: 'checked' }; }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["observe"],
      timeout_ms: 5000,
      verifier: { kind: "helper_event", helper: "observe" },
      known_failure_modes: ["shared chest unavailable"],
      promotion_policy: "promote_after_passed_trial",
      why_this_action: "Probe chest openability.",
      expected_evidence: ["container snapshot"],
      fallback_if_blocked: "use Inspect Chest"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "author_mineflayer_action");
  assert.equal(action.candidate.proposed_skill_id, "probeSharedChestOpenability");
  assert.deepEqual(action.parameters, {});
});

test("Runtime Action Resolver allows generated crafting-table reachability probe when strict authoring guards pass", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    currentState: {
      schema: "actor-turn-current-state/v1",
      observer_id: "npc_b",
      inventory_counts: { oak_planks: 3, stick: 2 },
      visible_actors: [],
      nearby_block_hints: [{ name: "crafting_table", distance: 1 }],
      shared_storage: { status: "unknown", items: [], evidence_refs: [] },
      deposit_candidates: [],
      settlement_progress: {
        inventory_counts: {},
        shared_storage_status: "unknown",
        known_position_summaries: ["crafting_table=nearby at (1, 64, 0)"],
        checklist: [],
        recent_blockers: []
      }
    },
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "checkCraftingTableReachability",
      purpose: "Verify crafting table station reachability before table-bound crafting.",
      input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
      parameters: {},
      source_language: "typescript",
      source: "export async function run(ctx, params) { await ctx.observe({}); return { status: 'checked' }; }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["observe"],
      timeout_ms: 5000,
      verifier: { kind: "helper_event", helper: "observe" },
      known_failure_modes: ["crafting table unavailable"],
      promotion_policy: "promote_after_passed_trial",
      why_this_action: "Probe table reachability.",
      expected_evidence: ["station reachability"],
      fallback_if_blocked: "use Craft With Table or place the carried table"
    }
  });

  const action = requireResolvedAction(result);
  assert.equal(action.kind, "author_mineflayer_action");
  assert.equal(action.candidate.proposed_skill_id, "checkCraftingTableReachability");
  assert.deepEqual(action.parameters, {});
});

test("Runtime Action Resolver rejects invalid generated promotion policy", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "recordOnlyCandidate",
      purpose: "Record only should not become executable intent.",
      input_schema: {
        type: "object",
        required: [],
        additionalProperties: false,
        properties: {}
      },
      parameters: {},
      source_language: "typescript",
      source: "export async function run(ctx, params) { await ctx.wait(1); }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["wait"],
      timeout_ms: 5000,
      verifier: { kind: "helper_event_progress" },
      known_failure_modes: [],
      promotion_policy: "draft_only",
      why_this_action: "Try record-only.",
      expected_evidence: ["candidate record"],
      fallback_if_blocked: "choose executable policy"
    } as unknown as ActorTurnExecutionDraft
  });

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("promote_after_passed_trial"))
  );
});

test("Runtime Action Resolver rejects generated parameters that fail input_schema", () => {
  const result = resolveActorTurnExecutionDraftToAction({
    ...resolutionBase(),
    output: {
      schema: "actor-turn-execution-draft/v1",
      choice: "author_mineflayer_action",
      proposed_action_skill_id: "saySettlementNeed",
      purpose: "Say a concrete settlement need with helper evidence.",
      input_schema: {
        type: "object",
        required: ["text"],
        additionalProperties: false,
        properties: { text: { type: "string" } }
      },
      parameters: {},
      source_language: "typescript",
      source: "export async function run(ctx, params) { await ctx.say(params.text); }",
      helper_api_version: "mineflayer-action-skill-helper/v1",
      helper_allowlist: ["say"],
      timeout_ms: 5000,
      verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
      known_failure_modes: [],
      promotion_policy: "promote_after_passed_trial",
      why_this_action: "Missing text should fail before execution.",
      expected_evidence: ["helper say delivered"],
      fallback_if_blocked: "provide text"
    }
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors.some((error) => error.includes("parameters.text")));
});
