# SPEC

Updated: 2026-05-20

## 1. What This Document Is

This document is the detailed rebuild spec for the next implementation starting
from `main`.

It is not a branch-local brainstorm log.
It is not a vague product vision.
It is the working contract for what we are building now, why we are building it,
what we are not building yet, and how parallel implementation should be split.

The branch-local evolution work provided useful signals, but it is no longer the
implementation base. The codebase should grow again from the smaller `main`
shape.

## 2. Product Direction

### 2.1 Short-Term Product

The short-term product is:

- a tiny, headless, bounded Minecraft agent-loop runtime;
- capable of real end-to-end progress on boring gameplay tasks;
- observable enough that both a human and an AI coding tool can explain why a
  run succeeded, stalled, or failed.

The immediate target is not drama, not roleplay depth, and not a big social
simulation demo.

The immediate target is competent, inspectable embodied behavior.

### 2.2 Long-Term North Star

The long-term product direction remains:

- a social simulation seed in Minecraft;
- bots with distinct role pressure and eventually distinct persona flavor;
- bots that can survive in the world, set bounded goals, cooperate, form
  social memory, and interact with a human player as more than scripted props;
- bots that can eventually improve their own bounded action skill library
  instead of repeating broken behavior forever.

This means the runtime must be built so it can later support:

- actor workspaces for per-NPC artifacts, memory, evidence, and action skill
  libraries;
- per-agent action skill ownership;
- bounded action skill revision and retirement;
- shared and private memory;
- multi-bot coordination;
- human-in-the-loop social play.

### 2.3 Important Product Distinction

The following are not the same thing:

- social simulation seed;
- persona richness;
- long-run autonomy.

For this phase:

- social simulation seed remains the north star;
- persona richness is not a delivery target;
- long-run autonomy is not a delivery target.

In other words, we are intentionally building the substrate, not pretending the
substrate is already the final society.

## 3. Reset Decision

We are explicitly resetting implementation direction to `main`.

### 3.1 Why Reset

The previous branch direction mixed too many concerns into the same runtime path:

- loop execution;
- persistence;
- reconnect;
- compaction;
- safety policy;
- provider behavior;
- transcript writing.

That shape made the code harder to reason about and made it too easy for tests
to pass while live behavior remained weak or ambiguous.

### 3.2 What We Keep From The Discarded Work

Keep these ideas only:

- initialize pathfinder movements at spawn time;
- keep stall detection as a runtime-owned guard;
- keep per-tool timeout budgets as a concept;
- keep the diagnosis that close-range log collection can stall;
- keep the idea that transcript and runtime artifacts must explain failures.

### 3.3 What We Do Not Carry Forward

Do not reuse these implementations:

- monolithic `agentLoop.ts` growth;
- hidden LLM-backed memory compaction in the hot loop;
- reconnect logic embedded directly inside the loop executor;
- checkpoint logic that changes run budget semantics;
- any feature whose live value depends on opaque background behavior.

## 4. Success Criteria

### 4.1 What Counts As Real Value

The project becomes valuable when bots are not just emitting plans or animated
attempts, but are visibly making progress in Minecraft and leaving enough
evidence that we can improve them iteratively.

Concretely, the first meaningful value looks like:

- a bot successfully performing a boring gameplay task such as collecting logs;
- a bot being able to continue toward follow-up progression rather than getting
  trapped in empty repetition;
- a stalled or failed run leaving enough evidence that the next implementation
  step is obvious.

### 4.2 What Counts As Failure

The project is failing if bots repeatedly act without meaningful progress.

Examples of unacceptable failure:

- swinging at a tree for one second, stopping, moving, and repeating forever;
- timing out and silently leaving the runtime in a corrupted or misleading state;
- reporting success when inventory, position, or world state did not support it;
- leaving runs that are hard to diagnose from artifacts.

### 4.3 Phase 1 Success

Phase 1 is successful when all of the following are true:

1. a single bot can complete one or two boring gameplay tasks end-to-end in a
   live run;
2. fake success is hard to produce because progress is backed by observation and
   verification;
3. transcript and runtime artifacts are strong enough to explain common failures;
4. single-bot reconnect works in a real path and does not leave stale tool state;
5. the architecture has a visible place for per-agent action skill ownership and
   simple future action skill evolution.

## 5. Scope

### 5.1 In Scope For This Rebuild

Phase 1 includes:

- normalized observation;
- validated tool proposal execution;
- deterministic verification;
- strong transcript visibility;
- explicit action timeout and cancellation boundaries;
- checkpoint-ready runtime artifacts;
- single-bot live reconnect;
- a minimal action-skill memory hook;
- one or two hard boring tasks that must actually complete.

The first boring tasks should begin with:

- `collect_logs`
- its immediate progression follow-up, such as crafting materials or reaching a
  simple workstation milestone.

### 5.2 Out Of Scope For Phase 1

The following are explicitly out of scope unless re-approved:

- multi-bot coordination as a primary runtime feature;
- large-scale social bulletin behavior;
- hostile combat loop;
- background compaction worker;
- generated TypeScript action skill bundles in active use;
- offline long-term memory extraction;
- full resume of arbitrary in-flight tool execution;
- persona richness as a content deliverable;
- long-run autonomy as a product deliverable.

### 5.3 Must Remain Possible Later

The rebuild must preserve future room for:

- per-agent action skill ownership;
- simple action skill creation, supersession, retirement, and improvement notes;
- multi-bot cooperation;
- human-in-the-loop social interaction;
- stronger relationship memory;
- bounded generated action skill bundles later, if introduced under strict
  runtime rules.

## 6. Design Rules

### 6.1 Keep The Loop Small

The core loop should only do this:

1. observe
2. select task
3. ask provider for proposal
4. validate proposal
5. execute through bounded action runner
6. verify result against observed state
7. record transcript and artifacts
8. update small runtime state

If a concern does not belong to one of those steps, it should live outside the
loop.

### 6.2 Runtime Owns Reality

The runtime owns:

- tool schema validation;
- timeout and cancellation;
- state verification;
- transcript structure;
- artifact production;
- progress persistence;
- reconnect/session lifecycle;
- stall detection.

The provider owns only:

- next tool proposal;
- optional short explanation later if we choose to support it.

### 6.3 Deterministic First

Any new behavior must first work with the deterministic provider and with tiny
tests before any live-model or external dependency is added.

### 6.4 No Hidden Hot-Loop Dependencies

The hot loop must not trigger:

- hidden network summarizers;
- silent background LLM requests;
- invisible asynchronous side systems that tests do not know about.

### 6.5 Observability Is Mandatory

Every important action should leave transcript-visible evidence of:

- what the bot intended;
- what it attempted;
- what changed in position, inventory, or relevant world state;
- why the runtime treated the result as progress, failure, timeout, or stall.

This repo improves by inspection.
If behavior is hard to inspect, it will be hard to improve.

### 6.6 No Fake Progress

The runtime must not confuse animation or partial behavior with success.

Examples:

- `collect_logs` is not successful because the bot started swinging;
- `move_to` is not successful because pathing started;
- reconnect is not successful because a socket reappeared while tool closures
  still point at old state.

Progress must be backed by evidence.

### 6.7 Tests Stay Small, Live Evidence Stays Primary

Tests should be Detroit-style and minimal.

Tests exist to catch regressions such as:

- loop not running;
- verifier accepting impossible success;
- hidden dependency entering deterministic mode;
- stale session state after reconnect boundaries.

Primary product evidence still comes from live runtime artifacts.

## 7. Failure Analysis Artifacts

Failure analysis should not depend on immediate reruns or guesswork.

Primary artifacts:

- transcript files;
- checkpoint-ready runtime artifacts;
- Langfuse traces when provider-backed paths are in use;
- optionally screenshots or viewer evidence, but those are secondary.

At a minimum, artifacts should answer:

- what task the bot believed it was working on;
- what tool call happened;
- what the runtime expected to observe after the tool call;
- what was actually observed;
- why verification failed or why the runtime marked a stall.

## 8. Architecture Targets

### 8.1 Module Boundaries

The codebase should move toward this ownership map.

```text
probe/src/
  runtime/
    loop/
      runAgentLoop.ts
      taskSelector.ts
      stallGuard.ts
    actions/
      actionRunner.ts
      actionTimeouts.ts
      actionCancellation.ts
    session/
      botSession.ts
      botSessionFactory.ts
      reconnectPolicy.ts
    state/
      loopState.ts
      progressStore.ts
  transcript/
    transcriptRecorder.ts
    transcriptTypes.ts
    transcriptPersistence.ts
  observation/
    observeWorld.ts
    inventorySnapshot.ts
    actorSnapshot.ts
    worldDiff.ts
  gameplay/
    curriculum/
    primitives/
    verification/
  skills/
    seed/
    registry/
    ownership/
  provider/
    deterministicProvider.ts
    traced providers later
```

This is an ownership target, not a demand to create every file immediately.

### 8.2 Core Runtime Components

The rebuild should converge on the following components.

#### Loop core

- small loop state;
- no reconnect implementation inside the loop;
- no persistence implementation inside the loop;
- no provider-specific tracing logic inside the loop.

#### Action runner

- explicit per-tool timeout budget;
- timer cleanup;
- cancellation contract;
- consistent result envelope.

#### Observation contract

- stable snapshot shape;
- enough fields to prove progress or failure;
- not overloaded with unrelated derived summaries.

#### Verification layer

- task-specific progress checks;
- no optimistic success if no relevant state changed;
- readable reasons in transcript and artifacts.

#### Session boundary

- current live bot reference;
- reconnect lifecycle;
- dependency rebinding after reconnect;
- no stale closure capture.

#### Transcript and artifacts

- append-oriented records;
- checkpoint-ready snapshots;
- clear link between tool attempt and observed result.

#### Action skill memory hook

- actor-owned seed action skills;
- minimal metadata for future action skill lifecycle;
- architecture support now, autonomous evolution later.

## 9. Minimal Action Skill Memory Model

Action skill evolution is not a Phase 1 behavior goal, but it is a Phase 1
architecture goal.

### 9.1 Why It Exists Now

Bots should not be trapped forever in a world where all capability is global,
static, and anonymous.

Eventually we want each bot to:

- inherit shared seed action skills;
- own some local action skill variants;
- adopt better action skill variants;
- retire or supersede weak ones.

We do not need a big autonomy loop for that yet.

We do need a place in the architecture where that future can live.

### 9.2 Minimum Fields

Each actor should be able to reference action skill records with fields such as:

- `skill_id`
- `owner_actor_id`
- `source_kind` (`seed`, `derived`, `manual`)
- `status` (`active`, `superseded`, `retired`)
- `superseded_by` optional
- `created_at`
- `updated_at`
- `notes` optional

Phase 1 does not need autonomous generation.
It only needs a durable place for these records.

### 9.3 What Phase 1 Must Provide

- actor-to-seed-action-skill association;
- actor-owned action skill metadata store;
- visible place to mark action skill additions, supersession, and retirement
  later.

### 9.4 Future Action Skill Creation Contract

Future action skill creation should follow
`docs/docs/Architecture/Bounded-Action-Skill-Creation.md`.

The expected shape is:

- runtime evidence produces an action skill proposal;
- the proposal compiles to a bounded recipe over implemented primitives;
- validation rejects missing primitives, weak verifiers, role-incompatible
  actions, and fake success;
- a live trial records transcript-visible evidence;
- promotion, supersession, retirement, or rejection is explicit.

Generated gameplay code is not a Phase 1 hot-loop behavior. If generated bundles
are introduced later, they must be treated like reviewed implementation patches,
not automatically imported runtime output.

## 10. Workstreams

Parallel implementation should follow these workstreams.

### Workstream A. Runtime Skeleton

Goal:

- extract a smaller loop surface from current `main` behavior without changing
  external behavior more than necessary.

Files likely touched:

- `probe/src/runtime/agentLoop.ts`
- new `probe/src/runtime/loop/*`

Outputs:

- core loop entrypoint;
- narrow loop state type;
- no reconnect or persistence logic inside the loop.

Depends on:

- none.

Can run in parallel with:

- Workstream C
- early Workstream D design

### Workstream B. Action Runner And Cancellation

Goal:

- replace soft timeout wrapping with a real bounded action runner design.

Files likely touched:

- `probe/src/mutual/tools/wrapper.ts`
- new `probe/src/runtime/actions/*`
- `probe/src/runProbe.ts`

Outputs:

- per-tool timeout policy;
- timer cleanup;
- explicit cancellation contract for actions that support abort;
- consistent result envelope for timeout, cancellation, and tool failure.

Depends on:

- Workstream A interface decisions.

Can run in parallel with:

- Workstream C after interface alignment.

### Workstream C. Observation And Verification Hardening

Goal:

- ensure task progress is grounded in observed state, not optimistic tool status.

Files likely touched:

- `probe/src/tools/observe.ts`
- `probe/src/gameplay/verification/verifyTask.ts`
- `probe/src/tools/collectLogs.ts`
- `probe/src/tools/moveTo.ts`

Outputs:

- explicit observation contract;
- collect-logs verification by inventory increase, block change, or equivalent
  concrete world evidence;
- safer stand-off distance for log collection;
- move and collect tools aligned with verification expectations;
- transcript fields that make stuck behavior obvious.

Depends on:

- none for initial work;
- should reconcile with Workstream A before merge if transcript shape changes.

Can run in parallel with:

- Workstream A
- Workstream D

### Workstream D. Transcript And Checkpoint-Ready Persistence

Goal:

- add explicit artifacts and persistence without changing core loop semantics.

Files likely touched:

- `probe/src/runtime/transcript.ts`
- new `probe/src/transcript/*`
- new `probe/src/runtime/state/*`

Outputs:

- append-oriented transcript recorder;
- checkpoint-ready progress snapshot store;
- no hot-loop memory compaction worker;
- per-run budget semantics preserved;
- artifact shape that explains post-failure state.

Depends on:

- Workstream A transcript shape.

Can run in parallel with:

- Workstream C

### Workstream E. Bot Session And Live Reconnect

Goal:

- move bot lifecycle ownership outside the loop and prove single-bot reconnect
  in a real path.

Files likely touched:

- `probe/src/runtime/createBots.ts`
- `probe/src/runProbe.ts`
- new `probe/src/runtime/session/*`

Outputs:

- bot session abstraction;
- spawn-time movement initialization;
- single-bot live reconnect path;
- dependency rebinding that the reconnect path actually uses;
- no stale captured bot references inside tool closures.

Depends on:

- Workstream A loop interface;
- Workstream B action runner contract.

Can run in parallel with:

- late Workstream D refinement.

### Workstream F. Minimal Action Skill Memory Hook

Goal:

- add the smallest architecture hook for per-agent action skill ownership and
  later action skill evolution.

Files likely touched:

- new `probe/src/skills/*`
- new `probe/src/runtime/state/*` or `probe/src/memory/*`
- `probe/src/runProbe.ts`

Outputs:

- seed action skill registry per actor;
- actor-owned action skill metadata store;
- place to record new, superseded, or retired action skills later;
- no autonomous action-skill-generation workflow yet.

Depends on:

- Workstream A loop interface;
- should align with Workstream D persistence shape.

Can run in parallel with:

- early scaffolding alongside D if interfaces stay narrow.

## 11. Dependency Graph

Use this graph when parallelizing subagent work.

```text
Workstream A -> Workstream B
Workstream A -> Workstream D
Workstream A -> Workstream E
Workstream A -> Workstream F

Workstream C -> initially independent
Workstream C -> reconciles with A before merge

Workstream B -> Workstream E
Workstream D -> Workstream F
```

Recommended execution order:

1. A and C in parallel, with C treated as the first value slice
2. B
3. D
4. E
5. F

## 12. Merge Strategy For Parallel Agents

Rules:

- only one workstream may rewrite a shared entrypoint file at a time;
- shared interfaces should be agreed before parallel edits proceed;
- new modules are preferred over large rewrites of crowded files;
- if two workstreams need `runProbe.ts`, one should land scaffolding first and
  the other should target the new abstraction.

Recommended ownership:

- `agentLoop` and loop state: Workstream A
- action runner and timeouts: Workstream B
- observation, collect logs, verification: Workstream C
- transcript and checkpoint artifacts: Workstream D
- bot lifecycle and reconnect: Workstream E
- action skill memory hook: Workstream F

## 13. Validation Plan

### 13.1 Runtime Skeleton

Checks:

- `bun test` still passes;
- loop behavior remains deterministic;
- loop transcript becomes easier to read in live runs;
- no reconnect or persistence side effects leak into loop logic.

### 13.2 Action Runner

Checks:

- timeout results are deterministic;
- timers are cleaned up;
- timed-out actions do not later appear as hidden success in the same loop;
- transcript makes timeout and cancellation visible.

### 13.3 Observation And Verification

Checks:

- `collect_logs` is only successful if evidence exists;
- `move_to` is only successful if distance or arrival evidence exists;
- tests fail when tools claim success without relevant state change;
- transcript distinguishes `started`, `progressing`, `stalled`, `completed`.

### 13.4 Persistence And Artifacts

Checks:

- transcript is append-oriented;
- progress snapshots are checkpoint-ready but do not pretend to resume in-flight
  arbitrary actions;
- run budget semantics remain per-run;
- deterministic mode performs zero network calls;
- checkpoint and trace artifacts explain common failures.

### 13.5 Session Boundary And Reconnect

Checks:

- spawn initializes pathfinder movements;
- tools use the current session bot, not stale closures;
- single-bot reconnect succeeds in a live path;
- reconnect leaves transcript evidence.

### 13.6 Minimal Action Skill Memory Hook

Checks:

- each actor can be associated with seed action skills;
- actor-owned action skill metadata has a visible storage point;
- lifecycle fields exist for future addition, supersession, and retirement;
- no large autonomous action skill evolution loop is required yet.

## 14. First Concrete Slice

The first implementation slice after this reset is intentionally biased toward
observability and fake-progress removal.

Phase 1, Slice 1:

1. harden `observe`, `collectLogs`, `moveTo`, and `verifyTask` so fake progress
   stops being accepted;
2. make live transcript the primary debugging artifact for stuck behavior;
3. extract loop scaffolding from `agentLoop.ts` only as needed to support that work;
4. define an `ActionRunner` contract;
5. add tiny tests that prove deterministic mode has no hidden network dependency;
6. define artifact output so failures can be explained from transcript,
   checkpoint-like runtime state, and traces.

Only after Slice 1 is clean should the implementation move deeper into:

- checkpoint-ready persistence;
- single-bot live reconnect;
- minimal action skill memory hook.

## 15. Non-Goals

Do not do these during the rebuild unless explicitly re-approved:

- re-add local LLM provider integration;
- add hot-loop compaction summaries;
- add combat pulse threads;
- prioritize multi-bot coordination before single-bot competence is trustworthy;
- add more plan documents than code modules;
- confuse partial motion with gameplay competence;
- chase persona richness before competence and observability exist;
- chase long-run autonomy before short-run boring tasks are reliable.

## 16. Done Criteria For This Reset

This reset is successful when:

1. the branch is back on a `main`-shaped implementation baseline;
2. `SPEC.md` describes concrete rebuild work rather than aspiration only;
3. parallel subagents can be assigned without ambiguous ownership;
4. the next implementation steps can begin from this document without re-litigating
   the reset;
5. the rebuild still points toward social simulation instead of trapping the repo
   in a forever-probe;
6. failures can be understood from artifacts such as checkpoints, transcript, and
   Langfuse traces;
7. the architecture already has a visible place for future per-agent action skill
   ownership and minimal action skill evolution.
