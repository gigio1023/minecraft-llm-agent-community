import type {
  GroundedSocialDimensionScore,
  GroundedSocialEvent,
  GroundedSocialTrajectoryInput,
  GroundedSocialTrajectoryReport
} from "./types.js";

const DIMENSION_WEIGHT = 20;

function eventRef(eventId: string) {
  return `event:${eventId}`;
}

function hasEvidence(event: GroundedSocialEvent) {
  return event.evidence_refs.length > 0 && event.evidence_refs.every((ref) => ref.trim().length > 0);
}

function isPositiveCount(event: GroundedSocialEvent) {
  return typeof event.count === "number" && Number.isFinite(event.count) && event.count > 0;
}

function hasItemCount(event: GroundedSocialEvent) {
  return Boolean(event.item_id?.trim()) && isPositiveCount(event);
}

function hasContainerItemCount(event: GroundedSocialEvent) {
  return hasItemCount(event) && Boolean(event.container_id?.trim());
}

function sortedEvents(events: GroundedSocialEvent[]) {
  return [...events].sort((left, right) => left.cycle - right.cycle || left.event_id.localeCompare(right.event_id));
}

function priorEventIds(events: GroundedSocialEvent[], event: GroundedSocialEvent) {
  return new Set(events.filter((candidate) => candidate.cycle <= event.cycle).map((candidate) => candidate.event_id));
}

function evidenceLinksPriorEvent(
  events: GroundedSocialEvent[],
  event: GroundedSocialEvent,
  types?: Set<GroundedSocialEvent["type"]>
) {
  const allowedIds = priorEventIds(events, event);
  return events.some((candidate) => {
    if (!allowedIds.has(candidate.event_id) || candidate.event_id === event.event_id) {
      return false;
    }
    if (types && !types.has(candidate.type)) {
      return false;
    }
    return event.evidence_refs.includes(eventRef(candidate.event_id));
  });
}

function dimension(
  id: GroundedSocialDimensionScore["id"],
  label: string,
  score: number,
  evidenceEventIds: string[],
  findings: string[]
): GroundedSocialDimensionScore {
  const normalizedScore = Math.max(0, Math.min(DIMENSION_WEIGHT, score));
  return {
    id,
    label,
    weight: DIMENSION_WEIGHT,
    score: normalizedScore,
    passed: normalizedScore === DIMENSION_WEIGHT,
    evidence_event_ids: evidenceEventIds,
    findings
  };
}

function scorePhysicalContribution(events: GroundedSocialEvent[]) {
  const deposit = sortedEvents(events).find(
    (event) => event.type === "shared_deposit" && hasEvidence(event) && hasContainerItemCount(event)
  );
  if (!deposit) {
    return dimension("physical_contribution", "Physical Contribution", 0, [], [
      "No evidence-backed shared deposit or handoff with item/count/container details was found."
    ]);
  }
  return dimension("physical_contribution", "Physical Contribution", 20, [deposit.event_id], [
    `${deposit.actor_id} contributed ${deposit.count} ${deposit.item_id} to ${deposit.container_id}.`
  ]);
}

function scoreSocialExchange(events: GroundedSocialEvent[]) {
  const ordered = sortedEvents(events);
  const request = ordered.find((event) => event.type === "request" && hasEvidence(event) && hasItemCount(event));
  const promise = ordered.find(
    (event) =>
      event.type === "promise" &&
      hasEvidence(event) &&
      hasItemCount(event) &&
      (!request || event.cycle >= request.cycle)
  );
  const deposit = ordered.find(
    (event) =>
      event.type === "shared_deposit" &&
      hasEvidence(event) &&
      hasContainerItemCount(event) &&
      (!promise || event.cycle >= promise.cycle)
  );

  const evidence = [request?.event_id, promise?.event_id, deposit?.event_id].filter((id): id is string =>
    Boolean(id)
  );
  if (request && promise && deposit) {
    return dimension("social_exchange", "Social Exchange", 20, evidence, [
      "Request, promise, and shared contribution appear in chronological order."
    ]);
  }
  if (request && deposit) {
    return dimension("social_exchange", "Social Exchange", 12, evidence, [
      "Request and shared contribution exist, but an explicit promise/refusal link is missing."
    ]);
  }
  return dimension("social_exchange", "Social Exchange", 0, evidence, [
    "The ledger does not show a complete request-to-contribution social exchange."
  ]);
}

function scoreCrossActorConsumption(events: GroundedSocialEvent[]) {
  const ordered = sortedEvents(events);
  const deposit = ordered.find(
    (event) => event.type === "shared_deposit" && hasEvidence(event) && hasContainerItemCount(event)
  );
  if (!deposit) {
    return dimension("cross_actor_consumption", "Cross-Actor Consumption", 0, [], [
      "No shared contribution exists for another actor to consume."
    ]);
  }

  const consumptionEvents = ordered.filter(
    (event) =>
      event.cycle >= deposit.cycle &&
      event.actor_id !== deposit.actor_id &&
      ["shared_inspect", "shared_withdraw", "craft"].includes(event.type) &&
      hasEvidence(event)
  );
  const inspect = consumptionEvents.find((event) => event.type === "shared_inspect");
  const withdraw = consumptionEvents.find((event) => event.type === "shared_withdraw" && hasContainerItemCount(event));
  const craft = consumptionEvents.find((event) => event.type === "craft" && hasItemCount(event));

  const evidence = [deposit.event_id, inspect?.event_id, withdraw?.event_id, craft?.event_id].filter(
    (id): id is string => Boolean(id)
  );

  if (withdraw && craft && craft.cycle >= withdraw.cycle) {
    return dimension("cross_actor_consumption", "Cross-Actor Consumption", 20, evidence, [
      `${withdraw.actor_id} consumed shared value and produced ${craft.count} ${craft.item_id}.`
    ]);
  }
  if (inspect || withdraw || craft) {
    return dimension("cross_actor_consumption", "Cross-Actor Consumption", 12, evidence, [
      "Another actor interacted with shared value, but the inspect/withdraw/craft chain is incomplete."
    ]);
  }
  return dimension("cross_actor_consumption", "Cross-Actor Consumption", 0, [deposit.event_id], [
    "Shared value was contributed, but no later cross-actor use was found."
  ]);
}

function scoreMemoryContinuity(events: GroundedSocialEvent[]) {
  const continuityTypes = new Set<GroundedSocialEvent["type"]>([
    "shared_deposit",
    "shared_withdraw",
    "craft",
    "request",
    "promise"
  ]);
  const continuityEvent = sortedEvents(events).find(
    (event) =>
      ["relationship_update", "memory_write"].includes(event.type) &&
      hasEvidence(event) &&
      evidenceLinksPriorEvent(events, event, continuityTypes)
  );

  if (!continuityEvent) {
    return dimension("memory_or_relationship_continuity", "Memory Or Relationship Continuity", 0, [], [
      "No memory or relationship update cites prior social or physical evidence."
    ]);
  }
  return dimension(
    "memory_or_relationship_continuity",
    "Memory Or Relationship Continuity",
    20,
    [continuityEvent.event_id],
    [`${continuityEvent.actor_id} recorded continuity using prior event evidence.`]
  );
}

function auditFindings(input: GroundedSocialTrajectoryInput) {
  const findings: string[] = [];
  const actorIds = new Set(input.actors.map((actor) => actor.actor_id));
  const eventIds = new Set<string>();

  for (const event of input.events) {
    if (eventIds.has(event.event_id)) {
      findings.push(`Duplicate event id: ${event.event_id}`);
    }
    eventIds.add(event.event_id);
    if (!actorIds.has(event.actor_id)) {
      findings.push(`Event ${event.event_id} references unknown actor ${event.actor_id}.`);
    }
    if (!Number.isFinite(event.cycle) || event.cycle < 0) {
      findings.push(`Event ${event.event_id} has an invalid cycle.`);
    }
    if (!hasEvidence(event)) {
      findings.push(`Event ${event.event_id} has no usable evidence refs.`);
    }
    if (["shared_deposit", "shared_withdraw"].includes(event.type) && !hasContainerItemCount(event)) {
      findings.push(`Event ${event.event_id} lacks item/count/container details.`);
    }
    if (event.type === "craft" && !hasItemCount(event)) {
      findings.push(`Craft event ${event.event_id} lacks item/count details.`);
    }
    if (["relationship_update", "memory_write"].includes(event.type) && !evidenceLinksPriorEvent(input.events, event)) {
      findings.push(`Continuity event ${event.event_id} does not cite a prior event ref.`);
    }
  }

  if (input.provider.live_provider_calls !== 0) {
    findings.push("Provider-free smoke recorded non-zero live provider calls.");
  }
  if (input.environment.live_minecraft_server) {
    findings.push("Provider-free smoke unexpectedly requires a live Minecraft server.");
  }

  return findings;
}

function scoreAuditability(input: GroundedSocialTrajectoryInput) {
  const findings = auditFindings(input);
  if (findings.length === 0) {
    return dimension("auditability", "Auditability", 20, input.events.map((event) => event.event_id), [
      "All events have actors, order, evidence refs, and required physical details."
    ]);
  }
  const validEvents = input.events.length - findings.length;
  const partial = Math.max(0, Math.round((validEvents / Math.max(1, input.events.length)) * 20));
  return dimension("auditability", "Auditability", partial, input.events.map((event) => event.event_id), findings);
}

function firstCycle(events: GroundedSocialEvent[], types: GroundedSocialEvent["type"][]) {
  const event = sortedEvents(events).find((candidate) => types.includes(candidate.type));
  return event?.cycle;
}

export function scoreGroundedSocialTrajectory(
  input: GroundedSocialTrajectoryInput
): GroundedSocialTrajectoryReport {
  const dimensions = [
    scorePhysicalContribution(input.events),
    scoreSocialExchange(input.events),
    scoreCrossActorConsumption(input.events),
    scoreMemoryContinuity(input.events),
    scoreAuditability(input)
  ];
  const score = dimensions.reduce((sum, item) => sum + item.score, 0);
  const status = score >= 80 ? "passed" : score > 0 ? "partial" : "failed";
  const evidenceRefCount = input.events.reduce((sum, event) => sum + event.evidence_refs.length, 0);

  return {
    schema: "grounded-social-trajectory-report/v1",
    run_id: input.run_id,
    created_at: input.created_at,
    scenario_id: input.scenario_id,
    provider: input.provider,
    environment: input.environment,
    actors: input.actors,
    summary: {
      score,
      max_score: dimensions.reduce((sum, item) => sum + item.weight, 0),
      status,
      event_count: input.events.length,
      evidence_ref_count: evidenceRefCount,
      first_social_event_cycle: firstCycle(input.events, ["request", "promise"]),
      first_shared_contribution_cycle: firstCycle(input.events, ["shared_deposit"]),
      first_cross_actor_consumption_cycle: firstCycle(input.events, [
        "shared_inspect",
        "shared_withdraw",
        "craft"
      ])
    },
    dimensions,
    events: sortedEvents(input.events),
    notes: [
      "This provider-free smoke validates social event scoring only.",
      "It does not claim live Minecraft social competence.",
      "Private-only task success is intentionally insufficient for a social trajectory pass."
    ]
  };
}
