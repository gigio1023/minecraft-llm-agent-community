import path from "node:path";

export type ActorWorkspacePaths = {
  rootDir: string;
  actorId: string;
  actorDir: string;
  actorFile: string;
  memoryDir: string;
  evidenceDir: string;
  reviewsDir: string;
  providerInputsDir: string;
  actionSkills: {
    rootDir: string;
    indexFile: string;
    activeDir: string;
    candidatesDir: string;
    retiredDir: string;
    rejectedDir: string;
  };
};

export type ActorActionSkillStatusPath =
  | "draft"
  | "candidate"
  | "active"
  | "superseded"
  | "retired"
  | "rejected";

export function sanitizeWorkspaceFileId(id: string) {
  return id.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function getActorWorkspacePaths(rootDir: string, actorId: string): ActorWorkspacePaths {
  const actorDir = path.join(rootDir, actorId);
  const actionSkillRootDir = path.join(actorDir, "action-skills");

  return {
    rootDir,
    actorId,
    actorDir,
    actorFile: path.join(actorDir, "actor.json"),
    memoryDir: path.join(actorDir, "memory"),
    evidenceDir: path.join(actorDir, "evidence"),
    reviewsDir: path.join(actorDir, "reviews"),
    providerInputsDir: path.join(actorDir, "provider-inputs"),
    actionSkills: {
      rootDir: actionSkillRootDir,
      indexFile: path.join(actionSkillRootDir, "index.json"),
      activeDir: path.join(actionSkillRootDir, "active"),
      candidatesDir: path.join(actionSkillRootDir, "candidates"),
      retiredDir: path.join(actionSkillRootDir, "retired"),
      rejectedDir: path.join(actionSkillRootDir, "rejected")
    }
  };
}

export function getActorActionSkillStatusDir(
  paths: ActorWorkspacePaths,
  status: ActorActionSkillStatusPath
) {
  if (status === "active") {
    return paths.actionSkills.activeDir;
  }

  if (status === "candidate" || status === "draft") {
    return paths.actionSkills.candidatesDir;
  }

  if (status === "rejected") {
    return paths.actionSkills.rejectedDir;
  }

  return paths.actionSkills.retiredDir;
}

export function getActorActionSkillRecordPath(
  rootDir: string,
  actorId: string,
  status: ActorActionSkillStatusPath,
  skillId: string
) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  return path.join(getActorActionSkillStatusDir(paths, status), `${sanitizeWorkspaceFileId(skillId)}.json`);
}
