import { canonicalActorProfiles, getActorProfile } from "../npc/profiles.js";

function toScenarioPersona(profile: ReturnType<typeof getActorProfile>) {
  return {
    name: profile.display_name,
    summary: profile.social_archetype,
    goal: profile.private_goal
  };
}

// Scenario dialogue profiles provide concise social framing for transcript readability.
// They should not be treated as proof of social simulation by themselves.
export const mutualPersonas = Object.fromEntries(
  Object.entries(canonicalActorProfiles).map(([actorId, profile]) => [
    actorId,
    toScenarioPersona(profile)
  ])
) as Record<
  keyof typeof canonicalActorProfiles,
  {
    name: string;
    summary: string;
    goal: string;
  }
>;

/** Resolves known scenario dialogue profiles and deterministic fallbacks for extra bots. */
export function getScenarioPersona(actorId: string, index = 0) {
  return toScenarioPersona(getActorProfile(actorId, index));
}

export function buildScenarioPersonas(actorIds: readonly string[]) {
  return Object.fromEntries(actorIds.map((actorId, index) => [actorId, getScenarioPersona(actorId, index)]));
}
