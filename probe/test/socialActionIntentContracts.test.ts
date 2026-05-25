import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION,
  validateDirectPrimitiveActionIntentArgs,
  validatePrimitiveActionIntentArgs,
  type ActionIntentPrimitiveArgsContractResult
} from "../src/runtime/goals/actionIntentContracts.js";
import type { ActionIntent } from "../src/runtime/goals/types.js";

function primitiveIntent(input: {
  primitiveId: string;
  args: Record<string, unknown>;
  why?: string;
}): ActionIntent {
  return {
    schema: "action-intent/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "use_primitive",
    primitive_id: input.primitiveId,
    args: input.args,
    why_this_action: input.why ?? "test primitive args",
    expected_evidence: ["tool_attempt"],
    fallback_if_blocked: "remember blocker"
  };
}

function assertRejected(result: ActionIntentPrimitiveArgsContractResult, message: string) {
  if (result.ok) {
    assert.fail(`Expected ${result.primitiveId} contract rejection`);
  }
  assert.equal(result.contractVersion, ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION);
  assert.match(result.error, new RegExp(message));
}

test("move_to rejects prose coordinates when structured args are empty", () => {
  const result = validateDirectPrimitiveActionIntentArgs(
    primitiveIntent({
      primitiveId: "move_to",
      args: {},
      why: "Walk to x=10 y=64 z=12 because the prose mentions a coordinate."
    })
  );

  assertRejected(result, "move_to requires structured args");
});

test("move_to accepts explicit position shapes and records target source", () => {
  const cases = [
    [{ x: 1, y: 64, z: 2 }, "args"],
    [{ position: { x: 1, y: 64, z: 2 } }, "position"],
    [{ targetPosition: { x: 1, y: 64, z: 2 } }, "targetPosition"],
    [{ target_position: { x: 1, y: 64, z: 2 } }, "target_position"]
  ] as const;

  for (const [args, source] of cases) {
    const result = validatePrimitiveActionIntentArgs({ primitiveId: "move_to", args });
    assert.equal(result.ok, true);
    assert.equal(result.primitiveId, "move_to");
    assert.equal(result.contractVersion, ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION);
    assert.equal(result.target?.kind, "position");
    assert.equal(result.target?.source, source);
    assert.deepEqual(result.target?.position, { x: 1, y: 64, z: 2 });
  }
});

test("move_to accepts only explicit bounded scout args", () => {
  const result = validatePrimitiveActionIntentArgs({
    primitiveId: "move_to",
    args: { direction: "north", distance: 12 }
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.target, {
    kind: "scout",
    source: "direction_distance",
    direction: "north",
    distance: 12
  });

  assertRejected(
    validatePrimitiveActionIntentArgs({ primitiveId: "move_to", args: { direction: "north" } }),
    "direction and distance"
  );
  assertRejected(
    validatePrimitiveActionIntentArgs({
      primitiveId: "move_to",
      args: { direction: "north", distance: 13 }
    }),
    "distance 2..12"
  );
  assertRejected(
    validatePrimitiveActionIntentArgs({
      primitiveId: "move_to",
      args: { direction: "up", distance: 4 }
    }),
    "direction and distance"
  );
});

test("physical primitives reject hidden executor defaults", () => {
  const rejectedCases = [
    ["place_block", { itemName: "dirt" }, "target position"],
    ["place_block", { targetPosition: { x: 1, y: 64, z: 0 } }, "itemName or blockName"],
    ["build_pattern", {}, "anchor, position, or targetPosition"],
    ["mine_block", {}, "blockName"],
    ["deposit_shared", { itemName: "minecraft_item" }, "count or targetCount"],
    ["withdraw_shared", {}, "itemName"],
    ["withdraw_shared", { itemName: "minecraft_item" }, "count or targetCount"],
    ["say", {}, "text"]
  ] as const;

  for (const [primitiveId, args, message] of rejectedCases) {
    assertRejected(validatePrimitiveActionIntentArgs({ primitiveId, args }), message);
  }
});

test("placement and building primitives accept explicit executable args", () => {
  assert.equal(
    validatePrimitiveActionIntentArgs({
      primitiveId: "place_block",
      args: { itemName: "dirt", targetPosition: { x: 1, y: 64, z: 0 } }
    }).ok,
    true
  );
  assert.equal(
    validatePrimitiveActionIntentArgs({
      primitiveId: "place_block",
      args: { blockName: "crafting_table", position: { x: 2, y: 64, z: 0 } }
    }).ok,
    true
  );

  for (const args of [
    { anchor: { x: 4, y: 64, z: 4 } },
    { position: { x: 4, y: 64, z: 4 } },
    { targetPosition: { x: 4, y: 64, z: 4 } }
  ]) {
    assert.equal(validatePrimitiveActionIntentArgs({ primitiveId: "build_pattern", args }).ok, true);
  }
});

test("craft primitives require itemName unless actionSkillId fallback is present", () => {
  for (const primitiveId of ["craft_item", "craft_with_table"] as const) {
    assertRejected(
      validatePrimitiveActionIntentArgs({ primitiveId, args: {} }),
      "requires itemName"
    );
    assert.equal(
      validatePrimitiveActionIntentArgs({ primitiveId, args: { itemName: "stick" } }).ok,
      true
    );
    assert.equal(
      validatePrimitiveActionIntentArgs({
        primitiveId,
        args: { actionSkillId: "craftPlanksAndSticks" }
      }).ok,
      true
    );
    assert.equal(
      validatePrimitiveActionIntentArgs({
        primitiveId,
        args: {},
        actionSkillId: "craftPlanksAndSticks"
      }).ok,
      true
    );
  }
});

test("provider-direct primitive validation cannot spoof action-skill fallback args", () => {
  assertRejected(
    validateDirectPrimitiveActionIntentArgs(
      primitiveIntent({
        primitiveId: "place_block",
        args: { actionSkillId: "placeCraftingTable" }
      })
    ),
    "itemName or blockName"
  );

  assert.equal(
    validatePrimitiveActionIntentArgs({
      primitiveId: "place_block",
      args: { actionSkillId: "placeCraftingTable" }
    }).ok,
    true
  );

  assertRejected(
    validateDirectPrimitiveActionIntentArgs(
      primitiveIntent({
        primitiveId: "deposit_shared",
        args: { actionSkillId: "depositSharedItems" }
      })
    ),
    "itemName"
  );
});

test("direct shared transfer primitives require explicit positive counts", () => {
  assertRejected(
    validatePrimitiveActionIntentArgs({
      primitiveId: "deposit_shared",
      args: { itemName: "minecraft_item" }
    }),
    "count or targetCount"
  );
  assertRejected(
    validatePrimitiveActionIntentArgs({
      primitiveId: "withdraw_shared",
      args: { itemName: "minecraft_item", count: 0 }
    }),
    "count or targetCount"
  );
  assert.equal(
    validatePrimitiveActionIntentArgs({
      primitiveId: "deposit_shared",
      args: { itemName: "minecraft_item", count: 2 }
    }).ok,
    true
  );
  assert.equal(
    validatePrimitiveActionIntentArgs({
      primitiveId: "withdraw_shared",
      args: { itemName: "minecraft_item", targetCount: 1 }
    }).ok,
    true
  );
  assert.equal(
    validatePrimitiveActionIntentArgs({
      primitiveId: "deposit_shared",
      args: { actionSkillId: "depositSharedItems" }
    }).ok,
    true
  );
});

test("wait and remember keep existing permissive arg behavior", () => {
  assert.equal(validatePrimitiveActionIntentArgs({ primitiveId: "wait", args: {} }).ok, true);
  assert.equal(validatePrimitiveActionIntentArgs({ primitiveId: "remember", args: {} }).ok, true);
});
