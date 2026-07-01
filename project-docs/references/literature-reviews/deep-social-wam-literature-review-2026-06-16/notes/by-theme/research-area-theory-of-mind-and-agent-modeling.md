# Research Area: Computational Theory of Mind, Agent/Opponent Modeling, and Emergent Norms

Owner: Lane 15 (G4). Date: 2026-06-16. Audience: external-team readers; jargon is
defined on first use. Punctuation is ASCII only.

## What this area is (one line)

This is the computational field of predicting OTHER agents: inferring their hidden
mental states (theory of mind), predicting their policy (agent/opponent modeling),
and explaining how shared behavior regularities arise without central design
(emergent norms/conventions).

It is distinct from two areas already covered in this review. The wave-1 sociology
theme (`sociology-grounding-for-social-wam.md`) covers human social THEORY (Goffman,
Ostrom, Bicchieri). The wave-1 social-simulation theme (`llm-social-simulation.md`)
covers generative-agent DIALOGUE. Neither surveys the technical field of *modeling
the other agent*, which is this lane. Where this area touches those files, this file
cites them and does not rewrite them.

A **World Action Model (WAM)** in this review means a model of the joint future state
and action, `p(o', a | o, l)` (arXiv 2605.12090): it forecasts the next state `o'`
and an action aligned to it. A **Social WAM** forecasts social-material deltas (trust,
obligation, claim, role) and the evidence that should exist if the transition
happened. The repo rule holds throughout: the LLM proposes, the runtime owns physical
truth, and a WAM stays advisory (it predicts and evaluates; it never fills args, marks
progress, or overrides the verifier).

## Why this area matters to the query (the GovSim anchor)

The Social layer requires predicting other agents: what they want, believe, and will
do, and how a social action changes the relationship. GovSim (`2404.16698-govsim.md`,
NeurIPS 2024) found that an agent's **ability to form beliefs about other agents
correlates 0.83 with community survival** in a shared-resource dilemma. That single
result reframes the Social WAM problem: the bottleneck for sustained cooperation is
not dialogue fluency but *modeling the other agent*. This lane is the field that
studies exactly that prediction.

## Glossary (defined once)

- **Theory of mind (ToM)**: representing another agent's hidden mental states
  (desires, beliefs, intentions) to predict or explain behavior (Premack and Woodruff
  1978; Rabinowitz et al. 1802.07740).
- **False belief**: another agent believing the world is one way when it is in fact
  another, because they lack perceptual access to a change. The "Sally-Anne" and
  "unexpected contents (Smarties)" tasks test this; it is the classic ToM probe.
- **Agent modeling / opponent modeling**: building a model that predicts another
  agent's actions, class, goals, or beliefs from observed interaction history
  (Albrecht and Stone 1709.08071). "Opponent modeling" is the older name from
  competitive games; the two terms are used interchangeably.
- **Belief modeling**: predicting another agent's belief state specifically (a subset
  of agent modeling), e.g. "Bob believes the iron is in the old chest."
- **Recursive reasoning**: nested beliefs, "I believe that you believe that I
  believe...", approximated to a fixed depth (I-POMDP lineage). Behavioral evidence:
  humans reason at depth ~1.5; benefits rarely extend past depth 2.
- **Emergent norm / convention**: a behavior regularity adopted by a group that
  arises from local interaction without a central designer (a shared greeting, a
  shared name, a tool-sharing custom). Studied via the **naming game**
  (Baronchelli et al. 2410.08948).
- **Critical mass / tipping point**: the fraction of a committed minority needed to
  overturn an established convention (models 10-40%; a controlled human experiment
  supports ~25%).

## Thread A: machine theory of mind, and ToM in LLMs (contested)

### A1. The foundational result: ToM is learnable from behavior

"Machine Theory of Mind" (Rabinowitz et al. 1802.07740, ICML 2018; deep-read,
`notes/by-paper/1802.07740-machine-theory-of-mind.md`) introduced the **ToMnet**, a
meta-learning network that learns to model other agents from their behavior alone. It
splits a *general* model (a prior over all agents) from an *agent-specific* model (a
posterior for the one agent observed this episode), and predicts that agent's next
action, what it will consume, and where it will go. Most importantly, trained only to
predict overt behavior, it learns that an agent whose preferred object moved *out of
its sight* will persist on a policy founded on a **false belief**, passing a gridworld
Sally-Anne test, and it can be trained to report the agent's belief state explicitly.
Why it matters: it is the proof that predicting another agent's behavior, and even
their false belief, is a *learnable prediction target*, not mysticism. That is exactly
the Social WAM target.

### A2. The contested claim: did ToM emerge in LLMs?

Kosinski (2302.02083, 2023) reported that GPT-3.5 passes classic false-belief
vignettes at a 9-year-old level and posed a dilemma: either the tests are valid and
LLMs have ToM, or the tests do not measure ToM. This is the strong "emerged" claim.

### A3. The rebuttal (why the treatment must be balanced)

Ullman (2302.08399, 2023; deep-read,
`notes/by-paper/2302.08399-ullman-trivial-alterations.md`) took Kosinski's exact
vignettes and applied *principle-preserving perturbations* that should not matter to
a real ToM reasoner, and the successes flipped. Making the bag **transparent** (so the
character can see inside) still made GPT-3.5 attribute the false belief; so did making
the character unable to read, or adding a trusted informant. Ullman's transferable
thesis: the null hypothesis for machine ToM should be **skeptical**; **outlying
failures on principled perturbations should outweigh average success rates** (a
calculator that fails 213*261 has not learned multiplication); and any published
ToM test-suite risks being **gamed** by ingestion into training data. He is explicit
that ToM can in principle be built in silicon, and recommends *integrating* structured
inverse-planning models with LLMs rather than expecting ToM to emerge from more text.

### A4. The benchmark landscape (abstract-level)

A cluster of benchmarks systematically finds that frontier LLMs lag humans and are
fragile: FANToM (2310.15421, EMNLP 2023, stress-tests ToM in information-asymmetric
conversation), ToMBench (2402.15052, ACL 2024, GPT-4 lags humans by >10 points across
31 abilities), and the situated-ToM landscape position paper (2310.19619, EMNLP 2023
Findings), which argues for evaluating ToM in agents *physically situated* in
environments rather than via passive narratives. A parallel thread tries to *fix*
LLM ToM by pairing it with explicit Bayesian inverse planning: MMToM-QA (2401.08743,
ACL 2024) and AutoToM (2502.15676, 2025) show that LLM-augmented Bayesian inverse
planning is more robust than prompting alone, echoing Ullman's "integrate, do not
expect emergence" recommendation.

Balanced verdict for this review: LLMs perform well on some ToM benchmarks and poorly
on principle-preserving perturbations of them. The defensible statement is "performs
well/poorly on benchmark X," never "has theory of mind." Any Social WAM claim in this
project must be phrased as bounded predictive accuracy under stated perturbations,
scored against verifier evidence.

## Thread B: opponent/agent modeling in multi-agent systems

### B1. The field map

"Autonomous Agents Modelling Other Agents: A Comprehensive Survey" (Albrecht and Stone
1709.08071, AIJ 2018; deep-read,
`notes/by-paper/1709.08071-agent-modeling-survey.md`) is the unified survey. It names
seven method families: policy reconstruction (model the other's action probabilities),
type-based reasoning (Bayesian belief over known "types"), classification (supervised
behavior-class prediction), plan recognition (infer goals/plans), recursive reasoning
(nested beliefs, the I-POMDP lineage), graphical models (explicit dependence structure),
and group modeling (predict a group jointly). It also fixes the assumption axes that
any such method must declare (is the other agent's behavior fixed or changing; can you
observe its actions directly; are goals common or conflicting). Why it matters: this is
the vocabulary for positioning every other source in this lane, and for naming what a
Social WAM is, a learned, advisory agent model, mostly in the "policy reconstruction +
type-based reasoning" families expressed in natural language.

Two of its open problems are unusually on-target. **Modeling in open multiagent
systems** (agents enter and leave at any time) is flagged as a hard open problem; that
is the project's open-world entrant / greedy-newcomer case (GovSim). And the survey
argues that strict model *correctness* is the wrong bar, that **task-adequacy** (does
the model help me act) is the right one, which is precisely the project's advisory,
verifier-scored stance.

### B2. Modeling done through a predictive model (the WAM bridge)

Model-Based Opponent Modeling (MBOM, 2108.01843, NeurIPS 2022; deep-read,
`notes/by-paper/2108.01843-model-based-opponent-modeling.md`) is the cleanest bridge
between opponent modeling and world models. It uses a learned **environment model** to
*imagine* the opponent's best responses, recursively generating opponent models at
increasing reasoning levels, then **Bayesian-mixes** them by similarity to the
opponent's real observed behavior rather than committing to one level. This is
recursive reasoning done through a predictive model (imagine-then-respond), which is
structurally the WAM idea (`p(o', a | o)`) applied to predicting another agent. Why it
matters: it is evidence that agent modeling can be done via a predictive model and
reconciled with evidence, instead of a hand-specified type space.

LOLA, "Learning with Opponent-Learning Awareness" (Foerster et al. 1709.04326, AAMAS
2018; abstract-level here, source fetched) is the adjacent classic: each agent accounts
for the *anticipated learning* of the other (it differentiates through the other's
learning step), and two LOLA agents reach cooperation in the iterated prisoner's
dilemma where naive learners do not. It matters as the canonical demonstration that
modeling how the other will *change* (not just their current policy) shifts outcomes
toward cooperation.

### B3. The LLM-native instantiation (closest to an advisory Social WAM)

Hypothetical Minds (Cross et al. 2407.07086, ICLR 2025; deep-read,
`notes/by-paper/2407.07086-hypothetical-minds.md`) is the single closest mechanical
analogue to the project's advisory Social WAM. Its Theory of Mind module: (1) generates
a natural-language hypothesis about another agent's latent strategy/goal; (2) makes a
*counterfactual prediction* of the other's next behavior and scores the hypothesis by
whether the prediction matched observed behavior (a self-supervised reward updated with
a Rescorla-Wagner rule, approximating Bayesian MAP inference); (3) refines hypotheses
by showing the top-scoring ones back to the LLM; (4) lets a validated hypothesis
*condition* the high-level plan, while a separate Subgoal module and a hardcoded Action
Planner own actual execution. It beats LLM and (billion-step-trained) MARL baselines on
most Melting Pot scenarios, and reward jumps only *after* a hypothesis is validated,
tying performance directly to correct agent modeling. Why it matters: the predict ->
score-against-evidence -> refine loop is exactly a forward-predictive, evidence-grounded
model of another agent that *advises but does not execute*, the project's own advisory
split in miniature. Its honest limitation (the LLM reasons about others well but has
weak low-level spatial control, so RL wins where dense control dominates) is itself an
argument FOR "LLM proposes, runtime owns physical truth."

### B4. The Minecraft-grounded instantiation

MindForge (Lica et al. 2411.12977, NeurIPS 2025; deep-read,
`notes/by-paper/2411.12977-mindforge.md`) is ToM on the project's own runtime
(MineDojo + Mineflayer, in-game chat). It extends Voyager with a structured ToM
representation (the BigToM causal template: context, desire, percept, belief, causal
event, action), splitting beliefs into perception-, task-, interaction-, and
**partner-related** kinds, and maintains a *partner-specific* belief graph per
collaborator. It reports 3x more tech-tree milestones and 2.3x more unique items than
Voyager in an instructive setting, and a Condorcet "many-minds" boost (62% to 79%
population success after seven dialogue turns) in a collaborative setting, explicitly
fixing Voyager's "false beliefs" and "code generation" failures via perspective-taking.
Why it matters: it shows a structured percept -> belief -> action model over Minecraft
state is buildable on the exact runtime the project uses. Caveat: its gains are
cooperative knowledge transfer and tech-tree progress, not the project's harder
social-material questions (possession, claims, weak commons, obligation).

## Thread C: emergent norms and conventions in multi-agent systems

### C1. Norms from sanction history (MARL)

The public-sanctions norm model (Vinitsky et al. 2106.09012, already covered,
`notes/by-paper/2106.09012-norms-from-public-sanctions.md`) shows beneficial norms can
*emerge* in decentralized MARL when the only public signal is sanctioning: each agent
learns a Classifier Norm Model predicting what the group would approve/disapprove,
trained on the public sanction stream. Cited here, not rewritten. It is the cleanest
formalization of "a norm is a remembered, history-grounded expectation of what the
group sanctions," and its dyadic sanction-event schema (offender, sanctioner, context,
valence) is directly loggable in Minecraft.

### C2. Conventions from local coordination (LLM populations)

"Emergent social conventions and collective bias in LLM populations" (Ashery, Aiello,
Baronchelli 2410.08948, Science Advances 2025; deep-read,
`notes/by-paper/2410.08948-emergent-conventions-llm.md`) is the cornerstone for
emergent conventions in LLM populations. Using the **naming game** (two random agents
each output a name; rewarded if they match; only local incentive, no global-consensus
incentive; memory of last H interactions), it shows (1) a universally adopted
convention emerges spontaneously by ~population round 15; (2) a **collective bias**
toward particular conventions emerges *even when individual agents are unbiased*, from
the interaction dynamics alone (microdynamics: ~99.4% win-stay, ~97.3% lose-shift); and
(3) a committed adversarial minority can flip an established convention once it reaches
a **critical mass** (~25% in controlled human experiments). Why it matters: this is the
Institutional-WAM phenomenon to predict, will a convention form, what will it be, how
robust is it to a newcomer, and it warns that a settlement-level convention cannot be
inferred by summing individual priors.

### C3. Social influence and cooperation (abstract-level)

"Social Influence as Intrinsic Motivation" (Jaques et al. 1810.08647, ICML 2019)
rewards agents for having *causal influence* over others' actions (measured by
counterfactual reasoning), yielding coordination, an intrinsic-motivation route to
social behavior. "Cultural Evolution of Cooperation among LLM Agents" (Vallinder and
Hughes 2412.10270, 2024) studies the iterated Donor Game across generations of LLM
agents and finds indirect reciprocity and costly punishment emerge differently across
base models, with sensitive dependence on random seeds, a caution that emergent
cooperation is model- and seed-dependent, not a stable property. "Theory of Mind for
Multi-Agent Collaboration via LLMs" (Li et al. 2310.10701, EMNLP 2023) finds explicit
belief-state representations improve both task performance and ToM-inference accuracy
in a cooperative text game, but also documents systematic LLM failures on long-horizon
state tracking, consistent with the balanced verdict in Thread A.

## Maturity and open problems

- **Mature**: the conceptual targets (predict another agent's action; predict their
  false belief; model their policy/type; observe conventions emerge) are
  well-established and demonstrated, mostly in gridworlds, matrix games, and Melting Pot.
- **Contested**: whether LLMs *have* ToM. The honest position is benchmark-bounded
  performance with documented fragility (Threads A2-A4).
- **Immature for this project**: ToM/agent-modeling tied to a *physical, material*
  substrate. MindForge is the only Minecraft-grounded ToM source, and its gains are
  cooperative task learning, not possession/claim/obligation prediction. Predicting
  social-material consequences (cost to others, trust shifts) from a ToM model in an
  embodied economy is essentially unstudied. This is where the project's contribution
  would lie, and where overclaim risk is highest.
- **Open problems carried from the field**: modeling in OPEN systems (newcomers
  arriving without norm history; Albrecht-Stone, GovSim); collective bias not reducible
  to individuals (Baronchelli); seed/model sensitivity of emergent cooperation
  (Vallinder and Hughes); benchmark-gaming of ToM tests (Ullman).

## Mapping to the 4 layers

| Source (id) | Physical | Material | Social | Institutional | Mechanically useful vs research contribution |
|---|---|---|---|---|---|
| Machine ToM, ToMnet (1802.07740) | dependency | - | predict other's action + false belief | population prior over agent types | mechanically useful: prediction-target schema + observability-grounded false-belief test |
| Agent-modeling survey (1709.08071) | - | - | the field of agent modeling | type/group modeling; open-systems problem | mechanically useful: taxonomy + assumptions checklist + task-adequacy rubric |
| Hypothetical Minds (2407.07086) | hardcoded action planner = physical layer | - | hypothesis-predict-score-refine on another agent | adapts to tit-for-tat, cooperation | mechanically useful: the advisory predict-then-score loop (closest analogue) |
| MindForge (2411.12977) | percepts from Minecraft API; Mineflayer | - | partner-belief model; perspective-taking | cultural transmission (proto-role) | mechanically useful: BigToM/BDI belief schema on the project's runtime |
| MBOM (2108.01843) | environment model = world-model substrate | - | predict other's policy via imagination | reasoning/adapting opponents | mechanically useful: imagine-candidate-models-then-mix-by-fit |
| LOLA (1709.04326) | - | - | account for other's anticipated learning | cooperation emergence (IPD) | research contribution: modeling the other's *change* shifts outcomes |
| Public sanctions (2106.09012) | - | sanction over resource use | dyadic approval/disapproval | norm emergence from sanction history | mechanically useful: SanctionEvent schema (cited, not rewritten) |
| Emergent conventions (2410.08948) | - | - | local win-stay/lose-shift coordination | convention emergence; collective bias; tipping point | mechanically useful: naming-game protocol + critical-mass robustness test |
| GovSim (2404.16698) | - | resource over-extraction | belief-about-others predicts survival (r=0.83) | commons governance; greedy newcomer | mechanically useful: metric decomposition + newcomer probe (cited, not rewritten) |

## Relevance to the original query

The original query asks whether a hierarchical action-conditioned WAM can predict and
evaluate how Minecraft actions transform, among other things, social relations and
future action opportunities. This area supplies the prediction the **Social WAM** needs.
Modeling other agents, what they want, believe, and will do, is the Social layer's core
forecasting target, and GovSim's r=0.83 belief-accuracy/survival correlation is direct
evidence that this prediction, not dialogue fluency, drives sustained cooperation. The
area also supplies the **Institutional layer** target: emergent norms and conventions
(naming-game emergence, collective bias, critical-mass robustness) are the
longer-horizon regularities a settlement WAM would predict.

Mechanically useful (engineering to borrow now):

- The advisory predict-then-score loop from Hypothetical Minds (2407.07086): for each
  other actor, generate a natural-language prediction of their next action, score it
  against the verifier-confirmed observed action, keep it only while it predicts well.
  This is an advisory Social WAM that never executes, exactly the repo's rule.
- The prediction-target schema from ToMnet (1802.07740): predict another actor's next
  action, which resources/affordances they will claim, and their belief-consistent
  behavior; plus an observability-grounded false-belief test ("Bob did not see the chest
  move, so he still believes the iron is in the old chest").
- The belief schema from MindForge (2411.12977) on the project's own Mineflayer runtime
  (perception/task/interaction/partner beliefs).
- The naming-game protocol and critical-mass robustness test from Baronchelli
  (2410.08948), and the SanctionEvent schema from the public-sanctions model
  (2106.09012), for observing and stress-testing emergent conventions.
- The agent-modeling taxonomy and "task-adequacy not correctness" rubric from
  Albrecht-Stone (1709.08071) for scoping and evaluating any such component.

Research contribution (what would be novel, and where the overclaim risk is):

- Tying agent modeling and ToM to a *physical, material* substrate, predicting
  social-material consequences (cost to others, trust shifts, claim disputes) from a
  forecast of another actor's behavior, verifier-scored, is essentially unstudied. That
  is the project's opportunity.
- The hard caveat, carried from Ullman (2302.08399): LLM theory of mind is contested and
  fragile under principle-preserving perturbations. The project must never claim its
  actors or its WAM "have theory of mind." The only defensible claim is bounded
  predictive accuracy of another actor's behavior under stated, perception-grounded
  perturbations, scored against verifier evidence, never an internal-mental-state claim,
  and never civilization-scale framing.
