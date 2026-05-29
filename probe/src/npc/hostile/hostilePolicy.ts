import { hostileRoleContract } from "./hostileRoleContract.js";

export type HostilePolicyInput = {
  actorRole: "hostile" | "gatherer" | "crafter" | "quartermaster";
  targetId?: string;
  targetDistance?: number;
  homeDistance: number;
  engagementTicks: number;
  health: number;
  allowedTargetIds: string[];
};

export type HostileDecision =
  | { action: "move_to"; targetId: string }
  | { action: "retreat"; reason: string }
  | { action: "wait"; reason: string }
  | { action: "blocked"; reason: string };

export function decideHostileAction(input: HostilePolicyInput): HostileDecision {
  if (input.actorRole !== "hostile") {
    return { action: "blocked", reason: "only the hostile role can use hostile policy" };
  }

  if (!input.targetId || !input.allowedTargetIds.includes(input.targetId)) {
    return { action: "wait", reason: "no valid hostile target is available" };
  }

  // Hostile behavior is deliberately leashed; this branch prevents a social
  // stressor from becoming open-ended pursuit or combat autonomy.
  if (input.homeDistance > hostileRoleContract.homeRadius) {
    return { action: "retreat", reason: "hostile actor exceeded its home radius" };
  }

  if (input.engagementTicks >= hostileRoleContract.maxEngagementTicks) {
    return { action: "retreat", reason: "hostile engagement timeout reached" };
  }

  if (input.health <= hostileRoleContract.retreatHealthThreshold) {
    return { action: "retreat", reason: "hostile actor is below retreat health threshold" };
  }

  if ((input.targetDistance ?? Number.POSITIVE_INFINITY) > hostileRoleContract.homeRadius) {
    return { action: "wait", reason: "target is outside the hostile chase leash" };
  }

  return { action: "move_to", targetId: input.targetId };
}
