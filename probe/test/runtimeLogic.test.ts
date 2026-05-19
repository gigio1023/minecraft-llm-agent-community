import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import test from "node:test";

import minecraftData from "minecraft-data";
import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import {
  buildDialogueContext,
  type DialogueContextInput,
  type DialogueContextOutput,
  type DialogueObservation,
  type DialogueTranscriptEntry,
  mutualPersonas as dialogueMutualPersonas
} from "../src/mutual/dialogueContext.js";
import { mutualPersonas as scenarioMutualPersonas } from "../src/mutual/personas.js";
import { createMutualProviders } from "../src/mutual/provider.js";
import { parseProviderAction } from "../src/mutual/providerSchema.js";
import { createMutualRuntimeState } from "../src/mutual/runtimeState.js";
import { converse } from "../src/mutual/tools/converse.js";
import { dropItem } from "../src/mutual/tools/dropItem.js";
import {
  executeMutualTool,
  validateMutualProposal
} from "../src/mutual/tools/index.js";
import { observeWorld } from "../src/mutual/tools/observeWorld.js";
import { replyTo } from "../src/mutual/tools/replyTo.js";
import type { MutualJsonValue, MutualStepRecord, Proposal, ToolResult } from "../src/mutual/types.js";
import { runMutualLoop } from "../src/mutual/mutualLoop.js";
import { toToolResult } from "../src/mutual/tools/wrapper.js";
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
  const entities: Record<string, { name?: string; displayName?: string; metadata?: unknown[] }> = {};
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

function toJsonValue(value: unknown): MutualJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  throw new Error(`Expected JSON-safe value, received ${typeof value}`);
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
  const entities: Record<string, { name?: string; displayName?: string; metadata?: unknown[] }> = {};

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

test("buildDialogueContext snapshots persona, observation, transcript, memory, and rules", () => {
  const allowedTools = ["converse", "wait"];
  const persona: { name: string; role: string; style: string; objective: string } = {
    ...dialogueMutualPersonas.npc_a
  };
  const visibleActors = [{ id: "npc_b", distance: 2, busy: false }];
  const marker = {
    seen: true,
    holder: "npc_b"
  };
  const observation: DialogueObservation = {
    visibleActors,
     lastActionResult: { tool: "converse", ok: true, status: "available" },
    marker
  };
  const memory = ["marker paper should stay near the chest"];
  const transcriptArgs = { utterance: "I am ready." };
  const recentTranscript: DialogueTranscriptEntry[] = [
    {
      actorId: "npc_b",
      actorName: "Jun",
      tool: "converse",
      args: transcriptArgs,
       result: { tool: "converse", ok: true, status: "available" }
    }
  ];

  const context = buildDialogueContext({
    actorId: "npc_a",
    allowedTools,
    persona,
    observation,
    memory,
    recentTranscript
  } satisfies DialogueContextInput);

  persona.role = "changed";
  visibleActors[0]!.busy = true;
  marker.holder = "npc_a";
  memory.push("mutated");
  transcriptArgs.utterance = "mutated";
  allowedTools.push("remember");

  const expected: DialogueContextOutput = {
    actorId: "npc_a",
    persona: {
      name: "Mara",
      role: "quartermaster",
      style: "brief but careful",
      objective: "coordinate the marker handoff"
    },
    observation: {
      visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
       lastActionResult: { tool: "converse", ok: true, status: "available" },
      marker: {
        seen: true,
        holder: "npc_b"
      }
    },
    memory: ["marker paper should stay near the chest"],
    recentTranscript: [
      {
        actorId: "npc_b",
        actorName: "Jun",
        tool: "converse",
        args: { utterance: "I am ready." },
         result: { tool: "converse", ok: true, status: "available" }
      }
    ],
    rules: {
      oneToolPerTurn: true,
      allowedTools: ["converse", "wait"],
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  };

  assert.deepEqual(context, expected);
});

test("parseProviderAction accepts converse, defaults args, and rejects invalid actions", () => {
  assert.deepEqual(
    parseProviderAction({
      tool: "converse",
      args: {
        target: "npc_b",
        utterance: "Jun, can you check the shared chest?"
      },
      why: "I need Jun to confirm the marker location."
    }),
    {
      tool: "converse",
      args: {
        target: "npc_b",
        utterance: "Jun, can you check the shared chest?"
      },
      why: "I need Jun to confirm the marker location."
    }
  );

  assert.deepEqual(parseProviderAction({ tool: "wait" }), {
    tool: "wait",
    args: {}
  });

  assert.deepEqual(parseProviderAction({ tool: "wait", args: "soon" }), {
    tool: "wait",
    args: {}
  });

  assert.throws(() => parseProviderAction("nope"), /Provider action must be an object/);
  assert.throws(
    () => parseProviderAction({ tool: "sing", args: {} }),
    /Unsupported mutual tool: sing/
  );
});

test("loadOpenAICodexAuth reads auth metadata without exposing raw secrets in JSON", async () => {
  const artifactDir = new URL("../test-artifacts/", import.meta.url);
  const authPath = new URL("openai-codex-auth.json", artifactDir);

  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    authPath,
    JSON.stringify({
      accessToken: "top-secret-access-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      profileEmail: "npc@example.com"
    })
  );

  const { loadOpenAICodexAuth } = await import("../src/mutual/openaiCodexAuth.js");
  const auth = await loadOpenAICodexAuth(authPath);

  assert.equal(auth.profileEmail, "npc@example.com");
  assert.equal(typeof auth.accessToken, "string");
  assert.throws(() => JSON.stringify(auth), /Cannot serialize auth/);

  await rm(authPath, { force: true });
});

test("loadOpenAICodexAuth rejects an empty access token", async () => {
  const artifactDir = new URL("../test-artifacts/", import.meta.url);
  const authPath = new URL("openai-codex-auth.json", artifactDir);

  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    authPath,
    JSON.stringify({
      accessToken: "",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    })
  );

  const { loadOpenAICodexAuth } = await import("../src/mutual/openaiCodexAuth.js");

  await assert.rejects(
    loadOpenAICodexAuth(authPath),
    /OpenAI Codex auth store accessToken must be a non-empty string/
  );

  await rm(authPath, { force: true });
});

test("loadOpenAICodexAuth rejects a whitespace-only access token", async () => {
  const artifactDir = new URL("../test-artifacts/", import.meta.url);
  const authPath = new URL("openai-codex-auth.json", artifactDir);

  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    authPath,
    JSON.stringify({
      accessToken: "   ",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    })
  );

  const { loadOpenAICodexAuth } = await import("../src/mutual/openaiCodexAuth.js");

  await assert.rejects(
    loadOpenAICodexAuth(authPath),
    /OpenAI Codex auth store accessToken must be a non-empty string/
  );

  await rm(authPath, { force: true });
});

test("loadOpenAICodexAuth rejects an expired auth store", async () => {
  const artifactDir = new URL("../test-artifacts/", import.meta.url);
  const authPath = new URL("openai-codex-auth.json", artifactDir);

  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    authPath,
    JSON.stringify({
      accessToken: "top-secret-access-token",
      expiresAt: new Date(Date.now() - 60_000).toISOString()
    })
  );

  const { loadOpenAICodexAuth } = await import("../src/mutual/openaiCodexAuth.js");

  await assert.rejects(loadOpenAICodexAuth(authPath), /OpenAI Codex auth store is expired/);

  await rm(authPath, { force: true });
});

test("createOpenAICodexProvider retries malformed JSON once before returning a parsed action", async () => {
  const responses = [
    { output_text: "not json" },
    {
      output_text: JSON.stringify({
        tool: "converse",
        args: {
          target: "npc_b",
          utterance: "Jun, check the marker."
        }
      })
    }
  ];
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const { createOpenAICodexProvider } = await import("../src/mutual/openaiCodexProvider.js");
  const provider = createOpenAICodexProvider({
    accessToken: "test-token",
    maxRetries: 1,
    fetchImpl: async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      const payload = responses.shift();

      assert.ok(payload, "expected a fake response payload");

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }
  });

  const proposal = await provider.next({
    actorId: "npc_a",
    persona: dialogueMutualPersonas.npc_a,
    observation: {
      visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
      lastActionResult: { status: "available" }
    },
    memory: ["marker paper should stay near the chest"],
    recentTranscript: [],
    rules: {
      oneToolPerTurn: true,
      allowedTools: ["converse", "wait"],
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  });

  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0]?.url, "https://api.openai.com/v1/responses");
  const firstRequest = fetchCalls[0]?.init;
  assert.ok(firstRequest, "expected the first provider request");
  assert.equal(new Headers(firstRequest.headers).get("authorization"), "Bearer test-token");
  const firstRequestBody = JSON.parse(String(firstRequest.body));
  assert.equal(firstRequestBody.model, "gpt-5.4-mini");
  assert.deepEqual(firstRequestBody.reasoning, {
    effort: "low"
  });
  assert.deepEqual(firstRequestBody.text, {
    format: {
      type: "json_object"
    }
  });
  assert.equal(proposal.tool, "converse");
});

test("createOpenAICodexProvider stops after exhausting malformed JSON retries", async () => {
  let fetchCount = 0;
  const { createOpenAICodexProvider } = await import("../src/mutual/openaiCodexProvider.js");
  const provider = createOpenAICodexProvider({
    accessToken: "test-token",
    maxRetries: 2,
    fetchImpl: async () => {
      fetchCount += 1;
      return new Response(JSON.stringify({ output_text: "not json" }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }
  });

  await assert.rejects(
    Promise.resolve(
      provider.next({
        actorId: "npc_a",
        persona: dialogueMutualPersonas.npc_a,
        observation: {
          visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
          lastActionResult: { status: "available" }
        },
        memory: [],
        recentTranscript: [],
        rules: {
          oneToolPerTurn: true,
          allowedTools: ["converse", "wait"],
          noInventedObservations: true,
          preferObserveWorldWhenUncertain: true
        }
      })
    ),
    SyntaxError
  );

  assert.equal(fetchCount, 3);
});

test("createOpenAICodexProvider rejects a whitespace-only access token", async () => {
  const { createOpenAICodexProvider } = await import("../src/mutual/openaiCodexProvider.js");

  assert.throws(
    () =>
      createOpenAICodexProvider({
        accessToken: "\t"
      }),
    /OpenAI Codex provider accessToken must be a non-empty string/
  );
});

test("createOpenAICodexProvider does not retry non-SyntaxError parse failures", async () => {
  let fetchCount = 0;
  const { createOpenAICodexProvider } = await import("../src/mutual/openaiCodexProvider.js");
  const provider = createOpenAICodexProvider({
    accessToken: "test-token",
    maxRetries: 3,
    fetchImpl: async () => {
      fetchCount += 1;
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            tool: "sing",
            args: {}
          })
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    }
  });

  await assert.rejects(
    Promise.resolve(
      provider.next({
        actorId: "npc_a",
        persona: dialogueMutualPersonas.npc_a,
        observation: {
          visibleActors: [{ id: "npc_b", distance: 2, busy: false }],
          lastActionResult: { status: "available" }
        },
        memory: [],
        recentTranscript: [],
        rules: {
          oneToolPerTurn: true,
          allowedTools: ["converse", "wait"],
          noInventedObservations: true,
          preferObserveWorldWhenUncertain: true
        }
      })
    ),
    /Unsupported mutual tool: sing/
  );

  assert.equal(fetchCount, 1);
});

test("deterministic provider follows the planned runtime contract sequence", () => {
  const provider = createDeterministicProvider();
  const observation = { nearby: ["npc_b"] };

  assert.deepEqual(provider.next({ observation, lastResult: null }), {
    tool: "observe",
    args: {}
  });

  assert.deepEqual(
     provider.next({ observation, lastResult: { tool: "observe", ok: true, status: "ok" } }),
    { tool: "move_to", args: { target: "npc_b" } }
  );

  assert.deepEqual(
     provider.next({ observation, lastResult: { tool: "move_to", ok: true, status: "ok" } }),
    { tool: "say", args: { target: "npc_b", text: "hi npc_b, are you free?" } }
  );

  assert.deepEqual(
     provider.next({ observation, lastResult: { tool: "say", ok: false, status: "busy" } }),
    { tool: "wait", args: { ticks: 20, reason: "npc_b was busy" } }
  );

  assert.deepEqual(
     provider.next({ observation, lastResult: { tool: "wait", ok: true, status: "ok" } }),
    { tool: "say", args: { target: "npc_b", text: "checking again when you are ready" } }
  );

  assert.deepEqual(
     provider.next({ observation, lastResult: { tool: "say", ok: true, status: "available" } }),
    { tool: "remember", args: { note: "npc_b responded after one busy turn" } }
  );
});

test("mutual providers keep actor-specific deterministic order", () => {
  const providers = createMutualProviders();

  assert.equal(scenarioMutualPersonas.npc_a.name, "Mara");
  assert.equal(scenarioMutualPersonas.npc_b.name, "Jun");

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
       lastResult: { tool: "reply_to", ok: false, status: "busy_reply" }
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
  const transcriptSteps: MutualStepRecord[] = [];

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

test("converse sends directed speech, supports self-talk, and records heard messages", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper"
  });
  const actor = createFakeBot("npc_a", 0);
  const target = createFakeBot("npc_b", 2);

  const directed = await converse({
    actor,
    runtimeState,
    targetId: target.username,
    utterance: "Jun, check the marker by the chest."
  });
  const aloud = await converse({
    actor,
    runtimeState,
    utterance: "I should wait by the chest."
  });

  assert.equal(directed.status, "said_to_target");
  assert.equal(aloud.status, "said_aloud");
  assert.deepEqual(actor.chatLog, [
    "Jun, check the marker by the chest.",
    "I should wait by the chest."
  ]);
  assert.deepEqual(target.chatLog, []);
  assert.deepEqual(
    runtimeState.recentUtterances().map((entry) => entry.text),
    ["Jun, check the marker by the chest.", "I should wait by the chest."]
  );
  assert.equal(
    runtimeState.consumeHeardMessages("npc_b")[0]?.text,
    "Jun, check the marker by the chest."
  );
});

test("executeMutualTool records converse dispatcher steps with args and provider metadata", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper"
  });
  const actor = createFakeBot("npc_a", 0);
  const transcriptSteps: MutualStepRecord[] = [];

  const result = await executeMutualTool({
    proposal: {
      tool: "converse",
      args: {
        target: "npc_b",
        utterance: "Jun, check the marker by the chest."
      },
      why: "I need Jun to confirm the marker location."
    },
    actor,
    runtimeState,
    observation: {
      visibleActors: [{ id: "npc_b", distance: 2, busy: false }]
    },
    transcript: {
      recordStep(step) {
        transcriptSteps.push(step);
      }
    }
  });

  assert.equal(result.tool, "converse");
  assert.equal(result.ok, true);
  assert.equal(result.status, "said_to_target");
  assert.equal(result.utterance, "Jun, check the marker by the chest.");
  assert.equal(result.targetId, "npc_b");
  assert.equal(typeof result.durationMs, "number");
  assert.deepEqual(transcriptSteps, [
    {
      actor: "npc_a",
      observation: {
        visibleActors: [{ id: "npc_b", distance: 2, busy: false }]
      },
      actorAction: { tool: "converse" },
      actorArgs: {
        target: "npc_b",
        utterance: "Jun, check the marker by the chest."
      },
      providerMeta: {
        why: "I need Jun to confirm the marker location."
      },
      result: {
        status: "said_to_target",
        utterance: "Jun, check the marker by the chest.",
        targetId: "npc_b"
      }
    }
  ]);
});

test("executeMutualTool returns a failed ToolResult when a handler throws", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper"
  });
  const actor = createFakeBot("npc_a", 0);
  const transcriptSteps: MutualStepRecord[] = [];

  const result = await executeMutualTool({
    proposal: {
      tool: "move_to",
      args: {
        target: "npc_b"
      },
      why: "I should get closer first."
    },
    actor,
    runtimeState,
    observation: {
      visibleActors: [{ id: "npc_b", distance: 4, busy: false }]
    },
    transcript: {
      recordStep(step) {
        transcriptSteps.push(step);
      }
    },
    handlers: {
      async move_to() {
        throw new Error("movement blocked");
      }
    }
  });

  assert.equal(result.tool, "move_to");
  assert.equal(result.ok, false);
  assert.equal(result.status, "failed");
  assert.equal(result.message, "movement blocked");
  assert.equal(typeof result.durationMs, "number");
  assert.deepEqual(transcriptSteps, []);
});

test("runMutualLoop awaits async providers and records four live dialogue turns before movement", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper"
  });
  const actors: Record<"npc_a" | "npc_b", ReturnType<typeof createFakeBot>> = {
    npc_a: createFakeBot("npc_a", 0),
    npc_b: createFakeBot("npc_b", 2)
  };
  const transcriptSteps: MutualStepRecord[] = [];
  const liveProposals = [
    {
      tool: "converse",
      args: {
        target: "npc_b",
        utterance: "Jun, are you near the shared chest?"
      }
    },
    {
      tool: "converse",
      args: {
        target: "npc_a",
        utterance: "Yes, I am by the chest and I can check the marker."
      }
    },
    {
      tool: "converse",
      args: {
        target: "npc_b",
        utterance: "Good. I will bring the marker paper over."
      }
    },
    {
      tool: "converse",
      args: {
        target: "npc_a",
        utterance: "Understood. I will watch for it."
      }
    },
    {
      tool: "move_to",
      args: {
        target: "npc_b"
      }
    }
  ];
  const provider = {
    async next() {
      const proposal = liveProposals.shift();

      if (!proposal) {
        throw new Error("No live proposal available");
      }

      return proposal;
    }
  };
   const lastResults = new Map<"npc_a" | "npc_b", ToolResult | null>([
    ["npc_a", null],
    ["npc_b", null]
  ]);

  const result = await runMutualLoop({
    actors,
    providers: {
      npc_a: provider,
      npc_b: provider
    },
    tools: {
      async observe(actorId) {
        const actor = actors[actorId];
        const targetId = actorId === "npc_a" ? "npc_b" : "npc_a";
        const target = actors[targetId];

        return {
          visibleActors: [
            {
              id: targetId,
              distance: Number(actor.entity.position.distanceTo(target.entity.position).toFixed(2)),
              busy: false
            }
          ],
          recentUtterances: runtimeState.recentUtterances(),
          heardMessages: runtimeState.consumeHeardMessages(actorId),
          marker: {
            seen: true,
            holder: "npc_a"
          }
        };
      },
      lastResult(actorId) {
        return lastResults.get(actorId) ?? null;
      },
       async execute(actorId, proposal, observation) {
         const actor = actors[actorId];
         const result = await executeMutualTool({
           proposal,
          actor,
          runtimeState,
          observation,
          transcript: {
            recordStep(step) {
              transcriptSteps.push(step);
            }
          },
          handlers: {
            async move_to({ args }) {
              return {
                status: "arrived",
                targetId: String(args.target)
              };
            },
            async observe_world() {
              return {
                status: "observed"
              };
            },
            async wait() {
              return {
                status: "waited"
              };
            },
            async remember() {
              return {
                status: "remembered"
              };
            },
            async drop_item() {
              return {
                status: "dropped"
              };
            }
          }
        });

         lastResults.set(actorId, {
           tool: proposal.tool,
           ok: result.ok,
           status: result.status
         });

         return toJsonValue(result);
       }
     }
   });

  assert.equal(result.status, "success");
  assert.equal(result.categories.conversationTurnState, "passed");
  assert.deepEqual(
    transcriptSteps.map((step) => `${step.actor}:${step.actorAction.tool}`),
    [
      "npc_a:converse",
      "npc_b:converse",
      "npc_a:converse",
      "npc_b:converse",
      "npc_a:move_to"
    ]
  );
  assert.deepEqual(
    transcriptSteps.slice(0, 4).map((step) => step.actorArgs?.utterance),
    [
      "Jun, are you near the shared chest?",
      "Yes, I am by the chest and I can check the marker.",
      "Good. I will bring the marker paper over.",
      "Understood. I will watch for it."
    ]
  );
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
        async say({ args }) {
          if (args.text === "hi npc_b, are you free?") {
            return { tool: "say", ok: false, status: "busy", reason: "npc_b is busy" };
         }

         return { tool: "say", ok: true, status: "delivered", reason: "ready now" };
       },
       async wait() {
         return { tool: "wait", ok: true, status: "waited", ticks: 20 };
       },
       async remember({ args }) {
         return { tool: "remember", ok: true, status: "remembered", note: String(args.note) };
       }
     }
   });

  assert.deepEqual(final, {
    status: "success",
    why: "npc_b responded after one busy turn"
  });
  assert.deepEqual(
    transcriptSteps.map((step) => step.tool),
    ["observe", "move_to", "say", "wait", "say", "remember"]
  );
  assert.equal(transcriptSteps[0].actor, "npc_a");
  assert.deepEqual(transcriptSteps[1].args, { target: "npc_b" });
   assert.deepEqual(transcriptSteps[2].result, {
     tool: "say",
     ok: false,
     status: "busy",
     reason: "npc_b is busy"
   });
   assert.deepEqual(transcriptSteps[5].result, {
     tool: "remember",
     ok: true,
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
