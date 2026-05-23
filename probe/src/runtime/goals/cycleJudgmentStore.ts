import path from "node:path";

import type { CycleJudgment } from "./types.js";
import { listJsonFilesSorted, readJsonIfExists, writeActorGoalArtifact } from "./goalJsonStore.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";

export async function writeCycleJudgment(rootDir: string, actorId: string, judgment: CycleJudgment) {
  return writeActorGoalArtifact(
    rootDir,
    actorId,
    "judgments",
    `${judgment.cycle_id}-judgment`,
    judgment
  );
}

export async function readLatestCycleJudgment(
  rootDir: string,
  actorId: string
): Promise<{ judgment: CycleJudgment; ref: string } | null> {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const files = await listJsonFilesSorted(paths.judgmentsDir);
  if (files.length === 0) {
    return null;
  }
  const filePath = files[files.length - 1]!;
  const judgment = await readJsonIfExists<CycleJudgment>(filePath);
  if (!judgment) {
    return null;
  }
  return {
    judgment,
    ref: path.relative(paths.actorDir, filePath)
  };
}

export async function readCycleJudgmentByCycleId(
  rootDir: string,
  actorId: string,
  cycleId: string
): Promise<{ judgment: CycleJudgment; ref: string } | null> {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const filePath = path.join(paths.judgmentsDir, `${cycleId}-judgment.json`);
  const judgment = await readJsonIfExists<CycleJudgment>(filePath);
  if (!judgment) {
    return null;
  }
  return {
    judgment,
    ref: path.relative(paths.actorDir, filePath)
  };
}
