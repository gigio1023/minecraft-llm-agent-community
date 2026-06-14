import fs from "node:fs/promises";
import path from "node:path";

import { loadProbeConfig } from "../../config.js";
import type { ProviderUsageCounts } from "../../provider/providerUsageTracker.js";
import type { CycleJudgment, SocialCycleRunReport } from "./types.js";
import { readJsonIfExists } from "./goalJsonStore.js";
import type { ActorTurnResolvedAction } from "./actorEpisode/index.js";

type JsonRecord = Record<string, unknown>;

export type BenchmarkMilestoneId =
  | "log_inventory_observed"
  | "planks_inventory_observed"
  | "sticks_inventory_observed"
  | "crafting_table_item_observed"
  | "crafting_table_block_observed"
  | "wooden_pickaxe_inventory_observed"
  | "cobblestone_inventory_observed"
  | "cobblestone_8_observed"
  | "furnace_item_observed"
  | "furnace_block_observed";

export type BenchmarkCycleMetric = {
  cycle_index: number;
  cycle_id: string;
  action_kind: string;
  action_id: string;
  verifier_status: string;
  judgment_outcome: string;
  runtime_status?: string;
  evidence_count: number;
  visual_capture_count: number;
  visual_failure_count: number;
  cumulative_verified_progress: number;
  cumulative_blocked: number;
  cumulative_no_progress: number;
  observed_inventory_counts: Record<string, number>;
  tool_attempts: Array<{
    tool: string;
    status?: string;
    args: JsonRecord;
    result_summary: JsonRecord;
  }>;
  milestone_observations: Array<{
    milestone_id: BenchmarkMilestoneId;
    evidence_ref: string;
    observation_basis: string;
  }>;
};

export type BenchmarkObservationMetrics = {
  schema: "benchmark-observation-metrics/v1";
  generated_at: string;
  benchmark_id: string;
  scoring_status: "unscored_observations_only";
  score_inputs_note: string;
  report_path: string;
  actor_workspace_dir: string;
  run: {
    run_id: string;
    actor_id: string;
    provider_id: string;
    model: string;
    reasoning: string;
    runtime_status: string;
    total_cycles: number;
  };
  world: {
    mode?: string;
    seed?: string;
    level_type?: string;
    version?: string;
    scenario_id?: string;
    fixture_dependency?: boolean;
    natural_spawn_validation_status?: string;
  };
  provider_usage: {
    records: number;
    requests: number;
    input_tokens: number;
    output_tokens: number;
    thinking_tokens: number;
    total_tokens: number;
    elapsed_ms_total?: number;
    elapsed_ms_avg?: number;
    elapsed_ms_p95?: number;
    quota_checks: Array<{
      quota_policy_id?: string;
      quota_metric?: string;
      request_limit_per_month?: number;
      projected_month_requests?: number;
      status: string;
      reason?: string;
    }>;
  };
  visual_evidence: {
    enabled: boolean;
    camera_mode?: string;
    interval_cycles?: number;
    capture_count: number;
    failure_count: number;
    first_person_capture_count: number;
    third_person_capture_count: number;
    sample_images: Array<{
      cycle_id: string;
      phase: string;
      camera_mode?: string;
      image_path?: string;
      image_ref?: string;
    }>;
  };
  aggregate_metrics: {
    outcome_counts: Record<string, number>;
    verifier_counts: Record<string, number>;
    action_counts: Record<string, number>;
    blocker_histogram: Array<{ key: string; count: number; example?: string }>;
    final_inventory_counts: Record<string, number>;
    cycle_time_series: BenchmarkCycleMetric[];
  };
  target_observations: {
    target_id: string;
    target_description: string;
    target_block?: string;
    target_item?: string;
    observed_target_item_cycle?: number;
    observed_target_block_cycle?: number;
    milestone_first_cycles: Partial<Record<BenchmarkMilestoneId, number>>;
    observation_limitations: string[];
  };
};

type BuildBenchmarkMetricsOptions = {
  benchmarkId: string;
  targetDescription?: string;
  targetBlock?: string;
  targetItem?: string;
  actorWorkspaceRoot?: string;
};

const zeroUsage: ProviderUsageCounts = {
  requests: 0,
  input_tokens: 0,
  output_tokens: 0,
  thinking_tokens: 0,
  total_tokens: 0
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeItemName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/^minecraft:/, "") : "";
}

function resolveActorRefPath(actorDir: string, ref: string) {
  if (ref.trim().length === 0 || path.isAbsolute(ref)) {
    return null;
  }
  const normalized = path.normalize(ref);
  if (normalized === "." || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }
  const filePath = path.resolve(actorDir, normalized);
  const relative = path.relative(actorDir, filePath);
  return relative.startsWith("..") || path.isAbsolute(relative) ? null : filePath;
}

async function readActorRefJson<T>(actorDir: string, ref: string) {
  const resolved = resolveActorRefPath(actorDir, ref);
  return resolved ? readJsonIfExists<T>(resolved) : null;
}

function resolveReportActorDir(
  report: SocialCycleRunReport & JsonRecord,
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

function countBy(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

function usageTotals(report: SocialCycleRunReport): ProviderUsageCounts {
  return (report.provider_usage?.totals ?? [])
    .filter((entry) => entry.provider_id === report.provider.provider_id && entry.model === report.provider.model)
    .reduce<ProviderUsageCounts>(
      (acc, entry) => ({
        requests: acc.requests + entry.usage.requests,
        input_tokens: acc.input_tokens + entry.usage.input_tokens,
        output_tokens: acc.output_tokens + entry.usage.output_tokens,
        thinking_tokens: acc.thinking_tokens + entry.usage.thinking_tokens,
        total_tokens: acc.total_tokens + entry.usage.total_tokens
      }),
      { ...zeroUsage }
    );
}

async function usageLatencyStats(report: SocialCycleRunReport) {
  const ledgerPath = report.provider_usage?.ledger_path;
  if (!ledgerPath) {
    return {};
  }
  let contents = "";
  try {
    contents = await fs.readFile(ledgerPath, "utf8");
  } catch {
    return {};
  }
  const elapsed = contents
    .split(/\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as JsonRecord;
      } catch {
        return null;
      }
    })
    .filter((record): record is JsonRecord => {
      return isRecord(record) &&
        record.run_id === report.run_id &&
        record.provider_id === report.provider.provider_id &&
        record.model === report.provider.model &&
        isFiniteNumber(record.elapsed_ms);
    })
    .map((record) => record.elapsed_ms as number)
    .sort((a, b) => a - b);
  if (elapsed.length === 0) {
    return {};
  }
  const total = elapsed.reduce((sum, value) => sum + value, 0);
  const p95Index = Math.min(elapsed.length - 1, Math.ceil(elapsed.length * 0.95) - 1);
  return {
    elapsed_ms_total: total,
    elapsed_ms_avg: Math.round(total / elapsed.length),
    elapsed_ms_p95: elapsed[p95Index]
  };
}

function compactResultSummary(result: unknown): JsonRecord {
  if (!isRecord(result)) {
    return {};
  }
  const summary: JsonRecord = {};
  for (const key of [
    "status",
    "reason",
    "itemName",
    "block",
    "blockName",
    "beforeCount",
    "afterCount",
    "inventoryDelta",
    "blockRemoved",
    "durationMs",
    "timedOut",
    "cancelled"
  ]) {
    if (result[key] !== undefined) {
      summary[key] = result[key];
    }
  }
  return summary;
}

function extractToolAttempt(artifact: unknown) {
  if (!isRecord(artifact) || !isRecord(artifact.tool_attempt)) {
    return null;
  }
  const toolAttempt = artifact.tool_attempt;
  const tool = typeof toolAttempt.tool === "string" ? toolAttempt.tool : "unknown";
  const args = isRecord(toolAttempt.args) ? toolAttempt.args : {};
  const result = isRecord(toolAttempt.result) ? toolAttempt.result : {};
  return { tool, args, result };
}

function recordInventoryObservation(
  inventory: Record<string, number>,
  tool: string,
  args: JsonRecord,
  result: JsonRecord
) {
  const status = normalizeItemName(result.status);
  const candidateItem =
    normalizeItemName(result.itemName) ||
    normalizeItemName(result.block) ||
    normalizeItemName(args.itemName) ||
    normalizeItemName(args.blockName);
  const afterCount = result.afterCount;
  if (candidateItem && isFiniteNumber(afterCount) && afterCount >= 0) {
    inventory[candidateItem] = afterCount;
    return;
  }
  const delta = result.inventoryDelta;
  if (
    candidateItem &&
    isFiniteNumber(delta) &&
    delta !== 0 &&
    ["crafted", "collected", "mined"].includes(status)
  ) {
    inventory[candidateItem] = Math.max(0, (inventory[candidateItem] ?? 0) + delta);
    return;
  }
  if (tool === "collect_logs" && isFiniteNumber(result.afterLogCount)) {
    const logItem = normalizeItemName(result.block) || "log";
    inventory[logItem] = result.afterLogCount;
  }
}

function observeMilestones(
  evidenceRef: string,
  tool: string,
  args: JsonRecord,
  result: JsonRecord,
  inventory: Record<string, number>
) {
  const observations: BenchmarkCycleMetric["milestone_observations"] = [];
  const status = normalizeItemName(result.status);
  const itemName = normalizeItemName(result.itemName) || normalizeItemName(args.itemName);
  const blockName =
    normalizeItemName(result.block) ||
    normalizeItemName(result.blockName) ||
    normalizeItemName(args.blockName);

  const add = (milestone_id: BenchmarkMilestoneId, observation_basis: string) => {
    observations.push({ milestone_id, evidence_ref: evidenceRef, observation_basis });
  };

  if (tool === "collect_logs" && status === "collected") {
    add("log_inventory_observed", "collect_logs returned collected");
  }
  if ((itemName.endsWith("_planks") || blockName.endsWith("_planks")) && status === "crafted") {
    add("planks_inventory_observed", "craft result produced planks");
  }
  if (itemName === "stick" && status === "crafted") {
    add("sticks_inventory_observed", "craft result produced sticks");
  }
  if (itemName === "crafting_table" && status === "crafted") {
    add("crafting_table_item_observed", "craft result produced crafting_table");
  }
  if ((itemName === "crafting_table" || blockName === "crafting_table") && status === "placed") {
    add("crafting_table_block_observed", "place_block result placed crafting_table");
  }
  if (itemName === "wooden_pickaxe" && status === "crafted") {
    add("wooden_pickaxe_inventory_observed", "craft result produced wooden_pickaxe");
  }
  if (
    (itemName === "cobblestone" || blockName === "cobblestone") &&
    (status === "mined" || status === "collected" || (isFiniteNumber(result.afterCount) && result.afterCount > 0))
  ) {
    add("cobblestone_inventory_observed", "tool result increased or collected cobblestone");
  }
  if ((inventory.cobblestone ?? 0) >= 8) {
    add("cobblestone_8_observed", "observed inventory count reached at least 8 cobblestone");
  }
  if (itemName === "furnace" && status === "crafted") {
    add("furnace_item_observed", "craft result produced furnace");
  }
  if ((itemName === "furnace" || blockName === "furnace") && status === "placed") {
    add("furnace_block_observed", "place_block result placed furnace");
  }

  return observations;
}

function visualCountsForCycle(report: SocialCycleRunReport, cycleId: string) {
  const captures = report.visual_evidence?.captures.filter((capture) => capture.cycle_id === cycleId) ?? [];
  return {
    captured: captures.filter((capture) => capture.status === "captured").length,
    failed: captures.filter((capture) => capture.status === "failed").length
  };
}

export async function buildSocialCycleBenchmarkMetrics(
  reportPath: string,
  options: BuildBenchmarkMetricsOptions
): Promise<BenchmarkObservationMetrics> {
  const report = JSON.parse(await fs.readFile(reportPath, "utf8")) as SocialCycleRunReport & JsonRecord;
  const actorDir = resolveReportActorDir(report, reportPath, options.actorWorkspaceRoot);
  const inventory: Record<string, number> = {};
  const outcomeCounts: Record<string, number> = {};
  const verifierCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};
  const milestoneFirstCycles: Partial<Record<BenchmarkMilestoneId, number>> = {};
  let cumulativeVerified = 0;
  let cumulativeBlocked = 0;
  let cumulativeNoProgress = 0;
  const cycleMetrics: BenchmarkCycleMetric[] = [];

  for (const [index, cycle] of report.cycles.entries()) {
    const action = await readActorRefJson<ActorTurnResolvedAction>(actorDir, cycle.action_ref);
    const judgment = await readActorRefJson<CycleJudgment>(actorDir, cycle.judgment_ref);
    const outcome = judgment?.outcome ?? "missing";
    const actionId =
      action?.kind === "use_primitive"
        ? action.primitive_id ?? "unknown"
        : action?.kind === "use_action_skill"
          ? action.action_skill_id ?? "unknown"
          : action?.kind ?? "missing";
    countBy(outcomeCounts, outcome);
    countBy(verifierCounts, cycle.verifier_status);
    countBy(actionCounts, actionId);
    if (outcome === "verified_progress" || outcome === "partial_verified_progress") {
      cumulativeVerified += 1;
    } else if (outcome === "blocked") {
      cumulativeBlocked += 1;
    } else if (outcome === "no_progress") {
      cumulativeNoProgress += 1;
    }

    const toolAttempts: BenchmarkCycleMetric["tool_attempts"] = [];
    const milestoneObservations: BenchmarkCycleMetric["milestone_observations"] = [];
    for (const evidenceRef of cycle.evidence_refs) {
      const artifact = await readActorRefJson<unknown>(actorDir, evidenceRef);
      const toolAttempt = extractToolAttempt(artifact);
      if (!toolAttempt) {
        continue;
      }
      recordInventoryObservation(inventory, toolAttempt.tool, toolAttempt.args, toolAttempt.result);
      toolAttempts.push({
        tool: toolAttempt.tool,
        status: normalizeItemName(toolAttempt.result.status) || undefined,
        args: toolAttempt.args,
        result_summary: compactResultSummary(toolAttempt.result)
      });
      for (const observation of observeMilestones(
        evidenceRef,
        toolAttempt.tool,
        toolAttempt.args,
        toolAttempt.result,
        inventory
      )) {
        milestoneObservations.push(observation);
        milestoneFirstCycles[observation.milestone_id] ??= index + 1;
      }
    }

    const visual = visualCountsForCycle(report, cycle.cycle_id);
    cycleMetrics.push({
      cycle_index: index + 1,
      cycle_id: cycle.cycle_id,
      action_kind: action?.kind ?? "missing",
      action_id: actionId,
      verifier_status: cycle.verifier_status,
      judgment_outcome: outcome,
      runtime_status: cycle.action_attempts?.at(-1)?.runtime_status,
      evidence_count: cycle.evidence_refs.length,
      visual_capture_count: visual.captured,
      visual_failure_count: visual.failed,
      cumulative_verified_progress: cumulativeVerified,
      cumulative_blocked: cumulativeBlocked,
      cumulative_no_progress: cumulativeNoProgress,
      observed_inventory_counts: { ...inventory },
      tool_attempts: toolAttempts,
      milestone_observations: milestoneObservations
    });
  }

  const finalInventory = isRecord(report.settlement_state?.inventory_counts)
    ? Object.fromEntries(
        Object.entries(report.settlement_state.inventory_counts).filter(([, value]) => isFiniteNumber(value))
      ) as Record<string, number>
    : {};
  for (const [item, count] of Object.entries(finalInventory)) {
    inventory[item] = count;
  }

  const usage = usageTotals(report);
  const latency = await usageLatencyStats(report);
  const captures = report.visual_evidence?.captures ?? [];
  const targetBlock = normalizeItemName(options.targetBlock);
  const targetItem = normalizeItemName(options.targetItem);

  return {
    schema: "benchmark-observation-metrics/v1",
    generated_at: new Date().toISOString(),
    benchmark_id: options.benchmarkId,
    scoring_status: "unscored_observations_only",
    score_inputs_note:
      "This artifact records observable benchmark inputs only. It deliberately does not make the final benchmark pass/fail decision; a later scorer should consume these observations and raw evidence refs.",
    report_path: path.resolve(reportPath),
    actor_workspace_dir: actorDir,
    run: {
      run_id: report.run_id,
      actor_id: report.actor_id,
      provider_id: report.provider.provider_id,
      model: report.provider.model,
      reasoning: report.provider.reasoning,
      runtime_status: report.runtime_status,
      total_cycles: report.cycles.length
    },
    world: {
      mode: report.server?.mode,
      seed: report.server?.seed,
      level_type: report.server?.level_type,
      version: report.server?.version,
      scenario_id: report.server?.world_scenario?.scenario_id,
      fixture_dependency: report.server?.world_scenario?.fixture_dependency,
      natural_spawn_validation_status: report.server?.world_scenario?.natural_spawn_validation_status
    },
    provider_usage: {
      records: report.provider_usage?.records ?? 0,
      ...usage,
      ...latency,
      quota_checks: (report.provider_usage?.budget_status ?? []).map((decision) => ({
        quota_policy_id: decision.budget?.quota_policy_id,
        quota_metric: decision.budget?.quota_metric,
        request_limit_per_month: decision.budget?.request_limit_per_month,
        projected_month_requests: decision.projected?.month.requests,
        status: decision.status,
        reason: decision.reason
      }))
    },
    visual_evidence: {
      enabled: report.visual_evidence?.enabled === true,
      camera_mode: report.visual_evidence?.camera_mode,
      interval_cycles: report.visual_evidence?.interval_cycles,
      capture_count: captures.filter((capture) => capture.status === "captured").length,
      failure_count: captures.filter((capture) => capture.status === "failed").length +
        (report.visual_evidence?.failures.length ?? 0),
      first_person_capture_count: captures.filter((capture) => capture.camera_mode === "first_person").length,
      third_person_capture_count: captures.filter((capture) => capture.camera_mode === "third_person").length,
      sample_images: captures
        .filter((capture) => capture.status === "captured" && capture.image_path)
        .filter((capture, index, all) => index < 4 || index >= all.length - 8)
        .map((capture) => ({
          cycle_id: capture.cycle_id,
          phase: capture.phase,
          camera_mode: capture.camera_mode,
          image_path: capture.image_path,
          image_ref: capture.image_ref
        }))
    },
    aggregate_metrics: {
      outcome_counts: outcomeCounts,
      verifier_counts: verifierCounts,
      action_counts: actionCounts,
      blocker_histogram: (report.settlement_state?.blocker_histogram ?? []).map((entry) => ({
        key: entry.key,
        count: entry.count,
        example: entry.example
      })),
      final_inventory_counts: { ...inventory },
      cycle_time_series: cycleMetrics
    },
    target_observations: {
      target_id: options.benchmarkId,
      target_description: options.targetDescription ?? options.benchmarkId,
      ...(targetBlock ? { target_block: targetBlock } : {}),
      ...(targetItem ? { target_item: targetItem } : {}),
      observed_target_item_cycle: targetItem === "furnace" ? milestoneFirstCycles.furnace_item_observed : undefined,
      observed_target_block_cycle: targetBlock === "furnace" ? milestoneFirstCycles.furnace_block_observed : undefined,
      milestone_first_cycles: milestoneFirstCycles,
      observation_limitations: [
        "Milestones are derived from structured runtime evidence and final settlement_state inventory when available.",
        "This artifact is not a benchmark scorer and does not treat provider prose as proof of success.",
        "Visual evidence is supporting evidence; renderer artifacts and camera framing must be reviewed separately."
      ]
    }
  };
}
