import { allowedTools, type AllowedTool } from "../tools/index.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";

export type ActiveActionSkillGate = {
  actorId: string;
  activeSkillIds: string[];
  allowedPrimitives: AllowedTool[];
};

export type ActiveActionSkillPermission =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      reason: string;
      activeSkillIds: string[];
      allowedPrimitives: AllowedTool[];
    };

function assertKnownRuntimePrimitive(primitive: string): asserts primitive is AllowedTool {
  if (!allowedTools.includes(primitive as AllowedTool)) {
    throw new Error(`Active action skill references unknown runtime primitive: ${primitive}`);
  }
}

export function buildActiveActionSkillGate(input: {
  actorId: string;
  activeActionSkills: readonly ActorActionSkillRecord[];
}): ActiveActionSkillGate {
  const activeOwnedRecords = input.activeActionSkills.filter(
    (record) => record.owner_actor_id === input.actorId && record.status === "active"
  );

  if (activeOwnedRecords.length === 0) {
    throw new Error(`Actor ${input.actorId} has no active action skill records`);
  }

  const allowedPrimitives: AllowedTool[] = [];
  const seenPrimitives = new Set<string>();

  for (const record of activeOwnedRecords) {
    for (const primitive of record.required_primitives) {
      assertKnownRuntimePrimitive(primitive);

      if (!seenPrimitives.has(primitive)) {
        seenPrimitives.add(primitive);
        allowedPrimitives.push(primitive);
      }
    }
  }

  return {
    actorId: input.actorId,
    activeSkillIds: activeOwnedRecords.map((record) => record.skill_id),
    allowedPrimitives
  };
}

export function checkActiveActionSkillPermission(
  gate: ActiveActionSkillGate,
  tool: AllowedTool
): ActiveActionSkillPermission {
  if (gate.allowedPrimitives.includes(tool)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Primitive ${tool} is not backed by active action skills for ${gate.actorId}`,
    activeSkillIds: [...gate.activeSkillIds],
    allowedPrimitives: [...gate.allowedPrimitives]
  };
}
