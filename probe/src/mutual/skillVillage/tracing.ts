import { LangfuseSpanProcessor } from "@langfuse/otel";
import { propagateAttributes, startObservation } from "@langfuse/tracing";
import { NodeSDK } from "@opentelemetry/sdk-node";

const localDefaults = {
  publicKey: "pk-lf-minecraft-local",
  secretKey: "sk-lf-minecraft-local",
  baseUrl: "http://localhost:3000"
};

const sessionId = process.env.LANGFUSE_SESSION_ID ?? `skill-village-${Date.now()}`;
let sdk: NodeSDK | undefined;

function tracingEnabled() {
  return process.env.LANGFUSE_ENABLED !== "false";
}

function ensureLangfuseEnv() {
  process.env.LANGFUSE_PUBLIC_KEY ??= localDefaults.publicKey;
  process.env.LANGFUSE_SECRET_KEY ??= localDefaults.secretKey;
  process.env.LANGFUSE_BASE_URL ??= localDefaults.baseUrl;
}

export function startTracing() {
  if (!tracingEnabled() || sdk) {
    return;
  }

  ensureLangfuseEnv();
  sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()]
  });
  sdk.start();
}

export async function traceGeneration<T>(
  name: string,
  input: unknown,
  metadata: Record<string, unknown>,
  run: () => Promise<T>
) {
  if (!tracingEnabled()) {
    return run();
  }

  return propagateAttributes(
    {
      sessionId,
      tags: ["minecraft-npc-probe", "openai-codex"],
      metadata: { feature: "skill-village" }
    },
    async () => {
      const observation = startObservation(
        name,
        {
          input,
          model: "gpt-5.4-mini",
          modelParameters: { reasoningEffort: "low" },
          metadata
        },
        { asType: "generation" }
      );

      try {
        const output = await run();
        observation.update({ output });
        return output;
      } catch (error) {
        observation.update({
          output: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
        throw error;
      } finally {
        observation.end();
      }
    }
  );
}

export async function flushTracing() {
  if (!sdk) {
    return;
  }

  const activeSdk = sdk;
  sdk = undefined;

  try {
    await activeSdk.shutdown();
  } catch (error) {
    console.warn(`Langfuse flush failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
