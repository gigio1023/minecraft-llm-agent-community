import type {
  DependencyCategory,
  FamiliarityCategory,
  FrictionCategory,
  ObligationCategory,
  RelationshipEdge,
  TrustCategory
} from "./relationshipLedger.js";

export const RELATIONSHIP_ACTION_PRESSURE_KINDS = [
  "recovery_social_caution",
  "obligation_repair",
  "friction_reduction",
  "cooperative_confidence"
] as const;

export type RelationshipActionPressureKind =
  (typeof RELATIONSHIP_ACTION_PRESSURE_KINDS)[number];

export type RelationshipActionPressurePriority =
  | "background"
  | "normal"
  | "urgent"
  | "blocking";

export type RelationshipActionPressure = {
  actor_id: string;
  target_actor_id: string;
  kind: RelationshipActionPressureKind;
  priority: RelationshipActionPressurePriority;
  summary: string;
  evidence_refs: string[];
  derived_from: RelationshipPressureDerivation;
  action_boundary: "intent_pressure_only";
  active_action_skill_required: true;
  role_contract_boundary: "unchanged";
};

export type RelationshipPressureDerivation = {
  trust: TrustCategory;
  obligation: ObligationCategory;
  dependency: DependencyCategory;
  friction: FrictionCategory;
  familiarity: FamiliarityCategory;
};

const distrustCategories = new Set<TrustCategory>(["distrusted"]);
const urgentFrictionCategories = new Set<FrictionCategory>(["resentful", "hostile"]);
const repairFrictionCategories = new Set<FrictionCategory>([
  "annoyed",
  "frustrated",
  "resentful",
  "hostile"
]);

/**
 * Converts durable relationship enums into action pressure without granting any
 * primitive, action skill, or role-contract permission.
 */
export function deriveRelationshipActionPressure(
  edge: RelationshipEdge
): RelationshipActionPressure | null {
  const derived_from = relationshipDerivation(edge);
  const latestEvidenceRefs = latestRelationshipEvidenceRefs(edge);

  if (
    distrustCategories.has(edge.trust) ||
    edge.obligation === "overdue" ||
    urgentFrictionCategories.has(edge.friction)
  ) {
    return pressure(edge, {
      kind: "recovery_social_caution",
      priority: "urgent",
      summary:
        "Recover trust before depending on this actor; use evidence-backed requests and verified action skills only.",
      derived_from,
      evidence_refs: latestEvidenceRefs
    });
  }

  if (edge.obligation === "requested" || edge.obligation === "accepted") {
    return pressure(edge, {
      kind: "obligation_repair",
      priority: edge.dependency === "critical_path" ? "blocking" : "normal",
      summary:
        "Follow through on the open relationship obligation through role-allowed action skills.",
      derived_from,
      evidence_refs: latestEvidenceRefs
    });
  }

  if (repairFrictionCategories.has(edge.friction)) {
    return pressure(edge, {
      kind: "friction_reduction",
      priority: edge.friction === "frustrated" ? "urgent" : "normal",
      summary:
        "Reduce relationship friction through small verified help or clear handoff.",
      derived_from,
      evidence_refs: latestEvidenceRefs
    });
  }

  if (
    (edge.trust === "reliable" || edge.trust === "trusted") &&
    edge.obligation === "fulfilled" &&
    edge.friction === "none"
  ) {
    return pressure(edge, {
      kind: "cooperative_confidence",
      priority: "background",
      summary:
        "Treat this actor as a reliable collaborator while keeping runtime gates in force.",
      derived_from,
      evidence_refs: latestEvidenceRefs
    });
  }

  return null;
}

export function deriveRelationshipActionPressures(
  edges: readonly RelationshipEdge[]
): RelationshipActionPressure[] {
  return edges
    .map(deriveRelationshipActionPressure)
    .filter((pressure): pressure is RelationshipActionPressure => pressure !== null);
}

export function selectDominantRelationshipActionPressure(
  pressures: readonly RelationshipActionPressure[]
): RelationshipActionPressure | null {
  return [...pressures].sort(
    (left, right) => priorityRank(right.priority) - priorityRank(left.priority)
  )[0] ?? null;
}

function pressure(
  edge: RelationshipEdge,
  input: Omit<
    RelationshipActionPressure,
    | "actor_id"
    | "target_actor_id"
    | "action_boundary"
    | "active_action_skill_required"
    | "role_contract_boundary"
  >
): RelationshipActionPressure {
  return {
    actor_id: edge.from_actor_id,
    target_actor_id: edge.to_actor_id,
    ...input,
    action_boundary: "intent_pressure_only",
    active_action_skill_required: true,
    role_contract_boundary: "unchanged"
  };
}

function relationshipDerivation(edge: RelationshipEdge): RelationshipPressureDerivation {
  return {
    trust: edge.trust,
    obligation: edge.obligation,
    dependency: edge.dependency,
    friction: edge.friction,
    familiarity: edge.familiarity
  };
}

function latestRelationshipEvidenceRefs(edge: RelationshipEdge) {
  return edge.recent_events.at(-1)?.evidence_refs.slice() ?? [];
}

function priorityRank(priority: RelationshipActionPressurePriority) {
  switch (priority) {
    case "background":
      return 0;
    case "normal":
      return 1;
    case "urgent":
      return 2;
    case "blocking":
      return 3;
  }
}
