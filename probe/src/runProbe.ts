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
  selectPrimaryTargetId
} from "./runtime/actorRoster.js";
import { createProbeSession } from "./runtime/session/probeSession.js";
import { assignSeedActionSkillOwnership } from "./skills/ownership.js";
import { initializeActorWorkspaces } from "./runtime/actorWorkspace.js";

export type ProbeRunResult = {
  transcriptPath: string;
  cleanupError?: unknown;
};

type FinalizeRunProbeOptions = {
  result?: { transcriptPath: string } | null;
  caughtError?: unknown;
  cleanupErrors?: unknown[];
};

type ObserveActor = Parameters<typeof observe>[0]["actor"];

function asObserveActor(bot: import("mineflayer").Bot): ObserveActor {
  return bot as unknown as ObserveActor;
}

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

async function teleportBotsToRequestedSpawn(
  bots: Record<string, import("mineflayer").Bot>,
  spawnConfig: { x: number; y: number; z: number }
) {
  const { x, y, z } = spawnConfig;

  if (![x, y, z].every(Number.isFinite)) {
    console.warn("Invalid spawn config:", spawnConfig);
    return;
  }

  const { exec } = await import("child_process");
  const util = await import("util");
  const execAsync = util.promisify(exec);

  try {
    console.log("Setting server world spawn via RCON...");
    await execAsync(`docker exec -w / skill-village-manual-mc-1 rcon-cli -- setworldspawn ${x} ${y} ${z}`);
  } catch (error) {
    console.warn("Failed to set world spawn via RCON (is the container named skill-village-manual-mc-1?). Error:", error);
  }

  const actorIds = Object.keys(bots);
  const offsets = [
    [0, 0, 0],
    [2, 0, 0],
    [-2, 0, 0],
    [0, 0, 2],
    [0, 0, -2]
  ];

  console.log("Waiting for 2 seconds to ensure bots are ready for commands...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await Promise.all(
    actorIds.map(async (actorId, index) => {
      const [dx, dy, dz] = offsets[index % offsets.length];
      const bot = bots[actorId];
      const tpCmd = `tp ${bot.username} ${x + dx} ${y + dy} ${z + dz}`;
      console.log(`[${actorId}] Sending teleport via RCON: ${tpCmd}`);
      
      try {
        await execAsync(`docker exec -w / skill-village-manual-mc-1 rcon-cli -- ${tpCmd}`);
      } catch (error) {
        console.warn(`[${actorId}] RCON teleport failed, trying bot.chat fallback...`);
        bot.chat(`/tp @s ${x + dx} ${y + dy} ${z + dz}`);
      }
    })
  );

  console.log("Waiting for 2 seconds for teleport to take effect...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

export async function runProbe(): Promise<ProbeRunResult> {
  const config = loadProbeConfig();
  let server: ServerHandle | null = null;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let caughtError: unknown;
  let result: { transcriptPath: string } | null = null;
  const cleanupErrors: unknown[] = [];

  try {
    // Local manual-server mode keeps behavior iteration fast; Docker startup is
    // still available through startDockerServer when the probe owns the server.
    // server = await startDockerServer(config);
    server = { host: "127.0.0.1", port: Number(process.env.MC_PORT || 32769), stop: async () => {} };
    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });
    
    await teleportBotsToRequestedSpawn(bots, config.spawn);
    
    const activeBots = bots;
    const actorIds = Object.keys(bots);
    const actorRoles = defaultActorRoles(actorIds);
    const seedActionSkillOwnership = assignSeedActionSkillOwnership(actorIds, actorRoles);
    // Session and workspace metadata are created before provider calls so every
    // transcript can explain which actor owned which action skills during a run.
    const session = createProbeSession({
      bots: activeBots,
      actorIds,
      actorRoles,
      seedActionSkillOwnership
    });
    const actorWorkspaceInitialization = config.actorWorkspace.initializeOnStart
      ? await initializeActorWorkspaces({
          rootDir: config.actorWorkspace.rootDir,
          actors: session.actors,
          seedActionSkillOwnership: session.seed_skill_ownership
        })
      : null;

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
      bots: actorIds.map((actorId) => activeBots[actorId].username),
      metadata: {
        // Metadata is duplicated into final output below because artifact review
        // often starts from either the transcript header or final summary.
        actor_sessions: session.actors,
        seed_skill_ownership: session.seed_skill_ownership,
        actor_workspace: {
          root_dir: config.actorWorkspace.rootDir,
          initialize_on_start: config.actorWorkspace.initializeOnStart,
          initialization: actorWorkspaceInitialization
        }
      }
    });
    const loops = actorIds.map(async (actorId) => {
      const actor = activeBots[actorId];
      const targetId = selectPrimaryTargetId(actorIds, actorId);
      const target = activeBots[targetId];
      const actorRole: RoleId = actorRoles[actorId] ?? "gatherer";
      const sharedChest = createMineflayerSharedChestAccessor(actor);

      function readActorInventory() {
        return actor.inventory?.items().map((item) => ({
          name: item.name,
          count: item.count
        })) ?? [];
      }

      return runAgentLoop({
      bots: { actor, target },
      roleId: actorRole,
      provider,
      transcript,
      tools: {
        validateProposal,
        observe: ({ actor, target }) =>
          observe({
            actor: asObserveActor(actor),
            target: asObserveActor(target),
            dialogueState,
            memory,
            sharedChest
          }),
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
            (signal) => collectLogs({ bot: actor, signal }),
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
    });

    const finals = await Promise.all(loops);
    const finalByActor = Object.fromEntries(
      actorIds.map((actorId, index) => [actorId, finals[index]])
    );
    const transcriptPath = await transcript.write({
      status: finals.every((final) => final.status === "success") ? "success" : "partial",
      why: finals.map((final, index) => `${actorIds[index]}: ${final.why}`).join("; "),
      actor_sessions: session.actors,
      seed_skill_ownership: session.seed_skill_ownership,
      actor_workspace: {
        root_dir: config.actorWorkspace.rootDir,
        initialize_on_start: config.actorWorkspace.initializeOnStart,
        initialization: actorWorkspaceInitialization
      },
      per_actor_final: finalByActor
    });
    result = { transcriptPath };
  } catch (error) {
    caughtError = error;
  } finally {
    console.log("Waiting 15 seconds before disconnecting bots so you can observe them...");
    await new Promise((r) => setTimeout(r, 15000));
    
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
