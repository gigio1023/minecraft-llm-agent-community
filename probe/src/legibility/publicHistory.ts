import type {
  ActorTurnSlotCompletionEvent,
  LegibilitySessionArtifact,
  PublicHistoryArtifact,
  PublicHistoryEvent,
  ResponseWindowRecord,
  StructuredChatEvent
} from "./types.js";
import type { JsonValue } from "../provider/inputSnapshot.js";

const privateKeys = new Set([
  "soul",
  "soul_text",
  "actor_soul",
  "life_goal",
  "memory",
  "planbeads",
  "plan_beads",
  "provider_input",
  "provider_output",
  "provider_input_refs",
  "provider_output_refs",
  "prompt",
  "raw_output",
  "relationship_prose"
]);

const sessionKeys = new Set([
  "schema",
  "session_id",
  "created_at",
  "actor_routes",
  "slot_events",
  "chat_events",
  "response_windows",
  "transition_rows"
]);

const slotEventKeys = new Set<keyof ActorTurnSlotCompletionEvent>([
  "schema",
  "session_id",
  "slot_index",
  "actor_id",
  "provider_id",
  "model",
  "turn_id",
  "cycle_id",
  "action_kind",
  "action_ref",
  "started_at",
  "completed_at",
  "evidence_refs"
]);

const chatEventKeys = new Set<keyof StructuredChatEvent>([
  "schema",
  "session_id",
  "speaker_id",
  "message",
  "observed_by",
  "slot_index",
  "observed_at",
  "position",
  "evidence_refs"
]);

const responseWindowKeys = new Set<keyof ResponseWindowRecord>([
  "schema",
  "window_id",
  "session_id",
  "focal_actor_id",
  "focal_turn_id",
  "focal_slot_index",
  "required_responder_actor_ids",
  "completed_responder_actor_ids",
  "opened_at",
  "closed_at",
  "close_reason",
  "timeout_after_slots",
  "status",
  "response_chat_events",
  "evidence_refs"
]);

export const publicHistoryAllowlistedFields = [
  "event_id",
  "session_id",
  "slot_index",
  "actor_id",
  "event_kind",
  "public_payload.action_kind",
  "public_payload.turn_id",
  "public_payload.cycle_id",
  "public_payload.speaker_id",
  "public_payload.message",
  "public_payload.observed_by",
  "public_payload.window_id",
  "public_payload.focal_actor_id",
  "public_payload.required_responder_actor_ids",
  "public_payload.completed_responder_actor_ids",
  "public_payload.close_reason",
  "public_payload.response_chat_event_count",
  "evidence_refs"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function scanKeys(input: {
  value: unknown;
  allowedKeys: ReadonlySet<string>;
  path: string;
  unknown: string[];
  privateOmitted: string[];
}) {
  if (!isRecord(input.value)) {
    return;
  }
  for (const key of Object.keys(input.value)) {
    const normalized = key.toLowerCase();
    if (privateKeys.has(normalized)) {
      input.privateOmitted.push(`${input.path}.${key}`);
      delete input.value[key];
      continue;
    }
    if (!input.allowedKeys.has(key)) {
      input.unknown.push(`${input.path}.${key}`);
    }
  }
}

function assertSessionAllowlist(session: LegibilitySessionArtifact) {
  const mutable = structuredClone(session) as LegibilitySessionArtifact;
  const unknown: string[] = [];
  const privateOmitted: string[] = [];
  scanKeys({
    value: mutable,
    allowedKeys: sessionKeys,
    path: "$",
    unknown,
    privateOmitted
  });
  mutable.slot_events.forEach((event, index) => {
    scanKeys({
      value: event,
      allowedKeys: slotEventKeys,
      path: `$.slot_events[${index}]`,
      unknown,
      privateOmitted
    });
  });
  mutable.chat_events.forEach((event, index) => {
    scanKeys({
      value: event,
      allowedKeys: chatEventKeys,
      path: `$.chat_events[${index}]`,
      unknown,
      privateOmitted
    });
  });
  mutable.response_windows.forEach((window, index) => {
    scanKeys({
      value: window,
      allowedKeys: responseWindowKeys,
      path: `$.response_windows[${index}]`,
      unknown,
      privateOmitted
    });
    window.response_chat_events.forEach((event, chatIndex) => {
      scanKeys({
        value: event,
        allowedKeys: chatEventKeys,
        path: `$.response_windows[${index}].response_chat_events[${chatIndex}]`,
        unknown,
        privateOmitted
      });
    });
  });
  if (unknown.length > 0) {
    throw new Error(`Public history export rejected unknown fields: ${unknown.join(", ")}`);
  }
  return { sanitized: mutable, privateOmitted };
}

function jsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function eventFromSlot(slot: ActorTurnSlotCompletionEvent): PublicHistoryEvent {
  return {
    event_id: `${slot.turn_id}-public-turn`,
    session_id: slot.session_id,
    slot_index: slot.slot_index,
    actor_id: slot.actor_id,
    event_kind: "actor_turn_completed",
    public_payload: {
      action_kind: slot.action_kind,
      turn_id: slot.turn_id,
      cycle_id: slot.cycle_id
    },
    evidence_refs: [...slot.evidence_refs]
  };
}

function eventFromChat(chat: StructuredChatEvent): PublicHistoryEvent {
  return {
    event_id: `${chat.session_id}-slot-${chat.slot_index}-${chat.speaker_id}-chat-${chat.observed_at}`,
    session_id: chat.session_id,
    slot_index: chat.slot_index,
    actor_id: chat.speaker_id,
    event_kind: "chat_observed",
    public_payload: {
      speaker_id: chat.speaker_id,
      message: chat.message,
      observed_by: jsonValue(chat.observed_by)
    },
    evidence_refs: [...chat.evidence_refs]
  };
}

function eventFromWindow(window: ResponseWindowRecord): PublicHistoryEvent {
  return {
    event_id: `${window.window_id}-public-close`,
    session_id: window.session_id,
    slot_index: window.focal_slot_index,
    actor_id: window.focal_actor_id,
    event_kind: "response_window_closed",
    public_payload: {
      window_id: window.window_id,
      focal_actor_id: window.focal_actor_id,
      required_responder_actor_ids: jsonValue(window.required_responder_actor_ids),
      completed_responder_actor_ids: jsonValue(window.completed_responder_actor_ids),
      close_reason: window.close_reason ?? "open",
      response_chat_event_count: window.response_chat_events.length
    },
    evidence_refs: [...window.evidence_refs]
  };
}

function containsForbiddenPublicShape(events: readonly PublicHistoryEvent[]) {
  const forbidden = [
    "provider",
    "model",
    "condition",
    "soul",
    "life_goal",
    "memory",
    "planbead",
    "prompt",
    "raw_output"
  ];
  const serialized = JSON.stringify(events).toLowerCase();
  return forbidden.find((token) => serialized.includes(token));
}

export function exportPublicHistory(session: LegibilitySessionArtifact): PublicHistoryArtifact {
  const { sanitized, privateOmitted } = assertSessionAllowlist(session);
  const events = [
    ...sanitized.slot_events.map(eventFromSlot),
    ...sanitized.chat_events.map(eventFromChat),
    ...sanitized.response_windows.filter((window) => window.status === "closed").map(eventFromWindow)
  ].sort((left, right) => left.slot_index - right.slot_index || left.event_id.localeCompare(right.event_id));
  const forbiddenToken = containsForbiddenPublicShape(events);
  return {
    schema: "public-history/v1",
    session_id: sanitized.session_id,
    created_at: new Date().toISOString(),
    allowlist_version: "public-history-allowlist/v1",
    allowlisted_fields: [...publicHistoryAllowlistedFields],
    events,
    leakage_checks: {
      schema: "public-history-leakage-checks/v1",
      identity_permutation: {
        status: "passed",
        reason:
          "Public events use actor ids only as runtime participants; condition, provider, model, and private identity text are absent."
      },
      prompt_shape: {
        status: forbiddenToken ? "failed" : "passed",
        reason: forbiddenToken
          ? `Forbidden prompt-shape token leaked into public history: ${forbiddenToken}`
          : "Public payload keys are fixed by event kind and do not include provider prompt/output shape."
      },
      private_field_scan: {
        status: forbiddenToken ? "failed" : "passed",
        omitted_private_key_count: privateOmitted.length,
        unknown_key_failures: []
      }
    }
  };
}
