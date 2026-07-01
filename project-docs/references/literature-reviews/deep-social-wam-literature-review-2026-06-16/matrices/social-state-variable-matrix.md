# Social-State Variable Matrix

Owner: Lane 4 (Sociology / Social Theory Grounding). Date: 2026-06-16.

Purpose: translate each social-theory construct into Minecraft-operational
variables for a Social / Institutional World Action Model (WAM). A WAM here
predicts the joint future state and action `p(o', a | o, l)`; the rows below say
what `o'` *delta* the model would predict for a social action, and what evidence
verifies it. The repo's hard rule applies throughout: the LLM proposes, the
runtime owns physical truth, and a WAM stays advisory (it must not fill args, mark
progress true, override verifiers, or replace Actor Turn selection).

## Vocabulary reused exactly from the repo

Schemas cited below are defined in the repo (do not invent new ones):

- `MaterialClaimLedgerEntry` (fields: claim_id, holder_actor_id, target_kind,
  access ∈ {personal, claimed, public, weak_commons, unclaimed, disputed},
  evidence_refs), `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md`.
- `ObligationLedgerEntry` (kind ∈ {promise, loan, debt, repair, favor, warning,
  blocker}; status ∈ {open, fulfilled, refused, blocked, violated, superseded}).
- `PublicAffordanceLedgerEntry` (kind ∈ {crafting_table, furnace, path, marker,
  light, shelter, farm, worksite, other}; state ∈ {created, used, damaged,
  repaired, unavailable}).
- `RelationshipEdge` with `TrustCategory` {unproven, distrusted, cautious,
  reliable, trusted}, `ObligationCategory`, `DependencyCategory`,
  `FrictionCategory`, `FamiliarityCategory` {stranger, acquaintance, teammate,
  partner}, and `RelationshipEventKind` (request_made, request_accepted,
  request_ignored, resource_delivered, took_shared_resource, returned_shared_value,
  helped_unblock_task, fake_progress_rejected, verification_failed, ...), defined in
  `project-docs/runtime/actor-state-and-memory/social-actor-profiles-and-relationships.md`.
- Material-economy terms (`personal possession`, `material claim`,
  `public affordance`, `weak commons`, `unclaimed world resource`, `obligation or
  credit`) and maturity ladder (`proto-social -> organization -> settlement ->
  village -> society`), `project-docs/orientation/terminology.md`,
  `project-docs/specification/evidence-grounded-minecraft-society.md`.

A `[NEW]` tag below marks a record the repo does not yet define and that this lane
recommends adding (kept minimal, evidence-only, never runtime-enforcing).

## Matrix

| # | Social construct (theory source) | Minecraft observable | Log record / schema | Predictable delta (what a Social/Institutional WAM predicts) | Verification source | Cannot claim yet (proxy boundary) | Candidate scenario | WAM layer |
|---|---|---|---|---|---|---|---|---|
| 1 | **Social action = action oriented toward others** (Weber, *Economy and Society* 1922) | Action names another actor (request/lend/refuse) OR a verified delta changes another actor's options | `[NEW] is_other_oriented` flag on the action's Evidence Trace entry, derived from target + consequence | Action with no other-actor target/consequence -> predict no social delta; other-oriented action -> predict a relationship/obligation/claim delta | Action ref + verified inventory/block/container delta that another actor can observe | Actor's subjective meaning; which of Weber's 4 motive types drove it | (gate, not a scenario) `social-plausibility-gate` | Social |
| 2 | **Meaning of an act is interaction-constituted, not intrinsic** (Mead 1934 / Blumer 1969) | Same physical delta (e.g. logs into a chest) means gift vs payment vs claim vs storage depending on surrounding exchange | Transfer event carries a `context_ref` to the request/promise it answers (extends `resource_delivered`) | Predict the act's social meaning *only* from interaction context + history; lone delta -> no meaning assigned | Chat record + prior `ObligationLedgerEntry` / `request_made` the delta answers | That either actor "understood" the gesture as X (interpretive, not factual) | `asymmetric_knowledge_v1`, `borrowed_tool_v1` | Social |
| 3 | **Face / claim-conduct consistency** (Goffman 1959/1967/1983) | A stated commitment (chat promise, accepted request) later matched or contradicted by world evidence | `ObligationLedgerEntry.status` transition; `fake_progress_rejected` event on contradiction | Promise + later matching evidence -> trust up; promise + contradicting evidence -> face/trust-decrement + friction up | Inventory/container/block evidence vs the recorded commitment | Embarrassment / "losing face" as a felt state | `failed_promise_v1`, `broken_promise_repair_v1` | Social |
| 4 | **Exchange creates obligation; reciprocity vs imbalance->power** (Homans 1961; Blau 1964) | `lend_item` + inventory transfer from A to B; later `return_item` or loss | `ObligationLedgerEntry{kind:loan, from:B, to:A, status:open}`; transfer in `MaterialClaimLedgerEntry` (personal->claimed access) | lend -> open loan obligation; return -> fulfilled + A's trust in B up; loss/non-return -> violated + trust down + friction up; repeated unreciprocated giving -> A net-creditor standing | Later inventory return to A + `RelationshipEdge` update | "Felt indebtedness"/"gratitude"; psychological dominance (record only ledger asymmetry) | `borrowed_tool_with_return_or_debt_v1` | Material + Social |
| 5 | **Refusal as a grounded social outcome** (Blau dependence; repo non-goal "no automatic cooperation reward") | A request is declined or conditionally granted | `request_ignored` / `ObligationLedgerEntry{status:refused}` | Grounded refusal -> no obligation created, borrower must adapt; trust need not fall (a justified refusal is not a betrayal) | Chat refusal + absence of transfer + borrower's adapted next action | That refusal implies hostility or low trust (refusal can be legitimate) | `food_request_under_scarcity_v1` | Social |
| 6 | **Social capital: obligations/expectations ("credit slips")** (Coleman 1988) | Count of open obligations the actor *holds as creditor* | Creditor side of `ObligationLedgerEntry` aggregated per actor | More outstanding credit slips -> predict more leverage to get future help; expectation of reciprocation conditions A's willingness to help again | Obligation ledger over cycles | Community-level "stock of social capital" (macro claim) | `role_dependency_work_order_v1` | Social + Institutional |
| 7 | **Social capital: information channels** (Coleman 1988; Granovetter 1973 weak ties/bridges) | One actor alone has observed a resource/route/hazard and transmits it | `[NEW] information_shared` event (sender, recipient, info_kind ∈ {route, hazard, resource_location, station_state}, evidence_ref) | Share -> recipient's later behavior changes (takes route / avoids hazard); withhold -> recipient stays blocked or at risk | Recipient's later verified action (movement to the route, avoidance of the hazard) | Network-level bridging/centrality (too few actors); that info was understood vs merely received | `asymmetric_knowledge_v1`, `hazard_marker_public_safety_v1` | Social + Institutional |
| 8 | **Embeddedness: trust is relational/historical, not one-shot** (Granovetter 1985) | Trust level tracked across cycles, not reset per transaction | `RelationshipEdge.trust` (TrustCategory) updated only from evidence events | Predict next-interaction willingness/wording from accumulated edge state; a single good act moves trust at most one step | `recent_events` refs on the edge; cross-cycle continuity | A trust *number* (`trust: 0.73`), repo mandates enum categories, not floats | `open_loop_settlement_continuity_v1` | Social |
| 9 | **Familiarity / tie strength** (Granovetter 1973) | Count of shared interactions between two actors | `RelationshipEdge.familiarity` (stranger->acquaintance->teammate->partner) | More shared successful interactions -> familiarity up -> more specific memory retrieval, less generic dialogue | Counted interaction events in `recent_events` | That familiarity implies trust (repo rule: familiarity ≠ trust) | `open_loop_settlement_continuity_v1` | Social |
| 10 | **Institutions = rules of the game (formal vs informal)** (North 1990) | Formal: runtime permission gates / role contracts. Informal: claim-respect conventions, sanction patterns | Formal = `role` permission contract (runtime-owned). Informal = pattern over `MaterialClaimLedgerEntry` respect + sanction events | Formal rule blocks an action pre-execution; informal convention predicts whether others *respect* a claim (not enforced) | Gate result (formal); observed respect/violation history (informal) | That an unenforced regularity is an institution (needs enforcement evidence) | `claimed_cache_access_conflict_v1` | Institutional |
| 11 | **Material claim & its defense** (Ostrom boundaries P1; North enforcement) | An actor asserts control of a chest/station/worksite; others respect or violate it | `MaterialClaimLedgerEntry{access:claimed, holder, evidence_refs}`; violation -> `took_shared_resource` | Claim asserted -> predict others avoid it if claim is legible; violation -> conflict + friction up + possible sanction | Container snapshot, sign/marker, chat assertion; later access attempts by others | That a claim is "legitimate"/"owned" in any legal sense (only evidence-backed access control) | `claimed_cache_access_conflict_v1` | Material + Institutional |
| 12 | **Public affordance contribution** (Ostrom provision; repo `public affordance`) | A placed/modified world feature (table, furnace, path, light, bridge) another actor later uses | `PublicAffordanceLedgerEntry{kind, state:created->used}` | Create affordance -> predict another actor's later action becomes possible/cheaper (e.g. B crafts because the table exists) | Block placement record + another actor's later use evidence | That the creator intended a public good (record use, not intent) | `public_crafting_table_social_use_v1`, `public_furnace_v1` | Material + Institutional |
| 13 | **Weak commons & over-extraction cost** (Ostrom CPR; GovSim 2404.16698; repo `weak commons`) | Lightly-shared surplus that actors draw from; total draw vs a sustainability bound | `MaterialClaimLedgerEntry{access:weak_commons}`; draw events; `[NEW] over_use` flag when total draw > sustainable bound | Predict survival/depletion of the surplus and the cost imposed on others; over-use -> depletion + conflict | Container/stock snapshots over cycles; per-actor draw vs bound | A full common-pool-resource *economy* (repo deliberately demotes commons to lightweight) | `weak_commons_surplus_use_and_dispute_v1` | Material + Institutional |
| 14 | **Norm = empirical + normative expectation** (Bicchieri 2006; Elster 1989) | A behavior regularity (e.g. "return borrowed tools") + observed approval/sanction on deviation | `[NEW] NormState`{situation_type, conformity_count (empirical-exp proxy), sanction_event_refs (normative-exp proxy), violation_refs, repair_refs} | Predict conformity when both proxies are high; predict violation->sanction->repair-or-trust-loss sequence | Counted observed conforming acts + recorded sanction events in history | "Actor feels obligated"; that a convention (empirical-only) is a norm | `weak_commons_surplus_use_and_dispute_v1`, `broken_promise_repair_v1` | Institutional |
| 15 | **Sanctioning: dyadic, public, valenced** (Vinitsky et al. 2106.09012; Ostrom monitoring P4 / graduated sanctions P5) | One actor disapproves another's act (refusal, reclaim, public callout, worksite exclusion) | `[NEW] SanctionEvent`{sanctioner, target, context_ref (observed transgression), valence ∈ {approval, disapproval}, evidence_refs} | Disapproval event -> target's future behavior shifts away from the sanctioned act; repeated public sanctions -> a norm becomes legible | The sanctioning action's evidence + target's later behavior change | That sanctioning reflects an internalized group norm vs an individual reaction (claim the pattern, not the internal state) | `claimed_cache_access_conflict_v1`, `weak_commons_surplus_use_and_dispute_v1` | Social + Institutional |
| 16 | **Conflict resolution / repair** (Ostrom P6; Goffman repair; repo `repair` obligation) | After a violation/harm, a restitution or apology act with world backing | `ObligationLedgerEntry{kind:repair, status:open->fulfilled}`; `returned_shared_value` | Repair completed -> trust partially recovers + friction down; no repair -> friction persists / conflict unresolved at run end | Restitution inventory/block evidence + relationship update | That the apology was sincere (record the restitution act, not sincerity) | `broken_promise_repair_v1`, `claimed_cache_access_conflict_v1` | Social + Institutional |
| 17 | **Roles / division of labor** (March & Simon 1958) | An actor repeatedly performs a role-typed action class (gathers, crafts, audits) | `role` permission contract + repeated role-consistent action refs | Role assigned/inferred -> predict which actions this actor takes and which others depend on it for | Repeated evidence-backed actions matching the role (not the profile label) | A role from the profile label alone (repo: infer from repeated evidence) | `role_dependency_work_order_v1` | Institutional |
| 18 | **Routines / coordination persistence** (Nelson & Winter 1982) | A repeated, ordered cross-actor action pattern over ≥ N cycles (A restocks fuel before B smelts) | `[NEW] routine_observed`{actor_ids, ordered_action_refs, recurrence_count, evidence_refs} | Routine established -> predict next-cycle handoff; a skipped step -> predicted coordination failure / blocker for the dependent actor | Recurring matched action sequences across cycles | A routine from one episode; tacit routine knowledge (claim the pattern only) | `role_dependency_work_order_v1`, `open_loop_settlement_continuity_v1` | Institutional |
| 19 | **Micro->macro transition** (Coleman's boat 1986/1990) | Aggregation of individual actor turns into a settlement-level pattern (persistent claims, shared affordances, stable roles) | Cross-actor, cross-cycle aggregate over the four ledgers + maturity-ladder rung | Predict whether organization-level structure persists after any single CycleGoal completes (post-goal continuation) | Multi-actor, multi-episode ledger continuity | That a settlement/society emerged from a single run (the hardest, not-yet-supported claim) | `open_loop_settlement_continuity_v1` | Institutional |
| 20 | **Dependence drives need-based exchange** (Blau dependence; Emerson power-dependence; repo `DependencyCategory`) | My next meaningful task requires a tool/resource/station another actor controls | `RelationshipEdge.dependency` {independent, helpful, blocked_by, critical_path} computed from current goals + shared inventory | High dependence -> predict a request will be made and that the controller gains leverage; dependence shifts fast with world state | Current CycleGoal + inventory/claim state | Stable "power structure" (dependence is volatile, per-cycle, world-driven) | `scarce_food_v1`, `food_request_under_scarcity_v1` | Material + Social |

## Reading notes (honesty boundaries, condensed)

- Every "trust", "obligation", "norm" cell is a **ledger value updated from verified
  events**, never a claim about feelings. This is the lane's core caution and the
  repo's stated rule.
- `[NEW]` records (is_other_oriented, information_shared, NormState, SanctionEvent,
  routine_observed, over_use) are **post-action evidence and compact context only**.
  They must not gate execution, supply missing args, or mark progress, same
  constraint the repo places on its existing ledgers.
- The right edge of the matrix (rows 14-19, Institutional layer) is where claims
  are weakest: norms, routines, and the micro->macro transition need multi-actor,
  multi-episode evidence the repo does not yet have. They are listed as
  *predictable deltas a WAM would forecast*, explicitly not as things the current
  runtime can already demonstrate.
- Physical reliability gates social claims (shared-contract dependency): a social
  delta like "B can now mine" (row 4) is only meaningful if the Physical WAM fact
  "the lent pickaxe has durability > 0 and B received it" verifies first.
