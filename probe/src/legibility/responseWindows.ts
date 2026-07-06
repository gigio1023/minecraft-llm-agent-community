import type {
  ActorTurnSlotCompletionEvent,
  ResponseWindowRecord,
  StructuredChatEvent
} from "./types.js";

export type ResponseWindowTrackerOptions = {
  sessionId: string;
  activeActorIds: readonly string[];
  timeoutAfterSlots: number;
};

export type OpenWindowInput = {
  focalActorId: string;
  focalTurnId: string;
  focalSlotIndex: number;
  openedAt: string;
  evidenceRefs?: readonly string[];
};

export class ResponseWindowTracker {
  private readonly windows: ResponseWindowRecord[] = [];
  private readonly activeActorIds: string[];

  constructor(private readonly options: ResponseWindowTrackerOptions) {
    this.activeActorIds = [...new Set(options.activeActorIds)].sort();
    if (this.activeActorIds.length < 2 || this.activeActorIds.length > 3) {
      throw new Error("ResponseWindowTracker requires 2-3 active actors");
    }
    if (!Number.isInteger(options.timeoutAfterSlots) || options.timeoutAfterSlots < 1) {
      throw new Error("timeoutAfterSlots must be a positive integer declared by the experiment");
    }
  }

  open(input: OpenWindowInput): ResponseWindowRecord {
    const required = this.activeActorIds.filter((actorId) => actorId !== input.focalActorId);
    const window: ResponseWindowRecord = {
      schema: "response-window/v1",
      window_id: `${input.focalTurnId}-response-window`,
      session_id: this.options.sessionId,
      focal_actor_id: input.focalActorId,
      focal_turn_id: input.focalTurnId,
      focal_slot_index: input.focalSlotIndex,
      required_responder_actor_ids: required,
      completed_responder_actor_ids: [],
      opened_at: input.openedAt,
      timeout_after_slots: this.options.timeoutAfterSlots,
      status: "open",
      response_chat_events: [],
      evidence_refs: [...(input.evidenceRefs ?? [])]
    };
    this.windows.push(window);
    return structuredClone(window);
  }

  recordChatEvent(event: StructuredChatEvent): void {
    for (const window of this.windows) {
      if (window.status !== "open") {
        continue;
      }
      if (event.slot_index <= window.focal_slot_index) {
        continue;
      }
      if (!window.required_responder_actor_ids.includes(event.speaker_id)) {
        continue;
      }
      window.response_chat_events.push(structuredClone(event));
      window.evidence_refs = [...new Set([...window.evidence_refs, ...event.evidence_refs])];
    }
  }

  recordSlotCompletion(event: ActorTurnSlotCompletionEvent): ResponseWindowRecord[] {
    const closed: ResponseWindowRecord[] = [];
    for (const window of this.windows) {
      if (window.status !== "open" || event.slot_index <= window.focal_slot_index) {
        continue;
      }
      if (window.required_responder_actor_ids.includes(event.actor_id)) {
        window.completed_responder_actor_ids = [
          ...new Set([...window.completed_responder_actor_ids, event.actor_id])
        ].sort();
        window.evidence_refs = [...new Set([...window.evidence_refs, ...event.evidence_refs])];
      }

      const allRespondersCompleted = window.required_responder_actor_ids.every((actorId) =>
        window.completed_responder_actor_ids.includes(actorId)
      );
      if (allRespondersCompleted) {
        window.status = "closed";
        window.closed_at = event.completed_at;
        window.close_reason = "all_other_actor_slots_completed";
        closed.push(structuredClone(window));
      }
    }
    return closed;
  }

  closeTimedOut(currentSlotIndex: number, closedAt: string): ResponseWindowRecord[] {
    const closed: ResponseWindowRecord[] = [];
    for (const window of this.windows) {
      if (window.status !== "open") {
        continue;
      }
      if (currentSlotIndex - window.focal_slot_index < window.timeout_after_slots) {
        continue;
      }
      window.status = "closed";
      window.closed_at = closedAt;
      window.close_reason = "timeout";
      closed.push(structuredClone(window));
    }
    return closed;
  }

  all(): ResponseWindowRecord[] {
    return this.windows.map((window) => structuredClone(window));
  }
}
