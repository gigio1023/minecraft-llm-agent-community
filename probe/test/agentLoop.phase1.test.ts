import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import { runAgentLoop } from "../src/runtime/agentLoop.js";
import { validateProposal } from "../src/tools/index.js";
import {
  runtimeControlActionSkill,
  testActionSkillRecord
} from "./helpers/actionSkillRecords.js";

const here = path.dirname(fileURLToPath(import.meta.url));

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
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `agent-loop-attempt-evidence-${process.pid}-${Date.now()}`
  );

  try {
    const final = await runAgentLoop({
      bots: { actor, target },
      provider,
      activeActionSkills: [
        runtimeControlActionSkill(),
        testActionSkillRecord("approachAndRequestItem", ["observe", "move_to", "say", "wait"])
      ],
      artifacts: {
        actorWorkspaceRootDir: rootDir
      },
      stepDelayMs: 0,
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

    const evidenceDir = path.join(rootDir, "npc_a", "evidence");
    const evidenceFiles = await fs.readdir(evidenceDir);
    assert.ok(evidenceFiles.includes("turn-turn-0003.json"));
    assert.ok(evidenceFiles.includes("tool-attempt-turn-0003-move_to.json"));

    const attempt = JSON.parse(
      await fs.readFile(path.join(evidenceDir, "tool-attempt-turn-0003-move_to.json"), "utf8")
    );
    assert.equal(attempt.schema, "actor-evidence/v1");
    assert.equal(attempt.category, "tool_attempt");
    assert.equal(attempt.tool_attempt.tool, "move_to");
    assert.equal(attempt.data.verification.status, "passed");
    assert.deepEqual(attempt.pre_position, { x: 2, y: 0, z: 0 });
    assert.deepEqual(attempt.post_position, { x: 3, y: 0, z: 0 });
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
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
    activeActionSkills: [
      runtimeControlActionSkill(),
      testActionSkillRecord("approachAndRequestItem", ["observe", "move_to", "say", "wait"])
    ],
    stepDelayMs: 0,
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
    status: "failed",
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

test("agent loop does not assign collect_logs to a role that cannot gather", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_a", 0);
  const target = createBot("npc_b", 2);
  const transcriptSteps: Array<Record<string, unknown>> = [];

  const final = await runAgentLoop({
    bots: { actor, target },
    roleId: "quartermaster",
    provider,
    activeActionSkills: [
      runtimeControlActionSkill(),
      testActionSkillRecord("inspectSharedChest", ["observe", "inspect_chest", "wait"])
    ],
    stepDelayMs: 0,
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
          visibleActors: [],
          inventory: [],
          memory: []
        };
      },
      async move_to() {
        return { tool: "move_to", ok: false, status: "blocked" };
      },
      async collect_logs() {
        throw new Error("quartermaster must not receive collect_logs");
      },
      async craft_item() {
        return { tool: "craft_item", ok: false, status: "blocked" };
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
    why: "no visible actor was available for the next social step"
  });
  assert.deepEqual(
    transcriptSteps.map((step) => step.tool),
    ["observe", "remember"]
  );
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
    activeActionSkills: [
      runtimeControlActionSkill(),
      testActionSkillRecord("collectLogs", ["observe", "collect_logs", "wait"]),
      testActionSkillRecord("craftPlanksAndSticks", ["observe", "craft_item", "wait"]),
      testActionSkillRecord("craftCraftingTable", ["observe", "craft_item", "wait"])
    ],
    stepDelayMs: 0,
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

test("agent loop writes actor evidence when collect_logs only pretends to progress", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_b", 0);
  const target = createBot("npc_a", 2);
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `agent-loop-evidence-${process.pid}-${Date.now()}`
  );

  try {
    const final = await runAgentLoop({
      bots: { actor, target },
      roleId: "gatherer",
      provider,
      activeActionSkills: [
        runtimeControlActionSkill("npc_b"),
        testActionSkillRecord("collectLogs", ["observe", "collect_logs", "wait"], "npc_b")
      ],
      transcript: {
        recordStep() {}
      },
      stepDelayMs: 0,
      artifacts: {
        actorWorkspaceRootDir: rootDir
      },
      tools: {
        validateProposal,
        async observe() {
          return {
            status: "ok" as const,
            visibleActors: [],
            inventory: [{ name: "oak_log", count: 0 }],
            nearbyBlocks: [{ name: "oak_log", distance: 3 }],
            memory: []
          };
        },
        async move_to() {
          return { tool: "move_to", ok: false, status: "blocked" };
        },
        async collect_logs() {
          return { tool: "collect_logs", ok: true, status: "pathing_started" };
        },
        async craft_item() {
          return { tool: "craft_item", ok: false, status: "blocked" };
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
      status: "failed",
      why: "collect_4_logs was blocked repeatedly"
    });

    const evidenceDir = path.join(rootDir, "npc_b", "evidence");
    const evidenceFiles = await fs.readdir(evidenceDir);
    assert.ok(evidenceFiles.some((file) => file.includes("fake-progress")));

    const fakeProgressFile = evidenceFiles.find((file) => file.includes("fake-progress"));
    assert.ok(fakeProgressFile);
    const stored = JSON.parse(await fs.readFile(path.join(evidenceDir, fakeProgressFile), "utf8"));
    assert.equal(stored.actor_id, "npc_b");
    assert.equal(stored.category, "fake_progress_rejection");
    assert.equal(stored.data.task.id, "collect_4_logs");
    assert.equal(stored.data.tool, "collect_logs");
    assert.equal(stored.data.verification.status, "failed");

    const reviewQueueDir = path.join(rootDir, "npc_b", "reviews", "queue");
    const reviewJobs = await fs.readdir(reviewQueueDir);
    const fakeProgressReviewJob = reviewJobs.find((file) => file.includes("fake-progress"));
    assert.ok(fakeProgressReviewJob);
    const reviewJob = JSON.parse(
      await fs.readFile(path.join(reviewQueueDir, fakeProgressReviewJob), "utf8")
    );
    assert.equal(reviewJob.schema, "actor-review-job/v1");
    assert.equal(reviewJob.actor_id, "npc_b");
    assert.equal(reviewJob.reason, "fake_progress_rejection");
    assert.deepEqual(
      reviewJob.active_action_skill_snapshot.map((skill: { skill_id: string }) => skill.skill_id),
      ["collectLogs", "runtimeObserveAndRemember"]
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("agent loop blocks provider proposals not backed by actor workspace active action skills", async () => {
  const provider = createDeterministicProvider();
  const actor = createBot("npc_a", 0);
  const target = createBot("npc_b", 2);
  const transcriptSteps: Array<Record<string, unknown>> = [];
  let collectLogCalls = 0;

  const final = await runAgentLoop({
    bots: { actor, target },
    roleId: "gatherer",
    provider,
    activeActionSkills: [
      runtimeControlActionSkill()
    ],
    stepDelayMs: 0,
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
          visibleActors: [],
          inventory: [{ name: "oak_log", count: 0 }],
          memory: []
        };
      },
      async move_to() {
        return { tool: "move_to", ok: false, status: "blocked" };
      },
      async collect_logs() {
        collectLogCalls += 1;
        throw new Error("collect_logs must not execute without an active action skill");
      },
      async craft_item() {
        return { tool: "craft_item", ok: false, status: "blocked" };
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
    status: "failed",
    why: "collect_4_logs was blocked repeatedly"
  });
  assert.equal(collectLogCalls, 0);
  assert.deepEqual(
    transcriptSteps.map((step) => step.tool),
    ["observe", "collect_logs", "remember"]
  );
  assert.equal((transcriptSteps[1]?.result as { status: string }).status, "blocked");
  assert.match(
    (transcriptSteps[1]?.result as { message: string }).message,
    /not backed by active action skills/
  );
  assert.equal((transcriptSteps[1]?.verification as { status: string }).status, "failed");
});
