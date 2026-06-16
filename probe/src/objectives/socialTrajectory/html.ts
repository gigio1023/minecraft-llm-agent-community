import type { GroundedSocialTrajectoryReport } from "./types.js";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusClass(status: GroundedSocialTrajectoryReport["summary"]["status"]) {
  if (status === "passed") {
    return "passed";
  }
  if (status === "partial") {
    return "partial";
  }
  return "failed";
}

function metric(label: string, value: unknown, sub = "") {
  return `<section class="metric"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value">${escapeHtml(value)}</div><div class="metric-sub">${escapeHtml(sub)}</div></section>`;
}

function dimensionRows(report: GroundedSocialTrajectoryReport) {
  return report.dimensions
    .map(
      (dimension) => `<tr>
        <td>${escapeHtml(dimension.label)}</td>
        <td>${escapeHtml(`${dimension.score}/${dimension.weight}`)}</td>
        <td>${dimension.passed ? "pass" : "partial/fail"}</td>
        <td>${escapeHtml(dimension.evidence_event_ids.join(", ") || "none")}</td>
        <td>${escapeHtml(dimension.findings.join(" "))}</td>
      </tr>`
    )
    .join("");
}

function harnessRows(report: GroundedSocialTrajectoryReport) {
  return report.harness_audit.dimensions
    .map(
      (dimension) => `<tr>
        <td>${escapeHtml(dimension.label)}</td>
        <td>${escapeHtml(`${dimension.score}/${dimension.weight}`)}</td>
        <td>${dimension.passed ? "pass" : "partial/fail"}</td>
        <td>${escapeHtml(dimension.evidence_event_ids.join(", ") || "none")}</td>
        <td>${escapeHtml(dimension.findings.join(" "))}</td>
      </tr>`
    )
    .join("");
}

function actorCards(report: GroundedSocialTrajectoryReport) {
  return report.actors
    .map(
      (actor) => `<section class="actor">
        <div class="actor-role">${escapeHtml(actor.role)}</div>
        <h3>${escapeHtml(actor.actor_id)}</h3>
        <p>${escapeHtml(actor.life_goal)}</p>
      </section>`
    )
    .join("");
}

function eventRows(report: GroundedSocialTrajectoryReport) {
  return report.events
    .map(
      (event) => `<tr>
        <td>${escapeHtml(event.cycle)}</td>
        <td>${escapeHtml(event.actor_id)}</td>
        <td><span class="type">${escapeHtml(event.type)}</span></td>
        <td>${escapeHtml(event.target_actor_id ?? "")}</td>
        <td>${escapeHtml(event.item_id ?? "")}${event.count ? ` x${escapeHtml(event.count)}` : ""}</td>
        <td>${escapeHtml(event.container_id ?? "")}</td>
        <td>${escapeHtml(event.evidence_refs.join(", "))}</td>
        <td>${escapeHtml(event.notes ?? "")}</td>
      </tr>`
    )
    .join("");
}

function timeline(report: GroundedSocialTrajectoryReport) {
  const maxCycle = Math.max(1, ...report.events.map((event) => event.cycle));
  return report.events
    .map((event) => {
      const left = (event.cycle / maxCycle) * 100;
      return `<div class="timeline-event" style="left: calc(${left.toFixed(2)}% - 8px)">
        <span class="dot"></span>
        <span class="timeline-label">${escapeHtml(event.type.replaceAll("_", " "))}<br><small>${escapeHtml(event.actor_id)}</small></span>
      </div>`;
    })
    .join("");
}

export function formatGroundedSocialTrajectoryHtml(report: GroundedSocialTrajectoryReport) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Grounded Social Trajectory Smoke</title>
  <style>
    :root {
      --bg: #f6f4ef;
      --ink: #20231f;
      --muted: #60665f;
      --line: #d6d2c8;
      --panel: #ffffff;
      --green: #287a42;
      --amber: #a76514;
      --red: #a43b35;
      --blue: #315b96;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 20px;
      margin-bottom: 22px;
    }
    h1, h2, h3 { margin: 0; letter-spacing: 0; }
    h1 { font-size: 30px; }
    h2 { font-size: 20px; margin: 28px 0 12px; }
    p { margin: 8px 0; }
    code { background: #ece8dd; padding: 2px 5px; border-radius: 4px; }
    .muted { color: var(--muted); }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 5px 10px;
      background: var(--panel);
      margin: 10px 8px 0 0;
      font-size: 13px;
    }
    .status {
      color: white;
      border: 0;
    }
    .status.passed { background: var(--green); }
    .status.partial { background: var(--amber); }
    .status.failed { background: var(--red); }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin: 18px 0;
    }
    .metric, .actor {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    .metric-label, .actor-role {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      margin-top: 4px;
    }
    .metric-sub {
      min-height: 18px;
      color: var(--muted);
      font-size: 13px;
    }
    .actors {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .actor h3 { font-size: 20px; margin-top: 4px; }
    .timeline {
      position: relative;
      height: 130px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      margin: 14px 0 22px;
      overflow: hidden;
    }
    .timeline::before {
      content: "";
      position: absolute;
      left: 20px;
      right: 20px;
      top: 46px;
      height: 2px;
      background: var(--line);
    }
    .timeline-event {
      position: absolute;
      top: 38px;
      width: 120px;
    }
    .dot {
      display: block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--blue);
      border: 3px solid white;
      box-shadow: 0 0 0 1px var(--line);
    }
    .timeline-label {
      display: block;
      margin-top: 8px;
      font-size: 12px;
      color: var(--ink);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    th, td {
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid var(--line);
      padding: 10px;
      font-size: 13px;
    }
    th {
      background: #e9e5dc;
      color: #33362f;
      font-weight: 650;
    }
    tr:last-child td { border-bottom: 0; }
    .type {
      display: inline-block;
      color: var(--blue);
      font-weight: 650;
    }
    .notes {
      background: #fff9e6;
      border: 1px solid #ead79c;
      border-radius: 8px;
      padding: 12px 14px;
    }
    @media (max-width: 720px) {
      main { padding: 24px 12px; }
      h1 { font-size: 24px; }
      table { display: block; overflow-x: auto; }
      .timeline { overflow-x: auto; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Grounded Social Trajectory Smoke</h1>
      <p class="muted">Provider-free evidence-ledger smoke for social simulation scoring.</p>
      <span class="pill status ${statusClass(report.summary.status)}">${escapeHtml(report.summary.status)}</span>
      <span class="pill status ${statusClass(report.harness_audit.summary.status)}">harness ${escapeHtml(report.harness_audit.summary.status)}</span>
      <span class="pill">scenario: ${escapeHtml(report.scenario_id)}</span>
      <span class="pill">provider calls: ${escapeHtml(report.provider.live_provider_calls)}</span>
      <span class="pill">live server: ${escapeHtml(report.environment.live_minecraft_server)}</span>
    </header>

    <section class="metrics">
      ${metric("Score", `${report.summary.score}/${report.summary.max_score}`, "80+ passes the smoke")}
      ${metric("Harness", `${report.harness_audit.summary.score}/${report.harness_audit.summary.max_score}`, "Project Sid absorption audit")}
      ${metric("Events", report.summary.event_count, "ordered social ledger")}
      ${metric("Evidence Refs", report.summary.evidence_ref_count, "refs attached to claims")}
      ${metric("First Shared Contribution", report.summary.first_shared_contribution_cycle ?? "none", "cycle")}
      ${metric("First Cross-Actor Use", report.summary.first_cross_actor_consumption_cycle ?? "none", "cycle")}
    </section>

    <section class="notes">
      ${report.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
    </section>

    <h2>Actors</h2>
    <section class="actors">${actorCards(report)}</section>

    <h2>Social Chain</h2>
    <section class="timeline">${timeline(report)}</section>

    <h2>Score Dimensions</h2>
    <table>
      <thead><tr><th>Dimension</th><th>Score</th><th>Status</th><th>Evidence Events</th><th>Finding</th></tr></thead>
      <tbody>${dimensionRows(report)}</tbody>
    </table>

    <h2>Harness Audit</h2>
    <table>
      <thead><tr><th>Dimension</th><th>Score</th><th>Status</th><th>Evidence Events</th><th>Finding</th></tr></thead>
      <tbody>${harnessRows(report)}</tbody>
    </table>

    <h2>Event Ledger</h2>
    <table>
      <thead><tr><th>Cycle</th><th>Actor</th><th>Type</th><th>Target</th><th>Item</th><th>Container</th><th>Evidence Refs</th><th>Notes</th></tr></thead>
      <tbody>${eventRows(report)}</tbody>
    </table>
  </main>
</body>
</html>
`;
}
