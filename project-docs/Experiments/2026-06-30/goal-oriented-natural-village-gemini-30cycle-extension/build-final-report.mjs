#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../..");
const comparisonPath = path.join(here, "combined-model-comparison-30cycle-analysis.json");
const finalExportPath = path.join(
  repoRoot,
  "project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html"
);
const currentExportPath = path.join(
  repoRoot,
  "project-docs/static-exports/no-regret-core-qwen-ambassador-report-2026-06-29.html"
);

const reviewPaths = {
  "qwen-plus": path.join(
    repoRoot,
    "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus-review-summary.json"
  ),
  "qwen-max": path.join(
    repoRoot,
    "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max-review-summary.json"
  ),
  "gpt54-mini": path.join(
    repoRoot,
    "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/gpt-5.4-mini-review-summary.json"
  ),
  "gemini-31-flash-lite-paced": path.join(here, "reports/gemini-3.1-flash-lite-paced-review-summary.json")
};

const imageDirs = {
  "qwen-plus": path.join(
    repoRoot,
    "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/screenshots/report-html/qwen-plus"
  ),
  "qwen-max": path.join(
    repoRoot,
    "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/screenshots/report-html/qwen-max"
  ),
  "gpt54-mini": path.join(
    repoRoot,
    "project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/screenshots/report-html/gpt-5-4-mini"
  ),
  "gemini-31-flash-lite-paced": path.join(here, "screenshots/report-html/gemini-31-flash-lite-paced")
};

const imageNames = [
  ["start", "initial-initial-third-person-high.png", "start high"],
  ["c10", "cycle-0010-cycle-end-third-person-follow.png", "cycle 10 follow"],
  ["c20", "cycle-0020-cycle-end-third-person-follow.png", "cycle 20 follow"],
  ["finalFirst", "cycle-0030-cycle-end-first-person.png", "final first-person"],
  ["finalFollow", "cycle-0030-cycle-end-third-person-follow.png", "final follow"],
  ["finalHigh", "cycle-0030-cycle-end-third-person-high.png", "final high"]
];

const laneCopy = {
  "qwen-plus": {
    verdict: "안정적인 초반 제작 사슬. 후반 이동 루프가 남았다.",
    material: "crafting table evidence, wooden pickaxe, retained wood inventory",
    risk: "movement-heavy recovery repeated after workbench setup",
    accent: "#2f7d57"
  },
  "qwen-max": {
    verdict: "가장 깊은 material progress. 시각 증거는 caveat와 함께 읽어야 한다.",
    material: "wooden pickaxe, 6 cobblestone, dirt continuation",
    risk: "final follow/high camera cross-section artifact",
    accent: "#7a6f2f"
  },
  "gpt54-mini": {
    verdict: "완주는 했지만 요청 수가 컸고 table placement evidence가 약했다.",
    material: "logs, planks, stairs, crafting table held",
    risk: "high provider records per verified progress",
    accent: "#2f6f86"
  },
  "gemini-31-flash-lite-paced": {
    verdict: "pacing 후 완주. 초반 table chain은 닫았지만 후반 blocker가 컸다.",
    material: "placed table evidence, retained planks/sticks",
    risk: "requires GEMINI_MIN_REQUEST_INTERVAL_MS=15000; late provider-contract rejection",
    accent: "#7b5fa8"
  }
};

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fmt(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function compact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return fmt(value);
}

function pct(value, max, digits = 0) {
  if (!max) return "0";
  return ((value / max) * 100).toFixed(digits);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function dataUri(file) {
  const bytes = await fs.readFile(file);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function outcomeTotals(lane) {
  const verified = lane.outcomes.verified_progress ?? 0;
  const blocked = lane.outcomes.blocked ?? 0;
  const noProgress = lane.outcomes.no_progress ?? Math.max(0, (lane.cycles ?? 30) - verified - blocked);
  return { verified, blocked, noProgress, total: lane.cycles ?? 30 };
}

function outcomeClass(row) {
  if (row.judgment_outcome === "verified_progress") return "ok";
  if (row.judgment_outcome === "blocked") return "bad";
  return "idle";
}

function topActions(actionCounts) {
  return Object.entries(actionCounts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function checklistSummary(checklist) {
  const labels = {
    crafting_table_known_or_placed: "crafting table",
    starter_shelter_verified: "starter shelter",
    shared_storage_contribution: "shared storage",
    memory_or_judgment_persisted: "memory/judgment",
    recent_blockers_summarized: "blocker summary"
  };
  return Object.entries(labels).map(([key, label]) => ({
    label,
    status: checklist?.[key] ?? "pending"
  }));
}

function metricCard(label, value, note) {
  return `<div class="metric">
    <span>${html(label)}</span>
    <strong>${html(value)}</strong>
    <em>${html(note)}</em>
  </div>`;
}

function laneCard(lane) {
  const totals = outcomeTotals(lane);
  const copy = laneCopy[lane.id];
  return `<article class="lane-card" style="--accent:${copy.accent}">
    <div class="lane-top">
      <div>
        <span class="provider">${html(lane.provider_id)}</span>
        <h3>${html(lane.label)}</h3>
        <code>${html(lane.model)}</code>
      </div>
      <strong class="score">${html(totals.verified)}<small>/30</small></strong>
    </div>
    <p class="verdict">${html(copy.verdict)}</p>
    <div class="stack" aria-label="${html(lane.label)} outcomes">
      <i class="ok" style="width:${pct(totals.verified, totals.total)}%"></i>
      <i class="bad" style="width:${pct(totals.blocked, totals.total)}%"></i>
      <i class="idle" style="width:${pct(totals.noProgress, totals.total)}%"></i>
    </div>
    <div class="lane-facts">
      <b>${html(totals.verified)}</b><span>verified</span>
      <b>${html(totals.blocked)}</b><span>blocked</span>
      <b>${html(compact(lane.usage.total_tokens))}</b><span>tokens</span>
      <b>${html(lane.usage.requests)}</b><span>requests</span>
    </div>
    <dl>
      <dt>material evidence</dt><dd>${html(copy.material)}</dd>
      <dt>final inventory</dt><dd>${html(lane.inventory_text)}</dd>
      <dt>main caveat</dt><dd>${html(copy.risk)}</dd>
    </dl>
  </article>`;
}

function barRows(lanes, key, max, unit = "") {
  return lanes.map((lane) => {
    const value = key(lane);
    return `<div class="bar-row" style="--accent:${laneCopy[lane.id].accent}">
      <b>${html(lane.short ?? lane.label)}</b>
      <div class="bar"><i style="width:${pct(value, max)}%"></i></div>
      <span>${html(compact(value))}${html(unit)}</span>
    </div>`;
  }).join("");
}

function timeline(lane) {
  const rows = lane.rows ?? [];
  return `<div class="timeline-row">
    <b>${html(lane.short ?? lane.label)}</b>
    <div class="timeline">
      ${rows.map((row, index) => `<span class="tick ${outcomeClass(row)}" title="${html(`${row.cycle_id}: ${row.primitive_or_skill} / ${row.judgment_outcome}`)}">${String(index + 1).padStart(2, "0")}</span>`).join("")}
    </div>
  </div>`;
}

function actionFootprint(lane) {
  const max = Math.max(1, ...topActions(lane.action_counts).map(([, count]) => count));
  return `<article class="action-card" style="--accent:${laneCopy[lane.id].accent}">
    <h3>${html(lane.label)}</h3>
    ${topActions(lane.action_counts).map(([name, count]) => `<div class="mini-bar">
      <code>${html(name)}</code>
      <i style="width:${pct(count, max)}%"></i>
      <span>${html(count)}</span>
    </div>`).join("")}
  </article>`;
}

function visualLane(lane) {
  const caveat = lane.caveat ? `
    <p class="caveat">${html(lane.caveat)}</p>` : "";
  return `<article class="visual-lane">
    <div class="visual-head">
      <div>
        <span>${html(lane.label)}</span>
        <h3>${html(lane.milestones)}</h3>
      </div>
      <b>${html(lane.visual_count)} captures</b>
    </div>
    <div class="shots">
      ${imageNames.map(([key, , label]) => `<figure>
        <img src="${lane.images[key]}" alt="${html(`${lane.label} ${label} screenshot`)}">
        <figcaption>${html(label)}</figcaption>
      </figure>`).join("")}
    </div>${caveat}
  </article>`;
}

function checklistGrid(lanes) {
  return `<div class="checklist-grid">
    ${lanes.map((lane) => `<article style="--accent:${laneCopy[lane.id].accent}">
      <h3>${html(lane.label)}</h3>
      ${checklistSummary(lane.checklist).map((item) => `<p class="${item.status === "satisfied" ? "yes" : "pending"}"><b>${html(item.label)}</b><span>${html(item.status)}</span></p>`).join("")}
    </article>`).join("")}
  </div>`;
}

function exclusionList(exclusions) {
  return exclusions.map((item) => `<li><b>${html(item.model)}</b><span>${html(item.reason)}</span></li>`).join("");
}

function render({ comparison, lanes }) {
  const maxTokens = Math.max(...lanes.map((lane) => lane.usage.total_tokens));
  const maxRequests = Math.max(...lanes.map((lane) => lane.usage.requests));
  const maxVerified = Math.max(...lanes.map((lane) => outcomeTotals(lane).verified));
  const maxTokensPerProgress = Math.max(
    ...lanes.map((lane) => lane.usage.total_tokens / Math.max(1, outcomeTotals(lane).verified))
  );
  const heroLane = lanes.find((lane) => lane.id === "gemini-31-flash-lite-paced") ?? lanes[0];
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Natural Village Model Comparison Final Report</title>
  <style>
    :root {
      --paper:#f5f0e4;
      --paper-2:#fbf7ed;
      --ink:#20251f;
      --muted:#667061;
      --line:#c9bea8;
      --grass:#2f7d57;
      --water:#2f6f86;
      --gold:#b9852e;
      --red:#9b463b;
      --stone:#7e817b;
      color-scheme:light;
    }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body {
      margin:0;
      background:
        linear-gradient(rgba(32,37,31,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(32,37,31,.035) 1px, transparent 1px),
        var(--paper);
      background-size:24px 24px;
      color:var(--ink);
      font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height:1.45;
    }
    a { color:inherit; }
    code { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:.93em; }
    .page { width:min(1320px, calc(100vw - 40px)); margin:0 auto; padding:28px 0 54px; }
    .topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-bottom:18px; border-bottom:3px solid var(--ink); color:var(--muted); font-size:14px; }
    .nav { display:flex; gap:7px; flex-wrap:wrap; justify-content:flex-end; }
    .nav a { border:1px solid var(--line); background:rgba(251,247,237,.82); border-radius:999px; padding:6px 10px; text-decoration:none; }
    .hero { display:grid; grid-template-columns:minmax(0,.92fr) minmax(480px,1.08fr); gap:28px; padding:28px 0 30px; align-items:start; }
    .kicker,.eyebrow,.metric span,.provider,.section-title span,.visual-head span { display:block; color:var(--grass); font-size:12px; font-weight:850; letter-spacing:0; text-transform:uppercase; }
    h1,h2,h3,p { margin:0; }
    h1 { font-size:clamp(42px,7vw,82px); line-height:.98; letter-spacing:0; max-width:820px; }
    h2 { font-size:clamp(28px,3.2vw,44px); line-height:1.08; letter-spacing:0; }
    h3 { font-size:19px; line-height:1.18; letter-spacing:0; }
    .lead { margin-top:18px; max-width:760px; font-size:18px; color:#3d443b; }
    .claim-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:22px; }
    .claim { border:1px solid var(--line); background:rgba(251,247,237,.86); border-radius:8px; padding:14px; }
    .claim b { display:block; margin-top:6px; font-size:18px; }
    .hero-image { border:1px solid #7f755f; background:#d8e2d1; min-height:440px; overflow:hidden; position:relative; }
    .hero-image img { display:block; width:100%; height:100%; min-height:440px; object-fit:cover; }
    .chips { position:absolute; left:12px; right:12px; bottom:12px; display:flex; gap:8px; flex-wrap:wrap; }
    .chip { border:1px solid rgba(32,37,31,.2); background:rgba(251,247,237,.9); color:#263027; border-radius:999px; padding:5px 9px; font-size:12px; font-weight:800; }
    .chip.good { color:#205b3a; background:rgba(47,125,87,.18); border-color:rgba(47,125,87,.42); }
    .chip.warn { color:#79342c; background:rgba(155,70,59,.15); border-color:rgba(155,70,59,.38); }
    .metrics { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; margin-top:22px; }
    .metric { border:1px solid var(--line); background:rgba(251,247,237,.88); border-radius:8px; padding:13px; min-width:0; }
    .metric strong { display:block; margin-top:7px; font-size:27px; line-height:1; font-variant-numeric:tabular-nums; }
    .metric em { display:block; margin-top:7px; color:var(--muted); font-size:12px; font-style:normal; }
    section { border-top:1px solid var(--line); padding:34px 0; }
    .section-title { display:grid; grid-template-columns:180px minmax(0,1fr); gap:24px; align-items:start; margin-bottom:18px; }
    .lane-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .lane-card,.panel,.visual-lane,.action-card,.checklist-grid article,.note { border:1px solid var(--line); background:rgba(251,247,237,.9); border-radius:8px; }
    .lane-card { padding:16px; border-top:5px solid var(--accent); min-width:0; }
    .lane-top { display:flex; justify-content:space-between; gap:14px; align-items:flex-start; min-width:0; }
    .lane-top code { display:block; margin-top:5px; color:var(--muted); word-break:break-word; }
    .score { min-width:76px; text-align:right; font-size:42px; line-height:1; color:var(--accent); font-variant-numeric:tabular-nums; }
    .score small { color:var(--muted); font-size:16px; }
    .verdict { margin-top:12px; color:#3f463d; font-size:14px; min-height:42px; }
    .stack { display:flex; height:16px; border-radius:999px; overflow:hidden; margin:16px 0 12px; border:1px solid rgba(32,37,31,.16); background:#e7dec8; }
    .stack i { display:block; height:100%; }
    .ok { background:var(--grass); }
    .bad { background:var(--red); }
    .idle { background:#b8ab8f; }
    .lane-facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; }
    .lane-facts b,.lane-facts span { display:block; border:1px solid rgba(32,37,31,.12); background:rgba(255,255,255,.34); padding:7px; min-width:0; }
    .lane-facts b { border-bottom:0; border-radius:6px 6px 0 0; font-size:18px; font-variant-numeric:tabular-nums; }
    .lane-facts span { border-radius:0 0 6px 6px; color:var(--muted); font-size:11px; margin-top:-7px; }
    dl { margin:14px 0 0; display:grid; gap:8px; }
    dt { color:var(--muted); font-size:12px; font-weight:850; text-transform:uppercase; }
    dd { margin:0; color:#3d443b; font-size:13px; overflow-wrap:anywhere; }
    .two-col { display:grid; grid-template-columns:minmax(0,1fr) minmax(360px,.72fr); gap:14px; align-items:start; }
    .panel { padding:16px; }
    .panel h3 { margin-bottom:12px; }
    .bar-row { display:grid; grid-template-columns:126px minmax(0,1fr) 78px; gap:10px; align-items:center; font-size:13px; margin-top:10px; }
    .bar-row b { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bar { height:14px; border:1px solid rgba(32,37,31,.16); background:#e6dcc7; border-radius:999px; overflow:hidden; }
    .bar i { display:block; height:100%; background:var(--accent); }
    .timeline-block { display:grid; gap:13px; }
    .timeline-row { display:grid; grid-template-columns:130px minmax(0,1fr); gap:12px; align-items:center; }
    .timeline { display:grid; grid-template-columns:repeat(30,minmax(12px,1fr)); gap:3px; min-width:0; }
    .tick { min-height:25px; border-radius:4px; border:1px solid rgba(32,37,31,.14); display:flex; align-items:center; justify-content:center; font-size:10px; color:rgba(32,37,31,.72); font-variant-numeric:tabular-nums; }
    .tick.ok { background:rgba(47,125,87,.25); border-color:rgba(47,125,87,.34); }
    .tick.bad { background:rgba(155,70,59,.23); border-color:rgba(155,70,59,.34); }
    .tick.idle { background:rgba(184,171,143,.35); }
    .legend { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; color:var(--muted); font-size:12px; }
    .legend i { display:inline-block; width:13px; height:13px; border-radius:3px; border:1px solid rgba(32,37,31,.14); vertical-align:-2px; margin-right:4px; }
    .visual-stack { display:grid; gap:16px; }
    .visual-lane { padding:15px; overflow:hidden; }
    .visual-head { display:flex; justify-content:space-between; gap:14px; align-items:flex-start; margin-bottom:12px; }
    .visual-head b { color:var(--muted); white-space:nowrap; font-size:13px; }
    .shots { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
    figure { margin:0; border:1px solid var(--line); background:var(--paper-2); border-radius:7px; overflow:hidden; min-width:0; }
    figure img { display:block; width:100%; aspect-ratio:16/9; object-fit:cover; background:#d8e1d0; }
    figcaption { padding:6px 7px; color:var(--muted); font-size:12px; font-weight:700; }
    .caveat { margin-top:10px; color:#73372f; font-size:13px; }
    .action-grid,.checklist-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .action-card,.checklist-grid article { padding:15px; border-top:4px solid var(--accent); }
    .mini-bar { display:grid; grid-template-columns:minmax(0,1fr) 60px 24px; gap:8px; align-items:center; margin-top:10px; }
    .mini-bar code { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .mini-bar i { display:block; height:10px; background:var(--accent); border-radius:999px; }
    .mini-bar span { color:var(--muted); text-align:right; font-variant-numeric:tabular-nums; }
    .checklist-grid p { display:flex; justify-content:space-between; gap:10px; border-top:1px solid rgba(32,37,31,.1); padding-top:8px; margin-top:8px; font-size:13px; }
    .checklist-grid span { color:var(--muted); }
    .checklist-grid .yes b { color:var(--grass); }
    .checklist-grid .pending b { color:#805d1e; }
    .notes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .note { padding:16px; }
    .note h3 { margin-bottom:8px; }
    .note p,.note li { color:#3e463d; font-size:14px; }
    .note ul { margin:0; padding-left:18px; }
    .note li + li { margin-top:8px; }
    .excluded { margin:0; padding-left:18px; }
    .excluded li + li { margin-top:9px; }
    .excluded span { display:block; color:#3f463d; }
    footer { border-top:3px solid var(--ink); padding-top:18px; color:var(--muted); font-size:13px; }
    @media (max-width:1180px) {
      .hero,.two-col { grid-template-columns:1fr; }
      .lane-grid,.action-grid,.checklist-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .metrics { grid-template-columns:repeat(3,minmax(0,1fr)); }
      .shots { grid-template-columns:repeat(3,minmax(0,1fr)); }
    }
    @media (max-width:760px) {
      .page { width:min(100vw - 24px, 1320px); padding-top:18px; }
      .topbar { align-items:flex-start; flex-direction:column; }
      h1 { font-size:42px; }
      .claim-grid,.metrics,.lane-grid,.action-grid,.checklist-grid,.notes { grid-template-columns:1fr; }
      .section-title { grid-template-columns:1fr; gap:8px; }
      .hero-image,.hero-image img { min-height:260px; }
      .hero-image { order:-1; }
      .timeline-row { grid-template-columns:1fr; }
      .timeline { overflow-x:auto; grid-template-columns:repeat(30,24px); padding-bottom:4px; }
      .shots { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .bar-row { grid-template-columns:96px minmax(0,1fr) 64px; }
    }
    @media print {
      body { background:var(--paper); }
      .nav { display:none; }
      section { break-inside:avoid; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <p>Final report · natural village model comparison · 2026-06-30</p>
      <nav class="nav" aria-label="Report sections">
        <a href="#summary">Summary</a>
        <a href="#models">Models</a>
        <a href="#metrics">Metrics</a>
        <a href="#visuals">Visuals</a>
        <a href="#decision">Decision</a>
      </nav>
    </div>

    <header class="hero" id="summary">
      <div>
        <p class="kicker">Minecraft natural village · report-grade visual evidence</p>
        <h1>같은 마을 스폰에서 모델이 실제로 이어간 행동을 비교한다</h1>
        <p class="lead">이 리포트는 일반 모델 벤치마크가 아니다. 자연 마을 근처 fresh world에서 30 cycles 동안 로그 수집, 제작, 작업대 배치, 이동 복구가 얼마나 runtime evidence로 남았는지 비교한다. 스크린샷은 review-only evidence이고, 평가는 verifier와 실행 로그를 기준으로 한다.</p>
        <div class="claim-grid">
          <div class="claim"><span class="eyebrow">object</span><b>goal-oriented physical competence + continuity</b></div>
          <div class="claim"><span class="eyebrow">not counted</span><b>self-declared progress, pretty screenshots, prose-only success</b></div>
          <div class="claim"><span class="eyebrow">scenario</span><b>${html(comparison.world.scenario)} · seed ${html(comparison.world.seed)}</b></div>
          <div class="claim"><span class="eyebrow">visual rule</span><b>server ${html(comparison.world.server_version)} · first/follow/high every cycle</b></div>
        </div>
        <div class="metrics">
          ${metricCard("completed lanes", lanes.length, "Qwen, OpenAI, Gemini")}
          ${metricCard("cycles", fmt(comparison.totals.cycles), "30 per completed lane")}
          ${metricCard("visual captures", fmt(comparison.totals.captures), "report profile")}
          ${metricCard("verified progress", fmt(comparison.totals.verified), "review outcome")}
          ${metricCard("provider records", fmt(comparison.totals.requests), `${compact(comparison.totals.tokens)} tokens`)}
        </div>
      </div>
      <aside class="hero-image">
        <img src="${heroLane.images.finalFollow}" alt="Gemini 3.1 Flash Lite final third-person follow Minecraft screenshot">
        <div class="chips">
          <span class="chip good">visual audit passed</span>
          <span class="chip">fresh world per lane</span>
          <span class="chip warn">screenshots are review-only</span>
        </div>
      </aside>
    </header>

    <section id="models">
      <div class="section-title">
        <span>Model lanes</span>
        <h2>Qwen Max가 material depth는 가장 깊고, Gemini 3.1은 pacing 후 완주했다.</h2>
      </div>
      <div class="lane-grid">
        ${lanes.map(laneCard).join("")}
      </div>
    </section>

    <section id="metrics">
      <div class="section-title">
        <span>Metrics</span>
        <h2>비교 기준은 progress, blocker, provider cost, action footprint를 분리해서 본다.</h2>
      </div>
      <div class="two-col">
        <div class="panel">
          <h3>30-cycle outcome timeline</h3>
          <div class="timeline-block">
            ${lanes.map(timeline).join("")}
          </div>
          <div class="legend">
            <span><i class="ok"></i>verified progress</span>
            <span><i class="bad"></i>blocked</span>
            <span><i class="idle"></i>no progress / not applicable</span>
          </div>
        </div>
        <div class="panel">
          <h3>Cost and progress</h3>
          <div class="bar-group">
            <p class="eyebrow">verified progress</p>
            ${barRows(lanes, (lane) => outcomeTotals(lane).verified, maxVerified)}
          </div>
          <div class="bar-group">
            <p class="eyebrow">provider records</p>
            ${barRows(lanes, (lane) => lane.usage.requests, maxRequests)}
          </div>
          <div class="bar-group">
            <p class="eyebrow">tokens per verified progress</p>
            ${barRows(lanes, (lane) => Math.round(lane.usage.total_tokens / Math.max(1, outcomeTotals(lane).verified)), maxTokensPerProgress)}
          </div>
          <div class="bar-group">
            <p class="eyebrow">total tokens</p>
            ${barRows(lanes, (lane) => lane.usage.total_tokens, maxTokens)}
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="section-title">
        <span>Action footprint</span>
        <h2>후반 실패는 모델 하나의 문제가 아니라 action surface와 recovery contract를 같이 드러낸다.</h2>
      </div>
      <div class="action-grid">
        ${lanes.map(actionFootprint).join("")}
      </div>
    </section>

    <section id="visuals">
      <div class="section-title">
        <span>Visual evidence</span>
        <h2>이미지는 파일 안에 embed했다. 경로가 깨져도 리포트 본문 이미지는 깨지지 않는다.</h2>
      </div>
      <div class="visual-stack">
        ${lanes.map(visualLane).join("")}
      </div>
    </section>

    <section>
      <div class="section-title">
        <span>Settlement checklist</span>
        <h2>작업대와 memory는 대체로 닫혔지만 shelter와 shared storage는 아직 아니다.</h2>
      </div>
      ${checklistGrid(lanes)}
    </section>

    <section id="decision">
      <div class="section-title">
        <span>Decision</span>
        <h2>다음 실험은 모델 순위보다 recovery target을 줄여야 한다.</h2>
      </div>
      <div class="notes">
        <article class="note">
          <h3>What this run supports</h3>
          <p>30-cycle goal-oriented lane은 자연 마을 스폰에서도 material chain, movement blocker, cost friction을 분리해서 볼 수 있다. Qwen Max는 material depth가 좋았고, Gemini 3.1은 paced 조건에서 비교군에 들어갈 수 있다.</p>
        </article>
        <article class="note">
          <h3>What it does not prove</h3>
          <p>이 결과는 모델 일반 능력 순위가 아니다. actor prompt, generated action skill, movement verifier, crafting contract, provider retry가 같이 섞인 harness-level 결과다.</p>
        </article>
        <article class="note">
          <h3>Next concrete target</h3>
          <p>다음 lane은 “작업대 설치 후 안전한 village-adjacent work point 유지”처럼 좁히는 편이 낫다. shelter까지 한 번에 요구하면 movement와 placement failure가 분석을 흐린다.</p>
        </article>
      </div>
      <div class="note" style="margin-top:12px">
        <h3>Excluded candidates</h3>
        <ul class="excluded">
          ${exclusionList(comparison.exclusions)}
        </ul>
      </div>
    </section>

    <footer>
      <p>Generated from <code>${html(path.relative(repoRoot, comparisonPath))}</code>. Images are embedded as data URIs. Runtime block identity and progress claims come from verifier/log artifacts, not pixels alone.</p>
    </footer>
  </main>
</body>
</html>
`;
}

const comparison = await readJson(comparisonPath);
const lanes = [];
for (const lane of comparison.runs) {
  const review = await readJson(reviewPaths[lane.id]);
  const images = {};
  for (const [key, fileName] of imageNames) {
    images[key] = await dataUri(path.join(imageDirs[lane.id], fileName));
  }
  lanes.push({
    ...lane,
    rows: review.rows,
    action_counts: lane.action_counts ?? review.primitive_counts,
    images
  });
}

const output = render({ comparison, lanes });
await fs.writeFile(finalExportPath, output);
await fs.writeFile(currentExportPath, output);

console.log(JSON.stringify({
  finalExportPath,
  currentExportPath,
  lanes: lanes.map((lane) => lane.id),
  embeddedImages: lanes.length * imageNames.length,
  bytes: Buffer.byteLength(output, "utf8")
}, null, 2));
