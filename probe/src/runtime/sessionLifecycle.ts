/**
 * Runtime session lifecycle evidence for Mineflayer-backed social cycles.
 *
 * @remarks Death, respawn, disconnect, and connection errors invalidate a lot
 * of stale gameplay assumptions. This tracker records those events as current
 * runtime facts so Actor Turn can recover from the real session state instead
 * of continuing from older inventory or position evidence.
 */
import type { Bot } from "mineflayer";
import type { ObserveResult } from "../tools/observe.js";

export type RuntimeSessionEventKind = "death" | "spawn" | "end" | "kicked" | "error";

export type RuntimeSessionEvent = {
  kind: RuntimeSessionEventKind;
  observed_at: string;
  position?: { x: number; y: number; z: number };
  health?: number;
  food?: number;
  reason?: string;
};

export type RuntimeSessionLifecycleObservation = {
  schema: "runtime-session-lifecycle/v1";
  actor_id: string;
  status: "active" | "dead_or_respawning" | "respawned_after_death" | "disconnected_or_error";
  death_count: number;
  spawn_count: number;
  last_event?: RuntimeSessionEvent;
  recent_events: RuntimeSessionEvent[];
  inventory_may_have_reset: boolean;
  branch_recommended: boolean;
  branch_reason?: "danger_or_survival_pressure" | "environment_blocked";
  notes: string[];
};

export type RuntimeSessionLifecycleTracker = {
  snapshot(): RuntimeSessionLifecycleObservation;
  close(): void;
};

function nowIso() {
  return new Date().toISOString();
}

function positionOf(bot: Bot) {
  return {
    x: Number(bot.entity.position.x.toFixed(2)),
    y: Number(bot.entity.position.y.toFixed(2)),
    z: Number(bot.entity.position.z.toFixed(2))
  };
}

function eventFromBot(input: {
  bot: Bot;
  kind: RuntimeSessionEventKind;
  reason?: string;
}): RuntimeSessionEvent {
  return {
    kind: input.kind,
    observed_at: nowIso(),
    position: positionOf(input.bot),
    ...(typeof input.bot.health === "number" ? { health: input.bot.health } : {}),
    ...(typeof input.bot.food === "number" ? { food: input.bot.food } : {}),
    ...(input.reason ? { reason: input.reason } : {})
  };
}

function lifecycleStatus(input: {
  deathCount: number;
  lastEvent?: RuntimeSessionEvent;
}): RuntimeSessionLifecycleObservation["status"] {
  if (!input.lastEvent) {
    return "active";
  }
  if (input.lastEvent.kind === "death") {
    return "dead_or_respawning";
  }
  if (input.lastEvent.kind === "spawn" && input.deathCount > 0) {
    return "respawned_after_death";
  }
  if (input.lastEvent.kind === "end" || input.lastEvent.kind === "kicked" || input.lastEvent.kind === "error") {
    return "disconnected_or_error";
  }
  return "active";
}

function branchReasonForStatus(
  status: RuntimeSessionLifecycleObservation["status"]
): RuntimeSessionLifecycleObservation["branch_reason"] | undefined {
  if (status === "dead_or_respawning" || status === "respawned_after_death") {
    return "danger_or_survival_pressure";
  }
  if (status === "disconnected_or_error") {
    return "environment_blocked";
  }
  return undefined;
}

export function attachRuntimeSessionLifecycleTracker(input: {
  actorId: string;
  bot: Bot;
}): RuntimeSessionLifecycleTracker {
  const events: RuntimeSessionEvent[] = [];
  let deathCount = 0;
  let spawnCount = 0;
  let sawDeath = false;

  const push = (event: RuntimeSessionEvent) => {
    events.push(event);
    if (events.length > 24) {
      events.splice(0, events.length - 24);
    }
  };

  const onDeath = () => {
    sawDeath = true;
    deathCount += 1;
    push(eventFromBot({ bot: input.bot, kind: "death" }));
  };
  const onSpawn = () => {
    spawnCount += 1;
    push(eventFromBot({ bot: input.bot, kind: "spawn" }));
  };
  const onEnd = (reason: string) => {
    push(eventFromBot({ bot: input.bot, kind: "end", reason }));
  };
  const onKicked = (reason: string) => {
    push(eventFromBot({ bot: input.bot, kind: "kicked", reason }));
  };
  const onError = (error: Error) => {
    push(eventFromBot({ bot: input.bot, kind: "error", reason: error.message }));
  };

  input.bot.on("death", onDeath);
  input.bot.on("spawn", onSpawn);
  input.bot.on("end", onEnd);
  input.bot.on("kicked", onKicked);
  input.bot.on("error", onError);

  return {
    snapshot() {
      const lastEvent = events.at(-1);
      const status = lifecycleStatus({ deathCount, lastEvent });
      const branchReason = branchReasonForStatus(status);
      return {
        schema: "runtime-session-lifecycle/v1",
        actor_id: input.actorId,
        status,
        death_count: deathCount,
        spawn_count: spawnCount,
        ...(lastEvent ? { last_event: lastEvent } : {}),
        recent_events: events.slice(-8),
        inventory_may_have_reset: sawDeath,
        branch_recommended: branchReason !== undefined,
        ...(branchReason ? { branch_reason: branchReason } : {}),
        notes: [
          "Session lifecycle is runtime evidence, not provider prose.",
          ...(sawDeath
            ? ["A death event can reset inventory and invalidate older position/material assumptions."]
            : [])
        ]
      };
    },
    close() {
      input.bot.off("death", onDeath);
      input.bot.off("spawn", onSpawn);
      input.bot.off("end", onEnd);
      input.bot.off("kicked", onKicked);
      input.bot.off("error", onError);
    }
  };
}

export function withRuntimeSessionLifecycle(
  observation: ObserveResult | Record<string, unknown>,
  tracker?: RuntimeSessionLifecycleTracker
): ObserveResult | Record<string, unknown> {
  if (!tracker) {
    return observation;
  }
  return {
    ...observation,
    session_lifecycle: tracker.snapshot()
  };
}
