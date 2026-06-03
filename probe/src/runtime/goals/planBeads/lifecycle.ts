import type { ActionIntent } from "../types.js";
import type { SocialPrimitiveAttemptStatus } from "../../socialCycleProgress.js";
import type { ActorPlanBead, PlanBeadOperation } from "./types.js";

type EvidenceSignal =
  | {
      kind: "deposit_shared";
      itemName?: string;
    }
  | {
      kind: "inspect_chest";
    }
  | {
      kind: "crafted";
      itemName?: string;
    };

export type PlanBeadLifecycleDerivationInput = {
  actorId: string;
  cycleId: string;
  turnId: string;
  actionIntent: ActionIntent;
  toolStatuses: readonly SocialPrimitiveAttemptStatus[];
  evidenceRefs: readonly string[];
  beads: readonly ActorPlanBead[];
};

export type PlanBeadCurrentStateLifecycleInput = {
  actorId: string;
  cycleId: string;
  turnId: string;
  currentState: {
    shared_storage?: {
      status?: string;
      items?: readonly { name: string; count: number }[];
      evidence_refs?: readonly string[];
    };
    deposit_candidates?: readonly { socially_requested?: boolean }[];
  };
  beads: readonly ActorPlanBead[];
};

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function textForBead(bead: ActorPlanBead) {
  return [
    bead.title,
    bead.description,
    ...bead.acceptance_criteria.evidence_required,
    ...bead.notes.next,
    ...bead.notes.blockers,
    ...bead.labels
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function intentItemName(intent: ActionIntent) {
  return readString(intent.parameters?.itemName) ??
    readString(intent.parameters?.targetItem) ??
    readString(intent.parameters?.recipe) ??
    readString(intent.args?.itemName) ??
    readString(intent.args?.targetItem) ??
    readString(intent.args?.recipe);
}

function successfulSignal(input: {
  intent: ActionIntent;
  toolStatus: SocialPrimitiveAttemptStatus;
}): EvidenceSignal | null {
  if (input.toolStatus.tool === "deposit_shared" && input.toolStatus.status === "deposited") {
    return { kind: "deposit_shared", itemName: intentItemName(input.intent) };
  }
  if (input.toolStatus.tool === "inspect_chest" && input.toolStatus.status === "inspected") {
    return { kind: "inspect_chest" };
  }
  if (
    (input.toolStatus.tool === "craft_item" || input.toolStatus.tool === "craft_with_table") &&
    input.toolStatus.status === "crafted"
  ) {
    return { kind: "crafted", itemName: intentItemName(input.intent) };
  }
  return null;
}

function runtimeEvidenceRefs(refs: readonly string[]) {
  return refs.filter((ref) => ref.startsWith("evidence/") || ref.startsWith("settlement/"));
}

function hasAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(term));
}

function itemTerms(itemName: string | undefined) {
  if (!itemName) {
    return [];
  }
  const normalized = itemName.toLowerCase().replace(/[_-]+/g, " ");
  return uniqueStrings([itemName.toLowerCase(), normalized]);
}

export function matchPlanBeadAcceptanceEvidence(input: {
  bead: ActorPlanBead;
  signal: EvidenceSignal;
}): "close_satisfied" | "update_incomplete" | "no_match" {
  const text = textForBead(input.bead);
  switch (input.signal.kind) {
    case "deposit_shared": {
      const storageTerms = [
        "shared storage",
        "shared chest",
        "chest deposit",
        "storage deposit",
        "deposit",
        "contribution",
        "contribute"
      ];
      return hasAny(text, storageTerms) ? "close_satisfied" : "no_match";
    }
    case "inspect_chest": {
      const isChestConcern = hasAny(text, [
        "shared chest",
        "chest access",
        "inspect chest",
        "inspect shared",
        "open chest"
      ]);
      if (!isChestConcern) {
        return "no_match";
      }
      return hasAny(text, ["deposit", "contribution", "contribute"])
        ? "update_incomplete"
        : "close_satisfied";
    }
    case "crafted": {
      const terms = itemTerms(input.signal.itemName);
      return terms.length > 0 && hasAny(text, terms) ? "close_satisfied" : "no_match";
    }
  }
}

function completedNote(signal: EvidenceSignal) {
  switch (signal.kind) {
    case "deposit_shared":
      return `Runtime evidence deposited${signal.itemName ? ` ${signal.itemName}` : ""} into shared storage.`;
    case "inspect_chest":
      return "Runtime evidence inspected shared chest access.";
    case "crafted":
      return `Runtime evidence crafted${signal.itemName ? ` ${signal.itemName}` : " an item"}.`;
  }
}

function incompleteNote(signal: EvidenceSignal) {
  switch (signal.kind) {
    case "inspect_chest":
      return "Runtime evidence verified chest inspection, but contribution/deposit evidence is still missing.";
    default:
      return completedNote(signal);
  }
}

function closeOperation(input: {
  actorId: string;
  bead: ActorPlanBead;
  signal: EvidenceSignal;
  evidenceRefs: readonly string[];
}): PlanBeadOperation {
  return {
    schema: "plan-bead-operation/v1",
    actor_id: input.actorId,
    op: "set_status",
    bead_id: input.bead.bead_id,
    rationale: `Runtime evidence matched PlanBead acceptance: ${completedNote(input.signal)}`,
    evidence_refs: [...input.evidenceRefs],
    confidence: "observed",
    expected_checkpoint_version: input.bead.checkpoint.version,
    patch: {
      status: "closed",
      close_kind: "satisfied",
      close_reason: completedNote(input.signal)
    }
  };
}

function updateOperation(input: {
  actorId: string;
  bead: ActorPlanBead;
  signal: EvidenceSignal;
  evidenceRefs: readonly string[];
}): PlanBeadOperation {
  return {
    schema: "plan-bead-operation/v1",
    actor_id: input.actorId,
    op: "update_notes",
    bead_id: input.bead.bead_id,
    rationale: `Runtime evidence partially matched PlanBead acceptance: ${incompleteNote(input.signal)}`,
    evidence_refs: [...input.evidenceRefs],
    confidence: "observed",
    expected_checkpoint_version: input.bead.checkpoint.version,
    patch: {
      in_progress: uniqueStrings([
        ...input.bead.notes.in_progress,
        incompleteNote(input.signal)
      ])
    }
  };
}

export function derivePlanBeadLifecycleOperationsFromTurnEvidence(
  input: PlanBeadLifecycleDerivationInput
): PlanBeadOperation[] {
  const evidenceRefs = runtimeEvidenceRefs(input.evidenceRefs);
  if (evidenceRefs.length === 0) {
    return [];
  }
  const signals = input.toolStatuses
    .map((toolStatus) => successfulSignal({ intent: input.actionIntent, toolStatus }))
    .filter((signal): signal is EvidenceSignal => signal !== null);
  if (signals.length === 0) {
    return [];
  }

  const operations: PlanBeadOperation[] = [];
  const touched = new Set<string>();
  for (const bead of input.beads) {
    if (bead.status === "closed" || touched.has(bead.bead_id)) {
      continue;
    }
    for (const signal of signals) {
      const match = matchPlanBeadAcceptanceEvidence({ bead, signal });
      if (match === "close_satisfied") {
        operations.push(closeOperation({
          actorId: input.actorId,
          bead,
          signal,
          evidenceRefs
        }));
        touched.add(bead.bead_id);
        break;
      }
      if (match === "update_incomplete") {
        operations.push(updateOperation({
          actorId: input.actorId,
          bead,
          signal,
          evidenceRefs
        }));
        touched.add(bead.bead_id);
        break;
      }
    }
  }
  return operations;
}

export function derivePlanBeadLifecycleOperationsFromCurrentState(
  input: PlanBeadCurrentStateLifecycleInput
): PlanBeadOperation[] {
  const sharedStorage = input.currentState.shared_storage;
  const evidenceRefs = runtimeEvidenceRefs(sharedStorage?.evidence_refs ?? []);
  const hasOpenSocialDeposit = (input.currentState.deposit_candidates ?? []).some((candidate) =>
    candidate.socially_requested === true
  );
  if (
    sharedStorage?.status !== "contributed" ||
    evidenceRefs.length === 0 ||
    hasOpenSocialDeposit
  ) {
    return [];
  }

  const depositedItems = (sharedStorage.items ?? [])
    .filter((item) => item.count > 0)
    .map((item) => item.name);
  const signals: EvidenceSignal[] = depositedItems.length > 0
    ? depositedItems.map((itemName) => ({ kind: "deposit_shared", itemName }))
    : [{ kind: "deposit_shared" }];
  const operations: PlanBeadOperation[] = [];
  const touched = new Set<string>();

  for (const bead of input.beads) {
    if (bead.status === "closed" || touched.has(bead.bead_id)) {
      continue;
    }
    for (const signal of signals) {
      const match = matchPlanBeadAcceptanceEvidence({ bead, signal });
      if (match === "close_satisfied") {
        operations.push(closeOperation({
          actorId: input.actorId,
          bead,
          signal,
          evidenceRefs
        }));
        touched.add(bead.bead_id);
        break;
      }
    }
  }

  return operations;
}
