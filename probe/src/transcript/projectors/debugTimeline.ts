import type { CanonicalTranscriptPart } from "../canonical/transcriptParts.js";

export function projectDebugTimeline(parts: CanonicalTranscriptPart[]) {
  return parts.map((part) => {
    switch (part.kind) {
      case "observation":
        return `${part.turn}:${part.actorId}:observation`;
      case "task":
        return `${part.turn}:${part.actorId}:task:${part.taskId}`;
      case "tool_call":
        return `${part.turn}:${part.actorId}:tool_call:${part.tool}`;
      case "tool_result":
        return `${part.turn}:${part.actorId}:tool_result:${part.tool}`;
      case "chat_utterance":
        return `${part.turn}:${part.actorId}:chat`;
      case "memory_update":
        return `${part.turn}:${part.actorId}:memory:${part.layer}`;
      case "checkpoint":
        return `${part.turn}:${part.actorId}:checkpoint`;
      case "turn_context":
        return `${part.turn}:${part.actorId}:turn_context`;
    }
  });
}
