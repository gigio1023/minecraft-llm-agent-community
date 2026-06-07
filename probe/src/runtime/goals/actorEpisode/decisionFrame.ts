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
  requestedDeposits: readonly ActorTurnCurrentStateProjection["deposit_candidates"][number][];
  hasCompletedSharedContribution: boolean;
  sharedContributionEvidenceRefs: readonly string[];
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}): ActorTurnDecisionFrame["episode_focus_status"] {
  const focus = input.activeEpisode.current_focus;
  const recentNoProgress = input.recentEvidenceTrace
    .slice(-3)
    .filter((entry) => entry.outcome === "no_progress" || entry.outcome === "blocked");
  const sharedStorageFocus = /\b(shared|storage|handoff|deposit|oak_log)\b/i.test(focus);
  const blockerQuestionFocus =
    /\b(blocker|blocked|classif|determine|inspect|inspection|check|verify|open|openable|openability|reach|reachable|reachability|access|interact|interaction|snapshot|container|repair|why|whether)\b/i
      .test(focus);
  const explicitContributionFocus =
    /\b(deposit|handoff|contribut|deliver|put|store|shared storage|shared chest)\b/i.test(focus) &&
    !blockerQuestionFocus;
  if (
    input.hasCompletedSharedContribution &&
    input.requestedDeposits.length === 0 &&
    sharedStorageFocus &&
    explicitContributionFocus
  ) {
    return {
      status: "satisfied",
      focus,
      evidence_refs: unique([
        ...input.sharedContributionEvidenceRefs,
        ...input.recentEvidenceTrace.flatMap(traceEvidenceRefs)
      ]),
      next: "close_or_pivot_to_a_different_physical_or_social_followup"
    };
  }
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
      /\b(remember|memory|note)\b/i.test(entry.compact_summary)
    ).length >= 3;
}

export function buildActorTurnDecisionFrame(input: {
  activeEpisode: ActiveEpisode;
  currentState: ActorTurnCurrentStateProjection;
  actionCardProjection: ActionCardProjection;
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}): ActorTurnDecisionFrame {
  const requestedDeposits = input.currentState.deposit_candidates.filter((candidate) =>
    candidate.socially_requested
  );
  const hasCompletedSharedContribution =
    input.currentState.shared_storage.status === "contributed" &&
    input.currentState.shared_storage.evidence_refs.length > 0;
  const hadRecentChestInspection = input.recentEvidenceTrace.slice(-4).some((entry) =>
    entry.outcome === "verified_mutation" && /\binspect_chest\b/i.test(entry.compact_summary)
  );
  const visibleCardTitles = new Set(input.actionCardProjection.action_cards.map((card) => card.title));
  const recentSayFollowup = input.recentEvidenceTrace.slice(-6).some((entry) =>
    /\bsay\b/i.test(entry.compact_summary)
  );

  const currentTruths = unique([
    `episode_focus=${input.activeEpisode.current_focus}`,
    `shared_storage=${input.currentState.shared_storage.status}`,
    hasCompletedSharedContribution
      ? `shared_storage_contribution_evidence=${input.currentState.shared_storage.evidence_refs.join(",")}`
      : "",
    `inventory=${Object.entries(input.currentState.inventory_counts)
      .map(([name, count]) => `${name}:${count}`)
      .join(",") || "empty"}`,
    ...sessionLifecycleTruths(input.currentState),
    requestedDeposits.length > 0
      ? `open_social_deposit=${requestedDeposits
          .map((candidate) => `${candidate.itemName}:${candidate.suggestedCount}`)
          .join(",")}`
      : "no_open_social_deposit_candidate",
    input.currentState.settlement_progress.known_position_summaries.join("; "),
    ...structureProgressTruths(input.currentState)
  ]);

  const completedWork = unique([
    ...(hasCompletedSharedContribution
      ? [
          `shared storage already contains contribution evidence: ${input.currentState.shared_storage.evidence_refs.join(",")}`
        ]
      : []),
    ...input.currentState.settlement_progress.checklist
      .filter((item) => item.status === "satisfied")
      .map((item) => `${item.id}: ${item.reason}`)
  ]).slice(0, 8);

  const doNotRepeat = unique([
    ...(hasCompletedSharedContribution && requestedDeposits.length === 0
      ? ["shared-storage contribution already has evidence; repeat only if current context has a new reason"]
      : []),
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
      "satisfy open_social_requests with visible Action Cards and schema-valid parameters",
      "consume completed_work and do_not_repeat before choosing another storage or station action",
      "choose one visible action_cards entry or author_mineflayer_action if no card can express the needed behavior",
      "runtime evidence, not provider prose, decides success"
    ],
    episode_focus: input.activeEpisode.current_focus,
    episode_focus_status: episodeFocusStatus({
      activeEpisode: input.activeEpisode,
      requestedDeposits,
      hasCompletedSharedContribution,
      sharedContributionEvidenceRefs: input.currentState.shared_storage.evidence_refs,
      recentEvidenceTrace: input.recentEvidenceTrace
    }),
    current_truths: currentTruths,
    open_social_requests: requestedDeposits.flatMap((candidate) =>
      candidate.request_summaries.map((summary) => ({
        itemName: candidate.itemName,
        suggestedCount: candidate.suggestedCount,
        summary,
        evidence_refs: [...candidate.evidence_refs]
      }))
    ).slice(0, 4),
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
      ...(hasCompletedSharedContribution && requestedDeposits.length === 0
        ? [
            "the shared-storage request is already satisfied; choose a different useful physical, social, crafting, collection, shelter, or authored action"
          ]
        : []),
      ...(hasCompletedSharedContribution &&
        requestedDeposits.length === 0 &&
        visibleCardTitles.has("Say") &&
        !recentSayFollowup
        ? [
            "shared-storage contribution is complete and communication context exists; if choosing Say, write your own schema-valid text from active_episode.social_pressure and relationship_context"
          ]
        : []),
      ...(requestedDeposits.length > 0 && visibleCardTitles.has("Deposit Shared")
        ? ["a deposit card is visible and open_social_requests/current_state.deposit_candidates contain exact item/count context; if choosing deposit, fill parameters explicitly from those fields"]
        : []),
      ...(requestedDeposits.length > 0 && !visibleCardTitles.has("Deposit Shared")
        ? ["a request is open but deposit is not currently eligible; choose the nearest visible prerequisite such as chest inspection or movement"]
        : []),
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
