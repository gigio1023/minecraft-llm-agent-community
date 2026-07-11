# Central Plan V4: Capability-Gated Minecraft Social Sandbox

Status: **ACTIVE central research and implementation direction**.

Search token: `ACTIVE_CENTRAL_PLAN`. Also:
`CAPABILITY_GATED_SOCIAL_SANDBOX`, `INDIVIDUAL_CAPABILITY_GATE`,
`AUTONOMOUS_GOAL_CONTINUITY_GATE`, `INTERDEPENDENT_SOCIAL_SANDBOX`,
`PHENOMENON_FIRST`, `DISCOVERY_TO_EXPERIMENT`.

Recorded: 2026-07-11 (`Asia/Seoul`).

Authority: subordinate to `SPEC.md` and `AGENTS.md`. This plan supersedes
`central-plan-lived-vs-told-social-history.md` (V3) and
`lived-vs-told-implementation-plan.md`. The user explicitly retired V3 during a
deep direction interview on 2026-07-11 because prediction and legibility were
too narrow to remain the project's center even if the experiment succeeded.
The V3 documents remain in place as audit trail. Do not build from them.

## 0. One-Sentence Direction

First establish, with verifier-backed scenario benchmarks, that each actor can
perform non-social Minecraft work and maintain long-running goals; then run
capable actors in an interdependent Minecraft sandbox, record their autonomous
social activity with structured evidence and video, discover recurring
phenomena, and design narrow controlled experiments only after a phenomenon is
worth explaining.

## 1. What This Project Is Now

This is a personal, exploratory research program and a public technical
portfolio. Its motivating question is deliberately broader than one
preregistered hypothesis:

```text
When individually capable, persistent LLM actors pursue their own goals in a
shared Minecraft world where economic, cooperative, and quest activity makes
their roles materially interdependent, what social behavior appears over long
runs, and which recurring phenomena deserve controlled study?
```

The first objective is not to prove that a particular behavior must emerge.
The first objective is to make the observation scientifically and technically
worth having:

- individual Minecraft incompetence must not masquerade as social behavior;
- short-context goal loss must not dominate long-run results;
- interaction opportunities must have material stakes instead of being chat
  prompts pasted onto solo play;
- runtime artifacts must distinguish what actors said, intended, attempted,
  achieved, remembered, and changed;
- videos must make long-run behavior inspectable without becoming the source of
  Minecraft truth;
- interesting observations must be preserved before they are compressed into a
  post-hoc story.

This plan is `phenomenon-first`, not claim-free. It delays selection of the
scientific headline until the runtime has produced a phenomenon that survives
competence controls, repeated observation, and alternative explanations.

## 2. Why V3 Was Superseded

V3 asked whether an actor responds differently to enacted versus narrated
social history and whether an observer can predict the resulting material
follow-through. That is a legitimate narrow experiment and addresses a real
gap in social consequence prediction. It is no longer the project center for
four reasons:

1. Even a clean positive result would establish a small prediction or memory
   effect, not the larger behavior of capable autonomous actors living together.
2. Observer prediction was becoming the organizing object, while the user cares
   first about the actors and social simulation itself.
3. A preregistered matched-pair experiment constrained the project before it had
   observed which long-run social phenomena were actually interesting.
4. The project is not commissioned product research. The user accepts iterative
   exploration and retains authority to change scenarios without a fixed global
   kill clock.

V3 is not a deferred active branch. Its plan, implementation order, and
L1-L8 stop-results are historical. A later controlled experiment may reuse a
mechanism such as matched state, label locking, or raw-event observation only
if a newly observed phenomenon makes that mechanism relevant. Reuse does not
restore V3 authority.

## 3. Program Structure

The active program has five stages. Stages are epistemic boundaries, not a
waterfall that forbids iteration.

```text
Stage 1: non-social Minecraft competence
    -> Stage 2: autonomous goal continuity
    -> Stage 3: interdependent social sandbox
    -> Stage 4: phenomenon discovery and cataloging
    -> Stage 5: controlled follow-up experiments
```

Stage 1 and Stage 2 prevent weak individual behavior from contaminating social
interpretation. Stage 3 creates repeated material reasons for actors to affect
one another. Stage 4 turns long runs into inspectable candidate phenomena.
Stage 5 is where baselines, falsifiers, preregistration, and novelty claims
become binding for a selected scientific question.

The stages may feed backward. A social run can expose a missing individual
capability, weak memory operation, bad verifier, or insufficient scenario
pressure. The conservative response is to repair or extend the relevant gate,
version the scenario, and run again. Do not silently reinterpret a failed
capability as a social finding.

## 4. Stage 1 — Individual Capability Gate

Search token: `INDIVIDUAL_CAPABILITY_GATE`.

### 4.1 Purpose

Show what a single actor can do in Minecraft when social interaction is removed
from the task. This is a competence control and a model/runtime comparison
surface. It is not the final research contribution.

### 4.2 Dataset-Free Benchmark Form

The initial suite does not require an SWE-bench-style corpus or human-authored
gold trajectories. A case is defined by:

```text
world/scenario setup
+ natural-language top-level objective
+ initial-state record
+ target-state predicate
+ progress milestones
+ cycle/action/time/provider budgets
+ verifier and required evidence kinds
```

The actor is not given hidden action parameters, a recipe plan, or the correct
action sequence. The harness defines what counts as progress; the actor decides
how to act.

### 4.3 Task Families

Start small, then include goals with long dependency chains:

- obtain a declared item from a natural world;
- gather, craft, place, mine, navigate, inspect, and use a container;
- recover after a missing resource, failed path, missing station, or invalid
  first attempt;
- decide that a goal is currently infeasible and stop truthfully;
- complete a multi-hop objective whose prerequisites are not enumerated;
- pursue a long-horizon goal such as obtaining a diamond, where the final
  predicate is simple but wood, tools, mining, survival, exploration, and
  recovery are implicit subproblems.

Command-fixtured cases are allowed for controlled capability isolation, but
must be labeled as fixtures. Command-given items never count as natural-world
acquisition or social-material progress.

### 4.4 Metrics

Report at least:

- `goal_pass_rate` and target-state status;
- milestone coverage and partial progress;
- cycles, runtime actions, wall time, provider requests, tokens, and cost to
  first progress and to completion;
- stall rate and repeated no-progress attempts;
- blocker recognition and recovery;
- unsupported success-claim rate;
- stability across seeds or repeated runs;
- action-skill, provider-selection, runtime-execution, and verifier failures as
  separate failure classes.

The benchmark must not reward fluent rationale, tool-name selection, or
provider self-report. Runtime-observed world, inventory, block, position,
container, entity, or transcript evidence decides task truth.

### 4.5 Gate Interpretation

There is no single permanent score that defines a capable actor for every
future social scenario. Each social scenario declares the individual
capabilities on which it depends and cites current benchmark evidence for those
capabilities. The suite grows when real runs expose a missing prerequisite.

## 5. Stage 2 — Autonomous Goal Continuity Gate

Search token: `AUTONOMOUS_GOAL_CONTINUITY_GATE`.

### 5.1 Purpose

Separate short task execution from the ability to organize and continue work
over a long horizon. The benchmark studies whether the actor can generate,
retain, revise, defer, resume, and close intermediate goals under changing
Minecraft evidence.

### 5.2 Goal Authority

For benchmarkability, a case may provide a meaningful top-level objective such
as obtaining a diamond, establishing a working resource site, or completing a
multi-part expedition. The actor owns the intermediate goals and their
revisions. This tests autonomous decomposition without pretending that a
human-provided top-level objective was self-invented.

In the later social sandbox, actors receive broader ActorSoul/LifeGoal context
and may create social goals themselves. Relationship formation, exchange,
cooperation, refusal, repair, rivalry, and role negotiation must not be emitted
by a central planner as mandatory steps.

### 5.3 Benchmark Cases

Cases should create reasons to change a plan without making the correct update
obvious:

- a long dependency chain with delayed milestones;
- a new environmental concern arriving while work is open;
- a failed prerequisite that requires a smaller replacement goal;
- interruption followed by resume after context compaction or process restart;
- two useful goals competing for time or material;
- evidence that should close, block, supersede, or reopen a PlanBead;
- memory that is relevant later but should not be treated as proof of progress.

### 5.4 Metrics And Evidence

Keep separate:

- top-level objective progress;
- intermediate goal creation and closure;
- goal survival across turns, compaction, and restart;
- revision after new evidence;
- stale-goal repetition;
- unsupported closure;
- useful resume after interruption;
- relationship or social goal creation only when the run actually provides a
  social opportunity.

PlanBeads, memory, and CycleJudgment can prove continuity state. They cannot
prove physical completion. Every goal closure that claims Minecraft progress
must cite runtime evidence.

## 6. Stage 3 — Interdependent Social Sandbox

Search token: `INTERDEPENDENT_SOCIAL_SANDBOX`.

### 6.1 Design Principle

Do not wait for society to emerge in an interaction-poor empty server. Create
materially interdependent opportunities while leaving the social response open.

The scenario may define:

- asymmetric access to resources, tools, stations, locations, or information;
- production or exchange chains in which actors benefit from specialization;
- shared infrastructure that requires contribution or maintenance;
- cooperative construction, exploration, defense, transport, or recovery;
- quests with several activities that cannot all be completed efficiently by
  one actor;
- scarcity, timing, hazards, or competing demands that make negotiation useful;
- public affordances, weak commons, personal possession, and material claims.

The scenario must not define the social conclusion. It may create a reason to
trade; it must not require that actors trust, reciprocate, specialize, forgive,
exclude, or cooperate. Those are observations.

### 6.2 Roles And Initial Conditions

Role design is deliberately adjustable. Initial defaults are:

- begin with a small session that is easy to attribute and debug;
- use comparable base-model capability in the first controlled runs;
- give actors minimal but distinct ActorSoul/LifeGoal motivations;
- avoid prewritten relationships unless a scenario explicitly studies them;
- make role or resource asymmetry visible in scenario artifacts;
- treat assigned roles, negotiated roles, and emergent specialization as
  different conditions rather than synonyms.

These are defaults, not permanent product constraints. Actor count, model
heterogeneity, role assignment, and environmental pressure may change after
the environment and evidence path work. Scaling is allowed when it is itself a
useful experimental axis; it must not hide missing individual competence or
unattributable behavior.

### 6.3 Social Freedom

Within runtime safety and authority gates, actors may create any social goal
supported by their context. The runtime must not hard-code a social policy or a
Minecraft domain strategy. It exposes observations, action surfaces, memory,
work state, communication, and evidence so actors can decide.

Examples of allowed autonomous developments include:

- choosing partners or avoiding them;
- proposing, accepting, refusing, or renegotiating exchange;
- forming and changing divisions of labor;
- asking for help, offering help, or attaching conditions;
- making, keeping, breaking, repairing, or ignoring commitments;
- creating and contesting access norms around objects and places;
- prioritizing personal, shared, or conflicting work.

The list is vocabulary for review, not a scripted checklist.

## 7. Stage 4 — Observation And Phenomenon Discovery

Search token: `PHENOMENON_FIRST`.

### 7.1 What Counts As Observation

Long runs should produce three linked views:

1. structured runtime and actor-workspace artifacts;
2. quantitative summaries of goals, actions, resources, interaction, and
   continuity;
3. synchronized video or screenshots for human review.

Pixels support review but do not establish item identity, possession, access,
goal completion, or social consequence. Every material claim must connect to
same-run structured evidence.

### 7.2 Candidate Measures

The measurement surface should be broad enough to discover patterns without
declaring each metric a research contribution:

- goal creation, revision, completion, abandonment, and resume rates;
- action distribution and verified progress per actor;
- resource acquisition, transfer, storage, consumption, and loss;
- requests, offers, acceptances, refusals, handoffs, and repair attempts;
- contribution to and use of shared infrastructure;
- repeated partner choice, avoidance, co-presence, and spatial organization;
- role concentration, specialization, switching, and dependency;
- commitment lifecycles and later behavior tied to earlier events;
- memory or PlanBead refs that actually influence later action;
- physical competence, social consequence, continuity, robustness, efficiency,
  and provider cost as separate report sections.

Metrics describe runs. They do not by themselves prove trust, culture,
institutions, economy, friendship, or society.

### 7.3 Phenomenon Records

An observation becomes a candidate phenomenon when a reviewer can state:

```text
what repeatedly happened
+ where and under which scenario version
+ which actors and material stakes were involved
+ which structured evidence and video segments show it
+ which competence failure or scripted rule could alternatively explain it
+ what change or control would distinguish those explanations
```

Preserve negative, degenerate, and boring runs. The user retains authority to
iterate scenarios and decide what is worth pursuing; this plan does not impose
a global preregistered stop rule. Scenario changes must still be versioned so a
later reviewer can tell discovery from retelling.

## 8. Stage 5 — Discovery To Controlled Experiment

Search token: `DISCOVERY_TO_EXPERIMENT`.

A candidate phenomenon becomes a research direction only after its next study
can name:

- the uncertainty being reduced;
- the observable target;
- a manipulation, comparison, or natural contrast;
- a baseline that could erase the result;
- competence and execution controls;
- a plausible alternative explanation;
- evidence that would weaken the claim;
- close prior work and the remaining gap.

This is where matched pairs, held-out conditions, prediction arms,
preregistration, or a V3-era mechanism may reappear. They are selected because
the phenomenon calls for them, not because the repository already contains
their code or documents.

## 9. Research Value Contract

Use the correct value label at each stage:

| Stage | Honest value before results | What it is not |
| --- | --- | --- |
| Individual capability | measurement + engineering hygiene | social research result |
| Goal continuity | measurement + systems value | proof of autonomy in general |
| Social sandbox | systems + dataset/observation value | proof of society or emergence |
| Candidate phenomenon | possible scientific/evidence value | headline before controls |
| Controlled study | scientific or negative-result value if sound | guaranteed publication |

The active program verdict is `substrate-first`. This does not mean "build a
large platform and hope." It means build only the smallest competence,
continuity, interdependence, and observability surfaces required to obtain a
credible phenomenon record.

## 10. Runtime Authority And Evidence Rules

The direction change does not relax runtime truth:

- provider prose, memory, PlanBeads, scenario text, video, and tool names are
  context or review evidence, never Minecraft success authority;
- physical actions require structured executable parameters;
- Mineflayer execution and verifier output decide physical success;
- `(state_before, executed_action, observed_delta)` remains independent of the
  actor's expected outcome;
- progress, intent, execution, social consequence, continuity, robustness,
  efficiency, and cost remain separate;
- generated action skills still originate only from Actor Turn
  `author_mineflayer_action` and require bounded trial and promotion;
- public/private artifact boundaries remain explicit;
- live provider runs still require provider quota preflight;
- screenshots and video are review surfaces paired with runtime evidence.

`transition-row/v1`, response-window, label-locking, seed/reset, and
public-history machinery remain useful general substrate. Lived-vs-told fields,
delivery rungs, matched-history requirements, observer arms, and L1-L8 are not
active requirements.

## 11. What Carries Forward From V3

| V3 component | V4 status |
| --- | --- |
| runtime execution and verifier evidence | retain |
| actor workspace, memory, PlanBeads, relationships | retain and exercise in Stage 2/3 |
| multi-actor scheduling, observation, chat, response windows | retain and generalize |
| seed/reset provenance and scenario versioning | retain |
| transition rows and public-history export | retain as observation substrate |
| intent vs execution separation | retain |
| provider quota and usage records | retain |
| matched lived-vs-told histories | freeze as historical experiment design |
| history delivery ladder | freeze |
| observer prediction as headline | retire |
| same-model rule as universal rule | demote to a controlled-comparison default |
| L1-L8 stop-results | freeze with V3 |

No retained implementation earns authority through sunk cost. Each component
stays only because the new program needs the capability or evidence it provides.

## 12. Build Order

### Phase A — Direction And Benchmark Contract

- align active docs to this plan;
- promote the useful parts of `project-level-benchmark-plan.md` into a small
  checked-in individual capability manifest;
- define target predicates, milestones, budgets, evidence, and normalized
  result shape;
- keep external benchmark projects as task/mechanism references, not runtime
  dependencies.

### Phase B — Individual Capability Runs

- deterministic calibration of action skills and verifiers;
- provider-backed runs over basic and multi-hop goals;
- normalized reports that separate model choice, action selection, runtime
  execution, verifier truth, efficiency, and cost;
- scenario-owned declarations of which capabilities later social runs require.

### Phase C — Goal Continuity Runs

- benchmark interruption, delayed progress, competing concerns, and replanning;
- verify PlanBead and memory survival across turns and restart;
- reject unsupported goal closure;
- record whether long-horizon execution is limited by model reasoning, context,
  action surface, memory, or Minecraft mechanics.

### Phase D — Minimal Interdependent Sandbox

- start with a small attributable session;
- add at least one economic/resource dependency, one cooperative activity, and
  one multi-activity quest family;
- keep role strength and scenario pressure configurable;
- record synchronized structured artifacts and video;
- review whether actors actually had repeated reasons to affect one another.

### Phase E — Long Runs And Phenomenon Catalog

- run versioned scenarios long enough for goals, resources, and relationships
  to carry across episodes;
- compute descriptive metrics without turning them into labels of society;
- create phenomenon records with evidence and alternative explanations;
- let the user choose which patterns deserve deeper work.

### Phase F — Narrow Follow-Up Study

- run fresh prior-work proximity analysis;
- form a falsifiable claim and baseline;
- design the smallest experiment that distinguishes the phenomenon from
  competence, prompt, role, fixture, or evaluator artifacts;
- publish positive or negative results with the underlying runs.

## 13. Success Criteria

### Near Term

- a small dataset-free capability benchmark runs from one declared manifest;
- reports show target state, milestones, efficiency, cost, and failure class;
- at least one multi-hop objective demonstrates real long-horizon pressure;
- goal-continuity cases preserve and revise work without fake completion.

### Medium Term

- capable actors share a versioned interdependent scenario;
- economic, cooperative, or quest dependencies produce repeated material
  interaction opportunities;
- long runs produce synchronized evidence, metrics, and reviewable video;
- social behavior is not dominated by missing basic action capability.

### Long Term

- the catalog contains at least one recurring phenomenon that the user finds
  genuinely worth explaining;
- a follow-up study separates the phenomenon from a credible baseline or
  alternative explanation;
- the repository communicates both the visible behavior and the evidence chain
  clearly to the user, AI research community, and general developers.

These are planning criteria, not a promise that a specific social pattern or
paper will appear.

## 14. Non-Goals

- restoring V3 prediction/legibility as the active headline;
- optimizing a race-to-diamond score as the project objective;
- treating a successful action-skill matrix as social research;
- scripting a village, economy, friendship, conflict, or institution and then
  presenting the script as emergence;
- requiring a large benchmark dataset before simple state predicates work;
- treating 30-second demo appeal as the success criterion;
- using video or LLM-judge prose as physical truth;
- building society-scale features before individual competence, goal
  continuity, and interaction observability work;
- hard-coding one Minecraft strategy into the general runtime;
- freezing all scenarios or stop rules before exploratory runs reveal what is
  useful.

## 15. Direction-Change Artifacts

### `research-claim/v1`

```yaml
schema_version: research-claim/v1
status: program-level-methodological-claim
claim: >
  A Minecraft social research program can separate individual task competence,
  autonomous goal continuity, and interdependent multi-actor behavior using
  verifier-backed scenario benchmarks and long-run evidence, then use recurring
  phenomena rather than a preselected narrow predictor task to choose controlled
  studies.
negative_form: >
  If capability, continuity, or social opportunity cannot be separated in the
  artifacts, the substrate does not support credible social interpretation and
  must be repaired before observations become research claims.
research_gap_type:
  - methodological
  - evidence
value_type:
  - systems
  - measurement
  - scientific_only_after_phenomenon_promotion
```

### `prior-work-proximity/v1`

```yaml
schema_version: prior-work-proximity/v1
source_basis:
  - repo literature reviews through 2026-07-10
  - MineNPC-Task: machine-checkable in-world validators and bounded knowledge
  - MineExplorer: latent multi-hop dependencies and rule-based milestones
  - Plancraft: explicit infeasibility judgment
  - MineDojo, MineStudio, MineRL/BASALT, Voyager successors: task, trajectory,
      video, curriculum, and capability references
  - Project Sid and LLM social simulations: social scenario ideas and warnings
proximity: >
  Existing work supplies strong task and agent-evaluation mechanisms and several
  social simulation examples. This plan does not claim novelty for benchmarks,
  Minecraft multi-agent execution, or observability alone. Its present value is
  the staged integration and the phenomena it may expose. Every promoted
  phenomenon requires a fresh close-work review before a public novelty claim.
```

### `proposal-soundness-review/v1`

```yaml
schema_version: proposal-soundness-review/v1
verdict: substrate-first
strengths:
  - user intent and audience are explicit
  - individual competence and social behavior are separated
  - runtime evidence makes material outcomes inspectable
  - Minecraft supports long-lived, configurable, recordable interaction
  - the build can proceed in small benchmark and sandbox slices
strongest_objection: >
  Open-ended scenario iteration can produce compelling anecdotes without a
  scientific claim, and designed interdependence can be mistaken for emergent
  social organization.
response: >
  Keep scenario versions, competence controls, structured evidence, and
  alternative explanations visible. Do not call discovery runs a controlled
  result. The user, not a global kill rule, decides which phenomenon merits the
  cost of Stage 5.
```

### `experiment-sketch/v1`

```yaml
schema_version: experiment-sketch/v1
name: first-capability-to-social-sandbox-slice
uncertainty: >
  Can the current runtime produce actors that complete multi-hop Minecraft goals,
  retain and revise intermediate work, and then encounter repeated material
  interdependence without collapsing into solo loops or scripted outcomes?
minimum_sequence:
  - individual capability manifest and verifier-backed reports
  - goal-continuity cases with interruption and replanning
  - small interdependent social session with economic, cooperative, and quest
      opportunities
observed_targets:
  - task target states and milestones
  - goal lifecycle and continuity
  - material interaction opportunities and responses
  - synchronized metrics, evidence refs, and video
decision: >
  Use results to repair the missing layer or begin a phenomenon catalog; do not
  select a scientific headline from implementation success alone.
```

### `research-decision/v1`

```yaml
schema_version: research-decision/v1
decision: >
  Replace V3 lived-vs-told prediction and observer legibility with a
  capability-gated, phenomenon-first Minecraft social sandbox program.
rationale:
  - the user wants long-horizon behavior of capable autonomous actors
  - V3 is meaningful but too narrow to organize the project
  - individual task competence and goal continuity must be established before
      social interpretation
  - economic, cooperative, and quest interdependence should create social
      opportunity without scripting the response
  - scientific questions should follow recurring observations
accepted_tradeoffs:
  - early work has systems and measurement value rather than a paper headline
  - scenario iteration remains user-directed and has no global preregistered
      stop condition
  - interesting observations may remain negative or anecdotal until controlled
next_action: >
  Align the active documentation surface, then define the first individual
  capability benchmark manifest and normalized report contract.
what_not_to_do_next: >
  Do not implement V3 Session A, run its live pilot, scale actors before the
  individual and continuity gates work, or claim that benchmark success,
  structured logs, or compelling video is the research contribution.
```

## 16. Maintenance Rule

This document is the central direction authority below `SPEC.md` and
`AGENTS.md`. Implementation plans, benchmark manifests, scenario catalogs,
reports, and public docs must point back here.

Update this plan only when the program structure, success definition, research
authority, or stage boundaries change. Routine scenario tuning, benchmark case
addition, model selection, and run-specific decisions belong in subordinate
artifacts. Preserve superseded central plans as audit trail instead of quietly
rewriting their historical claims.
