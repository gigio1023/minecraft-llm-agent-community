# Live NPC Dialogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate live-provider mutual dialogue probe where two headless Mineflayer NPCs choose one bounded action per turn from runtime-provided context and produce visible in-world conversation plus a transcript artifact.

**Architecture:** Keep the existing deterministic `mutual_npc_interaction_probe_v1` runnable, and add a sibling live-dialogue path instead of replacing it. The live path builds a structured context bundle, calls an `openai-codex` provider for one JSON action per turn, validates that action against the allowed tool surface, executes it through runtime-owned tools, and records the result to transcript and memory.

**Tech Stack:** Bun 1.3.x, TypeScript, Mineflayer `^4.37.1`, Docker vanilla Minecraft `1.21.11`, repo-local `openai-codex` auth store, `gpt-5.4-mini`, `node:test`

---

## File Structure

### Shared files to modify

- `probe/package.json`
  - Add a dedicated live dialogue script such as `probe:v1:live`.
- `probe/src/config.ts`
  - Add live dialogue provider config, auth store path, model id, reasoning mode, retry limit, and delayed start default.
- `probe/src/mutual/types.ts`
  - Extend the mutual action/result types so `converse`, utterance capture, provider metadata, and transcript snapshots are strongly typed.
- `probe/src/mutual/transcript.ts`
  - Persist live utterances, action args, provider reasoning metadata, and failure states.
- `probe/src/mutual/runtimeState.ts`
  - Track recent utterances, heard-message delivery, and short remembered notes for prompt context.
- `probe/src/mutual/provider.ts`
  - Keep the deterministic provider for contract tests, but export a shared provider interface used by both deterministic and live paths.
- `probe/src/mutual/tools/index.ts`
  - Register `converse` and route provider-selected tools through one validation path.
- `probe/src/mutual/mutualLoop.ts`
  - Allow async provider turns and preserve bounded validation and category recording.
- `probe/test/runtimeLogic.test.ts`
  - Add live dialogue context, schema validation, bounded retry, and `converse` contract tests.
- `probe/test/transcript.test.ts`
  - Add transcript assertions for live utterances and memory snapshots.
- `probe/test/serverConfig.test.ts`
  - Lock the new live dialogue config defaults and auth store path.
- `README.md`
  - Document the live dialogue run command and delayed watch flow.
- `docs/docs/Agent-Search-Index.md`
  - Route future agents to the live dialogue spec and implementation plan.

### New files to create

- `probe/src/mutual/dialogueContext.ts`
  - Build the structured provider input bundle from persona, observation, memory, recent transcript, and rules.
- `probe/src/mutual/providerSchema.ts`
  - Parse and validate a single-turn provider response.
- `probe/src/mutual/openaiCodexAuth.ts`
  - Load the ignored auth store, validate metadata, and expose a bearer token without printing secrets.
- `probe/src/mutual/openaiCodexProvider.ts`
  - Call the live provider with bounded settings and return one parsed action.
- `probe/src/mutual/tools/converse.ts`
  - Execute directed speech or self-talk and record delivery.
- `probe/src/mutual/runLiveDialogueProbe.ts`
  - End-to-end orchestration for the new live path.
- `probe/src/mutual/liveCli.ts`
  - CLI entrypoint for the new live path.
- `scripts/run-live-mutual-dialogue-probe.sh`
  - Top-level watchable command for the new path.

## Locked Design Choices

- Keep the deterministic `probe:v1` path intact for low-cost contract checks.
- Add a separate live path instead of silently changing `probe:v1`.
- Treat dialogue as a real tool named `converse`.
- Keep one tool per actor turn.
- Keep memory short and local to runtime state.
- Fail honestly on invalid provider output; do not fake dialogue fallback.
- Use provider id `openai-codex`, auth store `build/provider-auth/openai-codex-auth.json`, model `gpt-5.4-mini`, reasoning `low`, and no model fallback.

## Test Strategy

Keep the test surface small and explicit:

1. `probe/test/serverConfig.test.ts`
   - live provider defaults
   - auth store path
   - delayed start default
2. `probe/test/runtimeLogic.test.ts`
   - context bundle creation
   - provider schema validation
   - bounded retry on malformed JSON
   - `converse` tool behavior
   - live loop contract with a fake async provider
3. `probe/test/transcript.test.ts`
   - transcript persistence of utterance text, args, memory, and provider failure details

The primary proof remains the live run artifact from `scripts/run-live-mutual-dialogue-probe.sh`.

## Task 1: Lock live dialogue config, context, and schema contracts

**Files:**
- Create: `probe/src/mutual/dialogueContext.ts`
- Create: `probe/src/mutual/providerSchema.ts`
- Modify: `probe/src/config.ts`
- Modify: `probe/test/runtimeLogic.test.ts`
- Modify: `probe/test/serverConfig.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/serverConfig.test.ts`

- [ ] **Step 1: Write the failing server config test**

```ts
test("mutual live dialogue config exposes provider defaults and delayed start", () => {
  const config = loadMutualProbeConfig();

  assert.equal(config.liveDialogue.providerId, "openai-codex");
  assert.equal(config.liveDialogue.model, "gpt-5.4-mini");
  assert.equal(config.liveDialogue.reasoning, "low");
  assert.equal(config.liveDialogue.maxRetries, 1);
  assert.equal(config.liveDialogue.delayStartMs, 30_000);
  assert.match(config.liveDialogue.authStorePath, /build\/provider-auth\/openai-codex-auth\.json$/);
});
```

- [ ] **Step 2: Write the failing context and schema tests**

```ts
test("buildDialogueContext snapshots persona, observation, transcript, memory, and rules", () => {
  const context = buildDialogueContext({
    actorId: "npc_a",
    persona: mutualPersonas.npc_a,
    observation: { markerEntitySeen: false, visibleActors: [{ id: "npc_b", distance: 2.5 }] },
    memory: ["Jun prefers short confirmations."],
    recentTranscript: [
      { actor: "npc_b", tool: "converse", args: { utterance: "I am near the chest." } }
    ],
    allowedTools: ["converse", "observe_world", "move_to", "wait", "remember", "drop_item"]
  });

  assert.equal(context.actorId, "npc_a");
  assert.equal(context.persona.name, "Mara");
  assert.equal(context.recentTranscript[0].args.utterance, "I am near the chest.");
  assert.equal(context.rules.allowedTools[0], "converse");
});

test("parseProviderAction accepts converse and rejects unsupported tools", () => {
  assert.deepEqual(
    parseProviderAction({
      tool: "converse",
      args: { target: "npc_b", utterance: "Jun, check the marker by the chest." },
      why: "Need a confirmation before moving the marker."
    }),
    {
      tool: "converse",
      args: { target: "npc_b", utterance: "Jun, check the marker by the chest." },
      why: "Need a confirmation before moving the marker."
    }
  );

  assert.throws(
    () => parseProviderAction({ tool: "open_chest", args: {} }),
    /Unsupported mutual tool/
  );
});
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run:

```bash
cd probe
bun test test/serverConfig.test.ts test/runtimeLogic.test.ts
```

Expected: failures for missing `liveDialogue` config, missing `buildDialogueContext`, and missing `parseProviderAction`.

- [ ] **Step 4: Add the live dialogue config shape in `probe/src/config.ts`**

```ts
export type ProbeConfig = {
  // existing fields...
  liveDialogue: {
    providerId: "openai-codex";
    authStorePath: string;
    model: "gpt-5.4-mini";
    reasoning: "low";
    maxRetries: number;
    delayStartMs: number;
  };
};

liveDialogue: {
  providerId: "openai-codex",
  authStorePath: path.resolve(here, "../../build/provider-auth/openai-codex-auth.json"),
  model: "gpt-5.4-mini",
  reasoning: "low",
  maxRetries: 1,
  delayStartMs: 30_000
}
```

- [ ] **Step 5: Add `probe/src/mutual/dialogueContext.ts`**

```ts
import type { JsonObject, MutualActorId } from "./types.js";
import { mutualPersonas } from "./personas.js";

type DialogueContextInput = {
  actorId: MutualActorId;
  persona: typeof mutualPersonas[MutualActorId];
  observation: JsonObject;
  memory: string[];
  recentTranscript: JsonObject[];
  allowedTools: string[];
};

export function buildDialogueContext(input: DialogueContextInput) {
  return structuredClone({
    actorId: input.actorId,
    persona: input.persona,
    observation: input.observation,
    memory: input.memory,
    recentTranscript: input.recentTranscript,
    rules: {
      oneToolPerTurn: true,
      allowedTools: input.allowedTools,
      noInventedObservations: true,
      preferObserveWorldWhenUncertain: true
    }
  });
}
```

- [ ] **Step 6: Add `probe/src/mutual/providerSchema.ts`**

```ts
import type { Proposal } from "./types.js";

const allowedTools = new Set([
  "converse",
  "observe_world",
  "move_to",
  "wait",
  "remember",
  "drop_item"
]);

export function parseProviderAction(input: unknown): Proposal & { why?: string } {
  if (!input || typeof input !== "object") {
    throw new Error("Provider action must be an object");
  }

  const candidate = input as {
    tool?: unknown;
    args?: unknown;
    why?: unknown;
  };

  if (typeof candidate.tool !== "string" || !allowedTools.has(candidate.tool)) {
    throw new Error(`Unsupported mutual tool: ${String(candidate.tool)}`);
  }

  return {
    tool: candidate.tool as Proposal["tool"],
    args: typeof candidate.args === "object" && candidate.args !== null ? candidate.args : {},
    ...(typeof candidate.why === "string" ? { why: candidate.why } : {})
  };
}
```

- [ ] **Step 7: Run the targeted tests to verify they pass**

Run:

```bash
cd probe
bun test test/serverConfig.test.ts test/runtimeLogic.test.ts
```

Expected: PASS for the new config, context, and schema assertions.

- [ ] **Step 8: Commit**

```bash
git add probe/src/config.ts \
  probe/src/mutual/dialogueContext.ts \
  probe/src/mutual/providerSchema.ts \
  probe/test/runtimeLogic.test.ts \
  probe/test/serverConfig.test.ts
git commit -m "test: lock live dialogue config and schema"
```

## Task 2: Add the `converse` tool and transcript-visible speech

**Files:**
- Create: `probe/src/mutual/tools/converse.ts`
- Modify: `probe/src/mutual/types.ts`
- Modify: `probe/src/mutual/runtimeState.ts`
- Modify: `probe/src/mutual/tools/index.ts`
- Modify: `probe/src/mutual/transcript.ts`
- Modify: `probe/test/runtimeLogic.test.ts`
- Modify: `probe/test/transcript.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/transcript.test.ts`

- [ ] **Step 1: Write the failing `converse` tool test**

```ts
test("converse sends directed speech, supports self-talk, and records heard messages", async () => {
  const runtimeState = createMutualRuntimeState({
    busyRepliesBeforeAvailable: 0,
    markerItemName: "paper"
  });
  const actor = createFakeBot("npc_a", 0);
  const target = createFakeBot("npc_b", 2);

  const directed = await converse({
    actor,
    actorId: "npc_a",
    target,
    targetId: "npc_b",
    runtimeState,
    utterance: "Jun, check the marker by the chest."
  });

  const selfTalk = await converse({
    actor,
    actorId: "npc_a",
    runtimeState,
    utterance: "I should wait for Jun's confirmation."
  });

  assert.equal(directed.status, "said_to_target");
  assert.equal(selfTalk.status, "said_aloud");
  assert.deepEqual(target.chatLog, []);
  assert.equal(runtimeState.consumeHeardMessages("npc_b")[0].text, "Jun, check the marker by the chest.");
});
```

- [ ] **Step 2: Write the failing transcript test**

```ts
test("mutual transcript writes utterance text, args, and memory notes for live dialogue", async () => {
  const transcript = createMutualTranscript({
    evidenceDir,
    probeId: "mutual_live_dialogue_probe_v1",
    personas: {
      npc_a: "Mara, anxious quartermaster",
      npc_b: "Jun, distracted runner"
    }
  });

  transcript.recordStep({
    category: "conversationTurnState",
    actorAction: { actor: "npc_a", tool: "converse", result: "said_to_target" },
    actorArgs: { target: "npc_b", utterance: "Jun, check the marker by the chest." },
    providerMeta: { why: "Need a spoken confirmation before moving the marker." },
    memoryNote: { actor: "npc_a", note: "Jun is near the chest." }
  });

  const outputPath = await transcript.write(
    {
      conversationTurnState: "passed",
      spatialAttentionApproach: "failed",
      materialEnvironmentHandoff: "failed"
    },
    { status: "success", why: "live dialogue captured a real exchange" }
  );

  const output = JSON.parse(await fs.readFile(outputPath, "utf8"));
  assert.equal(output.steps[0].actorAction.tool, "converse");
  assert.equal(output.steps[0].actorArgs.utterance, "Jun, check the marker by the chest.");
  assert.equal(output.steps[0].memoryNote.note, "Jun is near the chest.");
});
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run:

```bash
cd probe
bun test test/runtimeLogic.test.ts test/transcript.test.ts
```

Expected: failures for missing `converse`, missing `actorArgs`, and missing `providerMeta` transcript fields.

- [ ] **Step 4: Add `probe/src/mutual/tools/converse.ts`**

```ts
type ConverseArgs = {
  actor: { chat(message: string): void };
  actorId: MutualActorId;
  runtimeState: ReturnType<typeof createMutualRuntimeState>;
  utterance: string;
  target?: { username: string };
  targetId?: MutualActorId;
};

export async function converse({
  actor,
  actorId,
  runtimeState,
  utterance,
  targetId
}: ConverseArgs) {
  actor.chat(utterance);

  if (targetId) {
    runtimeState.recordHeardMessage(targetId, {
      from: actorId,
      text: utterance
    });
  }

  return {
    status: targetId ? "said_to_target" : "said_aloud",
    utterance,
    targetId: targetId ?? null
  } as const;
}
```

- [ ] **Step 5: Extend mutual types and transcript wiring**

```ts
export type Proposal = {
  tool: string;
  args: JsonObject;
  why?: string;
};

export type MutualStepRecord = {
  category: InteractionCategory;
  actorAction: { actor: MutualActorId; tool: string; result: string };
  actorArgs?: JsonObject;
  providerMeta?: JsonObject;
  targetObservation?: JsonObject;
  targetResponse?: JsonObject;
  worldStateChange?: JsonObject;
  memoryNote?: { actor: MutualActorId; note: string };
  failure?: { stage: "provider" | "validation" | "tool"; message: string };
};
```

```ts
case "converse": {
  const result = await converse({
    actor,
    actorId,
    target,
    targetId: typeof proposal.args?.target === "string" ? proposal.args.target as MutualActorId : undefined,
    runtimeState,
    utterance: String(proposal.args?.utterance ?? "")
  });
  return {
    category: "conversationTurnState",
    actorAction: { actor: actorId, tool: "converse", result: result.status },
    actorArgs: { ...proposal.args },
    providerMeta: typeof proposal.why === "string" ? { why: proposal.why } : undefined
  };
}
```

- [ ] **Step 6: Update runtime state to retain short recent speech**

```ts
recordUtterance(entry: { actor: MutualActorId; utterance: string; target: MutualActorId | null }) {
  transcriptWindow.push(entry);
  if (transcriptWindow.length > 6) {
    transcriptWindow.shift();
  }
}

recentUtterances() {
  return structuredClone(transcriptWindow);
}
```

- [ ] **Step 7: Run the targeted tests to verify they pass**

Run:

```bash
cd probe
bun test test/runtimeLogic.test.ts test/transcript.test.ts
```

Expected: PASS for `converse`, recent speech, and transcript-visible utterances.

- [ ] **Step 8: Commit**

```bash
git add probe/src/mutual/types.ts \
  probe/src/mutual/runtimeState.ts \
  probe/src/mutual/tools/converse.ts \
  probe/src/mutual/tools/index.ts \
  probe/src/mutual/transcript.ts \
  probe/test/runtimeLogic.test.ts \
  probe/test/transcript.test.ts
git commit -m "feat: add mutual converse tool"
```

## Task 3: Add live `openai-codex` provider auth and one-turn response parsing

**Files:**
- Create: `probe/src/mutual/openaiCodexAuth.ts`
- Create: `probe/src/mutual/openaiCodexProvider.ts`
- Modify: `probe/src/mutual/provider.ts`
- Modify: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`

- [ ] **Step 1: Write the failing auth and provider tests**

```ts
test("loadOpenAICodexAuth reads metadata without exposing raw secrets", async () => {
  const authPath = path.resolve("probe/test-artifacts/openai-codex-auth.json");

  await fs.writeFile(
    authPath,
    JSON.stringify({
      accessToken: "redacted-for-test",
      expiresAt: "2099-01-01T00:00:00.000Z",
      profile: { email: "npc@example.com" }
    })
  );

  const auth = await loadOpenAICodexAuth(authPath);

  assert.equal(auth.profileEmail, "npc@example.com");
  assert.equal(typeof auth.accessToken, "string");
  assert.throws(() => JSON.stringify(auth).includes("redacted-for-test"), /Cannot serialize auth/);
});

test("live provider retries malformed JSON once and then returns a parsed action", async () => {
  const calls: string[] = [];
  const provider = createOpenAICodexProvider({
    fetchImpl: async () => {
      calls.push("fetch");
      return {
        ok: true,
        async json() {
          return calls.length === 1
            ? { output_text: "not json" }
            : {
                output_text: JSON.stringify({
                  tool: "converse",
                  args: { target: "npc_b", utterance: "Jun, check the marker." }
                })
              };
        }
      } as Response;
    },
    accessToken: "test-token",
    model: "gpt-5.4-mini",
    reasoning: "low",
    maxRetries: 1
  });

  const proposal = await provider.next({ actorId: "npc_a", rules: { allowedTools: ["converse"] } });

  assert.equal(calls.length, 2);
  assert.equal(proposal.tool, "converse");
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
cd probe
bun test test/runtimeLogic.test.ts
```

Expected: failures for missing auth loader, missing live provider, and missing retry behavior.

- [ ] **Step 3: Add `probe/src/mutual/openaiCodexAuth.ts`**

```ts
import { readFile } from "node:fs/promises";

export async function loadOpenAICodexAuth(authStorePath: string) {
  const raw = JSON.parse(await readFile(authStorePath, "utf8")) as {
    accessToken?: unknown;
    expiresAt?: unknown;
    profile?: { email?: unknown };
  };

  if (typeof raw.accessToken !== "string") {
    throw new Error(`Missing access token in ${authStorePath}`);
  }

  if (typeof raw.expiresAt !== "string" || Date.parse(raw.expiresAt) <= Date.now()) {
    throw new Error(`Expired or missing auth metadata in ${authStorePath}`);
  }

  return {
    accessToken: raw.accessToken,
    profileEmail: typeof raw.profile?.email === "string" ? raw.profile.email : "unknown",
    toJSON() {
      throw new Error("Cannot serialize auth");
    }
  };
}
```

- [ ] **Step 4: Add `probe/src/mutual/openaiCodexProvider.ts`**

```ts
import { parseProviderAction } from "./providerSchema.js";

type CreateOpenAICodexProviderArgs = {
  fetchImpl?: typeof fetch;
  accessToken: string;
  model: "gpt-5.4-mini";
  reasoning: "low";
  maxRetries: number;
};

export function createOpenAICodexProvider(args: CreateOpenAICodexProviderArgs) {
  const fetchImpl = args.fetchImpl ?? fetch;

  return {
    async next(context: unknown) {
      let attempts = 0;

      while (true) {
        const response = await fetchImpl("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${args.accessToken}`
          },
          body: JSON.stringify({
            model: args.model,
            reasoning: { effort: args.reasoning },
            text: { format: { type: "json_object" } },
            input: JSON.stringify(context)
          })
        });

        const payload = await response.json() as { output_text?: unknown };

        try {
          return parseProviderAction(JSON.parse(String(payload.output_text ?? "")));
        } catch (error) {
          if (attempts >= args.maxRetries) {
            throw error;
          }
          attempts += 1;
        }
      }
    }
  };
}
```

- [ ] **Step 5: Update `probe/src/mutual/provider.ts` to export a shared async interface**

```ts
export type MutualProvider = {
  next(input: ProviderInput): Promise<Proposal> | Proposal;
};

export function createDeterministicMutualProviders(): Record<"npc_a" | "npc_b", MutualProvider> {
  return createMutualProviders();
}

export { createDeterministicMutualProviders as createSharedMutualProviderSet };
```

- [ ] **Step 6: Run the targeted tests to verify they pass**

Run:

```bash
cd probe
bun test test/runtimeLogic.test.ts
```

Expected: PASS for auth loading, malformed JSON retry, and shared provider contract tests.

- [ ] **Step 7: Commit**

```bash
git add probe/src/mutual/openaiCodexAuth.ts \
  probe/src/mutual/openaiCodexProvider.ts \
  probe/src/mutual/provider.ts \
  probe/test/runtimeLogic.test.ts
git commit -m "feat: add live openai-codex mutual provider"
```

## Task 4: Wire the live dialogue loop and watchable CLI

**Files:**
- Create: `probe/src/mutual/runLiveDialogueProbe.ts`
- Create: `probe/src/mutual/liveCli.ts`
- Create: `scripts/run-live-mutual-dialogue-probe.sh`
- Modify: `probe/package.json`
- Modify: `probe/src/mutual/mutualLoop.ts`
- Modify: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`

- [ ] **Step 1: Write the failing live loop test**

```ts
test("runMutualLoop accepts an async provider and records a 4-turn live dialogue before movement", async () => {
  const proposals: Proposal[] = [
    { tool: "converse", args: { target: "npc_b", utterance: "Jun, are you near the shared chest?" } },
    { tool: "converse", args: { target: "npc_a", utterance: "Yes, I am by the chest and I can check the marker." } },
    { tool: "converse", args: { target: "npc_b", utterance: "Good. I will bring the marker paper over." } },
    { tool: "converse", args: { target: "npc_a", utterance: "Understood. I will watch for it." } },
    { tool: "move_to", args: { target: "npc_b" } }
  ];

  const provider = {
    async next() {
      return proposals.shift() ?? { tool: "wait", args: { ticks: 20 } };
    }
  };

  const result = await runMutualLoop({
    bots: createFakeMutualBots(),
    providers: { npc_a: provider, npc_b: provider },
    tools: createFakeLiveMutualTools(),
    transcript: { recordStep() {} }
  });

  assert.equal(result.status, "success");
  assert.equal(result.categories.conversationTurnState, "passed");
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
cd probe
bun test test/runtimeLogic.test.ts
```

Expected: failure because `runMutualLoop` still assumes sync providers and the new fake live tool path does not exist.

- [ ] **Step 3: Update `probe/src/mutual/mutualLoop.ts` for async providers**

```ts
const proposal = tools.validateProposal(
  await providers[actorId].next({
    observation,
    lastResult: tools.lastResult(actorId)
  })
);
```

```ts
const turnPlan: MutualActorId[] = [
  "npc_a",
  "npc_b",
  "npc_a",
  "npc_b",
  "npc_a",
  "npc_b",
  "npc_a",
  "npc_b",
  "npc_a"
];
```

- [ ] **Step 4: Add `probe/src/mutual/runLiveDialogueProbe.ts`**

```ts
export async function runLiveDialogueProbe(): Promise<ProbeRunResult> {
  const config = loadMutualProbeConfig();
  const auth = await loadOpenAICodexAuth(config.liveDialogue.authStorePath);
  let server: ServerHandle | null = null;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let result: { transcriptPath: string } | null = null;
  let caughtError: unknown;
  const cleanupErrors: unknown[] = [];

  try {
    server = await startDockerServer(config);
    bots = await createBots(config, { host: server.host, port: server.port });

    const runtimeState = createMutualRuntimeState({
      busyRepliesBeforeAvailable: 0,
      markerItemName: "paper"
    });
    const memories = {
      npc_a: createMemory(config.memoryLimit),
      npc_b: createMemory(config.memoryLimit)
    };
    const transcript = createMutualTranscript({
      evidenceDir: config.evidenceDir,
      probeId: "mutual_live_dialogue_probe_v1",
      personas: {
        npc_a: `${mutualPersonas.npc_a.name}, ${mutualPersonas.npc_a.summary}`,
        npc_b: `${mutualPersonas.npc_b.name}, ${mutualPersonas.npc_b.summary}`
      }
    });

    await Bun.sleep(config.liveDialogue.delayStartMs);

    const provider = createOpenAICodexProvider({
      accessToken: auth.accessToken,
      model: config.liveDialogue.model,
      reasoning: config.liveDialogue.reasoning,
      maxRetries: config.liveDialogue.maxRetries
    });

    const final = await runMutualLoop({
      bots,
      providers: { npc_a: provider, npc_b: provider },
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
```

- [ ] **Step 5: Add the CLI and top-level script**

```ts
// probe/src/mutual/liveCli.ts
import { runLiveDialogueProbe } from "./runLiveDialogueProbe.js";

const result = await runLiveDialogueProbe();
console.log(result.transcriptPath);
```

```json
// probe/package.json
{
  "scripts": {
    "probe:v1": "bun run src/mutual/cli.ts",
    "probe:v1:live": "bun run src/mutual/liveCli.ts"
  }
}
```

```bash
#!/usr/bin/env bash
set -euo pipefail

bun run --cwd probe probe:v1:live
```

- [ ] **Step 6: Run the targeted tests and typecheck**

Run:

```bash
cd probe
bun test test/runtimeLogic.test.ts
bun run typecheck
```

Expected: PASS for async provider loop coverage and `tsc --noEmit`.

- [ ] **Step 7: Commit**

```bash
git add probe/package.json \
  probe/src/mutual/mutualLoop.ts \
  probe/src/mutual/runLiveDialogueProbe.ts \
  probe/src/mutual/liveCli.ts \
  scripts/run-live-mutual-dialogue-probe.sh \
  probe/test/runtimeLogic.test.ts
git commit -m "feat: add live mutual dialogue runtime"
```

## Task 5: Update docs and verify the live proof

**Files:**
- Modify: `README.md`
- Modify: `docs/docs/Agent-Search-Index.md`
- Test: `probe/test/serverConfig.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/transcript.test.ts`

- [ ] **Step 1: Update `README.md`**

````md
### Probe v1 live dialogue

```sh
bun install --cwd probe
bun run --cwd probe typecheck
./scripts/run-live-mutual-dialogue-probe.sh
```

This path keeps the bounded runtime, but replaces the deterministic mutual provider with a live `openai-codex` turn provider. Each NPC receives persona, recent transcript, memory, and world context, then chooses one validated tool for the next turn.
````

- [ ] **Step 2: Update `docs/docs/Agent-Search-Index.md`**

```md
- `LIVE_NPC_DIALOGUE_SPEC`
  - `docs/superpowers/specs/2026-05-19-live-npc-dialogue-design.md`
- `LIVE_NPC_DIALOGUE_PLAN`
  - `docs/superpowers/plans/2026-05-19-live-npc-dialogue.md`
```

- [ ] **Step 3: Run the small suite**

Run:

```bash
cd probe
bun test test/serverConfig.test.ts test/runtimeLogic.test.ts test/transcript.test.ts
bun run typecheck
```

Expected: PASS for all three test files and `tsc --noEmit`.

- [ ] **Step 4: Run the live proof**

Run:

```bash
cd .
./scripts/run-live-mutual-dialogue-probe.sh
```

Expected:

- two bots join the local Docker world
- the run waits about 30 seconds before starting so a human can join
- transcript path is printed under `data/evidence/`
- transcript contains at least 4 conversation turns before a later world action

- [ ] **Step 5: Commit**

```bash
git add README.md docs/docs/Agent-Search-Index.md
git commit -m "docs: add live dialogue probe instructions"
```
