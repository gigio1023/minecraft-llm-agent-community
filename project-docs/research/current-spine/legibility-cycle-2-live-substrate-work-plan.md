# Legibility Cycle 2 Work Plan — Live Substrate And Session 2 Pilot

Status: active Tier 1 work order for the remaining
`LEGIBILITY_IMPLEMENTATION_PLAN` slices.

Search token: `LEGIBILITY_CYCLE_2_WORK_PLAN`. Related: `DEPTH_NOT_SCALE`,
`ACTIVE_CENTRAL_PLAN`, `SESSION_2_PILOT`.

Recorded: 2026-07-06 (`Asia/Seoul`), after verifying the merged cycle 1
substrate (`feat: add co-actor legibility session substrate`).

Authority: subordinate to `AGENTS.md`, the central plan
(`central-plan-embodied-co-actor-legibility.md`), and the implementation
plan (`embodied-co-actor-legibility-implementation-plan.md`). This file is
the issue-level breakdown of what remains; if it disagrees with the
implementation plan on scope or acceptance semantics, the implementation
plan wins and this file must be corrected.

Method note: the slice format follows the advisory Matt Pocock skills
(`to-issues` tracer-bullet vertical slices, `implement`, `tdd`,
`codebase-design`) applied under repo governance. External skills remain
advisory only; every gate below is a repo rule, not a skill rule.

## 0. TL;DR

Cycle 1 delivered a real, tested, deterministic **in-memory** Session 1
pipeline: scheduler -> provider seam -> say -> chat events -> response
windows -> transition rows -> allowlisted public history -> declaration ->
label-locked join -> scorer. Typecheck is clean, 565 tests pass, and the
smoke reruns with substantively identical artifacts.

What does not exist yet is everything **live**: no shared Mineflayer
session, no evidence-grounded labeling (the smoke labels via regex over
chat text), no real predictor arms (the smoke's `history_grounded` arm is
an oracle copy of the observed label), and one leakage check is a
hardcoded pass. Session 2 therefore carries both the live substrate
integration and the preregistered pilot. Cycle 2 is split into:

- **Phase A (provider-free, no quota spend)**: C2-1 .. C2-7 plus a live
  smoke gate — wire the cycle 1 modules into a real 2-3 bot shared
  session and replace the fixture-only shortcuts.
- **Phase B (provider spend)**: C2-8 .. C2-11 — the implementation plan's
  S2-1 .. S2-4, unchanged.

The K6 clock is not extended by this split (section 4).

## 1. Cycle 1 Verification Result

Verified on `main` at the squash-merge commit
(`feat: add co-actor legibility session substrate`, 95 files, +8255):

- `bun run typecheck` — clean.
- `bun test` — 565 pass / 0 fail across 93 files.
- `bun run probe:legibility-session1-smoke` — reruns to completion; the
  only diffs against committed artifacts are the wall-clock
  `session_id`/`experiment_id` suffix, `scored_at`/`created_at`
  timestamps, and UUID-named provider IO filenames. Labels, predictions,
  and every metric value are identical across reruns.
- The scorer really implements the central plan 3.5 set per condition and
  arm: majority-lift on macro-F1, Brier RER, matched-stratum macro-F1,
  AUC lift over 0.5, and grouped bootstrap CI (deterministic LCG, grouped
  by `seed_or_reset_id`).
- Label-lock and declaration-before-action are artifact-enforced in
  `probe/src/legibility/scoring.ts` (`joinPredictionsAfterLabelLock`
  throws on `predicted_delta`, on predictions created before
  `label_locked_at`, and on declarations written after action start).
- The exporter allowlist fails closed on unknown fields
  (`probe/src/legibility/publicHistory.ts`), and
  `probe/test/legibilitySession1.test.ts` covers scheduler routing,
  slot-vs-timeout window closure, cross-actor observation shape, exporter
  rejection, smoke lift, and pre-lock join refusal.
- The scripted-social responder is content-conditioned (visible co-actor
  plus inventory state), deterministic, and routed through the ordinary
  provider seam (`probe/src/provider/socialActorTurnProvider.ts`) with no
  condition-keyed branches in the runner.

This is a genuine Session 1 exit in the implementation plan's sense: the
integrated pipeline exists and its artifacts are the evidence. The next
section records what that exit did **not** buy.

## 2. Honest Gap Audit

The cycle 1 smoke satisfies the S1 acceptance boxes under **fixture
semantics**: the "actors" are in-memory stubs
(`makeSmokeActor` in `probe/src/legibility/session1Smoke.ts`) whose
`chat()` pushes to an array. No Mineflayer bot, server, or world is
involved. The S1-1 acceptance line was correspondingly weakened during
implementation from "no single-bot code path remains the default live
entrypoint" to "the Session 1 legibility entrypoint is a shared-session
path". That was the right honest move for a provider-free smoke, but it
leaves the following open, and each open item below is a carried defect
or missing premise — not polish:

| # | Gap | Where | Why it blocks Session 2 |
| --- | --- | --- | --- |
| G1 | Live runner is still single-actor | `probe/src/runtime/socialCycleRunner.ts` (only provider-id recognition changed in cycle 1) | S2-2 needs 2-3 real bots in one session producing rows |
| G2 | Labels come from regex over chat prose | `session1Smoke.ts` `socialLabelForChat` / `materialLabelForResponder` | Violates "runtime code owns Minecraft truth" the moment a live LLM writes the chat; material labels must come from typed runtime evidence |
| G3 | `history_grounded` smoke arm is an oracle (predicted := observed label) | `session1Smoke.ts` prediction block | The S1-7 "trivial predictor shows lift" gate passed only in letter; no real predictor exists for K1 to bite on |
| G4 | `identity_permutation` leakage check is a hardcoded "passed" with prose | `publicHistory.ts` `leakage_checks` | Preregistered leakage arms are meaningless if the checks are decorative |
| G5 | `prompt_shape` check is a value-substring scan (`"provider"`, `"memory"`, `"condition"` anywhere in serialized events) | `publicHistory.ts` `containsForbiddenPublicShape` | A live actor saying "I remember" fails the check; a leak in an unscanned shape passes it — wrong in both directions |
| G6 | New observation seams have no live caller | `probe/src/tools/observe.ts` (`otherActors`, `chatEvents`, `loadedWorldScope`) | Cross-actor observation exists as an interface, not as live behavior |
| G7 | Window opening is hardcoded to one focal actor; `closeTimedOut` is never invoked by the smoke loop | `session1Smoke.ts`, `responseWindows.ts` | Live sessions need windows opened per central plan 3.3 for every qualifying focal turn and timeout closure actually running each slot |
| G8 | `stable_soul` / `resampled_soul` conditions never exercised in this pipeline; no seed-reset/resample runtime code exists (types only) | `probe/src/legibility/types.ts` | Two of three preregistered conditions have no machinery |
| G9 | Exporter `created_at: new Date()` makes public-history artifacts nondeterministic byte-wise | `publicHistory.ts` | Minor; matters for artifact diffing and resumable batches |

Assets already in place that Phase A must reuse rather than rebuild
(`ZERO_COST_IMPLEMENTATION_RULE` cuts both ways — rebuilds are free, but
these are verified working seams, and the scarce resources are recorded
evidence and reviewer trust):

- `createBots` already provisions N bots against one server
  (`probe/src/runtime/createBots.ts`); `runMutualProbe` is the working
  multi-bot precedent; `resolveServerEndpoint` resolves the docker-compose
  Minecraft server for `fresh_world` runs.
- The ActorSoul pipeline (`ensureActorSoul`) already grounds live
  single-actor runs — `stable_soul` is a routing question, not new soul
  machinery.
- The provider routing seam and the scripted-social provider are
  condition-clean and can be reused unchanged in a live runner.
- The scheduler, window tracker, exporter, declaration writer, and scorer
  are runner-agnostic modules; none of them assume the in-memory smoke.

## 3. Design Decision For C2-1 (the one real refactor)

`runSocialCycle` is a ~2100-line single-actor orchestration. Two options:

1. Parameterize it for N bots in place.
2. Extract the per-turn core (provider call -> gate -> execute -> verify
   -> record evidence) into a module both entrypoints share, build the
   live shared-session runner as a new entrypoint on
   `runSharedSessionSchedule`, and leave `probe:social-cycle` intact as
   the single-actor calibration path.

Decision: **option 2.** SPEC keeps single-actor runs valid for
calibration and smoke tests, the shared-session scheduler already defines
the turn-handler seam the extracted core must fit, and threading
multi-actor state through the monolith would couple every future slice to
its internals. Prefactor first ("make the change easy, then make the easy
change"): the extraction is C2-1's first commit, with `probe:social-cycle`
behavior-locked by the existing suite before the live runner lands.

## 4. K6 Clock Statement

The implementation plan section 7 binds the K6 stop-result to two build
sessions: Session 1 and Session 2. Cycle 1 spent build session 1 on the
provider-free pipeline. Everything in Phase A is therefore the **first
half of build session 2**, and Phase B is its second half. The clock is
not reinterpreted or extended by the Phase A/B split. If Phase A plus
Phase B cannot close the preregistered batch at K6 minimums
(`stable_soul` >= 40 non-excluded rows, `scripted_responder` >= 30,
`resampled_soul` >= 30), K6 fires honestly: defer the agenda, record the
state, keep the runtime as an engineering asset. Under `DEPTH_NOT_SCALE`,
a thin batch is never answered with more actors.

## 5. Phase A — Live Substrate Integration (provider-free)

Every slice is a tracer bullet: it cuts through runtime, artifacts, and
tests, and is verifiable on its own from its artifacts. Provider spend is
zero throughout Phase A (`deterministic-social` and `scripted-social`
routes only). Update the implementation plan's acceptance boxes and this
file's boxes in the same commit as each slice.

**C2-1. Live shared-session runner (closes G1)**

- What: extract the per-turn core from `runSocialCycle`; add a live
  shared-session entrypoint that boots 2-3 bots via `createBots` against
  the docker-compose server, drives them with `runSharedSessionSchedule`
  round-robin, resolves each actor's provider through the routing map,
  and writes `legibility-session/v1` plus per-actor workspaces.
- Acceptance:
  - [ ] a provider-free 2-bot live session on `fresh_world` runs to
        completion and writes slot-completion events with distinct
        `provider_id` per actor, with evidence refs that resolve to real
        runtime files;
  - [ ] `probe:social-cycle` still passes its existing suite unchanged
        after the extraction (behavior lock);
  - [ ] no condition-keyed branches: the runner consumes routes only.
- Blocked by: none — can start immediately.
- Test focus: extraction behavior lock; scheduler-to-live-turn adapter
  unit tests; live smoke is the integration truth, not mocks.

**C2-2. Live cross-actor observation and chat capture (closes G6)**

- What: the live runner passes the session roster as `otherActors` and
  captured Mineflayer chat as `chatEvents` into `observe`; chat events
  become `structured-chat-event/v1` records with `observed_by` derived
  from the runtime range policy, feeding the window tracker.
- Acceptance:
  - [ ] in a live 2-bot session, chat sent by bot A appears as a
        structured event in bot B's observation evidence artifact with
        `loadedWorldScope` recorded;
  - [ ] `observed_by` is computed from typed runtime state (range/roster),
        not assumed;
  - [ ] absence claims stay scoped (`absence_claims_exhaustive: false`).
- Blocked by: C2-1.

**C2-3. Live window lifecycle (closes G7)**

- What: the live runner opens a response window for every qualifying
  focal turn (central plan 3.3), calls `recordSlotCompletion` and
  `closeTimedOut` on every slot boundary, and materializes rows only from
  closed windows.
- Acceptance:
  - [ ] a deterministic stall fixture (responder that only observes)
        produces a `timeout` closure in a live session artifact, distinct
        from slot-completion closure;
  - [ ] `no_observable_response` labels appear only on non-vacuously
        closed windows;
  - [ ] window opening is driven by focal-turn properties, not a
        hardcoded actor id.
- Blocked by: C2-1, C2-2.

**C2-4. Evidence-grounded labeler (closes G2)**

- What: a labeling module that assigns `social_response` and
  `material_access` classes from typed runtime evidence — structured chat
  events, inventory/container transaction evidence, verifier output —
  per the transition-row label codebook. The smoke's regex labelers are
  deleted or quarantined to the fixture with a non-live marker; live rows
  never touch them.
- Acceptance:
  - [ ] material labels change only when typed material evidence exists
        (inventory delta, container access, verified transfer), never
        from chat text alone;
  - [ ] negative test: a chat message containing label keywords
        ("available", "cannot") without matching runtime evidence does
        not flip any label;
  - [ ] every label carries `evidence_refs` to the runtime artifacts that
        grounded it.
- Blocked by: C2-2, C2-3.

**C2-5. Real leakage checks, fail closed (closes G4, G5, G9)**

- What: replace the decorative checks. Identity permutation actually
  permutes actor ids in the public history and asserts the artifact is
  invariant up to relabeling (no residual condition/provider/model/soul
  signal by schema). Prompt-shape scanning moves from value substrings to
  key-level schema checks. A failed check makes export (and scoring on
  that artifact) refuse, not annotate. Exporter `created_at` becomes an
  injected timestamp.
- Acceptance:
  - [ ] a fixture with a leaked private field fails export with a thrown
        error, and the scorer refuses a public history whose checks are
        not `passed`;
  - [ ] an actor chat message containing "provider" or "memory" does not
        fail the prompt-shape check (false-positive test);
  - [ ] exporter output is byte-deterministic given injected timestamps.
- Blocked by: C2-3 (needs realistic live-shaped fixtures).

**C2-6. Real offline predictor arms (closes G3)**

- What: implement the baseline and leakage arms as code that consumes
  `public-history/v1` and the declaration **only** (type-enforced module
  boundary): `majority_or_no_response`, `last_response_carried_forward`,
  `policy_copy` (scripted rules), `actor_id_only`,
  `first_m_public_responses`, `action_family_by_responder`,
  `public_profile_only`, and the trivial history predictor. Replace the
  smoke's oracle arm and re-run the S1-7 lift gate honestly.
- Acceptance:
  - [ ] predictor inputs are typed as public history + declaration; a
        compile-time attempt to pass rows or session internals fails;
  - [ ] the trivial history predictor shows lift over per-condition
        majority on scripted-responder rows from the live provider-free
        smoke — if it cannot, that is K1-shaped and Phase B is blocked;
  - [ ] the oracle placeholder is gone from the smoke.
- Blocked by: C2-5 (buildable earlier against cycle 1 artifacts, but
  acceptance is judged on checked live-smoke artifacts).

**C2-7. Condition machinery for `stable_soul` and `resampled_soul` (closes G8)**

- What: route a soul-grounded responder (existing ActorSoul pipeline)
  through the shared-session routing map for `stable_soul`; implement the
  seed-reset/resample writer emitting `seed-reset-record/v1` for
  `resampled_soul`. Condition assignment lives only in the declaration
  and routing map.
- Acceptance:
  - [ ] a provider-free rehearsal (deterministic stand-in for the soul
        provider) runs all three conditions in one declared layout with
        per-condition rows attributed correctly;
  - [ ] `seed-reset-record/v1` artifacts validate against the contract
        doc and are referenced by affected rows;
  - [ ] grep-level check: no `condition ===` branches outside declaration
        and routing construction.
- Blocked by: C2-1.

**C2-G. Phase A exit gate — live provider-free smoke**

- What: `probe:legibility-live-smoke` — the S1-7 analog on a real server:
  2 bots, deterministic + scripted routes, windows, evidence-grounded
  labels, checked export, real predictor arms, full score report;
  artifacts land under `project-docs/experiments/raw/`.
- Acceptance:
  - [ ] one command produces the full artifact chain from a live session
        with zero provider spend;
  - [ ] rows are non-vacuous with >= 1 materially grounded label;
  - [ ] the K1-shaped lift gate (C2-6) passes on these artifacts;
  - [ ] rerun stability: substantive artifact content is identical across
        reruns up to session ids and timestamps.
- Blocked by: C2-1 .. C2-7. Phase B does not start until this gate holds.

## 6. Phase B — Session 2 Pilot (provider spend)

These are the implementation plan's S2 slices, renumbered here for
tracking only; their What/Acceptance text in the implementation plan is
binding and unchanged.

- **C2-8 = S2-1** — provider quota preflight
  (`.agents/skills/provider-quota-preflight/SKILL.md`) for the exact
  `(provider_id, model)` candidates; `experiment-declaration/v1` written
  and committed before any live episode. OpenAI routes require dashboard
  or explicit user approval. Blocked by: C2-G.
- **C2-9 = S2-2** — live batch collection to K6 minimums with
  denominators (`archived` / `non_excluded` / `scorable_by_layer`),
  row-exclusion audit, and per-batch section-7 diagnostics. Blocked by:
  C2-8.
- **C2-10 = S2-3** — label lock with the double-labeled agreement slice;
  all central plan 3.4 arms including `llm_prior`,
  `current_observation`, `history_grounded` (held-out family),
  `shuffled_history`, and `same_family_predictor` as diagnostic; join and
  score. Blocked by: C2-9.
- **C2-11 = S2-4** — `research-decision/v1` with `what_not_to_do_next`;
  negative results preserved as first-class artifacts. Blocked by: C2-10.

Budget shape (from the implementation plan section 4): roughly 200-300
provider calls for the batch plus predictor arms, modelscope-api Qwen as
the focal family, different-family predictors; re-estimate in the C2-8
preflight before any spend.

## 7. Testing Decisions (addendum)

The implementation plan section 6 remains binding. Additions for cycle 2:

- the C2-1 extraction is behavior-locked by the existing
  `probe:social-cycle` suite before the live runner exists — the
  extraction commit must not change any test expectation;
- the labeler (C2-4) gets the densest unit coverage in this cycle: every
  codebook class it can emit needs at least one positive and one
  keyword-without-evidence negative case on live-shaped fixtures;
- leakage checks (C2-5) are tested in both failure directions: a real
  leak fails, a benign chat token passes;
- live smokes (C2-1, C2-G) are integration truth; their artifacts, not
  test green, are the Phase A exit evidence — mirror of the S1-7 rule;
- mock-heavy simulations of provider or Mineflayer behavior remain
  banned.

## 8. Out Of Scope

Everything in the implementation plan section 8, plus for this cycle:

- refactoring `runSocialCycle` beyond the per-turn core extraction;
- any scoring/metric change (the scorer is locked by tests; changes
  require a central-plan amendment first);
- new artifact schemas beyond `seed-reset-record/v1` instances and the
  live-session variants already named in the implementation plan;
- performance work on the live runner beyond what a 2-3 bot session
  needs.

## 9. Document Maintenance

Tier 1 (see `research-documentation-hierarchy.md`). Check acceptance
boxes here and in the implementation plan in the same commit as the
landing slice. When C2-G passes, record the artifact path here. When
C2-11 produces the `research-decision/v1`, both this file and the
implementation plan become historical and the decision doc takes over
routing.
