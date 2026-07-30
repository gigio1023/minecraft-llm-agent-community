import path from "node:path";
import { fileURLToPath } from "node:url";

import { runLiveProviderFreeSmoke } from "./liveSmoke.js";

function parseArgs(argv: string[]) {
  const options: {
    outputDir?: string;
    slotsPerActor?: number;
    responseWindowTimeoutAfterSlots?: number;
    worldSeed?: string;
    allowFailingGate?: boolean;
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
    } else if (arg === "--response-window-timeout-slots" && next) {
      options.responseWindowTimeoutAfterSlots = Number(next);
      index++;
    } else if (arg === "--world-seed" && next) {
      options.worldSeed = next;
      index++;
    } else if (arg === "--allow-failing-gate") {
      options.allowFailingGate = true;
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
        "c2-g-live-provider-free-smoke"
      );

  const result = await runLiveProviderFreeSmoke({
    outputDir,
    slotsPerActor: positiveInteger(parsed.slotsPerActor, 2),
    responseWindowTimeoutAfterSlots: positiveInteger(parsed.responseWindowTimeoutAfterSlots, 1),
    worldSeed: parsed.worldSeed
  });
  console.log(JSON.stringify({
    status: result.gate.status === "passed" ? "ok" : "gate_failed",
    output_dir: result.outputDir,
    declaration_path: result.declarationPath,
    session_path: result.sessionPath,
    public_history_path: result.publicHistoryPath,
    predictions_path: result.predictionsPath,
    score_report_path: result.scoreReportPath,
    gate_path: result.gatePath,
    row_count: result.gate.row_count,
    material_grounded_row_count: result.gate.material_grounded_row_count,
    history_grounded_max_lift: result.gate.history_grounded_lift_gate.max_lift,
    provider_spend: 0
  }));

  if (result.gate.status !== "passed" && !parsed.allowFailingGate) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
