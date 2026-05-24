import path from "node:path";

import { GoogleGenAI, Modality } from "@google/genai";

import { assertDirectGeneratedActionSkillSource } from "../src/generatedActionSkills/directExecutor.js";
import { getLongPhaseDefinition } from "../src/objectives/longObjective/ladder.js";
import { loadGeminiApiKey } from "../src/provider/gemini/auth.js";
import { loadGeminiPlannerConfig } from "../src/provider/gemini/config.js";
import {
  extractNativeAudioDialogText,
  resolveNativeAudioDialogModel
} from "../src/provider/gemini/nativeAudioDialog.js";
import { callGeminiTextGenai } from "../src/provider/gemini/textGenai.js";

type ModalityMode = "AUDIO" | "TEXT" | "AUDIO_TEXT";

type LiveExperimentRow = {
  mode: ModalityMode;
  ok: boolean;
  error?: string;
  transcriptionLen: number;
  modelTurnTextLen: number;
  modelTurnTextPreview: string;
  transcriptionPreview: string;
  extractionCurrent: string;
  extractionModelTurnOnly: string;
  extractionPreferModelTurn: string;
  sandboxCurrent: string;
  sandboxModelTurnOnly: string;
  sandboxPreferModelTurn: string;
};

type LiveServerMessageLike = {
  serverContent?: {
    turnComplete?: boolean;
    outputTranscription?: { text?: string };
    outputAudioTranscription?: { text?: string };
    modelTurn?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string } }> };
  };
};

function buildPrompt() {
  const phase = getLongPhaseDefinition("craft_current_run_stone_pickaxe_1");
  return [
    "Generate one TypeScript action skill for a Minecraft Mineflayer bot.",
    "Return only TypeScript source. Do not wrap it in markdown.",
    "The source must export exactly: export async function run(ctx) { ... }",
    "Never use import, require, eval, or Node APIs.",
    `Phase objective: ${phase.summary}`,
    `Success criteria: current-run evidence for ${phase.targetItemName} >= ${phase.minCount}`
  ].join("\n");
}

function collectModelTurnText(message: unknown): string {
  if (typeof message !== "object" || message === null) return "";
  const parts = (message as LiveServerMessageLike).serverContent?.modelTurn?.parts ?? [];
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function sandboxLabel(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "EMPTY";
  try {
    assertDirectGeneratedActionSkillSource(trimmed);
    return "PASS";
  } catch (error) {
    return `FAIL: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function runLiveModalityExperiment(input: {
  apiKey: string;
  config: ReturnType<typeof loadGeminiPlannerConfig>;
  prompt: string;
  mode: ModalityMode;
}): Promise<LiveExperimentRow> {
  const model = resolveNativeAudioDialogModel(input.config.liveModel);
  const client = new GoogleGenAI({
    apiKey: input.apiKey,
    httpOptions: { apiVersion: input.config.liveApiVersion }
  });

  const modalities =
    input.mode === "AUDIO"
      ? [Modality.AUDIO]
      : input.mode === "TEXT"
        ? [Modality.TEXT]
        : [Modality.AUDIO, Modality.TEXT];

  const transcripts: string[] = [];
  const modelTurnTexts: string[] = [];
  let turnComplete = false;
  let error: string | undefined;

  try {
    const session = await client.live.connect({
      model,
      config: {
        responseModalities: modalities,
        ...(modalities.includes(Modality.AUDIO) ? { outputAudioTranscription: {} } : {}),
        systemInstruction:
          "Reply in plain text only. When asked for TypeScript, return valid TypeScript with: export async function run(ctx) { ... }"
      },
      callbacks: {
        onmessage: (message: unknown) => {
          const extracted = extractNativeAudioDialogText(message);
          if (extracted.transcriptionText) {
            transcripts.push(extracted.transcriptionText);
          }
          const partText = collectModelTurnText(message);
          if (partText) {
            modelTurnTexts.push(partText);
          }
          if (
            typeof message === "object" &&
            message !== null &&
            (message as LiveServerMessageLike).serverContent?.turnComplete
          ) {
            turnComplete = true;
          }
        },
        onerror: (event: ErrorEvent) => {
          error = event.message ?? String(event);
        }
      }
    });

    await session.sendClientContent({ turns: input.prompt, turnComplete: true });

    const deadline = Date.now() + Math.min(input.config.liveTurnTimeoutMs, 120_000);
    while (!turnComplete && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    await session.close();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const transcription = transcripts.join("").trim();
  const modelTurnText = modelTurnTexts.join("").trim();
  const extractionCurrent = transcription;
  const extractionModelTurnOnly = modelTurnText;
  const extractionPreferModelTurn = modelTurnText || transcription;

  return {
    mode: input.mode,
    ok: !error && Boolean(extractionPreferModelTurn),
    error,
    transcriptionLen: transcription.length,
    modelTurnTextLen: modelTurnText.length,
    modelTurnTextPreview: modelTurnText.replace(/\s+/g, " ").slice(0, 120),
    transcriptionPreview: transcription.replace(/\s+/g, " ").slice(0, 120),
    extractionCurrent,
    extractionModelTurnOnly,
    extractionPreferModelTurn,
    sandboxCurrent: sandboxLabel(extractionCurrent),
    sandboxModelTurnOnly: sandboxLabel(extractionModelTurnOnly),
    sandboxPreferModelTurn: sandboxLabel(extractionPreferModelTurn)
  };
}

async function main() {
  const repoRoot = path.resolve(process.cwd(), "..");
  const apiKey = await loadGeminiApiKey(repoRoot);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const config = loadGeminiPlannerConfig();
  const prompt = buildPrompt();

  console.log("=== Live API modality experiment (same Mineflayer prompt) ===\n");
  console.log(`model=${config.liveModel} apiVersion=${config.liveApiVersion}\n`);

  const rows: LiveExperimentRow[] = [];
  for (const mode of ["AUDIO", "TEXT", "AUDIO_TEXT"] as const) {
    console.log(`running live modality=${mode}...`);
    rows.push(
      await runLiveModalityExperiment({
        apiKey,
        config,
        prompt,
        mode
      })
    );
  }

  console.log("\n--- text-genai baseline (REST, not Live) ---");
  let textBaseline: { text: string; model: string; sandbox: string } | undefined;
  try {
    const text = await callGeminiTextGenai({ apiKey, config, prompt });
    textBaseline = {
      model: text.model,
      text: text.text.trim(),
      sandbox: sandboxLabel(text.text)
    };
    console.log(`model=${textBaseline.model} sandbox=${textBaseline.sandbox}`);
    console.log(`preview: ${textBaseline.text.replace(/\s+/g, " ").slice(0, 120)}`);
  } catch (caught) {
    console.log(`text-genai error: ${caught instanceof Error ? caught.message : String(caught)}`);
  }

  console.log("\n=== Results table ===\n");
  for (const row of rows) {
    console.log(`[${row.mode}] ok=${row.ok} error=${row.error ?? "-"}`);
    console.log(
      `  transcriptionLen=${row.transcriptionLen} modelTurnTextLen=${row.modelTurnTextLen}`
    );
    if (row.transcriptionLen > 0) {
      console.log(`  transcription: ${row.transcriptionPreview}`);
    }
    if (row.modelTurnTextLen > 0) {
      console.log(`  modelTurn.text: ${row.modelTurnTextPreview}`);
    }
    console.log(`  sandbox current (transcription only): ${row.sandboxCurrent}`);
    console.log(`  sandbox modelTurn.text only:         ${row.sandboxModelTurnOnly}`);
    console.log(`  sandbox prefer modelTurn then trans:   ${row.sandboxPreferModelTurn}`);
    console.log("");
  }

  const anyLivePass = rows.some((r) => r.sandboxPreferModelTurn === "PASS");
  console.log("=== Conclusion ===");
  console.log(
    `Live API produced sandbox-passing TS via modelTurn or transcription: ${anyLivePass ? "YES" : "NO"}`
  );
  console.log(
    `text-genai REST baseline: ${textBaseline?.sandbox ?? "not run"}`
  );

  process.exitCode = textBaseline?.sandbox === "PASS" || anyLivePass ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
