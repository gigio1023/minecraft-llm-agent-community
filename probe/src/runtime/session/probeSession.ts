import type { Bot } from "mineflayer";

import type { RoleId } from "../../npc/roles/contracts.js";
import type { SeedActionSkillOwnershipRecord } from "../../skills/ownership.js";

export type ActorSession = {
  actor_id: string;
  username: string;
  role_id: RoleId;
};

export type ProbeSession = {
  actors: ActorSession[];
  seed_skill_ownership: SeedActionSkillOwnershipRecord[];
};

/**
 * Captures the actor/session identity that runtime artifacts should reference.
 *
 * Mineflayer usernames can differ from logical actor IDs in future reconnect or
 * provider-auth runs, so transcript and workspace code should read this session
 * contract instead of assuming the two identifiers are interchangeable.
 */
export function createProbeSession(input: {
  bots: Record<string, Bot>;
  actorIds: readonly string[];
  actorRoles: Record<string, RoleId>;
  seedActionSkillOwnership: readonly SeedActionSkillOwnershipRecord[];
}): ProbeSession {
  return {
    actors: input.actorIds.map((actorId) => ({
      actor_id: actorId,
      username: input.bots[actorId].username,
      role_id: input.actorRoles[actorId] ?? "gatherer"
    })),
    seed_skill_ownership: [...input.seedActionSkillOwnership]
  };
}
