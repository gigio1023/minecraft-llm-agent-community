import type { RoleId } from "../roles/contracts.js";

export type BulletinEntry = {
  actorId: string;
  roleId: RoleId;
  currentTask?: string;
  lastContribution?: string;
  currentBlocker?: string;
  resourceNeeds?: string[];
  chestId?: string;
  updatedAt: number;
};

export function createTeamBulletin() {
  const entries = new Map<string, BulletinEntry>();

  return {
    update(entry: BulletinEntry) {
      entries.set(entry.actorId, {
        ...entry,
        ...(entry.resourceNeeds ? { resourceNeeds: [...entry.resourceNeeds] } : {})
      });
    },
    visibleTo(actorId: string) {
      return [...entries.values()]
        .filter((entry) => entry.actorId !== actorId)
        .sort((left, right) => left.updatedAt - right.updatedAt)
        .map((entry) => ({
          ...entry,
          ...(entry.resourceNeeds ? { resourceNeeds: [...entry.resourceNeeds] } : {})
        }));
    },
    snapshot() {
      return [...entries.values()]
        .sort((left, right) => left.updatedAt - right.updatedAt)
        .map((entry) => ({
          ...entry,
          ...(entry.resourceNeeds ? { resourceNeeds: [...entry.resourceNeeds] } : {})
        }));
    }
  };
}
