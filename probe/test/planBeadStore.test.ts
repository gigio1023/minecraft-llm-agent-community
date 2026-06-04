/** Regression coverage for PlanBead store persistence and validation. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  appendPlanBeadDependency,
  appendPlanBeadEvent,
  listActorPlanBeads,
  listPlanBeadDependencies,
  listPlanBeadEvents,
  loadPlanBeadGraphSnapshot,
  readActorPlanBead,
  writeActorPlanBead,
  writePlanBeadHistorySnapshot,
  type ActorPlanBead,
  type PlanBeadDependency,
  type PlanBeadEvent,
  type PlanBeadHistorySnapshot
} from "../src/runtime/goals/planBeads/index.js";
import {
  getActorPlanBeadEventLogPath,
  getActorWorkspacePaths
} from "../src/runtime/actorWorkspacePaths.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const actorId = "npc_b";
const lifeGoalId = "life-1";
const now = "2026-05-31T00:00:00.000Z";

function testRoot(label: string) {
  return path.resolve(
    here,
    "test-artifacts",
    `plan-bead-store-${label}-${process.pid}-${randomUUID()}`
  );
}

function planBead(beadId: string, overrides: Partial<ActorPlanBead> = {}): ActorPlanBead {
  return {
    schema: "actor-plan-bead/v1",
    bead_id: beadId,
    actor_id: actorId,
    life_goal_id: lifeGoalId,
    kind: "concern",
    status: "open",
    priority: 2,
    title: `Track ${beadId}`,
    description: "Preserve a resumable concern without making it executable authority.",
    design_notes: "Use this as context for CycleGoal choice only.",
    acceptance_criteria: {
      evidence_required: ["runtime evidence or truthful non-physical resolution"],
      non_physical_resolution_allowed: true
    },
    notes: {
      completed: [],
      in_progress: [],
      blockers: [],
      next: ["Keep the concern available after reload."],
      key_decisions: []
    },
    labels: ["plan-bead-store"],
    metadata: {},
    refs: {
      evidence_refs: ["evidence/cycle-0001-observe.json"],
      memory_refs: [],
      judgment_refs: [],
      cycle_goal_refs: [],
      relationship_refs: [],
      world_event_refs: [],
      action_skill_refs: []
    },
    checkpoint: {
      version: 1,
      created_at: now,
      updated_at: now,
      evidence_refs: ["evidence/cycle-0001-observe.json"]
    },
    assertion_policy: {
      bead_is_context_not_authority: true,
      physical_success_requires_current_evidence: true
    },
    ...overrides
  };
}

function dependency(
  beadId: string,
  dependsOnBeadId: string,
  createdAt: string
): PlanBeadDependency {
  return {
    schema: "actor-plan-bead-dependency/v1",
    actor_id: actorId,
    bead_id: beadId,
    depends_on_bead_id: dependsOnBeadId,
    type: "blocks",
    rationale: `${beadId} waits for ${dependsOnBeadId}`,
    evidence_refs: ["evidence/dependency-observed.json"],
    created_at: createdAt
  };
}

function planBeadEvent(eventId: string, eventType: string): PlanBeadEvent {
  return {
    schema: "plan-bead-event/v1",
    actor_id: actorId,
    bead_id: "bead-a",
    event_id: eventId,
    event_type: eventType,
    summary: `Recorded ${eventType}`,
    evidence_refs: ["evidence/event-observed.json"],
    created_at: now
  };
}

test("writes, reads, and lists actor PlanBeads deterministically", async () => {
  const rootDir = testRoot("current");
  try {
    const beadB = planBead("bead-b");
    const beadA = planBead("bead-a", { priority: 1 });

    await writeActorPlanBead(rootDir, beadB);
    await writeActorPlanBead(rootDir, beadA);

    assert.deepEqual(await readActorPlanBead(rootDir, actorId, "bead-a"), beadA);
    assert.equal(await readActorPlanBead(rootDir, actorId, "missing"), null);

    const listed = await listActorPlanBeads(rootDir, actorId);
    assert.deepEqual(listed.map((bead) => bead.bead_id), ["bead-a", "bead-b"]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("appends dependencies without replacing the dependency log", async () => {
  const rootDir = testRoot("dependencies");
  try {
    const first = dependency("bead-b", "bead-a", "2026-05-31T00:00:00.000Z");
    const second = dependency("bead-c", "bead-b", "2026-05-31T00:00:01.000Z");

    const logPath = await appendPlanBeadDependency(rootDir, first);
    await appendPlanBeadDependency(rootDir, second);

    const rawLines = (await fs.readFile(logPath, "utf8")).trim().split("\n");
    assert.equal(rawLines.length, 2);

    const dependencies = await listPlanBeadDependencies(rootDir, actorId);
    assert.deepEqual(
      dependencies.map((entry) => `${entry.bead_id}->${entry.depends_on_bead_id}`),
      ["bead-b->bead-a", "bead-c->bead-b"]
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("appends bead events in order and preserves existing event lines", async () => {
  const rootDir = testRoot("events");
  try {
    const eventLogPath = getActorPlanBeadEventLogPath(rootDir, actorId, "bead-a");
    await fs.mkdir(path.dirname(eventLogPath), { recursive: true });
    await fs.writeFile(eventLogPath, `${JSON.stringify(planBeadEvent("event-1", "created"))}\n`, "utf8");

    await appendPlanBeadEvent(rootDir, planBeadEvent("event-2", "updated"));
    await appendPlanBeadEvent(rootDir, planBeadEvent("event-3", "blocked"));

    const rawLines = (await fs.readFile(eventLogPath, "utf8")).trim().split("\n");
    assert.equal(rawLines.length, 3);

    const events = await listPlanBeadEvents(rootDir, actorId, "bead-a");
    assert.deepEqual(events.map((event) => event.event_id), ["event-1", "event-2", "event-3"]);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("writes history snapshots under the bead history directory", async () => {
  const rootDir = testRoot("history");
  try {
    const bead = planBead("bead-a");
    const snapshot: PlanBeadHistorySnapshot = {
      schema: "plan-bead-history/v1",
      actor_id: actorId,
      bead_id: bead.bead_id,
      sequence: 1,
      kind: "created",
      captured_at: now,
      bead,
      evidence_refs: ["evidence/history-observed.json"],
      event_id: "event-1"
    };

    const snapshotPath = await writePlanBeadHistorySnapshot(rootDir, snapshot);
    assert.equal(path.basename(snapshotPath), "0001-created.json");

    const parsed = JSON.parse(await fs.readFile(snapshotPath, "utf8")) as PlanBeadHistorySnapshot;
    assert.equal(parsed.bead.bead_id, "bead-a");
    assert.equal(
      path.dirname(snapshotPath),
      path.join(getActorWorkspacePaths(rootDir, actorId).planBeads.historyDir, "bead-a")
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("reloads graph state from beads and dependencies while ignoring stale ready cache", async () => {
  const rootDir = testRoot("reload");
  try {
    await writeActorPlanBead(rootDir, planBead("bead-a"));
    await writeActorPlanBead(rootDir, planBead("bead-b", { status: "blocked" }));
    await appendPlanBeadDependency(
      rootDir,
      dependency("bead-b", "bead-a", "2026-05-31T00:00:00.000Z")
    );

    const paths = getActorWorkspacePaths(rootDir, actorId);
    await fs.mkdir(path.dirname(paths.planBeads.readyCacheFile), { recursive: true });
    await fs.writeFile(paths.planBeads.readyCacheFile, "{stale ready cache is not valid json}\n", "utf8");

    const graph = await loadPlanBeadGraphSnapshot(rootDir, actorId);

    assert.equal(graph.schema, "actor-plan-bead-graph-snapshot/v1");
    assert.deepEqual(graph.beads.map((bead) => bead.bead_id), ["bead-a", "bead-b"]);
    assert.deepEqual(
      graph.dependencies.map((entry) => `${entry.bead_id}->${entry.depends_on_bead_id}`),
      ["bead-b->bead-a"]
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
