---
sidebar_position: 45
---

# Material Claims And Social Economy Benchmark Plan

Search token: `MATERIAL_CLAIMS_SOCIAL_ECONOMY_BENCHMARK`.

Status: active benchmark direction.

Recorded: 2026-06-15 (`Asia/Seoul`).

## Purpose

This document resets the benchmark plan around the current society definition:
Minecraft society is not primarily a shared chest or a central pool of
resources. It is an evidence-grounded social system where actors maintain
personal possessions, material claims, public affordances, weak commons,
obligations, memory, and relationships in a common world.

The benchmark should compare LLM providers and models by asking:

```text
Can the actors keep a materially grounded social world coherent over time,
under natural Minecraft constraints, without the runtime secretly planning the
society for them?
```

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

### Phase 0. Provider-Free Ledger Sanity

Goal: verify scoring and reporting without spending provider quota.

Input can be fixture events only. The run should prove that the report can show:

- possession changes;
- claim/access events;
- public affordance creation/use;
- request, offer, refusal, handoff, debt, and repair events;
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

### Phase 2. Two-Actor Exchange

Goal: test whether one actor's possession or claim can become another actor's
option through evidence-backed social action.

Example scenarios:

- borrowed tool: one actor owns or crafts a tool, another asks to use it, and
  the run records loan, return, refusal, or unresolved debt;
- requested food: one actor has food, another asks, and the response changes
  relationship or obligation state;
- claimed cache: one actor controls a chest or stash, another requests access,
  and the result is recorded as allowed, refused, borrowed, or contested.

The score should not require generosity. A grounded refusal can be better than
ungrounded cooperation.

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

The report should separate outcome, process, efficiency, and auditability.

| Metric | What it measures | Examples |
| --- | --- | --- |
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

## First Recommended Live Benchmark

Start with `public_crafting_table_social_use_v1`.

Scenario:

```text
natural-safe-spawn world
two actors
40-60 cycles
same seed and reset per model
no central shared chest requirement
provider quota preflight and approval
```

Target trajectory:

1. Actor A identifies a need for a crafting table or requests access.
2. Actor B gathers or uses personal wood, then crafts or places a table.
3. The table becomes a public affordance or a clearly claimed station.
4. Actor A uses it, requests access, refuses to use it, or records a blocker.
5. Memory, relationship, or obligation state cites the physical evidence.
6. The run continues for at least several cycles after the local success or
   blocker.

Why this first:

- it is more social than "collect wood";
- it is less arbitrary than "build a house";
- it tests possession, crafting, placement, public affordance, access, and
  memory;
- it can pass through cooperation, refusal, or blocker recovery;
- it is still small enough to verify in 40-60 cycles.

## Later Scenario Candidates

- `borrowed_tool_with_return_or_debt_v1`
- `food_request_under_scarcity_v1`
- `claimed_cache_access_conflict_v1`
- `hazard_marker_public_safety_v1`
- `weak_commons_surplus_use_and_dispute_v1`
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
