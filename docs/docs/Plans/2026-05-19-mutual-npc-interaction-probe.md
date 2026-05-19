# Mutual NPC Interaction Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `mutual_npc_interaction_probe_v1`, a headless Bun + TypeScript proof where both Minecraft bots act, exchange visible dialogue, react to approach/attention, perform one small item handoff, and write a transcript that lets a reviewer verify the interaction without opening a client.

**Architecture:** Keep the existing `agent_loop_probe_v0` working and add a separate `v1` path under `probe/src/mutual/`. Reuse the existing Docker server and bot boot logic, but introduce a small mutual-turn runtime with actor-specific deterministic providers, a richer transcript shape, and one reliable world action (`drop_item("paper", 1)`) so the second bot is an actor rather than a passive state object.

**Tech Stack:** Bun 1.3.x, TypeScript, Mineflayer `^4.37.1`, `mineflayer-pathfinder`, Docker vanilla Minecraft `1.21.11`, `node:test`

---

## File Structure

### Shared files to modify

- `probe/package.json`
  - Add the new `probe:v1` script and the `mineflayer-pathfinder` dependency.
- `probe/src/config.ts`
  - Add `loadMutualProbeConfig()` and the new `mutual_npc_interaction_probe_v1` defaults.
- `probe/src/runtime/createBots.ts`
  - Load shared bot setup needed by the new runtime, including pathfinder plugin registration.
- `probe/src/tools/moveTo.ts`
  - Replace the current `lookAt + forward` probe with a reliable near-target movement helper.
- `probe/test/runtimeLogic.test.ts`
  - Add the mutual runtime and tool behavior tests.
- `probe/test/transcript.test.ts`
  - Add the richer transcript acceptance test.
- `README.md`
  - Document the new proof command and what `v1` proves beyond `v0`.
- `docs/docs/Agent-Search-Index.md`
  - Route future agents to the new mutual-interaction plan and proof script.

### New files to create

- `probe/src/mutual/personas.ts`
  - Stable persona cards for Mara and Jun.
- `probe/src/mutual/types.ts`
  - Shared `v1` actor ids, transcript records, verdict types, and final result types.
- `probe/src/mutual/provider.ts`
  - Deterministic next-step selection for each actor, including the local `createSequenceProvider` helper.
- `probe/src/mutual/runtimeState.ts`
  - Runtime-owned heard-message queue, busy/available state, and item handoff state.
- `probe/src/mutual/transcript.ts`
  - Transcript writer for the richer `actorAction / targetObservation / targetResponse / worldStateChange / memoryNote` payload.
- `probe/src/mutual/tools/observeWorld.ts`
  - Observation helper that includes heard chat, distance, facing, and dropped marker state.
- `probe/src/mutual/tools/replyTo.ts`
  - Target-side response tool for `npc_b`.
- `probe/src/mutual/tools/lookAtActor.ts`
  - Attention tool that turns one bot toward another.
- `probe/src/mutual/tools/dropItem.ts`
  - Minimal material action using `paper`.
- `probe/src/mutual/tools/index.ts`
  - Compose the `observe_world`, `move_to`, `say`, `wait`, `reply_to`, `look_at_actor`, `drop_item`, and `remember` tool implementations for the mutual loop, and reject unsupported proposals.
- `probe/src/mutual/mutualLoop.ts`
  - Alternating actor runtime that records cause-and-effect across both bots, including the concrete `RunMutualLoopArgs` type.
- `probe/src/mutual/runMutualProbe.ts`
  - End-to-end orchestration for `v1`, including `try/finally` cleanup mirroring `runProbe.ts`.
- `probe/src/mutual/cli.ts`
  - CLI entrypoint for the new proof, including cleanup warning formatting.
- `scripts/run-mutual-interaction-probe.sh`
  - Primary proof command for the new slice.
- `docs/superpowers/reports/2026-05-19-mutual-npc-interaction-probe-review.md`
  - Human-readable report with the real transcript path and category verdicts.
- `docs/superpowers/reports/artifacts/2026-05-19-mutual-npc-interaction-probe-transcript.json`
  - Committed copy of the proof transcript so later review does not depend on an ephemeral local `data/evidence/` file.

## Locked Design Choices

- Keep `v0` runnable. Do not fold the `v1` behavior into `runProbe.ts`.
- Use `paper` as the marker item to avoid chest setup, mining, or crafting.
- Use `mineflayer-pathfinder` for `move_to`; the current forward-only movement is not good enough for the spatial category.
- Make `npc_b` act through its own deterministic provider and runtime turn, not by having `npc_a` simulate `npc_b`.
- Keep provider output proposal-only. Busy/available, heard-message delivery, and world-state changes remain runtime-owned.
- Acceptance comes from the live transcript artifact plus the small tests below, not from adding a broad suite.

## Test Strategy

Keep the test surface small:

1. `probe/test/runtimeLogic.test.ts`
   - provider sequence for both actors
   - runtime-owned busy/heard state
   - mutual loop cause-and-effect recording
   - movement helper result contract
   - item handoff result contract
2. `probe/test/transcript.test.ts`
   - transcript JSON shape and snapshot behavior
3. existing server/config coverage remains in `probe/test/serverConfig.test.ts`

## Task 1: Add failing mutual transcript and runtime tests

**Files:**
- Create: `probe/src/mutual/types.ts`
- Create: `probe/src/mutual/transcript.ts`
- Modify: `probe/test/runtimeLogic.test.ts`
- Modify: `probe/test/transcript.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/transcript.test.ts`

- [ ] **Step 1: Add the failing transcript acceptance test**

```ts
test("mutual transcript writes category verdicts and causal step records", async () => {
  const evidenceDir = path.resolve("probe/test-artifacts/mutual-transcript");
  const transcript = createMutualTranscript({
    evidenceDir,
    probeId: "mutual_npc_interaction_probe_v1",
    personas: {
      npc_a: "Mara, anxious quartermaster",
      npc_b: "Jun, distracted runner"
    }
  });

  transcript.recordStep({
    category: "conversationTurnState",
    actorAction: { actor: "npc_a", tool: "say", result: "heard_by_npc_b" },
    targetObservation: { actor: "npc_b", heardText: "Jun, can you confirm the marker?" },
    targetResponse: { actor: "npc_b", tool: "reply_to", result: "busy_reply" },
    causedNext: { actor: "npc_a", tool: "wait" }
  });

  const outputPath = await transcript.write({
    conversationTurnState: "passed",
    spatialAttentionApproach: "passed",
    materialEnvironmentHandoff: "passed"
  }, {
    status: "success",
    why: "both NPCs responded to dialogue and world actions"
  });

  const payload = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.equal(payload.probe, "mutual_npc_interaction_probe_v1");
  assert.equal(payload.categories.materialEnvironmentHandoff, "passed");
  assert.equal(payload.steps[0].targetResponse.tool, "reply_to");
});
```

- [ ] **Step 2: Add the failing mutual runtime test**

```ts
function createFakeMutualBots() {
  return {
    npc_a: { username: "npc_a" },
    npc_b: { username: "npc_b" }
  };
}

function createFakeMutualTools() {
  let executionCount = 0;

  return {
    lastResult() {
      return null;
    },
    validateProposal(proposal: Proposal) {
      return proposal;
    },
    async observe_world() {
      return { status: "ok", heardMessages: [], markerEntitySeen: executionCount >= 2 };
    },
    async execute() {
      executionCount += 1;

      if (executionCount === 1) {
        return {
          category: "conversationTurnState",
          actorAction: { actor: "npc_a", tool: "say", result: "said" },
          targetResponse: { actor: "npc_b", tool: "reply_to", result: "busy_reply" }
        };
      }

      if (executionCount === 2) {
        return {
          category: "spatialAttentionApproach",
          actorAction: { actor: "npc_b", tool: "look_at_actor", result: "looked_at_target" },
          worldStateChange: { arrived: true }
        };
      }

      return {
        category: "materialEnvironmentHandoff",
        actorAction: { actor: "npc_a", tool: "drop_item", result: "dropped" },
        targetObservation: { markerEntitySeen: true },
        targetResponse: { actor: "npc_b", tool: "reply_to", result: "replied" },
        worldStateChange: { itemName: "paper" },
        causedNext: { actor: "npc_b", tool: "reply_to" }
      };
    }
  };
}

test("mutual loop makes npc_b act after npc_a changes chat or world state", async () => {
  const transcriptSteps: unknown[] = [];

  const result = await runMutualLoop({
    bots: createFakeMutualBots(),
    providers: createMutualProviders(),
    transcript: { recordStep(step) { transcriptSteps.push(step); } },
    tools: createFakeMutualTools()
  });

  assert.equal(result.status, "success");
  assert.ok(transcriptSteps.some((step) => {
    return typeof step === "object"
      && step !== null
      && "targetResponse" in step
      && (step as { targetResponse?: { actor?: string } }).targetResponse?.actor === "npc_b";
  }));
});
```

- [ ] **Step 3: Run the two focused tests and verify they fail**

Run:

```bash
cd probe && bun test test/transcript.test.ts test/runtimeLogic.test.ts
```

Expected: FAIL because `createMutualTranscript`, `runMutualLoop`, or the mutual provider/runtime files do not exist yet.

- [ ] **Step 4: Create the minimal shared mutual types**

```ts
export type MutualActorId = "npc_a" | "npc_b";

export type InteractionCategory =
  | "conversationTurnState"
  | "spatialAttentionApproach"
  | "materialEnvironmentHandoff";

export type CategoryVerdict = "passed" | "failed";

export type Proposal = {
  tool: string;
  args?: Record<string, unknown>;
};

export type HeardMessage = {
  from: MutualActorId;
  text: string;
};

export type MutualStepRecord = {
  category: InteractionCategory;
  actorAction: {
    actor: MutualActorId;
    tool: string;
    result: string;
  };
  targetObservation?: Record<string, unknown>;
  targetResponse?: {
    actor: MutualActorId;
    tool: string;
    result: string;
  };
  worldStateChange?: Record<string, unknown>;
  memoryNote?: {
    actor: MutualActorId;
    note: string;
  };
  causedNext?: {
    actor: MutualActorId;
    tool: string;
  };
};

export type TranscriptFinal = {
  status: "success" | "failed";
  why: string;
};

export type CreateMutualTranscriptOptions = {
  evidenceDir: string;
  probeId: string;
  personas: Record<MutualActorId, string>;
};
```

- [ ] **Step 5: Add the mutual transcript writer**

```ts
export function createMutualTranscript({ evidenceDir, probeId, personas }: CreateMutualTranscriptOptions) {
  const steps: MutualStepRecord[] = [];

  return {
    recordStep(step: MutualStepRecord) {
      steps.push(structuredClone(step));
    },
    async write(categories: Record<InteractionCategory, CategoryVerdict>, final: TranscriptFinal) {
      await fs.mkdir(evidenceDir, { recursive: true });
      const outputPath = path.join(evidenceDir, `${probeId}-${Date.now()}.json`);
      await fs.writeFile(outputPath, JSON.stringify({
        probe: probeId,
        personas: structuredClone(personas),
        categories: structuredClone(categories),
        steps,
        final: structuredClone(final)
      }, null, 2));
      return outputPath;
    }
  };
}
```

- [ ] **Step 6: Re-run the focused tests until the failures move to the missing mutual runtime**

Run:

```bash
cd probe && bun test test/transcript.test.ts test/runtimeLogic.test.ts
```

Expected: transcript test passes or reaches deeper runtime failures; runtime test still fails because the loop and providers are not implemented yet.

- [ ] **Step 7: Commit the red-to-green transcript groundwork**

```bash
git add probe/test/runtimeLogic.test.ts probe/test/transcript.test.ts probe/src/mutual/transcript.ts
git commit -m "test: add mutual transcript contract"
```

## Task 2: Implement two-actor deterministic runtime state and providers

**Files:**
- Create: `probe/src/mutual/personas.ts`
- Create: `probe/src/mutual/provider.ts`
- Create: `probe/src/mutual/runtimeState.ts`
- Create: `probe/src/mutual/mutualLoop.ts`
- Modify: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`

- [ ] **Step 1: Add failing provider and runtime-state assertions**

```ts
test("mutual providers keep actor-specific deterministic order", () => {
  const providers = createMutualProviders();

  assert.deepEqual(providers.npc_a.next({ lastResult: null }), {
    tool: "observe_world",
    args: {}
  });

  assert.deepEqual(providers.npc_b.next({ lastResult: null }), {
    tool: "reply_to",
    args: { source: "npc_a", text: "Busy. Give me a second." }
  });

  assert.deepEqual(providers.npc_b.next({
    lastResult: { tool: "reply_to", status: "busy_reply" }
  }), {
    tool: "look_at_actor",
    args: { target: "npc_a" }
  });
});

test("runtime state owns heard chat, busy replies, and marker visibility", () => {
  const state = createMutualRuntimeState({ busyRepliesBeforeAvailable: 1, markerItemName: "paper" });

  state.recordHeardMessage("npc_b", { from: "npc_a", text: "Jun, can you confirm the marker?" });

  assert.equal(state.consumeHeardMessages("npc_b").length, 1);
  assert.deepEqual(state.requestReply("npc_b", "npc_a"), {
    status: "busy",
    reason: "npc_b is busy"
  });
});
```

- [ ] **Step 2: Run the runtime test and verify the new assertions fail**

Run:

```bash
cd probe && bun test test/runtimeLogic.test.ts
```

Expected: FAIL because the mutual providers and runtime state do not exist yet.

- [ ] **Step 3: Add persona cards**

```ts
export const mutualPersonas = {
  npc_a: {
    name: "Mara",
    summary: "anxious quartermaster",
    goal: "ask whether the marker item should be moved to the shared chest"
  },
  npc_b: {
    name: "Jun",
    summary: "distracted runner",
    goal: "reply only after finishing or pausing the current task"
  }
} as const;
```

- [ ] **Step 4: Add runtime state for heard chat, busy ownership, and marker state**

```ts
export function createMutualRuntimeState({ busyRepliesBeforeAvailable, markerItemName }: MutualRuntimeStateOptions) {
  let remainingBusyReplies = busyRepliesBeforeAvailable;
  let markerDropped = false;
  const heard: Record<MutualActorId, HeardMessage[]> = { npc_a: [], npc_b: [] };
  const lastResults: Record<MutualActorId, { tool: string; status: string } | null> = {
    npc_a: null,
    npc_b: null
  };

  return {
    recordHeardMessage(target: MutualActorId, message: HeardMessage) {
      heard[target].push(message);
    },
    consumeHeardMessages(target: MutualActorId) {
      const messages = [...heard[target]];
      heard[target] = [];
      return messages;
    },
    requestReply(actor: MutualActorId, target: MutualActorId) {
      if (actor !== "npc_b" || target !== "npc_a") {
        return { status: "unavailable" as const, reason: `${target} is unavailable` };
      }
      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;
        return { status: "busy" as const, reason: "npc_b is busy" };
      }
      return { status: "available" as const };
    },
    markDroppedItem(actor: MutualActorId, itemName: string) {
      markerDropped = actor === "npc_a" && itemName === markerItemName;
    },
    hasDroppedMarker() {
      return markerDropped;
    },
    markerItemName() {
      return markerItemName;
    },
    lastResult(actorId: MutualActorId) {
      return lastResults[actorId];
    },
    recordLastResult(actorId: MutualActorId, result: { tool: string; status: string }) {
      lastResults[actorId] = result;
    }
  };
}
```

```ts
export type MutualRuntimeStateOptions = {
  busyRepliesBeforeAvailable: number;
  markerItemName: string;
};
```

- [ ] **Step 5: Add the deterministic actor providers**

```ts
function createSequenceProvider(sequence: Proposal[]) {
  let index = 0;

  return {
    next(_input: { observation?: unknown; lastResult: { tool: string; status: string } | null }) {
      const proposal = sequence[Math.min(index, sequence.length - 1)];
      index += 1;
      return structuredClone(proposal);
    }
  };
}

export function createMutualProviders() {
  return {
    npc_a: createSequenceProvider([
      { tool: "observe_world", args: {} },
      { tool: "move_to", args: { target: "npc_b" } },
      { tool: "say", args: { target: "npc_b", text: "Jun, can you confirm the marker?" } },
      { tool: "wait", args: { ticks: 20, reason: "npc_b was busy" } },
      { tool: "drop_item", args: { itemName: "paper", count: 1 } },
      { tool: "remember", args: { note: "Jun answered after the marker drop" } }
    ]),
    npc_b: {
      next(input: { observation?: Record<string, unknown>; lastResult: { tool: string; status: string } | null }) {
        if (input.lastResult === null) {
          return { tool: "reply_to", args: { source: "npc_a", text: "Busy. Give me a second." } };
        }

        if (input.lastResult.tool === "reply_to" && input.lastResult.status === "busy_reply") {
          return { tool: "look_at_actor", args: { target: "npc_a" } };
        }

        if (input.lastResult.tool === "look_at_actor") {
          return { tool: "observe_world", args: {} };
        }

        if (input.lastResult.tool === "observe_world" && input.observation?.markerEntitySeen === true) {
          return { tool: "reply_to", args: { source: "npc_a", text: "I see the paper. Leave it with me." } };
        }

        return { tool: "reply_to", args: { source: "npc_a", text: "I still do not see the marker." } };
      }
    }
  };
}
```

- [ ] **Step 6: Add the alternating mutual loop**

```ts
type MutualRuntimeActor = {
  username: string;
};

export type RunMutualLoopArgs<TActor extends MutualRuntimeActor> = {
  bots: Record<MutualActorId, TActor>;
  providers: ReturnType<typeof createMutualProviders>;
  tools: {
    lastResult(actorId: MutualActorId): { tool: string; status: string } | null;
    validateProposal(proposal: Proposal): Proposal;
    observe_world(input: {
      actorId: MutualActorId;
      actor: TActor;
      targetId: MutualActorId;
      target: TActor;
    }): Promise<Record<string, unknown>>;
    execute(input: {
      actorId: MutualActorId;
      actor: TActor;
      targetId: MutualActorId;
      target: TActor;
      proposal: Proposal;
      observation: Record<string, unknown>;
    }): Promise<MutualStepRecord>;
  };
  transcript: {
    recordStep(step: MutualStepRecord): void;
  };
};

function deriveCategoryVerdicts(steps: MutualStepRecord[]): Record<InteractionCategory, CategoryVerdict> {
  const droppedMarker = steps.some((step) => {
    return step.category === "materialEnvironmentHandoff"
      && step.actorAction.tool === "drop_item"
      && step.worldStateChange?.itemName === "paper";
  });
  const observedMarker = steps.some((step) => {
    return step.category === "materialEnvironmentHandoff"
      && step.targetObservation?.markerEntitySeen === true;
  });
  const repliedAfterMarker = steps.some((step) => {
    return step.category === "materialEnvironmentHandoff"
      && step.targetResponse?.tool === "reply_to"
      && step.causedNext?.actor === "npc_b";
  });

  return {
    conversationTurnState: steps.some((step) => step.category === "conversationTurnState" && step.targetResponse)
      ? "passed"
      : "failed",
    spatialAttentionApproach: steps.some((step) => step.category === "spatialAttentionApproach" && step.worldStateChange?.arrived === true)
      ? "passed"
      : "failed",
    materialEnvironmentHandoff: droppedMarker && observedMarker && repliedAfterMarker
      ? "passed"
      : "failed"
  };
}

export async function runMutualLoop<TActor extends MutualRuntimeActor>({
  bots,
  providers,
  tools,
  transcript
}: RunMutualLoopArgs<TActor>) {
  const plan: MutualActorId[] = ["npc_a", "npc_a", "npc_a", "npc_b", "npc_a", "npc_b", "npc_a", "npc_b", "npc_b", "npc_a"];
  const recordedSteps: MutualStepRecord[] = [];

  for (const actorId of plan) {
    const actor = bots[actorId];
    const targetId = actorId === "npc_a" ? "npc_b" : "npc_a";
    const target = bots[targetId];
    const observation = await tools.observe_world({ actorId, actor, targetId, target });
    const proposal = tools.validateProposal(
      providers[actorId].next({ observation, lastResult: tools.lastResult(actorId) })
    );
    const step = await tools.execute({ actorId, actor, targetId, target, proposal, observation });
    recordedSteps.push(step);
    transcript.recordStep(step);
  }

  const categories = deriveCategoryVerdicts(recordedSteps);
  const passedAll = Object.values(categories).every((value) => value === "passed");

  return {
    status: passedAll ? ("success" as const) : ("failed" as const),
    why: passedAll
      ? "both NPCs responded to each other's dialogue and world actions"
      : "one or more interaction categories did not reach acceptance",
    categories
  };
}
```

- [ ] **Step 7: Re-run the runtime test until the provider and loop assertions pass**

Run:

```bash
cd probe && bun test test/runtimeLogic.test.ts
```

Expected: PASS for the new provider/runtime cases, with any remaining failures now isolated to the new tool implementations.

- [ ] **Step 8: Commit the mutual runtime core**

```bash
git add probe/src/mutual/personas.ts probe/src/mutual/provider.ts probe/src/mutual/runtimeState.ts probe/src/mutual/mutualLoop.ts probe/test/runtimeLogic.test.ts
git commit -m "feat: add mutual npc runtime core"
```

## Task 3: Add reliable movement, attention, item handoff, and the live entrypoint

**Files:**
- Modify: `probe/package.json`
- Modify: `probe/src/config.ts`
- Modify: `probe/src/runtime/createBots.ts`
- Modify: `probe/src/tools/moveTo.ts`
- Create: `probe/src/mutual/tools/observeWorld.ts`
- Create: `probe/src/mutual/tools/replyTo.ts`
- Create: `probe/src/mutual/tools/lookAtActor.ts`
- Create: `probe/src/mutual/tools/dropItem.ts`
- Create: `probe/src/mutual/tools/index.ts`
- Create: `probe/src/mutual/runMutualProbe.ts`
- Create: `probe/src/mutual/cli.ts`
- Create: `scripts/run-mutual-interaction-probe.sh`
- Modify: `probe/test/runtimeLogic.test.ts`
- Test: `probe/test/runtimeLogic.test.ts`

- [ ] **Step 1: Add failing movement and item-handoff tests**

```ts
function createPathfindingFakeBot(username: string, position: { x: number; y: number; z: number }) {
  return {
    username,
    entity: {
      position: {
        ...position,
        distanceTo(other: { x: number; y: number; z: number }) {
          return Math.hypot(position.x - other.x, position.y - other.y, position.z - other.z);
        }
      }
    },
    pathfinder: {
      async goto() {
        position.x = 1.5;
      }
    }
  };
}

function createInventoryFakeBot(username: string) {
  return {
    username,
    version: "1.21.11",
    creative: {
      async setInventorySlot() {}
    },
    async toss() {}
  };
}

test("move_to reports before and after distance and reaches the near threshold", async () => {
  const actor = createPathfindingFakeBot("npc_a", { x: 0, y: 0, z: 0 });
  const target = createPathfindingFakeBot("npc_b", { x: 3, y: 0, z: 0 });

  assert.deepEqual(await moveTo({ actor, target, targetId: "npc_b" }), {
    status: "arrived",
    beforeDistance: 3,
    afterDistance: 1.5,
    arrived: true
  });
});

test("drop_item marks world state so npc_b can observe and answer", async () => {
  const state = createMutualRuntimeState({ busyRepliesBeforeAvailable: 1, markerItemName: "paper" });

  const result = await dropItem({
    actor: createInventoryFakeBot("npc_a"),
    runtimeState: state,
    itemName: "paper",
    count: 1
  });

  assert.equal(result.status, "dropped");
  assert.equal(state.hasDroppedMarker(), true);
});
```

- [ ] **Step 2: Run the runtime test and verify the tool assertions fail**

Run:

```bash
cd probe && bun test test/runtimeLogic.test.ts
```

Expected: FAIL because `mineflayer-pathfinder` is not installed, the `moveTo` result shape is different, and `dropItem` does not exist yet.

- [ ] **Step 3: Add the pathfinding dependency and the new script entry**

```json
{
  "scripts": {
    "probe:v0": "bun run src/cli.ts",
    "probe:v1": "bun run src/mutual/cli.ts"
  },
  "dependencies": {
    "mineflayer": "^4.37.1",
    "minecraft-data": "^3.87.0",
    "mineflayer-pathfinder": "^2.4.5",
    "minecraft-protocol": "^1.66.2",
    "prismarine-item": "^1.15.0",
    "vec3": "^0.1.10"
  }
}
```

Run:

```bash
cd probe && bun add mineflayer-pathfinder minecraft-data prismarine-item
```

Expected: lockfile updates and dependency install succeeds.

- [ ] **Step 4: Register pathfinder and implement the reliable movement helper**

```ts
bot.loadPlugin(pathfinder);
```

```ts
export async function moveTo({ actor, target, targetId }: MoveToArgs): Promise<MoveToResult> {
  if (targetId !== target.username) {
    throw new Error(`Unsupported move target: ${targetId}`);
  }

  const beforeDistance = roundDistance(actor.entity.position.distanceTo(target.entity.position));
  const goal = new goals.GoalNear(target.entity.position.x, target.entity.position.y, target.entity.position.z, 1);

  await actor.pathfinder.goto(goal);

  const afterDistance = roundDistance(actor.entity.position.distanceTo(target.entity.position));

  return {
    status: afterDistance <= 1.5 ? "arrived" : "moved",
    beforeDistance,
    afterDistance,
    arrived: afterDistance <= 1.5
  };
}
```

- [ ] **Step 5: Add the attention, reply, observe, and drop-item tools**

```ts
const mutualAllowedTools = [
  "observe_world",
  "move_to",
  "say",
  "wait",
  "reply_to",
  "look_at_actor",
  "drop_item",
  "remember"
] as const;

export function validateMutualProposal(proposal: Proposal) {
  if (!mutualAllowedTools.includes(proposal.tool as (typeof mutualAllowedTools)[number])) {
    throw new Error(`Unsupported mutual tool: ${proposal.tool}`);
  }

  return {
    tool: proposal.tool,
    args: proposal.args ?? {}
  };
}
```

```ts
export async function lookAtActor({ actor, target }: LookAtActorArgs) {
  await actor.lookAt(target.entity.position, true);
  return { status: "looked_at_target", target: target.username };
}
```

```ts
export async function replyTo({ actor, source, runtimeState, text }: ReplyToArgs) {
  const result = runtimeState.requestReply(actor.username as MutualActorId, source.username as MutualActorId);
  actor.chat(text);
  runtimeState.recordHeardMessage(source.username as MutualActorId, {
    from: actor.username as MutualActorId,
    text
  });
  return result.status === "busy"
    ? { status: "busy_reply", reason: result.reason }
    : { status: "replied", text };
}
```

```ts
export async function dropItem({ actor, runtimeState, itemName, count }: DropItemArgs) {
  const mcData = minecraftData(actor.version);
  const itemId = mcData.itemsByName[itemName].id;
  const ItemCtor = Item(actor.version);
  await actor.creative.setInventorySlot(36, new ItemCtor(itemId, count));
  await actor.toss(itemId, null, count);
  runtimeState.markDroppedItem("npc_a", itemName);
  return { status: "dropped", itemName, count };
}
```

```ts
function findNearbyMarkerEntity({ observer, itemName }: { observer: { entities: Record<string, { name?: string; displayName?: string }> }; itemName: string }) {
  return Object.values(observer.entities).find((entity) => {
    return entity.name === itemName
      || entity.displayName?.toLowerCase() === itemName
      || (entity.name === "item" && JSON.stringify(entity).toLowerCase().includes(itemName));
  });
}

export function observeWorld({ actor, target, runtimeState, memory }: ObserveWorldArgs) {
  const markerEntitySeen = Boolean(
    findNearbyMarkerEntity({
      observer: actor,
      itemName: runtimeState.markerItemName()
    })
  );

  return {
    status: "ok",
    visibleActors: [{
      id: target.username,
      distance: Number(actor.entity.position.distanceTo(target.entity.position).toFixed(2))
    }],
    heardMessages: runtimeState.consumeHeardMessages(actor.username as MutualActorId),
    markerEntitySeen,
    memory: memory.list()
  };
}
```

```ts
type CreateMutualToolsArgs = {
  runtimeState: ReturnType<typeof createMutualRuntimeState>;
  memories: Record<MutualActorId, ReturnType<typeof createMemory>>;
};

type ObserveWorldToolArgs<TActor extends { username: string } = { username: string }> = {
  actorId: MutualActorId;
  actor: TActor;
  targetId: MutualActorId;
  target: TActor;
};

type ExecuteMutualToolArgs<TActor extends { username: string } = { username: string }> =
  ObserveWorldToolArgs<TActor> & {
    proposal: Proposal;
    observation: Record<string, unknown>;
  };

async function executeMutualTool<TActor extends { username: string }>({
  actorId,
  actor,
  targetId,
  target,
  proposal,
  observation,
  runtimeState
}: ExecuteMutualToolArgs<TActor> & CreateMutualToolsArgs) {
  switch (proposal.tool) {
    case "observe_world":
      return {
        category: "conversationTurnState" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "observed" }
      };
    case "move_to":
      return {
        category: "spatialAttentionApproach" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "moved" },
        worldStateChange: await moveTo({ actor, target, targetId })
      };
    case "say":
      actor.chat(String(proposal.args?.text ?? ""));
      runtimeState.recordHeardMessage(targetId, {
        from: actorId,
        text: String(proposal.args?.text ?? "")
      });
      return {
        category: "conversationTurnState" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "said" },
        targetObservation: observation,
        causedNext: { actor: targetId, tool: "reply_to" }
      };
    case "wait":
      return {
        category: "conversationTurnState" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "waited" },
        worldStateChange: await wait({ ticks: Number(proposal.args?.ticks ?? 20) })
      };
    case "look_at_actor":
      return {
        category: "spatialAttentionApproach" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "looked_at_target" },
        worldStateChange: await lookAtActor({ actor, target })
      };
    case "reply_to":
      const replyResult = await replyTo({
        actor,
        source: target,
        runtimeState,
        text: String(proposal.args?.text ?? "")
      });

      return {
        category: runtimeState.hasDroppedMarker() ? "materialEnvironmentHandoff" as const : "conversationTurnState" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: replyResult.status },
        targetObservation: observation,
        targetResponse: {
          actor: actorId,
          tool: proposal.tool,
          result: replyResult.status
        },
        causedNext: { actor: actorId, tool: proposal.tool }
      };
    case "drop_item":
      return {
        category: "materialEnvironmentHandoff" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "dropped" },
        worldStateChange: await dropItem({
          actor,
          runtimeState,
          itemName: String(proposal.args?.itemName ?? "paper"),
          count: Number(proposal.args?.count ?? 1)
        })
      };
    case "remember":
      return {
        category: runtimeState.hasDroppedMarker() ? "materialEnvironmentHandoff" as const : "conversationTurnState" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "remembered" },
        memoryNote: {
          actor: actorId,
          note: String(proposal.args?.note ?? "")
        }
      };
    default:
      return {
        category: "conversationTurnState" as const,
        actorAction: { actor: actorId, tool: proposal.tool, result: "ok" }
      };
  }
}
```

```ts
export function createMutualTools({ runtimeState, memories }: CreateMutualToolsArgs) {
  return {
    lastResult(actorId: MutualActorId) {
      return runtimeState.lastResult(actorId);
    },
    validateProposal: validateMutualProposal,
    observe_world(input: ObserveWorldToolArgs) {
      return observeWorld({ ...input, runtimeState, memory: memories[input.actorId] });
    },
    async execute(input: ExecuteMutualToolArgs) {
      const step = await executeMutualTool({ ...input, runtimeState, memories });
      runtimeState.recordLastResult(input.actorId, {
        tool: input.proposal.tool,
        status: step.targetResponse?.result ?? step.actorAction.result
      });
      return step;
    }
  };
}
```

- [ ] **Step 6: Wire the live `v1` probe and script**

```ts
export function loadMutualProbeConfig(): ProbeConfig {
  return {
    ...loadProbeConfig(),
    probeId: "mutual_npc_interaction_probe_v1"
  };
}
```

```ts
export async function runMutualProbe() {
  const config = loadMutualProbeConfig();
  let server: ServerHandle | null = null;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let result: { transcriptPath: string } | null = null;
  let caughtError: unknown;
  const cleanupErrors: unknown[] = [];

  try {
    server = await startDockerServer(config);
    bots = await createBots(config, { host: server.host, port: server.port });
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
        npc_a: "Mara, anxious quartermaster",
        npc_b: "Jun, distracted runner"
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
```

```ts
function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    return `${error.message}\n${error.errors.map((entry) => formatError(entry)).join("\n")}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function main() {
  try {
    const { transcriptPath } = await runMutualProbe();
    console.log(transcriptPath);
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}
```

```bash
#!/usr/bin/env bash
set -euo pipefail

bun run --cwd probe probe:v1
```

Run:

```bash
chmod +x scripts/run-mutual-interaction-probe.sh
```

Expected: the new proof script is executable in the working tree.

- [ ] **Step 7: Run the tests, typecheck, and live proof**

Run:

```bash
bun run --cwd probe test
bun run --cwd probe typecheck
./scripts/run-mutual-interaction-probe.sh
```

Expected:

- all Bun tests pass;
- typecheck passes;
- the script exits `0` and prints a `data/evidence/mutual_npc_interaction_probe_v1-*.json` path.

- [ ] **Step 8: Commit the live runtime slice**

```bash
git add probe/package.json probe/bun.lock probe/src/config.ts probe/src/runtime/createBots.ts probe/src/tools/moveTo.ts probe/src/mutual probe/test/runtimeLogic.test.ts scripts/run-mutual-interaction-probe.sh
git commit -m "feat: add mutual npc interaction probe"
```

## Task 4: Update docs and write the evidence report

**Files:**
- Modify: `README.md`
- Modify: `docs/docs/Agent-Search-Index.md`
- Create: `docs/superpowers/reports/2026-05-19-mutual-npc-interaction-probe-review.md`
- Create: `docs/superpowers/reports/artifacts/2026-05-19-mutual-npc-interaction-probe-transcript.json`

- [ ] **Step 1: Add the new README proof section**

~~~md
## Mutual NPC interaction probe

Run the second headless proof:

```sh
./scripts/run-mutual-interaction-probe.sh
```

This proof adds:

1. two acting bots rather than one acting bot plus runtime-gated state
2. transcript category verdicts for conversation, spatial attention, and material handoff
3. a small item action (`paper`) that changes the next NPC response
~~~

- [ ] **Step 2: Update the search index route**

```md
- `MUTUAL_NPC_INTERACTION_PROBE_V1`
  - `docs/superpowers/plans/2026-05-19-mutual-npc-interaction-probe.md`
  - `scripts/run-mutual-interaction-probe.sh`
  - `docs/superpowers/reports/2026-05-19-mutual-npc-interaction-probe-review.md`
```

- [ ] **Step 3: Write the evidence report from the actual transcript**

```md
# Mutual NPC Interaction Probe Review

## Bottom line

`mutual_npc_interaction_probe_v1` ran against a real local Docker-backed server.

- Fill this report only after Step 4 with the exact transcript path printed by the proof run.

## Category verdicts

- Copy the exact `categories` object from the preserved transcript JSON.

## Durable evidence

- committed transcript copy:
  `docs/superpowers/reports/artifacts/2026-05-19-mutual-npc-interaction-probe-transcript.json`
- live run path:
  add the exact filename printed by Step 4

## What the transcript shows

1. `npc_a` approached `npc_b` and closed distance to the near threshold.
2. `npc_b` replied first with a busy response, then with a confirmation after the paper drop.
3. The dropped marker item changed a later response rather than only adding decoration.
```

- [ ] **Step 4: Re-run the proof command, inspect the artifact, and preserve the evidence**

Run:

```bash
artifact_path=$(./scripts/run-mutual-interaction-probe.sh)
mkdir -p docs/superpowers/reports/artifacts
cp "$artifact_path" docs/superpowers/reports/artifacts/2026-05-19-mutual-npc-interaction-probe-transcript.json
printf '%s\n' "$artifact_path"
```

Expected: the printed artifact path exists under `data/evidence/`, the committed copy is refreshed, and the report is updated from that copied JSON with the exact live path and verdict values.

- [ ] **Step 5: Run the full acceptance command set**

Run:

```bash
bun run --cwd probe test
bun run --cwd probe typecheck
./scripts/run-mutual-interaction-probe.sh
npm run build --prefix docs
```

Expected: all commands succeed and the docs build still passes.

- [ ] **Step 6: Commit the docs and report**

```bash
git add README.md docs/docs/Agent-Search-Index.md docs/superpowers/reports/2026-05-19-mutual-npc-interaction-probe-review.md docs/superpowers/reports/artifacts/2026-05-19-mutual-npc-interaction-probe-transcript.json
git commit -m "docs: record mutual probe proof"
```

## Self-Review

### Spec coverage

- Two acting NPCs: covered by Task 2 mutual providers and alternating loop.
- Conversation/turn-state category: covered by Task 2 and Task 3 reply/heard-message tools.
- Spatial attention/approach category: covered by Task 3 pathfinder-backed `move_to` and `look_at_actor`.
- Material/environment handoff category: covered by Task 3 `drop_item("paper", 1)` and the runtime-state marker observation.
- Transcript acceptance: covered by Task 1 and Task 4.
- Live proof and review handoff: covered by Task 3 and Task 4.

### Placeholder scan

- No `TODO`, `TBD`, or "implement later" placeholders remain.
- The item choice, script name, and tool set are locked so the implementer does not need to guess.

### Type consistency

- Actor ids stay `npc_a | npc_b`.
- The new transcript categories use `conversationTurnState`, `spatialAttentionApproach`, and `materialEnvironmentHandoff` consistently.
- The world-action slice uses `drop_item` + marker visibility, not a mix of chest/place/drop approaches.

Plan complete and saved to `docs/superpowers/plans/2026-05-19-mutual-npc-interaction-probe.md`.

Execution mode selected: **Inline Execution** in this session using `executing-plans`.
