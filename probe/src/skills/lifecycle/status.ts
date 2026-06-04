/**
 * Allowed status transitions for actor-owned action skills.
 *
 * @remarks Lifecycle transitions protect runtime authority from jumping directly
 * from draft or rejected records into active execution.
 */
import type { ActorActionSkillStatus } from "../../runtime/actorWorkspaceStore.js";

const allowedTransitions = new Set<string>([
  "draft->candidate",
  "candidate->active",
  "candidate->rejected",
  "candidate->retired",
  "active->superseded",
  "active->retired",
  "superseded->retired"
]);

export function transitionActionSkillStatus(
  from: ActorActionSkillStatus,
  to: ActorActionSkillStatus
) {
  if (from === to || allowedTransitions.has(`${from}->${to}`)) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    reason: `Cannot transition action skill from ${from} to ${to}`
  };
}
