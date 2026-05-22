import { loadProbeConfig } from "./config.js";
import { createDeterministicProvider } from "./provider/deterministicProvider.js";
import { createOpenAICodexGameplayProvider } from "./provider/openaiCodexGameplayProvider.js";
import { closeBots, createBots } from "./runtime/createBots.js";
import { createDialogueState } from "./runtime/dialogueState.js";
import { createMemory } from "./runtime/memory.js";
import { runAgentLoop } from "./runtime/agentLoop.js";
import { createTranscript } from "./runtime/transcript.js";
import { loadOpenAICodexAuth } from "./mutual/openaiCodexAuth.js";
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
import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "./runtime/actorWorkspace.js";
import {
  buildLiveSmokeServerContext,
  ensureLiveSmokeServer
} from "./server/liveSmokeServer.js";
import { readManualMinecraftPort } from "./server/manualMinecraftPort.js";

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

function readOptionalPositiveIntegerArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected positive integer arg: ${name}`);
  }

  return value;
}

export function readProbeObserveMs(value = process.env.PROBE_OBSERVE_MS) {
  if (value === undefined || value.trim().length === 0) {
    return 15_000;
  }

  const milliseconds = Number(value);
  if (!Number.isInteger(milliseconds) || milliseconds < 0) {
    throw new Error(`PROBE_OBSERVE_MS must be a non-negative integer, got: ${value}`);
  }

  return milliseconds;
}

export function readProbeMaxActions(value = process.env.PROBE_MAX_ACTIONS) {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const maxActions = Number(value);
  if (!Number.isInteger(maxActions) || maxActions <= 0) {
    throw new Error(`PROBE_MAX_ACTIONS must be a positive integer, got: ${value}`);
  }

  return maxActions;
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
  spawnConfig: { x: number; y: number; z: number },
  rcon?: {
    composeFile: string;
    composeDir: string;
    env: NodeJS.ProcessEnv;
  }
) {
  const { x, y, z } = spawnConfig;

  if (![x, y, z].every(Number.isFinite)) {
    console.warn("Invalid spawn config:", spawnConfig);
    return;
  }

  const { execFile } = await import("child_process");
  const util = await import("util");
  const execFileAsync = util.promisify(execFile);
  const runRcon = async (args: string[]) => {
    if (!rcon) {
      throw new Error("RCON context unavailable");
    }

    await execFileAsync(
      "docker",
      ["compose", "-f", rcon.composeFile, "exec", "-T", "mc", "rcon-cli", "--", ...args],
      {
        cwd: rcon.composeDir,
        env: rcon.env
      }
    );
  };

  try {
    console.log("Setting server world spawn via RCON...");
    await runRcon([
      "setworldspawn",
      String(Math.floor(x)),
      String(Math.floor(y)),
      String(Math.floor(z))
    ]);
  } catch (error) {
    console.warn("Failed to set world spawn via RCON. Error:", error);
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
      const tpArgs = ["tp", bot.username, String(x + dx), String(y + dy), String(z + dz)];
      console.log(`[${actorId}] Sending teleport via RCON: ${tpArgs.join(" ")}`);
      
      try {
        await runRcon(tpArgs);
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
  const maxActions = readProbeMaxActions();
  const gameplayAuth =
    config.gameplayProvider.providerId === "openai-codex"
      ? await loadOpenAICodexAuth(config.liveDialogue.authStorePath)
      : null;
  let server: { host: string; port: number; stop(): Promise<void> } | null = null;
  let rconContext: ReturnType<typeof buildLiveSmokeServerContext> | undefined;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let caughtError: unknown;
  let result: { transcriptPath: string } | null = null;
  const cleanupErrors: unknown[] = [];

  try {
    const manualMinecraftPort = readManualMinecraftPort();
    if (manualMinecraftPort !== undefined) {
      server = {
        host: "127.0.0.1",
        port: manualMinecraftPort,
        stop: async () => {}
      };
    } else {
      const liveSmokeServer = await ensureLiveSmokeServer(config);
      if (!liveSmokeServer.host || !liveSmokeServer.port) {
        throw new Error("Live smoke server did not return a joinable endpoint");
      }
      rconContext = buildLiveSmokeServerContext(config);
      server = {
        host: liveSmokeServer.host,
        port: liveSmokeServer.port,
        // Keep the managed smoke server running so the user can inspect it.
        stop: async () => {}
      };
    }
    console.log(`minecraft_direct_connect=${server.host}:${server.port}`);
    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });
    
    await teleportBotsToRequestedSpawn(bots, config.spawn, rconContext);
    
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
    const activeActionSkillsByActor = new Map(
      await Promise.all(
        actorIds.map(async (actorId) => [
          actorId,
          await listActiveActorActionSkillRecords(config.actorWorkspace.rootDir, actorId)
        ] as const)
      )
    );

    const memory = createMemory(config.memoryLimit);
    const dialogueState = createDialogueState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable
    });
    const provider =
      config.gameplayProvider.providerId === "openai-codex"
        ? createOpenAICodexGameplayProvider({
            accessToken: gameplayAuth?.accessToken ?? "",
            model: config.gameplayProvider.model,
            reasoning: config.gameplayProvider.reasoning,
            maxRetries: config.gameplayProvider.maxRetries
          })
        : createDeterministicProvider();
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
        maxActions,
        activeActionSkills: activeActionSkillsByActor.get(actorId) ?? [],
        artifacts: {
          actorWorkspaceRootDir: config.actorWorkspace.rootDir,
          providerInputSnapshots: {
            provider_id: config.gameplayProvider.providerId,
            model: config.gameplayProvider.model
          },
          providerOutputSnapshots: {
            provider_id: config.gameplayProvider.providerId,
            model: config.gameplayProvider.model
          }
        },
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
          collect_logs: ({ actor, args }) => {
            return withActionWrapper(
              (signal) =>
                collectLogs({
                  bot: actor,
                  signal,
                  targetCount: readOptionalPositiveIntegerArg(args, "targetCount")
                }),
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
    const observeMs = readProbeObserveMs();
    if (observeMs > 0) {
      console.log(`Waiting ${observeMs}ms before disconnecting bots so you can observe them...`);
      await new Promise((r) => setTimeout(r, observeMs));
    }
    
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
