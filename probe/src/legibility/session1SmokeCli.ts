import path from "node:path";
import { fileURLToPath } from "node:url";

import { runSession1LegibilitySmoke } from "./session1Smoke.js";

function parseArgs(argv: string[]) {
  const options: { outputDir?: string } = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];
    if ((arg === "--output-dir" || arg === "--out") && next) {
      options.outputDir = next;
      index++;
    }
  }
  return options;
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
        "session1-legibility-smoke"
      );
  const result = await runSession1LegibilitySmoke({ outputDir });
  console.log(JSON.stringify({
    status: "ok",
    output_dir: result.outputDir,
    session_path: result.sessionPath,
    public_history_path: result.publicHistoryPath,
    declaration_path: result.declarationPath,
    predictions_path: result.predictionsPath,
    score_report_path: result.scoreReportPath,
    row_count: result.rows.length
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
