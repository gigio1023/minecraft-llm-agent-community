# Visual Evidence Dual-Camera Smoke

Search token: `EXPERIMENT_2026_06_13_DUAL_CAMERA_VISUAL_EVIDENCE`.

Status: passed for capture behavior, with deterministic actor runtime ending as
`blocked` after one cycle.

## Purpose

Verify that visual evidence can record both first-person and third-person views
for every captured cycle. The third-person image is center-cropped so the NPC is
visible instead of appearing as a tiny marker in a high overhead view.

## Condition

- server version override: `PROBE_SERVER_VERSION=1.21.4`;
- seed: `9137002542963915989`;
- scenario: `natural-safe-spawn-v1`;
- provider: `deterministic-social`;
- external provider requests: `0`;
- cycles: `1`;
- visual interval: `1`;
- visual camera: `both`.

## Result

- captures: `6`;
- failures: `0`;
- expected images:
  - `initial-initial-first-person.png`;
  - `initial-initial-third-person.png`;
  - `cycle-0001-cycle-end-first-person.png`;
  - `cycle-0001-cycle-end-third-person.png`;
  - `cycle-0001-final-first-person.png`;
  - `cycle-0001-final-third-person.png`.

The CLI exited nonzero because the one-cycle deterministic gameplay smoke ended
with runtime status `blocked`; the visual capture path itself passed.

