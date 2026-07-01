# Grounded Social Trajectory Smoke

Date: 2026-06-15

Search token: `GROUNDED_SOCIAL_TRAJECTORY_SMOKE_2026_06_15`.

## Purpose

This provider-free smoke validates the first social-simulation scoring harness.
It does not claim live Minecraft social competence. It checks whether the repo
can score an evidence-backed social chain before running a live multi-actor LLM
experiment.

Scenario:

```text
grounded_social_sticks_from_deposited_logs_v1
```

Expected chain:

```text
npc_c requests oak_log
-> npc_b promises contribution
-> npc_b deposits oak_log into shared storage
-> npc_c inspects and withdraws shared value
-> npc_c crafts sticks
-> npc_a records relationship/social value with evidence refs
```

## Command

```bash
cd probe
bun run probe:social-trajectory -- \
  --out ../project-docs/experiments/curated/2026-06-15/grounded-social-trajectory-smoke/report.json \
  --html ../project-docs/experiments/curated/2026-06-15/grounded-social-trajectory-smoke/index.html
```

## Result

- status: `passed`
- score: `100/100`
- provider: `deterministic`
- live provider calls: `0`
- live Minecraft server: `false`
- event count: `8`
- evidence ref count: `21`

Dimension scores:

| Dimension | Score | Meaning |
| --- | ---: | --- |
| Physical Contribution | 20/20 | Shared deposit includes item/count/container evidence. |
| Social Exchange | 20/20 | Request, promise, and contribution occur in order. |
| Cross-Actor Consumption | 20/20 | Another actor consumes shared value and crafts a useful item. |
| Memory Or Relationship Continuity | 20/20 | A later social/memory event cites prior evidence. |
| Auditability | 20/20 | Events have actors, order, evidence refs, and required physical details. |

## Artifacts

- `report.json`: machine-readable scored report.
- `index.html`: human-readable social-chain report.

## Interpretation

This is a harness validation, not a model benchmark. The important result is
that private-only crafting cannot pass as social simulation: the scorer requires
shared visibility, cross-actor use, and continuity evidence.

Next live step:

- use the same event ledger and scoring dimensions in a tiny two-to-three actor
  Minecraft run;
- run provider-specific quota preflight before any LLM call;
- require operator approval for the model/provider;
- include runtime action records, shared storage deltas, memory/relationship
  artifacts, and screenshots as supporting evidence.
