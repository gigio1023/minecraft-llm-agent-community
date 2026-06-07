/**
 * Moves archived generated action skill artifacts out of the active path.
 *
 * @remarks `build/generated-skills` is archived exploratory output; actor
 * workspace records are the source of truth for current action skill ownership.
 */
import fs from "node:fs/promises";
import path from "node:path";

import { writeActionSkillProposal } from "../proposals/proposalStore.js";

export type ArchiveGeneratedSkillsOptions = {
  generatedSkillsDir: string;
  archiveDir: string;
  actorWorkspaceRootDir: string;
  actorId: string;
  archivedAt?: string;
};

export type ArchivedGeneratedSkill = {
  sourcePath: string;
  archivePath: string;
  proposalPath: string;
};

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function listGeneratedSkillFiles(dir: string) {
  let entries: string[];

  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return entries
    .filter((entry) => entry.endsWith(".ts"))
    .sort()
    .map((entry) => path.join(dir, entry));
}

export async function archiveGeneratedSkills(
  options: ArchiveGeneratedSkillsOptions
): Promise<ArchivedGeneratedSkill[]> {
  const archivedAt = options.archivedAt ?? new Date().toISOString();
  const generatedFiles = await listGeneratedSkillFiles(options.generatedSkillsDir);
  const archived: ArchivedGeneratedSkill[] = [];

  await fs.mkdir(options.archiveDir, { recursive: true });

  for (const sourcePath of generatedFiles) {
    const code = await fs.readFile(sourcePath, "utf8");
    const sourceBaseName = path.basename(sourcePath);
    const skillId = sanitizeId(sourceBaseName.replace(/\.ts$/, ""));
    const proposalId = `generated-source-archive-${Date.now()}-${skillId}`;
    const proposalPath = await writeActionSkillProposal(options.actorWorkspaceRootDir, {
      schema: "action-skill-proposal/v1",
      proposal_id: proposalId,
      skill_id: skillId,
      owner_actor_id: options.actorId,
      source_kind: "learned",
      status: "draft",
      task_intent: "Archived generated TypeScript action skill for manual review and recipe conversion.",
      evidence_refs: [],
      preconditions: [],
      required_primitives: [],
      proposed_recipe_id: `generated-source-import:${proposalId}`,
      success_verifier: "not_validated_generated_source_requires_recipe_conversion",
      known_failure_modes: ["generated_source_not_runtime_verified"],
      created_at: archivedAt,
      updated_at: archivedAt,
      generated_source: code,
      generated_source_language: "typescript",
      notes: `Archived from ${sourceBaseName}; not executable until converted to a validated recipe.`
    });
    const archivePath = path.join(
      options.archiveDir,
      `${archivedAt.replace(/[:.]/g, "-")}-${sourceBaseName}`
    );

    await fs.rename(sourcePath, archivePath);
    archived.push({ sourcePath, archivePath, proposalPath });
  }

  return archived;
}
