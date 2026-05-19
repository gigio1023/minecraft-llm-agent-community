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
