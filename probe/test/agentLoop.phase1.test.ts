import assert from "node:assert/strict";
import { test } from "bun:test";

import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import { runAgentLoop } from "../src/runtime/agentLoop.js";
import { validateProposal } from "../src/tools/index.js";

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

test("agent loop repeats move_to until the current approach task is verified", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_a", 0);
  const target = createBot("npc_b", 4);
  const transcriptSteps: Array<Record<string, unknown>> = [];
  let moveToCalls = 0;

  const final = await runAgentLoop({
    bots: { actor, target },
    provider,
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
          visibleActors: [
            {
              id: "npc_b",
              distance: Number(actor.entity.position.distanceTo(target.entity.position).toFixed(2)),
              busy: false
            }
          ],
          memory: []
        };
      },
      async move_to() {
        moveToCalls += 1;

        if (moveToCalls === 1) {
          actor.entity.position.x = 2;
          return { tool: "move_to", ok: true, status: "moved" };
        }

        actor.entity.position.x = 3;
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
        return { tool: "deposit_shared", ok: true, status: "deposited" };
      },
      async withdraw_shared() {
        return { tool: "withdraw_shared", ok: true, status: "withdrew" };
      },
      async say() {
        return { tool: "say", ok: true, status: "delivered" };
      },
      async wait() {
        return { tool: "wait", ok: true, status: "waited" };
      },
      async remember() {
        return { tool: "remember", ok: true, status: "remembered", note: "npc_b responded after one busy turn" };
      }
    }
  });

  assert.deepEqual(final, {
    status: "success",
    why: "npc_b responded after one busy turn"
  });
  assert.equal(moveToCalls, 2);
  assert.deepEqual(
    transcriptSteps.map((step) => step.tool),
    ["observe", "move_to", "move_to", "say", "remember"]
  );
  assert.equal((transcriptSteps[1]?.verification as { status: string }).status, "progressing");
  assert.equal((transcriptSteps[2]?.verification as { status: string }).status, "passed");
});

test("agent loop blocks the fourth repeated failed move_to for the active approach task", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_a", 0);
  const target = createBot("npc_b", 4);
  const transcriptSteps: Array<Record<string, unknown>> = [];
  let moveToCalls = 0;

  const final = await runAgentLoop({
    bots: { actor, target },
    provider,
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
          visibleActors: [
            {
              id: "npc_b",
              distance: 4,
              busy: false
            }
          ],
          memory: []
        };
      },
      async move_to() {
        moveToCalls += 1;
        return { tool: "move_to", ok: true, status: "moved" };
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
        return { tool: "deposit_shared", ok: true, status: "deposited" };
      },
      async withdraw_shared() {
        return { tool: "withdraw_shared", ok: true, status: "withdrew" };
      },
      async say() {
        return { tool: "say", ok: true, status: "delivered" };
      },
      async wait() {
        return { tool: "wait", ok: true, status: "waited" };
      },
      async remember() {
        return { tool: "remember", ok: true, status: "remembered", note: "approach to npc_b was blocked repeatedly" };
      }
    }
  });

  assert.deepEqual(final, {
    status: "success",
    why: "approach to npc_b was blocked repeatedly"
  });
  assert.equal(moveToCalls, 3);
  assert.deepEqual(
    transcriptSteps.map((step) => step.tool),
    ["observe", "move_to", "move_to", "move_to", "move_to", "remember"]
  );
  assert.equal((transcriptSteps[4]?.result as { status: string }).status, "blocked");
  assert.equal((transcriptSteps[4]?.verification as { status: string }).status, "failed");
});

test("agent loop advances through collect logs, craft materials, and craft crafting table in order", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_a", 0);
  const target = createBot("npc_b", 2);
  const transcriptSteps: Array<Record<string, unknown>> = [];
  const inventory = new Map<string, number>();

  const readInventory = () => [...inventory.entries()].map(([name, count]) => ({ name, count }));

  const final = await runAgentLoop({
    bots: { actor, target },
    provider,
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
          visibleActors: [
            {
              id: "npc_b",
              distance: 2,
              busy: false
            }
          ],
          inventory: readInventory(),
          memory: []
        };
      },
      async move_to() {
        return { tool: "move_to", ok: true, status: "arrived" };
      },
      async collect_logs() {
        inventory.set("oak_log", 4);
        return { tool: "collect_logs", ok: true, status: "collected" };
      },
      async craft_item({ args }) {
        const itemName = String(args.itemName);

        if (itemName === "planks") {
          inventory.set("oak_log", 3);
          inventory.set("oak_planks", 4);
          return { tool: "craft_item", ok: true, status: "crafted", itemName: "oak_planks" };
        }

        if (itemName === "stick") {
          inventory.set("oak_planks", 2);
          inventory.set("stick", 4);
          return { tool: "craft_item", ok: true, status: "crafted", itemName: "stick" };
        }

        inventory.set("oak_planks", 0);
        inventory.set("crafting_table", 1);
        return { tool: "craft_item", ok: true, status: "crafted", itemName: "crafting_table" };
      },
      async inspect_chest() {
        return { tool: "inspect_chest", ok: true, status: "inspected" };
      },
      async deposit_shared() {
        return { tool: "deposit_shared", ok: true, status: "deposited" };
      },
      async withdraw_shared() {
        return { tool: "withdraw_shared", ok: true, status: "withdrew" };
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
    why: "crafted the first early-game workstation"
  });
  const distinctTaskIds = transcriptSteps
    .map((step) => (step.task as { id: string } | undefined)?.id ?? null)
    .filter((taskId, index, values) => index === 0 || taskId !== values[index - 1]);

  assert.deepEqual(distinctTaskIds, [
    "collect_4_logs",
    "craft_planks_and_sticks",
    "craft_crafting_table",
    null
  ]);
  assert.equal(transcriptSteps.some((step) => step.tool === "collect_logs"), true);
  assert.equal(
    transcriptSteps.filter((step) => step.tool === "craft_item").length >= 2,
    true
  );
  assert.equal(transcriptSteps[transcriptSteps.length - 1]?.tool, "remember");
});
