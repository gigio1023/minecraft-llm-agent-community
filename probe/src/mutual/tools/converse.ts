import { createMutualRuntimeState } from "../runtimeState.js";

type MutualRuntimeState = ReturnType<typeof createMutualRuntimeState>;

type ChatActor = {
  username: string;
  chat(message: string): void;
};

export type ConverseResult =
  | {
      status: "said_to_target";
      utterance: string;
      targetId: string;
    }
  | {
      status: "said_aloud";
      utterance: string;
    };

type ConverseArgs = {
  actor: ChatActor;
  runtimeState: MutualRuntimeState;
  utterance: string;
  targetId?: string;
};

export async function converse({
  actor,
  runtimeState,
  utterance,
  targetId
}: ConverseArgs): Promise<ConverseResult> {
  actor.chat(utterance);
  runtimeState.recordUtterance({
    actorId: actor.username,
    text: utterance,
    ...(targetId ? { targetId } : {})
  });

  if (targetId) {
    runtimeState.recordHeardMessage(targetId, {
      from: actor.username,
      text: utterance,
      targetId
    });

    return {
      status: "said_to_target",
      utterance,
      targetId
    };
  }

  return {
    status: "said_aloud",
    utterance
  };
}
