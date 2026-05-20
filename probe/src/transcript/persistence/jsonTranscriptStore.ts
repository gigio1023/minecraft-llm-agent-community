import { promises as fs } from "node:fs";
import path from "node:path";

import type { CanonicalTranscriptPart, CanonicalJsonValue } from "../canonical/transcriptParts.js";

export type CanonicalTranscriptFinal = Record<string, CanonicalJsonValue> & {
  status: string;
  why: string;
};

export type PersistenceMode = "limited" | "extended";

/**
 * Applies the transcript persistence policy before writing evidence to disk.
 *
 * `extended` is the debugging mode: keep raw observations and diagnostics.
 * `limited` is the shareable mode: keep semantic actions, results, checkpoints,
 * and memory context while excluding raw observation blobs.
 */
function shouldIncludePart(part: CanonicalTranscriptPart, mode: PersistenceMode): boolean {
  if (mode === "extended") {
    return true;
  }

  switch (part.kind) {
    case "tool_call":
    case "tool_result":
    case "checkpoint":
    case "turn_context":
    case "task":
    case "memory_update":
      return true;
    case "observation":
      return false;
    case "chat_utterance":
      return true;
    default:
      return true;
  }
}

export function filterPartsForPersistence(
  parts: CanonicalTranscriptPart[],
  mode: PersistenceMode
): CanonicalTranscriptPart[] {
  return parts.filter((part) => shouldIncludePart(part, mode));
}

export async function writeCanonicalTranscript(input: {
  evidenceDir: string;
  probeId: string;
  parts: CanonicalTranscriptPart[];
  final: CanonicalTranscriptFinal;
  mode?: PersistenceMode;
}) {
  const mode = input.mode ?? "extended";
  // Filter before counting so partCount matches the artifact a reviewer opens,
  // not the in-memory event stream that may include omitted observations.
  const filteredParts = filterPartsForPersistence(input.parts, mode);

  await fs.mkdir(input.evidenceDir, { recursive: true });

  const outputPath = path.join(input.evidenceDir, `${input.probeId}-canonical-${Date.now()}.json`);
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        probe: input.probeId,
        persistenceMode: mode,
        partCount: filteredParts.length,
        parts: filteredParts,
        final: input.final
      },
      null,
      2
    )
  );

  return outputPath;
}
