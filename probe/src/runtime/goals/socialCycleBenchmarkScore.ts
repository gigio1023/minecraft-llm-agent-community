import type {
  BenchmarkMilestoneId,
  BenchmarkObservationMetrics
} from "./socialCycleBenchmarkMetrics.js";

export type BenchmarkMilestoneScoringRule = {
  milestone_id: BenchmarkMilestoneId;
  label: string;
  weight: number;
  expected_order: number;
  scoring_method: "binary_observation";
  evidence_rule: string;
  icon_src: string;
  icon_alt: string;
};

export type BenchmarkScoredRun = {
  run_id: string;
  model: string;
  short_model_name: string;
  target_reached: boolean;
  progress_score_100: number;
  achieved_weight: number;
  total_weight: number;
  achieved_milestones: Array<BenchmarkMilestoneScoringRule & { first_cycle: number }>;
  missing_milestones: BenchmarkMilestoneScoringRule[];
  best_milestone?: BenchmarkMilestoneScoringRule & { first_cycle: number };
  best_cycle?: number;
  cycles_completed: number;
  total_tool_attempts: number;
  first_milestone_cycles: number;
  provider_usage: {
    requests: number;
    total_tokens: number;
    elapsed_ms_total?: number;
    elapsed_ms_avg?: number;
    elapsed_ms_p95?: number;
  };
  estimated_to_best_milestone?: {
    estimation_method: "proportional_by_cycle_from_run_totals";
    cycle_ratio: number;
    requests: number;
    total_tokens: number;
    elapsed_ms_total?: number;
  };
  efficiency: {
    milestones_per_1m_tokens?: number;
    score_per_1m_tokens?: number;
    score_per_request?: number;
    score_per_tool_attempt?: number;
  };
  post_best_milestone: {
    cycles_after_best: number;
    outcome_counts: Record<string, number>;
    action_counts: Record<string, number>;
  };
  progress_curve: Array<{
    cycle_index: number;
    progress_score_100: number;
  }>;
};

export type BenchmarkScoreBundle = {
  schema: "benchmark-score-bundle/v1";
  generated_at: string;
  benchmark_id: string;
  target_description: string;
  scoring_plan: BenchmarkMilestoneScoringRule[];
  scored_runs: BenchmarkScoredRun[];
  benchmark_readiness: {
    current_run_count: number;
    model_ranking_ready: boolean;
    summary: string;
    next_internal_step: string;
    external_dataset_assessment: string;
  };
  limitations: string[];
};

export const FURNACE_BLOCK_SCORING_PLAN: BenchmarkMilestoneScoringRule[] = [
  {
    milestone_id: "log_inventory_observed",
    label: "Log acquired",
    weight: 8,
    expected_order: 1,
    scoring_method: "binary_observation",
    evidence_rule: "1 if collect_logs evidence returned status=collected at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/oak_log.png",
    icon_alt: "log"
  },
  {
    milestone_id: "planks_inventory_observed",
    label: "Planks crafted",
    weight: 8,
    expected_order: 2,
    scoring_method: "binary_observation",
    evidence_rule: "1 if craft evidence produced an item or block ending in _planks at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/oak_planks.png",
    icon_alt: "planks"
  },
  {
    milestone_id: "crafting_table_item_observed",
    label: "Crafting table item crafted",
    weight: 8,
    expected_order: 3,
    scoring_method: "binary_observation",
    evidence_rule: "1 if craft evidence produced crafting_table at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/crafting_table_top.png",
    icon_alt: "crafting table item"
  },
  {
    milestone_id: "crafting_table_block_observed",
    label: "Crafting table placed",
    weight: 8,
    expected_order: 4,
    scoring_method: "binary_observation",
    evidence_rule: "1 if place_block evidence placed crafting_table at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/crafting_table_top.png",
    icon_alt: "placed crafting table"
  },
  {
    milestone_id: "sticks_inventory_observed",
    label: "Sticks crafted",
    weight: 8,
    expected_order: 5,
    scoring_method: "binary_observation",
    evidence_rule: "1 if craft evidence produced stick at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/items/stick.png",
    icon_alt: "stick"
  },
  {
    milestone_id: "wooden_pickaxe_inventory_observed",
    label: "Wooden pickaxe crafted",
    weight: 14,
    expected_order: 6,
    scoring_method: "binary_observation",
    evidence_rule: "1 if craft evidence produced wooden_pickaxe at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/items/wooden_pickaxe.png",
    icon_alt: "wooden pickaxe"
  },
  {
    milestone_id: "cobblestone_inventory_observed",
    label: "Cobblestone acquired",
    weight: 10,
    expected_order: 7,
    scoring_method: "binary_observation",
    evidence_rule: "1 if mining or collection evidence observed cobblestone inventory at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/cobblestone.png",
    icon_alt: "cobblestone"
  },
  {
    milestone_id: "cobblestone_8_observed",
    label: "Eight cobblestone acquired",
    weight: 14,
    expected_order: 8,
    scoring_method: "binary_observation",
    evidence_rule: "1 if observed inventory count reached at least 8 cobblestone at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/cobblestone.png",
    icon_alt: "eight cobblestone"
  },
  {
    milestone_id: "furnace_item_observed",
    label: "Furnace item crafted",
    weight: 10,
    expected_order: 9,
    scoring_method: "binary_observation",
    evidence_rule: "1 if craft evidence produced furnace at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/furnace_front.png",
    icon_alt: "furnace item"
  },
  {
    milestone_id: "furnace_block_observed",
    label: "Furnace placed",
    weight: 12,
    expected_order: 10,
    scoring_method: "binary_observation",
    evidence_rule: "1 if place_block evidence placed furnace at least once; otherwise 0.",
    icon_src: "../../../../probe/node_modules/prismarine-viewer/public/textures/1.21.4/blocks/furnace_front.png",
    icon_alt: "placed furnace"
  }
];

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shortModelName(model: string) {
  return model.replace("Qwen-Ambassador/", "").replace("Qwen", "Qwen ");
}

function round(value: number, digits = 2) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function countBy(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

function scoreCurve(
  metric: BenchmarkObservationMetrics,
  scoringPlan: BenchmarkMilestoneScoringRule[],
  totalWeight: number
) {
  return metric.aggregate_metrics.cycle_time_series.map((cycle) => {
    const weight = scoringPlan.reduce((sum, rule) => {
      const firstCycle = metric.target_observations.milestone_first_cycles[rule.milestone_id];
      return firstCycle && firstCycle <= cycle.cycle_index ? sum + rule.weight : sum;
    }, 0);
    return {
      cycle_index: cycle.cycle_index,
      progress_score_100: round((weight / totalWeight) * 100, 1)
    };
  });
}

function scoreRun(
  metric: BenchmarkObservationMetrics,
  scoringPlan: BenchmarkMilestoneScoringRule[]
): BenchmarkScoredRun {
  const totalWeight = scoringPlan.reduce((sum, rule) => sum + rule.weight, 0);
  const achievedMilestones = scoringPlan.flatMap((rule) => {
    const firstCycle = metric.target_observations.milestone_first_cycles[rule.milestone_id];
    return firstCycle ? [{ ...rule, first_cycle: firstCycle }] : [];
  });
  const missingMilestones = scoringPlan.filter((rule) => {
    return !metric.target_observations.milestone_first_cycles[rule.milestone_id];
  });
  const achievedWeight = achievedMilestones.reduce((sum, milestone) => sum + milestone.weight, 0);
  const bestMilestone = achievedMilestones.at(-1);
  const bestCycle = bestMilestone?.first_cycle;
  const cyclesCompleted = metric.run.total_cycles;
  const totalToolAttempts = metric.aggregate_metrics.cycle_time_series.reduce(
    (sum, cycle) => sum + cycle.tool_attempts.length,
    0
  );
  const firstMilestoneCycles = new Set(achievedMilestones.map((milestone) => milestone.first_cycle)).size;
  const totalTokens = metric.provider_usage.total_tokens;
  const requests = metric.provider_usage.requests;
  const progressScore = round((achievedWeight / totalWeight) * 100, 1);
  const postBestOutcomeCounts: Record<string, number> = {};
  const postBestActionCounts: Record<string, number> = {};
  const cyclesAfterBest = bestCycle
    ? metric.aggregate_metrics.cycle_time_series.filter((cycle) => cycle.cycle_index > bestCycle)
    : metric.aggregate_metrics.cycle_time_series;
  for (const cycle of cyclesAfterBest) {
    countBy(postBestOutcomeCounts, cycle.judgment_outcome);
    countBy(postBestActionCounts, cycle.action_id);
  }

  let estimatedToBest: BenchmarkScoredRun["estimated_to_best_milestone"];
  if (bestCycle && cyclesCompleted > 0) {
    const ratio = bestCycle / cyclesCompleted;
    estimatedToBest = {
      estimation_method: "proportional_by_cycle_from_run_totals",
      cycle_ratio: round(ratio, 4),
      requests: Math.ceil(requests * ratio),
      total_tokens: Math.ceil(totalTokens * ratio),
      elapsed_ms_total: metric.provider_usage.elapsed_ms_total
        ? Math.ceil(metric.provider_usage.elapsed_ms_total * ratio)
        : undefined
    };
  }

  return {
    run_id: metric.run.run_id,
    model: metric.run.model,
    short_model_name: shortModelName(metric.run.model),
    target_reached: Boolean(metric.target_observations.milestone_first_cycles.furnace_block_observed),
    progress_score_100: progressScore,
    achieved_weight: achievedWeight,
    total_weight: totalWeight,
    achieved_milestones: achievedMilestones,
    missing_milestones: missingMilestones,
    best_milestone: bestMilestone,
    best_cycle: bestCycle,
    cycles_completed: cyclesCompleted,
    total_tool_attempts: totalToolAttempts,
    first_milestone_cycles: firstMilestoneCycles,
    provider_usage: {
      requests,
      total_tokens: totalTokens,
      elapsed_ms_total: metric.provider_usage.elapsed_ms_total,
      elapsed_ms_avg: metric.provider_usage.elapsed_ms_avg,
      elapsed_ms_p95: metric.provider_usage.elapsed_ms_p95
    },
    estimated_to_best_milestone: estimatedToBest,
    efficiency: {
      milestones_per_1m_tokens: totalTokens > 0 ? round((achievedMilestones.length / totalTokens) * 1_000_000, 3) : undefined,
      score_per_1m_tokens: totalTokens > 0 ? round((progressScore / totalTokens) * 1_000_000, 3) : undefined,
      score_per_request: requests > 0 ? round(progressScore / requests, 3) : undefined,
      score_per_tool_attempt: totalToolAttempts > 0 ? round(progressScore / totalToolAttempts, 3) : undefined
    },
    post_best_milestone: {
      cycles_after_best: cyclesAfterBest.length,
      outcome_counts: postBestOutcomeCounts,
      action_counts: postBestActionCounts
    },
    progress_curve: scoreCurve(metric, scoringPlan, totalWeight)
  };
}

export function scoreBenchmarkMetrics(
  metrics: BenchmarkObservationMetrics[],
  scoringPlan = FURNACE_BLOCK_SCORING_PLAN
): BenchmarkScoreBundle {
  const scoredRuns = metrics.map((metric) => scoreRun(metric, scoringPlan));
  return {
    schema: "benchmark-score-bundle/v1",
    generated_at: new Date().toISOString(),
    benchmark_id: metrics[0]?.benchmark_id ?? "unknown-benchmark",
    target_description:
      metrics[0]?.target_observations.target_description ??
      "Reach and place a furnace in a natural Minecraft world.",
    scoring_plan: scoringPlan,
    scored_runs: scoredRuns,
    benchmark_readiness: {
      current_run_count: scoredRuns.length,
      model_ranking_ready: scoredRuns.length >= 12,
      summary:
        scoredRuns.length >= 12
          ? "The run count is large enough for preliminary model ranking if task, seed, and provider limits are controlled."
          : "This is enough to inspect instrumentation and task bottlenecks, but not enough to rank models generally.",
      next_internal_step:
        "Run the same scored task across multiple natural seeds and repeated trials per model before treating the score as a benchmark table.",
      external_dataset_assessment:
        "External Minecraft benchmarks are useful now for task taxonomy and milestone design, but this repo should first stabilize internal Mineflayer-runtime scoring because visual/key-mouse datasets do not directly score this action-skill runtime."
    },
    limitations: [
      "The scorer uses observed evidence artifacts and milestone first cycles; it does not infer hidden progress from provider prose.",
      "Provider requests, tokens, and elapsed time are available at run level, so cost-to-best-milestone is a proportional estimate by cycle rather than exact per-cycle billing.",
      "The current bundle has one run per model on one seed and one objective, so it should not be used as a broad model-ranking claim.",
      "The score deliberately ignores tool schema and structured-argument compliance because those are provider/runtime contract assumptions, not benchmark targets for this project."
    ]
  };
}

function formatNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "n/a";
}

function entriesTable(entries: Record<string, number>, empty = "None") {
  const sorted = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return `<span class="muted">${escapeHtml(empty)}</span>`;
  }
  return sorted.map(([key, count]) => `${escapeHtml(key)} ${escapeHtml(count)}`).join("<br>");
}

function metricCard(label: string, value: unknown, sub = "") {
  return `<section class="metric"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div><div class="sub">${escapeHtml(sub)}</div></section>`;
}

function formatTokenTick(value: number) {
  if (value === 0) {
    return "0";
  }
  return `${round(value / 1_000_000, 1)}M`;
}

function ceilToStep(value: number, step: number) {
  return Math.max(step, Math.ceil(value / step) * step);
}

function axisModelLabel(shortModelNameValue: string) {
  if (shortModelNameValue.includes("Max")) {
    return "Max";
  }
  if (shortModelNameValue.includes("Plus")) {
    return "Plus";
  }
  return shortModelNameValue
    .replace(/^Qwen\s+/i, "")
    .replace(/^GPT\s+/i, "GPT ")
    .split(/[ /-]/)
    .filter(Boolean)
    .slice(-2)
    .join(" ");
}

function progressChart(scoredRuns: BenchmarkScoredRun[], scoringPlan: BenchmarkMilestoneScoringRule[]) {
  const width = 1160;
  const height = 430;
  const padLeft = 296;
  const padRight = 42;
  const padTop = 34;
  const padBottom = 48;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const colors = ["#126b4f", "#9f3a38", "#2f5f98", "#7a4f01"];
  const maxCycle = Math.max(1, ...scoredRuns.flatMap((run) => run.progress_curve.map((point) => point.cycle_index)));
  const x = (cycle: number) => padLeft + (cycle / maxCycle) * innerW;
  const y = (score: number) => padTop + innerH - (score / 100) * innerH;
  const lines = scoredRuns.map((run, index) => {
    const points = run.progress_curve.map((point) => `${x(point.cycle_index).toFixed(1)},${y(point.progress_score_100).toFixed(1)}`).join(" ");
    const color = colors[index % colors.length];
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="4"/>`;
  }).join("");
  const eventMarkers = scoredRuns.map((run, index) => {
    const color = colors[index % colors.length];
    return run.achieved_milestones.map((milestone) => {
      const score = run.progress_curve.find((point) => point.cycle_index === milestone.first_cycle)?.progress_score_100 ?? 0;
      return `<circle cx="${x(milestone.first_cycle).toFixed(1)}" cy="${y(score).toFixed(1)}" r="4.5" fill="#fff" stroke="${color}" stroke-width="3">
        <title>${escapeHtml(`${run.short_model_name}: ${milestone.label}, cycle ${milestone.first_cycle}, score ${score}`)}</title>
      </circle>`;
    }).join("");
  }).join("");
  let cumulativeScore = 0;
  const axisMilestones = scoringPlan.map((milestone) => {
    cumulativeScore += milestone.weight;
    const markerY = y(cumulativeScore);
    const modelResults = scoredRuns.map((run, index) => {
      const color = colors[index % colors.length];
      const achieved = run.achieved_milestones.find((item) => item.milestone_id === milestone.milestone_id);
      const label = `${axisModelLabel(run.short_model_name)} ${achieved ? `C${achieved.first_cycle}` : "-"}`;
      const textX = padLeft - 98 + index * 52;
      return `<g>
        <rect x="${textX - 3}" y="${(markerY - 8).toFixed(1)}" width="48" height="16" rx="3" fill="${achieved ? "#ffffff" : "#f3f4f6"}" stroke="${achieved ? color : "#c7c7c7"}"/>
        <text x="${textX + 21}" y="${(markerY + 4).toFixed(1)}" font-size="9.5" fill="${achieved ? color : "#6b7280"}" text-anchor="middle">${escapeHtml(label)}</text>
      </g>`;
    }).join("");
    return `<g>
      <line x1="${padLeft}" y1="${markerY.toFixed(1)}" x2="${width - padRight}" y2="${markerY.toFixed(1)}" stroke="#e3e0d8" stroke-dasharray="4 5"/>
      <line x1="${padLeft - 10}" y1="${markerY.toFixed(1)}" x2="${padLeft}" y2="${markerY.toFixed(1)}" stroke="#9ca3af"/>
      <text x="${padLeft - 278}" y="${(markerY + 4).toFixed(1)}" font-size="11" fill="#4b5563" text-anchor="start">${escapeHtml(cumulativeScore)}</text>
      <image href="${escapeHtml(milestone.icon_src)}" x="${padLeft - 250}" y="${(markerY - 11).toFixed(1)}" width="22" height="22" style="image-rendering: pixelated"/>
      <text x="${padLeft - 220}" y="${(markerY + 4).toFixed(1)}" font-size="10.5" fill="#4b5563">${escapeHtml(milestone.label)}</text>
      ${modelResults}
      <title>${escapeHtml(`${cumulativeScore} pts: ${milestone.label} (+${milestone.weight})`)}</title>
    </g>`;
  }).join("");
  const labels = scoredRuns.map((run, index) => {
    const color = colors[index % colors.length];
    return `<span><i style="background:${color}"></i>${escapeHtml(run.short_model_name)}</span>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="goal progress score by cycle">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fff"/>
    <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#9ca3af" stroke-width="1.5"/>
    <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#d8d6ce"/>
    <text x="${padLeft - 278}" y="20" font-size="12" fill="#6b7280">score / milestone / result</text>
    <text x="${width - 82}" y="${height - 12}" font-size="12" fill="#6b7280">cycle</text>
    <text x="${padLeft - 18}" y="${y(0) + 4}" font-size="11" fill="#6b7280" text-anchor="end">0</text>
    ${axisMilestones}
    ${lines}
    ${eventMarkers}
  </svg><div class="legend">${labels}<span><i class="icon-dot"></i>milestone gridline</span><span><i class="event-dot"></i>first observed milestone</span></div>`;
}

function scatterChart(scoredRuns: BenchmarkScoredRun[]) {
  const width = 980;
  const height = 360;
  const padLeft = 70;
  const padRight = 48;
  const padTop = 30;
  const padBottom = 58;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const maxTokens = Math.max(1, ...scoredRuns.map((run) => run.provider_usage.total_tokens));
  const xMax = ceilToStep(maxTokens, 500_000);
  const x = (tokens: number) => padLeft + (tokens / xMax) * innerW;
  const y = (score: number) => padTop + innerH - (score / 100) * innerH;
  const colors = ["#126b4f", "#9f3a38", "#2f5f98", "#7a4f01"];
  const xTicks = Array.from({ length: Math.floor(xMax / 500_000) + 1 }, (_, index) => index * 500_000)
    .filter((tick, index, ticks) => ticks.length <= 8 || index % 2 === 0 || index === ticks.length - 1);
  const yTicks = [0, 20, 40, 60, 80, 100];
  const grid = [
    ...xTicks.map((tick) => `<g>
      <line x1="${x(tick).toFixed(1)}" y1="${padTop}" x2="${x(tick).toFixed(1)}" y2="${height - padBottom}" stroke="#ecebe6"/>
      <text x="${x(tick).toFixed(1)}" y="${height - 24}" font-size="11" fill="#6b7280" text-anchor="middle">${escapeHtml(formatTokenTick(tick))}</text>
    </g>`),
    ...yTicks.map((tick) => `<g>
      <line x1="${padLeft}" y1="${y(tick).toFixed(1)}" x2="${width - padRight}" y2="${y(tick).toFixed(1)}" stroke="#ecebe6"/>
      <text x="${padLeft - 12}" y="${(y(tick) + 4).toFixed(1)}" font-size="11" fill="#6b7280" text-anchor="end">${escapeHtml(tick)}</text>
    </g>`)
  ].join("");
  const points = scoredRuns.map((run, index) => {
    const color = colors[index % colors.length];
    return `<g>
      <circle cx="${x(run.provider_usage.total_tokens).toFixed(1)}" cy="${y(run.progress_score_100).toFixed(1)}" r="7" fill="${color}"/>
      <text x="${x(run.provider_usage.total_tokens) + 12}" y="${y(run.progress_score_100) + 4}" font-size="12" fill="#1f2937">${escapeHtml(run.short_model_name)}</text>
      <title>${escapeHtml(`${run.short_model_name}: ${run.progress_score_100}/100 at ${formatNumber(run.provider_usage.total_tokens)} tokens`)}</title>
    </g>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="progress score by total tokens">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fff"/>
    ${grid}
    <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#9ca3af" stroke-width="1.5"/>
    <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#9ca3af" stroke-width="1.5"/>
    <text x="12" y="20" font-size="12" fill="#6b7280">score</text>
    <text x="${width - 134}" y="${height - 10}" font-size="12" fill="#6b7280">total tokens</text>
    ${points}
  </svg>`;
}

function ladder(bundle: BenchmarkScoreBundle) {
  const runs = bundle.scored_runs;
  return `<table><thead><tr><th>Milestone</th><th>Rule</th><th>Weight</th>${runs.map((run) => `<th>${escapeHtml(run.short_model_name)}</th>`).join("")}</tr></thead><tbody>
    ${bundle.scoring_plan.map((rule) => `<tr>
      <td><span class="item-label"><img src="${escapeHtml(rule.icon_src)}" alt="${escapeHtml(rule.icon_alt)}">${escapeHtml(rule.expected_order)}. ${escapeHtml(rule.label)}</span></td>
      <td><code>observed ? ${escapeHtml(rule.weight)} : 0</code><br><span class="muted">${escapeHtml(rule.evidence_rule)}</span></td>
      <td>${escapeHtml(rule.weight)}</td>
      ${runs.map((run) => {
        const achieved = run.achieved_milestones.find((milestone) => milestone.milestone_id === rule.milestone_id);
        return `<td>${achieved ? `<span class="ok">1 x ${escapeHtml(rule.weight)} = ${escapeHtml(rule.weight)}<br>cycle ${escapeHtml(achieved.first_cycle)}</span>` : `<span class="missing">0 x ${escapeHtml(rule.weight)} = 0</span>`}</td>`;
      }).join("")}
    </tr>`).join("")}
  </tbody></table>`;
}

function iconMatrix(bundle: BenchmarkScoreBundle) {
  return `<div class="milestone-matrix">${bundle.scored_runs.map((run) => `<section class="run-strip">
    <h3>${escapeHtml(run.short_model_name)} · ${escapeHtml(run.progress_score_100)}/100</h3>
    <div class="icons-row">
      ${bundle.scoring_plan.map((rule) => {
        const achieved = run.achieved_milestones.find((milestone) => milestone.milestone_id === rule.milestone_id);
        return `<div class="milestone-icon ${achieved ? "achieved" : "missed"}">
          <img src="${escapeHtml(rule.icon_src)}" alt="${escapeHtml(rule.icon_alt)}">
          <div class="milestone-name">${escapeHtml(rule.label)}</div>
          <div class="points">${achieved ? `+${escapeHtml(rule.weight)}` : "0"}</div>
          <div class="cycle">${achieved ? `C${escapeHtml(achieved.first_cycle)}` : "miss"}</div>
        </div>`;
      }).join("")}
    </div>
  </section>`).join("")}</div>`;
}

export function formatBenchmarkScoreHtml(bundle: BenchmarkScoreBundle) {
  const best = [...bundle.scored_runs].sort((a, b) => b.progress_score_100 - a.progress_score_100)[0];
  const targetReached = bundle.scored_runs.filter((run) => run.target_reached).length;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(bundle.benchmark_id)} scored report</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f6f5ef; }
    header, main { max-width: 1180px; margin: 0 auto; padding: 24px; }
    header { padding-top: 34px; }
    h1 { margin: 0 0 8px; font-size: 30px; letter-spacing: 0; }
    h2 { margin: 34px 0 12px; font-size: 20px; letter-spacing: 0; }
    h3 { margin: 24px 0 10px; font-size: 16px; letter-spacing: 0; }
    p { line-height: 1.55; }
    .muted { color: #6b7280; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
    .metric, .panel, .note { background: #fff; border: 1px solid #d8d6ce; border-radius: 8px; padding: 14px; }
    .metric .label { color: #6b7280; font-size: 12px; }
    .metric .value { font-size: 25px; font-weight: 750; margin-top: 4px; }
    .metric .sub { color: #6b7280; font-size: 12px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d8d6ce; border-radius: 8px; overflow: hidden; }
    th, td { padding: 9px 10px; border-bottom: 1px solid #ecebe6; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #ecebe6; font-weight: 700; }
    tr:last-child td { border-bottom: 0; }
    svg { width: 100%; height: auto; border: 1px solid #d8d6ce; border-radius: 8px; }
    .legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; color: #4b5563; font-size: 13px; }
    .legend i { display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
    .icon-dot { background: #facc15; border: 1px solid #a16207; }
    .event-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid #126b4f; }
    .ok { color: #126b4f; font-weight: 700; }
    .missing { color: #9f3a38; font-weight: 700; }
    .chart-stack { display: grid; gap: 14px; grid-template-columns: 1fr; }
    .item-label { display: inline-flex; align-items: center; gap: 8px; min-width: 220px; }
    .item-label img { width: 24px; height: 24px; image-rendering: pixelated; object-fit: contain; }
    .milestone-matrix { display: grid; gap: 14px; grid-template-columns: 1fr; }
    .run-strip { background: #fff; border: 1px solid #d8d6ce; border-radius: 8px; padding: 14px; }
    .run-strip h3 { margin-top: 0; }
    .icons-row { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
    .milestone-icon { min-height: 118px; border: 1px solid #d8d6ce; border-radius: 8px; padding: 9px 6px; text-align: center; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
    .milestone-icon img { width: 32px; height: 32px; image-rendering: pixelated; object-fit: contain; }
    .milestone-icon.achieved { background: #ecfdf3; border-color: #72c596; }
    .milestone-icon.missed { opacity: 0.55; filter: grayscale(1); }
    .milestone-icon .milestone-name { margin-top: 6px; min-height: 28px; font-size: 11px; line-height: 1.25; color: #374151; }
    .milestone-icon .points { margin-top: 4px; font-size: 12px; font-weight: 750; }
    .milestone-icon .cycle { margin-top: 2px; color: #6b7280; font-size: 11px; }
    code { background: #ecebe6; padding: 2px 5px; border-radius: 4px; }
    ul { margin: 8px 0 0; padding-left: 20px; }
    li { margin: 6px 0; }
    @media (max-width: 800px) { .icons-row { grid-template-columns: repeat(auto-fit, minmax(86px, 1fr)); } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(bundle.benchmark_id)} scored report</h1>
    <p class="muted">Generated ${escapeHtml(bundle.generated_at)}. Target: ${escapeHtml(bundle.target_description)}</p>
  </header>
  <main>
    <section class="grid">
      ${metricCard("Best progress score", best ? `${best.short_model_name} ${best.progress_score_100}/100` : "n/a", "milestone-weighted")}
      ${metricCard("Target reached", `${targetReached}/${bundle.scored_runs.length}`, "furnace block placed")}
      ${metricCard("Run count", bundle.scored_runs.length, bundle.benchmark_readiness.model_ranking_ready ? "preliminary ranking possible" : "not ranking-ready")}
      ${metricCard("Scoring scope", "objective progress", "schema/tool-call behavior excluded")}
    </section>

    <h2>Scoring Formula</h2>
    <section class="note">
      <p>Each milestone is binary: <code>milestone points = observed ? weight : 0</code>. The final score is the sum of those binary milestone points. For example, <code>Log acquired</code> is worth 8 points only after runtime evidence observes log collection at least once; otherwise it contributes 0 points.</p>
      <p>This does not grant partial credit inside a milestone. A model with one log and a model with ten logs both get the same 8 points for <code>Log acquired</code>; resource quantity only matters when a separate milestone encodes it, such as <code>Eight cobblestone acquired</code>.</p>
    </section>

    <h2>Goal Progress</h2>
    <div class="chart-stack">
      <section class="panel">
        <h3>Score by Cycle</h3>
        ${progressChart(bundle.scored_runs, bundle.scoring_plan)}
      </section>
      <section class="panel">
        <h3>Score by Token Spend</h3>
        ${scatterChart(bundle.scored_runs)}
      </section>
    </div>

    <h2>Minecraft Milestone Icons</h2>
    ${iconMatrix(bundle)}

    <h2>Milestone Ladder</h2>
    ${ladder(bundle)}

    <h2>Efficiency Table</h2>
    <table><thead><tr>
      <th>Model</th><th>Score</th><th>Best milestone</th><th>Total calls</th><th>Total tokens</th><th>Score / 1M tokens</th><th>Score / call</th><th>Post-best cycles</th>
    </tr></thead><tbody>
      ${bundle.scored_runs.map((run) => `<tr>
        <td>${escapeHtml(run.short_model_name)}</td>
        <td>${escapeHtml(run.progress_score_100)}/100</td>
        <td>${run.best_milestone ? `${escapeHtml(run.best_milestone.label)} at cycle ${escapeHtml(run.best_milestone.first_cycle)}` : "none"}</td>
        <td>${escapeHtml(formatNumber(run.provider_usage.requests))}</td>
        <td>${escapeHtml(formatNumber(run.provider_usage.total_tokens))}</td>
        <td>${escapeHtml(formatNumber(run.efficiency.score_per_1m_tokens))}</td>
        <td>${escapeHtml(formatNumber(run.efficiency.score_per_request))}</td>
        <td>${escapeHtml(run.post_best_milestone.cycles_after_best)}</td>
      </tr>`).join("")}
    </tbody></table>

    <h2>Estimated Cost To Best Milestone</h2>
    <p class="muted">These rows estimate cost-to-progress by proportional cycle share because the current metrics bundle stores provider usage at run level, not exact provider cost per cycle.</p>
    <table><thead><tr><th>Model</th><th>Best cycle</th><th>Estimated calls</th><th>Estimated tokens</th><th>Estimated provider elapsed</th></tr></thead><tbody>
      ${bundle.scored_runs.map((run) => `<tr>
        <td>${escapeHtml(run.short_model_name)}</td>
        <td>${escapeHtml(run.best_cycle ?? "n/a")}</td>
        <td>${escapeHtml(formatNumber(run.estimated_to_best_milestone?.requests))}</td>
        <td>${escapeHtml(formatNumber(run.estimated_to_best_milestone?.total_tokens))}</td>
        <td>${escapeHtml(run.estimated_to_best_milestone?.elapsed_ms_total ? `${formatNumber(Math.round(run.estimated_to_best_milestone.elapsed_ms_total / 1000))} s` : "n/a")}</td>
      </tr>`).join("")}
    </tbody></table>

    <h2>Post-Best Stall Review</h2>
    <table><thead><tr><th>Model</th><th>Cycles after best milestone</th><th>Outcomes after best</th><th>Top actions after best</th></tr></thead><tbody>
      ${bundle.scored_runs.map((run) => `<tr>
        <td>${escapeHtml(run.short_model_name)}</td>
        <td>${escapeHtml(run.post_best_milestone.cycles_after_best)}</td>
        <td>${entriesTable(run.post_best_milestone.outcome_counts)}</td>
        <td>${entriesTable(run.post_best_milestone.action_counts)}</td>
      </tr>`).join("")}
    </tbody></table>

    <h2>What This Shows</h2>
    <section class="note">
      <p>${escapeHtml(bundle.benchmark_readiness.summary)}</p>
      <p>In this run, progress is visible enough to distinguish objective movement from empty activity: Qwen 3.7 Plus reached the eight-cobblestone prerequisite, while Qwen 3.7 Max stopped at sticks. Neither model completed the furnace-item or furnace-block milestones, so this is a failure on the end target for both models.</p>
      <p>The main benchmark signal is not only <code>blocked</code> or <code>no_progress</code>. The useful signal is the weighted milestone curve combined with requests, tokens, elapsed time, tool attempts, and post-best stall cycles.</p>
    </section>

    <h2>Dataset Decision</h2>
    <section class="note">
      <p>${escapeHtml(bundle.benchmark_readiness.external_dataset_assessment)}</p>
      <p>${escapeHtml(bundle.benchmark_readiness.next_internal_step)}</p>
    </section>

    <h2>Limitations</h2>
    <ul>
      ${bundle.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}
    </ul>
  </main>
</body>
</html>`;
}
