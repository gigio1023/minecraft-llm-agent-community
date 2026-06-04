/**
 * Persistence for action skill proposal records.
 *
 * @remarks Proposals are candidate evidence only. They do not become runtime
 * action skill authority until trial and lifecycle promotion succeed.
 */
import path from "node:path";

import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../../runtime/actorWorkspacePaths.js";
import { writeJson } from "../../runtime/actorWorkspaceStore.js";
import type { ActionSkillProposalRecord } from "./types.js";

export async function writeActionSkillProposal(
  actorWorkspaceRootDir: string,
  proposal: ActionSkillProposalRecord
) {
  if (proposal.status !== "draft") {
    throw new Error("New action skill proposals must start as draft records");
  }

  const paths = getActorWorkspacePaths(actorWorkspaceRootDir, proposal.owner_actor_id);
  const filePath = path.join(
    paths.actionSkills.candidatesDir,
    `${sanitizeWorkspaceFileId(proposal.proposal_id)}.json`
  );
  await writeJson(filePath, proposal);
  return filePath;
}
