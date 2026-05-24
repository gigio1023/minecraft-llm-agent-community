import fs from "node:fs/promises";
import path from "node:path";

import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../actorWorkspacePaths.js";
import { writeJson } from "../actorWorkspaceStore.js";

export async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function listJsonFilesSorted(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .map((entry) => path.join(dir, entry));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function relativeActorRef(actorDir: string, filePath: string) {
  return path.relative(actorDir, filePath);
}

export async function writeActorGoalArtifact<T extends { schema: string }>(
  rootDir: string,
  actorId: string,
  subdir: string,
  fileId: string,
  record: T
) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  await fs.mkdir(path.join(paths.actorDir, subdir), { recursive: true });
  const filePath = path.join(
    paths.actorDir,
    subdir,
    `${sanitizeWorkspaceFileId(fileId)}.json`
  );
  await writeJson(filePath, record);
  return {
    filePath,
    ref: relativeActorRef(paths.actorDir, filePath)
  };
}
