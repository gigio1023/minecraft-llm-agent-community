# SPEC

Updated: 2026-05-20

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

Treat this file as the source of truth for priority and scope. Treat the split
docs as the source of truth for detailed implementation contracts.

## 2. Current Implementation Status

The current implementation is not complete against this spec.

Implemented or partially implemented:

- bounded Mineflayer runtime primitives;
- deterministic provider path for the stable probe;
- transcript and canonical transcript artifacts;
- runtime verification for key task progress;
- actor sessions and seed action skill ownership metadata;
- non-destructive actor workspace initialization under `data/actors`;
- actor workspace path/store API with `reviews/`, `provider-inputs/`,
  active/candidate/retired/rejected action skill paths, and active seed
  materialization;
- bounded action skill recipe schema, validator, proposal records, and lifecycle
  transition guard;
- default shutdown of legacy generated TypeScript hot-loop execution, with
  generated proposals stored as actor workspace candidates unless explicitly
  opted into as legacy debug behavior;
- actor-scoped runtime evidence writer for verification failures and fake
  progress rejection in the deterministic loop;
- provider input snapshot store with credential-key rejection and live dialogue
  snapshot wiring;
- per-actor reviewer output schema and actor-scoped review writer;
- phase-one runtime action-skill gate: `runProbe` reads actor workspace active
  action skill records, passes them into `runAgentLoop`, records the active
  skill context in provider input, and blocks provider proposals whose
  primitives are not backed by the actor's active records;
- initial terminology and seed action skill registry;
- a visual architecture review page for LLM context, memory, actor workspace,
  and action skill lifecycle.

Not yet complete:

- wiring the same active action-skill gate through every legacy or mutual
  gameplay runner outside the current phase-one `runAgentLoop` path;
- full migration/archive tooling for older `build/generated-skills` files;
- live recipe trial, promotion, supersession, and retirement execution modules;
- per-NPC asynchronous reviewer sidecar queue and runner;
- provider input snapshots for every future LLM-backed gameplay path, beyond the
  currently wired live dialogue path;
- complete actor-scoped evidence coverage for every primitive category, beyond
  current verification-failure and fake-progress coverage;
- live gameplay LLM path using the same bounded evidence contract as the
  deterministic path.

Deferred unless the user re-approves:

- full arbitrary checkpoint resume;
- deep single-bot reconnect refactor;
- generated TypeScript action skill hot-loop execution;
- long-term memory compaction workers;
- a global critic that owns actor repair decisions.

Reconnect/session lifecycle remains a runtime-owned concern when implemented.
For the next slice, do only the reconnect work required to keep hot-path
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

The next implementation should optimize for a coherent runtime architecture, not
for completing every old item in the previous monolithic spec.

Priority order:

1. Make actor workspace the source of truth for actor-owned artifacts.
2. Add action skill recipe schema and validation.
3. Materialize active seed action skills in actor workspace through an explicit
   adapter from current seed ownership records.
4. End the action skill split brain: candidate/generated action skills must go
   through actor workspace, not `build/generated-skills`.
5. Write actor-scoped evidence and provider input snapshots during runs.
6. Add per-NPC async reviewer sidecar output paths and schemas.
7. Keep the gameplay hot path bounded and free of blocking critic/generation
   work.
8. Add cross-actor summarization only after per-actor reviews exist.

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

## 6. Done Criteria For The Next Slice

The next slice is done when:

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
7. reviewer output can be written per actor without touching active runtime
   state;
8. provider-backed runs persist the exact provider input packet per actor turn;
9. failed gameplay attempts leave actor-scoped evidence suitable for review,
   including target, pre/post position, tool attempt, verifier reason, and
   inventory/block/container delta when relevant;
10. fake progress such as "started swinging," "pathing started," or provider
   confidence cannot satisfy a verifier without runtime evidence;
11. deterministic mode still performs zero network calls;
12. docs and index routes point to the split spec documents.

## 7. Read Next

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
