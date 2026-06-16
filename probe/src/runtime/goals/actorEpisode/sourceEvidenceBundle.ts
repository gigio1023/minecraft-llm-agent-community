/**
 * Builds the source evidence bundle that travels with Actor Turn summaries.
 *
 * @remarks Good compression keeps bounded raw detail and artifact refs beside
 * summaries. This module preserves observation, world-event, memory, PlanBead,
 * and recent-action sources without turning them into executable authority.
 */
import { listActorMemoryRefs } from "../../../memory/actorMemory.js";
import type { SocialCycleContextPacket } from "../cycleContextAssembler.js";
import type {
  ActorTurnCurrentStateProjection,
  ActorTurnSourceEvidenceBundle,
  EvidenceTraceEntry,
  PlanBeadHint
} from "./types.js";
import { asRecord, positionFromRecord, readBoolean, readNumber, readString } from "./projectionUtils.js";

function inventoryItemsFromObservation(observation: unknown) {
  const inventory = asRecord(observation)?.inventory;
  if (!Array.isArray(inventory)) {
    return [];
  }
  return inventory
    .map((item) => {
      const record = asRecord(item);
      const name = readString(record?.name);
      const count = readNumber(record?.count);
      return name && count !== undefined ? { name, count } : null;
    })
    .filter((item): item is { name: string; count: number } => item !== null)
    .slice(0, 48);
}

function visibleActorsFromObservation(observation: unknown) {
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
    .filter((actor): actor is { id: string; distance?: number; busy?: boolean } => actor !== null)
    .slice(0, 16);
}

function evidenceRefsForTrace(entry: EvidenceTraceEntry) {
  return [
    entry.action_ref,
    entry.runtime_gate_ref,
    entry.execution_ref,
    entry.verifier_ref,
    entry.post_observation_ref,
    entry.provider_usage_ref
  ].filter((ref): ref is string => typeof ref === "string" && ref.length > 0);
}

function relationshipCardSummary(value: unknown) {
  if (typeof value === "string") {
    return value.slice(0, 280);
  }
  try {
    return JSON.stringify(value).slice(0, 280);
  } catch {
    return "unserializable relationship context";
  }
}

function relationshipCardsFromContext(context: SocialCycleContextPacket) {
  return [
    ...context.relationship_context.relationships.map((entry, index) => ({
      source: "outgoing" as const,
      ref: `relationships/outgoing-${index}`,
      summary: relationshipCardSummary(entry)
    })),
    ...context.relationship_context.incoming_relationships.map((entry, index) => ({
      source: "incoming" as const,
      ref: `relationships/incoming-${index}`,
      summary: relationshipCardSummary(entry)
    })),
    ...context.relationship_context.relationship_context_signals.map((entry, index) => ({
      source: "signal" as const,
      ref: `relationship-signals/outgoing-${index}`,
      summary: relationshipCardSummary(entry)
    })),
    ...context.relationship_context.incoming_relationship_context_signals.map((entry, index) => ({
      source: "incoming_signal" as const,
      ref: `relationship-signals/incoming-${index}`,
      summary: relationshipCardSummary(entry)
    }))
  ].slice(0, 12);
}

export function relationshipProjectionCards(context: SocialCycleContextPacket) {
  return relationshipCardsFromContext(context);
}

export function buildActorTurnSourceEvidenceBundle(input: {
  context: SocialCycleContextPacket;
  currentState: ActorTurnCurrentStateProjection;
  currentObservationRefs: readonly string[];
  recentEvidenceTrace: readonly EvidenceTraceEntry[];
  planBeadHints: readonly PlanBeadHint[];
}): ActorTurnSourceEvidenceBundle {
  const observation = input.context.observation;
  const memoryRefs = listActorMemoryRefs(input.context.memory_packet);
  const worldScan = input.currentState.world_scan;
  return {
    schema: "actor-turn-source-evidence-bundle/v1",
    observation: {
      observation_refs: [...input.currentObservationRefs],
      ...(positionFromRecord(asRecord(observation)?.position)
        ? { position: positionFromRecord(asRecord(observation)?.position) }
        : {}),
      inventory_items: inventoryItemsFromObservation(observation),
      visible_actors: visibleActorsFromObservation(observation),
      nearby_blocks: input.currentState.nearby_block_observations.map((block) => ({
        ...block,
        evidence_refs: block.evidence_refs.length > 0
          ? [...block.evidence_refs]
          : [...input.currentObservationRefs]
      })),
      ...(worldScan
        ? {
            world_scan: {
              scan_id: worldScan.scan_id,
              ...(worldScan.scan_ref ? { scan_ref: worldScan.scan_ref } : {}),
              ...(worldScan.center ? { center: { ...worldScan.center } } : {}),
              ...(worldScan.radius !== undefined ? { radius: worldScan.radius } : {}),
              ...(worldScan.vertical_range ? { vertical_range: { ...worldScan.vertical_range } } : {}),
              coverage_scope: worldScan.coverage_scope,
              absence_claims_exhaustive: worldScan.absence_claims_exhaustive,
              total_verified_blocks: worldScan.total_verified_blocks,
              truncated: worldScan.truncated,
              nearest_blocks: worldScan.nearest_blocks.map((block) => ({
                name: block.name,
                position: { ...block.position },
                distance: block.distance
              })),
              named_block_examples: worldScan.named_block_examples.map((entry) => ({
                name: entry.name,
                count: entry.count,
                nearest: entry.nearest.map((example) => ({
                  position: { ...example.position },
                  distance: example.distance
                }))
              })),
              limitations: [...worldScan.limitations]
            }
          }
        : {})
    },
    world_event_cards: input.context.world_events.slice(-8).map((event) => ({
      event_id: event.event_id,
      kind: event.kind,
      authority: event.authority,
      summary: event.summary,
      actor_refs: [...event.actor_refs],
      evidence_refs: [...event.evidence_refs],
      created_at: event.created_at
    })),
    memory_cards: memoryRefs.slice(0, 12).map((memory) => ({
      memory_id: memory.memory_id,
      kind: memory.kind,
      layer: memory.layer,
      confidence: memory.confidence,
      summary: memory.summary,
      evidence_refs: [...memory.evidence_refs],
      reason: memory.reason
    })),
    recent_action_details: input.recentEvidenceTrace.slice(-6).map((entry) => ({
      turn_id: entry.turn_id,
      episode_id: entry.episode_id,
      outcome: entry.outcome,
      compact_summary: entry.compact_summary,
      ...(entry.selected_action ? { selected_action: { ...entry.selected_action } } : {}),
      ...(entry.parameters ? { parameters: { ...entry.parameters } } : {}),
      ...(entry.tool_statuses ? { tool_statuses: entry.tool_statuses.map((status) => ({ ...status })) } : {}),
      ...(entry.blocker_reason ? { blocker_reason: entry.blocker_reason } : {}),
      evidence_refs: evidenceRefsForTrace(entry)
    })),
    plan_bead_cards: input.planBeadHints.map((hint) => ({
      ...hint,
      next_hints: [...hint.next_hints],
      blockers: [...hint.blockers],
      acceptance_evidence_required: [...hint.acceptance_evidence_required],
      evidence_refs: [...hint.evidence_refs],
      dependency_refs: [...hint.dependency_refs]
    }))
  };
}
