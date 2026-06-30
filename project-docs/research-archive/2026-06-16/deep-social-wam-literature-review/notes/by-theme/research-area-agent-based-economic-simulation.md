# Research area: Agent-based economic simulation and computational social science

Lane 16 (G5) theme file. This surveys agent-based computational economics (ACE)
and the broader agent-based-modeling (ABM) tradition, now increasingly driven by
LLM agents, as the research footing for the project's **Material/economic layer**
(possession, scarcity, exchange, weak commons, costs to others) and parts of the
**Institutional layer** (emergent markets, governance). It is written for a
newcomer.

It deliberately does NOT re-survey neighboring areas already covered:
- Game-theoretic LLM economic evaluation (GLEE) lives in
  `notes/by-paper/2410.05254-glee.md` and `llm-social-simulation.md`.
- The Game-Master generative social sim (Concordia) lives in
  `notes/by-paper/2312.03664-concordia.md` and `llm-social-simulation.md`.
- Ostrom / common-pool-resource governance and GovSim live in
  `sociology-grounding-for-social-wam.md`.
- Generative Agents and large social simulators (AgentSociety as social sim) live
  in `llm-social-simulation.md`.
- Overclaim and validity framing live in `benchmark-validity-and-evaluation.md` and
  `project-sid-critical-review.md`.

This file covers the *computational-economics research area itself*: the lineage,
the economic quantities, and the calibration/validity discipline those neighbors do
not own.

## 1. What this area is (one line)

Agent-based computational economics studies an economy "from the bottom up" by
simulating many autonomous, heterogeneous agents who possess, produce, and exchange
under scarcity, and asks which macro patterns (prices, inequality, specialization,
booms/busts, institutions) emerge from their micro interactions rather than being
assumed.

## 2. Glossary (defined once)

- **Agent-based model (ABM)**: a simulation of many individual agents following
  local rules, run forward to observe aggregate behavior. Contrast with equation-
  based models that solve for an assumed equilibrium.
- **Agent-based computational economics (ACE)**: ABM applied to economics. Canonical
  definition (Tesfatsion 2002, Artificial Life 8(1)): "the computational study of
  economic processes modeled as dynamic systems of interacting agents." The
  "culture-dish" method: set initial agents and conditions, then step back and let
  the world evolve with no further intervention.
- **Emergence**: macro patterns (a wealth distribution, a market price, a
  convention) that arise from micro rules and were not programmed in directly.
- **Mechanism design**: the inverse problem to game theory: design the rules
  (taxes, auctions, voting) so that self-interested agents produce a desired
  aggregate outcome. "The ultimate nudging problem" in the LLM Economist's phrasing.
- **Resource economy / commons / common-pool resource (CPR)**: a shared, rivalrous,
  depletable resource (a fishery, a pasture). The classic failure mode is the
  tragedy of the commons (over-extraction); Ostrom showed institutions can prevent
  it (covered in `sociology-grounding-for-social-wam.md`).
- **Calibration**: fitting a model's parameters so its output matches real data.
- **Empirical validation**: showing a model's behavior is consistent with reality
  (recovering a known regularity, matching held-out data). The perennial hard
  problem of ABM (Windrum-Fagiolo-Moneta 2007).
- **Generative ABM (GABM)**: ABM where agent behavior (and sometimes the
  environment) is produced by an LLM rather than coded rules (Concordia coined the
  framing; covered there).
- **Gini coefficient / Lorenz curve**: standard measures of inequality in a wealth
  distribution (0 = perfect equality, near 1 = one agent owns everything).
- **Stackelberg game**: a two-level game with a leader who commits first (here a tax
  planner) and followers who best-respond (here worker agents).

## 3. Key works and sub-threads (genealogy, source-backed)

### 3a. Classic rule-based ABM: growing societies and emergent inequality

- **Schelling, Dynamic Models of Segregation (1971)**. What it introduced: the
  canonical emergence example. Agents with a mild same-neighbor preference produce
  sharp residential segregation no individual wanted. Why it matters: the founding
  proof that macro structure can emerge from benign micro rules; the intuition
  behind every later ABM. (Docs-level; logged `schelling-1971-segregation`.)
- **Epstein and Axtell, Growing Artificial Societies / Sugarscape (1996, MIT
  Press)**. What it introduced: a 2D landscape of a renewable resource ("sugar")
  populated by agents with vision, metabolism, and movement following a simple local
  rule ("go to the most sugar nearby and eat it"). From this emerge population
  dynamics, spatial sorting by metabolic rate, **trade between agents holding two
  goods (sugar and spice)**, and a skewed **wealth distribution** measured by the
  Lorenz curve and Gini coefficient. Why it matters: the first end-to-end "social
  science from the bottom up" demonstration that possession, scarcity, exchange, and
  inequality are *emergent*, not assumed. It is the direct ancestor of every
  resource-economy ABM and the closest classic analog to a Minecraft material
  economy (a spatial world, a harvestable resource, carried inventory, trade).
  (Book/docs-level; Wilensky NetLogo and JASSS replications exist.)
- **Tesfatsion, ACE: Growing Economies from the Bottom Up (2002)**. What it
  introduced: the name and methodology of the field (the definitions in section 2),
  and applications to labor and electricity markets. Why it matters: it states the
  constructive-bottom-up stance the whole area shares, and it is the reference
  EconAgent uses to position itself. (Docs-level.)

These classics are *rule-based*: behavior is hand-coded. Their strength is
transparency; their weakness, noted by their successors, is that the rules are
oversimplified and must be hand-calibrated.

### 3b. Learned economic policy: the AI Economist lineage

- **The AI Economist (Zheng et al. 2020/2022, arXiv 2004.13332; deep-read,
  `notes/by-paper/2004.13332-ai-economist.md`)**. What it introduced: a two-level
  deep-RL framework where economic agents AND a tax-setting "social planner"
  co-adapt, in a grid-world **Gather-and-Build game** (move, collect wood/stone,
  craft houses for coins, trade resources on an open market). It learns dynamic
  income-tax schedules that improve the equality-productivity trade-off by a
  reported 16% over the Saez optimal-tax baseline, and the policy transfers to MTurk
  human experiments. Why it matters: the first demonstration that RL can do economic
  mechanism design end-to-end, and its environment is the nearest precedent to a
  Minecraft material economy. It also models the quantities the repo cares about:
  isoelastic utility = value(money) - labor, Gini-based equality, total-wealth
  productivity, and **emergent specialization / division of labor** (low-skill
  agents become gatherer-sellers, high-skill become builders) which the authors use
  as a *validation check*.
- **AI Economist two-level deep RL (arXiv 2108.02755, 2021/2022 Science Advances)**:
  the extended journal treatment of the same idea (abstract-level here).
- **Stackelberg Mean Field Game / TaxAI lineage (Mi et al., arXiv 2403.12093)**:
  models the government-vs-households tax problem as a Stackelberg mean-field game
  with RL, pretrained on real data. Why it matters: it carries the planner-vs-
  population structure forward and is one of EconAgent's learning-based baselines
  (abstract-level).

### 3c. LLM-driven economic and market simulation

- **EconAgent (Li et al., ACL 2024, arXiv 2310.10436; deep-read,
  `notes/by-paper/2310.10436-econagent.md`)**. What it introduced: the first LLM-
  agent macroeconomic ABM, with per-agent perception (Census-calibrated persona),
  memory/reflection, and a work/consume action. Why it matters: it shows an LLM can
  replace hand-tuned behavioral rules and yield *more plausible* macro dynamics,
  uniquely recovering the Phillips Curve and Okun's Law with the correct sign where
  rule-based and RL baselines fail (the RL AI-Economist baseline gave a ~46%
  unemployment artifact). It is the cleanest case of "LLM proposes decisions,
  environment owns dynamics" in this area.
- **LLM Economist (Karten et al., Princeton 2025, arXiv 2507.15815; deep-read,
  `notes/by-paper/2507.15815-llm-economist.md`)**. What it introduced: the LLM-
  native successor to the AI Economist: a two-level Stackelberg game solved by
  in-context RL, with Census-sampled worker personas, a natural-language tax
  planner, and democratic leader turnover. Why it matters: it is the most current
  evidence that an LLM can both populate a heterogeneous economy and express
  mechanism design in language, while also being a cautionary tale on overclaim (its
  abstract reaches for "better civilizations"; its evidence is 100 agents, one 8B
  model, static skills, **no trade**, US tax brackets only).
- **Market simulators**: ASFM (arXiv 2406.19966) gives LLM traders a real order-
  matching system and checks consistency with the real stock market; TwinMarket
  (arXiv 2502.01506) shows individual LLM behaviors aggregating into bubbles and
  recessions; MarS (arXiv 2409.07486) is an order-level generative foundation model
  for market simulation. Why they matter: they push LLM economic agents toward
  *verifiable market microstructure* (orders match or they do not), the same
  verifiability instinct the repo wants, but in finance rather than embodied goods.
  (All abstract-level.)
- **Large-scale generative society at economic scale**: AgentSociety (arXiv
  2502.08691) runs 10k+ agents and 5M interactions and tests a universal-basic-
  income policy; Large Population Models / AgentTorch (arXiv 2507.09901) and
  AgentScope (arXiv 2407.17789) provide million-agent infrastructure; SocioVerse
  (arXiv 2504.10157) aligns agents to a 10M-real-user pool and runs an economics
  domain. Why they matter: they show the scaling frontier of generative economic
  ABM (abstract-level; AgentSociety as a *social* sim is covered in
  `llm-social-simulation.md`, so here only its economic/UBI aspect is logged).
- **Agentic markets and economic alignment (recent)**: Virtual Agent Economies
  (DeepMind, arXiv 2509.10147) frames the coming "sandbox economy" of transacting AI
  agents along emergent-vs-intentional and permeable-vs-impermeable axes and
  proposes auction-based fair allocation; Agent Bazaar (arXiv 2605.17698) finds LLM
  marketplaces fail to self-regulate (price-crash and Sybil/"lemon-market"
  deception) and proposes an Economic Alignment Score; EnterpriseArena (arXiv
  2603.23638) shows only ~16% of LLM agents survive a 132-month resource-allocation
  horizon; AgenticPay (arXiv 2602.06008) benchmarks buyer-seller negotiation;
  Economy of Minds (arXiv 2606.02859) uses a Hayekian internal agent-economy for
  credit assignment; Emergent Social Intelligence Risks (arXiv 2603.27771) finds
  collusion and conformity arising under shared-resource competition. Why they
  matter: they are the live edge where "agents that possess and exchange" meets
  "what goes wrong at scale" (relevant to the repo's *costs imposed on others* and
  weak-commons concerns). (All abstract-level.)

### 3d. The validity / calibration discipline (the perennial hard problem)

- **Windrum, Fagiolo, Moneta (2007), JASSS 10(2)8 and Computational Economics
  30(3)**. What it introduced: the canonical critical guide to *empirical validation
  of ABMs in economics*, with a taxonomy of validation approaches and a frank list
  of open problems (which data to match, identification, calibration vs validation,
  the many-models-fit-the-same-data problem). Why it matters: it is the field's own
  statement that ABM is decades-mature in *building* models but chronically hard to
  *validate*. Every economic-sim claim should be read against it. (Docs-level.)
- **Calibration-aware LLM ABM (recent)**: PhysicsAgentABM (arXiv 2602.06030) argues
  LLM-based ABMs are "poorly calibrated for timestep-aligned state-transition
  simulation" and proposes neuro-symbolic, uncertainty-aware cluster-level transition
  distributions to fix it. Why it matters: it is a direct, recent admission inside
  the LLM-ABM community that calibrated state transition (exactly the WAM's job:
  predict o' well) is unsolved, and that mechanistic/symbolic priors plus
  uncertainty are part of the answer (abstract-level).

## 4. Maturity and open problems

- Mature: the *constructive method* (build agents, run forward, observe emergence)
  and the *quantities* (Gini, productivity, utility, prices, specialization) are
  decades-settled. Sugarscape, ACE, and the AI Economist are reproducible-in-
  principle (the AI Economist and EconAgent release code).
- Unsolved (the honest part):
  - **Validation/calibration** is the perennial problem (Windrum-Fagiolo-Moneta).
    "It runs and looks plausible" is not validity; recovering a known regularity
    (EconAgent's Phillips/Okun) is a *lower* rung than matching held-out human data
    (see Concordia's hierarchy in `2312.03664-concordia.md`).
  - **Calibrated state transition for LLM agents** is explicitly unsolved
    (PhysicsAgentABM 2602.06030): LLM ABMs are expensive and poorly aligned to
    timestep transitions.
  - **"Emergent economy" overclaim**: reproducing specialization or an inequality
    curve is often a *validation check*, not a discovery. The LLM Economist's
    "better civilizations" framing vs its 100-agent / no-trade evidence is the
    cautionary example. (See the caveat in section 6 and
    `project-sid-critical-review.md`.)
  - **Embodiment gap**: across the entire area the "good" being possessed and
    exchanged is a scalar (coins, labor, money, an abstract sugar count, an order).
    None of it is a physical item with location, access, and durability in a world
    where a non-generative engine owns the truth. The LLM Economist names this: it
    lists "richer actions, such as trade" as future work.

## 5. Mapping to the 4 WAM layers

| Layer | What this area contributes | Source examples |
|---|---|---|
| Physical | Weak/indirect. Sugarscape and Gather-and-Build have spatial movement, harvest, and a craft recipe, but the "physics" is abstract grid tiles, not a verified embodied engine. Physical truth is the repo's runtime, not this area. | Sugarscape (1996), AI Economist 2004.13332 |
| Material / economic (primary) | The core. Possession, scarcity, production, exchange, wealth distribution, and the quantities to score them: Gini-equality, total-wealth productivity, isoelastic utility = value - effort, market prices, efficiency/fairness. The vocabulary and metrics for "who has what, who got better off, at what cost." | Sugarscape, ACE (Tesfatsion 2002), AI Economist 2004.13332, EconAgent 2310.10436, LLM Economist 2507.15815, ASFM/TwinMarket/MarS |
| Social | Weak. Trade is a two-party interaction and bargaining/negotiation appears (AgenticPay, GLEE elsewhere), but relationships, promises, reputation, and obligation are mostly absent or only emergent. The social layer is better served by `llm-social-simulation.md` and `sociology-grounding-for-social-wam.md`. | AgenticPay 2602.06008, Agent Bazaar 2605.17698 (deception/trust) |
| Institutional / settlement (secondary) | Mechanism design, taxation/redistribution, voting, market governance, and emergent division of labor are exactly institutional patterns over a material economy. The planner-and-population structure is the precedent for "how do rules reshape material outcomes." | AI Economist 2004.13332, LLM Economist 2507.15815, Stackelberg MFG 2403.12093, Virtual Agent Economies 2509.10147, AgentSociety UBI 2502.08691 |

Layer dependency (kept visible per the contract): every economic quantity here
presupposes a reliable physical/possession fact. "Agent i traded wood to agent j"
is only meaningful if i actually had the wood and j actually received it. In this
area that fact is computed by an abstract simulator; in the repo it must be computed
by Mineflayer + verifiers before any economic or institutional prediction is made.

## 6. Relevance to the original query

The original query asks whether a hierarchical action-conditioned world model can
predict and evaluate how Minecraft actions transform, among other things, the
**material economy**. Agent-based computational economics is the precedent for
exactly that: it is the field that has spent decades predicting and evaluating the
material-economy consequences of agent actions (who ends up with what, how unequal,
how productive, under which rules).

- Mechanically useful (engineering the repo can borrow):
  - The **possession / scarcity / exchange / commons modeling vocabulary** and the
    **scoring quantities**: Gini-equality, total-wealth productivity, isoelastic
    utility = value - effort, efficiency/fairness of an exchange, emergent
    specialization as a sanity check. These map onto a Minecraft `material claim` /
    possession ledger and a per-actor cost-of-effort accounting, and onto the repo's
    weak-commons and "costs imposed on others" notions.
  - The **constructive-and-validate discipline**: seed heterogeneous actors, run
    forward, and *first recover a known material regularity* (scarcity raises the
    effort/price of a contested resource; tool endowment drives role specialization)
    before claiming any social or institutional structure. EconAgent's Phillips/Okun
    recovery is the template; Windrum-Fagiolo-Moneta is the discipline.
  - The **LLM-proposes / environment-owns-dynamics split** (EconAgent, LLM
    Economist) confirms the repo's architecture is the right shape, with the repo's
    advantage being that its environment is a verified embodied runtime.
  - The **calibration-aware-transition** lesson (PhysicsAgentABM): a good WAM needs
    calibrated, uncertainty-aware predictions of next-state deltas, and mechanistic/
    symbolic priors help.

- Research contribution (what none of this area provides, so the repo could add):
  - **None of these works grounds the economy in a verified embodied runtime.** The
    "good" is always a scalar (coin, labor, money, abstract sugar, an order book),
    never a physical Minecraft item with location, access, durability, and a
    non-generative engine deciding whether the transfer actually happened. The
    repo's distinctive claim would be an advisory WAM that predicts material-economy
    deltas (possession changes, claims, borrow/lend/return, weak-commons depletion,
    costs to others) and is *scored against verifier evidence* of what physically
    occurred. That grounding, not the economic quantities themselves, is the novel
    part.
  - The advisory stance is also distinctive: this area's planners *act* (set taxes,
    optimize welfare). The repo's WAM must *predict and evaluate*, never act, fill
    args, mark progress, or override the verifier. Borrow the metrics, not the
    planner-as-controller.

### Overclaim caveat (explicit)

Be cautious with "emergent economy" language. Reproducing an inequality curve,
specialization, or a macro regularity is, in this literature, typically a
*validation check that the simulation behaves*, not evidence of a real economy.
The strongest cautionary case is the LLM Economist: its abstract reaches for
"policy evaluation at the societal scale to help build better civilizations" while
its actual evidence is 100 agents, a single 8B model, static skills, no trade, and
US brackets only, with a self-evaluation-bias caveat. The AI Economist similarly
lists a 4-agent economy and no other-regarding utilities as limitations. The honest
framing for the repo: claim that the runtime can *measure and predict* specific
material-economy deltas (a tool changed hands, a shared store was depleted, a cost
was imposed) against verifier evidence, in a bounded world. Do not claim an emergent
economy, a civilization, or transfer to real human economies. Validity here is a
ladder (consistency-with-theory below model-comparison below human-generalization,
per `benchmark-validity-and-evaluation.md` and `2312.03664-concordia.md`), and this
project starts on the lower rungs.
