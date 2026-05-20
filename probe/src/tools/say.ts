import { createDialogueState } from "../runtime/dialogueState.js";

type DialogueState = ReturnType<typeof createDialogueState>;
type ChatActor = {
  username: string;
  chat(message: string): void;
};

export type SayResult =
  | { status: "busy"; reason: string }
  | { status: "unavailable"; reason: string }
  | { status: "delivered" };

type SayArgs = {
  actor: ChatActor;
  target: ChatActor;
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
  const talkResult = dialogueState.requestTalk(actor.username, target.username);

  if (talkResult.status !== "available") {
    return talkResult;
  }

  actor.chat(text);

  return { status: "delivered" };
}
