# Sociology Grounding for a Social WAM

Owner: Lane 4 (Sociology / Social Theory Grounding). Date: 2026-06-16.

## What this file is

This file defines "social state" from social theory, then translates every concept
into Minecraft-operational variables: what can be observed, logged, predicted, and
verified, and what cannot yet be claimed. It exists to keep the project honest:
social-science concepts must become measurable Minecraft state, not decorative
theory language.

A **World Action Model (WAM)** here means a model of the joint future state and
action, `p(o', a | o, l)` (arXiv 2605.12090): it forecasts the next state `o'` and
an action aligned to it. A **Social / Institutional WAM** forecasts *social-
material* deltas (obligation, trust, claim, role, norm) and the evidence that
should exist if the transition happened. The repo's hard rule holds throughout:
the LLM proposes, the runtime owns physical truth, and a WAM stays advisory.

The full translation table is in
[`matrices/social-state-variable-matrix.md`](../../matrices/social-state-variable-matrix.md).
This file gives the theory behind each row and the honesty boundary.

## The one principle that governs everything: behavioral proxy ≠ internal state

Every social variable below is a **ledger value updated from verified events**, not
a claim about feelings.

- Trust is a `TrustCategory` enum on a relationship edge, moved only by evidence
  events. It is not a feeling and not a float (`trust: 0.73` is explicitly
  forbidden by the repo).
- An obligation is an `ObligationLedgerEntry` (a "credit slip"), not felt
  indebtedness.
- A norm is a remembered expectation grounded in observed history plus
  violation/repair events, not a hardcoded global strategy.

This is not a stylistic preference. It is the line between a defensible
measurement and an overclaim about minds the runtime cannot see.

## Layer dependency (why physical reliability comes first)

Physical predictions must be reliable before social predictions are meaningful: a
social claim like "Bob can now mine" depends on a physical fact ("Bob received a
pickaxe with durability > 0"). So the layers stack: Physical -> Material -> Social ->
Institutional. The constructs below sit mostly in the top two layers and inherit
the reliability of the two below them.

## The concepts

### 1. Weber, social action (the demarcation)

- Theory: action is "social insofar as its subjective meaning takes account of the
  behavior of others and is thereby oriented in its course" (Weber, *Economy and
  Society*, 1922). Four ideal types: instrumentally-rational, value-rational,
  affectual, traditional.
- Operationalization: an action is social iff it names another actor
  (request/lend/refuse) or its verified delta changes another actor's options (a
  placed `public affordance`, a taken `weak commons` item). This is a loggable
  `is_other_oriented` flag, and it is exactly the repo's existing
  `social-plausibility-gate` made principled.
- Honesty boundary: the runtime can classify *orientation* from evidence; it cannot
  read the actor's subjective meaning or which of the four motive types drove it.

### 2. Mead & Blumer, meaning is interaction-constituted

- Theory: people act toward things on the basis of meanings; meanings arise in
  social interaction and are handled through interpretation (Blumer 1969, on Mead
  1934). Meaning is not intrinsic to an act.
- Operationalization: the same physical delta (logs into a chest) can be a gift, a
  payment, a claim, or storage. Never assign social meaning to a lone delta;
  require an interaction context (`context_ref` to the request/promise the delta
  answers). The repo already does this: depositing into shared storage emits
  `shared_storage_updated`, but collecting logs for oneself emits no social event.
- Honesty boundary: record the interaction sequence and the most consistent meaning
  given history (labeled inference); do not assert either actor "understood" the
  gesture.

### 3. Goffman, face and claim-conduct consistency

- Theory: the interaction order has its own norms; actors manage **face** (the
  social value they claim) and keep conduct consistent with it; the **expressive
  order** keeps what is expressed consistent with face; **frames** answer "what is
  going on here?" (Goffman 1959, 1967, 1983).
- Operationalization: a promise (chat, or `request_accepted`) checked against later
  world evidence. Consistency -> trust up; contradiction -> a `fake_progress_rejected`
  event, trust down, friction up. This is the world-grounded version of "saving
  face," and it is the mechanism behind `failed_promise_v1`.
- Honesty boundary: record the consistency violation and the ledger update; do not
  claim the actor "felt embarrassment" or "lost face."

### 4. Homans & Blau, social exchange

- Theory: elementary social behavior is two people where one rewards or punishes
  the other; rewarded actions recur (Homans 1961). Incurring obligations and
  reciprocating builds bonds; **unilateral** benefit creates **imbalance** that
  engenders superior standing/power (Blau 1964). Social exchange has diffuse,
  trust-dependent future obligations, unlike specified economic exchange.
- Operationalization: the obligation/credit ledger *is* Blau's bookkeeping.
  `lend_item` -> open loan; `return_item` -> fulfilled + trust up; loss -> violated +
  trust/friction down; repeated unreciprocated giving -> net-creditor standing. This
  is the repo's first scenario, `borrowed_tool_with_return_or_debt_v1`.
- Honesty boundary: the obligation is a behavioral bookkeeping fact, not felt
  indebtedness; "power" is a ledger asymmetry, not psychological dominance.

### 5. Coleman, social capital and the micro-macro boat

- Theory: social capital is defined by its function and takes three forms:
  obligations/expectations (credit slips, dependent on trustworthiness),
  information channels, and norms with sanctions (Coleman 1988). **Coleman's boat**
  is the macro->micro->macro diagram; the hard, often-missing link is micro->macro
  (individual actions aggregating into a collective outcome).
- Operationalization: a per-actor social-capital snapshot from existing ledgers:
  open credit slips held, exclusive knowledge held, norms the actor helps enforce.
  All loggable at the dyadic/individual level.
- Honesty boundary: the micro->macro transition (a settlement-level pattern emerging
  from individual turns) is the project's hardest, least-proven claim. It needs
  multi-actor, multi-episode evidence the repo does not yet have. Do not assert
  community-level social capital from one run.

### 6. Granovetter, weak ties and embeddedness

- Theory: weak ties (acquaintances) **bridge** disconnected clusters and carry
  novel information that redundant strong ties do not (1973). Economic action is
  **embedded** in ongoing social relations; concrete relationship history shapes
  trust more than general morality or abstract institutions (1985).
- Operationalization: tie strength ≈ the repo's `FamiliarityCategory`
  (stranger -> acquaintance -> teammate -> partner). An information-bridge event:
  log when an actor transmits exclusive knowledge (route, hazard, resource
  location) and verify the recipient's later behavior changed. Embeddedness is why
  the repo derives trust from a relationship ledger over cycles, not from one
  event. Scenario family: `asymmetric_knowledge_v1`.
- Honesty boundary: with 2-3 actors there is no network to claim bridging or
  centrality on; treat weak-tie value as a dyadic information-transfer event, not a
  network-structural result.

### 7. North, institutions as rules of the game

- Theory: institutions are "the rules of the game ... the humanly devised
  constraints that structure ... interaction," split into formal rules and informal
  constraints, with enforcement; institutions (rules) are distinct from
  organizations (players) (North 1990).
- Operationalization: **formal** institutions = runtime permission gates and role
  contracts (hard, runtime-owned). **Informal** institutions = claim-respect
  conventions and sanction patterns (soft, evidence-derived, never runtime-
  enforced). This keeps the project's hard rule visible: the runtime owns formal
  constraints and must not enforce informal norms, only observe whether actors
  maintain them.
- Honesty boundary: an unenforced regularity is not yet an institution. Require
  enforcement evidence (respected claim, sanction on violation) before claiming one.

### 8. Ostrom, IAD, rules-in-use, and the eight design principles

- Theory: the **IAD** (Institutional Analysis and Development) framework's focal
  unit is the **action arena** = an **action situation** (participants, positions,
  actions, outcomes, action-outcome linkages, control, information, costs/benefits)
  plus its actors, shaped by three external variables (biophysical conditions,
  community attributes, **rules-in-use**). Seven rule types: position, boundary,
  choice, aggregation, information, payoff, scope (Ostrom 2005). The **eight design
  principles** of long-enduring common-pool-resource institutions: clear
  boundaries, congruence with local conditions, collective-choice arrangements,
  monitoring, graduated sanctions, low-cost conflict resolution, minimal
  recognition of the right to organize, nested enterprises (Ostrom 1990).
- Operationalization: the action-situation working parts are almost a benchmark-
  scenario record (the repo's per-issue declaration: actors, stakes, valid
  resolution space, required evidence, score dimensions). Principles 1, 4, 5, 6
  (boundaries, monitoring, graduated sanctions, conflict resolution) map directly
  onto `MaterialClaimLedgerEntry`, a `SanctionEvent`, and `repair` obligations, and
  serve as measurement checklists for `weak_commons_*` and `public_*` scenarios.
- Honesty boundary (critical for this repo): Ostrom describes *full* common-pool-
  resource institutions. The repo **deliberately demotes** commons to a lightweight
  `weak commons` / `public affordance` category and does not build a commons-
  governance economy. Use the principles as measurement checklists, not as a target
  architecture the runtime enforces. The runtime observes whether a norm is
  maintained; it does not enforce one.

### 9. Bicchieri & Elster, social norms

- Theory: a **social norm** (Bicchieri 2006) is a behavioral rule one prefers to
  follow *conditional on* two beliefs: an **empirical expectation** (a sufficiently
  large part of the group conforms) and a **normative expectation** (the group
  expects conformity and may sanction deviation). A **convention** (coordination,
  shared interest) needs only empirical expectations; a social norm (mixed-motive,
  conforming is rarely in one's immediate interest) needs both; a **descriptive
  norm** is a bare regularity; a **moral rule** is unconditional. Elster (1989):
  norms are non-outcome-oriented, sustained by emotions and sanctions, distinct
  from conventions and moral norms.
- Operationalization: model a norm as a record with situation-type, an
  empirical-expectation proxy (counted observed conforming acts), a normative-
  expectation proxy (recorded sanction/approval events), and violation/repair refs.
  This is the bridge between the public-sanctions model (below) and the repo's
  ledgers.
- Honesty boundary: empirical expectation is loggable (count history); normative
  expectation is *not* directly observable, its proxy is recorded sanction events.
  The repo may say "behavior is consistent with a norm and history contains
  sanctions for this violation type"; it may not say "the actor feels obligated."
  And it must not call a convention (empirical-only) a norm.

### 10. March & Simon / Nelson & Winter, roles, routines, coordination

- Theory: organizations coordinate **boundedly rational** actors via role
  specialization, standard procedures, and communication channels (March & Simon
  1958). **Routines** are regular, predictable organizational behavior patterns,
  the "skills of an organization" and its unit of selection ("genes"), replicated
  by imitation and economizing on bounded cognition (Nelson & Winter 1982).
- Operationalization: a **role** is the repo's runtime permission/context contract
  (gatherer, crafter, quartermaster). A **routine** is a repeated, ordered cross-
  actor action pattern over multiple cycles (A restocks fuel before B smelts),
  detected from recurring evidence-backed sequences (not profile labels). Routines
  are the most concrete handle on the repo's hardest goal, *post-goal continuation*:
  a settlement persists because routines persist after any one CycleGoal completes.
  Scenario: `role_dependency_work_order_v1`.
- Honesty boundary: a single coordinated episode is not a routine or a division of
  labor; require recurrence across cycles with evidence. Tacit routine knowledge is
  not fully observable; claim the pattern, not the internalized skill.

## How computational work already operationalizes these (and where it diverges)

Three computational sources show these theories already turned into measurable
agent variables, and each marks a boundary the repo should hold.

- **GovSim** (arXiv 2404.16698, NeurIPS 2024): Ostrom-grounded common-pool-resource
  governance with LLM agents. Concrete metrics (survival time, efficiency,
  equality/Gini, over-usage), a greedy-newcomer perturbation that tests norm
  robustness, and a finding that the ability to form beliefs about others
  correlates 0.83 with survival (i.e. a Social-WAM capability is the bottleneck,
  not dialogue fluency). Divergence: GovSim's "commons" is an abstract integer that
  doubles, with no inventory/tool/place, exactly the heavy-commons framing the repo
  rejects. Borrow the metric decomposition and the newcomer probe; do not adopt the
  abstract-number economy.
- **Norms from public sanctions** (arXiv 2106.09012, DeepMind): social norms emerge
  from a public, dyadic, valenced sanctioning signal plus a learned **Classifier
  Norm Model** that predicts what the group would approve/disapprove. Their key
  line is the repo's own caution made formal: "the classification of whether a
  behavior is a transgression is determined entirely by whether the group has
  sanctioned similar behavior in the past." Borrow the `SanctionEvent` schema
  (sanctioner, target, context, valence) and the "norm = classifier over sanction
  history" concept; do not borrow the millions-of-steps MARL training method, and
  do not claim the actor "internalized" a norm.
- **Generative Agents** (arXiv 2304.03442, UIST 2023): the canonical LLM memory-
  stream + retrieval + reflection + planning architecture, with emergent
  information diffusion and relationship formation. Divergence: it scores
  *believability*, and its plans/reflections *are* the agent's truth. The repo
  replaces plausibility with world-verified social-material deltas. Borrow the
  retrieval scoring (recency × importance × relevance) and reflection-with-evidence-
  citations; do not adopt believability as a metric.

## Mapping onto the four WAM layers

- **Social WAM** (embodied social consequences): Weber's demarcation, Mead/Blumer
  meaning, Goffman face/promise consistency, Homans/Blau obligation and trust,
  Granovetter information transfer and familiarity, Coleman's dyadic credit slips.
- **Institutional / Settlement WAM** (longer-horizon patterns): North formal vs
  informal rules, Ostrom IAD and design principles, Bicchieri/Elster norms,
  March-Simon/Nelson-Winter roles and routines, Coleman's micro->macro boat. This
  layer is where claims are weakest and need multi-actor, multi-episode evidence.
- These two ride on the **Material / Economic WAM** (possession, claims, transfers)
  and ultimately on the **Physical WAM** (a transfer is only real if the items and
  durability verify).

## What this lane could not verify (gaps)

- Exact canonical wording for several anchors (Ostrom 2011 PSJ, the P2P design-
  principles page) could not be fetched (TLS / 503 / 403); the by-paper notes label
  those as secondary-source paraphrase. The *structure* is faithful; quote-level
  precision should be checked against the primary books before any external paper.
- The Institutional-layer constructs (norms, routines, micro->macro emergence) are
  the least supported empirically. They are stated here as *predictable deltas a
  WAM would forecast*, not as behaviors the current runtime can demonstrate.
- Whether LLM-proposed actors can sustain a *learned* (history-grounded) norm
  without it being hardcoded is an open question; GovSim and the public-sanctions
  model show partial answers in non-Minecraft, non-LLM-turn settings, so transfer
  is design-level, not proven.
