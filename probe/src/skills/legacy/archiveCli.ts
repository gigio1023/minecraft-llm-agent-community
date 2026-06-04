/**
 * CLI for archiving legacy generated action skill files.
 *
 * @remarks Archival keeps old exploratory output visible without treating it as
 * current actor workspace memory or executable authority.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadProbeConfig } from "../../config.js";
import { normalizeActorIds } from "../../runtime/actorRoster.js";
import { archiveLegacyGeneratedSkills } from "./archiveGeneratedSkills.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const config = loadProbeConfig();
  const actorId = process.argv[2] ?? normalizeActorIds(config.bots)[0];
  const generatedSkillsDir = path.resolve(here, "../../../../build/generated-skills");
  const archiveDir = path.resolve(here, "../../../../build/generated-skills-archive");
  const archived = await archiveLegacyGeneratedSkills({
    generatedSkillsDir,
    archiveDir,
    actorWorkspaceRootDir: config.actorWorkspace.rootDir,
    actorId
  });

  console.log(
    JSON.stringify(
      {
        schema: "legacy-generated-action-skill-archive/v1",
        actorId,
        generatedSkillsDir,
        archiveDir,
        archived
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
