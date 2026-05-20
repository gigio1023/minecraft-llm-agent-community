import fs from "node:fs/promises";
import path from "node:path";

import type { SeedActionSkillOwnershipRecord } from "../skills/ownership.js";
import type { ActorSession } from "./session/probeSession.js";

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

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

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
    const workspacePath = path.join(options.rootDir, actor.actor_id);
    const actionSkillLibraryPath = path.join(workspacePath, "action-skills");
    const workspaceDirs = [
      workspacePath,
      actionSkillLibraryPath,
      path.join(actionSkillLibraryPath, "active"),
      path.join(actionSkillLibraryPath, "candidates"),
      path.join(actionSkillLibraryPath, "retired"),
      path.join(workspacePath, "memory"),
      path.join(workspacePath, "evidence")
    ];

    await Promise.all(
      workspaceDirs.map((workspaceDir) => fs.mkdir(workspaceDir, { recursive: true }))
    );

    // actor.json is the per-run baseline contract. It can be rewritten because
    // durable candidate/evidence artifacts live under child directories.
    await writeJson(path.join(workspacePath, "actor.json"), {
      schema: "actor-workspace/v1",
      actor_id: actor.actor_id,
      username: actor.username,
      role_id: actor.role_id,
      initialized_at: initializedAt,
      action_skill_library: "action-skills/index.json"
    });

    await writeJson(path.join(actionSkillLibraryPath, "index.json"), {
      schema: "action-skill-library/v1",
      owner_actor_id: actor.actor_id,
      initialized_at: initializedAt,
      active_seed_action_skills: ownedSeedActionSkills(
        actor.actor_id,
        options.seedActionSkillOwnership
      ),
      candidates: [],
      retired: []
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
