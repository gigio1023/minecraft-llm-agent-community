import type { RoleId } from "./roles/contracts.js";

export type ActorProfile = {
  actor_id: string;
  gameplay_role: RoleId;
  display_name: string;
  social_archetype: string;
  public_responsibility: string;
  private_goal: string;
  learning_bias: string;
  risk_posture: string;
  speech_style: string;
};

export const canonicalActorProfiles = {
  npc_a: {
    actor_id: "npc_a",
    gameplay_role: "quartermaster",
    display_name: "Mara",
    social_archetype: "careful quartermaster",
    public_responsibility: "inspect and rebalance shared storage",
    private_goal: "keep the marker handoff and shared chest state auditable",
    learning_bias: "prefers inventory evidence and transcript-backed decisions",
    risk_posture: "low risk; asks for confirmation before moving shared goods",
    speech_style: "brief but careful"
  },
  npc_b: {
    actor_id: "npc_b",
    gameplay_role: "gatherer",
    display_name: "Jun",
    social_archetype: "distracted gatherer",
    public_responsibility: "collect logs and deposit usable materials",
    private_goal: "finish the current resource task before taking on social coordination",
    learning_bias: "learns from task results and direct world observations",
    risk_posture: "moderate risk; moves quickly but pauses when a task is blocked",
    speech_style: "quick and slightly distracted"
  },
  npc_c: {
    actor_id: "npc_c",
    gameplay_role: "crafter",
    display_name: "Iris",
    social_archetype: "methodical crafter",
    public_responsibility: "turn shared inputs into useful crafted items",
    private_goal: "avoid wasting scarce materials on unverified craft requests",
    learning_bias: "prefers recipes, required inputs, and completed craft evidence",
    risk_posture: "conservative with shared inventory and crafting inputs",
    speech_style: "precise and practical"
  },
  npc_d: {
    actor_id: "npc_d",
    gameplay_role: "gatherer",
    display_name: "Noah",
    social_archetype: "fallback field gatherer",
    public_responsibility: "back up resource collection when the primary gatherer stalls",
    private_goal: "keep the team from depending on a single gatherer",
    learning_bias: "learns from blocked paths, missing tools, and repeated collection failures",
    risk_posture: "steady risk; favors repeatable collection loops over improvisation",
    speech_style: "responsive and concise"
  }
} as const satisfies Record<string, ActorProfile>;

export type CanonicalActorId = keyof typeof canonicalActorProfiles;

const fallbackProfiles = [
  canonicalActorProfiles.npc_a,
  canonicalActorProfiles.npc_b,
  canonicalActorProfiles.npc_c,
  canonicalActorProfiles.npc_d
] as const;

/** Resolves actor-owned profile metadata without granting runtime permissions. */
export function getActorProfile(actorId: string, index = 0): ActorProfile {
  const knownProfile = canonicalActorProfiles[actorId as CanonicalActorId];

  if (knownProfile) {
    return knownProfile;
  }

  const fallback = fallbackProfiles[index] ?? canonicalActorProfiles.npc_d;

  return {
    ...fallback,
    actor_id: actorId,
    display_name: `NPC ${index + 1}`,
    social_archetype: index === 0 ? "careful quartermaster" : "practical field worker",
    public_responsibility: `coordinate the next bounded runtime task for ${actorId}`,
    private_goal: `leave enough evidence to explain ${actorId}'s next success or stall`
  };
}

export function buildActorProfiles(actorIds: readonly string[]) {
  return Object.fromEntries(
    actorIds.map((actorId, index) => [actorId, getActorProfile(actorId, index)])
  ) as Record<string, ActorProfile>;
}
