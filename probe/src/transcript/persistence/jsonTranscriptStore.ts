import { promises as fs } from "node:fs";
import path from "node:path";

import type { CanonicalTranscriptPart, CanonicalJsonValue } from "../canonical/transcriptParts.js";

export type CanonicalTranscriptFinal = Record<string, CanonicalJsonValue> & {
  status: string;
  why: string;
};

// ---------------------------------------------------------------------------
// Persistence Mode (SPEC §10.4)
// ---------------------------------------------------------------------------
// - limited: semantic action/result/checkpoint only
// - extended: raw observations, traces, diagnostics, path logs included
// ---------------------------------------------------------------------------

export type PersistenceMode = "limited" | "extended";

function shouldIncludePart(part: CanonicalTranscriptPart, mode: PersistenceMode): boolean {
  if (mode === "extended") {
    return true;
  }

  // In limited mode, skip raw observations and keep only actionable parts
  switch (part.kind) {
    case "tool_call":
    case "tool_result":
    case "checkpoint":
    case "turn_context":
    case "task":
    case "memory_update":
      return true;
    case "observation":
      // In limited mode, only keep observations that have minimal content
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
