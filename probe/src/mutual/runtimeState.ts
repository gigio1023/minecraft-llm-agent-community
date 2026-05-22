import { createSharedSettlementState } from "../memory/shared/sharedSettlementState.js";
import { decideHostileAction } from "../npc/hostile/hostilePolicy.js";
import { createTensionLedger } from "../npc/hostile/tensionLedger.js";
import {
  getRoleContract,
  type RoleId
} from "../npc/roles/contracts.js";
import { createTeamBulletin } from "../npc/social/teamBulletin.js";
import { createTurnPhasedMailbox } from "../runtime/mailbox/turnPhasedMailbox.js";
import { createAgentThreadState } from "../runtime/threads/agentThreadState.js";
import { defaultActorRoles, normalizeActorIds } from "../runtime/actorRoster.js";
import type { ToolResult, MutualActorId } from "./types.js";

type MutualRuntimeStateOptions = {
  busyRepliesBeforeAvailable: number;
  markerItemName: string;
  actorIds?: readonly string[];
  socialContextEnabled?: boolean;
  actorRoles?: Partial<Record<MutualActorId, RoleId>>;
  hostileEnabled?: boolean;
};

export type HeardMessage = {
  from: string;
  text: string;
  targetId?: string;
};

export type UtteranceEntry = {
  actorId: string;
  text: string;
  targetId?: string;
};

type ReplyResult =
  | { status: "busy"; reason: string }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

type SocialObservation = Record<string, unknown> & {
  visibleActors?: Array<{ id: string; distance?: number }>;
};

type HostileAlert = {
  action: "move_to" | "retreat" | "wait" | "blocked";
  reason?: string;
  targetId?: string;
};

const MAX_HEARD_MESSAGES = 4;
const MAX_UTTERANCES = 6;

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

export function createMutualRuntimeState({
  busyRepliesBeforeAvailable,
  markerItemName,
  actorIds,
  socialContextEnabled = false,
  actorRoles = {},
  hostileEnabled = true
}: MutualRuntimeStateOptions) {
  const normalizedActorIds = normalizeActorIds(actorIds);
  let remainingBusyReplies = busyRepliesBeforeAvailable;
  let markerDropped = false;
  let turnCounter = 0;
  const heardMessages = new Map<string, HeardMessage[]>();
  const utterances: UtteranceEntry[] = [];
  const lastResults = Object.fromEntries(
    normalizedActorIds.map((actorId) => [actorId, null])
  ) as Record<MutualActorId, ToolResult | null>;
  const defaultRoles = defaultActorRoles(normalizedActorIds);
  const roleByActor = Object.fromEntries(
    normalizedActorIds.map((actorId) => [actorId, actorRoles[actorId] ?? defaultRoles[actorId]])
  ) as Record<MutualActorId, RoleId>;
  const mailbox = createTurnPhasedMailbox();
  const teamBulletin = createTeamBulletin();
  const sharedSettlement = createSharedSettlementState();
  const tensionLedger = createTensionLedger();
  const threads = Object.fromEntries(
    normalizedActorIds.map((actorId) => [
      actorId,
      createAgentThreadState({
        threadId: `thread:${actorId}`,
        agentId: actorId,
        roleId: roleByActor[actorId]
      })
    ])
  ) as Record<MutualActorId, ReturnType<typeof createAgentThreadState>>;
  const currentTasks = Object.fromEntries(
    normalizedActorIds.map((actorId) => [actorId, null])
  ) as Record<MutualActorId, string | null>;
  const hostileEngagementTicks = Object.fromEntries(
    normalizedActorIds.map((actorId) => [actorId, 0])
  ) as Record<MutualActorId, number>;
  const hostileAlerts = new Map<string, HostileAlert>();

  function roleOf(actorId: string) {
    return roleByActor[actorId as MutualActorId] ?? null;
  }

  function updateBulletin(actorId: MutualActorId, lastContribution?: string) {
    if (!socialContextEnabled) {
      return;
    }

    // Bulletin entries are public actor state, so they expose current work and
    // contributions without leaking an actor's private episodic memory.
    teamBulletin.update({
      actorId,
      roleId: roleByActor[actorId],
      ...(currentTasks[actorId] ? { currentTask: currentTasks[actorId] } : {}),
      ...(lastContribution ? { lastContribution } : {}),
      updatedAt: turnCounter
    });
  }

  function maybeAdvanceHostilePressure(actorId: MutualActorId) {
    if (!socialContextEnabled || !hostileEnabled) {
      return;
    }

    // Hostile pressure only appears after material/social context exists. This
    // keeps Phase 1 from manufacturing drama before the world has shared facts.
    if (!markerDropped && sharedSettlement.snapshot().knownSharedChests.length === 0) {
      hostileAlerts.delete(actorId);
      hostileEngagementTicks[actorId] = 0;
      return;
    }

    const decision = decideHostileAction({
      actorRole: "hostile",
      targetId: actorId,
      targetDistance: 4,
      homeDistance: 4,
      engagementTicks: hostileEngagementTicks[actorId],
      health: 20,
      allowedTargetIds: [actorId]
    });

    hostileAlerts.set(actorId, {
      action: decision.action,
      ...(decision.action === "move_to" ? { targetId: decision.targetId } : {}),
      ...(decision.action !== "move_to" ? { reason: decision.reason } : {})
    });

    if (decision.action === "move_to") {
      hostileEngagementTicks[actorId] += 1;
      const note = `bounded hostile pressure is approaching ${actorId}`;
      sharedSettlement.recordHostileSighting({
        actorId: "hostile",
        note,
        updatedAt: turnCounter
      });
      sharedSettlement.recordMajorEvent(note);
      tensionLedger.record(actorId, note, hostileEngagementTicks[actorId]);

      const warning = {
        id: `hostile:${turnCounter}:${actorId}`,
        from: "hostile",
        to: actorId,
        turnSent: turnCounter,
        kind: "warning" as const,
        payload: {
          text: note,
          targetId: actorId
        }
      };
      mailbox.enqueue(warning);
      threads[actorId].recordOutboundMail(warning);
    } else if (decision.action === "retreat") {
      hostileEngagementTicks[actorId] = 0;
      tensionLedger.record(actorId, decision.reason, 0);
    }
  }

  function enqueueSocialMail(entry: UtteranceEntry) {
    if (!socialContextEnabled || !entry.targetId) {
      return;
    }

    const mail = {
      id: `mail:${turnCounter}:${entry.actorId}:${entry.targetId}:${utterances.length}`,
      from: entry.actorId,
      to: entry.targetId,
      turnSent: turnCounter,
      kind: currentTasks[entry.actorId as MutualActorId] ? "task_handoff" as const : "social" as const,
      payload: {
        text: entry.text,
        ...(currentTasks[entry.actorId as MutualActorId]
          ? { taskId: currentTasks[entry.actorId as MutualActorId] }
          : {})
      }
    };

    // Mail is both immediate social context and thread evidence; recording both
    // sides makes later artifact review distinguish sent vs observed obligations.
    mailbox.enqueue(mail);
    const thread = threads[entry.actorId as MutualActorId];
    thread.recordOutboundMail(mail);
  }

  function rememberThreadEvent(actorId: MutualActorId, note: string) {
    if (!socialContextEnabled) {
      return;
    }

    threads[actorId].remember(note);
    sharedSettlement.recordMajorEvent(`${actorId}: ${note}`);
    updateBulletin(actorId, note);
  }

  function socialContext(actorId: string) {
    if (!socialContextEnabled) {
      return undefined;
    }

    const typedActorId = actorId as MutualActorId;
    const roleId = roleOf(actorId);

    // Providers receive a compact state bundle, not direct mutable stores. That
    // keeps role pressure visible while preserving runtime ownership of memory.
    return {
      role: roleId ? getRoleContract(roleId) : null,
      mailbox: mailbox.visible(actorId),
      teamBulletin: teamBulletin.visibleTo(actorId),
      sharedSettlement: sharedSettlement.snapshot(),
      hostileAlert: hostileAlerts.get(actorId) ?? null,
      thread: threads[typedActorId].snapshot()
    };
  }

  return {
    beginTurn(actorId: MutualActorId) {
      if (!socialContextEnabled) {
        return;
      }

      turnCounter += 1;
      mailbox.beginTurn(actorId);
      threads[actorId].beginTurn();

      // Visibility is turn-phased: mail becomes context at turn start, not at an
      // arbitrary point during another actor's tool execution.
      for (const item of mailbox.visible(actorId)) {
        threads[actorId].recordInboundMail(item);
      }

      threads[actorId].setCurrentTask(currentTasks[actorId]);
      maybeAdvanceHostilePressure(actorId);
      updateBulletin(actorId);
    },
    setCurrentTask(actorId: MutualActorId, taskId: string | null) {
      if (!socialContextEnabled) {
        return;
      }

      currentTasks[actorId] = taskId;
      threads[actorId].setCurrentTask(taskId);
      updateBulletin(actorId);
    },
    requestTalk(actorId: string, targetId: string) {
      if (actorId === targetId) {
        return {
          status: "available" as const
        };
      }

      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;

        return {
          status: "busy" as const,
          reason: `${targetId} is busy`
        };
      }

      return {
        status: "available" as const
      };
    },
    requestReply(actor: MutualActorId, target: MutualActorId): ReplyResult {
      if (actor === target) {
        return {
          status: "unavailable",
          reason: `${target} is unavailable`
        };
      }

      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;
        return {
          status: "busy",
          reason: `${actor} is busy`
        };
      }

      return {
        status: "available"
      };
    },
    recordHeardMessage(actorId: string, entry: HeardMessage) {
      const queue = heardMessages.get(actorId) ?? [];
      queue.push(snapshot(entry));

      if (queue.length > MAX_HEARD_MESSAGES) {
        queue.splice(0, queue.length - MAX_HEARD_MESSAGES);
      }

      heardMessages.set(actorId, queue);
    },
    consumeHeardMessages(actorId: string) {
      const queue = heardMessages.get(actorId) ?? [];
      heardMessages.delete(actorId);
      return snapshot(queue);
    },
    recordUtterance(entry: UtteranceEntry) {
      utterances.push(snapshot(entry));

      if (utterances.length > MAX_UTTERANCES) {
        utterances.splice(0, utterances.length - MAX_UTTERANCES);
      }

      if (socialContextEnabled && normalizedActorIds.includes(entry.actorId)) {
        const actorId = entry.actorId as MutualActorId;
        // Conversation is recorded as an active action because social progress
        // should be inspectable like movement or storage actions.
        threads[actorId].setActiveAction("converse");
        threads[actorId].updateWorkingMemory({
          nextIntendedAction: entry.targetId ? `await response from ${entry.targetId}` : null
        });
        enqueueSocialMail(entry);
      }
    },
    recentUtterances() {
      return snapshot(utterances);
    },
    markDroppedItem(actor: string, itemName: string) {
      markerDropped = normalizedActorIds.includes(actor) && itemName === markerItemName;

      if (socialContextEnabled && markerDropped) {
        sharedSettlement.recordMajorEvent(`${actor} dropped ${itemName}`);
      }
    },
    hasDroppedMarker() {
      return markerDropped;
    },
    markerItemName() {
      return markerItemName;
    },
    lastResult(actorId: MutualActorId) {
      return lastResults[actorId];
    },
    recordObservation(actorId: MutualActorId, observation: SocialObservation) {
      if (!socialContextEnabled) {
        return;
      }

      threads[actorId].recordObservation(observation);
      const blocker = hostileAlerts.get(actorId);
      threads[actorId].updateWorkingMemory({
        currentBlocker: blocker?.action === "move_to" ? "hostile_pressure" : null,
        nextIntendedAction: observation.visibleActors?.[0]?.id
          ? `respond to ${observation.visibleActors[0].id}`
          : null
      });
    },
    recordToolResult(actorId: MutualActorId, result: ToolResult) {
      lastResults[actorId] = snapshot(result);

      if (!socialContextEnabled) {
        return;
      }

      threads[actorId].setActiveAction(result.tool);
      threads[actorId].recordResult(result as Record<string, unknown>);
      // Failed tool results become explicit promises/blockers so the next turn
      // can explain retries instead of looping silently.
      threads[actorId].updateWorkingMemory({
        currentPromise: result.ok ? null : `${result.tool}:${result.status}`
      });

      if (typeof result.note === "string") {
        rememberThreadEvent(actorId, result.note);
      } else {
        updateBulletin(actorId, `${result.tool}:${result.status}`);
      }
    },
    rememberPrivateEvent(actorId: MutualActorId, note: string) {
      rememberThreadEvent(actorId, note);
    },
    rememberSharedChest(chestId: string, items: Array<{ name: string; count: number }>) {
      if (!socialContextEnabled) {
        return;
      }

      sharedSettlement.rememberSharedChest(chestId, items);
      sharedSettlement.recordMajorEvent(`shared chest ${chestId} updated`);
    },
    socialContext,
    threadSnapshot(actorId: MutualActorId) {
      return socialContextEnabled ? threads[actorId].snapshot() : null;
    },
    teamBulletinSnapshot() {
      return socialContextEnabled ? teamBulletin.snapshot() : [];
    },
    sharedSettlementSnapshot() {
      return socialContextEnabled ? sharedSettlement.snapshot() : null;
    },
    tensionEntries() {
      return socialContextEnabled ? tensionLedger.list() : [];
    },
    actorIds() {
      return [...normalizedActorIds];
    }
  };
}

export type MutualRuntimeState = ReturnType<typeof createMutualRuntimeState>;
