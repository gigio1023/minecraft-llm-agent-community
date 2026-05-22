import { loadMutualProbeConfig } from "../config.js";
import { finalizeRunProbe, type ProbeRunResult } from "../runProbe.js";
import { closeBots, createBots } from "../runtime/createBots.js";
import { defaultActorRoles } from "../runtime/actorRoster.js";
import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "../runtime/actorWorkspace.js";
import { createMemory } from "../runtime/memory.js";
import { createProbeSession } from "../runtime/session/probeSession.js";
import { assignSeedActionSkillOwnership } from "../skills/ownership.js";
import { buildScenarioPersonas } from "./personas.js";
import { startDockerServer, type ServerHandle } from "../server/dockerServer.js";
import { createMutualProviders } from "./provider.js";
import { createMutualRuntimeState } from "./runtimeState.js";
import { runMutualLoop } from "./mutualLoop.js";
import { createMutualTranscript } from "./transcript.js";
import { createMutualTools } from "./tools/index.js";

/**
 * Runs the deterministic mutual probe against a real Docker-backed server.
 *
 * This path validates causal transcript shape for multi-actor interaction, but
 * still uses scripted providers so failures are attributable to runtime wiring.
 */
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
    const actorIds = Object.keys(bots);
    const actorRoles = defaultActorRoles(actorIds);
    const seedActionSkillOwnership = assignSeedActionSkillOwnership(actorIds, actorRoles);
    const session = createProbeSession({
      bots,
      actorIds,
      actorRoles,
      seedActionSkillOwnership
    });
    if (config.actorWorkspace.initializeOnStart) {
      await initializeActorWorkspaces({
        rootDir: config.actorWorkspace.rootDir,
        actors: session.actors,
        seedActionSkillOwnership: session.seed_skill_ownership
      });
    }
    const activeActionSkillsByActor = Object.fromEntries(
      await Promise.all(
        actorIds.map(async (actorId) => [
          actorId,
          await listActiveActorActionSkillRecords(config.actorWorkspace.rootDir, actorId)
        ] as const)
      )
    );
    const personas = buildScenarioPersonas(actorIds);

    // Keep actor memory separate from public transcript evidence. The provider
    // may read memory, but final acceptance comes from recorded tool/world steps.
    const memories = Object.fromEntries(
      actorIds.map((actorId) => [actorId, createMemory(config.memoryLimit)])
    );
    const runtimeState = createMutualRuntimeState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable,
      markerItemName: "paper",
      actorIds,
      socialContextEnabled: true
    });
    const transcript = createMutualTranscript({
      evidenceDir: config.evidenceDir,
      probeId: config.probeId,
      bots: actorIds,
      personas: Object.fromEntries(
        actorIds.map((actorId) => [actorId, `${personas[actorId].name}, ${personas[actorId].summary}`])
      )
    });

    const final = await runMutualLoop({
      bots,
      providers: createMutualProviders(actorIds),
      tools: createMutualTools({ runtimeState, memories, activeActionSkillsByActor }),
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
