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
    requestedDeposits.length > 0
      ? `open_social_deposit=${requestedDeposits
          .map((candidate) => `${candidate.itemName}:${candidate.suggestedCount}`)
          .join(",")}`
      : "no_open_social_deposit_candidate",
    input.currentState.settlement_progress.known_position_summaries.join("; ")
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
    open_progress_front: input.currentState.settlement_progress.checklist
      .filter((item) => item.status !== "satisfied")
      .map((item) => ({
        id: item.id,
        status: item.status,
        next_theme: item.reason,
        evidence_refs: []
      }))
      .slice(0, 4),
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
      "prefer runtime evidence over memory-only turns when a visible Action Card can create world, inventory, position, container, chat, or verifier evidence"
    ])
  };
}
