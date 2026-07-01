# Stable Natural Seed Capture

Search token: `EXPERIMENT_2026_06_13_1214_STABLE_CAPTURE`.

Status: recorded visual capture improvement run.

## Purpose

Re-capture the natural seed `9137002542963915989` using a Minecraft server
version that `prismarine-viewer` explicitly supports. The previous `1.21.11`
captures showed redstone-like/crafter-like blocks that were not present in
runtime observation artifacts.

## Runtime Condition

- server version override: `PROBE_SERVER_VERSION=1.21.4`;
- seed: `9137002542963915989`;
- scenario: `natural-safe-spawn-v1`;
- provider: `deterministic-social`;
- external LLM requests: `0`;
- visual evidence: enabled;
- capture stabilization: viewer `viewDistance` default raised to `8`, with
  startup and per-capture render settle waits.

## Results

| View | Runtime | Setup | Natural Validation | Captures | Capture Failures |
|---|---|---|---|---:|---:|
| first-person | `blocked` after 1 deterministic cycle | passed | passed | 3 | 0 |
| third-person | `blocked` after 1 deterministic cycle | passed | passed | 3 | 0 |

The `blocked` runtime status belongs to the one-cycle deterministic actor smoke,
not to seed setup or screenshot capture.

## Visual Verdict

The re-captured images no longer show the obvious redstone/crafter block-state
mismatch seen in the `1.21.11` viewer run. The world reads as a natural
forest/coast spawn with nearby birch/oak, water, animals, and ordinary terrain.

Use this condition for seed visual scouting until `prismarine-viewer` supports
the active runtime server version exactly.

## Primary Images

- `first-person/screenshots/cycle-0001-cycle-end.png`
- `third-person/screenshots/cycle-0001-cycle-end.png`

