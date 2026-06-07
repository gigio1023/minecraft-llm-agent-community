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
  health?: number;
  food?: number;
  foodSaturation?: number;
  heldItem?: { name: string; count?: number } | null;
  registry?: unknown;
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
  vitals?: {
    health?: number;
    food?: number;
    food_saturation?: number;
    held_item?: { name: string; count?: number };
    food_candidates: Array<{
      name: string;
      count: number;
      food_points?: number;
      saturation?: number;
    }>;
  };
  nearbyBlocks?: Array<{ name: string; distance: number }>;
  sharedChest?: {
    chestId: string;
    items: Array<{ name: string; count: number }>;
  };
  worldStateSummary?: WorldStateSummary;
  session_lifecycle?: {
    schema: "runtime-session-lifecycle/v1";
    actor_id: string;
    status: "active" | "dead_or_respawning" | "respawned_after_death" | "disconnected_or_error";
    death_count: number;
    spawn_count: number;
    last_event?: {
      kind: "death" | "spawn" | "end" | "kicked" | "error";
      observed_at: string;
      position?: { x: number; y: number; z: number };
      health?: number;
      food?: number;
      reason?: string;
    };
    recent_events: Array<{
      kind: "death" | "spawn" | "end" | "kicked" | "error";
      observed_at: string;
      position?: { x: number; y: number; z: number };
      health?: number;
      food?: number;
      reason?: string;
    }>;
    inventory_may_have_reset: boolean;
    branch_recommended: boolean;
    branch_reason?: "danger_or_survival_pressure" | "environment_blocked";
    notes: string[];
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

function inspectVitals(
  actor: PositionedActor,
  inventory: Array<{ name: string; count: number }> | undefined
) {
  const hasVitals =
    typeof actor.health === "number" ||
    typeof actor.food === "number" ||
    typeof actor.foodSaturation === "number" ||
    Boolean(actor.heldItem);
  const foodCandidates = (inventory ?? [])
    .map((item) => {
      const registry = actor.registry && typeof actor.registry === "object"
        ? actor.registry as { foodsByName?: unknown }
        : {};
      const foodsByName = registry.foodsByName && typeof registry.foodsByName === "object"
        ? registry.foodsByName as Record<string, { foodPoints?: number; saturation?: number } | undefined>
        : {};
      const food = foodsByName[item.name];
      if (!food) {
        return null;
      }
      return {
        name: item.name,
        count: item.count,
        ...(typeof food.foodPoints === "number" ? { food_points: food.foodPoints } : {}),
        ...(typeof food.saturation === "number" ? { saturation: food.saturation } : {})
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!hasVitals && foodCandidates.length === 0) {
    return undefined;
  }

  return {
    ...(typeof actor.health === "number" ? { health: actor.health } : {}),
    ...(typeof actor.food === "number" ? { food: actor.food } : {}),
    ...(typeof actor.foodSaturation === "number" ? { food_saturation: actor.foodSaturation } : {}),
    ...(actor.heldItem
      ? {
          held_item: {
            name: actor.heldItem.name,
            count: actor.heldItem.count
          }
        }
      : {}),
    food_candidates: foodCandidates
  };
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
  const vitals = inspectVitals(actor, inventory);
  const nearbyBlocks = scanNearbyBlocks(actor);
  const worldStateSummary = summarizeWorldStateScan(
    scanWorldState({
      bot: actor,
      actorId: actor.username,
      scanId: `observe-${actor.username}-${randomUUID()}`,
      radius: 32,
      caps: { blockObservations: 256, nearestExamples: 12 }
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
    ...(vitals ? { vitals } : {}),
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
