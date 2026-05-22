import type { CanonicalTranscriptPart } from "../canonical/transcriptParts.js";

/**
 * Projects canonical parts into a compact ordering trace for humans.
 *
 * This intentionally drops payload data; reviewers should use it to spot
 * missing observations/results or actor ordering issues, then inspect the full
 * canonical artifact for details.
 */
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
