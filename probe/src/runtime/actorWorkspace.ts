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

type ExistingActionSkillIndex = {
  active: string[];
  candidates: string[];
  retired: string[];
  rejected: string[];
};

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

async function readExistingActionSkillIndex(indexFile: string): Promise<ExistingActionSkillIndex> {
  try {
    const index = JSON.parse(await fs.readFile(indexFile, "utf8")) as Record<string, unknown>;
    return {
      active: stringArray(index.active),
      candidates: stringArray(index.candidates),
      retired: stringArray(index.retired),
      rejected: stringArray(index.rejected)
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        active: [],
        candidates: [],
        retired: [],
        rejected: []
      };
    }

    throw error;
  }
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/**
 * Restores the actor workspace baseline without deleting actor-owned artifacts.
 *
 * Candidate action skills, retired action skills, memory, and relationships can
 * carry review value across runs. Runtime evidence and provider packets also
 * remain intact because audit and replay need to distinguish stale refs from
 * current-run refs instead of losing evidence during initialization.
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
    const existingActiveRecords = await listActorActionSkillRecords(
      options.rootDir,
      actor.actor_id,
      "active"
    );
    const preservedActiveRecords = existingActiveRecords.filter(
      (record) =>
        record.owner_actor_id === actor.actor_id &&
        record.status === "active" &&
        record.source_kind !== "seed" &&
        !activeRecords.some((activeRecord) => activeRecord.skill_id === record.skill_id)
    );

    await Promise.all(
      activeRecords.map((record) => writeActorActionSkillRecord(options.rootDir, record))
    );

    const existingIndex = await readExistingActionSkillIndex(paths.actionSkills.indexFile);
    await writeJson(paths.actionSkills.indexFile, {
      schema: "action-skill-library/v1",
      owner_actor_id: actor.actor_id,
      initialized_at: initializedAt,
      active: uniqueSorted([
        ...activeRecords.map((record) => record.skill_id),
        ...preservedActiveRecords.map((record) => record.skill_id),
        ...existingIndex.active.filter((skillId) =>
          preservedActiveRecords.some((record) => record.skill_id === skillId)
        )
      ]),
      candidates: existingIndex.candidates,
      retired: existingIndex.retired,
      rejected: existingIndex.rejected
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
  const records = await listActorActionSkillRecords(rootDir, actorId, "active");
  const paths = getActorWorkspacePaths(rootDir, actorId);

  try {
    const index = JSON.parse(await fs.readFile(paths.actionSkills.indexFile, "utf8")) as {
      active?: unknown;
    };
    if (!Array.isArray(index.active)) {
      return records;
    }

    const indexedActiveIds = new Set(
      index.active.filter((skillId): skillId is string => typeof skillId === "string")
    );
    return records.filter((record) => indexedActiveIds.has(record.skill_id));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return records;
    }

    throw error;
  }
}
