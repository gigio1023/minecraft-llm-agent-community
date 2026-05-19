# Part 02 - Transcript and runtime state

Parent plan: [../2026-05-19-headless-mineflayer-probe.md](../2026-05-19-headless-mineflayer-probe.md)

This part keeps the pure logic small and local: transcript writing, runtime-owned dialogue state, memory, deterministic provider, and tool validation. It deliberately avoids Docker, bot connections, and the full proof loop.

## Task 2: Add the transcript writer as a tiny pure module

**Files:**
- Create: `probe/src/runtime/transcript.ts`
- Test: `probe/test/transcript.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createTranscript } from "../src/runtime/transcript.js";

test("createTranscript writes a JSON artifact with steps and final outcome", async () => {
  const evidenceDir = await fs.mkdtemp(path.join(os.tmpdir(), "probe-transcript-"));
  const transcript = createTranscript({
    probeId: "agent_loop_probe_v0",
    evidenceDir,
    bots: ["npc_a", "npc_b"]
  });

  transcript.recordStep({
    actor: "npc_a",
    observation: { visibleActors: [{ id: "npc_b", busy: true, distance: 3 }] },
    tool: "observe",
    result: { status: "ok" }
  });

  const outputPath = await transcript.write({
    status: "success",
    why: "runtime-owned busy result changed the next action"
  });

  const output = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.equal(output.probe, "agent_loop_probe_v0");
  assert.deepEqual(output.bots, ["npc_a", "npc_b"]);
  assert.equal(output.steps.length, 1);
  assert.equal(output.steps[0].actor, "npc_a");
  assert.equal(output.final.status, "success");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test probe/test/transcript.test.ts`
Expected: FAIL with `Cannot find module '../src/runtime/transcript'`

- [ ] **Step 3: Write the minimal implementation**

`probe/src/runtime/transcript.ts`

```ts
import fs from "node:fs/promises";
import path from "node:path";

type TranscriptStep = {
  actor: string;
  observation: unknown;
  tool: string;
  args?: Record<string, unknown>;
  result: unknown;
};

type TranscriptFinal = {
  status: string;
  why: string;
};

export function createTranscript({
  probeId,
  evidenceDir,
  bots
}: {
  probeId: string;
  evidenceDir: string;
  bots: string[];
}) {
  const steps: TranscriptStep[] = [];

  return {
    recordStep(step: TranscriptStep) {
      steps.push(step);
    },
    async write(final: TranscriptFinal) {
      await fs.mkdir(evidenceDir, { recursive: true });
      const outputPath = path.join(evidenceDir, `${probeId}-${Date.now()}.json`);
      const payload = {
        probe: probeId,
        bots,
        steps,
        final
      };

      await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      return outputPath;
    }
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test probe/test/transcript.test.ts`
Expected: PASS

## Task 3: Make runtime busy/available state and tool validation explicit

**Files:**
- Create: `probe/src/runtime/dialogueState.ts`
- Create: `probe/src/runtime/memory.ts`
- Create: `probe/src/provider/deterministicProvider.ts`
- Create: `probe/src/tools/index.ts`
- Test: `probe/test/runtimeLogic.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { createDialogueState } from "../src/runtime/dialogueState.js";
import { validateProposal } from "../src/tools/index.js";

test("runtime owns busy once and validation rejects unsupported tools", () => {
  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 1 });

  assert.deepEqual(dialogueState.requestTalk("npc_a", "npc_b"), {
    status: "busy",
    reason: "npc_b is busy"
  });

  assert.deepEqual(dialogueState.requestTalk("npc_a", "npc_b"), {
    status: "available"
  });

  assert.throws(
    () => validateProposal({ tool: "drop_database", args: {} }),
    /Unsupported tool/
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test probe/test/runtimeLogic.test.ts`
Expected: FAIL with `Cannot find module '../src/runtime/dialogueState'`

- [ ] **Step 3: Write the minimal implementation**

`probe/src/runtime/dialogueState.ts`

```ts
type DialogueReply =
  | { status: "busy"; reason: string }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

export function createDialogueState({
  busyRepliesBeforeAvailable
}: {
  busyRepliesBeforeAvailable: number;
}) {
  let remainingBusyReplies = busyRepliesBeforeAvailable;

  return {
    peek(targetId: string) {
      if (targetId !== "npc_b") return "unavailable" as const;
      return remainingBusyReplies > 0 ? "busy" : "available";
    },
    requestTalk(actorId: string, targetId: string): DialogueReply {
      if (actorId !== "npc_a" || targetId !== "npc_b") {
        return {
          status: "unavailable",
          reason: "only npc_a -> npc_b is supported in v0"
        };
      }

      if (remainingBusyReplies > 0) {
        remainingBusyReplies -= 1;
        return { status: "busy", reason: "npc_b is busy" };
      }

      return { status: "available" };
    }
  };
}
```

`probe/src/runtime/memory.ts`

```ts
export function createMemory(limit = 8) {
  const notes: string[] = [];

  return {
    add(note: string) {
      notes.push(note);
      while (notes.length > limit) notes.shift();
    },
    list() {
      return [...notes];
    }
  };
}
```

`probe/src/provider/deterministicProvider.ts`

```ts
export function createDeterministicProvider() {
  return {
    next({
      lastResult
    }: {
      lastResult: { tool: string; status: string } | null;
    }) {
      if (!lastResult) return { tool: "observe", args: {} };
      if (lastResult.tool === "observe") return { tool: "move_to", args: { target: "npc_b" } };
      if (lastResult.tool === "move_to") {
        return { tool: "say", args: { target: "npc_b", text: "hi npc_b, are you free?" } };
      }
      if (lastResult.tool === "say" && lastResult.status === "busy") {
        return { tool: "wait", args: { ticks: 20, reason: "npc_b was busy" } };
      }
      if (lastResult.tool === "wait") {
        return { tool: "say", args: { target: "npc_b", text: "checking again when you are ready" } };
      }
      return { tool: "remember", args: { note: "npc_b responded after one busy turn" } };
    }
  };
}
```

`probe/src/tools/index.ts`

```ts
export const allowedTools = ["observe", "move_to", "say", "wait", "remember"] as const;

export type ToolName = (typeof allowedTools)[number];

export function validateProposal(proposal: {
  tool: string;
  args?: Record<string, unknown>;
}) {
  if (!allowedTools.includes(proposal.tool as ToolName)) {
    throw new Error(`Unsupported tool: ${proposal.tool}`);
  }

  return {
    tool: proposal.tool as ToolName,
    args: proposal.args ?? {}
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test probe/test/runtimeLogic.test.ts`
Expected: PASS

- [ ] **Step 5: Run the TypeScript check**

Run: `bun run --cwd probe typecheck`
Expected: PASS
