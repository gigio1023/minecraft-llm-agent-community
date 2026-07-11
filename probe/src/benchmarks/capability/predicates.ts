import type {
  CapabilityEvidenceBagV1,
  EvidencedValueV1
} from "./evidenceBag.js";
import { normalizeMinecraftId } from "./minecraftIds.js";
import type {
  CapabilityMilestoneV1,
  CapabilityPredicateResultV1,
  CapabilityPredicateV1
} from "./types.js";

function passed(evidence_refs: string[]): CapabilityPredicateResultV1 {
  return { status: "passed", evidence_refs: dedupeRefs(evidence_refs) };
}

function failed(reasons: string[], evidence_refs: string[] = []): CapabilityPredicateResultV1 {
  return { status: "failed", evidence_refs: dedupeRefs(evidence_refs), reasons };
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

function dedupeRefs(refs: string[]): string[] {
  return [...new Set(refs.filter((ref) => typeof ref === "string" && ref.trim().length > 0))];
}

function hasNonEmptyRefs(refs: readonly string[] | undefined): refs is [string, ...string[]] {
  return Array.isArray(refs) && refs.some((ref) => typeof ref === "string" && ref.trim().length > 0);
}

function requireRunEvidenced<T>(
  evidenced: EvidencedValueV1<T> | undefined,
  available: boolean,
  missingKey: string
):
  | { ok: true; value: T; evidence_refs: string[] }
  | { ok: false; result: CapabilityPredicateResultV1 } {
  if (!available || evidenced === undefined) {
    return { ok: false, result: unknown([missingKey]) };
  }
  if (!hasNonEmptyRefs(evidenced.evidence_refs)) {
    return {
      ok: false,
      result: unknown(
        [`${missingKey}.evidence_refs`],
        [],
        [`${missingKey} is present without resolvable source artifact refs`]
      )
    };
  }
  if (evidenced.origin !== "run") {
    return {
      ok: false,
      result: unknown(
        [`${missingKey}.run`],
        [],
        [`${missingKey} origin is '${evidenced.origin}'; setup/fixture values cannot satisfy acquisition or placement targets`]
      )
    };
  }
  return {
    ok: true,
    value: evidenced.value,
    evidence_refs: dedupeRefs(evidenced.evidence_refs)
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

function inventoryCountForItem(counts: Record<string, number>, item: string): number {
  const normalized = normalizeMinecraftId(item);
  let total = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (normalizeMinecraftId(name) === normalized) {
      total += count;
    }
  }
  return total;
}

function evaluateItemCountGte(
  predicate: Extract<CapabilityPredicateV1, { op: "item_count_gte" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  const required = requireRunEvidenced(bag.inventory, bag.available.inventory, "inventory");
  if (!required.ok) {
    return required.result;
  }

  const actual = inventoryCountForItem(required.value, predicate.item);
  if (actual < predicate.count) {
    return failed(
      [
        `inventory count for '${normalizeMinecraftId(predicate.item)}' is ${actual}, need >= ${predicate.count}`
      ],
      required.evidence_refs
    );
  }

  return passed(required.evidence_refs);
}

function evaluateHeldItemIs(
  predicate: Extract<CapabilityPredicateV1, { op: "held_item_is" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  const required = requireRunEvidenced(bag.held_item, bag.available.held_item, "held_item");
  if (!required.ok) {
    return required.result;
  }

  const expected = normalizeMinecraftId(predicate.item);
  const actual = required.value?.name ? normalizeMinecraftId(required.value.name) : null;
  if (actual !== expected) {
    return failed(
      [`held item is '${actual ?? "none"}', expected '${expected}'`],
      required.evidence_refs
    );
  }

  return passed(required.evidence_refs);
}

function evaluateBlockObservedAt(
  predicate: Extract<CapabilityPredicateV1, { op: "block_observed_at" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  if (!bag.available.blocks) {
    return unknown(["known_blocks"]);
  }

  const named = bag.named_positions?.[predicate.position_ref];
  if (!named) {
    return unknown([`named_positions.${predicate.position_ref}`]);
  }
  if (!hasNonEmptyRefs(named.evidence_refs)) {
    return unknown(
      [`named_positions.${predicate.position_ref}.evidence_refs`],
      [],
      [
        `position_ref '${predicate.position_ref}' lacks resolvable source refs; A2 must bind it to a current-run placement artifact`
      ]
    );
  }
  if (named.origin !== "run") {
    return unknown(
      [`named_positions.${predicate.position_ref}.run`],
      [],
      [
        `position_ref '${predicate.position_ref}' origin is '${named.origin}'; setup/fixture positions cannot satisfy placement targets`
      ]
    );
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

  const runCandidates = candidates.filter((entry) => entry.origin === "run");
  if (runCandidates.length === 0) {
    return unknown(
      [`known_blocks.run for '${expectedBlock}'`],
      [],
      [
        `block '${expectedBlock}' was only recorded as setup/fixture; cannot satisfy placement target`
      ]
    );
  }

  const positioned = runCandidates.filter((entry) => entry.position !== undefined);
  if (positioned.length === 0) {
    return unknown(
      [`known_blocks.position for '${expectedBlock}'`],
      [],
      [
        `block '${expectedBlock}' was seen without coordinates; cannot verify position_ref '${predicate.position_ref}'`
      ]
    );
  }

  const match = positioned.find((entry) =>
    positionsEqual(entry.position!, named.value)
  );
  if (!match) {
    return failed(
      [`block '${expectedBlock}' not observed at position_ref '${predicate.position_ref}'`],
      named.evidence_refs
    );
  }
  if (!hasNonEmptyRefs([match.evidence_ref])) {
    return unknown(
      [`known_blocks.evidence_ref for '${expectedBlock}'`],
      [],
      [`matching block observation lacks a resolvable source artifact ref`]
    );
  }

  return passed(dedupeRefs([...named.evidence_refs, match.evidence_ref]));
}

function evaluatePositionWithin(
  predicate: Extract<CapabilityPredicateV1, { op: "position_within" }>,
  bag: CapabilityEvidenceBagV1
): CapabilityPredicateResultV1 {
  const actor = requireRunEvidenced(bag.actor_position, bag.available.position, "actor_position");
  if (!actor.ok) {
    return actor.result;
  }

  const center = bag.named_positions?.[predicate.center_ref];
  if (!center) {
    return unknown([`named_positions.${predicate.center_ref}`]);
  }
  if (!hasNonEmptyRefs(center.evidence_refs)) {
    return unknown([`named_positions.${predicate.center_ref}.evidence_refs`]);
  }
  // Center refs may be scenario/setup anchors; actor position must still be run-evidenced.
  const distance = distance3d(actor.value, center.value);
  if (distance > predicate.radius) {
    return failed(
      [
        `actor is ${distance.toFixed(3)} blocks from '${predicate.center_ref}', radius is ${predicate.radius}`
      ],
      dedupeRefs([...actor.evidence_refs, ...center.evidence_refs])
    );
  }

  return passed(dedupeRefs([...actor.evidence_refs, ...center.evidence_refs]));
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
  if (!hasNonEmptyRefs([container.evidence_ref])) {
    return unknown([`containers.${predicate.container_ref}.evidence_ref`]);
  }
  if (container.origin !== "run") {
    return unknown(
      [`containers.${predicate.container_ref}.run`],
      [],
      [
        `container '${predicate.container_ref}' origin is '${container.origin}'; setup/fixture contents cannot satisfy contribution targets`
      ]
    );
  }

  const normalized = normalizeMinecraftId(predicate.item);
  let actual = 0;
  for (const [name, count] of Object.entries(container.items)) {
    if (normalizeMinecraftId(name) === normalized) {
      actual += count;
    }
  }

  if (actual < predicate.count) {
    return failed(
      [
        `container '${predicate.container_ref}' has ${actual} of '${normalized}', need >= ${predicate.count}`
      ],
      [container.evidence_ref]
    );
  }

  return passed([container.evidence_ref]);
}

function mergeAllResults(children: CapabilityPredicateResultV1[]): CapabilityPredicateResultV1 {
  if (children.some((child) => child.status === "failed")) {
    const failedChildren = children.filter((child) => child.status === "failed");
    return {
      status: "failed",
      evidence_refs: dedupeRefs(failedChildren.flatMap((child) => child.evidence_refs)),
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
    evidence_refs: dedupeRefs(children.flatMap((child) => child.evidence_refs))
  };
}

function mergeAnyResults(children: CapabilityPredicateResultV1[]): CapabilityPredicateResultV1 {
  const passedChildren = children.filter((child) => child.status === "passed");
  if (passedChildren.length > 0) {
    return {
      status: "passed",
      evidence_refs: dedupeRefs(passedChildren.flatMap((child) => child.evidence_refs))
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
    evidence_refs: dedupeRefs(children.flatMap((child) => child.evidence_refs)),
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
    case "all":
      return mergeAllResults(
        predicate.children.map((child) => evaluateCapabilityPredicate(child, bag))
      );
    case "any":
      return mergeAnyResults(
        predicate.children.map((child) => evaluateCapabilityPredicate(child, bag))
      );
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
