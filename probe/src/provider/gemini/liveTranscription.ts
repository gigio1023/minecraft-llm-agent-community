import type { GeminiPlannerConfig } from "./config.js";
import {
  resolveNativeAudioDialogModel,
  runNativeAudioDialog,
  type NativeAudioDialogResult
} from "./nativeAudioDialog.js";

export type GeminiLiveCallResult = {
  path: "live-transcription";
  model: string;
  requestedModel: string;
  apiVersion: string;
  text: string;
};

export function resolveLiveApiModel(requestedModel: string): string {
  return resolveNativeAudioDialogModel(requestedModel);
}

export async function callGeminiLiveTranscription(input: {
  apiKey: string;
  config: GeminiPlannerConfig;
  prompt: string;
}): Promise<GeminiLiveCallResult> {
  const dialog = await runNativeAudioDialog({
    apiKey: input.apiKey,
    config: input.config,
    turns: [{ role: "user", text: input.prompt }]
  });

  return toLiveCallResult(dialog);
}

function toLiveCallResult(dialog: NativeAudioDialogResult): GeminiLiveCallResult {
  return {
    path: "live-transcription",
    model: dialog.model,
    requestedModel: dialog.requestedModel,
    apiVersion: dialog.apiVersion,
    text: dialog.assistantText
  };
}
