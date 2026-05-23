import { promises as fs } from "node:fs";
import path from "node:path";

import { loadGeminiApiKey } from "./auth.js";
import { loadGeminiPlannerConfig } from "./config.js";
import { runNativeAudioDialog } from "./nativeAudioDialog.js";

type DialogCaseResult = {
  case_id: string;
  ok: boolean;
  assistantTextPreview: string;
  transcriptionChunks: number;
  audioChunksDiscarded: number;
  inlineDataPartsIgnored: number;
  model: string;
  requestedModel: string;
  apiVersion: string;
  error?: string;
};

type DialogSmokeReport = {
  schema: "gemini-native-audio-dialog-smoke/v1";
  ok: boolean;
  mode: "transcription_only";
  model: string;
  requestedModel: string;
  apiVersion: string;
  cases: DialogCaseResult[];
};

function parseArgs(argv: string[]) {
  const options: { report?: string } = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--report") {
      options.report = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

async function runCase(input: {
  caseId: string;
  apiKey: string;
  config: ReturnType<typeof loadGeminiPlannerConfig>;
  turns: Array<{ role: "user"; text: string }>;
  assert?: (text: string) => void;
}): Promise<DialogCaseResult> {
  try {
    const result = await runNativeAudioDialog({
      apiKey: input.apiKey,
      config: input.config,
      turns: input.turns
    });

    input.assert?.(result.assistantText);

    return {
      case_id: input.caseId,
      ok: true,
      assistantTextPreview: result.assistantText.slice(0, 240),
      transcriptionChunks: result.transcriptionChunks,
      audioChunksDiscarded: result.audioChunksDiscarded,
      inlineDataPartsIgnored: result.inlineDataPartsIgnored,
      model: result.model,
      requestedModel: result.requestedModel,
      apiVersion: result.apiVersion
    };
  } catch (error) {
    return {
      case_id: input.caseId,
      ok: false,
      assistantTextPreview: "",
      transcriptionChunks: 0,
      audioChunksDiscarded: 0,
      inlineDataPartsIgnored: 0,
      model: input.config.liveModel,
      requestedModel: input.config.liveModel,
      apiVersion: input.config.liveApiVersion,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(process.cwd(), "..");
  const apiKey = await loadGeminiApiKey(repoRoot);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const config = loadGeminiPlannerConfig("live-transcription");
  const cases: DialogCaseResult[] = [];

  cases.push(
    await runCase({
      caseId: "json_single_turn",
      apiKey,
      config,
      turns: [{ role: "user", text: 'Return only JSON: {"ok":true}' }],
      assert: (text) => {
        if (!/\"ok\"\s*:\s*true/.test(text)) {
          throw new Error(`expected {"ok":true} in transcription, got: ${text.slice(0, 120)}`);
        }
      }
    })
  );

  cases.push(
    await runCase({
      caseId: "dialog_two_turn_session",
      apiKey,
      config,
      turns: [
        { role: "user", text: "Remember the codeword ORCHID. Reply ACK only." },
        { role: "user", text: "What codeword did I ask you to remember? Reply with only that word." }
      ],
      assert: (text) => {
        if (!/orchid/i.test(text)) {
          throw new Error(`expected codeword ORCHID in transcription, got: ${text.slice(0, 120)}`);
        }
      }
    })
  );

  const report: DialogSmokeReport = {
    schema: "gemini-native-audio-dialog-smoke/v1",
    ok: cases.every((entry) => entry.ok),
    mode: "transcription_only",
    model: cases[0]?.model ?? config.liveModel,
    requestedModel: config.liveModel,
    apiVersion: config.liveApiVersion,
    cases
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const reportPath = path.resolve(options.report ?? "../tmp/gemini-native-audio-dialog-smoke.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, serialized, "utf8");

  for (const entry of cases) {
    console.log(
      `dialog_smoke case=${entry.case_id} ok=${entry.ok} audio_discarded=${entry.audioChunksDiscarded} transcription_chunks=${entry.transcriptionChunks}`
    );
  }
  console.log(`dialog_smoke_ok=${report.ok}`);
  console.log(`dialog_smoke_report=${reportPath}`);

  process.exitCode = report.ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
