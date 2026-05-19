import { promises as fs } from "node:fs";
import path from "node:path";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type TranscriptStep = {
  actor: string;
  observation: JsonValue;
  tool: string;
  result: JsonValue;
  args?: Record<string, JsonValue>;
};

type TranscriptFinal = Record<string, JsonValue> & {
  status: string;
  why: string;
};

type CreateTranscriptOptions = {
  evidenceDir: string;
  probeId: string;
  bots: string[];
};

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createTranscript({
  evidenceDir,
  probeId,
  bots
}: CreateTranscriptOptions) {
  const transcriptBots = snapshot(bots);
  const steps: TranscriptStep[] = [];

  return {
    recordStep(step: TranscriptStep) {
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
