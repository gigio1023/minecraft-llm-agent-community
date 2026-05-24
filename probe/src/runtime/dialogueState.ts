type DialogueAvailability = "busy" | "available" | "unavailable";

type DialogueStateOptions = {
  busyRepliesBeforeAvailable: number;
};

type TalkResult =
  | { status: "busy"; reason: string }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

/**
 * Owns deterministic dialogue availability for the single-actor probe.
 *
 * Busy replies are runtime state, not provider text, so tests can prove waiting
 * and retry behavior without needing a live model.
 */
export function createDialogueState({
  busyRepliesBeforeAvailable
}: DialogueStateOptions) {
  let remainingBusyReplies = busyRepliesBeforeAvailable;

  function isSupported(actorId?: string, targetId?: string) {
    return Boolean(actorId && targetId && actorId !== targetId);
  }

  return {
    peek(targetId: string): DialogueAvailability {
      if (!targetId) {
        return "unavailable";
      }

      return remainingBusyReplies > 0 ? "busy" : "available";
    },
    requestTalk(actorId: string, targetId: string): TalkResult {
      // Unsupported pairs return unavailable rather than falling back to open
      // chat, keeping early social proof limited to the configured scenario.
      if (!isSupported(actorId, targetId)) {
        return {
          status: "unavailable",
          reason: `${targetId} is unavailable`
        };
      }

      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;

        return {
          status: "busy",
          reason: `${targetId} is busy`
        };
      }

      return {
        status: "available"
      };
    }
  };
}
