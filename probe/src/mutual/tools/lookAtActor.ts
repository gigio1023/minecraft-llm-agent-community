export async function lookAtActor({
  actor,
  target
}: {
  actor: {
    lookAt(target: { x: number; y: number; z: number }, force?: boolean): Promise<void>;
  };
  target: {
    username: string;
    entity: {
      position: {
        x: number;
        y: number;
        z: number;
      };
    };
  };
}) {
  await actor.lookAt(target.entity.position, true);

  return {
    status: "looked_at_target" as const,
    target: target.username
  };
}
