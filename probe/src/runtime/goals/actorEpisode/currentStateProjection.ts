import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import type { ActorTurnCurrentStateProjection } from "./types.js";
import { obligationsFromContext } from "./episodeContextProjection.js";
import {
  asRecord,
  positionFromRecord,
  readBoolean,
  readNumber,
  readString,
  unique
} from "./projectionUtils.js";

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

function sessionLifecycleFromObservation(
  observation: unknown
): ActorTurnCurrentStateProjection["session_lifecycle"] | undefined {
  const lifecycle = asRecord(asRecord(observation)?.session_lifecycle);
  if (!lifecycle || lifecycle.schema !== "runtime-session-lifecycle/v1") {
    return undefined;
  }
  const status = readString(lifecycle.status);
  if (
    status !== "active" &&
    status !== "dead_or_respawning" &&
    status !== "respawned_after_death" &&
    status !== "disconnected_or_error"
  ) {
    return undefined;
  }
  const lastEvent = asRecord(lifecycle.last_event);
  return {
    schema: "runtime-session-lifecycle/v1",
    status,
    death_count: readNumber(lifecycle.death_count) ?? 0,
    spawn_count: readNumber(lifecycle.spawn_count) ?? 0,
    ...(lastEvent && readString(lastEvent.kind) && readString(lastEvent.observed_at)
      ? {
          last_event: {
            kind: readString(lastEvent.kind) as "death" | "spawn" | "end" | "kicked" | "error",
            observed_at: readString(lastEvent.observed_at) as string,
            ...(positionFromRecord(lastEvent.position) ? { position: positionFromRecord(lastEvent.position) } : {}),
            ...(readNumber(lastEvent.health) !== undefined ? { health: readNumber(lastEvent.health) } : {}),
            ...(readNumber(lastEvent.food) !== undefined ? { food: readNumber(lastEvent.food) } : {}),
            ...(readString(lastEvent.reason) ? { reason: readString(lastEvent.reason) } : {})
          }
        }
      : {}),
    inventory_may_have_reset: readBoolean(lifecycle.inventory_may_have_reset) ?? false,
    branch_recommended: readBoolean(lifecycle.branch_recommended) ?? false,
    ...(readString(lifecycle.branch_reason)
      ? {
          branch_reason: readString(lifecycle.branch_reason) as
            | "danger_or_survival_pressure"
            | "environment_blocked"
        }
      : {}),
    notes: Array.isArray(lifecycle.notes)
      ? lifecycle.notes.filter((entry): entry is string => typeof entry === "string").slice(0, 4)
      : []
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
  const structureProgress = context.settlement_state.structure_progress;
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
    positions.shelter ? `shelter=${positions.shelter.status}` : undefined,
    structureProgress.status !== "none"
      ? `structure_progress=${structureProgress.status} placed_blocks=${structureProgress.total_placed_blocks}`
      : undefined
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

function structureProgressProjection(
  context: SocialCycleContextPacket
): ActorTurnCurrentStateProjection["structure_progress"] | undefined {
  const progress = context.settlement_state.structure_progress;
  if (progress.status === "none") {
    return undefined;
  }
  return {
    status: progress.status,
    total_placed_blocks: progress.total_placed_blocks,
    ...(progress.latest_pattern_id ? { latest_pattern_id: progress.latest_pattern_id } : {}),
    ...(progress.latest_anchor ? { latest_anchor: { ...progress.latest_anchor } } : {}),
    ...(progress.latest_material ? { latest_material: progress.latest_material } : {}),
    ...(progress.latest_verifier ? { latest_verifier: { ...progress.latest_verifier } } : {}),
    evidence_refs: [...progress.evidence_refs],
    summaries: [...progress.summaries],
    interpretation_notes: [...progress.interpretation_notes]
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
  const structureProgress = structureProgressProjection(context);
  const sessionLifecycle = sessionLifecycleFromObservation(observation);
  return {
    schema: "actor-turn-current-state/v1",
    observer_id: observerId,
    ...(actorPosition ? { position: actorPosition } : {}),
    inventory_counts: inventoryCounts,
    ...(vitalsFromObservation(observation) ? { vitals: vitalsFromObservation(observation) } : {}),
    ...(sessionLifecycle ? { session_lifecycle: sessionLifecycle } : {}),
    visible_actors: visibleActorsFromObservation(observation),
    obligation_summaries: obligationsFromContext(context),
    nearby_block_hints: nearbyBlockHintsFromObservation(observation),
    shared_storage: sharedStorageProjection(context),
    deposit_candidates: depositCandidatesFromContext(context, inventoryCounts),
    ...(worldScanFromObservation(observation) ? { world_scan: worldScanFromObservation(observation) } : {}),
    ...(structureProgress ? { structure_progress: structureProgress } : {}),
    settlement_progress: {
      inventory_counts: { ...context.settlement_state.inventory_counts },
      shared_storage_status: context.settlement_state.shared_storage.status,
      known_position_summaries: knownPositionSummaries(context, actorPosition),
      checklist: checklistProjection(context),
      recent_blockers: blockerProjection(context)
    }
  };
}
