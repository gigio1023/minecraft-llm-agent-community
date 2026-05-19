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

    const memory = createMemory(config.memoryLimit);
    const dialogueState = createDialogueState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable
    });
    const provider = createDeterministicProvider();
    const sharedStorageLedger = createSharedStorageLedger();
    const teamBulletin = createTeamBulletin();
    const transcript = createTranscript({
      evidenceDir: config.evidenceDir,
      probeId: config.probeId,
      bots: [bots.npc_a.username, bots.npc_b.username]
    });

    const final = await runAgentLoop({
      bots,
      provider,
      transcript,
      tools: {
        validateProposal,
        observe: ({ actor, target }) =>
          observe({ actor, target, dialogueState, memory }),
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
        inspect_chest: () => {
          return withActionWrapper(
            () => ({
              status: "unavailable",
              chestId: "shared-chest-1",
              message: "shared chest runtime is not wired in live probe yet"
            }),
            { tool: "inspect_chest" }
          );
        },
        deposit_shared: () => {
          return withActionWrapper(
            () => {
              void sharedStorageLedger;
              void teamBulletin;
              return {
                status: "unavailable",
                chestId: "shared-chest-1",
                message: "shared chest runtime is not wired in live probe yet"
              };
            },
            { tool: "deposit_shared" }
          );
        },
        withdraw_shared: () => {
          return withActionWrapper(
            () => ({
              status: "unavailable",
              chestId: "shared-chest-1",
              message: "shared chest runtime is not wired in live probe yet"
            }),
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
