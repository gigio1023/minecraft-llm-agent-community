import { goals } from "mineflayer-pathfinder";

export type MoveToResult = {
  status: "arrived" | "moved";
  distance: number;
  beforeDistance: number;
  afterDistance: number;
  arrived: boolean;
};

type MovingActor = {
  lookAt(target: { x: number; y: number; z: number }, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
  pathfinder?: {
    goto(goal: unknown): Promise<void>;
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
  durationMs = 1_200
}: MoveToArgs): Promise<MoveToResult> {
  if (targetId !== target.username) {
    throw new Error(`Unsupported move target: ${targetId}`);
  }

  const beforeDistance = roundDistance(actor.entity.position.distanceTo(target.entity.position));

  if (actor.pathfinder) {
    await actor.pathfinder.goto(
      new goals.GoalNear(
        target.entity.position.x,
        target.entity.position.y,
        target.entity.position.z,
        1
      )
    );
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

  return {
    status: afterDistance <= 1.5 ? "arrived" : "moved",
    distance: afterDistance,
    beforeDistance,
    afterDistance,
    arrived: afterDistance <= 1.5
  };
}
