type DialogueContextInput = {
  actorId: string;
  allowedTools: string[];
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
      allowedTools: input.allowedTools,
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  });
}
