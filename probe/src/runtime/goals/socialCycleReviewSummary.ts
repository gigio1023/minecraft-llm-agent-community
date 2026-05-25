import fs from "node:fs/promises";
import path from "node:path";

import { loadProbeConfig } from "../../config.js";
import type { CycleJudgment, SocialCycleRunReport } from "./types.js";
import { readJsonIfExists } from "./goalJsonStore.js";
import type { ActionIntent } from "./types.js";

export type MovementContractStatus =
  | "valid"
  | "empty_args"
  | "invalid_args"
  | "not_move_to"
  | "missing_intent";

export type CycleReviewRow = {
  cycle_id: string;
  cycle_goal_summary: string;
  action_kind: string;
  primitive_or_skill: string;
  verifier_status: string;
  judgment_outcome: string;
  what_happened: string;
  cites_prior: boolean;
  evidence_count: number;
  world_scan_ref_count: number;
  world_scan_refs: string[];
  world_scan_counts: Record<string, number>;
  movement_contract_status: MovementContractStatus;
};

export type SocialCycleReviewSummary = {
  schema: "social-cycle-review-summary/v1";
  report_path: string;
  actor_id: string;
  run_id: string;
  provider_model: string;
  runtime_status: string;
  total_cycles: number;
  outcome_counts: Record<string, number>;
  verifier_counts: Record<string, number>;
  primitive_counts: Record<string, number>;
  cycles_with_prior_judgment_context: number;
  rows: CycleReviewRow[];
};

type ActorRefResolution =
  | { ok: true; filePath: string }
  | { ok: false; reason: string };

function resolveActorRefPath(actorDir: string, ref: string): ActorRefResolution {
  if (ref.trim().length === 0) {
    return { ok: false, reason: "empty ref" };
  }
  if (path.isAbsolute(ref)) {
    return { ok: false, reason: "absolute refs are not actor-workspace relative" };
  }
  const normalized = path.normalize(ref);
  if (normalized === "." || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return { ok: false, reason: "ref escapes actor workspace" };
  }
  const filePath = path.resolve(actorDir, normalized);
  const relative = path.relative(actorDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false, reason: "ref escapes actor workspace" };
  }
  return { ok: true, filePath };
}

async function readActorRefJson<T>(actorDir: string, ref: string) {
  const resolved = resolveActorRefPath(actorDir, ref);
  if (!resolved.ok) {
    return null;
  }
  return readJsonIfExists<T>(resolved.filePath);
}

async function readJudgment(actorDir: string, ref: string) {
  return readActorRefJson<CycleJudgment>(actorDir, ref);
}

async function readIntent(actorDir: string, ref: string) {
  return readActorRefJson<ActionIntent>(actorDir, ref);
}

async function readCycleGoalSummary(actorDir: string, ref: string) {
  const goal = await readActorRefJson<{ summary?: string }>(actorDir, ref);
  return goal?.summary ?? ref;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasPositionShape(value: unknown) {
  return isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.z);
}

function movementContractStatus(intent: ActionIntent | null): MovementContractStatus {
  if (!intent) {
    return "missing_intent";
  }
  if (intent.kind !== "use_primitive" || intent.primitive_id !== "move_to") {
    return "not_move_to";
  }
  if (!isRecord(intent.args)) {
    return "invalid_args";
  }
  if (Object.keys(intent.args).length === 0) {
    return "empty_args";
  }
  if (
    hasPositionShape(intent.args.position) ||
    hasPositionShape(intent.args.targetPosition) ||
    hasPositionShape(intent.args.target_position) ||
    hasPositionShape(intent.args)
  ) {
    return "valid";
  }

  const direction = typeof intent.args.direction === "string" ? intent.args.direction.toLowerCase() : null;
  if (
    direction &&
    ["north", "south", "east", "west"].includes(direction) &&
    isFiniteNumber(intent.args.distance) &&
    intent.args.distance > 0 &&
    intent.args.distance <= 12
  ) {
    return "valid";
  }

  return "invalid_args";
}

function collectWorldScanCounts(
  value: unknown,
  counts: Record<string, number>,
  depth = 0
): boolean {
  if (depth > 8 || value === null || value === undefined) {
    return false;
  }
  let found = false;
  if (Array.isArray(value)) {
    for (const entry of value) {
      found = collectWorldScanCounts(entry, counts, depth + 1) || found;
    }
    return found;
  }
  if (!isRecord(value)) {
    return false;
  }

  // Keep review summaries aligned with the audit: a scan ref means an explicit
  // world-state schema was present, not just a nearby-block hint in any JSON.
  if (value.schema === "world-state-summary/v1" || value.schema === "world-state-scan/v1") {
    const schemaLabel = value.schema === "world-state-summary/v1"
      ? "world_state_summary"
      : "world_state_scan";
    counts[schemaLabel] = (counts[schemaLabel] ?? 0) + 1;
    const blockObservations = isRecord(value.block_observations)
      ? value.block_observations
      : undefined;
    if (blockObservations) {
      counts.block_observations = (counts.block_observations ?? 0) + 1;
      counts.block_name_counts =
        (counts.block_name_counts ?? 0) +
        (Array.isArray(blockObservations.by_name) ? blockObservations.by_name.length : 0);
      counts.nearest_examples =
        (counts.nearest_examples ?? 0) +
        (Array.isArray(blockObservations.nearest) ? blockObservations.nearest.length : 0);
      if (isFiniteNumber(blockObservations.total_verified)) {
        counts.verified_blocks = (counts.verified_blocks ?? 0) + blockObservations.total_verified;
      }
      if (blockObservations.truncated === true) {
        counts.truncated_block_observations = (counts.truncated_block_observations ?? 0) + 1;
      }
    }

    const loadedCoverage = isRecord(value.loaded_coverage) ? value.loaded_coverage : undefined;
    if (loadedCoverage) {
      counts.loaded_coverage = (counts.loaded_coverage ?? 0) + 1;
      if (
        loadedCoverage.absence_claims_exhaustive !== true ||
        loadedCoverage.exhaustive === false ||
        loadedCoverage.scope === "sampled_columns_only"
      ) {
        counts.non_exhaustive_coverage = (counts.non_exhaustive_coverage ?? 0) + 1;
      }
    }

    if (
      isRecord(value.center) &&
      isFiniteNumber(value.radius) &&
      isRecord(value.vertical_range) &&
      Boolean(loadedCoverage)
    ) {
      counts.scan_metadata = (counts.scan_metadata ?? 0) + 1;
    } else {
      counts.missing_scan_metadata = (counts.missing_scan_metadata ?? 0) + 1;
    }
    found = true;
  }

  for (const entry of Object.values(value)) {
    found = collectWorldScanCounts(entry, counts, depth + 1) || found;
  }
  return found;
}

async function summarizeWorldScanRefs(actorDir: string, refs: readonly string[]) {
  const worldScanRefs: string[] = [];
  const worldScanCounts: Record<string, number> = {};

  for (const ref of [...new Set(refs)]) {
    const artifact = await readActorRefJson<unknown>(actorDir, ref);
    if (!artifact) {
      continue;
    }
    const artifactCounts: Record<string, number> = {};
    if (!collectWorldScanCounts(artifact, artifactCounts)) {
      continue;
    }
    worldScanRefs.push(ref);
    for (const [key, count] of Object.entries(artifactCounts)) {
      worldScanCounts[key] = (worldScanCounts[key] ?? 0) + count;
    }
  }

  return { worldScanRefs, worldScanCounts };
}

function resolveReportActorDir(
  report: SocialCycleRunReport & Record<string, unknown>,
  reportPath: string,
  actorWorkspaceRoot?: string
) {
  if (actorWorkspaceRoot) {
    return actorWorkspaceRoot;
  }
  const reportDir = path.dirname(reportPath);
  const rootDir =
    typeof report.actor_workspace_root_dir === "string"
      ? report.actor_workspace_root_dir
      : undefined;
  if (rootDir) {
    const resolvedRoot = path.isAbsolute(rootDir)
      ? path.resolve(rootDir)
      : path.resolve(reportDir, rootDir);
    return path.join(resolvedRoot, report.actor_id);
  }
  return path.join(loadProbeConfig().actorWorkspace.rootDir, report.actor_id);
}

export async function buildSocialCycleReviewSummary(
  reportPath: string,
  actorWorkspaceRoot?: string
): Promise<SocialCycleReviewSummary> {
  const report = JSON.parse(await fs.readFile(reportPath, "utf8")) as SocialCycleRunReport & Record<string, unknown>;
  const actorDir = resolveReportActorDir(report, reportPath, actorWorkspaceRoot);

  const outcome_counts: Record<string, number> = {};
  const verifier_counts: Record<string, number> = {};
  const primitive_counts: Record<string, number> = {};
  let cycles_with_prior_judgment_context = 0;

  const rows: CycleReviewRow[] = [];

  for (const cycle of report.cycles) {
    const judgment = await readJudgment(actorDir, cycle.judgment_ref);
    const intent = await readIntent(actorDir, cycle.action_intent_ref);
    const cycleGoalSummary = await readCycleGoalSummary(actorDir, cycle.cycle_goal_ref);

    const outcome = judgment?.outcome ?? "missing";
    const verifier = cycle.verifier_status;
    outcome_counts[outcome] = (outcome_counts[outcome] ?? 0) + 1;
    verifier_counts[verifier] = (verifier_counts[verifier] ?? 0) + 1;

    const primitiveOrSkill =
      intent?.kind === "use_primitive"
        ? (intent.primitive_id ?? "?")
        : intent?.kind === "use_action_skill"
          ? (intent.action_skill_id ?? "?")
          : (intent?.kind ?? "?");
    primitive_counts[primitiveOrSkill] = (primitive_counts[primitiveOrSkill] ?? 0) + 1;

    const cycleGoalProviderInput = await readActorRefJson<{
      input?: { previous_cycle_judgments?: unknown[] };
    }>(actorDir, cycle.provider_input_refs[0] ?? "");
    const citesPrior = (cycleGoalProviderInput?.input?.previous_cycle_judgments?.length ?? 0) > 0;
    if (citesPrior) {
      cycles_with_prior_judgment_context += 1;
    }

    const scanSummary = await summarizeWorldScanRefs(actorDir, cycle.evidence_refs);

    rows.push({
      cycle_id: cycle.cycle_id,
      cycle_goal_summary: cycleGoalSummary,
      action_kind: intent?.kind ?? "missing",
      primitive_or_skill: primitiveOrSkill,
      verifier_status: verifier,
      judgment_outcome: outcome,
      what_happened: judgment?.what_happened ?? "",
      cites_prior: citesPrior,
      evidence_count: cycle.evidence_refs.length,
      world_scan_ref_count: scanSummary.worldScanRefs.length,
      world_scan_refs: scanSummary.worldScanRefs,
      world_scan_counts: scanSummary.worldScanCounts,
      movement_contract_status: movementContractStatus(intent)
    });
  }

  return {
    schema: "social-cycle-review-summary/v1",
    report_path: reportPath,
    actor_id: report.actor_id,
    run_id: report.run_id,
    provider_model: report.provider.model,
    runtime_status: report.runtime_status,
    total_cycles: report.cycles.length,
    outcome_counts,
    verifier_counts,
    primitive_counts,
    cycles_with_prior_judgment_context,
    rows
  };
}

export function formatReviewSummaryMarkdown(summary: SocialCycleReviewSummary): string {
  const lines: string[] = [
    `# Social cycle review — ${summary.actor_id}`,
    "",
    `- run_id: \`${summary.run_id}\``,
    `- model: \`${summary.provider_model}\``,
    `- runtime_status: **${summary.runtime_status}**`,
    `- cycles in report: **${summary.total_cycles}**`,
    `- cycles citing prior judgment in CycleGoal provider: **${summary.cycles_with_prior_judgment_context}**`,
    "",
    "## Outcome distribution",
    "",
    ...Object.entries(summary.outcome_counts).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Primitive / skill usage",
    "",
    ...Object.entries(summary.primitive_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Cycle timeline",
    "",
    "| cycle | outcome | verifier | action | scan refs | move contract | CycleGoal (short) | cites prior |",
    "|-------|---------|----------|--------|-----------|---------------|-------------------|-------------|"
  ];

  for (const row of summary.rows) {
    const goal = row.cycle_goal_summary.replace(/\|/g, "/").slice(0, 60);
    const action = `${row.action_kind}:${row.primitive_or_skill}`;
    const scanCounts = Object.entries(row.world_scan_counts)
      .map(([key, count]) => `${key}:${count}`)
      .join(", ");
    const scanCell = row.world_scan_ref_count > 0
      ? `${row.world_scan_ref_count}${scanCounts ? ` (${scanCounts})` : ""}`
      : "0";
    lines.push(
      `| ${row.cycle_id} | ${row.judgment_outcome} | ${row.verifier_status} | ${action} | ${scanCell} | ${row.movement_contract_status} | ${goal} | ${row.cites_prior ? "yes" : "no"} |`
    );
  }

  const rowsWithScanRefs = summary.rows.filter((row) => row.world_scan_refs.length > 0);
  if (rowsWithScanRefs.length > 0) {
    lines.push("", "## World Scan Evidence", "");
    for (const row of rowsWithScanRefs) {
      const scanCounts = Object.entries(row.world_scan_counts)
        .map(([key, count]) => `${key}:${count}`)
        .join(", ");
      lines.push(
        `- ${row.cycle_id}: ${row.world_scan_refs.join(", ")}${scanCounts ? ` (${scanCounts})` : ""}`
      );
    }
  }

  lines.push("", "## Last 5 judgments (detail)", "");
  for (const row of summary.rows.slice(-5)) {
    lines.push(`### ${row.cycle_id}`, "", row.what_happened, "");
  }

  return lines.join("\n");
}
