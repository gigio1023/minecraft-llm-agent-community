---
sidebar_position: 45
---

# Material Claims And Social Economy Benchmark Plan

Search token: `MATERIAL_CLAIMS_SOCIAL_ECONOMY_BENCHMARK`.

Status: active benchmark direction under the advisory social-material WAM spine.

Recorded: 2026-06-15 (`Asia/Seoul`).

Primary overlap reference:

- `PROJECT_SID_2411_00114_REVIEW`:
  `project-docs/references/external-project-notes/project-sid-2411-00114-review-2026-06-15.md`
- `ADVISORY_SOCIAL_MATERIAL_WAM`:
  `project-docs/specification/advisory-social-material-wam.md`

## Purpose

This document defines benchmark families for the active advisory
social-material WAM direction. Minecraft society is not primarily a shared
chest or a central pool of resources. The research object is prediction of
social-material consequence in a shared Minecraft world: actors face needs and
constraints, remember each other, depend on or avoid each other, negotiate
access to things and places, create obligations, repair or ignore harms, and
continue after one scripted task is complete.

Evidence is required to audit those claims, but evidence collection is a support
condition, not the research value. Verification is baseline hygiene. The
benchmark is useful only insofar as it creates state/action/next-state rows for
prediction and separately records acting outcomes.

The benchmark should compare LLM providers and models by asking:

```text
Can the model predict how candidate embodied actions will change material
possession, access, obligations, relationships, and future action opportunities
under natural Minecraft constraints, while actors still act without a hidden
planner?
```

The first 2026-06-15 borrowed-tool provider smoke is only a closed issue
decision check. It is useful for testing the social issue schema and scorer, but
it is too small to count as open-world Minecraft social interaction. The main
benchmark target must be live-world behavior: actors should observe the same
natural Minecraft world, move as separate Mineflayer bots, create chat and
world consequences, and leave evidence that one actor's action changed another
actor's options, obligations, trust, or future behavior.

Project Sid already claims a broad version of the open-world Minecraft
agent-society direction, including many-agent societies, role specialization,
collective rules, and cultural/religious transmission. However, the public
artifact is an arXiv technical report plus a thin GitHub wrapper, not a
reproducible benchmark release. This benchmark plan therefore must not claim
that Minecraft agent society is untouched, but it should also not treat Project
Sid as a verified public baseline. The tighter gap for this repo is realistic
social microeconomy in Minecraft: possession, material claims, obligations,
refusal, repair, relationship continuity, and world-shaped dependence. Auditable
Mineflayer artifacts are required so those social claims can be checked, but
they are not the main research contribution.
The stronger WAM gap is whether those consequences can be predicted before the
action and scored separately from the actor's eventual success.

## Project Sid Case Adaptation

Project Sid should be mined for case designs, not copied as a target style. The
LaTeX source audit in `PROJECT_SID_2411_00114_REVIEW` found useful prompts,
configs, metrics, and caveats, but no runnable public runtime, raw logs, world
seeds, scoring scripts, or replay bundle. Therefore, use the report as a
reference catalog:

| Project Sid pattern | Adaptation here |
| --- | --- |
| Unique-item progression | Use as a single-actor competence calibration gate before social runs. |
| Action awareness | Require expected outcome, runtime action, post-observation, verifier output, and artifact refs. |
| Chat/action coherence failure | Treat chat as social evidence only; inventory/world truth still comes from Mineflayer artifacts. |
| Sentiment tracking | Track relationship state only when tied to concrete requests, help, refusal, harm, repair, or future behavior. |
| Chef food distribution | Convert into vanilla Minecraft scarcity/allocation cases: food, tools, fuel, station use, shelter access. |
| 50-agent relationship graph | Start with 2-3 actors and plot relationship/obligation edges over cycles before scaling. |
| Role specialization | Infer roles from repeated evidence-backed actions and obligations, not from profile labels alone. |
| Tax constitution | Treat as a late-stage norm/rule experiment after smaller claim/obligation cases work. |
| Cultural memes | Track repeated place names, routines, warnings, rituals, and work practices only when co-present behavior supports them. |
| Religion spread | Keep as a controlled-diffusion stress test, not an early benchmark or proof of society. |

This ordering avoids the failure mode where the project imitates the dramatic
surface of civilization, such as laws or religion, before actors can sustain
ordinary Minecraft social life around need, possession, access, refusal, and
repair.

## Minecraft Social Issue Framing

The benchmark unit should be a Minecraft social issue, not a generic task.

```text
A Minecraft social issue is a world-grounded situation where one actor's need,
claim, knowledge, risk, or action affects another actor's options,
obligations, trust, or future behavior.
```

For WAM-facing benchmarks, every issue should also define predicted-delta and
observed-delta fields.

This framing translates the literature into Minecraft:

| Literature pattern | Minecraft issue shape | What to measure |
| --- | --- | --- |
| SOTOPIA / AgentSense social goal | Request, refusal, persuasion, apology, negotiation, or private-stake issue. | Goal resolution, role/private-stake handling, relationship-sensitive action. |
| M3-BENCH / mixed-motive games | Cooperation is useful but costly; selfish or deceptive choices are possible. | Communication-action coherence, mutual gain, cost, conflict, repair. |
| Generative Agents / Lifelong SOTOPIA | Earlier promise, help, refusal, or conflict should affect a later cycle. | Memory continuity, obligation closure, relationship change. |
| VillagerBench / TeamCraft | Spatial, causal, temporal, role, or material dependency across actors. | Dependency resolution, handoff quality, synchronization, action efficiency. |
| Concordia / Project Sid | Rules, roles, claims, duties, sanctions, or public-good pressure. | Norm following, governance signal, collective consequence. |

Each issue should declare:

- `issue_id`;
- world trigger;
- actors involved;
- each actor's stake;
- valid resolution space, including refusal or conflict when appropriate;
- required Minecraft evidence;
- required social-state evidence;
- predicted-delta fields;
- observed-delta fields;
- score dimensions.

The benchmark should not reward automatic cooperation. A grounded refusal,
conditional loan, warning, or unresolved debt can be a better social result than
ungrounded generosity.

## Non-Goals

- Do not benchmark tool schema compliance or structured-argument formatting.
- Do not make shared storage the primary success criterion.
- Do not require a currency mod, economy plugin, or artificial coin system.
- Do not require house-building, shelter, farming, or any one domain activity
  as the universal social objective.
- Do not optimize for Minecraft tech-tree speed as the top-level result.
- Do not score dialogue style unless it produces evidence-backed social state.
- Do not run provider-backed experiments without provider-specific quota
  preflight and operator approval.
- Do not present verified action records, screenshots, or report completeness as
  the contribution.

## Economy Definition

The benchmark treats vanilla Minecraft economy as:

```text
possession + access + claim + use + obligation + trust + world consequence
```

Economic value appears when an actor controls, gives, withholds, borrows,
claims, improves, damages, or enables access to something another actor can
care about.

Useful categories:

| Category | Benchmark meaning |
| --- | --- |
| Personal possession | Carried inventory, equipped tools, food, armor, and materials controlled by one actor. |
| Material claim | Evidence-backed ownership or access claim over a cache, station, tool, crop, worksite, or useful block. |
| Public affordance | A placed or modified world object that expands another actor's action options. |
| Weak commons | Deliberately available surplus or low-cost shared material, not the center of the social system. |
| Obligation or credit | A remembered promise, loan, debt, repair expectation, favor, or social cost. |

## Benchmark Ladder

### Phase 0. Provider-Free Ledger And Transition-Row Sanity

Goal: check scoring, reporting, and transition-row shape without spending
provider quota.

Input can be fixture events only. The run should prove that the report can show:

- possession changes;
- claim/access events;
- public affordance creation/use;
- request, offer, refusal, handoff, debt, and repair events;
- predicted and observed delta fields;
- evidence refs for every social claim.

This phase catches report and scoring errors before live Minecraft runs.

### Phase 1. Single-Actor Competence Gates

Goal: ensure the runtime can still perform boring Minecraft actions before
asking for social behavior.

Example gates:

- collect a natural resource;
- craft a tool or station;
- place and later use a block;
- record inventory, block, and verifier evidence.

These are calibration gates only. Passing them is not a society claim.
They are also calibration rows for physical/material prediction.

### Phase 2. Two-Actor Exchange

Goal: test whether the predictor anticipates when one actor's possession or
claim becomes another actor's option through social action.

Example scenarios:

- borrowed tool: one actor owns or crafts a tool, another asks to use it, and
  the run records loan, return, refusal, or unresolved debt;
- requested food: one actor has food, another asks, and the response changes
  relationship or obligation state;
- claimed cache: one actor controls a chest or stash, another requests access,
  and the result is recorded as allowed, refused, borrowed, or contested.

The score should not require generosity. A grounded refusal can be better than
ungrounded cooperation. Prediction scoring should ask whether the model
anticipated the material/social consequence, not whether it preferred kindness.

### Phase 2L. Open-World Live Two-Actor Interaction

Goal: make Phase 2 real in Minecraft instead of only simulating an issue packet.

Candidate benchmark id: `open_world_live_borrowed_tool_v1`.

Required shape:

- natural-safe-spawn or natural-survival world, fresh for each model run;
- two active actors, each represented by a distinct Mineflayer bot;
- each actor has its own ActorSoul, LifeGoal, inventory, memory, relationship
  state, and actor workspace;
- the scenario may seed initial facts such as proximity, one tool, or one need,
  but it must not force the utterance, handoff, resolution, or final outcome;
- both actors must observe live entities, terrain, inventory, chat, and
  reachable world affordances from the loaded world;
- world, inventory, container, entity, chat, memory, relationship, claim, and
  obligation evidence must be recorded as runtime artifacts;
- first-person and close third-person screenshots are supporting review
  artifacts, not scoring authority.

For `open_world_live_borrowed_tool_v1`, a minimal useful setup is:

```text
npc_a starts with or has just made a useful tool as personal possession.
npc_b has a nearby material need where the tool helps.
Both actors start near each other in a natural world with enough reachable
terrain to act.
The system does not prescribe whether npc_a lends, refuses, asks for collateral,
offers help directly, ignores the request, or creates a debt.
```

Passage through the issue can include cooperation, refusal, conflict, debt, or
adaptation. What matters is whether the social consequence is grounded in live
Minecraft evidence rather than a prewritten event trajectory.

Minimum evidence gates:

| Gate | Evidence required |
| --- | --- |
| Co-presence | Both actors are loaded entities within interaction range at least once. |
| Social initiation | A delivered chat event, or equivalent visible action, is tied to a live-world need or claim. |
| Material claim | The possessed item, station, cache, or affordance is proven by inventory, block, or container evidence. |
| Cross-actor consequence | One actor's action changes another actor's options, position, inventory, plan, memory, relationship, or obligation state. |
| World grounding | At least one non-chat Minecraft action occurs after the social event and is tied to the issue. |
| Continuity | A later turn references or acts on the prior request, refusal, loan, debt, or obligation with evidence refs. |
| WAM row | The action has predicted and observed physical/material/social deltas. |

Implementation implication: the current `socialCycleRunner` already has natural
world setup, fresh-world support, visual evidence, and actor-workspace artifacts,
but it is still primarily a single-actor loop. The older `mutual/skillVillage`
path can create several bots, but it is flat-world/OpenAI-Codex-oriented and
does not execute generated Minecraft skills as live social evidence. The next
implementation should therefore add a small live two-actor orchestration layer
on top of the current social-cycle runtime rather than treating the closed
issue smoke as sufficient.

### Phase 3. Public Affordance Creation And Use

Goal: test whether actors create world changes that other actors can use later.

Example scenarios:

- public crafting table: one actor crafts and places a table, another actor
  later uses it;
- marked hazard: one actor identifies and marks a danger, another actor avoids
  or references it;
- route improvement: one actor creates a small path, bridge, lighted area, or
  worksite marker that changes later movement.

This phase is important because social value in Minecraft is often not an item
transfer. It can be a world affordance.

### Phase 4. Weak Commons And Claim Conflict

Goal: test whether actors can handle ambiguous shared-looking resources without
assuming a central collective pool.

Example scenarios:

- surplus logs are marked as available and later used by another actor;
- an actor takes from a weak commons but another actor later disputes scarcity;
- a useful station is public, but fuel or output is claimed;
- an actor damages or misuses an affordance and creates a repair obligation.

This phase should expose hoarding, ambiguity, conflict, and repair.

### Phase 5. Open-Loop Settlement Run

Goal: evaluate whether the system continues after local goals finish.

Suggested shape:

- natural-safe-spawn world;
- two or three actors;
- no fixed terminal item such as "make furnace";
- 60-120 cycles;
- provider quota preflight and explicit operator approval;
- first-person and close third-person screenshots per cycle when enabled;
- score process, continuity, cost, latency, and world consequences.

The run should ask whether actors keep producing coherent social state under
new observations, blockers, scarcity, and opportunities.

## Primary Metrics

The report should separate prediction quality, acting outcome, process,
efficiency, and auditability.

| Metric | What it measures | Examples |
| --- | --- | --- |
| Transition prediction accuracy | Whether predicted physical/material/social deltas match observed deltas. | predicted loan -> observed handoff; predicted refusal -> observed no transfer and obligation update. |
| Prediction calibration | Whether uncertainty tracks where the predictor is wrong. | high confidence only on stable physical/material transitions; low confidence under missing actor or unloaded-world limits. |
| Personal material agency | Whether actors use and protect their own possessions coherently. | Inventory deltas, crafted tools, retained food, equipped items. |
| Claim clarity | Whether access/ownership is explicit enough for later actors to reason from. | Claimed cache, station owner, public marker, disputed claim. |
| Exchange quality | Whether request, offer, accept, refuse, handoff, loan, debt, or repair events are evidence-backed. | Request -> loan -> use -> return; request -> refusal -> trust update. |
| Public affordance contribution | Whether a world change enables another actor. | Placed table used later; hazard marker changes route. |
| Cross-actor consequence | Whether one actor's action changes another actor's options or behavior. | Another actor crafts because a station exists; avoids a marked hazard. |
| Continuity | Whether later cycles use prior claims, obligations, relationship changes, or blockers. | Remembered debt affects priority; prior refusal affects trust. |
| Conflict and repair | Whether scarcity, misuse, refusal, or damage becomes visible and is handled. | Hoarding event; apology; replacement; unresolved conflict. |
| Efficiency | How much world progress and social consequence are produced per cycle, action, second, token, and cost. | Cost-normalized social events, cycles to first cross-actor consequence. |
| Robustness | Whether behavior remains grounded under natural terrain, missing resources, path failures, or interruptions. | Truthful blocker, recovery attempt, no fake completion. |

## Scoring Shape

Avoid one opaque score. Use a scorecard plus timelines:

- milestone timeline by actor and cycle;
- predicted-vs-observed delta timeline;
- possession/claim/obligation ledger over time;
- public affordance creation/use timeline;
- cost, latency, provider calls, and action count;
- social consequence per token and per action;
- unresolved obligations and conflicts at run end.

A compact headline score may be useful for model comparison, but it must be
decomposable into the metrics above.

## Required Future Artifacts

The runtime should eventually emit these machine-readable ledgers:

```ts
type MaterialClaimLedgerEntry = {
  claim_id: string;
  cycle: number;
  holder_actor_id?: string;
  group_id?: string;
  target_kind: "item_stack" | "container" | "station" | "worksite" | "crop" | "route" | "other";
  target_ref: string;
  access: "personal" | "claimed" | "public" | "weak_commons" | "unclaimed" | "disputed";
  evidence_refs: string[];
};

type ObligationLedgerEntry = {
  obligation_id: string;
  cycle: number;
  from_actor_id: string;
  to_actor_id?: string;
  kind: "promise" | "loan" | "debt" | "repair" | "favor" | "warning" | "blocker";
  status: "open" | "fulfilled" | "refused" | "blocked" | "violated" | "superseded";
  evidence_refs: string[];
};

type PublicAffordanceLedgerEntry = {
  affordance_id: string;
  cycle: number;
  actor_id: string;
  kind: "crafting_table" | "furnace" | "path" | "marker" | "light" | "shelter" | "farm" | "worksite" | "other";
  state: "created" | "used" | "damaged" | "repaired" | "unavailable";
  evidence_refs: string[];
};
```

These records are not hidden planner authority. They are post-action evidence
and compact context for later Actor Turn decisions.

## First Recommended Issue Smoke

Start with `borrowed_tool_with_return_or_debt_v1`.

Scenario:

```text
two actors
one actor has a useful tool as personal possession
another actor needs that tool for a bounded Minecraft action
the borrower requests access
the owner lends, conditionally lends, refuses, or asks for clarification
the borrower uses, returns, adapts, or leaves a debt/repair obligation
provider quota preflight and approval for provider-backed smoke
```

Target trajectory:

1. Borrower identifies the need and asks the tool holder.
2. Owner recognizes personal possession and chooses lend, conditional lend,
   refusal, or clarification.
3. If access is granted, borrower uses the tool and either returns it or creates
   an explicit debt/repair obligation.
4. If access is refused, borrower adapts without laundering the refusal into
   success.
5. Memory, relationship, material claim, or obligation state cites the evidence.
6. A later turn can use the open/fulfilled/refused obligation.

Why this first:

- it directly tests personal possession, access, request, refusal, trust,
  obligation, and memory;
- it does not require a central shared chest or public-good premise;
- it can pass through cooperation, conditional access, refusal, debt, or repair;
- it is small enough for a provider-backed decision smoke before live
  Mineflayer transfer/use actions exist.

`public_crafting_table_social_use_v1` remains useful only as a public-affordance
plumbing smoke. It is not the main social benchmark.

## Later Scenario Candidates

- `food_request_under_scarcity_v1`
- `claimed_cache_access_conflict_v1`
- `hazard_marker_public_safety_v1`
- `weak_commons_surplus_use_and_dispute_v1`
- `broken_promise_repair_v1`
- `role_dependency_work_order_v1`
- `public_crafting_table_social_use_v1`
- `open_loop_settlement_continuity_v1`

## Report Requirements

Every report should include:

- model, provider, reasoning settings, quota preflight result, and cost summary;
- seed, world reset proof, scenario manifest, and actor profiles;
- per-cycle first-person and close third-person screenshots when enabled;
- event timeline with evidence refs;
- possession, claim, affordance, and obligation timelines;
- cycles/actions/time/tokens/cost/latency normalized views;
- final unresolved obligations, conflicts, and blockers;
- reviewer notes separating real progress from fake progress or report gaps.

Screenshots are supporting evidence. The benchmark grade must come from runtime
artifacts, ledgers, transcripts, and verifier evidence.
