import type { Vec3 } from "vec3";

import { createDialogueState } from "../runtime/dialogueState.js";
import { createMemory } from "../runtime/memory.js";
import type { ItemStack } from "../gameplay/storage/sharedStorageLedger.js";
import { isLogName } from "./collectLogs.js";

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
  nearbyResources?: {
    logs: Array<{
      name: string;
      distance: number;
      direction: string;
      position: { x: number; y: number; z: number };
    }>;
  };
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

function directionFrom(origin: { x: number; z: number }, target: { x: number; z: number }) {
  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  if (Math.abs(dx) >= Math.abs(dz)) {
    return dx >= 0 ? "east" : "west";
  }
  return dz >= 0 ? "south" : "north";
}

function scanNearbyBlocks(actor: PositionedActor) {
  if (!actor.findBlocks || !actor.blockAt) {
    return undefined;
  }

  // Nearby blocks are coarse evidence for verification and debugging, not a
  // full world model. Keep the scan small so observe remains cheap in each loop.
  const blockSnapshots = actor
    .findBlocks({
      matching: (block) => block.name !== "air" && block.name !== "void_air",
      maxDistance: 16,
      count: 48
    })
    .map((position) => ({
      name: actor.blockAt?.(position)?.name ?? "unknown",
      distance: roundDistance(actor.entity.position.distanceTo(position))
    }))
    .sort((left, right) => left.distance - right.distance);
  const importantBlocks = new Set(["crafting_table", "chest"]);
  const selected = new Map<string, { name: string; distance: number }>();

  for (const block of blockSnapshots.filter((entry) => importantBlocks.has(entry.name))) {
    selected.set(`${block.name}:${block.distance}`, block);
  }

  for (const block of blockSnapshots) {
    if (selected.size >= 12) {
      break;
    }
    selected.set(`${block.name}:${block.distance}`, block);
  }

  return [...selected.values()].sort((left, right) => left.distance - right.distance);
}

function scanNearbyResources(actor: PositionedActor): ObserveResult["nearbyResources"] | undefined {
  if (!actor.findBlocks || !actor.blockAt) {
    return undefined;
  }

  const seen = new Set<string>();
  const logs = actor
    .findBlocks({
      matching: (block) => isLogName(block.name),
      maxDistance: 32,
      count: 24
    })
    .map((position) => {
      const block = actor.blockAt?.(position);
      return block && isLogName(block.name)
        ? {
            name: block.name,
            distance: roundDistance(actor.entity.position.distanceTo(position)),
            direction: directionFrom(actor.entity.position, position),
            position: roundPosition(position)
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .filter((entry) => {
      const key = `${entry.name}:${Math.floor(entry.position.x)}:${Math.floor(entry.position.y)}:${Math.floor(entry.position.z)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 8);

  if (logs.length === 0) {
    return undefined;
  }

  return { logs };
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
  const nearbyResources = scanNearbyResources(actor);
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
    ...(nearbyResources ? { nearbyResources } : {}),
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
