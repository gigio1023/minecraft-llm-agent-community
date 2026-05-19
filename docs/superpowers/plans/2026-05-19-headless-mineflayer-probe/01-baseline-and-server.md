# Part 01 - Baseline and server

Parent plan: [../2026-05-19-headless-mineflayer-probe.md](../2026-05-19-headless-mineflayer-probe.md)

This part resets the probe baseline around Bun and TypeScript, while keeping the server setup boring: vanilla Docker image, offline auth, and no bot logic yet.

## Task 1: Lock the Bun-first TypeScript package and vanilla server defaults

**Files:**
- Create: `probe/package.json`
- Create: `probe/tsconfig.json`
- Create: `probe/compose.yaml`
- Create: `probe/src/config.ts`
- Test: `probe/test/serverConfig.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { buildServerEnv, loadProbeConfig } from "../src/config.js";

test("probe config targets the latest Mineflayer-tested GA server on a vanilla Docker server", () => {
  const config = loadProbeConfig();
  const env = buildServerEnv(config);

  assert.equal(config.server.version, "1.21.11");
  assert.equal(config.server.image, "itzg/minecraft-server:java21");
  assert.equal(config.server.host, "127.0.0.1");
  assert.equal(config.server.containerPort, 25565);
  assert.equal(config.server.publishStrategy, "ephemeral-host-port");
  assert.deepEqual(config.bots, ["npc_a", "npc_b"]);
  assert.equal(env.EULA, "TRUE");
  assert.equal(env.VERSION, "1.21.11");
  assert.equal(env.TYPE, "VANILLA");
  assert.equal(env.ONLINE_MODE, "FALSE");
  assert.equal(env.MODE, "creative");
  assert.equal(env.DIFFICULTY, "peaceful");
  assert.equal(env.LEVEL_TYPE, "FLAT");
  assert.equal(env.GENERATE_STRUCTURES, "false");
  assert.equal(env.SPAWN_NPCS, "true");
  assert.equal(env.SPAWN_ANIMALS, "false");
  assert.equal(env.SPAWN_MONSTERS, "false");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test probe/test/serverConfig.test.ts`
Expected: FAIL with `Cannot find module '../src/config'`

- [ ] **Step 3: Write the minimal config implementation**

`probe/src/config.ts`

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export type ProbeConfig = {
  probeId: string;
  evidenceDir: string;
  composeFile: string;
  server: {
    image: string;
    version: string;
    host: string;
    containerPort: number;
    publishStrategy: "ephemeral-host-port";
    pingTimeoutMs: number;
  };
  bots: [string, string];
  dialogue: {
    busyRepliesBeforeAvailable: number;
    waitTicks: number;
  };
  memoryLimit: number;
};

export function loadProbeConfig(): ProbeConfig {
  return {
    probeId: "agent_loop_probe_v0",
    evidenceDir: path.resolve(here, "../../data/evidence"),
    composeFile: path.resolve(here, "../compose.yaml"),
    server: {
      image: "itzg/minecraft-server:java21",
      version: "1.21.11",
      host: "127.0.0.1",
      containerPort: 25565,
      publishStrategy: "ephemeral-host-port",
      pingTimeoutMs: 120000
    },
    bots: ["npc_a", "npc_b"],
    dialogue: {
      busyRepliesBeforeAvailable: 1,
      waitTicks: 20
    },
    memoryLimit: 8
  };
}

export function buildServerEnv(config: ProbeConfig) {
  return {
    MC_IMAGE: config.server.image,
    MC_DATA_DIR: path.resolve(here, "../../tmp/probe-server"),
    EULA: "TRUE",
    VERSION: config.server.version,
    TYPE: "VANILLA",
    ONLINE_MODE: "FALSE",
    MODE: "creative",
    DIFFICULTY: "peaceful",
    LEVEL_TYPE: "FLAT",
    GENERATE_STRUCTURES: "false",
    SPAWN_NPCS: "true",
    SPAWN_ANIMALS: "false",
    SPAWN_MONSTERS: "false",
    VIEW_DISTANCE: "6",
    SIMULATION_DISTANCE: "6",
    ENABLE_COMMAND_BLOCK: "true"
  } satisfies Record<string, string>;
}
```

- [ ] **Step 4: Add the package, TypeScript, and Compose files**

`probe/package.json`

```json
{
  "name": "headless-mineflayer-probe",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.3.5",
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "probe:v0": "bun run src/cli.ts"
  },
  "dependencies": {
    "minecraft-protocol": "^1.66.2",
    "mineflayer": "^4.37.1",
    "vec3": "^0.1.10"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.8.3"
  }
}
```

`probe/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

`probe/compose.yaml`

```yaml
services:
  mc:
    image: ${MC_IMAGE}
    tty: true
    stdin_open: true
    environment:
      EULA: ${EULA}
      VERSION: ${VERSION}
      TYPE: ${TYPE}
      ONLINE_MODE: ${ONLINE_MODE}
      MODE: ${MODE}
      DIFFICULTY: ${DIFFICULTY}
      LEVEL_TYPE: ${LEVEL_TYPE}
      GENERATE_STRUCTURES: ${GENERATE_STRUCTURES}
      SPAWN_NPCS: ${SPAWN_NPCS}
      SPAWN_ANIMALS: ${SPAWN_ANIMALS}
      SPAWN_MONSTERS: ${SPAWN_MONSTERS}
      VIEW_DISTANCE: ${VIEW_DISTANCE}
      SIMULATION_DISTANCE: ${SIMULATION_DISTANCE}
      ENABLE_COMMAND_BLOCK: ${ENABLE_COMMAND_BLOCK}
    ports:
      - "127.0.0.1::25565"
    volumes:
      - ${MC_DATA_DIR}:/data
```

- [ ] **Step 5: Install dependencies with Bun**

Run: `bun install --cwd probe`
Expected: install completes and writes `probe/bun.lock`

- [ ] **Step 6: Run the targeted test to verify it passes**

Run: `bun test probe/test/serverConfig.test.ts`
Expected: PASS

- [ ] **Step 7: Run the TypeScript check**

Run: `bun run --cwd probe typecheck`
Expected: PASS
