export const TRUST_CATEGORIES = [
  "unproven",
  "distrusted",
  "cautious",
  "reliable",
  "trusted"
] as const;

export type TrustCategory = (typeof TRUST_CATEGORIES)[number];

export const OBLIGATION_CATEGORIES = [
  "none",
  "requested",
  "accepted",
  "overdue",
  "fulfilled"
] as const;

export type ObligationCategory = (typeof OBLIGATION_CATEGORIES)[number];

export const DEPENDENCY_CATEGORIES = [
  "independent",
  "helpful",
  "blocked_by",
  "critical_path"
] as const;

export type DependencyCategory = (typeof DEPENDENCY_CATEGORIES)[number];

export const FRICTION_CATEGORIES = [
  "none",
  "annoyed",
  "frustrated",
  "resentful",
  "hostile"
] as const;

export type FrictionCategory = (typeof FRICTION_CATEGORIES)[number];

export const FAMILIARITY_CATEGORIES = [
  "stranger",
  "acquaintance",
  "teammate",
  "partner"
] as const;

export type FamiliarityCategory = (typeof FAMILIARITY_CATEGORIES)[number];

export const RELATIONSHIP_EVENT_KINDS = [
  "resource_delivered",
  "shared_storage_updated",
  "request_made",
  "request_accepted",
  "request_ignored",
  "fake_progress_rejected",
  "verification_failed",
  "action_skill_promoted",
  "action_skill_retired",
  "helped_unblock_task",
  "took_shared_resource",
  "returned_shared_value"
] as const;

export type RelationshipEventKind = (typeof RELATIONSHIP_EVENT_KINDS)[number];

export type EvidenceRefs = [string, ...string[]];

export type RelationshipEventRef = {
  id: string;
  kind: RelationshipEventKind;
  summary: string;
  evidence_refs: EvidenceRefs;
  turn?: number;
};

export type RelationshipEdge = {
  from_actor_id: string;
  to_actor_id: string;
  trust: TrustCategory;
  obligation: ObligationCategory;
  dependency: DependencyCategory;
  friction: FrictionCategory;
  familiarity: FamiliarityCategory;
  recent_events: RelationshipEventRef[];
};

export type RelationshipScoreProjection = {
  trust_score: number;
  obligation_score: number;
  dependency_score: number;
  friction_score: number;
  familiarity_score: number;
};

const trustScores: Record<TrustCategory, number> = {
  unproven: 0,
  distrusted: 1,
  cautious: 2,
  reliable: 3,
  trusted: 4
};

const obligationScores: Record<ObligationCategory, number> = {
  none: 0,
  requested: 1,
  accepted: 2,
  overdue: 3,
  fulfilled: 4
};

const dependencyScores: Record<DependencyCategory, number> = {
  independent: 0,
  helpful: 1,
  blocked_by: 2,
  critical_path: 3
};

const frictionScores: Record<FrictionCategory, number> = {
  none: 0,
  annoyed: 1,
  frustrated: 2,
  resentful: 3,
  hostile: 4
};

const familiarityScores: Record<FamiliarityCategory, number> = {
  stranger: 0,
  acquaintance: 1,
  teammate: 2,
  partner: 3
};

const frictionEscalation: Record<FrictionCategory, FrictionCategory> = {
  none: "annoyed",
  annoyed: "frustrated",
  frustrated: "resentful",
  resentful: "resentful",
  hostile: "hostile"
};

const frictionRepair: Record<FrictionCategory, FrictionCategory> = {
  none: "none",
  annoyed: "none",
  frustrated: "annoyed",
  resentful: "frustrated",
  hostile: "hostile"
};

const maxRecentEvents = 12;

export function trustScore(category: TrustCategory): number {
  return trustScores[category];
}

export function obligationScore(category: ObligationCategory): number {
  return obligationScores[category];
}

export function dependencyScore(category: DependencyCategory): number {
  return dependencyScores[category];
}

export function frictionScore(category: FrictionCategory): number {
  return frictionScores[category];
}

export function familiarityScore(category: FamiliarityCategory): number {
  return familiarityScores[category];
}

export function projectRelationshipScores(
  edge: RelationshipEdge
): RelationshipScoreProjection {
  return {
    trust_score: trustScore(edge.trust),
    obligation_score: obligationScore(edge.obligation),
    dependency_score: dependencyScore(edge.dependency),
    friction_score: frictionScore(edge.friction),
    familiarity_score: familiarityScore(edge.familiarity)
  };
}

export function createDefaultRelationshipEdge(
  fromActorId: string,
  toActorId: string
): RelationshipEdge {
  return {
    from_actor_id: fromActorId,
    to_actor_id: toActorId,
    trust: "unproven",
    obligation: "none",
    dependency: "independent",
    friction: "none",
    familiarity: "stranger",
    recent_events: []
  };
}

export function createRelationshipEventRef(input: {
  id: string;
  kind: RelationshipEventKind;
  summary: string;
  evidence_refs: readonly string[];
  turn?: number;
}): RelationshipEventRef {
  if (input.evidence_refs.length === 0) {
    throw new Error("relationship events require at least one evidence ref");
  }

  return {
    id: input.id,
    kind: input.kind,
    summary: input.summary,
    evidence_refs: [...input.evidence_refs] as EvidenceRefs,
    ...(input.turn === undefined ? {} : { turn: input.turn })
  };
}

/**
 * Applies relationship changes from concrete evidence events only.
 *
 * The edge stores enum categories as source of truth; numeric scores are always
 * projected from those categories for sorting or provider context.
 */
export function applyRelationshipEvent(
  edge: RelationshipEdge,
  event: RelationshipEventRef
): RelationshipEdge {
  if (event.evidence_refs.length === 0) {
    throw new Error("relationship transitions require evidence refs");
  }

  const next = appendRecentEvent(edge, event);

  switch (event.kind) {
    case "resource_delivered":
      return {
        ...next,
        trust: improveTrustFromDelivery(next),
        obligation: completeObligation(next.obligation),
        friction: frictionRepair[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "teammate")
      };
    case "shared_storage_updated":
      return {
        ...next,
        trust: improveTrustFromDelivery(next),
        obligation: completeObligation(next.obligation),
        familiarity: atLeastFamiliarity(next.familiarity, "acquaintance")
      };
    case "request_made":
      return {
        ...next,
        obligation: next.obligation === "none" ? "requested" : next.obligation,
        dependency: next.dependency === "independent" ? "helpful" : next.dependency,
        familiarity: atLeastFamiliarity(next.familiarity, "acquaintance")
      };
    case "request_accepted":
      return {
        ...next,
        obligation: next.obligation === "fulfilled" ? "fulfilled" : "accepted",
        friction: frictionRepair[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "acquaintance")
      };
    case "fake_progress_rejected":
      return {
        ...next,
        trust: degradeTrustFromRejectedProgress(next.trust, next.recent_events),
        obligation: markAcceptedWorkOverdue(next.obligation),
        friction: frictionEscalation[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "acquaintance")
      };
    case "verification_failed":
      return {
        ...next,
        trust: degradeTrustFromFailure(next.trust),
        obligation: markAcceptedWorkOverdue(next.obligation),
        friction: frictionEscalation[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "acquaintance")
      };
    case "action_skill_promoted":
      return {
        ...next,
        trust: improveTrustFromDelivery(next),
        friction: frictionRepair[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "teammate")
      };
    case "helped_unblock_task":
      return {
        ...next,
        trust: improveTrustFromDelivery(next),
        dependency: next.dependency === "critical_path" || next.dependency === "blocked_by"
          ? "helpful"
          : next.dependency,
        obligation: completeObligation(next.obligation),
        friction: frictionRepair[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "partner")
      };
    case "request_ignored":
      return {
        ...next,
        obligation: next.obligation === "requested" ? "overdue" : next.obligation,
        friction: frictionEscalation[next.friction]
      };
    case "took_shared_resource":
      return {
        ...next,
        trust: degradeTrustFromFailure(next.trust),
        friction: frictionEscalation[next.friction]
      };
    case "returned_shared_value":
      return {
        ...next,
        trust: improveTrustFromDelivery(next),
        obligation: completeObligation(next.obligation),
        friction: frictionRepair[next.friction],
        familiarity: atLeastFamiliarity(next.familiarity, "teammate")
      };
    case "action_skill_retired":
      return {
        ...next,
        trust: next.trust === "trusted" ? "reliable" : next.trust,
        familiarity: atLeastFamiliarity(next.familiarity, "acquaintance")
      };
  }
}

function appendRecentEvent(
  edge: RelationshipEdge,
  event: RelationshipEventRef
): RelationshipEdge {
  return {
    ...edge,
    recent_events: [...edge.recent_events, cloneEvent(event)].slice(-maxRecentEvents)
  };
}

function cloneEvent(event: RelationshipEventRef): RelationshipEventRef {
  return {
    ...event,
    evidence_refs: [...event.evidence_refs] as EvidenceRefs
  };
}

function improveTrustFromDelivery(edge: RelationshipEdge): TrustCategory {
  if (edge.trust === "trusted") {
    return "trusted";
  }

  if (
    edge.trust === "reliable" &&
    countEvidenceEvents(edge.recent_events, [
      "resource_delivered",
      "shared_storage_updated",
      "returned_shared_value",
      "helped_unblock_task",
      "action_skill_promoted"
    ]) >= 2
  ) {
    return "trusted";
  }

  if (edge.trust === "distrusted") {
    return "cautious";
  }

  return "reliable";
}

function degradeTrustFromRejectedProgress(
  trust: TrustCategory,
  recentEvents: RelationshipEventRef[]
): TrustCategory {
  if (trust === "distrusted") {
    return "distrusted";
  }

  if (
    trust === "cautious" &&
    countEvidenceEvents(recentEvents, ["fake_progress_rejected", "verification_failed"]) >= 2
  ) {
    return "distrusted";
  }

  if (trust === "trusted") {
    return "reliable";
  }

  return "cautious";
}

function degradeTrustFromFailure(trust: TrustCategory): TrustCategory {
  if (trust === "trusted") {
    return "reliable";
  }

  if (trust === "distrusted") {
    return "distrusted";
  }

  return "cautious";
}

function completeObligation(obligation: ObligationCategory): ObligationCategory {
  if (obligation === "requested" || obligation === "accepted" || obligation === "overdue") {
    return "fulfilled";
  }

  return obligation;
}

function markAcceptedWorkOverdue(
  obligation: ObligationCategory
): ObligationCategory {
  if (obligation === "requested" || obligation === "accepted") {
    return "overdue";
  }

  return obligation;
}

function atLeastFamiliarity(
  current: FamiliarityCategory,
  minimum: FamiliarityCategory
): FamiliarityCategory {
  return familiarityScore(current) >= familiarityScore(minimum) ? current : minimum;
}

function countEvidenceEvents(
  events: RelationshipEventRef[],
  kinds: RelationshipEventKind[]
): number {
  return events.filter((event) => kinds.includes(event.kind)).length;
}
