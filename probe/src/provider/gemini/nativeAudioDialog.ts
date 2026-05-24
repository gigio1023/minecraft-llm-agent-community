import { GoogleGenAI, Modality } from "@google/genai";

import type { GeminiPlannerConfig } from "./config.js";
import { classifyGeminiError, GeminiPlannerError } from "./errors.js";

export type NativeAudioDialogTurn = {
  role: "user";
  text: string;
};

export type NativeAudioDialogResult = {
  path: "native-audio-dialog";
  model: string;
  requestedModel: string;
  apiVersion: string;
  mode: "transcription_only";
  turns: NativeAudioDialogTurn[];
  assistantText: string;
  transcriptionChunks: number;
  audioChunksDiscarded: number;
  inlineDataPartsIgnored: number;
  setupComplete: boolean;
  turnComplete: boolean;
};

const defaultSystemInstruction = [
  "You are a helpful assistant in a text-only dialog channel.",
  "The user sends text. Reply concisely in plain text.",
  "Do not rely on the user hearing audio; your spoken output is transcribed back to text.",
  "When asked for JSON, return valid JSON only with no markdown fences."
].join(" ");

type LiveServerMessageLike = {
  text?: string;
  setupComplete?: Record<string, never>;
  serverContent?: {
    turnComplete?: boolean;
    outputTranscription?: { text?: string };
    outputAudioTranscription?: { text?: string };
    modelTurn?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string } }> };
  };
};

export function resolveNativeAudioDialogModel(requestedModel: string): string {
  const aliases: Record<string, string> = {
    "gemini-2.0-flash-live-001": "gemini-2.5-flash-native-audio-latest",
    "gemini-2.0-flash-live-preview-04-09": "gemini-2.5-flash-native-audio-latest",
    "gemini-2.5-flash-native-audio-dialog": "gemini-2.5-flash-native-audio-latest"
  };

  return aliases[requestedModel] ?? requestedModel;
}

export function extractNativeAudioDialogText(message: unknown): {
  transcriptionText: string;
  audioChunksDiscarded: number;
  inlineDataPartsIgnored: number;
  modelTextIgnored: boolean;
} {
  if (typeof message !== "object" || message === null) {
    return {
      transcriptionText: "",
      audioChunksDiscarded: 0,
      inlineDataPartsIgnored: 0,
      modelTextIgnored: false
    };
  }

  const liveMessage = message as LiveServerMessageLike;
  const chunks: string[] = [];
  let audioChunksDiscarded = 0;
  let inlineDataPartsIgnored = 0;
  let modelTextIgnored = false;

  const server = liveMessage.serverContent;
  if (server) {
    const transcription =
      server.outputTranscription?.text ?? server.outputAudioTranscription?.text;
    if (typeof transcription === "string" && transcription.trim()) {
      chunks.push(transcription);
    }

    for (const part of server.modelTurn?.parts ?? []) {
      if (part.inlineData) {
        inlineDataPartsIgnored += 1;
        if (part.inlineData.mimeType?.startsWith("audio/")) {
          audioChunksDiscarded += 1;
        }
        continue;
      }
      if (typeof part.text === "string" && part.text.trim()) {
        modelTextIgnored = true;
      }
    }
  }

  if (typeof liveMessage.text === "string" && liveMessage.text.trim()) {
    modelTextIgnored = true;
  }

  return {
    transcriptionText: chunks.join("").trim(),
    audioChunksDiscarded,
    inlineDataPartsIgnored,
    modelTextIgnored
  };
}

function createTurnGate(liveTimeoutMs: number) {
  let resolveTurn: (() => void) | undefined;
  let rejectTurn: ((error: Error) => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const turnPromise = new Promise<void>((resolve, reject) => {
    resolveTurn = resolve;
    rejectTurn = reject;
  });

  const arm = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      rejectTurn?.(
        new GeminiPlannerError({
          kind: "timeout",
          message: `native audio dialog turn exceeded ${liveTimeoutMs}ms`,
          retryable: true
        })
      );
    }, liveTimeoutMs);
  };

  return {
    turnPromise,
    arm,
    complete: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      resolveTurn?.();
    },
    fail: (error: Error) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      rejectTurn?.(error);
    },
    cancel: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  };
}

export async function runNativeAudioDialog(input: {
  apiKey: string;
  config: GeminiPlannerConfig;
  turns: NativeAudioDialogTurn[];
  systemInstruction?: string;
}): Promise<NativeAudioDialogResult> {
  if (input.turns.length === 0) {
    throw new GeminiPlannerError({
      kind: "parse",
      message: "native audio dialog requires at least one user turn"
    });
  }

  const apiVersion = input.config.liveApiVersion;
  const requestedModel = input.config.liveModel;
  const model = resolveNativeAudioDialogModel(requestedModel);
  const client = new GoogleGenAI({ apiKey: input.apiKey, httpOptions: { apiVersion } });

  const transcripts: string[] = [];
  let audioChunksDiscarded = 0;
  let inlineDataPartsIgnored = 0;
  let transcriptionChunks = 0;
  let setupComplete = false;
  let lastTurnComplete = false;
  let closeReason: string | undefined;

  const liveTimeoutMs = Math.min(input.config.liveTurnTimeoutMs, 180_000);
  const activeTurn = { gate: createTurnGate(liveTimeoutMs) };

  try {
    const session = await client.live.connect({
      model,
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        systemInstruction: input.systemInstruction ?? defaultSystemInstruction
      },
      callbacks: {
        onmessage: (message: unknown) => {
          if (
            typeof message === "object" &&
            message !== null &&
            "setupComplete" in (message as Record<string, unknown>)
          ) {
            setupComplete = true;
            return;
          }

          const extracted = extractNativeAudioDialogText(message);
          audioChunksDiscarded += extracted.audioChunksDiscarded;
          inlineDataPartsIgnored += extracted.inlineDataPartsIgnored;

          if (extracted.transcriptionText) {
            transcriptionChunks += 1;
            transcripts.push(extracted.transcriptionText);
          }

          if (
            typeof message === "object" &&
            message !== null &&
            (message as LiveServerMessageLike).serverContent?.turnComplete
          ) {
            lastTurnComplete = true;
            activeTurn.gate.complete();
          }
        },
        onerror: (error: ErrorEvent) => {
          activeTurn.gate.fail(classifyGeminiError(error.error ?? error.message));
        },
        onclose: (event: CloseEvent) => {
          closeReason = `code=${event.code} reason=${event.reason}`;
        }
      }
    });

    for (const turn of input.turns) {
      activeTurn.gate = createTurnGate(liveTimeoutMs);
      activeTurn.gate.arm();
      await session.sendClientContent({
        turns: turn.text,
        turnComplete: true
      });
      await activeTurn.gate.turnPromise;
    }

    await session.close();

    const assistantText = transcripts.join("").trim();
    if (!assistantText) {
      throw new GeminiPlannerError({
        kind: "parse",
        message: `native audio dialog returned empty transcription (${closeReason ?? "unknown"})`
      });
    }

    return {
      path: "native-audio-dialog",
      model,
      requestedModel,
      apiVersion,
      mode: "transcription_only",
      turns: input.turns,
      assistantText,
      transcriptionChunks,
      audioChunksDiscarded,
      inlineDataPartsIgnored,
      setupComplete,
      turnComplete: lastTurnComplete
    };
  } catch (error) {
    activeTurn.gate.cancel();
    throw classifyGeminiError(error);
  }
}
