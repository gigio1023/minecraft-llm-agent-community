import path from "node:path";

import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../runtime/actorWorkspacePaths.js";
import { writeJson } from "../runtime/actorWorkspaceStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import type { ProviderUsageRecord } from "./providerUsageTracker.js";

export type ProviderOutputSnapshot = {
  schema: "provider-output-snapshot/v1";
  snapshot_id: string;
  actor_id: string;
  turn_id: string;
  provider_id: string;
  model: string;
  created_at: string;
  raw_output_text: string;
  parsed_output: JsonValue;
  proposal: JsonValue;
  /** Provider-reported or estimated usage for post-run cost/rate-limit audit. */
  usage?: ProviderUsageRecord;
  /**
   * Top-level raw provider response/error payload. Populated only for Model
   * Studio when the transport supplied `result.rawOutput`.
   */
  raw_provider_output?: JsonValue;
};

/** Additive top-level raw evidence for Model Studio snapshots only. */
export function modelStudioRawProviderOutputField(input: {
  providerId: string;
  rawOutput?: JsonValue;
}): Pick<ProviderOutputSnapshot, "raw_provider_output"> {
  if (input.providerId === "alibaba-model-studio-api" && input.rawOutput !== undefined) {
    return { raw_provider_output: input.rawOutput };
  }
  return {};
}

/** Read optional transport rawOutput from a mixed provider-result union. */
export function rawOutputFromProviderResult(result: unknown): JsonValue | undefined {
  if (result !== null && typeof result === "object" && "rawOutput" in result) {
    return (result as { rawOutput?: JsonValue }).rawOutput;
  }
  return undefined;
}

export async function writeProviderOutputSnapshot(
  actorWorkspaceRootDir: string,
  snapshot: ProviderOutputSnapshot
) {
  const paths = getActorWorkspacePaths(actorWorkspaceRootDir, snapshot.actor_id);
  const filePath = path.join(
    paths.providerOutputsDir,
    `${sanitizeWorkspaceFileId(snapshot.snapshot_id)}.json`
  );
  await writeJson(filePath, snapshot);
  return filePath;
}
