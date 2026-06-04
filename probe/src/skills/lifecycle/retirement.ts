import fs from "node:fs/promises";

import {
  getActorActionSkillRecordPath,
  type ActorActionSkillStatusPath
} from "../../runtime/actorWorkspacePaths.js";
import {
  writeActorActionSkillRecord,
  type ActorActionSkillRecord
} from "../../runtime/actorWorkspaceStore.js";
import { transitionActionSkillStatus } from "./status.js";

export type RetireActionSkillInput = {
  actorWorkspaceRootDir: string;
  record: ActorActionSkillRecord;
  reason: string;
  evidence_refs: string[];
  retired_at?: string;
};

// Status records are stored in lifecycle-specific directories, so retiring an
// active/candidate record needs a write to retired plus removal from the old
// bucket.
async function removeStatusRecord(
  rootDir: string,
  actorId: string,
  status: ActorActionSkillStatusPath,
  skillId: string
) {
  await fs.rm(getActorActionSkillRecordPath(rootDir, actorId, status, skillId), {
    force: true
  });
}

function currentStatusPath(record: ActorActionSkillRecord): ActorActionSkillStatusPath {
  return record.status;
}

/**
 * Retires an actor-owned action skill while preserving the reason and evidence
 * in the replacement record.
 */
export async function retireActionSkill(input: RetireActionSkillInput) {
  const transition = transitionActionSkillStatus(input.record.status, "retired");

  if (!transition.ok) {
    throw new Error(transition.reason);
  }

  const retiredRecord: ActorActionSkillRecord = {
    ...input.record,
    status: "retired",
    updated_at: input.retired_at ?? new Date().toISOString(),
    known_failure_modes: [
      ...input.record.known_failure_modes,
      `retired:${input.reason}`
    ],
    evidence_refs: [...input.record.evidence_refs, ...input.evidence_refs],
    notes: `${input.record.notes ?? ""}\nRetired: ${input.reason}`.trim()
  };
  const retiredPath = await writeActorActionSkillRecord(
    input.actorWorkspaceRootDir,
    retiredRecord
  );

  if (input.record.status !== "retired" && input.record.status !== "superseded") {
    await removeStatusRecord(
      input.actorWorkspaceRootDir,
      input.record.owner_actor_id,
      currentStatusPath(input.record),
      input.record.skill_id
    );
  }

  return retiredPath;
}
