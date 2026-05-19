import type { CanonicalTranscriptPart, CanonicalJsonValue } from "../../transcript/canonical/transcriptParts.js";
import type { LifecycleMode } from "../../runtime/pressureIntent.js";

// ---------------------------------------------------------------------------
// Compaction Checkpoint
// ---------------------------------------------------------------------------
// SPEC §10.3: compaction is not summary-only. It produces replacement-history
// checkpoints that keep the recent raw tail plus a compact summary of
// everything before the checkpoint boundary.
// ---------------------------------------------------------------------------

export type CompactionCheckpointSummary = {
  overallMission: string;
  agents: Array<{
    agentId: string;
    roleId: string;
    lifecycleMode: LifecycleMode;
    currentTask: string | null;
    currentIntent: string | null;
    inventorySummary: string[];
    activeTensions: string[];
    unresolvedBlockers: string[];
    nextExpectedAction: string | null;
  }>;
  sharedSettlement: {
    knownSharedChests: Array<{
      chestId: string;
      itemCount: number;
    }>;
    resourceSummary: string[];
    recentMajorEvents: string[];
    lastHostileSighting: string | null;
  };
  worldAnchors: string[];
  completedTaskIds: string[];
};

export type CompactionCheckpoint = {
  id: string;
  createdAtTurn: number;
  summary: CompactionCheckpointSummary;
  recentTailStartTurn: number;
  recentTail: CanonicalTranscriptPart[];
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

const RECENT_TAIL_SIZE = 12;

let checkpointIdCounter = 0;

function nextCheckpointId() {
  checkpointIdCounter += 1;
  return `checkpoint-${checkpointIdCounter}`;
}

export type BuildCompactionCheckpointInput = {
  currentTurn: number;
  allParts: CanonicalTranscriptPart[];
  summary: CompactionCheckpointSummary;
};

export function buildCompactionCheckpoint({
  currentTurn,
  allParts,
  summary
}: BuildCompactionCheckpointInput): CompactionCheckpoint {
  const tailStart = Math.max(0, allParts.length - RECENT_TAIL_SIZE);
  const recentTail = allParts.slice(tailStart).map((part) => structuredClone(part));
  const recentTailStartTurn = recentTail.length > 0
    ? recentTail[0].turn
    : currentTurn;

  return {
    id: nextCheckpointId(),
    createdAtTurn: currentTurn,
    summary: structuredClone(summary),
    recentTailStartTurn,
    recentTail
  };
}

// ---------------------------------------------------------------------------
// Checkpoint can produce a compact canonical transcript part
// ---------------------------------------------------------------------------

export function checkpointToTranscriptPart(
  checkpoint: CompactionCheckpoint
): CanonicalTranscriptPart {
  return {
    kind: "checkpoint",
    threadId: "system",
    turn: checkpoint.createdAtTurn,
    actorId: "system",
    summary: checkpoint.summary as unknown as CanonicalJsonValue
  };
}

// ---------------------------------------------------------------------------
// Reconstruct working context from checkpoint + recent tail
// ---------------------------------------------------------------------------

export type ReconstructedContext = {
  checkpointSummary: CompactionCheckpointSummary;
  recentParts: CanonicalTranscriptPart[];
};

export function reconstructFromCheckpoint(
  checkpoint: CompactionCheckpoint
): ReconstructedContext {
  return {
    checkpointSummary: structuredClone(checkpoint.summary),
    recentParts: checkpoint.recentTail.map((part) => structuredClone(part))
  };
}
