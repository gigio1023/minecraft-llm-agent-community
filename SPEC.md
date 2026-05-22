# SPEC

Updated: 2026-05-21

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

This command is intentionally narrower than `probe:v0` or `probe:live`: it runs
one actor-owned action skill through the real runtime gate and exits non-zero
when runtime evidence does not satisfy the contract.

Current harness capabilities:

- deterministic fixture setup through RCON for `collectLogs`,
  `craftPlanksAndSticks`, `craftCraftingTable`, `inspectSharedChest`,
  `depositSharedItems`, `handoffItemAtChest`, and social probes;
- one action-skill-specific deterministic driver for each implemented seed
  action skill when `PROBE_GAMEPLAY_PROVIDER` is `deterministic`;
- transcript postcondition checks after the run, so a terminal `remember` note
  cannot make the probe pass unless the action skill produced required state
  evidence;
- craft probes require a passed runtime verifier, not only a non-throwing
  `bot.craft(...)`;
- shared-storage probes require positive item movement into the shared chest.

Current live `collectLogs` proof:

- command: `bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 20 --init-actor-workspace baseline --no-dashboard`;
- artifact: `data/evidence/action_skill_probe_collectLogs-1779385755355.json`;
- result: inventory increased from `0` to `4` logs and verifier passed
  `collect_4_logs reached 4/4 relevant inventory items`.

Current live verification blocker:

- On 2026-05-22, the craft live probe could not start because the local
  Docker/OrbStack daemon was unavailable:
  `dial unix /Users/naem1023/.orbstack/run/docker.sock: connect: no such file or directory`.
- This is external runtime availability, not action skill evidence. Re-run the
  probe matrix after Docker/OrbStack is running.

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
10. fake progress such as "started swinging," "pathing started," or provider
   confidence cannot satisfy a verifier without runtime evidence;
11. deterministic mode still performs zero network calls;
12. docs and index routes point to the split spec documents.

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
