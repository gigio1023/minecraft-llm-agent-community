export type MoveToResult = {
  status: "arrived" | "moved";
  distance: number;
};

type MovingActor = {
  lookAt(target: { x: number; y: number; z: number }, force?: boolean): Promise<void>;
  setControlState(control: string, state: boolean): void;
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

  await actor.lookAt(target.entity.position, true);
  actor.setControlState("forward", true);

  try {
    await delay(durationMs);
  } finally {
    actor.setControlState("forward", false);
  }

  const distance = roundDistance(actor.entity.position.distanceTo(target.entity.position));

  return {
    status: distance <= 1 ? "arrived" : "moved",
    distance
  };
}
