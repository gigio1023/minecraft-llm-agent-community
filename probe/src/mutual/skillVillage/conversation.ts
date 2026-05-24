import { actors } from "./actors.js";
import type { ActorId, CodexInputMessage } from "./types.js";

const maxMessagesPerActor = 12;

export const llmConversations: Record<ActorId, CodexInputMessage[]> = {
  npc_a: [],
  npc_b: [],
  npc_c: []
};

/**
 * Builds the actor-specific prompt history for the exploratory live loop.
 *
 * Histories are kept per actor so generated action skills do not collapse all
 * actors into one shared model conversation.
 */
export function buildActorInput(actorId: ActorId, nextMessage: string) {
  return [
    ...llmConversations[actorId],
    {
      role: "user" as const,
      content: [{ type: "input_text" as const, text: nextMessage }]
    }
  ];
}

export function rememberActorExchange(actorId: ActorId, userMessage: string, assistantOutput: string) {
  llmConversations[actorId].push(
    {
      role: "user",
      content: [{ type: "input_text", text: userMessage }]
    },
    {
      role: "assistant",
      content: [{ type: "output_text", text: assistantOutput }]
    }
  );
  // Keep only the recent tail; durable evidence is in memory/transcript files.
  llmConversations[actorId] = llmConversations[actorId].slice(-maxMessagesPerActor);
}

export function rememberActorFeedback(actorId: ActorId, feedback: string) {
  llmConversations[actorId].push({
    role: "user",
    content: [{ type: "input_text", text: feedback }]
  });
  llmConversations[actorId] = llmConversations[actorId].slice(-maxMessagesPerActor);
}

export function resetActorConversations() {
  for (const actorId of actors) {
    llmConversations[actorId] = [];
  }
}
