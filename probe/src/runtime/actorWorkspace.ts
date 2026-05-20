import fs from "node:fs/promises";
import path from "node:path";

import type { SeedActionSkillOwnershipRecord } from "../skills/ownership.js";
import type { ActorSession } from "./session/probeSession.js";
import { getActorWorkspacePaths } from "./actorWorkspacePaths.js";
import {
  getRequiredActorWorkspaceDirs,
  listActorActionSkillRecords,
  materializeSeedActionSkillRecord,
  writeActorActionSkillRecord,
  writeJson
} from "./actorWorkspaceStore.js";

export type ActorWorkspaceInitOptions = {
  rootDir: string;
  actors: readonly ActorSession[];
  seedActionSkillOwnership: readonly SeedActionSkillOwnershipRecord[];
  initializedAt?: string;
};

export type ActorWorkspaceRecord = {
  actor_id: string;
  username: string;
  role_id: string;
  workspace_path: string;
  action_skill_library_path: string;
};

export type ActorWorkspaceInitResult = {
  rootDir: string;
  initializedAt: string;
  actors: ActorWorkspaceRecord[];
};

function ownedSeedActionSkills(
  actorId: string,
  ownership: readonly SeedActionSkillOwnershipRecord[]
) {
  return ownership.filter((record) => record.owner_actor_id === actorId);
}

/**
 * Restores the actor workspace baseline without deleting actor-owned artifacts.
 *
 * Candidate action skills, retired action skills, evidence, and memory can carry
 * review value across runs, so initialization only recreates required directories
 * and rewrites the baseline index files.
 */
export async function initializeActorWorkspaces(
  options: ActorWorkspaceInitOptions
): Promise<ActorWorkspaceInitResult> {
  const initializedAt = options.initializedAt ?? new Date().toISOString();
  const actorRecords: ActorWorkspaceRecord[] = [];

  await fs.mkdir(options.rootDir, { recursive: true });

  for (const actor of options.actors) {
    const paths = getActorWorkspacePaths(options.rootDir, actor.actor_id);
    const workspacePath = paths.actorDir;
    const actionSkillLibraryPath = paths.actionSkills.rootDir;
    const workspaceDirs = getRequiredActorWorkspaceDirs(options.rootDir, actor.actor_id);

    await Promise.all(
      workspaceDirs.map((workspaceDir) => fs.mkdir(workspaceDir, { recursive: true }))
    );

    // actor.json is the per-run baseline contract. It can be rewritten because
    // durable candidate/evidence artifacts live under child directories.
    await writeJson(paths.actorFile, {
      schema: "actor-workspace/v1",
      actor_id: actor.actor_id,
      username: actor.username,
      role_id: actor.role_id,
      initialized_at: initializedAt,
      action_skill_library: "action-skills/index.json"
    });

    const activeRecords = ownedSeedActionSkills(
      actor.actor_id,
      options.seedActionSkillOwnership
    ).map((record) => materializeSeedActionSkillRecord(record, initializedAt));

    await Promise.all(
      activeRecords.map((record) => writeActorActionSkillRecord(options.rootDir, record))
    );

    await writeJson(paths.actionSkills.indexFile, {
      schema: "action-skill-library/v1",
      owner_actor_id: actor.actor_id,
      initialized_at: initializedAt,
      active: activeRecords.map((record) => record.skill_id),
      candidates: [],
      retired: [],
      rejected: []
    });

    actorRecords.push({
      actor_id: actor.actor_id,
      username: actor.username,
      role_id: actor.role_id,
      workspace_path: workspacePath,
      action_skill_library_path: actionSkillLibraryPath
    });
  }

  const result: ActorWorkspaceInitResult = {
    rootDir: options.rootDir,
    initializedAt,
    actors: actorRecords
  };

  // The root index is the checkpoint a later probe can read to discover actor
  // workspaces without guessing from directory names.
  await writeJson(path.join(options.rootDir, "index.json"), {
    schema: "actor-workspace-index/v1",
    initialized_at: initializedAt,
    actors: actorRecords
  });

  return result;
}

export async function listActiveActorActionSkillRecords(rootDir: string, actorId: string) {
  return listActorActionSkillRecords(rootDir, actorId, "active");
}
