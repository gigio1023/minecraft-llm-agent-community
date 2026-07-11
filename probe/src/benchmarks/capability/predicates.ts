import type { CapabilityEvidenceBagV1 } from "./evidenceBag.js";
import { normalizeMinecraftId } from "./minecraftIds.js";
import type {
  CapabilityMilestoneV1,
  CapabilityPredicateResultV1,
  CapabilityPredicateV1
} from "./types.js";

function passed(evidence_refs: string[]): CapabilityPredicateResultV1 {
  return { status: "passed", evidence_refs };
}

function failed(reasons: string[], evidence_refs: string[] = []): CapabilityPredicateResultV1 {
  return { status: "failed", evidence_refs, reasons };
}

function unknown(
  missing_evidence: string[],
  unsupported: string[] = [],
  reasons: string[] = []
): CapabilityPredicateResultV1 {
  return {
    status: "unknown",
    evidence_refs: [],
    missing_evidence,
    unsupported,
    reasons: reasons.length > 0 ? reasons : undefined
  };
}

function positionsEqual(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

function distance3d(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function inventoryCountForItem(bag: CapabilityEvidenceBagV1, item: string): number {
  const normalized = normalizeMinecraftId(item);
  const counts = bag.inventory_counts ?? {};
  let total = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (normalizeMinecraftId(name) === normalized) {
      total += count;
    }
  }
  return total;
}

function findInventoryFactRef(bag: CapabilityEvidenceBagV1, item: string): string | undefined {
  const normalized = normalizeMinecraftId(item);
  for (const fact of bag.facts ?? []) {
    if (fact.item !== undefined && normalizeMinecraftId(fact.item) === normalized) {
      return fact.evidence_ref;
    }
  }
  return undefined;
}

function constraintMatches(
  fact: Record<string, unknown>,
  constraints: Record<string, string | number | boolean>
): boolean {
  for (const [key, expected] of Object.entries(constraints)) {
    if (fact[key] !== expected) {
      return false;
    }
  }
  return true;
}

function evaluateItemCountGte(
  predicate: Extract<CapabilityPredicateV1, { op: "item_count_gte" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.inventory || bag.inventory_counts === undefined) {
    return unknown(["inventory_counts"]);
  }

  const actual = inventoryCountForItem(bag, predicate.item);
  if (actual < predicate.count) {
    return failed([
      `inventory count for '${normalizeMinecraftId(predicate.item)}' is ${actual}, need >= ${predicate.count}`
    ]);
  }

  const evidenceRef = findInventoryFactRef(bag, predicate.item) ?? "settlement:inventory_counts";
  return passed([evidenceRef]);
}

function evaluateHeldItemIs(
  predicate: Extract<CapabilityPredicateV1, { op: "held_item_is" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.held_item) {
    return unknown(["held_item"]);
  }

  const expected = normalizeMinecraftId(predicate.item);
  const actual = bag.held_item?.name ? normalizeMinecraftId(bag.held_item.name) : null;
  if (actual !== expected) {
    return failed([
      `held item is '${actual ?? "none"}', expected '${expected}'`
    ]);
  }

  const factRef = (bag.facts ?? []).find(
    (fact) => fact.kind === "held_item" || fact.item === predicate.item
  )?.evidence_ref;
  return passed([factRef ?? "settlement:held_item"]);
}

function evaluateBlockObservedAt(
  predicate: Extract<CapabilityPredicateV1, { op: "block_observed_at" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.blocks) {
    return unknown(["known_blocks"]);
  }

  const namedPosition = bag.named_positions?.[predicate.position_ref];
  if (!namedPosition) {
    return unknown([`named_positions.${predicate.position_ref}`]);
  }

  const expectedBlock = normalizeMinecraftId(predicate.block);
  const candidates = (bag.known_blocks ?? []).filter(
    (entry) => normalizeMinecraftId(entry.block) === expectedBlock
  );
  if (candidates.length === 0) {
    return failed([
      `block '${expectedBlock}' not observed at position_ref '${predicate.position_ref}'`
    ]);
  }

  const positioned = candidates.filter((entry) => entry.position !== undefined);
  if (positioned.length === 0) {
    return unknown(
      [`known_blocks.position for '${expectedBlock}'`],
      [],
      [
        `block '${expectedBlock}' was seen without coordinates; cannot verify position_ref '${predicate.position_ref}'`
      ]
    );
  }

  const match = positioned.find((entry) => positionsEqual(entry.position!, namedPosition));
  if (!match) {
    return failed([
      `block '${expectedBlock}' not observed at position_ref '${predicate.position_ref}'`
    ]);
  }

  return passed([match.evidence_ref]);
}

function evaluatePositionWithin(
  predicate: Extract<CapabilityPredicateV1, { op: "position_within" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.position || bag.actor_position === undefined) {
    return unknown(["actor_position"]);
  }

  const center = bag.named_positions?.[predicate.center_ref];
  if (!center) {
    return unknown([`named_positions.${predicate.center_ref}`]);
  }

  const distance = distance3d(bag.actor_position, center);
  if (distance > predicate.radius) {
    return failed([
      `actor is ${distance.toFixed(3)} blocks from '${predicate.center_ref}', radius is ${predicate.radius}`
    ]);
  }

  return passed([center.evidence_ref ?? "settlement:actor_position"]);
}

function evaluateContainerItemCountGte(
  predicate: Extract<CapabilityPredicateV1, { op: "container_item_count_gte" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.containers) {
    return unknown(["containers"]);
  }

  const container = (bag.containers ?? []).find(
    (entry) => entry.container_ref === predicate.container_ref
  );
  if (!container) {
    return unknown([`containers.${predicate.container_ref}`]);
  }

  const normalized = normalizeMinecraftId(predicate.item);
  let actual = 0;
  for (const [name, count] of Object.entries(container.items)) {
    if (normalizeMinecraftId(name) === normalized) {
      actual += count;
    }
  }

  if (actual < predicate.count) {
    return failed([
      `container '${predicate.container_ref}' has ${actual} of '${normalized}', need >= ${predicate.count}`
    ]);
  }

  return passed([container.evidence_ref]);
}

function evaluateEvidenceKindSeen(
  predicate: Extract<CapabilityPredicateV1, { op: "evidence_kind_seen" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.facts) {
    return unknown(["facts"]);
  }

  const match = (bag.facts ?? []).find(
    (fact) => fact.kind === predicate.evidence_kind && constraintMatches(fact, predicate.constraints)
  );
  if (!match) {
    return failed([
      `no fact with kind '${predicate.evidence_kind}' matching constraints`
    ]);
  }

  return passed([match.evidence_ref]);
}

function mergeAllResults(children: CapabilityPredicateResultV1[]): CapabilityPredicateResultV1 {
  if (children.some((child) => child.status === "failed")) {
    const failedChildren = children.filter((child) => child.status === "failed");
    return {
      status: "failed",
      evidence_refs: failedChildren.flatMap((child) => child.evidence_refs),
      reasons: failedChildren.flatMap((child) => child.reasons ?? [])
    };
  }

  if (children.some((child) => child.status === "unknown")) {
    const unknownChildren = children.filter((child) => child.status === "unknown");
    return {
      status: "unknown",
      evidence_refs: [],
      missing_evidence: [
        ...new Set(unknownChildren.flatMap((child) => child.missing_evidence ?? []))
      ],
      unsupported: [...new Set(unknownChildren.flatMap((child) => child.unsupported ?? []))],
      reasons: unknownChildren.flatMap((child) => child.reasons ?? [])
    };
  }

  return {
    status: "passed",
    evidence_refs: children.flatMap((child) => child.evidence_refs)
  };
}

function mergeAnyResults(children: CapabilityPredicateResultV1[]): CapabilityPredicateResultV1 {
  const passedChildren = children.filter((child) => child.status === "passed");
  if (passedChildren.length > 0) {
    return {
      status: "passed",
      evidence_refs: passedChildren.flatMap((child) => child.evidence_refs)
    };
  }

  if (children.some((child) => child.status === "unknown")) {
    const unknownChildren = children.filter((child) => child.status === "unknown");
    return {
      status: "unknown",
      evidence_refs: [],
      missing_evidence: [
        ...new Set(unknownChildren.flatMap((child) => child.missing_evidence ?? []))
      ],
      unsupported: [...new Set(unknownChildren.flatMap((child) => child.unsupported ?? []))],
      reasons: unknownChildren.flatMap((child) => child.reasons ?? [])
    };
  }

  return {
    status: "failed",
    evidence_refs: [],
    reasons: children.flatMap((child) => child.reasons ?? [])
  };
}

export function evaluateCapabilityPredicate(
  predicate: CapabilityPredicateV1,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  switch (predicate.op) {
    case "item_count_gte":
      return evaluateItemCountGte(predicate, bag);
    case "held_item_is":
      return evaluateHeldItemIs(predicate, bag);
    case "block_observed_at":
      return evaluateBlockObservedAt(predicate, bag);
    case "position_within":
      return evaluatePositionWithin(predicate, bag);
    case "container_item_count_gte":
      return evaluateContainerItemCountGte(predicate, bag);
    case "evidence_kind_seen":
      return evaluateEvidenceKindSeen(predicate, bag);
    case "all":
      return mergeAllResults(predicate.children.map((child) => evaluateCapabilityPredicate(child, bag)));
    case "any":
      return mergeAnyResults(predicate.children.map((child) => evaluateCapabilityPredicate(child, bag)));
    default: {
      const unsupportedOp = (predicate as { op?: string }).op ?? "unknown";
      return unknown([], [unsupportedOp], [`unsupported predicate op '${unsupportedOp}'`]);
    }
  }
}

export function evaluateCapabilityMilestone(
  milestone: CapabilityMilestoneV1,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  return evaluateCapabilityPredicate(milestone.predicate, bag);
}
