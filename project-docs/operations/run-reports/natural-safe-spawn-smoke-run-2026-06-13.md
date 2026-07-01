---
sidebar_position: 104
---

# Natural Safe Spawn Smoke Run

Search token: `NATURAL_SAFE_SPAWN_SMOKE_RUN_2026_06_13`.

Status: dated setup smoke evidence.

Recorded: `2026-06-13 KST`.

## Purpose

Validate `natural-safe-spawn-v1` setup truthfulness without spending provider
budget. This smoke was not an Actor Turn behavior verdict. It checked that the
managed fresh world can produce a truthful scenario manifest and a
`natural-spawn-validation/v1` artifact before a later provider-heavy run.

## Command

```bash
cd probe
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle \
  --provider deterministic-social \
  --model deterministic-social \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-safe-spawn-v1 \
  --report ../tmp/social-cycle-natural-safe-spawn-deterministic-1-20260613.json
```

The CLI exited with code `1` because the one-cycle deterministic runtime report
ended as `runtime_status: "blocked"`. That is acceptable for this smoke: the
run was used to validate setup evidence, not gameplay completion.

## Result

- Report:
  `tmp/social-cycle-natural-safe-spawn-deterministic-1-20260613.json`
- Run id:
  `social-cycle-80f88b64-f818-4a06-aea1-13b5673765fa`
- Provider:
  `deterministic-social`
- Provider usage records:
  `0`
- Runtime status:
  `blocked`
- World scenario setup status:
  `passed`
- Natural spawn validation status:
  `passed`
- Fresh Minecraft container cleanup:
  completed; only unrelated Langfuse containers remained running afterward.

## Evidence

Scenario manifest:

```text
data/actors/social-runs/social-cycle-80f88b64-f818-4a06-aea1-13b5673765fa/npc_b/evidence/world-scenarios/social-cycle-80f88b64-f818-4a06-aea1-13b5673765fa-natural-safe-spawn-v1.json
```

Natural spawn validation artifact:

```text
data/actors/social-runs/social-cycle-80f88b64-f818-4a06-aea1-13b5673765fa/npc_b/evidence/world-scenarios/social-cycle-80f88b64-f818-4a06-aea1-13b5673765fa-natural-safe-spawn-v1-natural-spawn-validation.json
```

Observed validation facts:

- `credited_as_actor_progress: false`
- selected coordinate: `{ "x": 1, "y": 65, "z": 6 }`
- selected player position: `{ "x": 1.5, "y": 65, "z": 6.5 }`
- ground block: `grass_block`
- feet/head blocks: `air`
- nearest loaded log: `oak_log` at distance `25`
- embedded `world-state-scan/v1` had `256` verified block observations and
  explicit loaded-world limitations.

The report cycle evidence refs did not include `world-scenarios` or
`natural-spawn` refs, so setup validation was not inserted as actor progress.

## Next Use

The next provider experiment can use `natural-safe-spawn-v1` with screenshots,
but should still review the manifest and validation artifact before judging
Actor Turn behavior. If a later seed or spawn fails validation, classify it as
environment/setup failure rather than model behavior.
