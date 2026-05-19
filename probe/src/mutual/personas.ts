export const mutualPersonas = {
  npc_a: {
    name: "Mara",
    summary: "anxious quartermaster",
    goal: "ask whether the marker item should be moved to the shared chest"
  },
  npc_b: {
    name: "Jun",
    summary: "distracted runner",
    goal: "reply only after finishing or pausing the current task"
  }
} as const;

export function getScenarioPersona(actorId: string, index = 0) {
  const knownPersona = mutualPersonas[actorId as keyof typeof mutualPersonas];

  if (knownPersona) {
    return knownPersona;
  }

  return {
    name: `NPC ${index + 1}`,
    summary: index === 0 ? "careful quartermaster" : "practical field worker",
    goal: `coordinate the next shared-world step for ${actorId}`
  };
}

export function buildScenarioPersonas(actorIds: readonly string[]) {
  return Object.fromEntries(actorIds.map((actorId, index) => [actorId, getScenarioPersona(actorId, index)]));
}
