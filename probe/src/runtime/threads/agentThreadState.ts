import { createPrivateEpisodicMemory } from "../../memory/private/privateEpisodicMemory.js";
import type { MailItem } from "../mailbox/turnPhasedMailbox.js";

export function createAgentThreadState(input: {
  threadId: string;
  agentId: string;
  roleId: string;
}) {
  const episodicMemory = createPrivateEpisodicMemory();
  let turn = 0;
  let currentTask: string | null = null;
  let activeAction: string | null = null;
  let lastObservation: Record<string, unknown> | null = null;
  let lastResult: Record<string, unknown> | null = null;
  let workingMemory: Record<string, unknown> = {
    currentTask: null,
    currentBlocker: null,
    currentPromise: null,
    nextIntendedAction: null
  };
  const outboundMail: MailItem[] = [];
  const inboundMail: MailItem[] = [];

  return {
    beginTurn() {
      // Thread turn is local to the actor. Multi-actor orchestration can advance
      // actors independently without losing each actor's transcript order.
      turn += 1;
    },
    recordObservation(observation: Record<string, unknown>) {
      // Store snapshots at the runtime boundary so later prompt formatting or
      // tool-result enrichment cannot rewrite the evidence for this turn.
      lastObservation = structuredClone(observation);
    },
    recordResult(result: Record<string, unknown>) {
      lastResult = structuredClone(result);
    },
    setCurrentTask(taskId: string | null) {
      currentTask = taskId;
      workingMemory = {
        ...workingMemory,
        currentTask: taskId
      };
    },
    setActiveAction(action: string | null) {
      // activeAction is a resumability/debug field, not proof of progress; the
      // verifier still decides whether an action changed Minecraft state.
      activeAction = action;
    },
    updateWorkingMemory(patch: Record<string, unknown>) {
      workingMemory = {
        ...workingMemory,
        ...structuredClone(patch)
      };
    },
    remember(event: string) {
      episodicMemory.add(event);
    },
    recordOutboundMail(item: MailItem) {
      outboundMail.push(structuredClone(item));
    },
    recordInboundMail(item: MailItem) {
      inboundMail.push(structuredClone(item));
    },
    snapshot() {
      // Expose only cloned state. Checkpoint builders can compact this snapshot
      // without taking ownership of the live thread object.
      return {
        threadId: input.threadId,
        agentId: input.agentId,
        roleId: input.roleId,
        turn,
        currentTask,
        activeAction,
        lastObservation: lastObservation ? structuredClone(lastObservation) : null,
        lastResult: lastResult ? structuredClone(lastResult) : null,
        privateMemory: episodicMemory.list(),
        workingMemory: structuredClone(workingMemory),
        outboundMail: outboundMail.map((item) => structuredClone(item)),
        inboundMail: inboundMail.map((item) => structuredClone(item))
      };
    }
  };
}
