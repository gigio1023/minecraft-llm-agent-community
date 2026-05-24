import type { RoleId } from "../npc/roles/contracts.js";

export const MIN_ACTOR_COUNT = 1;
export const MAX_ACTOR_COUNT = 4;

const DEFAULT_ACTOR_IDS = ["npc_a", "npc_b", "npc_c", "npc_d"] as const;
const DEFAULT_ROLE_ORDER: RoleId[] = ["quartermaster", "gatherer", "crafter", "gatherer"];

function assertActorId(actorId: string) {
  if (typeof actorId !== "string" || actorId.trim().length === 0) {
    throw new Error("Actor IDs must be non-empty strings");
  }
}

/**
 * Normalizes the active actor roster for probe runs.
 *
 * The bounds keep early runtime evidence readable: enough actors for mutual
 * behavior, but not enough to hide single-actor competence failures in crowd noise.
 */
export function normalizeActorIds(actorIds?: readonly string[]) {
  const resolved = (actorIds && actorIds.length > 0 ? [...actorIds] : [...DEFAULT_ACTOR_IDS.slice(0, 2)])
    .map((actorId) => actorId.trim());

  if (resolved.length < MIN_ACTOR_COUNT || resolved.length > MAX_ACTOR_COUNT) {
    throw new Error(`Actor roster must contain between ${MIN_ACTOR_COUNT} and ${MAX_ACTOR_COUNT} actors`);
  }

  for (const actorId of resolved) {
    assertActorId(actorId);
  }

  if (new Set(resolved).size !== resolved.length) {
    throw new Error("Actor roster must not contain duplicate NPC IDs");
  }

  return resolved;
}

export function defaultActorRoles(actorIds: readonly string[]) {
  // Role assignment is deterministic so action skill ownership and transcript
  // review do not depend on provider output or object key ordering.
  return Object.fromEntries(
    normalizeActorIds(actorIds).map((actorId, index) => [
      actorId,
      DEFAULT_ROLE_ORDER[index] ?? DEFAULT_ROLE_ORDER[DEFAULT_ROLE_ORDER.length - 1]
    ])
  ) as Record<string, RoleId>;
}

export function selectPrimaryActorId(actorIds: readonly string[]) {
  return normalizeActorIds(actorIds)[0];
}

export function selectPrimaryTargetId(actorIds: readonly string[], actorId?: string) {
  const normalized = normalizeActorIds(actorIds);
  const resolvedActorId = actorId ?? normalized[0];
  return normalized.find((candidate) => candidate !== resolvedActorId) ?? resolvedActorId;
}

export function selectMutualPair(actorIds: readonly string[]) {
  const normalized = normalizeActorIds(actorIds);

  if (normalized.length < 2) {
    throw new Error("Mutual interaction probes require at least two actors");
  }

  return [normalized[0], normalized[1]] as const;
}
