type DialogueAvailability = "busy" | "available" | "unavailable";

type DialogueStateOptions = {
  busyRepliesBeforeAvailable: number;
};

type TalkResult =
  | { status: "busy"; reason: string }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

export function createDialogueState({
  busyRepliesBeforeAvailable
}: DialogueStateOptions) {
  let remainingBusyReplies = busyRepliesBeforeAvailable;

  function isSupported(actorId?: string, targetId?: string) {
    return actorId === "npc_a" && targetId === "npc_b";
  }

  return {
    peek(targetId: string): DialogueAvailability {
      if (targetId !== "npc_b") {
        return "unavailable";
      }

      return remainingBusyReplies > 0 ? "busy" : "available";
    },
    requestTalk(actorId: string, targetId: string): TalkResult {
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
          reason: "npc_b is busy"
        };
      }

      return {
        status: "available"
      };
    },
    canEscalateDialogue(actorId: string, pressures: Array<{ kind: string; urgency: number }>): boolean {
      const allowedCoopPressures = [
        "shared_shortage",
        "blocked_teammate",
        "public_obligation_due",
        "station_missing",
        "hostile_risk"
      ];
      return pressures.some((p) => allowedCoopPressures.includes(p.kind) && p.urgency >= 0.6);
    }
  };
}
