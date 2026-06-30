# Lane 6 Brief: Repo Adaptation and Benchmark Design

Search token: `LANE_6_REPO_ADAPTATION_BRIEF`.

Date: 2026-06-16. Status: literature-synthesis deliverable. Not a runtime spec.
WAM stays advisory throughout (never executable authority).

Lane name: Repo Adaptation and Benchmark Design.

`<repo>` = `/Users/user/git/ad-agent-metrics/research/wam`.
Companion deliverable: `matrices/repo-adaptation-matrix.md` (construct -> WAM-layer map).

## Sources reviewed

Repo-internal (primary grounding, read in full):
- `SPEC.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`, repo `CLAUDE.md`/`AGENTS.md`.
- Specification: `Soul-Grounded-Social-Simulation.md`, `Evidence-Grounded-Minecraft-Society.md`, `Runtime-Evidence-And-Action-Skills.md`.
- Architecture: `Actor-Episode-And-Actor-Turn-Architecture.md`, `Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`, `Context-Projection-And-Source-Evidence.md`, `Actor-Persistent-State-And-PlanBeads.md`, `Material-Claims-And-Social-Economy-Benchmark-Plan.md`, `Grounded-Social-Trajectory-Benchmark-Spec.md`, `Research-Direction-Reference-Synthesis.md`.
- Seed: `project-docs/research-archive/2026-06-16/social-wam-research-frame.md`.
- Code (read for grounding, did not run): `probe/src/runtime/goals/actorEpisode/{types.ts,outcomeContract.ts,resolver.ts}`, `probe/src/runtime/evidence/actorEvidence.ts`, `probe/src/runtime/settlement/settlementState.ts`, `probe/src/npc/relationships/relationshipLedger.ts`, `probe/src/gameplay/primitives/registry.ts`, `probe/src/gameplay/verification/verifyTask.ts`, `probe/src/server/worldScenarios.ts`, `probe/src/objectives/socialIssues/{borrowedTool.ts,types.ts}`, `probe/src/objectives/socialTrajectory/{types.ts,scorer.ts}`, `probe/src/provider/providerQuotaPolicies.ts`.

External (breadth only, manifest + abstract per contract §5):
- ALEM, "An Efficient open world environment for multi-agent social Learning" (arXiv 2508.15679), base-vs-coordination reward separation.
- Melting Pot (arXiv 2107.06857), mixed-motive scenarios, social-dilemma scoring.
- PillagerBench (arXiv 2509.06235), Orak (arXiv 2506.03610), MineNPC-Task (arXiv 2601.05215), Odyssey (arXiv 2407.15325), confirm the active 2025-2026 Minecraft-LLM neighbor space is task/competition/memory benchmarks, not evidence-grounded social-material transition modeling.

Counts: repo docs ~13, repo code files ~12, external breadth 6 (abstract-only;
LaTeX extraction for the social/multi-agent literature is owned by Lanes 2-4).

## Strongest findings (source-backed)

1. **The repo already has the WAM seam: a pre-action expected outcome and a post-action observed-delta comparison.** `ActorTurnExpectedOutcome` (`types.ts:40-50`) is a single-channel physical forecast; `evaluateExpectedOutcomeAgainstDeltas` (`outcomeContract.ts:238-298`) compares it to `observed_deltas` from tool statuses/helper events. An advisory WAM extends the expected side to typed multi-layer deltas and is scored against the observed side. No new authority is needed; the resolver (`resolver.ts:110`) and verifier (`verifyTask.ts:39`) stay in control.

2. **The material economy is designed but unimplemented; the social channel is implemented but reactive.** Material-claim / obligation / public-affordance ledgers exist only as TS types inside `Material-Claims-...:336-365` (code grep = 0 matches, 2026-06-16). The relationship ledger (`relationshipLedger.ts`) is a real, evidence-gated enum state machine (trust/obligation/dependency/friction/familiarity) but transitions *after* observed events. So the social WAM has a verifier today (predict the enum transition, compare); the material WAM has no typed `o'` yet.

3. **The existing social benchmarks are decision-only and keyword-scored, they are the seed, not the target.** `borrowed_tool_with_return_or_debt_v1` (`borrowedTool.ts`) is `evidence_scope: "provider_decision_only"`, `live_minecraft_server: false`, scores social quality with `textIncludesAny` substring matching (`:254,276,309,357`). The repo's own notes say a live version must add physical handoff/use/return evidence (`:510`), and SPEC forbids prose parsing as policy (`SPEC.md:131`). The grounded trajectory scorer (`socialTrajectory/scorer.ts`) is provider-free, has a 14-type evidence-ref'd event ledger with chronological scoring, and is the right schema to grow into a transition log.

## Weak or uncertain claims (could not verify)

- I did not run the runtime or read live report JSON, so I cannot confirm what fraction of turns currently emit a usable `social_delta` expected outcome vs `record_blocker_or_done`. The 2026-06-04 50-cycle run is reported single-actor with empty PlanBead packets (`CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md:254-261`); whether any cross-actor social event has ever been logged live is unverified.
- The two-actor orchestration ("add a small live two-actor layer", `Material-Claims-...:251`) is described as not-yet-built; I confirmed `worldScenarioIds` has no two-actor scenario, but I did not exhaustively read `mutual/skillVillage` to confirm it cannot be reused. The benchmark plan itself says that path is "flat-world/OpenAI-Codex-oriented and does not execute generated Minecraft skills as live social evidence" (`:251`).
- External benchmark numbers (ALEM, Melting Pot) are abstract-only; I did not extract their exact metric formulas.

## Benchmark families (build on the repo seeds + ladder)

Design principle: a family is a parameterized scenario class that produces a
specific kind of social-material transition the WAM must predict and the runtime
must verify. Each family states: WAM layer(s); candidate action(s) whose deltas
are predicted; verified evidence that confirms/refutes; metrics; failure/overclaim
boundary; minimum runtime artifacts. Families map onto the existing ladder
(competence gate -> dyadic material claim -> asymmetric knowledge -> weak public
affordance -> mixed-motive -> post-goal continuation,
`Research-Direction-Reference-Synthesis.md:240-252`).

**Competence gate is not social contribution.** Passing a gate proves the
physical substrate can act; it is never a society claim
(`Material-Claims-...:180`, `Evidence-Grounded-...:250`). The WAM's physical
layer must be reliable on gates before material/social predictions are scored,
because a social claim depends on a physical fact (lane contract §3).

### Family 0: `competence_gate` (Physical WAM only; ladder layer 0)

- WAM layer: P. Calibration, not social.
- Candidate actions: `collect_logs`, `craft_item`, `craft_with_table`, `place_block`, `mine_block`, `deposit_shared` (single actor).
- Predicted delta: physical only (inventory/block/position/equipment delta kind + count/target).
- Verified evidence: `verifyTask` before/after (`verifyTask.ts`); outcome contract `satisfied`.
- Metrics: physical-delta prediction accuracy; verified-action completion rate; recovery after blocker; cost/cycles to milestone.
- Failure/overclaim boundary: passing is NOT social progress. Do not report gate pass as society. Fixture resources are `credited_as_actor_progress: false`.
- Min artifacts: world-scenario manifest, evidence trace, verifier output, provider usage. (All exist today.)
- Reuses: `wooden-pickaxe-flat-benchmark-v1` / `roofless-hut-flat-survival-v1` (`worldScenarios.ts`).

### Family A: `borrowed_tool_v1` (Material + Social; ladder layer 1, dyadic material claim)

- WAM layers: M (possession/access transfer, return obligation), S (request/lend/refuse/return/trust update). Depends on P (the borrower must physically use the tool).
- Candidate actions: `request_item` -> `lend_item` | `refuse` | `lend_with_condition` -> physical `use` -> `return_item` | leave `debt`/`repair`.
- Predicted deltas: M = possession of tool moves owner->borrower (temporary access, not ownership), durability may drop, owner blocked from own work until return; S = obligation created (open), trust delta on return vs loss/delay.
- Verified evidence: inventory/container delta for the transfer + use + return (the live gap today); relationship-ledger transition (`returned_shared_value` -> trust up, obligation fulfilled; `request_ignored` -> overdue, friction up); chat event with speaker/target.
- Metrics: obligation lifecycle completion (request -> accept/refuse -> attempt -> fulfill/block/defer -> later use); material-flow correctness (who had it -> who used -> who returned, with refs); social-delta prediction accuracy vs the enum transition; communication-action coherence (chat claim matches physical action).
- Failure/overclaim boundary: do not reward unconditional cooperation; a grounded refusal or conditional loan can score higher than ungrounded generosity (`Material-Claims-...:115`, `borrowedTool.ts:508`). A provider-decision-only run is NOT a society claim. Keyword scoring must be replaced by typed-delta + ledger scoring.
- Min artifacts (gap): material-claim + obligation ledgers (UNBUILT), live inventory/container deltas, two-actor scenario. Today only the decision smoke exists.
- Reuses + extends: `objectives/socialIssues/borrowedTool.ts` (decision schema, obligation/relationship fields) -> live `open_world_live_borrowed_tool_v1` (`Material-Claims-...:199`).

### Family B: `asymmetric_knowledge_v1` (Social + Institutional; ladder layer 2)

- WAM layers: S (clarify/inform/warn), I (role/expertise dependency). Depends on M (the known thing is a resource/route/station).
- Candidate actions: one actor knows a resource location / recipe / hazard; `say`/`request`/`announce` to communicate or exploit it; partner acts on it.
- Predicted deltas: S = information transfer creates a dependency edge (`dependency: helpful/critical_path`) and possibly an obligation; I = a role differentiation signal (the knower becomes a source).
- Verified evidence: chat event tied to a world fact (scan ref for the location/station), then the partner's verified physical action at that location (cross-actor causality: B acted because A informed). World-scan `absence_claims_exhaustive` bounds what was actually knowable.
- Metrics: clarification quality; handoff quality; cross-actor dependency edge count with evidence confidence; whether the informed actor's next action used the information (continuity).
- Failure/overclaim boundary: do not hardcode a global planner that routes the knowledge (lane caution: no hidden domain planner). Asymmetry must come from scenario seeding (different start inventory/position/scan), not from a runtime that tells B what A knows.
- Min artifacts (gap): two-actor scenario; cross-actor causality link in the event ledger (the trajectory scorer has `cross_actor_causality` as a harness dim, `socialTrajectory/types.ts:80`).
- Reuses: relationship `dependency` enum; world-scan evidence; trajectory event ledger.

### Family C: `public_furnace_v1` (Material + Institutional; ladder layer 3, weak public affordance)

- WAM layers: M (a placed world object expands others' options at low social cost), I (public-affordance creation + maintenance).
- Candidate actions: `place_block` (furnace/table/path/marker); another actor later `use`s it; possibly `damage`/`repair`.
- Predicted deltas: M = a public affordance is created (new affordance available to others), not personal possession; I = a public-affordance ledger entry `created` -> later `used` by a different actor.
- Verified evidence: block-placement evidence (`place_block:placed`), then a different actor's verified use at that block (e.g. `craft_with_table` succeeds because the table exists). World-state scan shows the affordance.
- Metrics: public-use event (did another actor use it); contribution ledger; misuse/repair handling; cross-actor consequence (B crafted because A placed).
- Failure/overclaim boundary: weak commons / public affordance must stay lightweight; do NOT turn the shared furnace into a central economy (lane caution: demote heavy shared-commons; `Evidence-Grounded-...:263`). Social value here is a world affordance, not an item transfer.
- Min artifacts (gap): public-affordance ledger (UNBUILT); two-actor scenario; affordance-use detection (a different actor acts on a block a first actor placed).
- Reuses: `place_block`/`build_pattern` primitives; settlement known-positions; structure-progress summary.

### Family D: `scarce_food_v1` (Material + Social; ladder layer 4, mixed-motive)

- WAM layers: M (scarcity, hoarding vs sharing, cost imposed on others), S (need-driven request, refusal, prioritization, repair). Depends on P (hunger/vitals).
- Candidate actions: one actor has scarce food; another is hungry; `request` -> `lend`/`refuse`/`share` -> `consume`.
- Predicted deltas: M = scarce possession moves or is withheld (cost imposed if withheld); S = obligation/trust delta; vitals (food) delta for the consumer (P).
- Verified evidence: inventory delta (food moves), vitals delta (`consume_item:consumed`, food rises), relationship transition. Mixed-motive: both actors have a real LifeGoal need for the same scarce resource.
- Metrics: fairness/efficiency tradeoff; refusal groundedness; repair quality; relationship update; whether scarcity produced visible conflict (not silent failure).
- Failure/overclaim boundary: scarcity must be real (limited fixture/world food), not narrated. Do not reward sharing by default; a grounded refusal under genuine need can be correct. Do not model a global allocator.
- Min artifacts (gap): material-claim ledger with scarcity; vitals capture in transition record; two-actor scenario with a genuine shared scarce resource.
- Reuses: `consume_item` primitive + `eatFoodWhenHungry` postcondition; relationship friction/trust enum; food-candidates field in current state (`types.ts` vitals).

### Family E: `failed_promise_v1` (Social + Institutional; ladder layer 4-5)

- WAM layers: S (promise -> failure -> explanation -> restitution -> trust update), I (norm: promises persist beyond one action).
- Candidate actions: `promise`/`accept` -> attempt that `blocked`/`failed` -> `say` explanation -> `repair`/restitution.
- Predicted deltas: S = obligation goes `accepted` -> `overdue` (on failure) -> `fulfilled` (on repair) or trust degrade (on ignore); the relationship ledger has exactly these transitions (`request_accepted`, `verification_failed` -> overdue + friction up, `helped_unblock_task` -> repair).
- Verified evidence: the failed physical attempt (verifier `failed`/`blocked`, fake-progress rejection if prose laundered it), then a later evidence-backed restitution action; obligation transition cites prior event.
- Metrics: failure recovery + repair quality; obligation lifecycle through `overdue` -> resolution; memory continuity (later turn cites the broken promise); did trust degrade truthfully on a laundered claim (negative control).
- Failure/overclaim boundary: a broken promise must produce a truthful blocker, not a fake completion (`SPEC.md:269`); this family is the strongest test that the WAM does not launder weak evidence into progress.
- Min artifacts (gap): obligation ledger with `violated`/`repair` states; cross-cycle continuity link. Relationship enum already supports the trust/obligation transitions.
- Reuses: relationship `obligation`/`trust` enum + `verification_failed`/`fake_progress_rejected` event kinds; fake-progress evidence (`actorEvidence.ts:62`); PlanBead `obligation`/`relationship_repair` kinds for continuity.

### Family F: `claimed_chest_v1` (Material + Social; ladder layer 1-4)

- WAM layers: M (personal/claimed container, claim violation), S (request access, apology, restitution).
- Candidate actions: one actor controls a chest/cache; another `request`s access or takes from it; `allow`/`refuse`/`contest`/`apologize`/`restitute`.
- Predicted deltas: M = access state of a container (`claimed` -> `disputed` on unauthorized take); S = trust degrade (`took_shared_resource` -> trust down, friction up) or fulfilled access (`returned_shared_value`).
- Verified evidence: container snapshot before/after (`inspect_chest`, `deposit_shared`/`withdraw_shared`), relationship transition, chat request/apology.
- Metrics: claim clarity (was access explicit enough for the other to request vs silently take); conflict-and-repair handling; cross-actor consequence.
- Failure/overclaim boundary: silently taking is a claim violation, not a neutral transfer; the benchmark must distinguish claimed access from weak commons (`Evidence-Grounded-...:263-274`). Personal possession is the default ownership baseline.
- Min artifacts (gap): material-claim ledger with `access` field (`personal/claimed/public/weak_commons/disputed`, designed `Material-Claims-...:337`); two-actor scenario.
- Reuses: chest primitives + `inspectSharedChest`/`depositSharedItems` postconditions; relationship `took_shared_resource`/`returned_shared_value` events.

### Ladder mapping summary

| Ladder layer (Research-Direction-Reference-Synthesis.md:240) | Family | WAM layers | Build order |
| --- | --- | --- | --- |
| 0. Competence gate | `competence_gate` | P | exists (calibration) |
| 1. Dyadic material claim | `borrowed_tool_v1`, `claimed_chest_v1` | M, S (on P) | **FIRST** (A), then F |
| 2. Asymmetric knowledge | `asymmetric_knowledge_v1` | S, I (on M) | after two-actor live |
| 3. Weak public affordance | `public_furnace_v1` | M, I | after affordance ledger |
| 4. Mixed-motive | `scarce_food_v1`, `failed_promise_v1` | M, S, I | later (E is strong negative-control) |
| 5. Post-goal continuation | (continuation overlay on any family) | I | last; needs PlanBeads populated |

## Metrics (per `Research-Direction-Reference-Synthesis.md:258-282`, repo-grounded)

Primary outcome families (not the diagnostic `no_progress`/`verified`/`blocked` labels):
- **Transition prediction accuracy** (the WAM-specific metric): predicted delta vector vs observed delta vector, per layer (P/M/S/I). Scored against `verifyTask` + relationship-ledger transition + (future) material/obligation ledger. This is the only metric unique to adding a WAM; everything else is shared with the benchmark plan.
- Obligation lifecycle completion (request -> accept/refuse -> attempt -> fulfill/block/defer -> later use).
- Material-flow correctness (who had item -> who used/returned -> evidence refs).
- Cross-actor dependency (one actor's action changed another's options, with evidence confidence).
- Communication-action coherence (chat claim matches physical action/blocker), the trajectory scorer's `chat_action_coherence` harness dim.
- Memory/relationship continuity (later action cites prior social evidence).
- Post-goal continuation (activity after a local success).
- Efficiency: provider calls, tokens, cost, latency, action count, cycles-to-milestone. **Note: predict-then-act doubles provider calls; budget against `providerQuotaPolicies.ts`.**
- Robustness: behavior under natural seeds, blockers, partial observability, repeated runs.

Borrow from external breadth (only where Minecraft material constraints make them
real): base-vs-coordination separation (ALEM 2508.15679), score physical
competence separately from social/material consequence so a model that completes
a task fast but ignores obligations does not win; mixed-motive scoring that does
not reward unconditional cooperation (Melting Pot 2107.06857).

## Minimum runtime artifacts (per family, consolidated)

Exists today: world-scenario manifest, evidence trace, verifier output, provider
usage/quota, relationship ledger, settlement state, actor memory, PlanBead
ready-front, chat events, world-state scan refs.

Must be added before any M/S family logs a clean transition:
1. `PredictedTransition` artifact (typed P/M/S/I deltas + confidence) attached pre-action at the `outcomeContract`/`evidence-trace` seam.
2. Material-claim + obligation + public-affordance ledgers (designed `Material-Claims-...:336-365`, unbuilt).
3. A paired transition row joining predicted + observed + evidence refs in `evidence-trace/v1`.
4. A two-actor live scenario in `worldScenarioIds` (e.g. `open_world_live_borrowed_tool_v1`).
5. Generic before/after state snapshots (extend `ActorEvidenceRecord` pre/post beyond position).

## Recommended next questions

1. Should the `PredictedTransition` be a separate provider call (predict, then a fresh Actor Turn acts) or a single call that emits both a tool choice and a richer delta forecast? The former doubles cost but keeps the WAM cleanly advisory and ablatable; the latter is cheaper but risks coupling prediction to selection. (Cost realism: `providerQuotaPolicies.ts`.)
2. Can the social WAM be evaluated *now*, before the material ledgers exist, using only the relationship-ledger enum transitions as the verifier? (Likely yes, this is the cheapest first prediction experiment.)
3. Is `mutual/skillVillage` salvageable for two-actor live runs, or does the new two-actor layer need to be built fresh on `socialCycleRunner`? (Benchmark plan implies fresh: `Material-Claims-...:251`.)
4. What is the minimum negative-control set so the benchmark proves the WAM is not just dialogue plausibility? (Family E `failed_promise_v1` + the fake-progress rejection path are the strongest candidates.)
