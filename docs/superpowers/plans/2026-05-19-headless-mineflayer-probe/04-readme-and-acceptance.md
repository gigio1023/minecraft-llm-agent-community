# Part 04 - README and acceptance

Parent plan: [../2026-05-19-headless-mineflayer-probe.md](../2026-05-19-headless-mineflayer-probe.md)

This part stays small. By this point the proof should already run. The remaining work is to explain the new path in the repo and then re-check the acceptance conditions.

## Task 5: Update README for the smaller first slice

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the old manual-client guidance with the headless proof section**

```md
## Headless Mineflayer Probe

The active direction is a tiny headless probe, not the old Voyager eval loop.

Install the probe package:

    bun install --cwd probe

Check the TypeScript package:

    bun run --cwd probe typecheck

Run the deterministic proof:

    ./scripts/run-agent-loop-probe.sh

This command starts a local vanilla Docker server, waits for Minecraft ping readiness, connects `npc_a` and `npc_b` with offline auth, runs the deterministic observe/move/say/wait/remember loop, and writes a transcript JSON artifact under `data/evidence/`.

No manual Minecraft client, Fabric, Forge, or live OpenAI provider is required for this first proof.
```

- [ ] **Step 2: Remove or rewrite the outdated manual-client lines**

```md
Delete this outdated guidance:

## Check the bots are running
If you want to check the bots, install minecraft and conenct to the local minecraft server.
The default address is `localhost:25565`.
```

- [ ] **Step 3: Re-run the proof command after the README edit**

Run: `./scripts/run-agent-loop-probe.sh`
Expected: still exits `0` and prints a transcript path under `data/evidence/`

## Final acceptance

- [ ] `probe/package.json` and `probe/tsconfig.json` define a Bun-first TypeScript package
- [ ] probe server version is `1.21.11`, not `1.21.1`
- [ ] Docker publishes an ephemeral host port instead of hard-coded `25565`
- [ ] readiness is gated by `mc.ping()` before bot connect
- [ ] `npc_b` busy/available is produced by runtime dialogue state, not provider fakery
- [ ] automated tests stay at exactly three small suites
- [ ] `bun run --cwd probe typecheck` passes
- [ ] `./scripts/run-agent-loop-probe.sh` is the primary proof path
- [ ] transcript artifact under `data/evidence/` shows `3+` observe/tool/result iterations

## Self-review

- The split still keeps shared constraints in the index file and task detail in focused subplans.
- The plan now matches the requested execution path: TypeScript source, Bun-first commands, Node 22-compatible dependencies, and a script-first proof.
- The file list stays small and responsibility-based, so the probe does not collapse back into one oversized runtime file.
