/**
 * CLI for summarizing and auditing social-cycle run reports.
 *
 * @remarks Review summaries are post-run diagnosis aids and should keep success,
 * stall, blocker, and evidence-gap claims traceable to artifacts.
 */
import fs from "node:fs/promises";
import path from "node:path";

import {
  buildSocialCycleReviewSummary,
  formatReviewSummaryMarkdown
} from "./socialCycleReviewSummary.js";

async function main() {
  const reportPath = path.resolve(process.argv[2] ?? "");
  if (!reportPath) {
    console.error(
      "Usage: bun run src/runtime/goals/socialCycleReviewSummaryCli.ts <report.json> [--markdown <out.md>]"
    );
    process.exitCode = 1;
    return;
  }

  const markdownOut = process.argv.includes("--markdown")
    ? path.resolve(process.argv[process.argv.indexOf("--markdown") + 1] ?? "")
    : reportPath.replace(/\.json$/i, "-review-summary.json");

  const summary = await buildSocialCycleReviewSummary(reportPath);
  const jsonPath = reportPath.replace(/\.json$/i, "-review-summary.json");
  await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const mdPath =
    process.argv.includes("--markdown") && markdownOut
      ? markdownOut
      : reportPath.replace(/\.json$/i, "-review.md");
  await fs.writeFile(mdPath, formatReviewSummaryMarkdown(summary), "utf8");

  console.log(
    JSON.stringify({
      review_json: jsonPath,
      review_markdown: mdPath,
      total_cycles: summary.total_cycles,
      outcome_counts: summary.outcome_counts,
      cycles_with_prior_judgment: summary.cycles_with_prior_judgment_context,
      runtime_retry_constraints: summary.runtime_retry_constraint_count,
      retry_constraint_blocked_attempts: summary.retry_constraint_blocked_attempts
    })
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
