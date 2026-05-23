import path from "node:path";

export type ActorWorkspacePaths = {
  rootDir: string;
  actorId: string;
  actorDir: string;
  actorFile: string;
  memoryDir: string;
  memory: {
    rootDir: string;
    workingDir: string;
    episodicDir: string;
    semanticDir: string;
    proceduralDir: string;
    socialDir: string;
    beliefsDir: string;
    guardrailsDir: string;
    indexDir: string;
  };
  relationshipsDir: string;
  evidenceDir: string;
  reviewsDir: string;
  providerInputsDir: string;
  providerOutputsDir: string;
  soulMdFile: string;
  soulJsonFile: string;
  goalsDir: string;
  lifeGoalActiveFile: string;
  strategicGoalsDir: string;
  cycleGoalsDir: string;
  judgmentsDir: string;
  worldEventsDir: string;
  actionSkills: {
    rootDir: string;
    indexFile: string;
    activeDir: string;
    candidatesDir: string;
    directTrialsDir: string;
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

export type ActorMemoryLayerPath =
  | "working"
  | "episodic"
  | "semantic"
  | "procedural"
  | "social"
  | "belief"
  | "guardrail";

export function sanitizeWorkspaceFileId(id: string) {
  return id.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function getActorWorkspacePaths(rootDir: string, actorId: string): ActorWorkspacePaths {
  const actorDir = path.join(rootDir, actorId);
  const actionSkillRootDir = path.join(actorDir, "action-skills");
  const memoryRootDir = path.join(actorDir, "memory");

  return {
    rootDir,
    actorId,
    actorDir,
    actorFile: path.join(actorDir, "actor.json"),
    memoryDir: memoryRootDir,
    memory: {
      rootDir: memoryRootDir,
      workingDir: path.join(memoryRootDir, "working"),
      episodicDir: path.join(memoryRootDir, "episodic"),
      semanticDir: path.join(memoryRootDir, "semantic"),
      proceduralDir: path.join(memoryRootDir, "procedural"),
      socialDir: path.join(memoryRootDir, "social"),
      beliefsDir: path.join(memoryRootDir, "beliefs"),
      guardrailsDir: path.join(memoryRootDir, "guardrails"),
      indexDir: path.join(memoryRootDir, "index")
    },
    relationshipsDir: path.join(actorDir, "relationships"),
    evidenceDir: path.join(actorDir, "evidence"),
    reviewsDir: path.join(actorDir, "reviews"),
    providerInputsDir: path.join(actorDir, "provider-inputs"),
    providerOutputsDir: path.join(actorDir, "provider-outputs"),
    soulMdFile: path.join(actorDir, "soul.md"),
    soulJsonFile: path.join(actorDir, "soul.json"),
    goalsDir: path.join(actorDir, "goals"),
    lifeGoalActiveFile: path.join(actorDir, "goals", "life", "active.json"),
    strategicGoalsDir: path.join(actorDir, "goals", "strategic"),
    cycleGoalsDir: path.join(actorDir, "goals", "cycle"),
    judgmentsDir: path.join(actorDir, "judgments"),
    worldEventsDir: path.join(actorDir, "world-events"),
    actionSkills: {
      rootDir: actionSkillRootDir,
      indexFile: path.join(actionSkillRootDir, "index.json"),
      activeDir: path.join(actionSkillRootDir, "active"),
      candidatesDir: path.join(actionSkillRootDir, "candidates"),
      directTrialsDir: path.join(actionSkillRootDir, "direct-trials"),
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

export function getActorMemoryLayerDir(
  paths: ActorWorkspacePaths,
  layer: ActorMemoryLayerPath
) {
  switch (layer) {
    case "working":
      return paths.memory.workingDir;
    case "episodic":
      return paths.memory.episodicDir;
    case "semantic":
      return paths.memory.semanticDir;
    case "procedural":
      return paths.memory.proceduralDir;
    case "social":
      return paths.memory.socialDir;
    case "belief":
      return paths.memory.beliefsDir;
    case "guardrail":
      return paths.memory.guardrailsDir;
  }
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

export function getActorMemoryRecordPath(
  rootDir: string,
  actorId: string,
  layer: ActorMemoryLayerPath,
  memoryId: string
) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  return path.join(getActorMemoryLayerDir(paths, layer), `${sanitizeWorkspaceFileId(memoryId)}.json`);
}
