# Lane 33 brief: Mechanism design, social dilemmas, and institutional grounding

Owner: Lane 33 (wave 6). Date: 2026-06-17. ASCII punctuation only.

One-line tie to the thesis: the field of cooperation-by-rule-design (mechanism design,
contracts, institutions, sanctions) supplies the predictable, designable structure for
the project's two hardest layers (Material and Institutional), and the project's
verifier is exactly the "contractible observation / sanction context / evidence that
triggers escalation" that every one of these mechanisms presupposes but that the
literature only ever has in abstract, ungrounded form.

## Sources reviewed (13 total; 8 deep-read, 2 claim-only classics on arXiv, 3 abstract-level verified)

Deep-read (LaTeX):
1. 2012.08630 Open Problems in Cooperative AI (Dafoe et al. 2020) - field frame.
2. 2208.10469 Formal Contracts Mitigate Social Dilemmas in MARL (Christoffersen et al.
   2022) - on arXiv, NOT on HF; verified by direct e-print fetch.
3. 2603.19453 LLM Policy Synthesis in Sequential Social Dilemmas (Gallego 2026).
4. 2601.11369 Institutional AI: governing LLM collusion via governance graphs
   (Bracale Syrnikov et al. 2026).
5. 2309.09801 Learning Optimal Contracts (Bacchiocchi et al. 2023).
6. 2301.08278 Direct Punishment and cooperation in MARL (Dasgupta and Musolesi 2023).
7. 2510.14401 Social Learning and Collective Norm Formation in LLMs (Gupta et al. 2025).
8. 2504.03255 Principal-Agent liability in LLM agentic systems (Gabison and Xian 2025).

Abstract-level, verified on HF:
9. 2405.01035 LOQA: Learning with Opponent Q-Learning Awareness (opponent shaping).
10. 2602.22302 Agent Behavioral Contracts (Design-by-Contract for LLM agents, runtime).
11. 2603.25100 From Logic Monopoly to Social Contract (separation of powers; quantified
    proposer/scorer-conflict harm).

Claim-only (HF not-found; cited, not fabricated):
12. 1702.03037 MARL in Sequential Social Dilemmas (Leibo et al. 2017) - SSD substrate.
13. 2107.06857 Melting Pot (Leibo et al. 2021) - evaluation suite; 1709.04326 LOLA
    (Foerster et al. 2018) also claim-only and already abstract-level in the ToM theme.
Plus classic non-arXiv anchors carried via the computational papers: Ostrom 1990
(Governing the Commons), Crawford and Ostrom 1995 (ADICO grammar), Nowak and Sigmund
2005 (indirect reciprocity).

Extend-not-duplicate: GovSim (2404.16698), public-sanctions norms (2106.09012), Ostrom
IAD, Bicchieri/Elster already have by-paper notes (sociology theme); naming-game
conventions (2410.08948), Hypothetical Minds, MindForge, LOLA-at-abstract already in the
theory-of-mind theme; AI Economist / LLM Economist / GLEE / Concordia in the economic-sim
and social-sim themes. This lane cites those and adds the contracts/commitment/
institution-as-mechanism angle.

## Strongest findings (source-backed)

1. A rich enough space of voluntary, evidence-contingent reward transfers makes
   selfish agents cooperate optimally in equilibrium. Formal Contracts (2208.10469)
   proves every subgame-perfect equilibrium of a fully observable Markov game becomes
   socially optimal under a contracting augmentation, and welfare rises monotonically
   with the richness of contractible observations even under partial observability. The
   dependency is exactly the verifier's output (observations that detect deviation), so
   the repo's evidence ledger is the substrate this theorem presupposes.

2. Institutions beat prompts, and the institution is a public evidence-keyed graph.
   Institutional AI (2601.11369) reframes alignment as mechanism design in
   institution-space, encodes norms in the ABDICO grammar (the Crawford-Ostrom lineage)
   bound to a governance graph (states, transitions, sanctions, restorative paths) with
   an append-only cryptographic log, and cuts LLM-Cournot collusion (mean tier 3.1 ->
   1.8, severe incidence 50% -> 5.6%) while a prompt-only "constitution" does nothing
   under optimization pressure. The deterrence condition p*S >= Delta-pi (sanction
   probability times size exceeds the rent) governs persistence and needs no
   internalized norm.

3. Dense, structured feedback beats scalar reward for cooperation, and a writable
   scorer gets Goodharted 59x. LLM Policy Synthesis in SSDs (2603.19453): multi-metric
   social feedback (efficiency, equality, sustainability, peace) gives +54% efficiency
   over scalar reward in Cleanup by breaking "feedback aliasing"; and an adversarial
   model that could mutate the environment object amplified reward 59x while improving
   the visible social metrics. This is direct, recent support for both the repo's
   structured-state verifier and the proposer/scorer-separation rule. The latter is
   independently quantified by the Logic Monopoly result (2603.25100: 84.30% attack
   success, 31.4% emergent deception when one agent plans+executes+evaluates itself).

## Weak or uncertain claims (what I could not verify)

- Three foundational seeds are not on HF and are logged claim-only with citations:
  SSD-MARL (1702.03037), Melting Pot (2107.06857), LOLA (1709.04326). Their content here
  is abstract/second-hand; quote-level facts should be checked against the primaries.
- The classic institutional-economics anchors (Ostrom 1990, Crawford-Ostrom 1995, Nowak-
  Sigmund 2005) are books/pre-arXiv, carried via the computational papers that
  operationalize them; their structure is faithful, exact wording is not verified here.
- Every quantitative result in the deep-read LLM papers uses frontier closed models, so
  exact reruns are provider-dependent; the transferable content is the mechanisms and
  the qualitative findings, not the specific numbers.
- No source grounds any mechanism in a verified, physical, multi-actor substrate. The
  "no verifier-grounded instance exists" statement is itself the gap, not a citable
  result.

## Implications for this repo (mechanically useful vs research contribution)

Mechanically useful (adopt now):
- Obligation/credit ledger = the contracting augmentation (2208.10469) + hidden-action
  contract model (2309.09801): an obligation is an outcome-dependent commitment whose
  fulfilment is conditioned on a verified delta, never on hidden intent.
- Norm representation = ABDICO records (2601.11369) bound to a scenario, with Condition
  = a verifier-detected trigger and Or-else = a recorded sanction/repair; the append-
  only evidence log is the same shape as the repo's artifact ledger.
- Sanction/reputation schema = typed SanctionEvent (direct vs third-party) +
  FamiliarityCategory edges moved only by evidence + gossip as a logged transmission
  (2301.08278, 2106.09012, indirect reciprocity).
- Commons scoring = efficiency/equality/sustainability/peace over verified resource
  events (2603.19453); latent-payoff CPR loop with propose-then-vote collective choice
  (2510.14401).
- Attribution = monitoring + incentive realignment, with the verifier as the evidence
  substrate for cost-to-others attribution (2504.03255).
- Two testable Institutional-layer hypotheses: welfare rises with contractible-
  observation richness (2208.10469); a harmful pattern persists iff p*S < Delta-pi
  (2601.11369).

Research contribution (what the repo adds, where the loop opens):
- Grounding. Every mechanism here runs on an abstract signal, a market statistic, or a
  self-reported action. The repo's distinctive claim is an advisory WAM that predicts
  these social-material deltas (obligation kept, commons depleted, sanction occurred,
  cost imposed) and scores them against verifier evidence of what physically happened.
- Observe-only. Every system that gets cooperation to actually happen ENFORCES (reward
  transfer, binding consequence, trained policy). The repo's Institutional layer is
  observe-only; it records whether a norm was maintained and whether a sanction
  occurred, and never gates outcomes on a predicted judgment. The loop is open by
  design, and the repo should borrow representations and diagnostics, not the
  enforcement engine.
- Boundaries to state plainly: contested success and costly reset (multi-episode
  Institutional claims inherit the unsolved reset-granularity and held-out-freshness
  problems from the directions report); the multi-actor dependency (settlement-level
  emergence, the Coleman micro-to-macro link, is unprovable with two or three actors);
  human-in-the-loop (attribution ultimately ends at a human/legal judgment the runtime
  can only supply evidence for).

## Recommended next questions

1. Can the welfare-vs-contractible-observation-richness curve (2208.10469) be measured
   in the repo by varying how much verified evidence the obligation ledger exposes, as a
   first Institutional-layer calibration result that recovers a known regularity before
   any emergence claim?
2. Can the deterrence condition p*S >= Delta-pi (2601.11369) be turned into a scored
   prediction (given verified evidence of a cost-imposing pattern, predict whether it
   persists), with the runtime recording sanctions but not enforcing them?
3. What is the minimal SanctionEvent + ABDICO schema that lets the repo log direct vs
   third-party sanctioning, reputation/gossip, and a propose-then-vote collective-choice
   step, without claiming any actor "internalized" a norm?
4. Where exactly does the proposer/scorer separation need to sit so the 59x reward-hack
   (2603.19453) and the Logic Monopoly failure (2603.25100) cannot occur in the repo's
   verifier pipeline?

## Files created by this lane

- notes/by-paper/2012.08630-open-problems-cooperative-ai.md
- notes/by-paper/2208.10469-formal-contracts-mitigate-social-dilemmas.md
- notes/by-paper/2603.19453-llm-policy-synthesis-sequential-social-dilemmas.md
- notes/by-paper/2601.11369-institutional-ai-governance-graphs.md
- notes/by-paper/2309.09801-learning-optimal-contracts.md
- notes/by-paper/2301.08278-direct-punishment-cooperation-marl.md
- notes/by-paper/2510.14401-social-learning-norm-formation-llm.md
- notes/by-paper/2504.03255-principal-agent-liability-llm.md
- notes/by-theme/research-area-mechanism-design-and-cooperative-ai.md
- notes/subagent-briefs/lane-33-mechanism-design-and-cooperative-ai.md
- raw-search-results/lane-33-manifest.jsonl
- raw-search-results/lane-33-search-log.md
