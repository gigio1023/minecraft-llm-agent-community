#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function usage() {
  console.error("usage: report-readiness-check.mjs <report.json> [--json]");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveMaybe(baseDir, ref) {
  if (!ref || typeof ref !== "string") {
    return null;
  }
  if (path.isAbsolute(ref)) {
    return ref;
  }
  return path.resolve(baseDir, ref);
}

function existsMaybe(filePath) {
  return Boolean(filePath && fs.existsSync(filePath));
}

function runSummarizer(reportPath) {
  const script = path.resolve(
    ".agents/skills/minecraft-agent-runtime-review/scripts/summarize-social-cycle-report.mjs"
  );
  if (!fs.existsSync(script)) {
    return { status: "missing_script", stdout: "", stderr: "" };
  }
  const result = spawnSync(process.execPath, [script, reportPath], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  return {
    status: result.status === 0 ? "passed" : "failed",
    stdout: result.stdout,
    stderr: result.stderr,
    exit_code: result.status
  };
}

const args = process.argv.slice(2);
const reportArg = args.find((arg) => !arg.startsWith("--"));
const jsonMode = args.includes("--json");

if (!reportArg) {
  usage();
  process.exit(2);
}

const reportPath = path.resolve(reportArg);
const reportDir = path.dirname(reportPath);
const report = readJson(reportPath);
const actorWorkspaceRoot = resolveMaybe(
  reportDir,
  report.actor_workspace_root_dir ?? path.join("..", "data", "actors", "social-runs", report.run_id ?? "")
);
const actorDir = path.join(actorWorkspaceRoot ?? "", report.actor_id ?? "");

const cycles = Array.isArray(report.cycles) ? report.cycles : [];
const evidenceRefs = cycles.flatMap((cycle) => cycle.evidence_refs ?? []);
const providerInputRefs = cycles.flatMap((cycle) => cycle.provider_input_refs ?? []);
const providerOutputRefs = cycles.flatMap((cycle) => cycle.provider_output_refs ?? []);
const visualCaptures = Array.isArray(report.visual_evidence?.captures)
  ? report.visual_evidence.captures
  : [];
const usageStatuses = Array.isArray(report.provider_usage?.budget_status)
  ? report.provider_usage.budget_status.map((status) => status?.status).filter(Boolean)
  : [];

const missingEvidenceRefs = evidenceRefs.filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)));
const missingProviderInputRefs = providerInputRefs.filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)));
const missingProviderOutputRefs = providerOutputRefs.filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)));
const missingVisualRefs = visualCaptures
  .flatMap((capture) => [capture?.image_ref, capture?.artifact_ref].filter(Boolean))
  .filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)) && !existsMaybe(resolveMaybe(reportDir, ref)));

const providerId = report.provider?.provider_id ?? "";
const providerBacked = providerId && !providerId.startsWith("deterministic") && providerId !== "builtin-planner";
const preflightRefs = [
  ...(Array.isArray(report.preflight_refs) ? report.preflight_refs : []),
  ...(Array.isArray(report.provider_preflight_refs) ? report.provider_preflight_refs : []),
  ...(Array.isArray(report.artifact_refs?.preflight) ? report.artifact_refs.preflight : [])
];
const hasPreflightRef = preflightRefs.length > 0;
const hasProviderUsage = Boolean(report.provider_usage);

const checks = [
  {
    name: "report_schema",
    status: typeof report.schema === "string" ? "passed" : "failed",
    detail: report.schema ?? "missing"
  },
  {
    name: "actor_workspace_root",
    status: existsMaybe(actorWorkspaceRoot) ? "passed" : "warning",
    detail: actorWorkspaceRoot
  },
  {
    name: "evidence_refs_exist",
    status: missingEvidenceRefs.length === 0 ? "passed" : "failed",
    detail: missingEvidenceRefs
  },
  {
    name: "provider_input_refs_exist",
    status: missingProviderInputRefs.length === 0 ? "passed" : "failed",
    detail: missingProviderInputRefs
  },
  {
    name: "provider_output_refs_exist",
    status: missingProviderOutputRefs.length === 0 ? "passed" : "failed",
    detail: missingProviderOutputRefs
  },
  {
    name: "visual_refs_exist",
    status: missingVisualRefs.length === 0 ? "passed" : "warning",
    detail: missingVisualRefs
  },
  {
    name: "provider_usage_present",
    status: providerBacked ? (hasProviderUsage ? "passed" : "failed") : "not_applicable",
    detail: usageStatuses
  },
  {
    name: "preflight_ref_present",
    status: providerBacked ? (hasPreflightRef ? "passed" : "warning") : "not_applicable",
    detail: preflightRefs
  }
];

const summarizer = report.schema === "social-cycle-run-report/v1"
  ? runSummarizer(reportPath)
  : { status: "not_applicable" };
checks.push({
  name: "runtime_review_summarizer",
  status: summarizer.status === "passed" || summarizer.status === "not_applicable" ? summarizer.status : "failed",
  detail: summarizer.exit_code ?? ""
});

const failed = checks.filter((check) => check.status === "failed");
const warnings = checks.filter((check) => check.status === "warning");
const result = {
  schema: "minecraft-run-report-readiness/v1",
  report_path: reportPath,
  generated_at: new Date().toISOString(),
  provider_backed: Boolean(providerBacked),
  checks,
  final_status: failed.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
  report_claim_requirements: [
    "separate Recording verdict from Experiment verdict",
    "include a claim table with artifact refs",
    "treat screenshots as review-only evidence",
    "state unsupported research, leaderboard, sociality, and budget claims explicitly"
  ]
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Report readiness: ${result.final_status}`);
  for (const check of checks) {
    const detail = Array.isArray(check.detail) && check.detail.length > 0
      ? ` (${check.detail.length} issue(s))`
      : "";
    console.log(`- ${check.status}: ${check.name}${detail}`);
  }
  if (summarizer.stdout) {
    console.log("\nSummarizer output:");
    console.log(summarizer.stdout.trim());
  }
}

if (failed.length > 0) {
  process.exit(1);
}
