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
};

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
