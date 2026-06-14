#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";

import {
  buildSocialCycleBenchmarkMetrics,
  type BenchmarkObservationMetrics
} from "./socialCycleBenchmarkMetrics.js";

type CliArgs = {
  reports: string[];
  out?: string;
  html?: string;
  benchmarkId: string;
  targetDescription?: string;
  targetBlock?: string;
  targetItem?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    reports: [],
    benchmarkId: "social-cycle-benchmark"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--report" && next) {
      args.reports.push(next);
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = next;
      index += 1;
    } else if (arg === "--html" && next) {
      args.html = next;
      index += 1;
    } else if (arg === "--benchmark-id" && next) {
      args.benchmarkId = next;
      index += 1;
    } else if (arg === "--target-description" && next) {
      args.targetDescription = next;
      index += 1;
    } else if (arg === "--target-block" && next) {
      args.targetBlock = next;
      index += 1;
    } else if (arg === "--target-item" && next) {
      args.targetItem = next;
      index += 1;
    }
  }
  if (args.reports.length === 0) {
    throw new Error("At least one --report path is required");
  }
  return args;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function chartPolyline(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }
  const max = Math.max(1, ...values);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function metricCard(label: string, value: unknown, sub = "") {
  return `<section class="metric"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div><div class="sub">${escapeHtml(sub)}</div></section>`;
}

function entriesTable(entries: Array<[string, number]>, empty = "No records") {
  if (entries.length === 0) {
    return `<p class="muted">${escapeHtml(empty)}</p>`;
  }
  return `<table><thead><tr><th>Name</th><th>Count</th></tr></thead><tbody>${entries
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</tbody></table>`;
}

function milestoneTable(metrics: BenchmarkObservationMetrics[]) {
  const milestoneIds = Array.from(
    new Set(metrics.flatMap((metric) => Object.keys(metric.target_observations.milestone_first_cycles)))
  ).sort();
  if (milestoneIds.length === 0) {
    return `<p class="muted">No milestone observations were found.</p>`;
  }
  return `<table><thead><tr><th>Milestone</th>${metrics
    .map((metric) => `<th>${escapeHtml(shortModelName(metric.run.model))}</th>`)
    .join("")}</tr></thead><tbody>${milestoneIds
    .map((milestone) => `<tr><td>${escapeHtml(milestone)}</td>${metrics
      .map((metric) => {
        const value = metric.target_observations.milestone_first_cycles[
          milestone as keyof typeof metric.target_observations.milestone_first_cycles
        ];
        return `<td>${value ? `cycle ${escapeHtml(value)}` : "<span class=\"muted\">not observed</span>"}</td>`;
      })
      .join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function shortModelName(model: string) {
  return model.replace("Qwen-Ambassador/", "").replace("Qwen", "Qwen ");
}

function trendChart(metrics: BenchmarkObservationMetrics) {
  const series = metrics.aggregate_metrics.cycle_time_series;
  const width = 760;
  const height = 180;
  const verified = chartPolyline(series.map((cycle) => cycle.cumulative_verified_progress), width, height);
  const blocked = chartPolyline(series.map((cycle) => cycle.cumulative_blocked), width, height);
  const noProgress = chartPolyline(series.map((cycle) => cycle.cumulative_no_progress), width, height);
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="cumulative cycle trend">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fff"/>
    <polyline points="${verified}" fill="none" stroke="#1f8a5b" stroke-width="4"/>
    <polyline points="${blocked}" fill="none" stroke="#b42318" stroke-width="4"/>
    <polyline points="${noProgress}" fill="none" stroke="#6b7280" stroke-width="3"/>
  </svg>
  <div class="legend"><span><i class="green"></i>verified/partial</span><span><i class="red"></i>blocked</span><span><i class="gray"></i>no progress</span></div>`;
}

function images(metrics: BenchmarkObservationMetrics) {
  const imgs = metrics.visual_evidence.sample_images.filter((image) => image.image_path);
  if (imgs.length === 0) {
    return `<p class="muted">No sample images were recorded in metrics.</p>`;
  }
  return `<div class="images">${imgs
    .map((image) => `<figure>
      <img src="${escapeHtml(image.image_path)}" alt="${escapeHtml(`${image.cycle_id} ${image.camera_mode ?? ""}`)}">
      <figcaption>${escapeHtml(image.cycle_id)} · ${escapeHtml(image.phase)} · ${escapeHtml(image.camera_mode ?? "")}</figcaption>
    </figure>`)
    .join("")}</div>`;
}

export function formatBenchmarkMetricsHtml(metrics: BenchmarkObservationMetrics[]) {
  const title = `${metrics[0]?.benchmark_id ?? "benchmark"} observation report`;
  const cards = metrics.flatMap((metric) => [
    metricCard(`${shortModelName(metric.run.model)} cycles`, metric.run.total_cycles, metric.run.runtime_status),
    metricCard(`${shortModelName(metric.run.model)} requests`, metric.provider_usage.requests, "provider API calls"),
    metricCard(
      `${shortModelName(metric.run.model)} avg latency`,
      metric.provider_usage.elapsed_ms_avg ? `${metric.provider_usage.elapsed_ms_avg} ms` : "n/a",
      metric.provider_usage.elapsed_ms_p95 ? `p95 ${metric.provider_usage.elapsed_ms_p95} ms` : ""
    ),
    metricCard(
      `${shortModelName(metric.run.model)} target block`,
      metric.target_observations.observed_target_block_cycle
        ? `cycle ${metric.target_observations.observed_target_block_cycle}`
        : "not observed",
      "observation only, not scorer verdict"
    )
  ]);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f7f7f4; }
    header, main { max-width: 1180px; margin: 0 auto; padding: 24px; }
    header { padding-top: 32px; }
    h1 { margin: 0 0 8px; font-size: 30px; letter-spacing: 0; }
    h2 { margin: 32px 0 12px; font-size: 20px; letter-spacing: 0; }
    h3 { margin: 24px 0 10px; font-size: 16px; letter-spacing: 0; }
    .muted { color: #6b7280; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
    .metric, .panel { background: #fff; border: 1px solid #d8d6ce; border-radius: 8px; padding: 14px; }
    .metric .label { color: #6b7280; font-size: 12px; }
    .metric .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .metric .sub { color: #6b7280; font-size: 12px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d8d6ce; border-radius: 8px; overflow: hidden; }
    th, td { padding: 9px 10px; border-bottom: 1px solid #ecebe6; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #ecebe6; font-weight: 700; }
    tr:last-child td { border-bottom: 0; }
    svg { width: 100%; height: auto; border: 1px solid #d8d6ce; border-radius: 8px; }
    .legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; color: #4b5563; font-size: 13px; }
    .legend i { display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
    .green { background: #1f8a5b; } .red { background: #b42318; } .gray { background: #6b7280; }
    .images { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    figure { margin: 0; background: #fff; border: 1px solid #d8d6ce; border-radius: 8px; overflow: hidden; }
    img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #111; }
    figcaption { padding: 8px 10px; color: #4b5563; font-size: 12px; }
    code { background: #ecebe6; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">Generated ${escapeHtml(new Date().toISOString())}. These are observation metrics, not final benchmark scores.</p>
  </header>
  <main>
    <section class="grid">${cards.join("")}</section>
    <h2>Run Setup</h2>
    <table><thead><tr><th>Model</th><th>World</th><th>Seed</th><th>Fixture</th><th>Natural spawn</th><th>Reasoning</th></tr></thead><tbody>
      ${metrics.map((metric) => `<tr>
        <td>${escapeHtml(metric.run.model)}</td>
        <td>${escapeHtml(`${metric.world.mode ?? ""} / ${metric.world.level_type ?? ""} / ${metric.world.version ?? ""}`)}</td>
        <td><code>${escapeHtml(metric.world.seed)}</code></td>
        <td>${escapeHtml(metric.world.fixture_dependency)}</td>
        <td>${escapeHtml(metric.world.natural_spawn_validation_status ?? "n/a")}</td>
        <td>${escapeHtml(metric.run.reasoning)}</td>
      </tr>`).join("")}
    </tbody></table>
    <h2>Milestone Observations</h2>
    ${milestoneTable(metrics)}
    ${metrics.map((metric) => `<section class="panel">
      <h2>${escapeHtml(shortModelName(metric.run.model))}</h2>
      <h3>Cycle Trend</h3>
      ${trendChart(metric)}
      <h3>Outcome Counts</h3>
      ${entriesTable(Object.entries(metric.aggregate_metrics.outcome_counts).sort((a, b) => b[1] - a[1]))}
      <h3>Action Counts</h3>
      ${entriesTable(Object.entries(metric.aggregate_metrics.action_counts).sort((a, b) => b[1] - a[1]).slice(0, 12))}
      <h3>Quota</h3>
      <table><thead><tr><th>Policy</th><th>Status</th><th>Projected monthly calls</th><th>Monthly cap</th></tr></thead><tbody>
      ${metric.provider_usage.quota_checks.map((check) => `<tr>
        <td>${escapeHtml(check.quota_policy_id)}</td>
        <td>${escapeHtml(check.status)}</td>
        <td>${escapeHtml(check.projected_month_requests)}</td>
        <td>${escapeHtml(check.request_limit_per_month)}</td>
      </tr>`).join("")}
      </tbody></table>
      <h3>Visual Samples</h3>
      ${images(metric)}
    </section>`).join("")}
  </main>
</body>
</html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const metrics = [];
  for (const reportPath of args.reports) {
    metrics.push(await buildSocialCycleBenchmarkMetrics(reportPath, {
      benchmarkId: args.benchmarkId,
      targetDescription: args.targetDescription,
      targetBlock: args.targetBlock,
      targetItem: args.targetItem
    }));
  }
  if (args.out) {
    await fs.mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
    await fs.writeFile(path.resolve(args.out), JSON.stringify({
      schema: "benchmark-observation-metrics-bundle/v1",
      generated_at: new Date().toISOString(),
      metrics
    }, null, 2));
  } else {
    process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
  }
  if (args.html) {
    await fs.mkdir(path.dirname(path.resolve(args.html)), { recursive: true });
    await fs.writeFile(path.resolve(args.html), formatBenchmarkMetricsHtml(metrics));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
