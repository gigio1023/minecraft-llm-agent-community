import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

import { loadRepoDotEnv } from "./config/loadRepoDotEnv.js";
import { runSocialCycle, type SocialCycleRunOptions } from "./runtime/socialCycleRunner.js";
import type { SocialCycleProviderId, WorldEventKind } from "./runtime/goals/types.js";

function parseArgs(argv: string[]) {
  const options: {
    actor?: string;
    provider?: SocialCycleProviderId;
    model?: string;
    cycles?: number;
    maxActionsPerCycle?: number;
    report?: string;
    noDashboard?: boolean;
    worldEvents: Array<{ summary: string; kind: WorldEventKind }>;
    connectToWorld?: boolean;
    isolateWorkspace?: boolean;
    freshWorld?: boolean;
    worldSeed?: string;
    levelType?: string;
    prepareSpawnAccess?: boolean;
    sharedStorageSocialSmoke?: boolean;
    geminiModelRotation?: string[];
    actionHotPath?: SocialCycleRunOptions["actionHotPath"];
  } = { worldEvents: [] };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--actor" && next) {
      options.actor = next;
      index++;
    } else if (arg === "--provider" && next) {
      options.provider = next as SocialCycleProviderId;
      index++;
    } else if (arg === "--model" && next) {
      options.model = next;
      index++;
    } else if (arg === "--cycles" && next) {
      options.cycles = Number(next);
      index++;
    } else if (arg === "--max-actions-per-cycle" && next) {
      options.maxActionsPerCycle = Number(next);
      index++;
    } else if (arg === "--report" && next) {
      options.report = next;
      index++;
    } else if (arg === "--world-event" && next) {
      options.worldEvents.push({ summary: next, kind: "scenario_event" });
      index++;
    } else if (arg === "--world-event-kind" && next) {
      const last = options.worldEvents[options.worldEvents.length - 1];
      if (last) {
        last.kind = next as WorldEventKind;
      }
      index++;
    } else if (arg === "--no-dashboard") {
      options.noDashboard = true;
    } else if (arg === "--offline") {
      options.connectToWorld = false;
    } else if (arg === "--isolate-workspace") {
      options.isolateWorkspace = true;
    } else if (arg === "--fresh-world") {
      options.freshWorld = true;
    } else if (arg === "--world-seed" && next) {
      options.worldSeed = next;
      index++;
    } else if (arg === "--level-type" && next) {
      options.levelType = next;
      index++;
    } else if (arg === "--prepare-spawn-access") {
      options.prepareSpawnAccess = true;
    } else if (arg === "--shared-storage-social-smoke") {
      options.sharedStorageSocialSmoke = true;
    } else if ((arg === "--gemini-model-rotation" || arg === "--models") && next) {
      options.geminiModelRotation = parseCsvList(next);
      index++;
    } else if (arg === "--action-hot-path" && next) {
      options.actionHotPath = normalizeActionHotPath(next);
      index++;
    }
  }

  return options;
}

function parseCsvList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSocialCycleProvider(value: string | undefined): SocialCycleProviderId | undefined {
  if (value === "openai-api" || value === "gemini-api" || value === "deterministic-social") {
    return value;
  }
  return undefined;
}

function normalizeActionHotPath(value: string | undefined): SocialCycleRunOptions["actionHotPath"] | undefined {
  if (!value) {
    return undefined;
  }
  if (value === "legacy" || value === "actor_turn") {
    return value;
  }
  throw new Error("--action-hot-path must be legacy or actor_turn");
}

function defaultModelForProvider(providerId: SocialCycleProviderId) {
  if (providerId === "gemini-api") {
    return process.env.GEMINI_MODEL ?? "gemma-4-31b-it";
  }
  if (providerId === "openai-api") {
    const openAiModel = process.env.OPENAI_MODEL?.trim();
    if (!openAiModel) {
      throw new Error("--model or OPENAI_MODEL is required for --provider openai-api");
    }
    return openAiModel;
  }
  return "deterministic-social";
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../..");
  loadRepoDotEnv(repoRoot, {
    overrideKeys: ["OPENAI_API_KEY", "OPENAI_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL"]
  });

  const parsed = parseArgs(process.argv.slice(2));
  const actorId = parsed.actor ?? "npc_b";
  const providerId =
    parsed.provider ??
    normalizeSocialCycleProvider(process.env.SOCIAL_CYCLE_PROVIDER) ??
    "deterministic-social";
  const model = parsed.model ?? process.env.SOCIAL_CYCLE_MODEL ?? defaultModelForProvider(providerId);
  const geminiModelRotation =
    parsed.geminiModelRotation ??
    parseCsvList(process.env.SOCIAL_CYCLE_GEMINI_MODEL_ROTATION || process.env.GEMINI_MODEL_ROTATION);
  const actionHotPath =
    parsed.actionHotPath ??
    normalizeActionHotPath(process.env.SOCIAL_CYCLE_ACTION_HOT_PATH) ??
    "legacy";
  const cycles = parsed.cycles ?? 2;
  const maxActionsPerCycle = parsed.maxActionsPerCycle ?? 3;
  const reportPath = parsed.report
    ? path.resolve(parsed.report)
    : path.resolve(repoRoot, `tmp/social-cycle-${actorId}.json`);

  await fs.mkdir(path.dirname(reportPath), { recursive: true });

  const result = await runSocialCycle({
    actorId,
    providerId,
    model,
    cycles,
    maxActionsPerCycle,
    reportPath,
    worldEvents: parsed.worldEvents,
    connectToWorld: parsed.connectToWorld,
    isolateWorkspace: parsed.isolateWorkspace,
    freshWorld: parsed.freshWorld,
    worldSeed: parsed.worldSeed,
    levelType: parsed.levelType,
    prepareSpawnAccess: parsed.prepareSpawnAccess,
    sharedStorageSocialSmoke: parsed.sharedStorageSocialSmoke,
    geminiModelRotation,
    actionHotPath,
    reasoning: process.env.SOCIAL_CYCLE_REASONING,
    repoRoot
  });

  const reviewHint = path
    .resolve(result.reportPath)
    .replace(/\.json$/i, "-review.md");

  console.log(
    JSON.stringify({
      report_path: result.reportPath,
      review_markdown_hint: reviewHint,
      runtime_status: result.report.runtime_status,
      agency_status: result.report.agency_status,
      action_hot_path: result.report.action_hot_path,
      provider_usage: result.report.provider_usage ?? null,
      cycles: result.report.cycles.length,
      provider_error: result.report.provider_error ?? null
    })
  );

  if (result.report.cycles.length >= 5) {
    const { buildSocialCycleReviewSummary, formatReviewSummaryMarkdown } = await import(
      "./runtime/goals/socialCycleReviewSummary.js"
    );
    const summary = await buildSocialCycleReviewSummary(result.reportPath);
    await fs.writeFile(reviewHint, formatReviewSummaryMarkdown(summary), "utf8");
    await fs.writeFile(
      result.reportPath.replace(/\.json$/i, "-review-summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8"
    );
    console.log(JSON.stringify({ auto_review_written: reviewHint }));
  }

  if (result.report.runtime_status !== "passed") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
