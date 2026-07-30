import type {
  ActorProviderRoute,
  ActorTurnSlotCompletionEvent
} from "./types.js";

export type SharedSessionTurnHandlerResult = {
  action_kind: string;
  action_ref?: string;
  evidence_refs: string[];
  started_at?: string;
  completed_at?: string;
};

export type SharedSessionTurnHandler = (input: {
  session_id: string;
  slot_index: number;
  actor_id: string;
  route: ActorProviderRoute;
  turn_id: string;
  cycle_id: string;
}) => Promise<SharedSessionTurnHandlerResult> | SharedSessionTurnHandlerResult;

function assertActorRoutes(routes: readonly ActorProviderRoute[]) {
  const actorIds = routes.map((route) => route.actor_id);
  const uniqueActorIds = new Set(actorIds);
  if (routes.length < 2 || routes.length > 3) {
    throw new Error("Shared-session scheduler supports exactly 2-3 actors for Session 1");
  }
  if (uniqueActorIds.size !== routes.length) {
    throw new Error("Shared-session actor routes must have distinct actor_id values");
  }
}

export function buildRoundRobinActorOrder(input: {
  actorRoutes: readonly ActorProviderRoute[];
  slotsPerActor: number;
}) {
  assertActorRoutes(input.actorRoutes);
  if (!Number.isInteger(input.slotsPerActor) || input.slotsPerActor < 1) {
    throw new Error("slotsPerActor must be a positive integer");
  }
  const orderedActorIds = input.actorRoutes.map((route) => route.actor_id);
  return Array.from({ length: input.slotsPerActor }).flatMap(() => orderedActorIds);
}

export async function runSharedSessionSchedule(input: {
  session_id: string;
  actorRoutes: readonly ActorProviderRoute[];
  slotsPerActor: number;
  turnHandler: SharedSessionTurnHandler;
  onSlotCompleted?: (event: ActorTurnSlotCompletionEvent) => Promise<void> | void;
}): Promise<ActorTurnSlotCompletionEvent[]> {
  assertActorRoutes(input.actorRoutes);
  const routesByActor = new Map(input.actorRoutes.map((route) => [route.actor_id, route]));
  const actorOrder = buildRoundRobinActorOrder({
    actorRoutes: input.actorRoutes,
    slotsPerActor: input.slotsPerActor
  });
  const events: ActorTurnSlotCompletionEvent[] = [];
  for (const [index, actorId] of actorOrder.entries()) {
    const route = routesByActor.get(actorId);
    if (!route) {
      throw new Error(`Missing provider route for actor ${actorId}`);
    }
    const slotIndex = index + 1;
    const cycleIndex = Math.floor(index / input.actorRoutes.length) + 1;
    const cycleId = `shared-cycle-${String(cycleIndex).padStart(4, "0")}`;
    const turnId = `${cycleId}-${actorId}-slot-${String(slotIndex).padStart(4, "0")}`;
    const result = await input.turnHandler({
      session_id: input.session_id,
      slot_index: slotIndex,
      actor_id: actorId,
      route,
      turn_id: turnId,
      cycle_id: cycleId
    });
    const startedAt = result.started_at ?? new Date().toISOString();
    const completedAt = result.completed_at ?? startedAt;
    const event: ActorTurnSlotCompletionEvent = {
      schema: "actor-turn-slot-completion/v1",
      session_id: input.session_id,
      slot_index: slotIndex,
      actor_id: actorId,
      provider_id: route.provider_id,
      model: route.model,
      turn_id: turnId,
      cycle_id: cycleId,
      action_kind: result.action_kind,
      ...(result.action_ref ? { action_ref: result.action_ref } : {}),
      started_at: startedAt,
      completed_at: completedAt,
      evidence_refs: [...result.evidence_refs]
    };
    events.push(event);
    await input.onSlotCompleted?.(event);
  }
  return events;
}
