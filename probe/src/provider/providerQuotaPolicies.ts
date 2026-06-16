import type { ProviderUsageBudget } from "./providerUsageTracker.js";

type ProviderQuotaPolicy = ProviderUsageBudget & {
  quota_policy_id: string;
  quota_metric: "api_calls" | "tokens" | "mixed";
  quota_authority:
    | "official_provider_doc"
    | "operator_provided_doc"
    | "operator_observed"
    | "local_operator_override";
  reset_window?: "utc_day" | "pacific_day" | "calendar_month_utc";
};

function openAiModelPattern(models: string[]) {
  return `^(${models.map((model) => model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`;
}

const openAiLargePoolModels = [
  "gpt-5.5",
  "gpt-5.5-2026-04-23",
  "gpt-5.4",
  "gpt-5.4-2026-03-05",
  "gpt-5.2-2025-12-11",
  "gpt-5.1-2025-11-13",
  "gpt-5.1-codex",
  "gpt-5-codex",
  "gpt-5",
  "gpt-5-2025-08-07",
  "gpt-5-chat-latest",
  "gpt-4.1",
  "gpt-4.1-2025-04-14",
  "gpt-4o-2024-05-13",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-11-20",
  "o3",
  "o3-2025-04-16",
  "o1-preview-2024-09-12",
  "o1",
  "o1-2024-12-17"
];

const openAiMiniPoolModels = [
  "gpt-5.4-mini",
  "gpt-5.4-mini-2026-03-17",
  "gpt-5.4-nano",
  "gpt-5.4-nano-2026-03-17",
  "gpt-5.1-codex-mini",
  "gpt-5-mini",
  "gpt-5-mini-2025-08-07",
  "gpt-5-nano",
  "gpt-5-nano-2025-08-07",
  "gpt-4.1-mini",
  "gpt-4.1-mini-2025-04-14",
  "gpt-4.1-nano",
  "gpt-4.1-nano-2025-04-14",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "o4-mini",
  "o4-mini-2025-04-16",
  "o1-mini",
  "o1-mini-2024-09-12",
  "codex-mini-latest"
];

/**
 * Built-in provider/model quota policy matrix.
 *
 * @remarks Local budget files may add stricter brakes, but these defaults keep
 * known provider quota semantics out of call sites. OpenAI complimentary pools
 * are token/day pools, ModelScope Qwen Ambassador access is API-calls/month,
 * and Gemini free-tier constraints are request/token windows that vary by
 * active project and model.
 */
export function defaultProviderQuotaPolicies(): ProviderQuotaPolicy[] {
  return [
    {
      quota_policy_id: "openai-data-sharing-large-token-pool-tier3",
      provider_id: "openai-api",
      model_pattern: openAiModelPattern(openAiLargePoolModels),
      total_token_limit_per_day: 1_000_000,
      mode: "enforce",
      quota_metric: "tokens",
      quota_authority: "official_provider_doc",
      reset_window: "utc_day",
      source:
        "OpenAI data-sharing complimentary token pool for eligible Tier 3-5 orgs: 1M shared tokens/day for listed large models; request crossing the pool is billed in full."
    },
    {
      quota_policy_id: "openai-data-sharing-mini-token-pool-tier3",
      provider_id: "openai-api",
      model_pattern: openAiModelPattern(openAiMiniPoolModels),
      total_token_limit_per_day: 10_000_000,
      mode: "enforce",
      quota_metric: "tokens",
      quota_authority: "official_provider_doc",
      reset_window: "utc_day",
      source:
        "OpenAI data-sharing complimentary token pool for eligible Tier 3-5 orgs: 10M shared tokens/day for listed mini/nano models; request crossing the pool is billed in full."
    },
    {
      quota_policy_id: "modelscope-qwen-ambassador-max-monthly-api-calls",
      provider_id: "modelscope-api",
      model: "Qwen-Ambassador/Qwen3.7-Max",
      request_limit_per_month: 2_500,
      mode: "enforce",
      quota_metric: "api_calls",
      quota_authority: "operator_provided_doc",
      reset_window: "calendar_month_utc",
      source:
        "Qwen Ambassador monthly quota: Qwen 3.7 Max has 2500 API calls/month; usage resets at the end of each calendar month."
    },
    {
      quota_policy_id: "modelscope-qwen-ambassador-plus-monthly-api-calls",
      provider_id: "modelscope-api",
      model: "Qwen-Ambassador/Qwen3.7-Plus",
      request_limit_per_month: 10_000,
      mode: "enforce",
      quota_metric: "api_calls",
      quota_authority: "operator_provided_doc",
      reset_window: "calendar_month_utc",
      source:
        "Qwen Ambassador monthly quota: Qwen 3.7 Plus has 10000 API calls/month; usage resets at the end of each calendar month."
    },
    {
      quota_policy_id: "gemini-gemma-4-31b-observed-request-windows",
      provider_id: "gemini-api",
      model: "gemma-4-31b-it",
      request_limit_per_minute: 15,
      request_limit_per_day: 1_500,
      mode: "enforce",
      quota_metric: "api_calls",
      quota_authority: "operator_observed",
      reset_window: "pacific_day",
      source:
        "Operator free-tier reference for Gemma 4 31B: 15 RPM and 1500 RPD. Active Gemini API limits still need project/model verification in AI Studio."
    },
    {
      quota_policy_id: "gemini-flash-lite-observed-request-token-windows",
      provider_id: "gemini-api",
      model_pattern: "^(gemini-3\\.1-flash-lite|gemini-2\\.5-flash-lite)$",
      request_limit_per_minute: 15,
      request_limit_per_day: 500,
      total_token_limit_per_minute: 250_000,
      mode: "enforce",
      quota_metric: "mixed",
      quota_authority: "operator_observed",
      reset_window: "pacific_day",
      source:
        "Operator free-tier reference for Gemini Flash Lite-like models: 15 RPM, 250k TPM, 500 RPD. Active Gemini API limits vary by project/model."
    }
  ];
}
