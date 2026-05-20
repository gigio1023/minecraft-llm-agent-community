import type { RoleId } from "../npc/roles/contracts.js";
import { canRoleUseTool } from "../npc/roles/contracts.js";
import {
  listSeedActionSkills,
  type SeedActionSkillId
} from "../gameplay/seedSkills/registry.js";

export type ActionSkillSourceKind = "seed";
export type ActionSkillOwnershipStatus = "active" | "superseded" | "retired";

export type ActionSkillSupersession = {
  supersededBySkillId: string;
  reason: string;
} | null;

export type SeedActionSkillOwnershipRecord = {
  skill_id: SeedActionSkillId;
  owner_actor_id: string;
  source_kind: ActionSkillSourceKind;
  status: ActionSkillOwnershipStatus;
  supersession: ActionSkillSupersession;
};

export function assignSeedActionSkillOwnership(
  actorIds: readonly string[],
  actorRoles: Record<string, RoleId>
): SeedActionSkillOwnershipRecord[] {
  const records: SeedActionSkillOwnershipRecord[] = [];

  for (const actorId of actorIds) {
    const roleId = actorRoles[actorId];

    for (const actionSkill of listSeedActionSkills()) {
      // Ownership is a runtime contract, not a label: planned skills or skills
      // needing primitives outside the actor role stay unassigned.
      if (
        !roleId ||
        actionSkill.runtimeStatus !== "implemented" ||
        !actionSkill.validRoles.includes(roleId) ||
        !actionSkill.primitiveIds.every((primitiveId) => canRoleUseTool(roleId, primitiveId))
      ) {
        continue;
      }

      records.push({
        skill_id: actionSkill.id,
        owner_actor_id: actorId,
        source_kind: "seed",
        status: "active",
        supersession: null
      });
    }
  }

  return records;
}
