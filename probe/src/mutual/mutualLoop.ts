import type {
  CategoryVerdict,
  InteractionCategory,
  JsonObject,
  LastResult,
  MutualActorId,
  MutualStepRecord,
  Proposal
} from "./types.js";

type MutualRuntimeActor = {
  username: string;
};

type MutualProvider = {
  next(input: { observation?: Record<string, unknown>; lastResult: LastResult | null }): Proposal;
};

type RunMutualLoopTools<TActor extends MutualRuntimeActor> = {
  lastResult(actorId: MutualActorId): LastResult | null;
  validateProposal(proposal: Proposal): Proposal;
  observe_world(input: {
    actorId: MutualActorId;
    actor: TActor;
    targetId: MutualActorId;
    target: TActor;
  }): Promise<JsonObject> | JsonObject;
  execute(input: {
    actorId: MutualActorId;
    actor: TActor;
    targetId: MutualActorId;
    target: TActor;
    proposal: Proposal;
    observation: JsonObject;
  }): Promise<MutualStepRecord> | MutualStepRecord;
};

type RunMutualLoopArgs<TActor extends MutualRuntimeActor> = {
  bots: Record<MutualActorId, TActor>;
  providers: Record<MutualActorId, MutualProvider>;
  tools: RunMutualLoopTools<TActor>;
  transcript: {
    recordStep(step: MutualStepRecord): void;
  };
};

type MutualLoopResult = {
  status: "success" | "failed";
  why: string;
  categories: Record<InteractionCategory, CategoryVerdict>;
};

function deriveCategoryVerdicts(
  steps: readonly MutualStepRecord[]
): Record<InteractionCategory, CategoryVerdict> {
  const conversationTurnState = steps.some(
    (step) =>
      step.category === "conversationTurnState" &&
      step.targetResponse?.tool === "reply_to"
  )
    ? "passed"
    : "failed";

  const spatialAttentionApproach = steps.some(
    (step) =>
      step.category === "spatialAttentionApproach" &&
      step.worldStateChange?.arrived === true
  )
    ? "passed"
    : "failed";

  const droppedMarker = steps.some(
    (step) =>
      step.category === "materialEnvironmentHandoff" &&
      step.actorAction.tool === "drop_item" &&
      step.worldStateChange?.itemName === "paper"
  );
  const observedMarker = steps.some(
    (step) =>
      step.category === "materialEnvironmentHandoff" &&
      step.targetObservation?.markerEntitySeen === true
  );
  const repliedAfterMarker = steps.some(
    (step) =>
      step.category === "materialEnvironmentHandoff" &&
      step.targetResponse?.tool === "reply_to" &&
      step.causedNext?.actor === "npc_b"
  );

  return {
    conversationTurnState,
    spatialAttentionApproach,
    materialEnvironmentHandoff:
      droppedMarker && observedMarker && repliedAfterMarker ? "passed" : "failed"
  };
}

export async function runMutualLoop<TActor extends MutualRuntimeActor>({
  bots,
  providers,
  tools,
  transcript
}: RunMutualLoopArgs<TActor>): Promise<MutualLoopResult> {
  const turnPlan: MutualActorId[] = [
    "npc_a",
    "npc_a",
    "npc_a",
    "npc_b",
    "npc_a",
    "npc_b",
    "npc_a",
    "npc_b",
    "npc_b",
    "npc_a"
  ];
  const recordedSteps: MutualStepRecord[] = [];

  for (const actorId of turnPlan) {
    const actor = bots[actorId];
    const targetId = actorId === "npc_a" ? "npc_b" : "npc_a";
    const target = bots[targetId];
    const observation = await tools.observe_world({ actorId, actor, targetId, target });
    const proposal = tools.validateProposal(
      providers[actorId].next({
        observation,
        lastResult: tools.lastResult(actorId)
      })
    );
    const step = await tools.execute({
      actorId,
      actor,
      targetId,
      target,
      proposal,
      observation
    });
    recordedSteps.push(step);
    transcript.recordStep(step);
  }

  const categories = deriveCategoryVerdicts(recordedSteps);
  const status = Object.values(categories).every((value) => value === "passed")
    ? "success"
    : "failed";

  return {
    status,
    why:
      status === "success"
        ? "both NPCs responded to each other's dialogue and world actions"
        : "one or more interaction categories did not reach acceptance",
    categories
  };
}
