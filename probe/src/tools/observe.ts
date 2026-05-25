import { randomUUID } from "node:crypto";

import { createDialogueState } from "../runtime/dialogueState.js";
import { createMemory } from "../runtime/memory.js";
import type { ItemStack } from "../gameplay/storage/sharedStorageLedger.js";
import {
  scanWorldState,
  summarizeWorldStateScan,
  type WorldStatePosition,
  type WorldStateSummary
} from "./worldStateScan.js";

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
  }) => WorldStatePosition[];
  blockAt?: (position: WorldStatePosition, extraInfos?: boolean) => { name: string } | null;
};

export type ObserveResult = {
  status: "ok";
  observerId: string;
  position?: { x: number; y: number; z: number };
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
  worldStateSummary?: WorldStateSummary;
};

type ObserveArgs = {
  actor: PositionedActor;
  target: PositionedActor;
  dialogueState: DialogueState;
  memory: MemoryStore;
  sharedChest?: {
    chestId: string;
    inspect(): Promise<ItemStack[] | null> | ItemStack[] | null;
  };
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

function roundPosition(position: { x: number; y: number; z: number }) {
  return {
    x: Number(position.x.toFixed(2)),
    y: Number(position.y.toFixed(2)),
    z: Number(position.z.toFixed(2))
  };
}

function scanNearbyBlocks(actor: PositionedActor) {
  if (!actor.findBlocks || !actor.blockAt) {
    return undefined;
  }

  // This legacy hint is nearest-first only. Strategic or station-like priority
  // belongs in runtime-owned action skills or verifiers, not provider context.
  return actor
    .findBlocks({
      matching: (block) => block.name !== "air" && block.name !== "void_air",
      maxDistance: 16,
      count: 48
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
  memory,
  sharedChest
}: ObserveArgs): Promise<ObserveResult> {
  const inventory = inspectInventory(actor);
  const nearbyBlocks = scanNearbyBlocks(actor);
  const worldStateSummary = summarizeWorldStateScan(
    scanWorldState({
      bot: actor,
      actorId: actor.username,
      scanId: `observe-${actor.username}-${randomUUID()}`,
      radius: 32,
      caps: { blockObservations: 64, nearestExamples: 12 }
    })
  );
  const sharedChestItems = sharedChest
    ? await Promise.resolve(sharedChest.inspect()).catch(() => null)
    : null;

  // Observe is the transcript-facing state boundary. Optional capabilities stay
  // optional so the same primitive can run against Mineflayer bots and narrow
  // test doubles without fabricating evidence. Chest inspection is especially
  // non-fatal because stale world fixtures should not turn observation into a
  // storage action.
  return {
    status: "ok",
    observerId: actor.username,
    position: roundPosition(actor.entity.position),
    visibleActors:
      target.username === actor.username
        ? []
        : [
            {
              id: target.username,
              distance: roundDistance(actor.entity.position.distanceTo(target.entity.position)),
              busy: dialogueState.peek(target.username) === "busy"
            }
          ],
    memory: memory.list(),
    ...(inventory ? { inventory } : {}),
    ...(nearbyBlocks ? { nearbyBlocks } : {}),
    worldStateSummary,
    ...(sharedChest && sharedChestItems
      ? {
          sharedChest: {
            chestId: sharedChest.chestId,
            items: sharedChestItems
          }
        }
      : {})
  };
}
