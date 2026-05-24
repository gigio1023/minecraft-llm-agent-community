import path from "node:path";

import type { JsonValue } from "../inputSnapshot.js";
import { writeProviderInputSnapshot } from "../providerInputStore.js";
import { writeProviderOutputSnapshot } from "../providerOutputStore.js";
import { loadGeminiApiKey } from "./auth.js";
import {
  loadGeminiPlannerConfig,
  type GeminiPlannerPathId
} from "./config.js";
import { classifyGeminiError, type GeminiPlannerErrorKind } from "./errors.js";
import { callGeminiLiveTranscription } from "./liveTranscription.js";
import { callGeminiTextGenai } from "./textGenai.js";

export type GeminiPlannerCallMetadata = {
  providerId: "gemini-live-planner";
  selectedPath: GeminiPlannerPathId;
  model: string;
  attemptedPaths: GeminiPlannerPathId[];
  fallbackFrom?: GeminiPlannerPathId;
  fallbackReason?: string;
  errorKind?: GeminiPlannerErrorKind;
};

export type GeminiPlannerCallResult = GeminiPlannerCallMetadata & {
  text: string;
  inputRef?: string;
  outputRef?: string;
};

function stripCodeFence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:ts|typescript|json)?\s*([\s\S]*?)```$/i);
  return (match ? match[1] : trimmed).trim();
}

function repoRootFromProbeCwd() {
  return path.resolve(process.cwd(), "..");
}

export async function callGeminiLivePlanner(input: {
  actorId: string;
  turnId: string;
  actorWorkspaceRootDir: string;
  prompt: string;
  repoRoot?: string;
  forcePath?: GeminiPlannerPathId;
}): Promise<GeminiPlannerCallResult> {
  const config = loadGeminiPlannerConfig(input.forcePath);
  const repoRoot = input.repoRoot ?? repoRootFromProbeCwd();
  const apiKey = await loadGeminiApiKey(repoRoot);

  const inputRef = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: `gemini-planner-input-${input.turnId}`,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: config.providerId,
    model: config.liveModel,
    created_at: new Date().toISOString(),
    input: {
      prompt: input.prompt,
      provider_order: [config.primaryPath, config.fallbackPath].filter(Boolean),
      preferred_path: "native-audio-dialog",
      live_api_version: config.liveApiVersion
    } as JsonValue
  });

  if (!apiKey) {
    const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `gemini-planner-output-${input.turnId}`,
      actor_id: input.actorId,
      turn_id: input.turnId,
      provider_id: config.providerId,
      model: config.textModel,
      created_at: new Date().toISOString(),
      raw_output_text: "",
      parsed_output: {
        error_kind: "auth_missing",
        message: "GEMINI_API_KEY is not configured"
      },
      proposal: { source_kind: "gemini_planner_blocked" }
    });

    return {
      providerId: config.providerId,
      selectedPath: config.primaryPath,
      model: config.textModel,
      attemptedPaths: [],
      text: "",
      errorKind: "auth_missing",
      inputRef,
      outputRef
    };
  }

  const order = input.forcePath
    ? [input.forcePath]
    : [config.primaryPath, config.fallbackPath].filter(
        (pathId, index, list): pathId is GeminiPlannerPathId =>
          Boolean(pathId) && list.indexOf(pathId) === index
      );
  const attemptedPaths: GeminiPlannerPathId[] = [];
  let lastErrorKind: GeminiPlannerErrorKind | undefined;
  let lastErrorMessage: string | undefined;

  for (const [index, pathId] of order.entries()) {
    attemptedPaths.push(pathId);
    try {
      const response =
        pathId === "text-genai"
          ? await callGeminiTextGenai({ apiKey, config, prompt: input.prompt })
          : await callGeminiLiveTranscription({ apiKey, config, prompt: input.prompt });

      const text = stripCodeFence(response.text);
      const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
        schema: "provider-output-snapshot/v1",
        snapshot_id: `gemini-planner-output-${input.turnId}`,
        actor_id: input.actorId,
        turn_id: input.turnId,
        provider_id: config.providerId,
        model: response.model,
        created_at: new Date().toISOString(),
        raw_output_text: response.text,
        parsed_output: {
          selected_path: response.path,
          ...(response.path === "live-transcription"
            ? {
                requested_live_model: (response as { requestedModel?: string }).requestedModel,
                live_api_version: (response as { apiVersion?: string }).apiVersion
              }
            : {}),
          attempted_paths: attemptedPaths,
          ...(index > 0
            ? {
                fallback_from: order[index - 1],
                fallback_reason: lastErrorMessage
              }
            : {})
        },
        proposal: { source_kind: "gemini_planner_text" }
      });

      return {
        providerId: config.providerId,
        selectedPath: response.path,
        model: response.model,
        attemptedPaths,
        ...(index > 0
          ? {
              fallbackFrom: order[index - 1],
              fallbackReason: lastErrorMessage
            }
          : {}),
        text,
        inputRef,
        outputRef
      };
    } catch (error) {
      const classified = classifyGeminiError(error);
      lastErrorKind = classified.kind;
      lastErrorMessage = classified.message;
      if (!classified.retryable || index === order.length - 1) {
        break;
      }
    }
  }

  const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `gemini-planner-output-${input.turnId}`,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: config.providerId,
    model: config.textModel,
    created_at: new Date().toISOString(),
    raw_output_text: "",
    parsed_output: {
      attempted_paths: attemptedPaths,
      error_kind: lastErrorKind ?? "unknown",
      message: lastErrorMessage ?? "Gemini planner call failed"
    },
    proposal: { source_kind: "gemini_planner_blocked" }
  });

  return {
    providerId: config.providerId,
    selectedPath: config.primaryPath,
    model: config.textModel,
    attemptedPaths,
    text: "",
    errorKind: lastErrorKind ?? "unknown",
    inputRef,
    outputRef
  };
}
