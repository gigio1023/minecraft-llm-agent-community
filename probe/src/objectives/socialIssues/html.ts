import type { BorrowedToolIssueReport } from "./types.js";

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pct(score: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((score / max) * 100);
}

function statusClass(status: string) {
  if (status === "passed") return "good";
  if (status === "partial") return "warn";
  return "bad";
}

function dimensionRows(report: BorrowedToolIssueReport) {
  return report.dimensions.map((dimension) => {
    const percent = pct(dimension.score, dimension.weight);
    return `
      <tr>
        <td><strong>${esc(dimension.label)}</strong></td>
        <td class="num">${dimension.score}/${dimension.weight}</td>
        <td>
          <div class="bar"><span style="width:${percent}%"></span></div>
        </td>
        <td>${dimension.findings.map((finding) => `<div>${esc(finding)}</div>`).join("")}</td>
      </tr>
    `;
  }).join("");
}

function turnCards(report: BorrowedToolIssueReport) {
  return report.turns.map((turn) => {
    const decision = turn.decision;
    return `
      <article class="turn ${turn.ok ? "ok" : "failed"}">
        <div class="turn-head">
          <span>Cycle ${turn.cycle}</span>
          <strong>${esc(turn.turn_id)}</strong>
          <span>${esc(turn.actor_id)}</span>
        </div>
        ${decision ? `
          <div class="decision">${esc(decision.decision)}</div>
          <p class="message">${esc(decision.spoken_message)}</p>
          <dl>
            <dt>Expected Minecraft action</dt>
            <dd>${esc(decision.expected_minecraft_action)}</dd>
            <dt>Reasoning summary</dt>
            <dd>${esc(decision.reasoning_summary)}</dd>
            <dt>Obligation</dt>
            <dd>${esc(decision.obligation_update?.kind ?? "none")} / ${esc(decision.obligation_update?.status ?? "none")} ${decision.obligation_update?.summary ? `- ${esc(decision.obligation_update.summary)}` : ""}</dd>
            <dt>Relationship</dt>
            <dd>${esc(decision.relationship_update?.trust_delta ?? "none")} ${decision.relationship_update?.summary ? `- ${esc(decision.relationship_update.summary)}` : ""}</dd>
            <dt>Evidence refs</dt>
            <dd>${decision.evidence_refs_used.map((ref) => `<code>${esc(ref)}</code>`).join(" ")}</dd>
          </dl>
        ` : `
          <p class="message">Provider turn failed: ${esc(turn.error_kind)} ${esc(turn.error_message)}</p>
        `}
      </article>
    `;
  }).join("");
}

function eventRows(report: BorrowedToolIssueReport) {
  return report.events.map((event) => `
    <tr>
      <td class="num">${event.cycle}</td>
      <td>${esc(event.actor_id)}</td>
      <td><strong>${esc(event.type)}</strong></td>
      <td>${esc(event.item_id ?? "")}</td>
      <td>${event.evidence_refs.map((ref) => `<code>${esc(ref)}</code>`).join(" ")}</td>
      <td>${esc(event.notes)}</td>
    </tr>
  `).join("");
}

export function formatBorrowedToolIssueHtml(report: BorrowedToolIssueReport) {
  const scorePercent = pct(report.summary.score, report.summary.max_score);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(report.issue_id)} - Qwen Smoke</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172018;
      --muted: #5f6f63;
      --line: #d7dfd3;
      --paper: #f7f9f4;
      --panel: #ffffff;
      --green: #2f7d45;
      --amber: #ad6b09;
      --red: #b33a2e;
      --blue: #356d9c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--paper);
    }
    header {
      padding: 28px 32px 20px;
      background: #e8efe3;
      border-bottom: 1px solid var(--line);
    }
    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 22px auto 48px;
      display: grid;
      gap: 18px;
    }
    h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 18px; letter-spacing: 0; }
    p { margin: 0; }
    .sub { color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.03);
    }
    .metric .label { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .metric .value { margin-top: 6px; font-size: 24px; font-weight: 700; }
    .metric .value.good { color: var(--green); }
    .metric .value.warn { color: var(--amber); }
    .metric .value.bad { color: var(--red); }
    .score-ring {
      width: 112px;
      height: 112px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: conic-gradient(var(--green) ${scorePercent}%, #dfe6da ${scorePercent}%);
      margin-left: auto;
    }
    .score-ring span {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--panel);
      font-weight: 800;
      font-size: 20px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr 140px;
      gap: 16px;
      align-items: center;
    }
    .callout {
      border-left: 4px solid var(--amber);
      padding: 10px 12px;
      background: #fff7e8;
      color: #5b421d;
      border-radius: 4px;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 10px 8px; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .bar { height: 10px; border-radius: 999px; background: #e1e8dc; overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--green); border-radius: inherit; }
    .turns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .turn { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: #fbfcfa; min-width: 0; }
    .turn.failed { border-color: #e5b1aa; background: #fff7f5; }
    .turn-head { display: flex; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 12px; }
    .decision { margin-top: 12px; font-weight: 800; color: var(--blue); }
    .message { margin-top: 8px; min-height: 44px; }
    dl { margin: 12px 0 0; display: grid; gap: 8px; }
    dt { color: var(--muted); font-size: 12px; }
    dd { margin: 0; }
    code { background: #edf2e9; border: 1px solid #d5ddcf; border-radius: 4px; padding: 1px 4px; white-space: nowrap; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #10170f; color: #eef6e8; padding: 12px; border-radius: 6px; max-height: 360px; overflow: auto; }
    @media (max-width: 860px) {
      header { padding: 22px 18px; }
      .grid, .turns, .hero { grid-template-columns: 1fr; }
      .score-ring { margin-left: 0; }
      table { font-size: 13px; }
      th, td { padding: 8px 6px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${esc(report.issue_id)}</h1>
    <p class="sub">Qwen provider-backed Minecraft social issue smoke. Generated ${esc(report.created_at)}.</p>
  </header>
  <main>
    <section class="panel hero">
      <div>
        <h2>Run Summary</h2>
        <p>This report evaluates a fixed borrowed-tool social issue: Jun needs Mara's stone axe, Mara owns the tool, and the model must handle request, access decision, follow-up, and obligation/relationship continuity.</p>
        <p class="callout" style="margin-top:12px;">Evidence scope is <strong>${esc(report.evidence_scope)}</strong>. No live Minecraft server was started and no physical handoff/use was executed.</p>
      </div>
      <div class="score-ring"><span>${scorePercent}%</span></div>
    </section>

    <section class="grid">
      <div class="panel metric"><div class="label">Status</div><div class="value ${statusClass(report.summary.status)}">${esc(report.summary.status)}</div></div>
      <div class="panel metric"><div class="label">Score</div><div class="value">${report.summary.score}/${report.summary.max_score}</div></div>
      <div class="panel metric"><div class="label">Provider Calls</div><div class="value">${report.provider.live_provider_calls}</div></div>
      <div class="panel metric"><div class="label">Total Tokens</div><div class="value">${report.summary.usage.total_tokens}</div></div>
    </section>

    <section class="panel">
      <h2>Issue State</h2>
      <table>
        <tbody>
          ${report.issue.world_state.map((line) => `<tr><td>${esc(line)}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Score Dimensions</h2>
      <table>
        <thead><tr><th>Dimension</th><th class="num">Score</th><th>Scale</th><th>Findings</th></tr></thead>
        <tbody>${dimensionRows(report)}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Decision Timeline</h2>
      <div class="turns">${turnCards(report)}</div>
    </section>

    <section class="panel">
      <h2>Event Ledger</h2>
      <table>
        <thead><tr><th class="num">Cycle</th><th>Actor</th><th>Event</th><th>Item</th><th>Evidence</th><th>Notes</th></tr></thead>
        <tbody>${eventRows(report)}</tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Provider Usage</h2>
      <table>
        <tbody>
          <tr><th>Provider</th><td>${esc(report.provider.id)}</td></tr>
          <tr><th>Model</th><td>${esc(report.provider.model)}</td></tr>
          <tr><th>Requests</th><td>${report.summary.usage.requests}</td></tr>
          <tr><th>Input tokens</th><td>${report.summary.usage.input_tokens}</td></tr>
          <tr><th>Output tokens</th><td>${report.summary.usage.output_tokens}</td></tr>
          <tr><th>Total elapsed</th><td>${report.summary.total_elapsed_ms} ms</td></tr>
        </tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Raw Report</h2>
      <pre>${esc(JSON.stringify(report, null, 2))}</pre>
    </section>
  </main>
</body>
</html>
`;
}
