# Repo Adaptation Matrix (Lane 6)

Search token: `LANE_6_REPO_ADAPTATION_MATRIX`.

Date: 2026-06-16. Status: literature-synthesis deliverable. Not a runtime spec.

Maps each existing repo construct in `minecraft-llm-agent-community`
(`<repo>` = `/Users/user/git/ad-agent-metrics/research/wam`) onto the 4-layer
hierarchical WAM and states, per construct: WAM layer(s) touched; role in a WAM
(input / predict-target / verifier / advisory); what exists today (cited to repo
files); what is missing to log a clean transition record; and whether the
construct is **mechanically useful** (engineering the repo can borrow now) versus
a **research claim** (what would be a novel contribution and must not be
overclaimed).

WAM layers (from the shared lane contract, after WAM survey arXiv 2605.12090):
- **P** = Physical WAM: movement, mining, crafting, placing, inventory/block/vitals deltas, tool durability, affordance gain/loss.
- **M** = Material/Economic WAM: possession, control of tool/station/container/place, scarcity, claims, borrow/lend, weak commons, public affordance, cost imposed on others.
- **S** = Social WAM: request, promise, refusal, accept, warn, handoff, return, repair, blame, gratitude, trust, reputation, obligation, future social cost.
- **I** = Institutional/Settlement WAM: roles, routines, conventions, norms, public-affordance maintenance, settlement persistence, post-goal continuation.

WAM definition used (advisory only): `p(o', a | o, l)` with (1) forward
predictive modeling of `o'` and (2) action generation coupled to anticipated
`o'`. In this repo `o` = typed Minecraft + social state, `o'` = predicted
social-material deltas. The repo's hard rule is that the LLM proposes and the
runtime owns physical truth; a WAM must stay advisory and never fill args, mark
progress, override verifiers, or replace Actor Turn selection
(`SPEC.md:250`, `CLAUDE.md` "Project Direction", social-wam-research-frame.md:64).

---

## 1. Where a WAM prediction attaches (the seam)

The repo already has a pre-action expectation and a post-action evidence
comparison. This is the natural advisory-WAM seam; the gap is that the
expectation is a single coarse physical enum, not a typed multi-layer delta with
confidence.

| Stage | Repo construct (file) | What it holds today | WAM role |
| --- | --- | --- | --- |
| Pre-action expectation | `ActorTurnExpectedOutcome` enum, `probe/src/runtime/goals/actorEpisode/types.ts:40-50` | one of `world_block_delta`, `inventory_delta`, `equipment_delta`, `position_delta`, `social_delta`, `diagnostic_unlock`, `record_blocker_or_done`. Default derived per primitive/skill in `outcomeContract.ts:120-164`. | This is a **degenerate physical-WAM forecast** already present: a single expected `o'` delta kind, no magnitude, no confidence, no material/social/institutional channel. |
| Post-action evidence | `evaluateActorTurnOutcomeContract` / `evaluateExpectedOutcomeAgainstDeltas`, `outcomeContract.ts:226-298`; verifier `gameplay/verification/verifyTask.ts:39` | computes `observed_deltas` from tool statuses + helper events, compares to expected, returns `satisfied | diagnostic_only | recorded | blocked | unsatisfied`. | This is the **verifier** the WAM is scored against: predicted `o'` vs verified `o'`. |
| Fake-progress rejection | `buildFakeProgressRejectionEvidence`, `runtime/evidence/actorEvidence.ts:62-81` | records pre/post position, tool attempt, verifier reason, missing delta when prose claimed success but verifier found no delta. | The **negative control** for a WAM: a transition the WAM might have predicted but evidence refutes. |

**Advisory attachment rule (interpretation, flag as such):** a WAM lane predicts
a typed `PredictedTransition` for the candidate action *before* the resolver
executes, stores it as an actor-workspace artifact, then a post-action evaluator
compares it against the same `observed_deltas` the outcome contract already
computes. The WAM never gates execution; the resolver
(`resolver.ts:110`) and verifier remain authority. This satisfies the repo
invariant that prediction is context, not authority
(`Context-Projection-And-Source-Evidence.md:89-110`).

---

## 2. Construct-by-construct map

### 2.1 Actor Turn and action selection

| Construct (file) | WAM layer(s) | Role in WAM | Exists today | Missing to log a transition record | Mechanically useful vs research claim |
| --- | --- | --- | --- | --- | --- |
| Actor Turn LLM tool selection (`turnInput.ts`, `provider/socialActorTurnToolParser.ts`, `Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`) | P, M, S | **action generator** `a` in `p(o',a|o,l)`. The "coupled action generation" half of the WAM criterion. | One function-tool call per turn: a visible Action Card or `author_mineflayer_action`, with schema-bound `parameters` + rationale (`why_this_tool`, `success_evidence`, `failure_handling`). | Nothing for action capture itself. To make a transition record clean, the *chosen* action plus its `expected_outcome` must be persisted next to the predicted delta and the observed delta in one record keyed by `turn_id`. Today these live in three artifacts (provider output, outcome-contract eval, evidence trace). | Mechanically useful: the single-tool-call boundary is the cleanest possible `a`. Research claim would be: does an advisory WAM forecast improve action selection (continuity, fewer repeated blockers) without laundering progress. |
| `ActorTurnExpectedOutcome` enum (`types.ts:40-50`) + defaults (`outcomeContract.ts:120-164`) | P (mostly), S (only `social_delta`) | **predict-target stub** | Coarse single-channel expected `o'`. `social_delta` collapses say/deposit/withdraw into one kind. No material or institutional channel. | A typed multi-channel predicted delta: physical (item/count/block/pos), material (possession/claim/access change, cost imposed), social (obligation/trust/relationship change), each with confidence. The enum is the hook to extend. | Mechanically useful as the attach point. Research claim: a structured social-material transition vocabulary that is verifiable, not just a richer label set. |
| `author_mineflayer_action` + codegen (`provider/socialActorTurnCodegenProvider.ts`, `skills/generated/**`) | P | action generator for novel physical behavior | Full-context codegen produces source + input_schema + verifier + timeout + helper allowlist + promotion policy. | A generated skill should declare its expected delta kind so a WAM can predict and the trial can confirm. Today `defaultExpectedOutcomeForActionSkill` infers the kind by regex on the skill id (`outcomeContract.ts:147-164`), brittle. | Mechanically useful: trials already produce verifier evidence. Avoid overclaim: generated-code authoring is not a WAM; it is the action surface the WAM predicts over. |
| Runtime Action Resolver (`resolver.ts:110`) | P, M | **gate / verifier-adjacent** | Maps Action Card to primitive or action skill, validates params/schema/source, rejects missing args. Explicitly not a planner; no prose parsing. | A resolver-time hook to attach the predicted transition record without granting it authority (the resolver must stay the executable gate). | Mechanically useful: the rejection path is itself a transition outcome (`rejected_by_contract`). Research claim: none; this is substrate. |

### 2.2 Evidence and verification

| Construct (file) | WAM layer(s) | Role in WAM | Exists today | Missing to log a transition record | Mechanically useful vs research claim |
| --- | --- | --- | --- | --- | --- |
| `verifyTask` (`gameplay/verification/verifyTask.ts:39`) | P, M | **verifier** of `o'` | Before/after observation diff per task: inventory counts, nearby blocks, shared-chest snapshot, actor distance. Rejects fixture/pickup side effects (mine must show dig + delta). Returns `passed | progressing | failed`. | Verifier is task-keyed (`deposit_shared_materials`, `collect_4_logs`, etc.), not transition-keyed. A WAM transition record needs a generic before/after capture for any action, including social/material state, not just the curriculum tasks. | Mechanically useful: this is the gold signal for prediction accuracy. Research claim: extending verification to material-claim and obligation state transitions (not yet present). |
| `evidence-trace/v1` (`Actor-Episode-And-Actor-Turn-Architecture.md:499-520`) | P, M, S | **transition log (partial)** | Per-turn outcome enum (`verified_mutation`, `partial_verified_progress`, `blocked`, `rejected_by_contract`, `timed_out`, `no_progress`, `environment_blocked`) + refs to gate/execution/verifier/post-observation. | This is the closest thing to a transition record but it logs *outcome class*, not *predicted-vs-observed delta vectors*. Add a `predicted_transition_ref` and `observed_transition` so a row is a clean `(o, a, predicted o', observed o')`. | Mechanically useful: already per-turn, already ref-linked, already restart-safe. **This is the single best place to grow the transition record.** Research claim: the transition dataset itself (paired prediction/evidence) is the support layer, NOT the contribution (lane contract §0; research-frame:169). |
| `ActorEvidenceRecord` (`runtime/evidence/actorEvidence.ts:30-44`) | P | evidence store | Diagnostic categories incl. `fake_progress_rejection`, `world_state_scan`, `verification_failure`, `action_parameter_contract_failure`. Holds pre/post position, tool attempt, missing delta. | Generalize `pre_position`/`post_position` to a `pre_state`/`post_state` snapshot ref so non-movement deltas (inventory, claim, obligation) are captured the same way. | Mechanically useful. Research claim: none; pure substrate. |
| World-state scan + loaded-chunk limits (`actor-turn-current-state/v1.world_scan`, `types.ts:344-366`; `Runtime-Evidence-And-Action-Skills.md:32-60`) | P | **input `o`** + uncertainty source | Scan id, center, radius, vertical range, `absence_claims_exhaustive`, `truncated`, nearest examples, limitations. | Nothing missing for input; this is well-formed. For a WAM, the loaded-world limit is the explicit uncertainty/blocker channel the prediction must respect (cannot predict over unloaded chunks). | Mechanically useful: scoped absence is exactly the "uncertainty and blockers" output the research-frame asks for (research-frame:131). Research claim: none. |

### 2.3 Material, social, institutional state

| Construct (file) | WAM layer(s) | Role in WAM | Exists today | Missing to log a transition record | Mechanically useful vs research claim |
| --- | --- | --- | --- | --- | --- |
| Relationship ledger (`npc/relationships/relationshipLedger.ts`) | S | **social state `o`/`o'`** | Enum edges: trust (5), obligation (5: none/requested/accepted/overdue/fulfilled), dependency (4), friction (5), familiarity (4). 12 evidence-backed event kinds; every transition requires `evidence_refs` (`relationshipLedger.ts:206,229`). Deterministic transition functions per event kind. | The ledger transitions *reactively* from observed events. A social WAM needs the *predicted* obligation/trust delta for a candidate social action before the event fires, then compares. The enum transition table is the verifier for the social channel. | Mechanically useful: this is a ready-made, evidence-gated social-state machine and a strong verifier for social-delta prediction. Research claim: whether a model can predict these enum transitions ahead of acting (social forward model). |
| Settlement state (`runtime/settlement/settlementState.ts`) | M, I | **material/institutional state `o`** | Consolidates inventory counts, shared-storage snapshot, known positions (table/chest/shelter), blocker histogram, structure progress, checklist. Computed from artifacts, not prose. | It is shelter/storage-centric (checklist items are crafting_table/shelter/shared_storage). For material-WAM it needs possession/claim/access fields, not a settlement checklist. The repo docs already flag shared-storage as only one weak-commons implementation and demote it (`Evidence-Grounded-Minecraft-Society.md:263-274`). | Mechanically useful: known-positions + inventory are real material inputs. Avoid overclaim: the settlement checklist is legacy shelter scaffolding; do NOT treat it as the material economy (lane caution: demote heavy shared-commons economy). |
| Material-claim / obligation / public-affordance ledgers (`Material-Claims-And-Social-Economy-Benchmark-Plan.md:336-365`) | M, S, I | **predict-target + verifier for M/S/I** | **DESIGNED, NOT IMPLEMENTED.** Grep of `probe/src` for `MaterialClaimLedger`/`ObligationLedger`/`PublicAffordanceLedger`/`material_claim`/`obligation_ledger` returns 0 matches (2026-06-16). The TS types exist only inside the benchmark-plan markdown. | **This is the single biggest missing piece to log a clean material/social transition record.** Without these ledgers there is no typed `o'` for possession/claim/obligation/affordance to predict or verify against; only the reactive relationship enum exists. | Mechanically useful once built: post-action evidence + compact context (the plan says so, `:368`). Research claim: the contribution is the *modeled transition* over these ledgers, not the ledgers (which are support/audit infra). |
| PlanBeads (`runtime/goals/planBeads/**`, `Actor-Persistent-State-And-PlanBeads.md`) | S, I | **input `o` (open obligations/work) + post-goal continuation signal** | Restart-safe actor-owned issue graph: status/priority/deps/ready-front; `obligation` and `relationship_repair` bead kinds; closure needs evidence; guarded applier owns mutation. Latest 50-cycle run had empty bead packets (`CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md:254-261`). | For a WAM, PlanBeads are the durable obligation/continuation memory the prediction should read (what is owed, what remains open after a local goal). Missing: beads are not yet substantively populated from social events, so the institutional-layer input is thin in practice. | Mechanically useful: ready-front is exactly the "future social cost / what becomes required" context. Avoid overclaim: PlanBeads are passive context, never executable authority (`SPEC.md:181`, repo CLAUDE.md "PlanBeads Intent"); a WAM must not turn them into a planner. |
| Actor memory (`memory/**`, `source_evidence_bundle.memory_cards`) | S, I | **input `o` (history)** | Evidence-linked recall cards (working/episodic/semantic/procedural/social/beliefs). | A WAM needs prior-interaction outcomes as input; memory cards supply them but are not yet linked to a transition dataset. | Mechanically useful. Research claim: continuity (does later action cite prior social evidence) is a primary metric, not the WAM itself. |

### 2.4 Benchmark scaffolding that already exists

| Construct (file) | WAM layer(s) | Role in WAM | Exists today | Missing to log a transition record | Mechanically useful vs research claim |
| --- | --- | --- | --- | --- | --- |
| `borrowed_tool_with_return_or_debt_v1` smoke (`objectives/socialIssues/borrowedTool.ts`, `types.ts`) | M, S | **closed-issue decision probe** | 3-turn provider-decision benchmark over a fixed evidence packet. `evidence_scope: "provider_decision_only"`, `live_minecraft_server: false` (`borrowedTool.ts:483-488`). Scores request/owner-response/follow-up/evidence-grounding/continuity, 20 pts each; pass>=80. Accepts grounded refusal (`:508`). | This is the seed of family `borrowed_tool_v1` but has **no physical action, no live world, no inventory/container delta**. The notes say a future live version must add runtime actions for handoff/use/return (`:510`). It also scores text via `textIncludesAny` keyword matching (`borrowedTool.ts:254,276,309,357`), a stated limitation, brittle, exactly the prose-parsing the SPEC warns against (`SPEC.md:131`). | Mechanically useful: the decision schema (`BorrowedToolDecision`) and obligation/relationship update fields are a clean social-action vocabulary. Avoid overclaim: a provider-decision smoke is NOT social simulation (`Material-Claims-...:41`); keyword scoring must not become runtime truth. |
| Grounded social trajectory scorer (`objectives/socialTrajectory/scorer.ts`, `types.ts`) | M, S | **provider-free ledger scorer** | 14-type event ledger (`request`/`promise`/`refusal`/`loan`/`handoff`/`return`/`shared_*`/`craft`/`obligation_update`/`relationship_update`/`memory_write`/`blocker`); 5 score dims; chronological scoring so a craft cannot satisfy consumption before a deposit (`Grounded-Social-Trajectory-Benchmark-Spec.md:150`). Each event needs >=1 evidence ref. | The event ledger is close to a transition log but is **outcome events, not predicted/observed delta pairs**. It is the right schema to extend with a `predicted` vs `observed` field per event. Harness audit dims (chat-action coherence, cross-actor causality) are the right WAM-evaluation axes. | Mechanically useful: the event schema + chronological scoring + harness audit (`harnessAudit.ts`) are reusable for transition scoring. Research claim: the trajectory ledger is support; the contribution is whether predicted transitions match it. |
| World scenarios (`server/worldScenarios.ts`) | P, I | **environment / pressure source** | 4 scenarios: `natural-survival`, `natural-safe-spawn-v1` (fresh world, spawn validation), `roofless-hut-flat-survival-v1`, `wooden-pickaxe-flat-benchmark-v1`. Fixtures explicitly `credited_as_actor_progress: false` (`:77,82`). Single-actor; RCON setup is fixture evidence only. | No two-actor live scenario yet. `open_world_live_borrowed_tool_v1` (`Material-Claims-...:199-244`) is designed but not in `worldScenarioIds`. Needed: a fresh natural seed with two distinct Mineflayer bots to produce cross-actor material/social deltas. | Mechanically useful: fresh-world + natural-spawn validation + fixture-not-credited discipline is exactly MineStudio-style reset/record hygiene the research-frame wants (`:112`). Research claim: none; substrate. |
| Provider quota policies (`provider/providerQuotaPolicies.ts`) | (cross-cutting) | **cost/quota realism guard** | Typed per-provider/model quota matrix: OpenAI token/day pools (1M/10M), ModelScope Qwen Ambassador api-calls/month (2500/10000), Gemini/Gemma RPM+RPD windows; enforce mode; reset windows. | Nothing missing for the WAM record; quota is the constraint a benchmark run must respect. Prediction adds a second provider call per turn (predict-then-act), which doubles quota cost, must be budgeted. | Mechanically useful: cost-normalized scoring (events/social-consequence per token) is a primary metric (`Research-Direction-Reference-Synthesis.md:273`). Avoid overclaim: do not run provider-backed prediction experiments without quota preflight + operator approval (`Material-Claims-...:128`). |

---

## 3. What is MISSING to log a clean transition record (consolidated)

A clean WAM transition record is `(o, a, predicted o', observed o', evidence_refs)`.
The repo has `o` (state projections), `a` (single tool call), a coarse expected
`o'` (physical enum), and observed `o'` (outcome contract + verifier). The gaps,
in priority order:

1. **No typed multi-layer predicted-transition artifact.** The `ActorTurnExpectedOutcome` enum is the only pre-action prediction and it is single-channel physical. There is no `PredictedTransition` schema with material/social/institutional deltas and confidence. (Attach at `outcomeContract.ts` / `evidence-trace/v1`.)
2. **No material-claim / obligation / public-affordance ledgers in code.** Designed in `Material-Claims-...:336-365`, implemented nowhere (grep = 0). Without them the M/S/I channels have no typed `o'` to predict or verify (only the reactive relationship enum). **Highest-leverage missing piece.**
3. **No paired prediction/evidence row.** Prediction (expected outcome), action (provider output), and evidence (verifier/outcome contract) live in three separate artifacts keyed by `turn_id` but are never joined into one transition row. The `evidence-trace/v1` entry is the right host.
4. **No live two-actor scenario.** Cross-actor material/social deltas (the whole point of M/S layers) cannot be logged from a single-actor loop. `open_world_live_borrowed_tool_v1` is designed, not registered in `worldScenarioIds`.
5. **Generic before/after state capture.** `verifyTask` is task-keyed and `ActorEvidenceRecord` captures position deltas; neither captures arbitrary inventory/claim/obligation before/after for any action. A WAM needs uniform pre/post snapshots.
6. **Keyword scoring in the existing social smoke.** `textIncludesAny` (`borrowedTool.ts`) scores social quality by substring match, brittle and against SPEC prose-parsing rules. A transition benchmark must score from typed deltas/ledger state, not text.

---

## 4. Demotions and overclaim boundaries (repo invariants)

- **Demote heavy shared-commons economy.** Settlement checklist + shared-storage are legacy shelter scaffolding. The active economy is `personal possession + access + claim + use + obligation + trust + world consequence` (`Material-Claims-...:131-151`; `Evidence-Grounded-...:263-274`). Do not center a shared chest.
- **WAM stays advisory.** It predicts and is scored; it never fills args, marks progress, overrides the verifier, gates execution, or replaces Actor Turn selection (`SPEC.md:250`; research-frame:64).
- **Evidence is support, not contribution.** The transition dataset, ledgers, and reports are audit hygiene. The research value is the modeled social-material transition and the evaluation protocol (lane contract §0; `Research-Direction-Reference-Synthesis.md:66`).
- **No hidden domain planner.** No prose parsing for policy; no item-family/station-family/shelter-first filters; tool visibility from typed contracts only (`SPEC.md:131`; repo CLAUDE.md "Project Direction").
- **Physical reliability gates social meaning.** A social claim ("Bob can now mine") depends on a physical fact ("Bob has a pickaxe, durability > 0"). Keep the P -> M -> S -> I dependency visible (lane contract §3).
