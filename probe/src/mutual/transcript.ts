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
  bots,
  personas
}: CreateMutualTranscriptOptions) {
  const transcriptBots = bots ? snapshot(bots) : undefined;
  const transcriptPersonas = personas ? snapshot(personas) : undefined;
  const steps: MutualStepRecord[] = [];

  return {
    recordStep(step: MutualStepRecord) {
      steps.push(snapshot(step));
    },
    async write(categoriesOrFinal: MutualCategories | TranscriptFinal, maybeFinal?: TranscriptFinal) {
      await fs.mkdir(evidenceDir, { recursive: true });

      const outputPath = path.join(evidenceDir, `${probeId}-${Date.now()}.json`);
      const categories = maybeFinal ? snapshot(categoriesOrFinal as MutualCategories) : undefined;
      const final = maybeFinal ? maybeFinal : (categoriesOrFinal as TranscriptFinal);
      const payload = {
        probe: probeId,
        ...(transcriptBots ? { bots: transcriptBots } : {}),
        ...(transcriptPersonas ? { personas: transcriptPersonas } : {}),
        ...(categories ? { categories } : {}),
        steps,
        final: snapshot(final)
      };

      await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));

      return outputPath;
    }
  };
}
