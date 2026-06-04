/**
 * Persistence for actor relationship records.
 *
 * @remarks Relationship state shapes social context and obligations, but it is
 * not a substitute for chat, shared-storage, or runtime evidence when claiming
 * that a social consequence happened.
 */
import fs from "node:fs/promises";
import path from "node:path";

import {
  getActorWorkspacePaths,
  sanitizeWorkspaceFileId
} from "../../runtime/actorWorkspacePaths.js";
import { writeJson } from "../../runtime/actorWorkspaceStore.js";
import {
  createDefaultRelationshipEdge,
  type RelationshipEdge
} from "./relationshipLedger.js";

function relationshipPath(rootDir: string, fromActorId: string, toActorId: string) {
  return path.join(
    getActorWorkspacePaths(rootDir, fromActorId).relationshipsDir,
    `${sanitizeWorkspaceFileId(toActorId)}.json`
  );
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function writeRelationshipEdge(rootDir: string, edge: RelationshipEdge) {
  const filePath = relationshipPath(rootDir, edge.from_actor_id, edge.to_actor_id);
  await writeJson(filePath, {
    schema: "relationship-edge/v1",
    ...edge
  });
  return filePath;
}

export async function readRelationshipEdge(
  rootDir: string,
  fromActorId: string,
  toActorId: string
) {
  try {
    return await readJson<RelationshipEdge>(
      relationshipPath(rootDir, fromActorId, toActorId)
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createDefaultRelationshipEdge(fromActorId, toActorId);
    }

    throw error;
  }
}

export async function listRelationshipEdges(rootDir: string, actorId: string) {
  const dir = getActorWorkspacePaths(rootDir, actorId).relationshipsDir;

  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .map((entry) => readJson<RelationshipEdge>(path.join(dir, entry)))
  );
}

export async function listIncomingRelationshipEdges(rootDir: string, actorId: string) {
  let actorDirs: string[];
  try {
    actorDirs = await fs.readdir(rootDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const edges: RelationshipEdge[] = [];

  for (const fromActorId of actorDirs.sort()) {
    if (fromActorId === actorId) {
      continue;
    }

    try {
      const edge = await readJson<RelationshipEdge>(
        relationshipPath(rootDir, fromActorId, actorId)
      );
      edges.push(edge);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") {
        throw error;
      }
    }
  }

  return edges;
}

export async function initializeRelationshipEdges(input: {
  rootDir: string;
  actorIds: readonly string[];
}) {
  const edges: RelationshipEdge[] = [];

  for (const fromActorId of input.actorIds) {
    for (const toActorId of input.actorIds) {
      if (fromActorId === toActorId) {
        continue;
      }

      const existing = await readRelationshipEdge(
        input.rootDir,
        fromActorId,
        toActorId
      );
      await writeRelationshipEdge(input.rootDir, existing);
      edges.push(existing);
    }
  }

  return edges;
}
