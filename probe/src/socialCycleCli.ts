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
    }
  }

  return options;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../..");
  loadRepoDotEnv(repoRoot, { overrideKeys: ["OPENAI_API_KEY", "OPENAI_MODEL"] });

  const parsed = parseArgs(process.argv.slice(2));
  const actorId = parsed.actor ?? "npc_b";
  const providerId = parsed.provider ?? "openai-api";
  const model = parsed.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
  const cycles = parsed.cycles ?? 2;
  const maxActionsPerCycle = parsed.maxActionsPerCycle ?? 3;
  const reportPath = path.resolve(
    repoRoot,
    parsed.report ?? `tmp/social-cycle-${actorId}.json`
  );

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
    reasoning: process.env.SOCIAL_CYCLE_REASONING
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

  if (result.report.runtime_status === "failed") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
