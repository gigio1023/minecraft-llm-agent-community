import { names, personas } from "./actors.js";
import { memories, publicEvents } from "./memory.js";
import type { ActorId, BotRecord, WorldObservation } from "./types.js";

function round(value: number, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function positionOf(bot: BotRecord[ActorId]) {
  return {
    x: round(bot.entity.position.x, 2),
    y: round(bot.entity.position.y, 2),
    z: round(bot.entity.position.z, 2)
  };
}

function scanBlocks(bot: BotRecord[ActorId]) {
  // Keep scans bounded so observations are useful as prompt/evidence context
  // without becoming a full world dump.
  return bot
    .findBlocks({
      matching: (block) => block.name !== "air" && block.name !== "void_air",
      maxDistance: 16,
      count: 24
    })
    .map((position) => {
      const block = bot.blockAt(position);
      return {
        name: block?.name ?? "unknown",
        distance: round(bot.entity.position.distanceTo(position))
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12);
}

function scanEntities(bot: BotRecord[ActorId]) {
  return Object.values(bot.entities)
    .filter((entity) => entity !== bot.entity)
    .map((entity) => ({
      name: entity.name,
      ...(entity.username ? { username: entity.username } : {}),
      type: entity.type,
      distance: round(bot.entity.position.distanceTo(entity.position))
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12);
}

export function observeActor(actorId: ActorId, bots: BotRecord): WorldObservation {
  const bot = bots[actorId];
  const nearbyEntities = scanEntities(bot);

  return {
    actorId,
    name: names[actorId],
    persona: personas[actorId],
    sharedGoal: "survive in peaceful survival mode by observing village resources, positioning well, and deciding when to cooperate or compete",
    position: positionOf(bot),
    facing: { yaw: round(bot.entity.yaw, 2), pitch: round(bot.entity.pitch, 2) },
    health: bot.health,
    food: bot.food,
    inventory: bot.inventory.items().map((item) => ({ name: item.name, count: item.count })),
    nearbyEntities,
    nearbyBlocks: scanBlocks(bot),
    nearbyItems: nearbyEntities.filter((entity) => entity.name === "item"),
    recentPublicEvents: publicEvents.slice(-8),
    episodicMemory: memories[actorId].slice(-8)
  };
}

/**
 * Produces a compact before/after diff for generated action skill review.
 *
 * The diff highlights evidence that can explain whether an action changed the
 * world, instead of relying on the generated skill's return value.
 */
export function diffObservations(before: WorldObservation, after: WorldObservation) {
  return {
    positionDelta: {
      x: round(after.position.x - before.position.x, 2),
      y: round(after.position.y - before.position.y, 2),
      z: round(after.position.z - before.position.z, 2)
    },
    healthDelta: round(after.health - before.health, 2),
    foodDelta: round(after.food - before.food, 2),
    inventoryBefore: before.inventory,
    inventoryAfter: after.inventory,
    nearbyBlocksAfter: after.nearbyBlocks.slice(0, 8),
    nearbyEntitiesAfter: after.nearbyEntities.slice(0, 8)
  };
}
