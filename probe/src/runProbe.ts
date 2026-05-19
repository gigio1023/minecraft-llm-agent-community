import { loadProbeConfig } from "./config.js";
import { createDeterministicProvider } from "./provider/deterministicProvider.js";
import { closeBots, createBots } from "./runtime/createBots.js";
import { createDialogueState } from "./runtime/dialogueState.js";
import { createMemory } from "./runtime/memory.js";
import { runAgentLoop } from "./runtime/agentLoop.js";
import { createTranscript } from "./runtime/transcript.js";
import { startDockerServer, type ServerHandle } from "./server/dockerServer.js";
import { validateProposal } from "./tools/index.js";
import { withActionWrapper } from "./mutual/tools/wrapper.js";
import { moveTo } from "./tools/moveTo.js";
import { observe } from "./tools/observe.js";
import { remember } from "./tools/remember.js";
import { say } from "./tools/say.js";
import { wait } from "./tools/wait.js";
import { collectLogs } from "./tools/collectLogs.js";
import { craftItem } from "./tools/craftItem.js";
import { createSharedStorageLedger } from "./gameplay/storage/sharedStorageLedger.js";
import { createTeamBulletin } from "./npc/social/teamBulletin.js";
import { createSharedSettlementState } from "./memory/shared/sharedSettlementState.js";
import { getRoleContract, type RoleId } from "./npc/roles/contracts.js";
import {
  depositToSharedChest,
  inspectChest,
  withdrawFromSharedChest
} from "./tools/sharedChest.js";
import { createMineflayerSharedChestAccessor } from "./tools/liveSharedChest.js";
import {
  defaultActorRoles,
  selectPrimaryActorId,
  selectPrimaryTargetId
} from "./runtime/actorRoster.js";

export type ProbeRunResult = {
  transcriptPath: string;
  cleanupError?: unknown;
};

type FinalizeRunProbeOptions = {
  result?: { transcriptPath: string } | null;
  caughtError?: unknown;
  cleanupErrors?: unknown[];
};

function readStringArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected non-empty string arg: ${name}`);
  }

  return value;
}

function readTicksArg(args: Record<string, unknown>) {
  const value = args.ticks;

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("Expected non-negative integer arg: ticks");
  }

  return value;
}

function assertTarget(targetId: string, expectedTargetId: string) {
  if (targetId !== expectedTargetId) {
    throw new Error(`Unsupported target: ${targetId}`);
  }
}

function combineCleanupError(cleanupErrors: readonly unknown[]) {
  if (cleanupErrors.length === 0) {
    return undefined;
  }

  if (cleanupErrors.length === 1) {
    return cleanupErrors[0];
  }

  return new AggregateError(cleanupErrors, "Probe cleanup failed");
}

export function finalizeRunProbe({
  result = null,
  caughtError,
  cleanupErrors = []
}: FinalizeRunProbeOptions): ProbeRunResult {
  if (caughtError && cleanupErrors.length > 0) {
    throw new AggregateError(
      [caughtError, ...cleanupErrors],
      "Probe failed and cleanup also failed"
    );
  }

  if (caughtError) {
    throw caughtError;
  }

  if (result) {
    const cleanupError = combineCleanupError(cleanupErrors);
    return cleanupError ? { ...result, cleanupError } : result;
  }

  const cleanupError = combineCleanupError(cleanupErrors);

  if (cleanupError) {
    throw cleanupError;
  }

  throw new Error("Probe ended unexpectedly");
}

export async function runProbe(): Promise<ProbeRunResult> {
  const config = loadProbeConfig();
  let server: ServerHandle | null = null;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let caughtError: unknown;
  let result: { transcriptPath: string } | null = null;
  const cleanupErrors: unknown[] = [];

  try {
    server = await startDockerServer(config);
    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });
    const actorIds = Object.keys(bots);
    const primaryActorId = selectPrimaryActorId(actorIds);
    const primaryTargetId = selectPrimaryTargetId(actorIds, primaryActorId);
    const activeBots = bots;
    const actor = activeBots[primaryActorId];
    const target = activeBots[primaryTargetId];

    const memory = createMemory(config.memoryLimit);
    const dialogueState = createDialogueState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable
    });
    const provider = createDeterministicProvider();
    const sharedStorageLedger = createSharedStorageLedger();
    const teamBulletin = createTeamBulletin();
    const sharedSettlementState = createSharedSettlementState();
    const transcript = createTranscript({
      evidenceDir: config.evidenceDir,
      probeId: config.probeId,
      bots: actorIds.map((actorId) => activeBots[actorId].username)
    });
    const actorRole: RoleId = defaultActorRoles(actorIds)[primaryActorId] ?? "gatherer";
    const sharedChest = createMineflayerSharedChestAccessor(actor);

    function readActorInventory() {
      return actor.inventory?.items().map((item) => ({
        name: item.name,
        count: item.count
      })) ?? [];
    }

    const final = await runAgentLoop({
      bots: { actor, target },
      provider,
      transcript,
      tools: {
        validateProposal,
        observe: ({ actor, target }) =>
          observe({ actor, target, dialogueState, memory, sharedChest }),
        move_to: ({ actor, target, args }) => {
          return withActionWrapper(
            () => {
              const targetId = readStringArg(args, "target");
              assertTarget(targetId, target.username);
              return moveTo({ actor, target, targetId });
            },
            { tool: "move_to" }
          );
        },
        collect_logs: ({ actor }) => {
          return withActionWrapper(
            () => collectLogs({ bot: actor }),
            { tool: "collect_logs" }
          );
        },
        craft_item: ({ actor, args }) => {
          return withActionWrapper(
            () => craftItem({ bot: actor, itemName: readStringArg(args, "itemName") }),
            { tool: "craft_item" }
          );
        },
        inspect_chest: async () => {
          return withActionWrapper(
            async () => {
              const result = await inspectChest({
                actorId: actor.username,
                roleId: actorRole,
                chest: sharedChest,
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                currentTask: getRoleContract(actorRole).priorityList[0]
              });

              if (result.status === "inspected") {
                sharedSettlementState.rememberSharedChest(
                  result.chestId,
                  result.items ?? []
                );
              }

              return result;
            },
            { tool: "inspect_chest" }
          );
        },
        deposit_shared: ({ args }) => {
          return withActionWrapper(
            async () => {
              const result = await depositToSharedChest({
                actorId: actor.username,
                roleId: actorRole,
                chest: sharedChest,
                inventory: {
                  items: readActorInventory
                },
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                itemName: readStringArg(args, "itemName"),
                count: typeof args.count === "number" ? args.count : 1,
                currentTask: "deposit_shared_materials"
              });

              sharedSettlementState.rememberSharedChest(
                result.chestId,
                sharedStorageLedger.latestChest(result.chestId) ?? []
              );

              return result;
            },
            { tool: "deposit_shared" }
          );
        },
        withdraw_shared: ({ args }) => {
          return withActionWrapper(
            async () => {
              const result = await withdrawFromSharedChest({
                actorId: actor.username,
                roleId: actorRole,
                chest: sharedChest,
                inventory: {
                  items: readActorInventory
                },
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                itemName: readStringArg(args, "itemName"),
                count: typeof args.count === "number" ? args.count : 1,
                reason:
                  typeof args.reason === "string" && args.reason.length > 0
                    ? args.reason
                    : "runtime withdrawal",
                currentTask: getRoleContract(actorRole).priorityList[0]
              });

              sharedSettlementState.rememberSharedChest(
                result.chestId,
                sharedStorageLedger.latestChest(result.chestId) ?? []
              );

              return result;
            },
            { tool: "withdraw_shared" }
          );
        },
        say: ({ actor, target, args }) => {
          return withActionWrapper(
            () => {
              const targetId = readStringArg(args, "target");
              const text = readStringArg(args, "text");
              assertTarget(targetId, target.username);
              return say({ actor, target, dialogueState, text });
            },
            { tool: "say" }
          );
        },
        wait: ({ args }) => {
          return withActionWrapper(
            () => wait({ ticks: readTicksArg(args) }),
            { tool: "wait" }
          );
        },
        remember: ({ args }) => {
          return withActionWrapper(
            () => remember({ memory, note: readStringArg(args, "note") }),
            { tool: "remember" }
          );
        }
      }
    });

    const transcriptPath = await transcript.write(final);
    result = { transcriptPath };
  } catch (error) {
    caughtError = error;
  } finally {
    if (bots) {
      try {
        await closeBots(bots);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }

    if (server) {
      try {
        await server.stop();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }

  return finalizeRunProbe({
    result,
    caughtError,
    cleanupErrors
  });
}
