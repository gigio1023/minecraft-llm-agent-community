# Part 03 - Proof runtime and script

Parent plan: [../2026-05-19-headless-mineflayer-probe.md](../2026-05-19-headless-mineflayer-probe.md)

This part wires the actual proof: Docker lifecycle, bot creation, tool modules, bounded loop, and the single proof command. This is the first place where the Minecraft server is actually started.

## Task 4: Build the standalone proof script and Docker-first runtime

**Files:**
- Create: `probe/src/server/dockerServer.ts`
- Create: `probe/src/runtime/createBots.ts`
- Create: `probe/src/tools/observe.ts`
- Create: `probe/src/tools/moveTo.ts`
- Create: `probe/src/tools/say.ts`
- Create: `probe/src/tools/wait.ts`
- Create: `probe/src/tools/remember.ts`
- Create: `probe/src/runtime/agentLoop.ts`
- Create: `probe/src/runProbe.ts`
- Create: `probe/src/cli.ts`
- Create: `scripts/run-agent-loop-probe.sh`

- [ ] **Step 1: Run the proof command before the implementation exists**

Run: `./scripts/run-agent-loop-probe.sh`
Expected: FAIL with `No such file or directory`

- [ ] **Step 2: Add Docker lifecycle code with readiness and cleanup**

`probe/src/server/dockerServer.ts`

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import mc from "minecraft-protocol";

import { buildServerEnv, type ProbeConfig } from "../config.js";

type ExecResult = {
  stdout: string;
  stderr: string;
};

export type ServerHandle = {
  host: string;
  port: number;
  stop: () => Promise<void>;
};

function execCommand(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

async function waitForServerReady({
  host,
  port,
  version,
  timeoutMs
}: {
  host: string;
  port: number;
  version: string;
  timeoutMs: number;
}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await new Promise((resolve, reject) => {
        mc.ping({ host, port, version }, (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        });
      });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

function parsePublishedPort(output: string) {
  const value = Number(output.trim().split(":").at(-1));
  if (!Number.isFinite(value)) {
    throw new Error(`Could not parse Docker published port from: ${output}`);
  }
  return value;
}

export async function startDockerServer(config: ProbeConfig): Promise<ServerHandle> {
  const projectName = `probe-${Date.now()}`;
  const dataDir = path.resolve("tmp/probe-server", projectName);
  await fs.mkdir(dataDir, { recursive: true });

  const env = {
    ...process.env,
    ...buildServerEnv(config),
    COMPOSE_PROJECT_NAME: projectName,
    MC_DATA_DIR: dataDir
  };

  try {
    await execCommand("docker", ["compose", "-f", config.composeFile, "up", "-d"], env);
    const portResult = await execCommand(
      "docker",
      ["compose", "-f", config.composeFile, "port", "mc", String(config.server.containerPort)],
      env
    );
    const port = parsePublishedPort(portResult.stdout);

    await waitForServerReady({
      host: config.server.host,
      port,
      version: config.server.version,
      timeoutMs: config.server.pingTimeoutMs
    });

    return {
      host: config.server.host,
      port,
      async stop() {
        await execCommand("docker", ["compose", "-f", config.composeFile, "down", "-v"], env);
      }
    };
  } catch (error) {
    await execCommand("docker", ["compose", "-f", config.composeFile, "down", "-v"], env).catch(() => {});
    throw error;
  }
}
```

- [ ] **Step 3: Add bot creation and tool modules**

`probe/src/runtime/createBots.ts`

```ts
import { once } from "node:events";
import mineflayer, { type Bot } from "mineflayer";

import type { ProbeConfig } from "../config.js";
import type { ServerHandle } from "../server/dockerServer.js";

export type ProbeBots = {
  npc_a: Bot;
  npc_b: Bot;
};

export async function createBots(config: ProbeConfig, server: ServerHandle): Promise<ProbeBots> {
  const bots = await Promise.all(
    config.bots.map(async (username) => {
      const bot = mineflayer.createBot({
        host: server.host,
        port: server.port,
        username,
        auth: "offline",
        version: config.server.version,
        viewDistance: "tiny"
      });

      await once(bot, "spawn");
      return bot;
    })
  );

  return {
    npc_a: bots[0],
    npc_b: bots[1]
  };
}

export async function closeBots(bots: ProbeBots) {
  await Promise.all(
    Object.values(bots).map(async (bot) => {
      try {
        bot.quit("probe finished");
      } catch {
        // v0 cleanup is best-effort because shutdown happens after transcript write.
      }
    })
  );
}
```

`probe/src/tools/observe.ts`

```ts
import type { Bot } from "mineflayer";

type DialogueState = {
  peek: (targetId: string) => "busy" | "available" | "unavailable";
};

type MemoryStore = {
  list: () => string[];
};

export function createObserveTool({
  dialogueState,
  memory
}: {
  dialogueState: DialogueState;
  memory: MemoryStore;
}) {
  return async ({ actor, target }: { actor: Bot; target: Bot }) => ({
    status: "ok",
    visibleActors: [
      {
        id: target.username,
        distance: Number(actor.entity.position.distanceTo(target.entity.position).toFixed(2)),
        busy: dialogueState.peek(target.username) === "busy"
      }
    ],
    memory: memory.list()
  });
}
```

`probe/src/tools/moveTo.ts`

```ts
import type { Bot } from "mineflayer";

export function createMoveToTool() {
  return async ({ actor, target }: { actor: Bot; target: Bot }) => {
    await actor.lookAt(target.entity.position.offset(0, target.entity.height, 0));
    actor.setControlState("forward", true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    actor.setControlState("forward", false);

    return {
      status: actor.entity.position.distanceTo(target.entity.position) <= 4 ? "arrived" : "moved"
    };
  };
}
```

`probe/src/tools/say.ts`

```ts
import type { Bot } from "mineflayer";

type DialogueState = {
  requestTalk: (actorId: string, targetId: string) => { status: string; reason?: string };
};

export function createSayTool({ dialogueState }: { dialogueState: DialogueState }) {
  return async ({
    actor,
    target,
    args
  }: {
    actor: Bot;
    target: Bot;
    args: { text: string };
  }) => {
    const talk = dialogueState.requestTalk(actor.username, target.username);

    if (talk.status !== "available") {
      return talk;
    }

    actor.chat(args.text);
    return { status: "delivered" };
  };
}
```

`probe/src/tools/wait.ts`

```ts
export function createWaitTool() {
  return async ({ args }: { args: { ticks: number } }) => {
    await new Promise((resolve) => setTimeout(resolve, args.ticks * 50));
    return { status: "waited", ticks: args.ticks };
  };
}
```

`probe/src/tools/remember.ts`

```ts
type MemoryStore = {
  add: (note: string) => void;
};

export function createRememberTool({ memory }: { memory: MemoryStore }) {
  return async ({ args }: { args: { note: string } }) => {
    memory.add(args.note);
    return { status: "remembered", note: args.note };
  };
}
```

- [ ] **Step 4: Wire the bounded loop, entrypoint, and shell script**

`probe/src/runtime/agentLoop.ts`

```ts
import type { ProbeBots } from "./createBots.js";

type ToolResult = {
  status: string;
  [key: string]: unknown;
};

type Toolset = {
  observe: (input: { actor: ProbeBots["npc_a"]; target: ProbeBots["npc_b"] }) => Promise<unknown>;
  move_to: (input: {
    actor: ProbeBots["npc_a"];
    target: ProbeBots["npc_b"];
    args: Record<string, unknown>;
  }) => Promise<ToolResult>;
  say: (input: {
    actor: ProbeBots["npc_a"];
    target: ProbeBots["npc_b"];
    args: Record<string, unknown>;
  }) => Promise<ToolResult>;
  wait: (input: { args: Record<string, unknown> }) => Promise<ToolResult>;
  remember: (input: { args: Record<string, unknown> }) => Promise<ToolResult>;
  validateProposal: (proposal: { tool: string; args?: Record<string, unknown> }) => {
    tool: "observe" | "move_to" | "say" | "wait" | "remember";
    args: Record<string, unknown>;
  };
};

type Transcript = {
  recordStep: (step: {
    actor: string;
    observation: unknown;
    tool: string;
    args: Record<string, unknown>;
    result: ToolResult;
  }) => void;
};

export async function runAgentLoop({
  bots,
  provider,
  tools,
  transcript
}: {
  bots: ProbeBots;
  provider: {
    next: (input: {
      observation: unknown;
      lastResult: { tool: string; status: string } | null;
    }) => { tool: string; args?: Record<string, unknown> };
  };
  tools: Toolset;
  transcript: Transcript;
}) {
  let lastResult: { tool: string; status: string } | null = null;

  for (let step = 0; step < 6; step += 1) {
    const actor = bots.npc_a;
    const target = bots.npc_b;
    const observation = await tools.observe({ actor, target });
    const proposal = tools.validateProposal(provider.next({ observation, lastResult }));
    const result = await tools[proposal.tool]({
      actor,
      target,
      args: proposal.args
    } as never);

    transcript.recordStep({
      actor: actor.username,
      observation,
      tool: proposal.tool,
      args: proposal.args,
      result
    });

    lastResult = { tool: proposal.tool, status: result.status };

    if (proposal.tool === "remember") {
      return {
        status: "success",
        why: "runtime-owned busy result changed the next action"
      };
    }
  }

  throw new Error("step budget exhausted before remember");
}
```

`probe/src/runProbe.ts`

```ts
import { loadProbeConfig } from "./config.js";
import { createDeterministicProvider } from "./provider/deterministicProvider.js";
import { closeBots, createBots } from "./runtime/createBots.js";
import { runAgentLoop } from "./runtime/agentLoop.js";
import { createDialogueState } from "./runtime/dialogueState.js";
import { createMemory } from "./runtime/memory.js";
import { createTranscript } from "./runtime/transcript.js";
import { startDockerServer, type ServerHandle } from "./server/dockerServer.js";
import { validateProposal } from "./tools/index.js";
import { moveTo } from "./tools/moveTo.js";
import { observe } from "./tools/observe.js";
import { remember } from "./tools/remember.js";
import { say } from "./tools/say.js";
import { wait } from "./tools/wait.js";

export type ProbeRunResult = {
  transcriptPath: string;
  cleanupError?: unknown;
};

export async function runProbe(): Promise<ProbeRunResult> {
  const config = loadProbeConfig();
  let server: ServerHandle | null = null;
  let bots: Awaited<ReturnType<typeof createBots>> | null = null;
  let caughtError: unknown;
  let result: { transcriptPath: string } | null = null;
  const cleanupErrors: unknown[] = [];

  try {
    server = await startDockerServer(config);
    bots = await createBots(config, server);
    const memory = createMemory(config.memoryLimit);
    const dialogueState = createDialogueState(config.dialogue);
    const provider = createDeterministicProvider();
    const transcript = createTranscript({
      probeId: config.probeId,
      evidenceDir: config.evidenceDir,
      bots: [bots.npc_a.username, bots.npc_b.username]
    });

    const final = await runAgentLoop({
      bots,
      provider,
      transcript,
      tools: {
        validateProposal,
        observe: ({ actor, target }) => observe({ actor, target, dialogueState, memory }),
        move_to: ({ actor, target, args }) =>
          moveTo({ actor, target, targetId: String(args.target) }),
        say: ({ actor, target, args }) =>
          say({ actor, target, dialogueState, text: String(args.text) }),
        wait: ({ args }) => wait({ ticks: Number(args.ticks) }),
        remember: ({ args }) => remember({ memory, note: String(args.note) })
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

  if (caughtError && cleanupErrors.length > 0) {
    throw new AggregateError([caughtError, ...cleanupErrors], "Probe failed and cleanup also failed");
  }

  if (caughtError) {
    throw caughtError;
  }

  if (result) {
    return cleanupErrors.length > 0
      ? { ...result, cleanupError: cleanupErrors.length === 1 ? cleanupErrors[0] : new AggregateError(cleanupErrors, "Probe cleanup failed") }
      : result;
  }

  throw new Error("Probe ended unexpectedly");
}
```

`probe/src/cli.ts`

```ts
import { runProbe } from "./runProbe.js";

runProbe()
  .then(({ transcriptPath, cleanupError }) => {
    if (cleanupError) {
      console.warn(cleanupError);
    }
    console.log(transcriptPath);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
```

`scripts/run-agent-loop-probe.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

bun run --cwd probe probe:v0
```

- [ ] **Step 5: Run the TypeScript check**

Run: `bun run --cwd probe typecheck`
Expected: PASS

- [ ] **Step 6: Run the proof command**

Run: `./scripts/run-agent-loop-probe.sh`
Expected:
- exits `0`
- prints one `data/evidence/agent_loop_probe_v0-*.json` path
- transcript contains `3+` steps
- at least one step result is `"busy"`
- the next step after `"busy"` is `"wait"` rather than another `"say"`
