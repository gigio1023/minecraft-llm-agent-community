# Embodied Co-Actor Legibility: Implementation Plan

Status: ACTIVE implementation plan for the active central plan.

Search token: `LEGIBILITY_IMPLEMENTATION_PLAN`. Also: `DEPTH_NOT_SCALE`,
`SESSION_1_BUILD`, `SESSION_2_PILOT`.

Recorded: 2026-07-06 (`Asia/Seoul`).

Authority: subordinate to `AGENTS.md` and to
`central-plan-embodied-co-actor-legibility.md` (`ACTIVE_CENTRAL_PLAN`). This
document expands section 9 of the central plan into a full work breakdown
with seams, decisions, slices, acceptance criteria, and testing rules. If the
two documents disagree, the central plan wins and this file must be updated
in the same change.

Method note: this plan adapts the PRD / vertical-slice / deep-module /
test-first structure from external engineering skills (Matt Pocock-style
`to-prd`, `to-issues`, `codebase-design`, `tdd`). Per `AGENTS.md`, those
skills are advisory form only; every gate below is a repo rule, not an
external-skill rule.

## 0. TL;DR

The experiment is declared and preregistered in the central plan. The
substrate cannot run it yet: the live path runs one bot, cross-actor
observation is a no-op, chat is not captured, response windows close
vacuously, no public-history export exists, and no scorer exists. This plan
builds exactly that substrate in two sessions — Session 1 provider-free,
Session 2 a preregistered live pilot — as eight vertical slices, each with
acceptance criteria that map onto the preregistered stop-results K1-K8.

The binding substrate premise is depth, not scale: 2-3 actors with dense,
attributable, longitudinally accumulated interaction. Actor-count scaling is
never a remedy for weak signal.

## 1. Problem Statement

The central plan asks one question: can an observer model, given only public
interaction history, predict a soul-grounded co-actor's next-turn
social-response and material-access labels better than baselines that could
erase the claim, and does predictability track disposition consistency?

Today the repository cannot produce a single scorable row for that question:

- the live social-cycle path creates one bot
  (`probe/src/runtime/socialCycleRunner.ts`), so there is no co-actor to
  observe or predict;
- `visibleActors` is empty in the live path and chat is not captured into
  `ObserveResult`, so "public interaction history" has no raw material;
- response windows close on the immediate post-action observation, which is
  why eleven prior control runs produced only `no_observable_response` —
  the label was vacuous, not informative;
- there is no public-history export with a private-field allowlist, so soul
  privacy is convention, not contract;
- there is no scripted responder condition, no `experiment-declaration/v1`
  writer, no prediction join, and no scorer, so even a perfect batch of rows
  could not be scored against the preregistered arms.

The prior no-regret pipeline (~4,100 LOC) exists only at
`backup/no-regret-core-stash-2026-06-30` and is salvage material, not a
foundation (verdicts in section 4.1).

## 2. Binding Premise: Depth, Not Scale

This section is the design rationale the rest of the plan enforces. It is
recorded as a plan-level premise because the most tempting failure mode of
this project is to answer weak small-N signal with a bigger simulated
society.

### 2.1 What the experiment actually presupposes

1. **A working small-N multi-actor substrate.** At least two, at most three
   concurrent actors in one shared session, with cross-actor observation and
   chat capture wired into runtime evidence. Public history is constructed
   from what actors can observe of each other; until slice S1-2 lands, that
   history does not exist at all.
2. **Interaction density.** Rows must carry `material_stake` and
   `interaction_opportunity`. The K6 minimum (>= 40 non-excluded
   `stable_soul` rows, >= 4 action classes, non-vacuous windows) is a floor
   on interaction density, not a formality. Observe/wait loops produce rows
   that fail this floor and fire the section-7 diagnostics of the central
   plan.
3. **Longitudinal responder depth.** History-grounded prediction is only
   meaningful if the observer receives accumulated history about the same
   responder across repeated episodes. The unit that must grow is rows per
   responder per condition, under a fixed private ActorSoul in
   `stable_soul`. Depth per responder — not breadth of cast — is what lets
   disposition information enter public history.

### 2.2 What is explicitly not a premise

Actor-count scale is not a premise, and adding actors is not a remedy:

- statistical power comes from rows per responder x conditions; at fixed
  provider budget, more actors dilutes rows per responder and lowers power;
- more actors blurs response-window attribution (whose action did the
  responder respond to?), inflating label noise and pathing confounds;
- the dose-response design (scripted / stable / resampled) requires precise
  responder composition control, which only 1-2 responders allow.

2-3 actors is the measurement optimum for this claim, not a downscaled
compromise.

Binding rule, carried forward from the superseded protocol into active
authority: **do not scale actor count to hide a weak small-run result.**

Scale re-enters the program in exactly two places, both after a decision on
this experiment:

- the deferred social-pattern branch (old F-society), still gated by
  `society-observable-preflight.md`;
- a generalization/robustness follow-up if the legibility result is
  positive ("does legibility survive richer multi-actor contexts?").

If 2-3 actor interaction turns out structurally too poor to carry
disposition information, that is a K6/K7-shaped substrate failure. The
honest responses are: fix scenario pressure and window design inside the
small-N design, or preserve the negative result and stop. Adding actors is
never on that list.

## 3. Solution Shape: Modules And Seams

Design vocabulary: a module is anything with an interface and an
implementation; a seam is where behavior can vary without editing callers.
Prefer existing seams; keep interfaces small and behavior deep; the
interface is the test surface.

The experiment needs seven modules. Four sit at existing seams; three are
new seams.

| Module | Seam | New? | Interface (what callers must know) |
| --- | --- | --- | --- |
| Shared-session scheduler | social-cycle runner entry | extend | N actors, per-actor `providerId` routing, round-robin Actor Turn slots |
| Cross-actor observation | `ObserveResult` | extend | `visibleActors` populated from `bot.entities` scan; chat events captured with speaker, tick, and text |
| `scripted-social` responder | provider seam (per-call `providerId`) | reuse | content-conditioned deterministic policy behind the same provider interface as live LLM actors |
| Response-window tracker | transition-row assembly | new | window opens at execution; closes only per central plan 3.3 (every other active actor completed >= 1 subsequent Actor Turn slot, or preregistered timeout) |
| Public-history exporter | new offline artifact | new | allowlisted export from runtime evidence; rejects any field not on the allowlist; never reads soul/memory/PlanBeads/provider IO of the target |
| Experiment-declaration writer | new offline artifact | new | writes `experiment-declaration/v1` before any outcome inspection; refuses to run scoring without one |
| Prediction join + scorer | `row_id` join after label lock | new | offline; consumes locked rows + prediction artifacts; emits per-condition lift, RER, matched-stratum, AUC, bootstrap CI tables |

Seam decisions worth recording:

- **Provider seam is the responder seam.** The scripted responder is just
  another provider (`probe/src/mutual/provider.ts` state-machine pattern),
  selected by the per-actor routing map. No special-case branch in the
  runner. One seam, three conditions.
- **`ObserveResult` is the public-history seam.** Public history is derived
  only from what entered runtime observation evidence. If it was not
  observable in `ObserveResult`, it is not public history. This keeps the
  public/private boundary enforceable by construction instead of by
  filtering discipline.
- **The scorer is fully offline.** It joins by `row_id` after labels are
  locked. Nothing in the runtime imports it; nothing in it can touch runtime
  authority. This preserves the non-negotiables (no `predicted_delta` in
  rows, no `expected_outcome` as target).

## 4. Implementation Decisions

### 4.1 Salvage verdicts (from central plan section 9)

Salvage from `backup/no-regret-core-stash-2026-06-30` strictly by design
fit:

| Component | Verdict | Reason |
| --- | --- | --- |
| `seedResetRecords.ts` | reuse as-is | provenance logic unchanged |
| `transitionRows.ts` | row shape only | stashed labels are tool-name-derived; relabeling must be evidence-based |
| `transitionResponseWindows.ts` | redesign | closes immediately; central plan 3.3 semantics required |
| `transitionRowBatchAudit.ts` | rework | gate verdicts become computed diagnostics |
| `noRegretRunDeclaration.ts` | redesign | becomes `experiment-declaration/v1` |
| shared-session smoke CLIs | reference | scheduler pattern + `visibleActorsForBot` scan |

### 4.2 Decisions made here

- **Per-actor provider routing** is a map from `actor_id` to `providerId`
  resolved at session start and recorded in the run artifacts. Provider
  functions already accept `providerId` per call; the scheduler owns the
  map. Condition assignment is a routing fact, never inferred from prose.
- **Chat capture** enters `ObserveResult` as structured events (speaker
  actor id, message, tick, position bucket). Chat is evidence input to
  labels; a chat-only response without a material delta stays a weak row
  per central plan 3.6 and feeds the K7 diagnostic.
- **Window closure semantics**: one window per focal executed action; the
  tracker subscribes to Actor Turn slot completion per actor; timeout is a
  preregistered constant in the declaration, not a code default.
- **Public-history allowlist** is an explicit field list in the exporter,
  versioned with the export artifact. The exporter fails closed: unknown
  fields are rejected, not passed through. An identity-permutation check
  and a prompt-shape check ship with the exporter (leakage tests from
  central plan section 4).
- **Scorer metrics** implement central plan 3.5 exactly: per-condition
  lift, RER on Brier/log loss, matched-stratum macro-average, per-label
  one-vs-rest AUC, grouped bootstrap by seed/reset session, label-noise
  ceiling slice. No metric may be added or dropped at scoring time.
- **Row targets for Session 2**: `stable_soul` >= 40 non-excluded rows,
  `scripted_responder` >= 30, `resampled_soul` >= 30, estimated 200-300
  provider calls, focal/live actors on `modelscope-api` Qwen, predictor
  arms offline on a different model family.

### 4.3 Decisions deferred to `experiment-declaration/v1` instances

Scenario family selection and counterbalancing order, soul generation
seeds, window timeout constant, bootstrap CI level, and the double-labeled
slice size are declared per experiment instance, not hardcoded in this
plan. The declaration writer refuses scoring without them.

## 5. Work Breakdown: Vertical Slices

Each slice is a tracer bullet: it cuts through runtime, artifacts, and
tests, and is verifiable on its own. Slices are ordered by dependency;
`bun test` and `bun run typecheck` green is an implicit acceptance
criterion on every slice.

### Session 1 — integrated pipeline, provider-free

Implementation status (2026-07-06): landed as the provider-free legibility
entrypoint `probe:legibility-session1-smoke`, backed by
`probe/src/legibility/*`, `probe/test/legibilitySession1.test.ts`, and raw
artifacts under
`project-docs/experiments/raw/2026-07-06/session1-legibility-smoke/`.
The legacy `probe:social-cycle` single-actor runner remains available for
older runtime work; it is not the Session 1 legibility entrypoint.

Status caveat (2026-07-06, post-merge review): the S1 boxes below were
satisfied under **fixture semantics** — the smoke's actors are in-memory
stubs, labels come from fixture heuristics, and the smoke's
`history_grounded` arm is a placeholder. The live counterparts (real
2-3 bot shared session, evidence-grounded labeling, real predictor arms,
real leakage checks) are broken down as Phase A of
`legibility-cycle-2-live-substrate-work-plan.md`
(`LEGIBILITY_CYCLE_2_WORK_PLAN`); Session 2 below starts only after that
plan's C2-G live provider-free gate holds.

Live C2-1 follow-up status (2026-07-06):

- [x] provider-free 2-bot `fresh_world` live session runs through
      `probe:legibility-live-session` with distinct per-actor provider routes
      and resolvable runtime evidence refs:
      `project-docs/experiments/raw/2026-07-06/c2-live-shared-session-c2-1/`;
- [x] `probe:social-cycle` behavior-lock tests and the full `probe` Bun suite
      still pass after the per-turn core extraction;
- [x] the live runner consumes provider routes without condition-keyed runtime
      branches.

**S1-1. Shared-session scheduler with per-actor provider routing**

- What: the social-cycle runner starts N (2-3) actors in one session,
  schedules Actor Turn slots round-robin, and resolves each actor's
  provider through the routing map.
- Acceptance:
  - [x] a deterministic 2-actor session runs to completion with distinct
        `providerId` per actor recorded in run artifacts;
  - [x] Actor Turn slot completion events are recorded per actor (needed
        by S1-4);
  - [x] the Session 1 legibility entrypoint is a shared-session path, not
        the legacy single-bot `probe:social-cycle` path.
- Blocked by: none — can start immediately.

**S1-2. Cross-actor observation and chat capture**

- What: `ObserveResult` carries populated `visibleActors` (from
  `bot.entities` scan, loaded-world scoped) and structured chat events.
  Without this slice public history does not exist; it is the premise-1
  gap from section 2.1.
- Acceptance:
  - [x] in a 2-actor deterministic session, each actor's observation
        evidence contains the other actor's presence and movements when in
        range, with scan-limit scoping recorded;
  - [x] chat sent by one actor appears as a structured event in the other
        actor's observation evidence;
  - [x] absence claims remain scoped (no implied observation of unloaded
        chunks).
- Blocked by: S1-1.

**S1-3. `scripted-social` responder provider**

- What: a deterministic content-conditioned responder policy behind the
  standard provider interface, wired into the ActorSoul pipeline; this is
  the positive-control condition (K1's subject).
- Acceptance:
  - [x] identical inputs produce identical responses across reruns (seeded
        determinism);
  - [x] responses are conditioned on observed content (focal action kind,
        material stake), not on private fields;
  - [x] the runner treats it as an ordinary provider via routing — no
        conditional branches keyed on condition names.
- Blocked by: S1-1.

**S1-4. Response-window closure per central plan 3.3**

- What: windows close only after every other active actor completed at
  least one subsequent Actor Turn slot, or a preregistered timeout fires.
- Acceptance:
  - [x] a window in a 2-actor session stays open across the responder's
        next slot and captures a response occurring in that slot;
  - [x] timeout closure is recorded as timeout, distinct from
        slot-completion closure;
  - [x] `no_observable_response` can only be assigned from a non-vacuously
        closed window (the vacuity bug class from prior runs is
        structurally impossible).
- Blocked by: S1-1 (slot events), S1-2 (response evidence).

**S1-5. Public-history export with allowlist audit**

- What: the exporter produces the predictor-facing artifact from runtime
  evidence under an explicit allowlist; leakage checks ship with it.
- Acceptance:
  - [x] export of a session containing soul text, memory, PlanBeads, and
        provider IO yields an artifact containing none of them (negative
        test on real workspace fixtures);
  - [x] unknown/new evidence fields cause a hard export failure, not
        pass-through;
  - [x] identity-permutation and prompt-shape checks run and their results
        are artifacts.
- Blocked by: S1-2, S1-4.

**S1-6. Declaration writer, prediction join, and scorer**

- What: `experiment-declaration/v1` writer; offline join of prediction
  artifacts to locked rows by `row_id`; scorer emitting the full 3.5
  metric set per condition and arm.
- Acceptance:
  - [x] scoring refuses to run without a declaration written before
        outcome inspection (enforced by artifact timestamps);
  - [x] rows never contain `predicted_delta`; joins happen only by
        `row_id` after label lock;
  - [x] scorer output includes per-condition lift, RER, matched-stratum,
        AUC, and grouped-bootstrap CI tables for every declared arm,
        including leakage arms.
- Blocked by: S1-5.

**S1-7. Deterministic end-to-end smoke (Session 1 gate)**

- What: one provider-free run: 2 actors (focal + `scripted-social`
  responder), deterministic seeds, full pipeline from session to scored
  lift table. This is the cheap disambiguating test from the central
  plan's soundness review.
- Acceptance:
  - [x] rows produced with non-vacuous windows and >= 1 materially
        grounded response label;
  - [x] a trivial offline history predictor shows lift over
        per-condition majority on the scripted responder — if it cannot,
        that is K1-shaped and blocks Session 2;
  - [x] the smoke is a repo script runnable via `bun run`, and its
        artifacts land under the experiments tree.
- Blocked by: S1-3, S1-6.

### Session 2 — preregistered live pilot

**S2-1. Provider quota preflight and declaration**

- What: run `provider-quota-preflight` for the exact
  `(provider_id, model)` candidates and whole-run estimate; write the
  `experiment-declaration/v1` instance (conditions, counterbalancing,
  soul seeds, timeout, arms, metrics, stop-results, budget).
- Acceptance:
  - [ ] preflight artifact recorded; blocked/unbudgeted statuses stop the
        session; OpenAI requires dashboard or explicit user approval;
  - [ ] declaration written and committed before any live episode runs.
- Blocked by: S1-7.

**S2-2. Live batch collection**

- What: run the three conditions to the K6 minimums (`stable_soul` >= 40
  non-excluded rows, `scripted_responder` >= 30, `resampled_soul` >= 30),
  with seed/reset records and the section-7 diagnostics computed per
  batch.
- Acceptance:
  - [ ] K6 minimums met or the K6 clock (section 7 below) is invoked
        honestly;
  - [ ] every batch ships denominators (`archived` / `non_excluded` /
        `scorable_by_layer`) and a row-exclusion audit;
  - [ ] provider usage recorded against the preflight estimate.
- Blocked by: S2-1.

**S2-3. Label lock, predictor arms, scoring**

- What: lock labels (with the double-labeled agreement slice), run all
  predictor arms offline (held-out family for `history_grounded`; leakage
  arms included), join, score.
- Acceptance:
  - [ ] label lock precedes any prediction join (artifact-enforced);
  - [ ] every arm in central plan 3.4 present in the score tables;
  - [ ] label-noise ceiling reported next to every F1 cutoff.
- Blocked by: S2-2.

**S2-4. `research-decision/v1`**

- What: apply central plan section 5 decision rules and section 6
  stop-results; write the decision with `what_not_to_do_next`.
- Acceptance:
  - [ ] one of promotion / collect-more / revise-design /
        preserve-negative-result, with the K-conditions checked
        explicitly;
  - [ ] negative results preserved as first-class artifacts.
- Blocked by: S2-3.

## 6. Testing Decisions

Detroit-style, behavior through the interface, per `AGENTS.md` and
`engineering-governance-and-testing.md`. One test then one implementation;
no bulk test-first sweeps; a test that would pass with broken runtime
behavior gets rewritten or deleted.

Behaviors that must be tested (the priority list):

- window closure: opens/closes per 3.3, timeout vs slot closure
  distinguishable, vacuous closure impossible (S1-4 is the highest-risk
  logic in the plan — this is where the last design died);
- exporter allowlist: private fields never exported, unknown fields fail
  closed, on realistic actor-workspace fixtures, not synthetic minimal
  ones;
- scorer determinism: fixed fixture rows + fixed predictions produce
  byte-identical metric tables; metric definitions locked by test;
- scheduler routing: per-actor provider resolution and slot-event
  emission;
- scripted responder determinism under seeded reruns.

What deliberately gets no unit tests: LLM output quality, Mineflayer
pathing internals, and anything whose truth is a live-run artifact.
Mock-heavy simulations of provider behavior are banned; the deterministic
smoke (S1-7) is the integration truth, and its artifacts — not test
green — are the Session 1 exit evidence.

## 7. Failure Handling And The K6 Clock

The K6 stop-result gives the substrate two focused build sessions to
produce a closed preregistered batch. Session 1 and Session 2 above are
those two sessions. Rules:

- if S1-7 cannot show scripted-responder lift for a trivial predictor,
  that is K1-shaped: fix the substrate or kill — do not proceed to live
  spend;
- if Session 2 cannot close the batch at K6 minimums, defer the agenda
  and record it; the runtime remains an engineering asset;
- if >= 80% of scorable response labels are chat-only (K7), the substrate
  is not doing measurement work: fix scenario material pressure and window
  design within 2-3 actors, or preserve the negative result — never add
  actors (section 2.2);
- any firing diagnostic from central plan section 7 blocks headline
  claims but never blocks building.

## 8. Out Of Scope

Carried from the central plan and binding here:

- Qwen-AgentWorld / JarvisVLA / VLA arms, model training or fine-tuning;
- social-pattern (F-society) episodes and any actor-count scaling beyond
  3;
- ledgers, HTML reports, or dashboards before data exists;
- new protocol documents beyond `experiment-declaration/v1` instances;
- `same_family_predictor` as a headline arm (it measures the
  self-simulation gap only);
- describing this work as world modeling or social simulation;
- speculative substrate features not consumed by a slice above (extra
  observation channels, relationship dashboards, memory summarizers).

## 9. Document Maintenance

This plan is Tier 1 (see `research-documentation-hierarchy.md`). When a
slice lands, update the acceptance boxes in the same commit as the code.
When the central plan changes, reconcile this file in the same change.
When Session 2 ends in a `research-decision/v1`, this plan's status
becomes historical and the decision doc takes over routing.
