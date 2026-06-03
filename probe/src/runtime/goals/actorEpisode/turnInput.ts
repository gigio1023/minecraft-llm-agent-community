import { lifeGoalRef } from "../lifeGoalStore.js";
import { soulRef } from "../actorSoulStore.js";
import type { ActorCycleGoal } from "../types.js";
import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import {
  buildActionCardProjection,
  type ActionCardProjection
} from "./actionCards.js";
import {
  feasibleInventoryGridRecipeNames,
  feasibleTableBoundRecipeNames,
  missingInventoryGridRecipeIngredients,
  missingTableBoundRecipeIngredients,
  validateActionCardCurrentStateRequirements
} from "./resolver.js";
import type {
  ActiveEpisode,
  ActorTurnDecisionFrame,
  ActorTurnInput,
  ActorTurnCurrentStateProjection,
  EvidenceTraceEntry,
  MinecraftBasicGuideProjection,
  PlanBeadHint,
  ProviderBudgetHint,
  RelationshipContextProjection,
  SocialPressureSummary
} from "./types.js";

function unique(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function sameStrings(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function positionFromRecord(value: unknown) {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }
  const x = readNumber(record.x);
  const y = readNumber(record.y);
  const z = readNumber(record.z);
  return x === undefined || y === undefined || z === undefined
    ? undefined
    : { x, y, z };
}

function inventoryCountsFromObservation(observation: unknown) {
  const inventory = asRecord(observation)?.inventory;
  const counts: Record<string, number> = {};
  if (!Array.isArray(inventory)) {
    return counts;
  }
  for (const item of inventory) {
    const record = asRecord(item);
    const name = readString(record?.name);
    const count = readNumber(record?.count);
    if (name && count !== undefined) {
      counts[name] = (counts[name] ?? 0) + count;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function visibleActorsFromObservation(observation: unknown): ActorTurnCurrentStateProjection["visible_actors"] {
  const visibleActors = asRecord(observation)?.visibleActors;
  if (!Array.isArray(visibleActors)) {
    return [];
  }
  return visibleActors
    .map((actor) => {
      const record = asRecord(actor);
      const id = readString(record?.id) ?? readString(record?.actor_id);
      if (!id) {
        return null;
      }
      return {
        id,
        ...(readNumber(record?.distance) !== undefined ? { distance: readNumber(record?.distance) } : {}),
        ...(readBoolean(record?.busy) !== undefined ? { busy: readBoolean(record?.busy) } : {})
      };
    })
    .filter((actor): actor is ActorTurnCurrentStateProjection["visible_actors"][number] => actor !== null)
    .slice(0, 8);
}

function nearbyBlockHintsFromObservation(observation: unknown) {
  const nearbyBlocks = asRecord(observation)?.nearbyBlocks;
  if (!Array.isArray(nearbyBlocks)) {
    return [];
  }
  return nearbyBlocks
    .map((block) => {
      const record = asRecord(block);
      const name = readString(record?.name);
      if (!name) {
        return null;
      }
      return {
        name,
        ...(readNumber(record?.distance) !== undefined ? { distance: readNumber(record?.distance) } : {})
      };
    })
    .filter((block): block is { name: string; distance?: number } => block !== null)
    .slice(0, 16);
}

function vitalsFromObservation(observation: unknown): ActorTurnCurrentStateProjection["vitals"] | undefined {
  const vitals = asRecord(asRecord(observation)?.vitals);
  if (!vitals) {
    return undefined;
  }
  const heldItem = asRecord(vitals.held_item);
  const foodCandidates = Array.isArray(vitals.food_candidates)
    ? vitals.food_candidates
        .map((item) => {
          const record = asRecord(item);
          const name = readString(record?.name);
          const count = readNumber(record?.count);
          return name && count !== undefined ? { name, count } : null;
        })
        .filter((item): item is { name: string; count: number } => item !== null)
        .slice(0, 8)
    : [];
  return {
    ...(readNumber(vitals.health) !== undefined ? { health: readNumber(vitals.health) } : {}),
    ...(readNumber(vitals.food) !== undefined ? { food: readNumber(vitals.food) } : {}),
    ...(heldItem && readString(heldItem.name)
      ? {
          held_item: {
            name: readString(heldItem.name) as string,
            ...(readNumber(heldItem.count) !== undefined ? { count: readNumber(heldItem.count) } : {})
          }
        }
      : {}),
    food_candidates: foodCandidates
  };
}

function worldScanFromObservation(observation: unknown): ActorTurnCurrentStateProjection["world_scan"] | undefined {
  const summary = asRecord(asRecord(observation)?.worldStateSummary);
  if (!summary) {
    return undefined;
  }
  const blockObservations = asRecord(summary.block_observations);
  const loadedCoverage = asRecord(summary.loaded_coverage);
  const byName = Array.isArray(blockObservations?.by_name) ? blockObservations.by_name : [];
  const retainedBlockCounts = byName
    .map((entry) => {
      const record = asRecord(entry);
      const name = readString(record?.name);
      const count = readNumber(record?.count);
      return name && count !== undefined ? { name, count } : null;
    })
    .filter((entry): entry is { name: string; count: number } => entry !== null)
    .slice(0, 16);
  return {
    scan_id: readString(summary.scan_id) ?? "unknown-scan",
    ...(readNumber(summary.radius) !== undefined ? { radius: readNumber(summary.radius) } : {}),
    coverage_scope: readString(loadedCoverage?.scope) ?? "unknown_scope",
    absence_claims_exhaustive: readBoolean(loadedCoverage?.absence_claims_exhaustive) ?? false,
    total_verified_blocks: readNumber(blockObservations?.total_verified) ?? 0,
    truncated: readBoolean(blockObservations?.truncated) ?? false,
    retained_block_counts: retainedBlockCounts,
    limitations: Array.isArray(summary.limitations)
      ? summary.limitations.filter((entry): entry is string => typeof entry === "string").slice(0, 6)
      : []
  };
}

function checklistProjection(context: SocialCycleContextPacket) {
  return context.settlement_state.checklist.items.map((item) => ({
    id: item.id,
    status: item.status,
    reason: item.reason,
    evidence_ref_count: item.evidence_refs.length
  }));
}

function blockerProjection(context: SocialCycleContextPacket) {
  return context.settlement_state.blocker_histogram.map((blocker) => ({
    key: blocker.key,
    count: blocker.count,
    example: blocker.example
  }));
}

function positionSummary(value: unknown) {
  const position = positionFromRecord(value);
  return position ? `(${position.x}, ${position.y}, ${position.z})` : undefined;
}

function distanceBetween(
  left: NonNullable<ActorTurnCurrentStateProjection["position"]>,
  right: NonNullable<ActorTurnCurrentStateProjection["position"]>
) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  const dz = left.z - right.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function tableUsabilitySuffix(input: {
  actorPosition?: NonNullable<ActorTurnCurrentStateProjection["position"]>;
  tablePosition?: NonNullable<ActorTurnCurrentStateProjection["position"]>;
}) {
  if (!input.actorPosition || !input.tablePosition) {
    return "";
  }
  const distance = distanceBetween(input.actorPosition, input.tablePosition);
  const rounded = Math.round(distance * 10) / 10;
  return ` distance_from_actor=${rounded} usable_now=${distance <= 4.5}`;
}

function knownPositionSummaries(
  context: SocialCycleContextPacket,
  actorPosition?: NonNullable<ActorTurnCurrentStateProjection["position"]>
) {
  const positions = context.settlement_state.known_positions;
  const craftingTablePosition = positions.crafting_table?.position
    ? positionFromRecord(positions.crafting_table.position)
    : undefined;
  return [
    positions.actor_position ? `actor_position=${positionSummary(positions.actor_position)}` : undefined,
    positions.crafting_table
      ? `crafting_table=${positions.crafting_table.status}${
          positions.crafting_table.position ? ` at ${positionSummary(positions.crafting_table.position)}` : ""
        }${tableUsabilitySuffix({ actorPosition, tablePosition: craftingTablePosition })}`
      : undefined,
    positions.shared_chest ? `shared_chest=${positions.shared_chest.status}` : undefined,
    positions.shelter ? `shelter=${positions.shelter.status}` : undefined
  ].filter((entry): entry is string => Boolean(entry));
}

function sharedStorageProjection(context: SocialCycleContextPacket): ActorTurnCurrentStateProjection["shared_storage"] {
  const storage = context.settlement_state.shared_storage;
  return {
    status: storage.status,
    ...(storage.chest_id ? { chest_id: storage.chest_id } : {}),
    items: storage.items.slice(0, 16).map((item) => ({ ...item })),
    evidence_refs: [...storage.evidence_refs]
  };
}

function requestLikeWorldEvents(context: SocialCycleContextPacket) {
  return context.world_events.filter((event) =>
    /\b(request|obligation|need|help|shared|deposit|deliver|contribut|material|resource|storage|chest)\b/i
      .test(event.summary)
  );
}

function normalizeItemText(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function eventMentionsItem(summary: string, itemName: string) {
  const normalizedSummary = normalizeItemText(summary);
  const normalizedItem = normalizeItemText(itemName);
  return normalizedSummary.includes(normalizedItem) || normalizedSummary.includes(itemName.toLowerCase());
}

function eventRequestsGenericMaterials(summary: string) {
  return /\b(material|materials|resource|resources|useful|supplies|shared storage|shared chest|deposit|contribut)\b/i
    .test(summary);
}

function eventMentionsSpecificMinecraftItem(summary: string) {
  return /\b[a-z]+_[a-z_]+\b/i.test(summary) ||
    /\b(oak|spruce|birch|jungle|acacia|dark oak|mangrove|cherry)\s+(log|planks|wood)\b/i.test(summary);
}

function eventMatchesDepositCandidate(input: {
  summary: string;
  itemName: string;
  inventoryItemNames: readonly string[];
}) {
  if (eventMentionsItem(input.summary, input.itemName)) {
    return true;
  }
  const eventMentionsAnyInventoryItem = input.inventoryItemNames.some((inventoryItemName) =>
    eventMentionsItem(input.summary, inventoryItemName)
  );
  return !eventMentionsAnyInventoryItem &&
    !eventMentionsSpecificMinecraftItem(input.summary) &&
    eventRequestsGenericMaterials(input.summary);
}

function requestedCountFromSummary(summary: string) {
  const numeric = summary.match(/\b([1-9]\d*)\b/);
  if (numeric) {
    return Number(numeric[1]);
  }
  if (/\bone\b/i.test(summary)) {
    return 1;
  }
  if (/\btwo\b/i.test(summary)) {
    return 2;
  }
  if (/\bthree\b/i.test(summary)) {
    return 3;
  }
  return undefined;
}

function sharedStorageItemCount(context: SocialCycleContextPacket, itemName: string) {
  return context.settlement_state.shared_storage.items
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

function requestSatisfiedBySharedStorage(input: {
  context: SocialCycleContextPacket;
  summary: string;
  itemName: string;
}) {
  if (!eventMentionsItem(input.summary, input.itemName)) {
    return false;
  }
  const requestedCount = requestedCountFromSummary(input.summary) ?? 1;
  return sharedStorageItemCount(input.context, input.itemName) >= requestedCount;
}

function eventRefsForProvider(event: SocialCycleContextPacket["world_events"][number]) {
  return event.evidence_refs.length > 0 ? [...event.evidence_refs] : [`world-events/${event.event_id}.json`];
}

function depositCandidatesFromContext(
  context: SocialCycleContextPacket,
  inventoryCounts: Record<string, number>
): ActorTurnCurrentStateProjection["deposit_candidates"] {
  const requestEvents = requestLikeWorldEvents(context);
  const actorId = context.ActorSoul.actor_id;
  const inventoryItemNames = Object.entries(inventoryCounts)
    .filter(([, count]) => count > 0)
    .map(([itemName]) => itemName);
  return Object.entries(inventoryCounts)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(0, 12)
    .map(([itemName, inventoryCount]) => {
      const matchingEvents = requestEvents.filter((event) =>
        eventMatchesDepositCandidate({
          summary: event.summary,
          itemName,
          inventoryItemNames
        })
      );
      const openMatchingEvents = matchingEvents.filter((event) =>
        !requestSatisfiedBySharedStorage({ context, summary: event.summary, itemName })
      );
      const requestedCount = matchingEvents
        .map((event) => requestedCountFromSummary(event.summary))
        .find((count): count is number => count !== undefined);
      const suggestedCount = Math.max(1, Math.min(inventoryCount, requestedCount ?? 1));
      return {
        itemName,
        inventoryCount,
        suggestedCount,
        maxDepositableCount: inventoryCount,
        socially_requested: openMatchingEvents.length > 0,
        requested_by_actor_ids: unique(
          openMatchingEvents.flatMap((event) => event.actor_refs).filter((ref) => ref !== actorId)
        ).slice(0, 6),
        request_summaries: unique(openMatchingEvents.map((event) => event.summary)).slice(0, 3),
        evidence_refs: unique(openMatchingEvents.flatMap(eventRefsForProvider)).slice(0, 6)
      };
    });
}

export function buildActorTurnCurrentStateProjection(
  context: SocialCycleContextPacket
): ActorTurnCurrentStateProjection {
  const observation = context.observation;
  const observerId = readString(asRecord(observation)?.observerId) ?? context.ActorSoul.actor_id;
  const inventoryCounts = inventoryCountsFromObservation(observation);
  const actorPosition = positionFromRecord(asRecord(observation)?.position);
  return {
    schema: "actor-turn-current-state/v1",
    observer_id: observerId,
    ...(actorPosition ? { position: actorPosition } : {}),
    inventory_counts: inventoryCounts,
    ...(vitalsFromObservation(observation) ? { vitals: vitalsFromObservation(observation) } : {}),
    visible_actors: visibleActorsFromObservation(observation),
    obligation_summaries: obligationsFromContext(context),
    nearby_block_hints: nearbyBlockHintsFromObservation(observation),
    shared_storage: sharedStorageProjection(context),
    deposit_candidates: depositCandidatesFromContext(context, inventoryCounts),
    ...(worldScanFromObservation(observation) ? { world_scan: worldScanFromObservation(observation) } : {}),
    settlement_progress: {
      inventory_counts: { ...context.settlement_state.inventory_counts },
      shared_storage_status: context.settlement_state.shared_storage.status,
      known_position_summaries: knownPositionSummaries(context, actorPosition),
      checklist: checklistProjection(context),
      recent_blockers: blockerProjection(context)
    }
  };
}

function visibleActorIdsFromObservation(observation: unknown) {
  const record = asRecord(observation);
  const visibleActors = Array.isArray(record?.visibleActors) ? record.visibleActors : [];
  return visibleActors
    .map((actor) => {
      if (typeof actor === "string") {
        return actor;
      }
      const actorRecord = asRecord(actor);
      return typeof actorRecord?.actor_id === "string"
        ? actorRecord.actor_id
        : typeof actorRecord?.id === "string"
          ? actorRecord.id
          : null;
    })
    .filter((actorId): actorId is string => Boolean(actorId));
}

function memoryRefsFromContext(context: SocialCycleContextPacket) {
  const packet = context.memory_packet;
  return unique([
    ...packet.retrieved_episodic.map((entry) => entry.memory_id),
    ...packet.retrieved_procedural.map((entry) => entry.memory_id),
    ...packet.retrieved_semantic.map((entry) => entry.memory_id),
    ...packet.retrieved_social.map((entry) => entry.memory_id),
    ...packet.guardrails.map((entry) => entry.memory_id),
    ...packet.beliefs.map((entry) => entry.memory_id)
  ]);
}

function relationshipRefsFromContext(context: SocialCycleContextPacket) {
  return unique([
    ...context.relationship_context.relationships.map((_, index) => `relationships/outgoing-${index}`),
    ...context.relationship_context.incoming_relationships.map((_, index) => `relationships/incoming-${index}`),
    ...context.relationship_context.relationship_context_signals.map((_, index) => `relationship-signals/outgoing-${index}`),
    ...context.relationship_context.incoming_relationship_context_signals.map((_, index) => `relationship-signals/incoming-${index}`)
  ]);
}

function obligationsFromContext(context: SocialCycleContextPacket) {
  const summaries = context.world_events
    .filter((event) =>
      /\b(request|obligation|need|help|shared|deposit|deliver)\b/i.test(event.summary)
    )
    .map((event) => event.summary);
  return unique(summaries);
}

function socialPressureFromContext(context: SocialCycleContextPacket): SocialPressureSummary[] {
  const sharedStorage = context.settlement_state.shared_storage;
  const pressures: SocialPressureSummary[] = [];
  if (sharedStorage.status !== "unknown") {
    pressures.push({
      kind: "shared_storage",
      summary: `Shared storage status is ${sharedStorage.status}.`,
      evidence_refs: [...sharedStorage.evidence_refs]
    });
  }
  for (const event of context.world_events) {
    if (event.evidence_refs.length > 0 || /\b(request|obligation|need|help|shared)\b/i.test(event.summary)) {
      pressures.push({
        kind: "world_event",
        summary: event.summary,
        evidence_refs: [...event.evidence_refs]
      });
    }
  }
  return pressures;
}

function planBeadHintsFromContext(context: SocialCycleContextPacket): PlanBeadHint[] {
  const packet = context.plan_bead_packet;
  if (!packet) {
    return [];
  }
  return [
    ...packet.ready_beads,
    ...packet.in_progress_beads,
    ...packet.blocked_beads
  ].map((bead) => ({
    bead_id: bead.bead_id,
    title: bead.title,
    status: bead.status,
    priority: bead.priority,
    why_it_matters: bead.description_summary,
    next_hints: [...bead.notes_next],
    blockers: [...bead.blockers],
    acceptance_evidence_required: [...bead.acceptance_evidence_required],
    evidence_refs: [...bead.evidence_refs],
    dependency_refs: [...bead.dependency_refs],
    checkpoint_ref: bead.checkpoint_ref
  }));
}

function selectedPlanBeadAnchorsFromContext(context: SocialCycleContextPacket) {
  const packet = context.plan_bead_packet;
  if (!packet) {
    return [];
  }
  return unique([
    ...packet.in_progress_beads.map((bead) => bead.bead_id),
    ...packet.ready_beads.map((bead) => bead.bead_id)
  ]).slice(0, 2);
}

export function anchorActiveEpisodeToPlanBeadContext(input: {
  activeEpisode: ActiveEpisode;
  context: SocialCycleContextPacket;
}): ActiveEpisode {
  const hintRefs = planBeadHintsFromContext(input.context).map((bead) => bead.bead_id);
  const selectedRefs = input.activeEpisode.selected_plan_bead_refs.length > 0
    ? input.activeEpisode.selected_plan_bead_refs
    : selectedPlanBeadAnchorsFromContext(input.context);
  const relatedRefs = unique([
    ...selectedRefs,
    ...input.activeEpisode.related_plan_bead_refs,
    ...hintRefs
  ]);
  if (
    sameStrings(selectedRefs, input.activeEpisode.selected_plan_bead_refs) &&
    sameStrings(relatedRefs, input.activeEpisode.related_plan_bead_refs)
  ) {
    return input.activeEpisode;
  }
  return {
    ...input.activeEpisode,
    selected_plan_bead_refs: selectedRefs,
    related_plan_bead_refs: relatedRefs
  };
}

function retryConstraintSummaries(context: SocialCycleContextPacket) {
  return context.runtime_retry_constraints.map((constraint) => ({
    constraint_id: constraint.constraint_id,
    target_summary: `${constraint.action_kind}:${constraint.target.kind}:${constraint.target.id}`,
    args_normalized: constraint.args_normalized,
    blocked_reason: constraint.blocker_reason,
    repeat_count: constraint.repeat_count,
    evidence_refs: [...constraint.evidence_refs]
  }));
}

function shouldSuppressObserveCards(input: {
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
  currentState: ActorTurnCurrentStateProjection;
}) {
  const repeatedObserveNoProgress = input.recentEvidenceTrace
    .slice(-2)
    .some((entry) =>
      entry.outcome === "no_progress" &&
      /\bobserve\b/i.test(entry.compact_summary)
    );
  return repeatedObserveNoProgress &&
    ((input.currentState.world_scan?.total_verified_blocks ?? 0) > 0 ||
      input.currentState.nearby_block_hints.length > 0);
}

function shouldSuppressRememberCards(input: {
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}) {
  const recentRememberNoProgress = input.recentEvidenceTrace
    .slice(-4)
    .filter((entry) =>
      entry.outcome === "no_progress" &&
      /\bremember\b/i.test(entry.compact_summary)
    );
  return recentRememberNoProgress.length >= 2;
}

function shouldSuppressMoveToCards(input: {
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}) {
  const recentMovementWithoutProgress = input.recentEvidenceTrace
    .slice(-4)
    .filter((entry) =>
      (entry.outcome === "position_delta" || entry.outcome === "no_progress" || entry.outcome === "blocked") &&
      /\bmove_to\b/i.test(entry.compact_summary)
    );
  return recentMovementWithoutProgress.length >= 2;
}

function recentSuccessfulCobblestoneMiningCount(recentEvidenceTrace: readonly EvidenceTraceEntry[]) {
  return recentEvidenceTrace
    .slice(-6)
    .filter((entry) =>
      (entry.outcome === "verified_mutation" || entry.outcome === "partial_verified_progress") &&
      /\b(mine_block|mineCobblestone|Mine Cobblestone)\b/i.test(entry.compact_summary)
    ).length;
}

function currentCobblestoneCount(currentState: ActorTurnCurrentStateProjection) {
  return Math.max(
    currentState.inventory_counts.cobblestone ?? 0,
    currentState.settlement_progress.inventory_counts.cobblestone ?? 0
  );
}

function hasExplicitCobblestoneShortage(input: {
  activeEpisode: ActiveEpisode;
  currentState: ActorTurnCurrentStateProjection;
}) {
  const text = [
    input.activeEpisode.current_focus,
    ...input.currentState.settlement_progress.checklist
      .filter((item) => item.status !== "satisfied")
      .map((item) => item.reason),
    ...input.currentState.settlement_progress.recent_blockers
      .map((blocker) => `${blocker.key} ${blocker.example ?? ""}`)
  ].join(" ");
  return /\b(missing|need|needs|needed|short|shortage|lack|lacking|insufficient|not enough)\b.{0,48}\b(cobblestone|stone)\b/i
    .test(text) ||
    /\b(cobblestone|stone)\b.{0,48}\b(missing|need|needs|needed|short|shortage|lack|lacking|insufficient|not enough)\b/i
      .test(text);
}

function shouldDemoteRepeatedCobblestoneMining(input: {
  activeEpisode: ActiveEpisode;
  currentState: ActorTurnCurrentStateProjection;
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
}) {
  return currentCobblestoneCount(input.currentState) >= 16 &&
    !hasExplicitCobblestoneShortage({
      activeEpisode: input.activeEpisode,
      currentState: input.currentState
    });
}

function suppressObserveCards(
  projection: ActionCardProjection,
  currentState: ActorTurnCurrentStateProjection,
  recentEvidenceTrace: readonly EvidenceTraceEntry[]
): ActionCardProjection {
  const suppressedIds = new Set<string>();
  if (shouldSuppressObserveCards({ currentState, recentEvidenceTrace })) {
    for (const card of projection.action_cards) {
      if (card.title === "Observe" || card.title === "Runtime Observe And Remember") {
        suppressedIds.add(card.action_card_id);
      }
    }
  }
  const suppressRemember = shouldSuppressRememberCards({ recentEvidenceTrace });
  if (suppressRemember) {
    for (const card of projection.action_cards) {
      if (card.title === "Remember" || card.title === "Runtime Observe And Remember") {
        suppressedIds.add(card.action_card_id);
      }
    }
  }
  const suppressMoveTo = shouldSuppressMoveToCards({ recentEvidenceTrace });
  if (suppressMoveTo) {
    for (const card of projection.action_cards) {
      if (card.title === "Move To") {
        suppressedIds.add(card.action_card_id);
      }
    }
  }
  const repeatedChestInspection = recentEvidenceTrace
    .slice(-4)
    .some((entry) =>
      entry.outcome === "verified_mutation" &&
      /\binspect_chest\b/i.test(entry.compact_summary)
    ) &&
    currentState.settlement_progress.known_position_summaries.some((entry) =>
      entry.includes("shared_chest=inspected") || entry.includes("shared_chest=contributed")
    );
  if (repeatedChestInspection) {
    for (const card of projection.action_cards) {
      if (card.title === "Inspect Chest" || card.title === "Inspect Shared Chest") {
        suppressedIds.add(card.action_card_id);
      }
    }
  }
  if (suppressedIds.size === 0) {
    return projection;
  }
  const actionCards = projection.action_cards.filter((card) =>
    !suppressedIds.has(card.action_card_id)
  );
  if (actionCards.length === 0) {
    return projection;
  }
  return {
    ...projection,
    action_cards: actionCards,
    runtime_mappings: projection.runtime_mappings.filter((mapping) =>
      !suppressedIds.has(mapping.action_card_id)
    ),
    missing_affordances: unique([
      ...projection.missing_affordances,
      ...(shouldSuppressObserveCards({ currentState, recentEvidenceTrace })
        ? ["observe suppressed after repeated no-progress observation; use current_state for an action or movement-enabled fresh observation"]
        : []),
      ...(suppressRemember
        ? ["remember suppressed after repeated no-progress memory-only turns; choose runtime evidence, movement, crafting, mining, placement, social chat, or author_mineflayer_action"]
        : []),
      ...(suppressMoveTo
        ? ["move_to suppressed after repeated movement without durable progress; choose a world, inventory, container, crafting, mining, placement, or authored action"]
        : []),
      ...(repeatedChestInspection
        ? ["inspect_chest suppressed after verified shared chest inspection; use the existing container state for a new action"]
        : [])
    ])
  };
}

function suppressUnavailableActionCards(
  projection: ActionCardProjection,
  currentState: ActorTurnCurrentStateProjection,
  context: SocialCycleContextPacket
): ActionCardProjection {
  const hiddenReasons: string[] = [];
  const hasOpenSocialDepositRequest = currentState.deposit_candidates.some((candidate) =>
    candidate.socially_requested
  );
  const actionCards = projection.action_cards.filter((card) => {
    const retryHiddenReason = retryConstraintHiddenReason({
      projection,
      card,
      context
    });
    if (retryHiddenReason) {
      hiddenReasons.push(retryHiddenReason);
      return false;
    }
    if (
      (card.title === "Deposit Shared" ||
        card.title === "Deposit Shared Items" ||
        card.title === "Handoff Item At Chest") &&
      currentState.shared_storage.status === "contributed" &&
      !hasOpenSocialDepositRequest
    ) {
      hiddenReasons.push(
        `${card.action_card_id} ${card.title} hidden because shared storage already has contribution evidence and no current deposit_candidate is socially_requested`
      );
      return false;
    }
    if (
      (card.title === "Inspect Chest" || card.title === "Inspect Shared Chest") &&
      currentState.shared_storage.status === "contributed" &&
      !hasOpenSocialDepositRequest
    ) {
      hiddenReasons.push(
        `${card.action_card_id} ${card.title} hidden because shared storage already has contribution evidence and no fresh container question is open`
      );
      return false;
    }
    const errors = validateActionCardCurrentStateRequirements({
      card,
      currentState,
      parameters: {},
      mode: "selection"
    });
    if (errors.length === 0) {
      return true;
    }
    hiddenReasons.push(
      `${card.action_card_id} ${card.title} hidden until current_state satisfies: ${errors.join("; ")}`
    );
    return false;
  });
  if (hiddenReasons.length === 0 || actionCards.length === 0) {
    return projection;
  }
  const visibleIds = new Set(actionCards.map((card) => card.action_card_id));
  return {
    ...projection,
    action_cards: actionCards,
    runtime_mappings: projection.runtime_mappings.filter((mapping) =>
      visibleIds.has(mapping.action_card_id)
    ),
    missing_affordances: [...projection.missing_affordances, ...hiddenReasons]
  };
}

function isEmptyJsonObject(value: unknown) {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0;
}

function retryConstraintHiddenReason(input: {
  projection: ActionCardProjection;
  card: ActionCardProjection["action_cards"][number];
  context: SocialCycleContextPacket;
}) {
  const mapping = input.projection.runtime_mappings.find((entry) =>
    entry.action_card_id === input.card.action_card_id
  );
  if (!mapping) {
    return undefined;
  }
  const matchingConstraint =
    input.context.runtime_retry_constraints.find((constraint) =>
      retryConstraintMatchesMapping(constraint, mapping)
    ) ??
    retryConstraintForSameVisibleTitle(input);
  if (!matchingConstraint) {
    return undefined;
  }
  return `${input.card.action_card_id} ${input.card.title} hidden because runtime_retry_constraint already blocks the same target with empty structured parameters: ${matchingConstraint.blocker_reason}`;
}

function retryConstraintMatchesMapping(
  constraint: SocialCycleContextPacket["runtime_retry_constraints"][number],
  mapping: ActionCardProjection["runtime_mappings"][number]
) {
  if (!constraint.rule.same_target_and_args_blocked || !isEmptyJsonObject(constraint.args_normalized)) {
    return false;
  }
  if (mapping.kind === "use_primitive") {
    return constraint.action_kind === "use_primitive" &&
      constraint.target.kind === "primitive" &&
      constraint.target.id === mapping.primitive_id;
  }
  return constraint.action_kind === "use_action_skill" &&
    constraint.target.kind === "action_skill" &&
    constraint.target.id === mapping.action_skill_id;
}

function retryConstraintForSameVisibleTitle(input: {
  projection: ActionCardProjection;
  card: ActionCardProjection["action_cards"][number];
  context: SocialCycleContextPacket;
}) {
  const blockedCardIds = new Set(
    input.projection.runtime_mappings
      .filter((mapping) =>
        input.context.runtime_retry_constraints.some((constraint) =>
          retryConstraintMatchesMapping(constraint, mapping)
        )
      )
      .map((mapping) => mapping.action_card_id)
  );
  const sameTitleBlockedCard = input.projection.action_cards.find((card) =>
    card.title === input.card.title && blockedCardIds.has(card.action_card_id)
  );
  if (!sameTitleBlockedCard) {
    return undefined;
  }
  const sameTitleMapping = input.projection.runtime_mappings.find((mapping) =>
    mapping.action_card_id === sameTitleBlockedCard.action_card_id
  );
  return sameTitleMapping
    ? input.context.runtime_retry_constraints.find((constraint) =>
        retryConstraintMatchesMapping(constraint, sameTitleMapping)
      )
    : undefined;
}

function annotateActionCardsWithCurrentStateHints(
  projection: ActionCardProjection,
  currentState: ActorTurnCurrentStateProjection
): ActionCardProjection {
  const actionCards = projection.action_cards.map((card) => {
    if (card.title === "Inspect Chest" || card.title === "Inspect Shared Chest") {
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          "Use empty parameters. This Action Card is the bounded shared-chest container snapshot, reachability, and openability check; do not author generated code just to probe the same chest.",
          `Current shared_storage status: ${currentState.shared_storage.status}.`,
          ...(currentState.shared_storage.items.length > 0
            ? [
                `Known shared_storage items: ${currentState.shared_storage.items
                  .map((item) => `${item.name}:${item.count}`)
                  .join(", ")}.`
              ]
            : []),
          ...(currentState.shared_storage.evidence_refs.length > 0
            ? [`Shared storage evidence refs: ${currentState.shared_storage.evidence_refs.join(", ")}.`]
            : [])
        ]),
        likely_blockers: unique([
          ...card.likely_blockers,
          "if this card is visible, use it before authoring a generated chest/openability probe"
        ])
      };
    }
    if (card.title === "Deposit Shared" || card.title === "Deposit Shared Items" || card.title === "Handoff Item At Chest") {
      const candidates = currentState.deposit_candidates.slice(0, 6);
      const requestedCandidates = candidates.filter((candidate) => candidate.socially_requested);
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          ...(candidates.length > 0
            ? [
                `Current deposit candidates: ${candidates
                  .map((candidate) =>
                    `${candidate.itemName} inventory=${candidate.inventoryCount} suggestedCount=${candidate.suggestedCount}${
                      candidate.socially_requested ? " socially_requested" : ""
                    }`
                  )
                  .join("; ")}.`
              ]
            : ["No inventory item is currently available for shared-storage deposit."]),
          ...(requestedCandidates.length > 0
            ? [
                `For deposit_shared parameters, prefer a socially requested candidate and set parameters.itemName plus parameters.count from suggestedCount.`
              ]
            : currentState.shared_storage.status === "contributed"
              ? [
                  "Current shared storage already has contribution evidence; do not repeat a deposit for the same completed request unless current_state shows a new unsatisfied social request or a different useful material need."
                ]
              : [])
        ])
      };
    }
    if (card.title !== "Craft With Table") {
      if (card.title !== "Craft Item") {
        return card;
      }
      const feasible = feasibleInventoryGridRecipeNames(currentState);
      const feasibleSet = new Set<string>(feasible);
      const commonMissing = ["oak_planks", "stick", "crafting_table", "torch"]
        .filter((itemName) => !feasibleSet.has(itemName))
        .map((itemName) =>
          `${itemName} missing ${missingInventoryGridRecipeIngredients(currentState, itemName).join(", ")}`
        );
      return {
        ...card,
        parameter_hints: unique([
          ...card.parameter_hints,
          feasible.length > 0
            ? `Current feasible inventory-grid recipes from inventory: ${feasible.join(", ")}.`
            : "No known inventory-grid recipe is currently feasible from inventory; choose observation, movement, mining, table crafting, placement, storage, or memory instead.",
          ...(commonMissing.length > 0
            ? [`Current missing inventory-grid recipe ingredients: ${commonMissing.join("; ")}.`]
            : [])
        ])
      };
    }
    const feasible = feasibleTableBoundRecipeNames(currentState);
    const feasibleSet = new Set<string>(feasible);
    const commonMissing = ["wooden_pickaxe", "stone_pickaxe", "furnace", "chest"]
      .filter((itemName) => !feasibleSet.has(itemName))
      .map((itemName) =>
        `${itemName} missing ${missingTableBoundRecipeIngredients(currentState, itemName).join(", ")}`
      );
    return {
      ...card,
      parameter_hints: unique([
        ...card.parameter_hints,
        feasible.length > 0
          ? `Current feasible table-bound recipes from inventory: ${feasible.join(", ")}.`
          : "No known table-bound recipe is currently feasible from inventory; choose prerequisites instead.",
        ...(commonMissing.length > 0
          ? [`Current missing table-bound recipe ingredients: ${commonMissing.join("; ")}.`]
          : []),
        "Do not request a table-bound item already present unless the Active Episode explicitly needs a spare."
      ])
    };
  });
  return { ...projection, action_cards: actionCards };
}

export function buildMinecraftBasicGuideProjection(): MinecraftBasicGuideProjection {
  return {
    schema: "minecraft-basic-guide/v1",
    guide_ref: "docs/blog-doc/Architecture/Minecraft-Basic-Guide.md",
    item_flows: [
      "log -> matching planks -> sticks",
      "four planks -> crafting_table item",
      "crafting_table item itself is an inventory-grid recipe; use craft_item or a crafting-table action skill, not craft_with_table",
      "wooden_pickaxe needs planks, sticks, and reachable placed crafting_table"
    ],
    station_requirements: [
      "inventory 2x2 can craft planks, sticks, and crafting_table",
      "table-sized recipes require a reachable crafting_table world block",
      "inventory station items are not usable stations until placed"
    ],
    blocker_recovery_guides: [
      "missing prerequisite should pivot to the nearest executable prerequisite action",
      "occupied placement target should pick another explicit adjacent valid cell",
      "repeated exact blocker should repair parameters or choose a different action"
    ],
    observe_stop_guides: [
      "do not repeat observe when the same scan and inventory already explain the blocker",
      "observe is useful when it can reveal new reachable evidence or after movement"
    ]
  };
}

export function buildActiveEpisodeFromCycleGoal(input: {
  episodeId: string;
  context: SocialCycleContextPacket;
  cycleGoal: ActorCycleGoal;
  selectedPlanBeadRefs?: readonly string[];
  startedAtTurnRef?: string;
}): ActiveEpisode {
  return {
    schema: "active-episode/v1",
    episode_id: input.episodeId,
    actor_id: input.context.ActorSoul.actor_id,
    actors_visible_or_relevant: visibleActorIdsFromObservation(input.context.observation),
    life_goal_ref: lifeGoalRef(),
    purpose: input.cycleGoal.rationale,
    current_focus: input.cycleGoal.summary,
    selected_plan_bead_refs: input.selectedPlanBeadRefs && input.selectedPlanBeadRefs.length > 0
      ? [...input.selectedPlanBeadRefs]
      : selectedPlanBeadAnchorsFromContext(input.context),
    related_plan_bead_refs: planBeadHintsFromContext(input.context).map((bead) => bead.bead_id),
    success_signals: input.cycleGoal.success_condition.evidence_required.map((description) => ({
      kind: "runtime_artifact",
      description
    })),
    pivot_triggers: input.cycleGoal.stop_conditions.map((condition) => ({
      trigger: condition,
      evidence_refs: []
    })),
    mistake_budget: {
      allow_exploration_turns: 2,
      observe_repeat_limit: 1,
      exact_blocker_repeat_limit: 2
    },
    social_pressure: socialPressureFromContext(input.context),
    opened_from_refs: [
      ...input.cycleGoal.derived_from.observation_refs,
      ...input.cycleGoal.derived_from.world_event_refs,
      ...input.cycleGoal.derived_from.previous_cycle_judgment_refs
    ],
    ...(input.startedAtTurnRef ? { started_at_turn_ref: input.startedAtTurnRef } : {}),
    status: "active"
  };
}

export function buildRelationshipContextProjection(
  context: SocialCycleContextPacket
): RelationshipContextProjection {
  return {
    relationship_refs: relationshipRefsFromContext(context),
    visible_actor_ids: visibleActorIdsFromObservation(context.observation),
    obligations: obligationsFromContext(context)
  };
}

function actionCardWhyNow(
  cardTitle: string,
  currentState: ActorTurnCurrentStateProjection
) {
  if (cardTitle === "Deposit Shared" || cardTitle === "Deposit Shared Items") {
    const requested = currentState.deposit_candidates.find((candidate) => candidate.socially_requested);
    return requested
      ? `socially requested ${requested.itemName} deposit is open; use itemName=${requested.itemName} count=${requested.suggestedCount}`
      : "shared-storage deposit card is visible only when runtime gates still allow it";
  }
  if (cardTitle === "Inspect Chest" || cardTitle === "Inspect Shared Chest") {
    return currentState.shared_storage.status === "unknown"
      ? "nearby chest evidence exists but shared storage has not been identified yet"
      : "container inspection is available if a fresh container delta is genuinely needed";
  }
  if (cardTitle === "Craft Planks And Sticks") {
    return "logs are available and crafting can create useful materials without a table";
  }
  if (cardTitle === "Craft Crafting Table") {
    return "planks are available and a crafting table item can unlock table-bound recipes";
  }
  if (cardTitle === "Collect Logs") {
    return "reachable log evidence or actor-owned collection skill can improve inventory";
  }
  if (cardTitle === "Build Basic Shelter") {
    return "available as a physical follow-up if shelter is relevant and materials exist";
  }
  if (cardTitle === "Remember") {
    return "use only for a concise blocker or decision that prevents blind repetition";
  }
  if (cardTitle === "Move To") {
    return "use only to reach a specific actionable target or enable fresh evidence";
  }
  return "eligible under current Action Card gates";
}

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

function recommendedParametersForCard(input: {
  cardTitle: string;
  parameterCandidates: readonly ActorTurnDecisionFrame["parameter_candidates"][number][];
}): ActorTurnDecisionFrame["recommended_next_action_candidates"][number]["parameters"] {
  const depositCandidate = input.parameterCandidates.find((candidate) =>
    candidate.action_card_title === input.cardTitle
  );
  if (depositCandidate) {
    const parameters: ActorTurnDecisionFrame["recommended_next_action_candidates"][number]["parameters"] = {};
    if (depositCandidate.itemName !== undefined) {
      parameters.itemName = depositCandidate.itemName;
    }
    if (depositCandidate.count !== undefined) {
      parameters.count = depositCandidate.count;
    }
    return parameters;
  }
  return {};
}

function cardAllowsEmptyRecommendedParameters(card: ActionCardProjection["action_cards"][number]) {
  return card.parameter_hints.some((hint) =>
    /\b(empty parameters|no structured parameters required)\b/i.test(hint)
  ) && !card.current_state_requirements.some((requirement) =>
    /\b(requested|explicit target|target cell|support surface|specific actionable target)\b/i.test(requirement)
  );
}

function recommendedCandidateForCard(input: {
  card: ActionCardProjection["action_cards"][number];
  parameterCandidates: readonly ActorTurnDecisionFrame["parameter_candidates"][number][];
  currentState: ActorTurnCurrentStateProjection;
}): ActorTurnDecisionFrame["recommended_next_action_candidates"][number] | null {
  const parameters = recommendedParametersForCard({
    cardTitle: input.card.title,
    parameterCandidates: input.parameterCandidates
  });
  if (Object.keys(parameters).length === 0 && !cardAllowsEmptyRecommendedParameters(input.card)) {
    return null;
  }
  return {
    action_card_id: input.card.action_card_id,
    title: input.card.title,
    parameters,
    why: actionCardWhyNow(input.card.title, input.currentState)
  };
}

function buildActorTurnDecisionFrame(input: {
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
  const recentCobblestoneMiningCount = recentSuccessfulCobblestoneMiningCount(input.recentEvidenceTrace);
  const cobblestoneCount = currentCobblestoneCount(input.currentState);
  const demoteRepeatedCobblestoneMining = shouldDemoteRepeatedCobblestoneMining({
    activeEpisode: input.activeEpisode,
    currentState: input.currentState,
    recentEvidenceTrace: input.recentEvidenceTrace
  });
  const visibleCardTitles = new Set(input.actionCardProjection.action_cards.map((card) => card.title));
  const decisionFrameActionCards = input.actionCardProjection.action_cards.filter((card) =>
    requestedDeposits.length > 0 ||
      (card.title !== "Deposit Shared" &&
        card.title !== "Deposit Shared Items" &&
        card.title !== "Handoff Item At Chest" &&
        !(demoteRepeatedCobblestoneMining && card.title === "Mine Cobblestone"))
  );
  const topCardPreference = [
    ...(requestedDeposits.length > 0 ? ["Deposit Shared"] : []),
    "Inspect Chest",
    "Craft Crafting Table",
    "Craft Planks And Sticks",
    "Collect Logs",
    "Mine Cobblestone",
    "Build Basic Shelter",
    "Move To",
    "Remember"
  ];
  const topCards = [
    ...topCardPreference
      .map((title) => decisionFrameActionCards.find((card) => card.title === title))
      .filter((card): card is NonNullable<typeof card> => Boolean(card)),
    ...decisionFrameActionCards.filter((card) => !topCardPreference.includes(card.title))
  ].slice(0, 6);
  const parameterCandidates = requestedDeposits
    .filter(() => visibleCardTitles.has("Deposit Shared") || visibleCardTitles.has("Deposit Shared Items"))
    .map((candidate) => ({
      action_card_title: visibleCardTitles.has("Deposit Shared") ? "Deposit Shared" : "Deposit Shared Items",
      itemName: candidate.itemName,
      count: candidate.suggestedCount,
      reason: "structured parameters for the open shared-storage request",
      evidence_refs: [...candidate.evidence_refs]
    }))
    .slice(0, 4);

  const currentTruths = unique([
    `episode_focus=${input.activeEpisode.current_focus}`,
    `shared_storage=${input.currentState.shared_storage.status}`,
    hasCompletedSharedContribution
      ? `shared_storage_contribution_evidence=${input.currentState.shared_storage.evidence_refs.join(",")}`
      : "",
    cobblestoneCount > 0 ? `cobblestone=${cobblestoneCount}` : "",
    demoteRepeatedCobblestoneMining
      ? `cobblestone_stockpile=sufficient_for_starter_material_buffer; do_not_mine_more_for_generic_future_building`
      : "",
    recentCobblestoneMiningCount > 0
      ? `recent_successful_cobblestone_mining_turns=${recentCobblestoneMiningCount}`
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
      ? ["do not deposit again for the same completed shared-storage request"]
      : []),
    ...(hasCompletedSharedContribution && !visibleCardTitles.has("Deposit Shared")
      ? ["deposit-oriented Action Cards are intentionally hidden until a new unsatisfied request appears"]
      : []),
    ...(hadRecentChestInspection && !visibleCardTitles.has("Inspect Chest")
      ? ["do not inspect the same shared chest again unless another actor or inventory change creates a fresh container question"]
      : []),
    ...(demoteRepeatedCobblestoneMining
      ? [
          `do not keep selecting Mine Cobblestone with cobblestone:${cobblestoneCount}; choose build, craft, place, social, movement-enabled, or authored progress unless a new explicit cobblestone shortage appears`
        ]
      : []),
    ...input.recentEvidenceTrace
      .slice(-3)
      .filter((entry) => entry.outcome === "no_progress" || entry.outcome === "rejected_by_contract")
      .map((entry) => `do not repeat recent ${entry.outcome}: ${entry.compact_summary}`)
  ]).slice(0, 8);

  return {
    schema: "actor-turn-decision-frame/v1",
    priority_order: [
      "use decision_frame current_truths before older episode wording",
      "satisfy open_social_requests with visible Action Cards and schema-valid parameters",
      "consume completed_work and do_not_repeat before choosing another storage or station action",
      "choose one top_eligible_action_card or author_mineflayer_action if no card can express the needed behavior",
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
    parameter_candidates: parameterCandidates,
    top_eligible_action_cards: topCards.map((card) => ({
      action_card_id: card.action_card_id,
      title: card.title,
      why_now: actionCardWhyNow(card.title, input.currentState)
    })),
    recommended_next_action_candidates: topCards
      .filter((card) => card.title !== "Remember")
      .map((card) =>
        recommendedCandidateForCard({
          card,
          parameterCandidates,
          currentState: input.currentState
        })
      )
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .slice(0, 4),
    next_action_guidance: unique([
      ...(hasCompletedSharedContribution && requestedDeposits.length === 0
        ? [
            "the shared-storage request is already satisfied; choose a different useful physical, social, crafting, collection, shelter, or authored action"
          ]
        : []),
      ...(requestedDeposits.length > 0 && visibleCardTitles.has("Deposit Shared")
        ? ["a deposit card is visible and an open requested item has exact parameters; prefer completing it now"]
        : []),
      ...(requestedDeposits.length > 0 && !visibleCardTitles.has("Deposit Shared")
        ? ["a request is open but deposit is not currently eligible; choose the nearest visible prerequisite such as chest inspection or movement"]
        : []),
      ...(demoteRepeatedCobblestoneMining
        ? ["current inventory already has a cobblestone buffer; prefer a distinct next step such as shelter placement repair, reachable crafting-table use/repositioning, social follow-up, or a specific authored Mineflayer helper"]
        : []),
      "avoid using remember as the main action when a visible Action Card can create runtime evidence"
    ])
  };
}

export function buildActorTurnInput(input: {
  turnId: string;
  context: SocialCycleContextPacket;
  activeEpisode: ActiveEpisode;
  currentObservationRefs: readonly string[];
  recentEvidenceTrace?: readonly EvidenceTraceEntry[];
  providerBudgetHint?: ProviderBudgetHint;
}): { actorTurnInput: ActorTurnInput; actionCardProjection: ActionCardProjection } {
  const currentState = buildActorTurnCurrentStateProjection(input.context);
  const recentEvidenceTrace = [...(input.recentEvidenceTrace ?? [])];
  const actionCardProjection = annotateActionCardsWithCurrentStateHints(
    suppressUnavailableActionCards(
      suppressObserveCards(
        buildActionCardProjection(input.context.action_surface),
        currentState,
        recentEvidenceTrace
      ),
      currentState,
      input.context
    ),
    currentState
  );
  const activeEpisode = anchorActiveEpisodeToPlanBeadContext({
    activeEpisode: input.activeEpisode,
    context: input.context
  });
  const actorTurnInput: ActorTurnInput = {
    schema: "actor-turn-input/v1",
    turn_id: input.turnId,
    decision_frame: buildActorTurnDecisionFrame({
      activeEpisode,
      currentState,
      actionCardProjection,
      recentEvidenceTrace
    }),
    active_episode: activeEpisode,
    actor_context: {
      actor_id: input.context.ActorSoul.actor_id,
      actor_soul_ref: soulRef(input.context.ActorSoul.actor_id),
      life_goal_ref: lifeGoalRef(),
      life_goal_summary: input.context.ActorLifeGoal.objective
    },
    current_observation_refs: [...input.currentObservationRefs],
    current_state: currentState,
    recent_evidence_trace: recentEvidenceTrace,
    compact_plan_bead_hints: planBeadHintsFromContext(input.context),
    memory_refs: memoryRefsFromContext(input.context),
    relationship_context: buildRelationshipContextProjection(input.context),
    runtime_retry_constraints: retryConstraintSummaries(input.context),
    action_cards: actionCardProjection.action_cards,
    minecraft_basic_guide: buildMinecraftBasicGuideProjection(),
    provider_budget_hint: input.providerBudgetHint ?? {
      provider_id: "unknown",
      model: "unknown",
      status: "unknown"
    }
  };
  return { actorTurnInput, actionCardProjection };
}
