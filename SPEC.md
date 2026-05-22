# SPEC

Updated: 2026-05-22

## 1. What This Is

This is the canonical gateway spec for the current bounded Minecraft
agent-loop runtime.

The detailed contracts are intentionally split so no single Markdown file has
to carry the whole architecture:

1. `docs/docs/Architecture/Runtime-Loop-And-Verification.md`
   - product direction;
   - Voyager distinction;
   - speed-bounded social simulation contract;
   - hot-path rules;
   - runtime verification;
   - non-goals.
2. `docs/docs/Architecture/Transcript-And-Runtime-Artifacts.md`
   - transcript and canonical artifact contract;
   - actor evidence files;
   - provider input snapshots;
   - reviewer input evidence.
3. `docs/docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
   - actor workspace source-of-truth model;
   - action skill lifecycle;
   - recipe and validator requirements;
   - non-destructive initialization.
4. `docs/docs/Architecture/Async-Reviewer-Sidecars.md`
   - per-NPC reviewer ownership;
   - reviewer inputs and outputs;
   - cross-actor summarizer limits.
5. `docs/docs/Architecture/Implementation-Workstreams.md`
   - immediate implementation slices;
   - parallel subagent ownership;
   - dependency graph;
   - validation plan;
   - deferred work.
6. `docs/docs/Architecture/Bounded-Action-Skill-Creation.md`
   - detailed future action skill proposal and recipe model.
7. `docs/docs/Architecture/LLM-Context-And-Actor-Workspace.md`
   - route to the visual HTML architecture page.
8. `docs/docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
   - enum-first actor profiles, goal stack, and relationship state model.
9. `docs/docs/Architecture/Current-Handoff-And-Next-Work.md`
   - current handoff;
   - landed implementation surfaces;
   - verified commands;
   - next improvement order.

Treat this file as the source of truth for priority and scope. Treat the split
docs as the source of truth for detailed implementation contracts.

## 2. Architecture Concepts Reflected In Code

The current implementation is important because it encodes the right boundaries,
not because it has a long feature checklist.

### Runtime-Owned Truth

`runAgentLoop` starts each turn from Mineflayer-observed state, gives the
provider a bounded context packet, validates the proposal against the actor's
active action-skill gate, executes one primitive, observes again, and verifies
progress from world, inventory, position, container, or transcript evidence.

Providers propose. Runtime verification decides. Reviewers explain. Neither
provider nor reviewer can turn optimistic text into success.

### Actor-Local Ownership

`data/actors/<actor_id>/` is the source of truth for actor-owned state:
profile, memory, evidence, provider inputs, reviews, relationship edges, and
active/candidate/retired/rejected action skill records.

Action skill evolution follows a lifecycle:

```text
proposal -> bounded recipe -> role/primitive validation -> timed trial evidence
-> promotion, supersession, retirement, or rejection
```

Legacy generated TypeScript is archive material until it is converted into this
bounded lifecycle. It is not active runtime capability.

### Replayable Evidence

The runtime persists the packet a provider saw, the turn record, tool attempt,
pre/post observations, verifier reason, fake-progress rejection, and review refs.
The goal is that a failed run can be audited from artifacts without immediately
reproducing the world.

### Bounded Social Pressure

Actor profile, goal stack, relationship edge, and relationship-derived pressure
are structured provider context. They influence intent selection only.

Relationship pressure carries explicit boundaries:

- action boundary: intent pressure only;
- active action skill still required;
- role contract unchanged;
- relationship state must come from durable evidence refs.

### Async Repair

Per-NPC reviewers read immutable actor artifacts after the turn and write
findings, candidate proposals, or relationship event proposals. Runtime-owned
guards apply relationship events and action skill lifecycle transitions.

The hot path must stay small: observe, choose, gate, execute, verify, record,
release.

Future extensions outside the current bounded delivery scope:

- production hardening of LLM-backed reviewer prompts and scoring beyond the
  current opt-in bounded reviewer adapter;
- provider input snapshots for future LLM-backed gameplay paths outside
  phase-one gameplay and live dialogue;
- actor-scoped evidence coverage for future gameplay paths outside phase-one
  `runAgentLoop` and mutual dispatchers;
- migration of the legacy skill-village path from generated TypeScript proposals
  into executable bounded recipes, if that path remains needed.

Deferred unless the user re-approves:

- full arbitrary checkpoint resume;
- deep single-bot reconnect refactor;
- generated TypeScript action skill hot-loop execution;
- long-term memory compaction workers;
- a global critic that owns actor repair decisions.

Reconnect/session lifecycle remains a runtime-owned concern when implemented.
For future slices, do only the reconnect work required to keep hot-path
evidence honest. Do not let a deep reconnect refactor displace actor workspace,
action skill lifecycle, provider snapshots, or per-NPC review.

## 3. Product Direction

The short-term product is a tiny, headless, bounded Minecraft runtime that can
make real end-to-end progress on boring gameplay tasks and leave enough evidence
to explain success, failure, stall, and fake progress.

The long-term north star is a social simulation seed:

- role pressure;
- action skill ownership;
- shared and private memory;
- bounded action skill evolution;
- per-NPC review and repair loops;
- later human-in-the-loop social play.

This is not a Voyager-style long-horizon single-agent autonomy project.
Voyager can wait a long time for planning, critic, generated code, retries, and
skill-library growth. This project needs speed-bounded actor turns because
social simulation requires NPCs to remain observable and responsive. Slow critic,
reflection, and repair loops must run asynchronously from immutable evidence and
must not block the current actor turn.

## 4. Immediate Implementation Priority

The actor-workspace and social-feedback slices are now implemented enough to be
the active runtime baseline. The next implementation should use real run
evidence to harden boring gameplay competence without expanding into a larger
society prematurely.

Priority order:

1. Validate `collect_logs` and adjacent boring tasks against live Minecraft
   evidence, not optimistic transcript labels.
2. Use the per-action-skill live harness before returning to broad multi-NPC
   runs.
3. Use actor-scoped evidence and provider input snapshots to diagnose primitive,
   verifier, target-selection, and action-skill gaps.
4. Harden reviewer prompts/scoring only from immutable run evidence.
5. Convert any still-useful legacy generated-code experiments into bounded
   candidate recipes before runtime use.
6. Keep the gameplay hot path bounded and free of blocking critic/generation
   work.
7. Keep the managed local server path easy to start, inspect, and stop.

Current harness command:

```bash
cd probe
bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 20 --init-actor-workspace baseline
```

The single-skill harness runs Docker preflight before actor workspace
initialization, dashboard startup, or Minecraft startup unless `MC_PORT` points
at an already-running manual Minecraft server that passes a Minecraft protocol
ping.
Manual `MC_PORT` probes are allowed only for action skills whose precondition
mode is `none`; fixture-backed probes require the managed server because their
RCON setup is part of the evidence contract.
Fixture-backed probes derive their setup from a pure RCON command planner, so
crafting, storage, and social preconditions can be reviewed and tested without
starting Minecraft. `none`-mode probes do not emit setup commands; they must not
mutate the probe world merely because the managed server is available.
When Docker is unavailable and no live manual server override exists, it reports
`environment_blocked` with the Docker preflight command and exits without
mutating actor workspace state.
When the dashboard is enabled, the harness sends best-effort `agent-loop-event`
runtime events to `/api/runtime-events` for turn observation, provider proposal,
tool completion, and loop completion. These events are fire-and-forget:
dashboard failure must not reject, delay, or relabel NPC action execution, and
the dashboard still falls back to artifact polling.
If the fixed dashboard port is already occupied, the CLI reuses it only when
`/api/state` proves it is this repo's dashboard. A random stale listener is
reported as a dashboard availability issue instead of being mislabeled as an
active runtime dashboard. The health check is bounded by a short timeout so a
stale listener cannot hang probe startup.

Current matrix command:

```bash
cd probe
bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline
```

Current matrix checklist command:

```bash
cd probe
bun run probe:skills -- --dry-run
```

Current existing-evidence audit command:

```bash
cd probe
bun run probe:skills -- --audit-existing-evidence
```

Optional matrix report artifact:

```bash
cd probe
bun run probe:skills -- --dry-run --report ../tmp/action-skill-checklist.json
```

Use the matrix command after single-skill probes are stable. It enumerates
implemented seed action skills from the registry, rejects planned action skills,
runs each case through the same live harness, and reports
`matrix_summary verdict=<verdict> passed=<n> failed=<n> error=<n> total=<run>/<planned>`.
It also prints `matrix_status_counts`, which mirrors
`summary.statusCounts` for quick terminal inspection.
It prints `matrix_scope_counts`, which separates fresh current-run evidence from
historical transcript evidence, missing evidence, and environment blockers.
When unproven action skills remain, it prints `matrix_fresh_commands` with the
first few single-skill probe commands needed to collect fresh live evidence.
It also prints `matrix_next_actions`, a reviewer-friendly list of P0 follow-up
actions that classifies each gap as environment restoration, fresh live proof,
or failed-probe repair. Environment restoration is de-duplicated into one
actionable command instead of repeating every blocked action-skill probe
command; fixture-backed `MC_PORT` blockers tell the reviewer to unset
`MC_PORT` before checking the managed Docker server.
It also runs a Docker preflight before actor workspace initialization or
Minecraft startup unless `MC_PORT` points at an already-running manual
Minecraft server that passes a Minecraft protocol ping. When Docker is
unavailable and no live manual server override exists, it reports
`matrix_preflight status=environment_blocked` and exits without mutating the
actor workspace or probe world.

Use `--dry-run` when the Minecraft runtime is unavailable or before a live
matrix run. It prints the implemented action skill checklist, including role,
primitive ownership, gameplay preconditions, deterministic probe fixture mode,
verification contract evidence, postcondition evidence, and planned RCON
fixture commands, without Docker, actor workspace initialization, or world
mutation. Every implemented action skill must have an explicit deterministic
probe driver and fixture/precondition mode before it can appear in the matrix; a
missing branch is a validation error, not a fallback terminal memory note.
Use `--audit-existing-evidence` when Docker is unavailable but existing
transcripts should be re-scored. It scans raw `action_skill_probe_*` evidence
artifacts, skips canonical transcript projections, re-applies each action
skill's postcondition rule, and reports which skills already have historical
live proof versus which still need fresh runtime evidence. For each action
skill, the audit reports the newest raw probe transcript instead of
cherry-picking an older pass, so a recent regression cannot be hidden behind
stale historical success.
Use `--report <path>` to persist the same checklist or live matrix result as a
JSON artifact with schema `action-skill-probe-matrix-report/v1`. The report
includes a top-level `verdict`: `passed`, `failed`, `environment_blocked`, or
`incomplete`, so later reviewers can distinguish live environment blockers from
real action skill evidence failures. Each `cases[]` row includes
`readinessItems` for the implemented registry entry, role, primitive ownership,
verification contract, postcondition spec, deterministic probe driver, and
fixture/precondition mode. The report also includes `skillStatuses`, one row per
selected action skill, so dashboards and reviewers can render the current
verification state without deriving it from mixed result and gap arrays. Each
status row carries a `freshEvidenceCommand`, the exact single-skill probe
command to run when that row still needs live Minecraft proof. Each status row also
carries `evidenceScope`: `current_run`, `historical_transcript`, `missing`, or
`environment_blocked`, so a historical audit pass is not confused with a fresh
live matrix pass. `summary.statusCounts`
aggregates the same rows into `passed`, `failed`, `error`,
`pendingLiveEvidence`, and `environmentBlocked` counts. `summary.evidenceScopeCounts`
aggregates the same rows into `currentRun`, `historicalTranscript`, `missing`,
and `environmentBlocked` counts.
`evidenceGaps` remains the focused list of non-passing or unrun action skills,
with the missing contract and postcondition evidence needed before the action
skill can be considered proven. Live and audited result rows also carry
structured `terminalStatus`, `terminalWhy`, `postconditionStatus`,
`postconditionFailure`, and `failureKind` fields when available. Reviewers and
dashboards should read those fields instead of parsing the human `reason`
string.
The report also includes `nextActions`, derived from `evidenceGaps`, so
dashboards and reviewer sidecars can show what to do next without inferring it:
restore Docker/server environment, run the listed fresh probe command, or fix a
failed probe before re-running it. When the environment is blocked,
`nextActions` points at the Docker preflight check; per-skill fresh probe
commands remain on `skillStatuses` and `evidenceGaps`. In
`--audit-existing-evidence` mode, a historical pass also creates a
`refresh_historical_evidence` next action because historical proof is not a
fresh current-run proof after code changes.
An evidence audit report must not return top-level `verdict: "passed"` from
historical transcript rows alone. Even if every selected action skill has a
historical pass, the report remains `incomplete` until the current run produces
fresh `current_run` proof for every selected action skill.

The per-action-skill postcondition is output-specific. Craft probes must prove
the expected inventory outputs, not merely any passed verifier. Ordered social
probes must prove the causal sequence, such as arrival before request, deposit
before handoff chat, and busy response before wait before follow-up. Storage
probes must prove named positive item movement or a non-empty item snapshot, not
just an opened container or an unqualified moved count, and must keep the chest
id in evidence. Wood probes should verify supported log/plank item families
rather than overfitting to one wood species, and `collectLogs` must tie the
passed verifier to `collect_logs` primitive-result evidence: positive
`inventoryDelta`, target `afterLogCount`, and at least one dug log attempt.
Inventory progress must be attached to the expected primitive rather than an
unrelated successful step.
Social probes must prove the delivered chat result itself carries target and
text evidence that matches the action skill intent; generic delivered chat,
untargeted chat, or intent text that appears only in provider args is not
sufficient evidence.
Runtime control probes must prove an observe snapshot happened before a terminal
memory note. When a live probe writes a transcript, terminal status and
postcondition evidence are classified separately so reviewers can see whether
the failure was terminal-control flow, missing Minecraft evidence, or both.

This command is intentionally narrower than `probe:v0` or `probe:live`: it runs
one actor-owned action skill through the real runtime gate and exits non-zero
when runtime evidence does not satisfy the contract.

Current harness capabilities:

- deterministic fixture setup through RCON for `collectLogs`,
  `craftPlanksAndSticks`, `craftCraftingTable`, `inspectSharedChest`,
  `depositSharedItems`, `handoffItemAtChest`, and social probes;
- actor-relative live fixtures for log and stone block work, so probes do not
  depend on stale absolute spawn-Y assumptions after a bot settles on terrain;
- table-bound crafting fixture setup for `craftWoodenPickaxe`, including a
  nearby `crafting_table` block and bounded `craft_with_table` primitive
  evidence;
- one action-skill-specific deterministic driver for each implemented seed
  action skill; the action-skill probe harness does not switch to OpenAI auth or
  an LLM provider based on `PROBE_GAMEPLAY_PROVIDER`;
- transcript postcondition checks after the run, so a terminal `remember` note
  cannot make the probe pass unless the action skill produced required state
  evidence;
- craft probes require a passed runtime verifier, not only a non-throwing
  `bot.craft(...)`;
- shared-storage probes require positive item movement into the shared chest
  and transcript-visible actor/ledger identity for the storage contribution.
- observation treats optional shared-chest inspection as non-fatal, while
  storage action skills still require explicit open/deposit evidence.

Current live action-skill matrix proof:

- command:
  `bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline --continue-on-failure --report ../tmp/action-skill-live-matrix-current-mine-cobblestone.json`;
- result:
  `matrix_summary verdict=passed passed=12 failed=0 error=0 total=12/12`;
- evidence scope:
  `matrix_scope_counts current_run=12 historical_transcript=0 missing=0 environment_blocked=0`;
- implemented action skills with fresh live proof:
  `runtimeObserveAndRemember`, `collectLogs`, `craftPlanksAndSticks`,
  `craftCraftingTable`, `craftWoodenPickaxe`, `mineCobblestone`,
  `inspectSharedChest`, `depositSharedItems`, `approachAndRequestItem`,
  `announceResourceDiscovery`, `handoffItemAtChest`, and
  `waitForBusyCrafter`.

The corresponding transcript artifacts under `data/evidence/` and the JSON
matrix report under `tmp/` are intentionally ignored runtime evidence. Preserve
the command and summary in docs, but do not commit those generated artifacts.

Current deterministic 3-NPC product smoke:

- command:
  `bun run src/cli.ts --provider deterministic --npcs 3 --max-actions 20 --observe-ms 0 --no-dashboard`;
- result:
  `final.status=success`;
- meaningful gameplay evidence:
  `npc_b` ran `collect_logs`, reached `afterLogCount=4`, then deposited
  `oak_log` into the shared chest with `movedCount=1`;
- artifact:
  `data/evidence/agent_loop_probe_v0-1779431536545.json`.

Existing-evidence audits are still historical by design. Running
`bun run probe:skills -- --audit-existing-evidence` after the live matrix
re-scores the latest saved transcripts as 10 historical passes, but it returns
top-level `verdict=incomplete` because a historical audit is not a fresh
current-run proof.

## 5. Non-Negotiable Rules

- Runtime owns reality: validation, timeout, cancellation, verification,
  transcript, artifacts, and lifecycle guards.
- Providers propose. They do not decide success.
- Progress must be backed by world, inventory, position, container, or transcript
  evidence.
- Do not confuse animation, partial motion, optimistic text, or provider claims
  with success.
- The hot path must not await critic, reflection, generated code, or slow
  summarization.
- Action skills are Minecraft/Mineflayer runtime behaviors, not Codex/Claude
  agent skills.
- Actor workspace is the only source of truth for actor-owned active,
  candidate, retired, rejected, and superseded action skill records.
- Generated TypeScript action skill bundles must not be auto-imported into the
  hot loop.
- `build/generated-skills` is a legacy exploratory output location only. It must
  not be treated as an actor-owned action skill store.
- Per-NPC reviewers write actor-scoped review notes and candidate proposals; they
  never mutate active action skills directly.
- A global reviewer may summarize cross-actor patterns only. It must not own
  actor memory, actor action skill lifecycle, or actor-specific repair proposals.

## 6. Done Criteria For The Actor-Workspace Slice

The actor-workspace slice is done when:

1. `data/actors/<actor_id>/` has the intended source-of-truth layout:
   `memory/`, `evidence/`, `reviews/`, `provider-inputs/`,
   `action-skills/active`, `action-skills/candidates`,
   `action-skills/retired`, and `action-skills/rejected`;
2. current seed ownership records are materialized into actor workspace action
   skill records without creating a competing schema;
3. active seed action skills can be read from actor workspace;
4. runtime provider proposals are blocked when their primitive is not backed by
   the actor's active action skill records;
5. candidate action skill recipes can be validated before trial;
6. generated or candidate action skill proposals are stored under the actor
   workspace lifecycle, not `build/generated-skills`;
7. reviewer jobs and outputs can be written per actor without touching active
   runtime state;
8. provider-backed runs persist the exact provider input packet per actor turn;
9. failed gameplay attempts leave actor-scoped evidence suitable for review,
   including target, pre/post position, tool attempt, verifier reason, and
   inventory/block/container delta when relevant;
10. provider failures after an actor turn observes the world are recorded as
    failed `provider_error` transcript steps and `provider_failed` events, with
    the provider input snapshot ref attached when snapshots are enabled;
11. fake progress such as "started swinging," "pathing started," or provider
   confidence cannot satisfy a verifier without runtime evidence;
12. deterministic mode still performs zero network calls;
13. docs and index routes point to the split spec documents.

## 7. Done Criteria For The Social Feedback Slice

The social feedback slice is done when:

1. reviewer `relationship_event_proposals` can be applied by an explicit
   runtime-owned command/module, never by the reviewer itself;
2. the applier rejects unknown actor workspaces, path-like actor ids, unknown
   event kinds, missing evidence refs, self-targets, and evidence refs that are
   not inside the relevant actor workspace;
3. applied relationship events update
   `data/actors/<from_actor_id>/relationships/<to_actor_id>.json`;
4. applied events are idempotent by event id and a durable application marker,
   so repeated reviewer runs do not duplicate social state after the compact
   relationship event window rolls forward;
5. actor provider context exposes relationship-derived pressure as categorical
   goal/decision context, not as arbitrary `0..1` personality floats;
6. runtime action selection may use relationship pressure to choose between
   already-allowed bounded actions, but it cannot bypass active action-skill
   gates or role contracts;
7. provider input snapshots include actor profile, goal stack, active action
   skills, relationship state, recent evidence, recent reviews, and memory;
8. live gameplay/provider smoke setup can be run without printing secrets and
   leaves a server endpoint the user can join; `MC_PORT` manual overrides are
   validated before bypassing the managed server;
9. deterministic test paths still perform zero network calls;
10. docs and the static architecture page explain the completed social feedback
    loop accurately.

## 8. Read Next

For implementation, read in this order:

1. `docs/docs/Architecture/Runtime-Loop-And-Verification.md`
2. `docs/docs/Architecture/Transcript-And-Runtime-Artifacts.md`
3. `docs/docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
4. `docs/docs/Architecture/Async-Reviewer-Sidecars.md`
5. `docs/docs/Architecture/Implementation-Workstreams.md`
6. `docs/docs/Architecture/Bounded-Action-Skill-Creation.md`
7. `docs/docs/Architecture/LLM-Context-And-Actor-Workspace.md`
8. `docs/docs/Agent-Search-Index.md`
9. `docs/docs/Terminology.md`
