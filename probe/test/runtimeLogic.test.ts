import assert from "node:assert/strict";
import test from "node:test";

import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import {
  buildDialogueContext,
  type DialogueContextInput,
  type DialogueContextOutput,
  type DialogueObservation,
  type DialogueTranscriptEntry,
  mutualPersonas
} from "../src/mutual/dialogueContext.js";
import { parseProviderAction } from "../src/mutual/providerSchema.js";
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
  const position = createPosition(x);

  return {
    username,
    entity: { position },
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
    ...mutualPersonas.npc_a
  };
  const visibleActors = [{ id: "npc_b", distance: 2, busy: false }];
  const marker = {
    seen: true,
    holder: "npc_b"
  };
  const observation: DialogueObservation = {
    visibleActors,
    lastActionResult: { status: "available" },
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
      result: { status: "available" }
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
      lastActionResult: { status: "available" },
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
        result: { status: "available" }
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
    { status: "arrived", distance: 0.75 }
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
