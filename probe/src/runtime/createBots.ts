import * as mineflayer from "mineflayer";
import type { Bot } from "mineflayer";
import { pathfinder } from "mineflayer-pathfinder";

import type { ProbeConfig } from "../config.js";
import { normalizeActorIds } from "./actorRoster.js";

type ServerEndpoint = {
  host: string;
  port: number;
};

export type ProbeBots = Record<string, Bot>;

function createOfflineBot(
  config: ProbeConfig,
  server: ServerEndpoint,
  username: string
) {
  const bot = mineflayer.createBot({
    host: server.host,
    port: server.port,
    username,
    auth: "offline",
    version: config.server.version,
    viewDistance: "tiny"
  });

  bot.loadPlugin(pathfinder);

  return bot;
}

function waitForSpawn(bot: Bot) {
  return new Promise<void>((resolve, reject) => {
    const onSpawn = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onEnd = (reason: string) => {
      cleanup();
      reject(new Error(`Bot ${bot.username} disconnected before spawn: ${reason}`));
    };
    const cleanup = () => {
      bot.off("spawn", onSpawn);
      bot.off("error", onError);
      bot.off("end", onEnd);
    };

    bot.on("spawn", onSpawn);
    bot.on("error", onError);
    bot.on("end", onEnd);
  });
}

async function closeBotList(bots: Array<Bot | null | undefined>) {
  await Promise.allSettled(
    bots.map(async (bot) => {
      if (!bot) {
        return;
      }

      try {
        bot.quit();
      } catch {
        bot.end();
      }
    })
  );
}

export async function createBots(
  config: ProbeConfig,
  server: ServerEndpoint
): Promise<ProbeBots> {
  const actorIds = normalizeActorIds(config.bots);
  const createdBots: ProbeBots = {};

  try {
    for (const actorId of actorIds) {
      const bot = createOfflineBot(config, server, actorId);
      createdBots[actorId] = bot;
      await waitForSpawn(bot);
    }

    return createdBots;
  } catch (error) {
    await closeBotList(Object.values(createdBots));
    throw error;
  }
}

export async function closeBots(bots: ProbeBots) {
  await closeBotList(Object.values(bots));
}
