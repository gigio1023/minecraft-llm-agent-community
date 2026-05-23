import fs from "node:fs/promises";
import path from "node:path";

import { getActorProfile, type ActorProfile } from "../npc/profiles.js";
import { initializeRelationshipEdges } from "../npc/relationships/relationshipStore.js";
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
  actor_profile: ActorProfile;
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

async function clearDirectoryContents(dir: string) {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }

  await Promise.all(entries.map((entry) => fs.rm(path.join(dir, entry), { recursive: true, force: true })));
}

/**
 * Restores the actor workspace baseline without deleting actor-owned artifacts.
 *
 * Candidate action skills, retired action skills, memory, and relationships can
 * carry review value across runs. Runtime evidence and provider packets are
 * volatile: keeping them in a fresh run lets stale failures steer the provider.
 */
export async function initializeActorWorkspaces(
  options: ActorWorkspaceInitOptions
): Promise<ActorWorkspaceInitResult> {
  const initializedAt = options.initializedAt ?? new Date().toISOString();
  const actorRecords: ActorWorkspaceRecord[] = [];

  await fs.mkdir(options.rootDir, { recursive: true });

  for (const [actorIndex, actor] of options.actors.entries()) {
    const paths = getActorWorkspacePaths(options.rootDir, actor.actor_id);
    const workspacePath = paths.actorDir;
    const actionSkillLibraryPath = paths.actionSkills.rootDir;
    const workspaceDirs = getRequiredActorWorkspaceDirs(options.rootDir, actor.actor_id);
    const actorProfile = getActorProfile(actor.actor_id, actorIndex);

    await Promise.all(
      workspaceDirs.map((workspaceDir) => fs.mkdir(workspaceDir, { recursive: true }))
    );

    await Promise.all([
      clearDirectoryContents(paths.evidenceDir),
      clearDirectoryContents(paths.providerInputsDir),
      clearDirectoryContents(paths.providerOutputsDir)
    ]);

    // actor.json is the per-run baseline contract. It can be rewritten because
    // durable action skill and relationship artifacts live under child dirs.
    await writeJson(paths.actorFile, {
      schema: "actor-workspace/v1",
      actor_id: actor.actor_id,
      username: actor.username,
      role_id: actor.role_id,
      actor_profile: actorProfile,
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
      actor_profile: actorProfile,
      workspace_path: workspacePath,
      action_skill_library_path: actionSkillLibraryPath
    });
  }

  await initializeRelationshipEdges({
    rootDir: options.rootDir,
    actorIds: options.actors.map((actor) => actor.actor_id)
  });

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
