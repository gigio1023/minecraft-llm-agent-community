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
    beginTurn?(actorId: MutualActorId): void;
    consumeHeardMessages(target: MutualActorId): Array<{
      from: string;
      text: string;
    }>;
    markerItemName(): string;
    recordObservation?(actorId: MutualActorId, observation: Record<string, unknown>): void;
    socialContext?(actorId: MutualActorId): Record<string, unknown> | undefined;
  };
  memory: {
    list(): string[];
  };
};

function roundDistance(distance: number) {
  return Number(distance.toFixed(2));
}

function toJsonValue(value: unknown): import("../types.js").MutualJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  return String(value);
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
  // Item entity shape varies by protocol/version, so marker detection checks
  // name, displayName, and metadata itemId before declaring it invisible.
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
  // Observe starts the actor's turn and consumes heard messages. This makes chat
  // delivery turn-phased instead of globally visible at arbitrary times.
  runtimeState.beginTurn?.(actor.username as MutualActorId);
  const itemId = actor.registry?.itemsByName?.[runtimeState.markerItemName()]?.id;

  const observation = {
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

  runtimeState.recordObservation?.(actor.username as MutualActorId, observation);

  // Social context is appended after the raw world observation so transcript
  // review can separate Minecraft facts from derived memory/role pressure.
  return {
    ...observation,
    ...((runtimeState.socialContext?.(actor.username as MutualActorId)
      ? toJsonValue(runtimeState.socialContext?.(actor.username as MutualActorId))
      : {}) as Record<string, import("../types.js").MutualJsonValue>)
  };
}
