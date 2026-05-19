import { promises as fs } from "node:fs";
import path from "node:path";

import type { CanonicalTranscriptPart, CanonicalJsonValue } from "../canonical/transcriptParts.js";

export type CanonicalTranscriptFinal = Record<string, CanonicalJsonValue> & {
  status: string;
  why: string;
};

export async function writeCanonicalTranscript(input: {
  evidenceDir: string;
  probeId: string;
  parts: CanonicalTranscriptPart[];
  final: CanonicalTranscriptFinal;
}) {
  await fs.mkdir(input.evidenceDir, { recursive: true });

  const outputPath = path.join(input.evidenceDir, `${input.probeId}-canonical-${Date.now()}.json`);
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        probe: input.probeId,
        parts: input.parts,
        final: input.final
      },
      null,
      2
    )
  );

  return outputPath;
}
