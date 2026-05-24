import type { IntentKind, LifecycleMode } from "./pressureIntent.js";
import type { RoleId } from "../npc/roles/contracts.js";
import { canRoleUseTool } from "../npc/roles/contracts.js";
import { listSeedActionSkills, type SeedActionSkill, type SeedActionSkillId } from "../gameplay/seedSkills/registry.js";

export type ActionSkillCandidate = {
  id: SeedActionSkillId;
  summary: string;
  intentKinds: IntentKind[];
  validRoles: RoleId[];
  preconditionSummary: string[];
};

// Lifecycle gates keep recovery/danger modes from offering high-agency action
// skills before the runtime has enough state to verify them safely.
const BOOTSTRAP_ACTION_SKILLS: ReadonlySet<SeedActionSkillId> = new Set([
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

const RECOVERY_ACTION_SKILLS: ReadonlySet<SeedActionSkillId> = new Set([
  "collectLogs",
  "craftPlanksAndSticks",
  "craftCraftingTable",
  "craftWoodenPickaxe",
  "collectDroppedItems",
  "inspectSharedChest"
]);

function isActionSkillAllowedInLifecycle(actionSkillId: SeedActionSkillId, mode: LifecycleMode): boolean {
  switch (mode) {
    case "bootstrap":
      return BOOTSTRAP_ACTION_SKILLS.has(actionSkillId);
    case "recovery":
      return RECOVERY_ACTION_SKILLS.has(actionSkillId);
    case "danger":
      return (
        actionSkillId === "collectDroppedItems" ||
        actionSkillId === "attackThenRetreat" ||
        actionSkillId === "patrolArea"
      );
    default:
      return true;
  }
}

function canRoleUseActionSkill(roleId: RoleId, actionSkill: SeedActionSkill): boolean {
  // Empty validRoles is reserved for hostile/runtime-only action skills, so
  // regular actors cannot acquire them through prompt-side intent compilation.
  if (actionSkill.validRoles.length === 0) {
    return false;
  }

  if (!actionSkill.validRoles.includes(roleId)) {
    return false;
  }

  // The action-skill declaration and the role primitive contract must both
  // agree; this prevents a bundled skill from bypassing role ownership rules.
  return actionSkill.primitiveIds.every((primitiveId) => canRoleUseTool(roleId, primitiveId));
}

export type CompileActionSkillCandidatesInput = {
  intentKind: IntentKind;
  roleId: RoleId;
  lifecycleMode: LifecycleMode;
};

export function compileActionSkillCandidates({
  intentKind,
  roleId,
  lifecycleMode
}: CompileActionSkillCandidatesInput): ActionSkillCandidate[] {
  const allActionSkills = listSeedActionSkills();

  return allActionSkills
    .filter((actionSkill) => {
      if (actionSkill.runtimeStatus !== "implemented") {
        return false;
      }

      if (!actionSkill.intentKinds.includes(intentKind)) {
        return false;
      }

      if (!isActionSkillAllowedInLifecycle(actionSkill.id, lifecycleMode)) {
        return false;
      }

      if (!canRoleUseActionSkill(roleId, actionSkill)) {
        return false;
      }

      return true;
    })
    .map((actionSkill) => ({
      id: actionSkill.id,
      summary: actionSkill.summary,
      intentKinds: [...actionSkill.intentKinds],
      validRoles: [...actionSkill.validRoles],
      preconditionSummary: [...actionSkill.preconditions]
    }));
}

/** Maps intent/lifecycle/role to primitive allowlist; reused by social-cycle context assembly. */
export function compileAllowedPrimitiveIds({
  intentKind,
  roleId,
  lifecycleMode
}: CompileActionSkillCandidatesInput): string[] {
  const candidates = compileActionSkillCandidates({ intentKind, roleId, lifecycleMode });
  const primitiveIds = new Set<string>();

  for (const candidate of candidates) {
    const actionSkill = listSeedActionSkills().find((s) => s.id === candidate.id);

    if (actionSkill) {
      for (const primitiveId of actionSkill.primitiveIds) {
        primitiveIds.add(primitiveId);
      }
    }
  }

  // These primitives are runtime control valves: observe refreshes evidence,
  // wait avoids forced fake action, and remember emits terminal/status notes.
  primitiveIds.add("observe");
  primitiveIds.add("wait");
  primitiveIds.add("remember");

  return [...primitiveIds];
}
