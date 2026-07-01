#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../..");
const base30Dir = path.join(repoRoot, "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen");
const staticExportPath = path.join(
  repoRoot,
  "project-docs/static-exports/no-regret-core-qwen-ambassador-report-2026-06-29.html"
);
const combinedAnalysisPath = path.join(here, "combined-model-comparison-30cycle-analysis.json");
const summaryPath = path.join(here, "summary.json");

const completedLanes = [
  {
    id: "qwen-plus",
    label: "Qwen Plus",
    short: "Qwen Plus",
    provider: "modelscope-api",
    source: "base",
    review: "qwen-3.7-plus-review-summary.json",
    color: "#2d7a4d",
    note: "Early workbench chain closed cleanly; later movement and mining mappings created friction."
  },
  {
    id: "qwen-max",
    label: "Qwen Max",
    short: "Qwen Max",
    provider: "modelscope-api",
    source: "base",
    review: "qwen-3.7-max-review-summary.json",
    color: "#5f6f2d",
    note: "Most verified progress and late cobblestone/dirt continuation; table-crafting retries still mattered."
  },
  {
    id: "gpt54-mini",
    label: "GPT-5.4 mini",
    short: "GPT mini",
    provider: "openai-api",
    source: "base",
    review: "gpt-5.4-mini-review-summary.json",
    color: "#2f6f86",
    note: "Completed 30 cycles but paid a high request cost and exposed placement/codegen friction."
  },
  {
    id: "gemini-31-flash-lite-paced",
    label: "Gemini 3.1 Flash Lite",
    short: "Gemini 3.1",
    provider: "gemini-api",
    source: "extension",
    report: "gemini-3.1-flash-lite-paced.json",
    review: "gemini-3.1-flash-lite-paced-review-summary.json",
    color: "#7b5fa8",
    note: "Completed only after explicit Gemini request pacing; strong early workbench evidence, then repeated movement/provider-contract blockers."
  }
];

const selectedScreenshotNames = [
  "initial-initial-third-person-high.png",
  "cycle-0010-cycle-end-third-person-follow.png",
  "cycle-0020-cycle-end-third-person-follow.png",
  "cycle-0030-cycle-end-first-person.png",
  "cycle-0030-cycle-end-third-person-follow.png",
  "cycle-0030-cycle-end-third-person-high.png"
];

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fmt(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "n/a";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }
  return String(value);
}

function fmtCompact(value) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return fmt(value);
}

function pct(value, max, min = 3) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.max(min, Math.min(100, Math.round((value / max) * 100)));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function objectFromChecklist(reportOrAnalysis) {
  const items = reportOrAnalysis?.settlement_checklist?.items ?? [];
  if (items.length > 0) {
    return Object.fromEntries(items.map((item) => [item.id, item.status]));
  }
  return reportOrAnalysis?.checklist ?? {};
}

function inventoryText(inventory) {
  const entries = Object.entries(inventory ?? {}).filter(([, count]) => Number(count) > 0);
  if (entries.length === 0) {
    return "empty";
  }
  return entries
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([item, count]) => `${item} x${count}`)
    .join(", ");
}

function firstExistingRun(analysis, id) {
  return analysis.runs.find((run) => run.id === id);
}

function usageFromReport(report) {
  const usage = report.provider_usage?.totals?.[0]?.usage ?? {};
  return {
    requests: usage.requests ?? 0,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    thinking_tokens: usage.thinking_tokens ?? 0,
    total_tokens: usage.total_tokens ?? 0
  };
}

function actionCountsFromRows(rows) {
  const counts = {};
  for (const row of rows ?? []) {
    const key = row.primitive_or_skill || "?";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function shortOutcome(row) {
  if (row.judgment_outcome === "verified_progress") {
    return "ok";
  }
  if (row.judgment_outcome === "blocked") {
    return "bad";
  }
  return "idle";
}

function screenshotSrc(lane, fileName) {
  if (lane.source === "base") {
    return `../Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/screenshots/report-html/${lane.id}/${fileName}`;
  }
  return `../Experiments/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/screenshots/report-html/${lane.id}/${fileName}`;
}

async function copyGeminiScreenshots(report) {
  const runId = report.run_id;
  const srcDir = path.join(repoRoot, "data/actors/social-runs", runId, "npc_b/visual-evidence");
  const destDir = path.join(here, "screenshots/report-html/gemini-31-flash-lite-paced");
  await fs.mkdir(destDir, { recursive: true });
  for (const fileName of selectedScreenshotNames) {
    const src = path.join(srcDir, fileName);
    if (await exists(src)) {
      await fs.copyFile(src, path.join(destDir, fileName));
    }
  }
}

async function buildLane(input) {
  const { spec, baseAnalysis } = input;
  const reviewDir = spec.source === "base" ? path.join(base30Dir, "reports") : path.join(here, "reports");
  const review = await readJson(path.join(reviewDir, spec.review));
  const rows = review.rows ?? [];

  if (spec.source === "base") {
    const analysisRun = firstExistingRun(baseAnalysis, spec.id);
    return {
      ...analysisRun,
      id: spec.id,
      label: spec.label,
      short: spec.short,
      color: spec.color,
      note: spec.note,
      review_rows: rows,
      action_counts: actionCountsFromRows(rows),
      checklist: analysisRun.checklist ?? {},
      inventory_text: inventoryText(analysisRun.inventory),
      caveat: analysisRun.visual_caveat ?? null
    };
  }

  const report = await readJson(path.join(here, "reports", spec.report));
  await copyGeminiScreenshots(report);
  const usage = usageFromReport(report);
  const outcomes = review.outcome_counts ?? {};
  const verifier = review.verifier_counts ?? {};
  const inventory = report.settlement_state?.inventory_counts ?? {};
  const verified = outcomes.verified_progress ?? 0;
  const visualCount = report.visual_evidence?.captures?.length ?? 0;
  return {
    id: spec.id,
    label: spec.label,
    short: spec.short,
    model: report.provider?.model ?? "gemini-3.1-flash-lite",
    provider_id: report.provider?.provider_id ?? "gemini-api",
    run_id: report.run_id,
    runtime_status: report.runtime_status,
    cycles: report.cycles?.length ?? 0,
    usage,
    outcomes,
    verifier,
    checklist: objectFromChecklist(report),
    inventory,
    inventory_text: inventoryText(inventory),
    visual_count: visualCount,
    visual_audit: report.visual_evidence?.audit?.status ?? "unknown",
    milestones: "table evidence cycle-0005 · sticks/planks retained · no shelter/storage",
    request_per_verified_progress: verified > 0 ? usage.requests / verified : null,
    tokens_per_verified_progress: verified > 0 ? usage.total_tokens / verified : null,
    review_rows: rows,
    action_counts: actionCountsFromRows(rows),
    color: spec.color,
    note: spec.note,
    caveat: "Completed with GEMINI_MIN_REQUEST_INTERVAL_MS=15000 after an unpaced run hit Gemini 250k input-token-per-minute quota at cycle 6."
  };
}

function runCard(run) {
  const verified = run.outcomes.verified_progress ?? 0;
  const blocked = run.outcomes.blocked ?? 0;
  const none = run.outcomes.no_progress ?? Math.max(0, run.cycles - verified - blocked);
  const total = Math.max(1, run.cycles ?? 30);
  const caveat = run.caveat ? `
    <p class="lane-caveat">${html(run.caveat)}</p>` : "";
  return `<article class="run-card" style="--accent:${html(run.color)}">
    <div class="run-head">
      <div>
        <p class="kicker">${html(run.provider_id)}</p>
        <h3>${html(run.label)}</h3>
        <code>${html(run.model)}</code>
      </div>
      <strong class="score">${html(verified)}<small>/${html(total)}</small></strong>
    </div>
    <p class="run-story">${html(run.note)}</p>
    <div class="stack" aria-label="${html(run.label)} outcome stack">
      <div class="seg progress" style="width:${pct(verified, total, 0)}%" title="verified ${html(verified)}"></div>
      <div class="seg blocked" style="width:${pct(blocked, total, 0)}%" title="blocked ${html(blocked)}"></div>
      <div class="seg none" style="width:${pct(none, total, 0)}%" title="no progress ${html(none)}"></div>
    </div>
    <div class="mini-grid">
      <span><b>${html(run.verifier.passed ?? 0)}</b> verifier passed</span>
      <span><b>${html(blocked)}</b> blocked</span>
      <span><b>${html(run.usage.requests)}</b> provider records</span>
      <span><b>${html(fmtCompact(run.usage.total_tokens))}</b> total tokens</span>
    </div>
    <p class="inventory"><b>Inventory:</b> ${html(run.inventory_text)}</p>
    <p class="milestone">${html(run.milestones ?? "")}</p>${caveat}
  </article>`;
}

function outcomeTable(lanes) {
  return `<table>
    <thead><tr><th>Lane</th><th>Model</th><th>Status</th><th>Verified</th><th>Blocked</th><th>No progress</th><th>Verifier P/F/NA</th><th>Records</th><th>Total tokens</th><th>Records / progress</th><th>Tokens / progress</th></tr></thead>
    <tbody>${lanes.map((run) => {
      const verified = run.outcomes.verified_progress ?? 0;
      const blocked = run.outcomes.blocked ?? 0;
      const none = run.outcomes.no_progress ?? Math.max(0, run.cycles - verified - blocked);
      return `<tr>
        <th>${html(run.label)}</th>
        <td><code>${html(run.model)}</code></td>
        <td>${html(run.runtime_status)}</td>
        <td>${html(verified)}</td>
        <td>${html(blocked)}</td>
        <td>${html(none)}</td>
        <td>${html(run.verifier.passed ?? 0)}/${html(run.verifier.failed ?? 0)}/${html(run.verifier.not_applicable ?? 0)}</td>
        <td>${html(fmt(run.usage.requests))}</td>
        <td>${html(fmt(run.usage.total_tokens))}</td>
        <td>${html(run.request_per_verified_progress ? run.request_per_verified_progress.toFixed(1) : "n/a")}</td>
        <td>${html(run.tokens_per_verified_progress ? fmtCompact(run.tokens_per_verified_progress) : "n/a")}</td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
}

function bars(lanes, key, label, cssClass) {
  const max = Math.max(1, ...lanes.map((lane) => key(lane)));
  return `<div class="small">${html(label)}</div>${lanes.map((lane) => `<div class="viz-row">
    <b>${html(lane.short)}</b>
    <div class="bar ${html(cssClass)}"><i style="width:${pct(key(lane), max)}%"></i></div>
    <span>${html(fmtCompact(key(lane)))}</span>
  </div>`).join("")}`;
}

function timeline(lanes) {
  return `<div class="timeline-block">${lanes.map((lane) => `<div class="timeline-row">
    <b>${html(lane.short)}</b>
    <div class="timeline" aria-label="${html(lane.label)} cycle timeline">
      ${(lane.review_rows ?? []).map((row, index) => `<span class="tick ${shortOutcome(row)}" title="${html(`${row.cycle_id}: ${row.judgment_outcome} / ${row.primitive_or_skill}`)}"><b>${String(index + 1).padStart(2, "0")}</b></span>`).join("")}
    </div>
  </div>`).join("")}</div>`;
}

function toolMix(lanes) {
  const tools = Array.from(new Set(lanes.flatMap((lane) => Object.keys(lane.action_counts ?? {}))));
  const preferred = [
    "collect_logs",
    "collectLogs",
    "craftPlanksAndSticks",
    "craft_item",
    "craft_with_table",
    "placeCraftingTable",
    "place_block",
    "move_to",
    "mine_block",
    "author_mineflayer_action",
    "?"
  ];
  const ordered = [
    ...preferred.filter((tool) => tools.includes(tool)),
    ...tools.filter((tool) => !preferred.includes(tool)).sort()
  ];
  return `<table>
    <thead><tr><th>Lane</th>${ordered.map((tool) => `<th>${html(tool)}</th>`).join("")}</tr></thead>
    <tbody>${lanes.map((lane) => `<tr><th>${html(lane.label)}</th>${ordered.map((tool) => `<td>${html(lane.action_counts?.[tool] ?? 0)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function checklistTable(lanes) {
  const ids = [
    "crafting_table_known_or_placed",
    "starter_shelter_verified",
    "shared_storage_contribution",
    "memory_or_judgment_persisted",
    "recent_blockers_summarized"
  ];
  return `<table>
    <thead><tr><th>Lane</th>${ids.map((id) => `<th>${html(id.replaceAll("_", " "))}</th>`).join("")}</tr></thead>
    <tbody>${lanes.map((lane) => `<tr><th>${html(lane.label)}</th>${ids.map((id) => {
      const status = lane.checklist?.[id] ?? "unknown";
      const cls = status === "satisfied" ? "yes" : status === "pending" ? "pending" : "no";
      return `<td><span class="status ${cls}">${html(status)}</span></td>`;
    }).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function visualCards(lanes) {
  const captions = ["initial", "cycle 10", "cycle 20", "final first", "final follow", "final high"];
  return lanes.map((lane) => `<article class="shot-card">
    <h3>${html(lane.label)}</h3>
    <div class="shots">
      ${selectedScreenshotNames.map((fileName, index) => `<figure>
        <img src="${html(screenshotSrc(lane, fileName))}" alt="${html(`${lane.label} ${captions[index]} screenshot`)}">
        <figcaption>${html(captions[index])}</figcaption>
      </figure>`).join("")}
    </div>
  </article>`).join("");
}

function blockerCards(lanes) {
  return lanes.map((lane) => {
    const blockers = (lane.review_rows ?? [])
      .filter((row) => row.judgment_outcome === "blocked")
      .slice(0, 4);
    return `<article class="blocker"><h3>${html(lane.label)}</h3><ul>${blockers.map((row) => `<li><b>${html(row.cycle_id)}</b> <code>${html(row.primitive_or_skill ?? "?")}</code>: ${html(row.what_happened ?? "")}</li>`).join("")}</ul></article>`;
  }).join("");
}

function renderHtml(input) {
  const { lanes, totals, exclusions, generatedAt } = input;
  const verifiedMax = Math.max(1, ...lanes.map((lane) => lane.outcomes.verified_progress ?? 0));
  const heroLane = lanes.find((lane) => lane.id === "gemini-31-flash-lite-paced") ?? lanes[0];
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Natural Village 30-Cycle Model Comparison</title>
  <style>
    :root {
      --paper:#f3efe2; --ink:#20251f; --muted:#61685d; --line:#c9bda4;
      --surface:#fffaf0; --surface-2:#ebe3d1; --grass:#2d7a4d; --water:#2f6f86;
      --red:#9f3f35; --gold:#c0953f; --purple:#7b5fa8;
    }
    * { box-sizing:border-box; }
    body {
      margin:0; color:var(--ink);
      font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height:1.55; background:
        linear-gradient(90deg, rgba(32,37,31,.05) 1px, transparent 1px),
        linear-gradient(180deg, rgba(32,37,31,.045) 1px, transparent 1px),
        var(--paper); background-size:24px 24px;
    }
    code { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:.9em; background:rgba(98,105,99,.12); border:1px solid rgba(98,105,99,.2); border-radius:5px; padding:1px 5px; }
    img { max-width:100%; display:block; }
    .page { width:min(1380px, calc(100% - 32px)); margin:0 auto; padding:18px 0 60px; }
    .topbar { display:flex; gap:16px; justify-content:space-between; align-items:center; color:var(--muted); font-size:13px; padding:8px 0 16px; }
    .nav { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .nav a { text-decoration:none; color:inherit; border:1px solid var(--line); background:rgba(255,250,240,.8); border-radius:999px; padding:6px 10px; }
    .hero { display:grid; grid-template-columns:minmax(0,.94fr) minmax(440px,1.06fr); gap:22px; border-top:3px solid var(--ink); border-bottom:1px solid var(--line); padding:24px 0 22px; align-items:stretch; }
    .hero-copy { min-height:620px; display:grid; align-content:space-between; gap:24px; }
    .kicker { margin:0 0 8px; color:var(--grass); font-size:12px; font-weight:850; letter-spacing:0; text-transform:uppercase; }
    h1,h2,h3,p { margin:0; } h1 { font-size:clamp(42px,6.3vw,86px); line-height:.95; letter-spacing:0; max-width:850px; }
    h2 { font-size:clamp(28px,3.4vw,48px); line-height:1.04; letter-spacing:0; } h3 { font-size:20px; line-height:1.15; }
    .lead { margin-top:16px; max-width:760px; color:#3d443b; font-size:18px; }
    .thesis { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:22px; }
    .thesis div,.metric,.run-card,.panel,.shot-card,.blocker { border:1px solid var(--line); background:rgba(255,250,240,.88); border-radius:8px; }
    .thesis div { padding:14px; } .thesis span,.metric span,figcaption,.small { display:block; color:var(--muted); font-size:12px; font-weight:760; letter-spacing:0; text-transform:uppercase; }
    .thesis strong { display:block; margin-top:6px; font-size:17px; }
    .hero-shot { position:relative; min-height:470px; border:1px solid #857962; background:#d8e4d4; overflow:hidden; }
    .hero-shot img { width:100%; height:100%; min-height:470px; object-fit:cover; }
    .label-strip { position:absolute; left:12px; right:12px; bottom:12px; display:flex; gap:8px; flex-wrap:wrap; }
    .chip { display:inline-flex; align-items:center; min-height:26px; padding:4px 9px; border:1px solid rgba(32,37,31,.22); background:rgba(255,250,240,.88); border-radius:999px; color:#263027; font-size:12px; font-weight:760; line-height:1.2; }
    .chip.ok { border-color:rgba(45,122,77,.45); background:rgba(45,122,77,.14); color:#225d3b; } .chip.warn { border-color:rgba(159,63,53,.5); background:rgba(159,63,53,.12); color:#7d3028; } .chip.info { border-color:rgba(47,111,134,.45); background:rgba(47,111,134,.12); color:#255d71; }
    .metrics { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; margin-top:18px; }
    .metric { padding:13px; min-width:0; } .metric strong { display:block; margin-top:7px; font-size:26px; line-height:1; font-variant-numeric:tabular-nums; } .metric em { display:block; margin-top:7px; color:var(--muted); font-size:12px; font-style:normal; }
    .section { border-top:1px solid var(--line); padding:34px 0; }
    .section-title { display:grid; grid-template-columns:190px minmax(0,1fr); gap:24px; align-items:start; margin-bottom:18px; }
    .section-title > p { color:var(--grass); font-size:12px; font-weight:850; text-transform:uppercase; letter-spacing:0; }
    .run-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .run-card { padding:16px; border-top:5px solid var(--accent); }
    .run-head { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
    .score { min-width:82px; text-align:right; font-size:42px; line-height:1; color:var(--accent); font-variant-numeric:tabular-nums; } .score small { font-size:16px; color:var(--muted); }
    .run-story,.inventory,.milestone,.lane-caveat { margin-top:12px; color:#3e463d; font-size:13px; }
    .lane-caveat { color:#6c3c35; }
    .stack { display:flex; height:16px; border:1px solid rgba(32,37,31,.2); border-radius:999px; overflow:hidden; margin:16px 0 12px; background:#e8dfcc; }
    .seg.progress { background:var(--grass); } .seg.blocked { background:var(--red); } .seg.none { background:#b7aa8e; }
    .mini-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; } .mini-grid span { border:1px solid rgba(32,37,31,.13); background:rgba(255,255,255,.36); border-radius:6px; padding:8px; color:var(--muted); font-size:12px; } .mini-grid b { display:block; color:var(--ink); font-size:18px; font-variant-numeric:tabular-nums; }
    .two-col { display:grid; grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr); gap:14px; align-items:start; } .panel { padding:16px; }
    table { width:100%; border-collapse:collapse; background:var(--surface); border:1px solid var(--line); border-radius:8px; overflow:hidden; font-size:13px; }
    th,td { padding:10px 9px; border-bottom:1px solid rgba(201,189,164,.7); text-align:left; vertical-align:top; } th { font-weight:850; } td { color:#3c443a; }
    .number-viz { display:grid; gap:10px; } .viz-row { display:grid; grid-template-columns:120px minmax(0,1fr) 76px; gap:10px; align-items:center; font-size:13px; } .bar { height:13px; background:#e5dcc8; border:1px solid rgba(32,37,31,.14); border-radius:999px; overflow:hidden; } .bar i { display:block; height:100%; background:var(--grass); } .bar.requests i { background:var(--water); } .bar.tokens i { background:var(--gold); }
    .timeline-block { display:grid; gap:13px; } .timeline-row { display:grid; grid-template-columns:140px minmax(0,1fr); gap:12px; align-items:center; } .timeline { display:grid; grid-template-columns:repeat(30,minmax(10px,1fr)); gap:3px; } .tick { min-height:26px; border:1px solid rgba(32,37,31,.18); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:rgba(32,37,31,.75); font-variant-numeric:tabular-nums; } .tick.ok { background:rgba(45,122,77,.25); border-color:rgba(45,122,77,.35); } .tick.bad { background:rgba(159,63,53,.23); border-color:rgba(159,63,53,.35); } .tick.idle { background:rgba(183,170,142,.32); }
    .legend { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; color:var(--muted); font-size:12px; } .legend i { width:13px; height:13px; display:inline-block; border-radius:3px; margin-right:4px; vertical-align:-2px; border:1px solid rgba(32,37,31,.2); }
    .shot-stack { display:grid; gap:14px; } .shot-card { padding:14px; } .shots { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; margin-top:12px; } figure { margin:0; border:1px solid var(--line); background:var(--surface-2); border-radius:7px; overflow:hidden; } figure img { width:100%; aspect-ratio:16/9; object-fit:cover; } figcaption { padding:6px 7px; text-transform:none; letter-spacing:0; font-weight:650; }
    .matrix .status { display:inline-flex; min-width:88px; justify-content:center; border-radius:999px; padding:4px 8px; font-size:12px; font-weight:800; border:1px solid rgba(32,37,31,.15); } .status.yes { background:rgba(45,122,77,.15); color:#205c38; } .status.pending { background:rgba(192,149,63,.16); color:#78591e; } .status.no { background:rgba(159,63,53,.14); color:#7b3028; }
    .blockers { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; } .blocker { padding:15px; } .blocker ul { margin:12px 0 0; padding-left:18px; color:#3f463d; } .blocker li + li { margin-top:8px; }
    .callout { border-left:5px solid var(--red); background:rgba(159,63,53,.09); padding:14px 16px; border-radius:0 8px 8px 0; } .callout.good { border-left-color:var(--grass); background:rgba(45,122,77,.1); }
    .footnotes { color:var(--muted); font-size:13px; }
    @media (max-width:1180px) { .run-grid,.blockers { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media (max-width:980px) { .hero,.two-col { grid-template-columns:1fr; } .hero-copy { min-height:auto; } .metrics,.run-grid,.blockers { grid-template-columns:1fr; } .section-title { grid-template-columns:1fr; gap:8px; } .shots { grid-template-columns:repeat(2,minmax(0,1fr)); } .timeline-row { grid-template-columns:1fr; } table { display:block; overflow-x:auto; } }
  </style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <div>No-regret core pilot · updated 2026-06-30 · file report</div>
      <nav class="nav" aria-label="Report sections">
        <a href="#protocol">Protocol</a><a href="#models">Models</a><a href="#charts">Metrics</a><a href="#visuals">Visuals</a><a href="#diagnosis">Diagnosis</a><a href="#next">Next</a>
      </nav>
    </div>
    <section class="hero">
      <div class="hero-copy">
        <div>
          <p class="kicker">Natural village · 30-cycle model comparison + Gemini extension</p>
          <h1>마을 근처 자연 월드에서 모델이 실제로 뭘 했는지 본다</h1>
          <p class="lead">이 문서는 Qwen Plus, Qwen Max, GPT-5.4 mini의 30-cycle pilot에 Gemini 3.1 Flash Lite paced lane을 추가한 비교 리포트다. 연구 결론이 아니라, 자연 마을 스폰에서 goal-oriented physical competence, continuity, provider cost, blocker recovery를 확인하는 실행 증거다.</p>
          <div class="thesis">
            <div><span>Research target today</span><strong>goal-oriented physical competence + continuity</strong></div>
            <div><span>Not counted</span><strong>prose claim, self-declared progress, screenshot-only block identity</strong></div>
            <div><span>Task</span><strong>logs -> planks/sticks/table -> safe village-adjacent work point</strong></div>
            <div><span>Gemini caveat</span><strong>completed lane required explicit request pacing</strong></div>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><span>completed lanes</span><strong>${html(lanes.length)}</strong><em>Qwen · OpenAI mini · Gemini 3.1</em></div>
          <div class="metric"><span>cycles</span><strong>${html(totals.cycles)}</strong><em>30 cycles per completed lane</em></div>
          <div class="metric"><span>visual captures</span><strong>${html(totals.captures)}</strong><em>first/follow/high every cycle</em></div>
          <div class="metric"><span>verified progress</span><strong>${html(totals.verified)}</strong><em>review outcome, not self-report</em></div>
          <div class="metric"><span>provider records</span><strong>${html(totals.requests)}</strong><em>${html(fmtCompact(totals.tokens))} total tokens</em></div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-shot">
          <img src="${html(screenshotSrc(heroLane, "cycle-0030-cycle-end-third-person-follow.png"))}" alt="Gemini 3.1 Flash Lite final follow Minecraft screenshot">
          <div class="label-strip"><span class="chip ok">visual audit passed</span><span class="chip info">server 1.21.4</span><span class="chip warn">renderer is review-only</span></div>
        </div>
      </div>
    </section>
    <section class="section" id="protocol">
      <div class="section-title"><p>Protocol</p><h2>같은 seed, 같은 scenario, 매 lane fresh world. Gemini lane은 provider pacing 조건을 명시한다.</h2></div>
      <div class="two-col">
        <div class="panel">${outcomeTable(lanes)}</div>
        <div class="callout good"><p><b>실행 기준.</b> <code>natural-village-spawn-v1</code>, seed <code>4167799982467607063</code>, actor <code>npc_b</code>, <code>--visual-profile report</code>. Gemini 3.1은 unpaced 6-cycle 실패 후 <code>GEMINI_MIN_REQUEST_INTERVAL_MS=15000</code>로 30-cycle을 완주했다.</p></div>
      </div>
    </section>
    <section class="section" id="models">
      <div class="section-title"><p>Model lanes</p><h2>네 completed lane 모두 30 cycles. 하지만 효율과 실패 양상은 다르다.</h2></div>
      <div class="run-grid">${lanes.map(runCard).join("")}</div>
    </section>
    <section class="section" id="charts">
      <div class="section-title"><p>Metrics</p><h2>비교 축은 leaderboard가 아니라 concrete action evidence다.</h2></div>
      <div class="two-col">
        <div class="panel">${outcomeTable(lanes)}</div>
        <div class="panel number-viz">
          <h3>Progress, requests, tokens</h3>
          ${bars(lanes, (lane) => lane.outcomes.verified_progress ?? 0, "verified progress", "progress")}
          ${bars(lanes, (lane) => lane.usage.requests ?? 0, "provider records", "requests")}
          ${bars(lanes, (lane) => lane.usage.total_tokens ?? 0, "total tokens", "tokens")}
          <p class="small">Provider tokenizers differ. Use token bars as cost pressure, not pure model quality.</p>
        </div>
      </div>
      <div class="panel" style="margin-top:14px">
        <h3>Cycle timeline</h3>
        ${timeline(lanes)}
        <div class="legend"><span><i style="background:rgba(45,122,77,.25)"></i>verified progress</span><span><i style="background:rgba(159,63,53,.23)"></i>blocked</span><span><i style="background:rgba(183,170,142,.32)"></i>no progress / diagnostic</span></div>
      </div>
      <div class="two-col" style="margin-top:14px">
        <div class="panel"><h3>Executed tool mix</h3>${toolMix(lanes)}</div>
        <div class="panel matrix"><h3>Settlement checklist</h3>${checklistTable(lanes)}</div>
      </div>
    </section>
    <section class="section" id="visuals">
      <div class="section-title"><p>Visual evidence</p><h2>모든 completed lane은 report visual audit를 통과했다.</h2></div>
      <div class="shot-stack">${visualCards(lanes)}</div>
      <p class="footnotes" style="margin-top:12px">Screenshots are human-review evidence only. Block identity and progress come from same-cycle runtime evidence, transition rows, observe/world-state artifacts, and verifier outputs.</p>
    </section>
    <section class="section" id="diagnosis">
      <div class="section-title"><p>Diagnosis</p><h2>Gemini 3.1은 완주했지만, 후반부가 provider-contract rejection으로 무너졌다.</h2></div>
      <div class="blockers">${blockerCards(lanes)}</div>
      <div class="two-col" style="margin-top:14px">
        <div class="callout"><p><b>Excluded candidates.</b> ${exclusions.map((item) => `${html(item.model)}: ${html(item.reason)}`).join("<br>")}</p></div>
        <div class="callout good"><p><b>새 signal.</b> Gemini 3.1은 Qwen보다 provider records가 많고 tokens/progress도 높았다. 초반 material chain은 닫았지만, 후반에는 이동 blocker를 풀기 위해 generated action skill을 반복하다 schema contract rejection이 누적됐다.</p></div>
      </div>
    </section>
    <section class="section" id="next">
      <div class="section-title"><p>Next run</p><h2>다음 비교 전에는 provider pacing과 generated action schema를 실험 조건으로 명시한다.</h2></div>
      <div class="panel">
        <table><tbody>
          <tr><th>Keep</th><td><code>natural-village-spawn-v1</code>, fresh world per lane, report visual profile, same three camera modes, run-scoped workspaces.</td></tr>
          <tr><th>Fix before larger comparison</th><td>Generated Mineflayer candidate schema repair, movement blocker recovery, provider pacing as an explicit lane parameter, and final inventory consolidation in summary artifacts.</td></tr>
          <tr><th>Budget rule</th><td>Gemini 3.1 Flash Lite needs pacing under the 250k input-token-per-minute free-tier window. Do not run it unpaced for 30-cycle reports.</td></tr>
          <tr><th>Research use</th><td>This remains a no-regret-core pilot. It shows concrete transition evidence and runtime blockers; it does not prove the Goldilocks prediction layer.</td></tr>
        </tbody></table>
      </div>
    </section>
    <section class="section">
      <div class="section-title"><p>Artifacts</p><h2>Local pointers</h2></div>
      <div class="panel footnotes">
        <p><code>project-docs/Experiments/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/combined-model-comparison-30cycle-analysis.json</code></p>
        <p><code>reports/gemini-3.1-flash-lite-paced.json</code>, <code>reports/gemini-3.1-flash-lite-paced-review.md</code></p>
        <p><code>reports/gemini-3.1-flash-lite.json</code> records the unpaced 6-cycle TPM failure; <code>reports/gemma-4-31b-it-paced.json</code> records the excluded Gemma INVALID_ARGUMENT failure.</p>
      </div>
    </section>
  </main>
</body>
</html>`;
}

const baseAnalysis = await readJson(path.join(base30Dir, "model-comparison-30cycle-analysis.json"));
const lanes = [];
for (const spec of completedLanes) {
  lanes.push(await buildLane({ spec, baseAnalysis }));
}

const preflight = await readJson(path.join(here, "preflight/gemini-runnable-lanes-30cycle-high-estimate.json"));
const gemmaReport = await readJson(path.join(here, "reports/gemma-4-31b-it-paced.json"));
const unpacedGeminiReport = await readJson(path.join(here, "reports/gemini-3.1-flash-lite.json"));
const exclusions = [
  {
    model: "gemini-2.5-flash-lite",
    reason: preflight.results.find((entry) => entry.model === "gemini-2.5-flash-lite")?.reason ?? "blocked by observed RPD cap"
  },
  {
    model: "gemma-4-31b-it",
    reason: `actual provider call failed before cycle 1: ${gemmaReport.provider_error ?? "INVALID_ARGUMENT"}`
  },
  {
    model: "gemini-3.1-flash-lite unpaced",
    reason: `stopped at ${unpacedGeminiReport.cycles?.length ?? 0} cycles on 250k input-token-per-minute quota`
  }
];

const totals = {
  cycles: sum(lanes.map((lane) => lane.cycles)),
  captures: sum(lanes.map((lane) => lane.visual_count)),
  requests: sum(lanes.map((lane) => lane.usage.requests)),
  tokens: sum(lanes.map((lane) => lane.usage.total_tokens)),
  verified: sum(lanes.map((lane) => lane.outcomes.verified_progress ?? 0)),
  verifierPassed: sum(lanes.map((lane) => lane.verifier.passed ?? 0))
};

const combined = {
  schema: "goal-oriented-natural-village-30cycle-model-comparison-with-gemini-extension/v1",
  generated_at: new Date().toISOString(),
  objective: baseAnalysis.objective,
  world: baseAnalysis.world,
  totals,
  runs: lanes.map(({ review_rows, color, note, ...lane }) => lane),
  exclusions,
  caveats: [
    ...baseAnalysis.caveats,
    "Gemini 3.1 Flash Lite completed only with GEMINI_MIN_REQUEST_INTERVAL_MS=15000. The unpaced lane hit Gemini free-tier 250k input-token-per-minute quota at cycle 6.",
    "Gemma 4 31B was request-budget feasible but not harness-compatible in this run; the API returned INVALID_ARGUMENT before cycle 1."
  ]
};

await fs.writeFile(combinedAnalysisPath, `${JSON.stringify(combined, null, 2)}\n`);
const { review_rows: _reviewRows, color: _color, note: _note, ...completedLaneSummary } =
  lanes.find((lane) => lane.id === "gemini-31-flash-lite-paced");
await fs.writeFile(summaryPath, `${JSON.stringify({
  schema: "goal-oriented-natural-village-gemini-30cycle-extension-summary/v1",
  generated_at: combined.generated_at,
  completed_lane: completedLaneSummary,
  excluded_candidates: exclusions,
  static_export: path.relative(repoRoot, staticExportPath)
}, null, 2)}\n`);
await fs.writeFile(staticExportPath, renderHtml({
  lanes,
  totals,
  exclusions,
  generatedAt: combined.generated_at
}));

console.log(JSON.stringify({
  combinedAnalysisPath,
  summaryPath,
  staticExportPath,
  completed_lanes: lanes.map((lane) => lane.id),
  exclusions
}, null, 2));
