import { promises as fs } from "node:fs";
import path from "node:path";

import { GoogleGenAI, Modality } from "@google/genai";

import { assertDirectGeneratedActionSkillSource } from "../src/generatedActionSkills/directExecutor.js";
import { loadGeminiApiKey } from "../src/provider/gemini/auth.js";
import { loadGeminiPlannerConfig } from "../src/provider/gemini/config.js";
import { extractNativeAudioDialogText } from "../src/provider/gemini/nativeAudioDialog.js";
import { callGeminiTextGenai } from "../src/provider/gemini/textGenai.js";

/** Keep prompts tiny so parallel Live turns finish faster. */
const SHORT_TS_PROMPT =
  "Return only TypeScript with no markdown: export async function run(ctx) { await ctx.craftStonePickaxe(1); }";

const TURN_TIMEOUT_MS = 45_000;
const PARALLEL_LIMIT = 4;

export type ExperimentId =
  | "text-genai-flash"
  | "live-audio-transcription-only"
  | "live-audio-modelTurn-only"
  | "live-audio-prefer-modelTurn"
  | "live-text-modality-native"
  | "live-text-modality-flash";

export type ExperimentResult = {
  id: ExperimentId;
  channel: "rest" | "live";
  model: string;
  modalities: string;
  extraction: string;
  elapsedMs: number;
  turnComplete: boolean;
  error?: string;
  transcriptionLen: number;
  modelTurnTextLen: number;
  chosenTextLen: number;
  sandbox: "PASS" | "EMPTY" | `FAIL: ${string}`;
  preview: string;
};

type LiveCollect = {
  turnComplete: boolean;
  error?: string;
  transcription: string;
  modelTurnText: string;
};

async function runWithTimeout<T>(label: string, ms: number, fn: () => Promise<T>): Promise<T> {
  return await Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    })
  ]);
}

function sandboxStatus(source: string): ExperimentResult["sandbox"] {
  const trimmed = source.trim();
  if (!trimmed) return "EMPTY";
  try {
    assertDirectGeneratedActionSkillSource(trimmed);
    return "PASS";
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `FAIL: ${msg}`;
  }
}

async function runTextGenaiBaseline(apiKey: string, config: ReturnType<typeof loadGeminiPlannerConfig>) {
  const started = Date.now();
  try {
    const result = await runWithTimeout("text-genai", 60_000, () =>
      callGeminiTextGenai({ apiKey, config, prompt: SHORT_TS_PROMPT })
    );
    const text = result.text.trim();
    return {
      id: "text-genai-flash" as const,
      channel: "rest" as const,
      model: result.model,
      modalities: "n/a",
      extraction: "response.text",
      elapsedMs: Date.now() - started,
      turnComplete: true,
      transcriptionLen: 0,
      modelTurnTextLen: text.length,
      chosenTextLen: text.length,
      sandbox: sandboxStatus(text),
      preview: text.replace(/\s+/g, " ").slice(0, 140)
    };
  } catch (error) {
    return {
      id: "text-genai-flash" as const,
      channel: "rest" as const,
      model: config.textModel,
      modalities: "n/a",
      extraction: "response.text",
      elapsedMs: Date.now() - started,
      turnComplete: false,
      error: error instanceof Error ? error.message : String(error),
      transcriptionLen: 0,
      modelTurnTextLen: 0,
      chosenTextLen: 0,
      sandbox: "EMPTY" as const,
      preview: ""
    };
  }
}

async function collectLiveTurn(input: {
  apiKey: string;
  apiVersion: string;
  model: string;
  modalities: Modality[];
  enableTranscription: boolean;
}): Promise<LiveCollect> {
  const client = new GoogleGenAI({
    apiKey: input.apiKey,
    httpOptions: { apiVersion: input.apiVersion }
  });

  const transcripts: string[] = [];
  const modelTexts: string[] = [];
  let turnComplete = false;
  let error: string | undefined;

  const session = await client.live.connect({
    model: input.model,
    config: {
      responseModalities: input.modalities,
      ...(input.enableTranscription ? { outputAudioTranscription: {} } : {})
    },
    callbacks: {
      onmessage: (message: unknown) => {
        const extracted = extractNativeAudioDialogText(message);
        if (extracted.transcriptionText) {
          transcripts.push(extracted.transcriptionText);
        }
        if (typeof message === "object" && message !== null) {
          const parts =
            (message as { serverContent?: { modelTurn?: { parts?: Array<{ text?: string }> } } })
              .serverContent?.modelTurn?.parts ?? [];
          for (const part of parts) {
            if (typeof part.text === "string" && part.text.trim()) {
              modelTexts.push(part.text);
            }
          }
          if (
            (message as { serverContent?: { turnComplete?: boolean } }).serverContent?.turnComplete
          ) {
            turnComplete = true;
          }
        }
      },
      onerror: (event: ErrorEvent) => {
        error = event.message ?? String(event);
      }
    }
  });

  try {
    await session.sendClientContent({ turns: SHORT_TS_PROMPT, turnComplete: true });
    const deadline = Date.now() + TURN_TIMEOUT_MS;
    while (!turnComplete && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!turnComplete && !error) {
      error = `no turnComplete within ${TURN_TIMEOUT_MS}ms`;
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  } finally {
    try {
      await session.close();
    } catch {
      // ignore close errors
    }
  }

  return {
    turnComplete,
    error,
    transcription: transcripts.join("").trim(),
    modelTurnText: modelTexts.join("").trim()
  };
}

function liveResult(input: {
  id: ExperimentId;
  model: string;
  modalities: Modality[];
  extraction: string;
  started: number;
  collect: LiveCollect;
  choose: (c: LiveCollect) => string;
}): ExperimentResult {
  const chosen = input.choose(input.collect);
  return {
    id: input.id,
    channel: "live",
    model: input.model,
    modalities: input.modalities.join("+"),
    extraction: input.extraction,
    elapsedMs: Date.now() - input.started,
    turnComplete: input.collect.turnComplete,
    error: input.collect.error,
    transcriptionLen: input.collect.transcription.length,
    modelTurnTextLen: input.collect.modelTurnText.length,
    chosenTextLen: chosen.length,
    sandbox: sandboxStatus(chosen),
    preview: chosen.replace(/\s+/g, " ").slice(0, 140)
  };
}

async function runLiveExperiment(input: {
  id: ExperimentId;
  apiKey: string;
  apiVersion: string;
  model: string;
  modalities: Modality[];
  enableTranscription: boolean;
  extraction: string;
  choose: (c: LiveCollect) => string;
}): Promise<ExperimentResult> {
  const started = Date.now();
  try {
    const collect = await runWithTimeout(
      input.id,
      TURN_TIMEOUT_MS + 5_000,
      () =>
        collectLiveTurn({
          apiKey: input.apiKey,
          apiVersion: input.apiVersion,
          model: input.model,
          modalities: input.modalities,
          enableTranscription: input.enableTranscription
        })
    );
    return liveResult({
      id: input.id,
      model: input.model,
      modalities: input.modalities,
      extraction: input.extraction,
      started,
      collect,
      choose: input.choose
    });
  } catch (error) {
    return {
      id: input.id,
      channel: "live",
      model: input.model,
      modalities: input.modalities.join("+"),
      extraction: input.extraction,
      elapsedMs: Date.now() - started,
      turnComplete: false,
      error: error instanceof Error ? error.message : String(error),
      transcriptionLen: 0,
      modelTurnTextLen: 0,
      chosenTextLen: 0,
      sandbox: "EMPTY",
      preview: ""
    };
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  const repoRoot = path.resolve(process.cwd(), "..");
  const apiKey = await loadGeminiApiKey(repoRoot);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const config = loadGeminiPlannerConfig();
  const nativeModel = config.liveModel;
  const textLiveModel = config.textModel;

  const plan = [
    {
      id: "text-genai-flash" as const,
      hypothesis: "REST text out — codegen baseline (should PASS)"
    },
    {
      id: "live-audio-transcription-only" as const,
      hypothesis: "Current prod: AUDIO + outputAudioTranscription only"
    },
    {
      id: "live-audio-modelTurn-only" as const,
      hypothesis: "AUDIO but read modelTurn.parts[].text (not transcription)"
    },
    {
      id: "live-audio-prefer-modelTurn" as const,
      hypothesis: "AUDIO: modelTurn text first, else transcription"
    },
    {
      id: "live-text-modality-native" as const,
      hypothesis: "Force Modality.TEXT on native-audio-latest"
    },
    {
      id: "live-text-modality-flash" as const,
      hypothesis: "Force Modality.TEXT on gemini-2.5-flash via Live"
    }
  ];

  console.log("=== Experiment plan (parallel) ===");
  for (const row of plan) {
    console.log(`- ${row.id}: ${row.hypothesis}`);
  }
  console.log(`parallel_limit=${PARALLEL_LIMIT} turn_timeout_ms=${TURN_TIMEOUT_MS}\n`);

  const startedAll = Date.now();

  const liveJobs = [
    () =>
      runLiveExperiment({
        id: "live-audio-transcription-only",
        apiKey,
        apiVersion: config.liveApiVersion,
        model: nativeModel,
        modalities: [Modality.AUDIO],
        enableTranscription: true,
        extraction: "outputTranscription only (production)",
        choose: (c) => c.transcription
      }),
    () =>
      runLiveExperiment({
        id: "live-audio-modelTurn-only",
        apiKey,
        apiVersion: config.liveApiVersion,
        model: nativeModel,
        modalities: [Modality.AUDIO],
        enableTranscription: true,
        extraction: "modelTurn.parts[].text only",
        choose: (c) => c.modelTurnText
      }),
    () =>
      runLiveExperiment({
        id: "live-audio-prefer-modelTurn",
        apiKey,
        apiVersion: config.liveApiVersion,
        model: nativeModel,
        modalities: [Modality.AUDIO],
        enableTranscription: true,
        extraction: "modelTurn then transcription",
        choose: (c) => c.modelTurnText || c.transcription
      }),
    () =>
      runLiveExperiment({
        id: "live-text-modality-native",
        apiKey,
        apiVersion: config.liveApiVersion,
        model: nativeModel,
        modalities: [Modality.TEXT],
        enableTranscription: false,
        extraction: "modelTurn.parts[].text",
        choose: (c) => c.modelTurnText || c.transcription
      }),
    () =>
      runLiveExperiment({
        id: "live-text-modality-flash",
        apiKey,
        apiVersion: config.liveApiVersion,
        model: textLiveModel,
        modalities: [Modality.TEXT],
        enableTranscription: false,
        extraction: "modelTurn.parts[].text",
        choose: (c) => c.modelTurnText || c.transcription
      })
  ];

  const [baseline, ...liveResults] = await Promise.all([
    runTextGenaiBaseline(apiKey, config),
    ...liveJobs.map((job) => job())
  ]);

  const results = [baseline, ...liveResults];
  const report = {
    schema: "gemini-planner-matrix-report/v1",
    created_at: new Date().toISOString(),
    prompt: SHORT_TS_PROMPT,
    models: { nativeModel, textLiveModel, apiVersion: config.liveApiVersion },
    elapsedMs: Date.now() - startedAll,
    plan,
    results
  };

  const reportPath = path.resolve(repoRoot, "tmp/gemini-planner-matrix-report.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("=== Results ===\n");
  console.log("id\tchannel\tsandbox\ttransLen\tmodelTextLen\tchosenLen\tms\terror");
  for (const row of results) {
    console.log(
      [
        row.id,
        row.channel,
        row.sandbox,
        row.transcriptionLen,
        row.modelTurnTextLen,
        row.chosenTextLen,
        row.elapsedMs,
        row.error ?? "-"
      ].join("\t")
    );
    if (row.preview) {
      console.log(`  preview: ${row.preview}`);
    }
  }

  const livePass = results.filter((r) => r.channel === "live" && r.sandbox === "PASS");
  console.log("\n=== Conclusions ===");
  console.log(`report: ${reportPath}`);
  console.log(`total_elapsed_ms: ${report.elapsedMs}`);
  console.log(`text-genai PASS: ${baseline.sandbox === "PASS"}`);
  console.log(`live sandbox PASS count: ${livePass.length}`);
  if (livePass.length > 0) {
    console.log(`live PASS via: ${livePass.map((r) => r.id).join(", ")}`);
  } else {
    console.log("No Live path produced sandbox-valid TS in this matrix.");
  }

  process.exitCode = baseline.sandbox === "PASS" ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
