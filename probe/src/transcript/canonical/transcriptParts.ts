export type CanonicalJsonValue =
  | string
  | number
  | boolean
  | null
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

/**
 * Canonical transcript events are the replay/evidence source.
 *
 * Derived debug timelines and compact artifacts may project these parts, but
 * should not replace them as the source of runtime truth.
 */
export type CanonicalTranscriptPart =
  | {
      kind: "observation";
      threadId: string;
      turn: number;
      actorId: string;
      data: CanonicalJsonValue;
    }
  | {
      kind: "task";
      threadId: string;
      turn: number;
      actorId: string;
      taskId: string;
      data: CanonicalJsonValue;
    }
  | {
      kind: "tool_call";
      threadId: string;
      turn: number;
      actorId: string;
      tool: string;
      args: CanonicalJsonValue;
    }
  | {
      kind: "tool_result";
      threadId: string;
      turn: number;
      actorId: string;
      tool: string;
      result: CanonicalJsonValue;
    }
  | {
      kind: "chat_utterance";
      threadId: string;
      turn: number;
      actorId: string;
      text: string;
    }
  | {
      kind: "memory_update";
      threadId: string;
      turn: number;
      actorId: string;
      layer: "private_episodic" | "shared_settlement" | "working_memory";
      data: CanonicalJsonValue;
    }
  | {
      kind: "checkpoint";
      threadId: string;
      turn: number;
      actorId: string;
      summary: CanonicalJsonValue;
    }
  | {
      kind: "turn_context";
      threadId: string;
      turn: number;
      actorId: string;
      data: CanonicalJsonValue;
    };

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Append-only canonical transcript buffer.
 *
 * All reads and writes clone data because transcript parts are runtime
 * evidence, not mutable prompt context. A projector can derive timelines,
 * checkpoints, or compact views without changing the original event stream.
 */
export function createCanonicalTranscript() {
  const parts: CanonicalTranscriptPart[] = [];

  return {
    append(part: CanonicalTranscriptPart) {
      parts.push(snapshot(part));
    },
    list(threadId?: string) {
      const filtered = threadId ? parts.filter((part) => part.threadId === threadId) : parts;
      return filtered.map((part) => snapshot(part));
    }
  };
}
