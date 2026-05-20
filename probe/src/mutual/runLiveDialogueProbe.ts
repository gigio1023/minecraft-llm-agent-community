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
  buildDialoguePersonas,
  getDialoguePersona,
  type DialogueTranscriptEntry,
  type MutualActorId
} from "./dialogueContext.js";
import { runMutualLoop } from "./mutualLoop.js";
import { loadOpenAICodexAuth } from "./openaiCodexAuth.js";
import { createOpenAICodexProvider } from "./openaiCodexProvider.js";
import { createMutualRuntimeState } from "./runtimeState.js";
import { createMutualTranscript } from "./transcript.js";
import { executeMutualTool, allowedMutualTools } from "./tools/index.js";
import type { ToolResult } from "./types.js";
import { toToolResult } from "./tools/wrapper.js";
import { writeProviderInputSnapshot } from "../provider/providerInputStore.js";



const liveAllowedTools = allowedMutualTools.filter((tool) => tool !== "drop_item");

// Live provider context must be JSON-safe because it is sent to the Responses
// API and may also appear in trace metadata.
function toDialogueJsonValue(value: unknown): import("./dialogueContext.js").DialogueJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toDialogueJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toDialogueJsonValue(entry)])
    );
  }

  throw new Error(`Dialogue values must be JSON-safe, received ${typeof value}`);
}

function toDialogueToolResult(result: ToolResult) {
  return toDialogueJsonValue(result) as import("./dialogueContext.js").DialogueJsonObject;
}

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
  // Recent utterances give the provider short social continuity without handing
  // it the whole transcript or mutable runtime state.
  return runtimeState.recentUtterances().map<DialogueTranscriptEntry>((entry) => ({
    actorId: entry.actorId,
    actorName: getDialoguePersona(entry.actorId).name,
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
    const activeBots = bots;
    const actorIds = Object.keys(bots);
    const personas = buildDialoguePersonas(actorIds);
    const pair = actorIds.slice(0, 2) as MutualActorId[];
    const [actorA, actorB] = pair;
    const providerTurnCounters = new Map<MutualActorId, number>(
      pair.map((actorId) => [actorId, 0])
    );

    if (!actorA || !actorB) {
      throw new Error("live mutual dialogue probe requires at least two NPCs");
    }

    const memories = Object.fromEntries(
      actorIds.map((actorId) => [actorId, createMemory(config.memoryLimit)])
    ) as Record<MutualActorId, ReturnType<typeof createMemory>>;
    const lastResults = new Map<MutualActorId, ToolResult | null>(
      actorIds.map((actorId) => [actorId, null])
    );
    const runtimeState = createMutualRuntimeState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable,
      markerItemName: "paper",
      actorIds,
      socialContextEnabled: true
    });
    const transcript = createMutualTranscript({
      evidenceDir: config.evidenceDir,
      probeId: "live_npc_dialogue",
      bots: actorIds.map((actorId) => activeBots[actorId].username)
    });

    // Delay before the first provider call lets both Mineflayer clients settle
    // so early dialogue failures are not just login/spawn timing artifacts.
    await delay(config.liveDialogue.delayStartMs);

    async function writeLiveProviderSnapshot(
      actorId: MutualActorId,
      input: import("./dialogueContext.js").DialogueJsonObject
    ) {
      const nextTurn = (providerTurnCounters.get(actorId) ?? 0) + 1;
      providerTurnCounters.set(actorId, nextTurn);
      const turnId = `turn-${String(nextTurn).padStart(4, "0")}`;

      await writeProviderInputSnapshot(config.actorWorkspace.rootDir, {
        schema: "provider-input-snapshot/v1",
        snapshot_id: turnId,
        actor_id: actorId,
        turn_id: turnId,
        provider_id: config.liveDialogue.providerId,
        model: config.liveDialogue.model,
        created_at: new Date().toISOString(),
        input: input as import("../provider/inputSnapshot.js").JsonValue,
        allowed_tools: [...liveAllowedTools]
      });
    }

    const final = await runMutualLoop({
      actors: {
        [actorA]: activeBots[actorA],
        [actorB]: activeBots[actorB]
      },
      providers: {
        [actorA]: {
          async next({ observation, lastResult }) {
            const input = buildDialogueContext({
              actorId: actorA,
              allowedTools: [...liveAllowedTools],
              persona: personas[actorA] ?? getDialoguePersona(actorA, 0),
              observation: {
                ...observation,
                ...(lastResult ? { lastActionResult: toDialogueToolResult(lastResult) } : {})
              },
              memory: memories[actorA].list(),
              recentTranscript: createRecentTranscript(runtimeState)
            });
            await writeLiveProviderSnapshot(actorA, input);
            return provider.next(input);
          }
        },
        [actorB]: {
          async next({ observation, lastResult }) {
            const input = buildDialogueContext({
              actorId: actorB,
              allowedTools: [...liveAllowedTools],
              persona: personas[actorB] ?? getDialoguePersona(actorB, 1),
              observation: {
                ...observation,
                ...(lastResult ? { lastActionResult: toDialogueToolResult(lastResult) } : {})
              },
              memory: memories[actorB].list(),
              recentTranscript: createRecentTranscript(runtimeState)
            });
            await writeLiveProviderSnapshot(actorB, input);
            return provider.next(input);
          }
        }
      },
      tools: {
        async observe(actorId) {
          runtimeState.beginTurn(actorId);
          const actor = activeBots[actorId];
          const targetId = actorId === actorA ? actorB : actorA;
          const target = activeBots[targetId];

          const observation = {
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
              itemName: runtimeState.markerItemName()
            }
          };

          runtimeState.recordObservation(actorId, observation);

          // Social context is derived after the raw observation so provider
          // input can include mailbox/bulletin state without mutating it.
          const socialContext = runtimeState.socialContext?.(actorId);

          return {
            ...observation,
            ...(socialContext
              ? (toDialogueJsonValue(socialContext) as import("./dialogueContext.js").DialogueJsonObject)
              : {})
          };
        },
        lastResult(actorId) {
          return lastResults.get(actorId) ?? null;
        },
        async execute(actorId, proposal, observation) {
          const actor = activeBots[actorId];
          const targetId = actorId === actorA ? actorB : actorA;
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

          lastResults.set(actorId, toToolResult(result, proposal.tool));

          return toDialogueJsonValue(result);
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
