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
  entities?: Record<string, unknown>;
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
  chatEvents?: Array<{
    speaker_id: string;
    message: string;
    observed_at: string;
    tick?: number;
    position?: { x: number; y: number; z: number };
  }>;
  loadedWorldScope?: {
    schema: "loaded-world-observation-scope/v1";
    observer_id: string;
    radius_blocks: number;
    visible_actor_scan: "provided_actor_roster" | "bot_entities";
    absence_claims_exhaustive: false;
    caveat: string;
  };
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
  nearbyBlocks?: Array<{ name: string; position: { x: number; y: number; z: number }; distance: number }>;
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
  otherActors?: PositionedActor[];
  chatEvents?: ObserveResult["chatEvents"];
  dialogueState: DialogueState;
  memory: MemoryStore;
  sharedChest?: {
    chestId: string;
    inspect(): Promise<ItemStack[] | null> | ItemStack[] | null;
  };
};

type VisibleActorScanSource = "provided_actor_roster" | "bot_entities";

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

  // This compact hint is nearest-first only. Strategic or station-like priority
  // belongs in runtime-owned action skills or verifiers, not provider context.
  return actor
    .findBlocks({
      matching: (block) => block.name !== "air" && block.name !== "void_air",
      maxDistance: 16,
      count: 48
    })
    .map((position) => ({
      name: actor.blockAt?.(position)?.name ?? "unknown",
      position: {
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        z: Math.floor(position.z)
      },
      distance: roundDistance(actor.entity.position.distanceTo(position))
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 12);
}

function entityUsername(entity: unknown) {
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
    return undefined;
  }
  const record = entity as Record<string, unknown>;
  const username = record.username ?? record.name;
  return typeof username === "string" && username.trim().length > 0
    ? username
    : undefined;
}

function entityPosition(entity: unknown): PositionedActor["entity"]["position"] | undefined {
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
    return undefined;
  }
  const position = (entity as Record<string, unknown>).position;
  if (!position || typeof position !== "object" || Array.isArray(position)) {
    return undefined;
  }
  const record = position as Record<string, unknown>;
  if (
    typeof record.x !== "number" ||
    typeof record.y !== "number" ||
    typeof record.z !== "number" ||
    typeof (position as { distanceTo?: unknown }).distanceTo !== "function"
  ) {
    return undefined;
  }
  return position as PositionedActor["entity"]["position"];
}

function visibleActorsForBot(input: {
  actor: PositionedActor;
  target: PositionedActor;
  otherActors?: PositionedActor[];
  dialogueState: DialogueState;
}): {
  actors: ObserveResult["visibleActors"];
  scan: VisibleActorScanSource;
} {
  const roster = input.otherActors?.length
    ? input.otherActors
    : input.target.username === input.actor.username
      ? []
      : [input.target];
  if (roster.length > 0) {
    return {
      scan: "provided_actor_roster",
      actors: roster
        .filter((candidate) => candidate.username !== input.actor.username)
        .map((candidate) => ({
          id: candidate.username,
          distance: roundDistance(input.actor.entity.position.distanceTo(candidate.entity.position)),
          busy: input.dialogueState.peek(candidate.username) === "busy"
        }))
        .sort((left, right) => left.distance - right.distance)
        .slice(0, 8)
    };
  }

  const entities = input.actor.entities ?? {};
  const visibleActors = Object.values(entities)
    .map((entity) => {
      const username = entityUsername(entity);
      const position = entityPosition(entity);
      if (!username || username === input.actor.username || !position) {
        return null;
      }
      return {
        id: username,
        distance: roundDistance(input.actor.entity.position.distanceTo(position)),
        busy: input.dialogueState.peek(username) === "busy"
      };
    })
    .filter((actor): actor is ObserveResult["visibleActors"][number] => actor !== null)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 8);
  return { scan: "bot_entities", actors: visibleActors };
}

export async function observe({
  actor,
  target,
  otherActors,
  chatEvents,
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
  const visibleActors = visibleActorsForBot({ actor, target, otherActors, dialogueState });

  // Observe is the transcript-facing state boundary. Optional capabilities stay
  // optional so the same primitive can run against Mineflayer bots and narrow
  // test doubles without fabricating evidence. Chest inspection is especially
  // non-fatal because stale world fixtures should not turn observation into a
  // storage action.
  return {
    status: "ok",
    observerId: actor.username,
    position: roundPosition(actor.entity.position),
    visibleActors: visibleActors.actors,
    ...(chatEvents && chatEvents.length > 0 ? { chatEvents: chatEvents.slice(-24) } : {}),
    loadedWorldScope: {
      schema: "loaded-world-observation-scope/v1",
      observer_id: actor.username,
      radius_blocks: 32,
      visible_actor_scan: visibleActors.scan,
      absence_claims_exhaustive: false,
      caveat:
        "Visible actors and absence claims are limited to currently loaded Mineflayer entity/chunk state for this observer."
    },
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
