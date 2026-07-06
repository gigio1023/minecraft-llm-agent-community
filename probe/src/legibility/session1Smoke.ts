import fs from "node:fs/promises";
import path from "node:path";

import { say } from "../tools/say.js";
import { createDialogueState } from "../runtime/dialogueState.js";
import { runSocialActorTurnProvider } from "../provider/socialActorTurnProvider.js";
import type {
  ActionCard,
  ActorTurnInput
} from "../runtime/goals/actorEpisode/index.js";
import type { ActorTurnResolvedAction } from "../runtime/goals/actorEpisode/types.js";
import type { ActionCardProjection } from "../runtime/goals/actorEpisode/actionCards.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { createExperimentDeclaration, writeExperimentDeclaration } from "./declaration.js";
import { exportPublicHistory } from "./publicHistory.js";
import { ResponseWindowTracker } from "./responseWindows.js";
import { scoreLegibilityPredictions } from "./scoring.js";
import { runSharedSessionSchedule } from "./sharedSessionScheduler.js";
import type {
  ActorProviderRoute,
  ActorTurnSlotCompletionEvent,
  LegibilityPrediction,
  LegibilitySessionArtifact,
  ResponseWindowRecord,
  StructuredChatEvent,
  TransitionRowV1
} from "./types.js";

type SmokeActor = {
  username: string;
  said: string[];
  chat(message: string): void;
};

type PendingFocalAction = {
  slot: ActorTurnSlotCompletionEvent;
  action: ActorTurnResolvedAction;
  stateBeforeRef: string;
  visibleActorIds: string[];
  openedWindow: ResponseWindowRecord;
};

export type Session1SmokeResult = {
  outputDir: string;
  sessionPath: string;
  publicHistoryPath: string;
  declarationPath: string;
  predictionsPath: string;
  scoreReportPath: string;
  rows: TransitionRowV1[];
};

function makeSmokeActor(username: string): SmokeActor {
  return {
    username,
    said: [],
    chat(message: string) {
      this.said.push(message);
    }
  };
}

function actionCard(input: {
  id: string;
  primitiveId: string;
  title: string;
}): ActionCard {
  return {
    schema: "action-card/v1",
    action_card_id: input.id,
    title: input.title,
    description: `Session 1 smoke ${input.primitiveId} action card.`,
    parameters_schema_ref: `runtime-parameters/actor-turn-action-parameters/v1/${input.primitiveId}.json`,
    parameter_hints: input.primitiveId === "say" ? ["Requires text."] : ["No structured parameters required."],
    current_state_requirements: [],
    expected_evidence: [`runtime evidence from ${input.primitiveId}`],
    likely_blockers: [],
    readiness: "ready",
    runtime_mapping_ref: `action-card-mappings/${input.id}.json`
  };
}

function smokeActionProjection(actorId: string): ActionCardProjection {
  const cards = [
    actionCard({ id: "smoke-card-observe", primitiveId: "observe", title: "Observe" }),
    actionCard({ id: "smoke-card-say", primitiveId: "say", title: "Say" }),
    actionCard({ id: "smoke-card-wait", primitiveId: "wait", title: "Wait" })
  ];
  return {
    schema: "action-card-projection/v1",
    actor_id: actorId,
    action_cards: cards,
    runtime_mappings: [
      { kind: "use_primitive", action_card_id: "smoke-card-observe", primitive_id: "observe" },
      { kind: "use_primitive", action_card_id: "smoke-card-say", primitive_id: "say" },
      { kind: "use_primitive", action_card_id: "smoke-card-wait", primitive_id: "wait" }
    ],
    deferred_counts: { primitives: 0, action_skills: 0 },
    missing_affordances: []
  };
}

function smokeActorTurnInput(input: {
  turnId: string;
  actorId: string;
  visibleActorId: string;
  inventoryCounts: Record<string, number>;
}): ActorTurnInput {
  return {
    schema: "actor-turn-input/v1",
    turn_id: input.turnId,
    decision_frame: {
      schema: "actor-turn-decision-frame/v1",
      priority_order: ["respond to visible co-actor", "preserve runtime evidence"],
      episode_focus: "Session 1 provider-free legibility smoke",
      episode_focus_status: {
        status: "open",
        focus: "Produce structured public interaction evidence.",
        evidence_refs: [],
        next: "Choose one Action Card."
      },
      current_truths: ["Two actors are visible in a bounded fixture window."],
      completed_work: [],
      recent_action_verdicts: [],
      do_not_repeat: [],
      open_progress_front: [],
      next_action_guidance: []
    },
    active_episode: {
      schema: "active-episode/v1",
      episode_id: "session1-smoke-episode",
      actor_id: input.actorId,
      actors_visible_or_relevant: [input.visibleActorId],
      life_goal_ref: "goals/life/life-session1-smoke.json",
      purpose: "Provider-free Session 1 integration smoke.",
      current_focus: "Create public, evidence-backed co-actor response rows.",
      selected_plan_bead_refs: [],
      related_plan_bead_refs: [],
      success_signals: [],
      pivot_triggers: [],
      mistake_budget: {
        allow_exploration_turns: 0,
        observe_repeat_limit: 1,
        exact_blocker_repeat_limit: 1
      },
      social_pressure: [],
      opened_from_refs: [],
      started_at_turn_ref: input.turnId,
      status: "active"
    },
    actor_context: {
      actor_id: input.actorId,
      actor_soul_ref: `goals/soul/soul-${input.actorId}.json`,
      life_goal_ref: "goals/life/life-session1-smoke.json",
      life_goal_summary: "Maintain a tiny provider-free social-material smoke."
    },
    current_state: {
      schema: "actor-turn-current-state/v1",
      observer_id: input.actorId,
      inventory_counts: input.inventoryCounts,
      visible_actors: [{ id: input.visibleActorId, distance: 2, busy: false }],
      nearby_block_observations: [],
      shared_storage: { status: "not_observed", items: [], evidence_refs: [] },
      settlement_progress: {
        inventory_counts: input.inventoryCounts,
        shared_storage_status: "not_observed",
        known_positions: {},
        checklist: [],
        recent_blockers: []
      }
    },
    source_evidence_bundle: {
      schema: "actor-turn-source-evidence-bundle/v1",
      observation: {
        observation_refs: [],
        inventory_items: Object.entries(input.inventoryCounts).map(([name, count]) => ({ name, count })),
        visible_actors: [{ id: input.visibleActorId, distance: 2, busy: false }],
        nearby_blocks: []
      },
      world_event_cards: [],
      memory_cards: [],
      recent_action_details: [],
      plan_bead_cards: []
    },
    relationship_context: {
      relationship_refs: [],
      visible_actor_ids: [input.visibleActorId],
      relationship_cards: []
    },
    runtime_retry_constraints: [],
    action_cards: smokeActionProjection(input.actorId).action_cards,
    minecraft_basic_guide: {
      schema: "minecraft-basic-guide/v1",
      item_flows: [],
      station_requirements: [],
      blocker_recovery_guides: [],
      observe_stop_guides: []
    },
    provider_budget_hint: {
      provider_id: "deterministic-social",
      model: "provider-free-smoke",
      status: "ok"
    }
  } as unknown as ActorTurnInput;
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

function relative(outputDir: string, filePath: string) {
  return path.relative(outputDir, filePath);
}

function readText(action: ActorTurnResolvedAction) {
  const parameters = action.parameters as Record<string, unknown>;
  return typeof parameters.text === "string" ? parameters.text : "acknowledged";
}

function socialLabelForChat(message: string) {
  return /cannot|need a visible material stake|not yet/i.test(message)
    ? "reply_refuse_or_disagree" as const
    : "reply_accept_or_acknowledge" as const;
}

function materialLabelForResponder(input: {
  message: string;
  responderHasMaterial: boolean;
}) {
  if (input.responderHasMaterial && /make .* available|available/i.test(input.message)) {
    return "possession_or_access_granted" as const;
  }
  return "possession_or_access_refused" as const;
}

function prediction(input: {
  row: TransitionRowV1;
  layer: "social_response" | "material_access";
  arm: string;
  label: string;
  createdAt: string;
}): LegibilityPrediction {
  return {
    schema_version: "legibility-prediction/v1",
    prediction_id: `${input.row.row_id}-${input.layer}-${input.arm}`,
    row_id: input.row.row_id,
    predictor_arm: input.arm,
    layer: input.layer,
    predicted_label: input.label as LegibilityPrediction["predicted_label"],
    probabilities: { [input.label]: 1 },
    created_at: input.createdAt
  };
}

export async function runSession1LegibilitySmoke(input: {
  outputDir: string;
  writtenAt?: string;
  cleanOutputDir?: boolean;
}): Promise<Session1SmokeResult> {
  const outputDir = input.outputDir;
  if (input.cleanOutputDir ?? true) {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
  const sessionId = `session1-legibility-smoke-${Date.now()}`;
  const declaredAt = input.writtenAt ?? "2026-07-06T00:00:00.000Z";
  const actorRoutes: ActorProviderRoute[] = [
    {
      actor_id: "npc_a",
      provider_id: "deterministic-social",
      model: "deterministic-social",
      condition: "scripted_responder"
    },
    {
      actor_id: "npc_b",
      provider_id: "scripted-social",
      model: "scripted-social",
      condition: "scripted_responder"
    }
  ];
  const declaration = createExperimentDeclaration({
    experimentId: sessionId,
    actorAssignments: [
      {
        condition: "scripted_responder",
        actorIds: ["npc_b"],
        counterbalancing: "npc_a focal, npc_b scripted responder, two deterministic material-stake turns"
      }
    ],
    scenarioFamilies: ["session1-scripted-material-request"],
    seedResetRefs: ["seed-reset/session1-provider-free-fixture.json"],
    providerFree: true,
    writtenAt: declaredAt
  });
  const declarationPath = await writeExperimentDeclaration(
    path.join(outputDir, "experiment-declaration.json"),
    declaration
  );

  const actors = {
    npc_a: makeSmokeActor("npc_a"),
    npc_b: makeSmokeActor("npc_b")
  };
  const chatEvents: StructuredChatEvent[] = [];
  const rows: TransitionRowV1[] = [];
  const responseTracker = new ResponseWindowTracker({
    sessionId,
    activeActorIds: ["npc_a", "npc_b"],
    timeoutAfterSlots: 2
  });
  const pendingByWindow = new Map<string, PendingFocalAction>();
  const providerWorkspaceRoot = path.join(outputDir, "actor-workspaces");

  const slotEvents = await runSharedSessionSchedule({
    session_id: sessionId,
    actorRoutes,
    slotsPerActor: 2,
    turnHandler: async ({ actor_id, route, turn_id, cycle_id, slot_index }) => {
      const targetActorId = actor_id === "npc_a" ? "npc_b" : "npc_a";
      const responderHasMaterial = actor_id === "npc_b" && slot_index === 2;
      const inventoryCounts: Record<string, number> = actor_id === "npc_b" && responderHasMaterial
        ? { oak_log: 1 }
        : {};
      const actorTurnInput = smokeActorTurnInput({
        turnId: turn_id,
        actorId: actor_id,
        visibleActorId: targetActorId,
        inventoryCounts
      });
      const provider = await runSocialActorTurnProvider({
        providerId: route.provider_id,
        actorWorkspaceRootDir: providerWorkspaceRoot,
        actorId: actor_id,
        cycleId: cycle_id,
        cycleGoalId: "session1-smoke-cycle-goal",
        actorTurnInput,
        actionCardProjection: smokeActionProjection(actor_id),
        defaultPrimitive: actor_id === "npc_a" ? "say" : undefined,
        runId: sessionId
      });
      if (!provider.ok) {
        throw new Error(`Provider failed in Session 1 smoke: ${provider.error}`);
      }
      const text = readText(provider.action);
      const evidenceRefs: string[] = [provider.actionRef];
      if (provider.action.kind === "use_primitive" && provider.action.primitive_id === "say") {
        const delivered = await say({
          actor: actors[actor_id as "npc_a" | "npc_b"],
          target: actors[targetActorId as "npc_a" | "npc_b"],
          dialogueState: createDialogueState({ busyRepliesBeforeAvailable: 0 }),
          text
        });
        const evidencePath = await writeJson(
          path.join(outputDir, "evidence", `${turn_id}-say.json`),
          {
            schema: "actor-evidence/v1",
            evidence_id: `${turn_id}-say`,
            actor_id,
            turn_id,
            tool_attempt: {
              tool: "say",
              args: { text },
              result: delivered as unknown as JsonValue
            },
            verifier_reason: delivered.status
          }
        );
        evidenceRefs.push(relative(outputDir, evidencePath));
        const chatEvent: StructuredChatEvent = {
          schema: "structured-chat-event/v1",
          session_id: sessionId,
          speaker_id: actor_id,
          message: text,
          observed_by: [targetActorId],
          slot_index,
          observed_at: `2026-07-06T00:00:0${slot_index}.000Z`,
          evidence_refs: [relative(outputDir, evidencePath)]
        };
        chatEvents.push(chatEvent);
        responseTracker.recordChatEvent(chatEvent);
      }

      const startedAt = `2026-07-06T00:00:0${slot_index}.000Z`;
      const completedAt = `2026-07-06T00:00:0${slot_index}.500Z`;
      const stateBeforePath = await writeJson(
        path.join(outputDir, "state-before", `${turn_id}.json`),
        {
          schema: "session1-state-before/v1",
          actor_id,
          visible_actor_ids: [targetActorId],
          inventory_counts: inventoryCounts,
          loaded_world_caveat:
            "Provider-free Session 1 fixture: co-presence is bounded to the scripted two-actor smoke."
        }
      );

      const actionKind = provider.action.kind === "use_primitive"
        ? provider.action.primitive_id
        : provider.action.kind;
      const result = {
        action_kind: actionKind,
        action_ref: provider.actionRef,
        evidence_refs: evidenceRefs,
        started_at: startedAt,
        completed_at: completedAt
      };

      if (actor_id === "npc_a") {
        const openedWindow = responseTracker.open({
          focalActorId: actor_id,
          focalTurnId: turn_id,
          focalSlotIndex: slot_index,
          openedAt: completedAt,
          evidenceRefs
        });
        pendingByWindow.set(openedWindow.window_id, {
          slot: {
            schema: "actor-turn-slot-completion/v1",
            session_id: sessionId,
            slot_index,
            actor_id,
            provider_id: route.provider_id,
            model: route.model,
            turn_id,
            cycle_id,
            action_kind: actionKind,
            action_ref: provider.actionRef,
            started_at: startedAt,
            completed_at: completedAt,
            evidence_refs: evidenceRefs
          },
          action: provider.action,
          stateBeforeRef: relative(outputDir, stateBeforePath),
          visibleActorIds: [targetActorId],
          openedWindow
        });
      }

      return result;
    }
  });

  for (const slot of slotEvents) {
    const closedWindows = responseTracker.recordSlotCompletion(slot);
    for (const window of closedWindows) {
      const pending = pendingByWindow.get(window.window_id);
      if (!pending) {
        continue;
      }
      const response = window.response_chat_events[0];
      const message = response?.message ?? "";
      const responderHasMaterial = /make oak_log available/i.test(message);
      const materialLabel = materialLabelForResponder({ message, responderHasMaterial });
      const materialEvidencePath = await writeJson(
        path.join(outputDir, "evidence", `${window.window_id}-material-access.json`),
        {
          schema: "material-access-fixture-event/v1",
          window_id: window.window_id,
          actor_id: "npc_b",
          target_actor_id: "npc_a",
          item_name: "oak_log",
          status: materialLabel,
          evidence_basis:
            materialLabel === "possession_or_access_granted"
              ? "scripted responder had oak_log inventory in state_before and emitted runtime say evidence"
              : "scripted responder lacked material inventory in state_before and emitted runtime refusal evidence"
        }
      );
      const labelLockedAt = `2026-07-06T00:00:${10 + rows.length}.000Z`;
      const row: TransitionRowV1 = {
        schema_version: "transition-row/v1",
        row_id: `${window.window_id}-row`,
        session_id: sessionId,
        seed_or_reset_id: "session1-provider-free-fixture",
        cycle_index: rows.length + 1,
        actor_id: pending.slot.actor_id,
        condition: "scripted_responder",
        timestamps: {
          action_selected_at: pending.slot.started_at,
          action_started_at: pending.slot.started_at,
          action_finished_at: pending.slot.completed_at,
          response_window_closed_at: window.closed_at,
          label_locked_at: labelLockedAt
        },
        state_before: {
          snapshot_ref: pending.stateBeforeRef,
          other_actors: {
            visible_actor_ids: pending.visibleActorIds,
            interaction_range_actor_ids: pending.visibleActorIds,
            loaded_world_caveat:
              "Provider-free Session 1 fixture; live loaded-world absence claims are not inferred."
          },
          social_context_refs: {
            recent_interaction_refs: []
          }
        },
        executed_action: {
          action_kind: pending.slot.action_kind,
          ...(pending.action.kind !== "author_mineflayer_action"
            ? { action_card_id: pending.action.action_card_id }
            : {}),
          runtime_action_id: pending.slot.turn_id,
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
            classes: [materialLabel],
            evidence_refs: [relative(outputDir, materialEvidencePath)]
          },
          social_response: {
            response_window: window,
            classes: [socialLabelForChat(message)],
            evidence_refs: response?.evidence_refs ?? []
          },
          exclusions: []
        },
        row_quality: {
          verdict: "valid",
          inclusion_tags: ["interaction_opportunity", "material_stake"],
          exclusion_reasons: [],
          notes: ["Session 1 provider-free fixture row; not a live Minecraft evidence claim."]
        },
        metadata: {
          provider: pending.slot.provider_id,
          model: pending.slot.model,
          scenario_family_id: "session1-scripted-material-request",
          scenario_family_ids: ["session1-scripted-material-request"],
          artifact_refs: [
            pending.stateBeforeRef,
            ...pending.slot.evidence_refs,
            relative(outputDir, materialEvidencePath)
          ]
        }
      };
      rows.push(row);
      await writeJson(path.join(outputDir, "transition-rows", `${row.row_id}.json`), row);
    }
  }

  const windows = responseTracker.all();
  const session: LegibilitySessionArtifact = {
    schema: "legibility-session/v1",
    session_id: sessionId,
    created_at: declaredAt,
    actor_routes: actorRoutes,
    slot_events: slotEvents,
    chat_events: chatEvents,
    response_windows: windows,
    transition_rows: rows
  };
  const sessionPath = await writeJson(path.join(outputDir, "session.json"), session);
  const publicHistory = exportPublicHistory(session);
  const publicHistoryPath = await writeJson(path.join(outputDir, "public-history.json"), publicHistory);

  const predictionCreatedAt = "2026-07-06T00:01:00.000Z";
  const majoritySocial = rows[0]?.observed_delta.social_response.classes[0] ?? "no_observable_response";
  const majorityMaterial = rows[0]?.observed_delta.material.classes[0] ?? "no_material_delta";
  const predictions = rows.flatMap((row) => [
    prediction({
      row,
      layer: "social_response",
      arm: "majority_or_no_response",
      label: majoritySocial,
      createdAt: predictionCreatedAt
    }),
    prediction({
      row,
      layer: "material_access",
      arm: "majority_or_no_response",
      label: majorityMaterial,
      createdAt: predictionCreatedAt
    }),
    prediction({
      row,
      layer: "social_response",
      arm: "history_grounded",
      label: row.observed_delta.social_response.classes[0],
      createdAt: predictionCreatedAt
    }),
    prediction({
      row,
      layer: "material_access",
      arm: "history_grounded",
      label: row.observed_delta.material.classes[0],
      createdAt: predictionCreatedAt
    })
  ]);
  const predictionsPath = await writeJson(path.join(outputDir, "predictions.json"), predictions);
  const scoreReport = scoreLegibilityPredictions({
    declaration,
    declarationRef: relative(outputDir, declarationPath),
    rows,
    predictions
  });
  const scoreReportPath = await writeJson(path.join(outputDir, "score-report.json"), scoreReport);

  return {
    outputDir,
    sessionPath,
    publicHistoryPath,
    declarationPath,
    predictionsPath,
    scoreReportPath,
    rows
  };
}
