import { loadMutualProbeConfig } from "../config.js";
import { finalizeRunProbe, type ProbeRunResult } from "../runProbe.js";
import { closeBots, createBots } from "../runtime/createBots.js";
import { createMemory } from "../runtime/memory.js";
import { startDockerServer, type ServerHandle } from "../server/dockerServer.js";
import { mutualPersonas } from "./personas.js";
import { createMutualProviders } from "./provider.js";
import { createMutualRuntimeState } from "./runtimeState.js";
import { runMutualLoop } from "./mutualLoop.js";
import { createMutualTranscript } from "./transcript.js";
import { createMutualTools } from "./tools/index.js";

export async function runMutualProbe(): Promise<ProbeRunResult> {
  const config = loadMutualProbeConfig();
  let server: ServerHandle | null = null;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let result: { transcriptPath: string } | null = null;
  let caughtError: unknown;
  const cleanupErrors: unknown[] = [];

  try {
    server = await startDockerServer(config);
    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });

    const memories = {
      npc_a: createMemory(config.memoryLimit),
      npc_b: createMemory(config.memoryLimit)
    };
    const runtimeState = createMutualRuntimeState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable,
      markerItemName: "paper"
    });
    const transcript = createMutualTranscript({
      evidenceDir: config.evidenceDir,
      probeId: config.probeId,
      personas: {
        npc_a: `${mutualPersonas.npc_a.name}, ${mutualPersonas.npc_a.summary}`,
        npc_b: `${mutualPersonas.npc_b.name}, ${mutualPersonas.npc_b.summary}`
      }
    });

    const final = await runMutualLoop({
      bots,
      providers: createMutualProviders(),
      tools: createMutualTools({ runtimeState, memories }),
      transcript
    });

    result = {
      transcriptPath: await transcript.write(final.categories, {
        status: final.status,
        why: final.why
      })
    };
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
