---
sidebar_position: 3
---

# Terminology

Search token: `TERMINOLOGY`.

Status: normative vocabulary for docs, code comments, prompts, reports, and
agent guides.

Use these terms consistently across this repo. Prefer concrete engineering,
Mineflayer, Minecraft, and schema-backed project terms over vague AI wording.

## Core Rules

1. Do not introduce a new project term when an existing term here fits.
2. Do not use bare **skill** in active guidance when the meaning could be
   confused. Use **agent skill** or **action skill**.
3. Use **actor** for the runtime identity and **bot** only for the Mineflayer
   client object.
4. Use **provider** for model-facing code. Do not call it the actor's brain,
   mind, consciousness, or intelligence.
5. Use **ActorSoul**, **LifeGoal**, **WorldEvent**, **CycleGoal**,
   **ActionIntent**, and **CycleJudgment** only for schema-backed social-cycle
   records.
6. If existing code, schemas, paths, or historical artifacts contain older
   vocabulary, treat that wording as a legacy identifier. Do not copy it into
   new prose unless you also name the canonical term.

## Platform-Sensitive Work

**Platform-sensitive work** is any command or code path whose behavior can differ
between Apple Silicon macOS and Linux ARM.

Check the current platform before platform-sensitive commands. Useful checks:

```bash
uname -s
uname -m
node -p "process.platform + '/' + process.arch"
docker info
```

Platform-sensitive areas include:

- Docker, Docker Compose, Podman, Colima, OrbStack, daemon sockets, and
  `DOCKER_HOST`;
- native package installs, binary downloads, CPU-specific dependencies, and
  postinstall scripts;
- file watchers, shell startup files, executable permissions, and absolute path
  assumptions;
- browser/device auth flows and ignored provider auth stores;
- Minecraft server startup, Java runtime availability, exposed ports, and RCON;
- commands that assume `darwin`, `linux`, `arm64`, `aarch64`, `x64`, or `amd64`.

When a platform issue blocks a run, call it an **environment blocker** and record
the exact command and platform. Do not report it as runtime behavior failure.

## Agent Skill

An **agent skill** is a Codex/Claude-style capability under `.agents/skills/`.
It is documented by a `SKILL.md` file.

Agent skills help coding agents work on this repository. They are not Minecraft
runtime behavior and must not be described as actor gameplay abilities.

Example:

- `.agents/skills/minecraft-agent-runtime-review/SKILL.md`

## Action Skill

An **action skill** is a Minecraft/Mineflayer-based bundled behavior that the
game runtime can validate, execute, verify, and record.

Action skills include bounded gameplay behaviors such as gathering, crafting
steps, storage interaction, movement routines, block placement, construction
helpers, and conversation-like actions when those actions run through the game
runtime.

Action skills must be:

- composed from runtime primitives or reviewed helper surfaces;
- validated before execution;
- bounded by runtime timeout/cancellation rules;
- verified from world, inventory, container, position, chat, or transcript
  evidence;
- recorded in transcript and runtime artifacts.

### Seed Action Skill

A **seed action skill** is a hand-authored action skill definition in the runtime
registry. It can be `implemented` or `planned`.

Only `implemented` seed action skills should be offered to providers as active
runtime candidates.

### Candidate Action Skill

A **candidate action skill** is a proposed action skill that has not been
promoted. It should be represented as a bounded recipe or reviewed trial record,
not trusted as active runtime behavior.

### Direct-Generated Action Skill Trial

A **direct-generated action skill trial** is an opt-in generated TypeScript
program for a bounded objective. It is a supporting propagation path, not product
goal authority and not proof by itself.

It can become useful only through helper-call evidence, verifier output, actor
workspace ownership, and reviewer cleanup.

### Generated Action Skill Bundle

A **generated action skill bundle** is a generated code artifact. In this repo,
generated bundles must be treated as trial or candidate material unless they are
explicitly promoted through runtime-owned gates.

Anything still emitted under `build/generated-skills` is legacy exploratory
output, not active actor-owned action skill memory.

## Runtime Primitive

A **runtime primitive** is a small, trusted game operation such as `observe`,
`collect_logs`, `craft_item`, `move_to`, `consume_item`,
`run_mineflayer_program`, `say`, `wait`, `place_block`, or `build_pattern`.

Runtime primitives are lower-level than action skills. Action skills compose
runtime primitives.

## Action Surface

An **action surface** is the provider-visible packet of direct and deferred
runtime affordances for the current actor. In code and artifacts the schema is
`action-surface/v1` and the field name is `action_surface`.

Direct entries are executable now. Deferred entries explain missing role
permission, missing actor-owned action skill support, missing primitive support,
or another blocker.

An action surface is not a strategy checklist. It must not imply that one domain
goal, such as building a house or shelter, should always be considered.

## Tool Call

A **tool call** is a provider's structured request to run one runtime primitive
or action skill with validated arguments.

The provider proposes tool calls. The runtime validates and executes them.

## Action Runner

The **action runner** is the runtime boundary that applies timeout,
cancellation, result normalization, and transcript-visible execution records for
runtime primitives and action skills.

## Actor, Bot, And NPC

Use these terms with this distinction:

- **actor**: the runtime identity that owns role, ActorSoul, LifeGoal, memory,
  action skill records, evidence, relationships, and transcript records;
- **bot**: the Mineflayer client object connected to Minecraft;
- **NPC**: the user-facing game character concept represented by an actor and a
  bot.

Prefer **actor** in architecture docs, runtime records, code comments, and tests
when discussing ownership or decisions. Use **bot** when discussing Mineflayer
connection state, entity position, inventory API, pathfinder, or socket
lifecycle. Use **NPC** for user-facing game presentation or broad product
language.

## Actor Workspace

An **actor workspace** is the per-actor filesystem home for runtime-owned actor
state.

It is where one actor's memory artifacts, runtime evidence, action skill
library, candidate action skills, retired action skills, provider snapshots,
reviews, goals, and relationship artifacts are organized.

Initializing an actor workspace means restoring the expected initial structure
and baseline index files. It does not mean deleting actor artifacts. Existing
candidate action skills, evidence, retired action skills, and memory files must
survive initialization unless a separate explicit cleanup operation is requested.

## Provider

A **provider** is the model-facing component that proposes a CycleGoal,
ActionIntent, CycleJudgment, tool call, or short utterance.

The provider does not own reality, verification, timeouts, runtime permissions,
or action skill promotion.

Preferred terms:

- **cycle goal provider** for the component that proposes StrategicGoal and
  CycleGoal records;
- **action planner provider** for the component that proposes ActionIntent
  records;
- **cycle judgment provider** for the component that summarizes evidence into a
  CycleJudgment.

Legacy identifiers such as `goal_mind`, `GoalMind`, and
`socialGoalMindProvider` may appear in existing schemas, file names, and
compatibility code. New prose should say **cycle goal provider** and mention the
legacy identifier only when needed for migration or file lookup.

## Transcript

A **transcript** is the append-oriented behavior record for a run. It should show
what the actor intended, what the runtime attempted, what changed, and why the
runtime marked progress, failure, timeout, or stall.

## Runtime Artifact

A **runtime artifact** is a structured file written by a run, such as canonical
evidence JSON, checkpoint-ready state, debug timeline, provider snapshot, report,
or final status summary.

## Evidence

**Evidence** means observed game/runtime facts, not optimistic text. Valid
evidence includes inventory deltas, block deltas, position distance, container
state, chat records, transcript records, runtime artifacts, Langfuse traces, and
human-visible behavior notes.

## World-State Diagnostics

**World-state diagnostics** are bounded Mineflayer observations that describe
the actor's surrounding world with explicit scan limits.

They should make claims such as "no matching target was observed" auditable by
recording the scan center, radius, vertical range, dimension, loaded-world
limits, raw observed Minecraft names, nearest examples, query refs, and
evidence refs.

Do not call thin nearest-block summaries or provider guesses world-state
diagnostics.

Do not shape provider-facing diagnostics as fixed material-family,
station-family, construction-readiness, or survival-priority categories. Those
categories are action-skill-local query concerns when needed, not the runtime's
general world vocabulary.

## Human-Visible Behavior Note

A **human-visible behavior note** is what the user or reviewer saw in game, such
as "pretends to chop", "walks away in one direction", or "keeps retrying empty
space". Treat it as first-class evidence, especially when artifacts are thin.

## Langfuse Trace

A **Langfuse trace** is provider-observability evidence. It can explain model
inputs/outputs and timing, but it does not prove Minecraft progress unless it
matches world, inventory, position, container, chat, transcript, or artifact
evidence.

## Actor Profile

An **actor profile** is structured public/static actor metadata such as display
name, role, responsibility, risk posture, and speech style.

Do not use **persona** as the primary active architecture term. Persona is
allowed only for:

- external paper names or claims;
- legacy mutual-dialogue files and tests that already use `persona`;
- explicit warnings such as "persona text alone is not social simulation".

## ActorSoul

**ActorSoul** is the schema-backed identity seed compiled from `soul.md` or an
actor profile. It is not decorative flavor text.

ActorSoul should influence what the actor notices, how obligations are weighed,
which memories are salient, and how LifeGoal/CycleGoal records are framed.

## LifeGoal

A **LifeGoal** is a durable actor-owned direction derived under ActorSoul. It is
not replaced directly by a user request or WorldEvent.

## WorldEvent

A **WorldEvent** is an event/context record given to an actor. It may come from
scenario input, relationship state, role context, or observed runtime state. It
can influence CycleGoal selection, but it is not the actor's LifeGoal.

## StrategicGoal

A **StrategicGoal** is a medium-horizon interpretation of ActorSoul, LifeGoal,
memory, world state, and social context.

## PlanBead

A **PlanBead** is checkpointed actor-owned state for a large, living,
multi-cycle plan such as securing food, preparing shelter materials, repairing a
repeated blocker, or fulfilling an obligation.

PlanBeads are planning memory. They preserve what the actor is carrying forward,
why it matters under LifeGoal, what is currently understood, what remains open,
and which evidence or judgments changed the plan.

A PlanBead is not executable authority, not physical proof, and not a hidden
domain planner. It must not grant runtime primitive permissions, supply missing
ActionIntent args, or mark progress without runtime evidence. If a PlanBead
claims that a subtask is satisfied or blocked, that transition must cite
evidence refs.

`StrategicGoal` is the legacy-adjacent medium-horizon term. New architecture
work should treat PlanBead as the checkpointed successor for living multi-cycle
plan state, while keeping compatibility with existing StrategicGoal records.

## CycleGoal

A **CycleGoal** is the bounded current-cycle objective. It must be specific
enough for action selection and verification.

## ActionIntent

An **ActionIntent** is one proposed action for the current CycleGoal. It can
target a runtime primitive or an owned action skill, subject to runtime gates.

Physical ActionIntent args are an executable contract. A rationale field such
as `why_this_action` can explain the intent, but it cannot supply missing
coordinates, item names, counts, container ids, anchors, or block selectors.

## Runtime Retry Constraint

A **runtime retry constraint** is a runtime-owned gate created after repeated
matching blocker evidence for the same ActionIntent target and structured args.
In artifacts the schema is `runtime-retry-constraint/v1` and the provider-facing
field is `runtime_retry_constraints`.

It is not a strategy, memory note, or domain plan. It says only that the exact
target plus structured args has already hit the same blocker enough times that
the runtime will block another identical attempt before Mineflayer execution.

The correct provider response is to pivot to another valid affordance, repair
the structured args, observe updated state, or record a truthful blocker. Do not
use runtime retry constraints to make one activity such as building, mining,
storage, or travel into a mandatory CycleGoal phase.

## CycleJudgment

A **CycleJudgment** is the evidence-backed interpretation of what happened in a
cycle. It should cite runtime evidence and describe what matters for the next
cycle.

`partial_verified_progress` is a CycleJudgment outcome for current-run world,
inventory, movement, container, or block mutation that did not satisfy the final
verifier or action-skill postcondition. It is not completion.

## Role

A **role** is a runtime permission and context contract, such as `gatherer`,
`crafter`, `settler`, or `quartermaster`.

Roles are not persona flavor. They gate which primitives and action skills an
actor can use.

## Relationship

A **relationship** is structured actor-to-actor state derived from evidence,
review, and guarded runtime updates. Do not model relationship state as vague
personality floats when an enum or typed relationship event is available.

## Shared Storage

**Shared storage** is the runtime-visible resource store, currently represented
by chest access and ledger artifacts. Shared storage is social state because it
changes what other actors can observe and use.

## Settlement State

**Settlement state** is a compatibility term for structured world/social
diagnostic context such as shared storage contents, known world positions,
current blocker history, pending obligations, and evidence-linked status from
prior runtime work.

Settlement state is not a provider-facing strategy taxonomy and not a hidden
single-domain checklist. If a field mentions a concrete Minecraft activity, it
must be interpreted as retained evidence or context, not as a mandatory CycleGoal
phase.

## Context Compaction

**Context compaction** is the runtime process of turning long transcript history
into a compact, evidence-linked provider context packet.

It should preserve ActorSoul/LifeGoal continuity, current inventory, container
snapshots, known positions, recent blockers, recent CycleJudgments, world-state
diagnostics, action-surface contracts, and artifact refs. It must not turn
provider prose, `wait`, memory notes, or repeated observations into claimed
physical progress.

## Agent Guide

An **agent guide** is repo guidance for coding agents, such as `AGENTS.md`,
`GEMINI.md`, or an agent skill reference. Agent guides must point back to this
terminology when discussing action skills, agent skills, actor state, or
platform-sensitive work.

## Agent Loop

The **agent loop** or **runtime loop** is the engineering loop that observes
state, requests a provider proposal, validates it, executes through runtime
gates, verifies evidence, and writes artifacts.

Use **runtime loop** in new architecture prose unless you are referring to an
existing file, schema, CLI, or historical phrase that says `agent-loop`.

## Environment Blocker

An **environment blocker** is a setup/runtime host problem that prevents a test
or run from reaching the behavior under evaluation.

Examples:

- Docker daemon unavailable;
- Colima/OrbStack/Podman socket mismatch;
- Linux ARM package missing;
- macOS-only command on Linux;
- provider auth store missing;
- Minecraft server port unavailable.

Do not classify environment blockers as actor failure or action skill failure.

## Avoid These Expressions

These expressions are vague, AI-slop-prone, or misleading in this repo. Use the
replacement terms instead.

| Avoid | Use Instead |
|-------|-------------|
| AI brain, LLM brain, agent mind | provider, cycle goal provider, action planner provider |
| Goal Mind in new prose | cycle goal provider |
| magic, magical, just works | runtime contract, helper, preflight, verifier |
| vibes, feels right, believable vibes | evidence, artifact, transcript, role context |
| smart NPC, intelligent NPC | actor, provider-backed actor, Mineflayer bot |
| autonomous as a broad claim | bounded runtime execution, current-run objective, social-cycle run |
| learned skill | promoted action skill, candidate action skill, direct-generated action skill trial |
| skill when ambiguous | agent skill or action skill |
| persona as active architecture | ActorSoul, actor profile, LifeGoal |
| hallucinated progress | unsupported provider claim or success without evidence |
| stuck | stalled, blocked, timed out, repeated no-progress attempt |
| gotcha/gatch | edge case, failure mode, invariant, guardrail |
| NPC did X when discussing runtime state | actor proposed X, bot executed X, runtime verified X |

Historical quotes and external paper names may keep original wording, but active
repo guidance should translate them into the canonical terms above.

## Current Runtime Direction

The active path is:

- headless Mineflayer runtime;
- Soul/LifeGoal-grounded actor continuity;
- bounded runtime loop;
- actor-owned action skill state;
- runtime-owned verification;
- live transcript and runtime artifacts first.
