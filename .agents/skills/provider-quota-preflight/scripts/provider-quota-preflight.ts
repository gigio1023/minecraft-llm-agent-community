#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";

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

type Args = {
  candidates: Candidate[];
  ledgerPath: string;
  budgetsPath: string;
  outPath?: string;
  approvalNote?: string;
  estimate: ProviderUsageCounts;
  minuteEstimate: ProviderUsageCounts;
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

function parseArgs(argv: string[]): Args {
  const repoRoot = process.cwd();
  const args: Args = {
    candidates: [],
    ledgerPath: path.join(repoRoot, "build", "provider-usage", "provider-usage-ledger.jsonl"),
    budgetsPath: path.join(repoRoot, "build", "provider-usage", "free-tier-budgets.json"),
    outPath: undefined,
    approvalNote: undefined,
    estimate: { ...zero },
    minuteEstimate: { ...zero },
    operatorApproved: false,
    estimateRequestsProvided: false,
    estimateTokensProvided: false,
    minuteRequestsProvided: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--candidate" && next) {
      args.candidates.push(parseCandidate(next));
      index += 1;
    } else if (arg === "--ledger" && next) {
      args.ledgerPath = path.resolve(next);
      index += 1;
    } else if (arg === "--budgets" && next) {
      args.budgetsPath = path.resolve(next);
      index += 1;
    } else if (arg === "--out" && next) {
      args.outPath = path.resolve(next);
      index += 1;
    } else if (arg === "--approval-note" && next) {
      args.approvalNote = next;
      index += 1;
    } else if (arg === "--approval-note-file" && next) {
      args.approvalNote = fs.readFileSync(path.resolve(next), "utf8").trim();
      index += 1;
    } else if (arg === "--estimate-requests" && next) {
      args.estimate.requests = parsePositiveInt(next, arg);
      args.estimateRequestsProvided = true;
      index += 1;
    } else if (arg === "--estimate-input-tokens" && next) {
      args.estimate.input_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-output-tokens" && next) {
      args.estimate.output_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-thinking-tokens" && next) {
      args.estimate.thinking_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-total-tokens" && next) {
      args.estimate.total_tokens = parsePositiveInt(next, arg);
      args.estimateTokensProvided = true;
      index += 1;
    } else if (arg === "--estimate-requests-per-minute" && next) {
      args.minuteEstimate.requests = parsePositiveInt(next, arg);
      args.minuteRequestsProvided = true;
      index += 1;
    } else if (arg === "--estimate-input-tokens-per-minute" && next) {
      args.minuteEstimate.input_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--estimate-output-tokens-per-minute" && next) {
      args.minuteEstimate.output_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--estimate-thinking-tokens-per-minute" && next) {
      args.minuteEstimate.thinking_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--estimate-total-tokens-per-minute" && next) {
      args.minuteEstimate.total_tokens = parsePositiveInt(next, arg);
      index += 1;
    } else if (arg === "--operator-approved") {
      args.operatorApproved = true;
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
  if (args.operatorApproved && !args.approvalNote) {
    throw new Error("--operator-approved requires --approval-note or --approval-note-file");
  }
  return args;
}

function readJsonIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
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
      modelscope_api: "UTC calendar month for local Qwen Ambassador API-call guard"
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

  const quota_checks = matches.map((budget) => {
    const current = totalsForBudget(records, budget, windows);
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
  if (candidate.providerId === "openai-api" && !operatorApproved) {
    return {
      ...candidate,
      status: "needs_dashboard_approval",
      reason:
        "OpenAI API requires dashboard/free-tier eligibility and operator approval even when local ledger is under cap.",
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

const args = parseArgs(process.argv.slice(2));
const windows = currentWindows(new Date());
const budgets = readBudgets(args.budgetsPath);
const records = readLedger(args.ledgerPath);
const results = args.candidates.map((candidate) =>
  evaluateCandidate(candidate, budgets, records, args.estimate, args.minuteEstimate, args.operatorApproved, windows)
);
const finalStatus = results.some((result) => result.status === "blocked" || result.status === "unbudgeted")
  ? "blocked"
  : results.some((result) => result.status === "needs_dashboard_approval")
    ? "needs_dashboard_approval"
    : "allowed";

const output = {
  schema: "provider-quota-preflight/v1",
  generated_at: new Date().toISOString(),
  ledger_path: args.ledgerPath,
  budgets_path: args.budgetsPath,
  approval: {
    operator_approved: args.operatorApproved,
    approval_note: args.approvalNote ?? null
  },
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
console.log(outputJson.trimEnd());
