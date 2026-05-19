import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

import { createMutualRuntimeState } from "../src/mutual/runtimeState.js";
import { executeMutualTool } from "../src/mutual/tools/index.js";
import { createMutualTranscript } from "../src/mutual/transcript.js";
import { createTranscript } from "../src/runtime/transcript.js";

type RecordedStep = Parameters<
  ReturnType<typeof createTranscript>["recordStep"]
>[0];

const validRecordedStep: RecordedStep = {
  actor: "npc_a",
  observation: { nearby: ["npc_b"] },
  tool: "say",
  args: { text: "hello" },
  result: { status: "busy" }
};

void validRecordedStep;

const invalidRecordedStep: RecordedStep = {
  actor: "npc_a",
  // @ts-expect-error transcript values must be JSON-safe at the API boundary
  observation: () => "not clone-safe",
  tool: "say",
  result: "busy"
};

void invalidRecordedStep;

test("writes a transcript artifact with probe, bots, steps, and final result", async () => {
  const evidenceDir = path.resolve(
    "probe/test-artifacts",
    `transcript-${process.pid}-${Date.now()}`
  );

  await fs.rm(evidenceDir, { recursive: true, force: true });

  const transcript = createTranscript({
    evidenceDir,
    probeId: "agent_loop_probe_v0",
    bots: ["npc_a", "npc_b"]
  });

  transcript.recordStep({
    actor: "npc_a",
    observation: "npc_b is nearby",
    tool: "say",
    result: "busy"
  });

  const outputPath = await transcript.write({
    status: "success",
    why: "runtime-owned busy result changed the next action"
  });

  const output = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.equal(output.probe, "agent_loop_probe_v0");
  assert.deepEqual(output.bots, ["npc_a", "npc_b"]);
  assert.equal(output.steps.length, 1);
  assert.equal(output.steps[0].actor, "npc_a");
  assert.equal(output.final.status, "success");

  await fs.rm(evidenceDir, { recursive: true, force: true });
});

test("snapshots bots and steps so later mutations do not change the transcript", async () => {
  const evidenceDir = path.resolve(
    "probe/test-artifacts",
    `transcript-snapshots-${process.pid}-${Date.now()}`
  );

  await fs.rm(evidenceDir, { recursive: true, force: true });

  const bots = ["npc_a", "npc_b"];
  const transcript = createTranscript({
    evidenceDir,
    probeId: "agent_loop_probe_v0",
    bots
  });

  bots.push("npc_c");

  const step = {
    actor: "npc_a",
    observation: "npc_b is nearby",
    tool: "say",
    args: { text: "hello" },
    result: { status: "busy" }
  };

  transcript.recordStep(step);

  step.observation = "mutated observation";
  step.tool = "wait";
  step.args.text = "mutated";
  step.result.status = "done";

  const outputPath = await transcript.write({
    status: "success",
    why: "runtime-owned busy result changed the next action"
  });

  const output = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.deepEqual(output.bots, ["npc_a", "npc_b"]);
  assert.deepEqual(output.steps, [
    {
      actor: "npc_a",
      observation: "npc_b is nearby",
      tool: "say",
      args: { text: "hello" },
      result: { status: "busy" }
    }
  ]);

  await fs.rm(evidenceDir, { recursive: true, force: true });
});

test("writes mutual transcript steps from dispatcher execution including memory notes", async () => {
  const evidenceDir = path.resolve(
    "probe/test-artifacts",
    `mutual-transcript-${process.pid}-${Date.now()}`
  );

  await fs.rm(evidenceDir, { recursive: true, force: true });

  const transcript = createMutualTranscript({
    evidenceDir,
    probeId: "live_npc_dialogue",
    bots: ["npc_a", "npc_b"]
  });
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper"
  });
  const actor = {
    username: "npc_a",
    chat() {}
  };

  await executeMutualTool({
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
    observation: { visibleActors: ["npc_b"] },
    transcript
  });

  await executeMutualTool({
    proposal: {
      tool: "remember",
      args: {
        note: "Jun agreed to check the chest."
      }
    },
    actor,
    runtimeState,
    observation: {
      visibleActors: ["npc_b"],
      recentUtterances: runtimeState.recentUtterances()
    },
    transcript,
    handlers: {
      remember() {
        return {
          status: "remembered",
          note: "Jun agreed to check the chest."
        };
      }
    }
  });

  const outputPath = await transcript.write({
    status: "success",
    why: "conversation progressed"
  });

  const output = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.equal(output.steps[0].actorAction.tool, "converse");
  assert.equal(output.steps[0].actorArgs.utterance, "Jun, check the marker by the chest.");
  assert.equal(output.steps[0].providerMeta.why, "I need Jun to confirm the marker location.");
  assert.equal(output.steps[1].actorAction.tool, "remember");
  assert.equal(output.steps[1].memoryNote.note, "Jun agreed to check the chest.");

  await fs.rm(evidenceDir, { recursive: true, force: true });
});
