import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

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

test("writes mutual transcript steps with converse args, memory notes, and provider metadata", async () => {
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

  transcript.recordStep({
    actor: "npc_a",
    observation: { visibleActors: ["npc_b"] },
    actorAction: { tool: "converse" },
    actorArgs: {
      target: "npc_b",
      utterance: "Jun, check the marker by the chest."
    },
    result: {
      status: "said_to_target",
      utterance: "Jun, check the marker by the chest.",
      targetId: "npc_b"
    },
    memoryNote: {
      note: "Jun agreed to check the chest."
    },
    providerMeta: {
      why: "I need Jun to confirm the marker location."
    }
  });

  const outputPath = await transcript.write({
    status: "success",
    why: "conversation progressed"
  });

  const output = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.equal(output.steps[0].actorAction.tool, "converse");
  assert.equal(output.steps[0].actorArgs.utterance, "Jun, check the marker by the chest.");
  assert.equal(output.steps[0].memoryNote.note, "Jun agreed to check the chest.");
  assert.equal(output.steps[0].providerMeta.why, "I need Jun to confirm the marker location.");

  await fs.rm(evidenceDir, { recursive: true, force: true });
});
