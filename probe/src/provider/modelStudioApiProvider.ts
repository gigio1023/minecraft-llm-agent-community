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

export type ModelStudioApiProviderConfig = {
  apiKey: string;
  workspaceId: string;
  model: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
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
    maxRetries: config.maxRetries ?? 1,
    repoRoot: config.repoRoot,
    usageLedgerPath: config.usageLedgerPath,
    fetchImpl: config.fetchImpl
  };
}

function invalidConfigResult(
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

export async function callModelStudioJsonSchema<T>(input: {
  config: ModelStudioApiProviderConfig;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  usageContext?: ProviderUsageCallContext;
}): Promise<ModelScopeJsonCallResult<T>> {
  const config = compatibleConfig(input.config);
  if (!config) {
    return invalidConfigResult(input.config);
  }
  return callModelScopeJsonSchema<T>({ ...input, config });
}

export async function callModelStudioFunctionToolSelection(input: {
  config: ModelStudioApiProviderConfig;
  system: string;
  user: string;
  tools: FunctionTool[];
  usageContext?: ProviderUsageCallContext;
}): Promise<ModelScopeFunctionToolCallResult> {
  const config = compatibleConfig(input.config);
  if (!config) {
    return invalidConfigResult(input.config);
  }
  return callModelScopeFunctionToolSelection({ ...input, config });
}
