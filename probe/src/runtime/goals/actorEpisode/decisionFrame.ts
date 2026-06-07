import type { ActionCardProjection } from "./actionCards.js";
import type {
  ActiveEpisode,
  ActorTurnCurrentStateProjection,
  ActorTurnDecisionFrame,
  EvidenceTraceEntry
} from "./types.js";
import { unique } from "./projectionUtils.js";

function traceEvidenceRefs(entry: EvidenceTraceEntry) {
  return unique([
    entry.action_ref,
    entry.runtime_gate_ref,
    entry.execution_ref ?? "",
    entry.verifier_ref ?? "",
    entry.post_observation_ref ?? "",
    entry.provider_usage_ref ?? ""
  ]);
}

function episodeFocusStatus(input: {
  activeEpisode: ActiveEpisode;
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}): ActorTurnDecisionFrame["episode_focus_status"] {
  const focus = input.activeEpisode.current_focus;
  const recentNoProgress = input.recentEvidenceTrace
    .slice(-3)
    .filter((entry) => entry.outcome === "no_progress" || entry.outcome === "blocked");
  if (recentNoProgress.length > 0) {
    return {
      status: "blocked_or_no_progress",
      focus,
      evidence_refs: [...recentNoProgress.flatMap(traceEvidenceRefs)],
      next: "choose_a_different_visible_action_or_author_a_specific_helper"
    };
  }
  return {
    status: input.activeEpisode.status === "active" ? "open" : "unknown",
    focus,
    evidence_refs: [...input.activeEpisode.opened_from_refs],
    next: "advance_the_focus_with_runtime_evidence_or_pivot_when_current_truths_contradict_it"
  };
}

function structureProgressTruths(currentState: ActorTurnCurrentStateProjection) {
  const progress = currentState.structure_progress;
  if (!progress) {
    return [];
  }
  return unique([
    `structure_progress=${progress.status} placed_blocks=${progress.total_placed_blocks}`,
    ...(progress.latest_anchor
      ? [
          `structure_latest_anchor=(${progress.latest_anchor.x},${progress.latest_anchor.y},${progress.latest_anchor.z})`
        ]
      : []),
    ...(progress.latest_verifier
      ? [
          `structure_local_verifier=${progress.latest_verifier.status}${
            progress.latest_verifier.wall_coverage !== undefined
              ? ` wall_coverage=${progress.latest_verifier.wall_coverage}`
              : ""
          }${
            progress.latest_verifier.roof_coverage !== undefined
              ? ` roof_coverage=${progress.latest_verifier.roof_coverage}`
              : ""
          }`
        ]
      : []),
    ...progress.interpretation_notes
  ]).slice(0, 8);
}

function sessionLifecycleTruths(currentState: ActorTurnCurrentStateProjection) {
  const lifecycle = currentState.session_lifecycle;
  if (!lifecycle) {
    return [];
  }
  return unique([
    `session_status=${lifecycle.status} deaths=${lifecycle.death_count} spawns=${lifecycle.spawn_count}`,
    lifecycle.inventory_may_have_reset
      ? "inventory_may_have_reset_after_death=true; current inventory_counts overrides older memory or episode assumptions"
      : "",
    lifecycle.last_event
      ? `last_session_event=${lifecycle.last_event.kind} at ${lifecycle.last_event.observed_at}${
          lifecycle.last_event.position
            ? ` pos=(${lifecycle.last_event.position.x},${lifecycle.last_event.position.y},${lifecycle.last_event.position.z})`
            : ""
        }`
      : "",
    ...lifecycle.notes
  ]).slice(0, 6);
}

function openProgressFront(input: {
  currentState: ActorTurnCurrentStateProjection;
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}): ActorTurnDecisionFrame["open_progress_front"] {
  const structureProgress = input.currentState.structure_progress;
  const structureFront = structureProgress &&
    (structureProgress.status === "progressing" || structureProgress.status === "blocked")
    ? [
        {
          id: "structure_progress",
          status: structureProgress.status,
          next_theme:
            "Use physical structure evidence and the active goal wording to continue, adapt, or pivot; local pattern verifier status is not universal goal authority.",
          evidence_refs: structureProgress.evidence_refs.slice(0, 6)
        }
      ]
    : [];
  const blockerFront = input.currentState.settlement_progress.recent_blockers.slice(0, 2).map((blocker) => ({
    id: `recent_blocker:${blocker.key}`,
    status: "blocked",
    next_theme: blocker.example ?? `Recent blocker repeated ${blocker.count} time(s).`,
    evidence_refs: []
  }));
  const recentRuntimeBlockers = input.recentEvidenceTrace
    .slice(-4)
    .filter((entry) =>
      entry.outcome === "blocked" ||
      entry.outcome === "rejected_by_contract" ||
      entry.outcome === "timed_out" ||
      entry.outcome === "environment_blocked"
    )
    .map((entry) => ({
      id: `runtime_trace:${entry.turn_id}`,
      status: entry.outcome,
      next_theme: entry.compact_summary,
      evidence_refs: traceEvidenceRefs(entry)
    }));
  const byId = new Map<string, ActorTurnDecisionFrame["open_progress_front"][number]>();
  for (const entry of [...structureFront, ...blockerFront, ...recentRuntimeBlockers]) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }
  return [...byId.values()].slice(0, 4);
}

function hasRepeatedMemoryOnlyNoProgress(recentEvidenceTrace: readonly EvidenceTraceEntry[]) {
  const recent = recentEvidenceTrace.slice(-4);
  return recent.length >= 3 &&
    recent.filter((entry) =>
      entry.outcome === "no_progress" &&
      entry.selected_action?.id === "remember"
    ).length >= 3;
}

function recentlySelectedAction(
  recentEvidenceTrace: readonly EvidenceTraceEntry[],
  actionId: string,
  windowSize: number
) {
  return recentEvidenceTrace.slice(-windowSize).some((entry) =>
    entry.selected_action?.id === actionId
  );
}

export function buildActorTurnDecisionFrame(input: {
  activeEpisode: ActiveEpisode;
  currentState: ActorTurnCurrentStateProjection;
  actionCardProjection: ActionCardProjection;
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}): ActorTurnDecisionFrame {
  const hadRecentChestInspection = recentlySelectedAction(input.recentEvidenceTrace, "inspect_chest", 4);
  const recentSayFollowup = recentlySelectedAction(input.recentEvidenceTrace, "say", 6);

  const currentTruths = unique([
    `episode_focus=${input.activeEpisode.current_focus}`,
    `shared_storage=${input.currentState.shared_storage.status}`,
    `inventory=${Object.entries(input.currentState.inventory_counts)
      .map(([name, count]) => `${name}:${count}`)
      .join(",") || "empty"}`,
    ...sessionLifecycleTruths(input.currentState),
    JSON.stringify(input.currentState.settlement_progress.known_positions),
    ...structureProgressTruths(input.currentState)
  ]);

  const completedWork = unique([
    ...input.currentState.settlement_progress.checklist
      .filter((item) => item.status === "satisfied")
      .map((item) => `${item.id}: ${item.reason}`)
  ]).slice(0, 8);

  const doNotRepeat = unique([
    ...(recentSayFollowup
      ? ["recent Say evidence exists; repeat chat only if new relationship context appears"]
      : []),
    ...(hadRecentChestInspection
      ? ["recent chest inspection evidence exists; use it unless a fresh container question appears"]
      : []),
    ...input.recentEvidenceTrace
      .slice(-3)
      .filter((entry) => entry.outcome === "no_progress" || entry.outcome === "rejected_by_contract")
      .map((entry) => `recent ${entry.outcome}: ${entry.compact_summary}; change tool, parameters, or authored behavior if retrying`)
  ]).slice(0, 8);

  return {
    schema: "actor-turn-decision-frame/v1",
    priority_order: [
      "use decision_frame current_truths before older episode wording",
      "use source_evidence_bundle raw cards/details beside summaries before interpreting social or world-event intent",
      "consume completed_work and do_not_repeat before repeating a similar action",
      "choose one visible action_cards entry or author_mineflayer_action if no card can express the needed behavior",
      "runtime evidence, not provider prose, decides success"
    ],
    episode_focus: input.activeEpisode.current_focus,
    episode_focus_status: episodeFocusStatus({
      activeEpisode: input.activeEpisode,
      recentEvidenceTrace: input.recentEvidenceTrace
    }),
    current_truths: currentTruths,
    completed_work: completedWork,
    recent_action_verdicts: input.recentEvidenceTrace.slice(-4).map((entry) => ({
      turn_id: entry.turn_id,
      action_summary: entry.compact_summary,
      outcome: entry.outcome,
      evidence_refs: traceEvidenceRefs(entry)
    })),
    do_not_repeat: doNotRepeat,
    open_progress_front: openProgressFront({
      currentState: input.currentState,
      recentEvidenceTrace: input.recentEvidenceTrace
    }),
    next_action_guidance: unique([
      ...(input.currentState.structure_progress
        ? [
            "structure_progress is physical context only; compare it with the active episode/world event before deciding whether more building is useful"
          ]
        : []),
      ...(input.currentState.session_lifecycle?.branch_recommended
        ? [
            "session lifecycle changed; recover from current position/inventory/vitals before continuing older episode assumptions"
          ]
        : []),
      ...(hasRepeatedMemoryOnlyNoProgress(input.recentEvidenceTrace)
        ? [
            "recent memory-only no_progress turns already preserved the blocker; prefer a runtime action, fresh observation with a concrete question, or author_mineflayer_action instead of another Remember"
          ]
        : []),
      "prefer runtime evidence over memory-only turns when a visible Action Card can create world, inventory, position, container, chat, or verifier evidence"
    ])
  };
}
