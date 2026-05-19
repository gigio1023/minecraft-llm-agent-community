import * as mineflayer from "mineflayer";
import type { Bot } from "mineflayer";
import { pathfinder } from "mineflayer-pathfinder";

import type { ProbeConfig } from "../config.js";

type ServerEndpoint = {
  host: string;
  port: number;
};

export type ProbeBots = {
  npc_a: Bot;
  npc_b: Bot;
};

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
  const [npcAName, npcBName] = config.bots;
  let npcA: Bot | null = null;
  let npcB: Bot | null = null;

  try {
    npcA = createOfflineBot(config, server, npcAName);
    await waitForSpawn(npcA);

    npcB = createOfflineBot(config, server, npcBName);
    await waitForSpawn(npcB);

    return {
      npc_a: npcA,
      npc_b: npcB
    };
  } catch (error) {
    await closeBotList([npcA, npcB]);
    throw error;
  }
}

export async function closeBots(bots: ProbeBots) {
  await closeBotList([bots.npc_a, bots.npc_b]);
}
