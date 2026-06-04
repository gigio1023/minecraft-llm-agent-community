/**
 * Persistence for world events used as social-cycle context.
 *
 * @remarks World events can influence goal selection, but they are contextual
 * observations and not replacements for runtime evidence of physical progress.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";

import type { WorldEvent, WorldEventKind } from "./types.js";
import { listJsonFilesSorted, readJsonIfExists, writeActorGoalArtifact } from "./goalJsonStore.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";

export async function writeWorldEvent(rootDir: string, actorId: string, event: WorldEvent) {
  return writeActorGoalArtifact(rootDir, actorId, "world-events", event.event_id, event);
}

export async function listWorldEvents(
  rootDir: string,
  actorId: string,
  options?: { runId?: string }
) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const files = await listJsonFilesSorted(paths.worldEventsDir);
  const events: WorldEvent[] = [];
  for (const filePath of files) {
    const record = await readJsonIfExists<WorldEvent>(filePath);
    if (!record) {
      continue;
    }
    if (options?.runId !== undefined && record.run_id !== options.runId) {
      continue;
    }
    events.push(record);
  }
  return events;
}

export function createWorldEvent(input: {
  summary: string;
  kind: WorldEventKind;
  actorRefs?: string[];
  authority?: WorldEvent["authority"];
  runId?: string;
}): WorldEvent {
  return {
    schema: "world-event/v1",
    event_id: `world-event-${randomUUID()}`,
    kind: input.kind,
    authority: input.authority ?? "context_only",
    summary: input.summary,
    actor_refs: input.actorRefs ?? [],
    evidence_refs: [],
    created_at: new Date().toISOString(),
    ...(input.runId ? { run_id: input.runId } : {})
  };
}

export function worldEventRef(eventId: string) {
  return path.join("world-events", `${eventId}.json`);
}
