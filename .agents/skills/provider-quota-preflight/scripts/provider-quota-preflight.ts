#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defaultProviderQuotaPolicies } from "../../../../probe/src/provider/providerQuotaPolicies.ts";
import type {
  ProviderUsageBudget,
  ProviderUsageCounts,
  ProviderUsageRecord
} from "../../../../probe/src/provider/providerUsageTracker.ts";

type Candidate = {
  providerId: string;
  model: string;
};

type ExternalAlreadyUsedObservation = {
  schema: "provider-external-already-used/v1";
  provider_id: string;
  quota_day_utc: string;
  observed_at: string;
  period_certainty: "confirmed_exact_utc_day" | "ambiguous_period";
  overlap_with_local_ledger: "unknown" | "includes_local" | "disjoint";
  source_note: string;
  usage: ProviderUsageCounts;
};

type Args = {
  candidates: Candidate[];
  ledgerPath: string;
  budgetsPath: string;
  outPath?: string;
  approvalNote?: string;
  estimate: ProviderUsageCounts;
  minuteEstimate: ProviderUsageCounts;
  externalAlreadyUsed: ExternalAlreadyUsedObservation[];
  operatorApproved: boolean;
  estimateRequestsProvided: boolean;
  estimateTokensProvided: boolean;
  minuteRequestsProvided: boolean;
};

const zero: ProviderUsageCounts = {
  requests: 0,
  input_tokens: 0,
  output_tokens: 0,
  thinking_tokens: 0,
  total_tokens: 0
};

function usage() {
  return `usage: provider-quota-preflight.ts --candidate provider:model --estimate-requests N --estimate-total-tokens N --estimate-requests-per-minute N [--external-already-used observation.json] [--out path] [--operator-approved --approval-note text]`;
}

function hasValue(value: string | undefined) {
  return value !== undefined && !value.startsWith("--");
}

function parsePositiveInt(value: string | undefined, label: string) {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return Math.ceil(parsed);
}

function parseCandidate(value: string): Candidate {
  const separator = value.indexOf(":");
  if (separator <= 0 || separator >= value.length - 1) {
    throw new Error(`Invalid --candidate ${value}; expected provider:model`);
  }
  return {
    providerId: value.slice(0, separator),
    model: value.slice(separator + 1)
  };
}

function parseArgs(argv: string[], cwd = process.cwd()): Args {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    process.exit(0);
  }

  const args: Args = {
    candidates: [],
    ledgerPath: path.join(cwd, "build", "provider-usage", "provider-usage-ledger.jsonl"),
    budgetsPath: path.join(cwd, "build", "provider-usage", "free-tier-budgets.json"),
    outPath: undefined,
    approvalNote: undefined,
    estimate: { ...zero },
    minuteEstimate: { ...zero },
    externalAlreadyUsed: [],
    operatorApproved: false,
    estimateRequestsProvided: false,
    estimateTokensProvided: false,
    minuteRequestsProvided: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--candidate" && hasValue(next)) {
      args.candidates.push(parseCandidate(next));
      index += 1;
    } else if (arg === "--ledger" && hasValue(next)) {
      args.ledgerPath = path.resolve(cwd, next);
      index += 1;
    } else if (arg === "--budgets" && hasValue(next)) {
      args.budgetsPath = path.resolve(cwd, next);
      index += 1;
    } else if (arg === "--out" && hasValue(next)) {
      args.outPath = path.resolve(cwd, next);
      index += 1;
    } else if (arg === "--approval-note" && hasValue(next)) {
      args.approvalNote = next.trim();
      index += 1;
    } else if (arg === "--approval-note-file" && hasValue(next)) {
      args.approvalNote = fs.readFileSync(path.resolve(cwd, next), "utf8").trim();
      index += 1;
    } else if (arg === "--external-already-used" && hasValue(next)) {
      args.externalAlreadyUsed.push(
        readExternalAlreadyUsedObservation(path.resolve(cwd, next))
      );
      index += 1;
    } else if (arg === "--estimate-requests" && hasValue(next)) {
      args.estimate.requests = parsePositiveInt(next, arg);
      args.estimateRequestsProvided = true;
      index += 1;
    } else if (arg === "--estimate-input-tokens" && hasValue(next)) {
      args.estimate.input_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-output-tokens" && hasValue(next)) {
      args.estimate.output_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-thinking-tokens" && hasValue(next)) {
      args.estimate.thinking_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-total-tokens" && hasValue(next)) {
      args.estimate.total_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-requests-per-minute" && hasValue(next)) {
      args.minuteEstimate.requests = parsePositiveInt(next, arg);
      args.minuteRequestsProvided = true;
      index += 1;
    } else if (arg === "--estimate-input-tokens-per-minute" && hasValue(next)) {
      args.minuteEstimate.input_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--estimate-output-tokens-per-minute" && hasValue(next)) {
      args.minuteEstimate.output_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--estimate-thinking-tokens-per-minute" && hasValue(next)) {
      args.minuteEstimate.thinking_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--estimate-total-tokens-per-minute" && hasValue(next)) {
      args.minuteEstimate.total_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--operator-approved") {
      args.operatorApproved = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown or incomplete option ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument ${arg}`);
    }
  }

  if (args.candidates.length === 0) {
    throw new Error("At least one --candidate provider:model is required");
  }
  if (!args.estimateRequestsProvided || args.estimate.requests <= 0) {
    throw new Error("--estimate-requests is required and must be greater than zero");
  }
  if (!args.estimateTokensProvided) {
    throw new Error("--estimate-total-tokens or token component estimates are required");
  }
  if (args.estimate.total_tokens === 0) {
    args.estimate.total_tokens =
      args.estimate.input_tokens + args.estimate.output_tokens + args.estimate.thinking_tokens;
  }
  if (args.estimate.total_tokens <= 0) {
    throw new Error("Estimated total tokens must be greater than zero");
  }
  if (!args.minuteRequestsProvided || args.minuteEstimate.requests <= 0) {
    throw new Error("--estimate-requests-per-minute is required and must be greater than zero");
  }
  if (args.minuteEstimate.total_tokens === 0) {
    args.minuteEstimate.total_tokens =
      args.minuteEstimate.input_tokens +
      args.minuteEstimate.output_tokens +
      args.minuteEstimate.thinking_tokens;
  }
  if (args.minuteEstimate.total_tokens === 0 && args.estimate.total_tokens > 0 && args.estimate.requests > 0) {
    args.minuteEstimate.total_tokens =
      Math.ceil(args.estimate.total_tokens / args.estimate.requests) *
      Math.max(1, args.minuteEstimate.requests);
  }
  if (args.approvalNote !== undefined) {
    args.approvalNote = args.approvalNote.trim();
  }
  if (args.operatorApproved && !(args.approvalNote && args.approvalNote.length > 0)) {
    throw new Error("--operator-approved requires --approval-note or --approval-note-file");
  }
  const externalProviders = new Set<string>();
  for (const observation of args.externalAlreadyUsed) {
    if (externalProviders.has(observation.provider_id)) {
      throw new Error(`Only one --external-already-used observation is allowed per provider (${observation.provider_id})`);
    }
    externalProviders.add(observation.provider_id);
  }
  return args;
}

function readJsonIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new Error(`${label} contains unknown fields: ${extras.join(", ")}`);
  }
}

function nonNegativeCount(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function readExternalAlreadyUsedObservation(filePath: string): ExternalAlreadyUsedObservation {
  const value = readJsonIfExists(filePath);
  if (!isRecord(value)) {
    throw new Error(`--external-already-used must point to a JSON object: ${filePath}`);
  }
  assertExactKeys(value, [
    "schema",
    "provider_id",
    "quota_day_utc",
    "observed_at",
    "period_certainty",
    "overlap_with_local_ledger",
    "source_note",
    "usage"
  ], "external_already_used");
  if (value.schema !== "provider-external-already-used/v1") {
    throw new Error("external_already_used.schema must be provider-external-already-used/v1");
  }
  if (typeof value.provider_id !== "string" || value.provider_id.length === 0) {
    throw new Error("external_already_used.provider_id must be a non-empty string");
  }
  const quotaDayDate = typeof value.quota_day_utc === "string"
    ? new Date(`${value.quota_day_utc}T00:00:00.000Z`)
    : null;
  if (typeof value.quota_day_utc !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.quota_day_utc) ||
    !quotaDayDate ||
    !Number.isFinite(quotaDayDate.getTime()) ||
    quotaDayDate.toISOString().slice(0, 10) !== value.quota_day_utc) {
    throw new Error("external_already_used.quota_day_utc must be YYYY-MM-DD");
  }
  if (typeof value.observed_at !== "string" ||
    !value.observed_at.includes("T") ||
    !Number.isFinite(Date.parse(value.observed_at))) {
    throw new Error("external_already_used.observed_at must be an ISO date-time");
  }
  if (value.period_certainty !== "confirmed_exact_utc_day" && value.period_certainty !== "ambiguous_period") {
    throw new Error("external_already_used.period_certainty must be confirmed_exact_utc_day or ambiguous_period");
  }
  if (value.overlap_with_local_ledger !== "unknown" &&
    value.overlap_with_local_ledger !== "includes_local" &&
    value.overlap_with_local_ledger !== "disjoint") {
    throw new Error("external_already_used.overlap_with_local_ledger must be unknown, includes_local, or disjoint");
  }
  if (typeof value.source_note !== "string" || value.source_note.trim().length === 0) {
    throw new Error("external_already_used.source_note must be a non-empty string");
  }
  if (!isRecord(value.usage)) {
    throw new Error("external_already_used.usage must be an object");
  }
  assertExactKeys(value.usage, [
    "requests",
    "input_tokens",
    "output_tokens",
    "thinking_tokens",
    "total_tokens"
  ], "external_already_used.usage");
  const usage: ProviderUsageCounts = {
    requests: nonNegativeCount(value.usage.requests, "external_already_used.usage.requests"),
    input_tokens: nonNegativeCount(value.usage.input_tokens ?? 0, "external_already_used.usage.input_tokens"),
    output_tokens: nonNegativeCount(value.usage.output_tokens ?? 0, "external_already_used.usage.output_tokens"),
    thinking_tokens: nonNegativeCount(value.usage.thinking_tokens ?? 0, "external_already_used.usage.thinking_tokens"),
    total_tokens: nonNegativeCount(value.usage.total_tokens, "external_already_used.usage.total_tokens")
  };
  return {
    schema: "provider-external-already-used/v1",
    provider_id: value.provider_id,
    quota_day_utc: value.quota_day_utc,
    observed_at: new Date(value.observed_at).toISOString(),
    period_certainty: value.period_certainty,
    overlap_with_local_ledger: value.overlap_with_local_ledger,
    source_note: value.source_note.trim(),
    usage
  };
}

function readBudgets(filePath: string): ProviderUsageBudget[] {
  const local = readJsonIfExists(filePath);
  const localBudgets =
    local && typeof local === "object" && Array.isArray((local as { budgets?: unknown }).budgets)
      ? ((local as { budgets: ProviderUsageBudget[] }).budgets ?? [])
      : [];
  return [...defaultProviderQuotaPolicies(), ...localBudgets];
}

function readLedger(filePath: string): ProviderUsageRecord[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return fs.readFileSync(filePath, "utf8")
    .split(/\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ProviderUsageRecord)
    .filter((record) => record.schema === "provider-usage-record/v1");
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

function addCounts(a: ProviderUsageCounts, b: Partial<ProviderUsageCounts> = {}) {
  return {
    requests: a.requests + (b.requests ?? 0),
    input_tokens: a.input_tokens + (b.input_tokens ?? 0),
    output_tokens: a.output_tokens + (b.output_tokens ?? 0),
    thinking_tokens: a.thinking_tokens + (b.thinking_tokens ?? 0),
    total_tokens: a.total_tokens + (b.total_tokens ?? 0)
  };
}

function maxCounts(a: ProviderUsageCounts, b: ProviderUsageCounts): ProviderUsageCounts {
  return {
    requests: Math.max(a.requests, b.requests),
    input_tokens: Math.max(a.input_tokens, b.input_tokens),
    output_tokens: Math.max(a.output_tokens, b.output_tokens),
    thinking_tokens: Math.max(a.thinking_tokens, b.thinking_tokens),
    total_tokens: Math.max(a.total_tokens, b.total_tokens)
  };
}

function utcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcMonth(date: Date) {
  return date.toISOString().slice(0, 7);
}

function utcMinute(date: Date) {
  return date.toISOString().slice(0, 16);
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

function recordDay(record: ProviderUsageRecord) {
  return record.provider_id === "gemini-api"
    ? record.pacific_day
    : record.quota_day_utc ?? record.created_at.slice(0, 10);
}

function recordMonth(record: ProviderUsageRecord) {
  return record.created_at.slice(0, 7);
}

function currentWindows(date: Date) {
  return {
    now_utc: date.toISOString(),
    utc_day: utcDay(date),
    pacific_day: pacificDay(date),
    utc_month: utcMonth(date),
    utc_minute: utcMinute(date),
    reset_notes: {
      openai_api: "UTC day; documented reset 00:00 UTC / 09:00 KST",
      gemini_api: "Pacific day; documented reset midnight America/Los_Angeles",
      modelscope_api: "UTC calendar month for local Qwen Ambassador API-call guard",
      alibaba_model_studio_api:
        "UTC-minute local input-side pre-request estimate plus provider-reported post-call accounting. It is not a rolling 60-second limiter, does not reserve uncapped output/thinking tokens, and cannot guarantee one request will not cross 500K TPM."
    }
  };
}

function totalsForBudget(records: ProviderUsageRecord[], budget: ProviderUsageBudget, windows: ReturnType<typeof currentWindows>) {
  let minute = { ...zero };
  let day = { ...zero };
  let month = { ...zero };
  for (const record of records) {
    if (!matchesBudget(budget, record.provider_id, record.model)) {
      continue;
    }
    if (record.utc_minute === windows.utc_minute) {
      minute = addCounts(minute, record.usage);
    }
    if (recordDay(record) === (record.provider_id === "gemini-api" ? windows.pacific_day : windows.utc_day)) {
      day = addCounts(day, record.usage);
    }
    if (recordMonth(record) === windows.utc_month) {
      month = addCounts(month, record.usage);
    }
  }
  return {
    minute,
    day: addCounts(day, budget.already_used),
    month: addCounts(month, budget.already_used_this_month)
  };
}

function budgetUsesUtcDay(budget: ProviderUsageBudget, candidate: Candidate) {
  if (budget.reset_window === "utc_day") {
    return true;
  }
  return candidate.providerId === "openai-api" &&
    budget.reset_window === undefined &&
    [
      budget.request_limit_per_day,
      budget.input_token_limit_per_day,
      budget.output_token_limit_per_day,
      budget.total_token_limit_per_day
    ].some((limit) => typeof limit === "number");
}

function applyExternalAlreadyUsed(input: {
  candidate: Candidate;
  budget: ProviderUsageBudget;
  localDay: ProviderUsageCounts;
  observation?: ExternalAlreadyUsedObservation;
  windows: ReturnType<typeof currentWindows>;
}) {
  const base = {
    local_day: input.localDay,
    external_day: input.observation?.usage ?? null,
    selected_day: input.localDay
  };
  if (!input.observation) {
    return {
      ...base,
      status: "not_provided" as const,
      reason: "No external dashboard usage observation was supplied for this provider."
    };
  }
  if (!budgetUsesUtcDay(input.budget, input.candidate)) {
    return {
      ...base,
      status: "not_applied_reset_window" as const,
      reason: "The observation is UTC-day usage, but this policy does not use a UTC-day limit."
    };
  }
  if (input.observation.period_certainty !== "confirmed_exact_utc_day") {
    return {
      ...base,
      status: "not_applied_ambiguous_period" as const,
      reason: "The dashboard period was not confirmed as one exact UTC quota day."
    };
  }
  if (input.observation.quota_day_utc !== input.windows.utc_day ||
    input.observation.observed_at.slice(0, 10) !== input.observation.quota_day_utc) {
    return {
      ...base,
      status: "not_applied_stale" as const,
      reason: `The observation does not match current UTC quota day ${input.windows.utc_day}.`
    };
  }
  if (input.observation.overlap_with_local_ledger === "disjoint") {
    const selectedDay = addCounts(input.localDay, input.observation.usage);
    return {
      ...base,
      selected_day: selectedDay,
      status: "applied_sum" as const,
      reason: "Dashboard usage was confirmed disjoint from the local ledger, so both were added."
    };
  }
  const selectedDay = maxCounts(input.localDay, input.observation.usage);
  return {
    ...base,
    selected_day: selectedDay,
    status: "applied_conservative_max" as const,
    reason:
      "Dashboard and local usage may overlap, so the larger count for each metric was used instead of adding both."
  };
}

function checkLimit(projected: ProviderUsageCounts, budget: ProviderUsageBudget, windowName: "minute" | "day" | "month") {
  const suffix = windowName === "minute" ? "per_minute" : windowName === "day" ? "per_day" : "per_month";
  const checks = [
    [`request_limit_${suffix}`, projected.requests],
    [`input_token_limit_${suffix}`, projected.input_tokens],
    [`output_token_limit_${suffix}`, projected.output_tokens],
    [`total_token_limit_${suffix}`, projected.total_tokens]
  ] as const;
  for (const [key, value] of checks) {
    const limit = budget[key as keyof ProviderUsageBudget];
    if (typeof limit === "number" && value > limit) {
      return { ok: false, key, value, limit };
    }
  }
  return { ok: true };
}

function evaluateCandidate(
  candidate: Candidate,
  budgets: ProviderUsageBudget[],
  records: ProviderUsageRecord[],
  estimate: ProviderUsageCounts,
  minuteEstimate: ProviderUsageCounts,
  operatorApproved: boolean,
  approvalNote: string | undefined,
  externalAlreadyUsed: ExternalAlreadyUsedObservation[],
  windows: ReturnType<typeof currentWindows>
) {
  const matches = budgets.filter((budget) => matchesBudget(budget, candidate.providerId, candidate.model));
  if (matches.length === 0) {
    return {
      ...candidate,
      status: "unbudgeted",
      reason: "No matching built-in or local budget policy. Benchmark must not run.",
      matching_policies: []
    };
  }

  const externalObservation = externalAlreadyUsed.find(
    (observation) => observation.provider_id === candidate.providerId
  );
  const quota_checks = matches.map((budget) => {
    const localCurrent = totalsForBudget(records, budget, windows);
    const externalUsage = applyExternalAlreadyUsed({
      candidate,
      budget,
      localDay: localCurrent.day,
      observation: externalObservation,
      windows
    });
    const current = {
      ...localCurrent,
      day: externalUsage.selected_day
    };
    const projected = {
      minute: addCounts(current.minute, minuteEstimate),
      day: addCounts(current.day, estimate),
      month: addCounts(current.month, estimate)
    };
    const limitFailures = [
      checkLimit(projected.minute, budget, "minute"),
      checkLimit(projected.day, budget, "day"),
      checkLimit(projected.month, budget, "month")
    ].filter((result) => !result.ok);
    const blocked = limitFailures.length > 0 && (budget.mode ?? "enforce") !== "track";
    return {
      quota_policy_id: budget.quota_policy_id,
      quota_metric: budget.quota_metric,
      quota_authority: budget.quota_authority,
      reset_window: budget.reset_window,
      mode: budget.mode ?? "enforce",
      source: budget.source,
      current,
      external_usage: externalUsage,
      estimate,
      minute_estimate: minuteEstimate,
      projected,
      status: blocked ? "blocked" : limitFailures.length > 0 ? "tracked" : "allowed",
      failures: limitFailures
    };
  });

  const blocked = quota_checks.find((check) => check.status === "blocked");
  if (blocked) {
    return {
      ...candidate,
      status: "blocked",
      reason: `Blocked by ${blocked.quota_policy_id ?? "matching budget"}`,
      quota_checks
    };
  }
  const approvalPolicies = matches.filter(
    (budget) =>
      budget.requires_operator_approval === true && (budget.mode ?? "enforce") !== "track"
  );
  const hasOperatorApprovalNote =
    operatorApproved && typeof approvalNote === "string" && approvalNote.trim().length > 0;
  if (approvalPolicies.length > 0 && !hasOperatorApprovalNote) {
    const approvalReason =
      approvalPolicies.find((budget) => typeof budget.approval_reason === "string")?.approval_reason ??
      "Matching policy requires explicit operator approval before a live run.";
    return {
      ...candidate,
      status: "needs_dashboard_approval",
      reason: approvalReason,
      quota_checks
    };
  }
  if (candidate.providerId === "openai-api" && !operatorApproved) {
    return {
      ...candidate,
      status: "needs_dashboard_approval",
      reason:
        "OpenAI API requires dashboard/free-tier eligibility and operator approval even when local ledger is under cap.",
      quota_checks
    };
  }
  if (candidate.providerId === "openai-api" && externalObservation &&
    !quota_checks.some((check) =>
      check.external_usage.status === "applied_sum" ||
      check.external_usage.status === "applied_conservative_max")) {
    return {
      ...candidate,
      status: "needs_dashboard_approval",
      reason:
        "The supplied OpenAI dashboard usage observation was ambiguous, stale, or incompatible with the UTC-day policy; obtain a confirmed current-day observation.",
      quota_checks
    };
  }
  return {
    ...candidate,
    status: "allowed",
    reason: "All matching local policies are under projected limits.",
    quota_checks
  };
}

export function runProviderQuotaPreflight(
  argv: string[],
  options: { cwd?: string; now?: Date } = {}
) {
  const args = parseArgs(argv, options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const windows = currentWindows(now);
  const budgets = readBudgets(args.budgetsPath);
  const records = readLedger(args.ledgerPath);
  const results = args.candidates.map((candidate) =>
    evaluateCandidate(
      candidate,
      budgets,
      records,
      args.estimate,
      args.minuteEstimate,
      args.operatorApproved,
      args.approvalNote,
      args.externalAlreadyUsed,
      windows
    )
  );
  const finalStatus = results.some((result) => result.status === "blocked" || result.status === "unbudgeted")
    ? "blocked"
    : results.some((result) => result.status === "needs_dashboard_approval")
      ? "needs_dashboard_approval"
      : "allowed";

  const output = {
    schema: "provider-quota-preflight/v1",
    generated_at: now.toISOString(),
    ledger_path: args.ledgerPath,
    budgets_path: args.budgetsPath,
    approval: {
      operator_approved: args.operatorApproved,
      approval_note: args.approvalNote ?? null
    },
    external_already_used: args.externalAlreadyUsed,
    windows,
    estimate: args.estimate,
    minute_estimate: args.minuteEstimate,
    final_status: finalStatus,
    results
  };

  const outputJson = `${JSON.stringify(output, null, 2)}\n`;
  if (args.outPath) {
    fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
    fs.writeFileSync(args.outPath, outputJson, "utf8");
  }
  return { output, outputJson };
}

function isDirectRun() {
  return Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));
}

if (isDirectRun()) {
  try {
    const { outputJson } = runProviderQuotaPreflight(process.argv.slice(2));
    console.log(outputJson.trimEnd());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
