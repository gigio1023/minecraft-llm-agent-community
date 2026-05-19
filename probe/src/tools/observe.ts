import { createDialogueState } from "../runtime/dialogueState.js";
import { createMemory } from "../runtime/memory.js";

type DialogueState = ReturnType<typeof createDialogueState>;
type MemoryStore = ReturnType<typeof createMemory>;
type PositionedActor = {
  username: string;
  entity: {
    position: {
      x: number;
      y: number;
      z: number;
      distanceTo(other: { x: number; y: number; z: number }): number;
    };
  };
};

export type ObserveResult = {
  status: "ok";
  visibleActors: Array<{
    id: string;
    distance: number;
    busy: boolean;
  }>;
  memory: string[];
};

type ObserveArgs = {
  actor: PositionedActor;
  target: PositionedActor;
  dialogueState: DialogueState;
  memory: MemoryStore;
};

function roundDistance(distance: number) {
  return Number(distance.toFixed(2));
}

export async function observe({
  actor,
  target,
  dialogueState,
  memory
}: ObserveArgs): Promise<ObserveResult> {
  return {
    status: "ok",
    visibleActors: [
      {
        id: target.username,
        distance: roundDistance(actor.entity.position.distanceTo(target.entity.position)),
        busy: dialogueState.peek(target.username) === "busy"
      }
    ],
    memory: memory.list()
  };
}
