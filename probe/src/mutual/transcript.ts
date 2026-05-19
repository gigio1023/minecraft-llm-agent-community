import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  CreateMutualTranscriptOptions,
  MutualCategories,
  MutualStepRecord,
  TranscriptFinal
} from "./types.js";

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createMutualTranscript({
  evidenceDir,
  probeId,
  personas
}: CreateMutualTranscriptOptions) {
  const transcriptPersonas = snapshot(personas);
  const steps: MutualStepRecord[] = [];

  return {
    recordStep(step: MutualStepRecord) {
      steps.push(snapshot(step));
    },
    async write(categories: MutualCategories, final: TranscriptFinal) {
      await fs.mkdir(evidenceDir, { recursive: true });

      const outputPath = path.join(evidenceDir, `${probeId}-${Date.now()}.json`);
      await fs.writeFile(
        outputPath,
        JSON.stringify(
          {
            probe: probeId,
            personas: transcriptPersonas,
            categories: snapshot(categories),
            steps,
            final: snapshot(final)
          },
          null,
          2
        )
      );

      return outputPath;
    }
  };
}
