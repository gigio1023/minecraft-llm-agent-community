import path from "node:path";

import type { CycleJudgment } from "./types.js";
import { listJsonFilesSorted, readJsonIfExists, writeActorGoalArtifact } from "./goalJsonStore.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";

export async function writeCycleJudgment(
  rootDir: string,
  actorId: string,
  judgment: CycleJudgment,
  artifactId = judgment.cycle_id
) {
  return writeActorGoalArtifact(
    rootDir,
    actorId,
    "judgments",
    `${artifactId}-judgment`,
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
  if (judgment) {
    return {
      judgment,
      ref: path.relative(paths.actorDir, filePath)
    };
  }

  const actionJudgments = (await listJsonFilesSorted(paths.judgmentsDir)).filter((candidate) => {
    const basename = path.basename(candidate);
    return basename.startsWith(`${cycleId}-action-`) && basename.endsWith("-judgment.json");
  });
  const latestActionJudgmentPath = actionJudgments[actionJudgments.length - 1];
  if (!latestActionJudgmentPath) {
    return null;
  }
  const latestActionJudgment = await readJsonIfExists<CycleJudgment>(latestActionJudgmentPath);
  if (!latestActionJudgment) {
    return null;
  }

  return {
    judgment: latestActionJudgment,
    ref: path.relative(paths.actorDir, latestActionJudgmentPath)
  };
}
