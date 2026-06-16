import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { JsonValue } from "./inputSnapshot.js";
import { defaultProviderQuotaPolicies } from "./providerQuotaPolicies.js";

/**
 * Runtime-owned provider usage ledger and free-tier guard.
 *
 * @remarks Provider dashboards remain authoritative for billing. This module
 * gives the repo a local pre-request brake plus post-run evidence, so a social
 * cycle can be audited without exposing provider credentials.
 */
export type ProviderUsageCounts = {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  total_tokens: number;
};

export type ProviderUsageSource = "provider_reported" | "estimated";

export type ProviderUsageBudget = {
  provider_id: string;
  model?: string;
  model_pattern?: string;
  quota_policy_id?: string;
  quota_metric?: "api_calls" | "tokens" | "mixed";
  quota_authority?:
    | "official_provider_doc"
    | "operator_provided_doc"
    | "operator_observed"
    | "local_operator_override";
  reset_window?: "utc_day" | "pacific_day" | "calendar_month_utc";
  request_limit_per_minute?: number;
  request_limit_per_day?: number;
  request_limit_per_month?: number;
  input_token_limit_per_minute?: number;
  input_token_limit_per_day?: number;
  input_token_limit_per_month?: number;
  output_token_limit_per_minute?: number;
  output_token_limit_per_day?: number;
  output_token_limit_per_month?: number;
  total_token_limit_per_minute?: number;
  total_token_limit_per_day?: number;
  total_token_limit_per_month?: number;
  already_used?: Partial<ProviderUsageCounts>;
  already_used_this_month?: Partial<ProviderUsageCounts>;
  mode?: "enforce" | "track";
  source?: string;
};

export type ProviderUsageQuotaCheck = {
  budget: ProviderUsageBudget;
  projected: {
    minute: ProviderUsageCounts;
    day: ProviderUsageCounts;
    month: ProviderUsageCounts;
  };
  status: "allowed" | "blocked" | "tracked";
  enforcement_mode: "enforce" | "track";
  reason?: string;
  limit_name?: string;
};

export type ProviderUsageBudgetDecision = {
  schema: "provider-usage-budget-decision/v1";
  status: "allowed" | "delayed" | "blocked" | "unbudgeted";
  provider_id: string;
  model: string;
  reason?: string;
  delay_ms?: number;
  budget?: ProviderUsageBudget;
  projected?: {
    minute: ProviderUsageCounts;
    day: ProviderUsageCounts;
    month: ProviderUsageCounts;
  };
  quota_checks?: ProviderUsageQuotaCheck[];
};

export type ProviderUsageRecord = {
  schema: "provider-usage-record/v1";
  record_id: string;
  run_id?: string;
  actor_id?: string;
  turn_id?: string;
  stage?: string;
  provider_id: string;
  model: string;
  created_at: string;
  quota_day_utc?: string;
  pacific_day: string;
  utc_minute: string;
  status: "succeeded" | "failed";
  usage_source: ProviderUsageSource;
  usage: ProviderUsageCounts;
  elapsed_ms?: number;
  raw_usage?: JsonValue;
  budget_decision?: ProviderUsageBudgetDecision;
};

export type ProviderUsageCallContext = {
  repoRoot?: string;
  ledgerPath?: string;
  runId?: string;
  actorId?: string;
  turnId?: string;
  stage?: string;
};

export type ProviderUsageSummary = {
  schema: "provider-usage-summary/v1";
  generated_at: string;
  run_id?: string;
  ledger_path: string;
  records: number;
  totals: Array<{
    provider_id: string;
    model: string;
    usage: ProviderUsageCounts;
  }>;
  budget_status: ProviderUsageBudgetDecision[];
};

export class ProviderUsageBudgetError extends Error {
  readonly decision: ProviderUsageBudgetDecision;

  constructor(decision: ProviderUsageBudgetDecision) {
    super(decision.reason ?? "Provider usage budget blocked the request");
    this.name = "ProviderUsageBudgetError";
    this.decision = decision;
  }
}

const zeroCounts: ProviderUsageCounts = {
  requests: 0,
  input_tokens: 0,
  output_tokens: 0,
  thinking_tokens: 0,
  total_tokens: 0
};

function cloneCounts(counts: ProviderUsageCounts = zeroCounts): ProviderUsageCounts {
  return {
    requests: counts.requests,
    input_tokens: counts.input_tokens,
    output_tokens: counts.output_tokens,
    thinking_tokens: counts.thinking_tokens,
    total_tokens: counts.total_tokens
  };
}

function addCounts(a: ProviderUsageCounts, b: Partial<ProviderUsageCounts>): ProviderUsageCounts {
  return {
    requests: a.requests + (b.requests ?? 0),
    input_tokens: a.input_tokens + (b.input_tokens ?? 0),
    output_tokens: a.output_tokens + (b.output_tokens ?? 0),
    thinking_tokens: a.thinking_tokens + (b.thinking_tokens ?? 0),
    total_tokens: a.total_tokens + (b.total_tokens ?? 0)
  };
}

function sanitizeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.ceil(value) : 0;
}

function toCounts(input: Partial<ProviderUsageCounts>): ProviderUsageCounts {
  const total =
    sanitizeNumber(input.total_tokens) ||
    sanitizeNumber(input.input_tokens) +
      sanitizeNumber(input.output_tokens) +
      sanitizeNumber(input.thinking_tokens);
  return {
    requests: sanitizeNumber(input.requests),
    input_tokens: sanitizeNumber(input.input_tokens),
    output_tokens: sanitizeNumber(input.output_tokens),
    thinking_tokens: sanitizeNumber(input.thinking_tokens),
    total_tokens: total
  };
}

function envFlag(name: string) {
  return /^(1|true|yes|on)$/i.test(process.env[name]?.trim() ?? "");
}

function providerUsageEnforcementMode(defaultMode?: ProviderUsageBudget["mode"]) {
  const mode = process.env.PROVIDER_USAGE_ENFORCEMENT?.trim().toLowerCase() ?? defaultMode;
  return mode === "track" ? "track" : "enforce";
}

function providerUsageDir(repoRoot?: string) {
  return path.resolve(repoRoot ?? process.cwd(), "build", "provider-usage");
}

export function resolveProviderUsageLedgerPath(input?: { repoRoot?: string; ledgerPath?: string }) {
  if (input?.ledgerPath?.trim()) {
    return path.resolve(input.ledgerPath);
  }
  if (process.env.PROVIDER_USAGE_LEDGER_PATH?.trim()) {
    return path.resolve(process.env.PROVIDER_USAGE_LEDGER_PATH.trim());
  }
  return path.join(providerUsageDir(input?.repoRoot), "provider-usage-ledger.jsonl");
}

function budgetConfigPath(repoRoot?: string) {
  if (process.env.PROVIDER_USAGE_BUDGETS_PATH?.trim()) {
    return path.resolve(process.env.PROVIDER_USAGE_BUDGETS_PATH.trim());
  }
  return path.join(providerUsageDir(repoRoot), "free-tier-budgets.json");
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function asBudgetArray(value: unknown): ProviderUsageBudget[] {
  if (Array.isArray(value)) {
    return value.filter(isBudget);
  }
  if (typeof value === "object" && value !== null && Array.isArray((value as { budgets?: unknown }).budgets)) {
    return (value as { budgets: unknown[] }).budgets.filter(isBudget);
  }
  return [];
}

function isBudget(value: unknown): value is ProviderUsageBudget {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.provider_id === "string";
}

async function loadConfiguredBudgets(repoRoot?: string): Promise<ProviderUsageBudget[]> {
  const budgets: ProviderUsageBudget[] = [];
  if (!envFlag("PROVIDER_USAGE_DISABLE_DEFAULT_BUDGETS")) {
    budgets.push(...defaultProviderQuotaPolicies());
  }

  const inline = process.env.PROVIDER_USAGE_BUDGETS_JSON?.trim();
  if (inline) {
    budgets.push(...asBudgetArray(JSON.parse(inline)));
  }

  const filePath = budgetConfigPath(repoRoot);
  if (await fileExists(filePath)) {
    budgets.push(...asBudgetArray(JSON.parse(await readFile(filePath, "utf8"))));
  }

  return budgets;
}

function matchesBudget(budget: ProviderUsageBudget, providerId: string, model: string) {
  if (budget.provider_id !== providerId) {
    return false;
  }
  if (!budget.model && !budget.model_pattern) {
    return true;
  }
  if (budget.model === "*" || budget.model === model) {
    return true;
  }
  if (budget.model_pattern) {
    try {
      return new RegExp(budget.model_pattern).test(model);
    } catch {
      return false;
    }
  }
  return false;
}

function selectBudgets(
  budgets: readonly ProviderUsageBudget[],
  providerId: string,
  model: string
): ProviderUsageBudget[] {
  return budgets.filter((budget) => matchesBudget(budget, providerId, model));
}

function utcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcMonth(date: Date) {
  return date.toISOString().slice(0, 7);
}

function pacificDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function utcMinute(date: Date) {
  return date.toISOString().slice(0, 16);
}

async function readUsageRecords(ledgerPath: string): Promise<ProviderUsageRecord[]> {
  try {
    const raw = await readFile(ledgerPath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ProviderUsageRecord)
      .filter((record) => record.schema === "provider-usage-record/v1");
  } catch {
    return [];
  }
}

function dailyQuotaDay(providerId: string, date: Date) {
  return providerId === "gemini-api" ? pacificDay(date) : utcDay(date);
}

function recordDailyQuotaDay(record: ProviderUsageRecord) {
  if (record.provider_id === "gemini-api") {
    return record.pacific_day;
  }
  return record.quota_day_utc ?? record.created_at.slice(0, 10) ?? record.pacific_day;
}

function recordMonthlyQuotaMonth(record: ProviderUsageRecord) {
  return record.created_at.slice(0, 7);
}

function totalMatchingRecords(
  records: readonly ProviderUsageRecord[],
  input: {
    providerId: string;
    model: string;
    quotaDay: string;
    quotaMonth: string;
    utcMinute: string;
    budget?: ProviderUsageBudget;
  }
) {
  const minute = cloneCounts();
  const day = cloneCounts();
  const month = cloneCounts();
  for (const record of records) {
    const matches = input.budget
      ? matchesBudget(input.budget, record.provider_id, record.model)
      : record.provider_id === input.providerId && record.model === input.model;
    if (!matches) {
      continue;
    }
    if (recordMonthlyQuotaMonth(record) === input.quotaMonth) {
      Object.assign(month, addCounts(month, record.usage));
    }
    if (recordDailyQuotaDay(record) === input.quotaDay) {
      Object.assign(day, addCounts(day, record.usage));
    }
    if (record.utc_minute === input.utcMinute) {
      Object.assign(minute, addCounts(minute, record.usage));
    }
  }
  return { minute, day, month };
}

function exceeded(limit: number | undefined, value: number) {
  return typeof limit === "number" && limit >= 0 && value > limit;
}

function firstLimitFailure(
  budget: ProviderUsageBudget,
  projected: {
    minute: ProviderUsageCounts;
    day: ProviderUsageCounts;
    month: ProviderUsageCounts;
  }
) {
  const checks: Array<[string, number | undefined, number]> = [
    ["request_limit_per_minute", budget.request_limit_per_minute, projected.minute.requests],
    ["request_limit_per_day", budget.request_limit_per_day, projected.day.requests],
    ["request_limit_per_month", budget.request_limit_per_month, projected.month.requests],
    ["input_token_limit_per_minute", budget.input_token_limit_per_minute, projected.minute.input_tokens],
    ["input_token_limit_per_day", budget.input_token_limit_per_day, projected.day.input_tokens],
    ["input_token_limit_per_month", budget.input_token_limit_per_month, projected.month.input_tokens],
    ["output_token_limit_per_minute", budget.output_token_limit_per_minute, projected.minute.output_tokens],
    ["output_token_limit_per_day", budget.output_token_limit_per_day, projected.day.output_tokens],
    ["output_token_limit_per_month", budget.output_token_limit_per_month, projected.month.output_tokens],
    ["total_token_limit_per_minute", budget.total_token_limit_per_minute, projected.minute.total_tokens],
    ["total_token_limit_per_day", budget.total_token_limit_per_day, projected.day.total_tokens],
    ["total_token_limit_per_month", budget.total_token_limit_per_month, projected.month.total_tokens]
  ];
  return checks.find(([, limit, value]) => exceeded(limit, value));
}

function nextUtcMinuteDelayMs(now: Date) {
  const next = new Date(now);
  next.setUTCSeconds(61, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function estimateTextTokens(text: string) {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil([...text].length / 4));
}

export function buildEstimatedUsage(input: {
  inputText: string;
  maxOutputTokens?: number;
}): ProviderUsageCounts {
  return toCounts({
    requests: 1,
    input_tokens: estimateTextTokens(input.inputText),
    output_tokens: input.maxOutputTokens ?? 0
  });
}

export async function guardProviderUsageRequest(input: {
  providerId: string;
  model: string;
  estimatedUsage: ProviderUsageCounts;
  context?: ProviderUsageCallContext;
  now?: Date;
  maxAutoDelayMs?: number;
}): Promise<ProviderUsageBudgetDecision> {
  const now = input.now ?? new Date();
  const repoRoot = input.context?.repoRoot;
  const budgets = await loadConfiguredBudgets(repoRoot);
  const matchingBudgets = selectBudgets(budgets, input.providerId, input.model);
  if (matchingBudgets.length === 0) {
    const decision: ProviderUsageBudgetDecision = {
      schema: "provider-usage-budget-decision/v1",
      status: "unbudgeted",
      provider_id: input.providerId,
      model: input.model,
      reason: "No provider usage budget matched this provider/model"
    };
    if (providerUsageEnforcementMode() === "track" && envFlag("PROVIDER_USAGE_ALLOW_UNBUDGETED")) {
      return decision;
    }
    throw new ProviderUsageBudgetError({
      ...decision,
      status: "blocked",
      reason:
        `${decision.reason}; refusing live provider request without a local budget. ` +
        "Add an explicit provider/model budget before running paid or quota-limited calls."
    });
  }

  const ledgerPath = resolveProviderUsageLedgerPath({
    repoRoot,
    ledgerPath: input.context?.ledgerPath
  });
  const records = await readUsageRecords(ledgerPath);
  const quotaChecks: ProviderUsageQuotaCheck[] = [];
  const enforcedFailures: Array<{
    budget: ProviderUsageBudget;
    projected: ProviderUsageQuotaCheck["projected"];
    limitName: string;
    mode: "enforce" | "track";
  }> = [];

  for (const budget of matchingBudgets) {
    const windows = totalMatchingRecords(records, {
      providerId: input.providerId,
      model: input.model,
      quotaDay: dailyQuotaDay(input.providerId, now),
      quotaMonth: utcMonth(now),
      utcMinute: utcMinute(now),
      budget
    });
    const existingDay = addCounts(windows.day, budget.already_used ?? {});
    const existingMonth = addCounts(windows.month, budget.already_used_this_month ?? {});
    const projected = {
      minute: addCounts(windows.minute, input.estimatedUsage),
      day: addCounts(existingDay, input.estimatedUsage),
      month: addCounts(existingMonth, input.estimatedUsage)
    };
    const failure = firstLimitFailure(budget, projected);
    const mode = providerUsageEnforcementMode(budget.mode);
    const limitName = failure?.[0];

    quotaChecks.push({
      budget,
      projected,
      status: failure ? (mode === "track" ? "tracked" : "blocked") : "allowed",
      enforcement_mode: mode,
      ...(limitName ? { limit_name: limitName, reason: `Provider request would exceed ${limitName}` } : {})
    });

    if (limitName && mode !== "track") {
      enforcedFailures.push({ budget, projected, limitName, mode });
    }
  }

  const lastCheck = quotaChecks.at(-1);
  if (enforcedFailures.length === 0 && lastCheck) {
    return {
      schema: "provider-usage-budget-decision/v1",
      status: "allowed",
      provider_id: input.providerId,
      model: input.model,
      budget: lastCheck.budget,
      projected: lastCheck.projected,
      quota_checks: quotaChecks
    };
  }

  const failure =
    enforcedFailures.find((candidate) => !candidate.limitName.endsWith("_per_minute")) ??
    enforcedFailures[0];
  if (!failure) {
    throw new ProviderUsageBudgetError({
      schema: "provider-usage-budget-decision/v1",
      status: "blocked",
      provider_id: input.providerId,
      model: input.model,
      reason: "Provider usage budget failed without a matching quota check",
      quota_checks: quotaChecks
    });
  }

  const name = failure.limitName;
  const minuteLimited = name.endsWith("_per_minute");
  const delayMs = minuteLimited ? nextUtcMinuteDelayMs(now) : undefined;
  const maxDelayMs =
    input.maxAutoDelayMs ??
    Number(process.env.PROVIDER_USAGE_MAX_AUTO_DELAY_MS ?? 70_000);

  if (minuteLimited && delayMs !== undefined && delayMs <= maxDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return {
      schema: "provider-usage-budget-decision/v1",
      status: "delayed",
      provider_id: input.providerId,
      model: input.model,
      reason: `Delayed provider request to respect ${name}`,
      delay_ms: delayMs,
      budget: failure.budget,
      projected: failure.projected,
      quota_checks: quotaChecks
    };
  }

  const decision: ProviderUsageBudgetDecision = {
    schema: "provider-usage-budget-decision/v1",
    status: "blocked",
    provider_id: input.providerId,
    model: input.model,
    reason: `Provider request would exceed ${name}`,
    ...(delayMs !== undefined ? { delay_ms: delayMs } : {}),
    budget: failure.budget,
    projected: failure.projected,
    quota_checks: quotaChecks
  };
  throw new ProviderUsageBudgetError(decision);
}

export async function appendProviderUsageRecord(input: {
  providerId: string;
  model: string;
  status: ProviderUsageRecord["status"];
  usage: ProviderUsageCounts;
  usageSource: ProviderUsageSource;
  context?: ProviderUsageCallContext;
  elapsedMs?: number;
  rawUsage?: JsonValue;
  budgetDecision?: ProviderUsageBudgetDecision;
  now?: Date;
}): Promise<ProviderUsageRecord> {
  const now = input.now ?? new Date();
  const ledgerPath = resolveProviderUsageLedgerPath({
    repoRoot: input.context?.repoRoot,
    ledgerPath: input.context?.ledgerPath
  });
  const record: ProviderUsageRecord = {
    schema: "provider-usage-record/v1",
    record_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    run_id: input.context?.runId,
    actor_id: input.context?.actorId,
    turn_id: input.context?.turnId,
    stage: input.context?.stage,
    provider_id: input.providerId,
    model: input.model,
    created_at: now.toISOString(),
    quota_day_utc: utcDay(now),
    pacific_day: pacificDay(now),
    utc_minute: utcMinute(now),
    status: input.status,
    usage_source: input.usageSource,
    usage: input.usage,
    elapsed_ms: input.elapsedMs,
    raw_usage: input.rawUsage,
    budget_decision: input.budgetDecision
  };
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  await appendFile(ledgerPath, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function normalizeOpenAiUsage(raw: unknown, fallback: ProviderUsageCounts) {
  if (typeof raw !== "object" || raw === null) {
    return { usage: fallback, source: "estimated" as ProviderUsageSource, rawUsage: undefined };
  }
  const record = raw as Record<string, unknown>;
  const completionDetails =
    typeof record.completion_tokens_details === "object" && record.completion_tokens_details !== null
      ? record.completion_tokens_details as Record<string, unknown>
      : undefined;
  const outputDetails =
    typeof record.output_tokens_details === "object" && record.output_tokens_details !== null
      ? record.output_tokens_details as Record<string, unknown>
      : undefined;
  const usage = toCounts({
    requests: 1,
    input_tokens: sanitizeNumber(record.prompt_tokens) || sanitizeNumber(record.input_tokens),
    output_tokens: sanitizeNumber(record.completion_tokens) || sanitizeNumber(record.output_tokens),
    thinking_tokens:
      sanitizeNumber(completionDetails?.reasoning_tokens) ||
      sanitizeNumber(outputDetails?.reasoning_tokens),
    total_tokens: sanitizeNumber(record.total_tokens)
  });
  return {
    usage: usage.total_tokens > 0 ? usage : fallback,
    source: usage.total_tokens > 0 ? ("provider_reported" as const) : ("estimated" as const),
    rawUsage: record as JsonValue
  };
}

export function normalizeGeminiUsage(raw: unknown, fallback: ProviderUsageCounts) {
  if (typeof raw !== "object" || raw === null) {
    return { usage: fallback, source: "estimated" as ProviderUsageSource, rawUsage: undefined };
  }
  const record = raw as Record<string, unknown>;
  const candidates = sanitizeNumber(record.candidatesTokenCount);
  const thoughts = sanitizeNumber(record.thoughtsTokenCount);
  const usage = toCounts({
    requests: 1,
    input_tokens: sanitizeNumber(record.promptTokenCount),
    output_tokens: candidates + thoughts,
    thinking_tokens: thoughts,
    total_tokens: sanitizeNumber(record.totalTokenCount)
  });
  return {
    usage: usage.total_tokens > 0 ? usage : fallback,
    source: usage.total_tokens > 0 ? ("provider_reported" as const) : ("estimated" as const),
    rawUsage: record as JsonValue
  };
}

export async function summarizeProviderUsage(input: {
  repoRoot?: string;
  ledgerPath?: string;
  runId?: string;
}): Promise<ProviderUsageSummary> {
  const ledgerPath = resolveProviderUsageLedgerPath(input);
  const allRecords = await readUsageRecords(ledgerPath);
  const records = input.runId
    ? allRecords.filter((record) => record.run_id === input.runId)
    : allRecords;
  const totalsByKey = new Map<string, { provider_id: string; model: string; usage: ProviderUsageCounts }>();
  for (const record of records) {
    const key = `${record.provider_id}\0${record.model}`;
    const existing = totalsByKey.get(key) ?? {
      provider_id: record.provider_id,
      model: record.model,
      usage: cloneCounts()
    };
    existing.usage = addCounts(existing.usage, record.usage);
    totalsByKey.set(key, existing);
  }

  const budget_status = await Promise.all(
    [...totalsByKey.values()].map((total) =>
      guardProviderUsageRequest({
        providerId: total.provider_id,
        model: total.model,
        estimatedUsage: cloneCounts(),
        context: { repoRoot: input.repoRoot, ledgerPath: input.ledgerPath },
        maxAutoDelayMs: 0
      }).catch((error) =>
        error instanceof ProviderUsageBudgetError
          ? error.decision
          : {
              schema: "provider-usage-budget-decision/v1" as const,
              status: "unbudgeted" as const,
              provider_id: total.provider_id,
              model: total.model,
              reason: String(error)
            }
      )
    )
  );

  return {
    schema: "provider-usage-summary/v1",
    generated_at: new Date().toISOString(),
    run_id: input.runId,
    ledger_path: ledgerPath,
    records: records.length,
    totals: [...totalsByKey.values()],
    budget_status
  };
}
