#!/usr/bin/env bun

type Args = {
  providerId: string;
  model: string;
  cycles: number;
  lanes: number;
  maxActionsPerCycle: number;
  requestsPerCycle: number;
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
  thinkingTokensPerRequest: number;
  requestsPerMinute: number;
};

function usage() {
  return `usage: estimate-social-cycle-usage.ts --provider provider_id --model model --cycles N [--lanes N] [--max-actions-per-cycle N]`;
}

function hasValue(value: string | undefined) {
  return value !== undefined && !value.startsWith("--");
}

function positiveInt(value: string | undefined, label: string, fallback?: number) {
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`${label} is required`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return Math.ceil(parsed);
}

function nonNegativeInt(value: string | undefined, label: string, fallback = 0) {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return Math.ceil(parsed);
}

function parseArgs(argv: string[]): Args {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    process.exit(0);
  }

  const args: Partial<Args> = {
    lanes: 1,
    maxActionsPerCycle: 1,
    requestsPerCycle: 2,
    inputTokensPerRequest: 12000,
    outputTokensPerRequest: 3000,
    thinkingTokensPerRequest: 0,
    requestsPerMinute: 1
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--provider" && hasValue(next)) {
      args.providerId = next;
      index += 1;
    } else if (arg === "--model" && hasValue(next)) {
      args.model = next;
      index += 1;
    } else if (arg === "--cycles" && hasValue(next)) {
      args.cycles = positiveInt(next, arg);
      index += 1;
    } else if (arg === "--lanes" && hasValue(next)) {
      args.lanes = positiveInt(next, arg);
      index += 1;
    } else if (arg === "--max-actions-per-cycle" && hasValue(next)) {
      args.maxActionsPerCycle = positiveInt(next, arg);
      index += 1;
    } else if (arg === "--requests-per-cycle" && hasValue(next)) {
      args.requestsPerCycle = positiveInt(next, arg);
      index += 1;
    } else if (arg === "--input-tokens-per-request" && hasValue(next)) {
      args.inputTokensPerRequest = positiveInt(next, arg);
      index += 1;
    } else if (arg === "--output-tokens-per-request" && hasValue(next)) {
      args.outputTokensPerRequest = positiveInt(next, arg);
      index += 1;
    } else if (arg === "--thinking-tokens-per-request" && hasValue(next)) {
      args.thinkingTokensPerRequest = nonNegativeInt(next, arg);
      index += 1;
    } else if (arg === "--requests-per-minute" && hasValue(next)) {
      args.requestsPerMinute = positiveInt(next, arg);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown or incomplete option ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument ${arg}`);
    }
  }

  if (!args.providerId || !args.model || !args.cycles) {
    throw new Error("--provider, --model, and --cycles are required");
  }
  return args as Args;
}

const args = parseArgs(process.argv.slice(2));
const requests =
  args.cycles * args.lanes * Math.max(args.requestsPerCycle, args.maxActionsPerCycle);
const inputTokens = requests * args.inputTokensPerRequest;
const outputTokens = requests * args.outputTokensPerRequest;
const thinkingTokens = requests * args.thinkingTokensPerRequest;
const totalTokens = inputTokens + outputTokens + thinkingTokens;
const minuteRequests = args.requestsPerMinute;
const minuteInputTokens = minuteRequests * args.inputTokensPerRequest;
const minuteOutputTokens = minuteRequests * args.outputTokensPerRequest;
const minuteThinkingTokens = minuteRequests * args.thinkingTokensPerRequest;
const minuteTotalTokens = minuteInputTokens + minuteOutputTokens + minuteThinkingTokens;

const preflightArgs = [
  "--candidate", `${args.providerId}:${args.model}`,
  "--estimate-requests", String(requests),
  "--estimate-input-tokens", String(inputTokens),
  "--estimate-output-tokens", String(outputTokens),
  "--estimate-thinking-tokens", String(thinkingTokens),
  "--estimate-total-tokens", String(totalTokens),
  "--estimate-requests-per-minute", String(minuteRequests),
  "--estimate-input-tokens-per-minute", String(minuteInputTokens),
  "--estimate-output-tokens-per-minute", String(minuteOutputTokens),
  "--estimate-thinking-tokens-per-minute", String(minuteThinkingTokens),
  "--estimate-total-tokens-per-minute", String(minuteTotalTokens)
];

console.log(JSON.stringify({
  schema: "social-cycle-provider-usage-estimate/v1",
  generated_at: new Date().toISOString(),
  assumptions: args,
  estimate: {
    requests,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    thinking_tokens: thinkingTokens,
    total_tokens: totalTokens
  },
  minute_estimate: {
    requests: minuteRequests,
    input_tokens: minuteInputTokens,
    output_tokens: minuteOutputTokens,
    thinking_tokens: minuteThinkingTokens,
    total_tokens: minuteTotalTokens
  },
  provider_quota_preflight_args: preflightArgs
}, null, 2));
