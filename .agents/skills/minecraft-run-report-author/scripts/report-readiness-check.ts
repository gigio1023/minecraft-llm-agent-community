#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

function usage() {
  return "usage: report-readiness-check.ts <report-or-session.json> [--json] [--publishable]";
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
  const result = spawnSync("bun", ["run", script, reportPath], {
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

function recursivelyHasKey(value, key) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => recursivelyHasKey(item, key));
  }
  return Object.prototype.hasOwnProperty.call(value, key)
    || Object.values(value).some((item) => recursivelyHasKey(item, key));
}

function readSiblingJson(baseDir, fileName) {
  const filePath = path.join(baseDir, fileName);
  if (!fs.existsSync(filePath)) {
    return { filePath, value: null };
  }
  return { filePath, value: readJson(filePath) };
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function findRepositoryRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(current, "SPEC.md")) &&
      fs.existsSync(path.join(current, "project-docs"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function resolveRepositoryRef(repoRoot, ref) {
  if (!repoRoot || typeof ref !== "string" || ref.length === 0 || path.isAbsolute(ref)) {
    return null;
  }
  const resolved = path.resolve(repoRoot, ref);
  const relative = path.relative(repoRoot, resolved);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolved;
  }
  return null;
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readArchiveRelocation({ reportPath, reportDir, report, repoRoot }) {
  const sidecarPath = path.join(reportDir, "report-archive-relocation.json");
  if (!fs.existsSync(sidecarPath)) {
    return {
      present: false,
      sidecar_path: sidecarPath,
      valid: true,
      errors: [],
      archived_actor_workspace_root: null,
      approved_preflight_path: null,
      value: null
    };
  }
  const errors = [];
  let value = null;
  try {
    value = readJson(sidecarPath);
  } catch (error) {
    errors.push(`cannot parse sidecar: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isRecord(value)) {
    errors.push("sidecar must be a JSON object");
  } else {
    const allowedKeys = new Set([
      "schema",
      "created_at",
      "report_ref",
      "report_sha256",
      "original_actor_workspace_root",
      "archived_actor_workspace_root_ref",
      "approved_preflight_ref"
    ]);
    const extraKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
    if (extraKeys.length > 0) {
      errors.push(`unknown sidecar fields: ${extraKeys.join(", ")}`);
    }
    if (value.schema !== "report-archive-relocation/v1") {
      errors.push("schema must be report-archive-relocation/v1");
    }
    if (typeof value.created_at !== "string" || !Number.isFinite(Date.parse(value.created_at))) {
      errors.push("created_at must be an ISO date-time");
    }
  }
  const reportRefPath = isRecord(value)
    ? resolveRepositoryRef(repoRoot, value.report_ref)
    : null;
  const archivedActorWorkspaceRoot = isRecord(value)
    ? resolveRepositoryRef(repoRoot, value.archived_actor_workspace_root_ref)
    : null;
  const approvedPreflightPath = isRecord(value)
    ? resolveRepositoryRef(repoRoot, value.approved_preflight_ref)
    : null;
  if (!repoRoot) {
    errors.push("repository root could not be found");
  }
  if (!reportRefPath || path.resolve(reportRefPath) !== path.resolve(reportPath)) {
    errors.push("report_ref must resolve to the checked report inside the repository");
  }
  if (!archivedActorWorkspaceRoot) {
    errors.push("archived_actor_workspace_root_ref must be a repository-relative path");
  }
  if (!approvedPreflightPath) {
    errors.push("approved_preflight_ref must be a repository-relative path");
  }
  if (isRecord(value) && value.original_actor_workspace_root !== report.actor_workspace_root_dir) {
    errors.push("original_actor_workspace_root must match the raw report");
  }
  if (isRecord(value) &&
    (typeof value.report_sha256 !== "string" || value.report_sha256 !== sha256File(reportPath))) {
    errors.push("report_sha256 does not match the raw report bytes");
  }
  return {
    present: true,
    sidecar_path: sidecarPath,
    valid: errors.length === 0,
    errors,
    archived_actor_workspace_root: archivedActorWorkspaceRoot,
    approved_preflight_path: approvedPreflightPath,
    value
  };
}

function inspectApprovedPreflight(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { path: filePath, valid: false, reason: "missing" };
  }
  try {
    const value = readJson(filePath);
    const valid = value?.schema === "provider-quota-preflight/v1" &&
      value?.final_status === "allowed" &&
      value?.approval?.operator_approved === true;
    return {
      path: filePath,
      valid,
      reason: valid ? "approved" : "preflight is not an operator-approved allowed result"
    };
  } catch (error) {
    return {
      path: filePath,
      valid: false,
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

function allLeakageChecksPassed(publicHistory) {
  const checks = publicHistory?.leakage_checks;
  if (!checks || typeof checks !== "object") {
    return false;
  }
  return Object.values(checks)
    .filter((value) => value && typeof value === "object" && "status" in value)
    .every((value) => value.status === "passed");
}

function buildOutput({ jsonMode, result, checks, summarizer }) {
  return jsonMode
    ? JSON.stringify(result, null, 2)
    : [
      `Report readiness: ${result.final_status}`,
      ...checks.map((check) => {
        const detail = Array.isArray(check.detail) && check.detail.length > 0
          ? ` (${check.detail.length} issue(s))`
          : "";
        return `- ${check.status}: ${check.name}${detail}`;
      }),
      ...(summarizer?.stdout ? ["", "Summarizer output:", summarizer.stdout.trim()] : [])
    ].join("\n");
}

function checkLegibilitySessionReadiness({ artifactPath, artifactDir, session, jsonMode, publishableMode, now }) {
  const rows = Array.isArray(session.transition_rows) ? session.transition_rows : [];
  const publicHistory = readSiblingJson(artifactDir, "public-history.json");
  const declaration = readSiblingJson(artifactDir, "experiment-declaration.json");
  const predictions = readSiblingJson(artifactDir, "predictions.json");
  const scoreReport = readSiblingJson(artifactDir, "score-report.json");
  const missingLabelLocks = rows
    .filter((row) => typeof row?.timestamps?.label_locked_at !== "string")
    .map((row) => row?.row_id ?? "<missing-row-id>");
  const rowsWithPredictedDelta = rows
    .filter((row) => recursivelyHasKey(row, "predicted_delta"))
    .map((row) => row?.row_id ?? "<missing-row-id>");
  const unclosedWindows = rows
    .filter((row) => row?.observed_delta?.social_response?.response_window?.status !== "closed")
    .map((row) => row?.row_id ?? "<missing-row-id>");
  const rowsMissingLayerEvidence = rows
    .filter((row) =>
      !row?.observed_delta?.social_response?.classes
      || !row?.observed_delta?.material?.classes
      || !row?.observed_delta?.physical?.classes
    )
    .map((row) => row?.row_id ?? "<missing-row-id>");
  const actorRoutes = Array.isArray(session.actor_routes) ? session.actor_routes : [];
  const providerBacked = actorRoutes.some((route) => {
    const providerId = route?.provider_id ?? "";
    return providerId
      && !providerId.startsWith("deterministic")
      && providerId !== "scripted-social"
      && providerId !== "builtin-planner";
  });
  const checks = [
    {
      name: "legibility_session_schema",
      status: session.schema === "legibility-session/v1" ? "passed" : "failed",
      detail: session.schema ?? "missing"
    },
    {
      name: "transition_rows_present",
      status: rows.length > 0 ? "passed" : "failed",
      detail: rows.length
    },
    {
      name: "transition_rows_no_predicted_delta",
      status: rowsWithPredictedDelta.length === 0 ? "passed" : "failed",
      detail: rowsWithPredictedDelta
    },
    {
      name: "transition_rows_label_locked",
      status: missingLabelLocks.length === 0 ? "passed" : "failed",
      detail: missingLabelLocks
    },
    {
      name: "transition_rows_layered_observed_delta",
      status: rowsMissingLayerEvidence.length === 0 ? "passed" : "failed",
      detail: rowsMissingLayerEvidence
    },
    {
      name: "response_windows_closed",
      status: unclosedWindows.length === 0 ? "passed" : "failed",
      detail: unclosedWindows
    },
    {
      name: "public_history_exists",
      status: publicHistory.value ? "passed" : "failed",
      detail: path.basename(publicHistory.filePath)
    },
    {
      name: "public_history_leakage_checks_passed",
      status: publicHistory.value
        ? allLeakageChecksPassed(publicHistory.value) ? "passed" : "failed"
        : "failed",
      detail: publicHistory.value?.leakage_checks ?? "missing"
    },
    {
      name: "experiment_declaration_exists",
      status: declaration.value ? "passed" : "failed",
      detail: path.basename(declaration.filePath)
    },
    {
      name: "predictions_exist",
      status: predictions.value ? "passed" : publishableMode ? "failed" : "warning",
      detail: path.basename(predictions.filePath)
    },
    {
      name: "score_report_exists",
      status: scoreReport.value ? "passed" : publishableMode ? "failed" : "warning",
      detail: path.basename(scoreReport.filePath)
    },
    {
      name: "score_report_row_count_matches",
      status: scoreReport.value
        ? scoreReport.value.row_count === rows.length ? "passed" : "failed"
        : "not_applicable",
      detail: scoreReport.value?.row_count ?? "missing"
    },
    {
      name: "score_report_joined_predictions",
      status: scoreReport.value
        ? scoreReport.value.joined_prediction_count > 0 ? "passed" : "warning"
        : "not_applicable",
      detail: scoreReport.value?.joined_prediction_count ?? "missing"
    },
    {
      name: "provider_preflight_present",
      status: providerBacked
        ? Array.isArray(session.preflight_refs) && session.preflight_refs.length > 0
          ? "passed"
          : publishableMode ? "failed" : "warning"
        : "not_applicable",
      detail: session.preflight_refs ?? []
    }
  ];
  const failed = checks.filter((check) => check.status === "failed");
  const warnings = checks.filter((check) => check.status === "warning");
  const result = {
    schema: "minecraft-run-report-readiness/v1",
    report_path: artifactPath,
    generated_at: (now ?? new Date()).toISOString(),
    provider_backed: Boolean(providerBacked),
    publishable_mode: publishableMode,
    checks,
    final_status: failed.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    report_claim_requirements: [
      "state this is a legibility-session bundle, not a live Minecraft proof unless live evidence exists",
      "separate transition-row observed_delta from predictor outputs",
      "mention public-history leakage checks before claiming predictor fairness",
      "report support counts before lift, AUC, or RER claims",
      "state provider-free fixture limitations explicitly"
    ]
  };
  return {
    result,
    outputText: buildOutput({ jsonMode, result, checks, summarizer: null }),
    exitCode: failed.length > 0 ? 1 : 0
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
  const repoRoot = options.repoRoot ?? findRepositoryRoot(reportDir);

  if (report.schema === "legibility-session/v1") {
    return checkLegibilitySessionReadiness({
      artifactPath: reportPath,
      artifactDir: reportDir,
      session: report,
      jsonMode,
      publishableMode,
      now: options.now
    });
  }

  const archiveRelocation = readArchiveRelocation({
    reportPath,
    reportDir,
    report,
    repoRoot
  });
  const originalActorWorkspaceRoot = resolveMaybe(
    reportDir,
    report.actor_workspace_root_dir ?? path.join("..", "data", "actors", "social-runs", report.run_id ?? "")
  );
  const actorWorkspaceRoot = archiveRelocation.present && archiveRelocation.valid
    ? archiveRelocation.archived_actor_workspace_root
    : originalActorWorkspaceRoot;
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
  const researchDeclarationRefs = stringRefs(
    report.no_regret_run_declaration_ref,
    report.no_regret_run_declaration_refs,
    report.experiment_declaration_ref,
    report.experiment_declaration_refs,
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
  const missingResearchDeclarationRefs = researchDeclarationRefs.filter((ref) => !refExistsInScopes(ref, refScopes));

  const providerId = report.provider?.provider_id ?? "";
  const providerBacked = providerId && !providerId.startsWith("deterministic") && providerId !== "builtin-planner";
  const reportPreflightRefs = [
    ...(Array.isArray(report.preflight_refs) ? report.preflight_refs : []),
    ...(Array.isArray(report.provider_preflight_refs) ? report.provider_preflight_refs : []),
    ...(Array.isArray(report.artifact_refs?.preflight) ? report.artifact_refs.preflight : [])
  ];
  const preflightRefs = [
    ...reportPreflightRefs,
    ...(archiveRelocation.present && isRecord(archiveRelocation.value)
      ? [archiveRelocation.value.approved_preflight_ref]
      : [])
  ].filter((ref) => typeof ref === "string" && ref.length > 0);
  const resolvedReportPreflights = reportPreflightRefs.map((ref) => {
    const candidates = [resolveMaybe(reportDir, ref), resolveRepositoryRef(repoRoot, ref)].filter(Boolean);
    return candidates.find((candidate) => existsMaybe(candidate)) ?? candidates[0] ?? null;
  });
  const resolvedPreflightPaths = [
    ...resolvedReportPreflights,
    ...(archiveRelocation.approved_preflight_path
      ? [archiveRelocation.approved_preflight_path]
      : [])
  ];
  const missingPreflightRefs = resolvedPreflightPaths.filter((ref) => !existsMaybe(ref));
  const approvedPreflightInspections = [...new Set(resolvedPreflightPaths)]
    .filter((ref) => existsMaybe(ref))
    .map(inspectApprovedPreflight);
  const hasApprovedPreflight = approvedPreflightInspections.some((inspection) => inspection.valid);
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
      detail: {
        selected: actorWorkspaceRoot,
        source: archiveRelocation.present && archiveRelocation.valid ? "archive_relocation" : "raw_report",
        original: originalActorWorkspaceRoot
      }
    },
    {
      name: "archive_relocation_valid",
      status: archiveRelocation.present
        ? archiveRelocation.valid ? "passed" : "failed"
        : "not_applicable",
      detail: archiveRelocation.present
        ? { sidecar_path: archiveRelocation.sidecar_path, errors: archiveRelocation.errors }
        : "missing"
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
      name: "preflight_refs_exist",
      status: providerBacked
        ? !hasPreflightRef
          ? "not_applicable"
          : missingPreflightRefs.length === 0 ? "passed" : "failed"
        : "not_applicable",
      detail: missingPreflightRefs
    },
    {
      name: "approved_preflight_valid",
      status: providerBacked
        ? hasApprovedPreflight
          ? "passed"
          : publishableMode ? "failed" : "warning"
        : "not_applicable",
      detail: approvedPreflightInspections
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
      name: "research_declaration_refs_exist",
      status: researchDeclarationRefs.length === 0
        ? "not_applicable"
        : missingResearchDeclarationRefs.length === 0 ? "passed" : "failed",
      detail: missingResearchDeclarationRefs
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
      "state whether transition-row-batch-audit/v1 or legibility-session scoring passed the relevant active-plan gate",
      "treat screenshots as review-only evidence",
      "state unsupported research, leaderboard, sociality, and budget claims explicitly"
    ]
  };

  const outputText = buildOutput({ jsonMode, result, checks, summarizer });

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
