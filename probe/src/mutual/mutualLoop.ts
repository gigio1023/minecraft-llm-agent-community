import type { DialogueObservation, MutualActorId } from "./dialogueContext.js";
import type { Proposal, MutualJsonValue } from "./types.js";
import { validateProposal } from "./tools/index.js";

type LastResult = {
  tool: string;
  status: string;
};

type RuntimeActor = {
  username: string;
};

type MutualLoopTools = {
  observe(actorId: MutualActorId): Promise<DialogueObservation> | DialogueObservation;
  execute(
    actorId: MutualActorId,
    proposal: Proposal,
    observation: DialogueObservation
  ): Promise<MutualJsonValue> | MutualJsonValue;
  lastResult(actorId: MutualActorId): LastResult | null;
};

type LoopProvider = {
  next(input: {
    observation: DialogueObservation;
    lastResult: LastResult | null;
  }): Promise<Proposal> | Proposal;
};

type MutualLoopCategories = {
  conversationTurnState: "passed" | "failed";
  movementAfterConversation: "passed" | "failed";
};

type MutualLoopResult = {
  status: "success" | "failed";
  why: string;
  categories: MutualLoopCategories;
};

type RunMutualLoopArgs = {
  actors: Record<MutualActorId, RuntimeActor>;
  providers: Record<MutualActorId, LoopProvider>;
  tools: MutualLoopTools;
  turnPlan?: MutualActorId[];
  minimumConversationTurns?: number;
};

const DEFAULT_TURN_PLAN: MutualActorId[] = ["npc_a", "npc_b", "npc_a", "npc_b", "npc_a", "npc_b"];
const DEFAULT_MINIMUM_CONVERSATION_TURNS = 4;

function createCategories(
  conversationTurnState: MutualLoopCategories["conversationTurnState"],
  movementAfterConversation: MutualLoopCategories["movementAfterConversation"]
): MutualLoopCategories {
  return {
    conversationTurnState,
    movementAfterConversation
  };
}

function fail(why: string, categories: MutualLoopCategories): MutualLoopResult {
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

export async function runMutualLoop({
  actors,
  providers,
  tools,
  turnPlan = DEFAULT_TURN_PLAN,
  minimumConversationTurns = DEFAULT_MINIMUM_CONVERSATION_TURNS
}: RunMutualLoopArgs): Promise<MutualLoopResult> {
  let conversationTurns = 0;

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

      return fail("movement started before the live dialogue sequence completed", createCategories("failed", "failed"));
    }

    if (conversationTurns < minimumConversationTurns) {
      return fail(
        `${validated.tool} interrupted the live dialogue sequence after ${conversationTurns} turns`,
        createCategories("failed", "failed")
      );
    }
  }

  return fail(
    `mutual loop exhausted the turn budget after ${conversationTurns} conversation turns`,
    createCategories(
      conversationTurns >= minimumConversationTurns ? "passed" : "failed",
      "failed"
    )
  );
}
