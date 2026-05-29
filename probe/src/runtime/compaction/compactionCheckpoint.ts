import type { CanonicalTranscriptPart, CanonicalJsonValue } from "../../transcript/canonical/transcriptParts.js";
import type { LifecycleMode } from "../../runtime/contextIntent.js";

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

/**
 * Builds a replacement-history checkpoint for transcript compaction.
 *
 * The summary covers everything before the boundary, while recentTail keeps raw
 * canonical parts close to the decision point. That split lets a resumed actor
 * preserve concrete recent evidence without carrying the whole transcript.
 */
export function buildCompactionCheckpoint({
  currentTurn,
  allParts,
  summary
}: BuildCompactionCheckpointInput): CompactionCheckpoint {
  const tailStart = Math.max(0, allParts.length - RECENT_TAIL_SIZE);
  const recentTail = allParts.slice(tailStart).map((part) => structuredClone(part));
  // Use the first retained part's turn so reconstruction can state exactly how
  // much raw history remains after the compact summary.
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

/** Converts a checkpoint into the canonical event stream as system evidence. */
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

export type ReconstructedContext = {
  checkpointSummary: CompactionCheckpointSummary;
  recentParts: CanonicalTranscriptPart[];
};

/**
 * Rehydrates only the compact summary and retained raw tail.
 *
 * Callers should treat this as sufficient context for the next turn, not as a
 * lossless transcript replay.
 */
export function reconstructFromCheckpoint(
  checkpoint: CompactionCheckpoint
): ReconstructedContext {
  return {
    checkpointSummary: structuredClone(checkpoint.summary),
    recentParts: checkpoint.recentTail.map((part) => structuredClone(part))
  };
}
