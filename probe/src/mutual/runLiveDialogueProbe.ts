import { loadMutualProbeConfig } from "../config.js";
import { createBots, closeBots } from "../runtime/createBots.js";
import { createMemory } from "../runtime/memory.js";
import { finalizeRunProbe, type ProbeRunResult } from "../runProbe.js";
import { startDockerServer, type ServerHandle } from "../server/dockerServer.js";
import { moveTo } from "../tools/moveTo.js";
import { remember } from "../tools/remember.js";
import { wait } from "../tools/wait.js";
import {
  buildDialogueContext,
  mutualPersonas,
  type DialogueTranscriptEntry,
  type MutualActorId
} from "./dialogueContext.js";
import { runMutualLoop } from "./mutualLoop.js";
import { loadOpenAICodexAuth } from "./openaiCodexAuth.js";
import { createOpenAICodexProvider } from "./openaiCodexProvider.js";
import { createMutualRuntimeState } from "./runtimeState.js";
import { createMutualTranscript } from "./transcript.js";
import { executeMutualTool, allowedMutualTools } from "./tools/index.js";

type LastResult = {
  tool: string;
  status: string;
};

const liveAllowedTools = allowedMutualTools.filter((tool) => tool !== "drop_item");

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readStringArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected non-empty string arg: ${name}`);
  }

  return value;
}

function readTicksArg(args: Record<string, unknown>, fallbackTicks: number) {
  const value = args.ticks;

  if (value === undefined) {
    return fallbackTicks;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("Expected non-negative integer arg: ticks");
  }

  return value;
}

function createRecentTranscript(runtimeState: ReturnType<typeof createMutualRuntimeState>) {
  return runtimeState.recentUtterances().map<DialogueTranscriptEntry>((entry) => ({
    actorId: entry.actorId,
    actorName: mutualPersonas[entry.actorId as MutualActorId].name,
    tool: "converse",
    args: {
      utterance: entry.text,
      ...(entry.targetId ? { target: entry.targetId } : {})
    },
    result: {
      status: entry.targetId ? "said_to_target" : "said_aloud"
    }
  }));
}

export async function runLiveDialogueProbe(): Promise<ProbeRunResult> {
  const config = loadMutualProbeConfig();
  const auth = await loadOpenAICodexAuth(config.liveDialogue.authStorePath);
  const provider = createOpenAICodexProvider({
    accessToken: auth.accessToken,
    maxRetries: config.liveDialogue.maxRetries
  });
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable,
    markerItemName: "paper"
  });
  const memories: Record<MutualActorId, ReturnType<typeof createMemory>> = {
    npc_a: createMemory(config.memoryLimit),
    npc_b: createMemory(config.memoryLimit)
  };
  const lastResults = new Map<MutualActorId, LastResult | null>([
    ["npc_a", null],
    ["npc_b", null]
  ]);

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

    const transcript = createMutualTranscript({
      evidenceDir: config.evidenceDir,
      probeId: "live_npc_dialogue",
      bots: [bots.npc_a.username, bots.npc_b.username]
    });

    await delay(config.liveDialogue.delayStartMs);

    const activeBots = bots;

    const final = await runMutualLoop({
      actors: activeBots,
      providers: {
        npc_a: {
          async next({ observation, lastResult }) {
            return provider.next(
              buildDialogueContext({
                actorId: "npc_a",
                allowedTools: [...liveAllowedTools],
                persona: mutualPersonas.npc_a,
                observation: {
                  ...observation,
                  ...(lastResult ? { lastActionResult: lastResult } : {})
                },
                memory: memories.npc_a.list(),
                recentTranscript: createRecentTranscript(runtimeState)
              })
            );
          }
        },
        npc_b: {
          async next({ observation, lastResult }) {
            return provider.next(
              buildDialogueContext({
                actorId: "npc_b",
                allowedTools: [...liveAllowedTools],
                persona: mutualPersonas.npc_b,
                observation: {
                  ...observation,
                  ...(lastResult ? { lastActionResult: lastResult } : {})
                },
                memory: memories.npc_b.list(),
                recentTranscript: createRecentTranscript(runtimeState)
              })
            );
          }
        }
      },
      tools: {
        async observe(actorId) {
          const actor = activeBots[actorId];
          const targetId = actorId === "npc_a" ? "npc_b" : "npc_a";
          const target = activeBots[targetId];

          return {
            visibleActors: [
              {
                id: targetId,
                distance: Number(actor.entity.position.distanceTo(target.entity.position).toFixed(2)),
                busy: false
              }
            ],
            heardMessages: runtimeState.consumeHeardMessages(actorId),
            recentUtterances: runtimeState.recentUtterances(),
            marker: {
              seen: true,
              itemName: runtimeState.markerItemName
            }
          };
        },
        lastResult(actorId) {
          return lastResults.get(actorId) ?? null;
        },
        async execute(actorId, proposal, observation) {
          const actor = activeBots[actorId];
          const targetId = actorId === "npc_a" ? "npc_b" : "npc_a";
          const target = activeBots[targetId];
          const result = await executeMutualTool({
            proposal,
            actor,
            runtimeState,
            observation,
            transcript,
            handlers: {
              async observe_world() {
                return {
                  status: "observed",
                  observation
                };
              },
              async move_to({ args }) {
                return moveTo({
                  actor,
                  target,
                  targetId: readStringArg(args, "target")
                });
              },
              async wait({ args }) {
                return wait({
                  ticks: readTicksArg(args, config.dialogue.waitTicks)
                });
              },
              remember({ args }) {
                return remember({
                  memory: memories[actorId],
                  note: readStringArg(args, "note")
                });
              }
            }
          });

          lastResults.set(actorId, {
            tool: proposal.tool,
            status:
              typeof result === "object" && result !== null && !Array.isArray(result) && "status" in result
                ? String(result.status)
                : "unknown"
          });

          return result;
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
