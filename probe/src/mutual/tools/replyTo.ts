import type { MutualActorId } from "../types.js";

type ReplyToArgs = {
  actor: {
    username: string;
    chat(message: string): void;
  };
  source: {
    username: string;
  };
  runtimeState: {
    requestReply(actor: MutualActorId, target: MutualActorId):
      | { status: "busy"; reason: string }
      | { status: "available" }
      | { status: "unavailable"; reason: string };
    recordHeardMessage(target: MutualActorId, message: { from: MutualActorId; text: string }): void;
  };
  text: string;
};

export async function replyTo({
  actor,
  source,
  runtimeState,
  text
}: ReplyToArgs) {
  const replyState = runtimeState.requestReply(
    actor.username as MutualActorId,
    source.username as MutualActorId
  );

  actor.chat(text);
  runtimeState.recordHeardMessage(source.username as MutualActorId, {
    from: actor.username as MutualActorId,
    text
  });

  if (replyState.status === "busy") {
    return {
      status: "busy_reply" as const,
      reason: replyState.reason
    };
  }

  if (replyState.status === "unavailable") {
    return {
      status: "unavailable" as const,
      reason: replyState.reason
    };
  }

  return {
    status: "replied" as const,
    text
  };
}
