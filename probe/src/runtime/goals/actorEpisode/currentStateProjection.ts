import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import type { ActorTurnCurrentStateProjection } from "./types.js";
import {
  asRecord,
  positionFromRecord,
  readBoolean,
  readNumber,
  readString
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

type NearbyBlockObservation = ActorTurnCurrentStateProjection["nearby_block_observations"][number];

function nearbyBlocksFromObservation(observation: unknown): NearbyBlockObservation[] {
  const nearbyBlocks = asRecord(observation)?.nearbyBlocks;
  if (!Array.isArray(nearbyBlocks)) {
    return [];
  }
  const observations: NearbyBlockObservation[] = [];
  for (const block of nearbyBlocks) {
    const record = asRecord(block);
    const name = readString(record?.name);
    if (!name) {
      continue;
    }
    observations.push({
      name,
      ...(positionFromRecord(record?.position) ? { position: positionFromRecord(record?.position) } : {}),
      ...(readNumber(record?.distance) !== undefined ? { distance: readNumber(record?.distance) } : {}),
      source: "observation_nearby_block",
      evidence_refs: []
    });
  }
  return observations.slice(0, 16);
}

function nearbyBlockKey(block: NearbyBlockObservation) {
  return block.position
    ? `${block.name}:${block.position.x}:${block.position.y}:${block.position.z}`
    : `${block.name}:distance:${block.distance ?? "unknown"}:${block.source}`;
}

function uniqueNearbyBlockObservations(blocks: NearbyBlockObservation[]) {
  const seen = new Set<string>();
  const result: NearbyBlockObservation[] = [];
  for (const block of blocks) {
    const key = nearbyBlockKey(block);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(block);
  }
  return result.slice(0, 20);
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

function scanExampleFromRecord(value: unknown) {
  const record = asRecord(value);
  const name = readString(record?.name);
  const position = positionFromRecord(record?.position);
  const distance = readNumber(record?.distance);
  return name && position && distance !== undefined
    ? { name, position, distance }
    : null;
}

function worldScanFromObservation(observation: unknown): ActorTurnCurrentStateProjection["world_scan"] | undefined {
  const summary = asRecord(asRecord(observation)?.worldStateSummary);
  if (!summary) {
    return undefined;
  }
  const blockObservations = asRecord(summary.block_observations);
  const loadedCoverage = asRecord(summary.loaded_coverage);
  const byName = Array.isArray(blockObservations?.by_name) ? blockObservations.by_name : [];
  const nearest = Array.isArray(blockObservations?.nearest) ? blockObservations.nearest : [];
  const retainedBlockCounts = byName
    .map((entry) => {
      const record = asRecord(entry);
      const name = readString(record?.name);
      const count = readNumber(record?.count);
      return name && count !== undefined ? { name, count } : null;
    })
    .filter((entry): entry is { name: string; count: number } => entry !== null)
    .slice(0, 16);
  const namedBlockExamples = byName
    .map((entry) => {
      const record = asRecord(entry);
      const name = readString(record?.name);
      const count = readNumber(record?.count);
      const examples = Array.isArray(record?.nearest)
        ? record.nearest
            .map((example) => {
              const exampleRecord = asRecord(example);
              const parsed = exampleRecord ? scanExampleFromRecord({ ...exampleRecord, name }) : null;
              return parsed ? { position: parsed.position, distance: parsed.distance } : null;
            })
            .filter((example): example is { position: { x: number; y: number; z: number }; distance: number } =>
              example !== null
            )
            .slice(0, 4)
        : [];
      return name && count !== undefined
        ? { name, count, nearest: examples }
        : null;
    })
    .filter((entry): entry is { name: string; count: number; nearest: Array<{ position: { x: number; y: number; z: number }; distance: number }> } =>
      entry !== null
    )
    .slice(0, 12);
  return {
    scan_id: readString(summary.scan_id) ?? "unknown-scan",
    ...(readString(summary.scan_ref) ? { scan_ref: readString(summary.scan_ref) } : {}),
    ...(positionFromRecord(summary.center) ? { center: positionFromRecord(summary.center) } : {}),
    ...(readNumber(summary.radius) !== undefined ? { radius: readNumber(summary.radius) } : {}),
    ...(asRecord(summary.vertical_range) &&
      readNumber(asRecord(summary.vertical_range)?.min_y) !== undefined &&
      readNumber(asRecord(summary.vertical_range)?.max_y) !== undefined &&
      readNumber(asRecord(summary.vertical_range)?.center_y) !== undefined
      ? {
          vertical_range: {
            min_y: readNumber(asRecord(summary.vertical_range)?.min_y) as number,
            max_y: readNumber(asRecord(summary.vertical_range)?.max_y) as number,
            center_y: readNumber(asRecord(summary.vertical_range)?.center_y) as number
          }
        }
      : {}),
    coverage_scope: readString(loadedCoverage?.scope) ?? "unknown_scope",
    absence_claims_exhaustive: readBoolean(loadedCoverage?.absence_claims_exhaustive) ?? false,
    total_verified_blocks: readNumber(blockObservations?.total_verified) ?? 0,
    truncated: readBoolean(blockObservations?.truncated) ?? false,
    retained_block_counts: retainedBlockCounts,
    nearest_blocks: nearest
      .map(scanExampleFromRecord)
      .filter((entry): entry is { name: string; position: { x: number; y: number; z: number }; distance: number } =>
        entry !== null
      )
      .slice(0, 16),
    named_block_examples: namedBlockExamples,
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

function distanceBetween(
  left: NonNullable<ActorTurnCurrentStateProjection["position"]>,
  right: NonNullable<ActorTurnCurrentStateProjection["position"]>
) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  const dz = left.z - right.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function knownPositionsProjection(
  context: SocialCycleContextPacket,
  actorPosition?: NonNullable<ActorTurnCurrentStateProjection["position"]>
): ActorTurnCurrentStateProjection["settlement_progress"]["known_positions"] {
  const positions = context.settlement_state.known_positions;
  const craftingTablePosition = positions.crafting_table?.position
    ? positionFromRecord(positions.crafting_table.position)
    : undefined;
  const tableDistance = actorPosition && craftingTablePosition
    ? distanceBetween(actorPosition, craftingTablePosition)
    : undefined;
  return {
    ...(positions.actor_position && positionFromRecord(positions.actor_position)
      ? {
          actor: {
            position: positionFromRecord(positions.actor_position) as { x: number; y: number; z: number },
            evidence_refs: []
          }
        }
      : {}),
    ...(positions.crafting_table
      ? {
          crafting_table: {
            status: positions.crafting_table.status,
            ...(craftingTablePosition ? { position: craftingTablePosition } : {}),
            ...(tableDistance !== undefined ? { distance_from_actor: Math.round(tableDistance * 10) / 10 } : {}),
            ...(tableDistance !== undefined ? { usable_now: tableDistance <= 4.5 } : {}),
            evidence_refs: [...positions.crafting_table.evidence_refs]
          }
        }
      : {}),
    ...(positions.shared_chest
      ? {
          shared_chest: {
            status: positions.shared_chest.status,
            evidence_refs: [...positions.shared_chest.evidence_refs]
          }
        }
      : {}),
    ...(positions.shelter
      ? {
          shelter: {
            status: positions.shelter.status,
            ...(positions.shelter.anchor ? { anchor: { ...positions.shelter.anchor } } : {}),
            evidence_refs: [...positions.shelter.evidence_refs]
          }
        }
      : {})
  };
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

function blockObservationsFromWorldScan(
  worldScan: ActorTurnCurrentStateProjection["world_scan"] | undefined
): NearbyBlockObservation[] {
  if (!worldScan) {
    return [];
  }
  const scanRef = worldScan.scan_ref ?? `world-scan/${worldScan.scan_id}`;
  return worldScan.nearest_blocks.slice(0, 16).map((block) => ({
    name: block.name,
    position: { ...block.position },
    distance: block.distance,
    source: "world_scan_nearest",
    evidence_refs: [scanRef]
  }));
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
  const worldScan = worldScanFromObservation(observation);
  const nearbyBlockObservations = uniqueNearbyBlockObservations([
    ...blockObservationsFromWorldScan(worldScan),
    ...nearbyBlocksFromObservation(observation)
  ]);
  return {
    schema: "actor-turn-current-state/v1",
    observer_id: observerId,
    ...(actorPosition ? { position: actorPosition } : {}),
    inventory_counts: inventoryCounts,
    ...(vitalsFromObservation(observation) ? { vitals: vitalsFromObservation(observation) } : {}),
    ...(sessionLifecycle ? { session_lifecycle: sessionLifecycle } : {}),
    visible_actors: visibleActorsFromObservation(observation),
    nearby_block_observations: nearbyBlockObservations,
    shared_storage: sharedStorageProjection(context),
    ...(worldScan ? { world_scan: worldScan } : {}),
    ...(structureProgress ? { structure_progress: structureProgress } : {}),
    settlement_progress: {
      inventory_counts: { ...context.settlement_state.inventory_counts },
      shared_storage_status: context.settlement_state.shared_storage.status,
      known_positions: knownPositionsProjection(context, actorPosition),
      checklist: checklistProjection(context),
      recent_blockers: blockerProjection(context)
    }
  };
}
