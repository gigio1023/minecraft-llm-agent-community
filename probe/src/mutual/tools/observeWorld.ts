import type { MutualActorId } from "../types.js";

type ObserveWorldArgs = {
  actor: {
    username: string;
    entity: {
      position: {
        distanceTo(other: { x: number; y: number; z: number }): number;
      };
    };
    entities: Record<string, { name?: string; displayName?: string; metadata?: unknown[] }>;
    registry?: {
      itemsByName?: Record<string, { id: number }>;
    };
  };
  target: {
    username: string;
    entity: {
      position: { x: number; y: number; z: number };
    };
  };
  runtimeState: {
    consumeHeardMessages(target: MutualActorId): Array<{
      from: MutualActorId;
      text: string;
    }>;
    markerItemName(): string;
  };
  memory: {
    list(): string[];
  };
};

function roundDistance(distance: number) {
  return Number(distance.toFixed(2));
}

function findNearbyMarkerEntity({
  entities,
  itemName,
  itemId
}: {
  entities: Record<string, { name?: string; displayName?: string; metadata?: unknown[] }>;
  itemName: string;
  itemId?: number;
}) {
  return Object.values(entities).find(
    (entity) =>
      entity.name === itemName ||
      entity.displayName?.toLowerCase() === itemName ||
      (itemId !== undefined &&
        entity.metadata?.some(
          (entry) =>
            typeof entry === "object" &&
            entry !== null &&
            "itemId" in entry &&
            entry.itemId === itemId
        )) ||
      (entity.name === "item" &&
        entity.displayName?.toLowerCase().includes(itemName))
  );
}

export function observeWorld({
  actor,
  target,
  runtimeState,
  memory
}: ObserveWorldArgs) {
  const itemId = actor.registry?.itemsByName?.[runtimeState.markerItemName()]?.id;

  return {
    status: "ok" as const,
    visibleActors: [
      {
        id: target.username,
        distance: roundDistance(actor.entity.position.distanceTo(target.entity.position))
      }
    ],
    heardMessages: runtimeState.consumeHeardMessages(actor.username as MutualActorId),
    markerEntitySeen: Boolean(
      findNearbyMarkerEntity({
        entities: actor.entities,
        itemName: runtimeState.markerItemName(),
        itemId
      })
    ),
    memory: memory.list()
  };
}
