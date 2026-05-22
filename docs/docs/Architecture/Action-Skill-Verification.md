---
sidebar_position: 6
---

# Action Skill Verification

Search token: `ACTION_SKILL_VERIFICATION`.

Action skills are only trustworthy when each Mineflayer boundary has observable
post-action evidence. A runtime call is not evidence by itself.

## Reference Inputs

The current verification rules were checked against local reference clones:

- Mineflayer API docs for `bot.dig`, `bot.craft`, `bot.openChest`, and window
  transfer APIs.
- Mineflayer tutorial guidance that crafting must await `bot.craft(...)` before
  dependent work continues.
- Mineflayer examples for digging, inventory crafting, and chest deposit flows.
- Local Mineflayer-agent reference code that wraps `pathfinder.goto(...)` with
  timeout/stall protection and uses `GoalNear(...)` before `bot.dig(...)`.

## Primitive Boundaries

### Digging

`collect_logs` must treat block breaking as an atomic Mineflayer action. It can
search candidate blocks before digging and inspect evidence after digging, but
it must not stop and restart the same block break to check progress mid-dig.

Required evidence:

- selected candidate log block;
- pathfinder did not move farther from that block;
- `bot.dig(block, true)` resolved or failed;
- any supported log-family inventory count increased after the dig or after
  moving toward a nearby dropped item.

Failure handling:

- if one candidate cannot be reached or dug, record that candidate attempt and
  try the next nearby low log;
- if the action is aborted, stop Mineflayer movement/dig state and propagate the
  abort instead of converting it into ordinary blocked progress;
- do not count block removal alone as success for the current seed action skill,
  because the goal is item acquisition.

### Movement

`move_to` must be bounded. `pathfinder.goto(...)` is preferred over manual
control nudges, but it must not be allowed to hang the actor turn.

Required evidence:

- before distance;
- after distance;
- distance delta;
- bounded timeout result, with `pathfinder.stop()` called when available.

### Waiting

`wait` is pacing evidence, not gameplay progress. It must still be bounded and
visible in the transcript so ordered runtime-control and social action skills
cannot pass on a bare `status: waited` marker.

Required evidence:

- positive tick count for action-skill postconditions that require waiting;
- transcript-visible bounded duration in milliseconds;
- later world, chat, memory, or inventory evidence for actual progress.

### Crafting

`craft_item` must resolve a real Mineflayer recipe before calling craft.

Required evidence:

- item name resolves to a registry item id;
- `recipesFor(...)` returns an available recipe;
- `bot.craft(recipe, count, craftingTable)` is awaited;
- crafted item inventory count is reported when available;
- when inventory counts are available, the primitive must not return
  `crafted` unless the target item count increased.

Inventory-only crafting is intentionally separate from table-bound crafting.
Table-bound recipes need their own primitive that can find/place/use a crafting
table and verify that boundary.

Per-action-skill probes add a second gate after transcript write:

- `craftPlanksAndSticks` and `craftCraftingTable` pass only when the runtime
  verifier reaches `passed`;
- a non-throwing `bot.craft(...)`, a `crafted` result, a terminal memory note,
  or an unrelated passed verifier is not enough;
- the probe postcondition must see the expected output inventory evidence:
  planks and sticks for `craftPlanksAndSticks`, and a crafting table for
  `craftCraftingTable`;
- probe fixtures may give the actor starting logs, planks, or sticks, but the
  final claim must still come from post-action inventory observation.
- every implemented action skill must declare an explicit deterministic live
  probe driver and probe fixture/precondition mode. Missing driver coverage is
  a validation failure, not permission to terminate through a generic
  `remember` note.
- matrix `cases[]` rows include `readinessItems`, so reviewers can audit
  registry status, selected role, primitive ownership, verification contract,
  postcondition spec, deterministic driver, and fixture/precondition mode before
  reading live evidence.
- matrix reports include a top-level verdict, so `environment_blocked` remains
  separate from runtime verifier failures and incomplete runs.
- matrix reports include `skillStatuses`, one row per selected action skill,
  for dashboard and reviewer consumption. Each row carries the exact
  `freshEvidenceCommand` for a one-skill live probe.
- each status row includes `evidenceScope`: `current_run`,
  `historical_transcript`, `missing`, or `environment_blocked`.
- matrix reports include `summary.statusCounts`, so coverage can be read without
  scanning every status row.
- matrix reports include `summary.evidenceScopeCounts`, so fresh current-run
  proof is counted separately from historical transcript proof.
- matrix CLI output prints `matrix_status_counts`, the same coverage summary in
  terminal-readable form.
- matrix CLI output prints `matrix_scope_counts`, the same evidence-scope
  summary in terminal-readable form.
- matrix CLI output prints `matrix_fresh_commands` for the first few unproven
  action skills, so fresh live probes can be launched without opening the JSON
  report.
- matrix CLI output prints `matrix_next_actions`, so a reviewer can see whether
  the next step is restoring the environment, running fresh live proof, or
  repairing a failed probe.
- matrix reports also include `evidenceGaps`, which repeats the required
  contract and postcondition evidence for every unproven action skill and the
  same fresh-evidence command.
- matrix reports also include `nextActions`, derived from `evidenceGaps`, for
  dashboard and reviewer-sidecar consumption.
- live and audited result rows carry structured terminal/postcondition fields
  when available: `terminalStatus`, `terminalWhy`, `postconditionStatus`,
  `postconditionFailure`, and `failureKind`. Reviewers should use these fields
  to distinguish control-flow failure, missing Minecraft evidence, and combined
  failure without parsing prose.
- `--audit-existing-evidence` can re-score saved raw action skill probe
  transcripts without starting Docker. This is historical proof, not a
  substitute for a fresh live matrix after code changes. It reports the newest
  raw probe transcript for each action skill, so a later failure is not hidden
  behind an older passing artifact.

### Shared Storage

Shared chest actions must close container windows after use and must not write
ledger evidence for zero-item transfers.

Required evidence:

- opened shared chest accessor;
- before/after chest snapshot;
- before/after inventory snapshot when available;
- chest id plus positive moved count for deposit/withdraw ledger events;
- actor id and positive ledger sequence in transcript-visible tool results, so
  the postcondition can tie storage evidence back to an actor-owned contribution
  instead of accepting an anonymous container mutation.

Per-action-skill probes currently use a tiny RCON-placed chest fixture. The
probe passes only when the transcript shows actual chest inspection or positive
item movement with ledger identity. This keeps shared-storage action skills
from passing on role permission, movement near a chest, or anonymous item
movement alone.

### Social Runtime Actions

Social action skills are still runtime action skills. They do not pass because
text was proposed by the provider.

Required evidence:

- `approachAndRequestItem`: measured arrival within interaction range,
  including before/after distance fields, and delivered chat result evidence
  requesting a specific item;
- `announceResourceDiscovery`: delivered resource-discovery chat result
  evidence and a resource memory note persisted after that announcement;
- `handoffItemAtChest`: actor/ledger-identified named positive shared-chest
  deposit and delivered handoff chat result evidence with matching handoff text;
- `waitForBusyCrafter`: busy response, bounded wait, and delivered follow-up
  chat result evidence. The wait step must carry positive tick and duration
  evidence, not just `status: waited`.

For ordered social action skills, evidence order matters. A delivered request
before arrival, a handoff message before deposit, or a follow-up before waiting
does not satisfy the postcondition even if each individual primitive appears in
the transcript. The text intent also matters: generic delivered chat is not
accepted as a resource discovery, request, handoff, or follow-up. Directed
social probes must also preserve a non-empty target argument in the transcript
and target/text fields in the primitive result, so a provider proposal cannot
be treated as delivered speech without runtime confirmation.

## Current Coverage

Implemented seed action skills are indexed in
`probe/src/gameplay/seedSkills/verificationContracts.ts`.

The contract test requires every implemented seed action skill to declare:

- owned runtime primitives;
- required evidence;
- checked-in tests that protect the behavior.

The live probe postcondition test also requires every implemented action skill
to fail on an empty transcript and to define a minimum accepted evidence
payload through `actionSkillPostconditionSpecs` in
`probe/src/runtime/actionSkillProbeRunner.ts`. This protects the gap where a
provider terminal note or no-op result could otherwise look like success, and
keeps the acceptance payloads beside the runtime postcondition rules instead of
burying them in tests.

The same postcondition rules reject weak passed verifications when the progress
payload does not contain the expected inventory output, and reject social
transcripts when required primitives appear out of order.
Inventory postconditions are tied to the expected primitive. For example,
`collectLogs` only accepts passed inventory evidence on `collect_logs`, and
crafting action skills only accept passed inventory evidence on `craft_item`.
The live probe evaluates postconditions whenever a transcript is written, even
when the terminal note is failed, so reviewers can distinguish terminal control
failure from missing Minecraft evidence.
The matrix report preserves that distinction in structured fields on `results`,
`skillStatuses`, and `evidenceGaps`.
`runtimeObserveAndRemember` also requires a real observe result, a completed
bounded wait after that observation, and only then a memory write. A naked
terminal memory note, or observe-to-remember without wait evidence, cannot prove
runtime control flow.

Planned action skills may remain in the registry without verification contracts.
They must not become active until their primitive boundaries and evidence rules
exist.
