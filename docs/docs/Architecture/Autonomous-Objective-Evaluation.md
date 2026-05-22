---
sidebar_position: 10
---

# Autonomous Objective Evaluation

Search token: `AUTONOMOUS_OBJECTIVE_EVALUATION`.

Autonomous objective evaluation is the bridge between per-action-skill probes
and larger social simulation. It asks a small Minecraft goal of the runtime and
then checks whether the current run produced real world-state evidence.

This is not a Voyager-style open-ended loop. The objective is bounded, the
runtime turn budget is small, and success is decided by runtime evidence rather
than provider text.

## Contract

An autonomous objective has:

- a small grammar-like goal statement;
- required action skills and allowed primitives;
- optional fixture or starting inventory requirements;
- exact argument expectations when a primitive needs them;
- current-run evidence rules;
- a failure taxonomy that distinguishes environment blockers, provider
  proposal errors, repeated observation, stale context, and missing world
  progress.

The first objective is intentionally small:

```text
collect_current_run_oak_log_1
```

It passes only when the current transcript contains a `collect_logs` attempt
with verifier-passed log inventory progress. A memory note, old evidence file,
provider explanation, or terminal summary cannot satisfy it.

## Oracle Layers

Objective evaluation uses three layers.

1. Proposal oracle
   - detects repeated `observe` loops before concrete work;
   - rejects terminal `remember` as proof of gameplay progress;
   - records unsupported tool/action-skill id drift.
2. Argument oracle
   - checks primitive argument shape and objective-specific required fields;
   - treats action-skill ids as invalid primitive tool ids.
3. Evidence oracle
   - accepts only current-run transcript evidence;
   - uses pre/post observation deltas, tool result fields, and runtime verifier
     output;
   - never promotes historical actor workspace evidence into objective success.

## Reference Patterns

Local reference repositories were useful conceptually but should not be copied
as runtime architecture:

- Voyager: adopt verification-friendly task grammar and direct generated code as
  a fast action language, while keeping success tied to current-run evidence.
- Mindcraft: adopt compact task metadata such as target count, blocked actions,
  initial inventory, and timeouts where useful.
- Odyssey: adopt a small prerequisite graph later, starting with wood, planks,
  crafting table, wooden pickaxe, and cobblestone.
- mineflayer-chatgpt and mc-multimodal-agent: adopt attempt statistics,
  broken/blocked classification, and partial-progress-not-complete reporting.

## Implementation Path

The objective harness starts as a report layer over real runtime transcripts.
That gives immediate automated checks without duplicating server startup,
Mineflayer connection, active action-skill gating, provider snapshots, or
transcript persistence.

Near-term work:

1. Evaluate `collect_current_run_oak_log_1` from current-run transcript evidence.
2. Add `mine_current_run_cobblestone_1` with exact primitive argument checks.
3. Add `inspect_then_deposit_oak_log_1` with actor/chest ledger evidence.
4. Let the objective runner request direct generated TypeScript action skills
   when no known active action skill solves the goal.
5. Allow a small objective runner to pass a custom task selector and terminal
   condition into `runAgentLoop` instead of relying only on the deterministic
   curriculum.
6. Connect reviewer sidecars so direct generated code can be cleaned up into
   reusable action skills or bounded recipes after the first attempt.

## Non-Goals

- broad item tech-tree completion;
- loose generated TypeScript execution without objective evidence;
- blocking critic or skill-builder loops during actor turns;
- success from historical transcripts after code changes;
- social simulation claims before boring competence objective reports pass.
