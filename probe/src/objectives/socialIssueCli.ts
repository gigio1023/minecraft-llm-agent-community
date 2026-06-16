#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";

import { runBorrowedToolQwenSmoke } from "./socialIssues/borrowedTool.js";
import { formatBorrowedToolIssueHtml } from "./socialIssues/html.js";
import { BORROWED_TOOL_ISSUE_ID } from "./socialIssues/types.js";

type CliArgs = {
  issue?: string;
  model?: string;
  outDir?: string;
  report?: string;
  html?: string;
};

function parseArgs(argv: string[]) {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--issue" && next) {
      args.issue = next;
      index += 1;
    } else if (arg === "--model" && next) {
      args.model = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
      args.outDir = next;
      index += 1;
    } else if (arg === "--report" && next) {
      args.report = next;
      index += 1;
    } else if (arg === "--html" && next) {
      args.html = next;
      index += 1;
    }
  }
  return args;
}

async function writeFile(filePath: string, contents: string) {
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, contents);
  return resolved;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const issue = args.issue ?? BORROWED_TOOL_ISSUE_ID;
  if (issue !== BORROWED_TOOL_ISSUE_ID) {
    throw new Error(`Unsupported social issue: ${issue}`);
  }
  const model = args.model;
  if (!model?.trim()) {
    throw new Error("--model is required. Do not rely on a default provider model for benchmarks.");
  }

  const outDir = args.outDir ? path.resolve(args.outDir) : undefined;
  const reportPath = args.report
    ? path.resolve(args.report)
    : outDir
      ? path.join(outDir, "report.json")
      : undefined;
  const htmlPath = args.html
    ? path.resolve(args.html)
    : outDir
      ? path.join(outDir, "index.html")
      : undefined;

  const report = await runBorrowedToolQwenSmoke({ model });
  const reportJson = `${JSON.stringify(report, null, 2)}\n`;
  if (reportPath) {
    await writeFile(reportPath, reportJson);
  } else {
    process.stdout.write(reportJson);
  }
  if (htmlPath) {
    await writeFile(htmlPath, formatBorrowedToolIssueHtml(report));
  }

  console.log(`social_issue_summary status=${report.summary.status} score=${report.summary.score}/${report.summary.max_score} issue=${report.issue_id}`);
  if (reportPath) console.log(`social_issue_report ${reportPath}`);
  if (htmlPath) console.log(`social_issue_html ${htmlPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
