import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompactionCheckpoint,
  reconstructFromCheckpoint,
  checkpointToTranscriptPart,
  type CompactionCheckpointSummary
} from "../src/runtime/compaction/compactionCheckpoint.js";
import type { CanonicalTranscriptPart } from "../src/transcript/canonical/transcriptParts.js";

function makeParts(count: number): CanonicalTranscriptPart[] {
  return Array.from({ length: count }, (_, i) => ({
    kind: "tool_call" as const,
    threadId: "thread:npc_a",
    turn: i + 1,
    actorId: "npc_a",
    tool: `step_${i}`,
    args: {}
  }));
}

const baseSummary: CompactionCheckpointSummary = {
  overallMission: "Bootstrap NPC society",
  agents: [
    {
      agentId: "npc_a",
      roleId: "gatherer",
      lifecycleMode: "bootstrap",
      currentTask: "collect_4_logs",
      currentIntent: "bootstrap_progress",
      inventorySummary: ["oak_log x 2"],
      activeTensions: [],
      unresolvedBlockers: [],
      nextExpectedAction: "collect_logs"
    }
  ],
  sharedSettlement: {
    knownSharedChests: [],
    resourceSummary: [],
    recentMajorEvents: [],
    lastHostileSighting: null
  },
  worldAnchors: ["spawn_point"],
  completedTaskIds: []
};

test("compaction checkpoint preserves recent tail and compact summary", () => {
  const parts = makeParts(20);

  const checkpoint = buildCompactionCheckpoint({
    currentTurn: 20,
    allParts: parts,
    summary: baseSummary
  });

  assert.equal(checkpoint.createdAtTurn, 20);
  assert.equal(checkpoint.recentTail.length, 12, "should keep last 12 parts as tail");
  assert.equal(checkpoint.recentTail[0].turn, 9, "tail should start from part 9");
  assert.equal(checkpoint.summary.overallMission, "Bootstrap NPC society");
});

test("compaction checkpoint produces a transcript part for canonical replay", () => {
  const parts = makeParts(5);
  const checkpoint = buildCompactionCheckpoint({
    currentTurn: 5,
    allParts: parts,
    summary: baseSummary
  });

  const transcriptPart = checkpointToTranscriptPart(checkpoint);
  assert.equal(transcriptPart.kind, "checkpoint");
  assert.equal(transcriptPart.threadId, "system");
  assert.equal(transcriptPart.turn, 5);
});

test("reconstruction from checkpoint provides summary plus recent parts", () => {
  const parts = makeParts(15);
  const checkpoint = buildCompactionCheckpoint({
    currentTurn: 15,
    allParts: parts,
    summary: baseSummary
  });

  const { checkpointSummary, recentParts } = reconstructFromCheckpoint(checkpoint);
  assert.equal(checkpointSummary.overallMission, "Bootstrap NPC society");
  assert.equal(recentParts.length, 12);

  // Mutation isolation
  checkpointSummary.overallMission = "mutated";
  const fresh = reconstructFromCheckpoint(checkpoint);
  assert.equal(fresh.checkpointSummary.overallMission, "Bootstrap NPC society");
});
