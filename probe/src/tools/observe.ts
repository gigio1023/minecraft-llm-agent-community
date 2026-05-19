import type { Vec3 } from "vec3";

import { createDialogueState } from "../runtime/dialogueState.js";
import { createMemory } from "../runtime/memory.js";

type DialogueState = ReturnType<typeof createDialogueState>;
type MemoryStore = ReturnType<typeof createMemory>;
type PositionedActor = {
  username: string;
  entity: {
    position: {
      x: number;
      y: number;
      z: number;
      distanceTo(other: unknown): number;
    };
  };
  inventory?: {
    items(): Array<{ name: string; count: number }>;
  };
  findBlocks?: (input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
    count: number;
  }) => Vec3[];
  blockAt?: (position: Vec3, extraInfos?: boolean) => { name: string } | null;
};

export type ObserveResult = {
  status: "ok";
  visibleActors: Array<{
    id: string;
    distance: number;
    busy: boolean;
  }>;
  memory: string[];
  inventory?: Array<{ name: string; count: number }>;
  nearbyBlocks?: Array<{ name: string; distance: number }>;
  sharedChest?: {
    chestId: string;
    items: Array<{ name: string; count: number }>;
  };
};

type ObserveArgs = {
  actor: PositionedActor;
  target: PositionedActor;
  dialogueState: DialogueState;
  memory: MemoryStore;
};

function roundDistance(distance: number) {
  return Number(distance.toFixed(2));
}

function inspectInventory(actor: PositionedActor) {
  if (!actor.inventory) {
    return undefined;
  }

  return actor.inventory.items().map((item) => ({
    name: item.name,
    count: item.count
  }));
}

function scanNearbyBlocks(actor: PositionedActor) {
  if (!actor.findBlocks || !actor.blockAt) {
    return undefined;
  }

  return actor
    .findBlocks({
      matching: (block) => block.name !== "air" && block.name !== "void_air",
      maxDistance: 16,
      count: 24
    })
    .map((position) => ({
      name: actor.blockAt?.(position)?.name ?? "unknown",
      distance: roundDistance(actor.entity.position.distanceTo(position))
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 12);
}

export async function observe({
  actor,
  target,
  dialogueState,
  memory
}: ObserveArgs): Promise<ObserveResult> {
  const inventory = inspectInventory(actor);
  const nearbyBlocks = scanNearbyBlocks(actor);

  return {
    status: "ok",
    visibleActors: [
      {
        id: target.username,
        distance: roundDistance(actor.entity.position.distanceTo(target.entity.position)),
        busy: dialogueState.peek(target.username) === "busy"
      }
    ],
    memory: memory.list(),
    ...(inventory ? { inventory } : {}),
    ...(nearbyBlocks ? { nearbyBlocks } : {})
  };
}
