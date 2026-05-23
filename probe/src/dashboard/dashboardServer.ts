import { watch, type Dirent, type FSWatcher } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Elysia } from "elysia";
import type { DashboardRuntimeEvent } from "./runtimeEvents.js";

type JsonRecord = Record<string, unknown>;
type JsonEntry = {
  file: string;
  path: string;
  json: JsonRecord | null;
  modifiedMs: number;
};

export type DashboardServer = {
  url: string;
  port: number;
  stop(): void;
};

const defaultPort = 4173;
const repoRoot = path.resolve(process.cwd(), "..");
const actorRoot = path.join(repoRoot, "data/actors");
const evidenceRoot = path.join(repoRoot, "data/evidence");
const dashboardAssetRoot = path.join(repoRoot, "probe/src/dashboard/assets");
const refreshDebounceMs = 120;
const heartbeatMs = 15_000;
const maxRuntimeEvents = 80;
const recentRuntimeEvents: DashboardRuntimeEvent[] = [];

function parsePort(argv: readonly string[]) {
  const portIndex = argv.indexOf("--port");
  if (portIndex === -1) {
    return defaultPort;
  }

  const value = argv[portIndex + 1];
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("--port must be an integer between 1 and 65535");
  }

  return port;
}

async function readJsonIfExists(filePath: string): Promise<JsonRecord | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as JsonRecord;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function listJson(dir: string, limit = 8): Promise<JsonEntry[]> {
  try {
    const entries = await Promise.all(
      (await fs.readdir(dir))
        .filter((entry) => entry.endsWith(".json"))
        .map(async (entry) => {
          const filePath = path.join(dir, entry);
          const stat = await fs.stat(filePath);
          return { entry, filePath, modifiedMs: stat.mtimeMs };
        })
    );

    return Promise.all(
      entries
        .sort((left, right) => left.modifiedMs - right.modifiedMs || left.entry.localeCompare(right.entry))
        .slice(-limit)
        .map(async ({ entry, filePath, modifiedMs }) => ({
        file: entry,
        path: filePath,
        modifiedMs,
        json: await readJsonIfExists(filePath)
      }))
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function listLongObjectiveReports(dir: string, limit = 6): Promise<JsonEntry[]> {
  return listDirectTrialReports(dir, limit);
}

async function listDirectTrialReports(dir: string, limit = 8): Promise<JsonEntry[]> {
  try {
    const entries = (
      await Promise.all(
      (await fs.readdir(dir, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const filePath = path.join(dir, entry.name, "report.json");
          try {
            const stat = await fs.stat(filePath);
            return { entry: `${entry.name}/report.json`, filePath, modifiedMs: stat.mtimeMs };
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              return null;
            }

            throw error;
          }
        })
      )
    ).filter((entry): entry is { entry: string; filePath: string; modifiedMs: number } => entry !== null);

    return Promise.all(
      entries
        .sort((left, right) => left.modifiedMs - right.modifiedMs || left.entry.localeCompare(right.entry))
        .slice(-limit)
        .map(async ({ entry, filePath, modifiedMs }) => ({
          file: entry,
          path: filePath,
          modifiedMs,
          json: await readJsonIfExists(filePath)
        }))
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function listJsonRecursive(dir: string, limit = 16): Promise<JsonEntry[]> {
  const entries: Array<{ entry: string; filePath: string; modifiedMs: number }> = [];

  async function visit(currentDir: string) {
    let dirEntries: Dirent[];
    try {
      dirEntries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }

      throw error;
    }

    await Promise.all(
      dirEntries.map(async (entry) => {
        const filePath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await visit(filePath);
          return;
        }
        if (!entry.isFile() || !entry.name.endsWith(".json")) {
          return;
        }
        const stat = await fs.stat(filePath);
        entries.push({
          entry: path.relative(dir, filePath),
          filePath,
          modifiedMs: stat.mtimeMs
        });
      })
    );
  }

  await visit(dir);

  return Promise.all(
    entries
      .sort((left, right) => left.modifiedMs - right.modifiedMs || left.entry.localeCompare(right.entry))
      .slice(-limit)
      .map(async ({ entry, filePath, modifiedMs }) => ({
        file: entry,
        path: filePath,
        modifiedMs,
        json: await readJsonIfExists(filePath)
      }))
  );
}

async function listActors() {
  try {
    return (await fs.readdir(actorRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function latestTranscript() {
  const entries = await listJson(evidenceRoot, 80);
  return (
    entries
      .filter((entry) => entry.file.startsWith("agent_loop_probe_v0-"))
      .filter((entry) => !entry.file.includes("canonical"))
      .at(-1) ?? null
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getRecord(value: unknown, key: string) {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function getArray(value: unknown, key: string) {
  return isRecord(value) && Array.isArray(value[key]) ? value[key] : [];
}

function compactActionSkill(record: JsonRecord | null) {
  return {
    skill_id: record?.skill_id ?? null,
    status: record?.status ?? null,
    required_primitives: record?.required_primitives ?? [],
    preconditions: record?.preconditions ?? [],
    success_verifier: record?.success_verifier ?? null,
    notes: record?.notes ?? null
  };
}

function latestJson(entries: readonly JsonEntry[]) {
  return entries.at(-1)?.json ?? null;
}

function readTranscriptActorIds(transcript: JsonRecord | null) {
  const final = getRecord(transcript, "final");
  const sessions = Array.isArray(final?.actor_sessions) ? final.actor_sessions : [];
  return sessions
    .filter(isRecord)
    .map((session) => asString(session.actor_id))
    .filter(Boolean);
}

function readRuntimeEventActorIds() {
  return Array.from(
    new Set(
      recentRuntimeEvents
        .map((event) => event.actorId)
        .filter((actorId): actorId is string => typeof actorId === "string" && actorId.length > 0)
    )
  ).sort();
}

function readObservation(input: JsonRecord | null) {
  return getRecord(getRecord(input, "input"), "observation");
}

function readGoalStack(input: JsonRecord | null) {
  return getRecord(getRecord(input, "input"), "goalStack");
}

function readCurrentTask(input: JsonRecord | null) {
  return getRecord(getRecord(input, "input"), "currentTask");
}

function readToolAttempt(evidence: JsonRecord | null) {
  return getRecord(evidence, "tool_attempt");
}

function readToolResult(evidence: JsonRecord | null) {
  return getRecord(readToolAttempt(evidence), "result");
}

function readVerification(result: JsonRecord | null) {
  return getRecord(result, "verification");
}

function toNamedCounts(values: unknown[]) {
  return values
    .filter(isRecord)
    .map((item) => ({
      name: asString(item.name ?? item.type ?? item.item ?? item.id, "unknown"),
      count: asNumber(item.count) ?? asNumber(item.quantity) ?? 1,
      distance: asNumber(item.distance)
    }));
}

function readInventory(observation: JsonRecord | null) {
  return toNamedCounts(getArray(observation, "inventory"));
}

function readNearbyBlocks(observation: JsonRecord | null) {
  return toNamedCounts(getArray(observation, "nearbyBlocks")).slice(0, 16);
}

function readVisibleActors(observation: JsonRecord | null) {
  return getArray(observation, "visibleActors")
    .filter(isRecord)
    .map((actor) => ({
      id: asString(actor.id, "unknown"),
      distance: asNumber(actor.distance),
      busy: actor.busy === true
    }));
}

function readPosition(evidence: JsonRecord | null) {
  const position = getRecord(evidence, "post_position") ?? getRecord(evidence, "pre_position");
  if (!position) {
    return null;
  }

  return {
    x: asNumber(position.x),
    y: asNumber(position.y),
    z: asNumber(position.z)
  };
}

function readRelationships(entries: readonly JsonEntry[]) {
  return entries.map((entry) => ({
    file: entry.file,
    to_actor_id: entry.json?.to_actor_id ?? entry.file.replace(/\.json$/, ""),
    trust: entry.json?.trust ?? "unproven",
    obligation: entry.json?.obligation ?? "none",
    dependency: entry.json?.dependency ?? "independent",
    friction: entry.json?.friction ?? "none",
    familiarity: entry.json?.familiarity ?? "stranger",
    recent_events: Array.isArray(entry.json?.recent_events) ? entry.json.recent_events : []
  }));
}

function readMemoryItems(entries: readonly JsonEntry[]) {
  return entries.map((entry) => ({
    file: entry.file,
    layer: asString(entry.json?.layer) ?? path.dirname(entry.file),
    status: asString(entry.json?.status) ?? null,
    summary:
      asString(entry.json?.summary) ||
      asString(entry.json?.note) ||
      asString(entry.json?.memory) ||
      asString(entry.json?.event) ||
      entry.file,
    json: entry.json
  }));
}

async function readActor(actorId: string) {
  const actorDir = path.join(actorRoot, actorId);
  const actor = await readJsonIfExists(path.join(actorDir, "actor.json"));
  const providerInputs = await listJson(path.join(actorDir, "provider-inputs"), 6);
  const providerOutputs = await listJson(path.join(actorDir, "provider-outputs"), 6);
  const evidence = await listJson(path.join(actorDir, "evidence"), 16);
  const reviews = await listJson(path.join(actorDir, "reviews"), 8);
  const relationships = await listJson(path.join(actorDir, "relationships"), 8);
  const activeSkills = await listJson(path.join(actorDir, "action-skills/active"), 40);
  const candidates = await listJson(path.join(actorDir, "action-skills/candidates"), 8);
  const directTrials = await listDirectTrialReports(path.join(actorDir, "action-skills/direct-trials"), 8);
  const longObjectives = await listLongObjectiveReports(
    path.join(actorDir, "action-skills/direct-trials/long-objectives"),
    6
  );
  const memory = await listJsonRecursive(path.join(actorDir, "memory"), 16);
  const latestInput = latestJson(providerInputs);
  const latestOutput = latestJson(providerOutputs);
  const latestEvidence = latestJson(evidence);
  const observation = readObservation(latestInput);
  const result = readToolResult(latestEvidence);
  const verification = readVerification(result);
  const currentTask = readCurrentTask(latestInput);
  const goalStack = readGoalStack(latestInput);

  return {
    actor_id: actorId,
    actor,
    summary: {
      display_name: actor?.actor_profile && isRecord(actor.actor_profile) ? actor.actor_profile.display_name ?? actorId : actorId,
      role_id: actor?.role_id ?? (actor?.actor_profile && isRecord(actor.actor_profile) ? actor.actor_profile.gameplay_role : null),
      turn_id: latestInput?.turn_id ?? latestEvidence?.turn_id ?? null,
      task_id: currentTask?.id ?? null,
      task_reason: currentTask?.reason ?? null,
      goal_summary:
        goalStack?.private_goal && isRecord(goalStack.private_goal)
          ? goalStack.private_goal.summary ?? null
          : null,
      tool: readToolAttempt(latestEvidence)?.tool ?? null,
      status: result?.status ?? latestEvidence?.category ?? null,
      ok: result?.ok ?? null,
      verifier_status: verification?.status ?? null,
      verifier_reason: verification?.reason ?? latestEvidence?.verifier_reason ?? null,
      position: readPosition(latestEvidence),
      provider_id: latestInput?.provider_id ?? latestOutput?.provider_id ?? null,
      model: latestInput?.model ?? latestOutput?.model ?? null,
      has_provider_output: latestOutput !== null
    },
    world: {
      inventory: readInventory(observation),
      nearby_blocks: readNearbyBlocks(observation),
      visible_actors: readVisibleActors(observation)
    },
    provider_inputs: providerInputs,
    provider_outputs: providerOutputs,
    evidence,
    reviews,
    relationships: readRelationships(relationships),
    memory: readMemoryItems(memory),
    action_skills: {
      active: activeSkills.map((entry) => ({
        file: entry.file,
        json: compactActionSkill(entry.json)
      })),
      candidates,
      direct_trials: directTrials,
      long_objectives: longObjectives
    }
  };
}

async function buildState() {
  const latest = await latestTranscript();
  const liveActorIds = readRuntimeEventActorIds();
  const transcriptActorIds = readTranscriptActorIds(latest?.json ?? null);
  const actorIds = liveActorIds.length > 0 ? liveActorIds : transcriptActorIds.length > 0 ? transcriptActorIds : await listActors();
  const actors = await Promise.all(actorIds.map(readActor));
  const failures = actors.filter((actor) =>
    ["failed", "blocked", "timeout", "cancelled"].includes(String(actor.summary.status ?? ""))
  ).length;

  return {
    schema: "minecraft-agent-dashboard-state/v2",
    updated_at: new Date().toISOString(),
    dashboard_architecture: {
      update_mode: "filesystem-watch + sse + polling-fallback",
      runtime_coupling: "read-only artifact observer",
      failure_boundary: "dashboard failures cannot reject npc turns"
    },
    summary: {
      actor_count: actors.length,
      failure_count: failures,
      live_provider_output_count: actors.filter((actor) => actor.summary.has_provider_output).length,
      latest_transcript_file: latest?.file ?? null,
      final_status: latest?.json?.final && isRecord(latest.json.final) ? latest.json.final.status ?? null : null,
      final_why: latest?.json?.final && isRecord(latest.json.final) ? latest.json.final.why ?? null : null
    },
    runtime_events: recentRuntimeEvents,
    actors,
    latest_transcript: latest
  };
}

type DashboardClient = {
  id: number;
  writer: WritableStreamDefaultWriter<Uint8Array>;
};

class DashboardBroadcaster {
  private clients = new Map<number, DashboardClient>();
  private nextClientId = 1;
  private refreshTimer: NodeJS.Timeout | null = null;
  private watchers: FSWatcher[] = [];

  addClient(writer: WritableStreamDefaultWriter<Uint8Array>, signal: AbortSignal) {
    const id = this.nextClientId;
    this.nextClientId += 1;
    this.clients.set(id, { id, writer });
    void this.write(writer, `event: hello\ndata: ${JSON.stringify({ id })}\n\n`);
    void this.broadcastState();
    signal.addEventListener("abort", () => {
      this.clients.delete(id);
      void writer.close().catch(() => undefined);
    });
  }

  startWatching() {
    for (const dir of [actorRoot, evidenceRoot]) {
      void fs.mkdir(dir, { recursive: true }).then(() => {
        try {
          this.watchers.push(
            watch(dir, { recursive: true }, () => {
              this.scheduleRefresh();
            })
          );
        } catch {
          // The client still has a polling fallback; watcher support is best-effort.
        }
      });
    }

    setInterval(() => {
      for (const client of this.clients.values()) {
        void this.write(
          client.writer,
          `event: heartbeat\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`
        );
      }
    }, heartbeatMs).unref();
  }

  close() {
    for (const watcher of this.watchers) {
      watcher.close();
    }
  }

  ingestRuntimeEvent(event: DashboardRuntimeEvent) {
    recentRuntimeEvents.push(event);
    recentRuntimeEvents.splice(0, Math.max(0, recentRuntimeEvents.length - maxRuntimeEvents));
    const payload = `event: runtime_event\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients.values()) {
      void this.write(client.writer, payload);
    }
    this.scheduleRefresh();
  }

  private scheduleRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.broadcastState();
    }, refreshDebounceMs);
  }

  private async broadcastState() {
    if (this.clients.size === 0) {
      return;
    }

    try {
      const state = await buildState();
      const payload = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
      for (const client of this.clients.values()) {
        void this.write(client.writer, payload);
      }
    } catch (error) {
      const payload = `event: dashboard_error\ndata: ${JSON.stringify({
        message: error instanceof Error ? error.message : String(error)
      })}\n\n`;
      for (const client of this.clients.values()) {
        void this.write(client.writer, payload);
      }
    }
  }

  private async write(writer: WritableStreamDefaultWriter<Uint8Array>, payload: string) {
    try {
      await writer.write(new TextEncoder().encode(payload));
    } catch {
      for (const [id, client] of this.clients.entries()) {
        if (client.writer === writer) {
          this.clients.delete(id);
        }
      }
    }
  }
}

function html() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Minecraft Agent Live Dashboard</title>
  <style>
    :root {
      color-scheme: dark;
      --bg:#151712; --ink:#edf1e7; --muted:#9da795; --line:#343a30;
      --panel:#1f241d; --panel2:#242a21; --panel3:#191d17; --accent:#8fbd6a;
      --good:#86c36f; --warn:#d4a64b; --bad:#d97265; --chip:#2b3128;
    }
    * { box-sizing: border-box; }
    body { margin:0; font:12px/1.42 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--ink); }
    header { position:sticky; top:0; z-index:2; background:#181b15; border-bottom:1px solid var(--line); padding:10px 14px; display:flex; justify-content:space-between; gap:12px; align-items:center; }
    h1 { margin:0; font-size:16px; letter-spacing:0; }
    h2 { margin:0; font-size:15px; letter-spacing:0; }
    h3 { margin:0 0 6px; font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
    main { padding:12px; display:grid; gap:10px; }
    .summary { display:grid; grid-template-columns:1fr .75fr .75fr 1.2fr .7fr; gap:10px; }
    .card, .actor, .panel { background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:9px; }
    .label { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
    .value { font-weight:650; margin-top:3px; overflow-wrap:anywhere; }
    .actors { display:grid; grid-template-columns:repeat(auto-fit,minmax(520px,1fr)); gap:10px; align-items:start; }
    .actor-head { display:flex; justify-content:space-between; gap:10px; align-items:start; border-bottom:1px solid var(--line); padding-bottom:8px; margin-bottom:8px; }
    .actor-title { display:flex; align-items:center; gap:8px; }
    .actor-title .mc-icon, .actor-title .mc-fallback { width:32px; height:32px; }
    .status-stack { display:flex; flex-wrap:wrap; justify-content:flex-end; max-width:180px; }
    .sub { color:var(--muted); margin-top:2px; }
    .status-row { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    .hud-strip { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; }
    .hud-strip > div { display:flex; align-items:center; gap:7px; min-height:42px; background:var(--panel3); border:1px solid var(--line); border-radius:5px; padding:6px; }
    .hud-strip b { display:block; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hud-strip small { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
    .mini { background:var(--panel2); border:1px solid var(--line); border-radius:7px; padding:8px; min-height:58px; }
    .pill, .chip { display:inline-flex; align-items:center; gap:4px; padding:2px 6px; border:1px solid var(--line); border-radius:999px; color:var(--muted); background:var(--chip); font-size:11px; font-weight:600; margin:1px 2px 1px 0; }
    .pill.good { color:var(--good); border-color:#496c3f; background:#22321d; }
    .pill.warn { color:var(--warn); border-color:#6d5932; background:#342b1d; }
    .pill.bad { color:var(--bad); border-color:#74413a; background:#3a211f; }
    .actor-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
    .items { display:grid; grid-template-columns:repeat(auto-fill,minmax(106px,1fr)); gap:5px; }
    .item { display:grid; grid-template-columns:26px 1fr auto; align-items:center; gap:6px; min-height:34px; padding:4px 6px; background:var(--panel3); border:1px solid var(--line); border-radius:5px; }
    .item strong { font-weight:650; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .item small { color:var(--muted); font-size:10px; display:block; }
    .mc-icon { width:24px; height:24px; image-rendering:pixelated; object-fit:contain; flex:0 0 auto; }
    .mc-fallback { width:24px; height:24px; display:inline-grid; place-items:center; background:#384232; border:1px solid #59644f; color:#dfe7d9; font-size:9px; font-weight:800; border-radius:3px; }
    .bar { height:6px; background:#141812; border:1px solid #30372c; border-radius:999px; overflow:hidden; margin-top:3px; }
    .bar > span { display:block; height:100%; background:var(--accent); border-radius:999px; min-width:4px; }
    .relation { display:grid; grid-template-columns:74px 1fr; gap:6px; align-items:center; margin:5px 0; }
    .timeline { display:grid; gap:6px; }
    .event { border-left:2px solid var(--accent); padding:6px 8px; background:var(--panel2); border-radius:0 5px 5px 0; }
    .runtime-events { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:6px; }
    .runtime-event { background:var(--panel2); border:1px solid var(--line); border-left:3px solid var(--accent); border-radius:5px; padding:7px; min-height:64px; }
    .runtime-event strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .skill-name { display:flex; gap:8px; align-items:center; }
    .skill-loadout { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:6px; }
    .skill-slot { background:var(--panel3); border:1px solid var(--line); border-radius:5px; padding:7px; }
    .primitive-row { margin-top:4px; }
    .focus { border-color:#53634a; background:var(--panel2); }
    details { border-top:1px solid var(--line); padding-top:8px; margin-top:10px; }
    summary { cursor:pointer; color:var(--accent); font-weight:650; }
    pre { margin:8px 0 0; max-height:360px; overflow:auto; padding:10px; background:#111815; color:#e8f0eb; border-radius:6px; font-size:11px; white-space:pre-wrap; overflow-wrap:anywhere; }
    .stale { color:var(--bad); font-weight:650; }
    .wide { grid-column:1 / -1; }
    @media (max-width:980px) { .summary, .status-row, .hud-strip, .actor-grid { grid-template-columns:1fr; } .actors { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Minecraft Agent Dashboard</h1>
      <div class="sub">NPC state, world observation, action skills, LLM artifacts</div>
    </div>
    <div id="updated" class="label">loading</div>
  </header>
  <main>
    <section class="summary" id="summary"></section>
    <section class="panel" id="runtime-events"></section>
    <section class="actors" id="actors"></section>
  </main>
  <script>
    const fmt = (value) => JSON.stringify(value, null, 2);
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const latest = (list) => list?.[list.length - 1]?.json ?? null;
    const statusClass = (value) => {
      const text = String(value ?? "");
      if (["passed", "success", "ok", "true"].includes(text)) return "good";
      if (["blocked", "failed", "timeout", "cancelled", "false"].includes(text)) return "bad";
      return "warn";
    };
    const iconNames = new Set([
      "acacia_log", "birch_log", "cherry_log", "chest", "crafting_table",
      "dark_oak_log", "dirt", "grass_block", "jungle_log", "oak_log",
      "oak_planks", "short_grass", "spruce_log", "stick"
    ]);
    const primitiveIcons = {
      gatherer: "oak_log",
      crafter: "crafting_table",
      quartermaster: "chest",
      collect_logs: "oak_log",
      mine_block: "cobblestone",
      craft_item: "crafting_table",
      craft_with_table: "crafting_table",
      inspect_chest: "chest",
      deposit_shared: "chest",
      withdraw_shared: "chest"
    };
    const normalizeIconName = (value) => String(value ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    function icon(value, label = value) {
      const key = primitiveIcons[value] ?? normalizeIconName(value);
      if (iconNames.has(key)) {
        return '<img class="mc-icon" src="/assets/icons/' + esc(key) + '.png" alt="' + esc(label) + '">';
      }
      return '<span class="mc-fallback" aria-label="' + esc(label) + '">' + esc(String(label ?? "?").slice(0, 2).toUpperCase()) + '</span>';
    }
    const metric = (label, value, cls = "") => '<div class="card"><div class="label">' + esc(label) + '</div><div class="value ' + cls + '">' + esc(value ?? "none") + '</div></div>';
    const mini = (label, value, cls = "") => '<div class="mini"><div class="label">' + esc(label) + '</div><div class="value ' + cls + '">' + esc(value ?? "none") + '</div></div>';
    const chip = (value, cls = "") => '<span class="chip ' + cls + '">' + icon(value, value) + esc(value) + '</span>';
    function itemList(items, empty) {
      if (!items?.length) return '<div class="sub">' + esc(empty) + '</div>';
      return '<div class="items">' + items.map((item) => {
        const count = item.count ?? "";
        const distance = typeof item.distance === "number" ? item.distance.toFixed(1) + "m" : "";
        return '<span class="item">' + icon(item.name, item.name) + '<span><strong>' + esc(item.name) + '</strong><small>' + esc(distance) + '</small></span><span>' + esc(count) + '</span></span>';
      }).join('') + '</div>';
    }
    function actionSkillList(skills) {
      if (!skills?.length) return '<div class="sub">active action skill 없음</div>';
      return '<div class="skill-loadout">' + skills.map((skill) => {
        const json = skill.json ?? {};
        const primitives = (json.required_primitives ?? []).map((p) => chip(p)).join('');
        return '<div class="skill-slot"><div class="skill-name">' + icon((json.required_primitives ?? [])[0] ?? json.skill_id, json.skill_id) + '<strong>' + esc(json.skill_id) + '</strong></div><div class="sub">' + esc(json.notes ?? json.success_verifier ?? "") + '</div><div class="primitive-row">' + primitives + '</div></div>';
      }).join('') + '</div>';
    }
    function longObjectiveList(runs) {
      if (!runs?.length) return '<div class="sub">long objective run 없음</div>';
      return '<div class="timeline">' + runs.slice(-4).reverse().map((run) => {
        const json = run.json ?? {};
        const phases = Array.isArray(json.phases) ? json.phases : [];
        const phaseRows = phases.map((phase) =>
          '<div class="event"><strong>' + esc(phase.phaseId ?? 'phase') + '</strong>' +
          '<div class="primitive-row"><span class="pill ' + statusClass(phase.status) + '">' + esc(phase.status ?? 'unknown') + '</span><span class="pill">' + esc(json.stopReason ?? '') + '</span></div>' +
          '<div class="sub">' + esc(phase.verifierReason ?? '') + '</div></div>'
        ).join('');
        return '<div class="skill-slot"><div class="skill-name"><strong>' + esc(json.objectiveId ?? run.file) + '</strong></div>' +
          '<div class="primitive-row"><span class="pill ' + statusClass(json.status) + '">' + esc(json.status ?? 'unknown') + '</span><span class="pill">' + esc(json.stopReason ?? '') + '</span></div>' +
          '<div class="sub">next: ' + esc(json.nextRecommendedPhase ?? json.nextImplementationTasks?.[0] ?? 'none') + '</div>' +
          phaseRows +
          '<details><summary>long objective raw</summary><pre>' + esc(fmt(json)) + '</pre></details></div>';
      }).join('') + '</div>';
    }
    function directTrialList(trials) {
      if (!trials?.length) return '<div class="sub">direct generated trial 없음</div>';
      return '<div class="skill-loadout">' + trials.slice(-6).reverse().map((trial) => {
        const json = trial.json ?? {};
        const generated = json.generated ?? {};
        const evidence = json.evidence ?? {};
        const execution = generated.execution ?? {};
        const helpers = Array.isArray(execution.helperEvents) ? execution.helperEvents : [];
        const helperNames = helpers
          .filter((event) => event && event.status === "completed")
          .slice(-6)
          .map((event) => chip(event.name))
          .join('');
        return '<div class="skill-slot">' +
          '<div class="skill-name">' + icon(evidence.itemName ?? json.objectiveId, json.objectiveId) + '<strong>' + esc(json.objectiveId ?? trial.file) + '</strong></div>' +
          '<div class="primitive-row"><span class="pill ' + statusClass(json.status) + '">' + esc(json.status ?? 'unknown') + '</span><span class="pill ' + statusClass(execution.status) + '">' + esc(execution.status ?? 'not-run') + '</span><span class="pill">' + esc(generated.providerId ?? 'provider') + '</span></div>' +
          '<div class="sub">' + esc(evidence.verifierReason ?? '') + '</div>' +
          '<div class="primitive-row">' + helperNames + '</div>' +
          '<details><summary>direct trial raw</summary><pre>' + esc(fmt(json)) + '</pre></details>' +
        '</div>';
      }).join('') + '</div>';
    }
    function relationshipList(relationships) {
      if (!relationships?.length) return '<div class="sub">relationship edge 없음</div>';
      const widths = { unproven:20, distrusted:20, cautious:45, reliable:72, trusted:100, none:5, annoyed:35, frustrated:60, resentful:82, hostile:100 };
      return relationships.map((rel) => {
        const trust = widths[rel.trust] ?? 20;
        const friction = widths[rel.friction] ?? 5;
        return '<div class="relation"><strong>' + esc(rel.to_actor_id) + '</strong><div>' +
          '<span class="pill">' + esc(rel.trust) + '</span><span class="pill ' + (rel.friction === "none" ? "good" : "warn") + '">' + esc(rel.friction) + '</span><span class="pill">' + esc(rel.obligation) + '</span>' +
          '<div class="bar"><span style="width:' + trust + '%"></span></div>' +
          '<div class="bar"><span style="width:' + friction + '%; background:var(--bad)"></span></div>' +
        '</div></div>';
      }).join('');
    }
    function memoryList(memory) {
      if (!memory?.length) return '<div class="sub">memory artifact 없음</div>';
      return '<div class="timeline">' + memory.map((item) => '<div class="event"><strong>' + esc(item.file) + '</strong><div class="primitive-row"><span class="pill">' + esc(item.layer ?? 'memory') + '</span><span class="pill ' + statusClass(item.status) + '">' + esc(item.status ?? 'unknown') + '</span></div><div class="sub">' + esc(item.summary) + '</div></div>').join('') + '</div>';
    }
    function runtimeEventList(events) {
      const rows = (events ?? []).slice(-12).reverse();
      if (!rows.length) return '<h3>Runtime Events</h3><div class="sub">agent loop 이벤트 대기 중</div>';
      return '<h3>Runtime Events</h3><div class="runtime-events">' + rows.map((event) => {
        const detail = [event.turnId, event.tool, event.status].filter(Boolean).join(' / ');
        return '<div class="runtime-event"><strong>' + esc(event.actorId) + ' · ' + esc(event.type) + '</strong><div class="sub">' + esc(detail || event.at) + '</div><div class="primitive-row">' + (event.tool ? chip(event.tool) : '') + (event.taskId ? '<span class="chip">' + esc(event.taskId) + '</span>' : '') + '</div></div>';
      }).join('') + '</div>';
    }
    function renderActor(actor) {
      const s = actor.summary ?? {};
      const latestInput = latest(actor.provider_inputs);
      const latestOutput = latest(actor.provider_outputs);
      const latestEvidence = latest(actor.evidence);
      const pos = s.position ? [s.position.x, s.position.y, s.position.z].map((n) => typeof n === 'number' ? n.toFixed(1) : '?').join(', ') : 'none';
      const actorTitle = s.display_name ?? actor.actor_id;
      return '<article class="actor">' +
        '<div class="actor-head"><div class="actor-title">' + icon(s.role_id ?? actor.actor_id, actorTitle) + '<div><h2>' + esc(actorTitle) + ' <span class="pill">' + esc(actor.actor_id) + '</span></h2><div class="sub">' + esc(s.role_id ?? 'actor') + ' / ' + esc(s.provider_id ?? 'provider 없음') + '</div></div></div>' +
        '<div class="status-stack"><span class="pill ' + statusClass(s.status) + '">' + esc(s.status ?? 'idle') + '</span><span class="pill ' + statusClass(s.verifier_status) + '">' + esc(s.verifier_status ?? 'unverified') + '</span></div></div>' +
        '<div class="hud-strip">' +
          '<div>' + icon(s.tool ?? 'grass_block', s.tool ?? 'tool') + '<span><b>' + esc(s.tool ?? 'no tool') + '</b><small>current tool</small></span></div>' +
          '<div>' + icon(s.task_id ?? 'grass_block', s.task_id ?? 'task') + '<span><b>' + esc(s.task_id ?? 'idle') + '</b><small>task</small></span></div>' +
          '<div>' + icon(s.role_id ?? 'chest', s.role_id ?? 'role') + '<span><b>' + esc(s.turn_id ?? 'none') + '</b><small>turn</small></span></div>' +
          '<div><span class="mc-fallback">XYZ</span><span><b>' + esc(pos) + '</b><small>position</small></span></div>' +
        '</div>' +
        '<div class="panel focus" style="margin-top:8px"><h3>State / Verification</h3><div class="skill-name">' + icon(s.tool ?? s.task_id ?? 'grass_block', s.tool ?? s.task_id ?? 'current') + '<div><div class="value">' + esc(s.task_reason ?? s.goal_summary ?? '현재 runtime task 없음') + '</div><div class="sub">' + esc(s.verifier_reason ?? '검증 메시지 없음') + '</div></div></div></div>' +
        '<div class="actor-grid">' +
          '<section class="panel"><h3>Inventory</h3>' + itemList(actor.world.inventory, 'inventory 비어 있음') + '</section>' +
          '<section class="panel"><h3>Nearby Blocks</h3>' + itemList(actor.world.nearby_blocks, 'nearby block 없음') + '</section>' +
          '<section class="panel"><h3>Visible Actors</h3>' + itemList((actor.world.visible_actors ?? []).map((a) => ({ name: a.id + (a.busy ? ' busy' : ''), count: a.distance })), 'visible actor 없음') + '</section>' +
          '<section class="panel"><h3>Relationships</h3>' + relationshipList(actor.relationships) + '</section>' +
          '<section class="panel wide"><h3>Active Action Skills</h3>' + actionSkillList(actor.action_skills.active) + '</section>' +
          '<section class="panel wide"><h3>Direct Generated Trials</h3>' + directTrialList(actor.action_skills.direct_trials) + '</section>' +
          '<section class="panel wide"><h3>Long Objective Timeline</h3>' + longObjectiveList(actor.action_skills.long_objectives) + '</section>' +
          '<section class="panel wide"><h3>Memory</h3>' + memoryList(actor.memory) + '</section>' +
        '</div>' +
        '<details><summary>Raw LLM input</summary><pre>' + esc(fmt(latestInput)) + '</pre></details>' +
        '<details><summary>Raw LLM output</summary><pre>' + esc(fmt(latestOutput)) + '</pre></details>' +
        '<details><summary>Raw latest evidence</summary><pre>' + esc(fmt(latestEvidence)) + '</pre></details>' +
      '</article>';
    }
    function render(state) {
      document.getElementById('updated').textContent = 'updated ' + state.updated_at + ' / ' + state.dashboard_architecture.update_mode;
      document.getElementById('summary').innerHTML = [
        metric('Actors', state.summary.actor_count),
        metric('Failures', state.summary.failure_count, state.summary.failure_count > 0 ? 'stale' : ''),
        metric('Live LLM outputs', state.summary.live_provider_output_count),
        metric('Latest transcript', state.summary.latest_transcript_file ?? 'none'),
        metric('Final', state.summary.final_status ?? 'none')
      ].join('');
      document.getElementById('runtime-events').innerHTML = runtimeEventList(state.runtime_events);
      document.getElementById('actors').innerHTML = state.actors.map(renderActor).join('');
    }
    async function pollRefresh() {
      try {
        const response = await fetch('/api/state', { cache: 'no-store' });
        render(await response.json());
      } catch (error) {
        document.getElementById('updated').innerHTML = '<span class="stale">dashboard error: ' + esc(error.message) + '</span>';
      }
    }
    function connectEvents() {
      if (!window.EventSource) {
        setInterval(pollRefresh, 2000);
        void pollRefresh();
        return;
      }
      const source = new EventSource('/api/events');
      source.addEventListener('state', (event) => render(JSON.parse(event.data)));
      source.addEventListener('runtime_event', () => void pollRefresh());
      source.addEventListener('dashboard_error', (event) => {
        const data = JSON.parse(event.data);
        document.getElementById('updated').innerHTML = '<span class="stale">dashboard error: ' + esc(data.message) + '</span>';
      });
      source.onerror = () => {
        source.close();
        setTimeout(connectEvents, 1500);
      };
      setInterval(pollRefresh, 5000);
    }
    connectEvents();
  </script>
</body>
</html>`;
}

function sendJson(value: unknown) {
  return new Response(JSON.stringify(value, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function serveDashboardAsset(request: Request) {
  const url = new URL(request.url);
  const relativePath = decodeURIComponent(url.pathname.replace(/^\/assets\//, ""));
  const filePath = path.resolve(dashboardAssetRoot, relativePath);

  if (!filePath.startsWith(dashboardAssetRoot)) {
    return new Response("Forbidden", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  try {
    const body = await fs.readFile(filePath);
    return new Response(body, {
      headers: {
        "content-type": filePath.endsWith(".png") ? "image/png" : "application/octet-stream",
        "cache-control": "public, max-age=3600"
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    throw error;
  }
}

export function startDashboardServer(port = defaultPort) {
  const broadcaster = new DashboardBroadcaster();
  broadcaster.startWatching();

  const app = new Elysia()
    .get("/api/state", async () => sendJson(await buildState()))
    .post("/api/runtime-events", async ({ body }) => {
      const event = body as DashboardRuntimeEvent;
      if (
        event?.schema !== "agent-loop-event/v1" ||
        typeof event.actorId !== "string" ||
        typeof event.type !== "string"
      ) {
        return new Response("Invalid runtime event", { status: 400 });
      }

      broadcaster.ingestRuntimeEvent(event);
      return sendJson({ ok: true });
    })
    .get("/api/events", ({ request }) => {
      const stream = new TransformStream<Uint8Array>();
      broadcaster.addClient(stream.writable.getWriter(), request.signal);
      return new Response(stream.readable, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store",
          connection: "keep-alive"
        }
      });
    })
    .get("/assets/*", ({ request }) => serveDashboardAsset(request))
    .get("/", () =>
      new Response(html(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      })
    )
    .all("*", () => new Response("Not found", { status: 404 }))
    .listen({ hostname: "127.0.0.1", port });

  const url = `http://${app.server?.hostname ?? "127.0.0.1"}:${app.server?.port ?? port}`;
  console.log(`dashboard=${url}`);

  return {
    url,
    port: app.server?.port ?? port,
    stop() {
      broadcaster.close();
      app.stop();
    }
  } satisfies DashboardServer;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startDashboardServer(parsePort(process.argv.slice(2)));
}
