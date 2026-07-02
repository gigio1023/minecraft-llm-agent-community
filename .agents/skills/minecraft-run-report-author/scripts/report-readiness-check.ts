#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function usage() {
  return "usage: report-readiness-check.ts <report.json> [--json] [--publishable]";
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

function stringRefs(...values) {
  return values.flatMap((value) => {
    if (typeof value === "string" && value.length > 0) {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string" && item.length > 0);
    }
    return [];
  });
}

function refExistsInScopes(ref, scopes) {
  return scopes.some((scope) => existsMaybe(resolveMaybe(scope, ref)));
}

function runSummarizer(reportPath) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const script = path.resolve(
    scriptDir,
    "../../minecraft-agent-runtime-review/scripts/summarize-social-cycle-report.ts"
  );
  if (!fs.existsSync(script)) {
    return { status: "missing_script", stdout: "", stderr: "" };
  }
  const result = spawnSync(process.execPath, ["run", script, reportPath], {
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

export function checkReportReadiness(argv, options = {}) {
  const args = argv;
  if (args.includes("--help") || args.includes("-h")) {
    return { result: null, outputText: usage(), exitCode: 0 };
  }
  const reportArg = args.find((arg) => !arg.startsWith("--"));
  const jsonMode = args.includes("--json");
  const publishableMode = args.includes("--publishable");

  if (!reportArg) {
    return { result: null, outputText: usage(), exitCode: 2 };
  }

  const cwd = options.cwd ?? process.cwd();
  const reportPath = path.resolve(cwd, reportArg);
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
  const transitionRowRefs = cycles.flatMap((cycle) => [
    ...stringRefs(cycle.transition_row_ref, cycle.transition_row_refs),
    ...(Array.isArray(cycle.action_attempts)
      ? cycle.action_attempts.flatMap((attempt) => stringRefs(attempt?.transition_row_ref, attempt?.transition_row_refs))
      : [])
  ]);
  const transitionBatchAuditRefs = stringRefs(
    report.transition_row_batch_audit_ref,
    report.transition_row_batch_audit_refs,
    report.transition_row_batch_ref,
    report.transition_row_batch_refs,
    report.batch_audit_ref,
    report.batch_audit_refs
  );
  const noRegretRefs = stringRefs(
    report.no_regret_run_declaration_ref,
    report.no_regret_run_declaration_refs,
    report.seed_reset_record_ref,
    report.seed_reset_record_refs,
    report.seed_reset_records_ref,
    report.seed_reset_records_refs
  );
  const usageStatuses = Array.isArray(report.provider_usage?.budget_status)
    ? report.provider_usage.budget_status.map((status) => status?.status).filter(Boolean)
    : [];

  const missingEvidenceRefs = evidenceRefs.filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)));
  const missingProviderInputRefs = providerInputRefs.filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)));
  const missingProviderOutputRefs = providerOutputRefs.filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)));
  const missingVisualRefs = visualCaptures
    .flatMap((capture) => [capture?.image_ref, capture?.artifact_ref].filter(Boolean))
    .filter((ref) => !existsMaybe(resolveMaybe(actorDir, ref)) && !existsMaybe(resolveMaybe(reportDir, ref)));
  const refScopes = [actorDir, reportDir].filter(Boolean);
  const missingTransitionRowRefs = transitionRowRefs.filter((ref) => !refExistsInScopes(ref, refScopes));
  const missingTransitionBatchAuditRefs = transitionBatchAuditRefs.filter((ref) => !refExistsInScopes(ref, refScopes));
  const missingNoRegretRefs = noRegretRefs.filter((ref) => !refExistsInScopes(ref, refScopes));

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
      status: providerBacked ? (hasPreflightRef ? "passed" : publishableMode ? "failed" : "warning") : "not_applicable",
      detail: preflightRefs
    },
    {
      name: "transition_row_refs_exist",
      status: transitionRowRefs.length === 0
        ? "not_applicable"
        : missingTransitionRowRefs.length === 0 ? "passed" : "failed",
      detail: missingTransitionRowRefs
    },
    {
      name: "transition_row_batch_audit_ref_present",
      status: transitionRowRefs.length === 0
        ? "not_applicable"
        : transitionBatchAuditRefs.length > 0 ? "passed" : publishableMode ? "failed" : "warning",
      detail: transitionBatchAuditRefs
    },
    {
      name: "transition_row_batch_audit_refs_exist",
      status: transitionBatchAuditRefs.length === 0
        ? "not_applicable"
        : missingTransitionBatchAuditRefs.length === 0 ? "passed" : "failed",
      detail: missingTransitionBatchAuditRefs
    },
    {
      name: "no_regret_refs_exist",
      status: noRegretRefs.length === 0
        ? "not_applicable"
        : missingNoRegretRefs.length === 0 ? "passed" : "failed",
      detail: missingNoRegretRefs
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
    generated_at: (options.now ?? new Date()).toISOString(),
    provider_backed: Boolean(providerBacked),
    publishable_mode: publishableMode,
    checks,
    final_status: failed.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    report_claim_requirements: [
      "separate Recording verdict from Experiment verdict",
      "include a claim table with artifact refs",
      "for transition-row reports, separate observed_delta evidence from actor expected_outcome",
      "state whether transition-row-batch-audit/v1 passes no-regret thresholds",
      "treat screenshots as review-only evidence",
      "state unsupported research, leaderboard, sociality, and budget claims explicitly"
    ]
  };

  const outputText = jsonMode
    ? JSON.stringify(result, null, 2)
    : [
      `Report readiness: ${result.final_status}`,
      ...checks.map((check) => {
        const detail = Array.isArray(check.detail) && check.detail.length > 0
          ? ` (${check.detail.length} issue(s))`
          : "";
        return `- ${check.status}: ${check.name}${detail}`;
      }),
      ...(summarizer.stdout ? ["", "Summarizer output:", summarizer.stdout.trim()] : [])
    ].join("\n");

  return {
    result,
    outputText,
    exitCode: failed.length > 0 ? 1 : 0
  };
}

function isDirectRun() {
  return Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));
}

if (isDirectRun()) {
  const { outputText, exitCode } = checkReportReadiness(process.argv.slice(2));
  console.log(outputText);
  process.exit(exitCode);
}
