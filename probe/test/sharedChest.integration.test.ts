import assert from "node:assert/strict";
import test from "node:test";

import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import { runAgentLoop } from "../src/runtime/agentLoop.js";
import { validateProposal } from "../src/tools/index.js";
import {
  runtimeControlActionSkill,
  testActionSkillRecord
} from "./helpers/actionSkillRecords.js";

function createPosition(x: number, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    distanceTo(other: { x: number; y: number; z: number }) {
      return Math.hypot(this.x - other.x, this.y - other.y, this.z - other.z);
    }
  };
}

function createBot(username: string, x: number) {
  return {
    username,
    entity: {
      position: createPosition(x)
    }
  };
}

test("agent loop deposits crafted resource into shared chest and stops after public contribution", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_a", 0);
  const target = createBot("npc_b", 2);
  const transcriptSteps: Array<Record<string, unknown>> = [];
  let craftingTableDeposited = false;

  const final = await runAgentLoop({
    bots: { actor, target },
    provider,
    activeActionSkills: [
      runtimeControlActionSkill(),
      testActionSkillRecord("depositSharedItems", [
        "observe",
        "inspect_chest",
        "deposit_shared",
        "wait"
      ])
    ],
    stepDelayMs: 0,
    initialCompletedTaskIds: [
      "collect_4_logs",
      "craft_planks_and_sticks",
      "craft_crafting_table"
    ],
    transcript: {
      recordStep(step) {
        transcriptSteps.push(step as Record<string, unknown>);
      }
    },
    tools: {
      validateProposal,
      async observe() {
        return {
          status: "ok" as const,
          observerId: "npc_b",
          visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
          inventory: craftingTableDeposited
            ? []
            : [
                { name: "oak_log", count: 4 },
                { name: "oak_planks", count: 2 },
                { name: "stick", count: 4 },
                { name: "crafting_table", count: 1 }
              ],
          sharedChest: {
            chestId: "shared-chest-1",
            items: craftingTableDeposited ? [{ name: "crafting_table", count: 1 }] : []
          },
          memory: []
        };
      },
      async move_to() {
        return { tool: "move_to", ok: true, status: "arrived" };
      },
      async collect_logs() {
        return { tool: "collect_logs", ok: true, status: "collected" };
      },
      async craft_item() {
        return { tool: "craft_item", ok: true, status: "crafted" };
      },
      async inspect_chest() {
        return { tool: "inspect_chest", ok: true, status: "inspected" };
      },
      async deposit_shared() {
        craftingTableDeposited = true;
        return { tool: "deposit_shared", ok: true, status: "deposited", movedCount: 1 };
      },
      async withdraw_shared() {
        return { tool: "withdraw_shared", ok: true, status: "withdrew", movedCount: 1 };
      },
      async say() {
        return { tool: "say", ok: true, status: "delivered" };
      },
      async wait() {
        return { tool: "wait", ok: true, status: "waited" };
      },
      async remember({ args }) {
        return { tool: "remember", ok: true, status: "remembered", note: String(args.note) };
      }
    }
  });

  assert.deepEqual(final, {
    status: "success",
    why: "shared chest now has a public resource contribution"
  });
  assert.equal(transcriptSteps[0]?.tool, "observe");
  assert.equal(transcriptSteps[1]?.tool, "deposit_shared");
  assert.equal((transcriptSteps[1]?.task as { id: string }).id, "deposit_shared_materials");
  assert.equal((transcriptSteps[1]?.verification as { status: string }).status, "passed");
  assert.equal(transcriptSteps[2]?.tool, "remember");
});
