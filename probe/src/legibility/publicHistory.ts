import type {
  ActorTurnSlotCompletionEvent,
  LegibilitySessionArtifact,
  PublicHistoryArtifact,
  PublicHistoryEvent,
  ResponseWindowRecord,
  StructuredChatEvent,
  TransitionRowV1
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
  "public_payload.row_id",
  "public_payload.layer",
  "public_payload.label",
  "public_payload.social_response_label",
  "public_payload.window_id",
  "public_payload.focal_actor_id",
  "public_payload.responder_actor_ids",
  "public_payload.required_responder_actor_ids",
  "public_payload.completed_responder_actor_ids",
  "public_payload.close_reason",
  "public_payload.response_chat_event_count",
  "public_payload.scenario_family_id",
  "public_payload.inclusion_tags",
  "public_payload.public_profile_id",
  "public_payload.public_profile_bucket",
  "evidence_refs"
] as const;

const publicEventKeys = new Set<keyof PublicHistoryEvent>([
  "event_id",
  "session_id",
  "slot_index",
  "actor_id",
  "event_kind",
  "public_payload",
  "evidence_refs"
]);

const publicPayloadKeys = new Set([
  "action_kind",
  "turn_id",
  "cycle_id",
  "speaker_id",
  "message",
  "observed_by",
  "row_id",
  "layer",
  "label",
  "social_response_label",
  "window_id",
  "focal_actor_id",
  "responder_actor_ids",
  "required_responder_actor_ids",
  "completed_responder_actor_ids",
  "close_reason",
  "response_chat_event_count",
  "scenario_family_id",
  "inclusion_tags",
  "public_profile_id",
  "public_profile_bucket"
]);

const forbiddenPromptShapeKeys = new Set([
  "provider",
  "providerid",
  "providerinput",
  "provideroutput",
  "model",
  "condition",
  "soul",
  "soultext",
  "actorsoul",
  "lifegoal",
  "memory",
  "planbead",
  "planbeads",
  "prompt",
  "rawoutput",
  "relationshipprose"
]);

export type ExportPublicHistoryOptions = {
  createdAt: string;
};

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
  if (privateOmitted.length > 0) {
    throw new Error(`Public history export rejected private fields: ${privateOmitted.join(", ")}`);
  }
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

function firstLabel<T extends string>(labels: readonly T[]) {
  return labels[0];
}

function rowForWindow(
  rowsByWindowId: ReadonlyMap<string, TransitionRowV1>,
  window: ResponseWindowRecord
) {
  return rowsByWindowId.get(window.window_id);
}

function eventFromWindow(
  window: ResponseWindowRecord,
  row?: TransitionRowV1
): PublicHistoryEvent {
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
      response_chat_event_count: window.response_chat_events.length,
      ...(row
        ? {
            row_id: row.row_id,
            action_kind: row.executed_action.action_kind,
            social_response_label: firstLabel(row.observed_delta.social_response.classes) ?? "unknown_social_response",
            scenario_family_id: row.metadata.scenario_family_id,
            inclusion_tags: jsonValue(row.row_quality.inclusion_tags)
          }
        : {})
    },
    evidence_refs: [...window.evidence_refs]
  };
}

function eventFromRowMaterialLabel(row: TransitionRowV1): PublicHistoryEvent | undefined {
  const label = firstLabel(row.observed_delta.material.classes);
  if (!row.timestamps.label_locked_at || !label) {
    return undefined;
  }
  const window = row.observed_delta.social_response.response_window;
  return {
    event_id: `${row.row_id}-material-access-public-label`,
    session_id: row.session_id,
    slot_index: window.focal_slot_index,
    actor_id: row.actor_id,
    event_kind: "material_label_locked",
    public_payload: {
      row_id: row.row_id,
      layer: "material_access",
      label,
      action_kind: row.executed_action.action_kind,
      focal_actor_id: row.actor_id,
      responder_actor_ids: jsonValue(window.required_responder_actor_ids),
      scenario_family_id: row.metadata.scenario_family_id,
      inclusion_tags: jsonValue(row.row_quality.inclusion_tags)
    },
    evidence_refs: [...row.observed_delta.material.evidence_refs]
  };
}

function normalizeShapeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function forbiddenShapeFailure(path: string, key: string) {
  const normalized = normalizeShapeKey(key);
  return forbiddenPromptShapeKeys.has(normalized)
    ? `${path}.${key}`
    : undefined;
}

function checkPromptShape(events: readonly PublicHistoryEvent[]): PublicHistoryArtifact["leakage_checks"]["prompt_shape"] {
  const failures: string[] = [];
  events.forEach((event, index) => {
    for (const key of Object.keys(event)) {
      if (!publicEventKeys.has(key as keyof PublicHistoryEvent)) {
        failures.push(`unknown event key $.events[${index}].${key}`);
      }
      const forbidden = forbiddenShapeFailure(`$.events[${index}]`, key);
      if (forbidden) {
        failures.push(`forbidden key ${forbidden}`);
      }
    }
    for (const key of Object.keys(event.public_payload)) {
      if (!publicPayloadKeys.has(key)) {
        failures.push(`unknown payload key $.events[${index}].public_payload.${key}`);
      }
      const forbidden = forbiddenShapeFailure(`$.events[${index}].public_payload`, key);
      if (forbidden) {
        failures.push(`forbidden key ${forbidden}`);
      }
    }
  });
  if (failures.length > 0) {
    return {
      status: "failed",
      reason: `Public history prompt shape rejected schema/key surfaces: ${failures.join(", ")}`
    };
  }
  return {
    status: "passed",
    reason: "Public event and payload keys match the public-history allowlist; message values are not scanned."
  };
}

function stringArray(value: JsonValue | undefined) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

function collectActorIds(events: readonly PublicHistoryEvent[]) {
  const ids = new Set<string>();
  for (const event of events) {
    ids.add(event.actor_id);
    const payload = event.public_payload;
    for (const key of ["speaker_id", "focal_actor_id"] as const) {
      const value = payload[key];
      if (typeof value === "string") {
        ids.add(value);
      }
    }
    for (const key of [
      "observed_by",
      "responder_actor_ids",
      "required_responder_actor_ids",
      "completed_responder_actor_ids"
    ] as const) {
      for (const value of stringArray(payload[key])) {
        ids.add(value);
      }
    }
  }
  return [...ids].filter(Boolean).sort();
}

function actorIdMatches(value: string, actorIds: readonly string[]) {
  const matches: Array<{ start: number; end: number; actorId: string }> = [];
  for (const actorId of actorIds) {
    let start = value.indexOf(actorId);
    while (start >= 0) {
      matches.push({ start, end: start + actorId.length, actorId });
      start = value.indexOf(actorId, start + actorId.length);
    }
  }
  matches.sort((left, right) => left.start - right.start || right.end - left.end);
  const nonOverlapping: typeof matches = [];
  let lastEnd = -1;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.end;
    }
  }
  return nonOverlapping;
}

function replaceActorIds(
  value: string,
  actorIds: readonly string[],
  replacementFor: (actorId: string) => string
) {
  const matches = actorIdMatches(value, actorIds);
  if (matches.length === 0) {
    return value;
  }
  let output = "";
  let cursor = 0;
  for (const match of matches) {
    output += value.slice(cursor, match.start);
    output += replacementFor(match.actorId);
    cursor = match.end;
  }
  output += value.slice(cursor);
  return output;
}

function mapStringValues(value: JsonValue, mapper: (value: string) => string): JsonValue {
  if (typeof value === "string") {
    return mapper(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapStringValues(item, mapper));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapStringValues(item, mapper)])
    ) as JsonValue;
  }
  return value;
}

function relabelEvents(
  events: readonly PublicHistoryEvent[],
  actorIds: readonly string[],
  mapping: ReadonlyMap<string, string>
): PublicHistoryEvent[] {
  return mapStringValues(
    jsonValue(events),
    (value) => replaceActorIds(value, actorIds, (actorId) => mapping.get(actorId) ?? actorId)
  ) as unknown as PublicHistoryEvent[];
}

function canonicalizeActorIds(events: readonly PublicHistoryEvent[], actorIds: readonly string[]) {
  const canonical = new Map<string, string>();
  return mapStringValues(jsonValue(events), (value) =>
    replaceActorIds(value, actorIds, (actorId) => {
      const existing = canonical.get(actorId);
      if (existing) {
        return existing;
      }
      const next = `actor_${canonical.size}`;
      canonical.set(actorId, next);
      return next;
    })
  );
}

function checkIdentityPermutation(events: readonly PublicHistoryEvent[]): PublicHistoryArtifact["leakage_checks"]["identity_permutation"] {
  const actorIds = collectActorIds(events);
  if (actorIds.length < 2) {
    return {
      status: "passed",
      reason: `Public history contains ${actorIds.length} actor id(s); no nontrivial identity permutation is available.`
    };
  }
  const rotated = new Map(actorIds.map((actorId, index) => [
    actorId,
    actorIds[(index + 1) % actorIds.length] ?? actorId
  ]));
  const permuted = relabelEvents(events, actorIds, rotated);
  const permutedActorIds = collectActorIds(permuted);
  const originalCanonical = canonicalizeActorIds(events, actorIds);
  const permutedCanonical = canonicalizeActorIds(permuted, permutedActorIds);
  const passed = JSON.stringify(originalCanonical) === JSON.stringify(permutedCanonical);
  return passed
    ? {
        status: "passed",
        reason: `Public history is invariant under a nontrivial permutation of ${actorIds.length} actor ids.`
      }
    : {
        status: "failed",
        reason: "Public history changed after actor-id permutation and canonical relabeling."
      };
}

function leakageChecks(input: {
  events: readonly PublicHistoryEvent[];
  privateOmittedCount: number;
  unknownKeyFailures: string[];
}): PublicHistoryArtifact["leakage_checks"] {
  return {
    schema: "public-history-leakage-checks/v1",
    identity_permutation: checkIdentityPermutation(input.events),
    prompt_shape: checkPromptShape(input.events),
    private_field_scan: {
      status:
        input.privateOmittedCount === 0 && input.unknownKeyFailures.length === 0
          ? "passed"
          : "failed",
      omitted_private_key_count: input.privateOmittedCount,
      unknown_key_failures: [...input.unknownKeyFailures]
    }
  };
}

function failedLeakageChecks(checks: PublicHistoryArtifact["leakage_checks"]) {
  const failures: string[] = [];
  if (checks.identity_permutation.status !== "passed") {
    failures.push(`identity_permutation: ${checks.identity_permutation.reason}`);
  }
  if (checks.prompt_shape.status !== "passed") {
    failures.push(`prompt_shape: ${checks.prompt_shape.reason}`);
  }
  if (checks.private_field_scan.status !== "passed") {
    failures.push(
      `private_field_scan: omitted=${checks.private_field_scan.omitted_private_key_count}, unknown=${
        checks.private_field_scan.unknown_key_failures.join(", ") || "none"
      }`
    );
  }
  return failures;
}

function assertLeakageChecksPassed(
  checks: PublicHistoryArtifact["leakage_checks"],
  context: string
) {
  const failures = failedLeakageChecks(checks);
  if (failures.length > 0) {
    throw new Error(`${context} rejected public history leakage checks: ${failures.join("; ")}`);
  }
}

export function assertPublicHistoryChecksPassed(publicHistory: PublicHistoryArtifact) {
  if (publicHistory.schema !== "public-history/v1") {
    throw new Error("Scoring requires a public-history/v1 artifact when public history is supplied");
  }
  assertLeakageChecksPassed(publicHistory.leakage_checks, "Public history artifact");
  const recomputed = leakageChecks({
    events: publicHistory.events,
    privateOmittedCount: 0,
    unknownKeyFailures: []
  });
  assertLeakageChecksPassed(recomputed, "Public history artifact recomputation");
}

export function exportPublicHistory(
  session: LegibilitySessionArtifact,
  options: ExportPublicHistoryOptions
): PublicHistoryArtifact {
  const { sanitized, privateOmitted } = assertSessionAllowlist(session);
  const rowsByWindowId = new Map(
    sanitized.transition_rows.map((row) => [
      row.observed_delta.social_response.response_window.window_id,
      row
    ])
  );
  const events = [
    ...sanitized.slot_events.map(eventFromSlot),
    ...sanitized.chat_events.map(eventFromChat),
    ...sanitized.response_windows
      .filter((window) => window.status === "closed")
      .map((window) => eventFromWindow(window, rowForWindow(rowsByWindowId, window))),
    ...sanitized.transition_rows
      .map(eventFromRowMaterialLabel)
      .filter((event): event is PublicHistoryEvent => Boolean(event))
  ].sort((left, right) => left.slot_index - right.slot_index || left.event_id.localeCompare(right.event_id));
  const checks = leakageChecks({
    events,
    privateOmittedCount: privateOmitted.length,
    unknownKeyFailures: []
  });
  assertLeakageChecksPassed(checks, "Public history export");
  return {
    schema: "public-history/v1",
    session_id: sanitized.session_id,
    created_at: options.createdAt,
    allowlist_version: "public-history-allowlist/v1",
    allowlisted_fields: [...publicHistoryAllowlistedFields],
    events,
    leakage_checks: checks
  };
}
