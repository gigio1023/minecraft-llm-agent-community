import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { exportPublicHistory } from "../src/legibility/publicHistory.js";
import { ResponseWindowTracker } from "../src/legibility/responseWindows.js";
import { runSession1LegibilitySmoke } from "../src/legibility/session1Smoke.js";
import { runSharedSessionSchedule } from "../src/legibility/sharedSessionScheduler.js";
import { scoreLegibilityPredictions } from "../src/legibility/scoring.js";
import { createExperimentDeclaration } from "../src/legibility/declaration.js";
import {
  assertLiveSessionEvidenceRefsResolve,
  assertProviderFreeLiveRoutes,
  defaultLiveSharedActorRoutes
} from "../src/legibility/liveSharedSession.js";
import { observe } from "../src/tools/observe.js";
import { createDialogueState } from "../src/runtime/dialogueState.js";
import { createMemory } from "../src/runtime/memory.js";
import type {
  ActorProviderRoute,
  LegibilityPrediction,
  LegibilityScoreReport,
  LegibilitySessionArtifact,
  StructuredChatEvent,
  TransitionRowV1
} from "../src/legibility/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `legibility-session1-${process.pid}-${Date.now()}`);

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

const routes: ActorProviderRoute[] = [
  { actor_id: "npc_a", provider_id: "deterministic-social", model: "deterministic-social" },
  { actor_id: "npc_b", provider_id: "scripted-social", model: "scripted-social" }
];

function positionedActor(username: string, x: number) {
  const position = {
    x,
    y: 64,
    z: 0,
    distanceTo(other: unknown) {
      const record = other as { x?: number; y?: number; z?: number };
      return Math.hypot(
        x - (record.x ?? 0),
        64 - (record.y ?? 64),
        0 - (record.z ?? 0)
      );
    }
  };
  return {
    username,
    entity: { position },
    inventory: { items: () => [] }
  };
}

test("shared-session scheduler records round-robin provider-routed Actor Turn slots", async () => {
  const events = await runSharedSessionSchedule({
    session_id: "test-session",
    actorRoutes: routes,
    slotsPerActor: 2,
    turnHandler({ actor_id, route, slot_index }) {
      return {
        action_kind: route.provider_id === "scripted-social" ? "say" : "observe",
        evidence_refs: [`evidence/${actor_id}-${slot_index}.json`],
        started_at: `2026-07-06T00:00:0${slot_index}.000Z`,
        completed_at: `2026-07-06T00:00:0${slot_index}.500Z`
      };
    }
  });

  assert.deepEqual(events.map((event) => event.actor_id), ["npc_a", "npc_b", "npc_a", "npc_b"]);
  assert.deepEqual(events.map((event) => event.provider_id), [
    "deterministic-social",
    "scripted-social",
    "deterministic-social",
    "scripted-social"
  ]);
  assert.equal(events[1]?.schema, "actor-turn-slot-completion/v1");
});

test("live shared-session route guard blocks provider spend", () => {
  assert.doesNotThrow(() => assertProviderFreeLiveRoutes(defaultLiveSharedActorRoutes()));
  assert.throws(
    () => assertProviderFreeLiveRoutes([
      { actor_id: "npc_a", provider_id: "deterministic-social", model: "deterministic-social" },
      { actor_id: "npc_b", provider_id: "openai-api", model: "gpt-live" }
    ]),
    /provider-free/
  );
});

test("live shared-session slot evidence refs must resolve", async () => {
  const outputDir = path.join(rootDir, "live-ref-check");
  await fs.mkdir(path.join(outputDir, "actor-workspaces", "npc_a", "evidence"), { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "actor-workspaces", "npc_a", "evidence", "turn.json"),
    "{}\n",
    "utf8"
  );
  await assertLiveSessionEvidenceRefsResolve({
    outputDir,
    slotEvents: [
      {
        schema: "actor-turn-slot-completion/v1",
        session_id: "live-test",
        slot_index: 1,
        actor_id: "npc_a",
        provider_id: "deterministic-social",
        model: "deterministic-social",
        turn_id: "turn-a",
        cycle_id: "cycle-a",
        action_kind: "observe",
        started_at: "2026-07-06T00:00:00.000Z",
        completed_at: "2026-07-06T00:00:01.000Z",
        evidence_refs: ["actor-workspaces/npc_a/evidence/turn.json"]
      }
    ]
  });
  await assert.rejects(
    () => assertLiveSessionEvidenceRefsResolve({
      outputDir,
      slotEvents: [
        {
          schema: "actor-turn-slot-completion/v1",
          session_id: "live-test",
          slot_index: 2,
          actor_id: "npc_a",
          provider_id: "deterministic-social",
          model: "deterministic-social",
          turn_id: "turn-b",
          cycle_id: "cycle-b",
          action_kind: "observe",
          started_at: "2026-07-06T00:00:00.000Z",
          completed_at: "2026-07-06T00:00:01.000Z",
          evidence_refs: ["actor-workspaces/npc_a/evidence/missing.json"]
        }
      ]
    }),
    /missing evidence refs/
  );
});

test("response window closes only after other active actor slot completion", () => {
  const tracker = new ResponseWindowTracker({
    sessionId: "test-session",
    activeActorIds: ["npc_a", "npc_b"],
    timeoutAfterSlots: 3
  });
  const window = tracker.open({
    focalActorId: "npc_a",
    focalTurnId: "turn-a-1",
    focalSlotIndex: 1,
    openedAt: "2026-07-06T00:00:01.500Z",
    evidenceRefs: ["evidence/a-say.json"]
  });
  const chat: StructuredChatEvent = {
    schema: "structured-chat-event/v1",
    session_id: "test-session",
    speaker_id: "npc_b",
    message: "I can make oak_log available.",
    observed_by: ["npc_a"],
    slot_index: 2,
    observed_at: "2026-07-06T00:00:02.000Z",
    evidence_refs: ["evidence/b-say.json"]
  };
  tracker.recordChatEvent(chat);
  const beforeResponder = tracker.recordSlotCompletion({
    schema: "actor-turn-slot-completion/v1",
    session_id: "test-session",
    slot_index: 1,
    actor_id: "npc_a",
    provider_id: "deterministic-social",
    model: "deterministic-social",
    turn_id: "turn-a-1",
    cycle_id: "cycle-1",
    action_kind: "say",
    started_at: "2026-07-06T00:00:01.000Z",
    completed_at: "2026-07-06T00:00:01.500Z",
    evidence_refs: []
  });
  assert.equal(beforeResponder.length, 0);

  const closed = tracker.recordSlotCompletion({
    schema: "actor-turn-slot-completion/v1",
    session_id: "test-session",
    slot_index: 2,
    actor_id: "npc_b",
    provider_id: "scripted-social",
    model: "scripted-social",
    turn_id: "turn-b-1",
    cycle_id: "cycle-1",
    action_kind: "say",
    started_at: "2026-07-06T00:00:02.000Z",
    completed_at: "2026-07-06T00:00:02.500Z",
    evidence_refs: ["evidence/b-say.json"]
  });
  assert.equal(closed.length, 1);
  assert.equal(closed[0]?.window_id, window.window_id);
  assert.equal(closed[0]?.close_reason, "all_other_actor_slots_completed");
  assert.equal(closed[0]?.response_chat_events[0]?.message, "I can make oak_log available.");
});

test("observe carries cross-actor visibility, structured chat, and loaded-world scope", async () => {
  const actor = positionedActor("npc_a", 0);
  const other = positionedActor("npc_b", 3);
  const result = await observe({
    actor,
    target: other,
    otherActors: [other],
    dialogueState: createDialogueState({ busyRepliesBeforeAvailable: 0 }),
    memory: createMemory(4),
    chatEvents: [
      {
        speaker_id: "npc_b",
        message: "I can make oak_log available.",
        observed_at: "2026-07-06T00:00:02.000Z",
        tick: 2
      }
    ]
  });

  assert.equal(result.visibleActors[0]?.id, "npc_b");
  assert.equal(result.visibleActors[0]?.distance, 3);
  assert.equal(result.chatEvents?.[0]?.speaker_id, "npc_b");
  assert.equal(result.loadedWorldScope?.absence_claims_exhaustive, false);
  assert.match(result.loadedWorldScope?.caveat ?? "", /loaded Mineflayer/);
});

test("public-history export omits known private fields and rejects unknown evidence fields", () => {
  const baseSession: LegibilitySessionArtifact = {
    schema: "legibility-session/v1",
    session_id: "test-session",
    created_at: "2026-07-06T00:00:00.000Z",
    actor_routes: routes,
    slot_events: [],
    chat_events: [],
    response_windows: [],
    transition_rows: []
  };
  const withPrivate = {
    ...baseSession,
    soul_text: "private soul text"
  } as unknown as LegibilitySessionArtifact;
  const exported = exportPublicHistory(withPrivate);
  assert.equal(exported.leakage_checks.private_field_scan.omitted_private_key_count, 1);
  assert.equal(JSON.stringify(exported).includes("private soul text"), false);

  const withUnknown = {
    ...baseSession,
    slot_events: [
      {
        schema: "actor-turn-slot-completion/v1",
        session_id: "test-session",
        slot_index: 1,
        actor_id: "npc_a",
        provider_id: "deterministic-social",
        model: "deterministic-social",
        turn_id: "turn-a",
        cycle_id: "cycle-1",
        action_kind: "say",
        started_at: "2026-07-06T00:00:01.000Z",
        completed_at: "2026-07-06T00:00:01.500Z",
        evidence_refs: [],
        surprise_private_shape: true
      }
    ]
  } as unknown as LegibilitySessionArtifact;
  assert.throws(() => exportPublicHistory(withUnknown), /rejected unknown fields/);
});

test("Session 1 smoke writes rows, public history, and positive scripted history lift", async () => {
  const outputDir = path.join(rootDir, "smoke");
  const result = await runSession1LegibilitySmoke({ outputDir });
  assert.equal(result.rows.length, 2);
  assert.ok(result.rows.every((row) => row.observed_delta.social_response.response_window.status === "closed"));
  assert.equal(result.rows[0]?.observed_delta.social_response.response_window.response_chat_events.length, 1);
  assert.match(
    result.rows[0]?.observed_delta.social_response.response_window.response_chat_events[0]?.message ?? "",
    /make oak_log available/
  );
  assert.equal(result.rows[1]?.observed_delta.social_response.response_window.response_chat_events.length, 1);
  assert.match(
    result.rows[1]?.observed_delta.social_response.response_window.response_chat_events[0]?.message ?? "",
    /visible material stake/
  );
  assert.ok(
    result.rows.some((row) =>
      row.observed_delta.material.classes.includes("possession_or_access_granted")
    )
  );

  const session = await readJson<LegibilitySessionArtifact>(result.sessionPath);
  assert.equal(session.slot_events.some((event) => event.provider_id === "scripted-social"), true);
  const score = await readJson<LegibilityScoreReport>(result.scoreReportPath);
  const socialHistory = score.metrics.find((metric) =>
    metric.condition === "scripted_responder" &&
    metric.layer === "social_response" &&
    metric.predictor_arm === "history_grounded"
  );
  const materialHistory = score.metrics.find((metric) =>
    metric.condition === "scripted_responder" &&
    metric.layer === "material_access" &&
    metric.predictor_arm === "history_grounded"
  );
  assert.ok(socialHistory);
  assert.ok(materialHistory);
  assert.ok(socialHistory.lift > 0);
  assert.ok(materialHistory.lift > 0);

  const publicHistory = await readJson<LegibilitySessionArtifact>(result.publicHistoryPath);
  assert.equal(JSON.stringify(publicHistory).includes("provider-output"), false);
});

test("scoring refuses predicted_delta rows and pre-lock predictions", () => {
  const declaration = createExperimentDeclaration({
    experimentId: "scoring-negative",
    actorAssignments: [{ condition: "scripted_responder", actorIds: ["npc_b"] }],
    scenarioFamilies: ["fixture"],
    seedResetRefs: ["seed-reset/test.json"],
    providerFree: true,
    writtenAt: "2026-07-06T00:00:00.000Z"
  });
  const row = {
    schema_version: "transition-row/v1",
    row_id: "row-1",
    session_id: "test-session",
    seed_or_reset_id: "seed-1",
    cycle_index: 1,
    actor_id: "npc_a",
    condition: "scripted_responder",
    timestamps: {
      action_selected_at: "2026-07-06T00:00:01.000Z",
      action_started_at: "2026-07-06T00:00:01.000Z",
      action_finished_at: "2026-07-06T00:00:01.500Z",
      label_locked_at: "2026-07-06T00:00:03.000Z"
    },
    state_before: {
      snapshot_ref: "state.json",
      other_actors: {
        visible_actor_ids: ["npc_b"],
        interaction_range_actor_ids: ["npc_b"],
        loaded_world_caveat: "fixture"
      },
      social_context_refs: { recent_interaction_refs: [] }
    },
    executed_action: {
      action_kind: "say",
      runtime_action_id: "turn-a",
      validation_status: "passed",
      permission_status: "passed",
      action_started: true
    },
    observed_delta: {
      physical: { classes: ["no_physical_delta"], evidence_refs: [] },
      material: { classes: ["possession_or_access_granted"], evidence_refs: ["evidence/material.json"] },
      social_response: {
        response_window: {
          schema: "response-window/v1",
          window_id: "window-1",
          session_id: "test-session",
          focal_actor_id: "npc_a",
          focal_turn_id: "turn-a",
          focal_slot_index: 1,
          required_responder_actor_ids: ["npc_b"],
          completed_responder_actor_ids: ["npc_b"],
          opened_at: "2026-07-06T00:00:01.500Z",
          closed_at: "2026-07-06T00:00:02.500Z",
          close_reason: "all_other_actor_slots_completed",
          timeout_after_slots: 2,
          status: "closed",
          response_chat_events: [],
          evidence_refs: []
        },
        classes: ["reply_accept_or_acknowledge"],
        evidence_refs: ["evidence/chat.json"]
      },
      exclusions: []
    },
    row_quality: {
      verdict: "valid",
      inclusion_tags: ["interaction_opportunity", "material_stake"],
      exclusion_reasons: [],
      notes: []
    },
    metadata: {
      provider: "deterministic-social",
      model: "deterministic-social",
      scenario_family_id: "fixture",
      scenario_family_ids: ["fixture"],
      artifact_refs: []
    }
  } satisfies TransitionRowV1;
  const preLockPrediction: LegibilityPrediction = {
    schema_version: "legibility-prediction/v1",
    prediction_id: "prediction-1",
    row_id: "row-1",
    predictor_arm: "history_grounded",
    layer: "social_response",
    predicted_label: "reply_accept_or_acknowledge",
    probabilities: { reply_accept_or_acknowledge: 1 },
    created_at: "2026-07-06T00:00:02.000Z"
  };
  assert.throws(
    () => scoreLegibilityPredictions({
      declaration,
      declarationRef: "declaration.json",
      rows: [row],
      predictions: [preLockPrediction]
    }),
    /not created after label lock/
  );

  const rowWithPredictedDelta = {
    ...row,
    observed_delta: {
      ...row.observed_delta,
      predicted_delta: "forbidden"
    }
  } as unknown as TransitionRowV1;
  assert.throws(
    () => scoreLegibilityPredictions({
      declaration,
      declarationRef: "declaration.json",
      rows: [rowWithPredictedDelta],
      predictions: []
    }),
    /must not contain predicted_delta/
  );
});
