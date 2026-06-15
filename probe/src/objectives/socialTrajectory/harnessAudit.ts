import type {
  GroundedSocialEvent,
  GroundedSocialEventType,
  GroundedSocialHarnessAuditReport,
  GroundedSocialHarnessDimensionScore,
  GroundedSocialTrajectoryInput
} from "./types.js";

const DIMENSION_WEIGHT = 20;

const materialEventTypes = new Set<GroundedSocialEventType>([
  "shared_deposit",
  "shared_withdraw",
  "craft",
  "loan",
  "handoff",
  "return"
]);

const commitmentEventTypes = new Set<GroundedSocialEventType>([
  "request",
  "promise",
  "loan",
  "handoff",
  "refusal"
]);

const continuityEventTypes = new Set<GroundedSocialEventType>([
  "relationship_update",
  "memory_write",
  "obligation_update"
]);

const materialSourceEventTypes = new Set<GroundedSocialEventType>([
  "request",
  "promise",
  "shared_deposit",
  "shared_inspect",
  "shared_withdraw",
  "loan",
  "handoff",
  "return"
]);

function eventRef(eventId: string) {
  return `event:${eventId}`;
}

function sortedEvents(events: readonly GroundedSocialEvent[]) {
  return [...events].sort((left, right) => left.cycle - right.cycle || left.event_id.localeCompare(right.event_id));
}

function hasEvidence(event: GroundedSocialEvent) {
  return event.evidence_refs.length > 0 && event.evidence_refs.every((ref) => ref.trim().length > 0);
}

function hasPositiveCount(event: GroundedSocialEvent) {
  return typeof event.count === "number" && Number.isFinite(event.count) && event.count > 0;
}

function hasItemCount(event: GroundedSocialEvent) {
  return Boolean(event.item_id?.trim()) && hasPositiveCount(event);
}

function hasContainerItemCount(event: GroundedSocialEvent) {
  return hasItemCount(event) && Boolean(event.container_id?.trim());
}

function dimension(
  id: GroundedSocialHarnessDimensionScore["id"],
  label: string,
  score: number,
  evidenceEventIds: string[],
  findings: string[]
): GroundedSocialHarnessDimensionScore {
  const normalized = Math.max(0, Math.min(DIMENSION_WEIGHT, Math.round(score)));
  return {
    id,
    label,
    weight: DIMENSION_WEIGHT,
    score: normalized,
    passed: normalized === DIMENSION_WEIGHT,
    evidence_event_ids: evidenceEventIds,
    findings
  };
}

function partialScore(totalChecks: number, findings: readonly string[]) {
  if (totalChecks <= 0) {
    return findings.length === 0 ? DIMENSION_WEIGHT : 0;
  }
  return Math.max(0, Math.round(((totalChecks - findings.length) / totalChecks) * DIMENSION_WEIGHT));
}

function eventMap(events: readonly GroundedSocialEvent[]) {
  return new Map(events.map((event) => [event.event_id, event]));
}

function eventRefs(event: GroundedSocialEvent) {
  return event.evidence_refs
    .filter((ref) => ref.startsWith("event:"))
    .map((ref) => ref.slice("event:".length));
}

function linkedPriorEvents(
  events: readonly GroundedSocialEvent[],
  event: GroundedSocialEvent,
  types?: Set<GroundedSocialEventType>
) {
  const byId = eventMap(events);
  return eventRefs(event)
    .map((id) => byId.get(id))
    .filter((candidate): candidate is GroundedSocialEvent => {
      if (!candidate) return false;
      if (candidate.event_id === event.event_id) return false;
      if (candidate.cycle > event.cycle) return false;
      if (types && !types.has(candidate.type)) return false;
      return true;
    });
}

function scoreEventIntegrity(input: GroundedSocialTrajectoryInput) {
  const findings: string[] = [];
  const eventIds = new Set<string>();
  const actorIds = new Set(input.actors.map((actor) => actor.actor_id));
  const byId = eventMap(input.events);
  let checks = 0;

  for (const event of input.events) {
    checks += 4;
    if (eventIds.has(event.event_id)) {
      findings.push(`Duplicate event id: ${event.event_id}.`);
    }
    eventIds.add(event.event_id);

    if (!actorIds.has(event.actor_id)) {
      findings.push(`Event ${event.event_id} references unknown actor ${event.actor_id}.`);
    }
    if (!Number.isFinite(event.cycle) || event.cycle < 0) {
      findings.push(`Event ${event.event_id} has invalid cycle ${event.cycle}.`);
    }
    if (!hasEvidence(event)) {
      findings.push(`Event ${event.event_id} has no usable evidence refs.`);
    }

    if (["request", "promise", "refusal", "loan", "handoff", "return"].includes(event.type)) {
      checks += 1;
      if (!event.target_actor_id || !actorIds.has(event.target_actor_id)) {
        findings.push(`Social event ${event.event_id} lacks a known target actor.`);
      }
    }

    if (["shared_deposit", "shared_withdraw"].includes(event.type)) {
      checks += 1;
      if (!hasContainerItemCount(event)) {
        findings.push(`Material event ${event.event_id} lacks item/count/container details.`);
      }
    }

    if (["craft", "loan", "handoff", "return"].includes(event.type)) {
      checks += 1;
      if (!hasItemCount(event)) {
        findings.push(`Material event ${event.event_id} lacks item/count details.`);
      }
    }

    for (const refId of eventRefs(event)) {
      checks += 1;
      const referenced = byId.get(refId);
      if (!referenced) {
        findings.push(`Event ${event.event_id} cites unknown event ref ${eventRef(refId)}.`);
      } else if (referenced.cycle > event.cycle) {
        findings.push(`Event ${event.event_id} cites future event ref ${eventRef(refId)}.`);
      } else if (referenced.event_id === event.event_id) {
        findings.push(`Event ${event.event_id} cites itself.`);
      }
    }
  }

  return dimension(
    "event_integrity",
    "Event Integrity",
    partialScore(checks, findings),
    input.events.map((event) => event.event_id),
    findings.length ? findings : ["Events have unique ids, known actors, valid cycles, evidence refs, and required material details."]
  );
}

function laterEventCites(events: readonly GroundedSocialEvent[], source: GroundedSocialEvent, types?: Set<GroundedSocialEventType>) {
  return events.some((event) => {
    if (event.event_id === source.event_id || event.cycle < source.cycle) {
      return false;
    }
    if (types && !types.has(event.type)) {
      return false;
    }
    return event.evidence_refs.includes(eventRef(source.event_id));
  });
}

function scoreChatActionCoherence(input: GroundedSocialTrajectoryInput) {
  const findings: string[] = [];
  const evidence: string[] = [];
  const commitments = sortedEvents(input.events).filter((event) => commitmentEventTypes.has(event.type));

  for (const event of commitments) {
    evidence.push(event.event_id);
    if (!event.target_actor_id) {
      findings.push(`${event.type} event ${event.event_id} has no target actor.`);
    }

    if (event.type === "request") {
      const answered = laterEventCites(input.events, event, new Set(["promise", "refusal", "loan", "handoff", "blocker"]));
      if (!answered) {
        findings.push(`Request ${event.event_id} is not cited by a later promise/refusal/material/blocker event.`);
      }
    }

    if (event.type === "promise") {
      const fulfilledOrClosed = laterEventCites(
        input.events,
        event,
        new Set(["shared_deposit", "loan", "handoff", "return", "obligation_update", "relationship_update", "memory_write", "blocker"])
      );
      if (!fulfilledOrClosed) {
        findings.push(`Promise ${event.event_id} has no later material result, blocker, or state update.`);
      }
    }
  }

  if (commitments.length === 0) {
    findings.push("No request, promise, refusal, loan, or handoff event exists to test chat/action coherence.");
  }

  return dimension(
    "chat_action_coherence",
    "Chat/Action Coherence",
    findings.length === 0 ? DIMENSION_WEIGHT : partialScore(Math.max(1, commitments.length * 2), findings),
    evidence,
    findings.length ? findings : ["Social commitments are either answered, materially fulfilled, blocked, or recorded as state."]
  );
}

function scoreActionAwarenessTrace(input: GroundedSocialTrajectoryInput) {
  const findings: string[] = [];
  const materialEvents = sortedEvents(input.events).filter((event) => materialEventTypes.has(event.type));
  const evidence: string[] = [];

  for (const event of materialEvents) {
    evidence.push(event.event_id);
    const priorMaterialSource = linkedPriorEvents(input.events, event, materialSourceEventTypes);
    if (priorMaterialSource.length === 0) {
      findings.push(`Material event ${event.event_id} does not cite a prior intent/source event.`);
    }

    if (event.type === "craft") {
      const source = linkedPriorEvents(input.events, event, new Set(["shared_withdraw", "shared_deposit", "handoff"]));
      if (source.length === 0) {
        findings.push(`Craft event ${event.event_id} does not cite a material source event.`);
      }
    }
  }

  if (materialEvents.length === 0) {
    findings.push("No material event exists to audit action awareness.");
  }

  return dimension(
    "action_awareness_trace",
    "Action Awareness Trace",
    findings.length === 0 ? DIMENSION_WEIGHT : partialScore(Math.max(1, materialEvents.length * 2), findings),
    evidence,
    findings.length ? findings : ["Material events cite prior social intent or material source evidence."]
  );
}

function scoreCrossActorCausality(input: GroundedSocialTrajectoryInput) {
  const ordered = sortedEvents(input.events);
  for (const event of ordered) {
    const linked = linkedPriorEvents(input.events, event);
    const source = linked.find((candidate) => candidate.actor_id !== event.actor_id);
    if (source) {
      return dimension("cross_actor_causality", "Cross-Actor Causality", DIMENSION_WEIGHT, [
        source.event_id,
        event.event_id
      ], [
        `${event.actor_id}'s ${event.type} cites ${source.actor_id}'s prior ${source.type}.`
      ]);
    }
  }

  return dimension("cross_actor_causality", "Cross-Actor Causality", 0, [], [
    "No event from one actor cites evidence from another actor's prior event."
  ]);
}

function scoreContinuityState(input: GroundedSocialTrajectoryInput) {
  const continuityEvents = sortedEvents(input.events).filter((event) => continuityEventTypes.has(event.type));
  const valid = continuityEvents.filter((event) => linkedPriorEvents(input.events, event).length > 0);

  if (valid.length === 0) {
    return dimension("continuity_state", "Continuity State", 0, continuityEvents.map((event) => event.event_id), [
      "No relationship, memory, or obligation update cites prior event evidence."
    ]);
  }

  return dimension("continuity_state", "Continuity State", DIMENSION_WEIGHT, valid.map((event) => event.event_id), [
    "Continuity state is grounded in prior event refs."
  ]);
}

export function auditGroundedSocialHarness(input: GroundedSocialTrajectoryInput): GroundedSocialHarnessAuditReport {
  const dimensions = [
    scoreEventIntegrity(input),
    scoreChatActionCoherence(input),
    scoreActionAwarenessTrace(input),
    scoreCrossActorCausality(input),
    scoreContinuityState(input)
  ];
  const score = dimensions.reduce((sum, item) => sum + item.score, 0);
  const maxScore = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const blockingFindings = dimensions
    .filter((item) => !item.passed)
    .flatMap((item) => item.findings.map((finding) => `${item.label}: ${finding}`));
  const criticalZero = dimensions.some((item) =>
    ["chat_action_coherence", "action_awareness_trace", "cross_actor_causality", "continuity_state"].includes(item.id) &&
    item.score === 0
  );

  return {
    schema: "grounded-social-harness-audit/v1",
    summary: {
      score,
      max_score: maxScore,
      status: score >= 80 ? "passed" : criticalZero || score < 50 ? "failed" : "partial",
      blocking_findings: blockingFindings
    },
    dimensions,
    notes: [
      "This Project Sid absorption audit checks harness trustworthiness, not social style.",
      "It emphasizes action awareness, chat/action coherence, cross-actor causality, and continuity before scaling to larger society scenarios.",
      "Provider-authored summaries alone are not enough to pass continuity or material-causality checks."
    ]
  };
}
