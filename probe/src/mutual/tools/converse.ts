import type { MutualRuntimeState } from "../runtimeState.js";

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

/**
 * Emits chat and records the social side effect in runtime state.
 *
 * Mineflayer chat alone is not enough for later turns; the heard-message queue
 * makes directed speech visible to the target actor's next observation.
 */
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
