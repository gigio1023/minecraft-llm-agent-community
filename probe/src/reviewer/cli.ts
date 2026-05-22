import { loadProbeConfig } from "../config.js";
import { buildActorProviderContext } from "../provider/actorProviderContext.js";
import { loadOpenAICodexAuth } from "../mutual/openaiCodexAuth.js";
import { listActiveActorActionSkillRecords } from "../runtime/actorWorkspace.js";
import { createOpenAICodexReviewer } from "./openaiCodexReviewer.js";
import { runQueuedActorReviewJobs } from "./reviewerQueue.js";

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function main() {
  const config = loadProbeConfig();
  const requestedActors = process.argv.slice(2);
  const actorIds = requestedActors.length > 0 ? requestedActors : config.bots;

  try {
    const results = [];
    const reviewer =
      process.env.REVIEW_ACTORS_PROVIDER === "openai-codex"
        ? createOpenAICodexReviewer({
            accessToken: (await loadOpenAICodexAuth(config.liveDialogue.authStorePath)).accessToken,
            model: config.liveDialogue.model,
            reasoning: config.liveDialogue.reasoning
          })
        : undefined;

    for (const actorId of actorIds) {
      const activeActionSkills = await listActiveActorActionSkillRecords(
        config.actorWorkspace.rootDir,
        actorId
      );
      const actorContext = await buildActorProviderContext({
        actorWorkspaceRootDir: config.actorWorkspace.rootDir,
        actorId,
        activeActionSkills
      });
      const actorResults = await runQueuedActorReviewJobs(
        config.actorWorkspace.rootDir,
        actorId,
        {
          ...(reviewer ? { reviewer, actorContext } : {}),
          applyRelationshipEventProposals:
            process.env.REVIEW_APPLY_RELATIONSHIP_EVENTS === "1"
        }
      );
      results.push({ actorId, reviews: actorResults });
    }

    console.log(JSON.stringify({ schema: "actor-review-run/v1", results }, null, 2));
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

void main();
