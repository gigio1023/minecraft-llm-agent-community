import type { DialogueObservation } from "./dialogueContext.js";
import type {
  CategoryVerdict,
  InteractionCategory,
  JsonObject,
  ToolResult,
  MutualActorId,
  MutualJsonValue,
  MutualStepRecord,
  Proposal
} from "./types.js";
import { validateProposal } from "./tools/index.js";
import { selectMutualPair } from "../runtime/actorRoster.js";

type LiveRuntimeActor = {
  username: string;
};

type LiveMutualLoopTools = {
  observe(actorId: MutualActorId): Promise<DialogueObservation> | DialogueObservation;
  execute(
    actorId: MutualActorId,
    proposal: Proposal,
    observation: DialogueObservation
  ): Promise<MutualJsonValue> | MutualJsonValue;
  lastResult(actorId: MutualActorId): ToolResult | null;
};

type LiveLoopProvider = {
  next(input: {
    observation: DialogueObservation;
    lastResult: ToolResult | null;
  }): Promise<Proposal> | Proposal;
};

type LiveMutualLoopCategories = {
  conversationTurnState: "passed" | "failed";
  movementAfterConversation: "passed" | "failed";
};

type LiveMutualLoopResult = {
  status: "success" | "failed";
  why: string;
  categories: LiveMutualLoopCategories;
};

type RunLiveMutualLoopArgs = {
  actors: Record<MutualActorId, LiveRuntimeActor>;
  providers: Record<MutualActorId, LiveLoopProvider>;
  tools: LiveMutualLoopTools;
  turnPlan?: MutualActorId[];
  minimumConversationTurns?: number;
};

type DeterministicMutualRuntimeActor = {
  username: string;
};

type DeterministicMutualProvider = {
  next(input: {
    observation?: Record<string, unknown>;
    lastResult: ToolResult | null;
  }): Promise<Proposal> | Proposal;
};

type RunDeterministicMutualLoopTools<TActor extends DeterministicMutualRuntimeActor> = {
  lastResult(actorId: MutualActorId): ToolResult | null;
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

type RunDeterministicMutualLoopArgs<TActor extends DeterministicMutualRuntimeActor> = {
  bots: Record<MutualActorId, TActor>;
  providers: Record<MutualActorId, DeterministicMutualProvider>;
  tools: RunDeterministicMutualLoopTools<TActor>;
  transcript: {
    recordStep(step: MutualStepRecord): void;
  };
};

type DeterministicMutualLoopResult = {
  status: "success" | "failed";
  why: string;
  categories: Record<InteractionCategory, CategoryVerdict>;
};

const DEFAULT_TURN_PLAN: MutualActorId[] = ["npc_a", "npc_b", "npc_a", "npc_b", "npc_a", "npc_b"];
const DEFAULT_MINIMUM_CONVERSATION_TURNS = 4;

function createCategories(
  conversationTurnState: LiveMutualLoopCategories["conversationTurnState"],
  movementAfterConversation: LiveMutualLoopCategories["movementAfterConversation"]
): LiveMutualLoopCategories {
  return {
    conversationTurnState,
    movementAfterConversation
  };
}

function failLive(why: string, categories: LiveMutualLoopCategories): LiveMutualLoopResult {
  return {
    status: "failed",
    why,
    categories
  };
}

function readResultStatus(result: MutualJsonValue) {
  if (
    typeof result !== "object" ||
    result === null ||
    Array.isArray(result) ||
    typeof result.status !== "string"
  ) {
    throw new Error("Mutual loop tool results must include a string status");
  }

  return result.status;
}

function deriveCategoryVerdicts(
  steps: readonly MutualStepRecord[]
): Record<InteractionCategory, CategoryVerdict> {
  // Category verdicts are artifact-level checks, not model self-reports. Each
  // pass condition requires a concrete recorded step or world-state change.
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

async function runLiveMutualLoop({
  actors,
  providers,
  tools,
  turnPlan = DEFAULT_TURN_PLAN,
  minimumConversationTurns = DEFAULT_MINIMUM_CONVERSATION_TURNS
}: RunLiveMutualLoopArgs): Promise<LiveMutualLoopResult> {
  let conversationTurns = 0;

  // The live loop intentionally demands several conversation turns before
  // movement so "social interaction" is not satisfied by immediate pathing.
  for (const actorId of turnPlan) {
    if (!actors[actorId]) {
      throw new Error(`Missing actor for turn: ${actorId}`);
    }

    const observation = await tools.observe(actorId);
    const proposal = await providers[actorId].next({
      observation,
      lastResult: tools.lastResult(actorId)
    });
    const validated = validateProposal(proposal);
    const result = await tools.execute(actorId, validated, observation);
    const status = readResultStatus(result);

    if (validated.tool === "converse") {
      conversationTurns += 1;
      continue;
    }

    if (validated.tool === "move_to") {
      if (conversationTurns >= minimumConversationTurns) {
        return {
          status: "success",
          why: `recorded ${conversationTurns} live dialogue turns before movement (${status})`,
          categories: createCategories("passed", "passed")
        };
      }

      return failLive(
        "movement started before the live dialogue sequence completed",
        createCategories("failed", "failed")
      );
    }

    if (conversationTurns < minimumConversationTurns) {
      return failLive(
        `${validated.tool} interrupted the live dialogue sequence after ${conversationTurns} turns`,
        createCategories("failed", "failed")
      );
    }
  }

  return failLive(
    `mutual loop exhausted the turn budget after ${conversationTurns} conversation turns`,
    createCategories(
      conversationTurns >= minimumConversationTurns ? "passed" : "failed",
      "failed"
    )
  );
}

async function runDeterministicMutualLoop<TActor extends DeterministicMutualRuntimeActor>({
  bots,
  providers,
  tools,
  transcript
}: RunDeterministicMutualLoopArgs<TActor>): Promise<DeterministicMutualLoopResult> {
  const [actorA, actorB] = selectMutualPair(Object.keys(bots));
  const turnPlan: MutualActorId[] = [
    actorA,
    actorA,
    actorA,
    actorB,
    actorA,
    actorB,
    actorA,
    actorB,
    actorB,
    actorA
  ];
  const recordedSteps: MutualStepRecord[] = [];

  // Deterministic mutual runs probe causal artifact shape: actor action, target
  // observation, and target response must line up in the transcript.
  for (const actorId of turnPlan) {
    const actor = bots[actorId];
    const targetId = actorId === actorA ? actorB : actorA;
    const target = bots[targetId];
    const observation = await tools.observe_world({ actorId, actor, targetId, target });
    const proposal = tools.validateProposal(
      await providers[actorId].next({
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

export function runMutualLoop(args: RunLiveMutualLoopArgs): Promise<LiveMutualLoopResult>;
export function runMutualLoop<TActor extends DeterministicMutualRuntimeActor>(
  args: RunDeterministicMutualLoopArgs<TActor>
): Promise<DeterministicMutualLoopResult>;
export async function runMutualLoop(
  args: RunLiveMutualLoopArgs | RunDeterministicMutualLoopArgs<DeterministicMutualRuntimeActor>
) {
  if ("actors" in args) {
    return runLiveMutualLoop(args);
  }

  return runDeterministicMutualLoop(args);
}
