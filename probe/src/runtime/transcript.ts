import { promises as fs } from "node:fs";
import path from "node:path";

import { createCanonicalTranscript } from "../transcript/canonical/transcriptParts.js";
import { buildCheckpointSummary } from "../memory/summaries/checkpointSummary.js";
import { projectDebugTimeline } from "../transcript/projectors/debugTimeline.js";
import { writeCanonicalTranscript } from "../transcript/persistence/jsonTranscriptStore.js";

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
  const canonical = createCanonicalTranscript();

  return {
    recordStep(step: TranscriptStep) {
      steps.push(snapshot(step));

       canonical.append({
        kind: "observation",
        threadId: `thread:${step.actor}`,
        turn: steps.length,
        actorId: step.actor,
        data: snapshot(step.observation)
      });
      canonical.append({
        kind: "tool_call",
        threadId: `thread:${step.actor}`,
        turn: steps.length,
        actorId: step.actor,
        tool: step.tool,
        args: snapshot(step.args ?? {})
      });
      canonical.append({
        kind: "tool_result",
        threadId: `thread:${step.actor}`,
        turn: steps.length,
        actorId: step.actor,
        tool: step.tool,
        result: snapshot(step.result)
      });
    },
    async write(final: TranscriptFinal) {
      await fs.mkdir(evidenceDir, { recursive: true });

      const outputPath = path.join(evidenceDir, `${probeId}-${Date.now()}.json`);
      const payload = {
        probe: probeId,
        bots: transcriptBots,
        steps,
        debugTimeline: projectDebugTimeline(canonical.list()),
        final: snapshot(final)
      };

      await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));

      canonical.append({
        kind: "checkpoint",
        threadId: `thread:${transcriptBots[0] ?? "npc_a"}`,
        turn: steps.length,
        actorId: transcriptBots[0] ?? "npc_a",
        summary: buildCheckpointSummary({
          agentId: transcriptBots[0] ?? "npc_a",
          roleId: "quartermaster",
          lifecycleMode: "normal",
          currentTask: null,
          currentIntent: null,
          topPressures: [],
          workingMemory: {},
          privateMemorySummary: [],
          sharedSettlement: {}
        })
      });

      await writeCanonicalTranscript({
        evidenceDir,
        probeId,
        parts: canonical.list(),
        final: snapshot(final)
      });

      return outputPath;
    }
  };
}
