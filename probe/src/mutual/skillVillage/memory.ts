import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { actors, names } from "./actors.js";
import { summarizeResult } from "./result.js";
import type { ActorId, MemoryEntry, PublicEvent, SkillProposal } from "./types.js";

export const memories: Record<ActorId, MemoryEntry[]> = {
  npc_a: [],
  npc_b: [],
  npc_c: []
};

export const publicEvents: PublicEvent[] = [];

export async function loadAgentMemories(memoryDir: string) {
  await mkdir(memoryDir, { recursive: true });
  await Promise.all(
    actors.map(async (actorId) => {
      const filePath = path.join(memoryDir, `${actorId}.json`);
      try {
        const parsed = JSON.parse(await readFile(filePath, "utf8")) as MemoryEntry[];
        memories[actorId] = Array.isArray(parsed) ? parsed.slice(-24) : [];
      } catch {
        memories[actorId] = [];
      }
    })
  );
}

export async function remember(memoryDir: string, actorId: ActorId, text: string) {
  const entries = memories[actorId];
  entries.push({
    turn: entries.length + 1,
    text
  });
  memories[actorId] = entries.slice(-24);
  await mkdir(memoryDir, { recursive: true });
  await writeFile(path.join(memoryDir, `${actorId}.json`), JSON.stringify(memories[actorId], null, 2));
}

export async function rememberPublicUtterance(memoryDir: string, speakerId: ActorId, utterance: string) {
  await Promise.all(
    actors.map((actorId) =>
      remember(
        memoryDir,
        actorId,
        actorId === speakerId
          ? `I said: ${utterance}`
          : `I heard ${names[speakerId]} say: ${utterance}`
      )
    )
  );
}

export async function rememberPublicToolResult(
  memoryDir: string,
  actorId: ActorId,
  proposal: SkillProposal,
  result: unknown
) {
  const skillResult = summarizeResult(result);
  publicEvents.push({
    actorId,
    actorName: names[actorId],
    utterance: proposal.utterance,
    skillName: proposal.skillName,
    skillDescription: proposal.skillDescription,
    skillResult
  });

  if (publicEvents.length > 48) {
    publicEvents.splice(0, publicEvents.length - 48);
  }

  await Promise.all(
    actors.map((viewerId) =>
      remember(
        memoryDir,
        viewerId,
        viewerId === actorId
          ? `I used ${proposal.skillName}. Tool response: ${skillResult}`
          : `${names[actorId]} used ${proposal.skillName}. Tool response: ${skillResult}`
      )
    )
  );
}
