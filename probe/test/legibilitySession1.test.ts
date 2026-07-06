import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertPublicHistoryChecksPassed,
  exportPublicHistory
} from "../src/legibility/publicHistory.js";
import { createPublicHistoryPredictions } from "../src/legibility/predictors.js";
import { ResponseWindowTracker } from "../src/legibility/responseWindows.js";
import { runSession1LegibilitySmoke } from "../src/legibility/session1Smoke.js";
import { runSharedSessionSchedule } from "../src/legibility/sharedSessionScheduler.js";
import { scoreLegibilityPredictions } from "../src/legibility/scoring.js";
import {
  buildProviderFreeConditionRoutesFromDeclaration,
  createExperimentDeclaration,
  requireConditionRouteForActor
} from "../src/legibility/declaration.js";
import {
  conditionProvenanceForSeedReset,
  createResampledSoulSeedResetRecord,
  validateSeedResetRecordV1,
  writeSeedResetRecord
} from "../src/legibility/seedResetRecord.js";
import {
  assertLiveSessionEvidenceRefsResolve,
  assertProviderFreeLiveRoutes,
  chatEventsForActor,
  computeLiveChatObservedBy,
  defaultLiveSharedActorRoutes
} from "../src/legibility/liveSharedSession.js";
import { ensureActorSoul } from "../src/runtime/goals/actorSoulStore.js";
import { observe } from "../src/tools/observe.js";
import { createDialogueState } from "../src/runtime/dialogueState.js";
import { createMemory } from "../src/runtime/memory.js";
import type {
  ActorProviderRoute,
  ActorTurnSlotCompletionEvent,
  LegibilityPrediction,
  LegibilityScoreReport,
  LegibilitySessionArtifact,
  PublicHistoryArtifact,
  PublicHistoryEvent,
  ResponseWindowRecord,
  SeedResetRecordV1,
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

async function listTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listTypeScriptFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".ts") ? [entryPath] : [];
  }));
  return nested.flat();
}

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

function closedRehearsalWindow(input: {
  sessionId: string;
  actorId: string;
  slotIndex: number;
  turnId: string;
}): ResponseWindowRecord {
  return {
    schema: "response-window/v1",
    window_id: `${input.turnId}-window`,
    session_id: input.sessionId,
    focal_actor_id: input.actorId,
    focal_turn_id: input.turnId,
    focal_slot_index: input.slotIndex,
    required_responder_actor_ids: [],
    completed_responder_actor_ids: [],
    opened_at: "2026-07-06T00:00:01.500Z",
    closed_at: "2026-07-06T00:00:02.500Z",
    close_reason: "all_other_actor_slots_completed",
    timeout_after_slots: 1,
    status: "closed",
    response_chat_events: [],
    evidence_refs: []
  };
}

function rehearsalRow(input: {
  event: ActorTurnSlotCompletionEvent;
  route: ActorProviderRoute & { condition: TransitionRowV1["condition"] };
  index: number;
}): TransitionRowV1 {
  const seedOrResetId = input.route.seed_or_reset_id ?? `c2-7-${input.route.condition}`;
  const seedResetRefs = input.route.seed_reset_ref ? [input.route.seed_reset_ref] : [];
  return {
    schema_version: "transition-row/v1",
    row_id: `${input.event.turn_id}-row`,
    session_id: input.event.session_id,
    seed_or_reset_id: seedOrResetId,
    cycle_index: input.index + 1,
    actor_id: input.event.actor_id,
    condition: input.route.condition,
    timestamps: {
      action_selected_at: input.event.started_at,
      action_started_at: input.event.started_at,
      action_finished_at: input.event.completed_at,
      response_window_closed_at: "2026-07-06T00:00:02.500Z",
      label_locked_at: "2026-07-06T00:00:03.000Z"
    },
    state_before: {
      snapshot_ref: `state-before/${input.event.actor_id}.json`,
      other_actors: {
        visible_actor_ids: [],
        interaction_range_actor_ids: [],
        loaded_world_caveat:
          "Provider-free C2-7 routing rehearsal; no live loaded-world absence claim."
      },
      social_context_refs: {
        recent_interaction_refs: []
      }
    },
    executed_action: {
      action_kind: input.event.action_kind,
      runtime_action_id: input.event.turn_id,
      validation_status: "passed",
      permission_status: "passed",
      action_started: true
    },
    observed_delta: {
      physical: {
        classes: ["no_physical_delta"],
        evidence_refs: []
      },
      material: {
        classes: ["no_material_delta"],
        evidence_refs: []
      },
      social_response: {
        response_window: closedRehearsalWindow({
          sessionId: input.event.session_id,
          actorId: input.event.actor_id,
          slotIndex: input.event.slot_index,
          turnId: input.event.turn_id
        }),
        classes: ["no_observable_response"],
        evidence_refs: []
      },
      exclusions: []
    },
    row_quality: {
      verdict: "valid",
      inclusion_tags: ["condition_routing_rehearsal"],
      exclusion_reasons: [],
      notes: ["Provider-free C2-7 condition machinery rehearsal row."]
    },
    metadata: {
      provider: input.event.provider_id,
      model: input.event.model,
      scenario_family_id: "c2-7-condition-machinery-rehearsal",
      scenario_family_ids: ["c2-7-condition-machinery-rehearsal"],
      artifact_refs: [...input.event.evidence_refs, ...seedResetRefs]
    }
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

test("C2-7 condition routing covers scripted, stable soul, and resampled soul provider-free", async () => {
  const outputDir = path.join(rootDir, "c2-7-condition-machinery");
  const seedResetRef = path.join("seed-reset", "c2-7-resampled-soul-001.json");
  const declaration = createExperimentDeclaration({
    experimentId: "c2-7-condition-rehearsal",
    actorAssignments: [
      {
        condition: "scripted_responder",
        actorIds: ["npc_a"],
        seedOrResetId: "c2-7-scripted-provider-free-001",
        counterbalancing: "provider-free scripted responder positive-control route"
      },
      {
        condition: "stable_soul",
        actorIds: ["npc_b"],
        responderActorIds: ["npc_b"],
        seedOrResetId: "c2-7-stable-soul-001",
        counterbalancing: "provider-free deterministic stand-in through existing ActorSoul"
      },
      {
        condition: "resampled_soul",
        actorIds: ["npc_c"],
        responderActorIds: ["npc_c"],
        seedOrResetId: "c2-7-resampled-soul-001",
        seedResetRef,
        resetIndex: 1,
        counterbalancing: "provider-free deterministic stand-in with resampled seed/reset record"
      }
    ],
    scenarioFamilies: ["c2-7-condition-machinery-rehearsal"],
    seedResetRefs: [seedResetRef],
    providerFree: true,
    writtenAt: "2026-07-06T00:00:00.000Z"
  });
  const stableCondition = declaration.conditions.find((condition) => condition.condition === "stable_soul");
  const resampledCondition = declaration.conditions.find((condition) => condition.condition === "resampled_soul");
  assert.ok(stableCondition);
  assert.ok(resampledCondition);
  assert.equal(stableCondition.soul_provenance.actor_soul_route, "stable_actor_soul");
  assert.equal(stableCondition.soul_provenance.family_holdout.held_out_family_satisfied, true);
  assert.equal(resampledCondition.seed_reset.seed_reset_ref, seedResetRef);
  assert.equal(resampledCondition.soul_provenance.actor_soul_route, "resampled_actor_soul");
  assert.equal(resampledCondition.soul_provenance.private_soul_text_in_declaration, false);

  const seedResetRecord = createResampledSoulSeedResetRecord({
    recordId: "seed-reset-c2-7-resampled-001",
    runId: "c2-7-condition-rehearsal",
    seedOrResetId: "c2-7-resampled-soul-001",
    recordedAt: "2026-07-06T00:00:00.000Z",
    activeActorIds: ["npc_a", "npc_b", "npc_c"],
    scenarioFamilyIdsDeclared: ["c2-7-condition-machinery-rehearsal"],
    preRunDeclarationRef: "experiment-declaration.json",
    transitionRowBatchRef: "transition-rows/",
    providerUsageRef: "provider-free",
    conditionProvenance: conditionProvenanceForSeedReset(resampledCondition)
  });
  const seedResetPath = await writeSeedResetRecord(
    path.join(outputDir, seedResetRef),
    seedResetRecord
  );
  assert.equal(path.relative(outputDir, seedResetPath), seedResetRef);
  const writtenRecord = await readJson<SeedResetRecordV1>(seedResetPath);
  const validation = validateSeedResetRecordV1(writtenRecord);
  assert.equal(validation.ok, true);
  assert.equal(writtenRecord.counts_toward_legibility_seed_requirement, false);
  assert.equal(writtenRecord.session_kind, "deterministic_no_world");
  assert.equal(writtenRecord.condition_provenance?.condition, "resampled_soul");
  assert.equal(
    writtenRecord.condition_provenance?.soul_instance_id,
    resampledCondition.soul_provenance.soul_instance_id
  );

  const actorRoutes = buildProviderFreeConditionRoutesFromDeclaration({
    declaration
  });

  assertProviderFreeLiveRoutes(actorRoutes);
  assert.deepEqual(actorRoutes.map((route) => route.condition), [
    "scripted_responder",
    "stable_soul",
    "resampled_soul"
  ]);
  assert.equal(requireConditionRouteForActor({ actorRoutes, actorId: "npc_a" }).provider_id, "scripted-social");
  const stableRoute = requireConditionRouteForActor({ actorRoutes, actorId: "npc_b" });
  const resampledRoute = requireConditionRouteForActor({ actorRoutes, actorId: "npc_c" });
  assert.equal(stableRoute.provider_id, "deterministic-social");
  assert.equal(stableRoute.actor_soul_route, "stable_actor_soul");
  assert.equal(stableRoute.soul_instance_id, stableCondition.soul_provenance.soul_instance_id);
  assert.equal(resampledRoute.provider_id, "deterministic-social");
  assert.equal(resampledRoute.actor_soul_route, "resampled_actor_soul");
  assert.equal(resampledRoute.seed_or_reset_id, seedResetRecord.seed_or_reset_id);
  assert.equal(resampledRoute.seed_reset_ref, seedResetRef);

  const actorWorkspaceRoot = path.join(outputDir, "actor-workspaces");
  const stableSoul = await ensureActorSoul(actorWorkspaceRoot, "npc_b");
  const resampledSoul = await ensureActorSoul(actorWorkspaceRoot, "npc_c");
  assert.equal(stableSoul.schema, "actor-soul/v1");
  assert.equal(resampledSoul.schema, "actor-soul/v1");

  const slotEvents = await runSharedSessionSchedule({
    session_id: "c2-7-condition-rehearsal",
    actorRoutes,
    slotsPerActor: 1,
    turnHandler({ actor_id, route, slot_index }) {
      return {
        action_kind: route.provider_id === "scripted-social" ? "say" : "observe",
        evidence_refs: [`evidence/${actor_id}-${slot_index}.json`],
        started_at: `2026-07-06T00:00:0${slot_index}.000Z`,
        completed_at: `2026-07-06T00:00:0${slot_index}.500Z`
      };
    }
  });
  const rows = slotEvents.map((event, index) =>
    rehearsalRow({
      event,
      route: requireConditionRouteForActor({ actorRoutes, actorId: event.actor_id }),
      index
    })
  );

  assert.deepEqual(rows.map((row) => row.condition), [
    "scripted_responder",
    "stable_soul",
    "resampled_soul"
  ]);
  const resampledRow = rows.find((row) => row.seed_or_reset_id === seedResetRecord.seed_or_reset_id);
  assert.ok(resampledRow);
  assert.equal(resampledRow.condition, "resampled_soul");
  assert.ok(resampledRow.metadata.artifact_refs.includes(seedResetRef));
});

test("C2-7 declarations keep stable soul identity and resample reset identity explicitly", () => {
  const stableInput = {
    scenarioFamilies: ["c2-7-condition-machinery-rehearsal"],
    seedResetRefs: [] as string[],
    providerFree: true,
    actorAssignments: [
      {
        condition: "stable_soul" as const,
        actorIds: ["npc_b"],
        responderActorIds: ["npc_b"],
        seedOrResetId: "stable-world-reset-001",
        counterbalancing: "repeat stable responder declaration"
      }
    ]
  };
  const stableFirst = createExperimentDeclaration({
    ...stableInput,
    experimentId: "stable-repeat-a",
    writtenAt: "2026-07-06T00:00:00.000Z"
  });
  const stableSecond = createExperimentDeclaration({
    ...stableInput,
    experimentId: "stable-repeat-b",
    writtenAt: "2026-07-06T00:10:00.000Z"
  });
  assert.equal(
    stableFirst.conditions[0]?.soul_provenance.soul_family_id,
    stableSecond.conditions[0]?.soul_provenance.soul_family_id
  );
  assert.equal(
    stableFirst.conditions[0]?.soul_provenance.soul_instance_id,
    stableSecond.conditions[0]?.soul_provenance.soul_instance_id
  );

  const resampledFirst = createExperimentDeclaration({
    experimentId: "resampled-repeat-a",
    actorAssignments: [
      {
        condition: "resampled_soul",
        actorIds: ["npc_c"],
        responderActorIds: ["npc_c"],
        seedOrResetId: "resampled-reset-001",
        seedResetRef: "seed-reset/resampled-reset-001.json",
        resetIndex: 1,
        counterbalancing: "first resampled responder reset"
      }
    ],
    scenarioFamilies: ["c2-7-condition-machinery-rehearsal"],
    seedResetRefs: ["seed-reset/resampled-reset-001.json"],
    providerFree: true,
    writtenAt: "2026-07-06T00:00:00.000Z"
  });
  const resampledSecond = createExperimentDeclaration({
    experimentId: "resampled-repeat-b",
    actorAssignments: [
      {
        condition: "resampled_soul",
        actorIds: ["npc_c"],
        responderActorIds: ["npc_c"],
        seedOrResetId: "resampled-reset-002",
        seedResetRef: "seed-reset/resampled-reset-002.json",
        resetIndex: 2,
        counterbalancing: "second resampled responder reset"
      }
    ],
    scenarioFamilies: ["c2-7-condition-machinery-rehearsal"],
    seedResetRefs: ["seed-reset/resampled-reset-002.json"],
    providerFree: true,
    writtenAt: "2026-07-06T00:10:00.000Z"
  });
  assert.equal(
    resampledFirst.conditions[0]?.soul_provenance.soul_family_id,
    resampledSecond.conditions[0]?.soul_provenance.soul_family_id
  );
  assert.notEqual(
    resampledFirst.conditions[0]?.soul_provenance.soul_instance_id,
    resampledSecond.conditions[0]?.soul_provenance.soul_instance_id
  );
  assert.notEqual(
    resampledFirst.conditions[0]?.seed_reset.seed_or_reset_id,
    resampledSecond.conditions[0]?.seed_reset.seed_or_reset_id
  );
  assert.equal(resampledSecond.conditions[0]?.seed_reset.provenance_path.includes("resampled-reset-002"), true);
});

test("C2-7 declarations reject unknown or under-specified conditions", () => {
  assert.throws(
    () => createExperimentDeclaration({
      experimentId: "invalid-condition",
      actorAssignments: [
        {
          condition: "mystery_condition" as never,
          actorIds: ["npc_x"]
        }
      ],
      scenarioFamilies: ["fixture"],
      seedResetRefs: [],
      providerFree: true,
      writtenAt: "2026-07-06T00:00:00.000Z"
    }),
    /Unknown legibility condition/
  );

  assert.throws(
    () => createExperimentDeclaration({
      experimentId: "missing-resampled-ref",
      actorAssignments: [
        {
          condition: "resampled_soul",
          actorIds: ["npc_c"],
          seedOrResetId: "resampled-reset-missing-ref"
        }
      ],
      scenarioFamilies: ["fixture"],
      seedResetRefs: [],
      providerFree: true,
      writtenAt: "2026-07-06T00:00:00.000Z"
    }),
    /requires an explicit seedResetRef/
  );

  assert.throws(
    () => buildProviderFreeConditionRoutesFromDeclaration({
      declaration: {
        schema_version: "experiment-declaration/v1",
        experiment_id: "invalid-route-condition",
        written_at: "2026-07-06T00:00:00.000Z",
        conditions: [
          {
            condition: "mystery_condition",
            actor_ids: ["npc_x"],
            seed_reset: { seed_or_reset_id: "seed", declared_before_outcome: true },
            soul_provenance: {}
          }
        ]
      } as never
    }),
    /Unknown legibility condition/
  );
});

test("condition literal branches stay inside declaration routing construction", async () => {
  const srcDir = path.resolve(here, "..", "src");
  const allowedRoutingFile = path.join(srcDir, "legibility", "declaration.ts");
  const conditionLiteralBranch =
    /\bcondition\s*(?:===|!==)\s*["'](?:scripted_responder|stable_soul|resampled_soul)["']|["'](?:scripted_responder|stable_soul|resampled_soul)["']\s*(?:===|!==)\s*\bcondition\b/;
  const offenders: string[] = [];

  for (const filePath of await listTypeScriptFiles(srcDir)) {
    if (filePath === allowedRoutingFile) {
      continue;
    }
    const source = await fs.readFile(filePath, "utf8");
    if (conditionLiteralBranch.test(source)) {
      offenders.push(path.relative(path.resolve(here, ".."), filePath));
    }
  }

  assert.deepEqual(offenders, []);
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
        schema: "structured-chat-event/v1",
        session_id: "test-session",
        speaker_id: "npc_b",
        message: "I can make oak_log available.",
        observed_by: ["npc_a"],
        slot_index: 2,
        observed_at: "2026-07-06T00:00:02.000Z",
        tick: 2,
        evidence_refs: ["chat-events/0001-npc_b.json"]
      }
    ]
  });

  assert.equal(result.visibleActors[0]?.id, "npc_b");
  assert.equal(result.visibleActors[0]?.distance, 3);
  assert.equal(result.chatEvents?.[0]?.schema, "structured-chat-event/v1");
  assert.equal(result.chatEvents?.[0]?.speaker_id, "npc_b");
  assert.deepEqual(result.chatEvents?.[0]?.observed_by, ["npc_a"]);
  assert.deepEqual(result.chatEvents?.[0]?.evidence_refs, ["chat-events/0001-npc_b.json"]);
  assert.equal(result.loadedWorldScope?.visible_actor_scan, "provided_actor_roster");
  assert.equal(result.loadedWorldScope?.absence_claims_exhaustive, false);
  assert.match(result.loadedWorldScope?.caveat ?? "", /loaded Mineflayer/);
});

test("live chat observed_by is computed from roster range instead of assuming all actors hear it", () => {
  const roster = [
    { actor_id: "npc_a", connected: true, position: { x: 0, y: 64, z: 0 } },
    { actor_id: "npc_b", connected: true, position: { x: 10, y: 64, z: 0 } },
    { actor_id: "npc_c", connected: true, position: { x: 48, y: 64, z: 0 } },
    { actor_id: "npc_d", connected: false, position: null }
  ];

  assert.deepEqual(
    computeLiveChatObservedBy({
      speaker_id: "npc_a",
      roster,
      radiusBlocks: 32
    }),
    ["npc_b"]
  );
  assert.deepEqual(
    computeLiveChatObservedBy({
      speaker_id: "npc_missing",
      roster,
      radiusBlocks: 32
    }),
    []
  );

  const chatEvents: StructuredChatEvent[] = [
    {
      schema: "structured-chat-event/v1",
      session_id: "test-session",
      speaker_id: "npc_a",
      message: "near actor only",
      observed_by: ["npc_b"],
      slot_index: 1,
      observed_at: "2026-07-06T00:00:01.000Z",
      evidence_refs: ["chat-events/0001-npc_a.json"]
    }
  ];
  assert.equal(chatEventsForActor(chatEvents, "npc_b").length, 1);
  assert.equal(chatEventsForActor(chatEvents, "npc_c").length, 0);
});

test("public-history export fails closed and keeps prompt-shape checks off message values", () => {
  const baseSession: LegibilitySessionArtifact = {
    schema: "legibility-session/v1",
    session_id: "test-session",
    created_at: "2026-07-06T00:00:00.000Z",
    actor_routes: routes,
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
        evidence_refs: []
      }
    ],
    chat_events: [
      {
        schema: "structured-chat-event/v1",
        session_id: "test-session",
        speaker_id: "npc_b",
        message: "I remember the provider said memory is only chat text here.",
        observed_by: ["npc_a"],
        slot_index: 2,
        observed_at: "2026-07-06T00:00:02.000Z",
        evidence_refs: []
      }
    ],
    response_windows: [],
    transition_rows: []
  };
  const withPrivate = {
    ...baseSession,
    soul_text: "private soul text"
  } as unknown as LegibilitySessionArtifact;
  assert.throws(
    () => exportPublicHistory(withPrivate, { createdAt: "2026-07-06T00:00:05.000Z" }),
    /rejected private fields/
  );

  const exported = exportPublicHistory(baseSession, { createdAt: "2026-07-06T00:00:05.000Z" });
  const exportedAgain = exportPublicHistory(baseSession, { createdAt: "2026-07-06T00:00:05.000Z" });
  assert.equal(exported.created_at, "2026-07-06T00:00:05.000Z");
  assert.equal(JSON.stringify(exported), JSON.stringify(exportedAgain));
  assert.equal(exported.leakage_checks.identity_permutation.status, "passed");
  assert.equal(exported.leakage_checks.prompt_shape.status, "passed");
  assert.equal(exported.leakage_checks.private_field_scan.omitted_private_key_count, 0);

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
  assert.throws(
    () => exportPublicHistory(withUnknown, { createdAt: "2026-07-06T00:00:05.000Z" }),
    /rejected unknown fields/
  );
});

test("public-history validation and scoring reject failed leakage checks", () => {
  const declaration = createExperimentDeclaration({
    experimentId: "public-history-negative",
    actorAssignments: [{ condition: "scripted_responder", actorIds: ["npc_b"] }],
    scenarioFamilies: ["fixture"],
    seedResetRefs: ["seed-reset/test.json"],
    providerFree: true,
    writtenAt: "2026-07-06T00:00:00.000Z"
  });
  const failedPublicHistory: PublicHistoryArtifact = {
    schema: "public-history/v1",
    session_id: "test-session",
    created_at: "2026-07-06T00:00:05.000Z",
    allowlist_version: "public-history-allowlist/v1",
    allowlisted_fields: [],
    events: [],
    leakage_checks: {
      schema: "public-history-leakage-checks/v1",
      identity_permutation: { status: "failed", reason: "fixture failure" },
      prompt_shape: { status: "passed", reason: "fixture" },
      private_field_scan: {
        status: "passed",
        omitted_private_key_count: 0,
        unknown_key_failures: []
      }
    }
  };
  assert.throws(
    () => scoreLegibilityPredictions({
      declaration,
      declarationRef: "experiment-declaration.json",
      publicHistory: failedPublicHistory,
      rows: [],
      predictions: []
    }),
    /rejected public history leakage checks/
  );

  const promptShapeLeak: PublicHistoryArtifact = {
    ...failedPublicHistory,
    leakage_checks: {
      ...failedPublicHistory.leakage_checks,
      identity_permutation: { status: "passed", reason: "fixture" }
    },
    events: [
      {
        event_id: "event-1",
        session_id: "test-session",
        slot_index: 1,
        actor_id: "npc_a",
        event_kind: "chat_observed",
        public_payload: {
          speaker_id: "npc_a",
          provider_id: "leaked-key"
        },
        evidence_refs: []
      } as unknown as PublicHistoryEvent
    ]
  };
  assert.throws(
    () => assertPublicHistoryChecksPassed(promptShapeLeak),
    /prompt_shape/
  );
});

test("public-history predictor arms use prior public labels without target-label oracle", () => {
  const declaration = createExperimentDeclaration({
    experimentId: "predictor-fixture",
    actorAssignments: [{ condition: "scripted_responder", actorIds: ["npc_b"] }],
    scenarioFamilies: ["fixture"],
    seedResetRefs: ["seed-reset/test.json"],
    providerFree: true,
    writtenAt: "2026-07-06T00:00:00.000Z"
  });
  const responseEvent = (
    rowId: string,
    slotIndex: number,
    label: string
  ): PublicHistoryEvent => ({
    event_id: `${rowId}-social`,
    session_id: "test-session",
    slot_index: slotIndex,
    actor_id: "npc_a",
    event_kind: "response_window_closed",
    public_payload: {
      row_id: rowId,
      action_kind: "say",
      social_response_label: label,
      window_id: `${rowId}-window`,
      focal_actor_id: "npc_a",
      required_responder_actor_ids: ["npc_b"],
      completed_responder_actor_ids: ["npc_b"],
      close_reason: "all_other_actor_slots_completed",
      response_chat_event_count: 1,
      scenario_family_id: "fixture",
      inclusion_tags: ["interaction_opportunity"]
    },
    evidence_refs: []
  });
  const publicHistory: PublicHistoryArtifact = {
    schema: "public-history/v1",
    session_id: "test-session",
    created_at: "2026-07-06T00:00:05.000Z",
    allowlist_version: "public-history-allowlist/v1",
    allowlisted_fields: [],
    events: [
      responseEvent("row-1", 1, "reply_accept_or_acknowledge"),
      responseEvent("row-2", 2, "reply_accept_or_acknowledge"),
      responseEvent("row-3", 3, "reply_refuse_or_disagree")
    ],
    leakage_checks: {
      schema: "public-history-leakage-checks/v1",
      identity_permutation: { status: "passed", reason: "fixture" },
      prompt_shape: { status: "passed", reason: "fixture" },
      private_field_scan: {
        status: "passed",
        omitted_private_key_count: 0,
        unknown_key_failures: []
      }
    }
  };
  const predictions = createPublicHistoryPredictions({
    publicHistory,
    declaration,
    createdAt: "2026-07-06T00:01:00.000Z",
    arms: [
      "history_grounded",
      "majority_or_no_response",
      "last_response_carried_forward",
      "policy_copy",
      "actor_id_only",
      "first_m_public_responses",
      "action_family_by_responder",
      "public_profile_only"
    ],
    policyCopyMinCount: 1
  });
  const row3History = predictions.find((prediction) =>
    prediction.row_id === "row-3" &&
    prediction.layer === "social_response" &&
    prediction.predictor_arm === "history_grounded"
  );
  assert.ok(row3History);
  assert.equal(row3History.predicted_label, "reply_accept_or_acknowledge");
  assert.notEqual(row3History.predicted_label, "reply_refuse_or_disagree");
  assert.deepEqual(
    new Set(predictions.filter((prediction) =>
      prediction.row_id === "row-3" && prediction.layer === "social_response"
    ).map((prediction) => prediction.predictor_arm)),
    new Set([
      "history_grounded",
      "majority_or_no_response",
      "last_response_carried_forward",
      "policy_copy",
      "actor_id_only",
      "first_m_public_responses",
      "action_family_by_responder",
      "public_profile_only"
    ])
  );
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

  const publicHistory = await readJson<PublicHistoryArtifact>(result.publicHistoryPath);
  assert.equal(JSON.stringify(publicHistory).includes("provider-output"), false);
  assert.equal(publicHistory.leakage_checks.identity_permutation.status, "passed");
  assert.equal(publicHistory.leakage_checks.prompt_shape.status, "passed");
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
