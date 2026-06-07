# Behavior Insight Loop

Use this when the reviewer has watched the bot in Minecraft or described
concrete behavior that is not fully captured by transcript fields.

## Core Principle

The purpose of a runtime review is not to summarize artifacts. It is to turn
observed behavior into implementation insight.

Use this chain:

```text
visible behavior -> artifact evidence -> likely mechanism -> narrow code fix -> next run check
```

Do not stop at "the run failed." Name the mechanism that would produce the
observed failure.

## Human Observation Is Evidence

Treat user-visible reports as first-class evidence, especially when they include
specific motion or repeated patterns:

- "It only looks like it is mining" means animation or intent is not proof of
  block removal.
- "It keeps walking far in one direction" suggests target selection, pathfinder
  drift, stale entity/item pursuit, or uncancelled movement.
- "It tries to mine again and then walks away" suggests the provider repeats a
  primitive whose internal state was not reset or whose failure evidence was too
  weak.
- "There is nothing nearby" suggests observation/search radius, spawn/teleport,
  target depletion, or artifact visibility problems.

When the transcript lacks fields to confirm the observation, classify that as an
`artifact-gap` and propose the missing fields.

## Mechanism Mapping

| Visible symptom | Artifact clue | Likely mechanism | First code area |
|-----------------|---------------|------------------|-----------------|
| Pretends to chop but no log gained | `status: collected`, `inventoryDelta: 0` | Tool trusts dig/block animation more than inventory pickup | `probe/src/tools/collectLogs.ts`, `verifyTask.ts` |
| Walks far away in one direction | timeout, repeated collect call, no target position or movement delta | Pathfinder target too far/high/stale, dropped item chase, or uncancelled movement | `collectLogs.ts`, action runner signal handling |
| Keeps retrying empty space | `no_logs_found` or failed verification repeated | Provider repeats primitive after environmental depletion | `deterministicProvider.ts`, anti-repeat policy |
| Final says success after repeated block | final `success` with "blocked repeatedly" | Runtime terminal label bug | `agentLoop.ts`, transcript final aggregation |
| RCON fallback used | terminal RCON error, spawn mismatch | Setup path bug, not agent intelligence | `runProbe.ts`, server setup docs |
| Langfuse trace looks healthy but world fails | trace completed, transcript failed | Provider proposed plausible tool; runtime primitive failed | tool primitive and verifier |

## Review Steps

1. Quote or paraphrase the visible behavior in one sentence.
2. Find the closest artifact evidence:
   - tool status;
   - timeout/cancel fields;
   - target coordinates;
   - before/after position;
   - inventory delta;
   - block removed;
   - nearby block count;
   - final label.
3. Mark missing fields that would have made the behavior obvious.
4. Infer the most likely mechanism, but label uncertainty when artifacts are
   insufficient.
5. Pick the smallest implementation fix that changes the next run's behavior or
   makes the next artifact decisive.
6. Add a focused test only for the mechanism you just identified.
7. Define the next live-run observation that would falsify the fix.

## Required Output

Include a compact insight ledger:

```text
Behavior Insight
Observed: bot swings or approaches a tree, then walks away repeatedly in one direction.
Artifact: collect_logs timed out; later status collected with inventoryDelta 0; no target/movement delta before the patch.
Mechanism: collect_logs bundled target selection, pathing, digging, and item chase without drift or cancellation guards.
Patch target: collectLogs target selection, abort handling, and verifier evidence alignment.
Next run check: bot either gains logs, removes a nearby low trunk and stays nearby, or quickly reports blocked with target and distance evidence.
```

## Missing Artifact Fields To Request Or Add

For gameplay primitives, prefer adding:

- selected target block name and coordinates;
- before/after actor position;
- distance to target before/after movement;
- whether pathfinder was stopped on timeout;
- whether the block was still present after dig;
- inventory delta by relevant item family;
- dropped item target coordinates when pickup is attempted;
- reason for abandoning a primitive.

For provider-backed runs, compare these against Langfuse:

- model observation input;
- proposed tool args;
- validated tool args;
- runtime rejection or verification result;
- latency and timeout spans.

## Gotchas

- Do not overfit to one artifact if the human saw a repeated pattern. Repeated
  visible motion is often the best clue about pathing or cancellation.
- Do not blame the provider first when the primitive cannot execute a boring
  task. A plausible plan plus broken primitive still means implementation
  failure.
- Do not call a patch complete unless the next live-run check is stated in
  behavioral terms, not only as a unit test.
