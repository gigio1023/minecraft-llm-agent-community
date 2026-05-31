import type {
  ActorPlanBead,
  PlanBeadContextSummary,
  PlanBeadDependency,
  PlanBeadDependencyType,
  PlanBeadPacket
} from "./types.js";
import { sanitizeWorkspaceFileId } from "../../actorWorkspacePaths.js";

export type BlockingPlanBeadDependencyType = Extract<
  PlanBeadDependencyType,
  "blocks" | "parent_child" | "waits_for"
>;

export type ComputeReadyPlanBeadsInput = {
  beads: readonly ActorPlanBead[];
  dependencies: readonly PlanBeadDependency[];
  nowIso?: string;
  lifeGoalId?: string;
  maxReady?: number;
};

export type PlanBeadBlockingDependencyExplanation = {
  blocking_bead_id: string;
  dependency_type: BlockingPlanBeadDependencyType;
  dependency_ref: string;
  blocker_status: ActorPlanBead["status"] | "missing";
  rationale: string;
  evidence_refs: string[];
};

export type PlanBeadReadinessExplanation = {
  bead_id: string;
  status: ActorPlanBead["status"];
  title: string;
  reasons: string[];
  blocking_dependencies: PlanBeadBlockingDependencyExplanation[];
  deferred_until?: string;
  dependency_refs: string[];
};

export type PlanBeadReadyFront = PlanBeadPacket & {
  blocked_explanations: PlanBeadReadinessExplanation[];
  deferred_explanations: PlanBeadReadinessExplanation[];
};

const blockingDependencyTypes = new Set<PlanBeadDependencyType>([
  "blocks",
  "parent_child",
  "waits_for"
]);

function isBlockingDependencyType(
  type: PlanBeadDependencyType
): type is BlockingPlanBeadDependencyType {
  return blockingDependencyTypes.has(type);
}

function beadKey(input: { actor_id: string; bead_id: string }) {
  return `${input.actor_id}:${input.bead_id}`;
}

function dependencyRef(dependency: PlanBeadDependency) {
  return `plan-bead-dependency:${dependency.actor_id}:${dependency.bead_id}:${dependency.type}:${dependency.depends_on_bead_id}`;
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}

function sortedBeads(beads: readonly ActorPlanBead[]) {
  return [...beads].sort((left, right) => {
    const priorityDelta = left.priority - right.priority;
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    const updatedDelta = left.checkpoint.updated_at.localeCompare(right.checkpoint.updated_at);
    if (updatedDelta !== 0) {
      return updatedDelta;
    }
    return left.bead_id.localeCompare(right.bead_id);
  });
}

function descriptionSummary(description: string) {
  const normalized = description.trim().replace(/\s+/g, " ");
  if (normalized.length <= 240) {
    return normalized;
  }
  return `${normalized.slice(0, 237)}...`;
}

function metadataString(bead: ActorPlanBead, key: string) {
  const value = bead.metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function deferredUntil(bead: ActorPlanBead) {
  return metadataString(bead, "deferred_until") ?? metadataString(bead, "defer_until");
}

function timestampMs(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function isFutureDeferred(bead: ActorPlanBead, nowIso: string | undefined) {
  const deferredMs = timestampMs(deferredUntil(bead));
  const nowMs = timestampMs(nowIso);
  return deferredMs !== undefined && nowMs !== undefined && deferredMs > nowMs;
}

function isDeferred(bead: ActorPlanBead, nowIso: string | undefined) {
  return bead.status === "deferred" || isFutureDeferred(bead, nowIso);
}

function isClosed(bead: ActorPlanBead | undefined) {
  return bead?.status === "closed";
}

function isActiveBlockingDependency(input: {
  dependency: PlanBeadDependency;
  blocker: ActorPlanBead | undefined;
  nowIso?: string;
}) {
  if (!isBlockingDependencyType(input.dependency.type)) {
    return false;
  }
  if (input.dependency.type === "parent_child") {
    return input.blocker === undefined || input.blocker.status === "blocked" || isDeferred(input.blocker, input.nowIso);
  }
  return !isClosed(input.blocker);
}

function dependencyRefs(dependencies: readonly PlanBeadDependency[]) {
  return dependencies.map((dependency) => dependencyRef(dependency)).sort();
}

function contextSummary(input: {
  bead: ActorPlanBead;
  dependencies: readonly PlanBeadDependency[];
  blockerNotes?: readonly string[];
}): PlanBeadContextSummary {
  const dependency_ref_values = dependencyRefs(input.dependencies);
  return {
    bead_id: input.bead.bead_id,
    kind: input.bead.kind,
    status: input.bead.status,
    priority: input.bead.priority,
    title: input.bead.title,
    description_summary: descriptionSummary(input.bead.description),
    acceptance_evidence_required: [...input.bead.acceptance_criteria.evidence_required],
    notes_next: [...input.bead.notes.next],
    blockers: uniqueStrings([...input.bead.notes.blockers, ...(input.blockerNotes ?? [])]),
    labels: [...input.bead.labels],
    evidence_refs: uniqueStrings([
      ...input.bead.refs.evidence_refs,
      ...input.bead.checkpoint.evidence_refs
    ]),
    dependency_refs: dependency_ref_values,
    checkpoint_ref: `plan-beads/beads/${sanitizeWorkspaceFileId(input.bead.bead_id)}.json`
  };
}

function blockingExplanation(input: {
  bead: ActorPlanBead;
  dependencies: readonly PlanBeadDependency[];
  beadByKey: ReadonlyMap<string, ActorPlanBead>;
  nowIso?: string;
}): PlanBeadBlockingDependencyExplanation[] {
  return input.dependencies
    .filter((dependency) => isBlockingDependencyType(dependency.type))
    .filter((dependency) => {
      const blocker = input.beadByKey.get(
        beadKey({
          actor_id: dependency.actor_id,
          bead_id: dependency.depends_on_bead_id
        })
      );
      return isActiveBlockingDependency({ dependency, blocker, nowIso: input.nowIso });
    })
    .map((dependency) => {
      const blocker = input.beadByKey.get(
        beadKey({
          actor_id: dependency.actor_id,
          bead_id: dependency.depends_on_bead_id
        })
      );
      return {
        blocking_bead_id: dependency.depends_on_bead_id,
        dependency_type: dependency.type as BlockingPlanBeadDependencyType,
        dependency_ref: dependencyRef(dependency),
        blocker_status: blocker?.status ?? "missing",
        rationale: dependency.rationale,
        evidence_refs: [...dependency.evidence_refs]
      };
    });
}

function blockerNotes(blockers: readonly PlanBeadBlockingDependencyExplanation[]) {
  return blockers.map(
    (blocker) =>
      `Blocked by ${blocker.blocking_bead_id} via ${blocker.dependency_type} dependency.`
  );
}

function closedSummary(bead: ActorPlanBead): PlanBeadPacket["recently_closed_beads"][number] | null {
  if (bead.status !== "closed" || !bead.checkpoint.close_kind || !bead.checkpoint.close_reason) {
    return null;
  }
  return {
    bead_id: bead.bead_id,
    title: bead.title,
    close_kind: bead.checkpoint.close_kind,
    close_reason: bead.checkpoint.close_reason,
    evidence_refs: [...bead.checkpoint.evidence_refs]
  };
}

/**
 * Computes the read-only PlanBead ready front. The returned packet-shaped data
 * is context for CycleGoal selection only; ActionIntent validation and runtime
 * evidence remain the authority for executable work and physical progress.
 */
export function computeReadyPlanBeads(input: ComputeReadyPlanBeadsInput): PlanBeadReadyFront {
  const maxReady =
    input.maxReady === undefined ? undefined : Math.max(0, Math.floor(input.maxReady));
  const relevantBeads = input.lifeGoalId
    ? input.beads.filter((bead) => bead.life_goal_id === input.lifeGoalId)
    : [...input.beads];
  const beadByKey = new Map(input.beads.map((bead) => [beadKey(bead), bead]));
  const dependenciesByBead = new Map<string, PlanBeadDependency[]>();

  for (const dependency of input.dependencies) {
    const key = beadKey({ actor_id: dependency.actor_id, bead_id: dependency.bead_id });
    dependenciesByBead.set(key, [...(dependenciesByBead.get(key) ?? []), dependency]);
  }

  const readyCandidates: ActorPlanBead[] = [];
  const inProgressCandidates: ActorPlanBead[] = [];
  const blockedCandidates: Array<{
    bead: ActorPlanBead;
    blockers: PlanBeadBlockingDependencyExplanation[];
  }> = [];
  const blocked_explanations: PlanBeadReadinessExplanation[] = [];
  const deferred_explanations: PlanBeadReadinessExplanation[] = [];

  for (const bead of relevantBeads) {
    const dependencies = dependenciesByBead.get(beadKey(bead)) ?? [];
    const blockers = blockingExplanation({
      bead,
      dependencies,
      beadByKey,
      nowIso: input.nowIso
    });
    const dependency_ref_values = dependencyRefs(dependencies);
    const futureDeferred = isFutureDeferred(bead, input.nowIso);
    const deferUntil = deferredUntil(bead);

    if (bead.status === "closed") {
      continue;
    }

    if (bead.status === "in_progress") {
      inProgressCandidates.push(bead);
      continue;
    }

    if (bead.status === "blocked" || blockers.length > 0) {
      const reasons = [
        ...(bead.status === "blocked" ? ["status_blocked"] : []),
        ...(blockers.length > 0 ? ["blocking_dependency"] : [])
      ];
      blockedCandidates.push({ bead, blockers });
      blocked_explanations.push({
        bead_id: bead.bead_id,
        status: bead.status,
        title: bead.title,
        reasons,
        blocking_dependencies: blockers,
        dependency_refs: dependency_ref_values
      });
      continue;
    }

    if (bead.status === "deferred" || futureDeferred) {
      deferred_explanations.push({
        bead_id: bead.bead_id,
        status: bead.status,
        title: bead.title,
        reasons: [bead.status === "deferred" ? "status_deferred" : "future_deferred_until"],
        blocking_dependencies: [],
        deferred_until: deferUntil,
        dependency_refs: dependency_ref_values
      });
      continue;
    }

    if (bead.status === "open") {
      readyCandidates.push(bead);
    }
  }

  const readySorted = sortedBeads(readyCandidates);
  const readyLimited = maxReady === undefined ? readySorted : readySorted.slice(0, maxReady);
  const blockedSorted = sortedBeads(blockedCandidates.map((entry) => entry.bead));
  const inProgressSorted = sortedBeads(inProgressCandidates);
  const closedSorted = sortedBeads(
    relevantBeads.filter((bead) => bead.status === "closed")
  ).reverse();

  return {
    schema: "plan-bead-packet/v1",
    physical_progress_claim: false,
    ready_beads: readyLimited.map((bead) =>
      contextSummary({
        bead,
        dependencies: dependenciesByBead.get(beadKey(bead)) ?? []
      })
    ),
    in_progress_beads: inProgressSorted.map((bead) =>
      contextSummary({
        bead,
        dependencies: dependenciesByBead.get(beadKey(bead)) ?? []
      })
    ),
    blocked_beads: blockedSorted.map((bead) => {
      const blockers =
        blockedCandidates.find((entry) => beadKey(entry.bead) === beadKey(bead))?.blockers ??
        [];
      return contextSummary({
        bead,
        dependencies: dependenciesByBead.get(beadKey(bead)) ?? [],
        blockerNotes: blockerNotes(blockers)
      });
    }),
    recently_closed_beads: closedSorted.flatMap((bead) => {
      const summary = closedSummary(bead);
      return summary ? [summary] : [];
    }),
    graph_summary: {
      open_count: relevantBeads.filter((bead) => bead.status === "open").length,
      ready_count: readyCandidates.length,
      blocked_count: blockedCandidates.length,
      deferred_count: relevantBeads.filter(
        (bead) => bead.status !== "closed" && isDeferred(bead, input.nowIso)
      ).length,
      closed_recent_count: relevantBeads.filter((bead) => bead.status === "closed").length
    },
    rules: {
      beads_are_context_not_authority: true,
      ready_front_guides_goal_selection: true,
      action_surface_controls_execution: true,
      runtime_verifies_physical_progress: true
    },
    blocked_explanations,
    deferred_explanations
  };
}
