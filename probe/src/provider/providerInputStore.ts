import path from "node:path";

import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../runtime/actorWorkspacePaths.js";
import { writeJson } from "../runtime/actorWorkspaceStore.js";
import type { JsonValue, ProviderInputSnapshot } from "./inputSnapshot.js";

const credentialKeyPattern = /authorization|access[_-]?token|refresh[_-]?token|api[_-]?key|password|secret/i;

function assertNoCredentialLikeKeys(value: JsonValue, trail: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoCredentialLikeKeys(entry, [...trail, String(index)]));
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (credentialKeyPattern.test(key)) {
      throw new Error(`Provider input snapshot contains credential-like key ${key} at ${trail.join(".") || "<root>"}`);
    }

    assertNoCredentialLikeKeys(entry, [...trail, key]);
  }
}

export async function writeProviderInputSnapshot(
  actorWorkspaceRootDir: string,
  snapshot: ProviderInputSnapshot
) {
  assertNoCredentialLikeKeys(snapshot.input);

  if (snapshot.observation) {
    assertNoCredentialLikeKeys(snapshot.observation);
  }

  if (snapshot.memory) {
    assertNoCredentialLikeKeys(snapshot.memory);
  }

  if (snapshot.recent_context) {
    assertNoCredentialLikeKeys(snapshot.recent_context);
  }

  const paths = getActorWorkspacePaths(actorWorkspaceRootDir, snapshot.actor_id);
  const filePath = path.join(
    paths.providerInputsDir,
    `${sanitizeWorkspaceFileId(snapshot.snapshot_id)}.json`
  );
  await writeJson(filePath, snapshot);
  return filePath;
}
