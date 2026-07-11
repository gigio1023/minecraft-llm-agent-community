/**
 * CLI for V4 individual capability cases.
 *
 * Flags: --manifest --case --provider --model --repeat --seed --out
 * Optional: --offline --actor and tighter wall/request/token limits
 * Does not accept --benchmark-task; V4 reports require a validated manifest.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoDotEnv } from "../../config/loadRepoDotEnv.js";
import type { SocialCycleProviderId } from "../../runtime/goals/types.js";
import {
  CapabilityRunnerError,
  isProviderFree,
  runCapabilityCaseRepeats
} from "./runner.js";

type ParsedArgs = {
  manifest?: string;
  caseId?: string;
  provider?: SocialCycleProviderId;
  model?: string;
  repeat?: number;
  seed?: string;
  out?: string;
  actor?: string;
  offline?: boolean;
  cycles?: number;
  maxActionsPerCycle?: number;
  maxWallTimeMs?: number;
  maxProviderRequests?: number;
  maxTotalTokens?: number;
};

function normalizeProvider(value: string | undefined): SocialCycleProviderId | undefined {
  if (
    value === "openai-api" ||
    value === "gemini-api" ||
    value === "modelscope-api" ||
    value === "deterministic-social" ||
    value === "scripted-social"
  ) {
    return value;
  }
  return undefined;
}

function parsePositiveInt(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CapabilityRunnerError(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(argv: string[]): ParsedArgs {
  const options: ParsedArgs = {};

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--benchmark-task") {
      throw new CapabilityRunnerError(
        "--benchmark-task is not accepted for capability runs; use --manifest and --case"
      );
    }

    if (arg === "--manifest" && next) {
      options.manifest = next;
      index++;
    } else if (arg === "--case" && next) {
      options.caseId = next;
      index++;
    } else if (arg === "--provider" && next) {
      const provider = normalizeProvider(next);
      if (!provider) {
        throw new CapabilityRunnerError(`Unsupported --provider '${next}'`);
      }
      options.provider = provider;
      index++;
    } else if (arg === "--model" && next) {
      options.model = next;
      index++;
    } else if (arg === "--repeat" && next) {
      options.repeat = parsePositiveInt(next, "--repeat");
      index++;
    } else if (arg === "--seed" && next) {
      options.seed = next;
      index++;
    } else if (arg === "--out" && next) {
      options.out = next;
      index++;
    } else if (arg === "--actor" && next) {
      options.actor = next;
      index++;
    } else if (arg === "--offline") {
      options.offline = true;
    } else if (arg === "--online" || arg === "--connect-world") {
      options.offline = false;
    } else if (arg === "--cycles" && next) {
      // Debug/smoke override; not required for declared suite runs.
      options.cycles = parsePositiveInt(next, "--cycles");
      index++;
    } else if (arg === "--max-actions-per-cycle" && next) {
      options.maxActionsPerCycle = parsePositiveInt(next, "--max-actions-per-cycle");
      index++;
    } else if (arg === "--max-wall-time-ms" && next) {
      options.maxWallTimeMs = parsePositiveInt(next, "--max-wall-time-ms");
      index++;
    } else if (arg === "--max-provider-requests" && next) {
      options.maxProviderRequests = parsePositiveInt(next, "--max-provider-requests");
      index++;
    } else if (arg === "--max-total-tokens" && next) {
      options.maxTotalTokens = parsePositiveInt(next, "--max-total-tokens");
      index++;
    } else if (arg.startsWith("-")) {
      throw new CapabilityRunnerError(`Unknown flag: ${arg}`);
    }
  }

  return options;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../../../..");
  loadRepoDotEnv(repoRoot, {
    overrideKeys: ["OPENAI_API_KEY"]
  });

  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof CapabilityRunnerError) {
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }
    throw error;
  }

  if (!parsed.manifest) {
    console.error("Missing required --manifest <path>");
    process.exitCode = 1;
    return;
  }
  if (!parsed.caseId) {
    console.error("Missing required --case <case_id>");
    process.exitCode = 1;
    return;
  }
  if (!parsed.out) {
    console.error("Missing required --out <directory>");
    process.exitCode = 1;
    return;
  }

  const providerId = parsed.provider ?? "deterministic-social";
  const connectToWorld =
    parsed.offline === undefined
      ? isProviderFree(providerId)
        ? false
        : true
      : !parsed.offline;

  try {
    const results = await runCapabilityCaseRepeats({
      manifestPath: path.resolve(parsed.manifest),
      caseId: parsed.caseId,
      outDir: path.resolve(parsed.out),
      providerId,
      model: parsed.model,
      seed: parsed.seed,
      actorId: parsed.actor,
      connectToWorld,
      repeat: parsed.repeat ?? 1,
      cycles: parsed.cycles,
      maxActionsPerCycle: parsed.maxActionsPerCycle,
      budgetOverrides: {
        max_wall_time_ms: parsed.maxWallTimeMs,
        max_provider_requests: parsed.maxProviderRequests,
        max_total_tokens: parsed.maxTotalTokens
      },
      repoRoot
    });

    const last = results[results.length - 1]!;
    console.log(
      JSON.stringify(
        {
          suite_index_path: last.suite_index_path,
          runs: results.map((result) => ({
            case_id: result.declaration.case_id,
            capability_run_id: result.declaration.capability_run_id,
            declaration_path: result.declaration_path,
            raw_report_path: result.raw_report_path,
            normalized_report_path: result.normalized_report_path,
            budget_status_path: result.budget_status_path,
            interpretation_status: result.normalized_report.interpretation_status,
            runtime_status: result.normalized_report.runtime_status,
            budget_stopped: result.budget_status.budget_stopped,
            budget_exhausted: result.budget_status.budget_exhausted,
            provider_free: result.declaration.provider_free
          }))
        },
        null,
        2
      )
    );
  } catch (error) {
    if (error instanceof CapabilityRunnerError) {
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
