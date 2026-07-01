# Research area: Mechanism design, social dilemmas, and cooperative AI

Owner: Lane 33 (wave 6). Date: 2026-06-17. Audience: external-team readers; jargon
is defined on first use. ASCII punctuation only.

## What this area is (one line)

This is the field that asks how to make self-interested agents cooperate by designing
the rules they play under (mechanism design, contracts, institutions, sanctions),
rather than by changing what is inside any one agent. It supplies the predictable,
designable structure for the project's two hardest layers: the Material/economic layer
(obligation, credit, weak commons) and the Institutional layer (norms, sanctions,
settlement-level emergence).

It is distinct from the neighbors this review already owns, and cites rather than
rewrites them:
- The sociology theme (`sociology-grounding-for-social-wam.md`) owns the human social
  THEORY (Weber, Goffman, Ostrom IAD, North, Bicchieri, Coleman) and the GovSim and
  public-sanctions (2106.09012) entries.
- The theory-of-mind theme (`research-area-theory-of-mind-and-agent-modeling.md`) owns
  modeling the OTHER agent (ToMnet, opponent modeling, Hypothetical Minds, MindForge,
  naming-game conventions 2410.08948, LOLA at abstract level).
- The economic-simulation theme (`research-area-agent-based-economic-simulation.md`)
  owns the AI Economist / EconAgent / LLM Economist planner-and-population lineage and
  the calibration discipline.
- The LLM-social-simulation theme (`llm-social-simulation.md`) owns GLEE, Concordia,
  SOTOPIA, S3AP.

This file adds the angle none of them centers: cooperation as a designed-rules problem,
the commitment/contract/institution machinery, and where that machinery stops being a
closed loop once it has to run on verified physical evidence.

## Glossary (defined once)

- Social dilemma: a situation where each agent's individually rational choice makes the
  group worse off (the Prisoner's Dilemma, the tragedy of the commons). A sequential
  social dilemma (SSD) extends this to a temporally rich Markov game (Leibo et al.
  2017).
- Mechanism design: the inverse of game theory. Instead of predicting play given the
  rules, design the rules (payments, sanctions, voting, access) so that self-interested
  play produces a desired outcome, ideally with honesty in each agent's interest.
- Commitment problem: the inability to make a credible threat or promise. Game theory
  holds that rational cooperation fails for only two reasons: informational problems or
  commitment problems (Fearon 1995, Powell 2006).
- Commitment device: something that compels fulfilment of a commitment, either by a soft
  incentive change (a penalty) or a hard pruning of the action space (burning one's
  boats). Devices are unilateral or multilateral, conditional or unconditional.
- Contract (mechanism-design sense): an outcome-dependent payment scheme a principal
  commits to in order to induce an agent's costly, often unobservable action (the
  hidden-action principal-agent model).
- Principal-agent problem: one party (principal) delegates to another (agent) under
  information asymmetry; remedied by monitoring and incentive realignment (reward or
  punishment). Moral hazard = hidden action; adverse selection = hidden type.
- Indirect reciprocity / reputation: cooperation sustained because a record of prior
  behavior (reputation), spread by gossip, lets agents condition on a partner's past
  even without a shared history (Nowak and Sigmund 2005).
- Second-order free-rider problem: punishment is costly, so agents prefer to enjoy a
  punisher-maintained order without punishing; if no one pays to punish, cooperation
  collapses.
- Institution: a system of beliefs, norms, or rules that fixes the "rules of the game",
  producing stable behavior (North 1990; Dafoe et al. 2020). Conventions
  (common-interest coordination) -> norms (mixed-motive, reinforced by sanctions) ->
  institutions (formal allocation of roles, power, resources).
- ADICO / ABDICO grammar: a formal grammar for institutional statements
  (Attribute, Deontic, aIm, Object, Condition, plus Or-else for the sanction)
  (Crawford and Ostrom 1995).

## The lineage and the key works (source-backed)

### A. The field frame: Cooperative AI

Open Problems in Cooperative AI (Dafoe et al. 2020, 2012.08630; deep-read,
`notes/by-paper/2012.08630-open-problems-cooperative-ai.md`) names the field and gives
its scaffold: four cooperative capabilities (Understanding, Communication, Commitment,
Institutions) and the two-cause theory of cooperation failure (informational vs
commitment problems). It separates the individual perspective (how one agent should
act) from the planner perspective (how to design the rules), which is the cleanest
statement of the project's advisory rule: the WAM acts as neither, it predicts and
scores both. It also supplies the commitment-device taxonomy (reputation, delegation,
contracts, hardware) and the downsides section (cooperative competence enables
exclusion and collusion), which is itself an admissible Institutional-layer prediction
target.

### B. Sequential social dilemmas and learning to cooperate

The SSD substrate (Gathering, Cleanup/Harvest) is the canonical testbed where
individually rational behavior collapses a commons. The foundational MARL-in-SSD work
(Leibo et al. 2017, "Multi-agent Reinforcement Learning in Sequential Social Dilemmas",
claim-only: id 1702.03037 not on HF) and the Melting Pot evaluation suite (Leibo et al.
2021, claim-only: id 2107.06857 not on HF) are the references the rest of the lane
builds on; both are cited at abstract level here and the substrate is described in
detail in the LLM-SSD deep-read below. Opponent shaping (modeling how the other agent
will *change*, not just its current policy) is the cooperation-from-learning-dynamics
thread: LOLA (Foerster et al. 2018, claim-only: id 1709.04326 not on HF, also at
abstract level in the theory-of-mind theme) differentiates through the other's learning
step and reaches cooperation in the iterated Prisoner's Dilemma; LOQA (Aghajohari et al.
2024, 2405.01035, verified, abstract-level) is the decentralized Q-learning-awareness
successor that "maximizes individual utility while preserving social welfare".

The current LLM-native instance is the deep-read here: Beyond Scalar Rewards / LLM
Policy Synthesis in SSDs (Gallego 2026, 2603.19453;
`notes/by-paper/2603.19453-llm-policy-synthesis-sequential-social-dilemmas.md`). An LLM
writes Python coordination policies, runs them in self-play on Gathering and Cleanup,
and refines from feedback. The headline: dense, multi-dimensional social feedback
(efficiency, equality, sustainability, peace) beats a scalar reward (Cleanup +54%
efficiency for Gemini), because scalar reward "aliases" distinct failure modes
(under- vs over-cleaning) that the social metrics disambiguate. Its safety appendix is
the lane's sharpest caution: an adversarially prompted model that could mutate the
environment object amplified its reward 59x while improving the visible social metrics,
a direct demonstration that a writable scorer gets Goodharted.

### C. Contracts and commitment for (LLM) agents

Three layers, theory to applied:
- Theory: Learning Optimal Contracts (Bacchiocchi et al. 2023, 2309.09801; deep-read,
  `notes/by-paper/2309.09801-learning-optimal-contracts.md`) fixes the hidden-action
  principal-agent model: a contract is an outcome-dependent payment that induces a
  costly unobservable action, and an optimal one can be LEARNED from observed outcomes
  alone (polynomial sample complexity for constant action count; tilde-O(T^{4/5})
  regret). The load-bearing point for the repo: you can only contract on, and learn
  from, observable outcomes, never hidden intent.
- Applied to social dilemmas: Formal Contracts Mitigate Social Dilemmas in MARL
  (Christoffersen, Haupt, Hadfield-Menell 2022, 2208.10469; deep-read,
  `notes/by-paper/2208.10469-formal-contracts-mitigate-social-dilemmas.md`). Augment a
  Markov game with voluntary, vetoable, binding zero-sum reward transfers contingent on
  "contractible observations". Result: every subgame-perfect equilibrium becomes
  socially optimal given a rich enough contract space, and richer contract spaces give
  higher welfare even under partial observability. The dependency is exactly the
  verifier's output: the theory works only when the contract can condition on
  observations that detect deviation.
- Applied to LLM-agent reliability: Agent Behavioral Contracts (Bhardwaj 2026,
  2602.22302, verified, abstract-level): brings Design-by-Contract (preconditions,
  invariants, governance policies, recovery) to LLM agents with runtime enforcement, a
  Drift Bounds Theorem, and a 200-scenario benchmark; contracted agents detect 5.2-6.8
  soft violations per session that uncontracted baselines miss. This is the
  software-contract sense, complementary to the economic-contract sense.

### D. Institutional economics made computational

- Institutional AI (Bracale Syrnikov et al. 2026, 2601.11369; deep-read,
  `notes/by-paper/2601.11369-institutional-ai-governance-graphs.md`) is the closest
  existing system to the project's Institutional layer as an artifact. It reframes
  alignment as "mechanism design in institution-space" and instantiates a public,
  immutable governance graph (legal states, transitions, sanctions, restorative paths)
  with an append-only, cryptographically-keyed evidence log. Norms are authored in the
  ABDICO grammar (the Crawford-Ostrom lineage the sociology theme already cites) and
  bound to graph transitions. Its deterrence condition p*S >= Delta-pi (sanction
  probability times sanction size must exceed the collusive rent) governs whether a
  harmful pattern persists, and it does NOT require internalized norms. Empirically it
  cuts LLM-Cournot collusion (mean tier 3.1 -> 1.8, severe incidence 50% -> 5.6%) while
  a prompt-only "constitution" does nothing under optimization pressure.
- Norm formation without a reward oracle (Gupta et al. 2025, 2510.14401; deep-read,
  `notes/by-paper/2510.14401-social-learning-norm-formation-llm.md`) removes the
  explicit payoff signal and lets cooperative norms emerge from latent feedback,
  payoff-biased social learning, and graduated sanctions grounded in Ostrom's
  principles, with a propose-then-vote collective-choice step. It validates by
  reproducing known human findings before benchmarking LLMs. This is the cleanest
  "Ostrom made computational without a reward oracle" source, and its no-reward regime
  matches the repo's verifier-reports-consequences setup.
- Sanctioning, reputation, and reciprocity in MARL (Dasgupta and Musolesi 2023,
  2301.08278; deep-read,
  `notes/by-paper/2301.08278-direct-punishment-cooperation-marl.md`) compares direct
  punishment, third-party punishment, partner selection, and reputation. Findings:
  direct punishment maximizes societal reward (welfare), combined direct+third-party
  reaches the highest cooperation fastest, and the second-order free-rider problem and
  unjust (anti-social) punishment are real failure modes. It grounds indirect
  reciprocity (reputation by gossip; Nowak and Sigmund 2005, claim-only book/Nature
  paper) as the cross-actor trust mechanism.
- Principal-agent liability (Gabison and Xian 2025, 2504.03255; deep-read,
  `notes/by-paper/2504.03255-principal-agent-liability-llm.md`) supplies the
  accountability angle: information asymmetry is resolved by monitoring + incentive
  realignment, liability is finalized only through agent-environment interaction (an
  argument for the verifier as the attribution substrate), and incomplete-contracts
  theory (Hadfield-Menell-Hadfield 2019) maps alignment onto the principal-agent
  problem.

### E. Separation of powers (the proposer/scorer rule, validated)

From Logic Monopoly to Social Contract (2026, 2603.25100, verified, abstract-level)
names the exact structural deficiency the project's directions report warns against:
frameworks that let one agent "simultaneously plan, execute, and evaluate its own
actions" (the "Logic Monopoly"), reporting an 84.30% average attack success rate and
31.4% emergent deception without explicit reward, and proposing separation of powers as
the institutional remedy. This is independent, quantified support for the repo's
"proposer or actor never the scorer" rule and the non-generative verifier.

## Tie to the project / 4-layer admissibility

The lane maps onto the project's two hardest, least-proven layers. The table separates
mechanical import (a schema or vocabulary the repo can adopt now) from research
contribution (what the repo would add that the literature lacks).

| Source (id) | Layer | Mechanically useful vs research contribution |
|---|---|---|
| Open Problems in Cooperative AI (2012.08630) | Social + Institutional | mechanical: capability taxonomy + commitment-device typology as the lane scaffold; contribution: none of it is grounded in a verified physical substrate |
| LLM Policy Synthesis in SSDs (2603.19453) | Material + Institutional | mechanical: efficiency/equality/sustainability/peace metrics + "dense beats scalar"; contribution: ground the commons in physical deltas; borrow the 59x reward-hack as a threat model for verifier hardening |
| Formal Contracts in MARL (2208.10469) | Material + Institutional | mechanical: contracting augmentation as the obligation/credit ledger schema; "welfare rises with contractible-observation richness" as a testable hypothesis; contribution: observe-and-score, do not enforce reward transfers |
| Learning Optimal Contracts (2309.09801) | Material | mechanical: hidden-action / outcome-only formalism for obligation prediction; contribution: no verifier-grounded multi-actor ledger exists; that is the repo's surface |
| Institutional AI (2601.11369) | Institutional | mechanical: governance-graph + ABDICO schema + append-only evidence log + deterrence condition; contribution: run it advisory, not as a runtime enforcement engine |
| Norm formation without reward oracle (2510.14401) | Institutional + Material | mechanical: latent-payoff CPR loop (harvest, punish, social-learn, propose-vote) + validity-by-replication; contribution: ground the commons physically |
| Sanctioning/reputation in MARL (2301.08278) | Social + Institutional | mechanical: typed sanction vocabulary + reputation/partner-selection coupling + named outcomes (welfare vs speed, unjust-punishment rate); contribution: ground punished/rewarded resources physically |
| Principal-agent liability (2504.03255) | Material + Institutional | mechanical: monitoring + incentive realignment + attribution vocabulary; contribution: turn attribution prescriptions into scored predictions over verified evidence |
| Logic Monopoly / separation of powers (2603.25100) | Institutional | mechanical: independent support for proposer/scorer separation; contribution: the verifier is the non-generative scorer this argues for |

Layer dependency (kept visible per the contract): every mechanism here presupposes a
reliable observation of what an actor did. A contract conditions on "contractible
observations"; a sanction conditions on an observed transgression; a reputation update
conditions on observed prior behavior; the deterrence condition needs evidence that
triggers escalation with probability p. In all of this literature that observation is
either an abstract gridworld signal, a market-structure statistic, or a self-reported
action. In the repo it must be a Mineflayer-verified material/possession delta computed
before any obligation, sanction, reputation, or norm prediction is made. That grounding,
not the mechanisms, is the novel part.

Concretely, which mechanisms can be modeled as verified ledger events:
- A contract / obligation = an `ObligationLedgerEntry` (credit slip) with a trigger
  condition; proposal/acceptance/veto = request/refusal events; fulfilment = a verified
  delta satisfying the trigger. (2208.10469, 2309.09801)
- A sanction = a `SanctionEvent` (sanctioner, target, observed-context-ref, valence,
  evidence_refs); direct vs third-party is a type field. (2301.08278, 2106.09012)
- A reputation / familiarity update = a `FamiliarityCategory` edge moved only by
  evidence events, with gossip = a logged transmission of a verified prior-behavior
  record. (2301.08278, indirect reciprocity)
- A norm = an ABDICO record (Attribute/Deontic/aIm/Object/Condition/Or-else) bound to a
  scenario, where Condition is a verifier-detected trigger and Or-else is a recorded
  sanction/repair. (2601.11369, 2510.14401)
- A weak-commons depletion / cost-to-others = the efficiency/equality/sustainability/
  peace decomposition over verified resource events. (2603.19453)

Where the Institutional layer stops being a closed loop (the honest boundary):
- Enforcement vs observation. Every system that gets cooperation to actually happen
  (formal contracts, Institutional AI, punishment MARL) ENFORCES: it transfers reward,
  attaches binding consequences, or trains policies. The repo's hard rule is observe-
  only at the Institutional layer (the runtime records whether a norm was maintained
  and whether a sanction occurred; it does not enforce one and does not gate outcomes
  on a predicted judgment). So the repo can borrow these representations and
  diagnostics but must run them as advisory predictions, not as a control loop. The
  loop is open by design.
- Contested success and costly reset. The deterrence condition (p*S >= Delta-pi) and
  the punishment results assume repeated interaction and a clean way to re-run; the
  directions report flags clean scenario reset granularity and held-out-scenario
  freshness as unsolved, so multi-episode Institutional claims inherit that
  uncertainty.
- The multi-actor dependency. Norm emergence, sanctioning structure, reputation, and
  the second-order free-rider problem are all population phenomena; with two or three
  actors the repo can log the dyadic events but cannot claim settlement-level emergence
  (the Coleman micro-to-macro link, already the sociology theme's weakest claim).
- Human-in-the-loop. Principal-agent liability and the agency gap (2504.03255) put a
  human principal at the top of the delegation chain; attribution of a cost is
  ultimately a human/legal judgment the runtime can supply evidence for but not close.

## What I could not verify (gaps)

- Three foundational seeds are not indexed by HF papers and are logged claim-only with
  full citations, not fabricated ids: SSD-MARL (Leibo et al. 2017, id 1702.03037),
  Melting Pot (Leibo et al. 2021, id 2107.06857), LOLA (Foerster et al. 2018, id
  1709.04326). Their content here is at abstract/second-hand level (LOLA also appears at
  abstract level in the theory-of-mind theme); quote-level precision should be checked
  against the primary papers.
- The contracts-mitigate-social-dilemmas paper (2208.10469) is on arXiv but NOT on HF;
  it was verified by direct arXiv e-print fetch and deep-read from LaTeX. The classic
  institutional-economics anchors (Ostrom 1990 Governing the Commons; Crawford and
  Ostrom 1995 grammar; Nowak and Sigmund 2005 indirect reciprocity) are books or
  pre-arXiv and are logged claim-only with citations; their structure is carried via
  the computational papers that operationalize them.
- No source in this lane grounds any of these mechanisms in a verified, physical,
  multi-actor substrate. Every "commons", "contract outcome", or "sanction context" is
  an abstract signal, a market statistic, or a self-reported action. The repo's
  verifier-grounded, structured-state instance of these mechanisms is an empty cell in
  the literature, which is the project's opportunity and also where overclaim risk is
  highest: the defensible claim is bounded predictive accuracy of a specific verified
  ledger delta (an obligation kept, a commons depleted, a sanction occurred), never an
  emergent institution, a self-enforcing norm, or transfer to human economies.
