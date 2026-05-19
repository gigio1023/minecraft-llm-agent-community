import type { IntentKind, LifecycleMode } from "./pressureIntent.js";
import type { RoleId } from "../npc/roles/contracts.js";
import { canRoleUseTool } from "../npc/roles/contracts.js";
import { listSeedSkills, type SeedSkill, type SeedSkillId } from "../gameplay/seedSkills/registry.js";

// ---------------------------------------------------------------------------
// Skill Candidate (what the runtime offers to the LLM for a given intent)
// ---------------------------------------------------------------------------

export type SkillCandidate = {
  id: SeedSkillId;
  summary: string;
  intentKinds: IntentKind[];
  validRoles: RoleId[];
  preconditionSummary: string[];
};

// ---------------------------------------------------------------------------
// Lifecycle-based skill gating
// ---------------------------------------------------------------------------

const BOOTSTRAP_SKILLS: ReadonlySet<SeedSkillId> = new Set([
  "collectLogs",
  "craftPlanksAndSticks",
  "craftCraftingTable",
  "craftWoodenPickaxe",
  "mineCobblestone",
  "craftStonePickaxe",
  "craftFurnace",
  "inspectSharedChest",
  "depositSharedItems",
  "collectDroppedItems"
]);

const RECOVERY_SKILLS: ReadonlySet<SeedSkillId> = new Set([
  "collectLogs",
  "craftPlanksAndSticks",
  "craftCraftingTable",
  "craftWoodenPickaxe",
  "collectDroppedItems",
  "inspectSharedChest"
]);

function isSkillAllowedInLifecycle(skillId: SeedSkillId, mode: LifecycleMode): boolean {
  switch (mode) {
    case "bootstrap":
      return BOOTSTRAP_SKILLS.has(skillId);
    case "recovery":
      return RECOVERY_SKILLS.has(skillId);
    case "danger":
      return skillId === "collectDroppedItems" || skillId === "attackThenRetreat" || skillId === "patrolArea";
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Role-based primitive filtering
// ---------------------------------------------------------------------------

function canRoleUseSkill(roleId: RoleId, skill: SeedSkill): boolean {
  // Hostile skills have empty validRoles - they are only for hostile role
  if (skill.validRoles.length === 0) {
    return false;
  }

  // Check role is in valid roles list
  if (!skill.validRoles.includes(roleId)) {
    return false;
  }

  // Check all primitives are allowed for this role
  return skill.primitiveIds.every((primitiveId) => canRoleUseTool(roleId, primitiveId));
}

// ---------------------------------------------------------------------------
// Intent-to-Skill Compilation
// ---------------------------------------------------------------------------

export type CompileSkillCandidatesInput = {
  intentKind: IntentKind;
  roleId: RoleId;
  lifecycleMode: LifecycleMode;
};

export function compileSkillCandidates({
  intentKind,
  roleId,
  lifecycleMode
}: CompileSkillCandidatesInput): SkillCandidate[] {
  const allSkills = listSeedSkills();

  return allSkills
    .filter((skill) => {
      // Must match the intent
      if (!skill.intentKinds.includes(intentKind)) {
        return false;
      }

      // Must be allowed in this lifecycle mode
      if (!isSkillAllowedInLifecycle(skill.id, lifecycleMode)) {
        return false;
      }

      // Must be executable by this role
      if (!canRoleUseSkill(roleId, skill)) {
        return false;
      }

      return true;
    })
    .map((skill) => ({
      id: skill.id,
      summary: skill.summary,
      intentKinds: [...skill.intentKinds],
      validRoles: [...skill.validRoles],
      preconditionSummary: [...skill.preconditions]
    }));
}

export function compileAllowedPrimitiveIds({
  intentKind,
  roleId,
  lifecycleMode
}: CompileSkillCandidatesInput): string[] {
  const candidates = compileSkillCandidates({ intentKind, roleId, lifecycleMode });
  const primitiveIds = new Set<string>();

  for (const candidate of candidates) {
    const skill = listSeedSkills().find((s) => s.id === candidate.id);

    if (skill) {
      for (const primitiveId of skill.primitiveIds) {
        primitiveIds.add(primitiveId);
      }
    }
  }

  // Always allow observe, wait, remember
  primitiveIds.add("observe");
  primitiveIds.add("wait");
  primitiveIds.add("remember");

  return [...primitiveIds];
}
