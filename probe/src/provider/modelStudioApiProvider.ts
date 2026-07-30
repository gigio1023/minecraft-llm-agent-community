/**
 * Alibaba Cloud Model Studio Qwen Chat Completions provider.
 *
 * @remarks The early-access endpoint is workspace-scoped and OpenAI-compatible.
 * Keep it distinct from ModelScope so credentials, quota policies, usage
 * records, and provider evidence retain the correct authority.
 */
import type { FunctionTool } from "openai/resources/responses/responses";

import {
  callModelScopeFunctionToolSelection,
  callModelScopeJsonSchema,
  type ModelScopeApiProviderConfig,
  type ModelScopeFunctionToolCallResult,
  type ModelScopeJsonCallResult
} from "./modelscopeApiProvider.js";
import type { ProviderUsageCallContext } from "./providerUsageTracker.js";

/** Exact preview model supported by the Model Studio adapter. */
export const MODEL_STUDIO_SUPPORTED_MODEL = "qwen3.8-max-preview";

export type ModelStudioApiProviderConfig = {
  apiKey: string;
  workspaceId: string;
  model: string;
  requestTimeoutMs?: number;
  repoRoot?: string;
  usageLedgerPath?: string;
  fetchImpl?: typeof fetch;
};

function modelStudioBaseUrl(workspaceId: string) {
  const normalized = workspaceId.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(normalized)) {
    return undefined;
  }
  return `https://${normalized}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`;
}

function compatibleConfig(
  config: ModelStudioApiProviderConfig
): ModelScopeApiProviderConfig | undefined {
  const baseUrl = modelStudioBaseUrl(config.workspaceId);
  if (!baseUrl) {
    return undefined;
  }
  return {
    apiKey: config.apiKey,
    model: config.model,
    baseUrl,
    providerId: "alibaba-model-studio-api",
    providerLabel: "Alibaba Model Studio",
    apiKeyEnvName: "MODEL_STUDIO_API_KEY",
    disableThinking: false,
    requestTimeoutMs: config.requestTimeoutMs ?? 180_000,
    maxRetries: 0,
    repoRoot: config.repoRoot,
    usageLedgerPath: config.usageLedgerPath,
    fetchImpl: config.fetchImpl
  };
}

function invalidModelResult(
  config: ModelStudioApiProviderConfig
): Extract<ModelScopeFunctionToolCallResult, { ok: false }> {
  return {
    ok: false,
    errorKind: "invalid_config",
    message:
      `Alibaba Model Studio supports only ${MODEL_STUDIO_SUPPORTED_MODEL}; ` +
      `received ${config.model.trim() || "(empty)"}.`,
    elapsedMs: 0,
    model: config.model
  };
}

function invalidWorkspaceResult(
  config: ModelStudioApiProviderConfig
): Extract<ModelScopeFunctionToolCallResult, { ok: false }> {
  return {
    ok: false,
    errorKind: "invalid_config",
    message:
      "MODEL_STUDIO_WORKSPACE_ID is missing or invalid. Add the Singapore workspace id to the repo-local .env file.",
    elapsedMs: 0,
    model: config.model
  };
}

function resolveCompatibleConfig(config: ModelStudioApiProviderConfig):
  | { ok: true; config: ModelScopeApiProviderConfig }
  | { ok: false; result: Extract<ModelScopeFunctionToolCallResult, { ok: false }> } {
  if (config.model !== MODEL_STUDIO_SUPPORTED_MODEL) {
    return { ok: false, result: invalidModelResult(config) };
  }
  const resolved = compatibleConfig(config);
  if (!resolved) {
    return { ok: false, result: invalidWorkspaceResult(config) };
  }
  return { ok: true, config: resolved };
}

export async function callModelStudioJsonSchema<T>(input: {
  config: ModelStudioApiProviderConfig;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  usageContext?: ProviderUsageCallContext;
  signal?: AbortSignal;
}): Promise<ModelScopeJsonCallResult<T>> {
  const resolved = resolveCompatibleConfig(input.config);
  if (!resolved.ok) {
    return resolved.result;
  }
  return callModelScopeJsonSchema<T>({
    config: resolved.config,
    schemaName: input.schemaName,
    schema: input.schema,
    system: input.system,
    user: input.user,
    usageContext: input.usageContext,
    ...(input.signal ? { signal: input.signal } : {})
  });
}

export async function callModelStudioFunctionToolSelection(input: {
  config: ModelStudioApiProviderConfig;
  system: string;
  user: string;
  tools: FunctionTool[];
  usageContext?: ProviderUsageCallContext;
  signal?: AbortSignal;
}): Promise<ModelScopeFunctionToolCallResult> {
  const resolved = resolveCompatibleConfig(input.config);
  if (!resolved.ok) {
    return resolved.result;
  }
  return callModelScopeFunctionToolSelection({
    config: resolved.config,
    system: input.system,
    user: input.user,
    tools: input.tools,
    usageContext: input.usageContext,
    ...(input.signal ? { signal: input.signal } : {})
  });
}
