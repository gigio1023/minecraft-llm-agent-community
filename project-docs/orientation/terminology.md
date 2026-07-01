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
   **CycleJudgment**, **Active Episode**, **Actor Turn**, **Action Card**,
   **runtime action**, and **Evidence Trace** only for schema-backed runtime
   records. Use **ActionIntent** only for archived or migration artifacts.
6. If existing code, schemas, paths, or historical artifacts contain older
   vocabulary, treat that wording as a archived identifier. Do not copy it into
   new prose unless you also name the canonical term.
7. Do not use **verified**, **evidence-backed**, or **evidence-first** as if
   they were the research contribution. Runtime checking and audit artifacts are
   experiment hygiene unless the project is explicitly studying verifier models.

## Action-Consequence And Advisory Predictor Names

The active central plan has not selected one research headline yet. New active
direction docs should prefer concrete names over the historical **WAM** banner:

- **action-consequence model** for F-native style action -> consequence learning;
- **advisory consequence predictor** for F-loop style prediction outside
  runtime authority;
- **social-material transition model** when discussing physical/material/social
  deltas as the object of analysis;
- `transition-row/v1` when discussing the current no-regret core data unit.

**Advisory social-material WAM** is historical shorthand and a possible F-loop
branch reference. It should not be used as the current project headline. If it
appears in older docs, read it through
`project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`.

An advisory consequence predictor predicts deltas before an action and is scored
after the action against runtime-observed deltas. It does not select the executed
action, fill missing arguments, declare progress, close obligations, mutate actor
state, or override runtime checks.

Do not use **structured-state WAM** as the headline. Structured state is the
representation choice, not the research contribution.

## Transition Row

A **transition row** is the current no-regret core data unit. It is an
independent before/action/after record for one executed Minecraft action:

```text
state_before
executed_action
observed_delta
other_actor_response_window when present
evidence_refs
actor/model/provider/seed/run metadata
cost/latency/token/action-count metadata
```

Use `transition-row/v1` for current docs and runtime artifacts.

A transition row may later support social-material consequence modeling when an
embodied Minecraft action changes physical state, possession, access, claims,
public affordances, obligations, relationship state, memory commitments, or
future action opportunities. Do not use the actor's self-declared
`expected_outcome` as the target label.

`social-material-transition/v1` is an older WAM-era dataset name. Keep it in
archive references, but translate new work to `transition-row/v1`.

Archived WAM-era fields were shaped as:

```text
state_before
candidate_action
predicted_delta
observed_delta
evidence_refs
actor/model/provider/partner/seed
cost/latency/token/action-count metadata
```

## Verification Hygiene

**Verification hygiene** is the ordinary runtime practice of checking executed
Minecraft actions against world, inventory, container, position, chat,
transcript, or structured tool-result observations.

Verification hygiene is required for credible experiments. It is not a novel
contribution by itself, not a substitute for a research question, and not a
reason to call a benchmark valuable. Use it as the audit surface that supports
prediction scoring and run review.

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

Anything still emitted under `build/generated-skills` is archived exploratory
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

## Action Card

An **Action Card** is the Actor Turn provider-visible projection of one existing
runtime affordance. It describes what the actor can attempt and which structured
parameters are required, without asking the provider to choose between primitive
and action skill categories as the primary decision.

In the target architecture, Action Cards are emitted as `action-card/v1` records
inside `actor-turn-input/v1`. The runtime maps an Action Card to a runtime
primitive, seed action skill, actor-owned action skill, or promoted generated
action skill.

An Action Card is not a strategy checklist, not proof that preconditions are
true, and not a bypass around runtime action validation.

## Minecraft Basic Guide

The **Minecraft Basic Guide** is the provider-visible compact mechanics guide
sent as `minecraft_basic_guide`.

It describes stable Minecraft mechanics that an LLM should not need to
rediscover from observation, such as early item flows, station requirements,
item-vs-world-block distinctions, useful tool prerequisites, blocker recovery,
and repeated-observe limits.

It is a guide, not a runtime action contract, verifier, runtime permission
packet, strategy checklist, or proof of progress. Runtime evidence still owns
current world state, and the action surface still owns executable affordances.

## Tool Call

A **tool call** is a provider's structured request to use one visible function
tool. In Actor Turn, this means either an Action Card tool with strict
`parameters` or `author_mineflayer_action` with detailed authoring rationale.

The provider proposes tool calls. The runtime maps valid Action Card selections
to runtime actions, or starts full-context codegen for
`author_mineflayer_action`. The runtime still validates schemas, permissions,
retry constraints, timeouts, verifier output, and evidence before treating any
result as progress.

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

A **provider** is the model-facing component that proposes an Actor Turn tool
selection, CycleGoal, CycleJudgment, branch-time Deliberation update, generated
action candidate, or short utterance.

The provider does not own reality, verification, timeouts, runtime permissions,
or action skill promotion.

Preferred terms:

- **Actor Turn provider** for the target hot-path component that chooses exactly
  one visible Action Card function tool or `author_mineflayer_action` from an
  `actor-turn-input/v1` packet;
- **Deliberation provider** for the target branch-only component that reframes
  or updates Active Episode state and proposes guarded PlanBead operations;
- **cycle goal provider** for the branch or initialization component that
  proposes CycleGoal records when Active Episode state needs reframing;
- **Action Card tool selection** for the ordinary Actor Turn component that
  chooses one visible function tool or `author_mineflayer_action`;
- **cycle judgment provider** for the component that summarizes evidence into a
  CycleJudgment.

Archived identifiers such as `goal_mind`, `GoalMind`, and
`socialGoalMindProvider` may appear in existing file names or historical
artifacts. New prose should say **cycle goal provider** and mention the archived
identifier only when needed for file lookup.

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
- archived mutual-dialogue files and tests that already use `persona`;
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

`StrategicGoal` is retained as a archived-adjacent compatibility term. New
architecture work should not add new persistent StrategicGoal stores when the
state being modeled is durable multi-cycle work; use PlanBeads and PlanBead
dependencies instead.

## PlanBead

A **PlanBead** is one actor-owned checkpointed issue-like work item under
LifeGoal, such as securing food, preparing shelter materials, repairing a
repeated blocker, investigating a runtime failure, or fulfilling an obligation.

PlanBeads are work graph state, not ordinary memory. A PlanBead records what
work or concern exists, why it matters under LifeGoal, what evidence would close
or block it, what is currently known, what should happen next, and which
evidence, judgments, dependencies, or related records changed it.

A PlanBead is not executable authority, not physical proof, and not a hidden
domain planner. It must not grant runtime primitive permissions, supply missing
runtime action parameters, or mark progress without runtime evidence. If a
PlanBead claims closure, satisfaction, or blockage, that transition must cite
evidence refs or guarded non-physical resolution evidence.

## PlanBeadGraph

A **PlanBeadGraph** is the actor-owned dependency graph of PlanBeads. The graph,
not a single PlanBead, is the actor's durable multi-cycle work plan.

Ready PlanBeads are open PlanBeads with no open blocking dependencies. The ready
front is context for CycleGoal selection, not a script the actor must follow.

`StrategicGoal` is the archived-adjacent medium-horizon term. New architecture
work should treat PlanBeads plus PlanBeadGraph as the checkpointed successor for
living multi-cycle work state, while keeping compatibility with existing
StrategicGoal records as projections or migration inputs rather than a second
active middle layer.

## Active Episode

An **Active Episode** is the actor's current bounded working window under
ActorSoul and LifeGoal. It contains the current focus, selected or related
PlanBead refs, success signals, pivot triggers, mistake budget, social pressure,
and evidence refs needed to continue or branch.

In artifacts the target schema is `active-episode/v1`.

An Active Episode is not a second PlanBeadGraph and not executable authority. It
does not choose a Mineflayer action, supply missing parameters, or prove
physical progress. It gives the Actor Turn provider a coherent current focus.

## Actor Turn

An **Actor Turn** is one provider-proposed runtime step inside an Active Episode.
It receives compact actor context, current observation refs, recent Evidence
Trace entries, PlanBead hints, runtime retry constraints, Action Cards, and the
Minecraft Basic Guide.

In artifacts the target schemas are `actor-turn-input/v1` and
`actor-turn-output/v1`.

An Actor Turn should usually produce exactly one function tool choice: one
visible Action Card with schema-bound `parameters`, or
`author_mineflayer_action`. Runtime gates still validate parameters,
permissions, retry constraints, generated source, timeout, and verifier
contracts before Mineflayer execution.

## Evidence Trace

An **Evidence Trace** is the append-oriented, runtime-owned record of what
happened across Actor Turns. It cites action refs, runtime gate refs, execution
refs, verifier refs, helper events, post-observation refs, provider usage refs,
and compact outcomes.

In artifacts the target schema is `evidence-trace/v1`.

Evidence Trace entries are not provider narration. They should preserve enough
runtime evidence for the next Actor Turn and for later audits without feeding an
unbounded raw transcript back to the provider.

## Runtime Action Resolver

The **Runtime Action Resolver** maps direct Action Card function-tool selection,
or the older `use_existing_action` compatibility shape, to the current runtime
execution authority. It may resolve the card to a runtime primitive, seed action
skill, actor-owned action skill, or promoted generated action skill, then
validate structured parameters before execution.

For `author_mineflayer_action`, the resolver maps the proposal into the
action-selection-gated generated action skill trial path. Generated code remains
schema-bound, helper-limited, trial-checked, and actor-workspace owned.

## Runtime Classifier

The **Runtime Classifier** is the runtime-owned decision layer that turns
Evidence Trace entries into continue, close, defer, blocked, branch, provider
budget blocker, or environment blocker outcomes for the Active Episode.

The Runtime Classifier does not create executable actions. It should not treat
provider prose, memory notes, `wait`, or observe-only evidence as physical
success.

## Deliberation

**Deliberation** is the branch-only provider stage that reframes or updates the
Active Episode and may propose guarded PlanBead operations when an important
branch condition occurs.

Deliberation replaces per-turn `goal_mind` as the target architecture. It should
not run every Actor Turn, choose Action Cards, generate Mineflayer source, or
close PlanBeads without guarded operation evidence.

## CycleGoal

A **CycleGoal** is the bounded current-cycle objective. It must be specific
enough for action selection and verification.

## Archived ActionIntent Artifacts

`ActionIntent` is not an active runtime concept. Current social-cycle code uses
**Action Card**, **Actor Turn tool selection**, and **runtime action**.

If a human is reading old artifacts named `ActionIntent`, treat their structured
parameters as historical evidence only. Do not copy the identifier, `args`
shape, or planner summary boundary into new provider inputs, schemas, tests, or
docs.

## Runtime Retry Constraint

A **runtime retry constraint** is a runtime-owned gate created after repeated
matching blocker evidence for the same runtime action target and structured
args.
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

Shared storage is not the default definition of society or economy. In active
social-economy docs, classify it more precisely as a claimed cache, weak
commons, public affordance, or implementation-specific container.

## Material Economy Terms

**Personal possession** is material controlled by one actor's body: carried
inventory, equipped tools, armor, food, and picked-up items. It is the strongest
default ownership signal in vanilla Minecraft.

**Material claim** is an evidence-backed assertion that an actor, role, or group
controls access to an item stack, container, station, crop, worksite, route, or
cache. Claims may be respected, disputed, transferred, borrowed against, or
violated.

**Public affordance** is a placed or modified world feature that changes what
other actors can do, such as a crafting table, furnace, path, bridge, light,
hazard marker, farm row, worksite, or shelter opening.

**Weak commons** is deliberately available or low-cost shared material. It is a
lightweight social category, not the center of the society lifecycle. Use it
for surplus or public-use material only when evidence makes availability clear.

**Unclaimed world resource** is natural terrain, blocks, animals, crops, or loot
that has not yet become a personal possession or material claim.

**Obligation-backed exchange** is a social exchange where request, offer,
promise, refusal, handoff, loan, debt, repair, or credit persists beyond one
physical action and can affect later decisions.

Avoid bare **shared resource** in new active guidance. Prefer the more specific
terms above unless describing a legacy artifact or a deliberately weak commons.

## Settlement State

**Settlement state** is a compatibility term for structured world/social
diagnostic context such as material claims, public affordances, weak commons,
known world positions, current blocker history, pending obligations, and
evidence-linked status from prior runtime work.

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
- Active Episode and Actor Turn as the target hot path;
- actor-owned action skill state;
- runtime-owned verification;
- live transcript and runtime artifacts first.
