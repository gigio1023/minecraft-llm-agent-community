/**
 * Records spatial attention without moving the actor.
 *
 * This gives the mutual probe a cheap world-state action between chat turns so
 * transcripts can distinguish "heard" from "looked at target".
 */
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
