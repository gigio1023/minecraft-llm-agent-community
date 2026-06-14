---
sidebar_position: 1
---

# Headless Server Setup

This guide explains the local headless Minecraft setup used by the current
runtime rebuild.

## Why Headless

The first proof should not require a manual Minecraft client.

The active workflow is:

1. start a local headless server;
2. connect Mineflayer bots;
3. run the bounded runtime;
4. inspect transcript and runtime artifacts;
5. optionally use viewer evidence if needed.

The primary evidence is not a GUI.
It is transcript plus runtime artifacts.

## Recommended Setup

Use the probe CLI for a repeatable local vanilla server:

```bash
bun run --cwd probe server:ready
```

This command uses `probe/compose.yaml`, starts a managed Docker Compose project
named `minecraft-agent-live-smoke` when needed, waits for a Minecraft protocol
ping, and prints a user-joinable endpoint.

Example output:

```text
status=ready
source=started
endpoint=127.0.0.1:25565
minecraft_direct_connect=127.0.0.1:25565
compose_project=minecraft-agent-live-smoke
data_dir=/Users/.../probe/tmp/live-smoke-server
stop_command=bun run --cwd probe server:stop
```

Use the `minecraft_direct_connect` value in the Minecraft Java client Direct
Connect dialog. By default the managed server uses fixed local port `25565`.
Override `MC_HOST_PORT` only when that port is already occupied.

The default runtime server version comes from `probe/src/config.ts`. For visual
seed scouting with `prismarine-viewer`, set `PROBE_SERVER_VERSION=1.21.4` so the
server version matches a viewer-supported version exactly. Keep this as a
scoped visual-capture override unless the benchmark runtime itself is being
deliberately migrated.

To inspect or stop the managed server:

```bash
bun run --cwd probe server:status
bun run --cwd probe server:stop
```

To watch NPC state, provider packets, memory, and action skills while a probe is
running:

```bash
bun run --cwd probe dashboard
```

Then open `http://127.0.0.1:4173`.

`server:ready` and `server:status` do not use provider auth and do not inspect
`build/provider-auth/openai-codex-auth.json`.

The exact Docker server definition lives in `probe/compose.yaml` and is the
runtime source of truth.

## Probe Connection Behavior

`probe/src/runProbe.ts` now uses the managed live-smoke server when `MC_PORT` is
not set:

- it calls the same readiness path as `bun run --cwd probe server:ready`;
- it keeps the managed server running after the probe so the user can inspect
  it;
- spawn setup uses `docker compose exec mc rcon-cli` against the managed compose
  context instead of a hardcoded container name.

Set `MC_PORT=<port>` only when intentionally connecting to a manually managed
server. The probe validates this override before bypassing the managed server.
In manual mode, RCON setup may be unavailable and the probe falls back to chat
commands.

For controlled behavior probes, prefer named world scenarios over ad hoc seed
selection. See `project-docs/Setup/World-Scenario-Testing.md`. Fixture setup is
environment evidence only; it never proves actor progress.

## Important Rules

- local headless setup only for the first proof;
- no manual client gate;
- no Fabric/Forge requirement for the first proof;
- Mineflayer is the client API layer;
- RCON and viewer are optional support tools, not the primary evidence path.

## Optional Visual Evidence

Mineflayer does not expose the same client-side screenshot function as pressing
F2 in a real Minecraft Java client. A true client screenshot requires a real
client or client-side mod/automation.

For headless runtime review, social-cycle runs can instead capture the bot view
rendered by `prismarine-viewer`. This is visual review evidence only. It can
help a human inspect where the NPC looked and whether a rough build is visible,
but it must not replace runtime verifier artifacts for block placement,
inventory, container state, position, or progress claims.

Enable it on a live/fresh social-cycle run:

```bash
bun run --cwd probe probe:social-cycle -- \
  --provider deterministic-social \
  --model deterministic-social \
  --fresh-world \
  --cycles 5 \
  --visual-evidence \
  --visual-evidence-interval 1 \
  --visual-evidence-camera both
```

The runtime starts local `prismarine-viewer` web views, uses system
Chrome/Chromium through `playwright-core`, and writes screenshots under the
actor workspace. The default camera mode is `both`: each captured cycle records
one first-person image and one third-person image. Third-person screenshots are
center-cropped so the NPC remains visible instead of becoming a tiny overhead
marker.

```text
data/actors/social-runs/<run_id>/<actor_id>/visual-evidence/
```

The report stores `visual_evidence.captures`, and the auto review markdown
embeds captured images with absolute local paths so Codex can render them.

Useful options and environment variables:

- `--visual-evidence`
- `--visual-evidence-interval <cycles>`
- `--visual-evidence-camera first-person|third-person|both`
- `--visual-evidence-port <port>`
- `--visual-evidence-width <px>`
- `--visual-evidence-height <px>`
- `SOCIAL_CYCLE_VISUAL_EVIDENCE_CAMERA=both`
- `SOCIAL_CYCLE_VISUAL_CHROME_PATH=/path/to/Chrome`

If Chrome, the viewer, or screenshot capture fails, the run records a visual
evidence failure artifact but does not fail the Minecraft cycle. Treat that as a
diagnostic gap, not actor behavior.

## Evidence Order

Use these in order:

1. transcript
2. checkpoint-like runtime artifacts
3. traces
4. optional visual confirmation
