const allowedTools = [
  "converse",
  "observe_world",
  "move_to",
  "wait",
  "remember",
  "drop_item"
] as const;

type DialogueContextInput = {
  actorId: string;
  persona: unknown;
  observation: unknown;
  memory: string[];
  recentTranscript: unknown[];
};

export function buildDialogueContext(input: DialogueContextInput) {
  return structuredClone({
    actorId: input.actorId,
    persona: input.persona,
    observation: input.observation,
    memory: input.memory,
    recentTranscript: input.recentTranscript,
    rules: {
      oneToolPerTurn: true,
      allowedTools: [...allowedTools],
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  });
}
