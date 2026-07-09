# Lived Vs Told: Implementation Plan

Status: ACTIVE implementation plan for the active central plan.

Search token: `LIVED_VS_TOLD_IMPLEMENTATION_PLAN`. Also: `SESSION_A_BUILD`,
`SESSION_B_PILOT`, `HISTORY_DELIVERY_LADDER`, `DEPTH_NOT_SCALE`.

Recorded: 2026-07-10 (`Asia/Seoul`).

Authority: subordinate to `AGENTS.md` and to
`central-plan-lived-vs-told-social-history.md` (`ACTIVE_CENTRAL_PLAN`).
This document expands section 9 of the central plan into a work breakdown
with seams, decisions, slices, and acceptance criteria. If the two
documents disagree, the central plan wins and this file must be updated in
the same change. It replaces `embodied-co-actor-legibility-implementation-plan.md`
and `legibility-cycle-2-live-substrate-work-plan.md` as the active work
order; both remain as audit trail.

## 0. TL;DR

The V2 substrate is real and healthy: a 2-3 bot shared session with
per-actor provider routing, cross-actor observation, structured chat
capture, non-vacuous response windows, evidence-grounded labeling,
allowlisted public-history export with leakage checks, declaration writer,
label-locked prediction join, and a deterministic scorer. Typecheck is
clean and the 19-test legibility suite passes (verified 2026-07-10).

Three components are mis-built for V3 and are replaced, not patched
around: the memoryless scripted responder, the label-consuming predictor
arms (including the V2 treatment arm), and the target definition that let
a focal actor's own `collect_logs` count as a material row. Everything
else carries over. Session A rebuilds the science layer provider-free;
Session B is the preregistered live pilot.

## 1. Problem Statement

The central plan needs five things the substrate cannot do today:

1. a positive control whose behavior actually depends on public history
   (the current `scripted-social` provider reads only current visibility
   and inventory — `probe/src/provider/socialActorTurnProvider.ts`,
   `scriptedSocialMaterialHint` / `scriptedSocialActorTurn`);
2. matched-pair episodes with verified state equivalence (nothing pairs
   fixtures or hashes decision-relevant state today);
3. history delivery at four rungs, including an enacted rung whose
   history lives only in the responder's own memory artifacts and whose
   end state converges to the fixture;
4. a binary `material_follow_through` target read from typed material
   evidence, with intent and execution recorded separately (today's rows
   let the focal actor's own `inventory_gain` stand in for a co-actor
   response, and the primary labels are a 10-class taxonomy);
5. observer arms that read RAW public events with no access to prior
   locked labels (today every arm in `probe/src/legibility/predictors.ts`
   consumes `PublicLabelObservation`s derived from locked labels).

## 2. Binding Premise: Depth, Not Scale

Carried unchanged from V2 (central plan 8.1). Two actors — one responder,
one scripted partner — are the measurement optimum for matched pairs.
Actor-count scale is never a remedy for weak signal. Power grows with
pairs per family per rung, nothing else.

## 3. Modules And Seams

| Module | Seam | New? | Interface (what callers must know) |
| --- | --- | --- | --- |
| Shared-session scheduler | social-cycle runner entry | carry over | N actors, per-actor `providerId` routing, slot events |
| Cross-actor observation + chat | `ObserveResult` | carry over | visible actors, structured chat events |
| History-dependent scripted responder | provider seam | replace | deterministic policy conditioned on the actor's OWN public-history record of the partner; reciprocates iff positive-arm event present |
| Scripted partner | provider seam | new | deterministic partner that performs the history-episode script (help/decline, grant/refuse, keep/break) and the current-episode request |
| Paired fixture builder + state hash | new offline + session setup | new | builds valence-paired fixtures; computes decision-relevant state hash over declared fields; emits `state-equivalence/v1` audit artifact; excludes pairs on mismatch |
| History delivery | responder context assembly | new | rung-keyed: inject nothing / templated summary / verbatim public event log / rely on enacted memory only; narration generated deterministically from the enacted episode's public event log |
| Narration equivalence audit | new offline artifact | new | fact-subset check against source event log, valence symmetry, token-count tolerance (`narration-audit/v1`) |
| `material_follow_through` scorer | typed material evidence | new | binary target per pair from `material-access-evidence/v1` within N declared slots; intent (chosen action) and execution (tool result) recorded separately |
| Raw-event observer arms | public-history export | new | LLM arms consume allowlisted RAW events strictly before the decision slot; never labels; deterministic V2 arms rerun as baselines only |
| Declaration writer + scorer | offline | extend | new required fields (central plan section 4); paired McNemar + grouped bootstrap replace the stratified stack |

Seam decisions worth recording:

- **The responder's history input is its own evidence trail.** At the
  enacted rung the responder receives no injected history; whatever its
  memory pipeline wrote during the history episode is the treatment. The
  injection path used by narrated rungs is a separate context-assembly
  branch that is provably empty at the enacted rung (asserted in tests).
- **The partner is scripted at every rung.** Only the responder is a live
  LLM in Session B. This keeps valence arms exactly symmetric and keeps
  provider spend at one live actor per episode.
- **Public history remains the only observer surface.** The raw-event
  restriction is enforced by the exporter allowlist plus a new negative
  test: an export containing any `*_label_locked` or prediction event kind
  must be rejected as observer input.

## 4. Salvage Verdicts On V2 Components

| Component | Verdict | Reason |
| --- | --- | --- |
| shared-session scheduler, routing, slot events | reuse as-is | condition assignment stays a routing fact |
| cross-actor observation, chat capture | reuse as-is | raw material for public history and enacted memory |
| response windows | demote | substrate hygiene + diagnostics; not the headline label authority |
| evidence-grounded labeler (C2-4) | reuse pattern | `material_follow_through` must follow the same typed-evidence-only rule |
| public-history export + allowlist + leakage checks | extend | add raw-event-only observer view; reject label events as observer input |
| `predictors.ts` label-count arms | demote to baselines | they are the policy-copy/actor-id/majority baseline family; never treatment |
| scorer + declaration writer | rework | paired statistics and new declaration fields |
| `scripted-social` responder | replace | memoryless; contradicts the positive-control requirement |
| transition-row/v1, seed/reset provenance, label locking | reuse as-is | evidence rules unchanged |
| C2-G artifacts | freeze | audit trail of the V2 failure; never research data |

## 5. Work Breakdown: Vertical Slices

`bun test` and `bun run typecheck` (in `probe/`) green is an implicit
acceptance criterion on every slice.

### Session A — provider-free science layer

**A1. History-dependent scripted responder + scripted partner**

- What: replace the positive control; add the deterministic partner that
  enacts history scripts and issues the current-episode request.
- Acceptance:
  - [ ] the responder's decision is a pure function of (its public-history
        record of the partner, the current request) — verified by feeding
        identical current states with flipped histories and observing the
        follow-through flip;
  - [ ] no private fields are read; determinism under seeded reruns;
  - [ ] routing treats both as ordinary providers.

**A2. Paired fixtures + decision-relevant state hash**

- What: valence-paired fixture builder; `state-equivalence/v1` artifact;
  exclusion on hash mismatch.
- Acceptance:
  - [ ] narrated-rung pairs are byte-identical on all declared fields;
  - [ ] a deliberately perturbed fixture (one inventory item off) is
        excluded with the deviation recorded;
  - [ ] hash fields and equivalence classes come from the declaration,
        not code defaults.

**A3. History delivery ladder**

- What: narration generator (fixed template from the enacted episode's
  public event log), context-injection branch for narrated rungs,
  enacted-episode runner with state normalization steps, and the
  `narration-audit/v1` artifact.
- Acceptance:
  - [ ] both narrations are generated from the same source log; the audit
        artifact passes fact-subset, valence-symmetry, and token-tolerance
        checks on real fixtures and fails on a deliberately leaked fact;
  - [ ] at the enacted rung the injection branch is empty (negative test)
        and the responder's workspace contains self-written memory
        referencing the history episode;
  - [ ] an enacted history episode ends state-convergent with the fixture
        per A2's hash, on at least one history family.

**A4. `material_follow_through` target + paired scorer**

- What: binary target from typed material evidence within N declared
  slots; intent vs execution split; McNemar + grouped bootstrap scorer.
- Acceptance:
  - [ ] a chat-only "yes" scores `no`; a chosen-but-failed deposit scores
        intent yes / execution no; only `material-access-evidence/v1`
        flips the target (negative tests);
  - [ ] the focal actor's own resource gains can never produce a target
        row (regression against the C2-G defect);
  - [ ] scorer output is deterministic on fixture rows.

**A5. Raw-event observer arms**

- What: observer input view (raw events only, pre-decision cutoff);
  provider-free deterministic stand-in for `llm_raw_history`; V2
  label-count arms wired as baselines on the same split.
- Acceptance:
  - [ ] observer input containing any label/prediction event kind is
        rejected (negative test);
  - [ ] input cutoff enforced by timestamps, not convention;
  - [ ] baseline arms run unchanged on the new split.

**A6. Declaration extension**

- What: new required fields per central plan section 4; scorer refuses to
  run without them; `scoop_check_ref` required before any live batch.
- Acceptance:
  - [ ] missing any new field blocks scoring with a specific error;
  - [ ] the L4 equivalence margin and hash fields are declaration-owned.

**A7. Deterministic end-to-end smoke (Session A gate = L1)**

- What: one provider-free run over >= 12 pairs (scripted responder, both
  valence arms, at least `no_history` + one narrated rung + one enacted
  family), producing the full artifact chain and a scored paired table.
- Acceptance:
  - [ ] the scripted responder's follow-through flips across matched
        histories and the paired scorer detects it (CI excluding 0);
  - [ ] a trivial raw-event observer recovers the flip above the
        state-only baseline;
  - [ ] rerun produces substantively identical artifacts;
  - [ ] runnable via one `bun run` entrypoint; artifacts land under the
        experiments tree.
- If this gate cannot pass, that is L1-shaped: fix the substrate or kill.
  No live provider spend.

### Session B — preregistered live pilot

**B1. Preflight, scoop check, declaration**

- [ ] provider quota preflight for the exact `(provider_id, model)`
      candidates; OpenAI requires dashboard or explicit user approval;
- [ ] full-text scoop-check artifact for arXiv 2605.08060 and 2602.15173
      plus a non-arXiv venue sweep, referenced by the declaration;
- [ ] declaration committed before any live episode.

**B2. Narrated rungs live batch** — byte-identical fixtures, one live
responder model, `no_history` / `narrated_summary` / `narrated_verbatim`,
>= 24 pairs total. This is the manipulation check (L2 gate) and costs the
least.

**B3. Enacted rung live batch** — only if B2 shows an effect in at least
one family; state-equivalence exclusions below the declared ceiling or L3
fires.

**B4. Label lock, observer runs, scoring** — held-out-family
`llm_raw_history` plus all baseline and null arms; join by `row_id` after
lock; paired tables per central plan 3.8.

**B5. `research-decision/v1`** — decision rules from central plan section
5; L-conditions checked explicitly; negative results preserved
first-class.

## 6. Testing Decisions

Detroit-style, behavior through the interface. Priority behaviors:

- history-flip purity of the scripted responder (A1) — this is where the
  V2 design died; it gets the densest tests;
- state-hash exclusion honesty (A2): perturbations are caught, deviations
  recorded, nothing silently passes;
- injection-branch emptiness at the enacted rung (A3);
- narration audit failure modes (A3): leaked fact, asymmetric template,
  token-count breach;
- typed-evidence-only target flips (A4), including the focal-actor
  regression;
- observer input rejection of label events and post-cutoff events (A5).

Mock-heavy provider simulations remain banned; the A7 smoke is the
integration truth and its artifacts — not test green — are the Session A
exit evidence.

## 7. Failure Handling And The L-Clock

Session A and Session B are the two focused build sessions the L3
stop-result allows for enacted-state convergence. Rules:

- A7 failing is L1-shaped: fix the substrate or kill; never proceed to
  live spend;
- B2 showing no effect anywhere is L2-shaped: preserve the negative
  result; do not run B3 to "look harder";
- B3 exclusion rate above the declared ceiling is L3-shaped: defer the
  enacted rung and return the direction to the research harness;
- >= 80% chat-only outcomes is L7-shaped: fix scenario material pressure
  within 2-3 actors — never add actors.

## 8. Out Of Scope

- persona/soul conditions of any kind (soul is a fixed constant);
- decay/interference curves as headline; at most one salience ablation;
- VLA arms, model training, fine-tuning;
- actor-count scaling beyond 3; social-pattern episodes;
- label-consuming observer arms as treatment;
- HTML reports or dashboards before data;
- new protocol documents beyond `experiment-declaration/v1` instances;
- making GPT-5.6 Sol or any specific provider a scientific dependency —
  implementation/audit roles only, per the central plan.

## 9. Document Maintenance

This plan is Tier 1. When a slice lands, update its acceptance boxes in
the same commit as the code. When the central plan changes, reconcile this
file in the same change. When Session B ends in a `research-decision/v1`,
this plan's status becomes historical and the decision doc takes over
routing.
