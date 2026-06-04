import { createDialogueState } from "../runtime/dialogueState.js";

type DialogueState = ReturnType<typeof createDialogueState>;
type ChatActor = {
  username: string;
  chat(message: string): void;
};

export type SayResult =
  | { status: "busy"; actorId: string; targetId: string; reason: string }
  | { status: "unavailable"; actorId: string; targetId: string; reason: string }
  | { status: "delivered"; actorId: string; targetId: string; text: string };

type SayArgs = {
  actor: ChatActor;
  target?: ChatActor;
  dialogueState: DialogueState;
  text: string;
};

/**
 * Sends directed chat only after runtime dialogue availability allows it.
 *
 * The busy/unavailable result is returned as evidence so the loop can wait or
 * stop instead of pretending a social action happened.
 */
export async function say({
  actor,
  target,
  dialogueState,
  text
}: SayArgs): Promise<SayResult> {
  if (!target) {
    actor.chat(text);
    return {
      status: "delivered",
      actorId: actor.username,
      targetId: "world_chat",
      text
    };
  }

  const talkResult = dialogueState.requestTalk(actor.username, target.username);

  if (talkResult.status !== "available") {
    return {
      ...talkResult,
      actorId: actor.username,
      targetId: target.username
    };
  }

  actor.chat(text);

  return {
    status: "delivered",
    actorId: actor.username,
    targetId: target.username,
    text
  };
}
