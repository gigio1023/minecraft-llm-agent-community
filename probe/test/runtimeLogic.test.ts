import assert from "node:assert/strict";
import test from "node:test";

import minecraftData from "minecraft-data";
import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import { mutualPersonas } from "../src/mutual/personas.js";
import { createMutualProviders } from "../src/mutual/provider.js";
import { createMutualRuntimeState } from "../src/mutual/runtimeState.js";
import { dropItem } from "../src/mutual/tools/dropItem.js";
import { validateMutualProposal } from "../src/mutual/tools/index.js";
import { observeWorld } from "../src/mutual/tools/observeWorld.js";
import { replyTo } from "../src/mutual/tools/replyTo.js";
import type { MutualStepRecord, Proposal } from "../src/mutual/types.js";
import { runMutualLoop } from "../src/mutual/mutualLoop.js";
import { finalizeRunProbe } from "../src/runProbe.js";
import { runAgentLoop } from "../src/runtime/agentLoop.js";
import { createDialogueState } from "../src/runtime/dialogueState.js";
import { createMemory } from "../src/runtime/memory.js";
import { validateProposal } from "../src/tools/index.js";
import { moveTo } from "../src/tools/moveTo.js";
import { observe } from "../src/tools/observe.js";
import { remember } from "../src/tools/remember.js";
import { say } from "../src/tools/say.js";
import { wait } from "../src/tools/wait.js";

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

function createFakeBot(username: string, x: number) {
  const chatLog: string[] = [];
  const lookTargets: Array<{ x: number; y: number; z: number }> = [];
  const controls: Array<{ control: string; state: boolean }> = [];
  const entities: Record<string, { name?: string; displayName?: string; metadata?: unknown[] }> =
    {};
  const position = createPosition(x);
  const registry = {
    itemsByName: {
      paper: {
        id: minecraftData("1.21.11").itemsByName.paper.id
      }
    }
  };

  return {
    username,
    entity: { position },
    entities,
    registry,
    chatLog,
    lookTargets,
    controls,
    chat(message: string) {
      chatLog.push(message);
    },
    async lookAt(target: { x: number; y: number; z: number }) {
      lookTargets.push(target);
    },
    setControlState(control: string, state: boolean) {
      controls.push({ control, state });

      if (control === "forward" && state) {
        this.entity.position.x += 1.25;
      }
    }
  };
}

function createFakeMutualBots() {
  return {
    npc_a: { username: "npc_a" },
    npc_b: { username: "npc_b" }
  };
}

function createFakeMutualTools() {
  let executionCount = 0;

  return {
    lastResult() {
      return null;
    },
    validateProposal(proposal: Proposal) {
      return proposal;
    },
    async observe_world() {
      return {
        status: "ok",
        heardMessages: [],
        markerEntitySeen: executionCount >= 2
      };
    },
    async execute(): Promise<MutualStepRecord> {
      executionCount += 1;

      if (executionCount === 1) {
        return {
          category: "conversationTurnState",
          actorAction: { actor: "npc_a", tool: "say", result: "said" },
          targetResponse: { actor: "npc_b", tool: "reply_to", result: "busy_reply" }
        };
      }

      if (executionCount === 2) {
        return {
          category: "spatialAttentionApproach",
          actorAction: { actor: "npc_b", tool: "look_at_actor", result: "looked_at_target" },
          worldStateChange: { arrived: true }
        };
      }

      return {
        category: "materialEnvironmentHandoff",
        actorAction: { actor: "npc_a", tool: "drop_item", result: "dropped" },
        targetObservation: { markerEntitySeen: true },
        targetResponse: { actor: "npc_b", tool: "reply_to", result: "replied" },
        worldStateChange: { itemName: "paper" },
        causedNext: { actor: "npc_b", tool: "reply_to" }
      };
    }
  };
}

function createPathfindingBot(username: string, x: number) {
  const position = createPosition(x);
  const goals: string[] = [];

  return {
    username,
    entity: { position },
    goals,
    async lookAt() {
      throw new Error("moveTo should use pathfinder when available");
    },
    setControlState() {
      throw new Error("moveTo should not fall back to manual controls in this test");
    },
    pathfinder: {
      async goto() {
        goals.push("goal-near");
        position.x = 1.5;
      }
    }
  };
}

function createInventoryFakeBot(username: string, options?: { delayedEntityMs?: number }) {
  const inventoryCalls: Array<{ slot: number; item: unknown }> = [];
  const tossCalls: Array<{ itemId: number; count: number }> = [];
  const entities: Record<string, { name?: string; displayName?: string; metadata?: unknown[] }> =
    {};

  return {
    username,
    version: "1.21.11",
    entities,
    inventoryCalls,
    tossCalls,
    creative: {
      async setInventorySlot(slot: number, item: unknown) {
        inventoryCalls.push({ slot, item });
      }
    },
    async toss(itemId: number, _metadata: unknown, count: number) {
      tossCalls.push({ itemId, count });
      const addEntity = () => {
        entities.marker = {
          name: "item",
          displayName: "Item",
          metadata: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            { itemId, itemCount: count }
          ]
        };
      };

      if (options?.delayedEntityMs) {
        setTimeout(addEntity, options.delayedEntityMs);
      } else {
        addEntity();
      }
    }
  };
}

test("dialogue state exposes busy then available and rejects unsupported tools", () => {
  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 1 });

  assert.deepEqual(dialogueState.requestTalk("npc_a", "npc_b"), {
    status: "busy",
    reason: "npc_b is busy"
  });

  assert.deepEqual(dialogueState.requestTalk("npc_a", "npc_b"), {
    status: "available"
  });

  assert.throws(() => validateProposal({ tool: "drop_database", args: {} }), /Unsupported tool/);
});

test("deterministic provider follows the planned runtime contract sequence", () => {
  const provider = createDeterministicProvider();
  const observation = { nearby: ["npc_b"] };

  assert.deepEqual(provider.next({ observation, lastResult: null }), {
    tool: "observe",
    args: {}
  });

  assert.deepEqual(
    provider.next({ observation, lastResult: { tool: "observe", status: "ok" } }),
    { tool: "move_to", args: { target: "npc_b" } }
  );

  assert.deepEqual(
    provider.next({ observation, lastResult: { tool: "move_to", status: "ok" } }),
    { tool: "say", args: { target: "npc_b", text: "hi npc_b, are you free?" } }
  );

  assert.deepEqual(
    provider.next({ observation, lastResult: { tool: "say", status: "busy" } }),
    { tool: "wait", args: { ticks: 20, reason: "npc_b was busy" } }
  );

  assert.deepEqual(
    provider.next({ observation, lastResult: { tool: "wait", status: "ok" } }),
    { tool: "say", args: { target: "npc_b", text: "checking again when you are ready" } }
  );

  assert.deepEqual(
    provider.next({ observation, lastResult: { tool: "say", status: "available" } }),
    { tool: "remember", args: { note: "npc_b responded after one busy turn" } }
  );
});

test("mutual providers keep actor-specific deterministic order", () => {
  const providers = createMutualProviders();

  assert.equal(mutualPersonas.npc_a.name, "Mara");
  assert.equal(mutualPersonas.npc_b.name, "Jun");

  assert.deepEqual(providers.npc_a.next({ lastResult: null }), {
    tool: "observe_world",
    args: {}
  });

  assert.deepEqual(providers.npc_b.next({ lastResult: null }), {
    tool: "reply_to",
    args: { source: "npc_a", text: "Busy. Give me a second." }
  });

  assert.deepEqual(
    providers.npc_b.next({
      lastResult: { tool: "reply_to", status: "busy_reply" }
    }),
    {
      tool: "look_at_actor",
      args: { target: "npc_a" }
    }
  );
});

test("runtime state owns heard chat, busy replies, and marker visibility", () => {
  const state = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 1,
    markerItemName: "paper"
  });

  state.recordHeardMessage("npc_b", {
    from: "npc_a",
    text: "Jun, can you confirm the marker?"
  });

  assert.deepEqual(state.consumeHeardMessages("npc_b"), [
    {
      from: "npc_a",
      text: "Jun, can you confirm the marker?"
    }
  ]);
  assert.equal(state.consumeHeardMessages("npc_b").length, 0);
  assert.deepEqual(state.requestReply("npc_b", "npc_a"), {
    status: "busy",
    reason: "npc_b is busy"
  });
  state.markDroppedItem("npc_a", "paper");
  assert.equal(state.hasDroppedMarker(), true);
  assert.equal(state.markerItemName(), "paper");
});

test("mutual proposal validation rejects unsupported tools", () => {
  assert.deepEqual(validateMutualProposal({ tool: "reply_to", args: { source: "npc_a" } }), {
    tool: "reply_to",
    args: { source: "npc_a" }
  });
  assert.throws(
    () => validateMutualProposal({ tool: "drop_database", args: {} }),
    /Unsupported mutual tool/
  );
});

test("mutual observe and reply tools expose heard chat and busy reply behavior", async () => {
  const actor = createFakeBot("npc_b", 2);
  const source = createFakeBot("npc_a", 0);
  const memory = createMemory(4);
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 1,
    markerItemName: "paper"
  });

  actor.entities.marker = {
    name: "item",
    displayName: "paper"
  };
  runtimeState.recordHeardMessage("npc_b", {
    from: "npc_a",
    text: "Jun, can you confirm the marker?"
  });

  assert.deepEqual(
    observeWorld({ actor, target: source, runtimeState, memory }),
    {
      status: "ok",
      visibleActors: [{ id: "npc_a", distance: 2 }],
      heardMessages: [{ from: "npc_a", text: "Jun, can you confirm the marker?" }],
      markerEntitySeen: true,
      memory: []
    }
  );

  assert.deepEqual(
    await replyTo({
      actor,
      source,
      runtimeState,
      text: "Busy. Give me a second."
    }),
    {
      status: "busy_reply",
      reason: "npc_b is busy"
    }
  );
  assert.deepEqual(actor.chatLog, ["Busy. Give me a second."]);
});

test("observeWorld detects a dropped paper item from entity metadata", () => {
  const actor = createFakeBot("npc_b", 2);
  const source = createFakeBot("npc_a", 0);
  const memory = createMemory(4);
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 1,
    markerItemName: "paper"
  });
  const paperId = minecraftData("1.21.11").itemsByName.paper.id;

  actor.entities.marker = {
    name: "item",
    displayName: "Item",
    metadata: [null, null, null, null, null, null, null, null, { itemId: paperId, itemCount: 1 }]
  };

  assert.equal(
    observeWorld({ actor, target: source, runtimeState, memory }).markerEntitySeen,
    true
  );
});

test("mutual loop makes npc_b act after npc_a changes chat or world state", async () => {
  const transcriptSteps: Array<{
    category: string;
    actorAction: { actor: string; tool: string; result: string };
    targetResponse?: { actor: string; tool: string; result: string };
  }> = [];

  const result = await runMutualLoop({
    bots: createFakeMutualBots(),
    providers: createMutualProviders(),
    transcript: {
      recordStep(step) {
        transcriptSteps.push(step);
      }
    },
    tools: createFakeMutualTools()
  });

  assert.equal(result.status, "success");
  assert.ok(transcriptSteps.some((step) => step.targetResponse?.actor === "npc_b"));
});

test("tool modules expose observation, movement, dialogue, waiting, and memory behavior", async () => {
  const actor = createFakeBot("npc_a", 0);
  const target = createFakeBot("npc_b", 2);
  const memory = createMemory(4);
  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 1 });

  memory.add("saw npc_b near spawn");

  assert.deepEqual(await observe({ actor, target, dialogueState, memory }), {
    status: "ok",
    visibleActors: [{ id: "npc_b", distance: 2, busy: true }],
    memory: ["saw npc_b near spawn"]
  });

  assert.deepEqual(
    await moveTo({ actor, target, targetId: "npc_b", durationMs: 0 }),
    {
      status: "arrived",
      distance: 0.75,
      beforeDistance: 2,
      afterDistance: 0.75,
      arrived: true
    }
  );
  assert.deepEqual(actor.controls, [
    { control: "forward", state: true },
    { control: "forward", state: false }
  ]);

  assert.deepEqual(await say({ actor, target, dialogueState, text: "hi npc_b" }), {
    status: "busy",
    reason: "npc_b is busy"
  });
  assert.deepEqual(actor.chatLog, []);
  assert.deepEqual(target.chatLog, []);

  assert.deepEqual(await wait({ ticks: 0 }), { status: "waited", ticks: 0 });

  assert.deepEqual(await say({ actor, target, dialogueState, text: "hi npc_b" }), {
    status: "delivered"
  });
  assert.deepEqual(actor.chatLog, ["hi npc_b"]);
  assert.deepEqual(target.chatLog, []);

  assert.deepEqual(remember({ memory, note: "npc_b answered" }), {
    status: "remembered",
    note: "npc_b answered"
  });
  assert.deepEqual(memory.list(), ["saw npc_b near spawn", "npc_b answered"]);
});

test("moveTo prefers pathfinder and returns before and after distance details", async () => {
  const actor = createPathfindingBot("npc_a", 0);
  const target = createPathfindingBot("npc_b", 3);

  assert.deepEqual(await moveTo({ actor, target, targetId: "npc_b" }), {
    status: "arrived",
    distance: 1.5,
    beforeDistance: 3,
    afterDistance: 1.5,
    arrived: true
  });
  assert.deepEqual(actor.goals, ["goal-near"]);
});

test("dropItem seeds the marker item and records dropped marker state", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 1,
    markerItemName: "paper"
  });
  const actor = createInventoryFakeBot("npc_a");
  const expectedPaperId = minecraftData(actor.version).itemsByName.paper.id;

  assert.deepEqual(
    await dropItem({
      actor,
      runtimeState,
      itemName: "paper",
      count: 1
    }),
    {
      status: "dropped",
      itemName: "paper",
      count: 1
    }
  );
  assert.equal(runtimeState.hasDroppedMarker(), true);
  assert.equal(actor.inventoryCalls.length, 1);
  assert.deepEqual(actor.tossCalls, [{ itemId: expectedPaperId, count: 1 }]);
});

test("dropItem waits until the dropped marker becomes visible before resolving", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 1,
    markerItemName: "paper"
  });
  const actor = createInventoryFakeBot("npc_a", { delayedEntityMs: 30 });

  await dropItem({
    actor,
    runtimeState,
    itemName: "paper",
    count: 1
  });

  assert.equal(actor.entities.marker?.name, "item");
});

test("agent loop records six steps and succeeds when remember changes the next action", async () => {
  const provider = createDeterministicProvider();
  const transcriptSteps: Array<{
    actor: string;
    observation: unknown;
    tool: string;
    args?: Record<string, unknown>;
    result: unknown;
  }> = [];

  const final = await runAgentLoop({
    bots: {
      npc_a: { username: "npc_a" },
      npc_b: { username: "npc_b" }
    },
    provider,
    transcript: {
      recordStep(step) {
        transcriptSteps.push(step);
      }
    },
    tools: {
      validateProposal,
      async observe() {
        return {
          status: "ok",
          visibleActors: [{ id: "npc_b", distance: 1.5, busy: true }],
          memory: []
        };
      },
      async move_to() {
        return { status: "arrived" };
      },
      async say({ args }) {
        if (args.text === "hi npc_b, are you free?") {
          return { status: "busy", reason: "npc_b is busy" };
        }

        return { status: "delivered", reason: "ready now" };
      },
      async wait() {
        return { status: "waited", ticks: 20 };
      },
      async remember({ args }) {
        return { status: "remembered", note: String(args.note) };
      }
    }
  });

  assert.deepEqual(final, {
    status: "success",
    why: "runtime-owned busy result changed the next action"
  });
  assert.deepEqual(
    transcriptSteps.map((step) => step.tool),
    ["observe", "move_to", "say", "wait", "say", "remember"]
  );
  assert.equal(transcriptSteps[0].actor, "npc_a");
  assert.deepEqual(transcriptSteps[1].args, { target: "npc_b" });
  assert.deepEqual(transcriptSteps[2].result, {
    status: "busy",
    reason: "npc_b is busy"
  });
  assert.deepEqual(transcriptSteps[5].result, {
    status: "remembered",
    note: "npc_b responded after one busy turn"
  });
});

test("finalizeRunProbe preserves a successful transcript result when cleanup fails later", () => {
  const cleanupError = new Error("docker compose down failed");
  const result = finalizeRunProbe({
    result: { transcriptPath: "/repo/data/evidence/transcript.json" },
    cleanupErrors: [cleanupError]
  });

  assert.equal(result.transcriptPath, "/repo/data/evidence/transcript.json");
  assert.equal(result.cleanupError, cleanupError);
});

test("finalizeRunProbe keeps failure behavior unchanged when main execution failed", () => {
  const mainError = new Error("main probe failure");
  const cleanupError = new Error("cleanup failure");

  assert.throws(
    () =>
      finalizeRunProbe({
        caughtError: mainError,
        cleanupErrors: [cleanupError]
      }),
    (error: unknown) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.message, "Probe failed and cleanup also failed");
      assert.deepEqual(error.errors, [mainError, cleanupError]);
      return true;
    }
  );
});
