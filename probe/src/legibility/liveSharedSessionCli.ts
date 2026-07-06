import path from "node:path";
import { fileURLToPath } from "node:url";

import { runLiveSharedLegibilitySession } from "./liveSharedSession.js";

function parseArgs(argv: string[]) {
  const options: {
    outputDir?: string;
    slotsPerActor?: number;
    worldSeed?: string;
  } = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];
    if ((arg === "--output-dir" || arg === "--out") && next) {
      options.outputDir = next;
      index++;
    } else if (arg === "--slots-per-actor" && next) {
      options.slotsPerActor = Number(next);
      index++;
    } else if (arg === "--world-seed" && next) {
      options.worldSeed = next;
      index++;
    }
  }
  return options;
}

function positiveInteger(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../../..");
  const parsed = parseArgs(process.argv.slice(2));
  const outputDir = parsed.outputDir
    ? path.resolve(parsed.outputDir)
    : path.join(
        repoRoot,
        "project-docs",
        "experiments",
        "raw",
        "2026-07-06",
        "c2-live-shared-session-c2-1"
      );

  const result = await runLiveSharedLegibilitySession({
    outputDir,
    slotsPerActor: positiveInteger(parsed.slotsPerActor, 1),
    worldSeed: parsed.worldSeed
  });
  console.log(JSON.stringify({
    status: "ok",
    output_dir: result.outputDir,
    session_path: result.sessionPath,
    slot_count: result.session.slot_events.length,
    actor_routes: result.session.actor_routes.map((route) => ({
      actor_id: route.actor_id,
      provider_id: route.provider_id,
      model: route.model
    })),
    provider_spend: 0
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
