# Plain Natural Seed Scout

Search token: `EXPERIMENT_2026_06_13_PLAIN_SEED_SCOUT`.

Status: recorded seed-scouting run.

## Purpose

Find ordinary natural Minecraft worlds for project-level LLM benchmark runs.
The target world should be less sterile than flat fixtures, but still practical
for repeated behavior comparison:

- natural terrain, not a void-like or over-engineered fixture;
- near enough wood for early survival/action-skill tasks;
- preferably near a village or ordinary plains/forest terrain;
- usable with `natural-safe-spawn-v1`, fresh world reset, fixed seed, and
  third-person visual evidence.

## Method

Command shape:

```bash
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider deterministic-social \
  --model deterministic-social \
  --fresh-world \
  --world-scenario natural-safe-spawn-v1 \
  --world-seed "<seed>" \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --visual-evidence \
  --visual-evidence-interval 1 \
  --visual-evidence-camera third-person \
  --visual-evidence-width 1280 \
  --visual-evidence-height 720 \
  --report "../tmp/seed-scout-20260613-plain/<slug>/report.json"
```

Provider usage: `deterministic-social` only. No external LLM requests were made.

## Candidate Results

| Candidate | Seed | Setup | Natural Validation | Nearest Useful Logs | Recommendation |
|---|---:|---|---|---|---|
| `plains-village-near-spawn` | `9137002542963915989` | passed | passed | oak at `1.41m`, spruce at `8.60m` | best ordinary survival candidate |
| `plains-village-cherry-nearby` | `4167799982467607063` | passed | passed | stripped oak at `2.00m`, oak at `13.00m`, cherry at `10.05m` | best village-like candidate, but village wood may bias tasks |
| `sunflower-plains-forest` | `9066` | passed | passed | oak at `24.70m` | usable as a less village-biased plains/forest candidate |
| `plains-village-south` | `300043` | failed | failed | none loaded within scan radius | reject for this scenario |
| `plain-flower-meadow` | `400` | failed | failed | none loaded within scan radius | reject for this scenario |

The one-cycle runtime status for the three accepted candidates was `blocked`,
but the seed decision is based on scenario setup and natural spawn validation,
not on the deterministic actor completing a gameplay objective.

## Recommendation

Use `9137002542963915989` as the default natural benchmark seed.

Reasons:

- it passes `natural-safe-spawn-v1`;
- the selected coordinate is ordinary terrain with nearby oak and spruce logs;
- it avoids the fixture-world sterility problem;
- it gives early tasks immediate wood access without requiring a village house
  to be mined first.

Use `4167799982467607063` only when the benchmark intentionally wants
village-adjacent behavior and the report is based on structured artifacts rather
than the current viewer screenshot. The captured image for this seed is visually
misleading: many natural/village blocks render like redstone-like technical
blocks because of the local viewer/version mismatch. Artifact search and the
world-state scan did not find redstone, repeater, comparator, wire, piston, or
observer blocks near the validated start, but this seed should not be used as a
"looks natural" visual reference until the capture path is fixed.

Use `9066` as a backup "ordinary plains/forest" seed when village proximity
should not dominate the run.

## Visual Evidence Limitation

Current screenshots are useful only for rough scouting, not production-grade
visual judging. The local `prismarine-viewer` package is latest installed, but
its version support list ends at `1.21.4` while this repo runs Minecraft
`1.21.11`. Its version resolver falls back to the latest supported version in
the same major line, so this run is rendered through `1.21.4` assets/blockstate
data against a `1.21.11` server.

The `prismarine-viewer` GitHub issue tracker has an open `1.21.5^ Support`
issue describing the same failure class: later 1.21 patch versions may render
blocks as unrelated alternative blocks. In the `4167799982467607063` capture,
ordinary/village blocks appear as redstone-like technical blocks even though
the runtime artifact scan does not show redstone, repeater, comparator, wire,
piston, observer, or crafter block names near the validated start.

For benchmark scoring, trust structured runtime artifacts and world-scenario
validation over screenshot appearance. For polished reports, add a real-client
or renderer-compatible capture path before relying on visuals as primary
evidence.

## Sources Used For Candidate Discovery

- DigMinecraft Java village seeds and plains seeds.
- ExitLag Minecraft village seed list.
- PrismarineJS `prismarine-viewer` issue `#473`, `1.21.5^ Support`.
