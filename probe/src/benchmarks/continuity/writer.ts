/**
 * Provider-free writer for typed goal-continuity restart observations.
 *
 * Writing a restart observation records before/after durable-state refs only.
 * It does not prove live process-restart survival by itself.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  assertGoalContinuityRestartObservation,
  resolveGoalContinuityArtifactPath
} from "./loader.js";
import type { GoalContinuityRestartObservationV1 } from "./types.js";

export type WriteGoalContinuityRestartObservationResult = {
  absolute_path: string;
  relative_ref: string;
  observation: GoalContinuityRestartObservationV1;
};

/**
 * Validate and write a restart observation under a declared actor/run root.
 * Returns the root-safe relative ref and the validated observation payload.
 */
export function writeGoalContinuityRestartObservation(
  rootDir: string,
  relativeFilename: string,
  observationInput: unknown
): WriteGoalContinuityRestartObservationResult {
  const observation = assertGoalContinuityRestartObservation(observationInput);
  const resolved = resolveGoalContinuityArtifactPath(rootDir, relativeFilename);

  mkdirSync(path.dirname(resolved.absolute_path), { recursive: true });
  writeFileSync(
    resolved.absolute_path,
    `${JSON.stringify(observation, null, 2)}\n`,
    "utf8"
  );

  return {
    absolute_path: resolved.absolute_path,
    relative_ref: resolved.relative_ref,
    observation
  };
}
