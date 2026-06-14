/**
 * CLI entrypoint for running the bounded social-cycle runtime.
 *
 * @remarks CLI defaults and flags should expose the core loop without hiding
 * provider, server, persistence, or actor-workspace blockers behind optimistic
 * status text.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

import { loadRepoDotEnv } from "./config/loadRepoDotEnv.js";
import { runSocialCycle, type SocialCycleRunOptions } from "./runtime/socialCycleRunner.js";
import type { SocialCycleProviderId, WorldEventKind } from "./runtime/goals/types.js";
import { parseWorldScenarioId, type WorldScenarioId } from "./server/worldScenarios.js";

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
    worldScenario?: WorldScenarioId;
    benchmarkTask?: string;
    worldSeed?: string;
    levelType?: string;
    prepareSpawnAccess?: boolean;
    sharedStorageSocialSmoke?: boolean;
    geminiModelRotation?: string[];
    visualEvidence?: boolean;
    visualEvidenceIntervalCycles?: number;
    visualEvidenceCameraMode?: "first_person" | "third_person" | "both";
    visualEvidencePort?: number;
    visualEvidenceWidth?: number;
    visualEvidenceHeight?: number;
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
    } else if (arg === "--world-scenario" && next) {
      options.worldScenario = parseWorldScenarioId(next);
      index++;
    } else if (arg === "--benchmark-task" && next) {
      options.benchmarkTask = next;
      index++;
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
    } else if (arg === "--visual-evidence") {
      options.visualEvidence = true;
    } else if (arg === "--visual-evidence-interval" && next) {
      options.visualEvidenceIntervalCycles = Number(next);
      index++;
    } else if (arg === "--visual-evidence-camera" && next) {
      options.visualEvidenceCameraMode = parseVisualEvidenceCameraMode(next);
      index++;
    } else if (arg === "--visual-evidence-port" && next) {
      options.visualEvidencePort = Number(next);
      index++;
    } else if (arg === "--visual-evidence-width" && next) {
      options.visualEvidenceWidth = Number(next);
      index++;
    } else if (arg === "--visual-evidence-height" && next) {
      options.visualEvidenceHeight = Number(next);
      index++;
    }
  }

  return options;
}

function parseVisualEvidenceCameraMode(value: string | undefined): "first_person" | "third_person" | "both" | undefined {
  const normalized = value?.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "first_person" || normalized === "first") {
    return "first_person";
  }
  if (normalized === "third_person" || normalized === "third") {
    return "third_person";
  }
  if (normalized === "both" || normalized === "dual") {
    return "both";
  }
  return undefined;
}

function parseCsvList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSocialCycleProvider(value: string | undefined): SocialCycleProviderId | undefined {
  if (
    value === "openai-api" ||
    value === "gemini-api" ||
    value === "modelscope-api" ||
    value === "deterministic-social"
  ) {
    return value;
  }
  return undefined;
}

function envEnabled(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

function optionalPositiveInteger(value: number | string | undefined) {
  if (value === undefined || value === "") {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function resolveModelForProvider(input: {
  providerId: SocialCycleProviderId;
  model: string | undefined;
}) {
  const explicitModel = input.model?.trim();
  if (
    input.providerId === "openai-api" ||
    input.providerId === "gemini-api" ||
    input.providerId === "modelscope-api"
  ) {
    if (!explicitModel) {
      throw new Error(
        `--model is required for --provider ${input.providerId}. ` +
          "Do not rely on OPENAI_MODEL, GEMINI_MODEL, or SOCIAL_CYCLE_MODEL for benchmark runs."
      );
    }
    return explicitModel;
  }
  return "deterministic-social";
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../..");
  loadRepoDotEnv(repoRoot, {
    overrideKeys: ["OPENAI_API_KEY", "GEMINI_API_KEY", "MODELSCOPE_API_KEY", "MODELSCOPE_BASE_URL"]
  });

  const parsed = parseArgs(process.argv.slice(2));
  const worldScenario =
    parsed.worldScenario ?? parseWorldScenarioId(process.env.SOCIAL_CYCLE_WORLD_SCENARIO);
  const actorId = parsed.actor ?? "npc_b";
  const providerId =
    parsed.provider ??
    normalizeSocialCycleProvider(process.env.SOCIAL_CYCLE_PROVIDER) ??
    "deterministic-social";
  const model = resolveModelForProvider({ providerId, model: parsed.model });
  const geminiModelRotation = parsed.geminiModelRotation;
  const cycles = parsed.cycles ?? 2;
  const maxActionsPerCycle = parsed.maxActionsPerCycle ?? 3;
  const visualEvidenceEnabled =
    parsed.visualEvidence ?? envEnabled(process.env.SOCIAL_CYCLE_VISUAL_EVIDENCE);
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
    worldScenario,
    benchmarkTask: parsed.benchmarkTask,
    worldSeed: parsed.worldSeed,
    levelType: parsed.levelType,
    prepareSpawnAccess: parsed.prepareSpawnAccess,
    sharedStorageSocialSmoke: parsed.sharedStorageSocialSmoke,
    geminiModelRotation,
    visualEvidence: visualEvidenceEnabled
      ? {
          enabled: true,
          intervalCycles: optionalPositiveInteger(
            parsed.visualEvidenceIntervalCycles ?? process.env.SOCIAL_CYCLE_VISUAL_EVIDENCE_INTERVAL
          ),
          cameraMode:
            parsed.visualEvidenceCameraMode ??
            parseVisualEvidenceCameraMode(process.env.SOCIAL_CYCLE_VISUAL_EVIDENCE_CAMERA),
          port: optionalPositiveInteger(
            parsed.visualEvidencePort ?? process.env.SOCIAL_CYCLE_VISUAL_EVIDENCE_PORT
          ),
          width: optionalPositiveInteger(
            parsed.visualEvidenceWidth ?? process.env.SOCIAL_CYCLE_VISUAL_EVIDENCE_WIDTH
          ),
          height: optionalPositiveInteger(
            parsed.visualEvidenceHeight ?? process.env.SOCIAL_CYCLE_VISUAL_EVIDENCE_HEIGHT
          ),
          chromeExecutablePath: process.env.SOCIAL_CYCLE_VISUAL_CHROME_PATH
        }
      : undefined,
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
