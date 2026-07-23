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
  "gpt-5.4",
  "gpt-5.2",
  "gpt-5.1",
  "gpt-5.1-codex",
  "gpt-5",
  "gpt-5-codex",
  "gpt-5-chat-latest",
  "gpt-4.1",
  "gpt-4o",
  "o1",
  "o3"
];

const openAiMiniPoolModels = [
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gpt-5.1-codex-mini",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o-mini",
  "o1-mini",
  "o3-mini",
  "o4-mini",
  "codex-mini-latest"
];

/**
 * Returns whether the exact model alias appears in the operator-provided
 * OpenAI complimentary-usage notice recorded on 2026-07-24.
 *
 * Local budget entries may tighten these candidates, but must not promote an
 * unlisted OpenAI model into the complimentary pool.
 */
export function isOperatorProvidedOpenAiComplimentaryCandidate(model: string) {
  return openAiLargePoolModels.includes(model) || openAiMiniPoolModels.includes(model);
}

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
      quota_authority: "operator_provided_doc",
      reset_window: "utc_day",
      source:
        "Operator-copied OpenAI dashboard eligibility notice, recorded 2026-07-24: up to 1M shared tokens/day for the exact listed large-model aliases. Models not in that notice are not free-tier candidates in this repo. A request crossing the pool is billed in full."
    },
    {
      quota_policy_id: "openai-data-sharing-mini-token-pool-tier3",
      provider_id: "openai-api",
      model_pattern: openAiModelPattern(openAiMiniPoolModels),
      total_token_limit_per_day: 10_000_000,
      mode: "enforce",
      quota_metric: "tokens",
      quota_authority: "operator_provided_doc",
      reset_window: "utc_day",
      source:
        "Operator-copied OpenAI dashboard eligibility notice, recorded 2026-07-24: up to 10M shared tokens/day for the exact listed mini/nano model aliases. Models not in that notice are not free-tier candidates in this repo. A request crossing the pool is billed in full."
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
      quota_policy_id: "alibaba-model-studio-qwen38-max-preview",
      provider_id: "alibaba-model-studio-api",
      model: "qwen3.8-max-preview",
      request_limit_per_minute: 120,
      total_token_limit_per_minute: 500_000,
      mode: "enforce",
      quota_metric: "mixed",
      quota_authority: "operator_provided_doc",
      requires_operator_approval: true,
      approval_reason:
        "Billing status for the Qwen 3.8 Max preview allocation is not established; the operator must explicitly acknowledge this before a live run.",
      source:
        "Qwen 3.8 Max preview administrator notice: 120 RPM and 500K TPM per person, with no token usage cap. Local accounting is UTC-minute local input-side pre-request estimate plus provider-reported post-call accounting. It is not a rolling 60-second limiter, does not reserve uncapped output/thinking tokens, and cannot guarantee one request will not cross 500K TPM. Billing status is not established by this quota policy."
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
