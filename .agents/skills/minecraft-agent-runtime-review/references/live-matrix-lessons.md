# Live Matrix Lessons

Use this when a current-run action-skill matrix fails, a single-skill probe
passes but the full matrix fails, or a boring Minecraft action appears to work
once and then regresses under sequential probes.

## Core Rule

The full deterministic action-skill matrix is the current capability gate.
Historical transcripts and isolated single-skill passes are useful evidence, but
they do not prove that all implemented action skills still work together in the
current runtime/world state.

## Review Order

1. Read the matrix report first:

   ```bash
   jq '{verdict, summary, gaps:.evidenceGaps, results:[.results[] | {skillId,status,transcriptPath,errorMessage}]}' \
     tmp/action-skill-live-matrix-current-mine-cobblestone.json
   ```

2. For each failed skill, inspect actor-scoped tool-attempt artifacts before
   changing code:

   ```bash
   for f in $(ls -t data/actors/<actor_id>/evidence/tool-attempt-turn-*.json | head -8); do
     printf '\n---%s\n' "$f"
     jq '{created_at, result:.tool_attempt.result, before_inventory:.data.before.inventory, after_inventory:.data.after.inventory, verification:.data.verification, pre_position:.pre_position, post_position:.post_position}' "$f"
   done
   ```

3. Run the failing single-skill probe to isolate the primitive:

   ```bash
   cd probe
   bun run probe:skill -- --actor npc_b --skill <skillId> --max-actions 8 --init-actor-workspace baseline --no-dashboard
   ```

4. Run a small sequential debug matrix when the single probe passes but the full
   matrix fails:

   ```bash
   bun run probe:skills -- --skills runtimeObserveAndRemember,<skillId> --max-actions 8 --init-actor-workspace baseline --continue-on-failure --report ../tmp/action-skill-live-matrix-debug.json
   ```

5. Re-run the full matrix only after the mechanism is fixed:

   ```bash
   bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline --continue-on-failure --report ../tmp/action-skill-live-matrix-current-mine-cobblestone.json
   ```

## Failure Mechanisms From Recent Runs

| Symptom | Evidence Pattern | Likely Mechanism | Fix Direction |
|---|---|---|---|
| Single probe passes, full matrix fails | same skill has current-run single transcript pass but matrix gap | sequential world state, stale fixture, or delayed pickup | reproduce with small sequential matrix |
| `collectLogs` stalls at 3/4 | first `collect_logs` dug four blocks, inventory delta 3, later repeats have no nearby logs | one drop pickup arrived late or remained near a dug block | actor-relative low logs plus bounded sweep over recently dug positions |
| `mine_block` says `digTime is not a function` | `bot.dig` receives copied `{name, position}` block | full Mineflayer block object was not preserved | pass the block returned by `blockAt` or `findBlock` directly |
| `mine_block` removes stone but no cobble | `blockRemoved=true`, `inventoryDelta=0` | pickup movement stayed in dig-range look-at path | separate dig approach from drop pickup movement |
| `observe` fails with chest `windowOpen` timeout | runtimeObserve or unrelated skill errors before own primitive | optional observation tried to open stale/misplaced chest | make optional shared-chest inspect non-fatal; keep storage actions strict |
| storage probe times out opening chest | chest exists but stale/blocked/unreachable | previous fixtures contaminated nearby chest search | clear nearby chests before placing managed fixture |

## Implementation Principles

- Block breaking is atomic. Do not stop mid-dig to check progress; await
  `bot.dig(...)` and verify after it resolves or fails.
- Preserve Mineflayer object identity for world objects that Mineflayer methods
  consume. Unit doubles often miss this because plain objects are accepted by
  tests but not by live Mineflayer internals.
- Actor-relative fixtures are safer than absolute spawn-Y fixtures for block
  work. Bots may spawn one block high, fall, or settle after the fixture is
  placed.
- Optional observation should not become a mutating storage action. If chest
  inspection is best-effort in observe, catch it and omit the chest field; if
  the action skill is `inspectSharedChest` or `depositSharedItems`, require real
  container evidence.
- Keep success strict. A primitive can retry pickup or sweep nearby dropped
  positions, but final success still needs inventory/container/world evidence.

## Done Criteria

Do not mark the action-skill proof done until all of these are true:

- focused unit tests cover the mechanism found in artifacts;
- the failing single-skill probe passes;
- the relevant small sequential debug matrix passes when the bug was
  sequential-state dependent;
- the full implemented action-skill matrix reports
  `verdict=passed passed=<all> failed=0 error=0`;
- `bun test`, `bun run typecheck`, docs build, and `git diff --check` pass;
- docs summarize the current command/result without committing ignored runtime
  evidence artifacts.

## Gotchas

- Do not "fix" a matrix failure by increasing action count first. If the
  artifact shows repeated blocked attempts, more actions usually hide the
  primitive failure.
- Do not trust `before_inventory` in later repeated attempts as proof that a
  previous primitive succeeded unless the previous tool result and verifier also
  passed.
- Do not let docs claim 12/12 while the current report is failed or stale.
