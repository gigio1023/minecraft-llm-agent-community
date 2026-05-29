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
  providerOutputRef?: string;
};

type TranscriptFinal = Record<string, JsonValue> & {
  status: string;
  why: string;
};

type CreateTranscriptOptions = {
  evidenceDir: string;
  probeId: string;
  bots: string[];
  metadata?: Record<string, JsonValue>;
};

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createTranscript({
  evidenceDir,
  probeId,
  bots,
  metadata = {}
}: CreateTranscriptOptions) {
  const transcriptBots = snapshot(bots);
  const transcriptMetadata = snapshot(metadata);
  const steps: TranscriptStep[] = [];
  const canonical = createCanonicalTranscript();

  return {
    recordStep(step: TranscriptStep) {
      // Preserve the raw probe step for quick inspection while also projecting
      // it into canonical parts that can survive compaction and filtering.
      steps.push(snapshot(step));

      // Canonical transcript keeps every observe -> tool_call -> tool_result
      // triple so failures and stalls remain inspectable after compaction.
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
      // The non-canonical payload is intentionally redundant with canonical
      // parts; it is optimized for humans reading one run artifact quickly.
      const payload = {
        probe: probeId,
        bots: transcriptBots,
        metadata: transcriptMetadata,
        steps,
        debugTimeline: projectDebugTimeline(canonical.list()),
        final: snapshot(final)
      };

      await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));

      // Checkpoint lives in the canonical artifact, while the JSON probe payload
      // above stays a raw step log plus projected debug timeline. The current
      // checkpoint is minimal until richer thread snapshots are wired in.
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
          topContextSignals: [],
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
