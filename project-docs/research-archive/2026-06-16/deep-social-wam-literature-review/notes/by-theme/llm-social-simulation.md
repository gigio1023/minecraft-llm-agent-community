# LLM Social Simulation: How Social State Is Defined and Measured

Lane 3 theme file. Audience: external-team readers. Jargon is defined on first use.
This file surveys how the LLM-social-simulation literature *defines and measures*
social behavior, separating "measures plausible dialogue" from "measures a
verified world consequence." Companion files: `benchmark-validity-and-evaluation.md`
(the overclaim boundary), `project-sid-critical-review.md` (the civilization-claim
case), and `matrices/benchmark-metrics-matrix.md` (the per-benchmark table).

## 1. The one distinction that organizes everything

Two claims are routinely conflated in this literature:

- **Plausible dialogue**: a transcript that an LLM (or human) judge rates as
  natural, in-character, or goal-achieving. The judgment has no external referent
  that could refute it.
- **Verified world consequence**: a change in environment state (who holds an
  item, who can use a station, whether a promised transfer actually happened)
  that is computed/checked by the environment, independent of what anyone said.

Nearly all social benchmarks measure the first. The repo's whole point is the
second. Keeping these apart is the lens for every source below.

The repo's own vocabulary for "verified world consequence" is fixed and reused
here: `personal possession`, `material claim`, `public affordance`, `weak
commons`, `unclaimed world resource`, `obligation/credit`, plus `memory`,
`trust`, `relationship`, `refusal`, `repair`.

## 2. The foundational architecture: Generative Agents

Generative Agents (Park et al., UIST 2023, arXiv 2304.03442) is the root the
whole field builds on. Its contribution is an agent architecture over a
natural-language **memory stream** with three mechanisms (read in full from the
LaTeX):

- **Retrieval** scores each memory by recency (exponential decay, factor 0.995),
  importance (the LLM rates poignancy 1-10 at creation), and relevance (cosine
  similarity of embeddings to the current query); the top memories that fit the
  context window are injected.
- **Reflection**: periodically (when summed importance crosses a threshold of
  150), the agent generates higher-level insights and, critically, **cites the
  memory objects that served as evidence** (e.g. "Klaus is dedicated to research
  (because of 1,2,8,15)").
- **Planning**: top-down recursive day->hour->minute plans, stored as memories.

The dependent variable in its evaluation is **believability**, judged by humans,
with ablations showing each mechanism contributes. The emergent demo (a
Valentine's-party invitation spreading across the town) is reported as emergent
social behavior, judged for believability.

Why it matters for the repo: the memory/reflection/planning triad is exactly the
"memory continuity" the repo needs ("an earlier promise should affect a later
cycle"). The reflection-with-citation pattern is the single most transferable
idea, it is *evidence-linked memory*. But everything here is unconstrained
natural language, and "believability" is plausibility, not consequence. The repo
re-grounds this: every memory/relationship update must cite a concrete Mineflayer
artifact, and a remembered promise is checked against an inventory/container
delta, not rated for plausibility.

## 3. The canonical social-metric vocabulary: SOTOPIA family

SOTOPIA (Zhou et al., ICLR 2024, arXiv 2310.11667) is the most-reused social
*evaluation* framework. Agents role-play characters with hidden social goals and
interact in a dyadic, ≤20-turn episode. Actions are `speak`, non-verbal
communication, physical action, `none`, `leave`, all resolving to text, with no
physical world that validates them. Its **SOTOPIA-Eval** scores seven dimensions
per episode:

- Goal Completion [0-10], Believability [0-10], Knowledge [0-10],
  Secret [−10-0], Relationship [−5-5], Social Rules [−10-0],
  Financial and Material Benefits [−5-5].

This is a clean, ready checklist of *what social outcomes to name*. But six of
the seven are pure dialogue-judged plausibility, and even the seventh
(Financial/Material Benefits, the one nominally anchored to a verifiable fact) is
scored by a judge reading the transcript, not by a ledger the environment
enforces. The paper's own GPT-4-evaluator validity table shows the consequence:
the LLM judge correlates with humans on Goal Completion (r=0.71) and
Financial/Material (r=0.62) but weakly on the diffuse constructs (Secret 0.22,
Knowledge 0.33, Social Rules 0.33), and it tends to over-rate. Reading: the more
"social" and less material a construct is, the less reliably an LLM measures it.

Two extensions matter:

- **SOTOPIA-pi** (2403.08715) trains a 7B model toward GPT-4-level goal
  completion, and finds that LLM-based evaluators *overestimate* the abilities of
  models trained specifically for social interaction, an early reward-hacking /
  evaluator-validity warning.
- **Lifelong SOTOPIA** (2506.12666) chains ~40 episodes so context accumulates,
  to test multi-episode (lifelong) competence. Findings, central to the repo's
  memory-continuity metric: with naive full-history memory, both believability
  and goal completion **decline** over the chain (agents confuse their own
  identity/goals with the partner's or with past episodes); a summarization
  memory module fixes the decline on randomly-chained easy episodes, but on
  hand-crafted scenarios that **explicitly require recalling a past episode, all
  LLMs drop sharply while humans hold steady**. It also found the GPT-4 evaluator
  over-rates believability at long context, so it added an 8-item
  BelievabilityExtended failure checklist (sentence repetition, trait imitation,
  off-goal dialogue, not leaving after goal resolution, verbatim goal repetition,
  stalling, ignoring the partner, abrupt episode start) with a −5 penalty each.

AgentSense (Mou et al., NAACL 2025, arXiv 2410.19346) generalizes SOTOPIA along
axes the repo cares about: multi-party (>2 actors), multiple simultaneous goals,
and **private-information concealment/inference**. It sources 1,225 scenarios
*bottom-up* from scripts (grounded in Goffman's dramaturgical theory, ERG goal
taxonomy) instead of the narrow top-down "persuasion + collaboration" set. It
evaluates Goal Completion and Implicit Reasoning (deduce others' private info),
plus a profile-sensitivity metric (PSI). Findings: LLMs struggle with high-level
growth goals, and social performance depends on profiles, **interaction
partners**, and the goal-vs-privacy balance. Still dialogue/MCQ-graded.

## 4. The structured-state turn: Social World Models (the WAM bridge)

Social World Models / S3AP (Zhou et al., ICML 2026 preprint, arXiv 2509.00559)
is the most important source for the repo's "Social WAM" thesis. It formalizes a
**social world model** as a multi-agent partially-observable process where, for
the acting agent i, the model computes:

- `p(A_t^{-i} | S_t)`: predict the *other* agents' actions from social state, and
- `p(S_{t+1} | S_t, A_t^{-i}, a_t^i)`: predict the next social state given all
  agents' actions.

It splits each agent's observation into **external** (environment + others' acts)
and **introspective** (own beliefs, goals, values, emotions). Its **Foresee and
Act** algorithm samples a candidate action, simulates how social state would
evolve (how others interpret it, how the environment responds), and refines the
action before committing.

This is, structurally, the canonical World Action Model `p(o',a|o,l)` applied to
*social* state, and "Foresee and Act" is the Cascaded WAM (imagine-then-execute)
pattern. It proves the structured-state branch is real and beats free text: S3AP
improves social reasoning (+51% on a theory-of-mind task with o1) and lifts
SOTOPIA-hard goal completion, with larger gains in competitive settings.

Two caveats the repo must carry: (1) "**stronger social agent ≠ better social
world model**", GPT-4.1 beats Llama-4 Maverick as an agent (6.01 vs 4.52) but
their world-modeling scores are nearly identical (6.34 vs 6.36), and a good world
model paired with a weak agent can still lower performance; world-modeling and
acting are separable capabilities. (2) S3AP's "state" is still an LLM parse of a
free-form narrative, evaluated only on a dialogue goal-completion score, it
measures "does a structured social-state guess help win a dialogue," not "does a
predicted social-material delta match a verified world change." The repo's
contribution is to make the predicted next-state a *verified Minecraft+social
delta* and to score prediction accuracy separately from acting outcome.

The external/introspective split is a clean template: external observation can be
*verified* (Mineflayer world facts), while introspective state (beliefs,
obligations, trust) stays *advisory predicted* state, exactly the advisory-WAM
line the repo's SPEC draws.

## 5. The "world" with grounded variables: Concordia and population simulators

Concordia (DeepMind, arXiv 2312.03664) is the closest existing analog to the
repo's runtime, and instructively different. Its **Game Master (GM)** consumes
agents' natural-language intended actions and emits **event statements**
describing what actually happened; it maintains **grounded variables** (money,
possessions, votes, resource stock), and "whenever an agent tries to perform an
action that violates the grounding, it communicates that the action was invalid"
(e.g. preventing paying more money than you have). Agents are built from modular
**components** (identity, plan, hunger, possessions), and components can embed
classic code (a hunger component counts calories).

The grounded-variable pattern is the literature precedent for the repo's
possession/claim/obligation ledger and for schema/permission gates. But the
critical difference: Concordia's GM is *itself an LLM* that decides outcomes and
"checks" grounding through prose reasoning. The repo's equivalent GM is Mineflayer
+ schema validators + verifiers, *non-generative*. Physical truth is computed,
not narrated. (The repo's research frame states this exactly: "the local
equivalent of a 'game master' is not an LLM narrator. It is the runtime plus
Mineflayer plus validators plus artifact ledger.") Adopting an LLM GM would
reintroduce the provider-authority failure the SPEC forbids.

Population-scale simulators push to scale rather than grounding. AgentSociety
(2502.08691, 10k+ agents) studies macro phenomena (polarization, message spread,
universal-basic-income, external shocks) and validates by aligning macro patterns
with real-world experimental results; SocioVerse (2504.10157) aligns to a pool of
10M real users; SALM (2505.09081) simulates social networks. Their grounding is
language/social/digital, not embodied; their validity is correlational
(macro-pattern alignment) and out of the repo's small-scale scope. The useful
import is *intervention logic*: same seed, same actors, change one social-pressure
variable, observe the effect, applied to two or three actors with verified
material state.

## 6. Mixed-motive and economic games: where outcomes start to be verifiable

Economic games give the field its most *outcome-anchored* metrics, because a deal
has a terminal state.

- **GLEE** (Shapira et al., ICLR 2025, arXiv 2410.05254): two-player
  bargaining/negotiation/persuasion with formal metrics (efficiency = normalized
  sum of discounted payoffs at agreement, fairness = 1 − 4(p − ½)², and
  self-gain), parameterized by horizon, information structure, and communication
  form (free language vs structured). Key findings: outcomes are shaped by market parameters;
  **there is no absolute best model, one LLM's performance depends on its
  competitor's model**; humans are more extreme than LLMs (either best or worst by
  role). These formulas translate cleanly to a Minecraft material-claim ledger
  (efficiency/fairness/self-gain of a *verified* tool or food exchange), but
  GLEE's "good" is an abstract number, not a physical item with location and
  durability.
- **MAgIC** (2311.08562): cognition/adaptability/rationality/collaboration/
  deception in social-deduction games; in-game text outcomes.
- **MultiAgentBench / MARBLE** (2503.01935): milestone KPIs, role assignment,
  coordination and communication scores across cooperative and competitive
  settings; some milestones are objective, many are judged.
- **Concordia Contest** (2512.03318, the NeurIPS 2024 contest writeup): measures
  zero-shot cooperative intelligence (identify and exploit mutual gain across
  diverse partners), and finds significant gaps in robust generalization,
  especially for persuasion and norm enforcement, but outcomes are decided by the
  generative GM.
- **Melting Pot** (DeepMind; used via Hypothetical Minds, 2407.07086): a 2D MARL
  gridworld whose returns are *environment-computed* (genuinely **G**), emphasizing
  generalization to novel social situations and partners. The repo uses it as a
  *methodology* reference for partner/seed generalization design, not as a
  substrate (it is not physical Minecraft).

The economic-games cluster is where the field is closest to the repo's stance,
because a settled deal is a verifiable terminal fact. The repo's move is to make
that terminal fact a *physical material transition* (an item actually moved, a
station was actually shared) rather than an agreed number.

## 7. The recurring cross-cutting finding: partner-dependence

Independently, SOTOPIA (partner policy shapes optimal behavior), AgentSense (PSI:
performance depends on the interaction partner), GLEE ("no absolute best model;
depends on the competitor"), and S3AP (a good world model + weak agent can lower
performance) all report the same thing: **a social score is meaningless without
specifying the counterpart.** This strongly motivates the repo's partner/seed
generalization matrix (same actor-soul + different partner model; same seed +
different partner) as a first-class scoring axis, not an afterthought.

## 8. What the repo adapts vs what it must not

Mechanically useful to borrow:

- Generative Agents: retrieval scoring (recency × importance × relevance) and
  reflection-with-citations -> evidence-linked actor memory / PlanBead surfacing.
- SOTOPIA-Eval's 7 dimension labels -> the *names* of social outcomes to verify.
- Lifelong SOTOPIA: episode chaining + recall-forcing scenarios -> the
  memory-continuity benchmark design; its 8-item failure checklist -> cheap
  rule-checkable transcript signals.
- AgentSense: bottom-up scenario sourcing, ERG goal difficulty, private-info
  concealment/inference -> asymmetric-knowledge Minecraft scenarios.
- S3AP: the social-world-model formulation and Foresee-and-Act -> the shape of an
  *advisory* delta predictor (must never become authority).
- Concordia: grounded variables + component architecture + the validation
  hierarchy (see the validity theme file).
- GLEE: efficiency/fairness/self-gain formulas over *verified* exchanges.

Must not adopt (overclaim risks):

- "Believability"/PersonaScore/role-play fidelity as a social-*consequence*
  metric. These are plausibility; the SPEC subordinates persona text to verified
  transitions.
- An LLM Game Master that decides physical outcomes (Concordia-style), that is
  provider authority the runtime forbids.
- Unconstrained natural-language memory as executable authority.
- A single per-model social score without specifying the partner/seed.
- Population-scale human-fidelity claims from a handful of Minecraft actors.

## 9. One-paragraph takeaway

The LLM-social-simulation field has built a rich vocabulary (SOTOPIA's seven
dimensions, GLEE's efficiency/fairness, S3AP's belief/intention prediction) and a
strong architectural base (Generative Agents' memory/reflection, Concordia's
grounded variables and Game Master loop). But with narrow exceptions in the
economic-games and MARL-gridworld clusters, the field measures *plausible
dialogue judged by an LLM or human*, not *a verified world consequence*. The repo
inherits the constructs and mechanisms from this literature and re-grounds the
measurement: every social score is backed by a Mineflayer-verified material,
claim, obligation, or memory delta; a predicted social delta (an advisory social
WAM) is scored separately from the acting outcome; and the partner/seed the score
is conditioned on is always named.
