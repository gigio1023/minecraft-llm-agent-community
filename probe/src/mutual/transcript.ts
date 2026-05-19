import { promises as fs } from "node:fs";
import path from "node:path";

import type { MutualJsonValue, MutualStepRecord } from "./types.js";

type TranscriptFinal = Record<string, MutualJsonValue> & {
  status: string;
  why: string;
};

type CreateMutualTranscriptOptions = {
  evidenceDir: string;
  probeId: string;
  bots: string[];
};

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createMutualTranscript({
  evidenceDir,
  probeId,
  bots
}: CreateMutualTranscriptOptions) {
  const transcriptBots = snapshot(bots);
  const steps: MutualStepRecord[] = [];

  return {
    recordStep(step: MutualStepRecord) {
      steps.push(snapshot(step));
    },
    async write(final: TranscriptFinal) {
      await fs.mkdir(evidenceDir, { recursive: true });

      const outputPath = path.join(evidenceDir, `${probeId}-${Date.now()}.json`);
      const payload = {
        probe: probeId,
        bots: transcriptBots,
        steps,
        final: snapshot(final)
      };

      await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));

      return outputPath;
    }
  };
}
