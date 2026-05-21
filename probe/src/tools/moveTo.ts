import { goals } from "mineflayer-pathfinder";

export type MoveToResult = {
  status: "arrived" | "moved" | "blocked";
  distance: number;
  beforeDistance: number;
  afterDistance: number;
  distanceDelta: number;
  arrived: boolean;
  reason: string;
};

type MovingActor = {
  lookAt(target: { x: number; y: number; z: number }, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
  pathfinder?: {
    goto(goal: unknown): Promise<void>;
    stop?(): void;
  };
  entity: {
    position: {
      x: number;
      y: number;
      z: number;
      distanceTo(other: { x: number; y: number; z: number }): number;
    };
  };
};

type MoveToArgs = {
  actor: MovingActor;
  target: MovingActor & { username: string };
  targetId: string;
  durationMs?: number;
  timeoutMs?: number;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function roundDistance(distance: number) {
  return Number(distance.toFixed(2));
}

export async function moveTo({
  actor,
  target,
  targetId,
  durationMs = 1_200,
  timeoutMs = 10_000
}: MoveToArgs): Promise<MoveToResult> {
  if (targetId !== target.username) {
    throw new Error(`Unsupported move target: ${targetId}`);
  }

  const beforeDistance = roundDistance(actor.entity.position.distanceTo(target.entity.position));
  let blockedReason: string | undefined;

  if (actor.pathfinder) {
    // Pathfinder arrival is the stronger movement primitive because it accounts
    // for terrain and collision. The manual branch is a bounded fallback for
    // minimal runtimes where pathfinder is unavailable.
    const goto = actor.pathfinder.goto(
      new goals.GoalNear(
        target.entity.position.x,
        target.entity.position.y,
        target.entity.position.z,
        1
      )
    );
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        goto,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            actor.pathfinder?.stop?.();
            reject(new Error(`pathfinder timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        })
      ]);
    } catch (error) {
      actor.pathfinder.stop?.();
      blockedReason = error instanceof Error ? error.message : String(error);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  } else {
    await actor.lookAt(target.entity.position, true);
    actor.setControlState("forward", true);

    try {
      await delay(durationMs);
    } finally {
      actor.setControlState("forward", false);
    }
  }

  const afterDistance = roundDistance(actor.entity.position.distanceTo(target.entity.position));
  const distanceDelta = roundDistance(beforeDistance - afterDistance);
  const arrived = afterDistance <= 1.5;
  const movedCloser = distanceDelta > 0;
  const status = blockedReason ? "blocked" : arrived ? "arrived" : movedCloser ? "moved" : "blocked";

  // Status is based on measured distance, not the fact that a movement command
  // was issued. This keeps transcripts from treating attempted motion as proof
  // of interaction range.
  return {
    status,
    distance: afterDistance,
    beforeDistance,
    afterDistance,
    distanceDelta,
    arrived,
    reason: blockedReason
      ? `move_to pathfinder failed for ${targetId}: ${blockedReason}.`
      : arrived
      ? `move_to arrived within 1.5 blocks of ${targetId}.`
      : movedCloser
        ? `move_to reduced distance to ${targetId} by ${distanceDelta} blocks.`
        : `move_to did not reduce distance to ${targetId}.`
  };
}
